import type { HostCommand, HostSnapshot } from '@ash-quiz/shared'

export interface PrimaryAction {
  command: HostCommand
  /** i18n key of the button label. */
  label: string
}

/** The one obvious next step for the host in each phase (button, and Space on the screen). */
export function primaryAction(host: HostSnapshot): PrimaryAction | null {
  switch (host.phase) {
    case 'lobby':
      return host.players.length > 0 ? { command: { type: 'start' }, label: 'host.game.start' } : null
    case 'question':
      return { command: { type: 'endQuestion' }, label: 'host.game.endQuestion' }
    case 'reveal':
      return host.awaitingGrading ? null : { command: { type: 'next' }, label: 'host.game.showScoreboard' }
    case 'scoreboard':
      return host.questionIndex + 1 < host.questionCount
        ? { command: { type: 'next' }, label: 'host.game.nextQuestion' }
        : { command: { type: 'next' }, label: 'host.game.finish' }
    case 'finished':
      return null
  }
}
