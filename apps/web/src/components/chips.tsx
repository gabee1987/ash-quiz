import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'

/** A list of short strings edited as removable chips plus an input (Enter or Add appends). */
export function ChipsInput({
  label,
  values,
  onChange,
  placeholder,
  maxItems = 20,
  maxLength = 100,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  maxItems?: number
  maxLength?: number
}) {
  const { t } = useTranslation()
  const id = useId()
  const [draft, setDraft] = useState('')
  const add = () => {
    const value = draft.trim()
    if (!value || values.length >= maxItems) return
    if (!values.some((v) => v.toLowerCase() === value.toLowerCase())) onChange([...values, value])
    setDraft('')
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((value, i) => (
            <li key={`${value}-${i}`} className="flex items-center gap-1 rounded-full bg-white/15 py-1 pr-1 pl-3">
              <span className="wrap-break-word">{value}</span>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/20"
                aria-label={t('common.removeItem', { name: value })}
                onClick={() => onChange(values.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="min-h-12 min-w-0 flex-1 rounded-lg bg-white px-3 text-black"
        />
        <Button type="button" variant="secondary" onClick={add}>
          {t('common.add')}
        </Button>
      </div>
    </div>
  )
}
