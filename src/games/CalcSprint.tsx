import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Numpad } from '../components/Numpad'
import { GameRecap } from '../components/GameRecap'
import { MuteButton } from '../components/MuteButton'
import { play } from '../audio/sound'

// Standard mode: 60s run, wrong answers cost 2s.
// Relaxed mode: 90s run, no time penalty, larger on-screen controls.
const RUN_MS_STANDARD = 60_000
const RUN_MS_RELAXED = 90_000
const WRONG_PENALTY_MS = 2_000
const CORRECT_POINTS = 10
const STREAK_STEP = 5
const STREAK_BONUS = 5
const NEXT_EQUATION_DELAY_CORRECT_MS = 450
const NEXT_EQUATION_DELAY_WRONG_MS = 900
const LOW_TIME_MS = 10_000

type Mode = 'standard' | 'relaxed'
type Phase = 'intro' | 'playing' | 'over'

interface Equation {
  display: string
  result: number
}

interface GameState {
  phase: Phase
  mode: Mode
  runMs: number
  remainingMs: number
  score: number
  streak: number
  bestStreak: number
  correctTotal: number
  round: number
  currentEq: Equation | null
  inputValue: string
  inputDisabled: boolean
  feedback: { kind: string; text: string } | null
  announce: string
  lowTimeWarned: boolean
}

