import { unmask, type Vault } from '@incognitify/core';

const OPEN = '⟦'; // U+27E6
const CLOSE = '⟧'; // U+27E7
// A token is ⟦TYPE_N⟧. If an unclosed ⟦ runs longer than this it isn't a token —
// flush it so a stray bracket in model output can't stall the stream forever.
const MAX_TOKEN_LEN = 64;

/**
 * Streaming-safe rehydration. A token like ⟦EMAIL_1⟧ can arrive split across chunk
 * boundaries (`⟦EMA` then `IL_1⟧`); naive per-chunk unmasking would emit the partial
 * raw and corrupt the output. This holds back only a trailing, possibly-incomplete
 * token until it can be safely unmasked, emitting everything before it immediately.
 */
export class StreamRehydrator {
  private buffer = '';

  constructor(private readonly vault: Vault) {}

  push(delta: string): string {
    this.buffer += delta;

    const open = this.buffer.lastIndexOf(OPEN);
    // No potential token start, or the last ⟦ is already closed → all complete tokens.
    if (open === -1 || this.buffer.indexOf(CLOSE, open) !== -1) {
      return this.drain();
    }

    // Unclosed ⟦ at `open`: it may be a token split across the boundary. Hold it back.
    if (this.buffer.length - open > MAX_TOKEN_LEN) return this.drain();

    const safe = this.buffer.slice(0, open);
    this.buffer = this.buffer.slice(open);
    return safe ? unmask(safe, this.vault) : '';
  }

  /** Emit whatever remains (called once the upstream stream ends). */
  flush(): string {
    return this.drain();
  }

  private drain(): string {
    const out = unmask(this.buffer, this.vault);
    this.buffer = '';
    return out;
  }
}
