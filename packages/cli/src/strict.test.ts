import { describe, expect, it } from 'vitest';
import { StrictViolation, assertStrict } from './strict.js';

/** Minimal Detection stub — assertStrict only reads `.type` off these. */
const det = (type: string) => ({ start: 0, end: 1, type, value: 'x' });

describe('assertStrict', () => {
  it('passes when output is clean and nothing is required', () => {
    expect(() => assertStrict('all tokens ⟦EMAIL_1⟧ here', [det('EMAIL')])).not.toThrow();
  });

  it('fails the leak re-scan when sensitive data survives in the output', () => {
    // The masked text still contains a real email — masking missed it.
    expect(() => assertStrict('contact a@x.com', [])).toThrow(StrictViolation);
    expect(() => assertStrict('contact a@x.com', [])).toThrow(/still contains sensitive data/);
  });

  it('passes when every required type was masked', () => {
    expect(() =>
      assertStrict('⟦EMAIL_1⟧ ⟦API_KEY_1⟧', [det('EMAIL'), det('API_KEY')], {
        require: ['email', 'api_key'],
      }),
    ).not.toThrow();
  });

  it('fails when a required type was not masked', () => {
    expect(() =>
      assertStrict('⟦EMAIL_1⟧', [det('EMAIL')], { require: ['email', 'api_key'] }),
    ).toThrow(/required type\(s\) not detected\/masked: api_key/);
  });

  it('normalizes require types (case- and hyphen-insensitive)', () => {
    expect(() =>
      assertStrict('⟦CREDIT_CARD_1⟧', [det('CREDIT_CARD')], { require: ['Credit-Card'] }),
    ).not.toThrow();
  });

  it('rejects an unknown require type with a clear message', () => {
    expect(() => assertStrict('clean', [], { require: ['emial'] })).toThrow(
      /unknown --require type/,
    );
  });
});
