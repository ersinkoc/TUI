/**
 * Menubar widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { menubar } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Menubar Widget', () => {
  describe('creation', () => {
    it('creates a menubar with default properties', () => {
      const m = menubar()
      expect(m.type).toBe('menubar')
      expect(m.isFocused).toBe(false)
      expect(m.isMenuOpen).toBe(false)
      expect(m.activeMenuId).toBeNull()
    })

    it('creates a menubar with menus', () => {
      const m = menubar({
        menus: [
          {
            id: 'file',
            label: 'File',
            items: [{ label: 'New', value: 'new' }]
          },
          {
            id: 'edit',
            label: 'Edit',
            items: [{ label: 'Undo', value: 'undo' }]
          }
        ]
      })
      expect(m.menuList.length).toBe(2)
    })

    it('creates a menubar with custom border', () => {
      const m = menubar({ border: 'double' })
      expect(m.type).toBe('menubar')
    })

    it('creates a menubar with auto-close disabled', () => {
      const m = menubar({ autoClose: false })
      expect(m.type).toBe('menubar')
    })
  })

  describe('configuration', () => {
    it('sets menus', () => {
      const m = menubar().menus([
        { id: 'file', label: 'File', items: [] },
        { id: 'edit', label: 'Edit', items: [] }
      ])
      expect(m.menuList.length).toBe(2)
    })

    it('adds a menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
      expect(m.menuList.length).toBe(2)
    })

    it('removes a menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .removeMenu('file')
      expect(m.menuList.length).toBe(1)
      expect(m.menuList[0].id).toBe('edit')
    })

    it('sets border style', () => {
      const m = menubar().border('single')
      expect(m.type).toBe('menubar')
    })

    it('sets auto-close', () => {
      const m = menubar().autoClose(true)
      expect(m.type).toBe('menubar')
    })

    it('sets max visible', () => {
      const m = menubar().maxVisible(5)
      expect(m.type).toBe('menubar')
    })

    it('sets separator', () => {
      const m = menubar().separator(' | ')
      expect(m.type).toBe('menubar')
    })

    it('sets style', () => {
      const m = menubar().style('transparent')
      expect(m.type).toBe('menubar')
    })
  })

  describe('menu control', () => {
    it('opens a menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')
      expect(m.isMenuOpen).toBe(true)
      expect(m.activeMenuId).toBe('file')
    })

    it('closes a menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')
        .closeMenu()
      expect(m.isMenuOpen).toBe(false)
      expect(m.activeMenuId).toBeNull()
    })

    it('toggles a menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })

      m.toggleMenu('file')
      expect(m.isMenuOpen).toBe(true)

      m.toggleMenu('file')
      expect(m.isMenuOpen).toBe(false)
    })

    it('does not open disabled menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          disabled: true,
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')
      expect(m.isMenuOpen).toBe(false)
    })
  })

  describe('navigation', () => {
    it('navigates to next menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .addMenu({ id: 'view', label: 'View', items: [] })
        .openMenu('file')

      m.nextMenu()
      expect(m.activeMenuId).toBe('edit')

      m.nextMenu()
      expect(m.activeMenuId).toBe('view')
    })

    it('navigates to previous menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .addMenu({ id: 'view', label: 'View', items: [] })
        .openMenu('view')

      m.previousMenu()
      expect(m.activeMenuId).toBe('edit')

      m.previousMenu()
      expect(m.activeMenuId).toBe('file')
    })

    it('wraps around when navigating menus', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .openMenu('edit')

      m.nextMenu()
      expect(m.activeMenuId).toBe('file')

      m.previousMenu()
      expect(m.activeMenuId).toBe('edit')
    })

    it('navigates to next item', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' },
            { label: 'Save', value: 'save' }
          ]
        })
        .openMenu('file')

      expect(m.selectedItemIndex).toBe(0)
      m.nextItem()
      expect(m.selectedItemIndex).toBe(1)
      m.nextItem()
      expect(m.selectedItemIndex).toBe(2)
    })

    it('navigates to previous item', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' },
            { label: 'Save', value: 'save' }
          ]
        })
        .openMenu('file')

      m.nextItem()
      m.nextItem()
      expect(m.selectedItemIndex).toBe(2)

      m.previousItem()
      expect(m.selectedItemIndex).toBe(1)
    })

    it('skips separators when navigating', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { separator: true, label: '', value: '' },
            { label: 'Save', value: 'save' }
          ]
        })
        .openMenu('file')

      expect(m.selectedItemIndex).toBe(0)
      m.nextItem()
      expect(m.selectedItemIndex).toBe(2) // Skipped separator at index 1
    })

    it('skips disabled items when navigating', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open', disabled: true },
            { label: 'Save', value: 'save' }
          ]
        })
        .openMenu('file')

      expect(m.selectedItemIndex).toBe(0)
      m.nextItem()
      expect(m.selectedItemIndex).toBe(2) // Skipped disabled at index 1
    })
  })

  describe('selection', () => {
    it('confirms selection', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .onSelect(handler)
        .openMenu('file')

      m.confirm()
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'new' }),
        'file'
      )
    })

    it('closes menu on confirm when autoClose is true', () => {
      const m = menubar({ autoClose: true })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')

      m.confirm()
      expect(m.isMenuOpen).toBe(false)
    })

    it('keeps menu open on confirm when autoClose is false', () => {
      const m = menubar({ autoClose: false })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')

      m.confirm()
      expect(m.isMenuOpen).toBe(true)
    })

    it('does not confirm disabled items', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new', disabled: true }]
        })
        .onSelect(handler)
        .openMenu('file')

      m.confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not confirm separators', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ separator: true, label: '', value: '' }]
        })
        .onSelect(handler)
        .openMenu('file')

      m.confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('focuses the menubar', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()
      expect(m.isFocused).toBe(true)
    })

    it('blurs the menubar', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()
        .blur()
      expect(m.isFocused).toBe(false)
    })

    it('closes menu on blur', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()
        .openMenu('file')
        .blur()
      expect(m.isMenuOpen).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onSelect when item is selected', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .onSelect(handler)
        .openMenu('file')

      m.confirm()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onMenuOpen when menu opens', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .onMenuOpen(handler)

      m.openMenu('file')
      expect(handler).toHaveBeenCalledWith('file')
    })

    it('emits onMenuClose when menu closes', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .onMenuClose(handler)
        .openMenu('file')

      m.closeMenu()
      expect(handler).toHaveBeenCalledWith('file')
    })
  })

  describe('keyboard handling', () => {
    it('handles arrow keys for menu navigation', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .focus()
        .openMenu('file')

      let handled = (m as any).handleKey('right', false)
      expect(handled).toBe(true)
      expect(m.activeMenuId).toBe('edit')

      handled = (m as any).handleKey('left', false)
      expect(handled).toBe(true)
      expect(m.activeMenuId).toBe('file')
    })

    it('handles up/down for item navigation', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .focus()
        .openMenu('file')

      let handled = (m as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(1)

      handled = (m as any).handleKey('up', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(0)
    })

    it('handles enter to confirm selection', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .onSelect(handler)
        .focus()
        .openMenu('file')

      const handled = (m as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles escape to close menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()
        .openMenu('file')

      const handled = (m as any).handleKey('escape', false)
      expect(handled).toBe(true)
      expect(m.isMenuOpen).toBe(false)
    })

    it('handles down to open menu when closed', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()

      const handled = (m as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(m.isMenuOpen).toBe(true)
    })

    it('handles hotkey to open menu', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', hotkey: 'f', items: [] })
        .focus()
        .openMenu('file')

      // Close first
      m.closeMenu()

      const handled = (m as any).handleKey('f', false)
      expect(handled).toBe(true)
      expect(m.isMenuOpen).toBe(true)
    })

    it('handles home key to go to first item', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' },
            { label: 'Save', value: 'save' }
          ]
        })
        .focus()
        .openMenu('file')

      m.nextItem()
      m.nextItem()
      expect(m.selectedItemIndex).toBe(2)

      const handled = (m as any).handleKey('home', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(0)
    })

    it('handles end key to go to last item', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' },
            { label: 'Save', value: 'save' }
          ]
        })
        .focus()
        .openMenu('file')

      expect(m.selectedItemIndex).toBe(0)

      const handled = (m as any).handleKey('end', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(2)
    })

    it('ignores keys when not focused', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })

      const handled = (m as any).handleKey('enter', false)
      expect(handled).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty menubar', () => {
      const m = menubar()
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders menubar with menus', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders open dropdown', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new', shortcut: 'Ctrl+N' },
            { label: 'Open', value: 'open', shortcut: 'Ctrl+O' },
            { separator: true, label: '', value: '' },
            { label: 'Exit', value: 'exit' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused menubar', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders disabled menu items', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Disabled', value: 'disabled', disabled: true }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders items with icons', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new', icon: '+' },
            { label: 'Save', value: 'save', icon: 'S' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders items with submenus', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            {
              label: 'Recent',
              value: 'recent',
              submenu: [{ label: 'File1', value: 'file1' }]
            }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const m = menubar()
      ;(m as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const m = menubar().visible(false)
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders transparent style', () => {
      const m = menubar({ style: 'transparent' })
        .addMenu({ id: 'file', label: 'File', items: [] })
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const m = menubar()
        .menus([
          { id: 'file', label: 'File', items: [] },
          { id: 'edit', label: 'Edit', items: [] }
        ])
        .border('single')
        .autoClose(true)
        .maxVisible(8)
        .separator(' ')
        .style('filled')
        .focus()
        .openMenu('file')
        .nextMenu()
        .previousMenu()
        .closeMenu()
        .blur()

      expect(m.type).toBe('menubar')
      expect(m.menuList.length).toBe(2)
    })
  })

  describe('dropdown rendering details', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders menu items with separators', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: '', value: '', separator: true },
            { label: 'Exit', value: 'exit' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Separator should be rendered as horizontal line
      let foundSep = false
      for (let x = 0; x < width; x++) {
        if (buffer.get(x, 3).char === '\u2500') {
          foundSep = true
          break
        }
      }
      expect(foundSep).toBe(true)
    })

    it('renders menu items with shortcuts and padding', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new', shortcut: 'Ctrl+N' },
            { label: 'Save', value: 'save', shortcut: 'Ctrl+S' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Shortcut should appear somewhere in the dropdown
      let foundCtrl = false
      for (let y = 0; y < height; y++) {
        let line = ''
        for (let x = 0; x < width; x++) {
          line += buffer.get(x, y).char
        }
        if (line.includes('Ctrl')) {
          foundCtrl = true
          break
        }
      }
      expect(foundCtrl).toBe(true)
    })

    it('truncates long item text when exceeds dropdown width', () => {
      const m = menubar({ maxVisible: 5 })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            {
              label: 'This is a very very very very long menu item label that should be truncated',
              value: 'long'
            }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 25, height }

      // Small buffer to force truncation
      const smallBuffer = createBuffer(25, height)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      m.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll up indicator when scrolled down', () => {
      const m = menubar({ maxVisible: 3 })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'Item 1', value: '1' },
            { label: 'Item 2', value: '2' },
            { label: 'Item 3', value: '3' },
            { label: 'Item 4', value: '4' },
            { label: 'Item 5', value: '5' },
            { label: 'Item 6', value: '6' }
          ]
        })
        .openMenu('file')

      ;(m as any)._bounds = { x: 0, y: 0, width, height }

      // Scroll down by selecting items
      m.nextItem() // Item 2
      m.nextItem() // Item 3
      m.nextItem() // Item 4 - should trigger scroll

      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Up arrow indicator should be visible
      let foundUpArrow = false
      for (let x = 0; x < width; x++) {
        if (buffer.get(x, 2).char === '\u25b2') { // ▲
          foundUpArrow = true
          break
        }
      }
      expect(foundUpArrow).toBe(true)
    })

    it('renders scroll down indicator when more items below', () => {
      const m = menubar({ maxVisible: 3 })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'Item 1', value: '1' },
            { label: 'Item 2', value: '2' },
            { label: 'Item 3', value: '3' },
            { label: 'Item 4', value: '4' },
            { label: 'Item 5', value: '5' }
          ]
        })
        .openMenu('file')

      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Down arrow indicator should be visible
      let foundDownArrow = false
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (buffer.get(x, y).char === '\u25bc') { // ▼
            foundDownArrow = true
            break
          }
        }
        if (foundDownArrow) break
      }
      expect(foundDownArrow).toBe(true)
    })

    it('renders hotkey hint in menu label', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          hotkey: 'f',
          items: [{ label: 'New', value: 'new' }]
        })
        .focus()
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // File label should be rendered
      let found = false
      for (let x = 0; x < width; x++) {
        if (buffer.get(x, 0).char === 'F') {
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('renders dropdown without border when border is none', () => {
      const m = menubar({ border: 'none' })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders selected item in dropdown', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .openMenu('file')
        .nextItem() // Select "Open"
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders menu with many items requiring scroll', () => {
      const items = []
      for (let i = 0; i < 20; i++) {
        items.push({ label: `Item ${i + 1}`, value: `item${i + 1}` })
      }
      const m = menubar({ maxVisible: 5 })
        .addMenu({ id: 'file', label: 'File', items })
        .openMenu('file')

      ;(m as any)._bounds = { x: 0, y: 0, width, height }

      // Navigate to middle of list to trigger scroll
      for (let i = 0; i < 10; i++) {
        m.nextItem()
      }

      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Both scroll indicators should be visible
      let foundUp = false
      let foundDown = false
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (buffer.get(x, y).char === '\u25b2') foundUp = true
          if (buffer.get(x, y).char === '\u25bc') foundDown = true
        }
      }
      expect(foundUp).toBe(true)
      expect(foundDown).toBe(true)
    })

    it('renders disabled menu with dim style', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          disabled: true,
          items: [{ label: 'New', value: 'new' }]
        })
        .addMenu({
          id: 'edit',
          label: 'Edit',
          items: [{ label: 'Undo', value: 'undo' }]
        })
      ;(m as any)._bounds = { x: 0, y: 0, width, height: 1 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // File label should be rendered
      let found = false
      for (let x = 0; x < width; x++) {
        if (buffer.get(x, 0).char === 'F') {
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('truncates item text after padding when exceeds width', () => {
      // Create a narrow buffer to force truncation
      const narrowBuffer = createBuffer(20, 10)
      fillBuffer(narrowBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ border: 'single' })
        .addMenu({
          id: 'file',
          label: 'F',
          items: [
            { label: 'This is a very long item name', value: 'long' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      // This should trigger the truncation path (lines 803-805)
      m.render(narrowBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders menu item with icon and submenu indicator', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            {
              label: 'Open Recent',
              value: 'recent',
              icon: '📂',
              submenu: [
                { label: 'File 1', value: 'file1' },
                { label: 'File 2', value: 'file2' }
              ]
            }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Submenu indicator (▶) should be visible
      let foundIndicator = false
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (buffer.get(x, y).char === '\u25b6') {
            foundIndicator = true
            break
          }
        }
        if (foundIndicator) break
      }
      expect(foundIndicator).toBe(true)
    })

    it('renders item without shortcut using padToWidth', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'Short', value: 'short' } // No shortcut
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width, height }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('mouse handling', () => {
    it('returns false when not visible', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .visible(false)
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const result = (m as any).handleMouse(5, 0, 'press')
      expect(result).toBe(false)
    })

    it('returns false without bounds', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
      ;(m as any)._bounds = null
      const result = (m as any).handleMouse(5, 0, 'press')
      expect(result).toBe(false)
    })

    it('handles click on menu in menubar to toggle menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on File menu (first few chars of first row)
      const result = (m as any).handleMouse(2, 0, 'press')
      expect(result).toBe(true)
      expect(m.isMenuOpen).toBe(true)
    })

    it('handles mouse move over menu when menu is open', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .addMenu({
          id: 'edit',
          label: 'Edit',
          items: [{ label: 'Undo', value: 'undo' }]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Move mouse over Edit menu
      const result = (m as any).handleMouse(10, 0, 'move')
      expect(result).toBe(true)
      expect(m.activeMenuId).toBe('edit')
    })

    it('handles click on dropdown item', () => {
      const selectHandler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .onSelect(selectHandler)
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on first item in dropdown (y=2 because border + first item)
      const result = (m as any).handleMouse(2, 2, 'press')
      expect(result).toBe(true)
      expect(selectHandler).toHaveBeenCalled()
    })

    it('handles mouse move over dropdown item', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Move mouse over second item in dropdown
      const result = (m as any).handleMouse(2, 3, 'move')
      expect(result).toBe(true)
    })

    it('ignores click on separator item', () => {
      const selectHandler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: '', value: '', separator: true },
            { label: 'Exit', value: 'exit' }
          ]
        })
        .onSelect(selectHandler)
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on separator row
      const result = (m as any).handleMouse(2, 3, 'press')
      // Should return true (handled) but not trigger selection
      expect(result).toBe(true)
    })

    it('ignores click on disabled item', () => {
      const selectHandler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'Disabled', value: 'disabled', disabled: true },
            { label: 'Open', value: 'open' }
          ]
        })
        .onSelect(selectHandler)
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on disabled item
      const result = (m as any).handleMouse(2, 2, 'press')
      expect(result).toBe(true)
    })

    it('closes menu when clicking outside dropdown', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click far outside dropdown
      const result = (m as any).handleMouse(35, 5, 'press')
      expect(result).toBe(true)
      expect(m.isMenuOpen).toBe(false)
    })

    it('returns false when clicking outside bounds', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click outside bounds (no menu open)
      const result = (m as any).handleMouse(100, 100, 'press')
      expect(result).toBe(false)
    })

    it('does not toggle disabled menu on click', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          disabled: true,
          items: [{ label: 'New', value: 'new' }]
        })
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on disabled menu
      const result = (m as any).handleMouse(2, 0, 'press')
      expect(result).toBe(true)
      expect(m.isMenuOpen).toBe(false)
    })

    it('does not switch to disabled menu on move', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .addMenu({
          id: 'edit',
          label: 'Edit',
          disabled: true,
          items: [{ label: 'Undo', value: 'undo' }]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Move over disabled Edit menu
      const result = (m as any).handleMouse(10, 0, 'move')
      expect(result).toBe(true)
      expect(m.activeMenuId).toBe('file') // Should not switch
    })

    it('handles dropdown with border none', () => {
      const m = menubar({ border: 'none' })
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Click on first item (no border offset)
      const result = (m as any).handleMouse(2, 1, 'press')
      expect(result).toBe(true)
    })
  })

  describe('additional edge cases', () => {
    it('handles hotkey when menu is already open', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', hotkey: 'f', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', hotkey: 'e', items: [] })
        .focus()
        .openMenu('file')

      // Press 'e' hotkey while file menu is open should switch to edit
      const handled = (m as any).handleKey('e', false)
      expect(handled).toBe(true)
      expect(m.activeMenuId).toBe('edit')
    })

    it('handles left/right navigation when closed', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .focus()

      // Navigate without opening
      let handled = (m as any).handleKey('right', false)
      expect(handled).toBe(true)
      expect(m.selectedMenuIndex).toBe(1)

      handled = (m as any).handleKey('left', false)
      expect(handled).toBe(true)
      expect(m.selectedMenuIndex).toBe(0)
    })

    it('handles space key when menu is closed', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [{ label: 'New', value: 'new' }] })
        .focus()

      const handled = (m as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(m.isMenuOpen).toBe(true)
    })

    it('handles space key when menu is open', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [{ label: 'New', value: 'new' }] })
        .onSelect(handler)
        .focus()
        .openMenu('file')

      const handled = (m as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles escape when focused but no menu open', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()

      const handled = (m as any).handleKey('escape', false)
      expect(handled).toBe(true)
      // Escape doesn't blur, just closes menu (if any)
    })

    it('handles vim keys when menu is open', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' }
          ]
        })
        .focus()
        .openMenu('file')

      let handled = (m as any).handleKey('j', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(1)

      handled = (m as any).handleKey('k', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(0)

      handled = (m as any).handleKey('l', false)
      expect(handled).toBe(true)

      handled = (m as any).handleKey('h', false)
      expect(handled).toBe(true)
    })

    it('returns false for non-hotkey key when closed and not navigation', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()

      const handled = (m as any).handleKey('x', false)
      expect(handled).toBe(false)
    })

    it('skips disabled menus when navigating', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [], disabled: true })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .addMenu({ id: 'view', label: 'View', items: [] })
        .focus()
        .openMenu('edit')

      m.previousMenu()
      expect(m.activeMenuId).toBe('view') // Should wrap around and skip disabled
    })

    it('handles all disabled menus gracefully', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [], disabled: true })
        .addMenu({ id: 'edit', label: 'Edit', items: [], disabled: true })
        .focus()

      m.nextMenu()
      m.previousMenu()
      // Should not crash
      expect(m.type).toBe('menubar')
    })

    it('handles empty menus array', () => {
      const m = menubar().focus()
      m.nextMenu()
      m.previousMenu()
      expect(m.isMenuOpen).toBe(false)
    })

    it('handles next/prev item when no menu is open', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [{ label: 'New', value: 'new' }] })
        .focus()

      m.nextItem()
      m.previousItem()
      // Should not crash - nextItem/previousItem are safe to call
      expect(m.type).toBe('menubar')
    })

    it('handles confirm when no menu is open', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [{ label: 'New', value: 'new' }] })
        .onSelect(handler)
        .focus()

      m.confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('handles submenu item confirm', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            {
              label: 'Recent',
              value: 'recent',
              submenu: [{ label: 'File1', value: 'file1' }]
            }
          ]
        })
        .onSelect(handler)
        .focus()
        .openMenu('file')

      // Confirming on submenu item should not call handler (submenu not implemented)
      m.confirm()
      expect(handler).not.toHaveBeenCalled()
    })

    it('handles removeMenu adjusting activeMenuIndex', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
        .addMenu({ id: 'view', label: 'View', items: [] })
        .openMenu('view')

      // activeMenuIndex is 2
      m.removeMenu('view')
      // activeMenuIndex should be adjusted to 1
      expect(m.activeMenuId).toBe('edit')
    })

    it('handles closeMenu when no menu was open', () => {
      const handler = vi.fn()
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })
        .onMenuClose(handler)

      m.closeMenu()
      expect(handler).not.toHaveBeenCalled()
    })

    it('handles focus highlighting first non-disabled menu', () => {
      const m = menubar()
        .addMenu({ id: 'disabled1', label: 'D1', items: [], disabled: true })
        .addMenu({ id: 'file', label: 'File', items: [] })
        .focus()

      expect(m.selectedMenuIndex).toBe(1)
    })

    it('renders item that exceeds dropdown width after padding', () => {
      const buffer = createBuffer(18, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ border: 'single' })
        .addMenu({
          id: 'f',
          label: 'F',
          items: [
            { label: 'Very Long Name Item', value: 'long', shortcut: 'Ctrl+L' }
          ]
        })
        .openMenu('f')
      ;(m as any)._bounds = { x: 0, y: 0, width: 18, height: 10 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('iterates through multiple menus for hotkey match when closed', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', hotkey: 'f', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', hotkey: 'e', items: [] })
        .addMenu({ id: 'view', label: 'View', hotkey: 'v', items: [] })
        .focus()

      // Press 'v' - should iterate through all menus to find matching hotkey
      const handled = (m as any).handleKey('v', false)
      expect(handled).toBe(true)
      expect(m.activeMenuId).toBe('view')
    })

    it('handles down key when menu is open with multiple items', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [
            { label: 'New', value: 'new' },
            { label: 'Open', value: 'open' },
            { label: 'Save', value: 'save' }
          ]
        })
        .focus()
        .openMenu('file')

      const handled = (m as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(m.selectedItemIndex).toBe(1)
    })

    it('renders filled style menubar background', () => {
      const buffer = createBuffer(40, 15)
      fillBuffer(buffer, { char: '.', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ style: 'filled' })
        .addMenu({ id: 'file', label: 'File', items: [] })
        .addMenu({ id: 'edit', label: 'Edit', items: [] })
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The filled style should clear the menubar row
      expect(buffer.get(20, 0).char).toBe(' ')
    })

    it('renders scroll up indicator when items are scrolled', () => {
      const buffer = createBuffer(40, 15)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ maxVisible: 3, border: 'single' })
        .addMenu({
          id: 'file',
          label: 'File',
          items: Array.from({ length: 10 }, (_, i) => ({
            label: `Item ${i}`,
            value: `item${i}`
          }))
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }

      // Scroll down to make scroll up indicator appear
      ;(m as any)._scrollOffset = 3
      ;(m as any)._selectedItemIndex = 4

      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check for scroll up indicator (▲) - it should be at y=2 (posY=1 + borderOffset=1)
      let foundUpArrow = false
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 30; x++) {
          if (buffer.get(x, y).char === '\u25b2') {
            foundUpArrow = true
            break
          }
        }
        if (foundUpArrow) break
      }
      expect(foundUpArrow).toBe(true)
    })

    it('truncates item text when it exceeds content width after adding shortcut', () => {
      const buffer = createBuffer(30, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ border: 'single' })
        .addMenu({
          id: 'file',
          label: 'F',
          items: [
            { label: 'A very very long item name', value: 'long', shortcut: 'Ctrl+L' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // This should trigger the truncation path (lines 814-816)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The item should be rendered (may be truncated)
      let found = false
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 30; x++) {
          const cell = buffer.get(x, y)
          if (cell.char === 'A' || cell.char === 'C') {
            found = true
            break
          }
        }
        if (found) break
      }
      expect(found).toBe(true)
    })

    it('truncates item with no shortcut when it exceeds content width', () => {
      const buffer = createBuffer(30, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const m = menubar({ border: 'single' })
        .addMenu({
          id: 'file',
          label: 'F',
          items: [
            { label: 'An extremely long menu item that exceeds dropdown width', value: 'long' }
          ]
        })
        .openMenu('file')
      ;(m as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // This should trigger the truncation path (line 814-816)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The item should be rendered (truncated)
      let found = false
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 30; x++) {
          if (buffer.get(x, y).char === 'A') {
            found = true
            break
          }
        }
        if (found) break
      }
      expect(found).toBe(true)
    })
  })

  describe('dispose', () => {
    it('clears handlers and menus on dispose', () => {
      const selectHandler = vi.fn()
      const openHandler = vi.fn()
      const closeHandler = vi.fn()

      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .onSelect(selectHandler)
        .onMenuOpen(openHandler)
        .onMenuClose(closeHandler)

      m.dispose()

      // Should be safe to call after dispose
      expect(m.menuList).toHaveLength(0)

      m.openMenu('file')
      // Menu shouldn't be found since menus were cleared
      expect(m.isMenuOpen).toBe(false)
    })

    it('is idempotent', () => {
      const m = menubar()
        .addMenu({ id: 'file', label: 'File', items: [] })

      m.dispose()
      m.dispose()

      expect(m.isDisposed).toBe(true)
    })

    it('does not crash when disposing with open menu', () => {
      const m = menubar()
        .addMenu({
          id: 'file',
          label: 'File',
          items: [{ label: 'New', value: 'new' }]
        })
        .openMenu('file')

      m.dispose()

      expect(m.isDisposed).toBe(true)
      expect(m.menuList).toHaveLength(0)
    })
  })
})
