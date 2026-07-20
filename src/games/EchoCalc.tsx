import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Numpad } from '../components/Numpad'
import { GameRecap } from '../components/GameRecap'
import { MuteButton } from '../components/MuteButton'
import { play } from '../audio/sound'

// Standard mode: 0.9s between equations, 3 lives.
// Relaxed mode: 1.4s between equations, 4 lives - more time to compute, one
// extra life for forgiveness.
const LIVES_START_STANDARD = 3
const LIVES_START_RELAXED = 4
const STREAK_LEVEL_UP = 5
const INTER_EQUATION_MS_STANDARD = 900
const INTER_EQUATION_MS_RELAXED = 1400

type Mode = 'standard' | 'relaxed'
type Phase = 'intro' | 'playing' | 'over'

interface Equation {
  display: string
  result: number
}

interface GameState {
  mode: Mode
  n: number
  lives: number
  livesStart: number
  streak: number
  bestStreak: number
  correctTotal: number
  highestN: number
  phase: Phase
  history: number[] // results in display order (0-indexed)
  equationCount: number
  currentEq: Equation | null
  warmupRemaining: number
  answeringEqNum: number
  inputDisabled: boolean
  submitLabel: string
  promptText: string
  inputValue: string
  feedback: { kind: string; text: string } | null
  announce: string
}

