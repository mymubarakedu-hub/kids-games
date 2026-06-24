import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { ShapeRecognitionGame } from './shape-recognition.game';

@Injectable()
export class ShapeRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'shape-recognition',
    name: 'Shape Recognition',
    description: 'Name the shape before the timer reveals the answer.',
    route: '/games/shape-recognition',
  };

  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }

  create(config: BaseGameConfig): LearningGame {
    return new ShapeRecognitionGame(config);
  }
}
