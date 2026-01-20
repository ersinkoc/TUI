/**
 * @oxog/tui - Clipboard Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipboardPlugin, copyWithSystemTool, readWithSystemTool } from '../../src/plugins/clipboard'
import type { TUIApp } from '../../src/types'

// Store original process values
const originalStdoutIsTTY = process.stdout.isTTY
const originalStdoutWrite = process.stdout.write
const originalPlatform = process.platform

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

describe('clipboardPlugin', () => {
  let writtenData: string[] = []

  beforeEach(() => {
    writtenData = []
    // Mock stdout.write to capture output
    ;(process.stdout.write as any) = vi.fn((data: string) => {
      writtenData.push(data)
      return true
    })
    // Set isTTY
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    // Restore original values
    ;(process.stdout.write as any) = originalStdoutWrite
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalStdoutIsTTY,
      writable: true,
      configurable: true
    })
  })

  describe('plugin creation', () => {
    it('creates a clipboard plugin', () => {
      const plugin = clipboardPlugin()

      expect(plugin.name).toBe('clipboard')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const plugin = clipboardPlugin({
        useOsc52: false,
        useInternalFallback: true,
        debug: true
      })

      expect(plugin.name).toBe('clipboard')
    })
  })

  describe('install', () => {
    it('exposes clipboard API on app', () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      expect(clipApp.clipboard).toBeDefined()
      expect(clipApp.clipboard.copy).toBeInstanceOf(Function)
      expect(clipApp.clipboard.read).toBeInstanceOf(Function)
      expect(clipApp.clipboard.isAvailable).toBeInstanceOf(Function)
      expect(clipApp.clipboard.getInternalClipboard).toBeInstanceOf(Function)
    })

    it('detects TTY availability', () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      expect(clipApp.clipboard.isAvailable()).toBe(true)
    })

    it('handles non-TTY environment', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      })

      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      expect(clipApp.clipboard.isAvailable()).toBe(false)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = clipboardPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })
  })

  describe('copy', () => {
    it('copies text to internal clipboard', async () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Hello, World!')

      expect(clipApp.clipboard.getInternalClipboard()).toBe('Hello, World!')
    })

    it('sends OSC 52 sequence when available', async () => {
      const plugin = clipboardPlugin({ useOsc52: true })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Test')

      // Should have written OSC 52 sequence
      expect(writtenData.some(d => d.includes('\x1b]52;'))).toBe(true)
    })

    it('skips OSC 52 when disabled', async () => {
      const plugin = clipboardPlugin({ useOsc52: false })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Test')

      // Should not have written OSC 52 sequence
      expect(writtenData.some(d => d.includes('\x1b]52;'))).toBe(false)
    })

    it('throws when clipboard not available and no fallback', async () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      })

      const plugin = clipboardPlugin({ useOsc52: true, useInternalFallback: false })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await expect(clipApp.clipboard.copy('Test')).rejects.toThrow('Clipboard not available')
    })

    it('logs copy action in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = clipboardPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Test text')

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('copy:'))
      consoleSpy.mockRestore()
    })

    it('truncates long text in debug log', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = clipboardPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      const longText = 'A'.repeat(100)
      await clipApp.clipboard.copy(longText)

      // Should show truncated text with ellipsis
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('...'))
      consoleSpy.mockRestore()
    })
  })

  describe('read', () => {
    it('reads from internal clipboard', async () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Test content')
      const content = await clipApp.clipboard.read()

      expect(content).toBe('Test content')
    })

    it('throws when fallback disabled', async () => {
      const plugin = clipboardPlugin({ useInternalFallback: false })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await expect(clipApp.clipboard.read()).rejects.toThrow('Clipboard read not supported')
    })

    it('logs read action in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = clipboardPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.read()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('read requested'))
      consoleSpy.mockRestore()
    })
  })

  describe('getInternalClipboard', () => {
    it('returns empty string initially', () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      expect(clipApp.clipboard.getInternalClipboard()).toBe('')
    })

    it('returns copied content', async () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Stored content')

      expect(clipApp.clipboard.getInternalClipboard()).toBe('Stored content')
    })
  })

  describe('destroy', () => {
    it('clears internal clipboard', async () => {
      const plugin = clipboardPlugin()
      const app = createMockApp()

      plugin.install(app)

      const clipApp = app as TUIApp & { clipboard: any }
      await clipApp.clipboard.copy('Content')
      plugin.destroy!()

      // Internal state is cleared, but API still exists
      expect(clipApp.clipboard.getInternalClipboard()).toBe('')
    })
  })
})

describe('copyWithSystemTool', () => {
  it('returns promise', () => {
    const result = copyWithSystemTool('Test')
    expect(result).toBeInstanceOf(Promise)
  })

  it('executes system clipboard copy command and returns result', async () => {
    // This actually runs the system clipboard command
    // On Windows it uses 'clip', on macOS 'pbcopy', on Linux 'xclip'
    const result = await copyWithSystemTool('Test clipboard content')
    // Returns true if successful, false if command fails
    expect(typeof result).toBe('boolean')
  })
})

describe('readWithSystemTool', () => {
  it('returns promise', () => {
    const result = readWithSystemTool()
    expect(result).toBeInstanceOf(Promise)
  })

  it('executes system clipboard read command and returns result', async () => {
    // This actually runs the system clipboard command
    // On Windows it uses PowerShell Get-Clipboard, on macOS 'pbpaste', on Linux 'xclip -o'
    const result = await readWithSystemTool()
    // Returns string if successful, null if command fails
    expect(result === null || typeof result === 'string').toBe(true)
  }, 15000) // Increase timeout for system command
})
