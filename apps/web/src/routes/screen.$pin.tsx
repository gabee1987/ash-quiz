import type { GamePublicInfo, HostSnapshot } from '@ash-quiz/shared'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionBar } from '../components/connection-bar'
import { Spinner } from '../components/spinner'
import { primaryAction } from '../features/host/primary-action'
import { ScreenLobby } from '../features/screen/lobby'
import { ScreenPodium } from '../features/screen/podium'
import { ScreenQuestion } from '../features/screen/question'
import { ScreenReveal } from '../features/screen/reveal'
import { ScreenScoreboard } from '../features/screen/scoreboard'
import { apiFetch } from '../lib/api'
import { meQueryOptions } from '../lib/auth'
import { closeSession, emitAck, startSession, useGameStore } from '../lib/socket'

export const Route = createFileRoute('/screen/$pin')({
  component: ScreenPage,
})

/**
 * Projector view. Public and read-only by PIN; if this browser is also logged in as
 * the game's host it attaches as host, and Space / Right arrow trigger the next step.
 */
function ScreenPage() {
  const { t } = useTranslation()
  const { pin } = Route.useParams()
  const { status, host, clockOffset, closed } = useGameStore()
  const me = useQuery({ ...meQueryOptions, throwOnError: false })
  const info = useQuery({
    queryKey: ['gamePublic', pin],
    queryFn: () => apiFetch<GamePublicInfo>(`/api/games/${pin}/public`),
    retry: false,
  })
  const [isHost, setIsHost] = useState(false)
  const loggedIn = me.isSuccess

  useEffect(() => {
    if (me.isPending) return
    return startSession(async () => {
      if (loggedIn) {
        const res = await emitAck('host:attach', { pin })
        if (!('error' in res)) return setIsHost(true)
      }
      setIsHost(false)
      const res = await emitAck('screen:attach', { pin })
      if ('error' in res && res.error !== 'errors.connectionLost') closeSession(res.error)
    })
  }, [pin, me.isPending, loggedIn])

  useEffect(() => {
    if (!isHost || !host) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'ArrowRight') return
      const action = primaryAction(host)
      if (!action) return
      e.preventDefault()
      void emitAck('host:command', action.command)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, host])

  if (closed) {
    return <p className="flex flex-1 items-center justify-center text-4xl">{t(closed)}</p>
  }
  if (!host) return <Spinner />

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col px-4 py-4 lg:px-12">
      <ConnectionBar status={status} />
      <ScreenPhase host={host} clockOffset={clockOffset} joinUrl={info.data?.joinUrl ?? null} />
    </div>
  )
}

function ScreenPhase({ host, clockOffset, joinUrl }: { host: HostSnapshot; clockOffset: number; joinUrl: string | null }) {
  switch (host.phase) {
    case 'lobby':
      return <ScreenLobby host={host} joinUrl={joinUrl} />
    case 'question':
      return <ScreenQuestion host={host} clockOffset={clockOffset} />
    case 'reveal':
      return <ScreenReveal host={host} />
    case 'scoreboard':
      return <ScreenScoreboard host={host} />
    case 'finished':
      return <ScreenPodium host={host} />
  }
}
