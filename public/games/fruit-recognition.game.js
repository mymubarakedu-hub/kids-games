/* Fruit Recognition — big fruit emoji; name revealed/spoken. */
(function () {
  window.GameComponents.register(
    'fruit-recognition',
    window.GameUI.create({
      placeholder: '🍎',
      prompt: 'What fruit is this?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
