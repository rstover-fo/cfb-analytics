/**
 * Structured Logger
 *
 * Provides consistent, structured logging across the application.
 * - Development: Pretty-printed with colors
 * - Production: Single-line JSON for log aggregation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Formats a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDev) {
    // Pretty format for development
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  // Single-line JSON for production
  return JSON.stringify(entry);
}

/**
 * Creates a log entry and outputs it
 */
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case 'debug':
      if (isDev) console.debug(output);
      break;
    case 'info':
      console.info(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  /**
   * Debug level - only shown in development
   */
  debug(message: string, context?: Record<string, unknown>): void {
    log('debug', message, context);
  },

  /**
   * Info level - general operational messages
   */
  info(message: string, context?: Record<string, unknown>): void {
    log('info', message, context);
  },

  /**
   * Warn level - potential issues that don't prevent operation
   */
  warn(message: string, context?: Record<string, unknown>): void {
    log('warn', message, context);
  },

  /**
   * Error level - failures that need attention
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    log('error', message, context, error);
  },

  /**
   * Log a database query error with full context
   */
  queryError(functionName: string, error: Error, context?: Record<string, unknown>): void {
    log('error', `Query failed in ${functionName}`, { ...context, functionName }, error);
  },

  /**
   * Log a cache hit/miss for debugging
   */
  cache(hit: boolean, key: string, context?: Record<string, unknown>): void {
    if (isDev) {
      log('debug', `Cache ${hit ? 'HIT' : 'MISS'}: ${key}`, context);
    }
  },
};

export default logger;
