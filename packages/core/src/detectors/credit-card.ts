import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

/**
 * Matches 13–19 digit sequences with optional single spaces or hyphens between
 * digits, then Luhn-validates. The regex alone fires on phone numbers, order
 * IDs, and random digit strings; Luhn eliminates ~90% of those false positives.
 */
const CC_CANDIDATE_REGEX = /\b(?:\d[ -]?){12,18}\d\b/g;

function isLuhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const creditCardDetector: Detector = {
  name: 'credit-card',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(CC_CANDIDATE_REGEX)) {
      if (match.index === undefined) continue;
      const digits = match[0].replace(/[\s-]/g, '');
      if (!isLuhnValid(digits)) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'CREDIT_CARD',
        value: match[0],
      });
    }
    return detections;
  },
};
