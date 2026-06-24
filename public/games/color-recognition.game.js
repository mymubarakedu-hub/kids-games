/* Color Recognition — shows a big color swatch; the name is revealed/spoken. */
(function () {
  window.GameComponents.register(
    'color-recognition',
    window.GameUI.create({
      placeholder: '🎨',
      prompt: 'What color is this?',
      speakOnQuestion: false, // let the child guess; speak the name on reveal
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
      renderItem(el, item) {
        const hex = (item.meta && item.meta.hex) || '#cccccc';
        el.className = 'letter';
        el.innerHTML = `<div class="swatch" style="background:${hex}"></div>`;
      },
    }),
  );
})();
