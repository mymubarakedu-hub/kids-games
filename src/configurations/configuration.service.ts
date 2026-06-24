import { Injectable } from '@nestjs/common';
import { BaseGameConfig } from '../games/interfaces';

/**
 * Stores per-game configuration set by parents/admins.
 *
 * In-memory for now (one store, swap for a repository later without touching
 * callers). Saved values are overrides that get merged onto each game's
 * defaults when a session starts.
 */
@Injectable()
export class ConfigurationService {
  private readonly store = new Map<string, Partial<BaseGameConfig>>();

  save(gameId: string, config: Partial<BaseGameConfig>): Partial<BaseGameConfig> {
    const merged = { ...this.store.get(gameId), ...config };
    this.store.set(gameId, merged);
    return merged;
  }

  get(gameId: string): Partial<BaseGameConfig> {
    return this.store.get(gameId) ?? {};
  }

  clear(gameId: string): void {
    this.store.delete(gameId);
  }
}
