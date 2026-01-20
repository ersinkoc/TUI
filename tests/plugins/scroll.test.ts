/**
 * @oxog/tui - Scroll Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrollPlugin, createScrollIndicators } from '../../src/plugins/scroll'
import type { TUIApp, Buffer, CellStyle } from '../../src/types'
import { BaseNode, resetIdCounter } from '../../src/widgets/node'

// Concrete test node implementation
class TestNode extends BaseNode {
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

// Create mock node for scrollable content
function createMockNode(bounds: { x: number; y: number; width: number; height: number }): TestNode {
  const node = new TestNode()
  node._bounds = bounds
  return node
}

describe('scrollPlugin', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('plugin creation', () => {
    it('creates a scroll plugin', () => {
      const plugin = scrollPlugin()

      expect(plugin.name).toBe('scroll')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.onResize).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts options', () => {
      const plugin = scrollPlugin({
        scrollAmount: 5,
        smooth: true,
        showIndicators: true,
        debug: true
      })

      expect(plugin.name).toBe('scroll')
    })
  })

  describe('install', () => {
    it('exposes scroll API on app', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      expect(scrollApp.scroll).toBeDefined()
      expect(scrollApp.scroll.getScrollState).toBeInstanceOf(Function)
      expect(scrollApp.scroll.scrollTo).toBeInstanceOf(Function)
      expect(scrollApp.scroll.scrollBy).toBeInstanceOf(Function)
      expect(scrollApp.scroll.scrollIntoView).toBeInstanceOf(Function)
      expect(scrollApp.scroll.registerScrollable).toBeInstanceOf(Function)
      expect(scrollApp.scroll.unregisterScrollable).toBeInstanceOf(Function)
      expect(scrollApp.scroll.getScrollableNodes).toBeInstanceOf(Function)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = scrollPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('plugin installed'))
      consoleSpy.mockRestore()
    })

    it('hooks into mouse plugin if available', () => {
      const plugin = scrollPlugin()
      const mouseHandlers: ((e: any) => void)[] = []
      const app = createMockApp() as TUIApp & {
        mouse: { on: (handler: (e: any) => void) => () => void }
      }

      // Add mock mouse API
      app.mouse = {
        on: (handler) => {
          mouseHandlers.push(handler)
          return () => {}
        }
      }

      plugin.install(app)

      expect(mouseHandlers.length).toBe(1)
    })
  })

  describe('registerScrollable', () => {
    it('registers a scrollable node', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100, 40)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state).toBeDefined()
      expect(state.scrollX).toBe(0)
      expect(state.scrollY).toBe(0)
      expect(state.contentHeight).toBe(100)
      expect(state.contentWidth).toBe(40)
      expect(state.viewHeight).toBe(10)
      expect(state.viewWidth).toBe(40)
    })

    it('registers without contentWidth', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.contentWidth).toBe(40) // Uses view width
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = scrollPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('registered'))
      consoleSpy.mockRestore()
    })
  })

  describe('unregisterScrollable', () => {
    it('unregisters a scrollable node', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.unregisterScrollable(node)

      expect(scrollApp.scroll.getScrollState(node.id)).toBeNull()
    })
  })

  describe('getScrollableNodes', () => {
    it('returns empty array initially', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      expect(scrollApp.scroll.getScrollableNodes()).toEqual([])
    })

    it('returns registered node ids', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node1 = createMockNode({ x: 0, y: 0, width: 40, height: 10 })
      const node2 = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node1, 100)
      scrollApp.scroll.registerScrollable(node2, 50)

      const ids = scrollApp.scroll.getScrollableNodes()
      expect(ids).toContain(node1.id)
      expect(ids).toContain(node2.id)
    })
  })

  describe('scrollTo', () => {
    it('sets scroll position', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      // contentWidth=100, contentHeight=100 allows scrolling in both directions
      scrollApp.scroll.registerScrollable(node, 100, 100)
      scrollApp.scroll.scrollTo(node.id, 10, 20)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollX).toBe(10)
      expect(state.scrollY).toBe(20)
    })

    it('clamps to valid range', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100, 40)
      scrollApp.scroll.scrollTo(node.id, -10, 200)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollX).toBe(0) // Clamped from -10
      expect(state.scrollY).toBe(90) // Clamped to 100 - 10
    })

    it('does nothing for unknown node', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }

      // Should not throw
      scrollApp.scroll.scrollTo('unknown', 10, 20)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = scrollPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollTo(node.id, 10, 20)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('scrollTo'))
      consoleSpy.mockRestore()
    })

    it('calls setScrollOffset on node if available', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })
      const setScrollOffsetSpy = vi.fn()
      ;(node as any).setScrollOffset = setScrollOffsetSpy

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollTo(node.id, 10, 20)

      expect(setScrollOffsetSpy).toHaveBeenCalledWith(20)
    })

    it('sets _scrollY and _scrollX on node if available', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })
      // Ensure node has _scrollY/_scrollX but NOT setScrollOffset
      delete (node as any).setScrollOffset
      ;(node as any)._scrollY = 0
      ;(node as any)._scrollX = 0

      // Pass both contentHeight and contentWidth to allow horizontal scrolling
      scrollApp.scroll.registerScrollable(node, 100, 100)
      scrollApp.scroll.scrollTo(node.id, 10, 20)

      expect((node as any)._scrollY).toBe(20)
      expect((node as any)._scrollX).toBe(10)
    })
  })

  describe('scrollBy', () => {
    it('scrolls by delta amounts', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      // contentWidth=100, contentHeight=100 allows scrolling in both directions
      scrollApp.scroll.registerScrollable(node, 100, 100)
      scrollApp.scroll.scrollBy(node.id, 5, 10)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollX).toBe(5)
      expect(state.scrollY).toBe(10)
    })

    it('accumulates scroll', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollBy(node.id, 0, 10)
      scrollApp.scroll.scrollBy(node.id, 0, 10)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(20)
    })

    it('clamps to valid range', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollBy(node.id, 0, -50)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(0) // Clamped
    })

    it('does nothing for unknown node', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }

      // Should not throw
      scrollApp.scroll.scrollBy('unknown', 0, 10)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = scrollPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollBy(node.id, 0, 10)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('scrollBy'))
      consoleSpy.mockRestore()
    })
  })

  describe('scrollIntoView', () => {
    it('scrolls to show item above viewport', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollTo(node.id, 0, 50) // Start in middle
      scrollApp.scroll.scrollIntoView(node.id, 20) // Item at index 20

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(20) // Scrolled to show item
    })

    it('scrolls to show item below viewport', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollIntoView(node.id, 15) // Item at index 15

      const state = scrollApp.scroll.getScrollState(node.id)
      // Item should be visible (scrollY + viewHeight > itemBottom)
      expect(state.scrollY).toBeLessThanOrEqual(15)
      expect(state.scrollY + 10).toBeGreaterThan(15)
    })

    it('does not scroll if item already visible', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollIntoView(node.id, 5) // Item in viewport

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(0) // No scroll needed
    })

    it('does nothing for unknown node', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }

      // Should not throw
      scrollApp.scroll.scrollIntoView('unknown', 10)
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = scrollPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollIntoView(node.id, 50)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('scrollIntoView'))
      consoleSpy.mockRestore()
    })
  })

  describe('onResize', () => {
    it('updates view sizes on resize', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)

      // Simulate resize by changing bounds
      node._bounds = { x: 0, y: 0, width: 50, height: 15 }
      plugin.onResize!(100, 50)

      const state = scrollApp.scroll.getScrollState(node.id)
      expect(state.viewWidth).toBe(50)
      expect(state.viewHeight).toBe(15)
    })

    it('clamps scroll on resize', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      scrollApp.scroll.scrollTo(node.id, 0, 80)

      // Resize to larger view
      node._bounds = { x: 0, y: 0, width: 40, height: 50 }
      plugin.onResize!(100, 50)

      const state = scrollApp.scroll.getScrollState(node.id)
      // scrollY should be clamped to contentHeight - viewHeight = 100 - 50 = 50
      expect(state.scrollY).toBe(50)
    })
  })

  describe('destroy', () => {
    it('clears scroll states', () => {
      const plugin = scrollPlugin()
      const app = createMockApp()

      plugin.install(app)

      const scrollApp = app as TUIApp & { scroll: any }
      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })

      scrollApp.scroll.registerScrollable(node, 100)
      plugin.destroy!()

      expect(scrollApp.scroll.getScrollableNodes()).toEqual([])
    })
  })

  describe('mouse scroll handling', () => {
    it('handles scroll events from mouse plugin', () => {
      const plugin = scrollPlugin({ scrollAmount: 3 })
      let mouseHandler: ((e: any) => void) | null = null
      const app = createMockApp() as TUIApp & {
        mouse: { on: (handler: (e: any) => void) => () => void }
        scroll: any
      }

      app.mouse = {
        on: (handler) => {
          mouseHandler = handler
          return () => {}
        }
      }

      plugin.install(app)

      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })
      app.scroll.registerScrollable(node, 100)

      // Simulate scroll event within node bounds
      mouseHandler!({ action: 'scroll', x: 10, y: 5, scrollDelta: 1 })

      const state = app.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(3) // scrollAmount * scrollDelta
    })

    it('ignores non-scroll events', () => {
      const plugin = scrollPlugin()
      let mouseHandler: ((e: any) => void) | null = null
      const app = createMockApp() as TUIApp & {
        mouse: { on: (handler: (e: any) => void) => () => void }
        scroll: any
      }

      app.mouse = {
        on: (handler) => {
          mouseHandler = handler
          return () => {}
        }
      }

      plugin.install(app)

      const node = createMockNode({ x: 0, y: 0, width: 40, height: 10 })
      app.scroll.registerScrollable(node, 100)

      // Simulate non-scroll event
      mouseHandler!({ action: 'press', x: 10, y: 5 })

      const state = app.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(0) // No scroll
    })

    it('ignores scroll outside node bounds', () => {
      const plugin = scrollPlugin()
      let mouseHandler: ((e: any) => void) | null = null
      const app = createMockApp() as TUIApp & {
        mouse: { on: (handler: (e: any) => void) => () => void }
        scroll: any
      }

      app.mouse = {
        on: (handler) => {
          mouseHandler = handler
          return () => {}
        }
      }

      plugin.install(app)

      const node = createMockNode({ x: 10, y: 10, width: 20, height: 10 })
      app.scroll.registerScrollable(node, 100)

      // Simulate scroll outside bounds
      mouseHandler!({ action: 'scroll', x: 5, y: 5, scrollDelta: 1 })

      const state = app.scroll.getScrollState(node.id)
      expect(state.scrollY).toBe(0) // No scroll
    })
  })
})

describe('createScrollIndicators', () => {
  it('returns correct indicators for scrollable content', () => {
    const state = {
      scrollX: 10,
      scrollY: 20,
      contentWidth: 100,
      contentHeight: 200,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.top).toBe(true) // scrollY > 0
    expect(indicators.bottom).toBe(true) // scrollY < contentHeight - viewHeight
    expect(indicators.left).toBe(true) // scrollX > 0
    expect(indicators.right).toBe(true) // scrollX < contentWidth - viewWidth
  })

  it('returns false for top when at top', () => {
    const state = {
      scrollX: 0,
      scrollY: 0,
      contentWidth: 100,
      contentHeight: 200,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.top).toBe(false)
    expect(indicators.bottom).toBe(true)
  })

  it('returns false for bottom when at bottom', () => {
    const state = {
      scrollX: 0,
      scrollY: 150, // contentHeight - viewHeight = 200 - 50
      contentWidth: 100,
      contentHeight: 200,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.top).toBe(true)
    expect(indicators.bottom).toBe(false)
  })

  it('returns false for all when no scroll needed', () => {
    const state = {
      scrollX: 0,
      scrollY: 0,
      contentWidth: 40,
      contentHeight: 50,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.top).toBe(false)
    expect(indicators.bottom).toBe(false)
    expect(indicators.left).toBe(false)
    expect(indicators.right).toBe(false)
  })

  it('calculates vertical scrollbar', () => {
    const state = {
      scrollX: 0,
      scrollY: 50,
      contentWidth: 40,
      contentHeight: 200,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.verticalBar).toBeDefined()
    expect(indicators.verticalBar!.size).toBeGreaterThan(0)
    expect(indicators.verticalBar!.position).toBeGreaterThanOrEqual(0)
  })

  it('calculates horizontal scrollbar', () => {
    const state = {
      scrollX: 30,
      scrollY: 0,
      contentWidth: 200,
      contentHeight: 50,
      viewWidth: 80,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.horizontalBar).toBeDefined()
    expect(indicators.horizontalBar!.size).toBeGreaterThan(0)
    expect(indicators.horizontalBar!.position).toBeGreaterThanOrEqual(0)
  })

  it('does not include scrollbar when content fits', () => {
    const state = {
      scrollX: 0,
      scrollY: 0,
      contentWidth: 40,
      contentHeight: 50,
      viewWidth: 40,
      viewHeight: 50
    }

    const indicators = createScrollIndicators(state)

    expect(indicators.verticalBar).toBeUndefined()
    expect(indicators.horizontalBar).toBeUndefined()
  })
})
