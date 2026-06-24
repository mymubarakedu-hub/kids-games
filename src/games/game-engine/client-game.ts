import { GameItem, GamePhase, GameState, LearningGame } from '../interfaces';

/**
 * No-op LearningGame for games whose play happens entirely in the browser
 * (e.g. Memory Match, Tap-the-Right-One). They still register a factory so they
 * appear in the catalogue and get a route, but they don't use the server-side
 * countdown engine — so this satisfies the interface without driving timers.
 */
export class ClientGame implements LearningGame {
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  private idle(): GameState {
    return {
      phase: GamePhase.IDLE,
      questionNumber: 0,
      totalQuestions: 0,
      completedQuestions: 0,
      currentItem: null,
      revealedAnswer: null,
      remainingMs: 0,
      phaseEndsAt: null,
    };
  }

  start(): GameState {
    return this.idle();
  }
  pause(): GameState {
    return this.idle();
  }
  resume(): GameState {
    return this.idle();
  }
  stop(): GameState {
    return this.idle();
  }
  reset(): GameState {
    return this.idle();
  }
  getState(): GameState {
    return this.idle();
  }
  getCurrentItem(): GameItem | null {
    return null;
  }
  getNextItem(): GameItem {
    return { id: '', display: '', answer: '' };
  }
  revealAnswer(): GameItem | null {
    return null;
  }
  dispose(): void {
    /* nothing to release */
  }
}
