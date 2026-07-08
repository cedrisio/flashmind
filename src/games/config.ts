// Per-game config. The DB schema stays generic; this is the app-side
// knowledge of how each game scores and what counts as a sane score.

export type GameId = 'number-flash' | 'echo-calc' | 'color-clash' | 'digit-rush'

export interface GameConfig {
  id: GameId
  name: string
  // higher-is-better or lower-is-better
  direction: 'higher' | 'lower'
  // sanity bound for a submitted score - anything outside is rejected
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
    // bound it generously at 9999 - anything higher is clearly garbage.
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
  'color-clash': {
    id: 'color-clash',
    name: 'color clash',
    direction: 'higher',
    // 60s run, +10 per correct + streak bonuses. realistic ceiling well under
    // 9999; bound generously.
    maxScore: 9999,
    format: (s) => s.toLocaleString('en-GB'),
  },
  'digit-rush': {
    id: 'digit-rush',
    name: 'digit rush',
    direction: 'higher',
    // highestLength*100 + correctTotal. length realistically climbs to ~8-12;
    // bound at 9999 (e.g. length=99 + 999 correct is unreachable).
    maxScore: 9999,
    format: (s) => s.toLocaleString('en-GB'),
  },
}

export const GAME_LIST = Object.values(GAMES)