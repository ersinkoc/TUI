/**
 * Timeline widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { timeline, TimelineItem } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

const sampleItems: TimelineItem[] = [
  { id: '1', title: 'Start', description: 'Project kickoff', date: '2024-01-01', status: 'completed' },
  { id: '2', title: 'Development', description: 'Building features', date: '2024-02-15', status: 'completed' },
  { id: '3', title: 'Testing', description: 'QA phase', date: '2024-03-01', status: 'current' },
  { id: '4', title: 'Launch', description: 'Go live', date: '2024-04-01', status: 'pending' },
  { id: '5', title: 'Review', description: 'Post-launch review', date: '2024-05-01', status: 'pending' }
]

describe('Timeline Widget', () => {
  describe('creation', () => {
    it('creates a timeline with default properties', () => {
      const tl = timeline()
      expect(tl.type).toBe('timeline')
      expect(tl.itemCount).toBe(0)
      expect(tl.selectedIndex).toBe(-1)
      expect(tl.selectedItem).toBeNull()
    })

    it('creates a timeline with items', () => {
      const tl = timeline({ items: sampleItems })
      expect(tl.itemCount).toBe(5)
    })

    it('creates a timeline with orientation', () => {
      const tl = timeline({ orientation: 'horizontal' })
      expect(tl.type).toBe('timeline')
    })

    it('creates a timeline without line', () => {
      const tl = timeline({ showLine: false })
      expect(tl.type).toBe('timeline')
    })

    it('creates a timeline without dates', () => {
      const tl = timeline({ showDates: false })
      expect(tl.type).toBe('timeline')
    })

    it('creates a timeline with reverse order', () => {
      const tl = timeline({ items: sampleItems, reverse: true })
      expect(tl.itemCount).toBe(5)
    })

    it('creates a timeline in compact mode', () => {
      const tl = timeline({ compact: true })
      expect(tl.type).toBe('timeline')
    })

    it('creates a non-selectable timeline', () => {
      const tl = timeline({ selectable: false })
      expect(tl.type).toBe('timeline')
    })

    it('creates a timeline with date positions', () => {
      const positions = ['left', 'right', 'inline'] as const
      for (const pos of positions) {
        const tl = timeline({ datePosition: pos })
        expect(tl.type).toBe('timeline')
      }
    })

    it('creates a timeline with max description width', () => {
      const tl = timeline({ maxDescriptionWidth: 50 })
      expect(tl.type).toBe('timeline')
    })
  })

  describe('configuration', () => {
    it('sets items', () => {
      const tl = timeline().items(sampleItems)
      expect(tl.itemCount).toBe(5)
    })

    it('resets state when setting items', () => {
      const tl = timeline({ items: sampleItems })
        .selectIndex(2)
        .items([{ id: 'new', title: 'New' }])
      expect(tl.selectedIndex).toBe(-1)
      expect(tl.itemCount).toBe(1)
    })

    it('adds item', () => {
      const tl = timeline()
        .addItem({ id: '1', title: 'First' })
        .addItem({ id: '2', title: 'Second' })
      expect(tl.itemCount).toBe(2)
    })

    it('removes item', () => {
      const tl = timeline({ items: sampleItems }).removeItem('2')
      expect(tl.itemCount).toBe(4)
    })

    it('removes non-existent item safely', () => {
      const tl = timeline({ items: sampleItems }).removeItem('nonexistent')
      expect(tl.itemCount).toBe(5)
    })

    it('updates selection when removing selected item', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(4).removeItem('5')
      expect(tl.selectedIndex).toBeLessThan(5)
    })

    it('updates item', () => {
      const tl = timeline({ items: sampleItems }).updateItem('3', { status: 'completed' })
      expect(tl.type).toBe('timeline')
    })

    it('updates non-existent item safely', () => {
      const tl = timeline({ items: sampleItems }).updateItem('nonexistent', { title: 'New' })
      expect(tl.itemCount).toBe(5)
    })

    it('sets orientation', () => {
      const tl = timeline().orientation('horizontal')
      expect(tl.type).toBe('timeline')
    })

    it('sets showLine', () => {
      const tl = timeline().showLine(false)
      expect(tl.type).toBe('timeline')
    })

    it('sets showDates', () => {
      const tl = timeline().showDates(false)
      expect(tl.type).toBe('timeline')
    })

    it('sets reverse', () => {
      const tl = timeline().reverse(true)
      expect(tl.type).toBe('timeline')
    })

    it('sets compact', () => {
      const tl = timeline().compact(true)
      expect(tl.type).toBe('timeline')
    })

    it('sets selectable', () => {
      const tl = timeline({ items: sampleItems })
        .selectIndex(0)
        .selectable(false)
      expect(tl.selectedIndex).toBe(-1)
    })

    it('sets datePosition', () => {
      const tl = timeline().datePosition('right')
      expect(tl.type).toBe('timeline')
    })

    it('sets maxDescriptionWidth', () => {
      const tl = timeline().maxDescriptionWidth(60)
      expect(tl.type).toBe('timeline')
    })
  })

  describe('navigation', () => {
    it('selects item by id', () => {
      const tl = timeline({ items: sampleItems }).selectItem('3')
      expect(tl.selectedItem?.id).toBe('3')
    })

    it('selects item by index', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(2)
      expect(tl.selectedIndex).toBe(2)
      expect(tl.selectedItem?.id).toBe('3')
    })

    it('selectItem does nothing when not selectable', () => {
      const tl = timeline({ items: sampleItems, selectable: false }).selectItem('3')
      expect(tl.selectedIndex).toBe(-1)
    })

    it('selectIndex does nothing when not selectable', () => {
      const tl = timeline({ items: sampleItems, selectable: false }).selectIndex(2)
      expect(tl.selectedIndex).toBe(-1)
    })

    it('ignores invalid selectItem id', () => {
      const tl = timeline({ items: sampleItems }).selectItem('nonexistent')
      expect(tl.selectedIndex).toBe(-1)
    })

    it('ignores out of bounds selectIndex', () => {
      const tl = timeline({ items: sampleItems })
        .selectIndex(-1)
        .selectIndex(100)
      expect(tl.selectedIndex).toBe(-1)
    })

    it('moves to next item', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(0)
      expect(tl.selectedIndex).toBe(0)
      tl.nextItem()
      expect(tl.selectedIndex).toBe(1)
    })

    it('stops at last item', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(4)
      tl.nextItem()
      expect(tl.selectedIndex).toBe(4)
    })

    it('moves to previous item', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(2)
      tl.previousItem()
      expect(tl.selectedIndex).toBe(1)
    }  )

    it('stops at first item', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(0)
      tl.previousItem()
      expect(tl.selectedIndex).toBe(0)
    })

    it('previousItem from -1 selects first', () => {
      const tl = timeline({ items: sampleItems })
      tl.previousItem()
      expect(tl.selectedIndex).toBe(0)
    })

    it('nextItem does nothing when not selectable', () => {
      const tl = timeline({ items: sampleItems, selectable: false })
      tl.nextItem()
      expect(tl.selectedIndex).toBe(-1)
    })

    it('previousItem does nothing when not selectable', () => {
      const tl = timeline({ items: sampleItems, selectable: false })
      tl.previousItem()
      expect(tl.selectedIndex).toBe(-1)
    })

    it('scrolls to item', () => {
      const tl = timeline({ items: sampleItems }).scrollToItem('4')
      expect(tl.selectedIndex).toBe(3)
    })

    it('scrollToItem ignores non-existent id', () => {
      const tl = timeline({ items: sampleItems }).scrollToItem('nonexistent')
      expect(tl.selectedIndex).toBe(-1)
    })
  })

  describe('focus', () => {
    it('focuses the timeline', () => {
      const tl = timeline({ items: sampleItems }).focus()
      expect(tl.isFocused).toBe(true)
      expect(tl.selectedIndex).toBe(0) // Auto-selects first item
    })

    it('focus does not auto-select when empty', () => {
      const tl = timeline().focus()
      expect(tl.isFocused).toBe(true)
      expect(tl.selectedIndex).toBe(-1)
    })

    it('blurs the timeline', () => {
      const tl = timeline().focus().blur()
      expect(tl.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('navigates with arrow keys', () => {
      const tl = timeline({ items: sampleItems }).focus()

      expect(tl.handleKey('down', false)).toBe(true)
      expect(tl.selectedIndex).toBe(1)

      expect(tl.handleKey('up', false)).toBe(true)
      expect(tl.selectedIndex).toBe(0)
    })

    it('navigates with j/k keys', () => {
      const tl = timeline({ items: sampleItems }).focus()

      expect(tl.handleKey('j', false)).toBe(true)
      expect(tl.selectedIndex).toBe(1)

      expect(tl.handleKey('k', false)).toBe(true)
      expect(tl.selectedIndex).toBe(0)
    })

    it('jumps to start/end with home/end', () => {
      const tl = timeline({ items: sampleItems }).focus()

      expect(tl.handleKey('end', false)).toBe(true)
      expect(tl.selectedIndex).toBe(4)

      expect(tl.handleKey('home', false)).toBe(true)
      expect(tl.selectedIndex).toBe(0)
    })

    it('triggers click with enter', () => {
      const handler = vi.fn()
      const tl = timeline({ items: sampleItems })
        .onClick(handler)
        .focus()

      tl.handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('triggers click with space', () => {
      const handler = vi.fn()
      const tl = timeline({ items: sampleItems })
        .onClick(handler)
        .focus()

      tl.handleKey('space', false)
      expect(handler).toHaveBeenCalled()
    })

    it('ignores keys when not focused', () => {
      const tl = timeline({ items: sampleItems })
      expect(tl.handleKey('down', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const tl = timeline({ items: sampleItems }).focus()
      expect(tl.handleKey('x', false)).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let tl: ReturnType<typeof timeline>

    beforeEach(() => {
      tl = timeline({ items: sampleItems })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
    })

    it('clicks on item in vertical mode', () => {
      const handler = vi.fn()
      tl.onClick(handler)

      expect(tl.handleMouse(10, 3, 'press')).toBe(true)
      expect(handler).toHaveBeenCalled()
      expect(tl.isFocused).toBe(true)
    })

    it('selects item on click', () => {
      tl.handleMouse(10, 0, 'press')
      expect(tl.selectedIndex).toBe(0)
    })

    it('clicks on item in horizontal mode', () => {
      const handler = vi.fn()
      tl.orientation('horizontal').onClick(handler)

      expect(tl.handleMouse(10, 1, 'press')).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('ignores when hidden', () => {
      ;(tl as any)._visible = false
      expect(tl.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(tl as any)._bounds = null
      expect(tl.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores non-press actions', () => {
      expect(tl.handleMouse(10, 0, 'release')).toBe(false)
      expect(tl.handleMouse(10, 0, 'move')).toBe(false)
    })

    it('ignores click outside items', () => {
      expect(tl.handleMouse(10, 20, 'press')).toBe(false)
    })
  })

  describe('events', () => {
    it('emits select event', () => {
      const handler = vi.fn()
      const tl = timeline({ items: sampleItems })
        .onSelect(handler)
        .selectIndex(1)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }), 1)
    })

    it('emits click event', () => {
      const handler = vi.fn()
      const tl = timeline({ items: sampleItems }).onClick(handler)
      ;(tl as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      tl.handleMouse(10, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('registers multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const tl = timeline({ items: sampleItems })
        .onSelect(handler1)
        .onSelect(handler2)
        .selectIndex(0)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty timeline', () => {
      const tl = timeline()
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical timeline', () => {
      const tl = timeline({ items: sampleItems })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal timeline', () => {
      const tl = timeline({ items: sampleItems, orientation: 'horizontal' })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact vertical timeline', () => {
      const tl = timeline({ items: sampleItems, compact: true })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact horizontal timeline', () => {
      const tl = timeline({ items: sampleItems, orientation: 'horizontal', compact: true })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with selection', () => {
      const tl = timeline({ items: sampleItems }).selectIndex(2).focus()
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with date on left', () => {
      const tl = timeline({ items: sampleItems, datePosition: 'left' })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 50, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with date on right', () => {
      const tl = timeline({ items: sampleItems, datePosition: 'right' })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 50, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with date inline', () => {
      const tl = timeline({ items: sampleItems, datePosition: 'inline' })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 50, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without line', () => {
      const tl = timeline({ items: sampleItems, showLine: false })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without dates', () => {
      const tl = timeline({ items: sampleItems, showDates: false })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders reversed', () => {
      const tl = timeline({ items: sampleItems, reverse: true })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders different statuses', () => {
      const items: TimelineItem[] = [
        { id: '1', title: 'Completed', status: 'completed' },
        { id: '2', title: 'Current', status: 'current' },
        { id: '3', title: 'Pending', status: 'pending' },
        { id: '4', title: 'Error', status: 'error' }
      ]
      const tl = timeline({ items })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with custom icons', () => {
      const items: TimelineItem[] = [
        { id: '1', title: 'Star', icon: '\u2605' },
        { id: '2', title: 'Heart', icon: '\u2665' }
      ]
      const tl = timeline({ items })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll indicators', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        title: `Item ${i}`
      }))
      const tl = timeline({ items: manyItems })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll indicators in horizontal', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        title: `Item ${i}`
      }))
      const tl = timeline({ items: manyItems, orientation: 'horizontal' })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const tl = timeline({ items: sampleItems })
      ;(tl as any)._visible = false
      ;(tl as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const tl = timeline({ items: sampleItems })
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const tl = timeline({ items: sampleItems })
      ;(tl as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      tl.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const selectHandler = vi.fn()
      const clickHandler = vi.fn()

      const tl = timeline()
        .items(sampleItems)
        .orientation('vertical')
        .showLine(true)
        .showDates(true)
        .reverse(false)
        .compact(false)
        .selectable(true)
        .datePosition('left')
        .maxDescriptionWidth(50)
        .onSelect(selectHandler)
        .onClick(clickHandler)
        .selectIndex(2)
        .focus()

      expect(tl.type).toBe('timeline')
      expect(tl.itemCount).toBe(5)
      expect(tl.selectedIndex).toBe(2)
      expect(tl.isFocused).toBe(true)
      expect(selectHandler).toHaveBeenCalled()
    })
  })
})
