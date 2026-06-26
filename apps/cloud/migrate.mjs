// Applies Drizzle migrations at deploy time using the runtime migrator (no drizzle-kit
// dev dependency needed in production). Idempotent — already-applied migrations are skipped.
import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Resolve the migrations folder relative to THIS file, not the process cwd. Railway runs
// this as a preDeployCommand whose working directory we don't want to depend on; a relative
// './drizzle' would break if the cwd ever differs from apps/cloud.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'drizzle');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('migrate: DATABASE_URL is not set');
  process.exit(1);
}

const redacted = url.replace(/:\/\/[^@]*@/, '://***@');
const ATTEMPTS = 10;
const BACKOFF_MS = 3000;

// Retry the connection. On a cold deploy the database frequently isn't accepting
// connections in the first few seconds (Railway private-networking / DB cold start), so a
// single attempt fails. connect_timeout bounds a hung dial; the retry loop bridges the gap
// until the DB is up. Without this, a transient connect failure would stop the deploy.
async function runMigrations() {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const sql = postgres(url, { max: 1, connect_timeout: 15 });
    try {
      console.log(`migrate: connecting to ${redacted} (attempt ${attempt}/${ATTEMPTS})`);
      await migrate(drizzle(sql), { migrationsFolder });
      console.log('migrate: done');
      await sql.end({ timeout: 5 });
      return 0;
    } catch (err) {
      await sql.end({ timeout: 5 }).catch(() => {});
      if (attempt === ATTEMPTS) {
        console.error('migrate: failed after all attempts', err);
        return 1;
      }
      console.error(
        `migrate: attempt ${attempt} failed, retrying in ${BACKOFF_MS}ms:`,
        err.message ?? err,
      );
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS));
    }
  }
  return 1;
}

const exitCode = await runMigrations();
// Force termination. postgres.js can leave a lingering handle that keeps Node alive even
// after sql.end(), so the process would never exit — and the start command would never
// reach `node build`, leaving the server unbound ("connection dial timeout").
process.exit(exitCode);
