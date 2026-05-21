import { describe, expect, it } from 'vitest';
import { InMemoryVault } from './in-memory.js';

describe('InMemoryVault', () => {
  it('starts empty', () => {
    const v = new InMemoryVault();
    expect(v.size).toBe(0);
    expect(v.entries()).toEqual([]);
    expect(v.countOfType('EMAIL')).toBe(0);
  });

  it('store + lookup roundtrip', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    expect(v.lookup('a@x.com', 'EMAIL')).toBe('⟦EMAIL_1⟧');
    expect(v.resolve('⟦EMAIL_1⟧')).toBe('a@x.com');
    expect(v.size).toBe(1);
    expect(v.countOfType('EMAIL')).toBe(1);
  });

  it('lookup distinguishes type', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'shared', 'EMAIL');
    expect(v.lookup('shared', 'EMAIL')).toBe('⟦EMAIL_1⟧');
    expect(v.lookup('shared', 'PHONE')).toBeUndefined();
  });

  it('countOfType is independent per type', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    v.store('⟦EMAIL_2⟧', 'b@x.com', 'EMAIL');
    v.store('⟦PHONE_1⟧', '555-1212', 'PHONE');
    expect(v.countOfType('EMAIL')).toBe(2);
    expect(v.countOfType('PHONE')).toBe(1);
    expect(v.countOfType('SSN')).toBe(0);
  });

  it('storing the same (token, value, type) twice is a no-op', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    expect(v.size).toBe(1);
    expect(v.countOfType('EMAIL')).toBe(1);
  });

  it('rejects a token already bound to a different value', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    expect(() => v.store('⟦EMAIL_1⟧', 'b@x.com', 'EMAIL')).toThrow(/collision/);
  });

  it('entries reflects insertion order', () => {
    const v = new InMemoryVault();
    v.store('⟦EMAIL_1⟧', 'a@x.com', 'EMAIL');
    v.store('⟦PHONE_1⟧', '555-1212', 'PHONE');
    expect(v.entries().map((e) => e.token)).toEqual(['⟦EMAIL_1⟧', '⟦PHONE_1⟧']);
  });
});
