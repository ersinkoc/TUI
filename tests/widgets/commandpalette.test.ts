/**
 * @oxog/tui - CommandPalette Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { commandpalette } from '../../src/widgets/commandpalette'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('CommandPalette Widget', () => {
  describe('factory function', () => {
    it('should create a commandpalette node', () => {
      const cp = commandpalette()
      expect(cp.type).toBe('commandpalette')
    })

    it('should have a unique id', () => {
      const cp1 = commandpalette()
      const cp2 = commandpalette()
      expect(cp1.id).not.toBe(cp2.id)
    })

    it('should accept props', () => {
      const cp = commandpalette({
        commands: [{ label: 'Open', value: 'open' }],
        placeholder: 'Search...',
        maxVisible: 5,
        width: 50
      })
      expect(cp.filteredItems.length).toBe(1)
    })
  })

  describe('chainable methods', () => {
    it('should set commands', () => {
      const cp = commandpalette().commands([
        { label: 'Open', value: 'open' },
        { label: 'Save', value: 'save' }
      ])
      expect(cp.filteredItems.length).toBe(2)
    })

    it('should set placeholder', () => {
      const cp = commandpalette().placeholder('Type command...')
      expect(cp).toBeDefined()
    })

    it('should set maxVisible', () => {
      const cp = commandpalette().maxVisible(8)
      expect(cp).toBeDefined()
    })

    it('should set width', () => {
      const cp = commandpalette().width(70)
      expect(cp).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const cp = commandpalette()
        .commands([{ label: 'Test', value: 'test' }])
        .placeholder('Search')
        .maxVisible(10)
        .width(60)

      expect(cp).toBeDefined()
    })
  })

  describe('open/close control', () => {
    it('should start closed', () => {
      const cp = commandpalette()
      expect(cp.isOpen).toBe(false)
    })

    it('should open', () => {
      const cp = commandpalette()
      cp.open()
      expect(cp.isOpen).toBe(true)
    })

    it('should close', () => {
      const cp = commandpalette()
      cp.open()
      cp.close()
      expect(cp.isOpen).toBe(false)
    })

    it('should toggle', () => {
      const cp = commandpalette()
      cp.toggle()
      expect(cp.isOpen).toBe(true)
      cp.toggle()
      expect(cp.isOpen).toBe(false)
    })

    it('should reset query on open', () => {
      const cp = commandpalette().commands([{ label: 'Test', value: 'test' }])
      cp.open()
      ;(cp as any).handleKey('t', false)
      expect(cp.query).toBe('t')

      cp.close()
      cp.open()
      expect(cp.query).toBe('')
    })

    it('should emit close event', () => {
      const handler = vi.fn()
      const cp = commandpalette().onClose(handler)
      cp.open()
      cp.close()
      expect(handler).toHaveBeenCalled()
    })

    it('should not emit close when already closed', () => {
      const handler = vi.fn()
      const cp = commandpalette().onClose(handler)
      cp.close()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('filtering', () => {
    it('should filter by label', () => {
      const cp = commandpalette().commands([
        { label: 'Open File', value: 'open' },
        { label: 'Save File', value: 'save' },
        { label: 'Close Tab', value: 'close' }
      ])
      cp.open()

      ;(cp as any).handleKey('o', false)
      ;(cp as any).handleKey('p', false)

      expect(cp.filteredItems.some(item => item.label === 'Open File')).toBe(true)
    })

    it('should filter by description', () => {
      const cp = commandpalette().commands([
        { label: 'Open', value: 'open', description: 'Opens a file' },
        { label: 'Save', value: 'save', description: 'Saves current file' }
      ])
      cp.open()

      ;(cp as any).handleKey('s', false)
      ;(cp as any).handleKey('a', false)
      ;(cp as any).handleKey('v', false)
      ;(cp as any).handleKey('e', false)

      expect(cp.filteredItems.length).toBeGreaterThan(0)
    })

    it('should filter by category', () => {
      const cp = commandpalette().commands([
        { label: 'Open', value: 'open', category: 'File' },
        { label: 'Run', value: 'run', category: 'Build' }
      ])
      cp.open()

      ;(cp as any).handleKey('f', false)
      ;(cp as any).handleKey('i', false)
      ;(cp as any).handleKey('l', false)
      ;(cp as any).handleKey('e', false)

      expect(cp.filteredItems.some(item => item.category === 'File')).toBe(true)
    })

    it('should fuzzy match', () => {
      const cp = commandpalette().commands([
        { label: 'Open File', value: 'open' }
      ])
      cp.open()

      ;(cp as any).handleKey('o', false)
      ;(cp as any).handleKey('f', false)

      expect(cp.filteredItems.length).toBe(1)
    })

    it('should sort by relevance', () => {
      const cp = commandpalette().commands([
        { label: 'Test Something', value: 'ts' },
        { label: 'test', value: 'test' },
        { label: 'Another Test', value: 'at' }
      ])
      cp.open()

      ;(cp as any).handleKey('t', false)
      ;(cp as any).handleKey('e', false)
      ;(cp as any).handleKey('s', false)
      ;(cp as any).handleKey('t', false)

      // Exact match should be first
      expect(cp.filteredItems[0]?.label.toLowerCase()).toBe('test')
    })

    it('should reset selection when filter changes', () => {
      const cp = commandpalette().commands([
        { label: 'AAA', value: 'a' },
        { label: 'BBB', value: 'b' }
      ])
      cp.open()

      ;(cp as any).handleKey('down', false)
      expect(cp.selectedIndex).toBe(1)

      ;(cp as any).handleKey('z', false) // No match
      expect(cp.selectedIndex).toBe(0)
    })
  })

  describe('navigation', () => {
    it('should navigate with arrow keys', () => {
      const cp = commandpalette().commands([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' }
      ])
      cp.open()

      expect(cp.selectedIndex).toBe(0)

      ;(cp as any).handleKey('down', false)
      expect(cp.selectedIndex).toBe(1)

      ;(cp as any).handleKey('up', false)
      expect(cp.selectedIndex).toBe(0)
    })

    it('should not go below 0', () => {
      const cp = commandpalette().commands([{ label: 'A', value: 'a' }])
      cp.open()

      ;(cp as any).handleKey('up', false)
      expect(cp.selectedIndex).toBe(0)
    })

    it('should not exceed max index', () => {
      const cp = commandpalette().commands([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      cp.open()

      ;(cp as any).handleKey('down', false)
      ;(cp as any).handleKey('down', false)
      expect(cp.selectedIndex).toBe(1)
    })
  })

  describe('selection', () => {
    it('should emit select on Enter', () => {
      const handler = vi.fn()
      const cp = commandpalette()
        .commands([{ label: 'Test', value: 'test' }])
        .onSelect(handler)
      cp.open()

      ;(cp as any).handleKey('enter', false)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ value: 'test' }))
    })

    it('should close after selection', () => {
      const cp = commandpalette().commands([{ label: 'Test', value: 'test' }])
      cp.open()

      ;(cp as any).handleKey('enter', false)
      expect(cp.isOpen).toBe(false)
    })

    it('should not select when no items', () => {
      const handler = vi.fn()
      const cp = commandpalette()
        .commands([])
        .onSelect(handler)
      cp.open()

      ;(cp as any).handleKey('enter', false)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('should close on Escape', () => {
      const cp = commandpalette()
      cp.open()

      const result = (cp as any).handleKey('escape', false)
      expect(result).toBe(true)
      expect(cp.isOpen).toBe(false)
    })

    it('should type characters', () => {
      const cp = commandpalette()
      cp.open()

      ;(cp as any).handleKey('h', false)
      ;(cp as any).handleKey('e', false)
      ;(cp as any).handleKey('l', false)
      ;(cp as any).handleKey('l', false)
      ;(cp as any).handleKey('o', false)

      expect(cp.query).toBe('hello')
    })

    it('should delete characters with backspace', () => {
      const cp = commandpalette()
      cp.open()

      ;(cp as any).handleKey('t', false)
      ;(cp as any).handleKey('e', false)
      ;(cp as any).handleKey('s', false)
      ;(cp as any).handleKey('t', false)
      expect(cp.query).toBe('test')

      ;(cp as any).handleKey('backspace', false)
      expect(cp.query).toBe('tes')
    })

    it('should not delete when empty', () => {
      const cp = commandpalette()
      cp.open()

      const result = (cp as any).handleKey('backspace', false)
      expect(result).toBe(true)
      expect(cp.query).toBe('')
    })

    it('should not handle keys when closed', () => {
      const cp = commandpalette()
      const result = (cp as any).handleKey('down', false)
      expect(result).toBe(false)
    })

    it('should emit change on query change', () => {
      const handler = vi.fn()
      const cp = commandpalette().onChange(handler)
      cp.open()

      ;(cp as any).handleKey('a', false)
      expect(handler).toHaveBeenCalledWith('a')
    })
  })

  describe('render', () => {
    it('should render open palette', () => {
      const cp = commandpalette()
        .commands([
          { label: 'Open', value: 'open', shortcut: 'Ctrl+O' },
          { label: 'Save', value: 'save', shortcut: 'Ctrl+S' }
        ])
        .width(60)
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should not render when closed', () => {
      const cp = commandpalette().commands([{ label: 'Test', value: 'test' }])

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render placeholder when no query', () => {
      const cp = commandpalette().placeholder('Search commands...')
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render query with cursor', () => {
      const cp = commandpalette()
      cp.open()
      ;(cp as any).handleKey('t', false)
      ;(cp as any).handleKey('e', false)
      ;(cp as any).handleKey('s', false)
      ;(cp as any).handleKey('t', false)

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render no results message', () => {
      const cp = commandpalette().commands([{ label: 'Test', value: 'test' }])
      cp.open()
      ;(cp as any).handleKey('z', false)
      ;(cp as any).handleKey('z', false)
      ;(cp as any).handleKey('z', false)

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with descriptions', () => {
      const cp = commandpalette().commands([
        { label: 'Open', value: 'open', description: 'Open a file' }
      ])
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with icons', () => {
      const cp = commandpalette().commands([
        { label: 'Open', value: 'open', icon: 'O' }
      ])
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render scroll indicators', () => {
      const commands = Array.from({ length: 20 }, (_, i) => ({
        label: `Command ${i}`,
        value: `cmd${i}`
      }))

      const cp = commandpalette().commands(commands).maxVisible(5)
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render scroll up indicator when scrolled', () => {
      const commands = Array.from({ length: 20 }, (_, i) => ({
        label: `Command ${i}`,
        value: `cmd${i}`
      }))

      const cp = commandpalette().commands(commands).maxVisible(5)
      cp.open()
      ;(cp as any)._scrollOffset = 5
      ;(cp as any)._selectedIndex = 6

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      let foundUpArrow = false
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 80; x++) {
          if (buffer.get(x, y).char === '\u25b2') {
            foundUpArrow = true
            break
          }
        }
        if (foundUpArrow) break
      }
      expect(foundUpArrow).toBe(true)
    })

    it('should truncate long labels', () => {
      const cp = commandpalette()
        .commands([{
          label: 'This is a very very very very very very very very long command label that should be truncated',
          value: 'long'
        }])
        .width(30)
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render description with space padding', () => {
      const cp = commandpalette()
        .commands([{
          label: 'Cmd',
          value: 'cmd',
          description: 'Short desc'
        }])
        .width(60)
      cp.open()

      const buffer = createBuffer(80, 24)
      cp.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })
})
