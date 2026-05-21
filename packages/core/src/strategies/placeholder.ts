import type { Detection } from '../detection.js';
import type { MaskingStrategy } from '../strategy.js';

/**
 * The default v0.1 strategy: produces labeled, delimited placeholders like
 * `⟦EMAIL_1⟧`, `⟦PHONE_2⟧`. Delimiters are corner brackets (`⟦` U+27E6,
 * `⟧` U+27E7) — Unicode-rare so they're unlikely to occur in real prompts
 * and survive exact-match rehydration without false positives.
 *
 * Tokens leak the detection *type* (intentional — it helps the LLM keep
 * grammatical agreement) but never the value.
 */
export const placeholderStrategy: MaskingStrategy = {
  name: 'placeholder',
  reversible: true,
  generate(detection: Detection, index: number): string {
    return `⟦${detection.type}_${index}⟧`;
  },
};
