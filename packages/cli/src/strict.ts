import { ALL_PATTERN_DETECTORS, type Detection } from '@incognitify/core';

/**
 * `--strict` makes `mask` / `run` fail-closed. By default masking is best-effort:
 * it masks what it finds and passes the text through regardless. Under strict,
 * a failed check throws — the command writes nothing to stdout and the process
 * exits non-zero — so questionable text never reaches the LLM and CI notices.
 *
 * Two checks, both meaningful in v0.1 with only exact-match pattern detectors:
 *
 *   1. Leak re-scan — re-detect over the *masked* output. Anything still
 *      matching means a sensitive span escaped masking (the dangerous
 *      false-negative). On correct masking this is a no-op, so it doubles as a
 *      regression guard for overlap/strategy bugs.
 *   2. Required types — every type named in `--require` must have actually been
 *      masked. Zero matches means detection missed something you expected, the
 *      free-text stand-in for "unmasked required fields".
 */
export interface StrictCheckOptions {
  /** Detection types that must have been masked, e.g. `['email', 'api_key']`. */
  require?: readonly string[] | undefined;
}

/**
 * Built-in detector types — mirrors core's `DetectionType` literals. Used only
 * to reject a typo'd `--require` value with a clear message instead of letting
 * it silently fail every time (an unknown type can never be "present").
 */
const KNOWN_TYPES = new Set(['EMAIL', 'PHONE', 'CREDIT_CARD', 'SSN', 'IP', 'API_KEY', 'UUID']);

/**
 * Raised when a `--strict` check fails. The CLI entry point prints the message
 * to stderr and exits non-zero; because it throws before anything is written to
 * stdout, the masked text is never emitted.
 */
export class StrictViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StrictViolation';
  }
}

/** `email` / `API-KEY` / `credit_card` → canonical `EMAIL` / `API_KEY` / `CREDIT_CARD`. */
function normalizeType(raw: string): string {
  return raw.trim().toUpperCase().replace(/-/g, '_');
}

/**
 * Enforce `--strict` over a completed masking. `masked` is the output text and
 * `detections` are the spans that were masked. Throws `StrictViolation` on the
 * first failing check; returns silently when everything passes.
 */
export function assertStrict(
  masked: string,
  detections: readonly Detection[],
  options: StrictCheckOptions = {},
): void {
  const required = (options.require ?? []).map(normalizeType).filter((t) => t.length > 0);

  // Config sanity first: a typo'd type should fail loudly, not silently.
  const unknown = required.filter((t) => !KNOWN_TYPES.has(t));
  if (unknown.length > 0) {
    const known = [...KNOWN_TYPES].join(', ').toLowerCase();
    throw new StrictViolation(
      `strict check failed: unknown --require type(s): ${unknown.join(', ').toLowerCase()} (known: ${known})`,
    );
  }

  // 1. Leak re-scan: nothing sensitive may survive in the masked output.
  const residual = ALL_PATTERN_DETECTORS.flatMap((d) => d.detect(masked));
  if (residual.length > 0) {
    const what = residual.map((r) => `${r.type} "${r.value}"`).join(', ');
    throw new StrictViolation(
      `strict check failed: masked output still contains sensitive data — ${what}`,
    );
  }

  // 2. Required types: each must have actually been masked.
  const maskedTypes = new Set(detections.map((d) => d.type));
  const missing = required.filter((t) => !maskedTypes.has(t));
  if (missing.length > 0) {
    throw new StrictViolation(
      `strict check failed: required type(s) not detected/masked: ${missing.join(', ').toLowerCase()} (0 found)`,
    );
  }
}
