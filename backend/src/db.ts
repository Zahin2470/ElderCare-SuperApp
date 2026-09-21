import pg from 'pg';
import { config } from './config.js';

// pg returns int8/numeric as strings and DATE as a JS Date (shifted by the server TZ). We want
// plain numbers and 'YYYY-MM-DD' strings, so the API never emits an off-by-one day.
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10 });

const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const mapRow = <T>(row: Record<string, unknown>): T =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])) as T;

export type Queryable = Pick<pg.PoolClient, 'query'>;

export async function query<T = any>(sql: string, params: unknown[] = [], db: Queryable = pool): Promise<T[]> {
  const res = await db.query(sql, params as any[]);
  return res.rows.map((r) => mapRow<T>(r));
}

export async function one<T = any>(sql: string, params: unknown[] = [], db: Queryable = pool): Promise<T | null> {
  return (await query<T>(sql, params, db))[0] ?? null;
}

export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
