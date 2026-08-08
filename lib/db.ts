import { Pool, QueryResult, QueryResultRow } from 'pg';

// pg auto-reads PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
// from the environment. No DATABASE_URL parsing required.

if (!process.env.PGHOST || !process.env.PGPASSWORD) {
  throw new Error(
    'Postgres env vars not set. Add PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE to .env.local.',
  );
}

// One Pool per server instance, reused across requests, so the TCP + TLS + auth
// handshake is paid once per pooled connection instead of on every query. In
// dev, Next.js hot-reload re-evaluates modules, so cache the pool on globalThis
// to avoid leaking a new pool (and its connections) on every file save.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

const pool =
  globalForPg._pgPool ??
  new Pool({
    // Keep small: the Supabase :6543 transaction pooler is the real gatekeeper,
    // and on Vercel each serverless instance gets its own pool.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalForPg._pgPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result: QueryResult<T> = await pool.query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  if (rows.length === 0) return null;
  if (rows.length > 1) {
    throw new Error(
      `queryOne expected at most 1 row, got ${rows.length}. SQL: ${sql.slice(0, 100)}`,
    );
  }
  return rows[0];
}