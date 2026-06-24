/* Emotion Recognition — big emoji face; name revealed/spoken. */
(function () {
  window.GameComponents.register(
    'emotion-recognition',
    window.GameUI.create({
      placeholder: '😀',
      prompt: 'How is this face feeling?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
