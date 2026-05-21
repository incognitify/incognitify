/**
 * Built-in categories of sensitive data. The union accepts arbitrary strings
 * as well so user-defined detectors can introduce new types without modifying
 * core (e.g. `'INVOICE_ID'`). The `& {}` trick preserves autocomplete on the
 * known literals.
 */
export type DetectionType =
  | 'EMAIL'
  | 'PHONE'
  | 'CREDIT_CARD'
  | 'SSN'
  | 'IP'
  | 'API_KEY'
  | 'UUID'
  | (string & {});

/**
 * A single sensitive span found in a piece of text. Produced by `Detector`s
 * and consumed by the masking orchestrator.
 */
export interface Detection {
  /** Inclusive UTF-16 code-unit start index in the source text. */
  readonly start: number;
  /** Exclusive UTF-16 code-unit end index in the source text. */
  readonly end: number;
  /** Category of sensitive data. */
  readonly type: DetectionType;
  /** The raw matched substring (equals `text.slice(start, end)`). */
  readonly value: string;
  /**
   * Optional 0..1 confidence score. Detectors that are heuristic (NER, fuzzy
   * patterns) should set this so `--strict` mode can reject low-confidence
   * matches. Pattern detectors that always match exactly may omit it.
   */
  readonly confidence?: number;
}
