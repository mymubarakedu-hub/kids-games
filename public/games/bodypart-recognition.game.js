/* Body Part Recognition — big emoji; name revealed/spoken. */
(function () {
  window.GameComponents.register(
    'bodypart-recognition',
    window.GameUI.create({
      placeholder: '👀',
      prompt: 'What body part is this?',
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
