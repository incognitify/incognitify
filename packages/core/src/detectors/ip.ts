import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)';
const IPV4 = `(?<![\\d.])(?:${OCTET}\\.){3}${OCTET}(?!\\d)(?!\\.\\d)`;

const H16 = '[0-9a-fA-F]{1,4}';
const IPV6 = [
  `(?:${H16}:){7}${H16}`, // 1:2:3:4:5:6:7:8
  `(?:${H16}:){1,7}:`, // 1::, 1:2:3:4:5:6:7::
  `(?:${H16}:){1,6}:${H16}`, // 1::8, ..., 1:2:3:4:5:6::8
  `(?:${H16}:){1,5}(?::${H16}){1,2}`,
  `(?:${H16}:){1,4}(?::${H16}){1,3}`,
  `(?:${H16}:){1,3}(?::${H16}){1,4}`,
  `(?:${H16}:){1,2}(?::${H16}){1,5}`,
  `${H16}:(?::${H16}){1,6}`,
  `::(?:${H16}:){0,6}${H16}`, // ::8, ::1, ::2:3
  '::', // unspecified
].join('|');

const IP_REGEX = new RegExp(`${IPV4}|(?<![:\\w])(?:${IPV6})(?![:\\w])`, 'g');

export const ipDetector: Detector = {
  name: 'ip',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(IP_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'IP',
        value: match[0],
      });
    }
    return detections;
  },
};
