import { describe, expect, it } from 'vitest';
import { runMask } from './mask.js';
import { runUnmask } from './unmask.js';

describe('runUnmask', () => {
  it('rehydrates a masked string through a serialized vault', () => {
    const { stdout: masked, vaultJson } = runMask('reach alice@example.com', {
      emitVault: true,
    });
    const restored = runUnmask(masked, vaultJson);
    expect(restored).toBe('reach alice@example.com');
  });

  it('survives a JSON.stringify round-trip', () => {
    const { stdout: masked, vaultJson } = runMask('phone 202-555-0100', {
      emitVault: true,
    });
    const onDisk = JSON.parse(JSON.stringify(vaultJson));
    expect(runUnmask(masked, onDisk)).toBe('phone 202-555-0100');
  });

  it('throws a clear error on malformed vault data', () => {
    expect(() => runUnmask('text', { version: 999 })).toThrow(/Unsupported vault version/);
  });
});
