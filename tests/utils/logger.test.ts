/**
 * @oxog/tui - Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  LogLevel,
  setLogLevel,
  getLogLevel,
  setLoggingEnabled,
  isLoggingEnabled,
  setLogHandler,
  log,
  logError,
  logWarn,
  logInfo,
  logDebug,
  createLogger
} from '../../src/utils/logger'

describe('Logger', () => {
  let originalLevel: LogLevel
  let originalEnabled: boolean

  beforeEach(() => {
    originalLevel = getLogLevel()
    originalEnabled = isLoggingEnabled()
    setLogHandler(null) // Reset to default
  })

  afterEach(() => {
    setLogLevel(originalLevel)
    setLoggingEnabled(originalEnabled)
    setLogHandler(null)
  })

  describe('setLogLevel / getLogLevel', () => {
    it('sets and gets log level', () => {
      setLogLevel(LogLevel.DEBUG)
      expect(getLogLevel()).toBe(LogLevel.DEBUG)

      setLogLevel(LogLevel.ERROR)
      expect(getLogLevel()).toBe(LogLevel.ERROR)

      setLogLevel(LogLevel.INFO)
      expect(getLogLevel()).toBe(LogLevel.INFO)

      setLogLevel(LogLevel.WARN)
      expect(getLogLevel()).toBe(LogLevel.WARN)
    })
  })

  describe('setLoggingEnabled / isLoggingEnabled', () => {
    it('enables and disables logging', () => {
      setLoggingEnabled(false)
      expect(isLoggingEnabled()).toBe(false)

      setLoggingEnabled(true)
      expect(isLoggingEnabled()).toBe(true)
    })
  })

  describe('setLogHandler', () => {
    it('sets custom log handler', () => {
      const logs: Array<{ level: LogLevel; module: string; message: string; args: unknown[] }> = []
      const handler = vi.fn((level, module, message, ...args) => {
        logs.push({ level, module, message, args })
      })

      setLogHandler(handler)
      setLogLevel(LogLevel.DEBUG)

      log(LogLevel.ERROR, 'test', 'error message', { data: 1 })
      log(LogLevel.WARN, 'test', 'warn message')
      log(LogLevel.INFO, 'test', 'info message')
      log(LogLevel.DEBUG, 'test', 'debug message')

      expect(handler).toHaveBeenCalledTimes(4)
      expect(logs).toHaveLength(4)
      expect(logs[0]).toEqual({
        level: LogLevel.ERROR,
        module: 'test',
        message: 'error message',
        args: [{ data: 1 }]
      })
    })

    it('clears custom handler when set to null', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogHandler(null)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      setLogLevel(LogLevel.WARN)
      log(LogLevel.WARN, 'test', 'message')

      expect(handler).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('log', () => {
    it('does not log when logging is disabled', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLoggingEnabled(false)

      log(LogLevel.ERROR, 'test', 'message')

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not log when level is below threshold', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.ERROR)
      setLoggingEnabled(true)

      log(LogLevel.WARN, 'test', 'message')
      log(LogLevel.INFO, 'test', 'message')
      log(LogLevel.DEBUG, 'test', 'message')

      expect(handler).not.toHaveBeenCalled()
    })

    it('logs when level is at or above threshold', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.WARN)
      setLoggingEnabled(true)

      log(LogLevel.ERROR, 'test', 'error')
      log(LogLevel.WARN, 'test', 'warn')
      log(LogLevel.INFO, 'test', 'info') // Should not log

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('uses console.error for ERROR level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      setLogLevel(LogLevel.ERROR)
      setLoggingEnabled(true)

      log(LogLevel.ERROR, 'module', 'error message', 'extra')

      expect(spy).toHaveBeenCalledWith('[module]', 'error message', 'extra')
      spy.mockRestore()
    })

    it('uses console.warn for WARN level', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      setLogLevel(LogLevel.WARN)
      setLoggingEnabled(true)

      log(LogLevel.WARN, 'module', 'warn message')

      expect(spy).toHaveBeenCalledWith('[module]', 'warn message')
      spy.mockRestore()
    })

    it('uses console.info for INFO level', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      setLogLevel(LogLevel.INFO)
      setLoggingEnabled(true)

      log(LogLevel.INFO, 'module', 'info message')

      expect(spy).toHaveBeenCalledWith('[module]', 'info message')
      spy.mockRestore()
    })

    it('uses console.debug for DEBUG level', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      setLogLevel(LogLevel.DEBUG)
      setLoggingEnabled(true)

      log(LogLevel.DEBUG, 'module', 'debug message')

      expect(spy).toHaveBeenCalledWith('[module]', 'debug message')
      spy.mockRestore()
    })
  })

  describe('logError', () => {
    it('logs at ERROR level', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.ERROR)
      setLoggingEnabled(true)

      logError('test', 'error message', { data: 1 })

      expect(handler).toHaveBeenCalledWith(LogLevel.ERROR, 'test', 'error message', { data: 1 })
    })
  })

  describe('logWarn', () => {
    it('logs at WARN level', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.WARN)
      setLoggingEnabled(true)

      logWarn('test', 'warn message', 42)

      expect(handler).toHaveBeenCalledWith(LogLevel.WARN, 'test', 'warn message', 42)
    })
  })

  describe('logInfo', () => {
    it('logs at INFO level', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.INFO)
      setLoggingEnabled(true)

      logInfo('test', 'info message')

      expect(handler).toHaveBeenCalledWith(LogLevel.INFO, 'test', 'info message')
    })
  })

  describe('logDebug', () => {
    it('logs at DEBUG level', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.DEBUG)
      setLoggingEnabled(true)

      logDebug('test', 'debug message', [1, 2, 3])

      expect(handler).toHaveBeenCalledWith(LogLevel.DEBUG, 'test', 'debug message', [1, 2, 3])
    })
  })

  describe('createLogger', () => {
    it('creates a logger bound to a module', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.DEBUG)
      setLoggingEnabled(true)

      const logger = createLogger('my-module')

      logger.error('error msg', { err: true })
      logger.warn('warn msg')
      logger.info('info msg')
      logger.debug('debug msg')

      expect(handler).toHaveBeenCalledTimes(4)
      expect(handler).toHaveBeenNthCalledWith(1, LogLevel.ERROR, 'my-module', 'error msg', { err: true })
      expect(handler).toHaveBeenNthCalledWith(2, LogLevel.WARN, 'my-module', 'warn msg')
      expect(handler).toHaveBeenNthCalledWith(3, LogLevel.INFO, 'my-module', 'info msg')
      expect(handler).toHaveBeenNthCalledWith(4, LogLevel.DEBUG, 'my-module', 'debug msg')
    })

    it('creates independent loggers for different modules', () => {
      const handler = vi.fn()
      setLogHandler(handler)
      setLogLevel(LogLevel.DEBUG)
      setLoggingEnabled(true)

      const loggerA = createLogger('module-a')
      const loggerB = createLogger('module-b')

      loggerA.info('message a')
      loggerB.info('message b')

      expect(handler).toHaveBeenNthCalledWith(1, LogLevel.INFO, 'module-a', 'message a')
      expect(handler).toHaveBeenNthCalledWith(2, LogLevel.INFO, 'module-b', 'message b')
    })
  })

  describe('LogLevel enum', () => {
    it('has correct numeric values', () => {
      expect(LogLevel.ERROR).toBe(0)
      expect(LogLevel.WARN).toBe(1)
      expect(LogLevel.INFO).toBe(2)
      expect(LogLevel.DEBUG).toBe(3)
    })

    it('ERROR is more severe than others', () => {
      expect(LogLevel.ERROR).toBeLessThan(LogLevel.WARN)
      expect(LogLevel.WARN).toBeLessThan(LogLevel.INFO)
      expect(LogLevel.INFO).toBeLessThan(LogLevel.DEBUG)
    })
  })
})
