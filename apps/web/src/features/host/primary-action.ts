import type { HostCommand, HostSnapshot } from '@ash-quiz/shared'

export interface PrimaryAction {
  command: HostCommand
  /** i18n key of the button label. */
  label: string
}

/** Scoreboard after every question; otherwise only when the host asks for it (never while results wait for the end). */
const scoreboardAfterEachQuestion = (host: HostSnapshot) =>
  host.settings.scoreboard === 'afterQuestion' && host.settings.revealAnswers === 'afterQuestion'

const nextQuestion = (host: HostSnapshot): PrimaryAction =>
  host.questionIndex + 1 < host.questionCount
    ? { command: { type: 'next' }, label: 'host.game.nextQuestion' }
    : { command: { type: 'next' }, label: 'host.game.finish' }

const showScoreboard: PrimaryAction = { command: { type: 'scoreboard' }, label: 'host.game.showScoreboard' }

/** The one obvious next step for the host in each phase (button, and Space on the screen). */
export function primaryAction(host: HostSnapshot): PrimaryAction | null {
  switch (host.phase) {
    case 'lobby':
      return host.players.length > 0 ? { command: { type: 'start' }, label: 'host.game.start' } : null
    case 'question':
      return { command: { type: 'endQuestion' }, label: 'host.game.endQuestion' }
    case 'reveal':
      if (host.awaitingGrading) return null
      return scoreboardAfterEachQuestion(host) ? showScoreboard : nextQuestion(host)
    case 'scoreboard':
      return nextQuestion(host)
    case 'finished':
      // Held results: the podium on the projector first, then (or never) the phones.
      if (host.resultsPending) return showPodium
      return host.playersWaiting ? releaseToPlayers : null
  }
}

const showPodium: PrimaryAction = {
  command: { type: 'releaseResults', audience: 'screen' },
  label: 'host.game.showPodium',
}
const releaseToPlayers: PrimaryAction = {
  command: { type: 'releaseResults', audience: 'players' },
  label: 'host.game.releaseToPlayers',
}

/**
 * The other way on from the reveal: straight to the next question, or the scoreboard on demand.
 * After a game with held results: the phones' release while the podium is still held.
 */
export function alternativeAction(host: HostSnapshot): PrimaryAction | null {
  if (host.phase === 'finished') return host.resultsPending && host.playersWaiting ? releaseToPlayers : null
  if (host.phase !== 'reveal' || host.awaitingGrading) return null
  if (scoreboardAfterEachQuestion(host)) return nextQuestion(host)
  return host.settings.revealAnswers === 'afterQuestion' ? showScoreboard : null
}
