/* Shape Recognition — draws a big SVG shape; the name is revealed/spoken. */
(function () {
  const FILL = '#845ec2';

  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="42" />',
    square: '<rect x="10" y="10" width="80" height="80" rx="8" />',
    rectangle: '<rect x="6" y="26" width="88" height="48" rx="8" />',
    triangle: '<polygon points="50,8 92,90 8,90" />',
    oval: '<ellipse cx="50" cy="50" rx="44" ry="30" />',
    diamond: '<polygon points="50,6 92,50 50,94 8,50" />',
    star: '<polygon points="50,5 61,38 96,38 68,59 79,92 50,72 21,92 32,59 4,38 39,38" />',
    heart:
      '<path d="M50,84 C50,84 10,56 10,32 C10,18 22,10 34,14 C42,17 48,24 50,30 C52,24 58,17 66,14 C78,10 90,18 90,32 C90,56 50,84 50,84 Z" />',
  };

  function shapeSvg(key) {
    const body = SHAPES[key] || SHAPES.circle;
    return `<svg viewBox="0 0 100 100" class="shape-svg" fill="${FILL}">${body}</svg>`;
  }

  window.GameComponents.register(
    'shape-recognition',
    window.GameUI.create({
      placeholder: '🔷',
      prompt: 'What shape is this?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
      renderItem(el, item) {
        const key = (item.meta && item.meta.shape) || 'circle';
        el.className = 'letter';
        el.innerHTML = shapeSvg(key);
      },
    }),
  );
})();
