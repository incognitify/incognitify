import { describe, expect, it } from 'vitest';
import { ssnDetector } from './ssn.js';

describe('ssnDetector', () => {
  it('detects a formatted SSN', () => {
    const out = ssnDetector.detect('SSN: 123-45-6789');
    expect(out).toEqual([{ start: 5, end: 16, type: 'SSN', value: '123-45-6789' }]);
  });

  it('does not match unformatted 9-digit sequences', () => {
    expect(ssnDetector.detect('order 123456789')).toEqual([]);
  });

  it('does not match incorrect grouping', () => {
    expect(ssnDetector.detect('12-345-6789')).toEqual([]);
    expect(ssnDetector.detect('1234-56-789')).toEqual([]);
  });

  it('detects multiple SSNs', () => {
    const out = ssnDetector.detect('123-45-6789 and 987-65-4321');
    expect(out.map((d) => d.value)).toEqual(['123-45-6789', '987-65-4321']);
  });
});
