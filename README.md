# flashmind

Small browser-based cognitive training games built with vanilla HTML, CSS, and JavaScript.

Open `index.html` directly in a browser to play. No build step, no framework, no dependencies, no external assets.

## Games

### Number flash (game 01)

Numbered circles appear briefly on screen. After they disappear, click the blank target positions in numerical order (1, 2, 3, …). Each successful round adds another circle and shortens the flash duration.

### Devilish calc (game 02)

Simple addition and subtraction equations (numbers 1–20, results always positive) appear one at a time. Solve each equation mentally but don't enter that answer yet — enter the answer from N equations ago.

At N=1 you answer one behind. At N=2, two behind.

Example at N=1:

```
Show: 3 + 4   → compute 7 in your head, type nothing
Show: 5 + 2   → type 7  (answer to 3+4)
Show: 8 − 3   → type 7  (answer to 5+2)
Show: 6 + 1   → type 5  (answer to 8−3)
```

Rules:
- 3 lives — a wrong answer costs one life and briefly shows the correct answer
- Every 5 correct answers in a row (streak of 5, 10, 15, …) increases N by 1
- Game ends at 0 lives
- Score = (highest N reached × 100) + total correct answers — starts at 100 because N begins at 1; increases as N rises

## Running

Open `index.html` in a browser. No server required.

## Deployment

Deploy as-is to Cloudflare Pages. Leave the build command blank and set the output directory to `/`.

## Technical notes

- Vanilla HTML, CSS, and JavaScript only
- No build step, no dependencies
- No `localStorage` or `sessionStorage` — all state is in page memory only
- Refreshing or closing the tab resets progress
- Mobile-friendly layout with large touch targets
- Flat file structure: all files at root
