/**
 * @oxog/tui - Tabs Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { tabs } from '../../src/widgets/tabs'
import { text } from '../../src/widgets/text'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Tabs Widget', () => {
  // Factory function to create fresh test tabs for each test
  const createTestTabs = () => [
    { label: 'Home', content: text('Welcome') },
    { label: 'Settings', content: text('Settings') },
    { label: 'About', content: text('About') }
  ]

  describe('factory function', () => {
    it('should create tabs node', () => {
      const t = tabs()
      expect(t).toBeDefined()
      expect(t.type).toBe('tabs')
    })

    it('should create tabs with initial items via props', () => {
      const t = tabs({ tabs: createTestTabs() })
      expect(t.tabCount).toBe(3)
    })

    it('should create tabs with selected index', () => {
      const t = tabs({ tabs: createTestTabs(), selected: 1 })
      expect(t.selectedIndex).toBe(1)
    })

    it('should create tabs with position', () => {
      const t = tabs({ position: 'bottom' })
      expect(t).toBeDefined()
    })

    it('should create tabs with dimensions', () => {
      const t = tabs({ width: 60, height: 20 })
      expect(t).toBeDefined()
    })
  })

  describe('tabs()', () => {
    it('should set tabs', () => {
      const t = tabs().tabs(createTestTabs())
      expect(t.tabCount).toBe(3)
    })

    it('should return this for chaining', () => {
      const t = tabs()
      expect(t.tabs(createTestTabs())).toBe(t)
    })

    it('should clamp selected index when tabs change', () => {
      const t = tabs().tabs(createTestTabs()).selected(2)
      t.tabs([{ label: 'Only', content: text('Only') }])
      expect(t.selectedIndex).toBe(0)
    })

    it('should mark dirty when tabs change', () => {
      const t = tabs()
      t.clearDirty()
      t.tabs(createTestTabs())
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('addTab()', () => {
    it('should add a tab', () => {
      const t = tabs().tabs(createTestTabs())
      t.addTab({ label: 'New', content: text('New') })
      expect(t.tabCount).toBe(4)
    })

    it('should return this for chaining', () => {
      const t = tabs()
      expect(t.addTab({ label: 'Tab', content: text('Tab') })).toBe(t)
    })

    it('should mark dirty when tab added', () => {
      const t = tabs()
      t.clearDirty()
      t.addTab({ label: 'Tab', content: text('Tab') })
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('removeTab()', () => {
    it('should remove a tab', () => {
      const t = tabs().tabs(createTestTabs())
      t.removeTab(1)
      expect(t.tabCount).toBe(2)
    })

    it('should return this for chaining', () => {
      const t = tabs().tabs(createTestTabs())
      expect(t.removeTab(0)).toBe(t)
    })

    it('should adjust selected index when removing', () => {
      const t = tabs().tabs(createTestTabs()).selected(2)
      t.removeTab(2)
      expect(t.selectedIndex).toBe(1)
    })

    it('should not remove invalid index', () => {
      const t = tabs().tabs(createTestTabs())
      t.removeTab(-1)
      t.removeTab(100)
      expect(t.tabCount).toBe(3)
    })

    it('should mark dirty when tab removed', () => {
      const t = tabs().tabs(createTestTabs())
      t.clearDirty()
      t.removeTab(0)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('selected()', () => {
    it('should set selected index', () => {
      const t = tabs().tabs(createTestTabs()).selected(1)
      expect(t.selectedIndex).toBe(1)
    })

    it('should return this for chaining', () => {
      const t = tabs().tabs(createTestTabs())
      expect(t.selected(1)).toBe(t)
    })

    it('should clamp to valid range (lower bound)', () => {
      const t = tabs().tabs(createTestTabs()).selected(-5)
      expect(t.selectedIndex).toBe(0)
    })

    it('should clamp to valid range (upper bound)', () => {
      const t = tabs().tabs(createTestTabs()).selected(100)
      expect(t.selectedIndex).toBe(2)
    })

    it('should mark dirty when selection changes', () => {
      const t = tabs().tabs(createTestTabs())
      t.clearDirty()
      t.selected(1)
      expect((t as any)._dirty).toBe(true)
    })

    it('should not mark dirty when selection stays the same', () => {
      const t = tabs().tabs(createTestTabs()).selected(0)
      t.clearDirty()
      t.selected(0)
      expect((t as any)._dirty).toBe(false)
    })
  })

  describe('position()', () => {
    it('should set position to top', () => {
      const t = tabs().position('top')
      expect(t).toBeDefined()
    })

    it('should set position to bottom', () => {
      const t = tabs().position('bottom')
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = tabs()
      expect(t.position('top')).toBe(t)
    })

    it('should mark dirty when position changes', () => {
      const t = tabs()
      t.clearDirty()
      t.position('bottom')
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('width() and height()', () => {
    it('should set width', () => {
      const t = tabs().width(60)
      expect(t).toBeDefined()
    })

    it('should set height', () => {
      const t = tabs().height(20)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = tabs()
      expect(t.width(60)).toBe(t)
      expect(t.height(20)).toBe(t)
    })

    it('should accept percentage dimensions', () => {
      const t = tabs().width('100%').height('50%')
      expect(t).toBeDefined()
    })
  })

  describe('selectedIndex and selectedTab', () => {
    it('should return selected index', () => {
      const t = tabs().tabs(createTestTabs()).selected(1)
      expect(t.selectedIndex).toBe(1)
    })

    it('should return selected tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(1)
      expect(t.selectedTab?.label).toBe('Settings')
    })

    it('should return undefined for empty tabs', () => {
      const t = tabs()
      expect(t.selectedTab).toBeUndefined()
    })
  })

  describe('tabCount', () => {
    it('should return number of tabs', () => {
      const t = tabs().tabs(createTestTabs())
      expect(t.tabCount).toBe(3)
    })

    it('should return 0 for empty tabs', () => {
      const t = tabs()
      expect(t.tabCount).toBe(0)
    })
  })

  describe('focus() and blur()', () => {
    it('should focus the tabs', () => {
      const t = tabs()
      t.focus()
      expect(t.isFocused).toBe(true)
    })

    it('should blur the tabs', () => {
      const t = tabs()
      t.focus()
      t.blur()
      expect(t.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = tabs()
      expect(t.focus()).toBe(t)
      expect(t.blur()).toBe(t)
    })

    it('should mark dirty when focus changes', () => {
      const t = tabs()
      t.clearDirty()
      t.focus()
      expect((t as any)._dirty).toBe(true)
    })

    it('should not re-trigger focus if already focused', () => {
      const handler = vi.fn()
      const t = tabs().onFocus(handler)
      t.focus()
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      const handler = vi.fn()
      const t = tabs().onBlur(handler)
      t.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('selectNext() should move to next tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(0)
      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(1)
    })

    it('selectNext() should not go past last tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(2)
      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(2)
    })

    it('selectPrevious() should move to previous tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(2)
      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(1)
    })

    it('selectPrevious() should not go past first tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(0)
      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(0)
    })

    it('should skip disabled tabs when navigating next', () => {
      const tabsWithDisabled = [
        { label: 'Tab 1', content: text('1') },
        { label: 'Tab 2', content: text('2'), disabled: true },
        { label: 'Tab 3', content: text('3') }
      ]
      const t = tabs().tabs(tabsWithDisabled).selected(0)
      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(2)
    })

    it('should skip disabled tabs when navigating previous', () => {
      const tabsWithDisabled = [
        { label: 'Tab 1', content: text('1') },
        { label: 'Tab 2', content: text('2'), disabled: true },
        { label: 'Tab 3', content: text('3') }
      ]
      const t = tabs().tabs(tabsWithDisabled).selected(2)
      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(0)
    })
  })

  describe('event handlers', () => {
    it('onChange() should be called when selection changes', () => {
      const handler = vi.fn()
      const t = tabs().tabs(createTestTabs()).onChange(handler)
      t.selected(1)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].label).toBe('Settings')
      expect(handler.mock.calls[0][1]).toBe(1)
    })

    it('onChange() should be called on navigation', () => {
      const handler = vi.fn()
      const t = tabs().tabs(createTestTabs()).onChange(handler)
      ;(t as any).selectNext()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].label).toBe('Settings')
      expect(handler.mock.calls[0][1]).toBe(1)
    })

    it('onFocus() should be called when focused', () => {
      const handler = vi.fn()
      const t = tabs().onFocus(handler)
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('onBlur() should be called when blurred', () => {
      const handler = vi.fn()
      const t = tabs().onBlur(handler)
      t.focus()
      t.blur()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = tabs().tabs(createTestTabs()).onChange(handler1).onChange(handler2)
      t.selected(1)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('handlers should return this for chaining', () => {
      const t = tabs()
      expect(t.onChange(() => {})).toBe(t)
      expect(t.onFocus(() => {})).toBe(t)
      expect(t.onBlur(() => {})).toBe(t)
    })
  })

  describe('render()', () => {
    it('should render to buffer', () => {
      const t = tabs().tabs(createTestTabs())
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check that tab bar is rendered
      const firstChar = buffer.get(0, 0)
      expect(firstChar).toBeDefined()
    })

    it('should not render when not visible', () => {
      const t = tabs().tabs(createTestTabs()).visible(false)
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Buffer should remain empty
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should not render with zero dimensions', () => {
      const t = tabs().tabs(createTestTabs())
      ;(t as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should handle empty tabs', () => {
      const t = tabs()
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render tab labels', () => {
      const t = tabs().tabs(createTestTabs())
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First row should have tab labels
      let tabBarText = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) tabBarText += cell.char
      }
      expect(tabBarText).toContain('Home')
    })

    it('should render with bottom position', () => {
      const t = tabs().tabs(createTestTabs()).position('bottom')
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Last row should have tab labels
      let tabBarText = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 9)
        if (cell?.char) tabBarText += cell.char
      }
      expect(tabBarText).toContain('Home')
    })
  })

  describe('chainable API', () => {
    it('should support full chaining', () => {
      const result = tabs()
        .tabs(createTestTabs())
        .addTab({ label: 'Extra', content: text('Extra') })
        .selected(1)
        .position('top')
        .width(60)
        .height(20)
        .onChange(() => {})
        .onFocus(() => {})
        .onBlur(() => {})
        .focus()

      expect(result.selectedIndex).toBe(1)
      expect(result.isFocused).toBe(true)
      expect(result.tabCount).toBe(4)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const t = tabs()
      expect(t.isVisible).toBe(true)
    })

    it('should be hideable', () => {
      const t = tabs().visible(false)
      expect(t.isVisible).toBe(false)
    })

    it('should be showable after hiding', () => {
      const t = tabs().visible(false).visible(true)
      expect(t.isVisible).toBe(true)
    })
  })

  describe('disabled tabs', () => {
    it('should handle disabled tabs', () => {
      const tabsWithDisabled = [
        { label: 'Active', content: text('Active') },
        { label: 'Disabled', content: text('Disabled'), disabled: true }
      ]
      const t = tabs().tabs(tabsWithDisabled)
      expect(t.tabCount).toBe(2)
    })

    it('should render disabled tabs with dim attribute', () => {
      const tabsWithDisabled = [
        { label: 'Active', content: text('Active') },
        { label: 'Disabled', content: text('Disabled'), disabled: true }
      ]
      const t = tabs().tabs(tabsWithDisabled).selected(0)
      ;(t as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      const buffer = createBuffer(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Second tab (Disabled) should have ATTR_DIM (8)
      // First tab " Active " is 8 chars + separator │ = position 9
      const disabledTabCell = buffer.get(10, 0)
      expect(disabledTabCell?.attrs).toBe(8) // ATTR_DIM
    })
  })

  describe('tab label rendering', () => {
    it('should truncate long tab labels when width is limited', () => {
      const longTabs = [
        { label: 'This is a very long tab label that needs truncation', content: text('Content') },
        { label: 'Another long tab label', content: text('Content') }
      ]
      const t = tabs().tabs(longTabs)
      // Very narrow width forces truncation
      ;(t as any)._bounds = { x: 0, y: 0, width: 15, height: 10 }

      const buffer = createBuffer(20, 10)
      // Should not throw and labels should be truncated
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render focused selected tab with inverse and bold attributes', () => {
      const t = tabs().tabs(createTestTabs()).focus()
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First tab (Home) is selected and focused
      // " Home " starts at position 0, char 'H' is at position 1
      const selectedTabCell = buffer.get(1, 0)
      // ATTR_INVERSE (32) | ATTR_BOLD (1) = 33
      expect(selectedTabCell?.attrs).toBe(33)
    })
  })

  describe('handler cleanup', () => {
    it('should remove onChange handler with offChange', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const t = tabs().tabs(createTestTabs()).onChange(handler)

      t.selected(1)
      expect(callCount).toBe(1)

      t.offChange(handler)
      t.selected(2)
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onChange handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = tabs().tabs(createTestTabs()).onChange(handler1).onChange(handler2)

      t.selected(1)
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      t.offChange(handler1)
      t.selected(2)
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should be chainable after offChange', () => {
      const t = tabs()
      const handler = vi.fn()
      const result = t.onChange(handler).offChange(handler)
      expect(result).toBe(t)
    })

    it('should handle offChange with non-existent handler gracefully', () => {
      const t = tabs()
      const handler = vi.fn()
      expect(() => t.offChange(handler)).not.toThrow()
    })

    it('should remove onFocus handler with offFocus', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const t = tabs().onFocus(handler)

      t.focus()
      expect(callCount).toBe(1)

      t.offFocus(handler)
      t.blur() // Reset focus
      t.focus()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const t = tabs().onBlur(handler)

      t.focus()
      t.blur()
      expect(callCount).toBe(1)

      t.offBlur(handler)
      t.focus()
      t.blur()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const t = tabs()
        .tabs(createTestTabs())
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      t.clearHandlers()

      t.selected(1)
      t.focus()
      t.blur()

      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should be chainable after clearHandlers', () => {
      const t = tabs()
      const result = t.onChange(vi.fn()).clearHandlers()
      expect(result).toBe(t)
    })

    it('should allow adding handlers after clearHandlers', () => {
      const handler = vi.fn()
      const t = tabs()
        .tabs(createTestTabs())
        .onChange(vi.fn())
        .clearHandlers()
        .onChange(handler)

      t.selected(1)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const changeHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const t = tabs()
        .tabs(createTestTabs())
        .onChange(changeHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      t.dispose()

      t.selected(1)
      t.focus()
      t.blur()

      expect(changeHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should clear tabs on dispose', () => {
      const t = tabs().tabs(createTestTabs())
      t.dispose()
      expect(t.tabCount).toBe(0)
    })

    it('should clear tab content parent references on dispose', () => {
      const content = text('Test')
      const t = tabs().tabs([{ label: 'Tab', content }])
      // Content parent should be set
      expect(content._parent).toBeDefined()

      t.dispose()
      // Parent reference should be cleared
      expect(content._parent).toBeNull()
    })

    it('should mark as disposed on dispose', () => {
      const t = tabs()
      t.dispose()
      expect((t as any)._disposed).toBe(true)
    })

    it('should not throw when disposing already disposed tabs', () => {
      const t = tabs()
      t.dispose()
      expect(() => t.dispose()).not.toThrow()
    })

    it('should not focus when disposed', () => {
      const handler = vi.fn()
      const t = tabs().onFocus(handler)
      t.dispose()

      t.focus()
      expect(handler).not.toHaveBeenCalled()
      expect(t.isFocused).toBe(false)
    })
  })

  describe('navigation edge cases', () => {
    it('should not move when all tabs are disabled (selectNext)', () => {
      const allDisabled = [
        { label: 'Tab 1', content: text('1'), disabled: true },
        { label: 'Tab 2', content: text('2'), disabled: true }
      ]
      const t = tabs().tabs(allDisabled).selected(0)

      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(0)
    })

    it('should not move when all tabs are disabled (selectPrevious)', () => {
      const allDisabled = [
        { label: 'Tab 1', content: text('1'), disabled: true },
        { label: 'Tab 2', content: text('2'), disabled: true }
      ]
      const t = tabs().tabs(allDisabled).selected(1)

      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(1)
    })

    it('should handle alternating disabled tabs correctly', () => {
      const alternating = [
        { label: 'Tab 1', content: text('1'), disabled: true },
        { label: 'Tab 2', content: text('2') },
        { label: 'Tab 3', content: text('3'), disabled: true },
        { label: 'Tab 4', content: text('4') }
      ]
      const t = tabs().tabs(alternating).selected(1)

      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(3) // Skips Tab 3
    })

    it('should handle navigation with only one enabled tab', () => {
      const oneEnabled = [
        { label: 'Tab 1', content: text('1'), disabled: true },
        { label: 'Tab 2', content: text('2') },
        { label: 'Tab 3', content: text('3'), disabled: true }
      ]
      const t = tabs().tabs(oneEnabled).selected(1)

      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(1) // Stays at Tab 2

      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(1) // Stays at Tab 2
    })
  })

  describe('edge cases', () => {
    it('should handle empty tabs array', () => {
      const t = tabs().tabs([])
      expect(t.tabCount).toBe(0)
      expect(t.selectedTab).toBeUndefined()
    })

    it('should handle selected when tabs are empty', () => {
      const t = tabs().tabs([])
      t.selected(0)
      expect(t.selectedIndex).toBe(0)
    })

    it('should handle selecting beyond tabs length', () => {
      const t = tabs().tabs(createTestTabs())
      t.selected(100)
      expect(t.selectedIndex).toBe(2) // Clamped to last tab
    })

    it('should handle selecting negative index', () => {
      const t = tabs().tabs(createTestTabs())
      t.selected(-5)
      expect(t.selectedIndex).toBe(0) // Clamped to first tab
    })

    it('should handle removing the currently selected tab', () => {
      const t = tabs().tabs(createTestTabs()).selected(1)
      t.removeTab(1)
      // Selected index should adjust
      expect(t.selectedIndex).toBe(1)
      expect(t.selectedTab?.label).toBe('About')
    })

    it('should handle removing last tab when selected', () => {
      const t = tabs().tabs(createTestTabs()).selected(2)
      t.removeTab(2)
      expect(t.selectedIndex).toBe(1)
      expect(t.selectedTab?.label).toBe('Settings')
    })

    it('should handle removing first tab when selected', () => {
      const t = tabs().tabs(createTestTabs()).selected(0)
      t.removeTab(0)
      // Should stay at index 0, which is now the second tab
      expect(t.selectedIndex).toBe(0)
      expect(t.selectedTab?.label).toBe('Settings')
    })

    it('should handle tabs without content', () => {
      const t = tabs().tabs([{ label: 'No Content' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should handle tabs with non-BaseNode content', () => {
      // Content can be any type, not just BaseNode
      const t = tabs().tabs([{ label: 'Tab', content: null as any }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should not emit change when selecting same tab', () => {
      const handler = vi.fn()
      const t = tabs().tabs(createTestTabs()).onChange(handler).selected(0)

      t.selected(0) // Same selection
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle position changes affecting content bounds', () => {
      const content = text('Content')
      const t = tabs().tabs([{ label: 'Tab', content }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)

      // Top position
      t.position('top')
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
      const topBounds = content._bounds
      expect(topBounds?.y).toBe(1) // Content starts below tab bar
      expect(topBounds?.height).toBe(9) // Height minus tab bar

      // Bottom position
      t.position('bottom')
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
      const bottomBounds = content._bounds
      expect(bottomBounds?.y).toBe(0) // Content starts at top
      expect(bottomBounds?.height).toBe(9) // Height minus tab bar
    })

    it('should not render tab content when height is 1', () => {
      const content = text('Content')
      const t = tabs().tabs([{ label: 'Tab', content }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }

      const buffer = createBuffer(20, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Content height would be 0, so it shouldn't render
      // Bounds should still be set but height is 0
      expect(content._bounds?.height).toBe(0)
    })

    it('should fill remaining tab bar with spaces', () => {
      const t = tabs().tabs([{ label: 'Single', content: text('Test') }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      const buffer = createBuffer(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // After " Single " + separator, should be spaces
      const cellAtEnd = buffer.get(28, 0)
      expect(cellAtEnd?.char).toBe(' ')
    })

    it('should render tab separators between tabs', () => {
      const t = tabs().tabs(createTestTabs())
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // The separator should appear somewhere in the tab bar
      let foundSeparator = false
      for (let x = 0; x < 50; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char === '\u2502') { // │
          foundSeparator = true
          break
        }
      }
      expect(foundSeparator).toBe(true)
    })

    it('should handle changing tabs to empty then back to populated', () => {
      const t = tabs().tabs(createTestTabs()).selected(1)
      t.tabs([])
      expect(t.tabCount).toBe(0)
      expect(t.selectedIndex).toBe(0)

      t.tabs(createTestTabs())
      expect(t.tabCount).toBe(3)
      expect(t.selectedTab?.label).toBe('Home')
    })
  })
})
