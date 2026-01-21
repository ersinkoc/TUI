import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  help,
  helpItems,
  helpSection,
  commonHelpItems,
  vimHelpItems
} from '../../src/widgets/help'
import type { HelpItem, HelpSection } from '../../src/widgets/help'
import { createBuffer } from '../../src/core/buffer'

describe('help widget', () => {
  describe('creation', () => {
    it('should create a help widget', () => {
      const h = help()
      expect(h.type).toBe('help')
    })

    it('should accept props', () => {
      const h = help({
        title: 'Test Help',
        width: 60,
        height: 30,
        border: 'double',
        searchable: true,
        centered: true,
        backdrop: true
      })
      expect(h.type).toBe('help')
    })

    it('should start closed', () => {
      const h = help()
      expect(h.isOpen).toBe(false)
    })
  })

  describe('configuration', () => {
    it('should set title', () => {
      const h = help()
      h.title('My Help')
      expect(h.type).toBe('help')
    })

    it('should set width', () => {
      const h = help()
      h.width(80)
      expect(h.type).toBe('help')
    })

    it('should set height', () => {
      const h = help()
      h.height(40)
      expect(h.type).toBe('help')
    })

    it('should set border style', () => {
      const h = help()
      h.border('rounded')
      h.border('single')
      h.border('double')
      h.border('bold')
      expect(h.type).toBe('help')
    })

    it('should set searchable', () => {
      const h = help()
      h.searchable(true)
      h.searchable(false)
      expect(h.type).toBe('help')
    })

    it('should set centered', () => {
      const h = help()
      h.centered(true)
      h.centered(false)
      expect(h.type).toBe('help')
    })

    it('should set backdrop', () => {
      const h = help()
      h.backdrop(true)
      h.backdrop(false)
      expect(h.type).toBe('help')
    })

    it('should set closeOnEscape', () => {
      const h = help()
      h.closeOnEscape(true)
      h.closeOnEscape(false)
      expect(h.type).toBe('help')
    })

    it('should chain configuration methods', () => {
      const h = help()
        .title('Help')
        .width(60)
        .height(40)
        .border('rounded')
        .searchable(true)
        .centered(true)
        .backdrop(true)
        .closeOnEscape(true)
      expect(h.type).toBe('help')
    })
  })

  describe('content management', () => {
    it('should add single item', () => {
      const h = help()
      h.addItem({
        key: 'Ctrl+S',
        description: 'Save file'
      })
      expect(h.visibleItems).toHaveLength(1)
      expect(h.visibleItems[0]?.key).toBe('Ctrl+S')
    })

    it('should add item with category', () => {
      const h = help()
      h.addItem({
        key: 'Enter',
        description: 'Confirm',
        category: 'Actions'
      })
      expect(h.visibleItems).toHaveLength(1)
      expect(h.visibleItems[0]?.category).toBe('Actions')
    })

    it('should add multiple items', () => {
      const h = help()
      h.addItems([
        { key: 'j', description: 'Move down' },
        { key: 'k', description: 'Move up' },
        { key: 'h', description: 'Move left' },
        { key: 'l', description: 'Move right' }
      ])
      expect(h.visibleItems).toHaveLength(4)
    })

    it('should add section', () => {
      const h = help()
      h.addSection({
        title: 'Navigation',
        items: [
          { key: 'j', description: 'Down' },
          { key: 'k', description: 'Up' }
        ]
      })
      expect(h.visibleItems).toHaveLength(2)
      expect(h.visibleItems[0]?.category).toBe('Navigation')
    })

    it('should merge sections with same title', () => {
      const h = help()
      h.addSection({
        title: 'Nav',
        items: [{ key: 'j', description: 'Down' }]
      })
      h.addSection({
        title: 'Nav',
        items: [{ key: 'k', description: 'Up' }]
      })
      expect(h.visibleItems).toHaveLength(2)
    })

    it('should set sections', () => {
      const h = help()
      h.setSections([
        {
          title: 'Section 1',
          items: [{ key: 'a', description: 'Action A' }]
        },
        {
          title: 'Section 2',
          items: [{ key: 'b', description: 'Action B' }]
        }
      ])
      expect(h.visibleItems).toHaveLength(2)
    })

    it('should clear items', () => {
      const h = help()
      h.addItems([
        { key: 'a', description: 'A' },
        { key: 'b', description: 'B' }
      ])
      expect(h.visibleItems).toHaveLength(2)
      h.clearItems()
      expect(h.visibleItems).toHaveLength(0)
    })
  })

  describe('open/close control', () => {
    it('should open', () => {
      const h = help()
      expect(h.isOpen).toBe(false)
      h.open()
      expect(h.isOpen).toBe(true)
    })

    it('should close', () => {
      const h = help()
      h.open()
      expect(h.isOpen).toBe(true)
      h.close()
      expect(h.isOpen).toBe(false)
    })

    it('should toggle', () => {
      const h = help()
      expect(h.isOpen).toBe(false)
      h.toggle()
      expect(h.isOpen).toBe(true)
      h.toggle()
      expect(h.isOpen).toBe(false)
    })

    it('should not double open', () => {
      const handler = vi.fn()
      const h = help().onOpen(handler)
      h.open()
      h.open()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not double close', () => {
      const handler = vi.fn()
      const h = help().onClose(handler)
      h.open()
      h.close()
      h.close()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should reset state on open', () => {
      const h = help()
      h.addItems([
        { key: 'a', description: 'A' },
        { key: 'b', description: 'B' },
        { key: 'c', description: 'C' }
      ])
      h.open()
      h.scrollDown(2)
      h.search('test')
      h.close()
      h.open()
      expect(h.scrollOffset).toBe(0)
      expect(h.currentSearch).toBe('')
    })
  })

  describe('navigation', () => {
    let h: ReturnType<typeof help>

    beforeEach(() => {
      h = help()
      h.addItems([
        { key: '1', description: 'Item 1' },
        { key: '2', description: 'Item 2' },
        { key: '3', description: 'Item 3' },
        { key: '4', description: 'Item 4' },
        { key: '5', description: 'Item 5' }
      ])
      h.open()
    })

    it('should scroll down', () => {
      h.scrollDown()
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })

    it('should scroll up', () => {
      h.scrollDown(3)
      h.scrollUp()
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })

    it('should scroll to top', () => {
      h.scrollDown(5)
      h.scrollToTop()
      expect(h.scrollOffset).toBe(0)
    })

    it('should scroll to bottom', () => {
      h.scrollToBottom()
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })

    it('should page up', () => {
      h.scrollDown(10)
      h.pageUp()
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })

    it('should page down', () => {
      h.pageDown()
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })
  })

  describe('search', () => {
    let h: ReturnType<typeof help>

    beforeEach(() => {
      h = help()
      h.addItems([
        { key: 'Ctrl+S', description: 'Save file', category: 'File' },
        { key: 'Ctrl+O', description: 'Open file', category: 'File' },
        { key: 'Ctrl+C', description: 'Copy', category: 'Edit' },
        { key: 'Ctrl+V', description: 'Paste', category: 'Edit' },
        { key: 'F1', description: 'Show help', category: 'Help' }
      ])
      h.open()
    })

    it('should filter by key', () => {
      h.search('Ctrl')
      expect(h.visibleItems).toHaveLength(4)
    })

    it('should filter by description', () => {
      h.search('file')
      expect(h.visibleItems).toHaveLength(2)
    })

    it('should filter by category', () => {
      h.search('Edit')
      expect(h.visibleItems).toHaveLength(2)
    })

    it('should clear search', () => {
      h.search('Ctrl')
      expect(h.visibleItems).toHaveLength(4)
      h.clearSearch()
      expect(h.visibleItems).toHaveLength(5)
    })

    it('should return current search query', () => {
      h.search('test query')
      expect(h.currentSearch).toBe('test query')
    })

    it('should handle empty search', () => {
      h.search('')
      expect(h.visibleItems).toHaveLength(5)
    })

    it('should handle no matches', () => {
      h.search('xyz123')
      expect(h.visibleItems).toHaveLength(0)
    })

    it('should be case insensitive', () => {
      h.search('CTRL')
      expect(h.visibleItems).toHaveLength(4)
    })
  })

  describe('events', () => {
    it('should call onOpen handler', () => {
      const handler = vi.fn()
      const h = help().onOpen(handler)
      h.open()
      expect(handler).toHaveBeenCalled()
    })

    it('should call onClose handler', () => {
      const handler = vi.fn()
      const h = help().onClose(handler)
      h.open()
      h.close()
      expect(handler).toHaveBeenCalled()
    })

    it('should call onSelect handler', () => {
      const handler = vi.fn()
      const h = help()
        .addItem({ key: 'Enter', description: 'Select' })
        .onSelect(handler)
        .open()

      // @ts-expect-error - accessing internal method
      h.handleKey('enter', false)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Enter',
        description: 'Select'
      }))
    })
  })

  describe('keyboard handling', () => {
    let h: ReturnType<typeof help>

    beforeEach(() => {
      h = help()
      h.addItems([
        { key: '1', description: 'Item 1' },
        { key: '2', description: 'Item 2' },
        { key: '3', description: 'Item 3' }
      ])
      h.open()
    })

    it('should close on escape', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('escape', false)
      expect(h.isOpen).toBe(false)
    })

    it('should not close on escape if disabled', () => {
      h.closeOnEscape(false)
      // @ts-expect-error - accessing internal method
      h.handleKey('escape', false)
      expect(h.isOpen).toBe(true)
    })

    it('should navigate with j/k keys', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('j', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('k', false)
      expect(h.isOpen).toBe(true)
    })

    it('should navigate with arrow keys', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('down', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('up', false)
      expect(h.isOpen).toBe(true)
    })

    it('should page with ctrl+d/ctrl+u', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('d', true)
      // @ts-expect-error - accessing internal method
      h.handleKey('u', true)
      expect(h.isOpen).toBe(true)
    })

    it('should go to top with g', () => {
      h.scrollDown(5)
      // @ts-expect-error - accessing internal method
      h.handleKey('g', false)
      expect(h.scrollOffset).toBe(0)
    })

    it('should go to bottom with end', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('end', false)
      expect(h.scrollOffset).toBeGreaterThanOrEqual(0)
    })

    it('should close with q', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('q', false)
      expect(h.isOpen).toBe(false)
    })

    it('should enter search mode with /', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('/', false)
      // Now in search mode, typing should add to search
      // @ts-expect-error - accessing internal method
      h.handleKey('a', false)
      expect(h.currentSearch).toBe('a')
    })

    it('should exit search mode with enter', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('/', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('t', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('enter', false)
      // Should still be open, just exited search mode
      expect(h.isOpen).toBe(true)
    })

    it('should exit search mode with escape', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('/', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('escape', false)
      expect(h.currentSearch).toBe('')
    })

    it('should handle backspace in search', () => {
      // @ts-expect-error - accessing internal method
      h.handleKey('/', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('a', false)
      // @ts-expect-error - accessing internal method
      h.handleKey('b', false)
      expect(h.currentSearch).toBe('ab')
      // @ts-expect-error - accessing internal method
      h.handleKey('backspace', false)
      expect(h.currentSearch).toBe('a')
    })

    it('should not handle keys when closed', () => {
      h.close()
      // @ts-expect-error - accessing internal method
      const result = h.handleKey('j', false)
      expect(result).toBe(false)
    })
  })

  describe('rendering', () => {
    it('should render when open', () => {
      const h = help()
        .addItem({ key: 'Enter', description: 'Select item' })
        .open()

      // Set bounds
      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should have rendered something
      const cell = buffer.get(40, 12)
      expect(cell).toBeDefined()
    })

    it('should not render when closed', () => {
      const h = help()
        .addItem({ key: 'Enter', description: 'Select' })

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should not have rendered (all cells should be default)
      const cell = buffer.get(0, 0)
      expect(cell.char).toBe(' ')
    })

    it('should handle small dimensions', () => {
      const h = help()
        .addItem({ key: 'a', description: 'b' })
        .open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(10, 10)
      // Should not throw
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })

    it('should render with custom dimensions', () => {
      const h = help({ width: 60, height: 20 })
        .addItem({ key: 'test', description: 'Test item' })
        .open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 100, height: 50 }

      const buffer = createBuffer(100, 50)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })

    it('should render without backdrop', () => {
      const h = help({ backdrop: false })
        .addItem({ key: 'x', description: 'Close' })
        .open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })

    it('should render without search bar', () => {
      const h = help({ searchable: false })
        .addItem({ key: 'x', description: 'Close' })
        .open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })

    it('should render multiple sections', () => {
      const h = help()
        .addSection({
          title: 'Section A',
          items: [{ key: 'a', description: 'Action A' }]
        })
        .addSection({
          title: 'Section B',
          items: [{ key: 'b', description: 'Action B' }]
        })
        .open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })

    it('should render scroll indicator for many items', () => {
      const h = help()
      for (let i = 0; i < 50; i++) {
        h.addItem({ key: `key${i}`, description: `Description ${i}` })
      }
      h.open()

      // @ts-expect-error - accessing internal property
      h._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      h.render(buffer, { fg: 7, bg: 0, attrs: 0 })
    })
  })
})

