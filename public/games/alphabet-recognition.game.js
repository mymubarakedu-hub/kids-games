/*
 * Alphabet Recognition — frontend component.
 *
 * Renders the big letter + countdown ring, drives the game through the REST
 * API, and reads live state (phase, remaining time, revealed answer) back from
 * the server so the timer stays authoritative. Pronunciation uses the browser
 * SpeechSynthesis API, so no audio files are required to demo it.
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

  class AlphabetGame {
    constructor(container, gameId) {
      this.el = container;
      this.gameId = gameId;
      this.poll = null;
      this.config = {
        questionDuration: 4,
        answerRevealDuration: 2,
        totalQuestions: 20,
        letterMode: 'mixed',
      };
      this.spokenLetterFor = null;
      this.spokenRevealFor = null;
    }

    mount() {
      this.el.innerHTML = this.template();
      this.cache();
      this.bind();
      this.renderIdle();
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
            <div class="letter" data-letter>🔤</div>
          </div>
          <div class="say idle" data-say>Can you name the letter?</div>
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
            <label class="field">Letter mode
              <select data-cfg="letterMode">
                <option value="uppercase">Uppercase (A–Z)</option>
                <option value="lowercase">Lowercase (a–z)</option>
                <option value="mixed" selected>Mixed</option>
              </select>
            </label>
          </div>
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
        input.addEventListener('change', () => this.readConfig()),
      );
    }

    readConfig() {
      this.el.querySelectorAll('[data-cfg]').forEach((input) => {
        const key = input.dataset.cfg;
        this.config[key] =
          input.type === 'number' ? Number(input.value) : input.value;
      });
    }

    async onAction(act) {
      try {
        if (act === 'start') {
          this.readConfig();
          this.spokenLetterFor = this.spokenRevealFor = null;
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
        } else if (act === 'restart') {
          this.readConfig();
          this.spokenLetterFor = this.spokenRevealFor = null;
          await window.GameApi.start(this.gameId, this.config);
          this.startPolling();
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

    renderIdle() {
      this.setButtons('idle');
    }

    render(state) {
      if (!state) return;
      const { phase, currentItem, revealedAnswer } = state;

      // progress + bar
      const done = state.completedQuestions || 0;
      this.ui.progress.textContent =
        phase === 'completed'
          ? '🎉 All done! Great job!'
          : `Letter ${state.questionNumber || 0} of ${state.totalQuestions}`;
      this.ui.bar.style.width =
        Math.round((done / state.totalQuestions) * 100) + '%';

      // ring countdown
      const total =
        (phase === 'reveal'
          ? this.config.answerRevealDuration
          : this.config.questionDuration) * 1000;
      const frac = total > 0 ? Math.max(0, state.remainingMs / total) : 0;
      this.ui.ring.style.strokeDashoffset = RING_C * (1 - frac);

      // letter + answer text
      if (phase === 'question' && currentItem) {
        this.ui.letter.textContent = currentItem.display;
        this.ui.letter.className = 'letter';
        this.ui.ring.style.stroke = 'var(--pink)';
        this.ui.say.className = 'say idle';
        this.ui.say.textContent = 'Can you name it?';
        if (this.spokenLetterFor !== currentItem.id) {
          this.spokenLetterFor = currentItem.id;
          speak(currentItem.display);
        }
      } else if (phase === 'reveal' && (revealedAnswer || currentItem)) {
        const item = revealedAnswer || currentItem;
        this.ui.letter.textContent = item.display;
        this.ui.letter.className = 'letter reveal';
        this.ui.ring.style.stroke = 'var(--green)';
        this.ui.say.className = 'say';
        this.ui.say.innerHTML = `It's <span class="word">${item.display}</span> — say "${item.pronunciation || item.display}"`;
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
        this.ui.letter.textContent = '🔤';
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
    'alphabet-recognition',
    (container, gameId) => new AlphabetGame(container, gameId),
  );
})();
