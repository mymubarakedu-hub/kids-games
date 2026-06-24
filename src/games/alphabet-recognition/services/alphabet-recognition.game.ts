import { GameItem } from '../../interfaces';
import { BaseLearningGame } from '../../game-engine';
import { AlphabetGameConfig, LETTER_PRONUNCIATION } from '../alphabet.types';
import { LetterBag } from '../letter-bag';

/**
 * Alphabet Recognition game.
 *
 * All timing/lifecycle behaviour comes from {@link BaseLearningGame}; this
 * class only knows how to produce the next letter as a {@link GameItem}.
 */
export class AlphabetRecognitionGame extends BaseLearningGame {
  readonly id = 'alphabet-recognition';
  readonly name = 'Alphabet Recognition';

  private readonly bag: LetterBag;

  constructor(protected readonly config: AlphabetGameConfig) {
    super(config);
    this.bag = new LetterBag(config.letterMode);
  }

  protected generateItem(): GameItem {
    const letter = this.bag.draw();
    const upper = letter.toUpperCase();
    const pronunciation = LETTER_PRONUNCIATION[upper];
    return {
      id: letter,
      display: letter,
      answer: letter,
      pronunciation,
      // Wired for future audio assets, e.g. /audio/letters/m.mp3
      audioUrl: `/audio/letters/${upper.toLowerCase()}.mp3`,
      meta: { case: letter === upper ? 'upper' : 'lower' },
    };
  }
}
