import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

export function PlayerPanel({ host, onKick }: { host: HostSnapshot; onKick: (playerId: string) => void }) {
  const { t } = useTranslation()
  const teamName = (teamId: string | null) => host.teams.find((team) => team.id === teamId)?.name
  const online = host.players.filter((p) => p.connected).length
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">
        {t('play.playerCount', { count: host.players.length })}
        {host.players.length > 0 && (
          <span className="ml-2 text-sm font-normal text-white/60">{t('host.game.onlineCount', { count: online })}</span>
        )}
      </h2>
      <ul className="flex flex-col gap-1">
        {host.players.map((player) => (
          <li key={player.id} className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
            <span
              role="img"
              aria-label={player.connected ? t('host.game.online') : t('host.game.offline')}
              className={`size-3 shrink-0 rounded-full ${player.connected ? 'bg-green-400' : 'bg-white/30'}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{player.name}</span>
              {player.teamId && <span className="block truncate text-xs text-white/60">{teamName(player.teamId)}</span>}
            </span>
            <span className="tabular-nums">{player.score}</span>
            {host.phase !== 'finished' && (
              <button
                type="button"
                className="min-h-10 rounded px-2 text-sm text-red-300 underline"
                onClick={() => {
                  if (window.confirm(t('host.game.confirmKick', { name: player.name }))) onKick(player.id)
                }}
              >
                {t('host.game.kick')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
