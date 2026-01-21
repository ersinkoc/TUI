/**
 * @oxog/tui - Select Widget Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { select } from '../../src/widgets/select'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Select Widget', () => {
  const testOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' }
  ]

  describe('factory function', () => {
    it('should create select node', () => {
      const s = select()
      expect(s).toBeDefined()
      expect(s.type).toBe('select')
    })

    it('should create select with initial options via props', () => {
      const s = select({ options: testOptions })
      expect(s.selectedItem).toEqual(testOptions[0])
    })

    it('should create select with initial selected index', () => {
      const s = select({ options: testOptions, selected: 1 })
      expect(s.selectedIndex).toBe(1)
      expect(s.selectedItem).toEqual(testOptions[1])
    })

    it('should create select with maxVisible', () => {
      const s = select({ maxVisible: 5 })
      expect(s).toBeDefined()
    })

    it('should create select with dimensions', () => {
      const s = select({ width: 30, height: 10 })
      expect(s).toBeDefined()
    })
  })

  describe('options()', () => {
    it('should set options', () => {
      const s = select().options(testOptions)
      expect(s.selectedItem).toEqual(testOptions[0])
    })

    it('should return this for chaining', () => {
      const s = select()
      expect(s.options(testOptions)).toBe(s)
    })

    it('should clamp selected index when options change', () => {
      const s = select()
        .options(testOptions)
        .selected(2)
        .options([{ label: 'Single', value: '1' }])
      expect(s.selectedIndex).toBe(0)
    })

    it('should mark dirty when options change', () => {
      const s = select().options(testOptions)
      s.clearDirty()
      s.options([{ label: 'New', value: 'new' }])
      expect((s as any)._dirty).toBe(true)
    })
  })

  describe('selected()', () => {
    it('should set selected index', () => {
      const s = select().options(testOptions).selected(1)
      expect(s.selectedIndex).toBe(1)
    })

    it('should return this for chaining', () => {
      const s = select().options(testOptions)
      expect(s.selected(1)).toBe(s)
    })

    it('should clamp to valid range (lower bound)', () => {
      const s = select().options(testOptions).selected(-5)
      expect(s.selectedIndex).toBe(0)
    })

    it('should clamp to valid range (upper bound)', () => {
      const s = select().options(testOptions).selected(100)
      expect(s.selectedIndex).toBe(2)
    })

    it('should mark dirty when selection changes', () => {
      const s = select().options(testOptions)
      s.clearDirty()
      s.selected(1)
      expect((s as any)._dirty).toBe(true)
    })

    it('should not mark dirty when selection stays the same', () => {
      const s = select().options(testOptions).selected(0)
      s.clearDirty()
      s.selected(0)
      expect((s as any)._dirty).toBe(false)
    })
  })

  describe('maxVisible()', () => {
    it('should set max visible count', () => {
      const s = select().maxVisible(5)
      expect(s).toBeDefined()
    })

    it('should return this for chaining', () => {
      const s = select()
      expect(s.maxVisible(5)).toBe(s)
    })

    it('should mark dirty when changed', () => {
      const s = select()
      s.clearDirty()
      s.maxVisible(5)
      expect((s as any)._dirty).toBe(true)
    })
  })

  describe('width() and height()', () => {
    it('should set width', () => {
      const s = select().width(30)
      expect(s).toBeDefined()
    })

    it('should set height', () => {
      const s = select().height(10)
      expect(s).toBeDefined()
    })

    it('should return this for chaining', () => {
      const s = select()
      expect(s.width(30)).toBe(s)
      expect(s.height(10)).toBe(s)
    })

    it('should accept percentage dimensions', () => {
      const s = select().width('50%').height('100%')
      expect(s).toBeDefined()
    })
  })

  describe('selectedIndex and selectedItem', () => {
    it('should return current selected index', () => {
      const s = select().options(testOptions).selected(1)
      expect(s.selectedIndex).toBe(1)
    })

    it('should return current selected item', () => {
      const s = select().options(testOptions).selected(2)
      expect(s.selectedItem).toEqual(testOptions[2])
    })

    it('should return undefined for empty options', () => {
      const s = select()
      expect(s.selectedItem).toBeUndefined()
    })
  })

  describe('focus() and blur()', () => {
    it('should focus the select', () => {
      const s = select()
      s.focus()
      expect(s.isFocused).toBe(true)
    })

    it('should blur the select', () => {
      const s = select()
      s.focus()
      s.blur()
      expect(s.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const s = select()
      expect(s.focus()).toBe(s)
      expect(s.blur()).toBe(s)
    })

    it('should mark dirty when focus changes', () => {
      const s = select()
      s.clearDirty()
      s.focus()
      expect((s as any)._dirty).toBe(true)
    })

    it('should not re-trigger focus if already focused', () => {
      const handler = vi.fn()
      const s = select().onFocus(handler)
      s.focus()
      s.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      const handler = vi.fn()
      const s = select().onBlur(handler)
      s.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('selectNext() should move to next option', () => {
      const s = select().options(testOptions).selected(0)
      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(1)
    })

    it('selectNext() should not go past last option', () => {
      const s = select().options(testOptions).selected(2)
      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(2)
    })

    it('selectPrevious() should move to previous option', () => {
      const s = select().options(testOptions).selected(2)
      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(1)
    })

    it('selectPrevious() should not go past first option', () => {
      const s = select().options(testOptions).selected(0)
      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(0)
    })

    it('should skip disabled options when navigating next', () => {
      const optionsWithDisabled = [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2', disabled: true },
        { label: 'Option 3', value: '3' }
      ]
      const s = select().options(optionsWithDisabled).selected(0)
      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(2)
    })

    it('should skip disabled options when navigating previous', () => {
      const optionsWithDisabled = [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2', disabled: true },
        { label: 'Option 3', value: '3' }
      ]
      const s = select().options(optionsWithDisabled).selected(2)
      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(0)
    })
  })

  describe('confirm()', () => {
    it('should call onSelect handlers', () => {
      const handler = vi.fn()
      const s = select().options(testOptions).onSelect(handler)
      ;(s as any).confirm()
      expect(handler).toHaveBeenCalledWith(testOptions[0], 0)
    })

    it('should not call onSelect for disabled options', () => {
      const handler = vi.fn()
      const s = select()
        .options([{ label: 'Disabled', value: '1', disabled: true }])
        .onSelect(handler)
      ;(s as any).confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('onSelect() should register handler', () => {
      const handler = vi.fn()
      const s = select().options(testOptions).onSelect(handler)
      ;(s as any).confirm()
      expect(handler).toHaveBeenCalledWith(testOptions[0], 0)
    })

    it('onChange() should be called when selection changes', () => {
      const handler = vi.fn()
      const s = select().options(testOptions).onChange(handler)
      s.selected(1)
      expect(handler).toHaveBeenCalledWith(testOptions[1], 1)
    })

    it('onChange() should be called on navigation', () => {
      const handler = vi.fn()
      const s = select().options(testOptions).onChange(handler)
      s.clearDirty()
      ;(s as any).selectNext()
      expect(handler).toHaveBeenCalledWith(testOptions[1], 1)
    })

    it('onFocus() should be called when focused', () => {
      const handler = vi.fn()
      const s = select().onFocus(handler)
      s.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('onBlur() should be called when blurred', () => {
      const handler = vi.fn()
      const s = select().onBlur(handler)
      s.focus()
      s.blur()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = select().options(testOptions).onChange(handler1).onChange(handler2)
      s.selected(1)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('handlers should return this for chaining', () => {
      const s = select()
      expect(s.onSelect(() => {})).toBe(s)
      expect(s.onChange(() => {})).toBe(s)
      expect(s.onFocus(() => {})).toBe(s)
      expect(s.onBlur(() => {})).toBe(s)
    })
  })

  describe('render()', () => {
    it('should render options to buffer', () => {
      const s = select().options(testOptions)
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check that first option is rendered
      const firstChar = buffer.get(0, 0)
      expect(firstChar).toBeDefined()
    })

    it('should not render when not visible', () => {
      const s = select().options(testOptions).visible(false)
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Buffer should remain empty (space characters)
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should show indicator for focused and selected item', () => {
      const s = select().options(testOptions).focus()
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First two chars should be indicator "> "
      expect(buffer.get(0, 0)?.char).toBe('>')
      expect(buffer.get(1, 0)?.char).toBe(' ')
    })

    it('should not show indicator when not focused', () => {
      const s = select().options(testOptions)
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First two chars should be spaces (no indicator)
      expect(buffer.get(0, 0)?.char).toBe(' ')
      expect(buffer.get(1, 0)?.char).toBe(' ')
    })

    it('should handle empty options', () => {
      const s = select()
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      expect(() => s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should not render with zero dimensions', () => {
      const s = select().options(testOptions)
      ;(s as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Should not throw and buffer should be unchanged
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should truncate long option labels', () => {
      const longOptions = [
        { label: 'This is a very long option label that should be truncated', value: '1' }
      ]
      const s = select().options(longOptions)
      // Width 12 means 10 chars for content after "  " indicator
      ;(s as any)._bounds = { x: 0, y: 0, width: 12, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Label should be truncated - verify it rendered without error
      expect(buffer.get(0, 0)?.char).toBe(' ')
      expect(buffer.get(2, 0)?.char).toBe('T') // Start of "This..."
    })

    it('should render disabled options with dim attribute', () => {
      const optionsWithDisabled = [{ label: 'Disabled Option', value: '1', disabled: true }]
      const s = select().options(optionsWithDisabled)
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }

      const buffer = createBuffer(20, 5)
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check that the cell has ATTR_DIM (value is 8)
      const cell = buffer.get(0, 0)
      expect(cell?.attrs).toBe(8) // ATTR_DIM
    })
  })

  describe('scrolling', () => {
    it('should scroll when selection goes below visible area', () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: String(i + 1)
      }))

      const s = select().options(manyOptions).maxVisible(5)

      // Move selection down past visible area
      for (let i = 0; i < 10; i++) {
        ;(s as any).selectNext()
      }

      expect(s.selectedIndex).toBe(10)
    })

    it('should scroll when selection goes above visible area', () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: String(i + 1)
      }))

      const s = select().options(manyOptions).maxVisible(5).selected(15)

      // Move selection up past visible area
      for (let i = 0; i < 10; i++) {
        ;(s as any).selectPrevious()
      }

      expect(s.selectedIndex).toBe(5)
    })
  })

  describe('generic type support', () => {
    interface CustomOption {
      label: string
      value: string
      icon?: string
    }

    it('should work with custom option types', () => {
      const customOptions: CustomOption[] = [
        { label: 'New', value: 'new', icon: '+' },
        { label: 'Open', value: 'open', icon: 'O' }
      ]

      const s = select<CustomOption>().options(customOptions)
      expect(s.selectedItem?.icon).toBe('+')
    })

    it('should pass custom type to handlers', () => {
      const customOptions: CustomOption[] = [{ label: 'New', value: 'new', icon: '+' }]

      let receivedItem: CustomOption | undefined
      const s = select<CustomOption>()
        .options(customOptions)
        .onSelect(item => {
          receivedItem = item
        })

      ;(s as any).confirm()
      expect(receivedItem?.icon).toBe('+')
    })
  })

  describe('chainable API', () => {
    it('should support full chaining', () => {
      const result = select()
        .options(testOptions)
        .selected(1)
        .maxVisible(5)
        .width(30)
        .height(10)
        .onSelect(() => {})
        .onChange(() => {})
        .onFocus(() => {})
        .onBlur(() => {})
        .focus()

      expect(result.selectedIndex).toBe(1)
      expect(result.isFocused).toBe(true)
    })
  })

  describe('dirty flag', () => {
    it('should start dirty', () => {
      const s = select()
      expect((s as any)._dirty).toBe(true)
    })

    it('should be clearable', () => {
      const s = select()
      s.clearDirty()
      expect((s as any)._dirty).toBe(false)
    })

    it('should become dirty on options change', () => {
      const s = select()
      s.clearDirty()
      s.options(testOptions)
      expect((s as any)._dirty).toBe(true)
    })

    it('should become dirty on selection change', () => {
      const s = select().options(testOptions)
      s.clearDirty()
      s.selected(1)
      expect((s as any)._dirty).toBe(true)
    })

    it('should become dirty on focus change', () => {
      const s = select()
      s.clearDirty()
      s.focus()
      expect((s as any)._dirty).toBe(true)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const s = select()
      expect(s.isVisible).toBe(true)
    })

    it('should be hideable', () => {
      const s = select().visible(false)
      expect(s.isVisible).toBe(false)
    })

    it('should be showable after hiding', () => {
      const s = select().visible(false).visible(true)
      expect(s.isVisible).toBe(true)
    })
  })

  describe('handler cleanup', () => {
    it('should remove onSelect handler with offSelect', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const s = select().options(testOptions).onSelect(handler)

      ;(s as any).confirm()
      expect(callCount).toBe(1)

      s.offSelect(handler)
      ;(s as any).confirm()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onSelect handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = select().options(testOptions).onSelect(handler1).onSelect(handler2)

      ;(s as any).confirm()
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      s.offSelect(handler1)
      ;(s as any).confirm()
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should be chainable after offSelect', () => {
      const s = select()
      const handler = vi.fn()
      const result = s.onSelect(handler).offSelect(handler)
      expect(result).toBe(s)
    })

    it('should handle offSelect with non-existent handler gracefully', () => {
      const s = select()
      const handler = vi.fn()
      expect(() => s.offSelect(handler)).not.toThrow()
    })

    it('should remove onChange handler with offChange', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const s = select().options(testOptions).onChange(handler)

      s.selected(1)
      expect(callCount).toBe(1)

      s.offChange(handler)
      s.selected(2)
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onChange handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const s = select().options(testOptions).onChange(handler1).onChange(handler2)

      s.selected(1)
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      s.offChange(handler1)
      s.selected(2)
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should remove onFocus handler with offFocus', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const s = select().onFocus(handler)

      s.focus()
      expect(callCount).toBe(1)

      s.offFocus(handler)
      s.blur() // Reset focus
      s.focus()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const s = select().onBlur(handler)

      s.focus()
      s.blur()
      expect(callCount).toBe(1)

      s.offBlur(handler)
      s.focus()
      s.blur()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const selectHandler = vi.fn()
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const s = select()
        .options(testOptions)
        .onSelect(selectHandler)
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      s.clearHandlers()

      ;(s as any).confirm()
      s.selected(1)
      s.focus()
      s.blur()

      expect(selectHandler).not.toHaveBeenCalled()
      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should be chainable after clearHandlers', () => {
      const s = select()
      const result = s.onSelect(vi.fn()).clearHandlers()
      expect(result).toBe(s)
    })

    it('should allow adding handlers after clearHandlers', () => {
      const handler = vi.fn()
      const s = select()
        .options(testOptions)
        .onSelect(vi.fn())
        .clearHandlers()
        .onSelect(handler)

      ;(s as any).confirm()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const selectHandler = vi.fn()
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const s = select()
        .options(testOptions)
        .onSelect(selectHandler)
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      s.dispose()

      ;(s as any).confirm()
      s.selected(1)
      s.focus()
      s.blur()

      expect(selectHandler).not.toHaveBeenCalled()
      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should clear options on dispose', () => {
      const s = select().options(testOptions)
      s.dispose()
      expect(s.selectedItem).toBeUndefined()
    })

    it('should mark as disposed on dispose', () => {
      const s = select()
      s.dispose()
      expect((s as any)._disposed).toBe(true)
    })

    it('should not throw when disposing already disposed select', () => {
      const s = select()
      s.dispose()
      expect(() => s.dispose()).not.toThrow()
    })

    it('should not focus when disposed', () => {
      const handler = vi.fn()
      const s = select().onFocus(handler)
      s.dispose()

      s.focus()
      expect(handler).not.toHaveBeenCalled()
      expect(s.isFocused).toBe(false)
    })
  })

  describe('navigation edge cases', () => {
    it('should not move when all options are disabled (selectNext)', () => {
      const allDisabled = [
        { label: 'Opt 1', value: '1', disabled: true },
        { label: 'Opt 2', value: '2', disabled: true },
        { label: 'Opt 3', value: '3', disabled: true }
      ]
      const s = select().options(allDisabled).selected(0)

      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(0)
    })

    it('should not move when all options are disabled (selectPrevious)', () => {
      const allDisabled = [
        { label: 'Opt 1', value: '1', disabled: true },
        { label: 'Opt 2', value: '2', disabled: true },
        { label: 'Opt 3', value: '3', disabled: true }
      ]
      const s = select().options(allDisabled).selected(2)

      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(2)
    })

    it('should handle alternating disabled options correctly', () => {
      const alternating = [
        { label: 'Opt 1', value: '1', disabled: true },
        { label: 'Opt 2', value: '2', disabled: false },
        { label: 'Opt 3', value: '3', disabled: true },
        { label: 'Opt 4', value: '4', disabled: false }
      ]
      const s = select().options(alternating).selected(0)

      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(1) // Skips to Opt 2
    })

    it('should handle navigation with only one enabled option', () => {
      const oneEnabled = [
        { label: 'Opt 1', value: '1', disabled: true },
        { label: 'Opt 2', value: '2', disabled: false },
        { label: 'Opt 3', value: '3', disabled: true }
      ]
      const s = select().options(oneEnabled).selected(1)

      ;(s as any).selectNext()
      expect(s.selectedIndex).toBe(1) // Stays at Opt 2

      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(1) // Stays at Opt 2
    })
  })

  describe('edge cases', () => {
    it('should handle empty options array', () => {
      const s = select().options([])
      expect(s.selectedItem).toBeUndefined()
      expect(s.selectedIndex).toBe(0)
    })

    it('should handle selecting when options are empty', () => {
      const s = select().options([])
      s.selected(5)
      expect(s.selectedIndex).toBe(0)
    })

    it('should handle confirm when no item is selected', () => {
      const handler = vi.fn()
      const s = select().onSelect(handler)

      ;(s as any).confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle changing options to empty array', () => {
      const s = select().options(testOptions).selected(2)
      s.options([])
      expect(s.selectedIndex).toBe(0)
      expect(s.selectedItem).toBeUndefined()
    })

    it('should handle changing options from empty to populated', () => {
      const s = select().options([])
      s.options(testOptions)
      expect(s.selectedIndex).toBe(0)
      expect(s.selectedItem).toEqual(testOptions[0])
    })

    it('should not emit change when selecting same index', () => {
      const handler = vi.fn()
      const s = select().options(testOptions).onChange(handler)

      s.selected(0) // Already at 0
      expect(handler).not.toHaveBeenCalled()
    })

    it('should ensureVisible is called on selection change', () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: String(i + 1)
      }))

      const s = select().options(manyOptions).maxVisible(5)
      s.selected(10)

      // Should not throw, scrollOffset should be adjusted
      expect(s.selectedIndex).toBe(10)
    })

    it('should handle options with null/undefined values gracefully', () => {
      // Options can have optional disabled property
      const s = select().options([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' }
      ])

      expect(() => {
        ;(s as any).selectNext()
        ;(s as any).selectPrevious()
      }).not.toThrow()
    })

    it('should handle options with extra properties', () => {
      interface ExtendedOption {
        label: string
        value: string
        disabled?: boolean
        extra?: string
      }

      const extendedOptions: ExtendedOption[] = [
        { label: 'A', value: 'a', extra: 'foo' },
        { label: 'B', value: 'b', extra: 'bar' }
      ]

      const s = select<ExtendedOption>().options(extendedOptions)
      expect(s.selectedItem?.extra).toBe('foo')
    })

    it('should handle confirm when current item is disabled', () => {
      const handler = vi.fn()
      const s = select()
        .options([{ label: 'Disabled', value: '1', disabled: true }])
        .onSelect(handler)

      ;(s as any).confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle navigation at boundaries with disabled items', () => {
      const options = [
        { label: 'Opt 1', value: '1', disabled: true },
        { label: 'Opt 2', value: '2' },
        { label: 'Opt 3', value: '3' }
      ]
      const s = select().options(options).selected(2)

      // Going back should skip disabled Opt 1
      ;(s as any).selectPrevious()
      expect(s.selectedIndex).toBe(1)
    })
  })
})
