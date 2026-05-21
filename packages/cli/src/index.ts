#!/usr/bin/env node
import { VERSION } from '@incognitify/core';
import { Command } from 'commander';

const program = new Command();

program
  .name('incognitify')
  .description('Mask sensitive data before sending it to an LLM, then rehydrate the response.')
  .version(VERSION);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
