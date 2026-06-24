import { NumberBag } from './number-bag';
import { numberToWords } from './number-words';

describe('NumberBag', () => {
  it('only yields numbers within the inclusive range', () => {
    const bag = new NumberBag(0, 10);
    for (let i = 0; i < 500; i++) {
      const n = bag.draw();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('never repeats the same number back-to-back', () => {
    const bag = new NumberBag(0, 10);
    let prev = NaN;
    for (let i = 0; i < 1000; i++) {
      const n = bag.draw();
      expect(n).not.toBe(prev);
      prev = n;
    }
  });

  it('distributes evenly across a full bag', () => {
    const bag = new NumberBag(1, 5); // 5 numbers
    const counts: Record<number, number> = {};
    for (let i = 0; i < 5 * 200; i++) {
      const n = bag.draw();
      counts[n] = (counts[n] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(5);
    for (const c of Object.values(counts)) expect(c).toBe(200);
  });

  it('handles a reversed range and a single-number range', () => {
    expect(() => new NumberBag(10, 0).draw()).not.toThrow();
    const single = new NumberBag(7, 7);
    expect(single.draw()).toBe(7);
    expect(single.draw()).toBe(7);
  });
});

describe('numberToWords', () => {
  it('names common values correctly', () => {
    expect(numberToWords(0)).toBe('Zero');
    expect(numberToWords(13)).toBe('Thirteen');
    expect(numberToWords(21)).toBe('Twenty-one');
    expect(numberToWords(100)).toBe('One hundred');
  });
});
