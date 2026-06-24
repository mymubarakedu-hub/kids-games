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
import { BODY_PARTS } from './data/body-parts';

class BodypartRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'bodypart-recognition';
  readonly name = 'Body Part Recognition';
  constructor(config: BaseGameConfig) {
    super(config, BODY_PARTS);
  }
}

@Injectable()
class BodypartRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'bodypart-recognition',
    name: 'Body Part Recognition',
    description: 'Name the body part before the timer reveals the answer.',
    route: '/games/bodypart-recognition',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(config: BaseGameConfig): LearningGame {
    return new BodypartRecognitionGame(config);
  }
}

@Module({ providers: [BodypartRecognitionFactory] })
export class BodypartRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: BodypartRecognitionFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
