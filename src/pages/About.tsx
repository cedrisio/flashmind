export function About() {
  return (
    <div className="page about-page">
      <section className="hero">
        <img
          src="/branding/flashmind-logo-stacked.svg"
          alt="Flashmind logo"
          width="140"
          height="140"
          className="about-logo"
        />
        <h1>Flashmind</h1>
        <p className="eyebrow tagline">Quick browser arcade games</p>
        <p className="lead flavour">Memory, numbers, colour, and recall - no accounts, just play.</p>
      </section>

      <div className="instructions">
        <h2>What&apos;s here</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>Number Flash - circles flash, you recall their positions in order.</li>
          <li>Echo Calc - solve equations, type the answer from earlier in the queue.</li>
          <li>Color Clash - a colour word in mismatched ink - pick the ink colour.</li>
          <li>Digit Rush - a digit string flashes, you type it back in reverse.</li>
        </ul>
      </div>

      <div className="instructions">
        <h2>How it works</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Everything runs in your browser. No account, no tracking, no saved progress.
          Leaderboards are the next planned phase.
        </p>
      </div>

      <div className="instructions">
        <h2>Built by</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          <a href="https://cedr.is" style={{ color: 'var(--accent)' }}>Cedris</a>{' '}
          - source on{' '}
          <a href="https://github.com/cedrisio/flashmind" style={{ color: 'var(--accent)' }}>GitHub</a>.
        </p>
      </div>
    </div>
  )
}