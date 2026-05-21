import { mask } from '@incognitify/core';

/**
 * Pure function backing the `incognitify mask` command. Kept separate from
 * I/O so it can be unit-tested without spawning a child process.
 */
export function runMask(input: string): string {
  return mask(input).masked;
}
