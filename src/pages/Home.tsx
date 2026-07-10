import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GAME_LIST, type GameId } from '../games/config'

const accentClass: Record<GameId, string> = {
  'number-flash': 'accent-one',
  'echo-calc': 'accent-two',
  'color-clash': 'accent-three',
  'digit-rush': 'accent-four',
}

const descriptions: Record<GameId, string> = {
  'number-flash':
    "Numbered circles flash on screen. Memorise each one's position, then tap the blank targets in numerical order.",
  'echo-calc':
    'Solve equations mentally. Enter the answer from earlier in the queue. The echo depth grows as your streak builds.',
  'color-clash':
    'A colour word appears in ink that may not match. Pick the ink colour, not the word. 60 second sprint with streak bonuses.',
  'digit-rush':
    'A digit string flashes, then hides. Type it back in reverse order. Each correct round grows the string by one digit.',
}

const AUTOPLAY_MS = 4500

export function Home() {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const pauseAutoplayTimer = useRef<number | null>(null)

  function scrollToIndex(index: number) {
    const track = trackRef.current
    if (!track) return
    const child = track.children[index] as HTMLElement | undefined
    if (child) {
      track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: 'smooth' })
    }
  }

  function go(delta: number) {
    setActive((prev) => {
      const next = (prev + delta + GAME_LIST.length) % GAME_LIST.length
      scrollToIndex(next)
      return next
    })
  }

  function selectCard(index: number) {
    setActive(index)
    scrollToIndex(index)
  }

  // pause autoplay on any pointer/keyboard interaction, resume after 6s idle
  function pauseAutoplay() {
    pausedRef.current = true
    if (pauseAutoplayTimer.current !== null) {
      window.clearTimeout(pauseAutoplayTimer.current)
    }
    pauseAutoplayTimer.current = window.setTimeout(() => {
      pausedRef.current = false
    }, 6000)
  }

  // autoplay, pauses on user interaction, resumes when idle
  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return
      setActive((prev) => {
        const next = (prev + 1) % GAME_LIST.length
        scrollToIndex(next)
        return next
      })
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [])

  // keep active index in sync with manual scroll position
  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    const children = Array.from(track.children) as HTMLElement[]
    let nearest = 0
    let nearestDist = Infinity
    for (let i = 0; i < children.length; i++) {
      const dist = Math.abs(children[i].offsetLeft - track.offsetLeft - track.scrollLeft)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    }
    setActive(nearest)
  }

  return (
    <div className="page home-page">
      <section className="hero">
        <h1 className="title-lockup"><span className="title-flash">Flash</span>mind</h1>
        <p className="eyebrow tagline">Quick browser arcade games</p>
        <p className="lead flavour">Memory, numbers, colour, and recall - no accounts, just play.</p>
      </section>

      {/* desktop/tablet: grid; mobile: horizontal snap carousel */}
      <section
        className="menu-grid menu-grid-four"
        aria-label="Games"
      >
        {GAME_LIST.map((game) => (
          <Link
            key={game.id}
            className={`game-card ${accentClass[game.id] ?? ''}`}
            to={`/play/${game.id}`}
          >
            <h2>{game.name}</h2>
            <p>{descriptions[game.id]}</p>
            <span className="card-action">Play {game.name}</span>
          </Link>
        ))}
      </section>

      {/* mobile carousel */}
      <section
        className="carousel"
        aria-label="Games carousel"
        onMouseDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        onKeyDown={pauseAutoplay}
      >
        <button
          type="button"
          className="carousel-arrow carousel-prev"
          aria-label="Previous game"
          onClick={() => {
            pauseAutoplay()
            go(-1)
          }}
        >
          ‹
        </button>
        <div
          ref={trackRef}
          className="carousel-track"
          onScroll={handleScroll}
          role="list"
        >
          {GAME_LIST.map((game) => (
            <Link
              key={game.id}
              className={`game-card carousel-card ${accentClass[game.id] ?? ''}`}
              to={`/play/${game.id}`}
              role="listitem"
              aria-label={game.name}
              onClick={() => pauseAutoplay()}
            >
              <h2>{game.name}</h2>
              <p>{descriptions[game.id]}</p>
              <span className="card-action">Play {game.name}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="carousel-arrow carousel-next"
          aria-label="Next game"
          onClick={() => {
            pauseAutoplay()
            go(1)
          }}
        >
          ›
        </button>

        <div className="carousel-dots" role="tablist" aria-label="Choose game">
          {GAME_LIST.map((game, index) => (
            <button
              key={game.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`${game.name} - slide ${index + 1} of ${GAME_LIST.length}`}
              className={`carousel-dot${index === active ? ' active' : ''}`}
              onClick={() => {
                pauseAutoplay()
                selectCard(index)
              }}
            />
          ))}
        </div>
      </section>

      <p className="privacy-note flavour">No account needed - leaderboards coming soon.</p>
    </div>
  )
}