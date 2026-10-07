import type { GameResults, ResultQuestion } from '@ash-quiz/shared'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DistributionBars } from '../../components/distribution-bars'
import { CorrectAnswer } from '../questions/correct-answer'
import { useQuestionFigures } from '../results/question-stats'
import { PodiumStage } from './podium'

export const SUMMARY_SLIDE_MS = 8000

/**
 * Results summary for the projector: the podium, then one slide per question.
 * Moves on by itself every 8 s; Space or → skips ahead, ← goes back. Wraps around.
 */
export function ScreenSummary({ results }: { results: GameResults }) {
  const { t } = useTranslation()
  const slides = 1 + results.questions.length
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    // Re-armed on every slide change, so a key press restarts the 8 s.
    const timer = setTimeout(() => setSlide((s) => (s + 1) % slides), SUMMARY_SLIDE_MS)
    return () => clearTimeout(timer)
  }, [slide, slides])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') setSlide((s) => (s + 1) % slides)
      else if (e.key === 'ArrowLeft') setSlide((s) => (s - 1 + slides) % slides)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides])

  const question = slide > 0 ? results.questions[slide - 1] : undefined
  return (
    <div className="flex flex-1 flex-col gap-8">
      <p className="flex justify-between text-2xl text-white/60">
        <span className="wrap-break-word">{results.quizTitle}</span>
        <span className="tabular-nums">
          {slide + 1} / {slides}
        </span>
      </p>
      {question ? (
        <QuestionSlide question={question} playerCount={results.players.length} />
      ) : (
        <>
          <h1 className="text-center text-6xl font-bold">{t('results.podium')}</h1>
          <PodiumStage key="podium" places={results.podium} />
        </>
      )}
      <p className="text-center text-lg text-white/40">{t('results.screenHint')}</p>
    </div>
  )
}

function QuestionSlide({ question, playerCount }: { question: ResultQuestion; playerCount: number }) {
  const { t } = useTranslation()
  const figures = useQuestionFigures(question, playerCount)
  return (
    <div key={question.question.id} className="flex flex-1 flex-col gap-8">
      <p className="text-3xl text-white/70">{t('results.questionNumber', { index: question.index + 1 })}</p>
      <h1 className="text-5xl leading-tight font-bold wrap-break-word">{question.question.text}</h1>
      <div className="text-4xl">
        <CorrectAnswer question={question.question} />
      </div>
      <DistributionBars reveal={question} large />
      <p className="text-3xl text-white/80">{figures.join(' · ')}</p>
    </div>
  )
}
