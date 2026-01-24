/**
 * Tests for Database Connection Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withConnection,
  executeQuery,
  executeQuerySingle,
  validateNumericParam,
  validateStringParam,
} from '../connection';
import { QueryError } from '../errors';

// Mock getDuckDB
vi.mock('../duckdb', () => ({
  getDuckDB: vi.fn(),
}));

import { getDuckDB } from '../duckdb';

describe('withConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute callback with connection and close it', async () => {
    const mockConnection = {
      run: vi.fn().mockResolvedValue({ getRows: vi.fn().mockResolvedValue([{ id: 1 }]) }),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    const result = await withConnection(
      async (conn) => {
        const res = await conn.run('SELECT 1');
        return await res.getRows();
      },
      { functionName: 'testFn' }
    );

    expect(result).toEqual([{ id: 1 }]);
    expect(mockConnection.closeSync).toHaveBeenCalled();
  });

  it('should close connection even on error', async () => {
    const mockConnection = {
      run: vi.fn().mockRejectedValue(new Error('Query failed')),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    await expect(
      withConnection(
        async (conn) => {
          await conn.run('INVALID SQL');
        },
        { functionName: 'testFn' }
      )
    ).rejects.toThrow(QueryError);

    expect(mockConnection.closeSync).toHaveBeenCalled();
  });

  it('should wrap errors with context', async () => {
    const mockConnection = {
      run: vi.fn().mockRejectedValue(new Error('Original error')),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    try {
      await withConnection(
        async (conn) => {
          await conn.run('SELECT');
        },
        { functionName: 'getGames', context: { season: 2024 } }
      );
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(QueryError);
      const queryError = error as QueryError;
      expect(queryError.functionName).toBe('getGames');
      expect(queryError.context.season).toBe(2024);
    }
  });

  it('should handle connection failures gracefully', async () => {
    vi.mocked(getDuckDB).mockRejectedValue(new Error('Connection refused'));

    await expect(withConnection(async () => {}, { functionName: 'testFn' })).rejects.toThrow(
      QueryError
    );
  });
});

describe('executeQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return rows from query', async () => {
    const mockRows = [
      { id: 1, name: 'Test' },
      { id: 2, name: 'Test 2' },
    ];
    const mockConnection = {
      run: vi.fn().mockResolvedValue({ getRows: vi.fn().mockResolvedValue(mockRows) }),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    const result = await executeQuery<{ id: number; name: string }>('SELECT * FROM games', {
      functionName: 'getGames',
    });

    expect(result).toEqual(mockRows);
  });
});

describe('executeQuerySingle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return first row or null', async () => {
    const mockConnection = {
      run: vi.fn().mockResolvedValue({ getRows: vi.fn().mockResolvedValue([{ id: 1 }]) }),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    const result = await executeQuerySingle<{ id: number }>('SELECT * FROM games WHERE id = 1', {
      functionName: 'getGameById',
    });

    expect(result).toEqual({ id: 1 });
  });

  it('should return null when no rows found', async () => {
    const mockConnection = {
      run: vi.fn().mockResolvedValue({ getRows: vi.fn().mockResolvedValue([]) }),
      closeSync: vi.fn(),
    };
    const mockDb = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };
    vi.mocked(getDuckDB).mockResolvedValue(mockDb as never);

    const result = await executeQuerySingle<{ id: number }>('SELECT * FROM games WHERE id = 999', {
      functionName: 'getGameById',
    });

    expect(result).toBeNull();
  });
});

describe('validateNumericParam', () => {
  it('should return number for valid input', () => {
    expect(validateNumericParam(42, 'id', 'testFn')).toBe(42);
    expect(validateNumericParam('42', 'id', 'testFn')).toBe(42);
  });

  it('should throw QueryError for invalid input', () => {
    expect(() => validateNumericParam('abc', 'id', 'testFn')).toThrow(QueryError);
    expect(() => validateNumericParam(NaN, 'id', 'testFn')).toThrow(QueryError);
  });
});

describe('validateStringParam', () => {
  it('should return trimmed string for valid input', () => {
    expect(validateStringParam('test', 'name', 'testFn')).toBe('test');
    expect(validateStringParam('  test  ', 'name', 'testFn')).toBe('test');
  });

  it('should throw QueryError for invalid input', () => {
    expect(() => validateStringParam('', 'name', 'testFn')).toThrow(QueryError);
    expect(() => validateStringParam('   ', 'name', 'testFn')).toThrow(QueryError);
    expect(() => validateStringParam(123, 'name', 'testFn')).toThrow(QueryError);
  });
});
