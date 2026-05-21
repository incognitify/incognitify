#!/usr/bin/env node
import { VERSION } from '@incognitify/core';
import { Command } from 'commander';
import { runMask } from './commands/mask.js';
import { readStdin } from './stdin.js';

const program = new Command();

program
  .name('incognitify')
  .description('Mask sensitive data before sending it to an LLM, then rehydrate the response.')
  .version(VERSION);

program
  .command('mask')
  .description('Read text from stdin, mask sensitive values, write masked text to stdout.')
  .action(async () => {
    const input = await readStdin();
    process.stdout.write(runMask(input));
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
