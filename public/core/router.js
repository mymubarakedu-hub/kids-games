/*
 * Tiny hash router + game-component registry.
 *
 * Frontend mirror of the backend's game registry: each game ships a component
 * and self-registers via GameComponents.register(id, factory). The dynamic
 * route #/games/:gameId looks the component up and mounts it — no central list
 * to edit when a new game is added.
 */
(function () {
  const components = {};

  window.GameComponents = {
    register(id, factory) {
      components[id] = factory;
    },
    get(id) {
      return components[id];
    },
  };

  const listeners = [];
  window.Router = {
    onChange(fn) {
      listeners.push(fn);
    },
    go(hash) {
      window.location.hash = hash;
    },
    current() {
      const raw = window.location.hash.replace(/^#/, '') || '/';
      const m = raw.match(/^\/games\/([\w-]+)/);
      return m ? { name: 'game', gameId: m[1] } : { name: 'home' };
    },
  };

  window.addEventListener('hashchange', () =>
    listeners.forEach((fn) => fn(window.Router.current())),
  );
})();
