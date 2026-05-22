import { spawn } from 'node:child_process';
import { mask, unmask } from '@incognitify/core';

/**
 * Round-trip the LLM call entirely in this process.
 *
 * `call` receives the masked text and returns whatever the LLM replied with.
 * The vault stays in a local variable for the lifetime of this function —
 * never written to disk, never observable from outside.
 */
export async function roundTrip(
  input: string,
  call: (masked: string) => Promise<string>,
): Promise<string> {
  const { masked, vault } = mask(input);
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
