import type { Question } from '@ash-quiz/shared'
import { useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../../components/dialog'
import { QuestionForm } from './question-form'
import type { FieldErrors } from './validate'

/**
 * One question in the list. Collapsed it shows a summary; selected it shows the form.
 * Reorder with the up/down buttons (all devices) or drag the card (pointer devices).
 */
export function QuestionCard({
  question,
  index,
  count,
  selected,
  hasErrors,
  errors,
  onSelect,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  onDropAt,
}: {
  question: Question
  index: number
  count: number
  selected: boolean
  hasErrors: boolean
  errors: FieldErrors
  onSelect: () => void
  onChange: (question: Question) => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onDelete: () => void
  onDropAt: (from: number) => void
}) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/x-question-index', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const from = Number(e.dataTransfer.getData('text/x-question-index'))
    if (Number.isInteger(from)) onDropAt(from)
  }

  return (
    <li
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('text/x-question-index')) return
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-xl bg-white/5 ${selected ? 'ring-2 ring-brand' : ''} ${dragOver ? 'outline-2 outline-white/60 outline-dashed' : ''}`}
    >
      <div className="flex items-center gap-2 p-2">
        <span
          draggable
          onDragStart={onDragStart}
          className="hidden cursor-grab px-1 text-white/40 select-none sm:block"
          aria-hidden="true"
          title={t('editor.dragToReorder')}
        >
          ⋮⋮
        </span>
        <button type="button" onClick={onSelect} aria-expanded={selected} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
          <span className="w-6 font-bold tabular-nums">{index + 1}.</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{question.text || t('editor.untitledQuestion')}</span>
            <span className="block text-xs text-white/60">
              {t(`questionTypes.${question.type}`)} · {t('editor.seconds', { count: question.timeLimitSec })}
              {question.type !== 'poll' && ` · ${t('editor.pointsValue', { count: question.points })}`}
            </span>
          </span>
          {hasErrors && (
            <span className="shrink-0 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold">{t('editor.needsFixing')}</span>
          )}
        </button>
        <div className="flex shrink-0 items-center">
          <IconButton label={t('editor.moveUp')} disabled={index === 0} onClick={() => onMove(index - 1)}>
            ↑
          </IconButton>
          <IconButton label={t('editor.moveDown')} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
            ↓
          </IconButton>
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-4 border-t border-white/10 p-3">
          <QuestionForm question={question} onChange={onChange} errors={errors} path={`questions.${index}`} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-10 rounded-lg bg-white/10 px-3 text-sm" onClick={onDuplicate}>
              {t('editor.duplicateQuestion')}
            </button>
            <button type="button" className="min-h-10 rounded-lg px-3 text-sm text-red-300 underline" onClick={() => setConfirmDelete(true)}>
              {t('editor.deleteQuestion')}
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('editor.deleteQuestionTitle')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={() => {
            setConfirmDelete(false)
            onDelete()
          }}
          onCancel={() => setConfirmDelete(false)}
        >
          {question.text || t('editor.untitledQuestion')}
        </ConfirmDialog>
      )}
    </li>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-lg text-lg hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
