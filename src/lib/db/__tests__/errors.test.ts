/**
 * Tests for Database Error Classes
 */

import { describe, it, expect } from 'vitest';
import {
  DatabaseError,
  QueryError,
  ConnectionError,
  ValidationError,
  NotFoundError,
  isDatabaseError,
  isQueryError,
  isRetryableError,
  wrapError,
} from '../errors';

describe('DatabaseError', () => {
  it('should create error with message and context', () => {
    const error = new DatabaseError('Test error', { key: 'value' });

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('DatabaseError');
    expect(error.context).toEqual({ key: 'value' });
    expect(error.timestamp).toBeDefined();
  });

  it('should serialize to JSON correctly', () => {
    const error = new DatabaseError('Test error', { key: 'value' });
    const json = error.toJSON();

    expect(json.name).toBe('DatabaseError');
    expect(json.message).toBe('Test error');
    expect(json.context).toEqual({ key: 'value' });
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  it('should format toString correctly', () => {
    const error = new DatabaseError('Test error', { key: 'value' });
    const str = error.toString();

    expect(str).toContain('[DatabaseError]');
    expect(str).toContain('Test error');
    expect(str).toContain('Context:');
  });
});

describe('QueryError', () => {
  it('should include function name in context', () => {
    const error = new QueryError('Query failed', 'getGames', { season: 2024 });

    expect(error.functionName).toBe('getGames');
    expect(error.context.functionName).toBe('getGames');
    expect(error.context.season).toBe(2024);
  });

  it('should preserve original error', () => {
    const original = new Error('Original error');
    const error = new QueryError('Query failed', 'getGames', {}, original);

    expect(error.originalError).toBe(original);
    expect(error.context.originalErrorMessage).toBe('Original error');
  });

  it('should serialize with original error info', () => {
    const original = new Error('Original error');
    const error = new QueryError('Query failed', 'getGames', {}, original);
    const json = error.toJSON();

    expect(json.functionName).toBe('getGames');
    expect(json.originalError).toEqual({
      name: 'Error',
      message: 'Original error',
    });
  });
});

describe('ConnectionError', () => {
  it('should default to retryable', () => {
    const error = new ConnectionError('Connection failed');

    expect(error.retryable).toBe(true);
  });

  it('should allow non-retryable errors', () => {
    const error = new ConnectionError('Invalid credentials', {}, false);

    expect(error.retryable).toBe(false);
  });

  it('should include retryable in JSON', () => {
    const error = new ConnectionError('Connection failed');
    const json = error.toJSON();

    expect(json.retryable).toBe(true);
  });
});

describe('ValidationError', () => {
  it('should include field and value', () => {
    const error = new ValidationError('Invalid season', 'season', 'abc');

    expect(error.field).toBe('season');
    expect(error.value).toBe('abc');
    expect(error.context.field).toBe('season');
    expect(error.context.invalidValue).toBe('abc');
  });
});

describe('NotFoundError', () => {
  it('should format message with resource info', () => {
    const error = new NotFoundError('Game', 12345);

    expect(error.message).toBe('Game not found: 12345');
    expect(error.resourceType).toBe('Game');
    expect(error.resourceId).toBe(12345);
  });
});

describe('Type Guards', () => {
  describe('isDatabaseError', () => {
    it('should return true for DatabaseError', () => {
      expect(isDatabaseError(new DatabaseError('test'))).toBe(true);
    });

    it('should return true for subclasses', () => {
      expect(isDatabaseError(new QueryError('test', 'fn'))).toBe(true);
      expect(isDatabaseError(new ConnectionError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isDatabaseError(new Error('test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isDatabaseError('test')).toBe(false);
      expect(isDatabaseError(null)).toBe(false);
    });
  });

  describe('isQueryError', () => {
    it('should return true for QueryError', () => {
      expect(isQueryError(new QueryError('test', 'fn'))).toBe(true);
    });

    it('should return false for other DatabaseErrors', () => {
      expect(isQueryError(new ConnectionError('test'))).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable ConnectionError', () => {
      expect(isRetryableError(new ConnectionError('test'))).toBe(true);
    });

    it('should return false for non-retryable ConnectionError', () => {
      expect(isRetryableError(new ConnectionError('test', {}, false))).toBe(false);
    });

    it('should return true for timeout errors', () => {
      expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError(new Error('Network error'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isRetryableError(new Error('Invalid query'))).toBe(false);
    });
  });
});

describe('wrapError', () => {
  it('should wrap regular Error in QueryError', () => {
    const original = new Error('Original');
    const wrapped = wrapError(original, 'testFn', { key: 'value' });

    expect(wrapped).toBeInstanceOf(QueryError);
    expect(wrapped.functionName).toBe('testFn');
    expect(wrapped.originalError).toBe(original);
    expect(wrapped.context.key).toBe('value');
  });

  it('should return QueryError as-is', () => {
    const original = new QueryError('Already wrapped', 'fn');
    const wrapped = wrapError(original, 'otherFn');

    expect(wrapped).toBe(original);
  });

  it('should handle non-Error values', () => {
    const wrapped = wrapError('string error', 'testFn');

    expect(wrapped).toBeInstanceOf(QueryError);
    expect(wrapped.message).toContain('string error');
  });
});
