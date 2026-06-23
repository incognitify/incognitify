import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Envelope encryption for provider keys.
 *
 *   KEK (master, in secrets) ──wraps──▶ per-org DEK ──encrypts──▶ provider API key
 *
 * AES-256-GCM throughout. All stored fields are base64. The KEK and DEK are 32-byte
 * buffers; plaintext keys exist in memory only for the duration of a request.
 */

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // GCM standard nonce
const KEY_BYTES = 32; // AES-256

export interface Sealed {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

/** Encrypt a UTF-8 string with a 32-byte key. */
export function seal(key: Buffer, plaintext: string): Sealed {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

/** Decrypt a sealed payload with the same 32-byte key. Throws if tampered. */
export function open(key: Buffer, sealed: Sealed): string {
  assertKey(key);
  const decipher = createDecipheriv(ALGO, key, Buffer.from(sealed.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/** Generate a fresh 32-byte Data Encryption Key. */
export function generateDek(): Buffer {
  return randomBytes(KEY_BYTES);
}

/** Wrap a DEK with the master KEK for storage. */
export function wrapDek(kek: Buffer, dek: Buffer): Sealed {
  assertKey(dek);
  return seal(kek, dek.toString('base64'));
}

/** Unwrap a stored DEK with the master KEK. */
export function unwrapDek(kek: Buffer, wrapped: Sealed): Buffer {
  const dek = Buffer.from(open(kek, wrapped), 'base64');
  assertKey(dek);
  return dek;
}

function assertKey(key: Buffer): void {
  if (key.length !== KEY_BYTES) {
    throw new Error(`expected a ${KEY_BYTES}-byte key, got ${key.length}`);
  }
}
