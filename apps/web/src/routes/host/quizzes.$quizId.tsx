import type { Question, Quiz, QuizInput } from '@ash-quiz/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, ChevronDownIcon, PlusIcon } from 'lucide-react'
import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import { toastError } from '@/lib/toast'
import { Spinner } from '../../components/spinner'
import { copyQuestion, move, newQuestion } from '../../features/editor/draft'
import { PhonePreview } from '../../features/editor/phone-preview'
import { QuestionCard } from '../../features/editor/question-card'
import { TypePicker } from '../../features/editor/type-picker'
import { useAutosave, type SaveStatus } from '../../features/editor/use-autosave'
import { GameSettingsForm, settingsSummary } from '../../features/host/game-settings-form'
import { errorsUnder, validateQuiz } from '../../features/editor/validate'
import { apiFetch, errorCode } from '../../lib/api'

export const Route = createFileRoute('/host/quizzes/$quizId')({
  component: QuizEditorPage,
})

function QuizEditorPage() {
  const { t } = useTranslation()
  const { quizId } = Route.useParams()
  const quiz = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => (await apiFetch<{ quiz: Quiz }>(`/api/quizzes/${quizId}`)).quiz,
    // The editor owns the draft once loaded; refetching would fight local edits.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
  if (quiz.isPending) return <Spinner />
  if (quiz.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <FormAlert>{t(errorCode(quiz.error))}</FormAlert>
        <Button asChild variant="secondary">
          <Link to="/host">{t('host.game.backToQuizzes')}</Link>
        </Button>
      </div>
    )
  }
  return <Editor key={quizId} quiz={quiz.data} />
}

