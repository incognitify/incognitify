import type { Detector } from '../detector.js';
import { apiKeyDetector } from './api-key.js';
import { creditCardDetector } from './credit-card.js';
import { emailDetector } from './email.js';
import { ipDetector } from './ip.js';
import { phoneDetector } from './phone.js';
import { ssnDetector } from './ssn.js';
import { uuidDetector } from './uuid.js';

export { apiKeyDetector } from './api-key.js';
export { creditCardDetector } from './credit-card.js';
export { emailDetector } from './email.js';
export { ipDetector } from './ip.js';
export { phoneDetector } from './phone.js';
export { ssnDetector } from './ssn.js';
export { uuidDetector } from './uuid.js';

/**
 * Every pattern detector shipped in v0.1, in the order the orchestrator
 * should consult them. Order doesn't affect correctness — overlap resolution
 * is the orchestrator's job — but more-specific detectors first keeps
 * `--dry-run` output legible.
 */
export const ALL_PATTERN_DETECTORS: readonly Detector[] = [
  apiKeyDetector,
  creditCardDetector,
  ssnDetector,
  uuidDetector,
  emailDetector,
  ipDetector,
  phoneDetector,
];
