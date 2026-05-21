import { describe, expect, it } from 'vitest';
import type { Detection } from './detection.js';
import type { Detector } from './detector.js';
import { mask } from './mask.js';
import { InMemoryVault } from './vaults/in-memory.js';

function fixedDetector(name: string, dets: Detection[]): Detector {
  return { name, detect: () => dets };
}

describe('mask — basic substitution', () => {
  it('replaces a single email with a placeholder token', () => {
    const { masked, detections } = mask('reach alice@example.com today');
    expect(masked).toBe('reach ⟦EMAIL_1⟧ today');
    expect(detections).toHaveLength(1);
    expect(detections[0]?.type).toBe('EMAIL');
  });

  it('numbers tokens 1-based per type', () => {
    const { masked } = mask('alice@x.com and bob@y.io');
    expect(masked).toBe('⟦EMAIL_1⟧ and ⟦EMAIL_2⟧');
  });

  it('reuses the same token for repeated values', () => {
    const { masked, vault } = mask('alice@x.com, alice@x.com, alice@x.com');
    expect(masked).toBe('⟦EMAIL_1⟧, ⟦EMAIL_1⟧, ⟦EMAIL_1⟧');
    expect(vault.size).toBe(1);
  });

  it('numbers types independently', () => {
    const { masked } = mask('mail a@x.com phone 202-555-0100');
    expect(masked).toBe('mail ⟦EMAIL_1⟧ phone ⟦PHONE_1⟧');
  });

  it('returns the unchanged string when nothing is sensitive', () => {
    const { masked, detections } = mask('plain text, nothing to see');
    expect(masked).toBe('plain text, nothing to see');
    expect(detections).toEqual([]);
  });
});

describe('mask — overlap resolution', () => {
  it('prefers the longer span when two detectors overlap', () => {
    const longer = fixedDetector('a', [{ start: 0, end: 20, type: 'A', value: 'x'.repeat(20) }]);
    const shorter = fixedDetector('b', [{ start: 5, end: 10, type: 'B', value: 'inside' }]);
    const text = 'x'.repeat(20);
    const { detections } = mask(text, { detectors: [longer, shorter] });
    expect(detections).toEqual([{ start: 0, end: 20, type: 'A', value: 'x'.repeat(20) }]);
  });

  it('breaks ties by detector order (first wins)', () => {
    const det = (name: string, type: string) =>
      fixedDetector(name, [{ start: 0, end: 5, type, value: 'hello' }]);
    const { detections } = mask('hello world', {
      detectors: [det('first', 'A'), det('second', 'B')],
    });
    expect(detections).toHaveLength(1);
    expect(detections[0]?.type).toBe('A');
  });

  it('keeps non-overlapping detections from multiple detectors', () => {
    const a = fixedDetector('a', [{ start: 0, end: 5, type: 'A', value: 'hello' }]);
    const b = fixedDetector('b', [{ start: 6, end: 11, type: 'B', value: 'world' }]);
    const { detections } = mask('hello world', { detectors: [a, b] });
    expect(detections).toHaveLength(2);
  });
});

describe('mask — vault reuse', () => {
  it('accepts an external vault and threads it through', () => {
    const vault = new InMemoryVault();
    const r1 = mask('alice@x.com', { vault });
    expect(r1.masked).toBe('⟦EMAIL_1⟧');
    const r2 = mask('hi alice@x.com', { vault });
    expect(r2.masked).toBe('hi ⟦EMAIL_1⟧');
    expect(vault.size).toBe(1);
  });

  it('continues numbering when the same vault sees a new value', () => {
    const vault = new InMemoryVault();
    mask('a@x.com', { vault });
    const { masked } = mask('b@y.io', { vault });
    expect(masked).toBe('⟦EMAIL_2⟧');
    expect(vault.size).toBe(2);
  });
});
