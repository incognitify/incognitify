import { describe, expect, it } from 'vitest';
import { runMask } from './mask.js';

describe('runMask', () => {
  it('replaces sensitive values with placeholder tokens', () => {
    const out = runMask('email alice@example.com today');
    expect(out).toBe('email ⟦EMAIL_1⟧ today');
  });

  it('passes plain text through unchanged', () => {
    expect(runMask('nothing sensitive here')).toBe('nothing sensitive here');
  });

  it('preserves trailing newlines', () => {
    expect(runMask('a@x.com\n')).toBe('⟦EMAIL_1⟧\n');
  });
});
