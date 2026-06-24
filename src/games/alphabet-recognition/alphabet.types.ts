import { BaseGameConfig } from '../interfaces';

export enum LetterMode {
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  MIXED = 'mixed',
}

/** Alphabet game config = the shared timing fields plus a letter mode. */
export interface AlphabetGameConfig extends BaseGameConfig {
  letterMode: LetterMode;
}

/** How each letter is pronounced, keyed by uppercase letter. */
export const LETTER_PRONUNCIATION: Record<string, string> = {
  A: 'Ay', B: 'Bee', C: 'See', D: 'Dee', E: 'Ee', F: 'Eff',
  G: 'Gee', H: 'Aitch', I: 'Eye', J: 'Jay', K: 'Kay', L: 'El',
  M: 'Em', N: 'En', O: 'Oh', P: 'Pee', Q: 'Cue', R: 'Ar',
  S: 'Ess', T: 'Tee', U: 'You', V: 'Vee', W: 'Double-you',
  X: 'Ex', Y: 'Why', Z: 'Zee',
};
