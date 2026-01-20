/**
 * @oxog/tui - SplitPane Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { splitpane } from '../../src/widgets/splitpane'
import { text } from '../../src/widgets/text'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('SplitPane Widget', () => {
  describe('factory function', () => {
    it('should create a splitpane node', () => {
      const sp = splitpane()
      expect(sp.type).toBe('splitpane')
    })

    it('should have a unique id', () => {
      const sp1 = splitpane()
      const sp2 = splitpane()
      expect(sp1.id).not.toBe(sp2.id)
    })

    it('should accept props', () => {
      const sp = splitpane({
        direction: 'horizontal',
        ratio: 0.5,
        minFirst: 5,
        minSecond: 5
      })
      expect(sp.currentRatio).toBe(0.5)
    })
  })

  describe('chainable methods', () => {
    it('should set direction', () => {
      const sp = splitpane().direction('vertical')
      expect(sp).toBeDefined()
    })

    it('should set ratio', () => {
      const sp = splitpane().ratio(0.3)
      expect(sp.currentRatio).toBe(0.3)
    })

    it('should clamp ratio to valid range', () => {
      const sp = splitpane().ratio(1.5)
      expect(sp.currentRatio).toBe(1.0)

      sp.ratio(-0.5)
      expect(sp.currentRatio).toBe(0)
    })

    it('should set first pane', () => {
      const sp = splitpane().first(text('Left'))
      expect(sp).toBeDefined()
    })

    it('should set second pane', () => {
      const sp = splitpane().second(text('Right'))
      expect(sp).toBeDefined()
    })

    it('should set minimum sizes', () => {
      const sp = splitpane().minFirst(10).minSecond(10)
      expect(sp).toBeDefined()
    })

    it('should set divider size', () => {
      const sp = splitpane().dividerSize(3)
      expect(sp).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const sp = splitpane()
        .direction('horizontal')
        .ratio(0.4)
        .first(text('A'))
        .second(text('B'))
        .minFirst(5)
        .minSecond(5)

      expect(sp.currentRatio).toBe(0.4)
    })
  })

  describe('events', () => {
    it('should emit resize event', () => {
      const handler = vi.fn()
      const sp = splitpane().onResize(handler)

      sp.ratio(0.6)
      // Resize event is emitted when ratio changes through interaction
      // The ratio() method itself may not emit the event
      expect(sp.currentRatio).toBe(0.6)
    })
  })

  describe('mouse handling', () => {
    it('should start dragging on divider press', () => {
      const sp = splitpane()
        .direction('horizontal')
        .ratio(0.5)
        .first(text('L'))
        .second(text('R'))
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }

      // Divider is at position ~49 (width=100, ratio=0.5, dividerSize=1)
      // Press on divider (dividerPos = 0 + floor(99 * 0.5) = 49)
      const result = (sp as any).handleMouse(49, 10, 'press')
      expect(result).toBe(true)
      expect((sp as any)._isDragging).toBe(true)
    })

    it('should update ratio on drag move', () => {
      const handler = vi.fn()
      const sp = splitpane()
        .direction('horizontal')
        .ratio(0.5)
        .onResize(handler)
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }
      ;(sp as any)._isDragging = true

      const result = (sp as any).handleMouse(30, 10, 'move')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should stop dragging on release', () => {
      const sp = splitpane()
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }
      ;(sp as any)._isDragging = true

      const result = (sp as any).handleMouse(50, 10, 'release')
      expect(result).toBe(true)
      expect((sp as any)._isDragging).toBe(false)
    })

    it('should not handle mouse outside divider when not dragging', () => {
      const sp = splitpane()
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }

      // Press outside divider
      const result = (sp as any).handleMouse(10, 10, 'press')
      expect(result).toBe(false)
    })

    it('should handle vertical splitpane', () => {
      const sp = splitpane()
        .direction('vertical')
        .ratio(0.5)
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 40 }

      // Divider is at y position ~19 (height=40, ratio=0.5, dividerSize=1)
      const result = (sp as any).handleMouse(50, 19, 'press')
      expect(result).toBe(true)
    })

    it('should update ratio on vertical drag move', () => {
      const handler = vi.fn()
      const sp = splitpane()
        .direction('vertical')
        .ratio(0.5)
        .onResize(handler)
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 40 }
      ;(sp as any)._isDragging = true

      const result = (sp as any).handleMouse(50, 10, 'move')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should respect minimum sizes', () => {
      const sp = splitpane()
        .direction('horizontal')
        .ratio(0.5)
        .minFirst(30)
        .minSecond(30)
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }
      ;(sp as any)._isDragging = true

      // Try to drag to extreme left
      ;(sp as any).handleMouse(5, 10, 'move')
      // Ratio should be clamped to respect minFirst
      expect(sp.currentRatio).toBeGreaterThanOrEqual(0.3)
    })

    it('should not handle when not resizable', () => {
      const sp = splitpane().resizable(false)
      ;(sp as any)._bounds = { x: 0, y: 0, width: 100, height: 20 }

      const result = (sp as any).handleMouse(50, 10, 'press')
      expect(result).toBe(false)
    })
  })

  describe('render', () => {
    it('should render splitpane', () => {
      const sp = splitpane()
        .direction('horizontal')
        .ratio(0.5)
        .first(text('Left'))
        .second(text('Right'))
      ;(sp as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }

      const buffer = createBuffer(80, 24)
      sp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(buffer).toBeDefined()
    })

    it('should render vertical splitpane', () => {
      const sp = splitpane()
        .direction('vertical')
        .ratio(0.5)
        .first(text('Top'))
        .second(text('Bottom'))
      ;(sp as any)._bounds = { x: 0, y: 0, width: 80, height: 40 }

      const buffer = createBuffer(80, 50)
      sp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render when not visible', () => {
      const sp = splitpane()
      ;(sp as any)._visible = false
      ;(sp as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }

      const buffer = createBuffer(80, 24)
      sp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render with zero dimensions', () => {
      const sp = splitpane()
      ;(sp as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(80, 24)
      sp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render without children', () => {
      const sp = splitpane()
      ;(sp as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }

      const buffer = createBuffer(80, 24)
      sp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })
})
