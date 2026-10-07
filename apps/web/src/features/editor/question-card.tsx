import type { Question } from '@ash-quiz/shared'
import { useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, GripVerticalIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      className={`rounded-2xl border-2 bg-card shadow-soft ${selected ? 'border-primary' : ''} ${dragOver ? 'outline-2 outline-ring outline-dashed' : ''}`}
    >
      <div className="flex items-center gap-2 p-2">
        <span
          draggable
          onDragStart={onDragStart}
          className="hidden cursor-grab px-1 text-muted-foreground select-none sm:block"
          aria-hidden="true"
          title={t('editor.dragToReorder')}
        >
          <GripVerticalIcon className="size-5" />
        </span>
        <button type="button" onClick={onSelect} aria-expanded={selected} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-extrabold text-secondary-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{question.text || t('editor.untitledQuestion')}</span>
            <span className="block text-xs text-muted-foreground">
              {t(`questionTypes.${question.type}`)} · {t('editor.seconds', { count: question.timeLimitSec })}
              {question.type !== 'poll' && ` · ${t('editor.pointsValue', { count: question.points })}`}
            </span>
          </span>
          {hasErrors && (
            <Badge variant="destructive" className="shrink-0">
              {t('editor.needsFixing')}
            </Badge>
          )}
        </button>
        <div className="flex shrink-0 items-center">
          <IconButton label={t('editor.moveUp')} disabled={index === 0} onClick={() => onMove(index - 1)}>
            <ArrowUpIcon className="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton label={t('editor.moveDown')} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
            <ArrowDownIcon className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-4 border-t p-4">
          <QuestionForm question={question} onChange={onChange} errors={errors} path={`questions.${index}`} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
              <CopyIcon aria-hidden="true" />
              {t('editor.duplicateQuestion')}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2Icon aria-hidden="true" />
              {t('editor.deleteQuestion')}
            </Button>
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
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-30"
    >
      {children}
    </button>
  )
}
