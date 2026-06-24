/* Weather Recognition — big weather emoji; name revealed/spoken. */
(function () {
  window.GameComponents.register(
    'weather-recognition',
    window.GameUI.create({
      placeholder: '🌦️',
      prompt: "What's the weather?",
      speakOnQuestion: false,
      defaults: { questionDuration: 4, answerRevealDuration: 2, totalQuestions: 20 },
    }),
  );
})();
