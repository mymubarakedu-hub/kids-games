import { BaseLearningGame } from './base-learning-game';
import { BaseGameConfig, GameItem, GamePhase } from '../interfaces';

/** Minimal concrete game for exercising the engine state machine. */
class CounterGame extends BaseLearningGame {
  readonly id = 'counter';
  readonly name = 'Counter';
  private n = 0;

  protected generateItem(): GameItem {
    this.n += 1;
    const v = String(this.n);
    return { id: v, display: v, answer: v };
  }
}

const config: BaseGameConfig = {
  questionDuration: 4,
  answerRevealDuration: 2,
  totalQuestions: 3,
  autoStart: true,
};

describe('BaseLearningGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts in the QUESTION phase with the first item', () => {
    const game = new CounterGame(config);
    const state = game.start();
    expect(state.phase).toBe(GamePhase.QUESTION);
    expect(state.questionNumber).toBe(1);
    expect(state.currentItem?.display).toBe('1');
    game.dispose();
  });

  it('reveals the answer when the question timer elapses', () => {
    const game = new CounterGame(config);
    game.start();
    jest.advanceTimersByTime(4000);
    const state = game.getState();
    expect(state.phase).toBe(GamePhase.REVEAL);
    expect(state.revealedAnswer?.display).toBe('1');
    game.dispose();
  });

  it('advances to the next question after the reveal window', () => {
    const game = new CounterGame(config);
    game.start();
    jest.advanceTimersByTime(4000 + 2000);
    const state = game.getState();
    expect(state.phase).toBe(GamePhase.QUESTION);
    expect(state.questionNumber).toBe(2);
    expect(state.completedQuestions).toBe(1);
    game.dispose();
  });

  it('completes after the configured number of questions', () => {
    const game = new CounterGame(config);
    game.start();
    // 3 questions * (4s + 2s) = 18s
    jest.advanceTimersByTime(18000);
    const state = game.getState();
    expect(state.phase).toBe(GamePhase.COMPLETED);
    expect(state.completedQuestions).toBe(3);
    game.dispose();
  });

  it('freezes remaining time while paused and resumes it', () => {
    const game = new CounterGame(config);
    game.start();
    jest.advanceTimersByTime(1000); // 3s left on the question
    const paused = game.pause();
    expect(paused.phase).toBe(GamePhase.PAUSED);
    expect(paused.remainingMs).toBe(3000);

    // Time passing while paused does nothing.
    jest.advanceTimersByTime(10000);
    expect(game.getState().phase).toBe(GamePhase.PAUSED);

    const resumed = game.resume();
    expect(resumed.phase).toBe(GamePhase.QUESTION);
    // Still ~3s left, not yet revealed.
    jest.advanceTimersByTime(2999);
    expect(game.getState().phase).toBe(GamePhase.QUESTION);
    jest.advanceTimersByTime(1);
    expect(game.getState().phase).toBe(GamePhase.REVEAL);
    game.dispose();
  });

  it('stop() halts the loop', () => {
    const game = new CounterGame(config);
    game.start();
    game.stop();
    jest.advanceTimersByTime(20000);
    expect(game.getState().phase).toBe(GamePhase.STOPPED);
    game.dispose();
  });
});
