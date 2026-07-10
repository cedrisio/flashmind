# flashmind branding

logo and graphics assets for flashmind - a small browser arcade at flashmind.cedris.io.

this directory holds the logo system. assets are local-only (not yet wired
into site routes or favicon). see `AGENTS.md` for the branch + release flow.

## direction

**memory-grid mark + lowercase wordmark.**

the mark is a 2x2 rounded grid with one cell "lit" (solid accent gold), the
others muted. it ties to the spatial-memory game (number flash) and echoes
the site's dot-grid background.

two lit-cell positions were explored:

- **top-left lit** (baseline, `flashmind-logo-mark.svg`) - reads as "the answer is here"
- **top-right lit** (chosen, `flashmind-logo-mark-tr.svg`) - reads as "the one flashing now", leaves the reading-start position open

**chosen final: top-right lit.** rationale: a top-right flash better matches
a memory game (the cell that's active right now) and leaves the top-left
reading-start position open, which feels less like a revealed answer.

## file manifest

present in this repo (reproducible SVG, site palette):

| file | description |
|---|---|
| `flashmind-logo.svg` | primary lockup - mark (top-left lit) + monospace wordmark |
| `flashmind-logo-stacked.svg` | mark over wordmark, square / social-card placement |
| `flashmind-logo-wordmark.svg` | wordmark only, tight nav/footer |
| `flashmind-logo-mark.svg` | mark only, top-left lit (baseline) |
| `flashmind-logo-mark-mono.svg` | one-colour currentColor mark, top-left lit |
| `flashmind-logo-mark-tr.svg` | mark only, top-right lit - **chosen direction favicon source** |
| `flashmind-logo-mark-tr-mono.svg` | one-colour currentColor mark, top-right lit |
| `preview.html` | local preview on the site background |
| `README.md` | this file |

pending (from the alt direction, to place during the favicon/integration pass):

- claude's sans-serif proportional wordmark lockup (top-right lit) - preferred
  wordmark over the monospace baseline. needs the source file for faithful font
  reproduction; for production, outline the font to paths or embed a web font
  so it renders identically everywhere.
- claude's dot-on-i wordmark variant - wordmark with a small gold square
  replacing the `i` dot. smart brand-cue variant to carry into the wordmark-only
  placement.

source location of the alt set (operator-provided, outside the repo): the
operator holds these locally; place the preferred ones into this directory
during the integration pass and rename to match the manifest convention.

## palette

lifted directly from `src/styles.css`. no new colours introduced.

| token | hex | use |
|---|---|---|
| `--bg` | `#080b0f` | background |
| `--surface` | `#111821` | panels |
| `--accent` | `#f2b84b` | lit cell (flash) |
| `--accent-strong` | `#ffd27a` | accent hover |
| `--text` | `#edf2f7` | wordmark |
| `--muted` | `#93a4b5` | unlit cells |

the wordmark uses `flash` (gold) + `mind` (text-white) in the baseline lockup,
matching the existing topbar brand treatment (`flash<span>mind</span>`).

## rejected direction

**lightning bolt** (from the alt set): a single gold squircle with a black
lightning bolt inside. rejected because:

- unrelated to the grid mark - two different symbols in one brand set, no family
- gold squircle + black bolt is the generic "flash / energy / power" glyph
  (battery, quick-settings). reads as generic AI-slop adjacent, exactly what
  the brief said to avoid.

## usage

- **dark background** (site `#080b0f`): primary lockup or mark
- **favicon / below ~24px height**: mark only - `flashmind-logo-mark-tr.svg`
- **one-colour context**: `flashmind-logo-mark-tr-mono.svg` via `currentColor`.
  must be **inlined in the DOM** - an `<img>` tag isolates the SVG's own
  context and `currentColor` will not inherit the html element's `color`.
- **full lockup readability**: legible down to ~24px height; below that use
  the mark alone

## verification (this pass)

- all SVGs well-formed (xml parse)
- `npm run typecheck` - pass
- `npm run build` - pass (assets copied to `dist/branding/`)
- render: `preview.html` verified in-browser on the site background `#080b0f`

## follow-up (not done in this pass)

separate task, new feature branch from `staging`:

1. **favicon**: ship `flashmind-logo-mark-tr.svg` as `public/favicon.svg`,
   add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` to `index.html`
2. **topbar**: swap the `flash<span>mind</span>` text for the chosen lockup,
   or keep the text and prefix the mark
3. **png fallback**: no rasterizer installed locally; install `resvg-js` or
   `sharp` for automated PNG export at 16/32/48px
4. **wordmark font**: adopt claude's sans-serif wordmark as the preferred
   wordmark; outline to paths or embed a web font for identical rendering
5. **dot-on-i variant**: carry claude's gold-square `i` dot into the
   wordmark-only placement as the brand cue