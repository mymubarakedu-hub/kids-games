import { BaseGameConfig } from './game-config.interface';
import { LearningGame } from './learning-game.interface';

/** Lightweight, serialisable description of a game for the catalogue. */
export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  route: string;
}

/**
 * A factory knows how to describe a game and mint fresh, independent
 * instances of it (one per session). Registering a factory is the *only*
 * step required to add a new game to the platform.
 */
export interface GameFactory {
  readonly metadata: GameMetadata;
  /** The shape of config this game accepts, with sensible defaults. */
  defaultConfig(): BaseGameConfig;
  /** Create a new, isolated game instance for a session. */
  create(config: BaseGameConfig): LearningGame;
}

/** DI token for the array of registered game factories. */
export const GAME_FACTORY = 'GAME_FACTORY';
