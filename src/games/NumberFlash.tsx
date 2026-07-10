import { useRef, useState, useCallback, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router-dom'

const START_CIRCLES = 3
const START_FLASH_MS = 2300
const MIN_FLASH_MS = 900
const FLASH_STEP_MS = 120
const MAX_PLACEMENT_ATTEMPTS = 700

type TargetStatus = 'idle' | 'hit' | 'miss'
type Phase = 'intro' | 'memorize' | 'recall' | 'feedback'

interface Position {
  number: number
  x: number
  y: number
  size: number
  status: TargetStatus
}

interface GameState {
  phase: Phase
  round: number
  score: number
  streak: number
  mistakes: number
  circleCount: number
  flashMs: number
  nextExpected: number
  positions: Position[]
  clickStartedAt: number
  lastOutcome: 'correct' | 'wrong'
  feedback: { kind: string; text: string } | null
  showRoundActions: boolean
  nextRoundLabel: string
  focusedIndex: number | null
  revealed: boolean
  announce: string
}

function freshState(): GameState {
  return {
    phase: 'intro',
    round: 1,
    score: 0,
    streak: 0,
    mistakes: 0,
    circleCount: START_CIRCLES,
    flashMs: START_FLASH_MS,
    nextExpected: 1,
    positions: [],
    clickStartedAt: 0,
    lastOutcome: 'correct',
    feedback: null,
    showRoundActions: false,
    nextRoundLabel: 'Next round',
    focusedIndex: null,
    revealed: false,
    announce: '',
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getCircleSize(count: number, width: number, height: number): number {
  const base = width < 480 ? 52 : 58
  if (count <= 8) return base
  const areaSize = Math.floor(Math.sqrt((width * height) / (count * 2.2)))
  return Math.max(44, Math.min(base, areaSize))
}

function makePositions(count: number, width: number, height: number, size: number) {
  const positions: { x: number; y: number }[] = []
  const radius = size / 2
  const padding = radius + 12
  const minDistance = size + 12

  for (let i = 0; i < count; i++) {
    let chosen: { x: number; y: number } | null = null
    let best: { x: number; y: number } | null = null
    let bestDistance = -1

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const candidate = {
        x: randomBetween(padding, Math.max(padding, width - padding)),
        y: randomBetween(padding, Math.max(padding, height - padding)),
      }
      let closest = Infinity
      for (const point of positions) {
        closest = Math.min(closest, distance(candidate, point))
      }
      if (closest >= minDistance) {
        chosen = candidate
        break
      }
      if (closest > bestDistance) {
        bestDistance = closest
        best = candidate
      }
    }
    positions.push(chosen || best || { x: padding, y: padding })
  }
  return positions
}

function shuffle<T>(values: T[]): T[] {
  const copy = values.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

export function NumberFlash() {
  const game = useRef<GameState>(freshState())
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((t: number) => (t + 1) & 0x7fffffff), [])

  const arenaRef = useRef<HTMLDivElement>(null)
  const timerFillRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<(HTMLButtonElement | null)[]>([])

  const flashTimerRef = useRef<number | null>(null)
  const timerFrameRef = useRef<number | null>(null)
  const timerStartedAtRef = useRef(0)
  const timerDurationRef = useRef(0)

  function clearTimers() {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current)
      flashTimerRef.current = null
    }
    if (timerFrameRef.current !== null) {
      window.cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }
    if (timerFillRef.current) {
      timerFillRef.current.style.width = '0%'
    }
  }

  function startTimer(duration: number) {
    timerStartedAtRef.current = performance.now()
    timerDurationRef.current = duration
    if (timerFillRef.current) {
      timerFillRef.current.style.width = '100%'
    }
    const tick = (now: number) => {
      const elapsed = now - timerStartedAtRef.current
      const remaining = Math.max(0, 1 - elapsed / timerDurationRef.current)
      if (timerFillRef.current) {
        timerFillRef.current.style.width = (remaining * 100).toFixed(2) + '%'
      }
      if (remaining > 0 && game.current.phase === 'memorize') {
        timerFrameRef.current = window.requestAnimationFrame(tick)
      }
    }
    timerFrameRef.current = window.requestAnimationFrame(tick)
  }

  function buildRound(): Position[] {
    const arena = arenaRef.current
    if (!arena) return []
    const rect = arena.getBoundingClientRect()
    const width = Math.max(280, rect.width)
    const height = Math.max(320, rect.height)
    const g = game.current
    const size = getCircleSize(g.circleCount, width, height)
    const numbers = shuffle(Array.from({ length: g.circleCount }, (_, i) => i + 1))
    const points = makePositions(g.circleCount, width, height, size)
    return numbers.map((number, index) => ({
      number,
      x: points[index].x,
      y: points[index].y,
      size,
      status: 'idle' as TargetStatus,
    }))
  }

  function enterRecall() {
    const g = game.current
    if (g.phase !== 'memorize') return
    clearTimers()
    g.phase = 'recall'
    g.clickStartedAt = performance.now()
    g.focusedIndex = 0
    render()
    requestAnimationFrame(() => {
      const idx = game.current.focusedIndex
      if (idx !== null) targetRefs.current[idx]?.focus()
    })
  }

  function startRound() {
    clearTimers()
    const g = game.current
    g.phase = 'memorize'
    g.nextExpected = 1
    g.positions = buildRound()
    g.revealed = false
    g.feedback = null
    g.showRoundActions = false
    g.announce = `Round ${g.round}. ${g.circleCount} positions. Memorise where each number appears.`
    render()
    startTimer(g.flashMs)
    flashTimerRef.current = window.setTimeout(() => enterRecall(), g.flashMs)
  }

  function completeRound() {
    const g = game.current
    g.phase = 'feedback'
    const seconds = Math.max(0.1, (performance.now() - g.clickStartedAt) / 1000)
    const speedBonus = Math.max(0, Math.round(g.circleCount * 12 - seconds * 4))
    const roundPoints = g.circleCount * 20 + g.streak * 6 + speedBonus
    g.score += roundPoints
    g.streak += 1
    g.lastOutcome = 'correct'
    g.feedback = { kind: 'good', text: `Correct. +${roundPoints} points.` }
    g.nextRoundLabel = 'Next round'
    g.showRoundActions = true
    g.announce = `Round complete. Plus ${roundPoints} points.`
    render()
  }

  function revealAnswer() {
    const g = game.current
    for (const p of g.positions) {
      p.status = 'miss'
    }
    g.revealed = true
  }

  function handleWrongClick(clickedNumber: number) {
    const g = game.current
    g.phase = 'feedback'
    g.mistakes += 1
    g.streak = 0
    g.lastOutcome = 'wrong'
    revealAnswer()
    g.feedback = {
      kind: 'bad',
      text: `Incorrect. You clicked ${clickedNumber} while looking for ${g.nextExpected}.`,
    }
    g.nextRoundLabel = 'Next attempt'
    g.showRoundActions = true
    g.announce = `Incorrect. You clicked ${clickedNumber} while looking for ${g.nextExpected}.`
    render()
  }

  function findNearestIdle(fromIdx: number): number | null {
    const g = game.current
    const current = g.positions[fromIdx]
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < g.positions.length; i++) {
      if (i === fromIdx) continue
      if (g.positions[i].status !== 'idle') continue
      const d = distance(g.positions[i], current)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best === -1 ? null : best
  }

  function handleTargetClick(idx: number) {
    const g = game.current
    if (g.phase !== 'recall') return
    const pos = g.positions[idx]
    if (!pos || pos.status !== 'idle') return

    if (pos.number !== g.nextExpected) {
      pos.status = 'miss'
      handleWrongClick(pos.number)
      return
    }

    pos.status = 'hit'
    g.nextExpected += 1

    if (g.nextExpected > g.circleCount) {
      completeRound()
    } else {
      const next = findNearestIdle(idx)
      g.focusedIndex = next
      const remaining = g.circleCount - g.nextExpected + 1
      g.announce = `Correct. ${remaining} more to find.`
      render()
      requestAnimationFrame(() => {
        if (next !== null) targetRefs.current[next]?.focus()
      })
    }
  }

  function moveFocus(currentIdx: number, dx: number, dy: number) {
    const g = game.current
    const current = g.positions[currentIdx]
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < g.positions.length; i++) {
      if (i === currentIdx) continue
      if (g.positions[i].status !== 'idle') continue
      const offX = g.positions[i].x - current.x
      const offY = g.positions[i].y - current.y
      if (dx > 0 && offX <= 0) continue
      if (dx < 0 && offX >= 0) continue
      if (dy > 0 && offY <= 0) continue
      if (dy < 0 && offY >= 0) continue
      const d = Math.sqrt(offX * offX + offY * offY)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    if (best !== -1) {
      g.focusedIndex = best
      render()
      requestAnimationFrame(() => targetRefs.current[best]?.focus())
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent, idx: number) {
    const g = game.current
    if (g.phase !== 'recall') return
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        moveFocus(idx, 0, -1)
        break
      case 'ArrowDown':
        e.preventDefault()
        moveFocus(idx, 0, 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(idx, -1, 0)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(idx, 1, 0)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleTargetClick(idx)
        break
    }
  }

  function advanceRound() {
    const g = game.current
    if (g.lastOutcome === 'correct') {
      g.circleCount += 1
      g.flashMs = Math.max(MIN_FLASH_MS, g.flashMs - FLASH_STEP_MS)
    }
    g.round += 1
    startRound()
  }

  function restartRun() {
    clearTimers()
    const fresh = freshState()
    fresh.phase = 'memorize'
    game.current = fresh
    render()
    requestAnimationFrame(() => requestAnimationFrame(() => startRound()))
  }

  function startGame() {
    clearTimers()
    const fresh = freshState()
    fresh.phase = 'memorize'
    game.current = fresh
    render()
    requestAnimationFrame(() => requestAnimationFrame(() => startRound()))
  }

  useEffect(() => {
    const onResize = () => {
      const g = game.current
      if (g.phase === 'memorize' || g.phase === 'recall') {
        startRound()
      }
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const g = game.current
  const phaseLabel =
    g.phase === 'memorize'
      ? 'memorize'
      : g.phase === 'recall'
        ? `recall: click ${g.nextExpected}`
        : g.phase === 'feedback'
          ? g.lastOutcome === 'correct'
            ? 'correct'
            : 'incorrect'
          : 'ready'
  const difficultyLabel = `${g.circleCount} circles - ${(g.flashMs / 1000).toFixed(1)}s flash`

  if (g.phase === 'intro') {
    return (
      <main className="game-page">
        <section className="screen intro-screen">
          <div className="intro-copy">
            <h1>Number Flash</h1>
            <p className="lead">
              Numbers appear briefly. Memorise where each one is, then click the target positions in
              order.
            </p>

            <div className="instructions">
              <h2>How to play</h2>
              <ol>
                <li>Start with 3 numbered circles.</li>
                <li>When the circles disappear, click the blank targets in order: 1, 2, 3.</li>
                <li>Each successful round adds another circle and shortens the flash.</li>
                <li>A wrong click shows the answer and lets you try the next attempt.</li>
              </ol>
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="button" onClick={startGame}>
                Start game
              </button>
              <Link className="btn btn-secondary" to="/">
                Back to menu
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="game-page">
      <section className="screen play-screen" aria-label="Number flash game">
        <div className="game-toolbar">
          <div className="status-grid" aria-label="Game status">
            <div className="stat">
              <span className="stat-value">{g.round}</span>
              <span className="stat-label">round</span>
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
              <span className="stat-value">{g.mistakes}</span>
              <span className="stat-label">mistakes</span>
            </div>
          </div>
          <button className="btn btn-small btn-secondary" type="button" onClick={restartRun}>
            Restart
          </button>
        </div>

        <div className="phase-row">
          <span className="phase-pill">{phaseLabel}</span>
          <span className="phase-detail">{difficultyLabel}</span>
        </div>

        <div className="timer" aria-hidden="true">
          <div ref={timerFillRef} className="timer-fill" />
        </div>

        <div
          ref={arenaRef}
          className="memory-arena"
          aria-label="Memory area. Use arrow keys to move between targets, Enter or Space to select."
        >
          {g.positions.map((pos, idx) => {
            const showCircle = g.phase === 'memorize' || g.revealed
            return (
              <div
                key={idx}
                className={`circle${g.revealed ? ' reveal' : ''}${showCircle ? '' : ' hidden'}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: pos.size,
                  height: pos.size,
                }}
              >
                {pos.number}
              </div>
            )
          })}
          {g.positions.map((pos, idx) => {
            const showTarget = g.phase === 'recall' || (g.phase === 'feedback' && !g.revealed)
            const isFocused = idx === g.focusedIndex && g.phase === 'recall'
            const disabled = pos.status !== 'idle' || g.phase === 'feedback'
            return (
              <button
                key={`t-${idx}`}
                ref={(el) => {
                  targetRefs.current[idx] = el
                }}
                type="button"
                className={`target${pos.status === 'hit' ? ' hit' : ''}${pos.status === 'miss' ? ' miss' : ''}${showTarget ? '' : ' hidden'}${isFocused ? ' focused' : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: pos.size,
                  height: pos.size,
                }}
                tabIndex={isFocused ? 0 : -1}
                disabled={disabled}
                aria-label={`position ${idx + 1} of ${g.positions.length}`}
                onClick={() => handleTargetClick(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              />
            )
          })}
        </div>

        <div
          className={`feedback${g.feedback ? ` ${g.feedback.kind}` : ''}${g.feedback ? '' : ' hidden'}`}
          role="status"
          aria-live="polite"
        >
          {g.feedback?.text}
        </div>

        <div className={`actions centered${g.showRoundActions ? '' : ' hidden'}`}>
          <button className="btn btn-primary" type="button" onClick={advanceRound}>
            {g.nextRoundLabel}
          </button>
          <button className="btn btn-secondary" type="button" onClick={restartRun}>
            Restart run
          </button>
        </div>

        <div className="announce" aria-live="polite">
          {g.announce}
        </div>
      </section>
    </main>
  )
}