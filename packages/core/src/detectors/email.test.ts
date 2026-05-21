import { describe, expect, it } from 'vitest';
import { emailDetector } from './email.js';

describe('emailDetector', () => {
  it('detects a plain email', () => {
    const out = emailDetector.detect('Contact me at alice@example.com today.');
    expect(out).toEqual([{ start: 14, end: 31, type: 'EMAIL', value: 'alice@example.com' }]);
  });

  it('detects multiple emails', () => {
    const out = emailDetector.detect('alice@x.com and bob@y.io');
    expect(out.map((d) => d.value)).toEqual(['alice@x.com', 'bob@y.io']);
  });

  it('detects plus addressing and dotted locals', () => {
    const out = emailDetector.detect('first.last+tag@sub.example.co.uk');
    expect(out).toHaveLength(1);
    expect(out[0]?.value).toBe('first.last+tag@sub.example.co.uk');
  });

  it('returns empty when no email is present', () => {
    expect(emailDetector.detect('no email here, just words')).toEqual([]);
  });

  it('does not match standalone @ or bare domains', () => {
    expect(emailDetector.detect('email me @ home')).toEqual([]);
    expect(emailDetector.detect('visit example.com')).toEqual([]);
  });

  it('reports correct offsets for unicode-adjacent text', () => {
    const text = 'café → alice@example.com';
    const out = emailDetector.detect(text);
    expect(out).toHaveLength(1);
    const d = out[0];
    expect(d).toBeDefined();
    if (!d) return;
    expect(text.slice(d.start, d.end)).toBe('alice@example.com');
  });
});
