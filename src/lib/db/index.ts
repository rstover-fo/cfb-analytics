import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Get the Postgres database client (lazy initialization).
 * Only call this when you need Postgres - for DuckDB queries, use the query functions directly.
 */
export function getPostgresDB(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const sql: NeonQueryFunction<false, false> = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export * from './schema';
export * from './queries';
export * from './duckdb';
export * from './play-type-mapping';

// Sprint 6: Recruiting, Transfer, and Roster queries
export * from './queries/index';
