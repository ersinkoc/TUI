/**
 * @oxog/tui - Checkbox Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { checkbox } from '../../src/widgets/checkbox'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Checkbox Widget', () => {
  describe('factory function', () => {
    it('should create a checkbox node', () => {
      const cb = checkbox()
      expect(cb.type).toBe('checkbox')
    })

    it('should have a unique id', () => {
      const cb1 = checkbox()
      const cb2 = checkbox()
      expect(cb1.id).not.toBe(cb2.id)
    })

    it('should accept props', () => {
      const cb = checkbox({
        label: 'Test',
        checked: true,
        disabled: false
      })
      expect(cb.isChecked).toBe(true)
    })

    it('should apply initial checked state from props', () => {
      const cb = checkbox({ checked: true })
      expect(cb.isChecked).toBe(true)
    })

    it('should apply initial disabled state from props', () => {
      const cb = checkbox({ disabled: true })
      expect(cb.isDisabled).toBe(true)
    })
  })

  describe('chainable methods', () => {
    it('should set label', () => {
      const cb = checkbox().label('My Checkbox')
      expect(cb).toBeDefined()
    })

    it('should set checked state', () => {
      const cb = checkbox().checked(true)
      expect(cb.isChecked).toBe(true)
    })

    it('should set disabled state', () => {
      const cb = checkbox().disabled(true)
      expect(cb.isDisabled).toBe(true)
    })

    it('should chain multiple methods', () => {
      const cb = checkbox().label('Test').checked(true).disabled(false)

      expect(cb.isChecked).toBe(true)
      expect(cb.isDisabled).toBe(false)
    })
  })

  describe('toggle', () => {
    it('should toggle checked state', () => {
      const cb = checkbox()
      expect(cb.isChecked).toBe(false)

      cb.toggle()
      expect(cb.isChecked).toBe(true)

      cb.toggle()
      expect(cb.isChecked).toBe(false)
    })

    it('should not toggle when disabled', () => {
      const cb = checkbox().disabled(true)
      expect(cb.isChecked).toBe(false)

      cb.toggle()
      expect(cb.isChecked).toBe(false)
    })

    it('should emit change event on toggle', () => {
      const handler = vi.fn()
      const cb = checkbox().onChange(handler)

      cb.toggle()

      expect(handler).toHaveBeenCalledWith(true)
    })

    it('should not emit change when disabled', () => {
      const handler = vi.fn()
      const cb = checkbox().disabled(true).onChange(handler)

      cb.toggle()

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('should not be focused by default', () => {
      const cb = checkbox()
      expect(cb.isFocused).toBe(false)
    })

    it('should focus when focus() is called', () => {
      const cb = checkbox()
      cb.focus()
      expect(cb.isFocused).toBe(true)
    })

    it('should blur when blur() is called', () => {
      const cb = checkbox()
      cb.focus()
      cb.blur()
      expect(cb.isFocused).toBe(false)
    })

    it('should emit focus event', () => {
      const handler = vi.fn()
      const cb = checkbox().onFocus(handler)

      cb.focus()

      expect(handler).toHaveBeenCalled()
    })

    it('should emit blur event', () => {
      const handler = vi.fn()
      const cb = checkbox().onBlur(handler)

      cb.focus()
      cb.blur()

      expect(handler).toHaveBeenCalled()
    })

    it('should not emit focus twice if already focused', () => {
      const handler = vi.fn()
      const cb = checkbox().onFocus(handler)

      cb.focus()
      cb.focus()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not emit blur if not focused', () => {
      const handler = vi.fn()
      const cb = checkbox().onBlur(handler)

      cb.blur()

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('events', () => {
    it('should register onChange handler', () => {
      const handler = vi.fn()
      const cb = checkbox().onChange(handler)

      cb.checked(true)
      // checked() doesn't emit change, only toggle does
      expect(handler).not.toHaveBeenCalled()

      cb.toggle()
      expect(handler).toHaveBeenCalledWith(false)
    })

    it('should support multiple onChange handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const cb = checkbox().onChange(handler1).onChange(handler2)

      cb.toggle()

      expect(handler1).toHaveBeenCalledWith(true)
      expect(handler2).toHaveBeenCalledWith(true)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const cb = checkbox()
      expect(cb.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const cb = checkbox().visible(false)
      expect(cb.isVisible).toBe(false)
    })
  })

  describe('rendering', () => {
    it('should render unchecked checkbox', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Test')

      cb._bounds = { x: 0, y: 0, width: 20, height: 1 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render "[ ] Test"
      expect(buffer.get(0, 0)?.char).toBe('[')
      expect(buffer.get(1, 0)?.char).toBe(' ')
      expect(buffer.get(2, 0)?.char).toBe(']')
    })

    it('should render checked checkbox', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Test').checked(true)

      cb._bounds = { x: 0, y: 0, width: 20, height: 1 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render "[x] Test"
      expect(buffer.get(0, 0)?.char).toBe('[')
      expect(buffer.get(1, 0)?.char).toBe('x')
      expect(buffer.get(2, 0)?.char).toBe(']')
    })

    it('should render focused checkbox with different brackets', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Test')
      cb.focus()

      cb._bounds = { x: 0, y: 0, width: 20, height: 1 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render "> < Test" when focused
      expect(buffer.get(0, 0)?.char).toBe('>')
      expect(buffer.get(2, 0)?.char).toBe('<')
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Test').visible(false)

      const originalChar = buffer.get(0, 0)?.char
      cb._bounds = { x: 0, y: 0, width: 20, height: 1 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(originalChar)
    })

    it('should not render with zero dimensions', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Test')

      cb._bounds = { x: 0, y: 0, width: 0, height: 0 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should still have default space
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should render disabled checkbox with dim attribute', () => {
      const buffer = createBuffer(20, 1)
      const cb = checkbox().label('Disabled').disabled(true)

      cb._bounds = { x: 0, y: 0, width: 20, height: 1 }
      cb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render with ATTR_DIM (value is 8 from constants)
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe('[')
      expect(cell?.attrs).toBe(8) // ATTR_DIM
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when label changes', () => {
      const cb = checkbox()
      cb._dirty = false

      cb.label('New Label')
      expect(cb._dirty).toBe(true)
    })

    it('should mark dirty when checked changes', () => {
      const cb = checkbox()
      cb._dirty = false

      cb.checked(true)
      expect(cb._dirty).toBe(true)
    })

    it('should mark dirty when disabled changes', () => {
      const cb = checkbox()
      cb._dirty = false

      cb.disabled(true)
      expect(cb._dirty).toBe(true)
    })

    it('should mark dirty on toggle', () => {
      const cb = checkbox()
      cb._dirty = false

      cb.toggle()
      expect(cb._dirty).toBe(true)
    })

    it('should mark dirty on focus', () => {
      const cb = checkbox()
      cb._dirty = false

      cb.focus()
      expect(cb._dirty).toBe(true)
    })

    it('should mark dirty on blur', () => {
      const cb = checkbox()
      cb.focus()
      cb._dirty = false

      cb.blur()
      expect(cb._dirty).toBe(true)
    })
  })
})
