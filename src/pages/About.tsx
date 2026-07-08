export function About() {
  return (
    <div className="page about-page">
      <section className="hero">
        <p className="eyebrow">about</p>
        <h1>flashmind</h1>
        <p className="lead">A handful of quick arcade puzzles built to be fast, free, and browser-only.</p>
      </section>

      <div className="instructions">
        <h2>What's here</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>number flash - a memory puzzle. Circles flash, you recall their positions in order.</li>
          <li>echo calc - a number puzzle. Solve equations in your head, type the answer from N steps back.</li>
        </ul>
      </div>

      <div className="instructions">
        <h2>How it works</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Everything runs in your browser. No account, no tracking. Built with React, Vite, and
          TypeScript; deployed to Cloudflare Pages.
        </p>
      </div>
    </div>
  )
}