import type { Detection } from './detection.js';

/**
 * Pluggable contract for replacing a detected value with a token.
 *
 * Strategies are stateless. The orchestrator handles the "same input value →
 * same token" guarantee by caching strategy output in the `Vault`; a strategy
 * only sees a detection the first time it is encountered.
 */
export interface MaskingStrategy {
  /** Stable identifier, e.g. `'placeholder'`, `'realistic-fake'`, `'hash'`. */
  readonly name: string;

  /**
   * Whether `unmask` can restore the original value from the produced token.
   * `true` for placeholder, realistic-fake, format-preserving. `false` for
   * hash and redact, which destroy information.
   */
  readonly reversible: boolean;

  /**
   * Produce the replacement token for a detection.
   *
   * @param detection - the sensitive span being masked
   * @param index - 1-based running counter for this detection's `type` within
   *   the current masking session. Lets human-readable strategies generate
   *   stable labels like `⟦EMAIL_1⟧`, `⟦EMAIL_2⟧`.
   */
  generate(detection: Detection, index: number): string;
}
