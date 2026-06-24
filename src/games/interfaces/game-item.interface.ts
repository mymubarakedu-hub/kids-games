/**
 * A single "question" produced by a game.
 *
 * Every game (alphabet, numbers, colors, shapes...) reduces a round to:
 *   - what we show the child  (`display`)
 *   - the correct answer       (`answer`)
 *   - how to say it out loud   (`pronunciation`)
 *
 * Game-specific extras can live in `meta` without changing the engine.
 */
export interface GameItem {
  /** Stable id for this item within the round, e.g. "M" or "7". */
  id: string;
  /** What is rendered to the child (a letter, number, color hex, shape name...). */
  display: string;
  /** The canonical correct answer revealed after the timer. */
  answer: string;
  /** Human pronunciation hint, e.g. "Em", "Gee". */
  pronunciation?: string;
  /** Optional URL to a pronunciation audio clip. */
  audioUrl?: string;
  /** Arbitrary game-specific payload (color hex, image url, etc.). */
  meta?: Record<string, unknown>;
}
