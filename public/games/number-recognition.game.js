/*
 * Number Recognition — frontend component.
 *
 * Same shape as the Alphabet game (big display + countdown ring + controls +
 * spoken answer), but the grown-up settings choose the number RANGE. Start at
 * 0–10 for a young child and raise the top number as they grow.
 */
(function () {
  const RING_R = 140;
  const RING_C = 2 * Math.PI * RING_R;

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 1.25;
      window.speechSynthesis.speak(u);
    } catch (_) {
      /* ignore audio errors */
    }
  }

  class NumberGame {
    constructor(container, gameId) {
      this.el = container;
      this.gameId = gameId;
      this.poll = null;
      this.config = {
        questionDuration: 4,
        answerRevealDuration: 2,
        totalQuestions: 20,
        minNumber: 0,
        maxNumber: 10,
      };
      this.spokenItemFor = null;
      this.spokenRevealFor = null;
    }

    mount() {
      this.el.innerHTML = this.template();
      this.cache();
      this.bind();
      this.setButtons('idle');
    }

    unmount() {
      this.stopPolling();
      window.speechSynthesis && window.speechSynthesis.cancel();
    }

    template() {
      return `
        <a href="#/" class="back">⬅ All games</a>
        <section class="stage">
          <div class="progress" data-progress>Press ▶ Start to play!</div>
          <div class="bar"><span data-bar></span></div>
          <div class="letter-wrap">
            <svg class="ring" viewBox="0 0 300 300">
              <circle class="track" cx="150" cy="150" r="${RING_R}" fill="none" stroke-width="16" />
              <circle class="fill" data-ring cx="150" cy="150" r="${RING_R}" fill="none"
                stroke-width="16" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}" />
            </svg>
            <div class="letter" data-letter>🔢</div>
          </div>
          <div class="say idle" data-say>Can you say the number?</div>
          <div class="controls">
            <button class="btn start"   data-act="start">▶ Start</button>
            <button class="btn pause"   data-act="pause" disabled>⏸ Pause</button>
            <button class="btn resume"  data-act="resume" disabled>⏵ Resume</button>
            <button class="btn stop"    data-act="stop" disabled>⏹ Stop</button>
            <button class="btn restart" data-act="restart" disabled>🔄 Restart</button>
          </div>
        </section>

        <details class="settings">
          <summary>⚙️ Grown-up settings</summary>
          <div class="grid">
            <label class="field">Time per question (sec)
              <input type="number" min="1" max="60" data-cfg="questionDuration" value="4" />
            </label>
            <label class="field">Answer reveal (sec)
              <input type="number" min="0" max="30" data-cfg="answerRevealDuration" value="2" />
            </label>
            <label class="field">Total questions
              <input type="number" min="1" max="200" data-cfg="totalQuestions" value="20" />
            </label>
            <label class="field">Smallest number
              <input type="number" min="0" max="9999" data-cfg="minNumber" value="0" />
            </label>
            <label class="field">Biggest number
              <input type="number" min="0" max="9999" data-cfg="maxNumber" value="10" />
            </label>
          </div>
          <p class="range-hint" data-range>Showing numbers 0 to 10 🎯</p>
          <div class="controls" style="margin-top:16px">
            <button class="btn restart" data-act="save">💾 Save settings</button>
          </div>
        </details>`;
    }

    cache() {
      this.$ = (sel) => this.el.querySelector(sel);
      this.ui = {
        progress: this.$('[data-progress]'),
        bar: this.$('[data-bar]'),
        ring: this.$('[data-ring]'),
        letter: this.$('[data-letter]'),
        say: this.$('[data-say]'),
        range: this.$('[data-range]'),
      };
      this.buttons = {};
      this.el.querySelectorAll('[data-act]').forEach((b) => {
        this.buttons[b.dataset.act] = b;
      });
    }

    bind() {
      this.el.querySelectorAll('[data-act]').forEach((b) =>
        b.addEventListener('click', () => this.onAction(b.dataset.act)),
      );
      this.el.querySelectorAll('[data-cfg]').forEach((input) =>
        input.addEventListener('change', () => {
          this.readConfig();
          this.showRange();
        }),
      );
    }

    readConfig() {
      this.el.querySelectorAll('[data-cfg]').forEach((input) => {
        this.config[input.dataset.cfg] = Number(input.value);
      });
      // Keep the range sane: smallest must not exceed biggest.
      if (this.config.minNumber > this.config.maxNumber) {
        const tmp = this.config.minNumber;
        this.config.minNumber = this.config.maxNumber;
        this.config.maxNumber = tmp;
      }
    }

    showRange() {
      this.ui.range.textContent = `Showing numbers ${this.config.minNumber} to ${this.config.maxNumber} 🎯`;
    }

    async onAction(act) {
      try {
        if (act === 'start' || act === 'restart') {
          this.readConfig();
          this.spokenItemFor = this.spokenRevealFor = null;
          await window.GameApi.start(this.gameId, this.config);
          this.startPolling();
        } else if (act === 'pause') {
          await window.GameApi.pause(this.gameId);
        } else if (act === 'resume') {
          await window.GameApi.resume(this.gameId);
        } else if (act === 'stop') {
          await window.GameApi.stop(this.gameId);
          this.stopPolling();
          this.render(await window.GameApi.currentItem(this.gameId));
        } else if (act === 'save') {
          this.readConfig();
          await window.GameApi.saveConfig(this.gameId, this.config);
          this.flashSaved();
        }
      } catch (e) {
        this.ui.progress.textContent = 'Oops! ' + e.message;
      }
    }

    startPolling() {
      this.stopPolling();
      const tick = async () => {
        try {
          this.render(await window.GameApi.currentItem(this.gameId));
        } catch (_) {
          this.stopPolling();
        }
      };
      tick();
      this.poll = setInterval(tick, 150);
    }

    stopPolling() {
      if (this.poll) clearInterval(this.poll);
      this.poll = null;
    }

    render(state) {
      if (!state) return;
      const { phase, currentItem, revealedAnswer } = state;

      const done = state.completedQuestions || 0;
      this.ui.progress.textContent =
        phase === 'completed'
          ? '🎉 All done! Great job!'
          : `Number ${state.questionNumber || 0} of ${state.totalQuestions}`;
      this.ui.bar.style.width =
        Math.round((done / state.totalQuestions) * 100) + '%';

      const total =
        (phase === 'reveal'
          ? this.config.answerRevealDuration
          : this.config.questionDuration) * 1000;
      const frac = total > 0 ? Math.max(0, state.remainingMs / total) : 0;
      this.ui.ring.style.strokeDashoffset = RING_C * (1 - frac);

      if (phase === 'question' && currentItem) {
        this.ui.letter.textContent = currentItem.display;
        this.ui.letter.className = 'letter';
        this.ui.ring.style.stroke = 'var(--pink)';
        this.ui.say.className = 'say idle';
        this.ui.say.textContent = 'What number is this?';
        if (this.spokenItemFor !== currentItem.id) {
          this.spokenItemFor = currentItem.id;
          speak(currentItem.pronunciation || currentItem.display);
        }
      } else if (phase === 'reveal' && (revealedAnswer || currentItem)) {
        const item = revealedAnswer || currentItem;
        this.ui.letter.textContent = item.display;
        this.ui.letter.className = 'letter reveal';
        this.ui.ring.style.stroke = 'var(--green)';
        this.ui.say.className = 'say';
        this.ui.say.innerHTML = `It's <span class="word">${item.display}</span> — "${item.pronunciation || item.display}"`;
        if (this.spokenRevealFor !== item.id) {
          this.spokenRevealFor = item.id;
          speak(item.pronunciation || item.display);
        }
      } else if (phase === 'completed') {
        this.ui.letter.textContent = '🌟';
        this.ui.letter.className = 'letter';
        this.ui.say.className = 'say';
        this.ui.say.textContent = 'You finished the whole session!';
        this.stopPolling();
      } else if (phase === 'stopped' || phase === 'idle') {
        this.ui.letter.textContent = '🔢';
        this.ui.say.className = 'say idle';
        this.ui.say.textContent = 'Press ▶ Start to play!';
      }

      this.setButtons(phase);
    }

    setButtons(phase) {
      const enable = (acts) => {
        Object.entries(this.buttons).forEach(([k, b]) => {
          if (k === 'save') return;
          b.disabled = !acts.includes(k);
        });
      };
      if (phase === 'question' || phase === 'reveal') enable(['pause', 'stop']);
      else if (phase === 'paused') enable(['resume', 'stop', 'restart']);
      else if (phase === 'completed' || phase === 'stopped')
        enable(['start', 'restart']);
      else enable(['start']);
    }

    flashSaved() {
      const btn = this.buttons.save;
      const old = btn.textContent;
      btn.textContent = '✅ Saved!';
      setTimeout(() => (btn.textContent = old), 1200);
    }
  }

  window.GameComponents.register(
    'number-recognition',
    (container, gameId) => new NumberGame(container, gameId),
  );
})();
