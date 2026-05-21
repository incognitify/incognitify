import type { Detection } from './detection.js';

/**
 * Pluggable contract for finding sensitive spans in free text.
 *
 * Detectors are pure: same input → same output, no I/O, no shared state.
 * They may return overlapping spans; conflict resolution (which span "wins")
 * is the orchestrator's job, not the detector's.
 */
export interface Detector {
  /**
   * Stable identifier used in errors, `--dry-run` reports, and config files.
   * Conventionally kebab-case, e.g. `'email-pattern'`, `'ner-person'`.
   */
  readonly name: string;

  /** Find every sensitive span in `text`. May return an empty array. */
  detect(text: string): Detection[];
}
