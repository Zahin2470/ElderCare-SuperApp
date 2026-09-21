/**
 * Normalise a Bangladesh mobile number to E.164 (+8801XXXXXXXXX).
 * Accepts: +8801712345678, 8801712345678, 01712345678, 1712345678 (and the UI's "+880" + "01712…" mistake).
 * Returns null when the input is not a valid BD mobile number (operator prefixes 013–019).
 */
export function normalizeBdPhone(input: string): string | null {
  let d = input.replace(/[^\d+]/g, '');
  if (d.startsWith('+880')) d = d.slice(4);
  else if (d.startsWith('880')) d = d.slice(3);
  d = d.replace(/^0+/, '');
  return /^1[3-9]\d{8}$/.test(d) ? `+880${d}` : null;
}

export const maskPhone = (p: string) => p.replace(/^(\+880\d{2})\d{6}(\d{2})$/, '$1*****$2');
