/**
 * game1.js — Number Flash
 *
 * State machine:  idle → showing → clicking → (transitioning → showing) | gameover
 *
 * Each round:
 *   1. N numbered circles appear at random non-overlapping positions (SHOWING phase)
 *   2. After X seconds the circles vanish; invisible zones remain (CLICKING phase)
 *   3. Player clicks zones in numerical order 1 → 2 → 3 …
 *   4. All correct → level up, +1 circle, flash time decreases → next round
 *   5. Wrong click → game over
 *
 * Scoring per completed level:
 *   base  = level × 10
 *   speed = max(0, circleCount × 30 − floor(secondsTaken × 8))
 *   total += base + speed
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const CIRCLE_R        = 30;            // radius in px (60 px diameter, good touch target)
const CIRCLE_D        = CIRCLE_R * 2;
const EDGE_PAD        = CIRCLE_R + 14; // keep circles fully inside arena edges
const MIN_DIST        = CIRCLE_D + 16; // minimum center-to-center distance (no overlap)
const MAX_ATTEMPTS    = 400;           // retry budget per circle during placement

const START_COUNT     = 2;             // circles at level 1
const START_FLASH_MS  = 2000;          // flash duration at level 1 (ms)
const FLASH_DEC_MS    = 100;           // ms shaved off per level
const MIN_FLASH_MS    = 500;           // flash time floor (0.5 s)

// ─── Game state ───────────────────────────────────────────────────────────────

/** Return a clean initial state object. */
function freshState() {
  return {
    phase:        'idle',   // idle | showing | clicking | transitioning | gameover
    level:        1,
    circleCount:  START_COUNT,
    flashMs:      START_FLASH_MS,
    circles:      [],       // { num, el, zoneEl }
    nextExpected: 1,        // which number the player should click next
    totalScore:   0,        // accumulated points across levels
    clickStart:   0,        // performance.now() at start of clicking phase (for speed bonus)
    flashTimeout: null,     // setTimeout handle for flash→recall transition
    timerRAF:     null,     // requestAnimationFrame handle for timer bar
  };
}

let G = freshState();

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const screenIntro  = $('screen-intro');
const screenGame   = $('screen-game');
const screenResult = $('screen-result');
const arena        = $('arena');
const phaseLabel   = $('phase-label');
const timerBar     = $('timer-bar');
const timerFill    = $('timer-fill');
const elLevel      = $('stat-level');
const elCount      = $('stat-count');
const elSpeed      = $('stat-speed');
const elScore      = $('stat-score');
const elResultScore = $('result-score');
const elResultBest  = $('result-best');
const elResultMsg   = $('result-msg');

// ─── Screen switching ─────────────────────────────────────────────────────────

function showScreen(name) {
  screenIntro .classList.toggle('hidden', name !== 'intro');
  screenGame  .classList.toggle('hidden', name !== 'game');
  screenResult.classList.toggle('hidden', name !== 'result');
}

// ─── Stats display ────────────────────────────────────────────────────────────

function refreshStats() {
  elLevel.textContent = G.level;
  elCount.textContent = G.circleCount;
  elSpeed.textContent = (G.flashMs / 1000).toFixed(1) + 's';
  elScore.textContent = G.totalScore;
}

// ─── Timer bar ────────────────────────────────────────────────────────────────

/** Animate the timer bar draining over durationMs. Turns red in the last 25%. */
function startTimer(durationMs) {
  timerBar.classList.remove('hidden');
  timerFill.style.width = '100%';
  const t0 = performance.now();

  function tick(now) {
    const pct = Math.max(0, 1 - (now - t0) / durationMs);
    timerFill.style.width      = (pct * 100) + '%';
    timerFill.style.background = pct < 0.25 ? 'var(--error)' : 'var(--accent)';
    if (pct > 0) G.timerRAF = requestAnimationFrame(tick);
  }
  G.timerRAF = requestAnimationFrame(tick);
}

function stopTimer() {
  if (G.timerRAF) { cancelAnimationFrame(G.timerRAF); G.timerRAF = null; }
  timerFill.style.width = '0%';
  timerBar.classList.add('hidden');
}

// ─── Circle placement (collision-aware) ───────────────────────────────────────

/** Pick a random center point within the safe inner bounds of the arena. */
function rndPos(w, h) {
  return {
    x: EDGE_PAD + Math.random() * (w - EDGE_PAD * 2),
    y: EDGE_PAD + Math.random() * (h - EDGE_PAD * 2),
  };
}

/** True if two positions are within the minimum allowed distance. */
function clash(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < MIN_DIST;
}

/**
 * Generate N non-overlapping center positions.
 * Falls back to best available position if MAX_ATTEMPTS is exceeded
 * (prevents infinite loops on very small arenas with many circles).
 */
function genPositions(n, w, h) {
  const placed = [];
  for (let i = 0; i < n; i++) {
    let best, bestClash = Infinity;
    for (let t = 0; t < MAX_ATTEMPTS; t++) {
      const p = rndPos(w, h);
      // find closest existing circle to this candidate
      const minD = placed.reduce((d, q) => Math.min(d, Math.hypot(p.x - q.x, p.y - q.y)), Infinity);
      if (!placed.some(q => clash(p, q))) { best = p; break; } // no overlap → use it
      if (minD > bestClash) { best = p; bestClash = minD; }    // track least-bad option
    }
    placed.push(best);
  }
  return placed;
}

// ─── Build / clear circles ────────────────────────────────────────────────────

function clearArena() {
  arena.querySelectorAll('.circle, .circle-zone').forEach(el => el.remove());
  G.circles = [];
}

