import { BaseGameConfig } from '../../interfaces';
import { DatasetRecognitionGame } from '../../game-engine';
import { SHAPES } from '../data/shapes';

export class ShapeRecognitionGame extends DatasetRecognitionGame {
  readonly id = 'shape-recognition';
  readonly name = 'Shape Recognition';

  constructor(config: BaseGameConfig) {
    super(config, SHAPES);
  }
}
