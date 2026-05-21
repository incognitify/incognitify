import { describe, expect, it } from 'vitest';
import { phoneDetector } from './phone.js';

describe('phoneDetector', () => {
  it('detects US-formatted phone with parens', () => {
    const out = phoneDetector.detect('call (202) 555-0100 anytime');
    expect(out.map((d) => d.value)).toEqual(['(202) 555-0100']);
  });

  it('detects hyphenated US phone', () => {
    const out = phoneDetector.detect('reach 202-555-0100');
    expect(out.map((d) => d.value)).toEqual(['202-555-0100']);
  });

  it('detects dotted phone', () => {
    const out = phoneDetector.detect('phone 202.555.0100');
    expect(out.map((d) => d.value)).toEqual(['202.555.0100']);
  });

  it('detects E.164 phone with country code', () => {
    const out = phoneDetector.detect('international +1 202 555 0100 ext');
    expect(out.map((d) => d.value)).toEqual(['+1 202 555 0100']);
  });

  it('skips unformatted 10-digit sequences', () => {
    expect(phoneDetector.detect('order id 2025550100 received')).toEqual([]);
  });

  it('returns empty on text without phone numbers', () => {
    expect(phoneDetector.detect('no phones here, no numbers at all')).toEqual([]);
  });
});
