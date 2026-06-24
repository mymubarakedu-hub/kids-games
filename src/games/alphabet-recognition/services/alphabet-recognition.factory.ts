import { Injectable } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../../interfaces';
import { AlphabetGameConfig, LetterMode } from '../alphabet.types';
import { AlphabetRecognitionGame } from './alphabet-recognition.game';

/**
 * Factory for the Alphabet Recognition game. Registering this with the
 * GameRegistry is the only wiring that exposes the game to the whole platform.
 */
@Injectable()
export class AlphabetRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'alphabet-recognition',
    name: 'Alphabet Recognition',
    description:
      'Identify random English letters before the timer reveals the answer.',
    route: '/games/alphabet-recognition',
  };

  defaultConfig(): AlphabetGameConfig {
    return { ...DEFAULT_BASE_CONFIG, letterMode: LetterMode.MIXED };
  }

  create(config: BaseGameConfig): LearningGame {
    return new AlphabetRecognitionGame(config as AlphabetGameConfig);
  }
}
