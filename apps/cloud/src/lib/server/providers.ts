import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type Provider = 'anthropic' | 'openai';

export const PROVIDERS: Record<Provider, { label: string }> = {
  anthropic: { label: 'Claude (Anthropic)' },
  openai: { label: 'OpenAI' },
};

/**
 * Models to surface later in the chat picker. Anthropic IDs are authoritative
 * (claude-api reference); OpenAI's are fetched via /models when that picker is built.
 */
export const MODELS: Record<Provider, string[]> = {
  anthropic: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
};

/**
 * Verify a user-supplied provider key with a cheap, side-effect-free models.list()
 * call. Returns ok:false with a friendly message on an auth failure.
 */
export async function validateProviderKey(
  provider: Provider,
  key: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (provider === 'anthropic') {
      await new Anthropic({ apiKey: key, maxRetries: 1 }).models.list();
    } else {
      await new OpenAI({ apiKey: key, maxRetries: 1 }).models.list();
    }
    return { ok: true };
  } catch (err) {
    if (provider === 'anthropic' && err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'That Anthropic API key was rejected.' };
    }
    if (provider === 'openai' && err instanceof OpenAI.AuthenticationError) {
      return { ok: false, error: 'That OpenAI API key was rejected.' };
    }
    return { ok: false, error: 'Could not reach the provider to validate the key.' };
  }
}
