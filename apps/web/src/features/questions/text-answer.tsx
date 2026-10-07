import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import type { QuestionProps } from './types'

export function TextAnswer({ mode, disabled, large, onSubmit }: QuestionProps<'text'>) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  if (mode === 'display') {
    return <p className={`text-center text-white/70 ${large ? 'text-4xl' : ''}`}>{t('screen.answerOnPhone')}</p>
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSubmit?.({ type: 'text', value: trimmed })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={100}
        autoComplete="off"
        enterKeyHint="send"
        aria-label={t('play.typeAnswer')}
        placeholder={t('play.typeAnswer')}
        disabled={disabled}
        className="min-h-14 rounded-lg bg-white px-4 py-3 text-xl text-black"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        {t('play.submit')}
      </Button>
    </form>
  )
}
