/**
 * @oxog/tui - Button Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { button } from '../../src/widgets/button'
import { createBuffer } from '../../src/core/buffer'
import type { Buffer } from '../../src/types'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

// Helper to extract a line from buffer as string
function getBufferLine(buffer: Buffer, y: number): string {
  let line = ''
  for (let x = 0; x < buffer.width; x++) {
    const cell = buffer.get(x, y)
    if (cell && cell.char) {
      line += cell.char
    }
  }
  return line
}

describe('Button Widget', () => {
  describe('factory function', () => {
    it('should create a button node', () => {
      const btn = button()
      expect(btn.type).toBe('button')
    })

    it('should have a unique id', () => {
      const btn1 = button()
      const btn2 = button()
      expect(btn1.id).not.toBe(btn2.id)
    })

    it('should accept props', () => {
      const btn = button({
        label: 'Submit',
        variant: 'primary',
        size: 'medium',
        disabled: false
      })
      expect(btn.isDisabled).toBe(false)
    })

    it('should apply initial disabled state from props', () => {
      const btn = button({ disabled: true })
      expect(btn.isDisabled).toBe(true)
    })

    it('should apply icon from props', () => {
      const btn = button({ icon: '✓' })
      expect(btn).toBeDefined()
    })

    it('should apply iconRight from props', () => {
      const btn = button({ iconRight: '→' })
      expect(btn).toBeDefined()
    })

    it('should apply width from props', () => {
      const btn = button({ width: 20 })
      expect(btn).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set label', () => {
      const btn = button().label('Click Me')
      expect(btn).toBeDefined()
    })

    it('should set variant', () => {
      const btn = button().variant('primary')
      expect(btn).toBeDefined()
    })

    it('should set size', () => {
      const btn = button().size('large')
      expect(btn).toBeDefined()
    })

    it('should set disabled state', () => {
      const btn = button().disabled(true)
      expect(btn.isDisabled).toBe(true)
    })

    it('should set icon', () => {
      const btn = button().icon('✓')
      expect(btn).toBeDefined()
    })

    it('should set iconRight', () => {
      const btn = button().iconRight('→')
      expect(btn).toBeDefined()
    })

    it('should set width', () => {
      const btn = button().width(30)
      expect(btn).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const btn = button()
        .label('Submit')
        .variant('primary')
        .size('medium')
        .icon('✓')
        .disabled(false)

      expect(btn.isDisabled).toBe(false)
    })
  })

  describe('focus control', () => {
    it('should focus the button', () => {
      const btn = button()
      expect(btn.isFocused).toBe(false)

      btn.focus()
      expect(btn.isFocused).toBe(true)
    })

    it('should blur the button', () => {
      const btn = button()
      btn.focus()
      expect(btn.isFocused).toBe(true)

      btn.blur()
      expect(btn.isFocused).toBe(false)
    })

    it('should not focus when disabled', () => {
      const btn = button().disabled(true)
      btn.focus()
      expect(btn.isFocused).toBe(false)
    })

    it('should blur when disabled while focused', () => {
      const btn = button()
      btn.focus()
      expect(btn.isFocused).toBe(true)

      btn.disabled(true)
      expect(btn.isFocused).toBe(false)
    })

    it('should emit focus event', () => {
      const handler = vi.fn()
      const btn = button().onFocus(handler)

      btn.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('should emit blur event', () => {
      const handler = vi.fn()
      const btn = button().onBlur(handler)

      btn.focus()
      btn.blur()
      expect(handler).toHaveBeenCalled()
    })

    it('should not emit focus event when already focused', () => {
      const handler = vi.fn()
      const btn = button().onFocus(handler)

      btn.focus()
      btn.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not emit blur event when already blurred', () => {
      const handler = vi.fn()
      const btn = button().onBlur(handler)

      btn.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('press', () => {
    it('should trigger onClick handler', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)

      btn.press()
      expect(handler).toHaveBeenCalled()
    })

    it('should not trigger onClick when disabled', () => {
      const handler = vi.fn()
      const btn = button().disabled(true).onClick(handler)

      btn.press()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should set isPressed state temporarily', () => {
      vi.useFakeTimers()
      const btn = button()

      btn.press()
      expect(btn.isPressed).toBe(true)

      vi.advanceTimersByTime(150)
      expect(btn.isPressed).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('keyboard handling', () => {
    it('should trigger press on Enter when focused', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      btn.focus()

      const result = (btn as any).handleKey('enter', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should trigger press on Space when focused', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      btn.focus()

      const result = (btn as any).handleKey('space', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should not handle keys when not focused', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)

      const result = (btn as any).handleKey('enter', false)
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not handle keys when disabled', () => {
      const handler = vi.fn()
      const btn = button().disabled(true).onClick(handler)
      btn.focus()

      const result = (btn as any).handleKey('enter', false)
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should return false for unknown keys', () => {
      const btn = button()
      btn.focus()

      const result = (btn as any).handleKey('tab', false)
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('should trigger press on mouse click inside bounds', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(5, 0, 'press')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should not trigger press on mouse click outside bounds', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(15, 0, 'press')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not trigger press when disabled', () => {
      const handler = vi.fn()
      const btn = button().disabled(true).onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(5, 0, 'press')
      expect(result).toBe(true) // Still returns true for hit detection
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('render', () => {
    it('should render button', () => {
      const btn = button().label('Click')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).toContain('Click')
    })

    it('should render with icon', () => {
      const btn = button().label('Save').icon('S')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).toContain('S')
      expect(content).toContain('Save')
    })

    it('should render with iconRight', () => {
      const btn = button().label('Next').iconRight('>')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).toContain('Next')
      expect(content).toContain('>')
    })

    it('should not render when not visible', () => {
      const btn = button().label('Hidden')
      ;(btn as any)._visible = false
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).not.toContain('Hidden')
    })

    it('should not render with zero dimensions', () => {
      const btn = button().label('Zero')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).not.toContain('Zero')
    })

    it('should render outline variant with borders', () => {
      const btn = button().label('Outline').variant('outline')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 3 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const line0 = getBufferLine(buffer,0)
      expect(line0).toContain('─')
    })

    it('should render ghost variant when focused', () => {
      const btn = button().label('Ghost').variant('ghost')
      btn.focus()
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const content = getBufferLine(buffer,0)
      expect(content).toContain('[')
      expect(content).toContain(']')
    })

    it('should render all variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const

      for (const variant of variants) {
        const btn = button().label('Test').variant(variant)
        ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

        const buffer = createBuffer(20, 5)
        btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

        const content = getBufferLine(buffer,0)
        expect(content).toContain('Test')
      }
    })

    it('should render all sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const

      for (const size of sizes) {
        const btn = button().label('Test').size(size)
        ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: size === 'large' ? 3 : 1 }

        const buffer = createBuffer(20, 5)
        btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

        const content = getBufferLine(buffer,size === 'large' ? 1 : 0)
        expect(content).toContain('Test')
      }
    })

    it('should render focused state', () => {
      const btn = button().label('Focus')
      btn.focus()
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(getBufferLine(buffer,0)).toBeDefined()
    })

    it('should render disabled state', () => {
      const btn = button().label('Disabled').disabled(true)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(getBufferLine(buffer,0)).toBeDefined()
    })

    it('should render pressed state', () => {
      vi.useFakeTimers()
      const btn = button().label('Pressed')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }

      btn.press()

      const buffer = createBuffer(20, 5)
      btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(getBufferLine(buffer,0)).toBeDefined()

      vi.useRealTimers()
    })
  })
})
