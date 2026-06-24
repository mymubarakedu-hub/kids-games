import { ShuffleBag } from '../../common/shuffle-bag';
import { BaseGameConfig, GameItem } from '../interfaces';
import { BaseLearningGame } from './base-learning-game';

/**
 * Engine specialisation for "show this thing, name it" games whose items come
 * from a fixed dataset (colors, shapes, vehicles, animals...).
 *
 * Concrete games just declare their id/name and pass their dataset to super();
 * randomness, balance, anti-repeat and the whole timer lifecycle are inherited.
 */
export abstract class DatasetRecognitionGame extends BaseLearningGame {
  private readonly bag: ShuffleBag<GameItem>;

  constructor(config: BaseGameConfig, dataset: GameItem[]) {
    super(config);
    this.bag = new ShuffleBag(dataset);
  }

  protected generateItem(): GameItem {
    return this.bag.draw();
  }
}
