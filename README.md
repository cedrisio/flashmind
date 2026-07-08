# flashmind

quick browser arcade games - memory, numbers, colour, and recall. no accounts, just play.

```
live: https://flashmind.cedris.io
source: https://github.com/cedrisio/flashmind
```

**v1.0.0 - mobile-first arcade release**

## games

| # | game | route | what it is |
|---|------|-------|------------|
| 01 | number flash | `/play/number-flash` | spatial memory grid |
| 02 | echo calc | `/play/echo-calc` | arithmetic recall with a shifting delay |
| 03 | color clash | `/play/color-clash` | colour versus word |
| 04 | digit rush | `/play/digit-rush` | reverse digit span |

## controls

- number flash: arrow keys move focus between targets, Enter or Space selects. tap targets on touch.
- echo calc and digit rush: on-screen numpad, or physical digits, Backspace, and Enter.
- color clash: keys 1-4 map to the four answer buttons, or tap.

## local dev

requires Node 18+.

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build -> dist/
```

## deployment

cloudflare pages, vite preset. build command `npm run build`, output `dist`.

leaderboards are the next planned phase; `/scores` is a placeholder.

## project status

live at https://flashmind.cedris.io with the four v1 games above.

branch workflow is documented in [`docs/BRANCHING.md`](docs/BRANCHING.md).

## stack

react, vite, typescript, cloudflare pages.