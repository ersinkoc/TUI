/**
 * @oxog/tui - TUI Kernel Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tui, createApp } from '../../src/kernel/tui'
import type { Plugin, Node } from '../../src/types'

// Mock the screen module
vi.mock('../../src/core/screen', () => ({
  getTerminalSize: vi.fn(() => ({ width: 80, height: 24 })),
  setupSignalHandlers: vi.fn(() => vi.fn())
}))

beforeEach(() => {
  vi.useFakeTimers()
  // Mock stdout methods used by the app
  vi.spyOn(process.stdout, 'on').mockImplementation(() => process.stdout)
  vi.spyOn(process.stdout, 'removeListener').mockImplementation(() => process.stdout)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Create mock node
function createMockNode(): Node {
  return {
    id: 'test-node',
    type: 'box',
    parent: null,
    children: [],
    isVisible: true,
    render: vi.fn(),
    bounds: { x: 0, y: 0, width: 80, height: 24 }
  } as unknown as Node
}

// Create mock plugin
function createMockPlugin(name: string = 'test-plugin'): Plugin {
  return {
    name,
    install: vi.fn(),
    destroy: vi.fn(),
    beforeRender: vi.fn(),
    render: vi.fn(),
    afterRender: vi.fn(),
    onResize: vi.fn()
  }
}

describe('tui', () => {
  describe('creation', () => {
    it('creates an app instance', () => {
      const app = tui()

      expect(app).toBeDefined()
      expect(app.width).toBe(80)
      expect(app.height).toBe(24)
      expect(app.isRunning).toBe(false)
      expect(app.root).toBeNull()
      expect(app.focused).toBeNull()
    })

    it('creates app with custom theme', () => {
      const customTheme = {
        colors: {
          primary: '#ff0000'
        }
      }
      const app = tui({ theme: customTheme as any })

      expect(app.theme.colors.primary).toBe('#ff0000')
    })

    it('creates app with custom fps', () => {
      const app = tui({ fps: 30 })

      expect(app).toBeDefined()
    })
  })

  describe('mount/unmount', () => {
    it('mounts a node', () => {
      const app = tui()
      const node = createMockNode()

      app.mount(node)

      expect(app.root).toBe(node)
    })

    it('returns app for chaining', () => {
      const app = tui()
      const node = createMockNode()

      const result = app.mount(node)

      expect(result).toBe(app)
    })

    it('unmounts a node', () => {
      const app = tui()
      const node = createMockNode()

      app.mount(node)
      app.unmount()

      expect(app.root).toBeNull()
    })

    it('emits mount event', () => {
      const app = tui()
      const node = createMockNode()
      const handler = vi.fn()

      app.on('mount', handler)
      app.mount(node)

      expect(handler).toHaveBeenCalledWith(node)
    })

    it('emits unmount event', () => {
      const app = tui()
      const node = createMockNode()
      const handler = vi.fn()

      app.mount(node)
      app.on('unmount', handler)
      app.unmount()

      expect(handler).toHaveBeenCalledWith(node)
    })
  })

  describe('start/quit', () => {
    it('starts the app', () => {
      const app = tui()

      app.start()

      expect(app.isRunning).toBe(true)
      app.quit()
    })

    it('returns app for chaining', () => {
      const app = tui()

      const result = app.start()

      expect(result).toBe(app)
      app.quit()
    })

    it('emits start event', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('start', handler)
      app.start()

      expect(handler).toHaveBeenCalled()
      app.quit()
    })

    it('does not double start', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('start', handler)
      app.start()
      app.start()

      expect(handler).toHaveBeenCalledTimes(1)
      app.quit()
    })

    it('quits the app', async () => {
      const app = tui()

      app.start()
      await app.quit()

      expect(app.isRunning).toBe(false)
    })

    it('emits quit event', async () => {
      const app = tui()
      const handler = vi.fn()

      app.on('quit', handler)
      app.start()
      await app.quit()

      expect(handler).toHaveBeenCalled()
    })

    it('does not double quit', async () => {
      const app = tui()
      const handler = vi.fn()

      app.on('quit', handler)
      app.start()
      await app.quit()
      await app.quit()

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('plugins', () => {
    it('installs plugins on start', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.start()

      expect(plugin.install).toHaveBeenCalledWith(app)
      app.quit()
    })

    it('destroys plugins on quit', async () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.start()
      await app.quit()

      expect(plugin.destroy).toHaveBeenCalled()
    })

    it('destroys plugins in reverse order', async () => {
      const order: string[] = []
      const plugin1 = {
        name: 'plugin1',
        install: vi.fn(),
        destroy: () => order.push('plugin1')
      }
      const plugin2 = {
        name: 'plugin2',
        install: vi.fn(),
        destroy: () => order.push('plugin2')
      }
      const app = tui({ plugins: [plugin1, plugin2] })

      app.start()
      await app.quit()

      expect(order).toEqual(['plugin2', 'plugin1'])
    })

    it('gets plugin by name', () => {
      const plugin = createMockPlugin('my-plugin')
      const app = tui({ plugins: [plugin] })

      app.start()
      const found = app.getPlugin('my-plugin')

      expect(found).toBe(plugin)
      app.quit()
    })

    it('returns undefined for unknown plugin', () => {
      const app = tui()

      app.start()
      const found = app.getPlugin('unknown')

      expect(found).toBeUndefined()
      app.quit()
    })

    it('hot-loads plugin with use()', () => {
      const plugin = createMockPlugin()
      const app = tui()

      app.start()
      app.use(plugin)

      expect(plugin.install).toHaveBeenCalledWith(app)
      app.quit()
    })

    it('queues plugin for later when not running', () => {
      const plugin = createMockPlugin()
      const app = tui()

      app.use(plugin)
      expect(plugin.install).not.toHaveBeenCalled()

      app.start()
      expect(plugin.install).toHaveBeenCalled()
      app.quit()
    })

    it('throws on plugin install error', () => {
      const plugin = {
        name: 'bad-plugin',
        install: vi.fn(() => {
          throw new Error('Install failed')
        })
      }
      const app = tui({ plugins: [plugin] })

      expect(() => app.start()).toThrow('Failed to install plugin "bad-plugin"')
    })
  })

  describe('events', () => {
    it('registers event handler', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('start', handler)
      app.start()

      expect(handler).toHaveBeenCalled()
      app.quit()
    })

    it('returns unsubscribe function', () => {
      const app = tui()
      const handler = vi.fn()

      const unsubscribe = app.on('start', handler)
      unsubscribe()
      app.start()

      expect(handler).not.toHaveBeenCalled()
      app.quit()
    })

    it('removes handler with off()', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('start', handler)
      app.off('start', handler)
      app.start()

      expect(handler).not.toHaveBeenCalled()
      app.quit()
    })

    it('emits custom events', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('key', handler)
      app.emit('key', { name: 'a' } as any)

      expect(handler).toHaveBeenCalledWith({ name: 'a' })
    })

    it('handles multiple handlers', () => {
      const app = tui()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      app.on('start', handler1)
      app.on('start', handler2)
      app.start()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      app.quit()
    })

    it('handles handler errors gracefully', () => {
      const app = tui()
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const goodHandler = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      app.on('start', errorHandler)
      app.on('start', goodHandler)
      app.start()

      expect(consoleSpy).toHaveBeenCalled()
      expect(goodHandler).toHaveBeenCalled()
      consoleSpy.mockRestore()
      app.quit()
    })
  })

  describe('quit handlers', () => {
    it('registers quit handler', async () => {
      const app = tui()
      const handler = vi.fn()

      app.onQuit(handler)
      app.start()
      await app.quit()

      expect(handler).toHaveBeenCalled()
    })

    it('returns app for chaining', () => {
      const app = tui()

      const result = app.onQuit(() => {})

      expect(result).toBe(app)
    })

    it('handles quit handler errors gracefully', async () => {
      const app = tui()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      app.onQuit(() => {
        throw new Error('Quit handler error')
      })

      app.start()
      await app.quit()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('refresh', () => {
    it('marks app as dirty', () => {
      const app = tui()
      const node = createMockNode()

      app.mount(node)
      app.start()
      app.refresh()

      // Should trigger render
      vi.advanceTimersByTime(20)
      app.quit()
    })

    it('returns app for chaining', () => {
      const app = tui()

      const result = app.refresh()

      expect(result).toBe(app)
    })
  })

  describe('markDirty', () => {
    it('schedules render', () => {
      const app = tui()
      const plugin = createMockPlugin()

      app.mount(createMockNode())
      app.use(plugin)
      app.start()

      app.markDirty()
      vi.advanceTimersByTime(20)

      expect(plugin.render).toHaveBeenCalled()
      app.quit()
    })
  })

  describe('render cycle', () => {
    it('calls plugin beforeRender hook', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.mount(createMockNode())
      app.start()
      vi.advanceTimersByTime(20)

      expect(plugin.beforeRender).toHaveBeenCalled()
      app.quit()
    })

    it('calls plugin render hook', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })
      const node = createMockNode()

      app.mount(node)
      app.start()
      vi.advanceTimersByTime(20)

      expect(plugin.render).toHaveBeenCalledWith(node)
      app.quit()
    })

    it('calls plugin afterRender hook', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.mount(createMockNode())
      app.start()
      vi.advanceTimersByTime(20)

      expect(plugin.afterRender).toHaveBeenCalled()
      app.quit()
    })

    it('emits render event', () => {
      const app = tui()
      const handler = vi.fn()

      app.on('render', handler)
      app.mount(createMockNode())
      app.start()
      vi.advanceTimersByTime(20)

      expect(handler).toHaveBeenCalled()
      app.quit()
    })

    it('does not render without root', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.start()
      vi.advanceTimersByTime(100)

      expect(plugin.render).not.toHaveBeenCalled()
      app.quit()
    })

    it('does not render when not running', () => {
      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })

      app.mount(createMockNode())
      vi.advanceTimersByTime(100)

      expect(plugin.render).not.toHaveBeenCalled()
    })
  })

  describe('plugin destroy errors', () => {
    it('handles plugin destroy errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = {
        name: 'error-plugin',
        install: vi.fn(),
        destroy: () => {
          throw new Error('Destroy failed')
        }
      }
      const app = tui({ plugins: [plugin] })

      app.start()
      await app.quit()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error destroying plugin'),
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('use() hot-loading', () => {
    it('throws when hot-loading plugin fails', () => {
      const badPlugin = {
        name: 'bad-hot-plugin',
        install: vi.fn(() => {
          throw new Error('Hot install failed')
        })
      }
      const app = tui()

      app.start()

      expect(() => app.use(badPlugin)).toThrow('Failed to install plugin "bad-hot-plugin"')
      app.quit()
    })
  })

  describe('signal handler integration', () => {
    it('calls app.quit when signal handler is triggered', async () => {
      // Import the mock to modify behavior
      const screenModule = await import('../../src/core/screen')
      let signalCallback: (() => void) | null = null

      // Override the mock to capture the callback
      vi.mocked(screenModule.setupSignalHandlers).mockImplementation((callback: () => void) => {
        signalCallback = callback
        return vi.fn()
      })

      const app = tui()
      app.start()

      expect(signalCallback).not.toBeNull()

      // Trigger the signal handler
      signalCallback!()

      // Wait for quit to complete
      await vi.advanceTimersByTimeAsync(100)

      expect(app.isRunning).toBe(false)
    })
  })

  describe('resize handling', () => {
    it('handles resize when size has not changed', () => {
      // Get the resize handler
      let resizeHandler: (() => void) | null = null
      vi.mocked(process.stdout.on).mockImplementation((event: string, handler: () => void) => {
        if (event === 'resize') {
          resizeHandler = handler
        }
        return process.stdout
      })

      const app = tui()
      app.start()

      expect(resizeHandler).not.toBeNull()

      // Call resize handler when size hasn't changed
      // The mock always returns 80x24, which is the same as initial
      resizeHandler!()

      // Should not throw, just return early
      expect(app.width).toBe(80)
      expect(app.height).toBe(24)

      app.quit()
    })

    it('handles resize when size changes', async () => {
      // Import the mock to modify behavior
      const screenModule = await import('../../src/core/screen')
      let resizeHandler: (() => void) | null = null

      vi.mocked(process.stdout.on).mockImplementation((event: string, handler: () => void) => {
        if (event === 'resize') {
          resizeHandler = handler
        }
        return process.stdout
      })

      const plugin = createMockPlugin()
      const app = tui({ plugins: [plugin] })
      const resizeEventHandler = vi.fn()
      app.on('resize', resizeEventHandler)
      app.start()

      expect(resizeHandler).not.toBeNull()

      // Change the mock to return different size
      vi.mocked(screenModule.getTerminalSize).mockReturnValue({ width: 100, height: 30 })

      // Trigger resize handler
      resizeHandler!()

      // Check that size was updated
      expect(app.width).toBe(100)
      expect(app.height).toBe(30)
      expect(plugin.onResize).toHaveBeenCalledWith(100, 30)
      expect(resizeEventHandler).toHaveBeenCalledWith(100, 30)

      app.quit()
    })
  })

  describe('mount with BaseNode', () => {
    it('mounts BaseNode instance', async () => {
      // Import BaseNode for testing
      const { BaseNode } = await import('../../src/widgets/node')

      // Create a concrete implementation
      class TestNode extends BaseNode {
        readonly type = 'test' as const
        render(): void {}
      }

      const app = tui()
      const node = new TestNode()

      app.start()
      app.mount(node)

      expect(app.root).toBe(node)
      app.quit()
    })
  })

  describe('terminal size error handling', () => {
    it('uses default size when getTerminalSize throws', async () => {
      const screenModule = await import('../../src/core/screen')

      // Make getTerminalSize throw
      vi.mocked(screenModule.getTerminalSize).mockImplementation(() => {
        throw new Error('Cannot get terminal size')
      })

      // Should not throw, uses defaults
      const app = tui()

      // Default size is 80x24
      expect(app.width).toBe(80)
      expect(app.height).toBe(24)
    })
  })
})

describe('error handling', () => {
  it('getError returns null when no error', () => {
    const app = tui()
    expect(app.getError()).toBeNull()
  })

  it('clearError returns app for chaining', () => {
    const app = tui()
    const result = app.clearError()
    expect(result).toBe(app)
  })

  it('clearError schedules render', () => {
    const plugin = createMockPlugin()
    const app = tui({ plugins: [plugin] })

    app.mount(createMockNode())
    app.start()
    vi.advanceTimersByTime(20)

    // Clear render call count
    vi.mocked(plugin.render).mockClear()

    app.clearError()
    vi.advanceTimersByTime(20)

    expect(plugin.render).toHaveBeenCalled()
    app.quit()
  })

  it('handles beforeRender errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorPlugin = {
      name: 'error-plugin',
      install: vi.fn(),
      beforeRender: vi.fn(() => {
        throw new Error('beforeRender failed')
      }),
      render: vi.fn()
    }
    const app = tui({ plugins: [errorPlugin] })

    app.mount(createMockNode())
    app.start()
    vi.advanceTimersByTime(20)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in error-plugin beforeRender'),
      expect.any(Error)
    )
    expect(app.getError()).not.toBeNull()
    consoleSpy.mockRestore()
    app.quit()
  })

  it('handles render errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorPlugin = {
      name: 'render-error-plugin',
      install: vi.fn(),
      render: vi.fn(() => {
        throw new Error('render failed')
      })
    }
    const app = tui({ plugins: [errorPlugin] })

    app.mount(createMockNode())
    app.start()
    vi.advanceTimersByTime(20)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in render-error-plugin render'),
      expect.any(Error)
    )
    expect(app.getError()).not.toBeNull()
    consoleSpy.mockRestore()
    app.quit()
  })

  it('handles afterRender errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorPlugin = {
      name: 'after-error-plugin',
      install: vi.fn(),
      afterRender: vi.fn(() => {
        throw new Error('afterRender failed')
      })
    }
    const app = tui({ plugins: [errorPlugin] })

    app.mount(createMockNode())
    app.start()
    vi.advanceTimersByTime(20)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in after-error-plugin afterRender'),
      expect.any(Error)
    )
    expect(app.getError()).not.toBeNull()
    consoleSpy.mockRestore()
    app.quit()
  })

  it('handles non-Error objects in render hooks', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorPlugin = {
      name: 'string-error-plugin',
      install: vi.fn(),
      render: vi.fn(() => {
        throw 'string error' // eslint-disable-line no-throw-literal
      })
    }
    const app = tui({ plugins: [errorPlugin] })

    app.mount(createMockNode())
    app.start()
    vi.advanceTimersByTime(20)

    expect(app.getError()).not.toBeNull()
    expect(app.getError()?.message).toBe('string error')
    consoleSpy.mockRestore()
    app.quit()
  })
})

describe('disposeRoot', () => {
  it('disposes the root node', async () => {
    const { BaseNode } = await import('../../src/widgets/node')

    class TestNode extends BaseNode {
      readonly type = 'test' as const
      render(): void {}
    }

    const app = tui()
    const node = new TestNode()

    app.mount(node)
    app.disposeRoot()

    expect(app.root).toBeNull()
  })

  it('returns app for chaining', () => {
    const app = tui()
    app.mount(createMockNode())

    const result = app.disposeRoot()

    expect(result).toBe(app)
  })

  it('handles dispose errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { BaseNode } = await import('../../src/widgets/node')

    class ErrorNode extends BaseNode {
      readonly type = 'error' as const
      render(): void {}
      dispose(): void {
        throw new Error('Dispose failed')
      }
    }

    const app = tui()
    const node = new ErrorNode()

    app.mount(node)
    app.disposeRoot()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error disposing root node'),
      expect.any(Error)
    )
    expect(app.getError()).not.toBeNull()
    consoleSpy.mockRestore()
  })

  it('handles non-BaseNode root gracefully', () => {
    const app = tui()
    const mockNode = createMockNode()

    app.mount(mockNode)
    app.disposeRoot()

    // Should not throw, just no-op for non-BaseNode
    expect(app.root).toBe(mockNode) // Still mounted because it's not BaseNode
  })

  it('clears focused node on dispose', async () => {
    const { BaseNode } = await import('../../src/widgets/node')

    class TestNode extends BaseNode {
      readonly type = 'test' as const
      render(): void {}
    }

    const app = tui()
    const node = new TestNode()

    app.mount(node)
    app.disposeRoot()

    expect(app.focused).toBeNull()
  })
})

describe('plugin dependency resolution', () => {
  it('resolves plugins with dependencies', () => {
    const order: string[] = []
    const pluginA = {
      name: 'plugin-a',
      install: vi.fn(() => order.push('a'))
    }
    const pluginB = {
      name: 'plugin-b',
      dependencies: ['plugin-a'],
      install: vi.fn(() => order.push('b'))
    }

    const app = tui({ plugins: [pluginB, pluginA] })
    app.start()

    expect(order).toEqual(['a', 'b'])
    app.quit()
  })

  it('resolves plugins with after constraints', () => {
    const order: string[] = []
    const pluginA = {
      name: 'plugin-a',
      install: vi.fn(() => order.push('a'))
    }
    const pluginB = {
      name: 'plugin-b',
      after: ['plugin-a'],
      install: vi.fn(() => order.push('b'))
    }

    const app = tui({ plugins: [pluginB, pluginA] })
    app.start()

    expect(order).toEqual(['a', 'b'])
    app.quit()
  })

  it('resolves plugins with before constraints when target not yet loaded', () => {
    const order: string[] = []
    // pluginA wants to load before pluginB
    // pluginB has a dependency that pluginA doesn't have, so it loads later naturally
    const pluginA = {
      name: 'plugin-a',
      before: ['plugin-b'],
      install: vi.fn(() => order.push('a'))
    }
    const pluginB = {
      name: 'plugin-b',
      after: ['plugin-a'], // This ensures B loads after A
      install: vi.fn(() => order.push('b'))
    }

    const app = tui({ plugins: [pluginA, pluginB] })
    app.start()

    expect(order).toEqual(['a', 'b'])
    app.quit()
  })

  it('throws on missing dependency', () => {
    const plugin = {
      name: 'dependent',
      dependencies: ['missing-plugin'],
      install: vi.fn()
    }

    const app = tui({ plugins: [plugin] })

    expect(() => app.start()).toThrow('depends on "missing-plugin" which is not available')
  })

  it('throws on circular dependency', () => {
    const pluginA = {
      name: 'plugin-a',
      dependencies: ['plugin-b'],
      install: vi.fn()
    }
    const pluginB = {
      name: 'plugin-b',
      dependencies: ['plugin-a'],
      install: vi.fn()
    }

    const app = tui({ plugins: [pluginA, pluginB] })

    expect(() => app.start()).toThrow('circular dependency')
  })

  it('warns on unsatisfiable before constraints', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const order: string[] = []

    // pluginA has no constraints, will load first
    // pluginB wants to load before pluginA, but pluginA has no dependency on B
    const pluginA = {
      name: 'plugin-a',
      install: vi.fn(() => order.push('a'))
    }
    const pluginB = {
      name: 'plugin-b',
      before: ['plugin-a'],
      after: ['plugin-a'], // This creates unsatisfiable constraint
      install: vi.fn(() => order.push('b'))
    }

    const app = tui({ plugins: [pluginA, pluginB] })
    app.start()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsatisfiable "before" constraint')
    )
    consoleSpy.mockRestore()
    app.quit()
  })
})

describe('createApp', () => {
  it('creates an app with standard plugins', () => {
    const app = createApp()

    expect(app).toBeDefined()
    expect(app.width).toBe(80)
    expect(app.height).toBe(24)
    expect(app.isRunning).toBe(false)
  })

  it('accepts custom options', () => {
    const customTheme = {
      colors: {
        primary: '#00ff00'
      }
    }
    const app = createApp({ theme: customTheme as any, fps: 30 })

    expect(app).toBeDefined()
    expect(app.theme.colors.primary).toBe('#00ff00')
  })
})
