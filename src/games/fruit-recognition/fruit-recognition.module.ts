import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../interfaces';
import { DatasetRecognitionGame } from '../game-engine';
import { GameRegistryService } from '../registry';
import { FRUITS } from './data/fruits';

/**
 * Fruit Recognition — a dataset game. Game + factory + self-registering module
 * kept together since the only game-specific part is the dataset.
 */
class FruitRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'fruit-recognition';
  readonly name = 'Fruit Recognition';
  constructor(config: BaseGameConfig) {
    super(config, FRUITS);
  }
}

@Injectable()
class FruitRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'fruit-recognition',
    name: 'Fruit Recognition',
    description: 'Name the fruit before the timer reveals the answer.',
    route: '/games/fruit-recognition',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(config: BaseGameConfig): LearningGame {
    return new FruitRecognitionGame(config);
  }
}

@Module({ providers: [FruitRecognitionFactory] })
export class FruitRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: FruitRecognitionFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
