# flashmind

A lightweight browser arcade: four fast games built around memory patterns, colour matching, arithmetic recall, and reverse digit play. Fun-first, mobile-first, session-only. No accounts, no tracking, no saved progress.

Built by Cedris Monteagudo as a public proof-of-work project.

```
live: https://flashmind.cedris.io
source: https://github.com/cedrisio/flashmind
portfolio: https://cedr.is
```

## Games overview

flashmind ships four v1 games. Each one is a short loop you can play in under a minute.

| # | game | route | what it is |
|---|------|-------|------------|
| 01 | number flash | `/play/number-flash` | spatial memory grid |
| 02 | echo calc | `/play/echo-calc` | arithmetic recall with a shifting delay |
| 03 | color clash | `/play/color-clash` | stroop-style colour versus word |
| 04 | digit rush | `/play/digit-rush` | reverse digit span |

## Game rules

### 1. Number flash

Numbered circles flash on a grid, then disappear. Recall their positions in numerical order.

- starts with 3 circles
- flash starts at 2300ms, shortens by 120ms after each successful round, minimum 900ms
- each successful round adds one circle
- wrong click reveals the answer and resets the streak
- after failure, the next attempt keeps the same circle count

### 2. Echo calc

Solve each equation mentally, but enter the answer from earlier in the queue. The delay between what you see and what you type grows as your streak grows.

- echo depth starts at 1
- echo depth increases by 1 every 5-streak
- 3 lives; a wrong answer costs a life and shows the correct answer
- operands are 1-20; subtraction stays positive
- 900ms between equations
- the first echo-depth equations are warmup prompts

### 3. Color clash

A colour word appears rendered in an ink colour. Choose the ink colour, not the word.

- fixed choices: red, blue, green, yellow
- buttons carry their colour name as a text label, so play does not depend on hue alone
- keys 1-4 map to the four choices
- standard mode: 60 seconds. Correct +10. A streak of 5 or more adds a +5 bonus. Wrong resets the streak and costs 2 seconds.
- relaxed mode: 90 seconds, no wrong-answer time penalty

### 4. Digit rush

A digit string flashes briefly, then hides. Type it back in reverse order.

- starts at length 3
- 3 lives; a wrong answer shows the correct answer and costs a life
- each correct answer grows the next string by 1 digit
- failed attempts keep the same length
- leading zeroes are valid

## Scoring

**Number flash:** `round score = circleCount * 20 + streak * 6 + speedBonus`
where `speedBonus = max(0, round(circleCount * 12 - seconds * 4))`

**Echo calc:** `score = highestEchoDepth * 100 + correctTotal`

**Color clash:** `+10` per correct, `+5` bonus on a streak of 5 or more, `-2s` on wrong in standard mode. Final score is accumulated points.

**Digit rush:** `score = highestLength * 100 + correctTotal`

## Controls

### Number flash

Keyboard: arrow keys move the focus ring between targets, Enter or Space selects. Touch: tap the target directly.

### Echo calc and digit rush

Both use the shared on-screen Numpad (see below). Physical keyboard digits, Backspace, and Enter also work.

### Color clash

Keyboard: keys 1-4 map to the four answer buttons (1 = red, 2 = blue, 3 = green, 4 = yellow). Touch: tap the button.

## Accessibility

flashmind is built to be playable by keyboard and readable by assistive tech. What exists:

- every game is keyboard-playable; each has its own keyboard path documented above
- distinct `aria-label`s on game regions, status grids, and interactive targets
- `aria-live` regions announce state changes (score, lives, correct/wrong feedback)
- colour clash buttons are labelled with text, not colour alone, so the game is not hue-dependent
- `prefers-reduced-motion` is respected via a media query that disables transitions and animations
- AA contrast is the target across the interface

### Relaxed modes

Relaxed mode is game-specific, not global. Color clash and digit rush include relaxed timing or penalty changes. Number flash and echo calc do not currently have relaxed variants.

- color clash relaxed: 90 second run, no wrong-answer time penalty
- digit rush relaxed: slower flash (900ms + 450ms per digit instead of 600ms + 300ms)

## Shared Numpad component

`src/components/Numpad.tsx` is a shared on-screen numeric keypad used by echo calc and digit rush.

Why it exists:

- avoids the mobile soft keyboard covering the game area during play
- gives consistent numeric entry on iOS and Android
- provides larger touch targets than a native text field
- preserves physical keyboard support on desktop

Technical notes:

- the display is a focusable `div` with `role="textbox"` and `aria-live`, not a native input
- focusing the display on mobile does not summon the soft keyboard
- supports physical digit keys, Backspace, and Enter
- supports accent variants (echo calc uses blue, digit rush uses amber)
- supports a `maxLength` prop, used by digit rush to cap entry to the current string length

## Mobile-first implementation

flashmind is laid out for phones first.

- base layout targets phone viewports; one breakpoint at `768px` targets tablets and larger
- the breakpoint is a generic CSS px value, not tied to any vendor or device
- play screens are designed to fit a single phone viewport where possible, so the action and entry stay visible without scrolling
- intro and game-over screens scroll normally, since they carry longer instructions and results
- safe-area handling via `env(safe-area-inset-*)` accounts for notches and home indicators
- the viewport uses `viewport-fit=cover` to extend content to the screen edges
- a no-zoom lock (`maximum-scale=1.0, user-scalable=no`) reduces accidental pinch-zoom during play

The no-zoom lock is an intentional tradeoff for game screens, where an accidental pinch-zoom mid-play is disruptive. It is not a universal accessibility best practice.

## Persistence

flashmind stores no progress in `localStorage` or `sessionStorage`. Game state lives in page memory only. Refreshing or closing the tab resets the session.

This is intentional simplicity, not a bug. There are no accounts, no saved scores, and no cross-session state.

## Local development

Requires Node 18+ (tested on Node 24).

```sh
npm install
npm run dev        # dev server on http://localhost:5173
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build, outputs to dist/
```

The dev server starts on http://localhost:5173.

## Verification

flashmind does not ship a test suite. Verification is typecheck and build:

```sh
npm run typecheck  # must report no errors
npm run build      # must complete and emit dist/
```

A banned-copy scan guards public wording:

```sh
grep -RniE "cognitive training|brain training|wellness|exercise|improve your|mental fitness|devilish|N-back|nintendo|brain age|localStorage|sessionStorage" README.md index.html src || true
```

Expected: no matches in README, index.html, or src.

## Cloudflare Pages deployment

flashmind deploys to Cloudflare Pages.

- framework preset: Vite
- build command: `npm run build`
- output directory: `dist`

The old flat-file settings (blank build command, output `/`) applied to the pre-port vanilla version and no longer apply once the React/Vite build is live.

D1-backed leaderboards are phase 2 and not part of the current deploy.

## Phase 2: leaderboards

Leaderboards are planned but not live.

Current status:

- `/scores` is a placeholder
- no backend is wired
- no D1 database is live
- no `/api/scores` endpoint exists
- no account system
- planned name entry is arcade-style (initials, no accounts)
- relaxed and standard scores will be separated when leaderboards ship

## Project status

flashmind is live at https://flashmind.cedris.io with the four v1 games above. The site runs the React/Vite/TypeScript build deployed on Cloudflare Pages. Leaderboards are the next planned phase.

## Stack

- React
- Vite
- TypeScript
- Cloudflare Pages
- Cloudflare D1 (planned for phase 2 leaderboards)

## Credits

Built by Cedris Monteagudo. Source on GitHub, portfolio at cedr.is.