import { forwardRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react'

/*
  on-screen numeric numpad. replaces the os soft keyboard for number-entry
  games (echo calc, digit rush) so a) the keyboard never covers half the
  screen on mobile, b) entry is identical on ios and android, and c) non-techie
  players get big finger-sized buttons instead of a fiddly text field.

  the display is a focusable div (not a real input) so focusing it on mobile
  does not summon the soft keyboard, but on desktop / with a bluetooth keyboard
  the physical digit keys, backspace, and enter still work - keyboard
  accessibility is preserved.
*/

export interface NumpadProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  maxLength?: number
  submitLabel?: string
  placeholder?: string
  /** colour theme: 'accent' (amber) or 'blue' (echo calc) */
  accent?: 'accent' | 'blue'
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export const Numpad = forwardRef<HTMLDivElement, NumpadProps>(function Numpad(
  {
    value,
    onChange,
    onSubmit,
    disabled = false,
    maxLength,
    submitLabel = 'Submit',
    placeholder = 'tap the keys',
    accent = 'accent',
  },
  ref,
) {
  const pressDigit = useCallback(
    (d: string) => {
      if (disabled) return
      onChange((maxLength && value.length >= maxLength ? value : value + d).slice(0, maxLength))
    },
    [disabled, maxLength, onChange, value],
  )

  const deleteDigit = useCallback(() => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }, [disabled, onChange, value])

  const onDisplayKey = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        pressDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        deleteDigit()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
    },
    [disabled, pressDigit, deleteDigit, onSubmit],
  )

  const submitClass = accent === 'blue' ? 'numpad-submit' : 'numpad-submit'
  const submitVariant = accent === 'blue' ? 'btn-blue' : 'btn-primary'

  return (
    <div className="numpad-wrap">
      <div
        ref={ref}
        className={`numpad-display${value ? '' : ' empty'}`}
        role="textbox"
        aria-label={`Your answer: ${value || 'empty'}`}
        aria-live="polite"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onDisplayKey}
      >
        {value || placeholder}
      </div>

      <div className="numpad" role="group" aria-label="Number pad">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="numpad-key"
            disabled={disabled}
            onClick={() => pressDigit(k)}
            aria-label={`Digit ${k}`}
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          className="numpad-key numpad-delete"
          disabled={disabled || value.length === 0}
          onClick={deleteDigit}
          aria-label="Delete last digit"
        >
          ⌫
        </button>
        <button
          type="button"
          className="numpad-key"
          disabled={disabled}
          onClick={() => pressDigit('0')}
          aria-label="Digit 0"
        >
          0
        </button>
        <button
          type="button"
          className={`numpad-key ${submitClass} ${submitVariant}`}
          disabled={disabled}
          onClick={onSubmit}
          aria-label={submitLabel}
        >
          {submitLabel === 'Submit' ? '✓' : submitLabel}
        </button>
      </div>
    </div>
  )
})