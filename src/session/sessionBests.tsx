import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { GAMES, type GameId } from '../games/config'

/*
  Session best scores for every game, split by mode. In-memory only.

  The store lives in a ref (the source of truth) plus a counter that forces a
  re-render when a record changes. Nothing is written to storage, the URL, or
  the network, so results survive route changes within one SPA session and
  reset on refresh or close. No backend, no accounts, no tracking.

  Score direction comes from the per-game config: a new best is a higher score
  for 'higher' games and a lower score for 'lower' games.
*/

export type GameMode = 'standard' | 'relaxed'

export interface SessionBestEntry {
  standard: number | null
  relaxed: number | null
}

export type SessionBests = Record<GameId, SessionBestEntry>

export interface SubmitResult {
  previousBest: number | null
  best: number
  isNewBest: boolean
}

// Pure comparison, kept separate so the record logic can be tested without a
// browser. A first score is always a best; otherwise the direction decides.
export function isNewSessionBest(
  direction: 'higher' | 'lower',
  score: number,
  previousBest: number | null,
): boolean {
  if (previousBest === null) return true
  return direction === 'higher' ? score > previousBest : score < previousBest
}

export interface SessionBestsStore {
  submit: (gameId: GameId, mode: GameMode, score: number) => SubmitResult
  snapshot: () => SessionBests
}

function emptyBests(): SessionBests {
  const map = {} as SessionBests
  for (const id of Object.keys(GAMES) as GameId[]) {
    map[id] = { standard: null, relaxed: null }
  }
  return map
}

export function createSessionBestsStore(): SessionBestsStore {
  let state = emptyBests()
  return {
    submit(gameId, mode, score) {
      const { direction } = GAMES[gameId]
      const previousBest = state[gameId][mode]
      const isNewBest = isNewSessionBest(direction, score, previousBest)
      if (isNewBest) {
        state = { ...state, [gameId]: { ...state[gameId], [mode]: score } }
      }
      // when not a new best, previousBest is non-null by definition; the ??
      // keeps the type a plain number without a cast.
      return { previousBest, best: isNewBest ? score : previousBest ?? score, isNewBest }
    },
    snapshot() {
      return state
    },
  }
}

interface SessionBestsValue {
  submitScore: (gameId: GameId, mode: GameMode, score: number) => SubmitResult
}

const SessionBestsContext = createContext<SessionBestsValue | null>(null)

export function SessionBestsProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionBestsStore | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createSessionBestsStore()
  }

  const submitScore = useCallback(
    (gameId: GameId, mode: GameMode, score: number): SubmitResult => {
      return storeRef.current!.submit(gameId, mode, score)
    },
    [],
  )

  const value = useMemo(() => ({ submitScore }), [submitScore])

  return <SessionBestsContext.Provider value={value}>{children}</SessionBestsContext.Provider>
}

export function useSessionBests(): SessionBestsValue {
  const ctx = useContext(SessionBestsContext)
  if (!ctx) {
    throw new Error('useSessionBests must be used within a SessionBestsProvider')
  }
  return ctx
}
