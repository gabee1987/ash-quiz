import { gameSettingsSchema, type GameSettings } from '@ash-quiz/shared'
import { EngineError, createGame, endQuestion, type GameQuiz, type GameState } from '../game/index.js'
import { generatePin } from './pin.js'

export interface ManagedGame {
  state: GameState
  hostId: string
  quizId: string | null
}

export interface GameStore {
  save(game: ManagedGame): Promise<void>
  loadActive(now: number): Promise<ManagedGame[]>
}

interface Logger {
  error(obj: unknown, msg?: string): void
}

type Listener = (game: ManagedGame) => void

interface Entry {
  game: ManagedGame
  timer: ReturnType<typeof setTimeout> | null
  saving: Promise<void>
}

/** A finished game stays in memory this long so late reconnects still see the podium. */
export const FINISHED_TTL_MS = 60 * 60 * 1000

/**
 * Registry of running games. Wraps engine commands with timers, snapshot
 * broadcasting (via subscribers) and persistence. Every transition is saved.
 */
export class GameManager {
  private readonly games = new Map<string, Entry>()
  private readonly listeners = new Set<Listener>()

  constructor(
    private readonly store: GameStore,
    private readonly log: Logger,
    private readonly now: () => number = Date.now,
  ) {}

  get(pin: string): ManagedGame | undefined {
    return this.games.get(pin)?.game
  }

  /** Called after every transition, before persistence. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async create(input: { id: string; quiz: GameQuiz; settings: GameSettings; hostId: string; quizId: string | null }) {
    const pin = generatePin((candidate) => this.games.has(candidate))
    const state = createGame(input.quiz, input.settings, pin, input.id, this.now())
    const entry: Entry = { game: { state, hostId: input.hostId, quizId: input.quizId }, timer: null, saving: Promise.resolve() }
    // Persist before handing out the PIN so the lobby survives a restart.
    await this.store.save(entry.game)
    this.games.set(pin, entry)
    return entry.game
  }

  /**
   * Runs an engine command. Order: command (may throw EngineError), replace,
   * re-arm timer, broadcast, persist in the background (ordered per game).
   */
  apply(pin: string, command: (state: GameState, now: number) => GameState): GameState {
    const entry = this.games.get(pin)
    if (!entry) throw new EngineError('errors.gameNotFound')
    const next = command(entry.game.state, this.now())
    if (next === entry.game.state) return next

    entry.game = { ...entry.game, state: next }
    this.schedule(pin, entry)
    for (const listener of this.listeners) {
      try {
        listener(entry.game)
      } catch (error) {
        this.log.error(error, 'game listener failed')
      }
    }
    entry.saving = entry.saving.then(() => this.save(entry))
    return next
  }

  /** Loads unfinished games after a restart; everyone starts disconnected and timers are re-armed. */
  async restore(): Promise<number> {
    const loaded = await this.store.loadActive(this.now())
    for (const game of loaded) {
      const players = Object.fromEntries(
        Object.entries(game.state.players).map(([id, player]) => [id, { ...player, connected: false }]),
      )
      // Games saved before a settings field existed get its default.
      const settings = gameSettingsSchema.parse(game.state.settings)
      const entry: Entry = {
        game: { ...game, state: { ...game.state, settings, players } },
        timer: null,
        saving: Promise.resolve(),
      }
      this.games.set(game.state.pin, entry)
      this.schedule(game.state.pin, entry)
    }
    return loaded.length
  }

  /** Resolves when every queued save has finished (tests, shutdown). */
  async flush(): Promise<void> {
    await Promise.all([...this.games.values()].map((entry) => entry.saving))
  }

  close() {
    for (const entry of this.games.values()) if (entry.timer) clearTimeout(entry.timer)
    this.games.clear()
  }

  private schedule(pin: string, entry: Entry) {
    if (entry.timer) clearTimeout(entry.timer)
    entry.timer = null
    const { state } = entry.game
    if (state.phase === 'question' && state.questionEndsAt !== null) {
      entry.timer = setTimeout(() => this.onDeadline(pin), Math.max(0, state.questionEndsAt - this.now()))
    } else if (state.phase === 'finished' && state.finishedAt !== null) {
      entry.timer = setTimeout(() => {
        if (this.games.get(pin) === entry) this.games.delete(pin)
      }, Math.max(0, state.finishedAt + FINISHED_TTL_MS - this.now()))
    }
  }

  private onDeadline(pin: string) {
    const entry = this.games.get(pin)
    if (!entry) return
    const { state } = entry.game
    if (state.phase !== 'question' || state.questionEndsAt === null) return
    // Timers can fire a millisecond early; the deadline is what counts.
    if (this.now() < state.questionEndsAt) return this.schedule(pin, entry)
    try {
      this.apply(pin, endQuestion)
    } catch (error) {
      this.log.error(error, 'ending question on timer failed')
    }
  }

  private async save(entry: Entry) {
    try {
      await this.store.save(entry.game)
    } catch (first) {
      this.log.error(first, 'saving game failed, retrying once')
      try {
        await this.store.save(entry.game)
      } catch (second) {
        this.log.error(second, 'saving game failed')
      }
    }
  }
}
