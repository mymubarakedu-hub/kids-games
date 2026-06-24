/* Animal Recognition — shows a big animal emoji; the name is revealed/spoken. */
(function () {
  window.GameComponents.register(
    'animal-recognition',
    window.GameUI.create({
      placeholder: '🐶',
      prompt: 'What animal is this?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
