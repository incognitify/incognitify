import type { Detection } from '../detection.js';
import type { Detector } from '../detector.js';

/**
 * Provider-specific API key patterns. Each entry must start with a fixed,
 * unambiguous prefix and an entropy-bearing tail. Order matters: more
 * specific prefixes go first so they win the leftmost alternation.
 *
 * Generic high-entropy / shannon detection is intentionally out of scope for
 * v0.1 — too many false positives on hashes, UUIDs without dashes, base64.
 */
const PATTERNS = [
  'A[KS]IA[0-9A-Z]{16}', // AWS access / temp credentials
  'gh[pousr]_[A-Za-z0-9]{36,255}', // GitHub PAT / OAuth / server
  'sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{20,}', // Anthropic
  'sk-proj-[A-Za-z0-9_-]{20,}', // OpenAI project keys
  'sk-(?!ant-|proj-)[A-Za-z0-9]{20,}', // OpenAI legacy
  '(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{24,}', // Stripe
  'xox[abprs]-[A-Za-z0-9-]{20,}', // Slack
  'AIza[0-9A-Za-z_-]{35}', // Google API keys
];

const API_KEY_REGEX = new RegExp(`(?:${PATTERNS.join('|')})`, 'g');

export const apiKeyDetector: Detector = {
  name: 'api-key',
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const match of text.matchAll(API_KEY_REGEX)) {
      if (match.index === undefined) continue;
      detections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'API_KEY',
        value: match[0],
      });
    }
    return detections;
  },
};