function freshState(mode: Mode): GameState {
  const runMs = mode === 'relaxed' ? RUN_MS_RELAXED : RUN_MS_STANDARD
  return {
    phase: 'intro',
    mode,
    runMs,
    remainingMs: runMs,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctTotal: 0,
    round: 0,
    currentEq: null,
    inputValue: '',
    inputDisabled: true,
    feedback: null,
    announce: '',
    lowTimeWarned: false,
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// addition and subtraction only. operands 1-20, and subtraction always keeps
// a non-negative result (the larger operand is shown first).
function makeEquation(): Equation {
  const a = randomInt(1, 20)
  const b = randomInt(1, 20)
  const add = Math.random() < 0.5
  let na = a
  let nb = b
  if (!add && na < nb) {
    const t = na
    na = nb
    nb = t
  }
  return {
    display: na + (add ? ' + ' : ' - ') + nb,
    result: add ? na + nb : na - nb,
  }
}

export function CalcSprint() {
  const game = useRef<GameState>(freshState('standard'))
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((t: number) => (t + 1) & 0x7fffffff), [])

  const numpadRef = useRef<HTMLDivElement>(null)
  const timerFrameRef = useRef<number | null>(null)
  const lastFrameAtRef = useRef(0)
  const nextTimerRef = useRef<number | null>(null)

  function clearTimers() {
    if (timerFrameRef.current !== null) {
      window.cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current)
      nextTimerRef.current = null
    }
  }

  function endGame() {
    const g = game.current
    g.phase = 'over'
    clearTimers()
    g.feedback = null
    g.inputDisabled = true
    g.announce = `Time's up. Final score ${g.score}. Best streak ${g.bestStreak}. ${g.correctTotal} correct. Press enter to play again.`
    play('gameover')
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
    if (!g.lowTimeWarned && g.remainingMs <= LOW_TIME_MS && g.remainingMs > 0) {
      g.lowTimeWarned = true
      g.announce = '10 seconds left.'
    }
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

  function showNextEquation() {
    const g = game.current
    if (g.phase !== 'playing') return
    g.round += 1
    g.currentEq = makeEquation()
    g.inputValue = ''
    g.inputDisabled = false
    g.feedback = null
    g.announce = `Equation ${g.round}: ${g.currentEq.display}`
    render()
    requestAnimationFrame(() => numpadRef.current?.focus())
  }

  function submit() {
    const g = game.current
    if (g.phase !== 'playing' || g.inputDisabled || !g.currentEq) return

    const raw = g.inputValue.trim()
    if (raw === '') {
      g.feedback = { kind: 'warn', text: 'Enter a number first.' }
      render()
      return
    }
    const typed = parseInt(raw, 10)
    if (isNaN(typed)) {
      g.feedback = { kind: 'warn', text: 'Enter a whole number.' }
      render()
      return
    }

    g.inputDisabled = true
    const eq = g.currentEq

    if (typed === eq.result) {
      g.streak += 1
      // approved rule: every fifth consecutive correct earns the bonus, i.e.
      // streaks 5, 10, 15, ... - so evaluate the newly incremented streak.
      const streakBonus = g.streak % STREAK_STEP === 0 ? STREAK_BONUS : 0
      const points = CORRECT_POINTS + streakBonus
      g.score += points
      g.bestStreak = Math.max(g.bestStreak, g.streak)
      g.correctTotal += 1
      g.feedback = {
        kind: 'good',
        text: streakBonus > 0 ? `Correct. +${points} (streak bonus) - streak ${g.streak}.` : `Correct. +${points}.`,
      }
      play('correct')
      render()
      nextTimerRef.current = window.setTimeout(showNextEquation, NEXT_EQUATION_DELAY_CORRECT_MS)
    } else {
      g.streak = 0
      if (g.mode === 'standard') {
        g.remainingMs = Math.max(0, g.remainingMs - WRONG_PENALTY_MS)
      }
      g.feedback = {
        kind: 'bad',
        text:
          g.mode === 'standard'
            ? `Wrong. ${eq.display} = ${eq.result}. -2 seconds.`
            : `Wrong. ${eq.display} = ${eq.result}.`,
      }
      play('wrong')
      if (g.remainingMs <= 0) {
        endGame()
        return
      }
      render()
      nextTimerRef.current = window.setTimeout(showNextEquation, NEXT_EQUATION_DELAY_WRONG_MS)
    }
  }

  function startGame(mode: Mode) {
    clearTimers()
    const fresh = freshState(mode)
    fresh.phase = 'playing'
    game.current = fresh
    render()
    requestAnimationFrame(() => {
      showNextEquation()
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

  const g = game.current
  const secondsLeft = Math.ceil(g.remainingMs / 1000)
  const phaseLabel = g.phase === 'over' ? 'game over' : g.phase === 'playing' ? `equation ${g.round}` : 'ready'
  const difficultyLabel =
    g.mode === 'relaxed' ? 'relaxed - 90s, no penalty, bigger keys' : 'standard - 60s, -2s on wrong'

  if (g.phase === 'intro') {
    return (
      <main className="game-page">
        <section className="screen intro-screen">
          <div className="intro-copy">
            <h1>Calc Sprint</h1>
            <p className="lead">
              One equation at a time. Solve it and type the answer before the clock runs out - keep a
              streak going for bonus points.
            </p>

            <div className="instructions">
              <h2>How to play</h2>
              <ol>
                <li>An equation appears - addition or subtraction, numbers from 1 to 20.</li>
                <li>Type the answer with the on-screen pad (or your number keys) and press Enter.</li>
                <li>Correct answer: +10 points. Every fifth correct in a row earns a +5 bonus (streaks 5, 10, 15…).</li>
                <li>Wrong answer resets your streak and costs 2 seconds (standard mode only).</li>
                <li>60 second run. Highest score wins. Answers are never negative.</li>
              </ol>
            </div>

            <div className="mode-pick">
              <h2>Choose your pace</h2>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => startGame('standard')}>
                  Standard - 60s
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => startGame('relaxed')}>
                  Relaxed - 90s, no penalty, bigger keys
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
        score={g.score}
        bestStreak={g.bestStreak}
        stat={{ label: 'Correct answers', value: g.correctTotal }}
        onPlayAgain={restartGame}
        announce={g.announce}
      />
    )
  }

  return (
    <main className="game-page">
      <section
        className={`screen play-screen${g.mode === 'relaxed' ? ' relaxed' : ''}`}
        aria-label="Calc sprint game"
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
              <span className="stat-label">equation</span>
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

        <div className="timer" aria-hidden="true">
          <div
            className="timer-fill"
            style={{ width: `${(g.remainingMs / g.runMs) * 100}%` }}
          />
        </div>

        <div className="count-panel">
          <p className="challenge-meta">solve it, type it</p>
          <div className="number-flash equation-display">
            {g.currentEq?.display ?? '—'}
          </div>
        </div>

        <div className="answer-panel">
          <p className="answer-prompt">
            {g.inputDisabled ? 'Next equation…' : 'Type the answer, then press Enter'}
          </p>
          <Numpad
            ref={numpadRef}
            value={g.inputValue}
            onChange={(v) => {
              game.current.inputValue = v
              render()
            }}
            onSubmit={submit}
            disabled={g.inputDisabled}
            submitLabel="Submit"
            placeholder="answer"
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
