(function () {
  'use strict';

  var LIVES_START = 3;
  var STREAK_TO_LEVEL_UP = 5;

  var scores = { lastScore: 0, highestN: 1 };

  var state = freshState();

  var introScreen = byId('intro-screen');
  var gameScreen = byId('game-screen');
  var startButton = byId('start-button');
  var restartButton = byId('restart-button');
  var playAgainButton = byId('play-again-button');
  var equationDisplay = byId('equation-display');
  var equationMeta = byId('equation-meta');
  var answerInput = byId('answer-input');
  var submitButton = byId('submit-button');
  var feedback = byId('feedback');
  var phaseLabel = byId('phase-label');
  var difficultyLabel = byId('difficulty-label');
  var answerPrompt = byId('answer-prompt');
  var gameOverPanel = byId('game-over-panel');
  var finalScoreText = byId('final-score-text');
  var nValue = byId('n-value');
  var scoreValue = byId('score-value');
  var streakValue = byId('streak-value');
  var livesValue = byId('lives-value');

  function byId(id) {
    return document.getElementById(id);
  }

  function freshState() {
    return {
      n: 1,
      lives: LIVES_START,
      score: 0,
      streak: 0,
      correctTotal: 0,
      highestN: 1,
      phase: 'intro',
      history: [],
      equationCount: 0
    };
  }

  function makeEquation() {
    var a = randomInt(1, 20);
    var b = randomInt(1, 20);
    var useAdd = Math.random() < 0.5;
    if (!useAdd && a < b) {
      var tmp = a; a = b; b = tmp;
    }
    var op = useAdd ? '+' : '-';
    var result = useAdd ? a + b : a - b;
    return { display: a + ' ' + op + ' ' + b, result: result };
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function livesString(n) {
    return '♥'.repeat(n) + '♡'.repeat(LIVES_START - n);
  }

  function updateStats() {
    nValue.textContent = state.n;
    scoreValue.textContent = state.score;
    streakValue.textContent = state.streak;
    livesValue.textContent = livesString(state.lives);
    difficultyLabel.textContent = 'N = ' + state.n;
  }

  function setPhase(text) {
    phaseLabel.textContent = text;
  }

  function showFeedback(kind, text) {
    feedback.className = 'feedback ' + kind;
    feedback.textContent = text;
    feedback.classList.remove('hidden');
  }

  function hideFeedback() {
    feedback.classList.add('hidden');
  }

  function canAnswer() {
    return state.equationCount > state.n;
  }

  function showNextEquation() {
    hideFeedback();
    var eq = makeEquation();
    state.history.push(eq.result);
    state.equationCount += 1;

    equationDisplay.textContent = eq.display;
    equationMeta.textContent = 'solve in your head';
    setPhase('equation ' + state.equationCount);

    if (canAnswer()) {
      var nBack = state.n;
      answerPrompt.textContent = 'Enter answer to equation ' + (state.equationCount - nBack) + ' (N=' + nBack + ' back)';
      answerInput.disabled = false;
      submitButton.disabled = false;
      answerInput.value = '';
      answerInput.focus();
    } else {
      var remaining = state.n - state.equationCount + 1;
      answerPrompt.textContent = remaining > 1
        ? (remaining - 1) + ' more equations before you start answering…'
        : 'Next equation — start answering!';
      answerInput.disabled = true;
      submitButton.disabled = true;
      answerInput.value = '';
    }

    updateStats();
  }

  function handleSubmit() {
    if (!canAnswer() || state.phase !== 'playing') {
      return;
    }

    var raw = answerInput.value.trim();
    if (raw === '') {
      showFeedback('warn', 'Enter a number first.');
      return;
    }

    var typed = parseInt(raw, 10);
    if (isNaN(typed)) {
      showFeedback('warn', 'Enter a whole number.');
      return;
    }

    var expectedIndex = state.history.length - 1 - state.n;
    var expected = state.history[expectedIndex];

    if (typed === expected) {
      state.correctTotal += 1;
      state.streak += 1;
      state.score += 10;

      if (state.streak > 0 && state.streak % STREAK_TO_LEVEL_UP === 0) {
        state.n += 1;
        state.highestN = Math.max(state.highestN, state.n);
        showFeedback('good', 'Correct! N increases to ' + state.n + '.');
      } else {
        showFeedback('good', 'Correct!');
      }
    } else {
      state.lives -= 1;
      state.streak = 0;
      showFeedback('bad', 'Wrong — the answer was ' + expected + '.');

      if (state.lives <= 0) {
        endGame();
        return;
      }
    }

    updateStats();

    window.setTimeout(function () {
      showNextEquation();
    }, 900);
  }

  function endGame() {
    state.phase = 'over';
    var finalScore = state.highestN * 100 + state.correctTotal;
    state.score = finalScore;
    scores.lastScore = finalScore;
    scores.highestN = state.highestN;

    scoreValue.textContent = finalScore;
    finalScoreText.textContent = 'Score: ' + finalScore + '  (highest N: ' + state.highestN + ', correct: ' + state.correctTotal + ')';
    gameOverPanel.classList.remove('hidden');
    byId('equation-panel').classList.add('hidden');
    byId('answer-panel').classList.add('hidden');
    hideFeedback();
    setPhase('game over');
  }

  function startGame() {
    state = freshState();
    state.phase = 'playing';
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverPanel.classList.add('hidden');
    byId('equation-panel').classList.remove('hidden');
    byId('answer-panel').classList.remove('hidden');
    updateStats();
    showNextEquation();
  }

  function restartGame() {
    state = freshState();
    state.phase = 'playing';
    gameOverPanel.classList.add('hidden');
    byId('equation-panel').classList.remove('hidden');
    byId('answer-panel').classList.remove('hidden');
    hideFeedback();
    updateStats();
    showNextEquation();
  }

  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', restartGame);
  playAgainButton.addEventListener('click', restartGame);

  submitButton.addEventListener('click', handleSubmit);
  answerInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });
}());
