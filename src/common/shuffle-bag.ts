/**
 * Generic balanced random picker. Draws items from a fixed pool without
 * replacement (every item appears once before any repeats) and never returns
 * the same item twice in a row. Used by all dataset-based games (colors,
 * shapes, vehicles, animals) — the same guarantees as the alphabet/number bags.
 */
export class ShuffleBag<T> {
  private bag: T[] = [];
  private last: T | null = null;

  constructor(private readonly pool: T[]) {}

  draw(): T {
    if (this.bag.length === 0) {
      this.refill();
    }
    const item = this.bag.pop() as T;
    this.last = item;
    return item;
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

  private shuffle(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
