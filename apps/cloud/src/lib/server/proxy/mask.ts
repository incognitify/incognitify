import { type Vault, mask as coreMask } from '@incognitify/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MaskedRequest {
  messages: ChatMessage[];
  system: string | undefined;
  vault: Vault;
  /** Unique sensitive values masked (the signature metric). */
  maskedCount: number;
  /** What was masked, for the client-side inspector (the user's own data). */
  detections: { type: string; token: string; value: string }[];
}

/**
 * Mask the system prompt + every message through ONE shared vault, so the same
 * value gets the same token everywhere (e.g. an email in two messages → one token).
 */
export function maskRequest(messages: ChatMessage[], system: string | undefined): MaskedRequest {
  let vault: Vault | undefined;
  const maskOne = (text: string): string => {
    const result = coreMask(text, vault ? { vault } : undefined);
    vault = result.vault;
    return result.masked;
  };

  const maskedSystem = system === undefined ? undefined : maskOne(system);
  const maskedMessages = messages.map((m) => ({ role: m.role, content: maskOne(m.content) }));

  // Nothing was masked (empty input) — still need a vault for the (no-op) rehydrate.
  if (!vault) vault = coreMask('').vault;

  return {
    messages: maskedMessages,
    system: maskedSystem,
    vault,
    maskedCount: vault.size,
    detections: vault.entries().map((e) => ({ type: e.type, token: e.token, value: e.value })),
  };
}
