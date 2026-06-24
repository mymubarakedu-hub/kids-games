const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? `-${ONES[o]}` : '');
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${ONES[h]} hundred${r ? ` ${below100(r)}` : ''}`;
}

/**
 * Spoken/written name for a number, e.g. 7 → "Seven", 42 → "Forty-two".
 * Covers 0–9999 (more than enough for early learners); beyond that we just
 * fall back to the digits, which screen readers / speech synthesis read fine.
 */
export function numberToWords(n: number): string {
  let words: string;
  if (n < 1000) {
    words = below1000(n);
  } else if (n < 10000) {
    const th = Math.floor(n / 1000);
    const r = n % 1000;
    words = `${below1000(th)} thousand${r ? ` ${below1000(r)}` : ''}`;
  } else {
    words = String(n);
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}
