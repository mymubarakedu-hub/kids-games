/*
 * Reusable game UI.
 *
 * The frontend mirror of the backend's reusable engine: it owns the stage,
 * countdown ring, controls, polling and spoken answers. Each game stays an
 * independent tool — it calls GameUI.create({...}) with its own prompt,
 * settings and (optionally) a custom way to draw the item.
 *
 *   GameUI.create({
 *     placeholder, prompt, completeText,
 *     defaults: { questionDuration, answerRevealDuration, totalQuestions, ...extra },
 *     settingsFields: [ { key, label, type:'number'|'select', min, max, options } ],
 *     speakOnQuestion: boolean,          // say the answer when shown? (default true)
 *     renderItem(letterEl, item, phase), // custom big-area renderer (optional)
 *     normalize(config),                 // tidy config before send (optional)
 *   })  →  (container, gameId) => component
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

  function defaultRenderItem(el, item, phase) {
    el.textContent = item.display;
    // `glyph` keeps big emoji sized to fully fit inside the ring.
    el.className = 'letter glyph' + (phase === 'reveal' ? ' reveal' : '');
  }

  class GenericGame {
    constructor(container, gameId, opts) {
      this.el = container;
      this.gameId = gameId;
      this.opts = opts;
      this.poll = null;
      this.config = Object.assign({}, opts.defaults);
      this.renderItem = opts.renderItem || defaultRenderItem;
      this.speakOnQuestion = opts.speakOnQuestion !== false;
      // Tracks what's currently drawn so we only touch the DOM on real changes
      // (the timer/ring updates every poll, but the item must not re-render —
      // that re-triggers animations and causes flicker).
      this.lastKey = null;
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

    fields() {
      const d = this.opts.defaults;
      const timing = [
        { key: 'questionDuration', label: 'Time per question (sec)', type: 'number', min: 1, max: 60 },
        { key: 'answerRevealDuration', label: 'Answer reveal (sec)', type: 'number', min: 0, max: 30 },
        { key: 'totalQuestions', label: 'Total questions', type: 'number', min: 1, max: 200 },
      ];
      return timing.concat(this.opts.settingsFields || []).map((f) => ({
        ...f,
        value: d[f.key],
      }));
    }

    fieldHtml(f) {
      if (f.type === 'select') {
        const opts = f.options
          .map(
            (o) =>
              `<option value="${o.value}"${o.value === f.value ? ' selected' : ''}>${o.label}</option>`,
          )
          .join('');
        return `<label class="field">${f.label}<select data-cfg="${f.key}">${opts}</select></label>`;
      }
      return `<label class="field">${f.label}
        <input type="number" min="${f.min}" max="${f.max}" data-cfg="${f.key}" value="${f.value}" /></label>`;
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
            <div class="letter" data-letter>${this.opts.placeholder || '🎮'}</div>
          </div>
          <div class="say idle" data-say>${this.opts.prompt || 'Can you name it?'}</div>
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
          <div class="grid">${this.fields().map((f) => this.fieldHtml(f)).join('')}</div>
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
        this.config[input.dataset.cfg] =
          input.type === 'number' ? Number(input.value) : input.value;
      });
      if (this.opts.normalize) this.opts.normalize(this.config);
    }

    async onAction(act) {
      try {
        if (act === 'start' || act === 'restart') {
          this.readConfig();
          this.lastKey = null;
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

      // --- updated every poll (smooth countdown) ---
      const done = state.completedQuestions || 0;
      this.ui.progress.textContent =
        phase === 'completed'
          ? '🎉 All done! Great job!'
          : `${state.questionNumber || 0} of ${state.totalQuestions}`;
      this.ui.bar.style.width =
        Math.round((done / state.totalQuestions) * 100) + '%';

      const total =
        (phase === 'reveal'
          ? this.config.answerRevealDuration
          : this.config.questionDuration) * 1000;
      const frac = total > 0 ? Math.max(0, state.remainingMs / total) : 0;
      this.ui.ring.style.strokeDashoffset = RING_C * (1 - frac);

      // --- redrawn ONLY when the item or phase changes (prevents flicker) ---
      const item = phase === 'reveal' ? revealedAnswer || currentItem : currentItem;
      const key = phase + ':' + (item && item.id ? item.id : '');
      if (key !== this.lastKey) {
        this.lastKey = key;
        this.applyPhase(phase, item);
      }

      this.setButtons(phase);
    }

    applyPhase(phase, item) {
      if (phase === 'question' && item) {
        this.renderItem(this.ui.letter, item, 'question');
        this.ui.ring.style.stroke = 'var(--pink)';
        this.ui.say.className = 'say idle';
        this.ui.say.textContent = this.opts.prompt || 'Can you name it?';
        if (this.speakOnQuestion) {
          speak(item.pronunciation || item.display);
        }
      } else if (phase === 'reveal' && item) {
        this.renderItem(this.ui.letter, item, 'reveal');
        this.ui.ring.style.stroke = 'var(--green)';
        this.ui.say.className = 'say';
        this.ui.say.innerHTML = `It's <span class="word">${item.answer}</span> — "${item.pronunciation || item.answer}"`;
        speak(item.pronunciation || item.answer);
      } else if (phase === 'completed') {
        this.ui.letter.className = 'letter glyph';
        this.ui.letter.textContent = '🌟';
        this.ui.say.className = 'say';
        this.ui.say.textContent =
          this.opts.completeText || 'You finished the whole session!';
        this.stopPolling();
      } else if (phase === 'stopped' || phase === 'idle') {
        this.ui.letter.className = 'letter glyph';
        this.ui.letter.textContent = this.opts.placeholder || '🎮';
        this.ui.say.className = 'say idle';
        this.ui.say.textContent = 'Press ▶ Start to play!';
      }
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

  window.GameUI = {
    create(opts) {
      return (container, gameId) => new GenericGame(container, gameId, opts);
    },
  };
})();
