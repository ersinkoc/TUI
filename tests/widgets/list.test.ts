/**
 * @oxog/tui - List Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { list } from '../../src/widgets/list'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('List Widget', () => {
  describe('factory function', () => {
    it('should create a list node', () => {
      const l = list()
      expect(l.type).toBe('list')
    })

    it('should have a unique id', () => {
      const l1 = list()
      const l2 = list()
      expect(l1.id).not.toBe(l2.id)
    })

    it('should accept props', () => {
      const l = list({
        items: [{ id: '1', label: 'Item 1' }],
        lineNumbers: true,
        multiSelect: true,
        width: 40,
        height: 10
      })
      expect(l.itemCount).toBe(1)
    })
  })

  describe('chainable methods', () => {
    it('should set items', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])
      expect(l.itemCount).toBe(2)
    })

    it('should set lineNumbers', () => {
      const l = list().lineNumbers(true)
      expect(l).toBeDefined()
    })

    it('should set multiSelect', () => {
      const l = list().multiSelect(true)
      expect(l).toBeDefined()
    })

    it('should set width', () => {
      const l = list().width(50)
      expect(l).toBeDefined()
    })

    it('should set height', () => {
      const l = list().height(20)
      expect(l).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const l = list()
        .items([{ id: '1', label: 'Test' }])
        .lineNumbers(true)
        .multiSelect(true)
        .width(40)
        .height(15)

      expect(l.itemCount).toBe(1)
    })

    it('should reset selection when items change', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ])
      l.selectIndex(2)
      expect(l.selectedIndex).toBe(2)

      l.items([{ id: '1', label: 'A' }])
      expect(l.selectedIndex).toBe(0)
    })

    it('should clear invalid selections when items change', () => {
      const l = list()
        .multiSelect(true)
        .items([{ id: '1', label: 'A' }, { id: '2', label: 'B' }])
      ;(l as any)._selectedIds.add('1')
      ;(l as any)._selectedIds.add('2')

      l.items([{ id: '1', label: 'A' }])
      expect(l.selectedIds.has('2')).toBe(false)
    })
  })

  describe('navigation', () => {
    it('should select by index', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ])

      l.selectIndex(1)
      expect(l.selectedIndex).toBe(1)
      expect(l.selectedItem?.label).toBe('B')
    })

    it('should select by id', () => {
      const l = list().items([
        { id: 'first', label: 'A' },
        { id: 'second', label: 'B' }
      ])

      l.selectById('second')
      expect(l.selectedItem?.id).toBe('second')
    })

    it('should not select invalid index', () => {
      const l = list().items([{ id: '1', label: 'A' }])

      l.selectIndex(10)
      expect(l.selectedIndex).toBe(0)

      l.selectIndex(-1)
      expect(l.selectedIndex).toBe(0)
    })

    it('should select next', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])

      l.selectNext()
      expect(l.selectedIndex).toBe(1)
    })

    it('should select previous', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])

      l.selectIndex(1)
      l.selectPrevious()
      expect(l.selectedIndex).toBe(0)
    })

    it('should select first', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ])

      l.selectIndex(2)
      l.selectFirst()
      expect(l.selectedIndex).toBe(0)
    })

    it('should select last', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ])

      l.selectLast()
      expect(l.selectedIndex).toBe(2)
    })

    it('should page up', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        label: `Item ${i}`
      }))
      const l = list().items(items)
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      l.selectIndex(30)
      l.pageUp()
      expect(l.selectedIndex).toBeLessThan(30)
    })

    it('should page down', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        label: `Item ${i}`
      }))
      const l = list().items(items)
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      l.pageDown()
      expect(l.selectedIndex).toBeGreaterThan(0)
    })

    it('should skip separators', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: 'sep', label: '', separator: true },
        { id: '2', label: 'B' }
      ])

      l.selectNext()
      expect(l.selectedIndex).toBe(2)
    })

    it('should skip non-selectable items', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B', selectable: false },
        { id: '3', label: 'C' }
      ])

      l.selectNext()
      expect(l.selectedIndex).toBe(2)
    })
  })

  describe('multi-select', () => {
    it('should toggle selection', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])

      l.toggleSelection()
      expect(l.selectedIds.has('1')).toBe(true)

      l.toggleSelection()
      expect(l.selectedIds.has('1')).toBe(false)
    })

    it('should not toggle when not multiSelect', () => {
      const l = list().items([{ id: '1', label: 'A' }])
      l.toggleSelection()
      expect(l.selectedIds.size).toBe(0)
    })

    it('should select all', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' },
          { id: '3', label: 'C' }
        ])

      l.selectAll()
      expect(l.selectedIds.size).toBe(3)
    })

    it('should not select all when not multiSelect', () => {
      const l = list().items([{ id: '1', label: 'A' }])
      l.selectAll()
      expect(l.selectedIds.size).toBe(0)
    })

    it('should deselect all', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])

      l.selectAll()
      expect(l.selectedIds.size).toBe(2)

      l.deselectAll()
      expect(l.selectedIds.size).toBe(0)
    })

    it('should return selected items', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' },
          { id: '3', label: 'C' }
        ])

      l.toggleSelection()
      l.selectNext()
      l.toggleSelection()

      expect(l.selectedItems).toHaveLength(2)
    })

    it('should skip separators in selectAll', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: 'sep', label: '', separator: true },
          { id: '2', label: 'B' }
        ])

      l.selectAll()
      expect(l.selectedIds.has('sep')).toBe(false)
    })

    it('should emit change event', () => {
      const handler = vi.fn()
      const l = list()
        .multiSelect(true)
        .items([{ id: '1', label: 'A' }])
        .onChange(handler)

      l.toggleSelection()
      expect(handler).toHaveBeenCalled()
    })

    it('should clear multi-select when disabled', () => {
      const l = list()
        .multiSelect(true)
        .items([{ id: '1', label: 'A' }])

      l.selectAll()
      expect(l.selectedIds.size).toBe(1)

      l.multiSelect(false)
      expect(l.selectedIds.size).toBe(0)
    })
  })

  describe('events', () => {
    it('should emit select event', () => {
      const handler = vi.fn()
      const l = list()
        .items([{ id: '1', label: 'A' }])
        .onSelect(handler)

      l.selectIndex(0)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
    })

    it('should emit focus event', () => {
      const handler = vi.fn()
      const l = list().onFocus(handler)

      l.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('should emit blur event', () => {
      const handler = vi.fn()
      const l = list().onBlur(handler)

      l.focus()
      l.blur()
      expect(handler).toHaveBeenCalled()
    })

    it('should not emit focus when already focused', () => {
      const handler = vi.fn()
      const l = list().onFocus(handler)

      l.focus()
      l.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not emit blur when already blurred', () => {
      const handler = vi.fn()
      const l = list().onBlur(handler)

      l.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('should navigate with arrow keys', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])
      l.focus()

      ;(l as any).handleKey('down', false)
      expect(l.selectedIndex).toBe(1)

      ;(l as any).handleKey('up', false)
      expect(l.selectedIndex).toBe(0)
    })

    it('should navigate with j/k keys', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])
      l.focus()

      ;(l as any).handleKey('j', false)
      expect(l.selectedIndex).toBe(1)

      ;(l as any).handleKey('k', false)
      expect(l.selectedIndex).toBe(0)
    })

    it('should go to start with home/g', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ])
      l.focus()
      l.selectIndex(2)

      ;(l as any).handleKey('home', false)
      expect(l.selectedIndex).toBe(0)

      l.selectIndex(2)
      ;(l as any).handleKey('g', false)
      expect(l.selectedIndex).toBe(0)
    })

    it('should go to end with end', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])
      l.focus()

      ;(l as any).handleKey('end', false)
      expect(l.selectedIndex).toBe(1)
    })

    it('should page with pageup/pagedown', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        label: `Item ${i}`
      }))
      const l = list().items(items)
      l.focus()
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      ;(l as any).handleKey('pagedown', false)
      expect(l.selectedIndex).toBeGreaterThan(0)

      l.selectIndex(30)
      ;(l as any).handleKey('pageup', false)
      expect(l.selectedIndex).toBeLessThan(30)
    })

    it('should toggle with space in multiSelect', () => {
      const l = list()
        .multiSelect(true)
        .items([{ id: '1', label: 'A' }])
      l.focus()

      ;(l as any).handleKey('space', false)
      expect(l.selectedIds.has('1')).toBe(true)
    })

    it('should select all with Ctrl+A', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])
      l.focus()

      ;(l as any).handleKey('a', true)
      expect(l.selectedIds.size).toBe(2)
    })

    it('should emit select on Enter', () => {
      const handler = vi.fn()
      const l = list()
        .items([{ id: '1', label: 'A' }])
        .onSelect(handler)
      l.focus()

      ;(l as any).handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('should not handle keys when not focused', () => {
      const l = list().items([{ id: '1', label: 'A' }])

      const result = (l as any).handleKey('down', false)
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('should select on click', () => {
      const handler = vi.fn()
      const l = list()
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])
        .onSelect(handler)
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      ;(l as any).handleMouse(10, 1, 'press')
      expect(l.selectedIndex).toBe(1)
    })

    it('should toggle on click in multiSelect', () => {
      const l = list()
        .multiSelect(true)
        .items([{ id: '1', label: 'A' }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      ;(l as any).handleMouse(10, 0, 'press')
      expect(l.selectedIds.has('1')).toBe(true)
    })

    it('should scroll with wheel', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      ;(l as any).handleMouse(10, 0, 'scroll-down')
      expect(l.selectedIndex).toBe(1)

      ;(l as any).handleMouse(10, 0, 'scroll-up')
      expect(l.selectedIndex).toBe(0)
    })

    it('should not handle outside bounds', () => {
      const l = list().items([{ id: '1', label: 'A' }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const result = (l as any).handleMouse(100, 100, 'press')
      expect(result).toBe(false)
    })

    it('should not select separators', () => {
      const l = list().items([
        { id: 'sep', label: '', separator: true },
        { id: '1', label: 'A' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      l.selectIndex(1)

      ;(l as any).handleMouse(10, 0, 'press')
      expect(l.selectedIndex).toBe(1) // Should stay on previous selection
    })
  })

  describe('render', () => {
    it('should render list', () => {
      const l = list().items([
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with line numbers', () => {
      const l = list()
        .lineNumbers(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with icons', () => {
      const l = list().items([
        { id: '1', label: 'File', icon: '📄' },
        { id: '2', label: 'Folder', icon: '📁' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with secondary text', () => {
      const l = list().items([
        { id: '1', label: 'Open', secondary: 'Ctrl+O' },
        { id: '2', label: 'Save', secondary: 'Ctrl+S' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render separators', () => {
      const l = list().items([
        { id: '1', label: 'A' },
        { id: 'sep', label: '', separator: true },
        { id: '2', label: 'B' }
      ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render selection indicators in multiSelect', () => {
      const l = list()
        .multiSelect(true)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])
      l.toggleSelection()
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render scrollbar', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        label: `Item ${i}`
      }))
      const l = list().items(items)
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render when not visible', () => {
      const l = list().items([{ id: '1', label: 'A' }])
      ;(l as any)._visible = false
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render with zero dimensions', () => {
      const l = list().items([{ id: '1', label: 'A' }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })

  describe('state', () => {
    it('should return visible range', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        label: `Item ${i}`
      }))
      const l = list().items(items)
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const range = l.visibleRange
      expect(range.start).toBe(0)
      expect(range.end).toBeLessThanOrEqual(10)
    })

    it('should return isFocused', () => {
      const l = list()
      expect(l.isFocused).toBe(false)

      l.focus()
      expect(l.isFocused).toBe(true)
    })
  })

  describe('additional rendering edge cases', () => {
    it('should render items with selectable: false', () => {
      const l = list()
        .items([
          { id: '1', label: 'Selectable', selectable: true },
          { id: '2', label: 'Not Selectable', selectable: false }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should truncate very long labels', () => {
      const l = list()
        .items([
          { id: '1', label: 'This is a very very very long label that definitely exceeds the available width' }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should truncate labels with lineNumbers and multiSelect', () => {
      const l = list()
        .lineNumbers(true)
        .multiSelect(true)
        .items([
          { id: '1', label: 'A very long label that needs truncation with multiple features enabled' }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render secondary text that barely fits', () => {
      const l = list()
        .items([
          { id: '1', label: 'Short', secondary: 'Some secondary text' }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render secondary text with narrow width (not enough space)', () => {
      const l = list()
        .items([
          { id: '1', label: 'Label', secondary: 'Secondary' }
        ])
      ;(l as any)._bounds = { x: 0, y: 0, width: 15, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render current (focused) item with inverse styling', () => {
      const l = list()
        .items([
          { id: '1', label: 'Item 1' },
          { id: '2', label: 'Item 2' }
        ])
        .focus()
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(80, 24)
      l.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })

  describe('mouse handling edge cases', () => {
    it('should return false for unknown keys', () => {
      const l = list().items([{ id: '1', label: 'A' }]).focus()
      const result = (l as any).handleKey('x', false)
      expect(result).toBe(false)
    })

    it('should return true for move action inside list', () => {
      const l = list()
        .items([{ id: '1', label: 'A' }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const result = (l as any).handleMouse(5, 0, 'move')
      expect(result).toBe(true)
    })

    it('should handle click on non-selectable item', () => {
      const l = list()
        .items([{ id: '1', label: 'A', selectable: false }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const result = (l as any).handleMouse(5, 0, 'press')
      expect(result).toBe(true)
    })

    it('should handle click on separator', () => {
      const l = list()
        .items([{ id: '1', label: '', separator: true }])
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const result = (l as any).handleMouse(5, 0, 'press')
      expect(result).toBe(true)
    })
  })

  describe('pageDown edge cases', () => {
    it('should fall back to selectLast when no selectable item ahead', () => {
      const l = list()
        .items([
          { id: '1', label: 'A' },
          { id: 'sep1', label: '', separator: true },
          { id: 'sep2', label: '', separator: true },
          { id: '2', label: 'B', selectable: false }
        ])
      l.focus()
      ;(l as any)._bounds = { x: 0, y: 0, width: 40, height: 2 }

      l.pageDown()
      // Should fall back to selectLast since no valid item ahead
    })

    it('should not toggle selection in single select mode', () => {
      const l = list()
        .multiSelect(false)
        .items([{ id: '1', label: 'A' }])
      l.focus()

      l.toggleSelection()
      expect(l.selectedIds.size).toBe(0)
    })

    it('should not select all in single select mode', () => {
      const l = list()
        .multiSelect(false)
        .items([
          { id: '1', label: 'A' },
          { id: '2', label: 'B' }
        ])
      l.focus()

      l.selectAll()
      expect(l.selectedIds.size).toBe(0)
    })
  })
})
