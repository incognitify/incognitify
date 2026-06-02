import { describe, expect, it } from 'vitest';
import { apiKeyDetector } from './api-key.js';

describe('apiKeyDetector', () => {
  it('detects an AWS access key', () => {
    const out = apiKeyDetector.detect('aws id AKIAIOSFODNN7EXAMPLE end');
    expect(out.map((d) => d.value)).toEqual(['AKIAIOSFODNN7EXAMPLE']);
  });

  it('detects a GitHub PAT', () => {
    const key = `ghp_${'a'.repeat(36)}`;
    const out = apiKeyDetector.detect(`token=${key}`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('detects an OpenAI legacy key', () => {
    const key = `sk-${'A'.repeat(48)}`;
    const out = apiKeyDetector.detect(`OPENAI_API_KEY=${key}`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('detects an Anthropic key', () => {
    const key = `sk-ant-api03-${'A'.repeat(40)}`;
    const out = apiKeyDetector.detect(`ANTHROPIC_API_KEY=${key}`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('detects a Stripe live secret', () => {
    const key = `sk_live_${'a'.repeat(30)}`;
    const out = apiKeyDetector.detect(`stripe ${key} ok`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('detects a Google API key', () => {
    const key = `AIza${'A'.repeat(35)}`;
    const out = apiKeyDetector.detect(`key ${key}`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('detects multiple distinct providers in one string', () => {
    const aws = 'AKIAIOSFODNN7EXAMPLE';
    const gh = `ghp_${'b'.repeat(36)}`;
    const out = apiKeyDetector.detect(`${aws} and ${gh}`);
    expect(out.map((d) => d.value).sort()).toEqual([aws, gh].sort());
  });

  it('detects an sk- key whose body contains underscores or hyphens', () => {
    // Regression: this exact value lived in dev/sample-prompt.txt and slipped
    // through every pattern. The legacy `sk-` body was [A-Za-z0-9] only, so it
    // stopped at the first `_`, leaving fewer than 20 chars and no match — a
    // secret leaking straight to the LLM, the worst failure mode for this tool.
    const key = 'sk-test_4eC39HqLyjWDarjtT1zdp7dc';
    const out = apiKeyDetector.detect(`our internal API key is ${key}.`);
    expect(out.map((d) => d.value)).toEqual([key]);
    expect(out.map((d) => d.type)).toEqual(['API_KEY']);
  });

  it('detects an OpenAI service-account key', () => {
    const key = `sk-svcacct-${'A'.repeat(40)}`;
    const out = apiKeyDetector.detect(`key ${key} end`);
    expect(out.map((d) => d.value)).toEqual([key]);
  });

  it('does not match short non-key strings', () => {
    expect(apiKeyDetector.detect('sk-short')).toEqual([]);
    expect(apiKeyDetector.detect('AKIA short')).toEqual([]);
  });
});
