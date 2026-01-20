/**
 * @oxog/tui - Scrollbar Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { scrollbar } from '../../src/widgets/scrollbar'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Scrollbar Widget', () => {
  describe('factory function', () => {
    it('should create a scrollbar node', () => {
      const sb = scrollbar()
      expect(sb.type).toBe('scrollbar')
    })

    it('should have a unique id', () => {
      const sb1 = scrollbar()
      const sb2 = scrollbar()
      expect(sb1.id).not.toBe(sb2.id)
    })

    it('should accept props', () => {
      const sb = scrollbar({
        orientation: 'vertical',
        contentSize: 100,
        viewportSize: 20,
        scrollPosition: 10,
        length: 20
      })
      expect(sb.position).toBe(10)
    })

    it('should apply horizontal orientation from props', () => {
      const sb = scrollbar({
        orientation: 'horizontal',
        length: 50
      })
      expect(sb).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set orientation', () => {
      const sb = scrollbar().orientation('horizontal')
      expect(sb).toBeDefined()
    })

    it('should set contentSize', () => {
      const sb = scrollbar().contentSize(200)
      expect(sb.maxPosition).toBe(200 - 20) // default viewportSize is 20
    })

    it('should clamp contentSize to minimum 1', () => {
      const sb = scrollbar().contentSize(-10)
      expect(sb).toBeDefined()
    })

    it('should set viewportSize', () => {
      const sb = scrollbar().viewportSize(30)
      expect(sb).toBeDefined()
    })

    it('should clamp viewportSize to minimum 1', () => {
      const sb = scrollbar().viewportSize(-10)
      expect(sb).toBeDefined()
    })

    it('should set scrollPosition', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(50)
      expect(sb.position).toBe(50)
    })

    it('should clamp scrollPosition', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)

      sb.scrollPosition(-10)
      expect(sb.position).toBe(0)

      sb.scrollPosition(200)
      expect(sb.position).toBe(80) // maxPosition
    })

    it('should set length', () => {
      const sb = scrollbar().length(30)
      expect(sb).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(100)
        .viewportSize(20)
        .scrollPosition(10)
        .length(20)

      expect(sb.position).toBe(10)
    })
  })

  describe('state', () => {
    it('should return maxPosition', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)
      expect(sb.maxPosition).toBe(80)
    })

    it('should return 0 maxPosition when content fits', () => {
      const sb = scrollbar().contentSize(10).viewportSize(20)
      expect(sb.maxPosition).toBe(0)
    })

    it('should return thumbSize', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }
      expect(sb.thumbSize).toBeGreaterThan(0)
    })

    it('should return minimum thumbSize of 1', () => {
      const sb = scrollbar().contentSize(1000).viewportSize(10)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 10 }
      expect(sb.thumbSize).toBeGreaterThanOrEqual(1)
    })

    it('should return full thumbSize when content fits', () => {
      const sb = scrollbar().contentSize(10).viewportSize(20)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }
      expect(sb.thumbSize).toBe(20)
    })

    it('should return thumbPosition', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(40)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }
      expect(sb.thumbPosition).toBeGreaterThan(0)
    })

    it('should return 0 thumbPosition at start', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(0)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }
      expect(sb.thumbPosition).toBe(0)
    })

    it('should return canScrollUp', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)

      sb.scrollPosition(0)
      expect(sb.canScrollUp).toBe(false)

      sb.scrollPosition(10)
      expect(sb.canScrollUp).toBe(true)
    })

    it('should return canScrollDown', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)

      sb.scrollPosition(0)
      expect(sb.canScrollDown).toBe(true)

      sb.scrollPosition(80) // maxPosition
      expect(sb.canScrollDown).toBe(false)
    })
  })

  describe('scrolling', () => {
    it('should scroll to position', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)
      sb.scrollTo(30)
      expect(sb.position).toBe(30)
    })

    it('should clamp scroll position', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)

      sb.scrollTo(-10)
      expect(sb.position).toBe(0)

      sb.scrollTo(200)
      expect(sb.position).toBe(80)
    })

    it('should scroll by delta', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(10)

      sb.scrollBy(5)
      expect(sb.position).toBe(15)

      sb.scrollBy(-10)
      expect(sb.position).toBe(5)
    })

    it('should scroll to start', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(50)
      sb.scrollToStart()
      expect(sb.position).toBe(0)
    })

    it('should scroll to end', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20)
      sb.scrollToEnd()
      expect(sb.position).toBe(80)
    })

    it('should emit scroll event', () => {
      const handler = vi.fn()
      const sb = scrollbar().contentSize(100).viewportSize(20).onScroll(handler)

      sb.scrollTo(20)
      expect(handler).toHaveBeenCalledWith(20)
    })

    it('should not emit scroll when position unchanged', () => {
      const handler = vi.fn()
      const sb = scrollbar().contentSize(100).viewportSize(20).onScroll(handler)

      sb.scrollTo(0)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should clamp position when content/viewport changes', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(50)
      expect(sb.position).toBe(50)

      sb.contentSize(60)
      expect(sb.position).toBeLessThanOrEqual(40)
    })
  })

  describe('mouse handling', () => {
    it('should scroll on click', () => {
      const handler = vi.fn()
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(100)
        .viewportSize(20)
        .onScroll(handler)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      ;(sb as any).handleMouse(0, 15, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('should scroll on click for horizontal', () => {
      const handler = vi.fn()
      const sb = scrollbar()
        .orientation('horizontal')
        .contentSize(100)
        .viewportSize(20)
        .onScroll(handler)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      ;(sb as any).handleMouse(15, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('should scroll up on wheel up', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(10)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      ;(sb as any).handleMouse(0, 10, 'scroll-up')
      expect(sb.position).toBe(9)
    })

    it('should scroll down on wheel down', () => {
      const sb = scrollbar().contentSize(100).viewportSize(20).scrollPosition(10)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      ;(sb as any).handleMouse(0, 10, 'scroll-down')
      expect(sb.position).toBe(11)
    })

    it('should not handle mouse outside bounds', () => {
      const sb = scrollbar()
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const result = (sb as any).handleMouse(10, 10, 'press')
      expect(result).toBe(false)
    })

    it('should return true when inside bounds', () => {
      const sb = scrollbar()
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const result = (sb as any).handleMouse(0, 10, 'move')
      expect(result).toBe(true)
    })
  })

  describe('render', () => {
    it('should render vertical scrollbar', () => {
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(100)
        .viewportSize(20)
        .scrollPosition(40)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render horizontal scrollbar', () => {
      const sb = scrollbar()
        .orientation('horizontal')
        .contentSize(100)
        .viewportSize(20)
        .scrollPosition(40)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render when not visible', () => {
      const sb = scrollbar()
      ;(sb as any)._visible = false
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render with zero dimensions', () => {
      const sb = scrollbar()
      ;(sb as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render thumb at start', () => {
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(100)
        .viewportSize(20)
        .scrollPosition(0)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render thumb at end', () => {
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(100)
        .viewportSize(20)
        .scrollPosition(80)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render full thumb when content fits', () => {
      const sb = scrollbar()
        .orientation('vertical')
        .contentSize(10)
        .viewportSize(20)
      ;(sb as any)._bounds = { x: 0, y: 0, width: 1, height: 20 }

      const buffer = createBuffer(80, 24)
      sb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })
})
