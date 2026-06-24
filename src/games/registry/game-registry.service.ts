import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BaseGameConfig,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../interfaces';

/**
 * Central catalogue of every game on the platform.
 *
 * Game modules self-register their {@link GameFactory} here on startup, so the
 * rest of the system (controllers, sessions, frontend catalogue) never needs
 * to know which concrete games exist. Adding a game = registering a factory.
 */
@Injectable()
export class GameRegistryService {
  private readonly logger = new Logger(GameRegistryService.name);
  private readonly factories = new Map<string, GameFactory>();

  register(factory: GameFactory): void {
    const { id } = factory.metadata;
    if (this.factories.has(id)) {
      this.logger.warn(`Game "${id}" is already registered; overwriting.`);
    }
    this.factories.set(id, factory);
    this.logger.log(`Registered game: ${id}`);
  }

  /** Catalogue of all registered games (for `GET /games`). */
  list(): GameMetadata[] {
    return [...this.factories.values()].map((f) => f.metadata);
  }

  has(gameId: string): boolean {
    return this.factories.has(gameId);
  }

  getFactory(gameId: string): GameFactory {
    const factory = this.factories.get(gameId);
    if (!factory) {
      throw new NotFoundException(`Unknown game: "${gameId}"`);
    }
    return factory;
  }

  /** Merge caller overrides onto the game's defaults. */
  resolveConfig(
    gameId: string,
    overrides: Partial<BaseGameConfig> = {},
  ): BaseGameConfig {
    return { ...this.getFactory(gameId).defaultConfig(), ...overrides };
  }

  /** Mint a fresh, isolated game instance for a new session. */
  createInstance(gameId: string, config: BaseGameConfig): LearningGame {
    return this.getFactory(gameId).create(config);
  }
}
