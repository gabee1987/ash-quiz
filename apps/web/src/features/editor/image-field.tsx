import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, apiFetch } from '../../lib/api'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

/** Picks and uploads an image straight away; shows a thumbnail with a remove button. */
export function ImageField({
  imageId,
  onChange,
  label,
  compact = false,
}: {
  imageId: string | undefined
  onChange: (imageId: string | undefined) => void
  label: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    if (!ACCEPT.includes(file.type)) return setError('errors.unsupportedImage')
    if (file.size > MAX_BYTES) return setError('errors.fileTooLarge')
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await apiFetch<{ id: string }>('/api/images', { method: 'POST', body })
      onChange(res.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'errors.internal')
    } finally {
      setUploading(false)
    }
  }

  if (imageId) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={`/api/images/${imageId}`}
          alt={label}
          className={`rounded-xl border bg-muted object-contain ${compact ? 'h-12 w-16' : 'h-24 w-36'}`}
        />
        <button
          type="button"
          className="min-h-10 rounded-lg px-2 text-sm font-semibold text-destructive underline underline-offset-4 outline-none hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring"
          onClick={() => onChange(undefined)}
        >
          {t('editor.removeImage')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Before its label so the label can show the input's keyboard focus (peer). */}
      <input
        id={id}
        type="file"
        accept={ACCEPT.join(',')}
        className="peer sr-only"
        aria-label={label}
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void upload(file)
        }}
      />
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm font-semibold text-muted-foreground transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring hover:border-ring hover:text-foreground ${compact ? 'min-h-12 px-3' : 'min-h-12 px-4'}`}
      >
        {uploading ? t('common.loading') : compact ? t('editor.addImageShort') : t('editor.addImage')}
      </label>
      {error && <p className="text-sm font-semibold text-destructive">{t(error)}</p>}
    </div>
  )
}
