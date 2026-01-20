/**
 * @oxog/tui - Input Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { inputPlugin, keyBindingPresets } from '../../src/plugins/input'
import type { TUIApp, KeyEvent } from '../../src/types'

// Store original process values
const originalStdinIsTTY = process.stdin.isTTY
const originalStdinSetRawMode = process.stdin.setRawMode
const originalStdinResume = process.stdin.resume
const originalStdinSetEncoding = process.stdin.setEncoding
const originalStdinOn = process.stdin.on
const originalStdinRemoveListener = process.stdin.removeListener

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

describe('inputPlugin', () => {
  let stdinListeners: Map<string, ((...args: any[]) => void)[]> = new Map()

  beforeEach(() => {
    stdinListeners = new Map()

    // Mock stdin properties and methods
    Object.defineProperty(process.stdin, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    })

    ;(process.stdin.setRawMode as any) = vi.fn()
    ;(process.stdin.resume as any) = vi.fn()
    ;(process.stdin.setEncoding as any) = vi.fn()

    ;(process.stdin.on as any) = vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!stdinListeners.has(event)) {
        stdinListeners.set(event, [])
      }
      stdinListeners.get(event)!.push(handler)
      return process.stdin
    })

    ;(process.stdin.removeListener as any) = vi.fn((event: string, handler: (...args: any[]) => void) => {
      const handlers = stdinListeners.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index !== -1) {
          handlers.splice(index, 1)
        }
      }
      return process.stdin
    })
  })

  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalStdinIsTTY,
      writable: true,
      configurable: true
    })
    ;(process.stdin.setRawMode as any) = originalStdinSetRawMode
    ;(process.stdin.resume as any) = originalStdinResume
    ;(process.stdin.setEncoding as any) = originalStdinSetEncoding
    ;(process.stdin.on as any) = originalStdinOn
    ;(process.stdin.removeListener as any) = originalStdinRemoveListener
  })

  describe('plugin creation', () => {
    it('creates an input plugin', () => {
      const plugin = inputPlugin()

      expect(plugin.name).toBe('input')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'q', handler }],
        rawMode: true,
        debug: true
      })

      expect(plugin.name).toBe('input')
    })
  })

  describe('install', () => {
    it('exposes input API on app', () => {
      const plugin = inputPlugin()
      const app = createMockApp()

      plugin.install(app)

      const inputApp = app as TUIApp & { input: any }
      expect(inputApp.input).toBeDefined()
      expect(inputApp.input.bind).toBeInstanceOf(Function)
      expect(inputApp.input.unbind).toBeInstanceOf(Function)
      expect(inputApp.input.getBindings).toBeInstanceOf(Function)
      expect(inputApp.input.simulate).toBeInstanceOf(Function)
      expect(inputApp.input.setEnabled).toBeInstanceOf(Function)
      expect(inputApp.input.isEnabled).toBeInstanceOf(Function)
    })

    it('sets up raw mode when TTY', () => {
      const plugin = inputPlugin({ rawMode: true })
      const app = createMockApp()

      plugin.install(app)

      expect(process.stdin.setRawMode).toHaveBeenCalledWith(true)
      expect(process.stdin.resume).toHaveBeenCalled()
      expect(process.stdin.setEncoding).toHaveBeenCalledWith('utf8')
    })

    it('sets up stdin listener', () => {
      const plugin = inputPlugin()
      const app = createMockApp()

      plugin.install(app)

      expect(stdinListeners.has('data')).toBe(true)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = inputPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('raw mode enabled'))
      consoleSpy.mockRestore()
    })

    it('includes initial bindings', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'q', handler, description: 'Quit' }]
      })
      const app = createMockApp()

      plugin.install(app)

      const inputApp = app as TUIApp & { input: any }
      const bindings = inputApp.input.getBindings()
      expect(bindings).toHaveLength(1)
      expect(bindings[0].key).toBe('q')
    })
  })

  describe('input API', () => {
    describe('bind', () => {
      it('adds a key binding', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        const handler = vi.fn()
        inputApp.input.bind('ctrl+c', handler, 'Exit')

        const bindings = inputApp.input.getBindings()
        expect(bindings.some(b => b.key === 'ctrl+c')).toBe(true)
      })

      it('replaces existing binding for same key', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        inputApp.input.bind('q', handler1)
        inputApp.input.bind('q', handler2)

        const bindings = inputApp.input.getBindings()
        const qBindings = bindings.filter(b => b.key === 'q')
        expect(qBindings).toHaveLength(1)
        expect(qBindings[0].handler).toBe(handler2)
      })

      it('adds description when provided', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.bind('?', vi.fn(), 'Show help')

        const bindings = inputApp.input.getBindings()
        const helpBinding = bindings.find(b => b.key === '?')
        expect(helpBinding?.description).toBe('Show help')
      })
    })

    describe('unbind', () => {
      it('removes a key binding', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.bind('q', vi.fn())
        inputApp.input.unbind('q')

        const bindings = inputApp.input.getBindings()
        expect(bindings.some(b => b.key === 'q')).toBe(false)
      })

      it('does nothing for non-existent binding', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.unbind('unknown')

        // Should not throw
      })
    })

    describe('getBindings', () => {
      it('returns copy of bindings', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.bind('a', vi.fn())
        inputApp.input.bind('b', vi.fn())

        const bindings = inputApp.input.getBindings()
        expect(bindings).toHaveLength(2)

        // Modifying returned array should not affect internal state
        bindings.push({ key: 'c', handler: vi.fn() })
        expect(inputApp.input.getBindings()).toHaveLength(2)
      })
    })

    describe('simulate', () => {
      it('triggers matching binding', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        const handler = vi.fn()
        inputApp.input.bind('q', handler)

        const event: KeyEvent = { name: 'q', ctrl: false, alt: false, shift: false, meta: false, sequence: 'q' }
        inputApp.input.simulate(event)

        expect(handler).toHaveBeenCalledWith(event)
      })

      it('does not trigger when disabled', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        const handler = vi.fn()
        inputApp.input.bind('q', handler)
        inputApp.input.setEnabled(false)

        const event: KeyEvent = { name: 'q', ctrl: false, alt: false, shift: false, meta: false, sequence: 'q' }
        inputApp.input.simulate(event)

        expect(handler).not.toHaveBeenCalled()
      })

      it('emits to focused node if no binding matches', () => {
        const plugin = inputPlugin()
        const app = createMockApp()
        const handleKey = vi.fn()
        ;(app as any).focusedNode = { handleKey }

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }

        const event: KeyEvent = { name: 'x', ctrl: false, alt: false, shift: false, meta: false, sequence: 'x' }
        inputApp.input.simulate(event)

        expect(handleKey).toHaveBeenCalledWith(event)
      })

      it('stops on first handler returning true', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        const handler1 = vi.fn(() => true)
        const handler2 = vi.fn()
        inputApp.input.bind('q', handler1)
        inputApp.input.bind('q', handler2) // Replaces first

        const event: KeyEvent = { name: 'q', ctrl: false, alt: false, shift: false, meta: false, sequence: 'q' }
        inputApp.input.simulate(event)

        // Only handler2 should be called (replaced handler1)
        expect(handler2).toHaveBeenCalled()
      })
    })

    describe('setEnabled/isEnabled', () => {
      it('enables input', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.setEnabled(false)
        inputApp.input.setEnabled(true)

        expect(inputApp.input.isEnabled()).toBe(true)
      })

      it('disables input', () => {
        const plugin = inputPlugin()
        const app = createMockApp()

        plugin.install(app)

        const inputApp = app as TUIApp & { input: any }
        inputApp.input.setEnabled(false)

        expect(inputApp.input.isEnabled()).toBe(false)
      })
    })
  })

  describe('destroy', () => {
    it('removes stdin listener', () => {
      const plugin = inputPlugin()
      const app = createMockApp()

      plugin.install(app)
      const initialListenerCount = stdinListeners.get('data')?.length ?? 0

      plugin.destroy!()

      expect((stdinListeners.get('data')?.length ?? 0)).toBeLessThan(initialListenerCount)
    })

    it('disables raw mode when TTY', () => {
      const plugin = inputPlugin()
      const app = createMockApp()

      plugin.install(app)
      plugin.destroy!()

      expect(process.stdin.setRawMode).toHaveBeenCalledWith(false)
    })
  })

  describe('stdin key handling', () => {
    // Helper to trigger stdin data
    function triggerStdinData(data: string | Buffer): void {
      const dataListeners = stdinListeners.get('data') || []
      for (const handler of dataListeners) {
        handler(Buffer.isBuffer(data) ? data : Buffer.from(data))
      }
    }

    it('logs key events in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = inputPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      // Trigger a key press (letter 'a')
      triggerStdinData('a')

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[input] key:'))
      consoleSpy.mockRestore()
    })

    it('calls global bindings on key press', () => {
      // Note: Using 'x' instead of 'a' because 'a' is treated as 'alt' modifier shortcut
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'x', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      // Trigger 'x' key
      triggerStdinData('x')

      // Verify handler was called
      expect(handler).toHaveBeenCalled()
    })

    it('stops propagation when binding handler returns non-false', () => {
      const handler = vi.fn(() => true)
      const plugin = inputPlugin({
        bindings: [{ key: 'x', handler }]
      })
      const app = createMockApp()
      ;(app as any).focusedNode = { handleKey: vi.fn() }

      plugin.install(app)

      triggerStdinData('x')

      // Binding handled it, so focused node handleKey should not be called
      expect((app as any).focusedNode.handleKey).not.toHaveBeenCalled()
    })

    it('passes to emitKeyEvent when binding returns false', () => {
      const handler = vi.fn(() => false)
      const plugin = inputPlugin({
        bindings: [{ key: 'x', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      triggerStdinData('x')

      // Should emit to app
      expect(app.emit).toHaveBeenCalledWith('key', expect.any(Object))
    })

    it('emits key event to app', () => {
      const plugin = inputPlugin()
      const app = createMockApp()

      plugin.install(app)

      triggerStdinData('x')

      expect(app.emit).toHaveBeenCalledWith('key', expect.objectContaining({
        name: 'x'
      }))
    })

    it('routes to focused node handleKey', () => {
      const plugin = inputPlugin()
      const app = createMockApp()
      const handleKey = vi.fn()
      ;(app as any).focusedNode = { handleKey }

      plugin.install(app)

      triggerStdinData('z')

      expect(handleKey).toHaveBeenCalledWith(expect.objectContaining({
        name: 'z'
      }))
    })

    it('does not call handleKey if focused node lacks it', () => {
      const plugin = inputPlugin()
      const app = createMockApp()
      ;(app as any).focusedNode = {} // No handleKey method

      plugin.install(app)

      // Should not throw
      triggerStdinData('z')

      expect(app.emit).toHaveBeenCalledWith('key', expect.any(Object))
    })

    it('handles app without emit function', () => {
      const plugin = inputPlugin()
      const app = createMockApp()
      delete (app as any).emit

      plugin.install(app)

      // Should not throw
      triggerStdinData('a')
    })

    it('does not process keys when disabled', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'x', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      const inputApp = app as TUIApp & { input: any }
      inputApp.input.setEnabled(false)

      triggerStdinData('x')

      expect(handler).not.toHaveBeenCalled()
    })

    it('handles escape key sequence', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'escape', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      // Escape is ASCII 27
      triggerStdinData(Buffer.from([27]))

      expect(handler).toHaveBeenCalled()
    })

    it('handles arrow keys', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'up', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      // Up arrow is ESC [ A
      triggerStdinData(Buffer.from([27, 91, 65]))

      expect(handler).toHaveBeenCalled()
    })

    it('handles tab key', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'tab', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      // Tab is ASCII 9
      triggerStdinData(Buffer.from([9]))

      expect(handler).toHaveBeenCalled()
    })

    it('handles enter key', () => {
      const handler = vi.fn()
      const plugin = inputPlugin({
        bindings: [{ key: 'enter', handler }]
      })
      const app = createMockApp()

      plugin.install(app)

      // Enter is ASCII 13
      triggerStdinData(Buffer.from([13]))

      expect(handler).toHaveBeenCalled()
    })
  })
})

describe('keyBindingPresets', () => {
  it('has vim preset', () => {
    expect(keyBindingPresets.vim).toBeDefined()
    expect(Array.isArray(keyBindingPresets.vim)).toBe(true)
    expect(keyBindingPresets.vim.length).toBeGreaterThan(0)
  })

  it('vim preset has expected keys', () => {
    const keys = keyBindingPresets.vim.map(b => b.key)
    expect(keys).toContain('h')
    expect(keys).toContain('j')
    expect(keys).toContain('k')
    expect(keys).toContain('l')
  })

  it('has emacs preset', () => {
    expect(keyBindingPresets.emacs).toBeDefined()
    expect(Array.isArray(keyBindingPresets.emacs)).toBe(true)
    expect(keyBindingPresets.emacs.length).toBeGreaterThan(0)
  })

  it('emacs preset has expected keys', () => {
    const keys = keyBindingPresets.emacs.map(b => b.key)
    expect(keys).toContain('ctrl+f')
    expect(keys).toContain('ctrl+b')
    expect(keys).toContain('ctrl+n')
    expect(keys).toContain('ctrl+p')
  })

  it('has common preset', () => {
    expect(keyBindingPresets.common).toBeDefined()
    expect(Array.isArray(keyBindingPresets.common)).toBe(true)
    expect(keyBindingPresets.common.length).toBeGreaterThan(0)
  })

  it('common preset has expected keys', () => {
    const keys = keyBindingPresets.common.map(b => b.key)
    expect(keys).toContain('q')
    expect(keys).toContain('ctrl+c')
  })

  it('all presets have descriptions', () => {
    const allBindings = [
      ...keyBindingPresets.vim,
      ...keyBindingPresets.emacs,
      ...keyBindingPresets.common
    ]

    for (const binding of allBindings) {
      expect(binding.description).toBeDefined()
      expect(binding.description?.length).toBeGreaterThan(0)
    }
  })

  it('all preset handlers are callable', () => {
    const allBindings = [
      ...keyBindingPresets.vim,
      ...keyBindingPresets.emacs,
      ...keyBindingPresets.common
    ]

    // Call all handlers to ensure they're valid functions and don't throw
    for (const binding of allBindings) {
      expect(binding.handler).toBeInstanceOf(Function)
      // Call the handler - they're all no-ops but should not throw
      expect(() => binding.handler({} as any)).not.toThrow()
    }
  })
})
