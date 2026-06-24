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
import { WEATHER } from './data/weather';

class WeatherRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'weather-recognition';
  readonly name = 'Weather Recognition';
  constructor(config: BaseGameConfig) {
    super(config, WEATHER);
  }
}

@Injectable()
class WeatherRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'weather-recognition',
    name: 'Weather Recognition',
    description: 'Name the weather before the timer reveals the answer.',
    route: '/games/weather-recognition',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(config: BaseGameConfig): LearningGame {
    return new WeatherRecognitionGame(config);
  }
}

@Module({ providers: [WeatherRecognitionFactory] })
export class WeatherRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: WeatherRecognitionFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
