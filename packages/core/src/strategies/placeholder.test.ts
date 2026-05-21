import { describe, expect, it } from 'vitest';
import { placeholderStrategy } from './placeholder.js';

describe('placeholderStrategy', () => {
  it('is marked reversible', () => {
    expect(placeholderStrategy.reversible).toBe(true);
    expect(placeholderStrategy.name).toBe('placeholder');
  });

  it('produces ⟦TYPE_N⟧ tokens', () => {
    const token = placeholderStrategy.generate(
      { start: 0, end: 5, type: 'EMAIL', value: 'a@x.com' },
      1,
    );
    expect(token).toBe('⟦EMAIL_1⟧');
  });

  it('numbers per call (vault owns counter)', () => {
    const det = { start: 0, end: 5, type: 'PHONE' as const, value: '...' };
    expect(placeholderStrategy.generate(det, 1)).toBe('⟦PHONE_1⟧');
    expect(placeholderStrategy.generate(det, 2)).toBe('⟦PHONE_2⟧');
    expect(placeholderStrategy.generate(det, 99)).toBe('⟦PHONE_99⟧');
  });
});
