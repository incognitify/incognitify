import type { DetectionType } from './detection.js';

/** A single token ↔ original-value mapping held by a `Vault`. */
export interface VaultEntry {
  readonly token: string;
  readonly value: string;
  readonly type: DetectionType;
}

/**
 * The token-to-value store for one masking session.
 *
 * Security posture (do not violate in implementations):
 * - Ephemeral, in-memory, request-scoped.
 * - Never persisted to disk by default. Persistence is a loud, explicit opt-in.
 * - Same `(value, type)` pair → same token within one vault instance.
 *
 * The `Vault` is intentionally low-level storage; the masking orchestrator
 * owns the algorithm (walk detections → consult vault → ask strategy on miss
 * → store). A vault never imports a detector or strategy.
 */
export interface Vault {
  /** Token previously issued for this `(value, type)`, or `undefined` if new. */
  lookup(value: string, type: DetectionType): string | undefined;

  /**
   * Persist a freshly-generated token. Implementations must reject collisions:
   * if `token` is already bound to a different value, throw rather than
   * silently overwrite — that would corrupt rehydration.
   */
  store(token: string, value: string, type: DetectionType): void;

  /** Reverse lookup for rehydration. `undefined` if the token is unknown. */
  resolve(token: string): string | undefined;

  /**
   * Number of tokens already issued for `type` in this session. Used by the
   * orchestrator to pass a 1-based index to `MaskingStrategy.generate`, so
   * tokens like `⟦EMAIL_1⟧`, `⟦EMAIL_2⟧` number stably.
   */
  countOfType(type: DetectionType): number;

  /** Snapshot of every entry. Order is implementation-defined. */
  entries(): readonly VaultEntry[];

  /** Total entry count. */
  readonly size: number;
}
