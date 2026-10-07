import type { Question, QuestionType } from '@ash-quiz/shared'

/**
 * Short random id for new questions and options. getRandomValues works on plain
 * http (laptop on the LAN); crypto.randomUUID needs a secure context.
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
}

const emptyOptions = () => Array.from({ length: 4 }, () => ({ id: newId(), text: '' }))

/** A fresh question of `type` with sensible defaults (20 s, 1000 points, first option correct). */
export function newQuestion(type: QuestionType): Question {
  const base = { id: newId(), text: '', timeLimitSec: 20, points: 1000 }
  switch (type) {
    case 'single': {
      const options = emptyOptions()
      return { ...base, type, options, correctOptionId: options[0]!.id }
    }
    case 'multiple': {
      const options = emptyOptions()
      return { ...base, type, options, correctOptionIds: [options[0]!.id] }
    }
    case 'truefalse':
      return { ...base, type, correct: true }
    case 'text':
      return { ...base, type, acceptedAnswers: [] }
    case 'number':
      return { ...base, type, correct: 0, tolerance: 0 }
    case 'poll':
      return { ...base, type, options: emptyOptions(), points: 0 }
  }
}

/** Copy with new ids; correct-answer references follow the options. */
export function copyQuestion(question: Question): Question {
  if (!('options' in question)) return { ...question, id: newId() }
  const ids = new Map(question.options.map((o) => [o.id, newId()]))
  const options = question.options.map((o) => ({ ...o, id: ids.get(o.id)! }))
  switch (question.type) {
    case 'single':
      return { ...question, id: newId(), options, correctOptionId: ids.get(question.correctOptionId) ?? '' }
    case 'multiple':
      return { ...question, id: newId(), options, correctOptionIds: question.correctOptionIds.map((id) => ids.get(id) ?? id) }
    case 'poll':
      return { ...question, id: newId(), options }
  }
}

export function move<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list]
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item!)
  return copy
}

/** Sets or removes an optional imageId without writing `undefined` (exactOptionalPropertyTypes). */
export function withImage<T extends { imageId?: string | undefined }>(item: T, imageId: string | undefined): T {
  const { imageId: _old, ...rest } = item
  return (imageId ? { ...rest, imageId } : rest) as T
}
