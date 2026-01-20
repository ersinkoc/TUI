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
})
