import type { HostSnapshot, PlayerPublic } from '@quizmoo/shared'
import { XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PlayerAvatar } from '@/components/player-avatar'
import { WaitingDots } from '@/components/waiting-dots'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { lobbyGroups } from './lobby-groups'

/** The players in the lobby as avatar tiles, grouped by team in team mode; a friendly wait while nobody is here. */
export function LobbyPlayers({
  host,
  clockOffset,
  onKick,
}: {
  host: HostSnapshot
  clockOffset: number
  onKick: (playerId: string) => void
}) {
  const { t } = useTranslation()
  const online = host.players.filter((p) => p.connected).length
  // Ticks only while someone is offline. Server time, so the host's clock does not matter.
  const now = useNow(online < host.players.length) + clockOffset

  return (
    <section className="flex flex-col gap-3" aria-labelledby="lobby-players">
      <h2 id="lobby-players" className="text-xl font-extrabold">
        {/* Keyed by the count so it pops each time someone joins. */}
        <span key={host.players.length} className="inline-block animate-pop">
          {t('play.playerCount', { count: host.players.length })}
        </span>
      </h2>
      {host.players.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center text-muted-foreground">
          <WaitingDots className="text-primary" />
          <p className="font-semibold">{t('host.game.waitingForPlayers')}</p>
        </div>
      ) : (
        lobbyGroups(host.players, host.teams, host.mode).map(({ team, players }) => (
          <div key={team?.id ?? 'all'} className="flex flex-col gap-2">
            {team && (
              <h3 className="flex items-baseline gap-2 font-bold">
                {team.name}
                <span className="text-sm font-semibold text-muted-foreground tabular-nums">{players.length}</span>
              </h3>
            )}
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('host.game.teamEmpty')}</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                {players.map((player) => (
                  <PlayerTile key={player.id} player={player} now={now} onKick={onKick} />
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </section>
  )
}

function PlayerTile({ player, now, onKick }: { player: PlayerPublic; now: number; onKick: (playerId: string) => void }) {
  const { t } = useTranslation()
  const offlineSeconds =
    player.connected || player.disconnectedAt === null ? null : Math.max(0, Math.floor((now - player.disconnectedAt) / 1000))
  return (
    <li
      className={cn(
        'relative flex animate-pop flex-col items-center gap-1.5 rounded-2xl border bg-card px-2 pt-3 pb-2 text-center shadow-soft',
        // Offline: dashed border and a faded avatar; the text keeps its full contrast.
        offlineSeconds !== null && 'border-2 border-dashed shadow-none',
      )}
    >
      <PlayerAvatar avatar={player.avatar} size="lg" className={cn(offlineSeconds !== null && 'opacity-40 grayscale')} />
      <span className="w-full truncate font-bold">{player.name}</span>
      {offlineSeconds !== null && (
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          {offlineSeconds < 60
            ? t('host.game.offlineForSeconds', { count: offlineSeconds })
            : t('host.game.offlineForMinutes', { count: Math.floor(offlineSeconds / 60) })}
        </span>
      )}
      <button
        type="button"
        aria-label={t('host.game.kickPlayer', { name: player.name })}
        className="absolute top-1 right-1 grid size-8 place-items-center rounded-full text-muted-foreground outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring"
        onClick={() => {
          if (window.confirm(t('host.game.confirmKick', { name: player.name }))) onKick(player.id)
        }}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}
