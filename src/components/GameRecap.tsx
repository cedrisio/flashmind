import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/*
  Shared end-of-run recap. Consumed by all four games. Replaces the per-game
  game-over panels. Shows final score, best streak this run, and one
  game-specific stat. Play again is front and centre, receives focus when the
  recap appears; Escape (or the back link) returns to the games menu.

  Props:
  - score: final score for the run (already computed by the game)
  - bestStreak: peak streak reached during this run (games must track this)
  - stat: one game-specific stat row, { label, value }
  - onPlayAgain: restart the run from the game
  - announce: the aria-live string spoken when the recap appears

  This component does not touch scoring, timing, or mechanics. It only renders
  data the game already produced.
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
}

export function GameRecap({ score, bestStreak, stat, onPlayAgain, announce }: GameRecapProps) {
  const playAgainRef = useRef<HTMLButtonElement>(null)

  // focus the play again button when the recap appears so keyboard users land
  // on the primary action immediately.
  useEffect(() => {
    playAgainRef.current?.focus()
  }, [])

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

  return (
    <main className="game-page">
      <section className="screen recap-screen" aria-label="Run complete">
        <div className="recap-panel" onKeyDown={onKeyDown}>
          <h2 className="recap-title">Run over</h2>

          <div className="recap-score-row">
            <span className="recap-score-label">Final score</span>
            <span className="recap-score-value">{score}</span>
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
        </div>

        <div className="announce" aria-live="polite">
          {announce}
        </div>
      </section>
    </main>
  )
}