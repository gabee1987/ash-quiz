import type { HostCommand, HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { alternativeAction, primaryAction } from './primary-action'

/** Phase-aware primary button plus the secondary actions of the current phase. */
export function Controls({ host, onCommand }: { host: HostSnapshot; onCommand: (command: HostCommand) => void }) {
  const { t } = useTranslation()
  const primary = primaryAction(host)
  const alternative = alternativeAction(host)
  const endGame = () => {
    if (window.confirm(t('host.game.confirmEnd'))) onCommand({ type: 'end' })
  }
  return (
    <div className="flex flex-col gap-2">
      {primary && (
        <Button className="w-full text-xl" onClick={() => onCommand(primary.command)}>
          {t(primary.label)}
        </Button>
      )}
      {host.phase === 'lobby' && host.players.length === 0 && (
        <p className="text-center text-white/60">{t('host.game.waitingForPlayers')}</p>
      )}
      {host.phase === 'reveal' && host.awaitingGrading && (
        <p className="text-center text-yellow-300">{t('host.game.gradeFirst')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {alternative && (
          <Button variant="secondary" className="flex-1" onClick={() => onCommand(alternative.command)}>
            {t(alternative.label)}
          </Button>
        )}
        {host.phase === 'question' && (
          <>
            <Button variant="secondary" className="flex-1" onClick={() => onCommand({ type: 'extendTime', seconds: 30 })}>
              {t('host.game.extend')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => onCommand({ type: 'skip' })}>
              {t('host.game.skip')}
            </Button>
          </>
        )}
        {host.phase !== 'finished' && (
          <Button variant="secondary" className="flex-1" onClick={endGame}>
            {t('host.game.end')}
          </Button>
        )}
      </div>
    </div>
  )
}
