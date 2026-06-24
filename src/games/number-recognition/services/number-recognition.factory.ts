import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { NumberGameConfig } from '../number.types';
import { NumberRecognitionGame } from './number-recognition.game';

/**
 * Factory for the Number Recognition game. Registering it with the
 * GameRegistry exposes the game across the whole platform.
 */
@Injectable()
export class NumberRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'number-recognition',
    name: 'Number Recognition',
    description:
      'Identify numbers from a chosen range before the timer reveals the answer.',
    route: '/games/number-recognition',
  };

  defaultConfig(): NumberGameConfig {
    // Sensible starting range for a young child; raise maxNumber as they grow.
    return { ...DEFAULT_BASE_CONFIG, minNumber: 0, maxNumber: 10 };
  }

  create(config: BaseGameConfig): LearningGame {
    return new NumberRecognitionGame(config as NumberGameConfig);
  }
}
