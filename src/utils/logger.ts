/**
 * @oxog/tui - Logger Utility
 * @packageDocumentation
 *
 * Centralized logging for the TUI framework.
 * Provides consistent log formatting and level-based filtering.
 */

// ============================================================
// Log Levels
// ============================================================

/**
 * Log level enumeration.
 * Lower values are more severe.
 */
export enum LogLevel {
  /** Critical errors that may crash the application */
  ERROR = 0,
  /** Warnings about potential issues */
  WARN = 1,
  /** Informational messages */
  INFO = 2,
  /** Debug messages for development */
  DEBUG = 3,
}

// ============================================================
// Logger Configuration
// ============================================================

/** Current log level threshold */
let currentLevel: LogLevel = LogLevel.WARN

/** Whether logging is enabled */
let loggingEnabled = true

/** Custom log handler (for testing or custom output) */
let customHandler: ((level: LogLevel, module: string, message: string, ...args: unknown[]) => void) | null = null

// ============================================================
// Logger API
// ============================================================

/**
 * Set the minimum log level.
 * Messages below this level will not be logged.
 *
 * @param level - Minimum log level to display
 *
 * @example
 * ```typescript
 * import { setLogLevel, LogLevel } from '@oxog/tui'
 *
 * // Show all messages including debug
 * setLogLevel(LogLevel.DEBUG)
 *
 * // Only show errors
 * setLogLevel(LogLevel.ERROR)
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level
}

/**
 * Get the current log level.
 *
 * @returns Current log level
 */
export function getLogLevel(): LogLevel {
  return currentLevel
}

/**
 * Enable or disable all logging.
 *
 * @param enabled - Whether logging is enabled
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
}

/**
 * Check if logging is enabled.
 *
 * @returns Whether logging is enabled
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled
}

/**
 * Set a custom log handler.
 * Useful for testing or redirecting logs to a file/service.
 *
 * @param handler - Custom handler function, or null to use default console
 *
 * @example
 * ```typescript
 * // Capture logs for testing
 * const logs: string[] = []
 * setLogHandler((level, module, message) => {
 *   logs.push(`[${module}] ${message}`)
 * })
 * ```
 */
export function setLogHandler(
  handler: ((level: LogLevel, module: string, message: string, ...args: unknown[]) => void) | null
): void {
  customHandler = handler
}

/**
 * Log a message at the specified level.
 *
 * @param level - Log level
 * @param module - Module name (e.g., 'buffer', 'layout', 'router')
 * @param message - Log message
 * @param args - Additional arguments to log
 *
 * @example
 * ```typescript
 * log(LogLevel.WARN, 'buffer', 'Invalid dimensions', { width, height })
 * log(LogLevel.ERROR, 'router', 'Navigation failed', error)
 * ```
 */
export function log(level: LogLevel, module: string, message: string, ...args: unknown[]): void {
  // Skip if logging disabled or level is below threshold
  if (!loggingEnabled || level > currentLevel) {
    return
  }

  const prefix = `[${module}]`

  // Use custom handler if provided
  if (customHandler) {
    customHandler(level, module, message, ...args)
    return
  }

  // Default console output
  switch (level) {
    case LogLevel.ERROR:
      console.error(prefix, message, ...args)
      break
    case LogLevel.WARN:
      console.warn(prefix, message, ...args)
      break
    case LogLevel.INFO:
      console.info(prefix, message, ...args)
      break
    case LogLevel.DEBUG:
      console.debug(prefix, message, ...args)
      break
  }
}

// ============================================================
// Convenience Functions
// ============================================================

/**
 * Log an error message.
 *
 * @param module - Module name
 * @param message - Error message
 * @param args - Additional arguments
 */
export function logError(module: string, message: string, ...args: unknown[]): void {
  log(LogLevel.ERROR, module, message, ...args)
}

/**
 * Log a warning message.
 *
 * @param module - Module name
 * @param message - Warning message
 * @param args - Additional arguments
 */
export function logWarn(module: string, message: string, ...args: unknown[]): void {
  log(LogLevel.WARN, module, message, ...args)
}

/**
 * Log an info message.
 *
 * @param module - Module name
 * @param message - Info message
 * @param args - Additional arguments
 */
export function logInfo(module: string, message: string, ...args: unknown[]): void {
  log(LogLevel.INFO, module, message, ...args)
}

/**
 * Log a debug message.
 *
 * @param module - Module name
 * @param message - Debug message
 * @param args - Additional arguments
 */
export function logDebug(module: string, message: string, ...args: unknown[]): void {
  log(LogLevel.DEBUG, module, message, ...args)
}

// ============================================================
// Module-Specific Loggers
// ============================================================

/**
 * Create a logger bound to a specific module.
 * Useful for creating module-level loggers.
 *
 * @param module - Module name
 * @returns Logger object with level-specific methods
 *
 * @example
 * ```typescript
 * const logger = createLogger('buffer')
 * logger.warn('Invalid dimensions', { width, height })
 * logger.error('Buffer overflow')
 * ```
 */
export function createLogger(module: string) {
  return {
    error: (message: string, ...args: unknown[]) => logError(module, message, ...args),
    warn: (message: string, ...args: unknown[]) => logWarn(module, message, ...args),
    info: (message: string, ...args: unknown[]) => logInfo(module, message, ...args),
    debug: (message: string, ...args: unknown[]) => logDebug(module, message, ...args),
  }
}
