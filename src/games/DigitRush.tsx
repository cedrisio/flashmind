import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Numpad } from '../components/Numpad'
import { GameRecap } from '../components/GameRecap'
import { MuteButton } from '../components/MuteButton'
import { play } from '../audio/sound'

// Standard flash: 600ms + 300ms per digit.
// Relaxed flash: 900ms + 450ms per digit.
const START_LENGTH = 3
const LIVES_START = 3
const FLASH_BASE_MS_STANDARD = 600
const FLASH_PER_DIGIT_MS_STANDARD = 300
const FLASH_BASE_MS_RELAXED = 900
const FLASH_PER_DIGIT_MS_RELAXED = 450

type Mode = 'standard' | 'relaxed'
type Phase = 'intro' | 'showing' | 'recalling' | 'feedback' | 'over'

interface GameState {
  phase: Phase
  mode: Mode
  length: number
  lives: number
  streak: number
  bestStreak: number
  correctTotal: number
  highestLength: number
  current: string
  lastShown: string | null
  feedback: { kind: string; text: string } | null
  announce: string
  inputDisabled: boolean
  submitLabel: string
  inputValue: string
}

function freshState(mode: Mode): GameState {
  return {
    phase: 'intro',
    mode,
    length: START_LENGTH,
    lives: LIVES_START,
    streak: 0,
    bestStreak: 0,
    correctTotal: 0,
    highestLength: START_LENGTH,
    current: '',
    lastShown: null,
    feedback: null,
    announce: '',
    inputDisabled: true,
    submitLabel: 'Submit',
    inputValue: '',
  }
}

function makeDigits(length: number): string {
  let s = ''
  for (let i = 0; i < length; i++) {
    // 0-9 inclusive; leading zeros are valid digits here
    s += Math.floor(Math.random() * 10).toString()
  }
  return s
}

// The expected answer is the shown string reversed end-to-end.
function reverseString(s: string): string {
  return s.split('').reverse().join('')
}

function flashDurationMs(mode: Mode, length: number): number {
  const base = mode === 'relaxed' ? FLASH_BASE_MS_RELAXED : FLASH_BASE_MS_STANDARD
  const per = mode === 'relaxed' ? FLASH_PER_DIGIT_MS_RELAXED : FLASH_PER_DIGIT_MS_STANDARD
  return base + per * length
}

function livesStr(n: number): string {
  return '♥'.repeat(n) + '♡'.repeat(LIVES_START - n)
}

function calcScore(g: GameState): number {
  return g.highestLength * 100 + g.correctTotal
}

