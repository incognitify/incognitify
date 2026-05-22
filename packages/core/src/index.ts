export type { Detection, DetectionType } from './detection.js';
export type { Detector } from './detector.js';
export {
  ALL_PATTERN_DETECTORS,
  apiKeyDetector,
  creditCardDetector,
  emailDetector,
  ipDetector,
  phoneDetector,
  ssnDetector,
  uuidDetector,
} from './detectors/index.js';
export { type MaskOptions, type MaskResult, mask } from './mask.js';
export type { MaskingStrategy } from './strategy.js';
export { placeholderStrategy } from './strategies/placeholder.js';
export { unmask } from './unmask.js';
export type { Vault, VaultEntry } from './vault.js';
export { deserializeVault, serializeVault, type VaultJson } from './vault-serialize.js';
export { InMemoryVault } from './vaults/in-memory.js';

export const VERSION = '0.0.0';
