import { WifiOffIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ConnectionStatus } from '../lib/socket'

/** Thin bar shown whenever the socket is not connected. */
export function ConnectionBar({ status }: { status: ConnectionStatus }) {
  const { t } = useTranslation()
  if (status === 'connected' || status === 'idle') return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground"
    >
      <WifiOffIcon className="size-4" aria-hidden="true" />
      {t('errors.connectionLost')}
    </div>
  )
}
