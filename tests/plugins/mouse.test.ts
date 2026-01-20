/**
 * @oxog/tui - Mouse Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mousePlugin } from '../../src/plugins/mouse'
import type { TUIApp, MouseEvent, Buffer, CellStyle } from '../../src/types'
import { BaseNode, ContainerNode, resetIdCounter } from '../../src/widgets/node'

// Concrete test implementations
class TestNode extends BaseNode {
  readonly type = 'box'
  onClick?: (event: MouseEvent) => void
  onScroll?: (event: MouseEvent) => void
  onMouseMove?: (event: MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  handleMouse?: (event: MouseEvent) => void

  render(_buffer: Buffer, _style: CellStyle): void {}
}

class TestContainer extends ContainerNode {
  readonly type = 'box'
  onClick?: (event: MouseEvent) => void
  onScroll?: (event: MouseEvent) => void
  onMouseMove?: (event: MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  handleMouse?: (event: MouseEvent) => void

  render(_buffer: Buffer, _style: CellStyle): void {}
}

// Store original process values
const originalStdinIsTTY = process.stdin.isTTY
const originalStdoutWrite = process.stdout.write
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

// Create mock node
function createMockNode(bounds: { x: number; y: number; width: number; height: number }): TestNode {
  const node = new TestNode()
  node._bounds = bounds
  node._visible = true
  return node
}

// Create mock container
function createMockContainer(bounds: { x: number; y: number; width: number; height: number }): TestContainer {
  const container = new TestContainer()
  container._bounds = bounds
  container._visible = true
  return container
}

describe('mousePlugin', () => {
  let writtenData: string[] = []
  let stdinListeners: Map<string, ((...args: any[]) => void)[]> = new Map()

  beforeEach(() => {
    resetIdCounter()
    writtenData = []
    stdinListeners = new Map()

    // Mock stdout.write
    ;(process.stdout.write as any) = vi.fn((data: string) => {
      writtenData.push(data)
      return true
    })

    // Mock stdin
    Object.defineProperty(process.stdin, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    })

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
    ;(process.stdout.write as any) = originalStdoutWrite
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalStdinIsTTY,
      writable: true,
      configurable: true
    })
    ;(process.stdin.on as any) = originalStdinOn
    ;(process.stdin.removeListener as any) = originalStdinRemoveListener
  })

  // Helper to trigger mouse event
  function triggerMouseData(data: Buffer): void {
    const dataListeners = stdinListeners.get('data') || []
    for (const handler of dataListeners) {
      handler(data)
    }
  }

  // Create SGR mouse event buffer (format: ESC [ < Cb ; Cx ; Cy M/m)
  function createSGRMouseEvent(button: number, x: number, y: number, release: boolean = false): Buffer {
    const terminator = release ? 'm' : 'M'
    return Buffer.from(`\x1b[<${button};${x};${y}${terminator}`)
  }

  describe('plugin creation', () => {
    it('creates a mouse plugin', () => {
      const plugin = mousePlugin()

      expect(plugin.name).toBe('mouse')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const plugin = mousePlugin({
        enabled: false,
        sgr: true,
        debug: true
      })

      expect(plugin.name).toBe('mouse')
    })
  })

  describe('install', () => {
    it('exposes mouse API on app', () => {
      const plugin = mousePlugin()
      const app = createMockApp()

      plugin.install(app)

      const mouseApp = app as TUIApp & { mouse: any }
      expect(mouseApp.mouse).toBeDefined()
      expect(mouseApp.mouse.on).toBeInstanceOf(Function)
      expect(mouseApp.mouse.enable).toBeInstanceOf(Function)
      expect(mouseApp.mouse.disable).toBeInstanceOf(Function)
      expect(mouseApp.mouse.isEnabled).toBeInstanceOf(Function)
      expect(mouseApp.mouse.getNodeAt).toBeInstanceOf(Function)
    })

    it('enables mouse tracking by default', () => {
      const plugin = mousePlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should have written mouse enable sequence
      expect(writtenData.some(d => d.includes('\x1b['))).toBe(true)
    })

    it('does not enable mouse tracking when disabled', () => {
      const plugin = mousePlugin({ enabled: false })
      const app = createMockApp()

      writtenData = []
      plugin.install(app)

      // Should not have written mouse enable sequence
      expect(writtenData.length).toBe(0)
    })

    it('sets up stdin listener when TTY', () => {
      const plugin = mousePlugin()
      const app = createMockApp()

      plugin.install(app)

      expect(stdinListeners.has('data')).toBe(true)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = mousePlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })
  })

  describe('mouse API', () => {
    describe('on', () => {
      it('registers mouse handler', () => {
        const plugin = mousePlugin()
        const app = createMockApp()

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        const handler = vi.fn()
        const unsubscribe = mouseApp.mouse.on(handler)

        expect(unsubscribe).toBeInstanceOf(Function)
      })

      it('unsubscribes handler', () => {
        const plugin = mousePlugin()
        const app = createMockApp()

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        const handler = vi.fn()
        const unsubscribe = mouseApp.mouse.on(handler)

        unsubscribe()
        // Handler should no longer be called
      })
    })

    describe('enable/disable', () => {
      it('enables mouse tracking', () => {
        const plugin = mousePlugin({ enabled: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const mouseApp = app as TUIApp & { mouse: any }
        mouseApp.mouse.enable()

        expect(writtenData.length).toBeGreaterThan(0)
        expect(mouseApp.mouse.isEnabled()).toBe(true)
      })

      it('disables mouse tracking', () => {
        const plugin = mousePlugin({ enabled: true })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const mouseApp = app as TUIApp & { mouse: any }
        mouseApp.mouse.disable()

        expect(writtenData.length).toBeGreaterThan(0)
        expect(mouseApp.mouse.isEnabled()).toBe(false)
      })

      it('does not double enable', () => {
        const plugin = mousePlugin({ enabled: true })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const mouseApp = app as TUIApp & { mouse: any }
        mouseApp.mouse.enable() // Already enabled

        expect(writtenData.length).toBe(0)
      })

      it('does not double disable', () => {
        const plugin = mousePlugin({ enabled: false })
        const app = createMockApp()

        plugin.install(app)
        writtenData = []

        const mouseApp = app as TUIApp & { mouse: any }
        mouseApp.mouse.disable() // Already disabled

        expect(writtenData.length).toBe(0)
      })

      it('logs in debug mode', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const plugin = mousePlugin({ debug: true, enabled: false })
        const app = createMockApp()

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        mouseApp.mouse.enable()
        mouseApp.mouse.disable()

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('enabled'))
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'))
        consoleSpy.mockRestore()
      })
    })

    describe('isEnabled', () => {
      it('returns enabled state', () => {
        const plugin = mousePlugin({ enabled: true })
        const app = createMockApp()

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.isEnabled()).toBe(true)
      })
    })

    describe('getNodeAt', () => {
      it('returns null when no root', () => {
        const plugin = mousePlugin()
        const app = createMockApp()

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.getNodeAt(10, 10)).toBeNull()
      })

      it('finds node at position', () => {
        const plugin = mousePlugin()
        const app = createMockApp()
        const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
        app.root = root

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.getNodeAt(10, 10)).toBe(root)
      })

      it('finds nested child at position', () => {
        const plugin = mousePlugin()
        const app = createMockApp()
        const root = createMockContainer({ x: 0, y: 0, width: 80, height: 24 })
        const child = createMockNode({ x: 10, y: 10, width: 20, height: 10 })
        root._children = [child]
        child._parent = root
        app.root = root

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.getNodeAt(15, 15)).toBe(child)
      })

      it('returns null when outside all nodes', () => {
        const plugin = mousePlugin()
        const app = createMockApp()
        const root = createMockNode({ x: 10, y: 10, width: 20, height: 10 })
        app.root = root

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.getNodeAt(5, 5)).toBeNull()
      })

      it('ignores invisible nodes', () => {
        const plugin = mousePlugin()
        const app = createMockApp()
        const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
        root._visible = false
        app.root = root

        plugin.install(app)

        const mouseApp = app as TUIApp & { mouse: any }
        expect(mouseApp.mouse.getNodeAt(10, 10)).toBeNull()
      })
    })
  })

  describe('mouse event handling', () => {
    it('processes mouse data and calls handlers', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const handler = vi.fn()

      plugin.install(app)

      const mouseApp = app as TUIApp & { mouse: any }
      mouseApp.mouse.on(handler)

      // Trigger a mouse click at position 10, 5
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(handler).toHaveBeenCalled()
    })

    it('emits mouse event on app', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()

      plugin.install(app)

      // Trigger a mouse click
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(app.emit).toHaveBeenCalledWith('mouse', expect.any(Object))
    })

    it('logs mouse events in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = mousePlugin({ sgr: true, debug: true })
      const app = createMockApp()

      plugin.install(app)

      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[mouse] action='))
      consoleSpy.mockRestore()
    })

    it('does not process events when disabled', () => {
      const plugin = mousePlugin({ sgr: true, enabled: false })
      const app = createMockApp()
      const handler = vi.fn()

      plugin.install(app)

      const mouseApp = app as TUIApp & { mouse: any }
      mouseApp.mouse.on(handler)

      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(handler).not.toHaveBeenCalled()
    })

    it('stops propagation when handler returns true', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onClick = vi.fn()
      app.root = root

      plugin.install(app)

      const mouseApp = app as TUIApp & { mouse: any }
      mouseApp.mouse.on(() => true) // Handler stops propagation

      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      // Node onClick should not be called because handler stopped propagation
      expect(root.onClick).not.toHaveBeenCalled()
    })

    it('routes to node when handler does not stop propagation', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onClick = vi.fn()
      app.root = root

      plugin.install(app)

      const mouseApp = app as TUIApp & { mouse: any }
      mouseApp.mouse.on(() => {}) // Handler does not stop propagation

      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(root.onClick).toHaveBeenCalled()
    })
  })

  describe('node event routing', () => {
    it('calls onClick on press event', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onClick = vi.fn()
      app.root = root

      plugin.install(app)

      // Button 0 press (left click)
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(root.onClick).toHaveBeenCalledWith(expect.objectContaining({
        action: 'press',
        x: 9,  // 0-indexed (10-1)
        y: 4   // 0-indexed (5-1)
      }))
    })

    it('calls onScroll on scroll event', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onScroll = vi.fn()
      app.root = root

      plugin.install(app)

      // Button 64 = scroll up in SGR
      triggerMouseData(createSGRMouseEvent(64, 10, 5, false))

      expect(root.onScroll).toHaveBeenCalledWith(expect.objectContaining({
        action: 'scroll'
      }))
    })

    it('calls onMouseMove on move event', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onMouseMove = vi.fn()
      app.root = root

      plugin.install(app)

      // Button 35 = mouse move with no button (32 + 3)
      triggerMouseData(createSGRMouseEvent(35, 10, 5, false))

      expect(root.onMouseMove).toHaveBeenCalledWith(expect.objectContaining({
        action: 'move'
      }))
    })

    it('calls handleMouse generic handler', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.handleMouse = vi.fn()
      app.root = root

      plugin.install(app)

      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(root.handleMouse).toHaveBeenCalled()
    })

    it('handles node without specific handler', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      // No handlers defined
      app.root = root

      plugin.install(app)

      // Should not throw
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))

      expect(app.emit).toHaveBeenCalledWith('mouse', expect.any(Object))
    })
  })

  describe('hover enter/leave', () => {
    it('calls onMouseEnter when entering node', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onMouseEnter = vi.fn()
      app.root = root

      plugin.install(app)

      // Move event into the node
      triggerMouseData(createSGRMouseEvent(35, 10, 5, false))

      expect(root.onMouseEnter).toHaveBeenCalled()
    })

    it('calls onMouseLeave when leaving node', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockContainer({ x: 0, y: 0, width: 80, height: 24 })
      const child = createMockNode({ x: 10, y: 10, width: 20, height: 10 })
      child.onMouseLeave = vi.fn()
      child.onMouseEnter = vi.fn()
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)

      // First move into child
      triggerMouseData(createSGRMouseEvent(35, 15, 15, false))
      expect(child.onMouseEnter).toHaveBeenCalled()

      // Then move out of child (into root)
      triggerMouseData(createSGRMouseEvent(35, 5, 5, false))
      expect(child.onMouseLeave).toHaveBeenCalled()
    })

    it('handles node without onMouseEnter', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      // No onMouseEnter defined
      app.root = root

      plugin.install(app)

      // Should not throw
      triggerMouseData(createSGRMouseEvent(35, 10, 5, false))
    })

    it('handles node without onMouseLeave', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockContainer({ x: 0, y: 0, width: 80, height: 24 })
      const child = createMockNode({ x: 10, y: 10, width: 20, height: 10 })
      // No onMouseLeave defined
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)

      // Move into child
      triggerMouseData(createSGRMouseEvent(35, 15, 15, false))
      // Move out of child - should not throw
      triggerMouseData(createSGRMouseEvent(35, 5, 5, false))
    })

    it('does not call handlers when staying on same node', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      root.onMouseEnter = vi.fn()
      app.root = root

      plugin.install(app)

      // First move
      triggerMouseData(createSGRMouseEvent(35, 10, 5, false))
      expect(root.onMouseEnter).toHaveBeenCalledTimes(1)

      // Second move on same node
      triggerMouseData(createSGRMouseEvent(35, 20, 10, false))
      expect(root.onMouseEnter).toHaveBeenCalledTimes(1) // Still just 1
    })
  })

  describe('destroy', () => {
    it('disables mouse tracking', () => {
      const plugin = mousePlugin({ enabled: true })
      const app = createMockApp()

      plugin.install(app)
      writtenData = []

      plugin.destroy!()

      // Should have written disable sequence
      expect(writtenData.length).toBeGreaterThan(0)
    })

    it('removes stdin listener', () => {
      const plugin = mousePlugin()
      const app = createMockApp()

      plugin.install(app)
      const initialListenerCount = stdinListeners.get('data')?.length ?? 0

      plugin.destroy!()

      expect((stdinListeners.get('data')?.length ?? 0)).toBeLessThan(initialListenerCount)
    })
  })

  describe('edge cases', () => {
    it('handles app without emit function', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      delete (app as any).emit
      const root = createMockNode({ x: 0, y: 0, width: 80, height: 24 })
      app.root = root

      plugin.install(app)

      // Should not throw
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))
    })

    it('handles non-BaseNode root', () => {
      const plugin = mousePlugin({ sgr: true })
      const app = createMockApp()
      app.root = { notABaseNode: true } as any

      plugin.install(app)

      // Should not throw - just won't find target node
      triggerMouseData(createSGRMouseEvent(0, 10, 5, false))
    })
  })
})
