/**
 * Finite states a game session moves through. The engine is a small state
 * machine; every game inherits these transitions for free.
 */
export enum GamePhase {
  /** Created but the loop has not started yet. */
  IDLE = 'idle',
  /** An item is shown and the countdown is running. */
  QUESTION = 'question',
  /** The countdown hit zero; the answer is visible. */
  REVEAL = 'reveal',
  /** The loop is suspended; remaining time is frozen. */
  PAUSED = 'paused',
  /** All questions were shown; the session is finished. */
  COMPLETED = 'completed',
  /** The session was stopped early by the user. */
  STOPPED = 'stopped',
}
