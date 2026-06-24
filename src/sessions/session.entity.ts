import { BaseGameConfig, LearningGame } from '../games/interfaces';

/**
 * One play-through of a game. Owns the live game instance plus tracking
 * metadata (start time, totals). Kept deliberately small; richer analytics
 * (accuracy, response time) can hang off `meta` later.
 */
export class GameSession {
  readonly meta: Record<string, unknown> = {};

  constructor(
    readonly id: string,
    readonly gameId: string,
    readonly game: LearningGame,
    readonly config: BaseGameConfig,
    readonly startedAt: number,
  ) {}

  /** Wall-clock seconds elapsed since the session started. */
  elapsedSeconds(now: number): number {
    return Math.round((now - this.startedAt) / 1000);
  }
}

/** Serialisable progress summary returned by the session-tracking endpoint. */
export interface SessionSummary {
  sessionId: string;
  gameId: string;
  phase: string;
  questionNumber: number;
  totalQuestions: number;
  completedQuestions: number;
  timeSpentSeconds: number;
}
