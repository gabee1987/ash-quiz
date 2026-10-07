import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { QrCode } from '../../components/qr-code'

export function ScreenLobby({ host, joinUrl }: { host: HostSnapshot; joinUrl: string | null }) {
  const { t } = useTranslation()
  const teamMode = host.mode === 'team'
  return (
    <div className="grid flex-1 items-center gap-10 lg:grid-cols-[auto_1fr]">
      {joinUrl && <QrCode value={joinUrl} className="mx-auto w-[min(60vh,80vw)]" />}
      <div className="flex flex-col gap-6">
        <p className="text-3xl text-white/70">{host.quizTitle}</p>
        <div>
          <p className="text-3xl">{t('screen.joinAt')}</p>
          <p className="text-4xl font-semibold break-all">{joinUrl}</p>
        </div>
        <div>
          <p className="text-3xl">{t('screen.pin')}</p>
          <p className="text-8xl font-bold tracking-widest tabular-nums">{host.pin}</p>
        </div>
        <p className="text-3xl">{t('play.playerCount', { count: host.players.length })}</p>
        {teamMode ? (
          <div className="grid gap-4 md:grid-cols-2">
            {host.teams.map((team) => (
              <div key={team.id} className="rounded-xl bg-white/10 p-4">
                <p className="mb-2 text-3xl font-bold">{team.name}</p>
                <Names names={host.players.filter((p) => p.teamId === team.id).map((p) => p.name)} />
              </div>
            ))}
          </div>
        ) : (
          <Names names={host.players.map((p) => p.name)} />
        )}
      </div>
    </div>
  )
}

function Names({ names }: { names: string[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {names.map((name) => (
        <li key={name} className="rounded-full bg-white/15 px-4 py-1 text-2xl">
          {name}
        </li>
      ))}
    </ul>
  )
}
