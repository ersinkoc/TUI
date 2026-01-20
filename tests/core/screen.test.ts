/**
 * @oxog/tui - Screen Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createScreen,
  cleanupScreen,
  setupScreen,
  getTerminalSize,
  isTTY,
  writeAt,
  clear,
  bell,
  setTitle,
  setupSignalHandlers
} from '../../src/core/screen'

// Mock stdin
function createMockStdin() {
  return {
    isTTY: true,
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn()
  } as unknown as NodeJS.ReadStream
}

// Mock stdout
function createMockStdout() {
  let output = ''
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  return {
    columns: 80,
    rows: 24,
    isTTY: true,
    write(data: string | Buffer): boolean {
      output += data.toString()
      return true
    },
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set())
      }
      listeners.get(event)!.add(handler)
      return this
    },
    off(event: string, handler: (...args: unknown[]) => void) {
      listeners.get(event)?.delete(handler)
      return this
    },
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach(h => h(...args))
      return true
    },
    getOutput() {
      return output
    },
    clear() {
      output = ''
    },
    getListenerCount(event: string) {
      return listeners.get(event)?.size ?? 0
    }
  } as unknown as NodeJS.WriteStream & {
    getOutput(): string
    clear(): void
    emit(event: string, ...args: unknown[]): boolean
    getListenerCount(event: string): number
  }
}

describe('createScreen', () => {
  it('creates a screen instance', () => {
    const stdin = createMockStdin()
    const stdout = createMockStdout()
    const screen = createScreen(stdin, stdout)

    expect(screen).toBeDefined()
    expect(screen.width).toBe(80)
    expect(screen.height).toBe(24)
  })

  it('returns default dimensions when not available', () => {
    const stdin = createMockStdin()
    const stdout = {
      ...createMockStdout(),
      columns: undefined,
      rows: undefined
    } as unknown as NodeJS.WriteStream
    const screen = createScreen(stdin, stdout)

    expect(screen.width).toBe(80)
    expect(screen.height).toBe(24)
  })

  describe('raw mode', () => {
    it('enters raw mode', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterRawMode()

      expect(stdin.setRawMode).toHaveBeenCalledWith(true)
      expect(stdin.resume).toHaveBeenCalled()
    })

    it('exits raw mode', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterRawMode()
      screen.exitRawMode()

      expect(stdin.setRawMode).toHaveBeenCalledWith(false)
      expect(stdin.pause).toHaveBeenCalled()
    })

    it('does not double enter raw mode', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterRawMode()
      screen.enterRawMode()

      expect(stdin.setRawMode).toHaveBeenCalledTimes(1)
    })

    it('does not exit raw mode if not in raw mode', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.exitRawMode()

      expect(stdin.setRawMode).not.toHaveBeenCalled()
    })

    it('handles non-TTY stdin', () => {
      const stdin = {
        ...createMockStdin(),
        isTTY: false
      } as unknown as NodeJS.ReadStream
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      // Should not throw
      screen.enterRawMode()
      screen.exitRawMode()
    })
  })

  describe('alternate screen', () => {
    it('enters alternate screen', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterAlternateScreen()

      const output = stdout.getOutput()
      expect(output).toContain('\x1b[?1049h') // alternate screen
      expect(output).toContain('\x1b[2J') // clear screen
      expect(output).toContain('\x1b[1;1H') // cursor to 0,0
    })

    it('exits alternate screen', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterAlternateScreen()
      stdout.clear()
      screen.exitAlternateScreen()

      expect(stdout.getOutput()).toContain('\x1b[?1049l') // main screen
    })

    it('does not double enter alternate screen', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enterAlternateScreen()
      const firstOutput = stdout.getOutput()
      screen.enterAlternateScreen()

      expect(stdout.getOutput()).toBe(firstOutput)
    })

    it('does not exit alternate screen if not in alternate', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.exitAlternateScreen()

      expect(stdout.getOutput()).toBe('')
    })
  })

  describe('cursor', () => {
    it('hides cursor', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.hideCursor()

      expect(stdout.getOutput()).toContain('\x1b[?25l')
    })

    it('shows cursor', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.hideCursor()
      stdout.clear()
      screen.showCursor()

      expect(stdout.getOutput()).toContain('\x1b[?25h')
    })

    it('does not double hide cursor', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.hideCursor()
      const firstOutput = stdout.getOutput()
      screen.hideCursor()

      expect(stdout.getOutput()).toBe(firstOutput)
    })

    it('does not show cursor if not hidden', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.showCursor()

      expect(stdout.getOutput()).toBe('')
    })
  })

  describe('mouse', () => {
    it('enables mouse', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enableMouse()

      expect(stdout.getOutput()).toMatch(/\x1b\[/)
    })

    it('disables mouse', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enableMouse()
      stdout.clear()
      screen.disableMouse()

      expect(stdout.getOutput()).toMatch(/\x1b\[/)
    })

    it('does not double enable mouse', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.enableMouse()
      const firstOutput = stdout.getOutput()
      screen.enableMouse()

      expect(stdout.getOutput()).toBe(firstOutput)
    })

    it('does not disable mouse if not enabled', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)

      screen.disableMouse()

      expect(stdout.getOutput()).toBe('')
    })
  })

  describe('resize handling', () => {
    it('registers resize handler', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)
      const handler = vi.fn()

      screen.onResize(handler)

      expect(stdout.getListenerCount('resize')).toBe(1)
    })

    it('calls handler on resize', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)
      const handler = vi.fn()

      screen.onResize(handler)
      stdout.emit('resize')

      expect(handler).toHaveBeenCalledWith(80, 24)
    })

    it('unregisters resize handler', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)
      const handler = vi.fn()

      const unsubscribe = screen.onResize(handler)
      unsubscribe()

      expect(stdout.getListenerCount('resize')).toBe(0)
    })

    it('handles multiple resize handlers', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      screen.onResize(handler1)
      screen.onResize(handler2)
      stdout.emit('resize')

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('removes process listener when last handler removed', () => {
      const stdin = createMockStdin()
      const stdout = createMockStdout()
      const screen = createScreen(stdin, stdout)
      const handler = vi.fn()

      const unsubscribe = screen.onResize(handler)
      expect(stdout.getListenerCount('resize')).toBe(1)

      unsubscribe()
      expect(stdout.getListenerCount('resize')).toBe(0)
    })
  })
})

describe('cleanupScreen', () => {
  it('resets terminal state', () => {
    const stdout = createMockStdout()

    cleanupScreen(stdout)

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[0m') // reset
    expect(output).toContain('\x1b[?25h') // show cursor
    expect(output).toContain('\x1b[?1049l') // main screen
  })
})

describe('setupScreen', () => {
  it('does nothing with no options', () => {
    const stdout = createMockStdout()

    setupScreen(stdout)

    expect(stdout.getOutput()).toBe('')
  })

  it('enters alternate screen when requested', () => {
    const stdout = createMockStdout()

    setupScreen(stdout, { alternateScreen: true })

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[?1049h')
    expect(output).toContain('\x1b[2J')
  })

  it('hides cursor when requested', () => {
    const stdout = createMockStdout()

    setupScreen(stdout, { hideCursor: true })

    expect(stdout.getOutput()).toContain('\x1b[?25l')
  })

  it('enables mouse when requested', () => {
    const stdout = createMockStdout()

    setupScreen(stdout, { enableMouse: true })

    expect(stdout.getOutput()).toMatch(/\x1b\[/)
  })

  it('handles all options', () => {
    const stdout = createMockStdout()

    setupScreen(stdout, {
      alternateScreen: true,
      hideCursor: true,
      enableMouse: true
    })

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[?1049h')
    expect(output).toContain('\x1b[?25l')
  })
})

describe('getTerminalSize', () => {
  it('returns terminal dimensions', () => {
    const stdout = createMockStdout()

    const size = getTerminalSize(stdout)

    expect(size).toEqual({ width: 80, height: 24 })
  })

  it('returns defaults when columns/rows not available', () => {
    const stdout = {
      ...createMockStdout(),
      columns: undefined,
      rows: undefined
    } as unknown as NodeJS.WriteStream

    const size = getTerminalSize(stdout)

    expect(size).toEqual({ width: 80, height: 24 })
  })
})

describe('isTTY', () => {
  it('returns true for TTY', () => {
    const stdout = createMockStdout()

    expect(isTTY(stdout)).toBe(true)
  })

  it('returns false for non-TTY', () => {
    const stdout = {
      ...createMockStdout(),
      isTTY: false
    } as unknown as NodeJS.WriteStream

    expect(isTTY(stdout)).toBe(false)
  })

  it('returns false for undefined isTTY', () => {
    const stdout = {
      ...createMockStdout(),
      isTTY: undefined
    } as unknown as NodeJS.WriteStream

    expect(isTTY(stdout)).toBe(false)
  })
})

describe('writeAt', () => {
  it('writes text at position', () => {
    const stdout = createMockStdout()

    writeAt(stdout, 5, 10, 'Hello')

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[11;6H') // cursor to (5,10) - 1-indexed
    expect(output).toContain('Hello')
  })
})

describe('clear', () => {
  it('clears screen and moves cursor to 0,0', () => {
    const stdout = createMockStdout()

    clear(stdout)

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[2J')
    expect(output).toContain('\x1b[1;1H')
  })
})

describe('bell', () => {
  it('rings terminal bell', () => {
    const stdout = createMockStdout()

    bell(stdout)

    expect(stdout.getOutput()).toBe('\x07')
  })
})

describe('setTitle', () => {
  it('sets terminal title', () => {
    const stdout = createMockStdout()

    setTitle(stdout, 'My App')

    expect(stdout.getOutput()).toBe('\x1b]0;My App\x07')
  })
})

describe('setupSignalHandlers', () => {
  let originalExit: typeof process.exit
  let originalOn: typeof process.on
  let originalOff: typeof process.off

  beforeEach(() => {
    originalExit = process.exit
    originalOn = process.on
    originalOff = process.off

    // Mock process.exit
    process.exit = vi.fn() as unknown as typeof process.exit
  })

  afterEach(() => {
    process.exit = originalExit
    process.on = originalOn
    process.off = originalOff
  })

  it('returns cleanup function', () => {
    const cleanup = vi.fn()

    const removeHandlers = setupSignalHandlers(cleanup)

    expect(removeHandlers).toBeInstanceOf(Function)
    removeHandlers()
  })

  it('sets up signal handlers', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>()
    process.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler)
      return process
    }) as unknown as typeof process.on

    const cleanup = vi.fn()
    setupSignalHandlers(cleanup)

    expect(handlers.has('SIGINT')).toBe(true)
    expect(handlers.has('SIGTERM')).toBe(true)
    expect(handlers.has('uncaughtException')).toBe(true)
    expect(handlers.has('unhandledRejection')).toBe(true)
  })

  it('removes handlers on cleanup', () => {
    const removedHandlers = new Set<string>()
    process.on = vi.fn(() => process) as unknown as typeof process.on
    process.off = vi.fn((event: string) => {
      removedHandlers.add(event)
      return process
    }) as unknown as typeof process.off

    const cleanup = vi.fn()
    const removeHandlers = setupSignalHandlers(cleanup)
    removeHandlers()

    expect(removedHandlers.has('SIGINT')).toBe(true)
    expect(removedHandlers.has('SIGTERM')).toBe(true)
    expect(removedHandlers.has('uncaughtException')).toBe(true)
    expect(removedHandlers.has('unhandledRejection')).toBe(true)
  })

  it('calls cleanup and exits on SIGINT', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>()
    process.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler)
      return process
    }) as unknown as typeof process.on

    const cleanup = vi.fn()
    setupSignalHandlers(cleanup)

    // Trigger SIGINT handler
    const sigintHandler = handlers.get('SIGINT')
    expect(sigintHandler).toBeDefined()
    sigintHandler!()

    expect(cleanup).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('calls cleanup and exits on SIGTERM', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>()
    process.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler)
      return process
    }) as unknown as typeof process.on

    const cleanup = vi.fn()
    setupSignalHandlers(cleanup)

    // Trigger SIGTERM handler
    const sigtermHandler = handlers.get('SIGTERM')
    expect(sigtermHandler).toBeDefined()
    sigtermHandler!()

    expect(cleanup).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('calls cleanup, logs error and exits on uncaughtException', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handlers = new Map<string, (...args: unknown[]) => void>()
    process.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler)
      return process
    }) as unknown as typeof process.on

    const cleanup = vi.fn()
    setupSignalHandlers(cleanup)

    // Trigger uncaughtException handler
    const errorHandler = handlers.get('uncaughtException')
    expect(errorHandler).toBeDefined()

    const testError = new Error('Test uncaught exception')
    errorHandler!(testError)

    expect(cleanup).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(testError)
    expect(process.exit).toHaveBeenCalledWith(1)
    consoleSpy.mockRestore()
  })

  it('calls cleanup, logs error and exits on unhandledRejection', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handlers = new Map<string, (...args: unknown[]) => void>()
    process.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler)
      return process
    }) as unknown as typeof process.on

    const cleanup = vi.fn()
    setupSignalHandlers(cleanup)

    // Trigger unhandledRejection handler
    const rejectionHandler = handlers.get('unhandledRejection')
    expect(rejectionHandler).toBeDefined()

    const testError = new Error('Test unhandled rejection')
    rejectionHandler!(testError)

    expect(cleanup).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(testError)
    expect(process.exit).toHaveBeenCalledWith(1)
    consoleSpy.mockRestore()
  })
})
