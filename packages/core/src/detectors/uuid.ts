import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

const UUID_REGEX =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

export const uuidDetector: Detector = {
  name: 'uuid',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(UUID_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'UUID',
        value: match[0],
      });
    }
    return detections;
  },
};
