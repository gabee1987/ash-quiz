import type { GameResults, PodiumPlace, ResultPlayer, ResultQuestion } from '@ash-quiz/shared'
import { resultsPendingFor } from './engine.js'
import { denseRank } from './scoring.js'
import { isRevealed, revealInfo } from './snapshots.js'
import type { GameState } from './types.js'

/**
 * Results of a game, derived from its state. Covers the questions revealed so far,
 * so a finished game lists every question that was asked.
 */
export function toResults(state: GameState): GameResults {
  const lastRevealed = isRevealed(state) ? state.questionIndex : state.questionIndex - 1
  const asked = state.quiz.questions.slice(0, Math.max(0, lastRevealed + 1))
  const players = Object.values(state.players)

  const questions: ResultQuestion[] = asked.map((question, index) => {
    const times = players.flatMap((p) => (p.answers[question.id] ? [p.answers[question.id]!.timeMs] : []))
    return {
      ...revealInfo(state, question),
      index,
      averageTimeMs: times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : null,
    }
  })

  const rankedPlayers: ResultPlayer[] = denseRank(players).map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    score: p.score,
    rank: p.rank,
    correctCount: asked.filter((q) => p.answers[q.id]?.correct === true).length,
    points: asked.map((q) => p.answers[q.id]?.points ?? null),
  }))
  const teams = denseRank(Object.values(state.teams)).map((t) => ({
    id: t.id,
    name: t.name,
    score: t.score,
    rank: t.rank,
    memberCount: players.filter((p) => p.teamId === t.id).length,
  }))
  const podium: PodiumPlace[] = (state.settings.mode === 'team' ? teams : rankedPlayers)
    .filter((place) => place.rank <= 3)
    .map(({ id, name, score, rank }) => ({ id, name, score, rank }))

  return {
    gameId: state.id,
    pin: state.pin,
    quizTitle: state.quiz.title,
    mode: state.settings.mode,
    phase: state.phase,
    createdAt: state.createdAt,
    finishedAt: state.finishedAt,
    podium,
    players: rankedPlayers,
    teams,
    questions,
    pendingRelease: { screen: resultsPendingFor(state, 'screen'), players: resultsPendingFor(state, 'players') },
  }
}

export type CsvLanguage = 'hu' | 'en'

const csvHeaders: Record<CsvLanguage, { rank: string; name: string; team: string; total: string }> = {
  hu: { rank: 'Helyezés', name: 'Név', team: 'Csapat', total: 'Összesen' },
  en: { rank: 'Rank', name: 'Name', team: 'Team', total: 'Total' },
}

/**
 * Player table as CSV for Excel: UTF-8 with BOM (keeps accents), `;` separator
 * (the Hungarian Excel default), CRLF lines. One column per question with its points;
 * empty where the player did not answer.
 */
export function toCsv(results: GameResults, language: CsvLanguage): string {
  const headers = csvHeaders[language]
  const teamNames = new Map(results.teams.map((t) => [t.id, t.name]))
  const rows: (string | number)[][] = [
    [headers.rank, headers.name, headers.team, headers.total, ...results.questions.map((q) => `${q.index + 1}. ${q.question.text}`)],
    ...results.players.map((p) => [
      p.rank,
      p.name,
      p.teamId ? (teamNames.get(p.teamId) ?? '') : '',
      p.score,
      ...p.points.map((points) => points ?? ''),
    ]),
  ]
  return '﻿' + rows.map((row) => row.map(csvField).join(';')).join('\r\n') + '\r\n'
}

function csvField(value: string | number): string {
  if (typeof value === 'number') return String(value)
  // Nicknames are typed by players: a leading = + - @ would run as an Excel formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}
