import type { HostCommand, HostSnapshot } from '@quizmoo/shared'
import { WifiOffIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { alternativeAction, primaryAction, reconnectingCount } from './primary-action'

/** Phase-aware primary button plus the secondary actions of the current phase. */
export function Controls({ host, onCommand }: { host: HostSnapshot; onCommand: (command: HostCommand) => void }) {
  const { t } = useTranslation()
  const primary = primaryAction(host)
  const alternative = alternativeAction(host)
  const reconnecting = reconnectingCount(host)
  const endGame = () => {
    if (window.confirm(t('host.game.confirmEnd'))) onCommand({ type: 'end' })
  }
  return (
    <div className="flex flex-col gap-2">
      {primary && (
        <Button size="xl" className="w-full" onClick={() => onCommand(primary.command)}>
          {t(primary.label)}
        </Button>
      )}
      {reconnecting !== null && (
        <p role="status" className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-muted-foreground">
          <WifiOffIcon className="size-4" aria-hidden="true" />
          {t('host.game.reconnectingHint', { count: reconnecting })}
        </p>
      )}
      {host.phase === 'lobby' && host.players.length === 0 && (
        <p className="text-center text-muted-foreground">{t('host.game.waitingForPlayers')}</p>
      )}
      {(host.resultsPending || host.playersWaiting) && (
        <p className="rounded-xl bg-warning px-4 py-2 text-center font-semibold text-warning-foreground">
          {t(
            host.resultsPending && host.playersWaiting
              ? 'host.game.resultsPendingHint'
              : host.playersWaiting
                ? 'host.game.playersWaitingHint'
                : 'host.game.podiumPendingHint',
          )}
        </p>
      )}
      {host.phase === 'reveal' && host.awaitingGrading && (
        <p className="rounded-xl bg-warning px-4 py-2 text-center font-semibold text-warning-foreground">
          {t('host.game.gradeFirst')}
        </p>
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
          <Button variant="outline" className="flex-1" onClick={endGame}>
            {t('host.game.end')}
          </Button>
        )}
      </div>
    </div>
  )
}
