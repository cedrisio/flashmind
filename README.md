# Flashmind

Quick browser arcade games - memory, numbers, colour, and recall. No accounts, just play.

```
live: https://flashmind.cedris.io
source: https://github.com/cedrisio/flashmind
```

**v1.0.0 - mobile-first arcade release**

## Games

| # | Game | Route | Description |
|---|------|-------|-------------|
| 01 | Number Flash | `/play/number-flash` | Spatial memory grid |
| 02 | Echo Calc | `/play/echo-calc` | Arithmetic recall with a shifting delay |
| 03 | Color Clash | `/play/color-clash` | Colour versus word |
| 04 | Digit Rush | `/play/digit-rush` | Reverse digit span |

## Controls

- Number Flash: arrow keys move focus between targets, Enter or Space selects. Tap targets on touch.
- Echo Calc and Digit Rush: on-screen numpad, or physical digits, Backspace, and Enter.
- Color Clash: keys 1-4 map to the four answer buttons, or tap.

## Local dev

Requires Node 18+.

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build -> dist/
```

## Deployment

Cloudflare Pages, Vite preset. Build command `npm run build`, output `dist`.

Leaderboards are the next planned phase; `/scores` is a placeholder.

## Project status

Live at https://flashmind.cedris.io with the four v1 games above.

## Stack

React, Vite, TypeScript, Cloudflare Pages.