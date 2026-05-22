import type { Vault } from './vault.js';
import { InMemoryVault } from './vaults/in-memory.js';

/**
 * On-disk shape of a serialized vault. Versioned so future schema changes
 * can be detected and migrated rather than silently corrupting data.
 */
export interface VaultJson {
  readonly version: 1;
  readonly entries: ReadonlyArray<{
    readonly token: string;
    readonly value: string;
    readonly type: string;
  }>;
}

const CURRENT_VERSION = 1 as const;

/** Snapshot a vault to a plain JSON-compatible object. */
export function serializeVault(vault: Vault): VaultJson {
  return {
    version: CURRENT_VERSION,
    entries: vault.entries().map((e) => ({
      token: e.token,
      value: e.value,
      type: e.type,
    })),
  };
}

/**
 * Rebuild an `InMemoryVault` from previously serialized data.
 *
 * Throws on malformed input or an unsupported version. The CLI surfaces the
 * error message verbatim so users can see why their vault file was rejected.
 */
export function deserializeVault(data: unknown): InMemoryVault {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Vault JSON must be an object');
  }
  const obj = data as { version?: unknown; entries?: unknown };
  if (obj.version !== CURRENT_VERSION) {
    throw new Error(
      `Unsupported vault version: expected ${CURRENT_VERSION}, got ${String(obj.version)}`,
    );
  }
  if (!Array.isArray(obj.entries)) {
    throw new Error('Vault JSON `entries` must be an array');
  }

  const vault = new InMemoryVault();
  for (const [i, raw] of obj.entries.entries()) {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`Vault entry ${i} must be an object`);
    }
    const e = raw as { token?: unknown; value?: unknown; type?: unknown };
    if (typeof e.token !== 'string' || typeof e.value !== 'string' || typeof e.type !== 'string') {
      throw new Error(`Vault entry ${i} must have string token, value, and type`);
    }
    vault.store(e.token, e.value, e.type);
  }
  return vault;
}
