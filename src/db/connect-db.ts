/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;

/**
 * Execute a SQL query using a pooled client.
 * @param text - The SQL query text.
 * @param params - The query parameters.
 * @returns The query result.
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    const res: QueryResult<T> = await client.query<T>(text, params);
    return res;
  } catch (err: any) {
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a SQL query using a specific client.
 * @param client - The client instance.
 * @param text - The SQL query text.
 * @param params - The query parameters.
 * @returns The query result.
 */
export async function queryWithClient<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const res: QueryResult<T> = await client.query<T>(text, params);
    return res;
  } catch (err: any) {
    throw err;
  }
}
