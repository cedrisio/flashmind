export function About() {
  return (
    <div className="page about-page">
      <section className="hero">
        <p className="eyebrow">about</p>
        <h1>flashmind</h1>
        <p className="lead">
          A small browser arcade built by Cedris Monteagudo as a public proof-of-work project. It
          focuses on quick game loops, mobile-first interaction, keyboard support, accessible
          feedback, and session-only state.
        </p>
      </section>

      <div className="instructions">
        <h2>What&apos;s here</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>number flash - a memory puzzle. Circles flash, you recall their positions in order.</li>
          <li>echo calc - a number puzzle. Solve equations in your head, type the answer from earlier in the queue.</li>
          <li>color clash - a colour puzzle. A colour word appears in mismatched ink - pick the ink colour, not the word.</li>
          <li>digit rush - a memory puzzle. A digit string flashes, you type it back in reverse. Each correct round adds a digit.</li>
        </ul>
      </div>

      <div className="instructions">
        <h2>How it works</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Everything runs in your browser. No account, no tracking, no saved progress. Built with
          React, Vite, and TypeScript; deployed to Cloudflare Pages. Leaderboards are planned for a
          later phase.
        </p>
      </div>

      <div className="instructions">
        <h2>Project links</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>
            <a href="https://flashmind.cedris.io" style={{ color: 'var(--accent)' }}>
              live site
            </a>
          </li>
          <li>
            <a href="https://github.com/cedrisio/flashmind" style={{ color: 'var(--accent)' }}>
              github repo
            </a>
          </li>
          <li>
            <a href="https://cedr.is" style={{ color: 'var(--accent)' }}>
              Cedris Monteagudo - portfolio
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}