function Editor({ quiz }: { quiz: Quiz }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<QuizInput>({
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions,
    settings: quiz.settings,
  })
  const [selectedId, setSelectedId] = useState<string | null>(quiz.questions[0]?.id ?? null)
  const [picking, setPicking] = useState(quiz.questions.length === 0)
  const [showPreview, setShowPreview] = useState(false)
  // Field errors of a question show once the user has left it (or it came from the server),
  // so a brand-new question is not covered in "Required." before anything was typed.
  const [visited, setVisited] = useState<Set<string>>(() => new Set(quiz.questions.map((q) => q.id)))
  const select = (id: string | null) => {
    if (selectedId) setVisited((v) => new Set(v).add(selectedId))
    setSelectedId(id)
  }

  const errors = useMemo(() => validateQuiz(draft), [draft])
  const valid = Object.keys(errors).length === 0
  const status = useAutosave(draft, {
    valid,
    save: async (value) => {
      try {
        const res = await apiFetch<{ quiz: Quiz }>(`/api/quizzes/${quiz.id}`, { method: 'PUT', body: JSON.stringify(value) })
        queryClient.setQueryData(['quiz', quiz.id], res.quiz)
        void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      } catch (error) {
        // The draft stays in the editor; the indicator shows the error and the next edit retries.
        toastError(error)
        throw error
      }
    },
  })

  // Warn before closing the tab with unsaved or invalid changes.
  useEffect(() => {
    if (status === 'saved') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status])

  const questions = draft.questions
  const selectedIndex = questions.findIndex((q) => q.id === selectedId)

  // A question that was complete once shows its errors immediately when it is broken again.
  useEffect(() => {
    const complete = draft.questions.filter(
      (q, i) => !visited.has(q.id) && errorsUnder(errors, `questions.${i}`).length === 0,
    )
    if (complete.length > 0) setVisited((v) => new Set([...v, ...complete.map((q) => q.id)]))
  }, [draft.questions, errors, visited])
  const setQuestions = (next: Question[]) => setDraft((d) => ({ ...d, questions: next }))
  const titleError = errors.title
  const colourful = draft.settings.answerStyle === 'colourful'

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/host">
              <ArrowLeftIcon aria-hidden="true" />
              {t('host.game.backToQuizzes')}
            </Link>
          </Button>
          <SaveIndicator status={status} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="quiz-title" className="font-semibold">
            {t('editor.title')}
          </Label>
          <Input
            id="quiz-title"
            value={draft.title}
            maxLength={120}
            autoFocus={quiz.questions.length === 0}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'quiz-title-error' : undefined}
            className="h-14 text-xl font-bold"
          />
          {titleError && (
            <span id="quiz-title-error" className="text-sm font-semibold text-destructive">
              {t(titleError)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="quiz-description" className="font-semibold">
            {t('editor.description')}
          </Label>
          <Textarea
            id="quiz-description"
            value={draft.description}
            maxLength={500}
            rows={2}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>

        <details className="group rounded-2xl border bg-card shadow-soft">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t('editor.gameSettings')}</span>
              <span className="block text-sm text-muted-foreground">{settingsSummary(draft.settings, t)}</span>
            </span>
            <ChevronDownIcon className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
            <p className="text-sm text-muted-foreground">{t('editor.gameSettingsHelp')}</p>
            <GameSettingsForm value={draft.settings} onChange={(settings) => setDraft((d) => ({ ...d, settings }))} />
          </div>
        </details>

        <h2 className="text-xl font-extrabold">{t('editor.questionCount', { count: questions.length })}</h2>
        <ol className="flex flex-col gap-2">
          {questions.map((question, index) => {
            const showErrors = visited.has(question.id)
            return (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              count={questions.length}
              selected={question.id === selectedId}
              hasErrors={showErrors && errorsUnder(errors, `questions.${index}`).length > 0}
              errors={showErrors ? errors : {}}
              onSelect={() => select(question.id === selectedId ? null : question.id)}
              onChange={(next) => setQuestions(questions.map((q) => (q.id === question.id ? next : q)))}
              onMove={(to) => setQuestions(move(questions, index, to))}
              onDropAt={(from) => setQuestions(move(questions, from, index))}
              onDuplicate={() => {
                const copy = copyQuestion(question)
                setQuestions([...questions.slice(0, index + 1), copy, ...questions.slice(index + 1)])
                select(copy.id)
              }}
              onDelete={() => setQuestions(questions.filter((q) => q.id !== question.id))}
            />
            )
          })}
        </ol>

        {picking ? (
          <TypePicker
            onPick={(type) => {
              const question = newQuestion(type)
              setQuestions([...questions, question])
              select(question.id)
              setPicking(false)
            }}
            onCancel={() => setPicking(false)}
          />
        ) : (
          questions.length < 100 && (
            <Button variant="secondary" size="lg" onClick={() => setPicking(true)}>
              <PlusIcon aria-hidden="true" />
              {t('editor.addQuestion')}
            </Button>
          )
        )}

        <Button variant="outline" className="xl:hidden" onClick={() => setShowPreview((s) => !s)} aria-expanded={showPreview}>
          {showPreview ? t('editor.hidePreview') : t('editor.showPreview')}
        </Button>
        {showPreview && (
          <div className="xl:hidden">
            <PhonePreview question={questions[selectedIndex] ?? null} index={selectedIndex} count={questions.length} colourful={colourful} />
          </div>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-4 flex flex-col gap-2">
          <p className="text-center text-sm font-semibold text-muted-foreground">{t('editor.preview')}</p>
          <PhonePreview question={questions[selectedIndex] ?? null} index={selectedIndex} count={questions.length} colourful={colourful} />
        </div>
      </aside>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useTranslation()
  const styles: Record<SaveStatus, string> = {
    saved: 'bg-success text-success-foreground',
    pending: 'bg-muted text-muted-foreground',
    saving: 'bg-muted text-muted-foreground',
    invalid: 'bg-destructive text-destructive-foreground',
    error: 'bg-destructive text-destructive-foreground',
  }
  return (
    <span role="status" className={cn('rounded-full px-3 py-1 text-sm font-bold', styles[status])}>
      {t(`editor.status.${status}`)}
    </span>
  )
}
