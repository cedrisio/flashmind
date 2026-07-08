// Per-game config. The DB schema stays generic; this is the app-side
// knowledge of how each game scores and what counts as a sane score.

export type GameId = 'number-flash' | 'echo-calc'

export interface GameConfig {
  id: GameId
  name: string
  // higher-is-better or lower-is-better
  direction: 'higher' | 'lower'
  // sanity bound for a submitted score — anything outside is rejected
  maxScore: number
  // how to render a score integer for display
  format: (score: number) => string
}

export const GAMES: Record<GameId, GameConfig> = {
  'number-flash': {
    id: 'number-flash',
    name: 'number flash',
    direction: 'higher',
    // circles grow ~1 per round; a realistic ceiling: 30 circles * 20 + streak
    // bound it generously at 9999 — anything higher is clearly garbage.
    maxScore: 9999,
    format: (s) => s.toLocaleString('en-GB'),
  },
  'echo-calc': {
    id: 'echo-calc',
    name: 'echo calc',
    direction: 'higher',
    // highestN*100 + correctTotal. highestN realistically climbs to ~8-12 in a
    // good run; bound at 9999 (e.g. n=99 + 999 correct is unreachable).
    maxScore: 9999,
    format: (s) => s.toLocaleString('en-GB'),
  },
}

export const GAME_LIST = Object.values(GAMES)