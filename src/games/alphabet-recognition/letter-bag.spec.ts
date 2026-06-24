import { LetterBag } from './letter-bag';
import { LetterMode } from './alphabet.types';

describe('LetterBag', () => {
  it('never repeats the same letter back-to-back', () => {
    const bag = new LetterBag(LetterMode.UPPERCASE);
    let prev = '';
    for (let i = 0; i < 2000; i++) {
      const letter = bag.draw();
      expect(letter).not.toBe(prev);
      prev = letter;
    }
  });

  it('distributes letters evenly (bag draws without replacement)', () => {
    const bag = new LetterBag(LetterMode.UPPERCASE);
    const counts: Record<string, number> = {};
    // 26 letters * 100 full bags = each letter exactly 100 times.
    for (let i = 0; i < 26 * 100; i++) {
      const l = bag.draw();
      counts[l] = (counts[l] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(26);
    for (const count of Object.values(counts)) {
      expect(count).toBe(100);
    }
  });

  it('uppercase mode only yields A–Z', () => {
    const bag = new LetterBag(LetterMode.UPPERCASE);
    for (let i = 0; i < 100; i++) {
      expect(bag.draw()).toMatch(/^[A-Z]$/);
    }
  });

  it('lowercase mode only yields a–z', () => {
    const bag = new LetterBag(LetterMode.LOWERCASE);
    for (let i = 0; i < 100; i++) {
      expect(bag.draw()).toMatch(/^[a-z]$/);
    }
  });
});
