import { BaseGameConfig } from '../../interfaces';
import { DatasetRecognitionGame } from '../../game-engine';
import { VEHICLES } from '../data/vehicles';

export class VehicleRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'vehicle-recognition';
  readonly name = 'Vehicle Recognition';

  constructor(config: BaseGameConfig) {
    super(config, VEHICLES);
  }
}
