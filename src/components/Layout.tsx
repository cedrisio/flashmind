import { type ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="topbar" aria-label="Main navigation">
        <Link className="brand" to="/">
          flash<span>mind</span>
        </Link>
        <div className="topbar-nav">
          <NavLink className="menu-link" to="/">
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
    </>
  )
}