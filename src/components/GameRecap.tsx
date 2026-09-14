import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GAMES, type GameId } from '../games/config'
import type { GameMode } from '../session/sessionBests'

/*
  Shared end-of-run recap. Consumed by all five games. Replaces the per-game
  game-over panels. Shows final score, best streak this run, one game-specific
  stat, and the session best for this game + mode. Play again is front and
  centre, receives focus when the recap appears; Escape (or the back link)
  returns to the games menu.

  Props:
  - score: final score for the run (already computed by the game)
  - bestStreak: peak streak reached during this run (games must track this)
  - stat: one game-specific stat row, { label, value }
  - onPlayAgain: restart the run from the game
  - announce: the aria-live string spoken when the recap appears
  - gameId / mode: which session-best slot this run belongs to
  - sessionBest: the session best after this run (the game already submitted it)
  - isNewBest: whether this run improved the session best

  Session bests live only in memory, so the copy says so plainly. This
  component does not touch scoring, timing, mechanics, or the store itself.
*/

export interface RecapStat {
  label: string
  value: string | number
}

export interface GameRecapProps {
  score: string | number
  bestStreak: number
  stat: RecapStat
  onPlayAgain: () => void
  announce: string
  gameId: GameId
  mode: GameMode
  sessionBest: number | null
  isNewBest: boolean
}

export function GameRecap({
  score,
  bestStreak,
  stat,
  onPlayAgain,
  announce,
  gameId,
  mode,
  sessionBest,
  isNewBest,
}: GameRecapProps) {
  const playAgainRef = useRef<HTMLButtonElement>(null)
  const [newBestAnnouncement, setNewBestAnnouncement] = useState('')

  // focus the play again button when the recap appears so keyboard users land
  // on the primary action immediately.
  useEffect(() => {
    playAgainRef.current?.focus()
  }, [])

  // announce a new session best on its own live region, separate from the full
  // recap announcement. set after mount so the live region actually mutates
  // (content present at insertion is not reliably announced).
  useEffect(() => {
    if (isNewBest) {
      setNewBestAnnouncement(`New session best for ${GAMES[gameId].name}, ${mode} mode.`)
    }
  }, [isNewBest, gameId, mode])

  // Escape returns to the games menu (the back link destination).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      // let the browser follow the link via a synthetic click so react-router
      // handles navigation consistently.
      const link = document.querySelector<HTMLAnchorElement>('.recap-back-link')
      link?.click()
    }
  }

  const sessionBestDisplay = sessionBest === null ? '—' : GAMES[gameId].format(sessionBest)

  return (
    <main className="game-page">
      <section className="screen recap-screen" aria-label="Run complete">
        <div className="recap-panel" onKeyDown={onKeyDown}>
          <h2 className="recap-title">Run over</h2>

          <div className="recap-score-row">
            <span className="recap-score-label">Final score</span>
            <span className="recap-score-value">{score}</span>
          </div>

          <div className="recap-session">
            <span className="recap-session-label">Session best - {mode}</span>
            <span className="recap-session-value">{sessionBestDisplay}</span>
            {isNewBest && <span className="recap-new-best">New session best</span>}
          </div>

          <dl className="recap-stats">
            <div className="recap-stat">
              <dt>Best streak</dt>
              <dd>{bestStreak}</dd>
            </div>
            <div className="recap-stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          </dl>

          <div className="recap-actions">
            <button
              ref={playAgainRef}
              className="btn btn-primary recap-play-again"
              type="button"
              onClick={onPlayAgain}
            >
              Play again
            </button>
            <Link className="btn btn-secondary recap-back-link" to="/">
              Back to games
            </Link>
          </div>

          <p className="recap-session-note">Session bests reset when you refresh the page.</p>
        </div>

        <div className="announce" aria-live="polite">
          {announce}
        </div>

        <div className="announce" aria-live="polite">
          {newBestAnnouncement}
        </div>
      </section>
    </main>
  )
}
