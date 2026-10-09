import type { Avatar, GamePublicInfo } from '@quizmoo/shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { CameraIcon, CheckIcon, DicesIcon, Loader2Icon, PlayIcon } from 'lucide-react'
import { Suspense, lazy, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { AvatarPicker } from '@/components/avatar-picker'
import { ChoiceCards } from '@/components/choice-cards'
import { FormAlert } from '@/components/form-alert'
import { PinInput } from '@/components/pin-input'
import { Button } from '@/components/ui/button'
import { TextField } from '../components/text-field'
import { apiFetch, errorCode } from '../lib/api'
import { randomAvatar } from '../lib/avatars'
import { PIN_PATTERN } from '../lib/pin'
import { getStoredPlayer, storePlayer } from '../lib/player-storage'
import { emitAck, ensureConnected } from '../lib/socket'

export const Route = createFileRoute('/')({
  // Allows QR codes / links like /?pin=123456 to prefill the PIN. The router parses
  // 123456 as a number; PINs never start with 0, so converting back is lossless.
  validateSearch: z.object({ pin: z.coerce.string().optional().catch(undefined) }),
  component: JoinPage,
})

// The scanner and its decoder load only when the camera button is pressed.
const QrScanner = lazy(() => import('../components/qr-scanner'))

/** Camera access exists only in secure contexts (HTTPS or localhost); elsewhere the button is not offered. */
const canScan = typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'

function JoinPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [pin, setPin] = useState(search.pin ?? '')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<Avatar>(() => randomAvatar())
  const [teamId, setTeamId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinChecked, setPinChecked] = useState(false)
  const nameSection = useRef<HTMLDivElement>(null)

  const pinValid = PIN_PATTERN.test(pin)
  const info = useQuery({
    queryKey: ['gamePublic', pin],
    queryFn: () => apiFetch<GamePublicInfo>(`/api/games/${pin}/public`),
    enabled: pinValid,
    retry: false,
  })
  const teamMode = info.data?.mode === 'team'

  const infoError = info.error && 'code' in info.error ? (info.error as { code: string }).code : null
  const pinError = (submitted || pinChecked) && !pinValid ? t('join.pinInvalid') : infoError ? t(infoError) : undefined

  // "Surprise me": a name from the admins' list that nobody in this game has yet, and a random avatar.
  const surprise = useMutation({
    mutationFn: () => apiFetch<{ name: string | null }>(`/api/games/${pin}/nickname?lang=${i18n.language.startsWith('en') ? 'en' : 'hu'}`),
    onSuccess: ({ name: picked }) => {
      if (picked) setName(picked)
      setAvatar(randomAvatar())
    },
    onError: (err) => setError(errorCode(err)),
  })

  /** OK under the PIN: closes the phone's keyboard and brings the name field into view. */
  function confirmPin() {
    setPinChecked(true)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    if (pinValid) nameSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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
        avatar,
        ...(teamMode && teamId ? { teamId } : {}),
        ...(stored ? { token: stored.token } : {}),
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      storePlayer(pin, { token: res.token, name: name.trim(), avatar })
      void navigate({ to: '/play/$pin', params: { pin } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.internal')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5">
      <h1 className="animate-fade-up text-center text-3xl font-black tracking-tight">{t('join.title')}</h1>
      <form
        className="flex animate-pop flex-col gap-5 rounded-3xl border bg-card p-5 shadow-soft"
        onSubmit={(e) => void onSubmit(e)}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <div className="flex min-h-10 items-center justify-between gap-2">
            <span className="font-semibold">{t('join.pin')}</span>
            {canScan && (
              <Button type="button" variant="outline" size="sm" onClick={() => setScanning(true)}>
                <CameraIcon aria-hidden="true" />
                {t('join.scan')}
              </Button>
            )}
          </div>
          <PinInput value={pin} onChange={setPin} invalid={!!pinError} describedBy={pinError ? 'pin-error' : undefined} />
          {pinError && (
            <p id="pin-error" className="text-sm font-semibold text-destructive">
              {pinError}
            </p>
          )}
          <Button type="button" variant="secondary" onClick={confirmPin}>
            <CheckIcon aria-hidden="true" />
            {t('join.pinOk')}
          </Button>
        </div>
        <div ref={nameSection} className="flex scroll-mt-4 flex-col gap-5">
          {info.data && (
            <p className="animate-pop rounded-xl bg-secondary px-4 py-2 text-center font-bold text-secondary-foreground wrap-break-word">
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
          {/* The names come from the game's server, so the button waits for a valid PIN. */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="-mt-3 self-start"
            disabled={!info.data || surprise.isPending}
            title={info.data ? undefined : t('join.surpriseNeedsPin')}
            onClick={() => surprise.mutate()}
          >
            {surprise.isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <DicesIcon aria-hidden="true" />}
            {t('join.surprise')}
          </Button>
          <AvatarPicker value={avatar} onChange={setAvatar} />
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
        </div>
        {error && <FormAlert>{t(error)}</FormAlert>}
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
          {pending ? t('common.loading') : t('join.submit')}
        </Button>
      </form>
      <Link
        to="/login"
        className="self-center rounded-md text-sm font-semibold text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {t('join.hostLogin')}
      </Link>
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner
            onResult={(scanned) => {
              setPin(scanned)
              setScanning(false)
            }}
            onClose={() => setScanning(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
