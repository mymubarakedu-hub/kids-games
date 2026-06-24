/* Top-level view controller: renders the catalogue and mounts game components. */
(function () {
  const view = document.getElementById('view');
  const EMOJI = {
    'alphabet-recognition': '🔤',
    'number-recognition': '🔢',
    'color-recognition': '🎨',
    'shape-recognition': '🔷',
    'vehicle-recognition': '🚗',
    'animal-recognition': '🐶',
    'fruit-recognition': '🍎',
    'weather-recognition': '🌦️',
    'emotion-recognition': '😀',
    'bodypart-recognition': '👀',
    'counting': '🔢',
    'memory-match': '🧠',
    'tap-the-one': '👆',
  };

  let active = null; // currently mounted game component

  function unmountActive() {
    if (active && active.unmount) active.unmount();
    active = null;
  }

  async function renderHome() {
    unmountActive();
    view.innerHTML = `<h1 class="cat-title">Pick a game to play! 🎉</h1>
      <div class="card-grid" id="grid"><p class="hint">Loading games…</p></div>`;
    try {
      const games = await window.GameApi.listGames();
      const grid = document.getElementById('grid');
      if (!games.length) {
        grid.innerHTML = `<p class="hint">No games registered yet.</p>`;
        return;
      }
      grid.innerHTML = games
        .map(
          (g) => `
        <a class="game-card" href="#/games/${g.id}">
          <span class="emoji">${EMOJI[g.id] || '🎮'}</span>
          <h3>${g.name}</h3>
          <p>${g.description || ''}</p>
        </a>`,
        )
        .join('');
    } catch (e) {
      view.innerHTML = `<p class="hint">Could not load games: ${e.message}</p>`;
    }
  }

  function renderGame(gameId) {
    unmountActive();
    const factory = window.GameComponents.get(gameId);
    if (!factory) {
      view.innerHTML = `<a href="#/" class="back">⬅ All games</a>
        <p class="hint">🚧 "${gameId}" is coming soon!</p>`;
      return;
    }
    active = factory(view, gameId);
    active.mount();
  }

  function route(r) {
    if (r.name === 'game') renderGame(r.gameId);
    else renderHome();
  }

  window.Router.onChange(route);
  route(window.Router.current());
})();
