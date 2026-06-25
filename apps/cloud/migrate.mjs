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

const sql = postgres(url, { max: 1 });
try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
  console.log('migrate: done');
} catch (err) {
  console.error('migrate: failed', err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
