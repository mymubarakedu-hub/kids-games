/* Thin client over the NestJS REST API. Mirrors the backend routes 1:1. */
(function () {
  async function req(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`${method} ${path} → ${res.status} ${detail}`);
    }
    return res.status === 204 ? null : res.json();
  }

  window.GameApi = {
    listGames: () => req('GET', '/games'),
    start: (gameId, config) => req('POST', `/games/${gameId}/start`, config || {}),
    pause: (gameId) => req('POST', `/games/${gameId}/pause`),
    resume: (gameId) => req('POST', `/games/${gameId}/resume`),
    stop: (gameId) => req('POST', `/games/${gameId}/stop`),
    restart: (gameId) => req('POST', `/games/${gameId}/restart`),
    currentItem: (gameId) => req('GET', `/games/${gameId}/current-item`),
    revealAnswer: (gameId) => req('GET', `/games/${gameId}/reveal-answer`),
    session: (gameId) => req('GET', `/games/${gameId}/session`),
    saveConfig: (gameId, config) =>
      req('POST', `/games/${gameId}/configuration`, config),
  };
})();
