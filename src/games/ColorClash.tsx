import { useRef, useState, useCallback, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router-dom'

// Standard mode: 60s, wrong answer costs 2s.
// Relaxed mode: 90s, no time penalty on wrong answers.
const RUN_MS_STANDARD = 60_000
const RUN_MS_RELAXED = 90_000
const WRONG_PENALTY_MS = 2_000
const STREAK_BONUS = 5
const STREAK_STEP = 5
const MATCH_RATIO = 0.3 // 30% word==ink, 70% mismatch

type Mode = 'standard' | 'relaxed'
type Phase = 'intro' | 'playing' | 'over'

interface ColorName {
  key: 'red' | 'blue' | 'green' | 'yellow'
  label: string
  cssVar: string
}

const COLORS: ColorName[] = [
  { key: 'red', label: 'red', cssVar: '#ff5c5c' },
  { key: 'blue', label: 'blue', cssVar: '#61a5ff' },
  { key: 'green', label: 'green', cssVar: '#58d68d' },
  { key: 'yellow', label: 'yellow', cssVar: '#f2b84b' },
]

const KEY_MAP: Record<string, ColorName['key']> = {
  '1': 'red',
  '2': 'blue',
  '3': 'green',
  '4': 'yellow',
}

interface Round {
  word: ColorName
  ink: ColorName
}

interface GameState {
  phase: Phase
  mode: Mode
  runMs: number
  remainingMs: number
  score: number
  streak: number
  round: number
  current: Round | null
  feedback: { kind: string; text: string } | null
  announce: string
  inputLocked: boolean
  lastOutcome: 'correct' | 'wrong' | null
}

function freshState(mode: Mode): GameState {
  return {
    phase: 'intro',
    mode,
    runMs: mode === 'relaxed' ? RUN_MS_RELAXED : RUN_MS_STANDARD,
    remainingMs: mode === 'relaxed' ? RUN_MS_RELAXED : RUN_MS_STANDARD,
    score: 0,
    streak: 0,
    round: 0,
    current: null,
    feedback: null,
    announce: '',
    inputLocked: false,
    lastOutcome: null,
  }
}

function pickColor(): ColorName {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function makeRound(): Round {
  const word = pickColor()
  // 30% match, 70% mismatch
  if (Math.random() < MATCH_RATIO) {
    return { word, ink: word }
  }
  let ink = word
  while (ink.key === word.key) {
    ink = pickColor()
  }
  return { word, ink }
}

export function ColorClash() {
  const game = useRef<GameState>(freshState('standard'))
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((t: number) => (t + 1) & 0x7fffffff), [])

  const timerFrameRef = useRef<number | null>(null)
  const lastFrameAtRef = useRef(0)

  function clearTimers() {
    if (timerFrameRef.current !== null) {
      window.cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }
  }

  function endGame() {
    const g = game.current
    g.phase = 'over'
    clearTimers()
    g.feedback = null
    g.announce = `Time's up. Final score ${g.score}.`
    render()
  }

  function tickTimer(now: number) {
    const g = game.current
    if (g.phase !== 'playing') return
    if (lastFrameAtRef.current === 0) {
      lastFrameAtRef.current = now
    }
    const delta = now - lastFrameAtRef.current
    lastFrameAtRef.current = now
    g.remainingMs = Math.max(0, g.remainingMs - delta)
    if (g.remainingMs <= 0) {
      endGame()
      return
    }
    render()
    timerFrameRef.current = window.requestAnimationFrame(tickTimer)
  }

  function startTimer() {
    lastFrameAtRef.current = 0
    timerFrameRef.current = window.requestAnimationFrame(tickTimer)
  }

  function nextRound() {
    const g = game.current
    g.round += 1
    g.current = makeRound()
    g.feedback = null
    g.inputLocked = false
    g.lastOutcome = null
    g.announce = `Round ${g.round}. Tap the colour of the ink, not the word.`
    render()
  }

  function answer(picked: ColorName['key']) {
    const g = game.current
    if (g.phase !== 'playing' || g.inputLocked || !g.current) return

    g.inputLocked = true
    const correct = picked === g.current.ink.key

    if (correct) {
      // streak bonus applies per answer once you're on a streak of 5+
      const streakBonus = g.streak >= STREAK_STEP ? STREAK_BONUS : 0
      const points = 10 + streakBonus
      g.score += points
      g.streak += 1
      g.lastOutcome = 'correct'
      g.feedback = {
        kind: 'good',
        text: streakBonus > 0 ? `Correct. +${points} (streak bonus) - streak ${g.streak}.` : `Correct. +${points}.`,
      }
      g.announce = `Correct. ${g.streak} in a row.`
    } else {
      g.streak = 0
      g.lastOutcome = 'wrong'
      if (g.mode === 'standard') {
        g.remainingMs = Math.max(0, g.remainingMs - WRONG_PENALTY_MS)
      }
      g.feedback = {
        kind: 'bad',
        text: g.mode === 'standard'
          ? `Wrong. That was "${g.current.ink.label}" ink. -2 seconds.`
          : `Wrong. That was "${g.current.ink.label}" ink.`,
      }
      g.announce = `Wrong. The ink colour was ${g.current.ink.label}.`
    }

    render()

    // brief delay then next round
    window.setTimeout(() => {
      if (game.current.phase === 'playing') nextRound()
    }, 700)
  }

  function startGame(mode: Mode) {
    clearTimers()
    const fresh = freshState(mode)
    fresh.phase = 'playing'
    game.current = fresh
    render()
    requestAnimationFrame(() => {
      nextRound()
      startTimer()
    })
  }

  function restartGame() {
    clearTimers()
    startGame(game.current.mode)
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const g = game.current
    if (g.phase !== 'playing' || g.inputLocked) return
    const key = e.key
    if (key in KEY_MAP) {
      e.preventDefault()
      answer(KEY_MAP[key])
    }
  }

  const g = game.current
  const secondsLeft = Math.ceil(g.remainingMs / 1000)
  const phaseLabel = g.phase === 'over' ? 'game over' : g.phase === 'playing' ? `round ${g.round}` : 'ready'
  const difficultyLabel = g.mode === 'relaxed' ? 'relaxed mode - 90s, no penalty' : 'standard - 60s, -2s on wrong'

  if (g.phase === 'intro') {
    return (
      <main className="game-page">
        <section className="screen intro-screen">
          <div className="intro-copy">
            <p className="eyebrow">game 03</p>
            <h1>color clash</h1>
            <p className="lead">
              A colour word appears printed in ink that may not match the word. Pick the colour of the
              ink, not the word itself.
            </p>

            <div className="instructions">
              <h2>How to play</h2>
              <ol>
                <li>A word like "red" shows up in coloured ink. The ink may or may not match the word.</li>
                <li>Pick the <em>ink colour</em> using the four answer buttons (or keys 1-4).</li>
                <li>Correct answer: +10 points. A streak of 5 or more adds a +5 bonus per answer.</li>
                <li>Wrong answer resets your streak and costs 2 seconds (standard mode only).</li>
                <li>60 second run. Highest score wins.</li>
              </ol>
            </div>

            <div className="mode-pick">
              <h2>Choose your pace</h2>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => startGame('standard')}>
                  Standard - 60s
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => startGame('relaxed')}>
                  Relaxed - 90s, no penalty
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
      <main className="game-page">
        <section className="screen play-screen" aria-label="Color clash game">
          <div className="game-over-panel">
            <h2>Time's up</h2>
            <p className="final-score">Score: {g.score}</p>
            <p className="final-meta">Rounds played: {g.round}</p>
            <div className="actions centered">
              <button className="btn btn-primary" type="button" onClick={restartGame}>
                Play again
              </button>
              <Link className="btn btn-secondary" to="/">
                Back to menu
              </Link>
            </div>
          </div>
          <div className="announce" aria-live="polite">
            {g.announce}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="game-page">
      <section
        className="screen play-screen"
        aria-label="Color clash game"
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <div className="game-toolbar">
          <div className="status-grid" aria-label="Game status">
            <div className="stat">
              <span className="stat-value">{secondsLeft}s</span>
              <span className="stat-label">time</span>
            </div>
            <div className="stat">
              <span className="stat-value">{g.score}</span>
              <span className="stat-label">score</span>
            </div>
            <div className="stat">
              <span className="stat-value">{g.streak}</span>
              <span className="stat-label">streak</span>
            </div>
            <div className="stat">
              <span className="stat-value">{g.round}</span>
              <span className="stat-label">round</span>
            </div>
          </div>
          <button className="btn btn-small btn-secondary" type="button" onClick={restartGame}>
            Restart
          </button>
        </div>

        <div className="phase-row">
          <span className="phase-pill">{phaseLabel}</span>
          <span className="phase-detail">{difficultyLabel}</span>
        </div>

        <div className="timer" aria-hidden="true">
          <div
            className="timer-fill"
            style={{ width: `${(g.remainingMs / g.runMs) * 100}%` }}
          />
        </div>

        <div className="clash-panel">
          <p className="challenge-meta">pick the ink colour, not the word</p>
          <div
            className="clash-word"
            style={{ color: g.current?.ink.cssVar ?? 'var(--text)' }}
            aria-label={`The word ${g.current?.word.label ?? ''} shown in ${g.current?.ink.label ?? ''} ink`}
          >
            {g.current?.word.label ?? '—'}
          </div>
        </div>

        <div className="clash-buttons" role="group" aria-label="Answer colours">
          {COLORS.map((c, i) => (
            <button
              key={c.key}
              type="button"
              className="clash-btn"
              style={{ '--clash-color': c.cssVar } as React.CSSProperties}
              disabled={g.inputLocked}
              onClick={() => answer(c.key)}
              aria-label={`${c.label} - key ${i + 1}`}
            >
              <span className="clash-swatch" aria-hidden="true" />
              <span className="clash-label">{c.label}</span>
              <span className="clash-key" aria-hidden="true">{i + 1}</span>
            </button>
          ))}
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