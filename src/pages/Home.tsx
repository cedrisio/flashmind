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
    'Solve equations mentally. Enter the answer from N steps ago. N climbs as your streak grows.',
  'color-clash':
    'A colour word appears in ink that may not match. Pick the ink colour, not the word. 60 second sprint with streak bonuses.',
  'digit-rush':
    'A digit string flashes, then hides. Type it back in reverse order. Each correct round grows the string by one digit.',
}

export function Home() {
  return (
    <div className="page home-page">
      <section className="hero">
        <p className="eyebrow">quick arcade games for your brain's entertainment</p>
        <h1>flashmind</h1>
        <p className="lead">Short memory, number, and colour puzzles that run entirely in your browser.</p>
      </section>

      <section className="menu-grid menu-grid-four" aria-label="Games">
        {GAME_LIST.map((game, index) => (
          <Link
            key={game.id}
            className={`game-card ${accentClass[game.id] ?? ''}`}
            to={`/play/${game.id}`}
          >
            <span className="card-index">game {String(index + 1).padStart(2, '0')}</span>
            <h2>{game.name}</h2>
            <p>{descriptions[game.id]}</p>
            <span className="card-action">Play {game.name}</span>
          </Link>
        ))}
      </section>

      <p className="privacy-note">No account needed. Leaderboards coming soon.</p>
    </div>
  )
}