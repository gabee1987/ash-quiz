import type { Announcement, HostCommand } from '@quizmoo/shared'
import { MegaphoneIcon, SendIcon, XIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { remainingMs, useNow } from '@/lib/clock'

const presets = ['getReady', 'shortBreak', 'lastQuestion'] as const
const MAX_LENGTH = 200
/** How long a message stays: until cleared (null), or seconds. */
const durations = [null, 10, 30, 60] as const
type Duration = (typeof durations)[number]

/** Host message to every phone and the projector: one-tap presets, free text, how long it stays, and Clear. */
export function MessageBox({
  announcement,
  clockOffset,
  onCommand,
}: {
  announcement: Announcement | null
  clockOffset: number
  onCommand: (command: HostCommand) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [duration, setDuration] = useState<Duration>(null)
  const inputId = useId()
  const helpId = useId()
  const durationId = useId()

  async function announce(message: string) {
    setSending(true)
    const command: HostCommand = duration === null ? { type: 'announce', text: message } : { type: 'announce', text: message, durationSec: duration }
    if (await onCommand(command)) setText('')
    setSending(false)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <MegaphoneIcon className="size-5" aria-hidden="true" />
          {t('host.game.message.title')}
        </h2>
        <p id={helpId} className="text-sm text-muted-foreground">
          {t('host.game.message.help')}
        </p>
      </div>
      {announcement && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">
            {t('host.game.message.showing')}
            {announcement.expiresAt && <TimeLeft expiresAt={announcement.expiresAt} clockOffset={clockOffset} />}
          </span>
          {/* What the phones and the projector show, with the way to take it down. */}
          <div className="flex items-center gap-3">
            <AnnouncementBanner announcement={announcement} className="mb-0 min-w-0 flex-1 text-base" />
            <Button variant="outline" size="sm" onClick={() => void onCommand({ type: 'clearAnnouncement' })}>
              <XIcon aria-hidden="true" />
              {t('host.game.message.clear')}
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span id={durationId} className="text-sm font-semibold text-muted-foreground">
          {t('host.game.message.duration')}
        </span>
        <div role="group" aria-labelledby={durationId} className="flex rounded-lg bg-muted p-0.5">
          {durations.map((value) => (
            <button
              key={value ?? 'stays'}
              type="button"
              aria-pressed={duration === value}
              onClick={() => setDuration(value)}
              className={cn(
                'h-9 min-w-12 rounded-md px-2.5 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                duration === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {value === null ? t('host.game.message.stays') : t('host.game.message.seconds', { count: value })}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset}
            variant="secondary"
            size="sm"
            disabled={sending}
            onClick={() => void announce(t(`host.game.message.presets.${preset}`))}
          >
            {t(`host.game.message.presets.${preset}`)}
          </Button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) void announce(text)
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {t('host.game.message.label')}
        </label>
        <Input
          id={inputId}
          value={text}
          maxLength={MAX_LENGTH}
          aria-describedby={helpId}
          placeholder={t('host.game.message.label')}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" disabled={sending || !text.trim()}>
          <SendIcon aria-hidden="true" />
          {t('host.game.message.send')}
        </Button>
      </form>
    </section>
  )
}

/** " · disappears in 25 s", counting down to the server's `expiresAt`. */
function TimeLeft({ expiresAt, clockOffset }: { expiresAt: number; clockOffset: number }) {
  const { t } = useTranslation()
  const now = useNow()
  const seconds = Math.ceil(remainingMs(expiresAt, clockOffset, now) / 1000)
  return <span className="tabular-nums"> · {t('host.game.message.disappearsIn', { count: seconds })}</span>
}
