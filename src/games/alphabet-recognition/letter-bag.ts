import { LetterMode } from './alphabet.types';

const UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const LOWER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));

/**
 * Draws letters with two guarantees the spec asks for:
 *   1. Balanced distribution — uses a shuffled "bag" (draw without replacement);
 *      every letter appears once before any repeats, so no letter is starved
 *      or over-shown across a session.
 *   2. No immediate repetition — when a fresh bag is shuffled, its first letter
 *      is swapped if it equals the last one drawn.
 */
export class LetterBag {
  private readonly pool: string[];
  private bag: string[] = [];
  private last: string | null = null;

  constructor(mode: LetterMode) {
    this.pool = this.buildPool(mode);
  }

  draw(): string {
    if (this.bag.length === 0) {
      this.refill();
    }
    const letter = this.bag.pop() as string;
    this.last = letter;
    return letter;
  }

  private buildPool(mode: LetterMode): string[] {
    switch (mode) {
      case LetterMode.UPPERCASE:
        return [...UPPER];
      case LetterMode.LOWERCASE:
        return [...LOWER];
      case LetterMode.MIXED:
      default:
        return [...UPPER, ...LOWER];
    }
  }

  private refill(): void {
    this.bag = this.shuffle([...this.pool]);
    // `pop()` takes from the end, so guard the *last* element against a repeat.
    if (this.bag.length > 1 && this.bag[this.bag.length - 1] === this.last) {
      const swapIdx = Math.floor(Math.random() * (this.bag.length - 1));
      const end = this.bag.length - 1;
      [this.bag[swapIdx], this.bag[end]] = [this.bag[end], this.bag[swapIdx]];
    }
  }

  /** Fisher–Yates. */
  private shuffle(arr: string[]): string[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
