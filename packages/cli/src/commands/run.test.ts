import { describe, expect, it } from 'vitest';
import { roundTrip, spawnPipe } from './run.js';

describe('roundTrip', () => {
  it('masks → calls → unmasks, restoring original values', async () => {
    const result = await roundTrip('email alice@example.com', async (masked) => {
      // The "LLM" echoes the masked input — tokens come back intact.
      return `summary: ${masked}`;
    });
    expect(result).toBe('summary: email alice@example.com');
  });

  it('handles a model that rewrites text but keeps tokens verbatim', async () => {
    const result = await roundTrip('contact alice@example.com please', async (masked) => {
      const token = masked.match(/⟦EMAIL_\d+⟧/)?.[0] ?? '';
      return `I will write to ${token} this afternoon.`;
    });
    expect(result).toBe('I will write to alice@example.com this afternoon.');
  });

  it('leaves model output untouched when it produces no tokens', async () => {
    const result = await roundTrip('email a@x.com', async () => 'nothing sensitive here');
    expect(result).toBe('nothing sensitive here');
  });
});

describe('spawnPipe', () => {
  it('pipes input through a child process and captures stdout', async () => {
    const out = await spawnPipe('cat', [], 'hello world');
    expect(out).toBe('hello world');
  });

  it('rejects when the child exits non-zero', async () => {
    await expect(spawnPipe('sh', ['-c', 'exit 7'], '')).rejects.toThrow(/code 7/);
  });
});
