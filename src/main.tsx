import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { SessionBestsProvider } from './session/sessionBests'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionBestsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SessionBestsProvider>
  </StrictMode>,
)