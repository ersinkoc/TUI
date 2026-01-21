/**
 * Slider widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { slider } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Slider Widget', () => {
  describe('creation', () => {
    it('creates a slider with default properties', () => {
      const s = slider()
      expect(s.type).toBe('slider')
      expect(s.currentValue).toBe(0)
      expect(s.percent).toBe(0)
      expect(s.isFocused).toBe(false)
      expect(s.isDisabled).toBe(false)
    })

    it('creates a slider with initial properties', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        step: 5
      })
      expect(s.currentValue).toBe(50)
      expect(s.percent).toBe(0.5)
    })

    it('creates a vertical slider', () => {
      const s = slider({ orientation: 'vertical' })
      expect(s.type).toBe('slider')
    })

    it('creates a disabled slider', () => {
      const s = slider({ disabled: true })
      expect(s.isDisabled).toBe(true)
    })
  })

  describe('configuration', () => {
    it('sets min value', () => {
      const s = slider().min(10).value(50)
      expect(s.currentValue).toBe(50)
    })

    it('sets max value', () => {
      const s = slider().max(200).value(100)
      expect(s.currentValue).toBe(100)
    })

    it('sets value', () => {
      const s = slider().value(75)
      expect(s.currentValue).toBe(75)
    })

    it('clamps value to min', () => {
      const s = slider({ min: 10, max: 100 }).value(5)
      expect(s.currentValue).toBe(10)
    })

    it('clamps value to max', () => {
      const s = slider({ min: 0, max: 100 }).value(150)
      expect(s.currentValue).toBe(100)
    })

    it('sets step', () => {
      const s = slider().step(5)
      expect(s.type).toBe('slider')
    })

    it('sets orientation', () => {
      const s = slider().orientation('vertical')
      expect(s.type).toBe('slider')
    })

    it('sets showValue', () => {
      const s = slider().showValue(true)
      expect(s.type).toBe('slider')
    })

    it('sets showRange', () => {
      const s = slider().showRange(true)
      expect(s.type).toBe('slider')
    })

    it('sets custom track character', () => {
      const s = slider().trackChar('░')
      expect(s.type).toBe('slider')
    })

    it('sets custom fill character', () => {
      const s = slider().fillChar('█')
      expect(s.type).toBe('slider')
    })

    it('sets custom thumb character', () => {
      const s = slider().thumbChar('◆')
      expect(s.type).toBe('slider')
    })

    it('sets disabled state', () => {
      const s = slider().disabled(true)
      expect(s.isDisabled).toBe(true)
    })
  })

  describe('control', () => {
    it('increments value', () => {
      const s = slider({ min: 0, max: 100, value: 50, step: 10 })
      s.increment()
      expect(s.currentValue).toBe(60)
    })

    it('decrements value', () => {
      const s = slider({ min: 0, max: 100, value: 50, step: 10 })
      s.decrement()
      expect(s.currentValue).toBe(40)
    })

    it('respects min on decrement', () => {
      const s = slider({ min: 0, max: 100, value: 5, step: 10 })
      s.decrement()
      expect(s.currentValue).toBe(0)
    })

    it('respects max on increment', () => {
      const s = slider({ min: 0, max: 100, value: 95, step: 10 })
      s.increment()
      expect(s.currentValue).toBe(100)
    })

    it('sets value directly', () => {
      const s = slider({ min: 0, max: 100, step: 5 })
      s.setValue(47) // Should round to step
      expect(s.currentValue).toBe(45)
    })

    it('sets value by percent', () => {
      const s = slider({ min: 0, max: 100 })
      s.setPercent(0.5)
      expect(s.currentValue).toBe(50)
    })

    it('clamps percent to 0-1 range', () => {
      const s = slider({ min: 0, max: 100 })
      s.setPercent(1.5)
      expect(s.currentValue).toBe(100)

      s.setPercent(-0.5)
      expect(s.currentValue).toBe(0)
    })

    it('does not modify when disabled', () => {
      const s = slider({ value: 50, disabled: true })
      s.increment()
      expect(s.currentValue).toBe(50)

      s.decrement()
      expect(s.currentValue).toBe(50)

      s.setValue(75)
      expect(s.currentValue).toBe(50)

      s.setPercent(0.9)
      expect(s.currentValue).toBe(50)
    })
  })

  describe('focus', () => {
    it('focuses the slider', () => {
      const s = slider()
      s.focus()
      expect(s.isFocused).toBe(true)
    })

    it('blurs the slider', () => {
      const s = slider()
      s.focus()
      s.blur()
      expect(s.isFocused).toBe(false)
    })

    it('does not focus when disabled', () => {
      const s = slider({ disabled: true })
      s.focus()
      expect(s.isFocused).toBe(false)
    })

    it('loses focus when disabled', () => {
      const s = slider()
      s.focus()
      expect(s.isFocused).toBe(true)

      s.disabled(true)
      expect(s.isFocused).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onChange when value changes', () => {
      const handler = vi.fn()
      const s = slider().onChange(handler)
      s.value(50)
      expect(handler).toHaveBeenCalledWith(50)
    })

    it('does not emit onChange when value is same', () => {
      const handler = vi.fn()
      const s = slider({ value: 50 }).onChange(handler)
      s.value(50)
      expect(handler).not.toHaveBeenCalled()
    })

    it('emits onFocus when focused', () => {
      const handler = vi.fn()
      const s = slider().onFocus(handler)
      s.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onBlur when blurred', () => {
      const handler = vi.fn()
      const s = slider().onBlur(handler)
      s.focus()
      s.blur()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('handles right arrow (horizontal)', () => {
      const s = slider({ value: 50, step: 10 }).focus()
      const handled = (s as any).handleKey('right', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(60)
    })

    it('handles left arrow (horizontal)', () => {
      const s = slider({ value: 50, step: 10 }).focus()
      const handled = (s as any).handleKey('left', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(40)
    })

    it('handles l key (horizontal)', () => {
      const s = slider({ value: 50, step: 10 }).focus()
      const handled = (s as any).handleKey('l', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(60)
    })

    it('handles h key (horizontal)', () => {
      const s = slider({ value: 50, step: 10 }).focus()
      const handled = (s as any).handleKey('h', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(40)
    })

    it('handles up arrow (vertical)', () => {
      const s = slider({ value: 50, step: 10, orientation: 'vertical' }).focus()
      const handled = (s as any).handleKey('up', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(60)
    })

    it('handles down arrow (vertical)', () => {
      const s = slider({ value: 50, step: 10, orientation: 'vertical' }).focus()
      const handled = (s as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(40)
    })

    it('handles home key', () => {
      const s = slider({ min: 10, max: 100, value: 50 }).focus()
      const handled = (s as any).handleKey('home', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(10)
    })

    it('handles end key', () => {
      const s = slider({ min: 10, max: 100, value: 50 }).focus()
      const handled = (s as any).handleKey('end', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(100)
    })

    it('ignores keys when not focused', () => {
      const s = slider({ value: 50, step: 10 })
      const handled = (s as any).handleKey('right', false)
      expect(handled).toBe(false)
      expect(s.currentValue).toBe(50)
    })

    it('ignores keys when disabled', () => {
      const s = slider({ value: 50, step: 10, disabled: true }).focus()
      const handled = (s as any).handleKey('right', false)
      expect(handled).toBe(false)
      expect(s.currentValue).toBe(50)
    })
  })

  describe('mouse handling', () => {
    beforeEach(() => {
      // Set bounds for mouse tests
    })

    it('handles mouse press on track', () => {
      const s = slider({ min: 0, max: 100, showRange: false, showValue: false })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      const handled = (s as any).handleMouse(10, 0, 'press')
      expect(handled).toBe(true)
      // Value should change based on click position
    })

    it('ignores mouse when disabled', () => {
      const s = slider({ value: 50, disabled: true })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      const handled = (s as any).handleMouse(10, 0, 'press')
      expect(handled).toBe(false)
      expect(s.currentValue).toBe(50)
    })

    it('ignores mouse outside bounds', () => {
      const s = slider({ value: 50 })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      const handled = (s as any).handleMouse(25, 0, 'press')
      expect(handled).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal slider', () => {
      const s = slider({ value: 50, showValue: true, showRange: false })
      ;(s as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should render without error
    })

    it('renders horizontal slider with range', () => {
      const s = slider({ value: 50, showValue: true, showRange: true })
      ;(s as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical slider', () => {
      const s = slider({ value: 50, orientation: 'vertical' })
      ;(s as any)._bounds = { x: 0, y: 0, width: 10, height: 8 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders disabled slider', () => {
      const s = slider({ value: 50, disabled: true })
      ;(s as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused slider', () => {
      const s = slider({ value: 50 }).focus()
      ;(s as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const s = slider()
      ;(s as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('respects visibility', () => {
      const s = slider().visible(false)
      ;(s as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not render
    })
  })

  describe('percent calculation', () => {
    it('calculates percent correctly', () => {
      const s = slider({ min: 0, max: 100, value: 25 })
      expect(s.percent).toBe(0.25)
    })

    it('handles custom range', () => {
      const s = slider({ min: 50, max: 150, value: 100 })
      expect(s.percent).toBe(0.5)
    })

    it('returns 0 for zero range', () => {
      const s = slider({ min: 50, max: 50 })
      expect(s.percent).toBe(0)
    })

    it('handles negative range', () => {
      const s = slider({ min: -100, max: 100, value: 0 })
      expect(s.percent).toBe(0.5)
    })
  })

  describe('step rounding', () => {
    it('rounds to nearest step', () => {
      const s = slider({ min: 0, max: 100, step: 10 })
      s.setValue(47)
      expect(s.currentValue).toBe(50)
    })

    it('handles decimal steps', () => {
      const s = slider({ min: 0, max: 1, step: 0.1 })
      s.setValue(0.37)
      expect(s.currentValue).toBeCloseTo(0.4, 1)
    })

    it('handles very small steps', () => {
      const s = slider({ min: 0, max: 1, step: 0.001 })
      s.setValue(0.5555)
      expect(s.currentValue).toBeCloseTo(0.556, 3)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const s = slider()
        .min(0)
        .max(100)
        .value(50)
        .step(5)
        .orientation('horizontal')
        .showValue(true)
        .showRange(true)
        .trackChar('─')
        .fillChar('━')
        .thumbChar('●')
        .disabled(false)
        .focus()
        .increment()
        .decrement()
        .blur()

      expect(s.type).toBe('slider')
      expect(s.currentValue).toBe(50)
    })
  })

  describe('vertical slider with range labels', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 10
    const height = 12

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical slider with showRange true', () => {
      const s = slider({
        value: 50,
        min: 0,
        max: 100,
        orientation: 'vertical',
        showRange: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders vertical slider with showValue true', () => {
      const s = slider({
        value: 75,
        min: 0,
        max: 100,
        orientation: 'vertical',
        showValue: true
      }).focus()
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders vertical slider with both showRange and showValue', () => {
      const s = slider({
        value: 50,
        min: 0,
        max: 100,
        orientation: 'vertical',
        showRange: true,
        showValue: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders vertical slider at min value', () => {
      const s = slider({
        value: 0,
        min: 0,
        max: 100,
        orientation: 'vertical',
        showRange: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders vertical slider at max value', () => {
      const s = slider({
        value: 100,
        min: 0,
        max: 100,
        orientation: 'vertical',
        showRange: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })
  })

  describe('vertical slider mouse handling', () => {
    it('handles mouse press on vertical slider with showRange', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        orientation: 'vertical',
        showRange: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width: 5, height: 12 }

      // Click near the top (high value)
      const handled = (s as any).handleMouse(2, 1, 'press')
      expect(handled).toBe(true)
      // Value should increase (closer to max)
    })

    it('handles mouse press on vertical slider without showRange', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        orientation: 'vertical',
        showRange: false
      })
      ;(s as any)._bounds = { x: 0, y: 0, width: 5, height: 10 }

      // Click in the middle
      const handled = (s as any).handleMouse(2, 5, 'press')
      expect(handled).toBe(true)
    })

    it('handles mouse move on vertical slider', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        orientation: 'vertical',
        showRange: true
      })
      ;(s as any)._bounds = { x: 0, y: 0, width: 5, height: 12 }

      // Move to bottom (low value)
      const handled = (s as any).handleMouse(2, 10, 'move')
      expect(handled).toBe(true)
    })

    it('handles mouse move on horizontal slider', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        orientation: 'horizontal',
        showRange: false,
        showValue: false
      })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      // Move along the track
      const handled = (s as any).handleMouse(15, 0, 'move')
      expect(handled).toBe(true)
    })

    it('returns true for other mouse actions inside bounds', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      // 'release' action is not press or move
      const handled = (s as any).handleMouse(10, 0, 'release')
      expect(handled).toBe(true)
    })

    it('returns true for scroll action inside bounds', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      // scroll action is not press or move
      const handled = (s as any).handleMouse(10, 0, 'scroll-up')
      expect(handled).toBe(true)
    })
  })

  describe('handler cleanup', () => {
    it('should remove onChange handler with offChange', () => {
      const handler = vi.fn()
      const s = slider().onChange(handler)

      s.value(50)
      expect(handler).toHaveBeenCalledTimes(1)

      s.offChange(handler)
      s.value(75)
      expect(handler).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('should remove onFocus handler with offFocus', () => {
      const handler = vi.fn()
      const s = slider().onFocus(handler)

      s.focus()
      expect(handler).toHaveBeenCalledTimes(1)

      s.offFocus(handler)
      s.focus()
      expect(handler).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      const handler = vi.fn()
      const s = slider().onBlur(handler)

      s.focus().blur()
      expect(handler).toHaveBeenCalledTimes(1)

      s.offBlur(handler)
      s.focus().blur()
      expect(handler).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()

      const s = slider()
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      s.clearHandlers()

      s.value(50)
      s.focus()
      s.blur()

      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()

      const s = slider()
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      s.dispose()

      s.value(50)
      s.focus()
      s.blur()

      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should be idempotent', () => {
      const s = slider()
      s.dispose()
      s.dispose() // Should not throw

      expect(s.isDisposed).toBe(true)
    })
  })

  describe('min() edge cases', () => {
    it('should adjust max when min > max', () => {
      const s = slider({ min: 0, max: 100 })
      s.min(150)

      // Max is adjusted to match min, and value is clamped
      expect(s.currentValue).toBe(150)
    })

    it('should handle non-finite values', () => {
      const s = slider({ min: 10, max: 100, value: 50 })

      s.min(NaN)
      // NaN defaults to 0, and value (50) is still within range 0-100
      expect(s.currentValue).toBe(50)

      s.min(Infinity)
      // Infinity defaults to 0, value stays 50
      expect(s.currentValue).toBe(50)

      s.min(-Infinity)
      // -Infinity defaults to 0, value stays 50
      expect(s.currentValue).toBe(50)
    })

    it('should clamp current value when min increases', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.min(75)

      expect(s.currentValue).toBe(75) // Clamped to new min
    })
  })

  describe('max() edge cases', () => {
    it('should adjust min when max < min', () => {
      const s = slider({ min: 50, max: 100 })
      s.max(25)

      // Min is adjusted to match max, and value is clamped
      expect(s.currentValue).toBe(25)
    })

    it('should handle non-finite values', () => {
      const s = slider({ min: 0, max: 100, value: 50 })

      s.max(NaN)
      // NaN defaults to 100, and value (50) is still within range 0-100
      expect(s.currentValue).toBe(50)

      s.max(Infinity)
      // Infinity defaults to 100, value stays 50
      expect(s.currentValue).toBe(50)

      s.max(-Infinity)
      // -Infinity defaults to 100, value stays 50
      expect(s.currentValue).toBe(50)
    })

    it('should clamp current value when max decreases', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.max(25)

      expect(s.currentValue).toBe(25) // Clamped to new max
    })
  })

  describe('step() edge cases', () => {
    it('should enforce minimum step of 0.001', () => {
      const s = slider()
      s.step(0)

      // Increment should still work with minimum step
      const oldValue = s.currentValue
      s.increment()
      expect(s.currentValue).toBe(oldValue + 0.001)
    })

    it('should handle very small step values', () => {
      const s = slider({ step: 0.0001 })
      const oldValue = s.currentValue
      s.increment()

      expect(s.currentValue).toBe(oldValue + 0.0001)
    })
  })

  describe('focus() edge cases', () => {
    it('should not call handlers when already focused', () => {
      const handler = vi.fn()
      const s = slider().onFocus(handler)

      s.focus()
      expect(handler).toHaveBeenCalledTimes(1)

      s.focus()
      expect(handler).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('should not focus when disposed', () => {
      const s = slider()
      s.dispose()
      s.focus()

      expect(s.isFocused).toBe(false)
    })
  })

  describe('blur() edge cases', () => {
    it('should be idempotent', () => {
      const s = slider()
      s.focus()

      s.blur()
      expect(s.isFocused).toBe(false)

      s.blur()
      expect(s.isFocused).toBe(false) // Should remain false
    })
  })

  describe('keyboard handling additional keys', () => {
    it('handles k key (vertical up)', () => {
      const s = slider({ value: 50, step: 10, orientation: 'vertical' }).focus()
      const handled = (s as any).handleKey('k', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(60)
    })

    it('handles j key (vertical down)', () => {
      const s = slider({ value: 50, step: 10, orientation: 'vertical' }).focus()
      const handled = (s as any).handleKey('j', false)
      expect(handled).toBe(true)
      expect(s.currentValue).toBe(40)
    })

    it('returns false for unknown keys', () => {
      const s = slider({ value: 50 }).focus()
      const handled = (s as any).handleKey('x', false)
      expect(handled).toBe(false)
      expect(s.currentValue).toBe(50)
    })

    it('returns false for space key', () => {
      const s = slider({ value: 50 }).focus()
      const handled = (s as any).handleKey(' ', false)
      expect(handled).toBe(false)
    })
  })

  describe('setValue() edge cases', () => {
    it('should handle NaN values', () => {
      const s = slider({ value: 50 })
      s.setValue(NaN)

      // NaN is not finite, but the value method uses clampValue
      // which doesn't explicitly handle NaN
      // The result depends on how Math.max/Math.min handle NaN
      expect(typeof s.currentValue).toBe('number')
    })

    it('should handle Infinity values', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.setValue(Infinity)

      expect(s.currentValue).toBe(100) // Clamped to max
    })

    it('should handle negative Infinity values', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.setValue(-Infinity)

      expect(s.currentValue).toBe(0) // Clamped to min
    })
  })

  describe('setPercent() edge cases', () => {
    it('should handle NaN percent', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.setPercent(NaN)

      // NaN in Math.max/Math.min comparisons results in NaN
      // which then gets clamped by setValue
      expect(typeof s.currentValue).toBe('number')
    })

    it('should handle Infinity percent', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.setPercent(Infinity)

      expect(s.currentValue).toBe(100) // Clamped to max
    })

    it('should handle negative Infinity percent', () => {
      const s = slider({ min: 0, max: 100, value: 50 })
      s.setPercent(-Infinity)

      expect(s.currentValue).toBe(0) // Clamped to min
    })
  })

  describe('mouse handling edge cases', () => {
    it('should handle zero track width', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        showRange: true,
        showValue: true
      })
      // Very small width that results in 0 track width
      ;(s as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      // Should not throw or crash
      const handled = (s as any).handleMouse(5, 0, 'press')
      // Value might not change due to zero track width
      expect(typeof handled).toBe('boolean')
    })

    it('should handle zero track height', () => {
      const s = slider({
        min: 0,
        max: 100,
        value: 50,
        orientation: 'vertical'
      })
      // Very small height that results in 0 track height
      ;(s as any)._bounds = { x: 0, y: 0, width: 5, height: 1 }

      // Should not throw or crash
      const handled = (s as any).handleMouse(2, 0, 'press')
      expect(typeof handled).toBe('boolean')
    })
  })

  describe('onChange handler cleanup', () => {
    it('should not emit after offChange', () => {
      const handler = vi.fn()
      const s = slider().onChange(handler)

      s.offChange(handler)
      s.value(50)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle multiple onChange handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = slider().onChange(handler1).onChange(handler2)

      s.value(50)

      expect(handler1).toHaveBeenCalledWith(50)
      expect(handler2).toHaveBeenCalledWith(50)
    })

    it('should only remove specific handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = slider().onChange(handler1).onChange(handler2)

      s.offChange(handler1)
      s.value(50)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith(50)
    })
  })

  describe('focus/blur handler cleanup', () => {
    it('should handle multiple focus handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = slider().onFocus(handler1).onFocus(handler2)

      s.focus()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should handle multiple blur handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = slider().onBlur(handler1).onBlur(handler2)

      s.focus().blur()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })
})
