/* Vehicle Recognition — shows a big vehicle emoji; the name is revealed/spoken. */
(function () {
  window.GameComponents.register(
    'vehicle-recognition',
    window.GameUI.create({
      placeholder: '🚗',
      prompt: 'What vehicle is this?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
