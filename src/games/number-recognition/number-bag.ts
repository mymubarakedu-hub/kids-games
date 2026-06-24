/**
 * Draws numbers from an inclusive [min, max] range with the same guarantees as
 * the alphabet's LetterBag: balanced distribution (shuffled draw-without-
 * replacement) and no immediate repetition. Falls back gracefully when the
 * range is a single number.
 */
export class NumberBag {
  private readonly pool: number[];
  private bag: number[] = [];
  private last: number | null = null;

  constructor(min: number, max: number) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    this.pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }

  draw(): number {
    if (this.bag.length === 0) {
      this.refill();
    }
    const n = this.bag.pop() as number;
    this.last = n;
    return n;
  }

  private refill(): void {
    this.bag = this.shuffle([...this.pool]);
    // pop() takes from the end — guard it against repeating the last draw.
    if (this.bag.length > 1 && this.bag[this.bag.length - 1] === this.last) {
      const swapIdx = Math.floor(Math.random() * (this.bag.length - 1));
      const end = this.bag.length - 1;
      [this.bag[swapIdx], this.bag[end]] = [this.bag[end], this.bag[swapIdx]];
    }
  }

  private shuffle(arr: number[]): number[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
