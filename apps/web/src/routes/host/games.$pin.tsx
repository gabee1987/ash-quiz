import type { GameHostInfo, HostCommand, HostSnapshot } from '@ash-quiz/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionBar } from '../../components/connection-bar'
import { DistributionBars } from '../../components/distribution-bars'
import { QrCode } from '../../components/qr-code'
import { Spinner } from '../../components/spinner'
import { Timer } from '../../components/timer'
import { Controls } from '../../features/host/controls'
import { GradingPanel } from '../../features/host/grading-panel'
import { PlayerPanel } from '../../features/host/player-panel'
import { ReviewPanel } from '../../features/host/review-panel'
import { RankList } from '../../features/play/scoreboard'
import { apiFetch } from '../../lib/api'
import { closeSession, emitAck, startSession, useGameStore } from '../../lib/socket'

export const Route = createFileRoute('/host/games/$pin')({
  component: HostGamePage,
})

/** Host control: works on a phone (one column) and a laptop (two columns). */
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
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ConnectionBar status={status} />
      <div className="flex min-w-0 flex-col gap-5">
        <Header host={host} />
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(error)}
          </p>
        )}
        <Controls host={host} onCommand={(c) => void send(c)} />
        <PhaseDetail host={host} clockOffset={clockOffset} joinUrl={info.data?.joinUrl ?? null} />
        {host.phase === 'reveal' && host.awaitingGrading && (
          <GradingPanel host={host} onGrade={(ids) => void send({ type: 'gradeText', correctPlayerIds: ids })} />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <PlayerPanel host={host} onKick={(playerId) => void send({ type: 'kick', playerId })} />
        <ReviewPanel host={host} />
      </div>
    </div>
  )
}

function Header({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  const settings = [
    t(`host.create.modes.${host.settings.mode}`),
    host.settings.speedBonus ? t('host.create.speedBonus') : null,
    host.settings.shuffleOptions ? t('host.create.shuffle') : null,
  ].filter(Boolean)
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-white/60 wrap-break-word">{host.quizTitle}</p>
        <p className="text-4xl font-bold tracking-widest tabular-nums">{host.pin}</p>
        <p className="text-sm text-white/70">
          {t(`host.game.phase.${host.phase}`)}
          {host.phase !== 'lobby' &&
            host.phase !== 'finished' &&
            ` · ${t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}`}
        </p>
        <p className="text-xs text-white/50">{settings.join(' · ')}</p>
      </div>
      <a
        href={`/screen/${host.pin}`}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-12 items-center rounded-lg bg-white/10 px-4 font-semibold"
      >
        {t('host.game.openScreen')}
      </a>
    </header>
  )
}

function PhaseDetail({ host, clockOffset, joinUrl }: { host: HostSnapshot; clockOffset: number; joinUrl: string | null }) {
  const { t } = useTranslation()
  switch (host.phase) {
    case 'lobby':
      return joinUrl ? (
        <div className="flex flex-col items-center gap-3">
          <QrCode value={joinUrl} className="w-full max-w-[min(90vw,65vh)]" />
          <p className="text-center text-lg break-all">{joinUrl}</p>
        </div>
      ) : null
    case 'question':
      return host.question && host.questionEndsAt !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold wrap-break-word">{host.question.text}</p>
          <Timer endsAt={host.questionEndsAt} totalMs={host.question.timeLimitSec * 1000} clockOffset={clockOffset} />
          <p className="text-white/70">
            {t('host.game.answered', { answered: host.answeredCount, count: host.players.length })}
          </p>
        </div>
      ) : null
    case 'reveal':
    case 'scoreboard':
      return host.reveal ? (
        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold wrap-break-word">{host.reveal.question.text}</p>
          <DistributionBars reveal={host.reveal} />
        </div>
      ) : null
    case 'finished':
      return (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('play.podium')}</h2>
          {host.mode === 'team' ? (
            <ol className="flex flex-col gap-2">
              {host.teams
                .filter((team) => team.rank <= 3)
                .map((team) => (
                  <li key={team.id} className="flex gap-3 rounded-lg bg-white/10 px-4 py-2">
                    <span className="w-8 font-bold">{team.rank}.</span>
                    <span className="flex-1">{team.name}</span>
                    <span className="font-semibold tabular-nums">{team.score}</span>
                  </li>
                ))}
            </ol>
          ) : (
            <RankList players={host.players.filter((p) => p.rank <= 3)} limit={10} />
          )}
          <Link to="/host" className="underline">
            {t('host.game.backToQuizzes')}
          </Link>
        </section>
      )
  }
}