export function DigitRush() {
  const game = useRef<GameState>(freshState('standard'))
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((t: number) => (t + 1) & 0x7fffffff), [])

  const numpadRef = useRef<HTMLDivElement>(null)
  const flashTimerRef = useRef<number | null>(null)

  function clearTimers() {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current)
      flashTimerRef.current = null
    }
  }

  function startRound() {
    const g = game.current
    g.current = makeDigits(g.length)
    g.lastShown = g.current
    g.phase = 'showing'
    g.feedback = null
    g.inputValue = ''
    g.announce = `Memorise the ${g.length} digit${g.length !== 1 ? 's' : ''}, then type them in reverse.`
    g.inputDisabled = true
    render()
    play('tick')
    const dur = flashDurationMs(g.mode, g.length)
    flashTimerRef.current = window.setTimeout(() => {
      const s = game.current
      s.phase = 'recalling'
      s.inputDisabled = false
      s.announce = 'Now type the digits in reverse order, then press Enter.'
      render()
      requestAnimationFrame(() => numpadRef.current?.focus())
    }, dur)
  }

  function handleSubmit() {
    const g = game.current
    if (g.phase !== 'recalling') return
    const raw = g.inputValue.trim()
    if (raw === '') {
      g.feedback = { kind: 'warn', text: 'Type the digits first.' }
      render()
      return
    }

    g.inputDisabled = true
    g.phase = 'feedback'

    const expected = reverseString(g.current)
    if (raw === expected) {
      g.correctTotal += 1
      g.streak += 1
      g.bestStreak = Math.max(g.bestStreak, g.streak)
      g.highestLength = Math.max(g.highestLength, g.length)
      g.feedback = { kind: 'good', text: `Correct. Next: ${g.length + 1} digits.` }
      g.announce = `Correct. The shown string was ${g.current}.`
      play('correct')
      render()
      g.length += 1
      window.setTimeout(() => {
        if (game.current.phase === 'feedback') startRound()
      }, 900)
    } else {
      g.lives -= 1
      g.streak = 0
      g.feedback = {
        kind: 'bad',
        text: `Wrong. The answer was "${expected}". -1 life.`,
      }
      g.announce = `Wrong. The shown string was ${g.current}; the answer was ${expected}.`
      play('wrong')
      render()
      if (g.lives <= 0) {
        endGame()
        return
      }
      // keep same length for next attempt
      window.setTimeout(() => {
        if (game.current.phase === 'feedback') startRound()
      }, 1500)
    }
  }

  function endGame() {
    const g = game.current
    clearTimers()
    g.phase = 'over'
    g.feedback = null
    const finalVal = calcScore(g)
    g.announce = `Game over. Final score ${finalVal}. Best streak ${g.bestStreak}. Longest chain ${g.highestLength}. Press enter to play again.`
    play('gameover')
    render()
  }

  function startGame(mode: Mode) {
    clearTimers()
    const fresh = freshState(mode)
    fresh.phase = 'showing'
    game.current = fresh
    render()
    requestAnimationFrame(() => startRound())
  }

  function restartGame() {
    startGame(game.current.mode)
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const g = game.current
  const phaseLabel =
    g.phase === 'over'
      ? 'game over'
      : g.phase === 'showing'
        ? 'memorise'
        : g.phase === 'recalling'
          ? 'type it backwards'
          : g.phase === 'feedback'
            ? g.feedback?.kind === 'good'
              ? 'correct'
              : 'incorrect'
            : 'ready'
  const difficultyLabel = `${g.length} digit${g.length !== 1 ? 's' : ''} - ${(flashDurationMs(g.mode, g.length) / 1000).toFixed(1)}s flash`
  const finalScore = calcScore(g)

  if (g.phase === 'intro') {
    return (
      <main className="game-page">
        <section className="screen intro-screen">
          <div className="intro-copy">
            <h1>Digit Rush</h1>
            <p className="lead">
              A string of digits flashes briefly, then hides. Type it back in reverse order from
              memory. Each correct round makes the string one digit longer.
            </p>

            <div className="instructions">
              <h2>How to play</h2>
              <ol>
                <li>A digit string flashes for a moment, starting at 3 digits.</li>
                <li>Type the digits in <em>reverse order</em>, then press Enter (or Submit).</li>
                <li>Correct answer grows the string by 1 for the next round.</li>
                <li>You have 3 lives. A wrong answer shows the correct answer and costs a life.</li>
                <li>Score = (longest chain reached × 100) + total correct answers.</li>
              </ol>
              <div className="how-to-example">
                <p className="example-label">Example</p>
                <table className="example-table">
                  <thead>
                    <tr><th>You see</th><th>You type</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>401</td><td>104</td></tr>
                    <tr><td>7 320</td><td>0 237</td></tr>
                    <tr><td>09</td><td>90</td></tr>
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>
                Leading zeros count - "012" shown means you type "210". Type them exactly, last digit
                first.
              </p>
            </div>

            <div className="mode-pick">
              <h2>Choose your pace</h2>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => startGame('standard')}>
                  Standard - faster flash
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => startGame('relaxed')}>
                  Relaxed - slower flash
                </button>
              </div>
            </div>

            <div className="actions">
              <Link className="btn btn-secondary" to="/">
                Back to menu
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (g.phase === 'over') {
    return (
      <GameRecap
        score={finalScore}
        bestStreak={g.bestStreak}
        stat={{ label: 'Longest chain', value: g.highestLength }}
        onPlayAgain={restartGame}
        announce={g.announce}
      />
    )
  }

  return (
    <main className="game-page">
      <section className="screen play-screen" aria-label="Digit rush game">
        <div className="game-toolbar">
          <div className="status-grid" aria-label="Game status">
            <div className="stat">
              <span className="stat-value">{g.length}</span>
              <span className="stat-label">length</span>
            </div>
            <div className="stat">
              <span className="stat-value">{calcScore(g)}</span>
              <span className="stat-label">score</span>
            </div>
            <div className="stat">
              <span className="stat-value">{g.streak}</span>
              <span className="stat-label">streak</span>
            </div>
            <div className="stat">
              <span className="stat-value">{livesStr(g.lives)}</span>
              <span className="stat-label">lives</span>
            </div>
          </div>
          <div className="toolbar-actions">
            <MuteButton />
            <button className="btn btn-small btn-secondary" type="button" onClick={restartGame}>
              Restart
            </button>
          </div>
        </div>

        <div className="phase-row">
          <span className="phase-pill">{phaseLabel}</span>
          <span className="phase-detail">{difficultyLabel}</span>
        </div>

        <div className="count-panel">
          <p className="challenge-meta">
            {g.phase === 'showing' ? 'memorise the digits' : g.phase === 'recalling' ? 'type them backwards' : 'result'}
          </p>
          {g.phase === 'showing' ? (
            <div className="number-flash equation-display digit-flash-display">{g.current}</div>
          ) : g.phase === 'feedback' ? (
            <div className="number-flash equation-display digit-flash-display">{g.current}</div>
          ) : (
            <div className="number-flash equation-display digit-flash-display muted-display">
              {g.phase === 'recalling' ? '—' : g.current}
            </div>
          )}
        </div>

        <div className="answer-panel">
          <p className="answer-prompt">
            {g.phase === 'recalling'
              ? 'Enter the digits in reverse, then press Enter'
              : g.phase === 'showing'
                ? 'Watch the digits...'
                : g.feedback?.text ?? ''}
          </p>
          <Numpad
            ref={numpadRef}
            value={g.inputValue}
            onChange={(v) => {
              game.current.inputValue = v
              render()
            }}
            onSubmit={handleSubmit}
            disabled={g.inputDisabled || g.phase !== 'recalling'}
            maxLength={g.length}
            submitLabel={g.submitLabel}
            placeholder={g.phase === 'recalling' ? 'digits in reverse' : 'wait'}
            accent="accent"
          />
        </div>

        <div
          className={`feedback${g.feedback ? ` ${g.feedback.kind}` : ''}${g.feedback ? '' : ' hidden'}`}
          role="status"
          aria-live="polite"
        >
          {g.feedback?.text}
        </div>

        <div className="announce" aria-live="polite">
          {g.announce}
        </div>
      </section>
    </main>
  )
}