describe('helpItems helper', () => {
  it('should create items from map', () => {
    const items = helpItems({
      'Ctrl+S': 'Save',
      'Ctrl+O': 'Open'
    })
    expect(items).toHaveLength(2)
    expect(items[0]?.key).toBe('Ctrl+S')
    expect(items[0]?.description).toBe('Save')
  })

  it('should add category to items', () => {
    const items = helpItems({
      'Ctrl+S': 'Save'
    }, 'File')
    expect(items[0]?.category).toBe('File')
  })
})

describe('helpSection helper', () => {
  it('should create section from map', () => {
    const section = helpSection('Navigation', {
      'j': 'Down',
      'k': 'Up'
    })
    expect(section.title).toBe('Navigation')
    expect(section.items).toHaveLength(2)
  })

  it('should set category on items', () => {
    const section = helpSection('Test', {
      'a': 'Action'
    })
    expect(section.items[0]?.category).toBe('Test')
  })
})

describe('commonHelpItems', () => {
  it('should have navigation section', () => {
    const navSection = commonHelpItems.find(s => s.title === 'Navigation')
    expect(navSection).toBeDefined()
    expect(navSection!.items.length).toBeGreaterThan(0)
  })

  it('should have actions section', () => {
    const actionsSection = commonHelpItems.find(s => s.title === 'Actions')
    expect(actionsSection).toBeDefined()
  })

  it('should have search section', () => {
    const searchSection = commonHelpItems.find(s => s.title === 'Search & Filter')
    expect(searchSection).toBeDefined()
  })
})

describe('vimHelpItems', () => {
  it('should have vim modes section', () => {
    const modesSection = vimHelpItems.find(s => s.title === 'Vim Modes')
    expect(modesSection).toBeDefined()
    expect(modesSection!.items.some(i => i.key === 'i')).toBe(true)
  })

  it('should have vim navigation section', () => {
    const navSection = vimHelpItems.find(s => s.title === 'Vim Navigation')
    expect(navSection).toBeDefined()
    expect(navSection!.items.some(i => i.key.includes('h/j/k/l'))).toBe(true)
  })

  it('should have vim actions section', () => {
    const actionsSection = vimHelpItems.find(s => s.title === 'Vim Actions')
    expect(actionsSection).toBeDefined()
    expect(actionsSection!.items.some(i => i.key === 'dd')).toBe(true)
  })
})
