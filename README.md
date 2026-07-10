# Flashmind

A browser arcade of quick puzzle games. No accounts, no installs, no sign-ups - just open a page and play.

Live at https://flashmind.cedris.io

## Games

- **Number Flash** - a grid of numbered circles flashes, then you recall the positions in order.
- **Echo Calc** - solve arithmetic, then answer the equation from a few rounds back as the delay shifts.
- **Color Clash** - the word says one colour, the ink says another. pick the ink, not the word.
- **Digit Rush** - a string of digits flashes, then you type it back from memory.

## Accessibility

Every game is playable from the keyboard:

- Number Flash: arrow keys move focus between targets, Enter or Space selects.
- Echo Calc and Digit Rush: on-screen numpad, or physical digits, Backspace, and Enter.
- Color Clash: keys 1-4 map to the four answer buttons.

Plus aria-live announcements for round changes and scores, a reduced-motion mode, and a relaxed mode with larger targets and slower timing.

## Stack

React 18, Vite 5, TypeScript, Cloudflare Pages.

## Quickstart

Requires Node 18+.

```sh
npm install
npm run dev        # local dev server at http://localhost:5173
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build -> dist/
```

## License

MIT - see [LICENSE](./LICENSE).