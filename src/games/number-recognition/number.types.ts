import { BaseGameConfig } from '../interfaces';

/**
 * Number game config = the shared timing fields plus an inclusive range.
 * Start small (0–10) and raise the ceiling as the child grows.
 */
export interface NumberGameConfig extends BaseGameConfig {
  minNumber: number;
  maxNumber: number;
}
