/**
 * Database Connection Utilities
 *
 * Provides a `withConnection` wrapper for safe connection management.
 * Ensures connections are always properly closed, even on errors.
 */

import type { DuckDBConnection as RealDuckDBConnection } from '@duckdb/node-api';
import { getDuckDB } from './duckdb';
import { ConnectionError, QueryError, wrapError } from './errors';

/**
 * Options for the withConnection wrapper
 */
export interface WithConnectionOptions {
  /** Function name for error context */
  functionName: string;
  /** Additional context for error logging */
  context?: Record<string, unknown>;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Executes a callback with a managed DuckDB connection.
 *
 * Ensures the connection is always closed, even if an error occurs.
 * Wraps errors with context for debugging.
 *
 * @example
 * ```typescript
 * const result = await withConnection(
 *   async (conn) => {
 *     const result = await conn.run('SELECT * FROM games WHERE season = 2024');
 *     return await result.getRows();
 *   },
 *   { functionName: 'getGames', context: { season: 2024 } }
 * );
 * ```
 */
export async function withConnection<T>(
  callback: (connection: RealDuckDBConnection) => Promise<T>,
  options: WithConnectionOptions
): Promise<T> {
  const { functionName, context = {}, timeout = 30000 } = options;

  let connection: RealDuckDBConnection | null = null;

  try {
    // Acquire connection with timeout
    const db = await Promise.race([
      getDuckDB(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new ConnectionError('Connection timeout', { functionName, timeout })),
          timeout
        )
      ),
    ]);

    connection = await db.connect();

    // Execute the callback
    const result = await callback(connection);

    return result;
  } catch (error) {
    // Wrap and rethrow with context
    throw wrapError(error, functionName, context);
  } finally {
    // Always close the connection
    if (connection) {
      try {
        connection.closeSync();
      } catch (closeError) {
        // Log but don't throw - the original error is more important
        console.error('Failed to close connection:', closeError);
      }
    }
  }
}

/**
 * Executes a query and returns the rows as an array.
 *
 * Convenience wrapper around withConnection for simple queries.
 *
 * @example
 * ```typescript
 * const games = await executeQuery<GameRow>(
 *   'SELECT * FROM games WHERE season = $1',
 *   { functionName: 'getGames', context: { season: 2024 } }
 * );
 * ```
 */
export async function executeQuery<T>(sql: string, options: WithConnectionOptions): Promise<T[]> {
  return withConnection(async (connection) => {
    const result = await connection.run(sql);
    const rows = await result.getRows();
    return rows as T[];
  }, options);
}

/**
 * Executes a query and returns a single row or null.
 *
 * @example
 * ```typescript
 * const game = await executeQuerySingle<GameRow>(
 *   'SELECT * FROM games WHERE game_id = 12345',
 *   { functionName: 'getGameById', context: { gameId: 12345 } }
 * );
 * ```
 */
export async function executeQuerySingle<T>(
  sql: string,
  options: WithConnectionOptions
): Promise<T | null> {
  const rows = await executeQuery<T>(sql, options);
  return rows[0] ?? null;
}

/**
 * Executes a query and returns the count of affected/returned rows.
 */
export async function executeQueryCount(
  sql: string,
  options: WithConnectionOptions
): Promise<number> {
  return withConnection(async (connection) => {
    const result = await connection.run(sql);
    const rows = await result.getRows();
    return rows.length;
  }, options);
}

/**
 * Validates that a numeric parameter is a valid integer.
 * Throws ValidationError if invalid.
 */
export function validateNumericParam(
  value: unknown,
  paramName: string,
  functionName: string
): number {
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);

  if (isNaN(parsed)) {
    throw new QueryError(`Invalid numeric parameter: ${paramName}`, functionName, {
      paramName,
      value,
    });
  }

  return parsed;
}

/**
 * Validates that a string parameter is not empty.
 * Throws ValidationError if invalid.
 */
export function validateStringParam(
  value: unknown,
  paramName: string,
  functionName: string
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new QueryError(`Invalid string parameter: ${paramName}`, functionName, {
      paramName,
      value,
    });
  }

  return value.trim();
}
