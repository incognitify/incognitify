// Applies Drizzle migrations at deploy time using the runtime migrator (no drizzle-kit
// dev dependency needed in production). Idempotent — already-applied migrations are skipped.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('migrate: DATABASE_URL is not set');
  process.exit(1);
}

// connect_timeout (seconds): if the DB is unreachable, fail fast with a clear error
// instead of hanging the connection forever.
console.log(`migrate: connecting to ${url.replace(/:\/\/[^@]*@/, '://***@')}`);
const sql = postgres(url, { max: 1, connect_timeout: 10 });
try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
  console.log('migrate: done');
} catch (err) {
  console.error('migrate: failed', err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

// Force termination. postgres.js can leave a lingering handle that keeps Node alive even
// after sql.end(), so the process never exits — and `node migrate.mjs && node build` then
// never reaches `node build`. The server never binds its port and Railway reports
// "connection dial timeout". Exiting explicitly guarantees the start chain proceeds.
process.exit(process.exitCode ?? 0);
