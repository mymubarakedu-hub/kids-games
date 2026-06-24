import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { ColorRecognitionGame } from './color-recognition.game';

@Injectable()
export class ColorRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'color-recognition',
    name: 'Color Recognition',
    description: 'Name the color before the timer reveals the answer.',
    route: '/games/color-recognition',
  };

  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }

  create(config: BaseGameConfig): LearningGame {
    return new ColorRecognitionGame(config);
  }
}
