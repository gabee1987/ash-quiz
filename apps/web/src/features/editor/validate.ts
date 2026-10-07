import { quizInputSchema, type QuizInput } from '@ash-quiz/shared'
import type { z } from 'zod'

/** Field path (e.g. "questions.2.options.1.text") to i18n key of the first problem there. */
export type FieldErrors = Record<string, string>

/** Validates a draft with the same shared schema the server uses, so the editor never saves what the API rejects. */
export function validateQuiz(draft: QuizInput): FieldErrors {
  const result = quizInputSchema.safeParse(draft)
  if (result.success) return {}
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    errors[path] ??= messageFor(issue)
  }
  return errors
}

function messageFor(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case 'custom':
      return issue.message
    case 'too_small':
      if (issue.origin === 'string') return 'editor.errors.required'
      if (issue.origin === 'array') return 'editor.errors.tooFew'
      return 'editor.errors.tooSmall'
    case 'too_big':
      if (issue.origin === 'string') return 'editor.errors.tooLong'
      if (issue.origin === 'array') return 'editor.errors.tooMany'
      return 'editor.errors.tooBig'
    default:
      return 'editor.errors.invalid'
  }
}

/** Errors under `prefix` (e.g. everything of question 2), for markers on collapsed cards. */
export function errorsUnder(errors: FieldErrors, prefix: string): string[] {
  return Object.keys(errors).filter((path) => path === prefix || path.startsWith(`${prefix}.`))
}
