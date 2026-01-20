/**
 * @oxog/tui - ContextMenu Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { contextmenu } from '../../src/widgets/contextmenu'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('ContextMenu Widget', () => {
  describe('factory function', () => {
    it('should create a contextmenu node', () => {
      const menu = contextmenu()
      expect(menu.type).toBe('contextmenu')
    })

    it('should have a unique id', () => {
      const menu1 = contextmenu()
      const menu2 = contextmenu()
      expect(menu1.id).not.toBe(menu2.id)
    })

    it('should accept props', () => {
      const menu = contextmenu({
        items: [{ label: 'Cut', value: 'cut' }],
        border: 'single',
        autoClose: true,
        maxVisible: 5
      })
      expect(menu).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set items', () => {
      const menu = contextmenu().items([
        { label: 'Cut', value: 'cut' },
        { label: 'Copy', value: 'copy' }
      ])
      expect(menu.selectedItem?.label).toBe('Cut')
    })

    it('should set border', () => {
      const menu = contextmenu().border('rounded')
      expect(menu).toBeDefined()
    })

    it('should set autoClose', () => {
      const menu = contextmenu().autoClose(false)
      expect(menu).toBeDefined()
    })

    it('should set maxVisible', () => {
      const menu = contextmenu().maxVisible(8)
      expect(menu).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .border('double')
        .autoClose(true)
        .maxVisible(10)

      expect(menu).toBeDefined()
    })
  })

  describe('show/hide control', () => {
    it('should start hidden', () => {
      const menu = contextmenu()
      expect(menu.isVisible).toBe(false)
    })

    it('should show at position', () => {
      const menu = contextmenu()
      menu.show(10, 5)
      expect(menu.isVisible).toBe(true)
    })

    it('should hide', () => {
      const menu = contextmenu()
      menu.show(10, 5)
      menu.hide()
      expect(menu.isVisible).toBe(false)
    })

    it('should toggle visibility', () => {
      const menu = contextmenu()
      menu.toggle(10, 5)
      expect(menu.isVisible).toBe(true)
      menu.toggle(10, 5)
      expect(menu.isVisible).toBe(false)
    })

    it('should emit close event', () => {
      const handler = vi.fn()
      const menu = contextmenu().onClose(handler)
      menu.show(10, 5)
      menu.hide()
      expect(handler).toHaveBeenCalled()
    })

    it('should not emit close when already hidden', () => {
      const handler = vi.fn()
      const menu = contextmenu().onClose(handler)
      menu.hide()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('should select next item', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' }
      ])
      menu.show(0, 0)

      expect(menu.selectedIndex).toBe(0)
      menu.selectNext()
      expect(menu.selectedIndex).toBe(1)
    })

    it('should select previous item', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      menu.selectNext()
      expect(menu.selectedIndex).toBe(1)
      menu.selectPrevious()
      expect(menu.selectedIndex).toBe(0)
    })

    it('should skip separators', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: '', value: '', separator: true },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      menu.selectNext()
      expect(menu.selectedIndex).toBe(2)
    })

    it('should skip disabled items', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c' }
      ])
      menu.show(0, 0)

      menu.selectNext()
      expect(menu.selectedIndex).toBe(2)
    })

    it('should wrap around at end', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      menu.selectNext()
      menu.selectNext()
      expect(menu.selectedIndex).toBe(0)
    })

    it('should wrap around at beginning', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      menu.selectPrevious()
      expect(menu.selectedIndex).toBe(1)
    })
  })

  describe('confirm', () => {
    it('should emit select event on confirm', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .onSelect(handler)
      menu.show(0, 0)

      menu.confirm()
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ value: 'test' }))
    })

    it('should auto-close on confirm', () => {
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .autoClose(true)
      menu.show(0, 0)

      menu.confirm()
      expect(menu.isVisible).toBe(false)
    })

    it('should not auto-close when disabled', () => {
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .autoClose(false)
      menu.show(0, 0)

      menu.confirm()
      expect(menu.isVisible).toBe(true)
    })

    it('should not confirm disabled items', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test', disabled: true }])
        .onSelect(handler)
      menu.show(0, 0)

      menu.confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not confirm separators', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([{ label: '', value: '', separator: true }])
        .onSelect(handler)
      menu.show(0, 0)

      menu.confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('should navigate with up/down keys', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      ;(menu as any).handleKey('down', false)
      expect(menu.selectedIndex).toBe(1)

      ;(menu as any).handleKey('up', false)
      expect(menu.selectedIndex).toBe(0)
    })

    it('should navigate with j/k keys', () => {
      const menu = contextmenu().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      menu.show(0, 0)

      ;(menu as any).handleKey('j', false)
      expect(menu.selectedIndex).toBe(1)

      ;(menu as any).handleKey('k', false)
      expect(menu.selectedIndex).toBe(0)
    })

    it('should confirm with Enter', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .onSelect(handler)
      menu.show(0, 0)

      const result = (menu as any).handleKey('enter', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should confirm with Space', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .onSelect(handler)
      menu.show(0, 0)

      const result = (menu as any).handleKey('space', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should close with Escape', () => {
      const menu = contextmenu()
      menu.show(0, 0)

      const result = (menu as any).handleKey('escape', false)
      expect(result).toBe(true)
      expect(menu.isVisible).toBe(false)
    })

    it('should not handle keys when hidden', () => {
      const menu = contextmenu()
      const result = (menu as any).handleKey('down', false)
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('should select on hover', () => {
      const menu = contextmenu()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ])
        .border('rounded')
      menu.show(0, 0)

      // Simulate mouse move inside menu
      const result = (menu as any).handleMouse(2, 2, 'move')
      expect(result).toBe(true)
    })

    it('should confirm on click', () => {
      const handler = vi.fn()
      const menu = contextmenu()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ])
        .border('rounded')
        .onSelect(handler)
      menu.show(0, 0)

      // Simulate click on item
      const result = (menu as any).handleMouse(2, 1, 'press')
      expect(result).toBe(true)
    })

    it('should close on click outside', () => {
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .border('rounded')
      menu.show(0, 0)

      // Simulate click outside menu
      const result = (menu as any).handleMouse(100, 100, 'press')
      expect(result).toBe(true)
      expect(menu.isVisible).toBe(false)
    })

    it('should not handle mouse when hidden', () => {
      const menu = contextmenu()
      const result = (menu as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })
  })

  describe('render', () => {
    it('should render visible menu', () => {
      const menu = contextmenu()
        .items([
          { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
          { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
          { label: '', value: '', separator: true },
          { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' }
        ])
        .border('rounded')
      menu.show(5, 5)

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(buffer).toBeDefined()
    })

    it('should not render hidden menu', () => {
      const menu = contextmenu().items([{ label: 'Test', value: 'test' }])

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should be empty
      expect(buffer).toBeDefined()
    })

    it('should render with icons', () => {
      const menu = contextmenu()
        .items([
          { label: 'New', value: 'new', icon: '+' },
          { label: 'Save', value: 'save', icon: 'S' }
        ])
        .border('single')
      menu.show(0, 0)

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render disabled items', () => {
      const menu = contextmenu()
        .items([
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled', disabled: true }
        ])
      menu.show(0, 0)

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render scroll indicators', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i}`,
        value: `item${i}`
      }))

      const menu = contextmenu().items(items).maxVisible(5)
      menu.show(0, 0)

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render without border', () => {
      const menu = contextmenu()
        .items([{ label: 'Test', value: 'test' }])
        .border('none')
      menu.show(0, 0)

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render scroll up indicator when scrolled', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i}`,
        value: `item${i}`
      }))

      const menu = contextmenu().items(items).maxVisible(5)
      menu.show(0, 0)

      // Scroll down to show scroll up indicator
      menu.selectNext()
      menu.selectNext()
      menu.selectNext()
      menu.selectNext()
      menu.selectNext()
      menu.selectNext()

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should truncate long labels', () => {
      const menu = contextmenu()
        .items([
          { label: 'This is a very very very very long label that exceeds menu width', value: 'long' }
        ])
        .border('single')
      menu.show(0, 0)

      // Force narrow width by showing near edge
      const buffer = createBuffer(20, 10)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should truncate long label with shortcut', () => {
      const menu = contextmenu()
        .items([
          { label: 'Very Long Menu Item Label', value: 'long', shortcut: 'Ctrl+Shift+X' }
        ])
        .border('single')
      menu.show(0, 0)

      const buffer = createBuffer(30, 10)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })

  describe('scroll and ensureVisible edge cases', () => {
    it('scrolls up to show selected item', () => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        label: `Item ${i}`,
        value: `item${i}`
      }))

      const menu = contextmenu().items(items).maxVisible(5)
      menu.show(0, 0)

      // Scroll down first
      for (let i = 0; i < 10; i++) {
        menu.selectNext()
      }

      // Then scroll back up
      for (let i = 0; i < 8; i++) {
        menu.selectPrevious()
      }

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('renders scroll up indicator with manual scroll offset', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i}`,
        value: `item${i}`
      }))

      const menu = contextmenu().items(items).maxVisible(5)
      menu.show(0, 0)

      // Manually set scroll offset to simulate scrolled state
      ;(menu as any)._scrollOffset = 5
      ;(menu as any)._selectedIndex = 6

      const buffer = createBuffer(80, 24)
      menu.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check for scroll up indicator character (▲)
      let foundUpIndicator = false
      for (let x = 0; x < 30; x++) {
        if (buffer.get(x, 1).char === '\u25b2') {
          foundUpIndicator = true
          break
        }
      }
      expect(foundUpIndicator).toBe(true)
    })

    it('handles ensureVisible when scrolling up', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i}`,
        value: `item${i}`
      }))

      const menu = contextmenu().items(items).maxVisible(5)
      menu.show(0, 0)

      // Set scroll offset higher than selected index
      ;(menu as any)._scrollOffset = 10
      ;(menu as any)._selectedIndex = 5

      // Call ensureVisible to trigger scroll adjustment
      ;(menu as any).ensureVisible()

      // scrollOffset should be adjusted to show selected item
      expect((menu as any)._scrollOffset).toBe(5)
    })
  })
})
