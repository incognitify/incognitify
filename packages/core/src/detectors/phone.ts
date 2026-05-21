import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

/**
 * Detects phone numbers that include explicit separators (space, dot, hyphen)
 * or an E.164 leading `+`. Permissive but US-centric. Unformatted 10-digit
 * sequences are skipped on purpose — every order ID would match.
 *
 * Full international validation (E.164 by country) belongs to libphonenumber;
 * deferred to a future opt-in detector.
 */
const PHONE_REGEX =
  /(?:\+\d{1,3}[\s.-]?)?\(?\d{3,4}\)?[\s.-]\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g;

export const phoneDetector: Detector = {
  name: 'phone',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(PHONE_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'PHONE',
        value: match[0],
      });
    }
    return detections;
  },
};
