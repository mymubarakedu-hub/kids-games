import { Logger } from '@nestjs/common';
import {
  BaseGameConfig,
  GameItem,
  GamePhase,
  GameState,
  LearningGame,
} from '../interfaces';

/**
 * Reusable game engine.
 *
 * Implements the full question/answer/timer life-cycle described in the spec
 * as a small finite state machine driven by server-side timers:
 *
 *   QUESTION --(questionDuration)--> REVEAL --(answerRevealDuration)--> QUESTION
 *                                                          \--> COMPLETED
 *
 * Concrete games only implement {@link generateItem}; everything about timing,
 * pausing, progress tracking and state snapshots is inherited. This is what
 * lets number/color/shape games be added without touching the engine.
 */
export abstract class BaseLearningGame implements LearningGame {
  abstract readonly id: string;
  abstract readonly name: string;

  protected readonly logger = new Logger(this.constructor.name);

  protected phase: GamePhase = GamePhase.IDLE;
  protected questionNumber = 0;
  protected completedQuestions = 0;
  protected currentItem: GameItem | null = null;
  protected previousItem: GameItem | null = null;

  /** Epoch ms at which the active countdown ends (null when not counting). */
  private phaseEndsAt: number | null = null;
  /** Frozen remaining ms while paused. */
  private pausedRemainingMs = 0;
  /** Phase to return to after resume(). */
  private resumePhase: GamePhase = GamePhase.QUESTION;
  private timer: NodeJS.Timeout | null = null;

  constructor(protected readonly config: BaseGameConfig) {}

  /**
   * Produce the next item to show. Implementations own randomness, anti-repeat
   * and distribution. {@link previousItem} is available to avoid repeats.
   */
  protected abstract generateItem(): GameItem;

  // --- lifecycle controls -------------------------------------------------

  start(): GameState {
    this.reset();
    this.questionNumber = 1;
    this.enterQuestion();
    this.logger.log(`Session started: ${this.config.totalQuestions} questions`);
    return this.getState();
  }

  pause(): GameState {
    if (this.phase !== GamePhase.QUESTION && this.phase !== GamePhase.REVEAL) {
      return this.getState();
    }
    this.clearTimer();
    this.resumePhase = this.phase;
    this.pausedRemainingMs = this.computeRemainingMs();
    this.phase = GamePhase.PAUSED;
    this.phaseEndsAt = null;
    return this.getState();
  }

  resume(): GameState {
    if (this.phase !== GamePhase.PAUSED) {
      return this.getState();
    }
    this.phase = this.resumePhase;
    this.schedule(this.pausedRemainingMs, () =>
      this.phase === GamePhase.QUESTION ? this.enterReveal() : this.advance(),
    );
    return this.getState();
  }

  stop(): GameState {
    this.clearTimer();
    this.phase = GamePhase.STOPPED;
    this.phaseEndsAt = null;
    return this.getState();
  }

  reset(): GameState {
    this.clearTimer();
    this.phase = GamePhase.IDLE;
    this.questionNumber = 0;
    this.completedQuestions = 0;
    this.currentItem = null;
    this.previousItem = null;
    this.phaseEndsAt = null;
    this.pausedRemainingMs = 0;
    return this.getState();
  }

  // --- item access --------------------------------------------------------

  getCurrentItem(): GameItem | null {
    return this.currentItem;
  }

  getNextItem(): GameItem {
    this.previousItem = this.currentItem;
    this.currentItem = this.generateItem();
    return this.currentItem;
  }

  /**
   * Force-reveal the current answer. If the countdown is still running it is
   * cut short and the reveal phase begins immediately.
   */
  revealAnswer(): GameItem | null {
    if (this.phase === GamePhase.QUESTION) {
      this.clearTimer();
      this.enterReveal();
    }
    return this.currentItem;
  }

  // --- state snapshot -----------------------------------------------------

  getState(): GameState {
    return {
      phase: this.phase,
      questionNumber: this.questionNumber,
      totalQuestions: this.config.totalQuestions,
      completedQuestions: this.completedQuestions,
      currentItem: this.currentItem,
      revealedAnswer: this.phase === GamePhase.REVEAL ? this.currentItem : null,
      remainingMs: this.computeRemainingMs(),
      phaseEndsAt: this.phaseEndsAt,
    };
  }

  dispose(): void {
    this.clearTimer();
  }

  // --- internal state machine --------------------------------------------

  private enterQuestion(): void {
    this.phase = GamePhase.QUESTION;
    this.getNextItem();
    this.schedule(this.config.questionDuration * 1000, () => this.enterReveal());
  }

  private enterReveal(): void {
    this.phase = GamePhase.REVEAL;
    this.schedule(this.config.answerRevealDuration * 1000, () => this.advance());
  }

  private advance(): void {
    this.completedQuestions += 1;
    if (this.questionNumber >= this.config.totalQuestions) {
      this.complete();
      return;
    }
    this.questionNumber += 1;
    this.enterQuestion();
  }

  private complete(): void {
    this.clearTimer();
    this.phase = GamePhase.COMPLETED;
    this.phaseEndsAt = null;
    this.logger.log('Session completed');
  }

  // --- timer helpers ------------------------------------------------------

  private schedule(ms: number, fn: () => void): void {
    this.clearTimer();
    this.phaseEndsAt = this.now() + ms;
    this.timer = setTimeout(fn, Math.max(0, ms));
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private computeRemainingMs(): number {
    if (this.phase === GamePhase.PAUSED) {
      return this.pausedRemainingMs;
    }
    if (this.phaseEndsAt === null) {
      return 0;
    }
    return Math.max(0, this.phaseEndsAt - this.now());
  }

  /** Wrapped for testability / future fake clocks. */
  protected now(): number {
    return Date.now();
  }
}
