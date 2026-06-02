#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { VERSION } from '@incognitify/core';
import { Command } from 'commander';
import { runMask } from './commands/mask.js';
import { roundTrip, spawnPipe } from './commands/run.js';
import { runUnmask } from './commands/unmask.js';
import { readStdin } from './stdin.js';

/**
 * Accumulate `--require` values across both repeated flags and comma lists, so
 * `--require email,api_key` and `--require email --require api_key` both work.
 */
function collectTypes(value: string, previous: string[] = []): string[] {
  return previous.concat(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const program = new Command();

program
  .name('incognitify')
  .description('Mask sensitive data before sending it to an LLM, then rehydrate the response.')
  .version(VERSION);

program
  .command('mask')
  .description('Mask sensitive values in stdin and write masked text to stdout.')
  .option(
    '--vault <path>',
    'Write the vault as JSON to this path (loud opt-in: vault touches disk)',
  )
  .option('--dry-run', 'Print a detection report instead of the masked text')
  .option(
    '--strict',
    'Fail-closed: exit non-zero and write nothing if masked output still contains sensitive data',
  )
  .option(
    '--require <types>',
    'Comma-separated types that must be masked, e.g. email,api_key (implies --strict)',
    collectTypes,
  )
  .action(
    async (opts: { vault?: string; dryRun?: boolean; strict?: boolean; require?: string[] }) => {
      const input = await readStdin();
      const out = runMask(input, {
        dryRun: opts.dryRun ?? false,
        emitVault: opts.vault !== undefined,
        strict: opts.strict ?? false,
        require: opts.require,
      });
      process.stdout.write(out.stdout);
      if (opts.vault && out.vaultJson) {
        await writeFile(opts.vault, `${JSON.stringify(out.vaultJson, null, 2)}\n`, 'utf8');
      }
    },
  );

program
  .command('unmask')
  .description('Rehydrate masked text from stdin using a saved vault file.')
  .requiredOption('--vault <path>', 'Path to a vault JSON file produced by `mask --vault`')
  .action(async (opts: { vault: string }) => {
    const [input, raw] = await Promise.all([readStdin(), readFile(opts.vault, 'utf8')]);
    process.stdout.write(runUnmask(input, JSON.parse(raw)));
  });

program
  .command('run')
  .description(
    'Round-trip: mask stdin → pipe to command → unmask its stdout. Vault stays in memory.',
  )
  .argument('<command>', 'The command to run')
  .argument('[args...]', 'Arguments passed to the command')
  .option(
    '--strict',
    'Fail-closed: abort before calling the command if masked text still contains sensitive data',
  )
  .option(
    '--require <types>',
    'Comma-separated types that must be masked, e.g. email,api_key (implies --strict)',
    collectTypes,
  )
  .action(
    async (command: string, args: string[], opts: { strict?: boolean; require?: string[] }) => {
      const input = await readStdin();
      const result = await roundTrip(input, (masked) => spawnPipe(command, args, masked), {
        strict: opts.strict ?? false,
        require: opts.require,
      });
      process.stdout.write(result);
    },
  );

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
