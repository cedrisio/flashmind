import { useState } from 'react'
import { isMuted, toggleMuted } from '../audio/sound'

/*
  In-game sound toggle. Visible during play, keyboard-accessible, and exposes
  its toggle state via aria-pressed (pressed = sound is on). Mute state is
  session-only — it lives in the audio module, never in storage — so it
  defaults to sound ON for every visit.

  aria-pressed maps to "sound is on" (the enabled state): the label describes
  the current state, so a screen reader announces "Sound on, pressed" or
  "Sound off, not pressed".
*/

export function MuteButton() {
  const [muted, setMutedState] = useState(isMuted())
  const soundOn = !muted

  return (
    <button
      type="button"
      className="btn btn-small btn-secondary mute-toggle"
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Sound on' : 'Sound off'}
      onClick={() => setMutedState(toggleMuted())}
    >
      {soundOn ? 'Sound on' : 'Sound off'}
    </button>
  )
}