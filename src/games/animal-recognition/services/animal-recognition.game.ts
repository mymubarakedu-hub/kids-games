import { BaseGameConfig } from '../../interfaces';
import { DatasetRecognitionGame } from '../../game-engine';
import { ANIMALS } from '../data/animals';

export class AnimalRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'animal-recognition';
  readonly name = 'Animal Recognition';

  constructor(config: BaseGameConfig) {
    super(config, ANIMALS);
  }
}
