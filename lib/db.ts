import { Client, QueryResult, QueryResultRow } from 'pg';

// pg auto-reads PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
// from the environment. No DATABASE_URL parsing required.

if (!process.env.PGHOST || !process.env.PGPASSWORD) {
  throw new Error(
    'Postgres env vars not set. Add PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE to .env.local.',
  );
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const client = new Client();  // reads PG* env vars automatically
  await client.connect();
  try {
    const result: QueryResult<T> = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
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