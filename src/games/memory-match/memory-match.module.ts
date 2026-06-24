import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../interfaces';
import { ClientGame } from '../game-engine';
import { GameRegistryService } from '../registry';

/**
 * Memory Match registers in the catalogue but plays entirely in the browser
 * (flip-and-pair grid), so it uses a ClientGame stub rather than the countdown
 * engine.
 */
@Injectable()
class MemoryMatchFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip the cards and find the matching pairs.',
    route: '/games/memory-match',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(): LearningGame {
    return new ClientGame(this.metadata.id, this.metadata.name);
  }
}

@Module({ providers: [MemoryMatchFactory] })
export class MemoryMatchModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: MemoryMatchFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
