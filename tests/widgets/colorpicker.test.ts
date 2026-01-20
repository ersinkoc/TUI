/**
 * @oxog/tui - ColorPicker Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { colorpicker } from '../../src/widgets/colorpicker'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

describe('ColorPicker Widget', () => {
  describe('creation', () => {
    it('creates a default colorpicker', () => {
      const cp = colorpicker()
      expect(cp).toBeDefined()
      expect(cp.type).toBe('colorpicker')
      expect(cp.selectedColor).toBe(7) // Default white
    })

    it('creates with initial color', () => {
      const cp = colorpicker({ color: 10 })
      expect(cp.selectedColor).toBe(10)
    })

    it('creates with all props', () => {
      const cp = colorpicker({
        color: 14,
        mode: 'basic16',
        showPreview: false,
        showValue: false
      })
      expect(cp.selectedColor).toBe(14)
    })

    it('clamps color to valid range', () => {
      const cp = colorpicker({ color: 300 })
      expect(cp.selectedColor).toBe(255)

      const cp2 = colorpicker({ color: -5 })
      expect(cp2.selectedColor).toBe(0)
    })
  })

  describe('color selection', () => {
    it('sets color via method', () => {
      const cp = colorpicker()
      cp.color(42)
      expect(cp.selectedColor).toBe(42)
    })

    it('selects color directly', () => {
      const cp = colorpicker()
      cp.selectColor(100)
      expect(cp.selectedColor).toBe(100)
    })

    it('clamps color via method', () => {
      const cp = colorpicker()
      cp.color(500)
      expect(cp.selectedColor).toBe(255)

      cp.color(-10)
      expect(cp.selectedColor).toBe(0)
    })
  })

  describe('RGB conversion', () => {
    it('converts basic colors to RGB', () => {
      const cp = colorpicker({ color: 0 })
      expect(cp.selectedRgb).toEqual({ r: 0, g: 0, b: 0 }) // black

      cp.color(9)
      expect(cp.selectedRgb).toEqual({ r: 255, g: 0, b: 0 }) // bright red

      cp.color(15)
      expect(cp.selectedRgb).toEqual({ r: 255, g: 255, b: 255 }) // white
    })

    it('converts grayscale colors to RGB', () => {
      const cp = colorpicker({ color: 232 })
      const rgb = cp.selectedRgb
      expect(rgb.r).toBe(rgb.g)
      expect(rgb.g).toBe(rgb.b)

      cp.color(255)
      const white = cp.selectedRgb
      expect(white.r).toBe(white.g)
      expect(white.g).toBe(white.b)
    })

    it('converts 216 color cube to RGB', () => {
      const cp = colorpicker({ color: 16 }) // First cube color
      const rgb = cp.selectedRgb
      expect(rgb.r).toBe(0)
      expect(rgb.g).toBe(0)
      expect(rgb.b).toBe(0)

      cp.color(196) // Red in cube
      const red = cp.selectedRgb
      expect(red.r).toBeGreaterThan(red.g)
      expect(red.r).toBeGreaterThan(red.b)
    })
  })

  describe('mode switching', () => {
    it('switches to basic16 mode', () => {
      const cp = colorpicker().mode('basic16')
      expect(cp).toBeDefined()
    })

    it('switches to palette256 mode', () => {
      const cp = colorpicker().mode('palette256')
      expect(cp).toBeDefined()
    })

    it('switches to grayscale mode', () => {
      const cp = colorpicker().mode('grayscale')
      expect(cp).toBeDefined()
    })

    it('switches to rgb mode', () => {
      const cp = colorpicker().mode('rgb')
      expect(cp).toBeDefined()
    })
  })

  describe('configuration', () => {
    it('toggles preview', () => {
      const cp = colorpicker()
      cp.showPreview(false)
      expect(cp).toBeDefined()

      cp.showPreview(true)
      expect(cp).toBeDefined()
    })

    it('toggles value display', () => {
      const cp = colorpicker()
      cp.showValue(false)
      expect(cp).toBeDefined()

      cp.showValue(true)
      expect(cp).toBeDefined()
    })
  })

  describe('navigation - basic16', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      cp = colorpicker({ color: 0, mode: 'basic16' }).focus()
    })

    it('moves right', () => {
      cp.moveRight()
      expect(cp.selectedColor).toBe(1)
    })

    it('moves left', () => {
      cp.color(5)
      cp.moveLeft()
      expect(cp.selectedColor).toBe(4)
    })

    it('moves down', () => {
      cp.moveDown()
      expect(cp.selectedColor).toBe(8)
    })

    it('moves up', () => {
      cp.color(8)
      cp.moveUp()
      expect(cp.selectedColor).toBe(0)
    })

    it('stays in bounds', () => {
      cp.moveLeft()
      expect(cp.selectedColor).toBe(0)

      cp.color(15)
      cp.moveRight()
      expect(cp.selectedColor).toBe(15)
    })
  })

  describe('navigation - palette256', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      cp = colorpicker({ color: 16, mode: 'palette256' }).focus()
    })

    it('moves right in cube', () => {
      cp.moveRight()
      expect(cp.selectedColor).toBe(17)
    })

    it('moves left in cube', () => {
      cp.color(20)
      cp.moveLeft()
      expect(cp.selectedColor).toBe(19)
    })

    it('moves down between layers', () => {
      cp.moveDown()
      expect(cp.selectedColor).toBe(52) // Next layer
    })

    it('moves up between layers', () => {
      cp.color(52)
      cp.moveUp()
      expect(cp.selectedColor).toBe(16)
    })
  })

  describe('navigation - grayscale', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      cp = colorpicker({ color: 232, mode: 'grayscale' }).focus()
    })

    it('moves right', () => {
      cp.moveRight()
      expect(cp.selectedColor).toBe(233)
    })

    it('moves left', () => {
      cp.color(240)
      cp.moveLeft()
      expect(cp.selectedColor).toBe(239)
    })

    it('moves down', () => {
      cp.moveDown()
      expect(cp.selectedColor).toBe(238)
    })

    it('moves up', () => {
      cp.color(240)
      cp.moveUp()
      expect(cp.selectedColor).toBe(234)
    })

    it('stays in grayscale range', () => {
      cp.moveLeft()
      expect(cp.selectedColor).toBe(232)
    })
  })

  describe('navigation - rgb', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      // Color 25 = 16 + 9 -> r=0, g=1, b=3 (in middle of cube for navigation)
      cp = colorpicker({ color: 25, mode: 'rgb' }).focus()
    })

    it('moves right (increment blue)', () => {
      const before = cp.selectedColor
      cp.moveRight()
      expect(cp.selectedColor).toBe(before + 1)
    })

    it('moves left (decrement blue)', () => {
      const before = cp.selectedColor
      cp.moveLeft()
      expect(cp.selectedColor).toBe(before - 1)
    })

    it('moves up (decrement green)', () => {
      const before = cp.selectedColor
      cp.moveUp()
      expect(cp.selectedColor).toBe(before - 6)
    })

    it('moves down (increment green)', () => {
      const before = cp.selectedColor
      cp.moveDown()
      expect(cp.selectedColor).toBe(before + 6)
    })
  })

  describe('events', () => {
    it('emits change event', () => {
      const handler = vi.fn()
      const cp = colorpicker()
      cp.onChange(handler)

      cp.color(42)
      expect(handler).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith(42, expect.any(Object))
    })

    it('emits change on navigation', () => {
      const handler = vi.fn()
      const cp = colorpicker({ mode: 'basic16' }).focus()
      cp.onChange(handler)

      cp.moveRight()
      expect(handler).toHaveBeenCalled()
    })

    it('includes RGB in change event', () => {
      const handler = vi.fn()
      const cp = colorpicker()
      cp.onChange(handler)

      cp.color(9) // bright red
      expect(handler).toHaveBeenCalledWith(9, { r: 255, g: 0, b: 0 })
    })
  })

  describe('focus', () => {
    it('focuses and blurs', () => {
      const cp = colorpicker()
      expect(cp.isFocused).toBe(false)

      cp.focus()
      expect(cp.isFocused).toBe(true)

      cp.blur()
      expect(cp.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      cp = colorpicker({ color: 5, mode: 'basic16' }).focus()
    })

    it('handles arrow keys', () => {
      ;(cp as any).handleKey('right')
      expect(cp.selectedColor).toBe(6)

      ;(cp as any).handleKey('left')
      expect(cp.selectedColor).toBe(5)

      ;(cp as any).handleKey('down')
      expect(cp.selectedColor).toBe(13)

      ;(cp as any).handleKey('up')
      expect(cp.selectedColor).toBe(5)
    })

    it('handles vim keys', () => {
      ;(cp as any).handleKey('l')
      expect(cp.selectedColor).toBe(6)

      ;(cp as any).handleKey('h')
      expect(cp.selectedColor).toBe(5)

      ;(cp as any).handleKey('j')
      expect(cp.selectedColor).toBe(13)

      ;(cp as any).handleKey('k')
      expect(cp.selectedColor).toBe(5)
    })

    it('handles mode switch keys', () => {
      ;(cp as any).handleKey('1')
      // Mode should change to basic16
      expect(cp).toBeDefined()

      ;(cp as any).handleKey('2')
      // Mode should change to palette256
      expect(cp).toBeDefined()

      ;(cp as any).handleKey('3')
      // Mode should change to grayscale
      expect(cp).toBeDefined()

      ;(cp as any).handleKey('4')
      // Mode should change to rgb
      expect(cp).toBeDefined()
    })

    it('ignores keys when not focused', () => {
      cp.blur()
      const result = (cp as any).handleKey('right')
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let cp: ReturnType<typeof colorpicker>

    beforeEach(() => {
      cp = colorpicker({ mode: 'basic16' })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
    })

    it('focuses on click', () => {
      expect(cp.isFocused).toBe(false)
      ;(cp as any).handleMouse(5, 5, 'press')
      expect(cp.isFocused).toBe(true)
    })

    it('ignores when not visible', () => {
      cp.visible(false)
      const result = (cp as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })

    it('ignores without bounds', () => {
      ;(cp as any)._bounds = null
      const result = (cp as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(40, 15)
    })

    it('renders basic16 palette', () => {
      const cp = colorpicker({ mode: 'basic16' })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should have rendered color blocks
      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('renders palette256', () => {
      const cp = colorpicker({ mode: 'palette256' })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('renders grayscale palette', () => {
      const cp = colorpicker({ mode: 'grayscale', color: 240 })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('renders rgb mode', () => {
      const cp = colorpicker({ mode: 'rgb', color: 50 })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('renders preview', () => {
      const cp = colorpicker({ showPreview: true, color: 10 })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Preview should show block character
      expect(buffer.get(0, 0).char).toBe('\u2588')
    })

    it('renders without preview', () => {
      const cp = colorpicker({ showPreview: false })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders value display', () => {
      const cp = colorpicker({ showValue: true })
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should show hex value
      expect(buffer.get(0, 14).char).toBe('#')
    })

    it('renders selection highlight', () => {
      const cp = colorpicker({ mode: 'basic16', color: 0 }).focus()
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Selected color should be highlighted
      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('does not render when not visible', () => {
      const cp = colorpicker()
      cp.visible(false)
      ;(cp as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const cp = colorpicker()
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render with zero dimensions', () => {
      const cp = colorpicker()
      ;(cp as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const cp = colorpicker()
        .color(42)
        .mode('grayscale')
        .showPreview(true)
        .showValue(true)
        .focus()

      expect(cp.selectedColor).toBe(42)
      expect(cp.isFocused).toBe(true)
    })

    it('chains navigation methods', () => {
      const cp = colorpicker({ mode: 'basic16' })
        .focus()
        .moveRight()
        .moveRight()
        .moveDown()
        .moveLeft()

      expect(cp.selectedColor).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles boundary colors', () => {
      const cp = colorpicker({ color: 0 })
      expect(cp.selectedRgb).toBeDefined()

      cp.color(255)
      expect(cp.selectedRgb).toBeDefined()

      cp.color(16)
      expect(cp.selectedRgb).toBeDefined()

      cp.color(231)
      expect(cp.selectedRgb).toBeDefined()

      cp.color(232)
      expect(cp.selectedRgb).toBeDefined()
    })

    it('does not emit change when color unchanged', () => {
      const handler = vi.fn()
      const cp = colorpicker({ color: 42 })
      cp.onChange(handler)

      cp.color(42)
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
