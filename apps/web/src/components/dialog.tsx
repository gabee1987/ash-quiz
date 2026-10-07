import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'

/** Modal confirmation built on the native <dialog> (focus trap and Escape for free). */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string
  children?: ReactNode
  confirmLabel: string
  danger?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-brand-dark p-5 text-white backdrop:bg-black/70"
    >
      <h2 id="confirm-title" className="mb-2 text-xl font-bold">
        {title}
      </h2>
      {children && <div className="mb-4 text-white/80">{children}</div>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          className={`flex-1 ${danger ? 'bg-red-600!' : ''}`}
          disabled={pending}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
