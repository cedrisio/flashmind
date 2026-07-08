# flashmind

Quick arcade games for your brain's entertainment - memory and number puzzles that run entirely in your browser.

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