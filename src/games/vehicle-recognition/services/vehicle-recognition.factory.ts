import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { VehicleRecognitionGame } from './vehicle-recognition.game';

@Injectable()
export class VehicleRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'vehicle-recognition',
    name: 'Vehicle Recognition',
    description: 'Name the vehicle before the timer reveals the answer.',
    route: '/games/vehicle-recognition',
  };

  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }

  create(config: BaseGameConfig): LearningGame {
    return new VehicleRecognitionGame(config);
  }
}
