/*
 * Tap the Right One — browser-driven quiz with real scoring.
 *
 * Each round shows a target word (spoken aloud) and a few picture choices; the
 * child taps the match. Wrong taps let them try again (no dead-ends for little
 * ones). Tracks accuracy and average response time — the foundation for a
 * future parent dashboard.
 */
(function () {
  const ITEMS = [
    { emoji: '🐶', name: 'Dog' }, { emoji: '🐱', name: 'Cat' },
    { emoji: '🦁', name: 'Lion' }, { emoji: '🐸', name: 'Frog' },
    { emoji: '🐵', name: 'Monkey' }, { emoji: '🐼', name: 'Panda' },
    { emoji: '🐯', name: 'Tiger' }, { emoji: '🐰', name: 'Rabbit' },
    { emoji: '🍎', name: 'Apple' }, { emoji: '🍌', name: 'Banana' },
    { emoji: '🍓', name: 'Strawberry' }, { emoji: '🍊', name: 'Orange' },
    { emoji: '🚗', name: 'Car' }, { emoji: '🚌', name: 'Bus' },
    { emoji: '⭐', name: 'Star' }, { emoji: '🌸', name: 'Flower' },
  ];

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.25;
      window.speechSynthesis.speak(u);
    } catch (_) {
      /* ignore */
    }
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  class TapGame {
    constructor(container) {
      this.el = container;
      this.choices = 3;
      this.totalRounds = 10;
      this.timer = null;
    }

    mount() {
      this.el.innerHTML = this.template();
      this.cache();
      this.bind();
      this.showIdle();
    }

    unmount() {
      if (this.timer) clearTimeout(this.timer);
      window.speechSynthesis && window.speechSynthesis.cancel();
    }

    template() {
      return `
        <a href="#/" class="back">⬅ All games</a>
        <section class="stage">
          <div class="progress" data-status>Tap the picture you hear! 👂</div>
          <div class="tap-target" data-target>Press ▶ Start</div>
          <div class="tap-choices" data-choices></div>
          <div class="controls" style="margin-top:18px">
            <button class="btn start" data-act="start">▶ Start</button>
            <button class="btn restart" data-act="repeat" disabled>🔊 Say again</button>
          </div>
        </section>
        <details class="settings">
          <summary>⚙️ Grown-up settings</summary>
          <div class="grid">
            <label class="field">Choices per round
              <select data-choices-count>
                <option value="2">2 (easy)</option>
                <option value="3" selected>3</option>
                <option value="4">4 (hard)</option>
              </select>
            </label>
            <label class="field">Total rounds
              <input type="number" min="1" max="50" data-rounds value="10" />
            </label>
          </div>
        </details>`;
    }

    cache() {
      this.$ = (s) => this.el.querySelector(s);
      this.status = this.$('[data-status]');
      this.target = this.$('[data-target]');
      this.choicesEl = this.$('[data-choices]');
      this.repeatBtn = this.$('[data-act="repeat"]');
      this.startBtn = this.$('[data-act="start"]');
    }

    bind() {
      this.startBtn.addEventListener('click', () => this.start());
      this.repeatBtn.addEventListener('click', () => this.current && speak(this.current.name));
      this.$('[data-choices-count]').addEventListener('change', (e) => {
        this.choices = Number(e.target.value);
      });
      this.$('[data-rounds]').addEventListener('change', (e) => {
        this.totalRounds = Math.max(1, Number(e.target.value));
      });
    }

    showIdle() {
      this.target.textContent = 'Press ▶ Start';
      this.choicesEl.innerHTML = '';
    }

    start() {
      this.round = 0;
      this.correct = 0;
      this.attempts = 0;
      this.times = [];
      this.repeatBtn.disabled = false;
      this.startBtn.textContent = '🔄 Restart';
      this.nextRound();
    }

    nextRound() {
      if (this.round >= this.totalRounds) return this.finish();
      this.round++;
      this.current = ITEMS[Math.floor(Math.random() * ITEMS.length)];

      const distractors = shuffle(ITEMS.filter((i) => i.name !== this.current.name)).slice(
        0,
        this.choices - 1,
      );
      const options = shuffle([this.current, ...distractors]);

      this.status.textContent = `Round ${this.round} of ${this.totalRounds}`;
      this.target.innerHTML = `Find the <span class="word">${this.current.name}</span>! 🔊`;
      this.choicesEl.innerHTML = options
        .map((o) => `<button class="tap-choice" data-name="${o.name}">${o.emoji}</button>`)
        .join('');
      this.choicesEl.querySelectorAll('.tap-choice').forEach((btn) =>
        btn.addEventListener('click', () => this.onChoice(btn)),
      );

      this.roundStart = Date.now();
      this.timer = setTimeout(() => speak(this.current.name), 300);
    }

    onChoice(btn) {
      const name = btn.dataset.name;
      this.attempts++;
      if (name === this.current.name) {
        this.correct++;
        this.times.push(Date.now() - this.roundStart);
        btn.classList.add('right');
        speak('Yes! ' + name);
        this.lockChoices();
        this.timer = setTimeout(() => this.nextRound(), 750);
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        speak('Try again');
      }
    }

    lockChoices() {
      this.choicesEl.querySelectorAll('.tap-choice').forEach((b) => (b.disabled = true));
    }

    finish() {
      const accuracy = Math.round((this.correct / this.totalRounds) * 100);
      const avg = this.times.length
        ? (this.times.reduce((a, b) => a + b, 0) / this.times.length / 1000).toFixed(1)
        : '—';
      this.status.textContent = '🎉 Great job!';
      this.target.innerHTML = `You got <span class="word">${this.correct}/${this.totalRounds}</span>`;
      this.choicesEl.innerHTML = `
        <div class="tap-score">
          <div><b>${accuracy}%</b><span>accuracy</span></div>
          <div><b>${this.attempts}</b><span>taps</span></div>
          <div><b>${avg}s</b><span>avg time</span></div>
        </div>`;
      this.repeatBtn.disabled = true;
      speak(`You got ${this.correct} out of ${this.totalRounds}!`);
    }
  }

  window.GameComponents.register('tap-the-one', (container) => new TapGame(container));
})();
