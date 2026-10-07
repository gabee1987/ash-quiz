import type { Question } from '@ash-quiz/shared'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { ChipsInput } from '../../components/chips'
import { withImage } from './draft'
import { ImageField } from './image-field'
import { NumberField } from './number-field'
import { OptionsEditor } from './options-editor'
import type { FieldErrors } from './validate'

const TIME_LIMITS = [5, 10, 20, 30, 45, 60, 90, 120, 180]
const POINTS = [0, 500, 1000, 2000]

/** Per-type form for one question. `path` is its error prefix, e.g. "questions.2". */
export function QuestionForm({
  question,
  onChange,
  errors,
  path,
}: {
  question: Question
  onChange: (question: Question) => void
  errors: FieldErrors
  path: string
}) {
  const { t } = useTranslation()
  const textId = useId()
  const textError = errors[`${path}.text`]
  const pointsOptions = POINTS.includes(question.points) ? POINTS : [...POINTS, question.points].sort((a, b) => a - b)
  const timeOptions = TIME_LIMITS.includes(question.timeLimitSec)
    ? TIME_LIMITS
    : [...TIME_LIMITS, question.timeLimitSec].sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor={textId}>{t('editor.questionText')}</label>
        <textarea
          id={textId}
          value={question.text}
          maxLength={500}
          rows={2}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          aria-invalid={textError ? true : undefined}
          aria-describedby={textError ? `${textId}-error` : undefined}
          className={`rounded-lg bg-white px-3 py-2 text-lg text-black ${textError ? 'ring-2 ring-red-400' : ''}`}
        />
        {textError && (
          <span id={`${textId}-error`} className="text-red-300">
            {t(textError)}
          </span>
        )}
      </div>

      <ImageField
        label={t('editor.questionImage')}
        imageId={question.imageId}
        onChange={(imageId) => onChange(withImage(question, imageId))}
      />

      {question.type === 'single' && (
        <OptionsEditor
          options={question.options}
          marker="radio"
          correctIds={[question.correctOptionId]}
          onOptions={(options) => onChange({ ...question, options })}
          onCorrect={(ids) => onChange({ ...question, correctOptionId: ids[0] ?? '' })}
          errors={errors}
          path={path}
        />
      )}
      {question.type === 'multiple' && (
        <OptionsEditor
          options={question.options}
          marker="checkbox"
          correctIds={question.correctOptionIds}
          onOptions={(options) => onChange({ ...question, options })}
          onCorrect={(ids) => onChange({ ...question, correctOptionIds: ids })}
          errors={errors}
          path={path}
        />
      )}
      {question.type === 'poll' && (
        <OptionsEditor
          options={question.options}
          marker="none"
          correctIds={[]}
          onOptions={(options) => onChange({ ...question, options })}
          onCorrect={() => {}}
          errors={errors}
          path={path}
        />
      )}
      {question.type === 'truefalse' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm">{t('editor.correctAnswer')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((value) => (
              <label
                key={String(value)}
                className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg ${question.correct === value ? 'bg-green-700 ring-2 ring-green-400' : 'bg-white/10'}`}
              >
                <input
                  type="radio"
                  name={`${path}-truefalse`}
                  className="size-5"
                  checked={question.correct === value}
                  onChange={() => onChange({ ...question, correct: value })}
                />
                {value ? t('play.true') : t('play.false')}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {question.type === 'text' && (
        <div className="flex flex-col gap-1">
          <ChipsInput
            label={t('editor.acceptedAnswers')}
            values={question.acceptedAnswers}
            onChange={(acceptedAnswers) => onChange({ ...question, acceptedAnswers })}
            placeholder={t('editor.acceptedAnswerPlaceholder')}
          />
          <p className="text-sm text-white/60">
            {question.acceptedAnswers.length === 0 ? t('editor.hostGradedHint') : t('editor.acceptedAnswersHint')}
          </p>
        </div>
      )}
      {question.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t('editor.correctNumber')}
            value={question.correct}
            onChange={(correct) => onChange({ ...question, correct })}
            error={errors[`${path}.correct`] ? t(errors[`${path}.correct`]!) : undefined}
          />
          <NumberField
            label={t('editor.tolerance')}
            value={question.tolerance}
            min={0}
            onChange={(tolerance) => onChange({ ...question, tolerance })}
            error={errors[`${path}.tolerance`] ? t(errors[`${path}.tolerance`]!) : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('editor.timeLimit')}
          <select
            value={question.timeLimitSec}
            onChange={(e) => onChange({ ...question, timeLimitSec: Number(e.target.value) })}
            className="min-h-12 rounded-lg bg-white px-3 text-black"
          >
            {timeOptions.map((s) => (
              <option key={s} value={s}>
                {t('editor.seconds', { count: s })}
              </option>
            ))}
          </select>
        </label>
        {question.type !== 'poll' && (
          <label className="flex flex-col gap-1 text-sm">
            {t('editor.points')}
            <select
              value={question.points}
              onChange={(e) => onChange({ ...question, points: Number(e.target.value) })}
              className="min-h-12 rounded-lg bg-white px-3 text-black"
            >
              {pointsOptions.map((p) => (
                <option key={p} value={p}>
                  {t('editor.pointsValue', { count: p })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  )
}
