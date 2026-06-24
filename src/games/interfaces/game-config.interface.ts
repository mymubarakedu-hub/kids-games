/**
 * Session configuration shared by every game in the platform.
 *
 * Games may extend this with their own options (e.g. `letterMode`) but the
 * engine only depends on the timing/length fields declared here.
 */
export interface BaseGameConfig {
  /** Seconds the child has to identify the item before the answer is revealed. */
  questionDuration: number;
  /** Seconds the revealed answer stays visible before the next item. */
  answerRevealDuration: number;
  /** Total number of items (questions) in one session. */
  totalQuestions: number;
  /** When true, the session starts the timer loop immediately on creation. */
  autoStart: boolean;
}

export const DEFAULT_BASE_CONFIG: BaseGameConfig = {
  questionDuration: 4,
  answerRevealDuration: 2,
  totalQuestions: 20,
  autoStart: true,
};
