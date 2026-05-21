import type { Detection } from './detection.js';
import type { Detector } from './detector.js';
import { ALL_PATTERN_DETECTORS } from './detectors/index.js';
import { placeholderStrategy } from './strategies/placeholder.js';
import type { MaskingStrategy } from './strategy.js';
import type { Vault } from './vault.js';
import { InMemoryVault } from './vaults/in-memory.js';

export interface MaskOptions {
  /** Detectors to consult. Defaults to `ALL_PATTERN_DETECTORS`. */
  detectors?: readonly Detector[];
  /** Replacement strategy. Defaults to `placeholderStrategy`. */
  strategy?: MaskingStrategy;
  /**
   * Vault to write into. Pass an existing vault to extend a previous session
   * (the same `(value, type)` pair will reuse its earlier token). Defaults to
   * a fresh `InMemoryVault`.
   */
  vault?: Vault;
}

export interface MaskResult {
  /** Text with every detected value replaced by its token. */
  masked: string;
  /** The vault populated during this call. */
  vault: Vault;
  /** Detections that were actually masked, in left-to-right order. */
  detections: readonly Detection[];
}

/**
 * Mask sensitive spans in `text`.
 *
 * Algorithm:
 *   1. Run every detector. Collect raw detections (may overlap).
 *   2. Resolve overlaps: sort by `(start ASC, length DESC)`, then greedily
 *      accept non-overlapping spans. Longest wins; first detector to fire
 *      wins exact ties (stable sort preserves insertion order).
 *   3. For each accepted detection, ask the vault for an existing token; on
 *      miss, ask the strategy to generate one (passing a 1-based per-type
 *      index) and store it.
 *   4. Splice tokens into the output.
 */
export function mask(text: string, options: MaskOptions = {}): MaskResult {
  const detectors = options.detectors ?? ALL_PATTERN_DETECTORS;
  const strategy = options.strategy ?? placeholderStrategy;
  const vault = options.vault ?? new InMemoryVault();

  const raw: Detection[] = [];
  for (const detector of detectors) {
    raw.push(...detector.detect(text));
  }

  const sorted = [...raw].sort((a, b) => a.start - b.start || b.end - a.end);
  const accepted: Detection[] = [];
  let lastEnd = 0;
  for (const d of sorted) {
    if (d.start >= lastEnd) {
      accepted.push(d);
      lastEnd = d.end;
    }
  }

  let out = '';
  let cursor = 0;
  for (const d of accepted) {
    out += text.slice(cursor, d.start);
    let token = vault.lookup(d.value, d.type);
    if (token === undefined) {
      token = strategy.generate(d, vault.countOfType(d.type) + 1);
      vault.store(token, d.value, d.type);
    }
    out += token;
    cursor = d.end;
  }
  out += text.slice(cursor);

  return { masked: out, vault, detections: accepted };
}
