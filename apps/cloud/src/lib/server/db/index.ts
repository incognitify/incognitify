import 'dotenv/config';
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: PostgresJsDatabase<typeof schema> | null = null;

/**
 * Lazily-created Drizzle client. Reads `DATABASE_URL` from the environment and opens
 * the connection on first query (not at import) — keeps `vite build` and the Better
 * Auth CLI from needing a live database.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    const url = process.env.DATABASE_URL || 'postgres://localhost:5432/incognitify_cloud';
    const client = postgres(url, { prepare: false });
    db = drizzle(client, { schema });
  }
  return db;
}
