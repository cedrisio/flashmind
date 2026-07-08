# flashmind

Quick arcade games for your brain's entertainment - memory, number, and colour puzzles that run entirely in your browser.

Built with React, Vite, and TypeScript. No account, no tracking. Leaderboards coming soon.

## Games

### Number flash (game 01)

Numbered circles appear briefly on screen. After they disappear, click the blank target positions in numerical order (1, 2, 3, ...). Each successful round adds another circle and shortens the flash duration.

Keyboard play: during recall, use arrow keys to move a focus ring between targets (nearest neighbour in the pressed direction), then Enter or Space to select.

### Echo calc (game 02)

Simple addition and subtraction equations (numbers 1-20, results always positive) appear one at a time. Solve each equation mentally but don't enter that answer yet - enter the answer from N equations ago.

At N=1 you answer one behind. At N=2, two behind. N starts at 1 and climbs by 1 every 5 correct answers in a row.

Example at N=1:

```
Show: 3 + 4   -> compute 7 in your head, type nothing
Show: 5 + 2   -> type 7  (answer to 3+4)
Show: 8 - 3   -> type 7  (answer to 5+2)
Show: 6 + 1   -> type 5  (answer to 8-3)
```

Rules:
- 3 lives - a wrong answer costs one life and briefly shows the correct answer
- Every 5 correct answers in a row (streak of 5, 10, 15, ...) increases N by 1
- Game ends at 0 lives
- Score = (highest N reached x 100) + total correct answers

### Color clash (game 03)

A colour word ("red", "blue", "green", "yellow") appears printed in ink that may not match the word. Pick the colour of the ink, not the word itself. About 70% of rounds mismatch the word versus the ink; 30% match, to keep it honest.

Buttons are always shown in a fixed order (red, blue, green, yellow) and each carries its colour name as a label, so the game is not colour-hue dependent and stays open to colourblind players.

Two modes:
- Standard: 60 second run. Correct answer +10. A streak of 5 or more adds a +5 bonus per answer. Wrong answer resets the streak and costs 2 seconds.
- Relaxed: 90 second run. No time penalty on wrong answers.

Keyboard play: keys 1-4 map to the four answer buttons (1=red, 2=blue, 3=green, 4=yellow).

Rules:
- Correct answer: +10 points
- Streak of 5 or more: +5 bonus per correct answer
- Wrong answer resets streak (and costs 2 seconds in standard mode)
- Game ends at 0:00
- Score = final points

### Digit rush (game 04)

A string of digits flashes on screen, then hides. Type it back in reverse order from memory and press Enter to submit. Each correct answer grows the string by one digit for the next round.

Flash duration scales with length: 600ms + 300ms per digit in standard mode, 900ms + 450ms per digit in relaxed mode.

Two modes:
- Standard: faster flash (600ms + 300ms per digit)
- Relaxed: slower flash (900ms + 450ms per digit)

Keyboard play: type the digits in reverse, then Enter to submit. The input is a numeric text field - leading zeros are valid digits here, so "012" shown means you type "210". Type them exactly, last digit first.

Example:

```
You see: 401   -> type 104
You see: 7320  -> type 0237
You see: 09    -> type 90
```

Rules:
- 3 lives - a wrong answer shows the correct answer and costs one life
- Each correct answer grows the string by 1
- Game ends at 0 lives
- Score = (longest chain reached x 100) + total correct answers

## Local development

Requires Node 18+ (tested on Node 24).

```sh
npm install
npm run dev
```

The dev server starts on http://localhost:5173.

Typecheck and build:

```sh
npm run build      # runs tsc -b then vite build, outputs to dist/
npm run typecheck  # tsc -b --noEmit
```

## Deployment (Cloudflare Pages)

**Manual dashboard step for Cedris at deploy time:** the Cloudflare Pages build settings must change from the old flat-file setup. Set:

- Build command: `npm run build`
- Output directory: `dist`

The old settings (blank build command, output `/`) no longer apply once the port is merged.

Do not run `wrangler pages deploy` or any remote-deploy command from this repo without explicit approval - local testing only.

## Technical notes

- React + Vite + TypeScript, single-page app with react-router
- No `localStorage` or `sessionStorage` - all state is in page memory only
- Refreshing or closing the tab resets progress
- Mobile-friendly layout with large touch targets
- Reduced motion is respected via `prefers-reduced-motion`
- D1-backed leaderboards are planned for a later update