import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

// single source of truth: the version field in package.json, injected at build
// time via vite define (see vite.config.ts). bump with `npm version <ver>` and
// the footer badge + README stay in sync.
const VERSION = __APP_VERSION__

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // close on Escape for keyboard users
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="topbar" aria-label="Main navigation">
        <Link className="brand" to="/">
          flash<span>mind</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="menu-toggle-bar" data-open={menuOpen} aria-hidden="true" />
          <span className="menu-toggle-bar" data-open={menuOpen} aria-hidden="true" />
          <span className="menu-toggle-bar" data-open={menuOpen} aria-hidden="true" />
        </button>
        <div
          id="primary-menu"
          className={`topbar-nav${menuOpen ? ' open' : ''}`}
        >
          <NavLink className="menu-link" to="/" end>
            home
          </NavLink>
          <NavLink className="menu-link" to="/scores">
            scores
          </NavLink>
          <NavLink className="menu-link" to="/about">
            about
          </NavLink>
        </div>
      </nav>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <span className="version-badge" title="mobile-first arcade release">
          {VERSION}
        </span>
        <a
          href="https://github.com/cedrisio/flashmind"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="flashmind on github"
          className="footer-link"
        >
          github
        </a>
        <span aria-hidden="true"> · </span>
        <a
          href="https://cedr.is"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cedris portfolio"
          className="footer-link"
        >
          cedr.is
        </a>
      </footer>
    </>
  )
}