function freshState(mode: Mode): GameState {
  const livesStart = mode === 'relaxed' ? LIVES_START_RELAXED : LIVES_START_STANDARD
  return {
    mode,
    n: 1,
    lives: livesStart,
    livesStart,
    streak: 0,
    bestStreak: 0,
    correctTotal: 0,
    highestN: 1,
    phase: 'intro',
    history: [],
    equationCount: 0,
    currentEq: null,
    warmupRemaining: 0,
    answeringEqNum: 0,
    inputDisabled: true,
    submitLabel: 'Next →',
    promptText: 'Warming up…',
    inputValue: '',
    feedback: null,
    announce: '',
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

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

function livesStr(g: GameState): string {
  return '♥'.repeat(g.lives) + '♡'.repeat(g.livesStart - g.lives)
}

function calcScore(g: GameState): number {
  return g.highestN * 100 + g.correctTotal
}

export function EchoCalc() {
  const game = useRef<GameState>(freshState('standard'))
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((t: number) => (t + 1) & 0x7fffffff), [])

  const numpadRef = useRef<HTMLDivElement>(null)
  const nextTimerRef = useRef<number | null>(null)

  function clearTimers() {
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current)
      nextTimerRef.current = null
    }
  }

  function isWarmup(g: GameState): boolean {
    return g.equationCount <= g.n
  }

  function updateAnnounce(g: GameState, text: string) {
    g.announce = text
  }

  function showNextEquation() {
    const g = game.current
    g.feedback = null
    g.inputValue = ''
    const eq = makeEquation()
    g.history.push(eq.result)
    g.equationCount += 1
    g.currentEq = eq

    if (isWarmup(g)) {
      const remaining = g.n - g.equationCount
      g.warmupRemaining = remaining
      g.answeringEqNum = 0
      g.promptText =
        remaining === 0
          ? 'Next equation - answering begins!'
          : `${remaining} more warmup equation${remaining !== 1 ? 's' : ''} after this…`
      g.inputDisabled = false
      g.submitLabel = 'Next →'
    } else {
      const nBack = g.n
      const eqNum = g.equationCount - nBack
      g.answeringEqNum = eqNum
      g.promptText = `Enter answer to equation ${eqNum} (echo depth ${nBack})`
      g.inputDisabled = false
      g.submitLabel = 'Submit'
    }

    updateAnnounce(g, `Equation ${g.equationCount}: ${eq.display}`)
    render()
    requestAnimationFrame(() => numpadRef.current?.focus())
  }

  function endGame() {
    const g = game.current
    g.phase = 'over'
    g.feedback = null
    const finalVal = calcScore(g)
    updateAnnounce(
      g,
      `Game over. Final score ${finalVal}. Best streak ${g.bestStreak}. Highest echo depth ${g.highestN}. Press enter to play again.`,
    )
    play('gameover')
    render()
  }

  function lockInput() {
    const g = game.current
    g.inputDisabled = true
    render()
  }

  function handleSubmit() {
    const g = game.current
    if (g.phase !== 'playing') return

    if (isWarmup(g)) {
      showNextEquation()
      return
    }

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

    const expected = g.history[g.equationCount - 1 - g.n]
    lockInput()

    if (typed === expected) {
      g.correctTotal += 1
      g.streak += 1
      g.bestStreak = Math.max(g.bestStreak, g.streak)
      if (g.streak % STREAK_LEVEL_UP === 0) {
        g.n += 1
        g.highestN = Math.max(g.highestN, g.n)
        g.feedback = {
          kind: 'good',
          text: `Correct! Echo depth rises to ${g.n} - keep going!`,
        }
        updateAnnounce(g, `Correct. Echo depth now ${g.n}.`)
      } else {
        g.feedback = { kind: 'good', text: 'Correct!' }
        updateAnnounce(g, 'Correct.')
      }
      play('correct')
    } else {
      g.lives -= 1
      g.streak = 0
      g.feedback = { kind: 'bad', text: `Wrong - the answer was ${expected}.` }
      updateAnnounce(g, `Wrong. The answer was ${expected}.`)
      if (g.lives <= 0) {
        play('wrong')
        endGame()
        return
      }
      play('wrong')
    }

    render()
    const interMs = g.mode === 'relaxed' ? INTER_EQUATION_MS_RELAXED : INTER_EQUATION_MS_STANDARD
    nextTimerRef.current = window.setTimeout(() => showNextEquation(), interMs)
  }

  function startGame(mode: Mode) {
    clearTimers()
    const fresh = freshState(mode)
    fresh.phase = 'playing'
    game.current = fresh
    render()
    requestAnimationFrame(() => showNextEquation())
  }

  function restartGame() {
    clearTimers()
    startGame(game.current.mode)
  }

  const g = game.current
  const phaseLabel =
    g.phase === 'over'
      ? 'game over'
      : g.phase === 'playing'
        ? `equation ${g.equationCount}`
        : 'ready'
  const difficultyLabel = g.mode === 'relaxed'
    ? `relaxed - echo depth ${g.n}, 1.4s, no lives pressure`
    : `standard - echo depth ${g.n}, 0.9s`
  const finalScore = calcScore(g)

  if (g.phase === 'intro') {
    return (
      <main className="game-page">
        <section className="screen intro-screen">
          <div className="intro-copy">
            <h1>Echo Calc</h1>
            <p className="lead">
              Equations flash one at a time. Compute each one - but enter the answer from N steps
              ago.
            </p>

            <div className="instructions">
              <h2>How to play</h2>
              <ol>
                <li>An equation appears. Solve it <em>in your head</em> - don't type yet.</li>
                <li>When the next equation appears, type the answer to the <em>previous</em> one.</li>
                <li>N starts at 1. Every 5 correct answers N climbs by 1 (harder!).</li>
                <li>You have 3 lives. A wrong answer costs a life and shows the correct answer.</li>
                <li>The game ends when all lives are lost. Score = (highest N × 100) + correct answers.</li>
              </ol>

              <div className="how-to-example">
                <p className="example-label">Example at N = 1</p>
                <table className="example-table">
                  <thead>
                    <tr><th>You see</th><th>You compute</th><th>You type</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>3 + 4</td><td>7</td><td>- warmup</td></tr>
                    <tr><td>5 + 2</td><td>7</td><td>7</td></tr>
                    <tr><td>8 - 3</td><td>5</td><td>7</td></tr>
                    <tr><td>6 + 1</td><td>7</td><td>5</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mode-pick">
              <h2>Choose your pace</h2>
              <div className="actions">
                <button className="btn btn-blue" type="button" onClick={() => startGame('standard')}>
                  Standard - 0.9s, 3 lives
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => startGame('relaxed')}>
                  Relaxed - 1.4s, 4 lives
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
        stat={{ label: 'Highest echo depth', value: g.highestN }}
        onPlayAgain={restartGame}
        announce={g.announce}
      />
    )
  }

  return (
    <main className="game-page">
      <section className="screen play-screen" aria-label="Echo calc game">
        <div className="game-toolbar">
          <div className="status-grid" aria-label="Game status">
            <div className="stat blue-stat">
              <span className="stat-value">{g.n}</span>
              <span className="stat-label">echo depth</span>
            </div>
            <div className="stat blue-stat">
              <span className="stat-value">{calcScore(g)}</span>
              <span className="stat-label">score</span>
            </div>
            <div className="stat blue-stat">
              <span className="stat-value">{g.streak}</span>
              <span className="stat-label">streak</span>
            </div>
            <div className="stat blue-stat">
              <span className="stat-value">{livesStr(g)}</span>
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
          <span className="phase-pill blue-pill">{phaseLabel}</span>
          <span className="phase-detail">{difficultyLabel}</span>
        </div>

        <div className="count-panel">
          <p className="challenge-meta">solve in your head</p>
          <div className="number-flash equation-display">{g.currentEq?.display ?? '—'}</div>
        </div>

        <div className="answer-panel">
          <p className="answer-prompt">{g.promptText}</p>
          <Numpad
            ref={numpadRef}
            value={g.inputValue}
            onChange={(v) => {
              game.current.inputValue = v
              render()
            }}
            onSubmit={handleSubmit}
            disabled={g.inputDisabled}
            submitLabel={g.submitLabel}
            placeholder={g.answeringEqNum === 0 ? 'press Next to continue' : 'answer'}
            accent="blue"
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