/**
 * Populate the arena with n circles at random positions.
 * Numbers 1..n are assigned in random order (position ≠ numerical order).
 */
function buildCircles(n) {
  clearArena();

  const rect  = arena.getBoundingClientRect();
  const w     = rect.width  || window.innerWidth;
  const h     = rect.height || window.innerHeight - 133; // rough fallback
  const positions = genPositions(n, w, h);

  // shuffle which number goes to which position
  const nums = Array.from({ length: n }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5);

  for (let i = 0; i < n; i++) {
    const num  = nums[i];
    const pos  = positions[i];
    const top  = (pos.y - CIRCLE_R) + 'px';
    const left = (pos.x - CIRCLE_R) + 'px';
    const size = CIRCLE_D + 'px';

    // ── visible numbered circle (shown during SHOWING phase) ──────────────────
    const circle = document.createElement('div');
    circle.className = 'circle';
    circle.textContent = num;
    Object.assign(circle.style, { top, left, width: size, height: size });
    arena.appendChild(circle);

    // ── invisible clickable zone (active during CLICKING phase) ───────────────
    const zone = document.createElement('div');
    zone.className = 'circle-zone';
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-label', `position ${num}`);
    Object.assign(zone.style, { top, left, width: size, height: size });
    zone.addEventListener('click', () => onZoneClick(num));
    arena.appendChild(zone);

    G.circles.push({ num, el: circle, zoneEl: zone });
  }
}

// ─── Game phases ──────────────────────────────────────────────────────────────

/** Begin a new round: show circles for flashMs, then enter recall phase. */
function startRound() {
  G.phase        = 'showing';
  G.nextExpected = 1;
  refreshStats();

  buildCircles(G.circleCount);

  // circles visible, zones hidden
  G.circles.forEach(c => {
    c.el.classList.remove('hidden');
    c.zoneEl.classList.add('hidden');
  });

  phaseLabel.textContent = 'memorize';
  phaseLabel.classList.remove('hidden');

  startTimer(G.flashMs);
  G.flashTimeout = setTimeout(enterRecall, G.flashMs);
}

/** Hide circles, reveal clickable zones — player must now recall from memory. */
function enterRecall() {
  if (G.phase !== 'showing') return; // guard against stale timeout
  G.phase      = 'clicking';
  G.clickStart = performance.now();
  stopTimer();

  G.circles.forEach(c => {
    c.el.classList.add('hidden');
    c.zoneEl.classList.remove('hidden');
  });

  phaseLabel.textContent = 'recall';
}

/** Called when the player clicks a zone. */
function onZoneClick(num) {
  if (G.phase !== 'clicking') return;

  if (num === G.nextExpected) {
    // ── correct ───────────────────────────────────────────────────────────────
    const hit = G.circles.find(c => c.num === num);
    hit.zoneEl.classList.add('clicked');
    setTimeout(() => hit.zoneEl.classList.add('hidden'), 280);

    G.nextExpected++;

    if (G.nextExpected > G.circleCount) {
      // all circles found — level complete
      const secs      = (performance.now() - G.clickStart) / 1000;
      const base      = G.level * 10;
      const speed     = Math.max(0, G.circleCount * 30 - Math.floor(secs * 8));
      G.totalScore   += base + speed;
      G.level++;
      G.circleCount++;
      G.flashMs       = Math.max(MIN_FLASH_MS, G.flashMs - FLASH_DEC_MS);
      G.phase         = 'transitioning';
      refreshStats();

      arena.classList.add('flash-ok');
      setTimeout(() => {
        arena.classList.remove('flash-ok');
        startRound();
      }, 550);
    }

  } else {
    // ── wrong ─────────────────────────────────────────────────────────────────
    triggerGameOver();
  }
}

/** End the game: show where circles actually were, then display result screen. */
function triggerGameOver() {
  G.phase = 'gameover';
  clearTimeout(G.flashTimeout);
  stopTimer();

  // ghost all circles so the player can see the correct positions
  G.circles.forEach(c => {
    c.el.classList.remove('hidden');
    c.el.style.opacity = '0.28';
    c.el.style.borderColor = 'var(--error)';
    c.el.style.color = 'var(--error)';
    c.zoneEl.classList.add('hidden');
  });

  arena.classList.add('flash-wrong');
  setTimeout(() => arena.classList.remove('flash-wrong'), 400);

  setTimeout(() => {
    const isNew = FlashmindScores.submit('game1', G.totalScore);
    elResultScore.textContent = G.totalScore;
    elResultBest.textContent  = FlashmindScores.get('game1');
    elResultMsg.textContent   = isNew && G.totalScore > 0
      ? '✦ new session best!'
      : `level ${G.level} · ${G.circleCount - 1} circles`;
    phaseLabel.classList.add('hidden');
    showScreen('result');
  }, 700);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetGame() {
  clearTimeout(G.flashTimeout);
  stopTimer();
  clearArena();
  G = freshState();
}

// ─── Button handlers ──────────────────────────────────────────────────────────

$('btn-start').addEventListener('click', () => {
  showScreen('game');
  // double rAF: ensures arena has final layout dimensions before reading getBoundingClientRect
  requestAnimationFrame(() => requestAnimationFrame(startRound));
});

$('btn-restart').addEventListener('click', () => {
  resetGame();
  showScreen('game');
  requestAnimationFrame(() => requestAnimationFrame(startRound));
});

$('btn-menu-result').addEventListener('click', () => {
  window.location.href = 'index.html';
});
