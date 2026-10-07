import type { GameHostInfo, HostCommand, HostSnapshot } from '@ash-quiz/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { ConnectionBar } from '../../components/connection-bar'
import { Spinner } from '../../components/spinner'
import { Timer } from '../../components/timer'
import { RankList } from '../../features/play/scoreboard'
import { apiFetch } from '../../lib/api'
import { closeSession, emitAck, startSession, useGameStore } from '../../lib/socket'

export const Route = createFileRoute('/host/games/$pin')({
  component: HostGamePage,
})

// Minimal host control: enough to run a game from a phone or laptop. Polish comes in phase 5.
function HostGamePage() {
  const { t } = useTranslation()
  const { pin } = Route.useParams()
  const { status, host, clockOffset, closed } = useGameStore()
  const [error, setError] = useState<string | null>(null)
  const info = useQuery({
    queryKey: ['game', pin],
    queryFn: () => apiFetch<GameHostInfo>(`/api/games/${pin}`),
    retry: false,
  })

  useEffect(
    () =>
      startSession(async () => {
        const res = await emitAck('host:attach', { pin })
        if ('error' in res && res.error !== 'errors.connectionLost') closeSession(res.error)
      }),
    [pin],
  )

  async function send(command: HostCommand) {
    setError(null)
    const res = await emitAck('host:command', command)
    if ('error' in res) setError(res.error)
  }

  if (closed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl">{t(closed)}</p>
        <Link to="/host" className="underline">
          {t('host.game.backToQuizzes')}
        </Link>
      </div>
    )
  }
  if (!host) return <Spinner />

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <ConnectionBar status={status} />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">{host.quizTitle}</p>
          <p className="text-4xl font-bold tracking-widest tabular-nums">{host.pin}</p>
          <p className="text-sm text-white/70">{t(`host.game.phase.${host.phase}`)}</p>
        </div>
      </header>

      {info.data && host.phase === 'lobby' && (
        // As large as the screen allows: phones scan it from across a room.
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[min(90vw,65vh)] rounded-2xl bg-white p-4">
            <QRCodeSVG value={info.data.joinUrl} size={512} marginSize={2} className="block h-auto w-full" />
          </div>
          <p className="text-center text-lg break-all">{info.data.joinUrl}</p>
        </div>
      )}

      {host.phase !== 'lobby' && host.phase !== 'finished' && (
        <p className="text-white/70">
          {t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}
          {' · '}
          {t('host.game.answered', { answered: host.answeredCount, count: host.players.length })}
        </p>
      )}
      {host.phase === 'question' && host.question && host.questionEndsAt !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold break-words">{host.question.text}</p>
          <Timer endsAt={host.questionEndsAt} totalMs={host.question.timeLimitSec * 1000} clockOffset={clockOffset} />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
          {t(error)}
        </p>
      )}
      <Controls host={host} onCommand={(c) => void send(c)} />

      {host.phase === 'finished' ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('play.podium')}</h2>
          <RankList players={host.players.filter((p) => p.rank <= 3)} limit={10} />
          <Link to="/host" className="underline">
            {t('host.game.backToQuizzes')}
          </Link>
        </section>
      ) : (
        <PlayerList host={host} onKick={(playerId) => void send({ type: 'kick', playerId })} />
      )}
    </div>
  )
}

function Controls({ host, onCommand }: { host: HostSnapshot; onCommand: (command: HostCommand) => void }) {
  const { t } = useTranslation()
  const endGame = () => {
    if (window.confirm(t('host.game.confirmEnd'))) onCommand({ type: 'end' })
  }
  return (
    <div className="flex flex-wrap gap-2">
      {host.phase === 'lobby' && (
        <Button disabled={host.players.length === 0} onClick={() => onCommand({ type: 'start' })}>
          {t('host.game.start')}
        </Button>
      )}
      {host.phase === 'question' && (
        <>
          <Button onClick={() => onCommand({ type: 'endQuestion' })}>{t('host.game.endQuestion')}</Button>
          <Button variant="secondary" onClick={() => onCommand({ type: 'extendTime', seconds: 30 })}>
            {t('host.game.extend')}
          </Button>
          <Button variant="secondary" onClick={() => onCommand({ type: 'skip' })}>
            {t('host.game.skip')}
          </Button>
        </>
      )}
      {(host.phase === 'reveal' || host.phase === 'scoreboard') && (
        <Button onClick={() => onCommand({ type: 'next' })}>{t('common.next')}</Button>
      )}
      {host.phase !== 'finished' && (
        <Button variant="secondary" onClick={endGame}>
          {t('host.game.end')}
        </Button>
      )}
    </div>
  )
}

function PlayerList({ host, onKick }: { host: HostSnapshot; onKick: (playerId: string) => void }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{t('play.playerCount', { count: host.players.length })}</h2>
      {host.players.length === 0 && <p className="text-white/60">{t('host.game.waitingForPlayers')}</p>}
      <ul className="flex flex-col gap-1">
        {host.players.map((player) => (
          <li key={player.id} className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
            <span
              className={`size-3 shrink-0 rounded-full ${player.connected ? 'bg-green-400' : 'bg-white/30'}`}
              aria-label={player.connected ? t('host.game.online') : t('host.game.offline')}
              role="img"
            />
            <span className="flex-1 truncate">{player.name}</span>
            <span className="tabular-nums">{player.score}</span>
            <button
              type="button"
              className="min-h-10 rounded px-3 text-sm text-red-300 underline"
              onClick={() => {
                if (window.confirm(t('host.game.confirmKick', { name: player.name }))) onKick(player.id)
              }}
            >
              {t('host.game.kick')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
