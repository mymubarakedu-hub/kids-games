/*
 * Browser game engine — a faithful, in-browser port of the NestJS backend
 * (src/games, src/sessions, src/configurations). Everything the server used to
 * do (item generation, the countdown state machine, sessions, saved config)
 * now runs entirely client-side, so the app is a pure static site that needs
 * no server. The public API surface is window.GameEngine, which core/api.js
 * adapts into the same window.GameApi the UI already speaks to.
 *
 * Structure mirrors the backend 1:1 so the two stay easy to diff:
 *   interfaces / DEFAULT_BASE_CONFIG   → constants below
 *   common/shuffle-bag, *-bag, words   → "bags & helpers"
 *   game-engine/base-learning-game     → BaseLearningGame
 *   game-engine/dataset/client games   → DatasetRecognitionGame / ClientGame
 *   per-game factories + datasets       → "games" + "datasets"
 *   registry / sessions / configs       → Registry / SessionService / ConfigStore
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // interfaces / defaults  (games/interfaces, common/dto)
  // ---------------------------------------------------------------------------

  /** Finite states a session moves through (games/interfaces/game-phase.enum). */
  var GamePhase = {
    IDLE: 'idle',
    QUESTION: 'question',
    REVEAL: 'reveal',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    STOPPED: 'stopped',
  };

  /** Shared timing defaults (games/interfaces/game-config.interface). */
  var DEFAULT_BASE_CONFIG = {
    questionDuration: 4,
    answerRevealDuration: 2,
    totalQuestions: 20,
    autoStart: true,
  };

  // ---------------------------------------------------------------------------
  // bags & helpers  (common/shuffle-bag, *-bag, number-words)
  // ---------------------------------------------------------------------------

  /** Fisher–Yates in place. */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /**
   * Balanced random picker: draws from a fixed pool without replacement (every
   * item appears once before any repeats) and never repeats the last draw.
   * Backs every dataset game; the letter/number bags below are the same idea
   * over generated pools. (common/shuffle-bag.ts)
   */
  function Bag(pool) {
    this.pool = pool;
    this.bag = [];
    this.last = null;
  }
  Bag.prototype.draw = function () {
    if (this.bag.length === 0) this.refill();
    var item = this.bag.pop();
    this.last = item;
    return item;
  };
  Bag.prototype.refill = function () {
    this.bag = shuffle(this.pool.slice());
    // pop() takes from the end — guard the last slot against repeating.
    if (this.bag.length > 1 && this.bag[this.bag.length - 1] === this.last) {
      var swapIdx = Math.floor(Math.random() * (this.bag.length - 1));
      var end = this.bag.length - 1;
      var t = this.bag[swapIdx];
      this.bag[swapIdx] = this.bag[end];
      this.bag[end] = t;
    }
  };

  var UPPER = [];
  var LOWER = [];
  for (var c = 0; c < 26; c++) {
    UPPER.push(String.fromCharCode(65 + c));
    LOWER.push(String.fromCharCode(97 + c));
  }

  /** Letter pool for a given mode (alphabet-recognition/letter-bag.ts). */
  function letterPool(mode) {
    if (mode === 'uppercase') return UPPER.slice();
    if (mode === 'lowercase') return LOWER.slice();
    return UPPER.concat(LOWER); // mixed (default)
  }

  /** Inclusive [min,max] integer pool (number-recognition/number-bag.ts). */
  function rangePool(min, max) {
    var lo = Math.min(min, max);
    var hi = Math.max(min, max);
    var pool = [];
    for (var n = lo; n <= hi; n++) pool.push(n);
    return pool;
  }

  var ONES = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function below100(n) {
    if (n < 20) return ONES[n];
    var t = Math.floor(n / 10);
    var o = n % 10;
    return TENS[t] + (o ? '-' + ONES[o] : '');
  }
  function below1000(n) {
    if (n < 100) return below100(n);
    var h = Math.floor(n / 100);
    var r = n % 100;
    return ONES[h] + ' hundred' + (r ? ' ' + below100(r) : '');
  }
  /** 7 → "Seven", 42 → "Forty-two". Covers 0–9999. (number-words.ts) */
  function numberToWords(n) {
    var words;
    if (n < 1000) {
      words = below1000(n);
    } else if (n < 10000) {
      var th = Math.floor(n / 1000);
      var r = n % 1000;
      words = below1000(th) + ' thousand' + (r ? ' ' + below1000(r) : '');
    } else {
      words = String(n);
    }
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  // ---------------------------------------------------------------------------
  // engine  (game-engine/base-learning-game.ts)
  // ---------------------------------------------------------------------------

  /**
   * Reusable countdown engine as a small state machine driven by timers:
   *   QUESTION --(questionDuration)--> REVEAL --(answerRevealDuration)--> QUESTION
   *                                                          \--> COMPLETED
   * Concrete games only implement generateItem(); timing, pause/resume,
   * progress and state snapshots are inherited.
   */
  function BaseLearningGame(config) {
    this.config = config;
    this.phase = GamePhase.IDLE;
    this.questionNumber = 0;
    this.completedQuestions = 0;
    this.currentItem = null;
    this.previousItem = null;
    this._phaseEndsAt = null; // epoch ms the active countdown ends (null = idle)
    this._pausedRemainingMs = 0;
    this._resumePhase = GamePhase.QUESTION;
    this._timer = null;
  }
  // Subclasses MUST override. previousItem is available to avoid repeats.
  BaseLearningGame.prototype.generateItem = function () {
    throw new Error('generateItem() not implemented');
  };

  // --- lifecycle ---
  BaseLearningGame.prototype.start = function () {
    this.reset();
    this.questionNumber = 1;
    this._enterQuestion();
    return this.getState();
  };
  BaseLearningGame.prototype.pause = function () {
    if (this.phase !== GamePhase.QUESTION && this.phase !== GamePhase.REVEAL) {
      return this.getState();
    }
    this._clearTimer();
    this._resumePhase = this.phase;
    this._pausedRemainingMs = this._computeRemainingMs();
    this.phase = GamePhase.PAUSED;
    this._phaseEndsAt = null;
    return this.getState();
  };
  BaseLearningGame.prototype.resume = function () {
    if (this.phase !== GamePhase.PAUSED) return this.getState();
    this.phase = this._resumePhase;
    var self = this;
    this._schedule(this._pausedRemainingMs, function () {
      if (self.phase === GamePhase.QUESTION) self._enterReveal();
      else self._advance();
    });
    return this.getState();
  };
  BaseLearningGame.prototype.stop = function () {
    this._clearTimer();
    this.phase = GamePhase.STOPPED;
    this._phaseEndsAt = null;
    return this.getState();
  };
  BaseLearningGame.prototype.reset = function () {
    this._clearTimer();
    this.phase = GamePhase.IDLE;
    this.questionNumber = 0;
    this.completedQuestions = 0;
    this.currentItem = null;
    this.previousItem = null;
    this._phaseEndsAt = null;
    this._pausedRemainingMs = 0;
    return this.getState();
  };

  // --- item access ---
  BaseLearningGame.prototype.getCurrentItem = function () {
    return this.currentItem;
  };
  BaseLearningGame.prototype.getNextItem = function () {
    this.previousItem = this.currentItem;
    this.currentItem = this.generateItem();
    return this.currentItem;
  };
  BaseLearningGame.prototype.revealAnswer = function () {
    if (this.phase === GamePhase.QUESTION) {
      this._clearTimer();
      this._enterReveal();
    }
    return this.currentItem;
  };

  // --- snapshot ---
  BaseLearningGame.prototype.getState = function () {
    return {
      phase: this.phase,
      questionNumber: this.questionNumber,
      totalQuestions: this.config.totalQuestions,
      completedQuestions: this.completedQuestions,
      currentItem: this.currentItem,
      revealedAnswer: this.phase === GamePhase.REVEAL ? this.currentItem : null,
      remainingMs: this._computeRemainingMs(),
      phaseEndsAt: this._phaseEndsAt,
    };
  };
  BaseLearningGame.prototype.dispose = function () {
    this._clearTimer();
  };

  // --- internal state machine ---
  BaseLearningGame.prototype._enterQuestion = function () {
    this.phase = GamePhase.QUESTION;
    this.getNextItem();
    var self = this;
    this._schedule(this.config.questionDuration * 1000, function () {
      self._enterReveal();
    });
  };
  BaseLearningGame.prototype._enterReveal = function () {
    this.phase = GamePhase.REVEAL;
    var self = this;
    this._schedule(this.config.answerRevealDuration * 1000, function () {
      self._advance();
    });
  };
  BaseLearningGame.prototype._advance = function () {
    this.completedQuestions += 1;
    if (this.questionNumber >= this.config.totalQuestions) {
      this._complete();
      return;
    }
    this.questionNumber += 1;
    this._enterQuestion();
  };
  BaseLearningGame.prototype._complete = function () {
    this._clearTimer();
    this.phase = GamePhase.COMPLETED;
    this._phaseEndsAt = null;
  };

  // --- timer helpers ---
  BaseLearningGame.prototype._schedule = function (ms, fn) {
    this._clearTimer();
    this._phaseEndsAt = Date.now() + ms;
    this._timer = setTimeout(fn, Math.max(0, ms));
  };
  BaseLearningGame.prototype._clearTimer = function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  };
  BaseLearningGame.prototype._computeRemainingMs = function () {
    if (this.phase === GamePhase.PAUSED) return this._pausedRemainingMs;
    if (this._phaseEndsAt === null) return 0;
    return Math.max(0, this._phaseEndsAt - Date.now());
  };

  /** Tiny prototype-chain helper so the game subclasses read cleanly. */
  function extend(Child, Parent) {
    Child.prototype = Object.create(Parent.prototype);
    Child.prototype.constructor = Child;
  }

  /**
   * "Show this thing, name it" games whose items come from a fixed dataset.
   * (game-engine/dataset-recognition.game.ts)
   */
  function DatasetRecognitionGame(config, dataset) {
    BaseLearningGame.call(this, config);
    this._bag = new Bag(dataset);
  }
  extend(DatasetRecognitionGame, BaseLearningGame);
  DatasetRecognitionGame.prototype.generateItem = function () {
    return this._bag.draw();
  };

  /**
   * No-op game for titles that play entirely in the browser (Memory Match,
   * Tap-the-Right-One). They still appear in the catalogue and get a route but
   * don't drive the countdown engine. (game-engine/client-game.ts)
   */
  function ClientGame(id, name) {
    this.id = id;
    this.name = name;
  }
  ClientGame.prototype._idle = function () {
    return {
      phase: GamePhase.IDLE,
      questionNumber: 0,
      totalQuestions: 0,
      completedQuestions: 0,
      currentItem: null,
      revealedAnswer: null,
      remainingMs: 0,
      phaseEndsAt: null,
    };
  };
  ClientGame.prototype.start = ClientGame.prototype.pause =
    ClientGame.prototype.resume = ClientGame.prototype.stop =
    ClientGame.prototype.reset = ClientGame.prototype.getState = function () {
      return this._idle();
    };
  ClientGame.prototype.getCurrentItem = function () { return null; };
  ClientGame.prototype.getNextItem = function () { return { id: '', display: '', answer: '' }; };
  ClientGame.prototype.revealAnswer = function () { return null; };
  ClientGame.prototype.dispose = function () {};

  // ---------------------------------------------------------------------------
  // datasets  (games/<game>/data/*.ts)
  // ---------------------------------------------------------------------------

  var ANIMALS = [
    { id: 'dog', display: '🐶', answer: 'Dog', pronunciation: 'Dog' },
    { id: 'cat', display: '🐱', answer: 'Cat', pronunciation: 'Cat' },
    { id: 'cow', display: '🐮', answer: 'Cow', pronunciation: 'Cow' },
    { id: 'pig', display: '🐷', answer: 'Pig', pronunciation: 'Pig' },
    { id: 'horse', display: '🐴', answer: 'Horse', pronunciation: 'Horse' },
    { id: 'sheep', display: '🐑', answer: 'Sheep', pronunciation: 'Sheep' },
    { id: 'chicken', display: '🐔', answer: 'Chicken', pronunciation: 'Chicken' },
    { id: 'duck', display: '🦆', answer: 'Duck', pronunciation: 'Duck' },
    { id: 'frog', display: '🐸', answer: 'Frog', pronunciation: 'Frog' },
    { id: 'lion', display: '🦁', answer: 'Lion', pronunciation: 'Lion' },
    { id: 'tiger', display: '🐯', answer: 'Tiger', pronunciation: 'Tiger' },
    { id: 'elephant', display: '🐘', answer: 'Elephant', pronunciation: 'Elephant' },
    { id: 'monkey', display: '🐵', answer: 'Monkey', pronunciation: 'Monkey' },
    { id: 'rabbit', display: '🐰', answer: 'Rabbit', pronunciation: 'Rabbit' },
    { id: 'bear', display: '🐻', answer: 'Bear', pronunciation: 'Bear' },
    { id: 'penguin', display: '🐧', answer: 'Penguin', pronunciation: 'Penguin' },
    { id: 'fish', display: '🐟', answer: 'Fish', pronunciation: 'Fish' },
    { id: 'bee', display: '🐝', answer: 'Bee', pronunciation: 'Bee' },
  ];

  var BODY_PARTS = [
    { id: 'eye', display: '👁️', answer: 'Eye', pronunciation: 'Eye' },
    { id: 'ear', display: '👂', answer: 'Ear', pronunciation: 'Ear' },
    { id: 'nose', display: '👃', answer: 'Nose', pronunciation: 'Nose' },
    { id: 'mouth', display: '👄', answer: 'Mouth', pronunciation: 'Mouth' },
    { id: 'hand', display: '✋', answer: 'Hand', pronunciation: 'Hand' },
    { id: 'foot', display: '🦶', answer: 'Foot', pronunciation: 'Foot' },
    { id: 'tongue', display: '👅', answer: 'Tongue', pronunciation: 'Tongue' },
    { id: 'tooth', display: '🦷', answer: 'Tooth', pronunciation: 'Tooth' },
  ];

  var COLORS = [
    { id: 'red', display: 'Red', answer: 'Red', pronunciation: 'Red', meta: { hex: '#e6194b' } },
    { id: 'orange', display: 'Orange', answer: 'Orange', pronunciation: 'Orange', meta: { hex: '#f58231' } },
    { id: 'yellow', display: 'Yellow', answer: 'Yellow', pronunciation: 'Yellow', meta: { hex: '#ffd60a' } },
    { id: 'green', display: 'Green', answer: 'Green', pronunciation: 'Green', meta: { hex: '#3cb44b' } },
    { id: 'blue', display: 'Blue', answer: 'Blue', pronunciation: 'Blue', meta: { hex: '#4363d8' } },
    { id: 'purple', display: 'Purple', answer: 'Purple', pronunciation: 'Purple', meta: { hex: '#911eb4' } },
    { id: 'pink', display: 'Pink', answer: 'Pink', pronunciation: 'Pink', meta: { hex: '#f472b6' } },
    { id: 'brown', display: 'Brown', answer: 'Brown', pronunciation: 'Brown', meta: { hex: '#8b5a2b' } },
    { id: 'black', display: 'Black', answer: 'Black', pronunciation: 'Black', meta: { hex: '#1a1a1a' } },
    { id: 'white', display: 'White', answer: 'White', pronunciation: 'White', meta: { hex: '#ffffff' } },
  ];

  var COUNT_OBJECTS = ['🍎', '⭐', '🎈', '🐶', '🌸', '🚗', '🍓', '⚽', '🐱', '🍪'];

  var EMOTIONS = [
    { id: 'happy', display: '😀', answer: 'Happy', pronunciation: 'Happy' },
    { id: 'sad', display: '😢', answer: 'Sad', pronunciation: 'Sad' },
    { id: 'angry', display: '😠', answer: 'Angry', pronunciation: 'Angry' },
    { id: 'surprised', display: '😮', answer: 'Surprised', pronunciation: 'Surprised' },
    { id: 'sleepy', display: '😴', answer: 'Sleepy', pronunciation: 'Sleepy' },
    { id: 'scared', display: '😨', answer: 'Scared', pronunciation: 'Scared' },
    { id: 'silly', display: '😜', answer: 'Silly', pronunciation: 'Silly' },
    { id: 'love', display: '😍', answer: 'Love', pronunciation: 'Love' },
  ];

  var FRUITS = [
    { id: 'apple', display: '🍎', answer: 'Apple', pronunciation: 'Apple' },
    { id: 'banana', display: '🍌', answer: 'Banana', pronunciation: 'Banana' },
    { id: 'grapes', display: '🍇', answer: 'Grapes', pronunciation: 'Grapes' },
    { id: 'orange', display: '🍊', answer: 'Orange', pronunciation: 'Orange' },
    { id: 'strawberry', display: '🍓', answer: 'Strawberry', pronunciation: 'Strawberry' },
    { id: 'watermelon', display: '🍉', answer: 'Watermelon', pronunciation: 'Watermelon' },
    { id: 'cherry', display: '🍒', answer: 'Cherries', pronunciation: 'Cherries' },
    { id: 'pineapple', display: '🍍', answer: 'Pineapple', pronunciation: 'Pineapple' },
    { id: 'mango', display: '🥭', answer: 'Mango', pronunciation: 'Mango' },
    { id: 'pear', display: '🍐', answer: 'Pear', pronunciation: 'Pear' },
    { id: 'lemon', display: '🍋', answer: 'Lemon', pronunciation: 'Lemon' },
    { id: 'peach', display: '🍑', answer: 'Peach', pronunciation: 'Peach' },
  ];

  var SHAPES = [
    { id: 'circle', display: 'Circle', answer: 'Circle', pronunciation: 'Circle', meta: { shape: 'circle' } },
    { id: 'square', display: 'Square', answer: 'Square', pronunciation: 'Square', meta: { shape: 'square' } },
    { id: 'triangle', display: 'Triangle', answer: 'Triangle', pronunciation: 'Triangle', meta: { shape: 'triangle' } },
    { id: 'rectangle', display: 'Rectangle', answer: 'Rectangle', pronunciation: 'Rectangle', meta: { shape: 'rectangle' } },
    { id: 'oval', display: 'Oval', answer: 'Oval', pronunciation: 'Oval', meta: { shape: 'oval' } },
    { id: 'diamond', display: 'Diamond', answer: 'Diamond', pronunciation: 'Diamond', meta: { shape: 'diamond' } },
    { id: 'star', display: 'Star', answer: 'Star', pronunciation: 'Star', meta: { shape: 'star' } },
    { id: 'heart', display: 'Heart', answer: 'Heart', pronunciation: 'Heart', meta: { shape: 'heart' } },
  ];

  var VEHICLES = [
    { id: 'car', display: '🚗', answer: 'Car', pronunciation: 'Car' },
    { id: 'bus', display: '🚌', answer: 'Bus', pronunciation: 'Bus' },
    { id: 'train', display: '🚂', answer: 'Train', pronunciation: 'Train' },
    { id: 'airplane', display: '✈️', answer: 'Airplane', pronunciation: 'Airplane' },
    { id: 'helicopter', display: '🚁', answer: 'Helicopter', pronunciation: 'Helicopter' },
    { id: 'boat', display: '⛵', answer: 'Boat', pronunciation: 'Boat' },
    { id: 'ship', display: '🚢', answer: 'Ship', pronunciation: 'Ship' },
    { id: 'bicycle', display: '🚲', answer: 'Bicycle', pronunciation: 'Bicycle' },
    { id: 'motorcycle', display: '🏍️', answer: 'Motorcycle', pronunciation: 'Motorcycle' },
    { id: 'truck', display: '🚚', answer: 'Truck', pronunciation: 'Truck' },
    { id: 'fire-truck', display: '🚒', answer: 'Fire Truck', pronunciation: 'Fire truck' },
    { id: 'police-car', display: '🚓', answer: 'Police Car', pronunciation: 'Police car' },
    { id: 'ambulance', display: '🚑', answer: 'Ambulance', pronunciation: 'Ambulance' },
    { id: 'tractor', display: '🚜', answer: 'Tractor', pronunciation: 'Tractor' },
    { id: 'rocket', display: '🚀', answer: 'Rocket', pronunciation: 'Rocket' },
  ];

  var WEATHER = [
    { id: 'sunny', display: '☀️', answer: 'Sunny', pronunciation: 'Sunny' },
    { id: 'rainy', display: '🌧️', answer: 'Rainy', pronunciation: 'Rainy' },
    { id: 'cloudy', display: '☁️', answer: 'Cloudy', pronunciation: 'Cloudy' },
    { id: 'snowy', display: '❄️', answer: 'Snowy', pronunciation: 'Snowy' },
    { id: 'rainbow', display: '🌈', answer: 'Rainbow', pronunciation: 'Rainbow' },
    { id: 'stormy', display: '⛈️', answer: 'Stormy', pronunciation: 'Stormy' },
    { id: 'windy', display: '🌬️', answer: 'Windy', pronunciation: 'Windy' },
    { id: 'snowman', display: '⛄', answer: 'Snowman', pronunciation: 'Snowman' },
  ];

  var LETTER_PRONUNCIATION = {
    A: 'Ay', B: 'Bee', C: 'See', D: 'Dee', E: 'Ee', F: 'Eff',
    G: 'Gee', H: 'Aitch', I: 'Eye', J: 'Jay', K: 'Kay', L: 'El',
    M: 'Em', N: 'En', O: 'Oh', P: 'Pee', Q: 'Cue', R: 'Ar',
    S: 'Ess', T: 'Tee', U: 'You', V: 'Vee', W: 'Double-you',
    X: 'Ex', Y: 'Why', Z: 'Zee',
  };

  // ---------------------------------------------------------------------------
  // games with custom item generation  (alphabet, number, counting)
  // ---------------------------------------------------------------------------

  /** Alphabet Recognition — letters via a mode-specific balanced bag. */
  function AlphabetGame(config) {
    BaseLearningGame.call(this, config);
    this._bag = new Bag(letterPool(config.letterMode));
  }
  extend(AlphabetGame, BaseLearningGame);
  AlphabetGame.prototype.generateItem = function () {
    var letter = this._bag.draw();
    var upper = letter.toUpperCase();
    return {
      id: letter,
      display: letter,
      answer: letter,
      pronunciation: LETTER_PRONUNCIATION[upper],
      audioUrl: '/audio/letters/' + upper.toLowerCase() + '.mp3',
      meta: { case: letter === upper ? 'upper' : 'lower' },
    };
  };

  /** Number Recognition — numbers from a configured inclusive range. */
  function NumberGame(config) {
    BaseLearningGame.call(this, config);
    this._bag = new Bag(rangePool(config.minNumber, config.maxNumber));
  }
  extend(NumberGame, BaseLearningGame);
  NumberGame.prototype.generateItem = function () {
    var n = this._bag.draw();
    var value = String(n);
    return {
      id: value,
      display: value,
      answer: value,
      pronunciation: numberToWords(n),
      meta: { value: n },
    };
  };

  /** Counting — show N copies of an object; the answer is the count. */
  function CountingGame(config) {
    BaseLearningGame.call(this, config);
    this._bag = new Bag(rangePool(config.minCount, config.maxCount));
  }
  extend(CountingGame, BaseLearningGame);
  CountingGame.prototype.generateItem = function () {
    var count = this._bag.draw();
    var emoji = COUNT_OBJECTS[Math.floor(Math.random() * COUNT_OBJECTS.length)];
    return {
      id: emoji + '-' + count,
      display: emoji,
      answer: String(count),
      pronunciation: numberToWords(count),
      meta: { count: count, emoji: emoji },
    };
  };

  // ---------------------------------------------------------------------------
  // registry  (games/registry + per-game factories, in games.module order)
  // ---------------------------------------------------------------------------

  // A factory = { metadata, defaultConfig(), create(config) }. Helpers keep the
  // 13 declarations below as terse as the backend's one-liner game modules.
  function datasetFactory(meta, dataset) {
    return {
      metadata: meta,
      defaultConfig: function () {
        return Object.assign({}, DEFAULT_BASE_CONFIG);
      },
      create: function (config) {
        return new DatasetRecognitionGame(config, dataset);
      },
    };
  }
  function clientFactory(meta) {
    return {
      metadata: meta,
      defaultConfig: function () {
        return Object.assign({}, DEFAULT_BASE_CONFIG);
      },
      create: function () {
        return new ClientGame(meta.id, meta.name);
      },
    };
  }
  function meta(id, name, description) {
    return { id: id, name: name, description: description, route: '/games/' + id };
  }

  // Order mirrors src/games/games.module.ts imports → catalogue order.
  var FACTORIES = [
    {
      metadata: meta('alphabet-recognition', 'Alphabet Recognition',
        'Identify random English letters before the timer reveals the answer.'),
      defaultConfig: function () {
        return Object.assign({}, DEFAULT_BASE_CONFIG, { letterMode: 'mixed' });
      },
      create: function (config) { return new AlphabetGame(config); },
    },
    {
      metadata: meta('number-recognition', 'Number Recognition',
        'Identify numbers from a chosen range before the timer reveals the answer.'),
      defaultConfig: function () {
        return Object.assign({}, DEFAULT_BASE_CONFIG, { minNumber: 0, maxNumber: 10 });
      },
      create: function (config) { return new NumberGame(config); },
    },
    datasetFactory(meta('color-recognition', 'Color Recognition',
      'Name the color before the timer reveals the answer.'), COLORS),
    datasetFactory(meta('shape-recognition', 'Shape Recognition',
      'Name the shape before the timer reveals the answer.'), SHAPES),
    datasetFactory(meta('vehicle-recognition', 'Vehicle Recognition',
      'Name the vehicle before the timer reveals the answer.'), VEHICLES),
    datasetFactory(meta('animal-recognition', 'Animal Recognition',
      'Name the animal before the timer reveals the answer.'), ANIMALS),
    datasetFactory(meta('fruit-recognition', 'Fruit Recognition',
      'Name the fruit before the timer reveals the answer.'), FRUITS),
    datasetFactory(meta('weather-recognition', 'Weather Recognition',
      'Name the weather before the timer reveals the answer.'), WEATHER),
    datasetFactory(meta('emotion-recognition', 'Emotion Recognition',
      'Name the feeling before the timer reveals the answer.'), EMOTIONS),
    datasetFactory(meta('bodypart-recognition', 'Body Part Recognition',
      'Name the body part before the timer reveals the answer.'), BODY_PARTS),
    {
      metadata: meta('counting', 'Counting',
        'Count the objects before the timer reveals how many.'),
      defaultConfig: function () {
        return Object.assign({}, DEFAULT_BASE_CONFIG, { minCount: 1, maxCount: 5 });
      },
      create: function (config) { return new CountingGame(config); },
    },
    clientFactory(meta('memory-match', 'Memory Match',
      'Flip the cards and find the matching pairs.')),
    clientFactory(meta('tap-the-one', 'Tap the Right One',
      'Tap the picture that matches the word you hear.')),
  ];

  var registry = {};
  var order = [];
  FACTORIES.forEach(function (f) {
    registry[f.metadata.id] = f;
    order.push(f.metadata.id);
  });

  function getFactory(gameId) {
    var f = registry[gameId];
    if (!f) throw new Error('Unknown game: "' + gameId + '"');
    return f;
  }

  // ---------------------------------------------------------------------------
  // saved configuration  (configurations/configuration.service.ts → localStorage)
  // ---------------------------------------------------------------------------

  // Backend kept this in memory (reset on restart). localStorage is a strict
  // upgrade: a grown-up's saved settings now survive page reloads.
  var ConfigStore = {
    _key: function (gameId) { return 'kids-game:config:' + gameId; },
    get: function (gameId) {
      try {
        var raw = window.localStorage.getItem(this._key(gameId));
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },
    save: function (gameId, config) {
      var merged = Object.assign({}, this.get(gameId), config);
      try {
        window.localStorage.setItem(this._key(gameId), JSON.stringify(merged));
      } catch (e) {
        /* storage disabled (private mode); settings just won't persist */
      }
      return merged;
    },
  };

  /** {...defaults, ...overrides} (registry.resolveConfig). */
  function resolveConfig(gameId, overrides) {
    return Object.assign({}, getFactory(gameId).defaultConfig(), overrides || {});
  }

  // ---------------------------------------------------------------------------
  // sessions  (sessions/session.service.ts) — single active session per game
  // ---------------------------------------------------------------------------

  var activeByGame = {};
  var seq = 0;

  function disposeActive(gameId) {
    var existing = activeByGame[gameId];
    if (existing) {
      existing.game.dispose();
      delete activeByGame[gameId];
    }
  }
  function requireActive(gameId) {
    var s = activeByGame[gameId];
    if (!s) throw new Error('No active session for game "' + gameId + '". Start one first.');
    return s;
  }

  var Sessions = {
    start: function (gameId, config) {
      disposeActive(gameId);
      var game = getFactory(gameId).create(config);
      var session = {
        id: 's-' + (++seq) + '-' + Date.now().toString(36),
        gameId: gameId,
        game: game,
        config: config,
        startedAt: Date.now(),
      };
      activeByGame[gameId] = session;
      var state = game.start();
      return { session: session, state: state };
    },
    pause: function (gameId) { return requireActive(gameId).game.pause(); },
    resume: function (gameId) { return requireActive(gameId).game.resume(); },
    stop: function (gameId) { return requireActive(gameId).game.stop(); },
    restart: function (gameId) {
      var config = requireActive(gameId).config;
      return this.start(gameId, config);
    },
    getState: function (gameId) { return requireActive(gameId).game.getState(); },
    getCurrentItem: function (gameId) { return requireActive(gameId).game.getCurrentItem(); },
    revealAnswer: function (gameId) { return requireActive(gameId).game.revealAnswer(); },
    summary: function (gameId) {
      var s = requireActive(gameId);
      var state = s.game.getState();
      return {
        sessionId: s.id,
        gameId: s.gameId,
        phase: state.phase,
        questionNumber: state.questionNumber,
        totalQuestions: state.totalQuestions,
        completedQuestions: state.completedQuestions,
        timeSpentSeconds: Math.round((Date.now() - s.startedAt) / 1000),
      };
    },
  };

  // ---------------------------------------------------------------------------
  // public facade — mirrors the REST controller (games/games.controller.ts).
  // Each method returns exactly what the matching HTTP route returned as JSON.
  // ---------------------------------------------------------------------------

  window.GameEngine = {
    listGames: function () {
      return order.map(function (id) { return registry[id].metadata; });
    },
    start: function (gameId, body) {
      var saved = ConfigStore.get(gameId);
      var config = resolveConfig(gameId, Object.assign({}, saved, body || {}));
      var res = Sessions.start(gameId, config);
      return { sessionId: res.session.id, gameId: gameId, config: config, state: res.state };
    },
    pause: function (gameId) { return Sessions.pause(gameId); },
    resume: function (gameId) { return Sessions.resume(gameId); },
    stop: function (gameId) { return Sessions.stop(gameId); },
    restart: function (gameId) {
      var res = Sessions.restart(gameId);
      return { sessionId: res.session.id, gameId: gameId, state: res.state };
    },
    currentItem: function (gameId) { return Sessions.getState(gameId); },
    revealAnswer: function (gameId) {
      Sessions.revealAnswer(gameId);
      return Sessions.getState(gameId);
    },
    session: function (gameId) { return Sessions.summary(gameId); },
    saveConfig: function (gameId, body) {
      getFactory(gameId); // ensure the game exists before persisting
      var saved = ConfigStore.save(gameId, body || {});
      return { gameId: gameId, config: resolveConfig(gameId, saved) };
    },
  };
})();
