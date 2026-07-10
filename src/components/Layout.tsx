import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { unlockAudio } from '../audio/sound'

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

  // unlock the audio context on the first user gesture (browser autoplay
  // policy). one-shot: once a gesture has been seen we stop listening so we
  // never create a context on load and never log an autoplay warning.
  useEffect(() => {
    const onGesture = () => unlockAudio()
    const opts = { once: true } as AddEventListenerOptions
    window.addEventListener('pointerdown', onGesture, opts)
    window.addEventListener('keydown', onGesture, opts)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="topbar" aria-label="Main navigation">
        <Link className="brand" to="/" aria-label="flashmind - home">
          <img
            src="/branding/flashmind-logo-mark.svg"
            alt=""
            width="22"
            height="22"
            className="brand-mark"
            aria-hidden="true"
          />
          <span className="brand-text">
            flash<span>mind</span>
          </span>
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
            Home
          </NavLink>
          <NavLink className="menu-link" to="/scores">
            Scores
          </NavLink>
          <NavLink className="menu-link" to="/about">
            About
          </NavLink>
        </div>
      </nav>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <span className="version-badge" title="mobile-first arcade release">
          {VERSION}
        </span>
        <nav className="footer-social" aria-label="Project links">
          <a
            href="https://github.com/cedrisio/flashmind"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="flashmind on github"
            className="footer-icon-link"
          >
            <img
              src="/branding/icon-github.svg"
              alt=""
              width="20"
              height="20"
              className="footer-icon"
              aria-hidden="true"
            />
          </a>
          <a
            href="https://cedr.is"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Cedris portfolio (cedr.is)"
            className="footer-icon-link"
          >
            <img
              src="/branding/icon-cedris.svg"
              alt=""
              width="20"
              height="20"
              className="footer-icon"
              aria-hidden="true"
            />
          </a>
        </nav>
      </footer>
    </>
  )
}