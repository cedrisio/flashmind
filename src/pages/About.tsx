export function About() {
  return (
    <div className="page about-page">
      <section className="hero">
        <h1>flashmind</h1>
        <p className="eyebrow tagline">quick browser arcade games</p>
        <p className="lead">memory, numbers, colour, and recall - no accounts, just play.</p>
      </section>

      <div className="instructions">
        <h2>what&apos;s here</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>number flash - circles flash, you recall their positions in order.</li>
          <li>echo calc - solve equations, type the answer from earlier in the queue.</li>
          <li>color clash - a colour word in mismatched ink - pick the ink colour.</li>
          <li>digit rush - a digit string flashes, you type it back in reverse.</li>
        </ul>
      </div>

      <div className="instructions">
        <h2>how it works</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          everything runs in your browser. no account, no tracking, no saved progress.
          leaderboards are the next planned phase.
        </p>
      </div>

      <div className="instructions">
        <h2>built by</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          <a href="https://cedr.is" style={{ color: 'var(--accent)' }}>Cedris</a>{' '}
          - source on{' '}
          <a href="https://github.com/cedrisio/flashmind" style={{ color: 'var(--accent)' }}>github</a>.
        </p>
      </div>
    </div>
  )
}