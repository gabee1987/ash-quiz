import type { GameMode, PlayerPublic, TeamPublic } from '@quizmoo/shared'

export interface LobbyGroup {
  /** Null in classic mode: one group without a heading. */
  team: TeamPublic | null
  players: PlayerPublic[]
}

/**
 * The lobby's player tiles: one group in classic mode, one per team in team mode (in the teams'
 * order, empty teams kept so the host sees where nobody has joined yet). Players keep the
 * snapshot's order inside a group.
 */
export function lobbyGroups(players: PlayerPublic[], teams: TeamPublic[], mode: GameMode): LobbyGroup[] {
  if (mode === 'classic') return [{ team: null, players }]
  return teams.map((team) => ({ team, players: players.filter((player) => player.teamId === team.id) }))
}
