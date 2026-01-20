/**
 * @oxog/tui - Screen Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screenPlugin, onResize, detectCapabilities } from '../../src/plugins/screen'
import type { TUIApp } from '../../src/types'

// Store original process values
const originalStdoutWrite = process.stdout.write
const originalStdoutColumns = process.stdout.columns
const originalStdoutRows = process.stdout.rows
const originalStdoutIsTTY = process.stdout.isTTY
const originalStdoutOn = process.stdout.on
const originalStdoutRemoveListener = process.stdout.removeListener
const originalEnv = { ...process.env }

// Mock TUI App
function createMockApp(): TUIApp {
  return {
    width: 80,
    height: 24,
    root: null,
    focused: null,
    theme: {} as any,
    isRunning: true,
    mount: vi.fn(),
    unmount: vi.fn(),
    start: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    markDirty: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
    emit: vi.fn(),
    onQuit: vi.fn(),
    use: vi.fn(),
    getPlugin: vi.fn()
  } as unknown as TUIApp
}

describe('screenPlugin', () => {
  let writtenData: string[] = []
  let resizeListeners: (() => void)[] = []

  beforeEach(() => {
    writtenData = []
    resizeListeners = []

    // Mock stdout.write
    ;(process.stdout.write as any) = vi.fn((data: string | Buffer) => {
      if (typeof data === 'string') {
        writtenData.push(data)
      } else {
        writtenData.push(data.toString())
      }
      return true
    })

    // Mock stdout dimensions
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'rows', {
      value: 24,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    })

    // Mock stdout event handlers
    ;(process.stdout.on as any) = vi.fn((event: string, handler: () => void) => {
      if (event === 'resize') {
        resizeListeners.push(handler)
      }
      return process.stdout
    })
    ;(process.stdout.removeListener as any) = vi.fn((event: string, handler: () => void) => {
      if (event === 'resize') {
        const index = resizeListeners.indexOf(handler)
        if (index !== -1) {
          resizeListeners.splice(index, 1)
        }
      }
      return process.stdout
    })
  })

  afterEach(() => {
    ;(process.stdout.write as any) = originalStdoutWrite
    Object.defineProperty(process.stdout, 'columns', {
      value: originalStdoutColumns,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'rows', {
      value: originalStdoutRows,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalStdoutIsTTY,
      writable: true,
      configurable: true
    })
    ;(process.stdout.on as any) = originalStdoutOn
    ;(process.stdout.removeListener as any) = originalStdoutRemoveListener
    process.env = originalEnv
  })

  describe('plugin creation', () => {
    it('creates a screen plugin', () => {
      const plugin = screenPlugin()

      expect(plugin.name).toBe('screen')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.onResize).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const plugin = screenPlugin({
        altScreen: false,
        hideCursor: false,
        clearOnStart: false,
        restoreOnExit: false,
        bracketedPaste: false,
        title: 'Test App',
        debug: true
      })

      expect(plugin.name).toBe('screen')
    })
  })

  describe('install', () => {
    it('exposes screen API on app', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      const screenApp = app as TUIApp & { screen: any }
      expect(screenApp.screen).toBeDefined()
      expect(screenApp.screen.setTitle).toBeInstanceOf(Function)
      expect(screenApp.screen.showCursor).toBeInstanceOf(Function)
      expect(screenApp.screen.hideCursor).toBeInstanceOf(Function)
      expect(screenApp.screen.isCursorVisible).toBeInstanceOf(Function)
      expect(screenApp.screen.clear).toBeInstanceOf(Function)
      expect(screenApp.screen.bell).toBeInstanceOf(Function)
      expect(screenApp.screen.getSize).toBeInstanceOf(Function)
      expect(screenApp.screen.isAltScreen).toBeInstanceOf(Function)
      expect(screenApp.screen.enterAltScreen).toBeInstanceOf(Function)
      expect(screenApp.screen.exitAltScreen).toBeInstanceOf(Function)
    })

    it('enters alternate screen by default', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should have written alt screen sequence
      expect(writtenData.some(d => d.includes('\x1b[?1049h'))).toBe(true)
    })

    it('does not enter alternate screen when disabled', () => {
      const plugin = screenPlugin({ altScreen: false })
      const app = createMockApp()

      plugin.install(app)

      expect(writtenData.some(d => d.includes('\x1b[?1049h'))).toBe(false)
    })

    it('hides cursor by default', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should have written hide cursor sequence
      expect(writtenData.some(d => d.includes('\x1b[?25l'))).toBe(true)
    })

    it('does not hide cursor when disabled', () => {
      const plugin = screenPlugin({ hideCursor: false })
      const app = createMockApp()

      plugin.install(app)

      expect(writtenData.some(d => d.includes('\x1b[?25l'))).toBe(false)
    })

    it('logs in debug mode on install', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = screenPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })

    it('clears screen by default', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should have written clear screen sequence
      expect(writtenData.some(d => d.includes('\x1b[2J'))).toBe(true)
    })

    it('does not clear screen when disabled', () => {
      const plugin = screenPlugin({ clearOnStart: false })
      const app = createMockApp()

      plugin.install(app)

      expect(writtenData.some(d => d.includes('\x1b[2J'))).toBe(false)
    })

    it('enables bracketed paste by default', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should have written bracketed paste enable sequence
      expect(writtenData.some(d => d.includes('\x1b[?2004h'))).toBe(true)
    })

    it('sets title when provided', () => {
      const plugin = screenPlugin({ title: 'Test App' })
      const app = createMockApp()

      plugin.install(app)

      // Should have written title sequence (OSC 2 - window title)
      expect(writtenData.some(d => d.includes('\x1b]2;Test App\x07'))).toBe(true)
    })

    it('sets up resize listener', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      expect(resizeListeners.length).toBe(1)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = screenPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })

    it('logs resize events in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = screenPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)
      consoleSpy.mockClear()

      // Trigger resize event
      if (resizeListeners.length > 0) {
        resizeListeners[0]()
      }

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[screen] resize:'))
      consoleSpy.mockRestore()
    })
  })

  describe('screen API', () => {
    describe('setTitle', () => {
      it('sets terminal title', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.setTitle('New Title')

        // OSC 2 sets window title
        expect(writtenData.some(d => d.includes('\x1b]2;New Title\x07'))).toBe(true)
      })
    })

    describe('showCursor', () => {
      it('shows cursor', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.showCursor()

        expect(writtenData.some(d => d.includes('\x1b[?25h'))).toBe(true)
        expect(screenApp.screen.isCursorVisible()).toBe(true)
      })

      it('does not double show', () => {
        const plugin = screenPlugin({ hideCursor: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.showCursor()

        expect(writtenData.length).toBe(0)
      })
    })

    describe('hideCursor', () => {
      it('hides cursor', () => {
        const plugin = screenPlugin({ hideCursor: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.hideCursor()

        expect(writtenData.some(d => d.includes('\x1b[?25l'))).toBe(true)
        expect(screenApp.screen.isCursorVisible()).toBe(false)
      })

      it('does not double hide', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.hideCursor()

        expect(writtenData.length).toBe(0)
      })
    })

    describe('isCursorVisible', () => {
      it('returns cursor visibility state', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)

        const screenApp = app as TUIApp & { screen: any }
        expect(screenApp.screen.isCursorVisible()).toBe(false) // Hidden by default
      })
    })

    describe('clear', () => {
      it('clears screen', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.clear()

        expect(writtenData.some(d => d.includes('\x1b[2J'))).toBe(true)
      })
    })

    describe('bell', () => {
      it('plays bell sound', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.bell()

        expect(writtenData.some(d => d.includes('\x07'))).toBe(true)
      })
    })

    describe('getSize', () => {
      it('returns terminal size', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)

        const screenApp = app as TUIApp & { screen: any }
        const size = screenApp.screen.getSize()

        expect(size.width).toBe(80)
        expect(size.height).toBe(24)
      })

      it('returns defaults when columns/rows undefined', () => {
        Object.defineProperty(process.stdout, 'columns', {
          value: undefined,
          writable: true,
          configurable: true
        })
        Object.defineProperty(process.stdout, 'rows', {
          value: undefined,
          writable: true,
          configurable: true
        })

        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)

        const screenApp = app as TUIApp & { screen: any }
        const size = screenApp.screen.getSize()

        expect(size.width).toBe(80)
        expect(size.height).toBe(24)
      })
    })

    describe('isAltScreen', () => {
      it('returns alt screen state', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)

        const screenApp = app as TUIApp & { screen: any }
        expect(screenApp.screen.isAltScreen()).toBe(true)
      })
    })

    describe('enterAltScreen', () => {
      it('enters alternate screen', () => {
        const plugin = screenPlugin({ altScreen: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.enterAltScreen()

        expect(writtenData.some(d => d.includes('\x1b[?1049h'))).toBe(true)
        expect(screenApp.screen.isAltScreen()).toBe(true)
      })

      it('does not double enter', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.enterAltScreen()

        expect(writtenData.length).toBe(0)
      })
    })

    describe('exitAltScreen', () => {
      it('exits alternate screen', () => {
        const plugin = screenPlugin()
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.exitAltScreen()

        expect(writtenData.some(d => d.includes('\x1b[?1049l'))).toBe(true)
        expect(screenApp.screen.isAltScreen()).toBe(false)
      })

      it('does not double exit', () => {
        const plugin = screenPlugin({ altScreen: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const screenApp = app as TUIApp & { screen: any }
        screenApp.screen.exitAltScreen()

        expect(writtenData.length).toBe(0)
      })
    })
  })

  describe('onResize', () => {
    it('calls onResize hook', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should not throw
      plugin.onResize!(100, 50)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = screenPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)
      plugin.onResize!(100, 50)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('resize event'))
      consoleSpy.mockRestore()
    })
  })

  describe('destroy', () => {
    it('restores screen by default', () => {
      const plugin = screenPlugin()
      const app = createMockApp()

      plugin.install(app)
      writtenData = []

      plugin.destroy!()

      // Should show cursor
      expect(writtenData.some(d => d.includes('\x1b[?25h'))).toBe(true)
      // Should exit alt screen
      expect(writtenData.some(d => d.includes('\x1b[?1049l'))).toBe(true)
      // Should disable bracketed paste
      expect(writtenData.some(d => d.includes('\x1b[?2004l'))).toBe(true)
    })

    it('does not restore when disabled', () => {
      const plugin = screenPlugin({ restoreOnExit: false })
      const app = createMockApp()

      plugin.install(app)
      writtenData = []

      plugin.destroy!()

      expect(writtenData.length).toBe(0)
    })

    it('clears title when set', () => {
      const plugin = screenPlugin({ title: 'Test' })
      const app = createMockApp()

      plugin.install(app)
      writtenData = []

      plugin.destroy!()

      // Should clear title (OSC 2 with empty string)
      expect(writtenData.some(d => d.includes('\x1b]2;\x07'))).toBe(true)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = screenPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)
      plugin.destroy!()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('destroyed'))
      consoleSpy.mockRestore()
    })
  })
})

describe('onResize', () => {
  let resizeListeners: (() => void)[] = []

  beforeEach(() => {
    resizeListeners = []
    ;(process.stdout.on as any) = vi.fn((event: string, handler: () => void) => {
      if (event === 'resize') {
        resizeListeners.push(handler)
      }
      return process.stdout
    })
    ;(process.stdout.removeListener as any) = vi.fn((event: string, handler: () => void) => {
      if (event === 'resize') {
        const index = resizeListeners.indexOf(handler)
        if (index !== -1) {
          resizeListeners.splice(index, 1)
        }
      }
      return process.stdout
    })
    Object.defineProperty(process.stdout, 'columns', {
      value: 100,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'rows', {
      value: 50,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    ;(process.stdout.on as any) = originalStdoutOn
    ;(process.stdout.removeListener as any) = originalStdoutRemoveListener
  })

  it('registers resize handler', () => {
    const callback = vi.fn()
    onResize(callback)

    expect(resizeListeners.length).toBe(1)
  })

  it('returns unsubscribe function', () => {
    const callback = vi.fn()
    const unsubscribe = onResize(callback)

    expect(unsubscribe).toBeInstanceOf(Function)

    unsubscribe()
    expect(resizeListeners.length).toBe(0)
  })

  it('calls callback on resize', () => {
    const callback = vi.fn()
    onResize(callback)

    // Trigger resize
    resizeListeners[0]()

    expect(callback).toHaveBeenCalledWith(100, 50)
  })

  it('uses defaults when columns/rows undefined', () => {
    Object.defineProperty(process.stdout, 'columns', {
      value: undefined,
      writable: true,
      configurable: true
    })
    Object.defineProperty(process.stdout, 'rows', {
      value: undefined,
      writable: true,
      configurable: true
    })

    const callback = vi.fn()
    onResize(callback)

    // Trigger resize
    resizeListeners[0]()

    expect(callback).toHaveBeenCalledWith(80, 24)
  })
})

describe('detectCapabilities', () => {
  beforeEach(() => {
    // Reset env
    delete process.env.TERM
    delete process.env.COLORTERM
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns capability object', () => {
    const caps = detectCapabilities()

    expect(caps).toHaveProperty('color')
    expect(caps).toHaveProperty('trueColor')
    expect(caps).toHaveProperty('unicode')
    expect(caps).toHaveProperty('mouse')
    expect(caps).toHaveProperty('altScreen')
  })

  it('detects basic color support', () => {
    process.env.TERM = 'xterm'

    const caps = detectCapabilities()

    expect(caps.color).toBe(true)
  })

  it('no color for dumb terminal', () => {
    process.env.TERM = 'dumb'

    const caps = detectCapabilities()

    expect(caps.color).toBe(false)
  })

  it('no color when not TTY', () => {
    process.env.TERM = 'xterm'
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true
    })

    const caps = detectCapabilities()

    expect(caps.color).toBe(false)
  })

  it('detects true color with COLORTERM', () => {
    process.env.COLORTERM = 'truecolor'

    const caps = detectCapabilities()

    expect(caps.trueColor).toBe(true)
  })

  it('detects true color with 24bit COLORTERM', () => {
    process.env.COLORTERM = '24bit'

    const caps = detectCapabilities()

    expect(caps.trueColor).toBe(true)
  })

  it('detects true color with 256color TERM', () => {
    process.env.TERM = 'xterm-256color'

    const caps = detectCapabilities()

    expect(caps.trueColor).toBe(true)
  })

  it('detects unicode support', () => {
    process.env.TERM = 'xterm'

    const caps = detectCapabilities()

    expect(caps.unicode).toBe(true)
  })

  it('no unicode for linux console', () => {
    process.env.TERM = 'linux'

    const caps = detectCapabilities()

    expect(caps.unicode).toBe(false)
  })

  it('detects mouse support for xterm', () => {
    process.env.TERM = 'xterm'

    const caps = detectCapabilities()

    expect(caps.mouse).toBe(true)
  })

  it('detects mouse support for rxvt', () => {
    process.env.TERM = 'rxvt-unicode'

    const caps = detectCapabilities()

    expect(caps.mouse).toBe(true)
  })

  it('detects mouse support for screen', () => {
    process.env.TERM = 'screen'

    const caps = detectCapabilities()

    expect(caps.mouse).toBe(true)
  })

  it('detects mouse support for tmux', () => {
    process.env.TERM = 'tmux-256color'

    const caps = detectCapabilities()

    expect(caps.mouse).toBe(true)
  })

  it('detects alt screen support', () => {
    process.env.TERM = 'xterm'

    const caps = detectCapabilities()

    expect(caps.altScreen).toBe(true)
  })

  it('no alt screen for dumb terminal', () => {
    process.env.TERM = 'dumb'

    const caps = detectCapabilities()

    expect(caps.altScreen).toBe(false)
  })

  it('no alt screen for linux console', () => {
    process.env.TERM = 'linux'

    const caps = detectCapabilities()

    expect(caps.altScreen).toBe(false)
  })
})
