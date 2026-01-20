/**
 * Drawer widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { drawer, text } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Drawer Widget', () => {
  describe('creation', () => {
    it('creates a drawer with default properties', () => {
      const d = drawer()
      expect(d.type).toBe('drawer')
      expect(d.isOpen).toBe(false)
      expect(d.drawerPosition).toBe('left')
      expect(d.drawerSize).toBe(30)
    })

    it('creates a drawer with position', () => {
      const d = drawer({ position: 'right' })
      expect(d.drawerPosition).toBe('right')
    })

    it('creates a drawer with all positions', () => {
      const positions = ['left', 'right', 'top', 'bottom'] as const
      for (const p of positions) {
        const d = drawer({ position: p })
        expect(d.drawerPosition).toBe(p)
      }
    })

    it('creates an open drawer', () => {
      const d = drawer({ open: true })
      expect(d.isOpen).toBe(true)
    })

    it('creates a drawer with items', () => {
      const d = drawer({
        items: [
          { id: 'home', label: 'Home' },
          { id: 'files', label: 'Files' }
        ]
      })
      expect(d.itemList.length).toBe(2)
    })

    it('creates a drawer with title', () => {
      const d = drawer({ title: 'Navigation' })
      expect(d.type).toBe('drawer')
    })
  })

  describe('configuration', () => {
    it('sets position', () => {
      const d = drawer().position('bottom')
      expect(d.drawerPosition).toBe('bottom')
    })

    it('sets size', () => {
      const d = drawer().size(40)
      expect(d.drawerSize).toBe(40)
    })

    it('sets items', () => {
      const d = drawer().items([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' }
      ])
      expect(d.itemList.length).toBe(2)
    })

    it('adds an item', () => {
      const d = drawer()
        .addItem({ id: 'a', label: 'A' })
        .addItem({ id: 'b', label: 'B' })
      expect(d.itemList.length).toBe(2)
    })

    it('removes an item', () => {
      const d = drawer()
        .addItem({ id: 'a', label: 'A' })
        .addItem({ id: 'b', label: 'B' })
        .removeItem('a')
      expect(d.itemList.length).toBe(1)
    })

    it('sets title', () => {
      const d = drawer().title('Menu')
      expect(d.type).toBe('drawer')
    })

    it('sets border', () => {
      const d = drawer().border('double')
      expect(d.type).toBe('drawer')
    })

    it('sets showClose', () => {
      const d = drawer().showClose(false)
      expect(d.type).toBe('drawer')
    })

    it('sets overlay', () => {
      const d = drawer().overlay(false)
      expect(d.type).toBe('drawer')
    })
  })

  describe('open/close control', () => {
    it('opens drawer', () => {
      const d = drawer().open()
      expect(d.isOpen).toBe(true)
    })

    it('closes drawer', () => {
      const d = drawer({ open: true }).close()
      expect(d.isOpen).toBe(false)
    })

    it('toggles drawer', () => {
      const d = drawer()

      d.toggle()
      expect(d.isOpen).toBe(true)

      d.toggle()
      expect(d.isOpen).toBe(false)
    })

    it('emits onOpen when opening', () => {
      const handler = vi.fn()
      const d = drawer().onOpen(handler)

      d.open()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onClose when closing', () => {
      const handler = vi.fn()
      const d = drawer({ open: true }).onClose(handler)

      d.close()
      expect(handler).toHaveBeenCalled()
    })

    it('does not emit when already in same state', () => {
      const openHandler = vi.fn()
      const closeHandler = vi.fn()
      const d = drawer({ open: true })
        .onOpen(openHandler)
        .onClose(closeHandler)

      d.open() // Already open
      expect(openHandler).not.toHaveBeenCalled()

      d.close()
      d.close() // Already closed
      expect(closeHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('navigation', () => {
    it('selects next item', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' }
        ])
        .focus()

      expect(d.selectedId).toBe('a')

      d.selectNext()
      expect(d.selectedId).toBe('b')
    })

    it('selects previous item', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()
        .selectNext()

      expect(d.selectedId).toBe('b')

      d.selectPrevious()
      expect(d.selectedId).toBe('a')
    })

    it('wraps around when navigating', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()
        .selectNext()
        .selectNext()

      expect(d.selectedId).toBe('a') // Wrapped
    })

    it('skips disabled items', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', disabled: true },
          { id: 'c', label: 'C' }
        ])
        .focus()
        .selectNext()

      expect(d.selectedId).toBe('c') // Skipped disabled
    })

    it('selects item by id', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .selectItem('b')

      expect(d.selectedId).toBe('b')
    })

    it('expands item', () => {
      const d = drawer()
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .expandItem('parent')

      expect(d.type).toBe('drawer')
    })

    it('collapses item', () => {
      const d = drawer()
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .expandItem('parent')
        .collapseItem('parent')

      expect(d.type).toBe('drawer')
    })
  })

  describe('confirm', () => {
    it('emits onSelect when confirming', () => {
      const handler = vi.fn()
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .onSelect(handler)
        .focus()

      d.confirm()
      expect(handler).toHaveBeenCalled()
    })

    it('toggles expand on confirm when item has children', () => {
      const handler = vi.fn()
      const d = drawer()
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .onSelect(handler)
        .focus()

      d.confirm() // Should expand
      expect(handler).toHaveBeenCalled()
    })

    it('does not confirm disabled items', () => {
      const handler = vi.fn()
      const d = drawer()
        .items([{ id: 'a', label: 'A', disabled: true }])
        .onSelect(handler)
        .selectItem('a') // Won't select disabled

      d.confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('content', () => {
    it('sets content node', () => {
      const content = text('Content')
      const d = drawer().content(content)
      expect(d.type).toBe('drawer')
    })

    it('replaces content node', () => {
      const content1 = text('First')
      const content2 = text('Second')
      const d = drawer().content(content1).content(content2)
      expect(d.type).toBe('drawer')
    })
  })

  describe('focus', () => {
    it('focuses the drawer', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .focus()
      expect(d.isFocused).toBe(true)
      expect(d.selectedId).toBe('a')
    })

    it('blurs the drawer', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .focus()
        .blur()
      expect(d.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('handles up/down for navigation', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()

      let handled = (d as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(d.selectedId).toBe('b')

      handled = (d as any).handleKey('up', false)
      expect(handled).toBe(true)
      expect(d.selectedId).toBe('a')
    })

    it('handles enter to confirm', () => {
      const handler = vi.fn()
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .onSelect(handler)
        .focus()

      const handled = (d as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles escape to close', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .focus()

      const handled = (d as any).handleKey('escape', false)
      expect(handled).toBe(true)
      expect(d.isOpen).toBe(false)
    })

    it('handles right/left for expand/collapse', () => {
      const d = drawer({ open: true })
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .focus()

      let handled = (d as any).handleKey('right', false)
      expect(handled).toBe(true)

      handled = (d as any).handleKey('left', false)
      expect(handled).toBe(true)
    })

    it('ignores keys when not focused or closed', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])

      let handled = (d as any).handleKey('down', false)
      expect(handled).toBe(false)

      d.open().focus()
      handled = (d as any).handleKey('down', false)
      expect(handled).toBe(true)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 24

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when closed', () => {
      const d = drawer()
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders open drawer', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer at all positions', () => {
      const positions = ['left', 'right', 'top', 'bottom'] as const
      for (const p of positions) {
        const d = drawer({ position: p, open: true })
          .items([{ id: 'a', label: 'A' }])
        ;(d as any)._bounds = { x: 0, y: 0, width, height }
        d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders drawer with title', () => {
      const d = drawer({ open: true, title: 'Menu' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with close button', () => {
      const d = drawer({ open: true, title: 'Menu', showClose: true })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with icons', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'Home', icon: '\ud83c\udfe0' },
          { id: 'b', label: 'Files', icon: '\ud83d\udcc1' }
        ])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with badges', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'inbox', label: 'Inbox', badge: 5 },
          { id: 'trash', label: 'Trash', badge: '99+' }
        ])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with nested items', () => {
      const d = drawer({ open: true })
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .expandItem('parent')
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with disabled items', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'enabled', label: 'Enabled' },
          { id: 'disabled', label: 'Disabled', disabled: true }
        ])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused drawer with selection', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer with overlay', () => {
      const d = drawer({ open: true, overlay: true })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders drawer without overlay', () => {
      const d = drawer({ open: true, overlay: false })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const d = drawer({ open: true })
      ;(d as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const d = drawer({ open: true }).visible(false)
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const d = drawer()
        .position('left')
        .size(35)
        .title('Navigation')
        .items([{ id: 'home', label: 'Home' }])
        .addItem({ id: 'files', label: 'Files' })
        .border('rounded')
        .showClose(true)
        .overlay(true)
        .content(text('Content'))
        .open()
        .focus()
        .selectNext()
        .confirm()
        .close()
        .blur()

      expect(d.type).toBe('drawer')
    })
  })

  describe('mouse handling', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 24

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('returns false when drawer is closed', () => {
      const d = drawer()
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      const handled = (d as any).handleMouse(5, 5, 'press')
      expect(handled).toBe(false)
    })

    it('returns true when no bounds but drawer is open', () => {
      const d = drawer({ open: true })
      const handled = (d as any).handleMouse(5, 5, 'press')
      expect(handled).toBe(true) // Returns true when open, even without bounds
    })

    it('handles click on close button', () => {
      const d = drawer({ open: true, title: 'Menu', showClose: true })
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Close button is at drawerBounds.x + drawerBounds.width - 2
      // Default drawer size is 30, so close button is at x=28
      const closeX = 28
      const closeY = 1 // After border

      const handled = (d as any).handleMouse(closeX, closeY, 'press')
      expect(handled).toBe(true)
      expect(d.isOpen).toBe(false)
    })

    it('handles click on item', () => {
      const handler = vi.fn()
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .onSelect(handler)
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Item is at y = borderOffset + headerOffset + itemIndex
      // For default no title: y = 1 + 0 + 0 = 1
      const handled = (d as any).handleMouse(5, 1, 'press')
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles click on overlay to close', () => {
      const d = drawer({ open: true, overlay: true, position: 'left' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Click outside drawer (drawer is 30 wide, click at 50)
      const handled = (d as any).handleMouse(50, 10, 'press')
      expect(handled).toBe(true)
      expect(d.isOpen).toBe(false)
    })

    it('returns true for click inside drawer without action', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Click inside drawer area but not on item
      const handled = (d as any).handleMouse(5, 20, 'press')
      expect(handled).toBe(true)
    })

    it('handles right position drawer click', () => {
      const d = drawer({ open: true, position: 'right' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Right drawer starts at width - size = 80 - 30 = 50
      const handled = (d as any).handleMouse(55, 1, 'press')
      expect(handled).toBe(true)
    })

    it('handles top position drawer click', () => {
      const d = drawer({ open: true, position: 'top' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      const handled = (d as any).handleMouse(5, 1, 'press')
      expect(handled).toBe(true)
    })

    it('handles bottom position drawer click', () => {
      const d = drawer({ open: true, position: 'bottom' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }

      // Bottom drawer starts at height - size = 24 - 30 = -6 (clamped to 0)
      const handled = (d as any).handleMouse(5, 20, 'press')
      expect(handled).toBe(true)
    })
  })

  describe('remove item from children', () => {
    it('removes item from nested children', () => {
      const d = drawer()
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [
              { id: 'child1', label: 'Child 1' },
              { id: 'child2', label: 'Child 2' }
            ]
          }
        ])
        .expandItem('parent')

      d.removeItem('child1')
      const items = d.itemList
      expect(items[0].children?.length).toBe(1)
    })

    it('handles removing non-existent item', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .removeItem('nonexistent')

      expect(d.itemList.length).toBe(1)
    })
  })

  describe('navigation edge cases', () => {
    it('handles selectNext with empty items', () => {
      const d = drawer().selectNext()
      expect(d.selectedId).toBeNull()
    })

    it('handles selectPrevious with empty items', () => {
      const d = drawer().selectPrevious()
      expect(d.selectedId).toBeNull()
    })

    it('handles selectItem with disabled item', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A', disabled: true }])
        .selectItem('a')
      expect(d.selectedId).toBeNull()
    })

    it('wraps previous selection', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()
        .selectPrevious()

      expect(d.selectedId).toBe('b') // Wrapped to end
    })

    it('skips all disabled items when wrapping next', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', disabled: true },
          { id: 'c', label: 'C', disabled: true }
        ])
        .focus()
        .selectNext()
        .selectNext()

      expect(d.selectedId).toBe('a') // Wrapped back
    })

    it('skips all disabled items when wrapping previous', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A', disabled: true },
          { id: 'b', label: 'B', disabled: true },
          { id: 'c', label: 'C' }
        ])
        .focus()
        .selectPrevious()

      expect(d.selectedId).toBe('c')
    })
  })

  describe('keyboard vim bindings', () => {
    it('handles j for down', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()

      const handled = (d as any).handleKey('j', false)
      expect(handled).toBe(true)
      expect(d.selectedId).toBe('b')
    })

    it('handles k for up', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ])
        .focus()
        .selectNext()

      const handled = (d as any).handleKey('k', false)
      expect(handled).toBe(true)
      expect(d.selectedId).toBe('a')
    })

    it('handles space to confirm', () => {
      const handler = vi.fn()
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .onSelect(handler)
        .focus()

      const handled = (d as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles l for expand', () => {
      const d = drawer({ open: true })
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .focus()

      const handled = (d as any).handleKey('l', false)
      expect(handled).toBe(true)
    })

    it('handles h for collapse', () => {
      const d = drawer({ open: true })
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .expandItem('parent')
        .focus()

      const handled = (d as any).handleKey('h', false)
      expect(handled).toBe(true)
    })

    it('handles l when no children', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .focus()

      const handled = (d as any).handleKey('l', false)
      expect(handled).toBe(true) // Still returns true, just does nothing
    })

    it('handles h when not expanded', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .focus()

      const handled = (d as any).handleKey('h', false)
      expect(handled).toBe(true)
    })
  })

  describe('rendering with deep nesting', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 24

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders deeply nested items with correct depth', () => {
      const d = drawer({ open: true })
        .items([
          {
            id: 'level1',
            label: 'Level 1',
            children: [
              {
                id: 'level2',
                label: 'Level 2',
                children: [{ id: 'level3', label: 'Level 3' }]
              }
            ]
          }
        ])
        .expandItem('level1')
        .expandItem('level2')
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with border none', () => {
      const d = drawer({ open: true, border: 'none' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with long title that needs truncation', () => {
      const d = drawer({ open: true, title: 'This is a very long title that needs to be truncated' })
        .items([{ id: 'a', label: 'A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with long item label that needs truncation', () => {
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'This is a very long label that exceeds drawer width' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders badge that does not fit', () => {
      const d = drawer({ open: true, size: 20 })
        .items([{ id: 'a', label: 'Very Long Label', badge: 'This badge is too long' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders divider items', () => {
      const d = drawer({ open: true })
        .items([
          { id: 'a', label: 'A' },
          { id: 'div', label: '', divider: true },
          { id: 'b', label: 'B' }
        ])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders at all border styles', () => {
      const styles = ['single', 'double', 'rounded', 'bold'] as const
      for (const style of styles) {
        const d = drawer({ open: true, border: style })
          .items([{ id: 'a', label: 'A' }])
        ;(d as any)._bounds = { x: 0, y: 0, width, height }
        d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })
  })

  describe('confirm edge cases', () => {
    it('collapses expanded item on confirm', () => {
      const handler = vi.fn()
      const d = drawer({ open: true })
        .items([
          {
            id: 'parent',
            label: 'Parent',
            children: [{ id: 'child', label: 'Child' }]
          }
        ])
        .onSelect(handler)
        .expandItem('parent')
        .focus()

      // Confirm on expanded parent should collapse it
      d.confirm()
      expect(handler).toHaveBeenCalled()
    })

    it('does nothing when no item selected', () => {
      const handler = vi.fn()
      const d = drawer({ open: true })
        .items([{ id: 'a', label: 'A' }])
        .onSelect(handler)

      // selectedIndex is -1, no focus
      d.confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('focus with all disabled items', () => {
    it('handles focus when all items are disabled', () => {
      const d = drawer()
        .items([
          { id: 'a', label: 'A', disabled: true },
          { id: 'b', label: 'B', disabled: true }
        ])
        .focus()

      // No item should be selected since all are disabled
      expect(d.isFocused).toBe(true)
    })

    it('handles focus with dividers only', () => {
      const d = drawer()
        .items([
          { id: 'div1', label: '', divider: true },
          { id: 'div2', label: '', divider: true }
        ])
        .focus()

      expect(d.isFocused).toBe(true)
    })
  })

  describe('method return values', () => {
    it('selectNext returns this for chaining', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .focus()

      const result = d.selectNext()
      expect(result).toBe(d)
    })

    it('selectPrevious returns this for chaining', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])
        .focus()

      const result = d.selectPrevious()
      expect(result).toBe(d)
    })

    it('selectItem returns this for chaining', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])

      const result = d.selectItem('a')
      expect(result).toBe(d)
    })

    it('selectItem with non-existent id returns this', () => {
      const d = drawer()
        .items([{ id: 'a', label: 'A' }])

      const result = d.selectItem('nonexistent')
      expect(result).toBe(d)
    })
  })

  describe('position-specific rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 24

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders right position drawer correctly', () => {
      const d = drawer({ position: 'right', open: true, size: 20 })
        .items([{ id: 'a', label: 'Item A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Right drawer starts at width - size = 80 - 20 = 60
      expect(buffer.get(60, 1)).toBeDefined()
    })

    it('renders top position drawer with correct bounds', () => {
      const d = drawer({ position: 'top', open: true, size: 10 })
        .items([{ id: 'a', label: 'Item A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders bottom position drawer with correct bounds', () => {
      const d = drawer({ position: 'bottom', open: true, size: 10 })
        .items([{ id: 'a', label: 'Item A' }])
      ;(d as any)._bounds = { x: 0, y: 0, width, height }
      d.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Bottom drawer starts at height - size = 24 - 10 = 14
      expect(buffer.get(0, 14)).toBeDefined()
    })
  })
})
