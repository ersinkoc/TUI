/**
 * @oxog/tui - Progress Widget Tests
 */

import { describe, it, expect } from 'vitest'
import { progress } from '../../src/widgets/progress'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Progress Widget', () => {
  describe('factory function', () => {
    it('should create a progress node', () => {
      const p = progress()
      expect(p.type).toBe('progress')
    })

    it('should have a unique id', () => {
      const p1 = progress()
      const p2 = progress()
      expect(p1.id).not.toBe(p2.id)
    })

    it('should accept props', () => {
      const p = progress({
        value: 50,
        showPercent: true
      })
      expect(p.percent).toBe(50)
    })

    it('should clamp initial value to 0-100', () => {
      const p1 = progress({ value: -10 })
      const p2 = progress({ value: 150 })
      expect(p1.percent).toBe(0)
      expect(p2.percent).toBe(100)
    })

    it('should accept showValue prop', () => {
      const p = progress({ showValue: true })
      expect((p as any)._showValue).toBe(true)
    })

    it('should accept width prop', () => {
      const p = progress({ width: 30 })
      expect((p as any)._layout.width).toBe(30)
    })

    it('should accept filled prop', () => {
      const p = progress({ filled: '=' })
      expect((p as any)._filled).toBe('=')
    })

    it('should accept empty prop', () => {
      const p = progress({ empty: '-' })
      expect((p as any)._empty).toBe('-')
    })

    it('should accept filledColor prop', () => {
      const p = progress({ filledColor: '#00ff00' })
      expect((p as any)._filledColor).toBe('#00ff00')
    })

    it('should accept emptyColor prop', () => {
      const p = progress({ emptyColor: '#444444' })
      expect((p as any)._emptyColor).toBe('#444444')
    })

    it('should accept all props together', () => {
      const p = progress({
        value: 75,
        showPercent: false,
        showValue: true,
        width: 40,
        filled: '#',
        empty: '.',
        filledColor: '#00ff00',
        emptyColor: '#333333'
      })
      expect(p.percent).toBe(75)
      expect((p as any)._showPercent).toBe(false)
      expect((p as any)._showValue).toBe(true)
      expect((p as any)._layout.width).toBe(40)
      expect((p as any)._filled).toBe('#')
      expect((p as any)._empty).toBe('.')
      expect((p as any)._filledColor).toBe('#00ff00')
      expect((p as any)._emptyColor).toBe('#333333')
    })
  })

  describe('chainable methods', () => {
    it('should set value', () => {
      const p = progress().value(75)
      expect(p.percent).toBe(75)
    })

    it('should clamp value to 0-100', () => {
      const p = progress()

      p.value(-10)
      expect(p.percent).toBe(0)

      p.value(150)
      expect(p.percent).toBe(100)
    })

    it('should set showPercent', () => {
      const p = progress().showPercent(true)
      expect(p).toBeDefined()
    })

    it('should set showValue', () => {
      const p = progress().showValue(true)
      expect(p).toBeDefined()
    })

    it('should set width', () => {
      const p = progress().width(20)
      expect(p._layout.width).toBe(20)
    })

    it('should set filled character', () => {
      const p = progress().filled('=')
      expect(p).toBeDefined()
    })

    it('should set empty character', () => {
      const p = progress().empty('-')
      expect(p).toBeDefined()
    })

    it('should set filledColor', () => {
      const p = progress().filledColor('#00ff00')
      expect(p).toBeDefined()
    })

    it('should set emptyColor', () => {
      const p = progress().emptyColor('#444444')
      expect(p).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const p = progress().value(50).width(20).filled('=').empty('-').showPercent(true)

      expect(p.percent).toBe(50)
      expect(p._layout.width).toBe(20)
    })
  })

  describe('increment/decrement', () => {
    it('should increment value by 1 by default', () => {
      const p = progress().value(50)
      p.increment()
      expect(p.percent).toBe(51)
    })

    it('should increment value by specified amount', () => {
      const p = progress().value(50)
      p.increment(10)
      expect(p.percent).toBe(60)
    })

    it('should decrement value by 1 by default', () => {
      const p = progress().value(50)
      p.decrement()
      expect(p.percent).toBe(49)
    })

    it('should decrement value by specified amount', () => {
      const p = progress().value(50)
      p.decrement(10)
      expect(p.percent).toBe(40)
    })

    it('should clamp increment to 100', () => {
      const p = progress().value(95)
      p.increment(10)
      expect(p.percent).toBe(100)
    })

    it('should clamp decrement to 0', () => {
      const p = progress().value(5)
      p.decrement(10)
      expect(p.percent).toBe(0)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const p = progress()
      expect(p.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const p = progress().visible(false)
      expect(p.isVisible).toBe(false)
    })
  })

  describe('rendering', () => {
    it('should render progress bar', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).showPercent(false)

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render some filled and some empty characters
      expect(buffer.get(0, 0)?.char).toBeDefined()
    })

    it('should render with custom characters', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(false)

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First half should be '=', second half should be '-'
      expect(buffer.get(0, 0)?.char).toBe('=')
      expect(buffer.get(9, 0)?.char).toBe('-')
    })

    it('should render 0% correctly', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(0).filled('=').empty('-').showPercent(false)

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // All should be empty character
      expect(buffer.get(0, 0)?.char).toBe('-')
    })

    it('should render 100% correctly', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(100).filled('=').empty('-').showPercent(false)

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // All should be filled character
      expect(buffer.get(0, 0)?.char).toBe('=')
      expect(buffer.get(9, 0)?.char).toBe('=')
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).visible(false)

      const originalChar = buffer.get(0, 0)?.char
      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(originalChar)
    })

    it('should not render with zero dimensions', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50)

      p._bounds = { x: 0, y: 0, width: 0, height: 0 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should not render with negative dimensions', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50)

      p._bounds = { x: 0, y: 0, width: -5, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should render with showPercent=true', () => {
      const buffer = createBuffer(25, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(true)

      // Bar width = 15 - 5 (for " 100%") = 10
      p._bounds = { x: 0, y: 0, width: 15, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // At 50%, 5 filled and 5 empty, then suffix " 50%"
      expect(buffer.get(0, 0)?.char).toBe('=')
      expect(buffer.get(4, 0)?.char).toBe('=')
      expect(buffer.get(5, 0)?.char).toBe('-')
      // Check the percentage suffix starts at position 10
      expect(buffer.get(10, 0)?.char).toBe(' ')
      expect(buffer.get(11, 0)?.char).toBe(' ')
      expect(buffer.get(12, 0)?.char).toBe('5')
      expect(buffer.get(13, 0)?.char).toBe('0')
      expect(buffer.get(14, 0)?.char).toBe('%')
    })

    it('should render with showValue=true', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(75).filled('=').empty('-').showPercent(false).showValue(true)

      // Bar width = 14 - 4 (for " 100") = 10
      p._bounds = { x: 0, y: 0, width: 14, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check the value suffix
      expect(buffer.get(10, 0)?.char).toBe(' ')
      expect(buffer.get(11, 0)?.char).toBe(' ')
      expect(buffer.get(12, 0)?.char).toBe('7')
      expect(buffer.get(13, 0)?.char).toBe('5')
    })

    it('should render 100% percentage text correctly', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(100).filled('=').empty('-').showPercent(true)

      p._bounds = { x: 0, y: 0, width: 15, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check " 100%" at end - the text is ` ${value}%`.padStart(5) = " 100%"
      expect(buffer.get(10, 0)?.char).toBe(' ')
      expect(buffer.get(11, 0)?.char).toBe('1')
      expect(buffer.get(12, 0)?.char).toBe('0')
      expect(buffer.get(13, 0)?.char).toBe('0')
      expect(buffer.get(14, 0)?.char).toBe('%')
    })

    it('should render at specified position', () => {
      const buffer = createBuffer(30, 10)
      const p = progress().value(50).filled('=').empty('-').showPercent(false)

      p._bounds = { x: 5, y: 3, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(5, 3)?.char).toBe('=')
      expect(buffer.get(14, 3)?.char).toBe('-')
    })

    it('should render with filledColor', () => {
      const buffer = createBuffer(20, 1)
      const p = progress()
        .value(50)
        .filled('=')
        .empty('-')
        .showPercent(false)
        .filledColor('#00ff00')

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Filled portion should have custom color
      const filledCell = buffer.get(0, 0)
      expect(filledCell?.char).toBe('=')
      expect(filledCell?.fg).toBe(0x00ff00ff)
    })

    it('should render with emptyColor', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(false).emptyColor('#444444')

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Empty portion should have custom color
      const emptyCell = buffer.get(9, 0)
      expect(emptyCell?.char).toBe('-')
      expect(emptyCell?.fg).toBe(0x444444ff)
    })

    it('should use parent fg when no custom color set', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(false)

      const parentFg = 0xaabbccff

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: parentFg, bg: DEFAULT_BG, attrs: 0 })

      // Both filled and empty should use parent fg
      expect(buffer.get(0, 0)?.fg).toBe(parentFg)
      expect(buffer.get(9, 0)?.fg).toBe(parentFg)
    })

    it('should use parent bg', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(false)

      const parentBg = 0x112233ff

      p._bounds = { x: 0, y: 0, width: 10, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: parentBg, attrs: 0 })

      expect(buffer.get(0, 0)?.bg).toBe(parentBg)
      expect(buffer.get(9, 0)?.bg).toBe(parentBg)
    })

    it('should handle small bar width with showPercent', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(true)

      // width=6, minus 5 for suffix = 1 bar width (clamped to Math.max(1, barWidth))
      p._bounds = { x: 0, y: 0, width: 6, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should still render without error
      expect(buffer.get(0, 0)?.char).toBeDefined()
    })

    it('should handle very narrow width', () => {
      const buffer = createBuffer(20, 1)
      const p = progress().value(50).filled('=').empty('-').showPercent(true)

      // width=3 means barWidth would be negative, clamped to 1
      p._bounds = { x: 0, y: 0, width: 3, height: 1 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render a single character bar at minimum
      expect(buffer.get(0, 0)?.char).toBeDefined()
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when value changes', () => {
      const p = progress()
      p._dirty = false

      p.value(50)
      expect(p._dirty).toBe(true)
    })

    it('should not mark dirty when value is same', () => {
      const p = progress().value(50)
      p._dirty = false

      p.value(50)
      expect(p._dirty).toBe(false)
    })

    it('should mark dirty when showPercent changes', () => {
      const p = progress()
      p._dirty = false

      p.showPercent(true)
      expect(p._dirty).toBe(true)
    })

    it('should mark dirty when filled changes', () => {
      const p = progress()
      p._dirty = false

      p.filled('=')
      expect(p._dirty).toBe(true)
    })

    it('should mark dirty when empty changes', () => {
      const p = progress()
      p._dirty = false

      p.empty('-')
      expect(p._dirty).toBe(true)
    })

    it('should mark dirty on increment', () => {
      const p = progress()
      p._dirty = false

      p.increment()
      expect(p._dirty).toBe(true)
    })

    it('should mark dirty on decrement', () => {
      const p = progress().value(50)
      p._dirty = false

      p.decrement()
      expect(p._dirty).toBe(true)
    })

    it('should mark dirty when width changes', () => {
      const p = progress()
      ;(p as any)._dirty = false

      p.width(30)
      expect((p as any)._dirty).toBe(true)
    })

    it('should mark dirty when filledColor changes', () => {
      const p = progress()
      ;(p as any)._dirty = false

      p.filledColor('#00ff00')
      expect((p as any)._dirty).toBe(true)
    })

    it('should mark dirty when emptyColor changes', () => {
      const p = progress()
      ;(p as any)._dirty = false

      p.emptyColor('#444444')
      expect((p as any)._dirty).toBe(true)
    })

    it('should mark dirty when showValue changes', () => {
      const p = progress()
      ;(p as any)._dirty = false

      p.showValue(true)
      expect((p as any)._dirty).toBe(true)
    })
  })
})
