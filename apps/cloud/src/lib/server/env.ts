import 'dotenv/config';
import { z } from 'zod';

/**
 * Server-only environment, validated lazily on first use (so `vite build` and the
 * Better Auth CLI never fail on an unset var). Reads `process.env` (populated from
 * `.env` via dotenv in dev/CLI, from real env in production). Never import client-side.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  // 32-byte master key, base64-encoded, used to wrap per-org DEKs.
  KEK_BASE64: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'KEK_BASE64 must decode to 32 bytes'),
  BETTER_AUTH_SECRET: z.string().min(32),
  PUBLIC_APP_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = schema.parse(process.env);
  }
  return cached;
}

/** The decoded 32-byte master KEK. */
export function getKek(): Buffer {
  return Buffer.from(getEnv().KEK_BASE64, 'base64');
}
