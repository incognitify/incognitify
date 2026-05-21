import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g;

export const emailDetector: Detector = {
  name: 'email',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(EMAIL_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'EMAIL',
        value: match[0],
      });
    }
    return detections;
  },
};
