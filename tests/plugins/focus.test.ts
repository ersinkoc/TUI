/**
 * @oxog/tui - Focus Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { focusPlugin } from '../../src/plugins/focus'
import type { TUIApp, KeyEvent, Buffer, CellStyle } from '../../src/types'
import { BaseNode, ContainerNode, resetIdCounter } from '../../src/widgets/node'

// Concrete test implementations
class TestNode extends BaseNode {
  readonly type: string
  constructor(nodeType: string = 'box') {
    super()
    this.type = nodeType
  }
  render(_buffer: Buffer, _style: CellStyle): void {}
}

class TestContainer extends ContainerNode {
  readonly type = 'box'
  render(_buffer: Buffer, _style: CellStyle): void {}
}

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

// Create mock focusable node
function createFocusableNode(type: string = 'input'): TestNode {
  const node = new TestNode(type)
  node._bounds = { x: 0, y: 0, width: 20, height: 3 }
  node._visible = true
  return node
}

// Create mock container
function createMockContainer(): TestContainer {
  const container = new TestContainer()
  container._bounds = { x: 0, y: 0, width: 80, height: 24 }
  container._visible = true
  return container
}

describe('focusPlugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetIdCounter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('plugin creation', () => {
    it('creates a focus plugin', () => {
      const plugin = focusPlugin()

      expect(plugin.name).toBe('focus')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const plugin = focusPlugin({
        initialFocus: 'input-1',
        tabNavigation: true,
        arrowNavigation: true,
        wrap: false,
        debug: true
      })

      expect(plugin.name).toBe('focus')
    })
  })

  describe('install', () => {
    it('exposes focus API on app', () => {
      const plugin = focusPlugin()
      const app = createMockApp()

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      expect(focusApp.focus).toBeDefined()
      expect(focusApp.focus.getFocused).toBeInstanceOf(Function)
      expect(focusApp.focus.focus).toBeInstanceOf(Function)
      expect(focusApp.focus.focusNext).toBeInstanceOf(Function)
      expect(focusApp.focus.focusPrevious).toBeInstanceOf(Function)
      expect(focusApp.focus.blur).toBeInstanceOf(Function)
      expect(focusApp.focus.getFocusableNodes).toBeInstanceOf(Function)
      expect(focusApp.focus.registerFocusable).toBeInstanceOf(Function)
      expect(focusApp.focus.unregisterFocusable).toBeInstanceOf(Function)
    })

    it('sets initial focus after timeout', () => {
      const root = createMockContainer()
      const input1 = createFocusableNode()
      root._children = [input1]
      input1._parent = root

      // Plugin needs initialFocus to be the actual node ID
      const plugin = focusPlugin({ initialFocus: input1.id })
      const app = createMockApp()
      app.root = root

      plugin.install(app)
      vi.advanceTimersByTime(10)

      const focusApp = app as TUIApp & { focus: any }
      expect(focusApp.focus.getFocused()).toBe(input1)
    })

    it('binds tab navigation keys when input plugin available', () => {
      const boundKeys: string[] = []
      const plugin = focusPlugin({ tabNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string) => {
          boundKeys.push(key)
        }
      }

      plugin.install(app)

      expect(boundKeys).toContain('Tab')
      expect(boundKeys).toContain('shift+Tab')
    })

    it('binds arrow navigation keys when enabled', () => {
      const boundKeys: string[] = []
      const plugin = focusPlugin({ arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string) => {
          boundKeys.push(key)
        }
      }

      plugin.install(app)

      expect(boundKeys).toContain('ArrowDown')
      expect(boundKeys).toContain('ArrowUp')
      expect(boundKeys).toContain('ArrowRight')
      expect(boundKeys).toContain('ArrowLeft')
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = focusPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })
  })

  describe('focus API', () => {
    describe('getFocused', () => {
      it('returns null when nothing focused', () => {
        const plugin = focusPlugin()
        const app = createMockApp()

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        expect(focusApp.focus.getFocused()).toBeNull()
      })

      it('returns focused node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)

        expect(focusApp.focus.getFocused()).toBe(input1)
      })
    })

    describe('focus', () => {
      it('focuses a node by ID', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const result = focusApp.focus.focus(input1.id)

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input1)
      })

      it('returns false for unknown node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const result = focusApp.focus.focus('unknown')

        expect(result).toBe(false)
      })

      it('returns false for non-focusable node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const box = new TestNode('box') // box is not a focusable type
        box._visible = true
        root._children = [box]
        box._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const result = focusApp.focus.focus(box.id)

        expect(result).toBe(false)
      })

      it('calls blur on previous node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        const blurSpy = vi.fn()
        ;(input1 as any).blur = blurSpy
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        focusApp.focus.focus(input2.id)

        expect(blurSpy).toHaveBeenCalled()
      })

      it('calls focus on new node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const focusSpy = vi.fn()
        ;(input1 as any).focus = focusSpy
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)

        expect(focusSpy).toHaveBeenCalled()
      })

      it('emits blur handlers', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        const blurHandler = vi.fn()
        ;(input1 as any)._onBlurHandlers = [blurHandler]
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        focusApp.focus.focus(input2.id)

        expect(blurHandler).toHaveBeenCalled()
      })

      it('emits focus handlers', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const focusHandler = vi.fn()
        ;(input1 as any)._onFocusHandlers = [focusHandler]
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)

        expect(focusHandler).toHaveBeenCalled()
      })

      it('does not refocus already focused node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const focusSpy = vi.fn()
        ;(input1 as any).focus = focusSpy
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        focusApp.focus.focus(input1.id)

        // Should only be called once
        expect(focusSpy).toHaveBeenCalledTimes(1)
      })

      it('logs in debug mode', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const plugin = focusPlugin({ debug: true })
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('focused'))
        consoleSpy.mockRestore()
      })
    })

    describe('focusNext', () => {
      it('focuses next focusable node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        const result = focusApp.focus.focusNext()

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input2)
      })

      it('wraps to first node', () => {
        const plugin = focusPlugin({ wrap: true })
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input2.id)
        const result = focusApp.focus.focusNext()

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input1)
      })

      it('returns false when wrap disabled and at end', () => {
        const plugin = focusPlugin({ wrap: false })
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input2.id)
        const result = focusApp.focus.focusNext()

        expect(result).toBe(false)
        expect(focusApp.focus.getFocused()).toBe(input2)
      })

      it('returns false when no focusable nodes', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const result = focusApp.focus.focusNext()

        expect(result).toBe(false)
      })

      it('focuses first node when nothing focused', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const result = focusApp.focus.focusNext()

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input1)
      })
    })

    describe('focusPrevious', () => {
      it('focuses previous focusable node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input2.id)
        const result = focusApp.focus.focusPrevious()

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input1)
      })

      it('wraps to last node', () => {
        const plugin = focusPlugin({ wrap: true })
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        const result = focusApp.focus.focusPrevious()

        expect(result).toBe(true)
        expect(focusApp.focus.getFocused()).toBe(input2)
      })

      it('returns false when wrap disabled and at start', () => {
        const plugin = focusPlugin({ wrap: false })
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        const result = focusApp.focus.focusPrevious()

        expect(result).toBe(false)
        expect(focusApp.focus.getFocused()).toBe(input1)
      })
    })

    describe('blur', () => {
      it('blurs current focus', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        focusApp.focus.blur()

        expect(focusApp.focus.getFocused()).toBeNull()
      })

      it('calls blur method on node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const blurSpy = vi.fn()
        ;(input1 as any).blur = blurSpy
        root._children = [input1]
        input1._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.focus(input1.id)
        focusApp.focus.blur()

        expect(blurSpy).toHaveBeenCalled()
      })

      it('does nothing when nothing focused', () => {
        const plugin = focusPlugin()
        const app = createMockApp()

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.blur() // Should not throw
      })
    })

    describe('getFocusableNodes', () => {
      it('returns all focusable nodes', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const nodes = focusApp.focus.getFocusableNodes()

        expect(nodes).toContain(input1)
        expect(nodes).toContain(input2)
      })

      it('excludes invisible nodes', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        input2._visible = false
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const nodes = focusApp.focus.getFocusableNodes()

        expect(nodes).toContain(input1)
        expect(nodes).not.toContain(input2)
      })

      it('excludes disabled nodes', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const input1 = createFocusableNode()
        const input2 = createFocusableNode()
        ;(input2 as any).disabled = true
        root._children = [input1, input2]
        input1._parent = root
        input2._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const nodes = focusApp.focus.getFocusableNodes()

        expect(nodes).toContain(input1)
        expect(nodes).not.toContain(input2)
      })

      it('includes nodes with focusable property', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const box = new TestNode('box')
        box._visible = true
        ;(box as any).focusable = true
        root._children = [box]
        box._parent = root
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const nodes = focusApp.focus.getFocusableNodes()

        expect(nodes).toContain(box)
      })

      it('includes focusable widget types', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const focusableTypes = ['input', 'textarea', 'select', 'checkbox', 'button', 'tabs']
        const nodes: TestNode[] = []

        for (const type of focusableTypes) {
          const node = new TestNode(type)
          node._visible = true
          nodes.push(node)
          root._children.push(node)
          node._parent = root
        }
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        const focusable = focusApp.focus.getFocusableNodes()

        for (const node of nodes) {
          expect(focusable).toContain(node)
        }
      })
    })

    describe('registerFocusable', () => {
      it('registers a node as focusable', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const box = new TestNode('box')
        box._visible = true
        ;(box as any).focusable = true
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.registerFocusable(box)

        const nodes = focusApp.focus.getFocusableNodes()
        expect(nodes).toContain(box)
      })
    })

    describe('unregisterFocusable', () => {
      it('unregisters a node', () => {
        const plugin = focusPlugin()
        const app = createMockApp()
        const root = createMockContainer()
        const box = new TestNode('box')
        box._visible = true
        ;(box as any).focusable = true
        app.root = root

        plugin.install(app)

        const focusApp = app as TUIApp & { focus: any }
        focusApp.focus.registerFocusable(box)
        focusApp.focus.unregisterFocusable(box)

        const nodes = focusApp.focus.getFocusableNodes()
        expect(nodes).not.toContain(box)
      })
    })
  })

  describe('destroy', () => {
    it('cleans up plugin state', () => {
      const plugin = focusPlugin()
      const app = createMockApp()

      plugin.install(app)
      plugin.destroy!()

      // Should not throw
    })
  })

  describe('key navigation handlers', () => {
    it('handles tab key for focus next', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ tabNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input1.id)

      // Trigger tab key
      const tabHandler = keyHandlers.get('Tab')
      expect(tabHandler).toBeDefined()

      const event: KeyEvent = { name: 'tab', ctrl: false, alt: false, shift: false, meta: false, sequence: '\t' }
      const result = tabHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input2)
    })

    it('handles shift+tab key for focus previous', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ tabNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input2.id)

      // Trigger shift+tab key
      const shiftTabHandler = keyHandlers.get('shift+Tab')
      expect(shiftTabHandler).toBeDefined()

      const event: KeyEvent = { name: 'tab', ctrl: false, alt: false, shift: true, meta: false, sequence: '\t' }
      const result = shiftTabHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input1)
    })

    it('handles arrow down key for focus next', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input1.id)

      // Trigger arrow down key
      const downHandler = keyHandlers.get('ArrowDown')
      expect(downHandler).toBeDefined()

      const event: KeyEvent = { name: 'down', ctrl: false, alt: false, shift: false, meta: false, sequence: '' }
      const result = downHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input2)
    })

    it('handles arrow up key for focus previous', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input2.id)

      // Trigger arrow up key
      const upHandler = keyHandlers.get('ArrowUp')
      expect(upHandler).toBeDefined()

      const event: KeyEvent = { name: 'up', ctrl: false, alt: false, shift: false, meta: false, sequence: '' }
      const result = upHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input1)
    })

    it('handles arrow right key for focus next', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input1.id)

      const rightHandler = keyHandlers.get('ArrowRight')
      expect(rightHandler).toBeDefined()

      const event: KeyEvent = { name: 'right', ctrl: false, alt: false, shift: false, meta: false, sequence: '' }
      const result = rightHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input2)
    })

    it('handles arrow left key for focus previous', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      const input2 = createFocusableNode()
      root._children = [input1, input2]
      input1._parent = root
      input2._parent = root
      app.root = root

      plugin.install(app)

      const focusApp = app as TUIApp & { focus: any }
      focusApp.focus.focus(input2.id)

      const leftHandler = keyHandlers.get('ArrowLeft')
      expect(leftHandler).toBeDefined()

      const event: KeyEvent = { name: 'left', ctrl: false, alt: false, shift: false, meta: false, sequence: '' }
      const result = leftHandler!(event)

      expect(result).toBe(true)
      expect(focusApp.focus.getFocused()).toBe(input1)
    })

    it('returns false for non-navigation keys', () => {
      const keyHandlers: Map<string, (e: KeyEvent) => boolean> = new Map()
      const plugin = focusPlugin({ tabNavigation: true, arrowNavigation: true })
      const app = createMockApp() as TUIApp & {
        input: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void }
      }

      app.input = {
        bind: (key: string, handler: (e: KeyEvent) => boolean) => {
          keyHandlers.set(key, handler)
        }
      }

      const root = createMockContainer()
      const input1 = createFocusableNode()
      root._children = [input1]
      input1._parent = root
      app.root = root

      plugin.install(app)

      // Get any handler and call it with a non-matching key event
      const tabHandler = keyHandlers.get('Tab')
      expect(tabHandler).toBeDefined()

      // Pass a non-navigation key event - this should fall through to return false
      const event: KeyEvent = { name: 'enter', ctrl: false, alt: false, shift: false, meta: false, sequence: '\r' }
      const result = tabHandler!(event)

      expect(result).toBe(false)
    })
  })
})
