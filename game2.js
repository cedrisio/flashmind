(function () {
  'use strict';

  var LIVES_START     = 3;
  var STREAK_LEVEL_UP = 5;

  // In-memory score store — no localStorage / sessionStorage
  var scores = { lastScore: 0, lastN: 1 };

  var state = freshState();

  var introScreen    = byId('intro-screen');
  var gameScreen     = byId('game-screen');
  var startBtn       = byId('start-btn');
  var restartBtn     = byId('restart-btn');
  var playAgainBtn   = byId('play-again-btn');
  var eqPanel        = byId('eq-panel');
  var eqDisplay      = byId('eq-display');
  var eqMeta         = byId('eq-meta');
  var ansPanel       = byId('ans-panel');
  var ansInput       = byId('ans-input');
  var submitBtn      = byId('submit-btn');
  var feedbackEl     = byId('feedback');
  var phaseLabel     = byId('phase-label');
  var diffLabel      = byId('difficulty-label');
  var ansPrompt      = byId('ans-prompt');
  var overPanel      = byId('over-panel');
  var finalScoreText = byId('final-score-text');
  var statN          = byId('stat-n');
  var statScore      = byId('stat-score');
  var statStreak     = byId('stat-streak');
  var statLives      = byId('stat-lives');

  function byId(id) { return document.getElementById(id); }

  function freshState() {
    return {
      n:             1,
      lives:         LIVES_START,
      streak:        0,
      correctTotal:  0,
      highestN:      1,
      phase:         'intro',  // 'intro' | 'playing' | 'over'
      history:       [],       // result of each equation in display order (0-indexed)
      equationCount: 0         // how many equations have been shown so far
    };
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeEquation() {
    var a   = randomInt(1, 20);
    var b   = randomInt(1, 20);
    var add = Math.random() < 0.5;
    if (!add && a < b) { var t = a; a = b; b = t; }
    return {
      display: a + (add ? ' + ' : ' - ') + b,
      result:  add ? a + b : a - b
    };
  }

  function livesStr(n) {
    return '♥'.repeat(n) + '♡'.repeat(LIVES_START - n);
  }

  function calcScore() {
    return state.highestN * 100 + state.correctTotal;
  }

  function updateStats() {
    statN.textContent      = state.n;
    statScore.textContent  = calcScore();
    statStreak.textContent = state.streak;
    statLives.textContent  = livesStr(state.lives);
    diffLabel.textContent  = 'N = ' + state.n;
  }

  function setPhase(text) {
    phaseLabel.textContent = text;
  }

  function showFeedback(kind, text) {
    feedbackEl.className = 'feedback ' + kind;
    feedbackEl.textContent = text;
    feedbackEl.classList.remove('hidden');
  }

  function hideFeedback() {
    feedbackEl.classList.add('hidden');
    feedbackEl.textContent = '';
  }

  // Warmup: first N equations — player advances without answering.
  // equationCount is already incremented when this is called.
  function isWarmup() {
    return state.equationCount <= state.n;
  }

  function lockInput() {
    ansInput.disabled  = true;
    submitBtn.disabled = true;
  }

  function showNextEquation() {
    hideFeedback();

    var eq = makeEquation();
    state.history.push(eq.result);
    state.equationCount += 1;

    eqDisplay.textContent = eq.display;
    eqMeta.textContent    = 'solve in your head';
    setPhase('equation ' + state.equationCount);

    if (isWarmup()) {
      var remaining = state.n - state.equationCount;
      ansPrompt.textContent = remaining === 0
        ? 'Next equation — answering begins!'
        : remaining + ' more warmup equation' + (remaining !== 1 ? 's' : '') + ' after this…';
      ansInput.placeholder  = 'press Enter to continue';
      ansInput.value        = '';
      ansInput.disabled     = false;
      submitBtn.textContent = 'Next →';
      submitBtn.disabled    = false;
    } else {
      var nBack  = state.n;
      var eqNum  = state.equationCount - nBack;
      ansPrompt.textContent = 'Enter answer to equation ' + eqNum + ' (N = ' + nBack + ' back)';
      ansInput.placeholder  = 'answer';
      ansInput.value        = '';
      ansInput.disabled     = false;
      submitBtn.textContent = 'Submit';
      submitBtn.disabled    = false;
    }

    ansInput.focus();
    updateStats();
  }

  function handleSubmit() {
    if (state.phase !== 'playing') return;

    // During warmup just advance to the next equation — no answer checked.
    if (isWarmup()) {
      showNextEquation();
      return;
    }

    var raw = ansInput.value.trim();
    if (raw === '') {
      showFeedback('warn', 'Enter a number first.');
      return;
    }
    var typed = parseInt(raw, 10);
    if (isNaN(typed)) {
      showFeedback('warn', 'Enter a whole number.');
      return;
    }

    // history is 0-indexed; answer N steps back from current equation.
    var expected = state.history[state.equationCount - 1 - state.n];

    lockInput();

    if (typed === expected) {
      state.correctTotal += 1;
      state.streak       += 1;

      if (state.streak % STREAK_LEVEL_UP === 0) {
        state.n       += 1;
        state.highestN = Math.max(state.highestN, state.n);
        showFeedback('good', 'Correct! N increases to ' + state.n + ' — keep going!');
      } else {
        showFeedback('good', 'Correct!');
      }
    } else {
      state.lives  -= 1;
      state.streak  = 0;
      showFeedback('bad', 'Wrong — the answer was ' + expected + '.');

      if (state.lives <= 0) {
        endGame();
        return;
      }
    }

    updateStats();
    window.setTimeout(showNextEquation, 900);
  }

  function endGame() {
    state.phase = 'over';

    var finalVal = calcScore();
    scores.lastScore = finalVal;
    scores.lastN     = state.highestN;

    updateStats();
    finalScoreText.textContent =
      'Score: ' + finalVal +
      '  —  highest N: ' + state.highestN +
      ',  correct: ' + state.correctTotal;

    overPanel.classList.remove('hidden');
    eqPanel.classList.add('hidden');
    ansPanel.classList.add('hidden');
    hideFeedback();
    setPhase('game over');
  }

  function startGame() {
    state = freshState();
    state.phase = 'playing';
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    overPanel.classList.add('hidden');
    eqPanel.classList.remove('hidden');
    ansPanel.classList.remove('hidden');
    updateStats();
    showNextEquation();
  }

  function restartGame() {
    state = freshState();
    state.phase = 'playing';
    overPanel.classList.add('hidden');
    eqPanel.classList.remove('hidden');
    ansPanel.classList.remove('hidden');
    hideFeedback();
    updateStats();
    showNextEquation();
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restartGame);
  playAgainBtn.addEventListener('click', restartGame);

  submitBtn.addEventListener('click', handleSubmit);
  ansInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleSubmit();
  });

}());
