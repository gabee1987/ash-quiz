import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export const Route = createFileRoute('/')({
  // Allows QR codes / links like /?pin=123456 to prefill the PIN.
  validateSearch: z.object({ pin: z.string().optional() }),
  component: JoinPage,
})

function JoinPage() {
  const { t } = useTranslation()
  const { pin } = Route.useSearch()
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4">
      <h1 className="text-center text-2xl font-bold">{t('join.title')}</h1>
      <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm">
          {t('join.pin')}
          <input
            name="pin"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            defaultValue={pin ?? ''}
            placeholder={t('join.pinPlaceholder')}
            className="rounded-lg bg-white px-4 py-3 text-center text-2xl tracking-[0.3em] text-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('join.name')}
          <input
            name="name"
            maxLength={24}
            autoComplete="off"
            placeholder={t('join.namePlaceholder')}
            className="rounded-lg bg-white px-4 py-3 text-lg text-black"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-3 text-lg font-semibold active:scale-[0.98]"
        >
          {t('join.submit')}
        </button>
      </form>
      <Link to="/login" className="text-center text-sm text-white/60 underline">
        {t('join.hostLogin')}
      </Link>
    </div>
  )
}
