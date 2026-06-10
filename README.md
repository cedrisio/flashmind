# flashmind

Browser-based cognitive training games. Vanilla HTML/CSS/JS - no frameworks, no build step.

Open `index.html` to start, or deploy to GitHub Pages as-is.

## games

**Number Flash** (`game1.html`)  
Circles appear briefly on screen. Remember their positions and click them back in numerical order.

**N-Back** (`game2.html`)  
Numbers appear one at a time. Recall what appeared N steps ago. N increases as you improve.

## running

Clone the repo and open `index.html` in a browser. No server required.

For Cloudflare Pages: connect the repo in the Cloudflare dashboard, set build command to blank (none), output directory to `/` (root), and deploy from `main`.

## tech

- Zero dependencies
- No localStorage — scores are session-only (reset when tab closes)
- Mobile-friendly layout
- Works offline once loaded
