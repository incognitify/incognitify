import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

/**
 * Matches US Social Security Numbers in the canonical hyphenated form
 * `XXX-XX-XXXX`. Unformatted 9-digit sequences are intentionally not matched
 * here — too many false positives (order numbers, IDs, etc.). Catching
 * unformatted SSNs requires context (structured-data mode in v0.2).
 */
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export const ssnDetector: Detector = {
  name: 'ssn',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(SSN_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'SSN',
        value: match[0],
      });
    }
    return detections;
  },
};
