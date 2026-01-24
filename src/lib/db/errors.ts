/**
 * Database Error Classes
 *
 * Custom error types for database operations with structured context
 * for logging and debugging.
 */

/**
 * Base class for all database-related errors.
 * Provides structured context for logging and debugging.
 */
export class DatabaseError extends Error {
  readonly timestamp: string;
  readonly context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a JSON-serializable representation for structured logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Returns a formatted string for console output
   */
  toString(): string {
    const contextStr =
      Object.keys(this.context).length > 0 ? ` | Context: ${JSON.stringify(this.context)}` : '';
    return `[${this.name}] ${this.message}${contextStr}`;
  }
}

/**
 * Error thrown when a database query fails.
 * Includes query context without exposing sensitive data.
 */
export class QueryError extends DatabaseError {
  readonly functionName: string;
  readonly originalError?: Error;

  constructor(
    message: string,
    functionName: string,
    context: Record<string, unknown> = {},
    originalError?: Error
  ) {
    super(message, {
      ...context,
      functionName,
      originalErrorMessage: originalError?.message,
    });
    this.name = 'QueryError';
    this.functionName = functionName;
    this.originalError = originalError;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      functionName: this.functionName,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
          }
        : undefined,
    };
  }
}

/**
 * Error thrown when database connection fails.
 */
export class ConnectionError extends DatabaseError {
  readonly retryable: boolean;

  constructor(message: string, context: Record<string, unknown> = {}, retryable = true) {
    super(message, context);
    this.name = 'ConnectionError';
    this.retryable = retryable;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryable: this.retryable,
    };
  }
}

/**
 * Error thrown when query parameters fail validation.
 */
export class ValidationError extends DatabaseError {
  readonly field: string;
  readonly value: unknown;

  constructor(
    message: string,
    field: string,
    value: unknown,
    context: Record<string, unknown> = {}
  ) {
    super(message, { ...context, field, invalidValue: String(value) });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Error thrown when expected data is not found.
 */
export class NotFoundError extends DatabaseError {
  readonly resourceType: string;
  readonly resourceId: string | number;

  constructor(
    resourceType: string,
    resourceId: string | number,
    context: Record<string, unknown> = {}
  ) {
    super(`${resourceType} not found: ${resourceId}`, { ...context, resourceType, resourceId });
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Type guard to check if an error is a QueryError
 */
export function isQueryError(error: unknown): error is QueryError {
  return error instanceof QueryError;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ConnectionError) {
    return error.retryable;
  }
  // Network-related errors are typically retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('econnrefused')
    );
  }
  return false;
}

/**
 * Wraps an unknown error in a QueryError with context
 */
export function wrapError(
  error: unknown,
  functionName: string,
  context: Record<string, unknown> = {}
): QueryError {
  if (error instanceof QueryError) {
    return error;
  }

  const originalError = error instanceof Error ? error : new Error(String(error));
  const message = originalError.message || 'An unexpected error occurred';

  return new QueryError(
    `Query failed in ${functionName}: ${message}`,
    functionName,
    context,
    originalError
  );
}
