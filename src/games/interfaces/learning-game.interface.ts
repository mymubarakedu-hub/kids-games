import { GameItem } from './game-item.interface';
import { GamePhase } from './game-phase.enum';

/**
 * Snapshot of a game's live state, safe to send to the client. Computed from
 * the engine's internal timers so the frontend can render a smooth countdown
 * without holding any server-side timer of its own.
 */
export interface GameState {
  phase: GamePhase;
  /** 1-based index of the current question. */
  questionNumber: number;
  totalQuestions: number;
  /** Questions whose reveal has fully elapsed. */
  completedQuestions: number;
  /** The item currently on screen (null before start / after stop). */
  currentItem: GameItem | null;
  /** Answer payload, only populated during the REVEAL phase. */
  revealedAnswer: GameItem | null;
  /** Milliseconds left in the current phase (0 when paused/idle/done). */
  remainingMs: number;
  /** Epoch ms when the current phase ends (null when not counting down). */
  phaseEndsAt: number | null;
}

/**
 * Contract every learning game implements. Mirrors the platform spec and is
 * the only surface the registry / session layer depends on — this is what
 * keeps new games drop-in.
 */
export interface LearningGame {
  readonly id: string;
  readonly name: string;

  start(): GameState;
  pause(): GameState;
  resume(): GameState;
  stop(): GameState;
  reset(): GameState;

  getCurrentItem(): GameItem | null;
  getNextItem(): GameItem;
  revealAnswer(): GameItem | null;

  /** Full live snapshot, with timers resolved to "now". */
  getState(): GameState;

  /** Release any timers/resources held by the instance. */
  dispose(): void;
}
