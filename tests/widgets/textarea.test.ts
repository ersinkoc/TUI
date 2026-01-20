/**
 * @oxog/tui - Textarea Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { textarea } from '../../src/widgets/textarea'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Textarea Widget', () => {
  describe('factory function', () => {
    it('should create textarea node', () => {
      const t = textarea()
      expect(t).toBeDefined()
      expect(t.type).toBe('textarea')
    })

    it('should create textarea with initial value via props', () => {
      const t = textarea({ value: 'Hello' })
      expect(t.currentValue).toBe('Hello')
    })

    it('should create textarea with placeholder via props', () => {
      const t = textarea({ placeholder: 'Enter text...' })
      expect(t).toBeDefined()
    })

    it('should create textarea with maxLength via props', () => {
      const t = textarea({ maxLength: 100 })
      expect(t).toBeDefined()
    })

    it('should create textarea with dimensions via props', () => {
      const t = textarea({ width: 40, height: 10 })
      expect(t).toBeDefined()
    })
  })

  describe('value()', () => {
    it('should set value', () => {
      const t = textarea().value('Hello World')
      expect(t.currentValue).toBe('Hello World')
    })

    it('should return this for chaining', () => {
      const t = textarea()
      expect(t.value('Test')).toBe(t)
    })

    it('should handle multiline value', () => {
      const t = textarea().value('Line 1\nLine 2\nLine 3')
      expect(t.currentValue).toBe('Line 1\nLine 2\nLine 3')
      expect(t.lineCount).toBe(3)
    })

    it('should truncate value to maxLength', () => {
      const t = textarea().maxLength(5).value('Hello World')
      expect(t.currentValue).toBe('Hello')
    })

    it('should mark dirty when value changes', () => {
      const t = textarea()
      t.clearDirty()
      t.value('New')
      expect((t as any)._dirty).toBe(true)
    })

    it('should not mark dirty when value stays the same', () => {
      const t = textarea().value('Same')
      t.clearDirty()
      t.value('Same')
      expect((t as any)._dirty).toBe(false)
    })
  })

  describe('placeholder()', () => {
    it('should set placeholder', () => {
      const t = textarea().placeholder('Enter text...')
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = textarea()
      expect(t.placeholder('Test')).toBe(t)
    })

    it('should mark dirty when placeholder changes', () => {
      const t = textarea()
      t.clearDirty()
      t.placeholder('New placeholder')
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('maxLength()', () => {
    it('should set maxLength', () => {
      const t = textarea().maxLength(100)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = textarea()
      expect(t.maxLength(50)).toBe(t)
    })

    it('should truncate existing value when maxLength is reduced', () => {
      const t = textarea().value('Hello World').maxLength(5)
      expect(t.currentValue).toBe('Hello')
    })

    it('should mark dirty when maxLength changes', () => {
      const t = textarea()
      t.clearDirty()
      t.maxLength(10)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('width() and height()', () => {
    it('should set width', () => {
      const t = textarea().width(40)
      expect(t).toBeDefined()
    })

    it('should set height', () => {
      const t = textarea().height(10)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = textarea()
      expect(t.width(40)).toBe(t)
      expect(t.height(10)).toBe(t)
    })

    it('should accept percentage dimensions', () => {
      const t = textarea().width('100%').height('50%')
      expect(t).toBeDefined()
    })

    it('should mark dirty when dimensions change', () => {
      const t = textarea()
      t.clearDirty()
      t.width(60)
      expect((t as any)._dirty).toBe(true)

      t.clearDirty()
      t.height(15)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('currentValue', () => {
    it('should return current value', () => {
      const t = textarea().value('Test Value')
      expect(t.currentValue).toBe('Test Value')
    })

    it('should return empty string initially', () => {
      const t = textarea()
      expect(t.currentValue).toBe('')
    })
  })

  describe('lineCount', () => {
    it('should return 1 for empty textarea', () => {
      const t = textarea()
      expect(t.lineCount).toBe(1)
    })

    it('should return 1 for single line', () => {
      const t = textarea().value('Single line')
      expect(t.lineCount).toBe(1)
    })

    it('should return correct count for multiline', () => {
      const t = textarea().value('Line 1\nLine 2\nLine 3\nLine 4')
      expect(t.lineCount).toBe(4)
    })
  })

  describe('focus() and blur()', () => {
    it('should focus the textarea', () => {
      const t = textarea()
      t.focus()
      expect(t.isFocused).toBe(true)
    })

    it('should blur the textarea', () => {
      const t = textarea()
      t.focus()
      t.blur()
      expect(t.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = textarea()
      expect(t.focus()).toBe(t)
      expect(t.blur()).toBe(t)
    })

    it('should mark dirty when focus changes', () => {
      const t = textarea()
      t.clearDirty()
      t.focus()
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when blur changes', () => {
      const t = textarea().focus()
      t.clearDirty()
      t.blur()
      expect((t as any)._dirty).toBe(true)
    })

    it('should not re-trigger focus if already focused', () => {
      const handler = vi.fn()
      const t = textarea().onFocus(handler)
      t.focus()
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      const handler = vi.fn()
      const t = textarea().onBlur(handler)
      t.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('onChange() should be called when value changes', () => {
      const handler = vi.fn()
      const t = textarea().onChange(handler).focus()
      ;(t as any).handleKey('a', false)
      expect(handler).toHaveBeenCalledWith('a')
    })

    it('onFocus() should be called when focused', () => {
      const handler = vi.fn()
      const t = textarea().onFocus(handler)
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('onBlur() should be called when blurred', () => {
      const handler = vi.fn()
      const t = textarea().onBlur(handler)
      t.focus()
      t.blur()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = textarea().onChange(handler1).onChange(handler2).focus()
      ;(t as any).handleKey('x', false)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('handlers should return this for chaining', () => {
      const t = textarea()
      expect(t.onChange(() => {})).toBe(t)
      expect(t.onFocus(() => {})).toBe(t)
      expect(t.onBlur(() => {})).toBe(t)
    })
  })

  describe('handleKey()', () => {
    it('should insert printable characters', () => {
      const t = textarea().focus()
      ;(t as any).handleKey('H', false)
      ;(t as any).handleKey('i', false)
      expect(t.currentValue).toBe('Hi')
    })

    it('should not insert when not focused', () => {
      const t = textarea()
      ;(t as any).handleKey('a', false)
      expect(t.currentValue).toBe('')
    })

    it('should handle backspace at start of line', () => {
      const t = textarea().value('Line 1\nLine 2').focus()
      ;(t as any)._cursorLine = 1
      ;(t as any)._cursorCol = 0
      ;(t as any).handleKey('backspace', false)
      expect(t.currentValue).toBe('Line 1Line 2')
    })

    it('should handle backspace in middle of line', () => {
      const t = textarea().value('Hello').focus()
      ;(t as any)._cursorCol = 5
      ;(t as any).handleKey('backspace', false)
      expect(t.currentValue).toBe('Hell')
    })

    it('should handle enter to create new line', () => {
      const t = textarea().value('Hello').focus()
      ;(t as any)._cursorCol = 5
      ;(t as any).handleKey('enter', false)
      expect(t.currentValue).toBe('Hello\n')
      expect(t.lineCount).toBe(2)
    })

    it('should handle enter in middle of line', () => {
      const t = textarea().value('Hello World').focus()
      ;(t as any)._cursorCol = 5
      ;(t as any).handleKey('enter', false)
      expect(t.currentValue).toBe('Hello\n World')
    })

    it('should handle up arrow', () => {
      const t = textarea().value('Line 1\nLine 2').focus()
      ;(t as any)._cursorLine = 1
      ;(t as any)._cursorCol = 3
      ;(t as any).handleKey('up', false)
      expect((t as any)._cursorLine).toBe(0)
    })

    it('should not go above first line', () => {
      const t = textarea().value('Line 1').focus()
      ;(t as any)._cursorLine = 0
      ;(t as any).handleKey('up', false)
      expect((t as any)._cursorLine).toBe(0)
    })

    it('should handle down arrow', () => {
      const t = textarea().value('Line 1\nLine 2').focus()
      ;(t as any)._cursorLine = 0
      ;(t as any)._cursorCol = 3
      ;(t as any).handleKey('down', false)
      expect((t as any)._cursorLine).toBe(1)
    })

    it('should not go below last line', () => {
      const t = textarea().value('Line 1').focus()
      ;(t as any)._cursorLine = 0
      ;(t as any).handleKey('down', false)
      expect((t as any)._cursorLine).toBe(0)
    })

    it('should handle left arrow', () => {
      const t = textarea().value('Hello').focus()
      ;(t as any)._cursorCol = 3
      ;(t as any).handleKey('left', false)
      expect((t as any)._cursorCol).toBe(2)
    })

    it('should move to previous line on left at start', () => {
      const t = textarea().value('Line 1\nLine 2').focus()
      ;(t as any)._cursorLine = 1
      ;(t as any)._cursorCol = 0
      ;(t as any).handleKey('left', false)
      expect((t as any)._cursorLine).toBe(0)
      expect((t as any)._cursorCol).toBe(6)
    })

    it('should handle right arrow', () => {
      const t = textarea().value('Hello').focus()
      ;(t as any)._cursorCol = 2
      ;(t as any).handleKey('right', false)
      expect((t as any)._cursorCol).toBe(3)
    })

    it('should move to next line on right at end', () => {
      const t = textarea().value('Line 1\nLine 2').focus()
      ;(t as any)._cursorLine = 0
      ;(t as any)._cursorCol = 6
      ;(t as any).handleKey('right', false)
      expect((t as any)._cursorLine).toBe(1)
      expect((t as any)._cursorCol).toBe(0)
    })

    it('should handle home key', () => {
      const t = textarea().value('Hello World').focus()
      ;(t as any)._cursorCol = 6
      ;(t as any).handleKey('home', false)
      expect((t as any)._cursorCol).toBe(0)
    })

    it('should handle end key', () => {
      const t = textarea().value('Hello World').focus()
      ;(t as any)._cursorCol = 0
      ;(t as any).handleKey('end', false)
      expect((t as any)._cursorCol).toBe(11)
    })

    it('should respect maxLength when inserting', () => {
      const t = textarea().maxLength(5).value('Hell').focus()
      ;(t as any)._cursorCol = 4
      ;(t as any).handleKey('o', false)
      ;(t as any).handleKey('!', false) // Should be ignored
      expect(t.currentValue).toBe('Hello')
    })

    it('should clamp cursor column when moving between lines', () => {
      const t = textarea().value('Long line here\nShort').focus()
      ;(t as any)._cursorLine = 0
      ;(t as any)._cursorCol = 14
      ;(t as any).handleKey('down', false)
      expect((t as any)._cursorCol).toBe(5) // "Short" length
    })
  })

  describe('render()', () => {
    it('should render to buffer', () => {
      const t = textarea().value('Test')
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      let text = ''
      for (let x = 0; x < 4; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) text += cell.char
      }
      expect(text).toBe('Test')
    })

    it('should render placeholder when empty', () => {
      const t = textarea().placeholder('Enter...')
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      let text = ''
      for (let x = 0; x < 8; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) text += cell.char
      }
      expect(text).toBe('Enter...')
    })

    it('should not render when not visible', () => {
      const t = textarea().value('Test').visible(false)
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should not render with zero dimensions', () => {
      const t = textarea().value('Test')
      ;(t as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(20, 5)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render multiple lines', () => {
      const t = textarea().value('Line 1\nLine 2')
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      let line1 = ''
      for (let x = 0; x < 6; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) line1 += cell.char
      }
      expect(line1).toBe('Line 1')

      let line2 = ''
      for (let x = 0; x < 6; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) line2 += cell.char
      }
      expect(line2).toBe('Line 2')
    })

    it('should handle scrolling', () => {
      const t = textarea().value('Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 2 }
      // Set cursor to line 3 (index 2) to trigger scroll
      ;(t as any)._cursorLine = 2
      ;(t as any)._cursorCol = 0

      const buffer = createBuffer(20, 2)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // With height 2 and cursor at line 2, scroll should show lines 2-3 (indices 1-2)
      let line1 = ''
      for (let x = 0; x < 6; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) line1 += cell.char
      }
      expect(line1).toBe('Line 2')

      let line2 = ''
      for (let x = 0; x < 6; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) line2 += cell.char
      }
      expect(line2).toBe('Line 3')
    })

    it('should scroll up when cursor is above visible area', () => {
      const t = textarea().value('Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 2 }
      // First scroll down
      ;(t as any)._scrollY = 3
      // Then set cursor above scroll position
      ;(t as any)._cursorLine = 1
      ;(t as any)._cursorCol = 0

      const buffer = createBuffer(20, 2)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Scroll should adjust to show cursor at line 1
      let line1 = ''
      for (let x = 0; x < 6; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) line1 += cell.char
      }
      expect(line1).toBe('Line 2')
    })

    it('should truncate long lines when wider than available width', () => {
      const t = textarea().value('This is a very long line that exceeds the width')
      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }

      const buffer = createBuffer(15, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Line should be truncated to width (10)
      let text = ''
      for (let x = 0; x < 10; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) text += cell.char
      }
      expect(text).toBe('This is a ')
    })
  })

  describe('chainable API', () => {
    it('should support full chaining', () => {
      const result = textarea()
        .placeholder('Enter text...')
        .value('Initial')
        .maxLength(100)
        .width(40)
        .height(10)
        .onChange(() => {})
        .onFocus(() => {})
        .onBlur(() => {})
        .focus()

      expect(result.currentValue).toBe('Initial')
      expect(result.isFocused).toBe(true)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const t = textarea()
      expect(t.isVisible).toBe(true)
    })

    it('should be hideable', () => {
      const t = textarea().visible(false)
      expect(t.isVisible).toBe(false)
    })

    it('should be showable after hiding', () => {
      const t = textarea().visible(false).visible(true)
      expect(t.isVisible).toBe(true)
    })
  })
})
