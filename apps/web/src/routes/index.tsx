import type { GamePublicInfo } from '@ash-quiz/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '../components/button'
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
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4">
      <h1 className="text-center text-2xl font-bold">{t('join.title')}</h1>
      <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)} noValidate>
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
        {info.data && <p className="text-center text-white/80">{info.data.quizTitle}</p>}
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm">{t('join.team')}</legend>
            {info.data?.teams.map((team) => (
              <label
                key={team.id}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 ${teamId === team.id ? 'bg-brand' : 'bg-white/10'}`}
              >
                <input
                  type="radio"
                  name="team"
                  value={team.id}
                  checked={teamId === team.id}
                  onChange={() => setTeamId(team.id)}
                  className="size-5"
                />
                {team.name}
              </label>
            ))}
            {teamError && <p className="text-sm text-red-300">{teamError}</p>}
          </fieldset>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(error)}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t('common.loading') : t('join.submit')}
        </Button>
      </form>
      <Link to="/login" className="text-center text-sm text-white/60 underline">
        {t('join.hostLogin')}
      </Link>
    </div>
  )
}
