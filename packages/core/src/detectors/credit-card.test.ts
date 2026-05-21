import { describe, expect, it } from 'vitest';
import { creditCardDetector } from './credit-card.js';

describe('creditCardDetector', () => {
  it('detects a Luhn-valid Visa test card', () => {
    const out = creditCardDetector.detect('card 4111111111111111 ok');
    expect(out).toEqual([{ start: 5, end: 21, type: 'CREDIT_CARD', value: '4111111111111111' }]);
  });

  it('detects a hyphen-separated card', () => {
    const out = creditCardDetector.detect('5555-5555-5555-4444');
    expect(out).toHaveLength(1);
    expect(out[0]?.value).toBe('5555-5555-5555-4444');
  });

  it('detects a space-separated card', () => {
    const out = creditCardDetector.detect('4242 4242 4242 4242');
    expect(out).toHaveLength(1);
  });

  it('detects 15-digit Amex test card', () => {
    const out = creditCardDetector.detect('378282246310005');
    expect(out).toHaveLength(1);
  });

  it('rejects Luhn-invalid digit sequences', () => {
    expect(creditCardDetector.detect('order 1234567890123456')).toEqual([]);
    expect(creditCardDetector.detect('id 9999999999999999')).toEqual([]);
  });

  it('rejects sequences shorter than 13 digits', () => {
    expect(creditCardDetector.detect('phone 555-1212')).toEqual([]);
  });

  it('detects multiple cards in one string', () => {
    const out = creditCardDetector.detect('visa 4111111111111111 and mc 5555555555554444');
    expect(out).toHaveLength(2);
  });
});
