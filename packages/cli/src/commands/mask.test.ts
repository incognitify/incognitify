import { describe, expect, it } from 'vitest';
import { runMask } from './mask.js';

describe('runMask', () => {
  it('replaces sensitive values with placeholder tokens', () => {
    expect(runMask('email alice@example.com today').stdout).toBe('email ⟦EMAIL_1⟧ today');
  });

  it('passes plain text through unchanged', () => {
    expect(runMask('nothing sensitive here').stdout).toBe('nothing sensitive here');
  });

  it('preserves trailing newlines', () => {
    expect(runMask('a@x.com\n').stdout).toBe('⟦EMAIL_1⟧\n');
  });

  it('returns serialized vault when emitVault is set', () => {
    const out = runMask('a@x.com', { emitVault: true });
    expect(out.vaultJson?.version).toBe(1);
    expect(out.vaultJson?.entries).toEqual([
      { token: '⟦EMAIL_1⟧', value: 'a@x.com', type: 'EMAIL' },
    ]);
  });

  it('does not emit vault by default', () => {
    expect(runMask('a@x.com').vaultJson).toBeUndefined();
  });

  it('dry-run reports detections instead of masked text', () => {
    const out = runMask('email a@x.com today', { dryRun: true });
    expect(out.stdout).toContain('1 detection:');
    expect(out.stdout).toContain('EMAIL');
    expect(out.stdout).toContain('a@x.com');
    expect(out.stdout).toContain('⟦EMAIL_1⟧');
  });

  it('dry-run with no detections reports a friendly message', () => {
    expect(runMask('nothing here', { dryRun: true }).stdout).toBe(
      'No sensitive values detected.\n',
    );
  });

  it('strict passes masked text through when required types are present', () => {
    expect(runMask('a@x.com', { strict: true, require: ['email'] }).stdout).toBe('⟦EMAIL_1⟧');
  });

  it('strict (implied by --require) throws when a required type is absent', () => {
    expect(() => runMask('nothing here', { require: ['email'] })).toThrow(/required type/);
  });
});
