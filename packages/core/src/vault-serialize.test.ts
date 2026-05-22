import { describe, expect, it } from 'vitest';
import { mask } from './mask.js';
import { unmask } from './unmask.js';
import { deserializeVault, serializeVault } from './vault-serialize.js';
import { InMemoryVault } from './vaults/in-memory.js';

describe('vault serialization', () => {
  it('round-trips an empty vault', () => {
    const v = new InMemoryVault();
    const restored = deserializeVault(serializeVault(v));
    expect(restored.size).toBe(0);
  });

  it('round-trips a populated vault and preserves rehydration', () => {
    const { masked, vault } = mask('alice@x.com talked to bob@y.io');
    const json = JSON.parse(JSON.stringify(serializeVault(vault)));
    const restored = deserializeVault(json);
    expect(unmask(masked, restored)).toBe('alice@x.com talked to bob@y.io');
  });

  it('preserves countOfType numbering across serialize/deserialize', () => {
    const v1 = new InMemoryVault();
    v1.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    v1.store('⟦EMAIL_2⟧', 'b@x.com', 'EMAIL');
    const restored = deserializeVault(serializeVault(v1));
    expect(restored.countOfType('EMAIL')).toBe(2);
  });

  it('rejects malformed input', () => {
    expect(() => deserializeVault(null)).toThrow(/must be an object/);
    expect(() => deserializeVault({})).toThrow(/version/);
    expect(() => deserializeVault({ version: 999 })).toThrow(/Unsupported vault version/);
    expect(() => deserializeVault({ version: 1 })).toThrow(/entries/);
    expect(() => deserializeVault({ version: 1, entries: [{ token: 1 }] })).toThrow(
      /string token, value, and type/,
    );
  });
});
