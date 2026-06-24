import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameItem,
  GameMetadata,
  LearningGame,
} from '../interfaces';
import { BaseLearningGame } from '../game-engine';
import { GameRegistryService } from '../registry';
import { NumberBag } from '../number-recognition/number-bag';
import { numberToWords } from '../number-recognition/number-words';
import { COUNT_OBJECTS } from './data/objects';

/** Counting config = shared timing fields plus how high to count. */
export interface CountingConfig extends BaseGameConfig {
  minCount: number;
  maxCount: number;
}

/**
 * Counting game. Shows N copies of an object; the answer is the count. Reuses
 * the number engine's balanced bag for the counts and number-to-words for the
 * spoken answer — a natural step up from Number Recognition.
 */
class CountingGame extends BaseLearningGame {
  readonly id = 'counting';
  readonly name = 'Counting';

  private readonly bag: NumberBag;

  constructor(protected readonly config: CountingConfig) {
    super(config);
    this.bag = new NumberBag(config.minCount, config.maxCount);
  }

  protected generateItem(): GameItem {
    const count = this.bag.draw();
    const emoji = COUNT_OBJECTS[Math.floor(Math.random() * COUNT_OBJECTS.length)];
    return {
      id: `${emoji}-${count}`,
      display: emoji,
      answer: String(count),
      pronunciation: numberToWords(count),
      meta: { count, emoji },
    };
  }
}

@Injectable()
class CountingFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'counting',
    name: 'Counting',
    description: 'Count the objects before the timer reveals how many.',
    route: '/games/counting',
  };
  defaultConfig(): CountingConfig {
    return { ...DEFAULT_BASE_CONFIG, minCount: 1, maxCount: 5 };
  }
  create(config: BaseGameConfig): LearningGame {
    return new CountingGame(config as CountingConfig);
  }
}

@Module({ providers: [CountingFactory] })
export class CountingModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: CountingFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
