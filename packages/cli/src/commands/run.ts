import { spawn } from 'node:child_process';
import { mask, unmask } from '@incognitify/core';
import { assertStrict } from '../strict.js';

export interface RoundTripOptions {
  /** Fail-closed: run `--strict` checks and throw before calling the command. */
  strict?: boolean;
  /** Types that must have been masked (implies `strict`). */
  require?: readonly string[] | undefined;
}

/**
 * Round-trip the LLM call entirely in this process.
 *
 * `call` receives the masked text and returns whatever the LLM replied with.
 * The vault stays in a local variable for the lifetime of this function —
 * never written to disk, never observable from outside.
 *
 * Under `--strict`, the check runs *before* `call`, so a violation aborts the
 * round-trip and the command (the "LLM") is never invoked.
 */
export async function roundTrip(
  input: string,
  call: (masked: string) => Promise<string>,
  options: RoundTripOptions = {},
): Promise<string> {
  const { masked, vault, detections } = mask(input);
  if (options.strict || (options.require?.length ?? 0) > 0) {
    assertStrict(masked, detections, { require: options.require });
  }
  const response = await call(masked);
  return unmask(response, vault);
}

/** Spawn a child command, write `input` to its stdin, return its stdout. */
export function spawnPipe(
  command: string,
  args: readonly string[],
  input: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'inherit'] });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (c: Buffer) => chunks.push(c));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`child process exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    child.stdin.end(input);
  });
}
