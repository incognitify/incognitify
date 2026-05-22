import type { Vault } from './vault.js';

/** Escape characters that have special meaning inside a regular expression. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace every known vault token in `text` with its original value.
 *
 * Tokens are matched by exact string equality (regex-escaped), so accidental
 * collisions with model-generated prose are vanishingly rare when the
 * strategy uses the default `⟦...⟧` delimiters.
 *
 * Unknown token-shaped strings in the model output are passed through
 * untouched — they could not have been produced by `mask` against this vault.
 */
export function unmask(text: string, vault: Vault): string {
  if (vault.size === 0) return text;

  const entries = vault.entries();
  // Longest token first so a token that is a prefix of another never wins.
  // With default delimiters this can't happen, but a custom strategy might
  // emit non-delimited tokens.
  const sorted = [...entries].sort((a, b) => b.token.length - a.token.length);
  const pattern = sorted.map((e) => escapeRegex(e.token)).join('|');
  const re = new RegExp(pattern, 'g');

  return text.replace(re, (token) => vault.resolve(token) ?? token);
}
