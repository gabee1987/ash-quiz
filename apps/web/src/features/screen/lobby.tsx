import type { HostSnapshot, PlayerPublic } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { QrCode } from '../../components/qr-code'

export function ScreenLobby({ host, joinUrl }: { host: HostSnapshot; joinUrl: string | null }) {
  const { t } = useTranslation()
  const teamMode = host.mode === 'team'
  return (
    <div className="grid flex-1 items-center gap-10 lg:grid-cols-[auto_1fr]">
      {joinUrl && <QrCode value={joinUrl} className="mx-auto w-[min(60vh,80vw)] animate-pop" />}
      <div className="flex flex-col gap-6">
        <p className="text-3xl font-semibold text-muted-foreground wrap-break-word">{host.quizTitle}</p>
        <div className="animate-fade-up">
          <p className="text-3xl">{t('screen.joinAt')}</p>
          <p className="text-4xl font-bold break-all">{joinUrl}</p>
        </div>
        <div className="glow-border flex w-fit animate-pop flex-col rounded-3xl bg-card px-8 py-4 shadow-soft">
          <p className="text-3xl">{t('screen.pin')}</p>
          <p className="text-8xl font-black tracking-widest tabular-nums">{host.pin}</p>
        </div>
        {/* Keyed by the count so the badge pops each time someone joins. */}
        <p key={host.players.length} className="w-fit animate-pop rounded-full bg-secondary px-5 py-1.5 text-3xl font-bold text-secondary-foreground">
          {t('play.playerCount', { count: host.players.length })}
        </p>
        {teamMode ? (
          <div className="grid gap-4 md:grid-cols-2">
            {host.teams.map((team) => (
              <div key={team.id} className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="mb-2 text-3xl font-bold">{team.name}</p>
                <Names players={host.players.filter((p) => p.teamId === team.id)} />
              </div>
            ))}
          </div>
        ) : (
          <Names players={host.players} />
        )}
      </div>
    </div>
  )
}

/** Each name pops in when its player joins; keys are player ids, so existing names stay put. */
function Names({ players }: { players: PlayerPublic[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {players.map((player) => (
        <li key={player.id} className="animate-pop rounded-full border bg-card px-4 py-1 text-2xl font-semibold shadow-soft">
          {player.name}
        </li>
      ))}
    </ul>
  )
}
