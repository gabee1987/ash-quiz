import { useTranslation } from 'react-i18next'
import type { ConnectionStatus } from '../lib/socket'

/** Thin bar shown whenever the socket is not connected. */
export function ConnectionBar({ status }: { status: ConnectionStatus }) {
  const { t } = useTranslation()
  if (status === 'connected' || status === 'idle') return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 bg-red-600 px-4 py-1 text-center text-sm font-semibold">
      {t('errors.connectionLost')}
    </div>
  )
}
