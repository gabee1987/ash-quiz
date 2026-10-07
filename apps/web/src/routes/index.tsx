import type { GamePublicInfo } from '@ash-quiz/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ChoiceCards } from '@/components/choice-cards'
import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { TextField } from '../components/text-field'
import { apiFetch } from '../lib/api'
import { getStoredPlayer, storePlayer } from '../lib/player-storage'
import { emitAck, ensureConnected } from '../lib/socket'

export const Route = createFileRoute('/')({
  // Allows QR codes / links like /?pin=123456 to prefill the PIN. The router parses
  // 123456 as a number; PINs never start with 0, so converting back is lossless.
  validateSearch: z.object({ pin: z.coerce.string().optional().catch(undefined) }),
  component: JoinPage,
})

const PIN_PATTERN = /^[0-9]{6}$/

function JoinPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [pin, setPin] = useState(search.pin ?? '')
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pinValid = PIN_PATTERN.test(pin)
  const info = useQuery({
    queryKey: ['gamePublic', pin],
    queryFn: () => apiFetch<GamePublicInfo>(`/api/games/${pin}/public`),
    enabled: pinValid,
    retry: false,
  })
  const teamMode = info.data?.mode === 'team'

  const pinError = submitted && !pinValid ? t('join.pinInvalid') : undefined
  const nameError = submitted && !name.trim() ? t('join.nameRequired') : undefined
  const teamError = submitted && teamMode && !teamId ? t('errors.unknownTeam') : undefined

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (!pinValid || !name.trim() || (teamMode && !teamId)) return
    setPending(true)
    try {
      await ensureConnected()
      // A stored token for this PIN reclaims the same player (e.g. after closing the browser).
      const stored = getStoredPlayer(pin)
      const res = await emitAck('player:join', {
        pin,
        name: name.trim(),
        ...(teamMode && teamId ? { teamId } : {}),
        ...(stored ? { token: stored.token } : {}),
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      storePlayer(pin, { token: res.token, name: name.trim() })
      void navigate({ to: '/play/$pin', params: { pin } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.internal')
    } finally {
      setPending(false)
    }
  }

  const infoError = info.error && 'code' in info.error ? (info.error as { code: string }).code : null

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5">
      <h1 className="text-center text-3xl font-black tracking-tight">{t('join.title')}</h1>
      <form className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft" onSubmit={(e) => void onSubmit(e)} noValidate>
        <TextField
          label={t('join.pin')}
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder={t('join.pinPlaceholder')}
          error={pinError ?? (infoError ? t(infoError) : undefined)}
        />
        {info.data && (
          <p className="rounded-xl bg-secondary px-4 py-2 text-center font-bold text-secondary-foreground wrap-break-word">
            {info.data.quizTitle}
          </p>
        )}
        <TextField
          label={t('join.name')}
          name="name"
          maxLength={24}
          autoComplete="off"
          enterKeyHint="go"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('join.namePlaceholder')}
          error={nameError}
        />
        {teamMode && (
          <ChoiceCards
            legend={t('join.team')}
            value={teamId ?? ''}
            columns={1}
            choices={(info.data?.teams ?? []).map((team) => ({ value: team.id, label: team.name }))}
            onChange={setTeamId}
            help={teamError && <span className="font-semibold text-destructive">{teamError}</span>}
          />
        )}
        {error && <FormAlert>{t(error)}</FormAlert>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t('common.loading') : t('join.submit')}
        </Button>
      </form>
      <Link
        to="/login"
        className="self-center rounded-md text-sm font-semibold text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {t('join.hostLogin')}
      </Link>
    </div>
  )
}
