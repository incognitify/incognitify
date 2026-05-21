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

  it('does not match short non-key strings', () => {
    expect(apiKeyDetector.detect('sk-short')).toEqual([]);
    expect(apiKeyDetector.detect('AKIA short')).toEqual([]);
  });
});
