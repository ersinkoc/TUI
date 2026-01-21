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

  describe('handler cleanup', () => {
    it('should remove onClick handler with offClick', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const btn = button().onClick(handler)

      btn.press()
      expect(callCount).toBe(1)

      btn.offClick(handler)
      btn.press()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onClick handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const btn = button().onClick(handler1).onClick(handler2)

      btn.press()
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      btn.offClick(handler1)
      btn.press()
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should be chainable after offClick', () => {
      const btn = button()
      const handler = vi.fn()
      const result = btn.onClick(handler).offClick(handler)
      expect(result).toBe(btn)
    })

    it('should handle offClick with non-existent handler gracefully', () => {
      const btn = button()
      const handler = vi.fn()
      expect(() => btn.offClick(handler)).not.toThrow()
    })

    it('should remove onFocus handler with offFocus', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const btn = button().onFocus(handler)

      btn.focus()
      expect(callCount).toBe(1)

      btn.offFocus(handler)
      btn.blur()
      btn.focus()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const btn = button().onBlur(handler)

      btn.focus()
      btn.blur()
      expect(callCount).toBe(1)

      btn.offBlur(handler)
      btn.focus()
      btn.blur()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const clickHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const btn = button()
        .onClick(clickHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      btn.clearHandlers()

      btn.press()
      btn.focus()
      btn.blur()

      expect(clickHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should be chainable after clearHandlers', () => {
      const btn = button()
      const result = btn.onClick(vi.fn()).clearHandlers()
      expect(result).toBe(btn)
    })

    it('should allow adding handlers after clearHandlers', () => {
      const handler = vi.fn()
      const btn = button()
        .onClick(vi.fn())
        .clearHandlers()
        .onClick(handler)

      btn.press()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const clickHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const btn = button()
        .onClick(clickHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      btn.dispose()

      btn.press()
      btn.focus()
      btn.blur()

      expect(clickHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should mark as disposed on dispose', () => {
      const btn = button()
      btn.dispose()
      expect((btn as any)._disposed).toBe(true)
    })

    it('should not throw when disposing already disposed button', () => {
      const btn = button()
      btn.dispose()
      expect(() => btn.dispose()).not.toThrow()
    })

    it('should not reset pressed state after timeout if disposed', () => {
      vi.useFakeTimers()
      const btn = button()

      btn.press()
      expect(btn.isPressed).toBe(true)

      btn.dispose()
      vi.advanceTimersByTime(150)

      // Should remain true because disposed button doesn't update
      expect(btn.isPressed).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('mouse handling edge cases', () => {
    it('should return true for hover inside bounds', () => {
      const btn = button()
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(5, 0, 'hover')
      expect(result).toBe(true)
    })

    it('should return true for move inside bounds', () => {
      const btn = button()
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(5, 0, 'move')
      expect(result).toBe(true)
    })

    it('should return false for hover outside bounds', () => {
      const btn = button()
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(15, 0, 'hover')
      expect(result).toBe(false)
    })

    it('should handle click on left edge', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 10, y: 5, width: 10, height: 1 }

      const result = (btn as any).handleMouse(10, 5, 'press')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should handle click on right edge (exclusive)', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const result = (btn as any).handleMouse(10, 0, 'press')
      expect(result).toBe(false) // Outside bounds (exclusive)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle click on top edge', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 5, width: 10, height: 3 }

      const result = (btn as any).handleMouse(5, 5, 'press')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should handle click on bottom edge (exclusive)', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 3 }

      const result = (btn as any).handleMouse(5, 3, 'press')
      expect(result).toBe(false) // Outside bounds (exclusive)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty label', () => {
      const btn = button().label('')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const buffer = createBuffer(20, 5)
      expect(() => btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should handle very long label', () => {
      const btn = button().label('This is a very very long button label')
      ;(btn as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const buffer = createBuffer(20, 5)
      expect(() => btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should handle both icons', () => {
      const btn = button()
        .label('Save')
        .icon('<')
        .iconRight('>')

      const buffer = createBuffer(20, 5)
      ;(btn as any)._bounds = { x: 0, y: 0, width: 15, height: 1 }
      expect(() => btn.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should handle percentage width', () => {
      const btn = button().width('100%')
      expect(btn).toBeDefined()
    })

    it('should handle multiple clicks', () => {
      const handler = vi.fn()
      const btn = button().onClick(handler)

      btn.press().press().press()
      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('should handle press when focused', () => {
      const handler = vi.fn()
      const btn = button()
        .onClick(handler)
        .focus()

      btn.press()
      expect(handler).toHaveBeenCalled()
      expect(btn.isFocused).toBe(true)
    })

    it('should handle rapid focus/blur', () => {
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const btn = button()
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      btn.focus().blur().focus().blur()
      expect(focusHandler).toHaveBeenCalledTimes(2)
      expect(blurHandler).toHaveBeenCalledTimes(2)
    })
  })
})
