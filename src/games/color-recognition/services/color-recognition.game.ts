import { BaseGameConfig } from '../../interfaces';
import { DatasetRecognitionGame } from '../../game-engine';
import { COLORS } from '../data/colors';

export class ColorRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'color-recognition';
  readonly name = 'Color Recognition';

  constructor(config: BaseGameConfig) {
    super(config, COLORS);
  }
}
