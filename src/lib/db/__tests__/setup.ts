/**
 * Vitest Test Setup
 *
 * This file runs before all tests to configure the test environment.
 * Sets up mocks for DuckDB and other external dependencies.
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock DuckDB module before any imports
vi.mock('@duckdb/node-api', () => ({
  DuckDBInstance: {
    create: vi.fn().mockResolvedValue(createMockDuckDBInstance()),
  },
}));

// Mock environment variables for tests
process.env.DUCKDB_PATH = ':memory:';
process.env.CFBD_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

/**
 * Creates a mock DuckDB instance for testing
 */
export function createMockDuckDBInstance() {
  const mockConnection = createMockConnection();

  return {
    connect: vi.fn().mockResolvedValue(mockConnection),
    closeSync: vi.fn(),
  };
}

/**
 * Creates a mock DuckDB connection for testing
 */
export function createMockConnection(queryResults: Record<string, unknown[]> = {}) {
  let lastQuery = '';

  return {
    run: vi.fn().mockImplementation(async (sql: string) => {
      lastQuery = sql;
      // Return mock result based on query pattern
      const result = findMatchingResult(sql, queryResults);
      return createMockQueryResult(result);
    }),
    closeSync: vi.fn(),
    getLastQuery: () => lastQuery,
  };
}

/**
 * Creates a mock query result that mimics DuckDB result structure
 */
export function createMockQueryResult(rows: unknown[] = []) {
  return {
    getRows: () => rows,
    getRowCount: () => rows.length,
    getColumns: () => {
      if (rows.length === 0) return [];
      const firstRow = rows[0] as Record<string, unknown>;
      return Object.keys(firstRow).map((name) => ({ name }));
    },
  };
}

/**
 * Finds a matching result based on SQL query pattern
 */
function findMatchingResult(sql: string, results: Record<string, unknown[]>): unknown[] {
  for (const [pattern, data] of Object.entries(results)) {
    if (sql.toLowerCase().includes(pattern.toLowerCase())) {
      return data;
    }
  }
  return [];
}

// Reset singleton state between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Export test utilities
export { vi };
