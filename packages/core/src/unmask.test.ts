import { describe, expect, it } from 'vitest';
import { mask } from './mask.js';
import { unmask } from './unmask.js';
import { InMemoryVault } from './vaults/in-memory.js';

describe('unmask', () => {
  it('round-trips through mask', () => {
    const original = 'reach alice@example.com or call 202-555-0100.';
    const { masked, vault } = mask(original);
    expect(unmask(masked, vault)).toBe(original);
  });

  it('preserves untouched text when no tokens are present', () => {
    const vault = new InMemoryVault();
    vault.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    expect(unmask('plain text no tokens here', vault)).toBe('plain text no tokens here');
  });

  it('returns input unchanged for an empty vault', () => {
    expect(unmask('⟦EMAIL_1⟧ unknown', new InMemoryVault())).toBe('⟦EMAIL_1⟧ unknown');
  });

  it('replaces repeated tokens', () => {
    const { masked, vault } = mask('a@x.com talked to a@x.com');
    expect(masked).toBe('⟦EMAIL_1⟧ talked to ⟦EMAIL_1⟧');
    expect(unmask(masked, vault)).toBe('a@x.com talked to a@x.com');
  });

  it('handles model-generated text containing tokens', () => {
    const { vault } = mask('contact alice@x.com');
    // Model rewrote the sentence but kept the token verbatim.
    const modelOut = 'I will contact ⟦EMAIL_1⟧ tomorrow.';
    expect(unmask(modelOut, vault)).toBe('I will contact alice@x.com tomorrow.');
  });

  it('leaves unknown token-shaped strings alone', () => {
    const { vault } = mask('contact alice@x.com');
    expect(unmask('write to ⟦EMAIL_99⟧', vault)).toBe('write to ⟦EMAIL_99⟧');
  });
});
