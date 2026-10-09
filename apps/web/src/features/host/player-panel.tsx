import type { HostSnapshot, PlayerPublic } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { PlayerAvatar } from '../../components/player-avatar'
import { useNow } from '../../lib/clock'

export function PlayerPanel({
  host,
  clockOffset,
  onKick,
}: {
  host: HostSnapshot
  clockOffset: number
  onKick: (playerId: string) => void
}) {
  const { t } = useTranslation()
  const teamName = (teamId: string | null) => host.teams.find((team) => team.id === teamId)?.name
  const online = host.players.filter((p) => p.connected).length
  // Ticks only while someone is offline. Server time, so the phone's clock does not matter.
  const now = useNow(online < host.players.length) + clockOffset
  const offlineFor = (player: PlayerPublic) => {
    if (player.connected || player.disconnectedAt === null) return null
    const seconds = Math.max(0, Math.floor((now - player.disconnectedAt) / 1000))
    return seconds < 60
      ? t('host.game.offlineForSeconds', { count: seconds })
      : t('host.game.offlineForMinutes', { count: Math.floor(seconds / 60) })
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-extrabold">
        {t('play.playerCount', { count: host.players.length })}
        {host.players.length > 0 && (
          <span className="ml-2 text-sm font-semibold text-muted-foreground">{t('host.game.onlineCount', { count: online })}</span>
        )}
      </h2>
      <ul className="flex flex-col gap-1">
        {host.players.map((player) => {
          const offline = offlineFor(player)
          return (
            <li key={player.id} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2">
              <span
                role="img"
                aria-label={player.connected ? t('host.game.online') : t('host.game.offline')}
                className={`size-3 shrink-0 rounded-full ${player.connected ? 'bg-success' : 'bg-muted-foreground/40'}`}
              />
              <PlayerAvatar avatar={player.avatar} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{player.name}</span>
                {player.teamId && <span className="block truncate text-xs text-muted-foreground">{teamName(player.teamId)}</span>}
                {offline && <span className="block truncate text-xs font-semibold text-muted-foreground tabular-nums">{offline}</span>}
              </span>
              <span className="font-bold tabular-nums">{player.score}</span>
              {host.phase !== 'finished' && (
                <button
                  type="button"
                  className="min-h-10 rounded-lg px-2 text-sm font-semibold text-destructive underline underline-offset-4 outline-none hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring"
                  onClick={() => {
                    if (window.confirm(t('host.game.confirmKick', { name: player.name }))) onKick(player.id)
                  }}
                >
                  {t('host.game.kick')}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
