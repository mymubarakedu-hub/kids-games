import { GameItem } from '../../interfaces';
import { BaseLearningGame } from '../../game-engine';
import { NumberGameConfig } from '../number.types';
import { NumberBag } from '../number-bag';
import { numberToWords } from '../number-words';

/**
 * Number Recognition game. Shows a random number from the configured range and
 * reveals its spoken name. All timing/lifecycle comes from BaseLearningGame.
 */
export class NumberRecognitionGame extends BaseLearningGame {
  readonly id = 'number-recognition';
  readonly name = 'Number Recognition';

  private readonly bag: NumberBag;

  constructor(protected readonly config: NumberGameConfig) {
    super(config);
    this.bag = new NumberBag(config.minNumber, config.maxNumber);
  }

  protected generateItem(): GameItem {
    const n = this.bag.draw();
    const value = String(n);
    return {
      id: value,
      display: value,
      answer: value,
      pronunciation: numberToWords(n),
      meta: { value: n },
    };
  }
}
