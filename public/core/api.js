/*
 * Thin client over the game engine. Mirrors the old NestJS REST routes 1:1, but
 * runs entirely in the browser via window.GameEngine (see core/engine.js) — no
 * server, no network. Methods stay async (returning Promises) so the rest of
 * the UI, which `await`s them, is untouched; errors surface as rejections just
 * as failed fetches used to.
 */
(function () {
  function call(fn) {
    try {
      return Promise.resolve(fn());
    } catch (e) {
      return Promise.reject(e);
    }
  }

  var E = window.GameEngine;

  window.GameApi = {
    listGames: function () { return call(function () { return E.listGames(); }); },
    start: function (gameId, config) { return call(function () { return E.start(gameId, config); }); },
    pause: function (gameId) { return call(function () { return E.pause(gameId); }); },
    resume: function (gameId) { return call(function () { return E.resume(gameId); }); },
    stop: function (gameId) { return call(function () { return E.stop(gameId); }); },
    restart: function (gameId) { return call(function () { return E.restart(gameId); }); },
    currentItem: function (gameId) { return call(function () { return E.currentItem(gameId); }); },
    revealAnswer: function (gameId) { return call(function () { return E.revealAnswer(gameId); }); },
    session: function (gameId) { return call(function () { return E.session(gameId); }); },
    saveConfig: function (gameId, config) { return call(function () { return E.saveConfig(gameId, config); }); },
  };
})();
