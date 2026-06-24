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
import { EMOTIONS } from './data/emotions';

class EmotionRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'emotion-recognition';
  readonly name = 'Emotion Recognition';
  constructor(config: BaseGameConfig) {
    super(config, EMOTIONS);
  }
}

@Injectable()
class EmotionRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'emotion-recognition',
    name: 'Emotion Recognition',
    description: 'Name the feeling before the timer reveals the answer.',
    route: '/games/emotion-recognition',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(config: BaseGameConfig): LearningGame {
    return new EmotionRecognitionGame(config);
  }
}

@Module({ providers: [EmotionRecognitionFactory] })
export class EmotionRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: EmotionRecognitionFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
