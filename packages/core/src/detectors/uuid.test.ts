import { describe, expect, it } from 'vitest';
import { uuidDetector } from './uuid.js';

describe('uuidDetector', () => {
  it('detects v4-style UUID', () => {
    const out = uuidDetector.detect('id=550e8400-e29b-41d4-a716-446655440000');
    expect(out).toEqual([
      { start: 3, end: 39, type: 'UUID', value: '550e8400-e29b-41d4-a716-446655440000' },
    ]);
  });

  it('detects uppercase UUIDs', () => {
    const out = uuidDetector.detect('550E8400-E29B-41D4-A716-446655440000');
    expect(out).toHaveLength(1);
  });

  it('detects multiple UUIDs', () => {
    const out = uuidDetector.detect(
      '550e8400-e29b-41d4-a716-446655440000 / 123e4567-e89b-12d3-a456-426614174000',
    );
    expect(out).toHaveLength(2);
  });

  it('does not match malformed UUIDs', () => {
    expect(uuidDetector.detect('550e8400-e29b-41d4-a716-44665544000')).toEqual([]); // 11 last digits
    expect(uuidDetector.detect('zzzzzzzz-e29b-41d4-a716-446655440000')).toEqual([]);
  });

  it('returns empty for plain text', () => {
    expect(uuidDetector.detect('no uuid here')).toEqual([]);
  });
});
