(function () {
  'use strict';

  var START_CIRCLES = 3;
  var START_FLASH_MS = 2300;
  var MIN_FLASH_MS = 900;
  var FLASH_STEP_MS = 120;
  var MAX_PLACEMENT_ATTEMPTS = 700;

  var state = freshState();
  var flashTimer = null;
  var timerFrame = null;
  var timerStartedAt = 0;
  var timerDuration = 0;
  var lastOutcome = 'correct';

  var introScreen = byId('intro-screen');
  var gameScreen = byId('game-screen');
  var startButton = byId('start-button');
  var restartButton = byId('restart-button');
  var restartRunButton = byId('restart-run-button');
  var nextRoundButton = byId('next-round-button');
  var roundActions = byId('round-actions');
  var arena = byId('arena');
  var feedback = byId('feedback');
  var phaseLabel = byId('phase-label');
  var difficultyLabel = byId('difficulty-label');
  var timerFill = byId('timer-fill');
  var roundValue = byId('round-value');
  var scoreValue = byId('score-value');
  var streakValue = byId('streak-value');
  var mistakesValue = byId('mistakes-value');

  function byId(id) {
    return document.getElementById(id);
  }

  function freshState() {
    return {
      phase: 'intro',
      round: 1,
      score: 0,
      streak: 0,
      mistakes: 0,
      circleCount: START_CIRCLES,
      flashMs: START_FLASH_MS,
      nextExpected: 1,
      positions: [],
      clickStartedAt: 0
    };
  }

  function showGame() {
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
  }

  function updateStats() {
    roundValue.textContent = state.round;
    scoreValue.textContent = state.score;
    streakValue.textContent = state.streak;
    mistakesValue.textContent = state.mistakes;
    difficultyLabel.textContent = state.circleCount + ' circles - ' + (state.flashMs / 1000).toFixed(1) + 's flash';
  }

  function setPhase(text) {
    phaseLabel.textContent = text;
  }

  function setFeedback(kind, html) {
    feedback.className = 'feedback ' + kind;
    feedback.innerHTML = html;
    feedback.classList.remove('hidden');
  }

  function hideFeedback() {
    feedback.classList.add('hidden');
    feedback.textContent = '';
  }

  function clearTimers() {
    if (flashTimer !== null) {
      window.clearTimeout(flashTimer);
      flashTimer = null;
    }
    if (timerFrame !== null) {
      window.cancelAnimationFrame(timerFrame);
      timerFrame = null;
    }
    timerFill.style.width = '0%';
  }

  function startTimer(duration) {
    timerStartedAt = performance.now();
    timerDuration = duration;
    timerFill.style.width = '100%';

    function tick(now) {
      var elapsed = now - timerStartedAt;
      var remaining = Math.max(0, 1 - elapsed / timerDuration);
      timerFill.style.width = (remaining * 100).toFixed(2) + '%';
      if (remaining > 0 && state.phase === 'memorize') {
        timerFrame = window.requestAnimationFrame(tick);
      }
    }

    timerFrame = window.requestAnimationFrame(tick);
  }

  function clearArena() {
    arena.textContent = '';
  }

  function getCircleSize(count, width, height) {
    var base = width < 480 ? 52 : 58;
    if (count <= 8) {
      return base;
    }
    var areaSize = Math.floor(Math.sqrt((width * height) / (count * 2.2)));
    return Math.max(44, Math.min(base, areaSize));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function makePositions(count, width, height, size) {
    var positions = [];
    var radius = size / 2;
    var padding = radius + 12;
    var minDistance = size + 12;

    for (var i = 0; i < count; i += 1) {
      var chosen = null;
      var best = null;
      var bestDistance = -1;

      for (var attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt += 1) {
        var candidate = {
          x: randomBetween(padding, Math.max(padding, width - padding)),
          y: randomBetween(padding, Math.max(padding, height - padding))
        };

        var closest = positions.reduce(function (smallest, point) {
          return Math.min(smallest, distance(candidate, point));
        }, Infinity);

        if (closest >= minDistance) {
          chosen = candidate;
          break;
        }

        if (closest > bestDistance) {
          bestDistance = closest;
          best = candidate;
        }
      }

      positions.push(chosen || best || { x: padding, y: padding });
    }

    return positions;
  }

  function shuffle(values) {
    var copy = values.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function buildRound() {
    clearArena();

    var rect = arena.getBoundingClientRect();
    var width = Math.max(280, rect.width);
    var height = Math.max(320, rect.height);
    var size = getCircleSize(state.circleCount, width, height);
    var numbers = shuffle(Array.from({ length: state.circleCount }, function (_, index) {
      return index + 1;
    }));
    var positions = makePositions(state.circleCount, width, height, size);

    state.positions = [];

    numbers.forEach(function (number, index) {
      var point = positions[index];
      state.positions.push({ number: number, x: point.x, y: point.y, size: size });

      var circle = document.createElement('div');
      circle.className = 'circle';
      circle.textContent = number;
      circle.style.left = point.x + 'px';
      circle.style.top = point.y + 'px';
      circle.style.width = size + 'px';
      circle.style.height = size + 'px';
      arena.appendChild(circle);

      var target = document.createElement('button');
      target.className = 'target hidden';
      target.type = 'button';
      target.setAttribute('aria-label', 'Remembered position');
      target.style.left = point.x + 'px';
      target.style.top = point.y + 'px';
      target.style.width = size + 'px';
      target.style.height = size + 'px';
      target.addEventListener('click', function () {
        handleTargetClick(number, target);
      });
      arena.appendChild(target);
    });
  }

  function startRound() {
    clearTimers();
    hideFeedback();
    roundActions.classList.add('hidden');
    state.phase = 'memorize';
    state.nextExpected = 1;
    updateStats();
    setPhase('memorize');
    buildRound();
    startTimer(state.flashMs);

    flashTimer = window.setTimeout(function () {
      enterRecall();
    }, state.flashMs);
  }

  function enterRecall() {
    if (state.phase !== 'memorize') {
      return;
    }

    clearTimers();
    state.phase = 'recall';
    state.clickStartedAt = performance.now();
    setPhase('recall: click 1');

    arena.querySelectorAll('.circle').forEach(function (circle) {
      circle.classList.add('hidden');
    });
    arena.querySelectorAll('.target').forEach(function (target) {
      target.classList.remove('hidden');
    });
  }

  function handleTargetClick(number, target) {
    if (state.phase !== 'recall') {
      return;
    }

    if (number !== state.nextExpected) {
      target.classList.add('miss');
      handleWrongClick(number);
      return;
    }

    target.classList.add('hit');
    target.disabled = true;
    state.nextExpected += 1;

    if (state.nextExpected > state.circleCount) {
      completeRound();
    } else {
      setPhase('recall: click ' + state.nextExpected);
    }
  }

  function completeRound() {
    state.phase = 'feedback';
    var seconds = Math.max(0.1, (performance.now() - state.clickStartedAt) / 1000);
    var speedBonus = Math.max(0, Math.round(state.circleCount * 12 - seconds * 4));
    var roundPoints = state.circleCount * 20 + state.streak * 6 + speedBonus;
    state.score += roundPoints;
    state.streak += 1;
    lastOutcome = 'correct';
    setPhase('correct');
    setFeedback('good', 'Correct. +' + roundPoints + ' points.');
    nextRoundButton.textContent = 'Next round';
    roundActions.classList.remove('hidden');
    updateStats();
  }

  function handleWrongClick(clickedNumber) {
    state.phase = 'feedback';
    state.mistakes += 1;
    state.streak = 0;
    lastOutcome = 'wrong';
    setPhase('incorrect');
    revealAnswer();

    setFeedback(
      'bad',
      'Incorrect. You clicked position ' + clickedNumber + ' while looking for ' + state.nextExpected + '.'
    );
    nextRoundButton.textContent = 'Next attempt';
    roundActions.classList.remove('hidden');
    updateStats();
  }

  function revealAnswer() {
    arena.querySelectorAll('.target').forEach(function (target) {
      target.disabled = true;
      target.classList.add('hidden');
    });
    arena.querySelectorAll('.circle').forEach(function (circle) {
      circle.classList.remove('hidden');
      circle.classList.add('reveal');
    });
  }

  function advanceRound() {
    if (lastOutcome === 'correct') {
      state.circleCount += 1;
      state.flashMs = Math.max(MIN_FLASH_MS, state.flashMs - FLASH_STEP_MS);
    }
    state.round += 1;
    startRound();
  }

  function restartRun() {
    clearTimers();
    clearArena();
    state = freshState();
    showGame();
    window.requestAnimationFrame(function () {
      startRound();
    });
  }

  startButton.addEventListener('click', function () {
    showGame();
    window.requestAnimationFrame(function () {
      startRound();
    });
  });

  restartButton.addEventListener('click', restartRun);
  restartRunButton.addEventListener('click', restartRun);
  nextRoundButton.addEventListener('click', advanceRound);

  window.addEventListener('resize', function () {
    if (state.phase === 'memorize' || state.phase === 'recall') {
      startRound();
    }
  });
}());
