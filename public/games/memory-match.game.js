/*
 * Memory Match — browser-driven game (no countdown engine).
 *
 * Flip cards two at a time to find matching pairs. Tracks moves and matched
 * pairs; difficulty = number of pairs.
 */
(function () {
  const EMOJIS = ['🐶', '🐱', '🦁', '🐸', '🐵', '🦊', '🐼', '🐯', '🐰', '🐷', '🐮', '🐧'];

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.3;
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

  class MemoryMatch {
    constructor(container) {
      this.el = container;
      this.pairs = 6;
      this.timer = null;
    }

    mount() {
      this.el.innerHTML = this.template();
      this.cache();
      this.bind();
      this.newGame();
    }

    unmount() {
      if (this.timer) clearTimeout(this.timer);
      window.speechSynthesis && window.speechSynthesis.cancel();
    }

    template() {
      return `
        <a href="#/" class="back">⬅ All games</a>
        <section class="stage">
          <div class="progress" data-status>Find the matching pairs! 🧠</div>
          <div class="mm-grid" data-grid></div>
          <div class="controls" style="margin-top:18px">
            <button class="btn restart" data-act="new">🔄 New Game</button>
          </div>
        </section>
        <details class="settings">
          <summary>⚙️ Grown-up settings</summary>
          <div class="grid">
            <label class="field">Number of pairs
              <select data-pairs>
                <option value="4">4 (easy)</option>
                <option value="6" selected>6</option>
                <option value="8">8</option>
                <option value="10">10 (hard)</option>
              </select>
            </label>
          </div>
        </details>`;
    }

    cache() {
      this.$ = (s) => this.el.querySelector(s);
      this.grid = this.$('[data-grid]');
      this.status = this.$('[data-status]');
    }

    bind() {
      this.$('[data-act="new"]').addEventListener('click', () => this.newGame());
      this.$('[data-pairs]').addEventListener('change', (e) => {
        this.pairs = Number(e.target.value);
        this.newGame();
      });
    }

    newGame() {
      if (this.timer) clearTimeout(this.timer);
      this.lock = false;
      this.first = null;
      this.second = null;
      this.moves = 0;
      this.matched = 0;
      const chosen = shuffle([...EMOJIS]).slice(0, this.pairs);
      this.deck = shuffle(
        chosen.concat(chosen).map((emoji, key) => ({ key, emoji })),
      );
      this.renderGrid();
      this.updateStatus();
    }

    renderGrid() {
      this.grid.style.setProperty('--cols', this.deck.length <= 12 ? 4 : 5);
      this.grid.innerHTML = this.deck
        .map(
          (c) =>
            `<button class="mm-card" data-key="${c.key}">
               <span class="mm-front">❓</span><span class="mm-back">${c.emoji}</span>
             </button>`,
        )
        .join('');
      this.grid
        .querySelectorAll('.mm-card')
        .forEach((btn) => btn.addEventListener('click', () => this.flip(btn)));
    }

    flip(btn) {
      if (this.lock) return;
      if (btn.classList.contains('flipped') || btn.classList.contains('matched')) return;

      const card = this.deck.find((c) => c.key === Number(btn.dataset.key));
      btn.classList.add('flipped');

      if (!this.first) {
        this.first = { card, btn };
        return;
      }

      this.second = { card, btn };
      this.moves++;
      this.updateStatus();

      const a = this.first.btn;
      const b = this.second.btn;
      if (this.first.card.emoji === this.second.card.emoji) {
        this.matched++;
        this.first = this.second = null;
        this.timer = setTimeout(() => {
          a.classList.add('matched');
          b.classList.add('matched');
          this.checkWin();
        }, 280);
      } else {
        this.lock = true;
        this.timer = setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          this.first = this.second = null;
          this.lock = false;
        }, 850);
      }
    }

    checkWin() {
      if (this.matched === this.pairs) {
        this.status.textContent = `🎉 You won in ${this.moves} moves!`;
        speak('You won!');
      }
    }

    updateStatus() {
      if (this.matched < this.pairs) {
        this.status.textContent = `Pairs: ${this.matched}/${this.pairs}  •  Moves: ${this.moves}`;
      }
    }
  }

  window.GameComponents.register('memory-match', (container) => new MemoryMatch(container));
})();
