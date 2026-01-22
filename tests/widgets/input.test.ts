/**
 * @oxog/tui - Input Widget Tests
 */

import { describe, it, expect } from 'vitest'
import { input } from '../../src/widgets/input'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Input Widget', () => {
  describe('factory function', () => {
    it('should create an input node', () => {
      const i = input()
      expect(i.type).toBe('input')
    })

    it('should accept props', () => {
      const i = input({
        placeholder: 'Enter name',
        value: 'John'
      })
      expect(i.currentValue).toBe('John')
    })

    it('should have default empty value', () => {
      const i = input()
      expect(i.currentValue).toBe('')
    })
  })

  describe('value methods', () => {
    it('should get value with currentValue getter', () => {
      const i = input({ value: 'Hello' })
      expect(i.currentValue).toBe('Hello')
    })

    it('should set value with value method', () => {
      const i = input().value('World')
      expect(i.currentValue).toBe('World')
    })

    it('should handle empty value', () => {
      const i = input()
      expect(i.currentValue).toBe('')
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.value('test')).toBe(i)
    })
  })

  describe('placeholder', () => {
    it('should set placeholder', () => {
      const i = input().placeholder('Enter text...')
      expect(i).toBeDefined()
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.placeholder('test')).toBe(i)
    })
  })

  describe('password mode', () => {
    it('should enable password mode', () => {
      const i = input().password(true)
      expect(i).toBeDefined()
    })

    it('should set custom mask character', () => {
      const i = input().password(true, '*')
      expect(i).toBeDefined()
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.password(true)).toBe(i)
    })
  })

  describe('validation', () => {
    it('should set maxLength', () => {
      const i = input().maxLength(10)
      expect(i).toBeDefined()
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.maxLength(5)).toBe(i)
    })
  })

  describe('focus', () => {
    it('should not be focused by default', () => {
      const i = input()
      expect(i.isFocused).toBe(false)
    })

    it('should focus with focus method', () => {
      const i = input()
      i.focus()
      expect(i.isFocused).toBe(true)
    })

    it('should blur with blur method', () => {
      const i = input()
      i.focus()
      i.blur()
      expect(i.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.focus()).toBe(i)
      expect(i.blur()).toBe(i)
    })
  })

  describe('events', () => {
    it('should register onChange handler', () => {
      let changedValue = ''
      const i = input().onChange(value => {
        changedValue = value
      })

      // Trigger change via internal method
      ;(i as any)._value = 'New Value'
      const handlers = (i as any)._onChangeHandlers
      if (handlers && handlers.length > 0) {
        handlers[0]('New Value')
      }

      expect(changedValue).toBe('New Value')
    })

    it('should register onSubmit handler', () => {
      let submitted = false
      const i = input().onSubmit(() => {
        submitted = true
      })

      const handlers = (i as any)._onSubmitHandlers
      if (handlers && handlers.length > 0) {
        handlers[0]('test')
      }

      expect(submitted).toBe(true)
    })

    it('should call onFocus handler', () => {
      let focused = false
      const i = input().onFocus(() => {
        focused = true
      })

      i.focus()
      expect(focused).toBe(true)
    })

    it('should call onBlur handler', () => {
      let blurred = false
      const i = input().onBlur(() => {
        blurred = true
      })

      i.focus()
      i.blur()
      expect(blurred).toBe(true)
    })

    it('should return this for event chaining', () => {
      const i = input()
      expect(i.onChange(() => {})).toBe(i)
      expect(i.onSubmit(() => {})).toBe(i)
      expect(i.onFocus(() => {})).toBe(i)
      expect(i.onBlur(() => {})).toBe(i)
    })
  })

  describe('rendering', () => {
    it('should render value to buffer', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'Hello' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('e')
    })

    it('should render placeholder when empty and not focused', () => {
      const buffer = createBuffer(20, 1)
      const i = input().placeholder('Enter text')

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('E')
    })

    it('should render masked value in password mode', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'secret' }).password(true)

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should show mask characters, not actual value
      expect(buffer.get(0, 0)?.char).not.toBe('s')
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'Hello' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      i.visible(false)
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })
  })

  describe('layout methods', () => {
    it('should set width', () => {
      const i = input().width(30)
      expect((i as any)._layout.width).toBe(30)
    })

    it('should return this for chaining', () => {
      const i = input()
      expect(i.width(30)).toBe(i)
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when value changes', () => {
      const i = input()
      ;(i as any)._dirty = false
      i.value('New')
      expect((i as any)._dirty).toBe(true)
    })

    it('should mark dirty when focus changes', () => {
      const i = input()
      ;(i as any)._dirty = false
      i.focus()
      expect((i as any)._dirty).toBe(true)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const i = input()
      expect(i.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const i = input()
      i.visible(false)
      expect(i.isVisible).toBe(false)
    })
  })

  describe('type and id', () => {
    it('should have correct type', () => {
      const i = input()
      expect(i.type).toBe('input')
    })

    it('should have unique id', () => {
      const i1 = input()
      const i2 = input()
      expect(i1.id).not.toBe(i2.id)
    })
  })

  describe('handleKey()', () => {
    it('should insert printable characters', () => {
      const i = input().focus()
      ;(i as any).handleKey('a', false)
      ;(i as any).handleKey('b', false)
      ;(i as any).handleKey('c', false)
      expect(i.currentValue).toBe('abc')
    })

    it('should not insert when not focused', () => {
      const i = input()
      ;(i as any).handleKey('a', false)
      expect(i.currentValue).toBe('')
    })

    it('should handle backspace at start', () => {
      const i = input().focus()
      ;(i as any)._cursorPosition = 0
      ;(i as any).handleKey('backspace', false)
      expect(i.currentValue).toBe('')
    })

    it('should handle backspace in middle', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('backspace', false)
      expect(i.currentValue).toBe('Helo')
    })

    it('should handle backspace at end', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('backspace', false)
      expect(i.currentValue).toBe('Hell')
    })

    it('should handle delete key', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 2
      ;(i as any).handleKey('delete', false)
      expect(i.currentValue).toBe('Helo')
    })

    it('should not delete at end of string', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('delete', false)
      expect(i.currentValue).toBe('Hello')
    })

    it('should handle left arrow', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('left', false)
      expect((i as any)._cursorPosition).toBe(2)
    })

    it('should not go left past start', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 0
      ;(i as any).handleKey('left', false)
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle right arrow', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 2
      ;(i as any).handleKey('right', false)
      expect((i as any)._cursorPosition).toBe(3)
    })

    it('should not go right past end', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('right', false)
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should handle home key', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('home', false)
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle end key', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 0
      ;(i as any).handleKey('end', false)
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should handle enter key and call onSubmit', () => {
      let submitted = ''
      const i = input()
        .value('Test')
        .onSubmit(v => {
          submitted = v
        })
        .focus()
      ;(i as any).handleKey('enter', false)
      expect(submitted).toBe('Test')
    })

    it('should respect maxLength when inserting', () => {
      const i = input().maxLength(5).value('Hell').focus()
      ;(i as any)._cursorPosition = 4
      ;(i as any).handleKey('o', false)
      ;(i as any).handleKey('!', false) // Should be ignored
      expect(i.currentValue).toBe('Hello')
    })

    it('should call onChange when value changes', () => {
      let changed = ''
      const i = input()
        .onChange(v => {
          changed = v
        })
        .focus()
      ;(i as any).handleKey('x', false)
      expect(changed).toBe('x')
    })

    it('should ignore ctrl shortcuts', () => {
      const i = input().value('Hello').focus()
      ;(i as any).handleKey('a', true)
      expect(i.currentValue).toBe('Hello') // No change
    })

    it('should insert at cursor position', () => {
      const i = input().value('Hllo').focus()
      ;(i as any)._cursorPosition = 1
      ;(i as any).handleKey('e', false)
      expect(i.currentValue).toBe('Hello')
    })
  })

  describe('maxLength behavior', () => {
    it('should truncate value when maxLength is reduced', () => {
      const i = input().value('Hello World')
      i.maxLength(5)
      expect(i.currentValue).toBe('Hello')
    })

    it('should clamp cursor when maxLength truncates', () => {
      const i = input().value('Hello World')
      ;(i as any)._cursorPosition = 10
      i.maxLength(5)
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should not truncate initial value from props (values set independently)', () => {
      // Note: Props are set independently in constructor, maxLength doesn't truncate initial value
      const i = input({ value: 'Hello', maxLength: 3 })
      // Value is set as-is, but subsequent operations respect maxLength
      expect(i.currentValue).toBe('Hello')
    })
  })

  describe('password mode rendering', () => {
    it('should render custom mask character', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'secret' }).password(true, '●')

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('●')
    })
  })

  describe('cursor position', () => {
    it('should set cursor to end on initial value', () => {
      const i = input({ value: 'Hello' })
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should clamp cursor when value is changed', () => {
      const i = input().value('Hello World')
      ;(i as any)._cursorPosition = 10
      i.value('Hi')
      expect((i as any)._cursorPosition).toBe(2)
    })
  })

  describe('render edge cases', () => {
    it('should not render with zero width', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'Hello' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 0, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should not render with zero height', () => {
      const buffer = createBuffer(20, 1)
      const i = input({ value: 'Hello' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 20, height: 0 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should truncate long value to fit width', () => {
      const buffer = createBuffer(5, 1)
      const i = input({ value: 'Hello World' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 5, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should only render first 5 characters
      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(4, 0)?.char).toBe('o')
    })

    it('should fill remaining space after short value', () => {
      const buffer = createBuffer(10, 1)
      const i = input({ value: 'Hi' })

      ;(i as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      i.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('i')
      expect(buffer.get(2, 0)?.char).toBe(' ')
    })
  })

  describe('props handling', () => {
    it('should handle all props together', () => {
      const i = input({
        placeholder: 'Enter...',
        value: 'Test',
        password: true,
        passwordChar: '#',
        maxLength: 10,
        width: 30
      })

      expect(i.currentValue).toBe('Test')
      expect((i as any)._layout.width).toBe(30)
    })
  })

  describe('focus state edge cases', () => {
    it('should not re-trigger focus if already focused', () => {
      let focusCount = 0
      const i = input().onFocus(() => {
        focusCount++
      })
      i.focus()
      i.focus()
      expect(focusCount).toBe(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      let blurCount = 0
      const i = input().onBlur(() => {
        blurCount++
      })
      i.blur()
      expect(blurCount).toBe(0)
    })
  })

  describe('handler cleanup', () => {
    it('should remove onChange handler with offChange', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const i = input().onChange(handler).focus()
      ;(i as any).handleKey('a', false)
      expect(callCount).toBe(1)

      i.offChange(handler)
      ;(i as any).handleKey('b', false)
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onSubmit handler with offSubmit', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const i = input().onSubmit(handler).focus()
      ;(i as any).handleKey('enter', false)
      expect(callCount).toBe(1)

      i.offSubmit(handler)
      ;(i as any).handleKey('enter', false)
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onFocus handler with offFocus', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const i = input().onFocus(handler)
      i.focus()
      expect(callCount).toBe(1)

      i.offFocus(handler)
      i.focus()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const i = input().onBlur(handler)
      i.focus()
      i.blur()
      expect(callCount).toBe(1)

      i.offBlur(handler)
      i.focus()
      i.blur()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      let changeCount = 0
      let submitCount = 0
      let focusCount = 0
      let blurCount = 0

      const i = input()
        .onChange(() => changeCount++)
        .onSubmit(() => submitCount++)
        .onFocus(() => focusCount++)
        .onBlur(() => blurCount++)

      i.focus()
      ;(i as any).handleKey('a', false)
      ;(i as any).handleKey('enter', false)
      i.blur()

      expect(changeCount).toBe(1)
      expect(submitCount).toBe(1)
      expect(focusCount).toBe(1)
      expect(blurCount).toBe(1)

      i.clearHandlers()

      i.focus()
      ;(i as any).handleKey('b', false)
      ;(i as any).handleKey('enter', false)
      i.blur()

      // Counts should not increase
      expect(changeCount).toBe(1)
      expect(submitCount).toBe(1)
      expect(focusCount).toBe(1)
      expect(blurCount).toBe(1)
    })

    it('should return this for chaining cleanup methods', () => {
      const i = input()
      const handler = () => {}
      expect(i.offChange(handler)).toBe(i)
      expect(i.offSubmit(handler)).toBe(i)
      expect(i.offFocus(handler)).toBe(i)
      expect(i.offBlur(handler)).toBe(i)
      expect(i.clearHandlers()).toBe(i)
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      let changeCount = 0
      const handler = () => changeCount++

      const i = input().onChange(handler).focus()
      ;(i as any).handleKey('a', false)
      expect(changeCount).toBe(1)

      i.dispose()
      ;(i as any).handleKey('b', false)
      expect(changeCount).toBe(1) // Should not increase after dispose
    })

    it('should not trigger focus/blur after dispose', () => {
      let focusCount = 0
      let blurCount = 0

      const i = input()
        .onFocus(() => focusCount++)
        .onBlur(() => blurCount++)

      i.dispose()
      i.focus()
      i.blur()

      expect(focusCount).toBe(0)
      expect(blurCount).toBe(0)
    })
  })

  describe('Ctrl+key shortcuts', () => {
    it('should handle Ctrl+A (select all - move to end)', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 2
      ;(i as any).handleKey('a', true)
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should handle Ctrl+U (clear from cursor to start)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 6
      ;(i as any).handleKey('u', true)
      expect(i.currentValue).toBe('World')
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle Ctrl+K (clear from cursor to end)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('k', true)
      expect(i.currentValue).toBe('Hello')
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should handle Ctrl+W (delete word backward)', () => {
      const i = input().value('Hello World Test').focus()
      ;(i as any)._cursorPosition = 12
      ;(i as any).handleKey('w', true)
      expect(i.currentValue).toBe('Hello Test')
    })

    it('should handle Ctrl+Backspace (same as Ctrl+W)', () => {
      const i = input().value('Hello World Test').focus()
      ;(i as any)._cursorPosition = 12
      ;(i as any).handleKey('backspace', true)
      expect(i.currentValue).toBe('Hello Test')
    })

    it('should handle Ctrl+Left (move cursor one word left)', () => {
      const i = input().value('Hello World Test').focus()
      ;(i as any)._cursorPosition = 12
      ;(i as any).handleKey('left', true)
      expect((i as any)._cursorPosition).toBe(6)
    })

    it('should handle Ctrl+Right (move cursor one word right)', () => {
      const i = input().value('Hello World Test').focus()
      ;(i as any)._cursorPosition = 6
      ;(i as any).handleKey('right', true)
      // Moves to start of "Test" at position 12 (after "Hello World ")
      expect((i as any)._cursorPosition).toBe(12)
    })

    it('should handle Ctrl+Home (go to start)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('home', true)
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle Ctrl+E (go to start - bash style)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('e', true)
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle Ctrl+End (go to end)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('end', true)
      // "Hello World" has length 11
      expect((i as any)._cursorPosition).toBe(11)
    })

    it('should handle Ctrl+F (go to end - bash style)', () => {
      const i = input().value('Hello World').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('f', true)
      // "Hello World" has length 11
      expect((i as any)._cursorPosition).toBe(11)
    })

    it('should handle Ctrl+D (delete character at cursor)', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 2
      ;(i as any).handleKey('d', true)
      expect(i.currentValue).toBe('Helo')
      expect((i as any)._cursorPosition).toBe(2)
    })

    it('should handle Ctrl+H (delete character before cursor)', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 3
      ;(i as any).handleKey('h', true)
      expect(i.currentValue).toBe('Helo')
      expect((i as any)._cursorPosition).toBe(2)
    })
  })

  describe('maxLength edge cases', () => {
    it('should handle NaN maxLength', () => {
      const i = input().maxLength(NaN)
      expect(i.currentValue).toBe('')
      // NaN becomes Infinity (unlimited) after validation
      i.value('Hello')
      expect(i.currentValue).toBe('Hello') // No limit, value preserved
    })

    it('should handle negative maxLength', () => {
      const i = input().maxLength(-5)
      // Negative becomes Infinity (unlimited) after validation
      expect(i.currentValue).toBe('')
      i.value('Hello')
      expect(i.currentValue).toBe('Hello') // No limit, value preserved
    })

    it('should handle maxLength with decimal value', () => {
      const i = input().maxLength(5.7)
      i.value('Hello World')
      expect(i.currentValue).toBe('Hello')
    })

    it('should handle infinite maxLength', () => {
      const i = input().maxLength(Infinity)
      // Infinity becomes Infinity (unlimited) after validation
      i.value('A'.repeat(1000))
      expect(i.currentValue).toBe('A'.repeat(1000)) // No limit, value preserved
    })
  })

  describe('ctrl key edge cases', () => {
    it('should handle Ctrl+Left at start of text', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 0
      ;(i as any).handleKey('left', true)
      expect((i as any)._cursorPosition).toBe(0)
    })

    it('should handle Ctrl+Right at end of text', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('right', true)
      expect((i as any)._cursorPosition).toBe(5)
    })

    it('should handle Ctrl+U when cursor at start', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 0
      ;(i as any).handleKey('u', true)
      expect(i.currentValue).toBe('Hello')
    })

    it('should handle Ctrl+K when cursor at end', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('k', true)
      expect(i.currentValue).toBe('Hello')
    })

    it('should handle Ctrl+W with only one word', () => {
      const i = input().value('Hello').focus()
      ;(i as any)._cursorPosition = 5
      ;(i as any).handleKey('w', true)
      expect(i.currentValue).toBe('')
    })
  })
})
