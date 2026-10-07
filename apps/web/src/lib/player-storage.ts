// The player's token per game PIN, so a reload or a reopened browser rejoins as the same player.

export interface StoredPlayer {
  token: string
  name: string
}

const key = (pin: string) => `ash-quiz.player.${pin}`

export function getStoredPlayer(pin: string): StoredPlayer | null {
  try {
    const raw = localStorage.getItem(key(pin))
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (typeof value === 'object' && value !== null && 'token' in value && 'name' in value) {
      const { token, name } = value as Record<string, unknown>
      if (typeof token === 'string' && typeof name === 'string') return { token, name }
    }
  } catch {
    // Storage unavailable (private mode) or corrupted: treat as no stored player.
  }
  return null
}

export function storePlayer(pin: string, player: StoredPlayer) {
  try {
    localStorage.setItem(key(pin), JSON.stringify(player))
  } catch {
    // ignore: the game still works, only reload-rejoin is lost
  }
}

export function forgetPlayer(pin: string) {
  try {
    localStorage.removeItem(key(pin))
  } catch {
    // ignore
  }
}
