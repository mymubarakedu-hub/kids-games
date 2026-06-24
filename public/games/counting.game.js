/* Counting — show N objects in a grid; the answer is how many. */
(function () {
  window.GameComponents.register(
    'counting',
    window.GameUI.create({
      placeholder: '🔢',
      prompt: 'How many do you see?',
      speakOnQuestion: false,
      defaults: {
        questionDuration: 5,
        answerRevealDuration: 2,
        totalQuestions: 20,
        minCount: 1,
        maxCount: 5,
      },
      settingsFields: [
        { key: 'maxCount', label: 'Count up to', type: 'number', min: 1, max: 20 },
      ],
      normalize(config) {
        // Keep at least 1 and don't let the floor exceed the ceiling.
        config.minCount = 1;
        if (config.maxCount < 1) config.maxCount = 1;
      },
      renderItem(el, item) {
        const count = (item.meta && item.meta.count) || 1;
        const emoji = (item.meta && item.meta.emoji) || '⭐';
        const cells = Array.from({ length: count }, () => `<span>${emoji}</span>`).join('');
        el.className = 'letter';
        el.innerHTML = `<div class="count-grid">${cells}</div>`;
      },
    }),
  );
})();
