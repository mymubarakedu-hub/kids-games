import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { AnimalRecognitionGame } from './animal-recognition.game';

@Injectable()
export class AnimalRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'animal-recognition',
    name: 'Animal Recognition',
    description: 'Name the animal before the timer reveals the answer.',
    route: '/games/animal-recognition',
  };

  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }

  create(config: BaseGameConfig): LearningGame {
    return new AnimalRecognitionGame(config);
  }
}
