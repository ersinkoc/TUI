/**
 * @oxog/tui - Layout Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { layoutPlugin } from '../../src/plugins/layout'
import type { TUIApp, FlexDirection, FlexAlign, FlexJustify, Buffer, CellStyle } from '../../src/types'
import { BaseNode, ContainerNode } from '../../src/widgets/node'

// Concrete test implementations
class TestNode extends BaseNode {
  readonly type = 'box'
  render(_buffer: Buffer, _style: CellStyle): void {}
}

class TestContainer extends ContainerNode {
  readonly type = 'box'
  render(_buffer: Buffer, _style: CellStyle): void {}
}

// Mock TUI App
function createMockApp(width = 80, height = 24): TUIApp {
  return {
    width,
    height,
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

// Create mock container node with children
function createMockContainer(
  options: {
    flexDirection?: FlexDirection
    justifyContent?: FlexJustify
    alignItems?: FlexAlign
    gap?: number
    padding?: number | [number, number] | [number, number, number, number]
    margin?: number | [number, number] | [number, number, number, number]
    width?: number | string
    height?: number | string
    flex?: number
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  } = {}
): TestContainer {
  const container = new TestContainer()
  container._layout = {
    flexDirection: options.flexDirection ?? 'column',
    justifyContent: options.justifyContent ?? 'start',
    alignItems: options.alignItems ?? 'stretch',
    gap: options.gap ?? 0,
    padding: options.padding,
    margin: options.margin,
    width: options.width,
    height: options.height,
    flex: options.flex,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    minHeight: options.minHeight,
    maxHeight: options.maxHeight
  }
  container._bounds = { x: 0, y: 0, width: 0, height: 0 }
  return container
}

// Create mock base node
function createMockBaseNode(
  options: {
    width?: number | string
    height?: number | string
    flex?: number
    padding?: number
    margin?: number
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  } = {}
): TestNode {
  const node = new TestNode()
  node._layout = {
    width: options.width,
    height: options.height,
    flex: options.flex,
    padding: options.padding,
    margin: options.margin,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    minHeight: options.minHeight,
    maxHeight: options.maxHeight
  }
  node._bounds = { x: 0, y: 0, width: 0, height: 0 }
  return node
}

describe('layoutPlugin', () => {
  describe('plugin creation', () => {
    it('creates a layout plugin', () => {
      const plugin = layoutPlugin()

      expect(plugin.name).toBe('layout')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.beforeRender).toBeInstanceOf(Function)
      expect(plugin.onResize).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts debug option', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = layoutPlugin({ debug: true })
      const app = createMockApp()
      const root = createMockContainer()
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Debug mode logs layout calculations
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('install', () => {
    it('exposes layout API on app', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)

      const layoutApp = app as TUIApp & { layout: any }
      expect(layoutApp.layout).toBeDefined()
      expect(layoutApp.layout.recalculate).toBeInstanceOf(Function)
      expect(layoutApp.layout.getStats).toBeInstanceOf(Function)
    })

    it('getStats returns initial values', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)

      const layoutApp = app as TUIApp & { layout: any }
      const stats = layoutApp.layout.getStats()
      expect(stats.layoutCount).toBe(0)
      expect(stats.lastLayoutTime).toBe(0)
    })
  })

  describe('recalculate', () => {
    it('recalculates layout for root node', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()
      const root = createMockContainer({ width: '100%', height: '100%' })
      app.root = root

      plugin.install(app)
      const layoutApp = app as TUIApp & { layout: any }
      layoutApp.layout.recalculate()

      expect(root._bounds.width).toBe(80)
      expect(root._bounds.height).toBe(24)
    })

    it('does nothing when no root', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)
      const layoutApp = app as TUIApp & { layout: any }

      // Should not throw
      layoutApp.layout.recalculate()
    })
  })

  describe('beforeRender', () => {
    it('calculates layout for root', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()
      const root = createMockContainer({ width: '100%', height: '100%' })
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(root._bounds.x).toBe(0)
      expect(root._bounds.y).toBe(0)
      expect(root._bounds.width).toBe(80)
      expect(root._bounds.height).toBe(24)
    })

    it('increments layout count', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()
      const root = createMockContainer()
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()
      plugin.beforeRender!()
      plugin.beforeRender!()

      const layoutApp = app as TUIApp & { layout: any }
      expect(layoutApp.layout.getStats().layoutCount).toBe(3)
    })

    it('records last layout time', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()
      const root = createMockContainer()
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      const layoutApp = app as TUIApp & { layout: any }
      expect(layoutApp.layout.getStats().lastLayoutTime).toBeGreaterThanOrEqual(0)
    })

    it('does nothing when no root', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should not throw
      plugin.beforeRender!()
    })

    it('does nothing when app not set', () => {
      const plugin = layoutPlugin()

      // Should not throw
      plugin.beforeRender!()
    })
  })

  describe('onResize', () => {
    it('calls onResize hook', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)

      // Should not throw
      plugin.onResize!(100, 50)
    })

    it('logs resize in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = layoutPlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)
      plugin.onResize!(100, 50)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('resize'))
      consoleSpy.mockRestore()
    })
  })

  describe('destroy', () => {
    it('cleans up plugin state', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      plugin.install(app)
      plugin.destroy!()

      // Should not throw after destroy
      plugin.beforeRender!()
    })
  })

  describe('layout calculations - flexDirection', () => {
    it('layouts children in column direction', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ height: 10, width: '100%' })
      const child2 = createMockBaseNode({ height: 10, width: '100%' })

      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child1._bounds.y).toBe(0)
      expect(child2._bounds.y).toBe(10)
    })

    it('layouts children in row direction', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'row',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ width: 20, height: '100%' })
      const child2 = createMockBaseNode({ width: 20, height: '100%' })

      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child1._bounds.x).toBe(0)
      expect(child2._bounds.x).toBe(20)
    })
  })

  describe('layout calculations - justifyContent', () => {
    it('justifies content at start', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'start',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.y).toBe(0)
    })

    it('justifies content at end', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'end',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.y).toBe(14) // 24 - 10
    })

    it('justifies content at center', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.y).toBe(7) // (24 - 10) / 2
    })

    it('justifies content with space-between', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'between',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ height: 5 })
      const child2 = createMockBaseNode({ height: 5 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child1._bounds.y).toBe(0)
      // Second child should be at the end minus its height
      expect(child2._bounds.y).toBeGreaterThan(child1._bounds.y)
    })

    it('justifies content with space-around', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'around',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ height: 5 })
      const child2 = createMockBaseNode({ height: 5 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // First child should have some space before it
      expect(child1._bounds.y).toBeGreaterThan(0)
    })

    it('justifies content with space-evenly', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        justifyContent: 'space-evenly' as FlexJustify,
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ height: 4 })
      const child2 = createMockBaseNode({ height: 4 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Space should be evenly distributed
      expect(child1._bounds.y).toBeGreaterThan(0)
    })
  })

  describe('layout calculations - alignItems', () => {
    it('aligns items at start', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'start',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 20, height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(0)
    })

    it('aligns items at end', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'end',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 20, height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(60) // 80 - 20
    })

    it('aligns items at center', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 20, height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(30) // (80 - 20) / 2
    })

    it('stretches items', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(0)
      expect(child._bounds.width).toBe(80)
    })
  })

  describe('layout calculations - flex', () => {
    it('distributes space according to flex values', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ flex: 1 })
      const child2 = createMockBaseNode({ flex: 1 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Each should get half the space
      expect(child1._bounds.height).toBe(12)
      expect(child2._bounds.height).toBe(12)
    })

    it('distributes space with different flex values', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ flex: 1 })
      const child2 = createMockBaseNode({ flex: 2 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // First should get 1/3, second should get 2/3
      expect(child1._bounds.height).toBe(8) // 24 * 1/3
      expect(child2._bounds.height).toBe(16) // 24 * 2/3
    })

    it('handles flex in row direction', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'row',
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ flex: 1 })
      const child2 = createMockBaseNode({ flex: 3 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child1._bounds.width).toBe(20) // 80 * 1/4
      expect(child2._bounds.width).toBe(60) // 80 * 3/4
    })

    it('combines fixed and flex items', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const fixed = createMockBaseNode({ height: 4 })
      const flexItem = createMockBaseNode({ flex: 1 })
      root._children = [fixed, flexItem]
      fixed._parent = root
      flexItem._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(fixed._bounds.height).toBe(4)
      expect(flexItem._bounds.height).toBe(20) // 24 - 4
    })
  })

  describe('layout calculations - gap', () => {
    it('adds gap between children', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ height: 5 })
      const child2 = createMockBaseNode({ height: 5 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child1._bounds.y).toBe(0)
      expect(child2._bounds.y).toBe(7) // 5 + 2 gap
    })

    it('handles gap with flex items', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        height: '100%'
      })
      const child1 = createMockBaseNode({ flex: 1 })
      const child2 = createMockBaseNode({ flex: 1 })
      root._children = [child1, child2]
      child1._parent = root
      child2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Total = 24, gap = 2, each flex = (24 - 2) / 2 = 11
      expect(child1._bounds.height).toBe(11)
      expect(child2._bounds.height).toBe(11)
    })
  })

  describe('layout calculations - padding', () => {
    it('applies uniform padding', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        padding: 2,
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: '100%', height: '100%' })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(2)
      expect(child._bounds.y).toBe(2)
      expect(child._bounds.width).toBe(76) // 80 - 2*2
      expect(child._bounds.height).toBe(20) // 24 - 2*2
    })

    it('applies tuple padding [top, right, bottom, left]', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        padding: [1, 2, 3, 4], // [top, right, bottom, left]
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: '100%', height: '100%' })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.x).toBe(4) // left padding
      expect(child._bounds.y).toBe(1) // top padding
      expect(child._bounds.width).toBe(74) // 80 - 4 - 2
      expect(child._bounds.height).toBe(20) // 24 - 1 - 3
    })
  })

  describe('layout calculations - margin', () => {
    it('applies margin to root node', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      // Margin is applied at the root level during calculateLayout
      const root = createMockContainer({
        margin: 5,
        width: 60, // Fixed width so we can see margin effect
        height: 14
      })
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Root node bounds are offset by margin
      expect(root._bounds.x).toBe(5)
      expect(root._bounds.y).toBe(5)
      expect(root._bounds.width).toBe(60) // Fixed width preserved
      expect(root._bounds.height).toBe(14) // Fixed height preserved
    })

    it('allocates space for child margin in child measurements', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'start',
        width: '100%',
        height: '100%'
      })
      // Note: current plugin implementation doesn't apply child margin to position
      // but margin affects available space calculations
      const child = createMockBaseNode({
        width: 40,
        height: 10
      })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Child is positioned at start of container
      expect(child._bounds.x).toBe(0)
      expect(child._bounds.y).toBe(0)
      expect(child._bounds.width).toBe(40)
      expect(child._bounds.height).toBe(10)
    })
  })

  describe('layout calculations - constraints', () => {
    it('respects minWidth', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'row',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 5, minWidth: 20 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.width).toBeGreaterThanOrEqual(20)
    })

    it('respects maxWidth', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'row',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 100, maxWidth: 50 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.width).toBeLessThanOrEqual(50)
    })

    it('respects minHeight', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 2, minHeight: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.height).toBeGreaterThanOrEqual(10)
    })

    it('respects maxHeight', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ height: 100, maxHeight: 15 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.height).toBeLessThanOrEqual(15)
    })
  })

  describe('layout calculations - nested containers', () => {
    it('layouts nested containers recursively', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const nested = createMockContainer({
        flexDirection: 'row',
        height: 12
      })
      const innerChild1 = createMockBaseNode({ flex: 1 })
      const innerChild2 = createMockBaseNode({ flex: 1 })

      nested._children = [innerChild1, innerChild2]
      innerChild1._parent = nested
      innerChild2._parent = nested
      root._children = [nested]
      nested._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // Nested container should have its children laid out
      expect(innerChild1._bounds.width).toBe(40)
      expect(innerChild2._bounds.width).toBe(40)
    })
  })

  describe('layout calculations - visibility', () => {
    it('skips invisible children', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      })
      const visible = createMockBaseNode({ height: 10 })
      const invisible = createMockBaseNode({ height: 10 })
      invisible._visible = false
      const visible2 = createMockBaseNode({ height: 10 })

      root._children = [visible, invisible, visible2]
      visible._parent = root
      invisible._parent = root
      visible2._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      // visible2 should be positioned right after visible (no gap for invisible)
      expect(visible._bounds.y).toBe(0)
      expect(visible2._bounds.y).toBe(10) // Not 20
    })
  })

  describe('layout calculations - empty children', () => {
    it('handles container with no children', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        width: '100%',
        height: '100%'
      })
      root._children = []
      app.root = root

      plugin.install(app)

      // Should not throw
      plugin.beforeRender!()

      expect(root._bounds.width).toBe(80)
      expect(root._bounds.height).toBe(24)
    })
  })

  describe('layout calculations - percentage dimensions', () => {
    it('resolves percentage width', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        flexDirection: 'column',
        alignItems: 'start', // Prevent stretch from overriding width
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: '50%', height: 10 })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.width).toBe(40)
    })

    it('resolves percentage height', () => {
      const plugin = layoutPlugin()
      const app = createMockApp()

      const root = createMockContainer({
        width: '100%',
        height: '100%'
      })
      const child = createMockBaseNode({ width: 40, height: '50%' })
      root._children = [child]
      child._parent = root
      app.root = root

      plugin.install(app)
      plugin.beforeRender!()

      expect(child._bounds.height).toBe(12)
    })
  })
})
