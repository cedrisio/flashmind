import { Link } from 'react-router-dom'
import { GAME_LIST } from '../games/config'

const accentClass: Record<string, string> = {
  'number-flash': 'accent-one',
  'echo-calc': 'accent-two',
}

export function Home() {
  return (
    <div className="page home-page">
      <section className="hero">
        <p className="eyebrow">quick arcade games for your brain's entertainment</p>
        <h1>flashmind</h1>
        <p className="lead">Short memory and number puzzles that run entirely in your browser.</p>
      </section>

      <section className="menu-grid" aria-label="Games">
        {GAME_LIST.map((game, index) => (
          <Link
            key={game.id}
            className={`game-card ${accentClass[game.id] ?? ''}`}
            to={`/play/${game.id}`}
          >
            <span className="card-index">game {String(index + 1).padStart(2, '0')}</span>
            <h2>{game.name}</h2>
            {game.id === 'number-flash' && (
              <p>
                Numbered circles flash on screen. Memorise each one's position, then tap the blank
                targets in numerical order.
              </p>
            )}
            {game.id === 'echo-calc' && (
              <p>Solve equations mentally. Enter the answer from N steps ago. N climbs as your streak grows.</p>
            )}
            <span className="card-action">Play {game.name}</span>
          </Link>
        ))}
      </section>

      <p className="privacy-note">No account needed. Leaderboards coming soon.</p>
    </div>
  )
}