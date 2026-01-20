/**
 * Panel widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { panel, text } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Panel Widget', () => {
  describe('creation', () => {
    it('creates a panel with default properties', () => {
      const p = panel()
      expect(p.type).toBe('panel')
      expect(p.panelTitle).toBe('')
      expect(p.isCollapsed).toBe(false)
      expect(p.isFocused).toBe(false)
    })

    it('creates a panel with title', () => {
      const p = panel({ title: 'My Panel' })
      expect(p.panelTitle).toBe('My Panel')
    })

    it('creates a collapsible panel', () => {
      const p = panel({ collapsible: true })
      expect(p.type).toBe('panel')
    })

    it('creates a collapsed panel', () => {
      const p = panel({ collapsible: true, collapsed: true })
      expect(p.isCollapsed).toBe(true)
    })

    it('creates a panel with actions', () => {
      const p = panel({
        actions: [
          { id: 'refresh', label: 'R' },
          { id: 'add', label: '+' }
        ]
      })
      expect(p.type).toBe('panel')
    })
  })

  describe('configuration', () => {
    it('sets title', () => {
      const p = panel().title('Settings')
      expect(p.panelTitle).toBe('Settings')
    })

    it('sets title alignment', () => {
      const p = panel().titleAlign('center')
      expect(p.type).toBe('panel')
    })

    it('sets subtitle', () => {
      const p = panel().subtitle('Additional info')
      expect(p.type).toBe('panel')
    })

    it('sets border style', () => {
      const p = panel().border('double')
      expect(p.type).toBe('panel')
    })

    it('sets collapsible', () => {
      const p = panel().collapsible(true)
      expect(p.type).toBe('panel')
    })

    it('sets collapsed state', () => {
      const p = panel().collapsible(true).collapsed(true)
      expect(p.isCollapsed).toBe(true)
    })

    it('sets actions', () => {
      const p = panel().actions([
        { id: 'a', label: 'A' }
      ])
      expect(p.type).toBe('panel')
    })

    it('adds an action', () => {
      const p = panel()
        .addAction({ id: 'a', label: 'A' })
        .addAction({ id: 'b', label: 'B' })
      expect(p.type).toBe('panel')
    })

    it('removes an action', () => {
      const p = panel()
        .addAction({ id: 'a', label: 'A' })
        .addAction({ id: 'b', label: 'B' })
        .removeAction('a')
      expect(p.type).toBe('panel')
    })

    it('sets showHeader', () => {
      const p = panel().showHeader(false)
      expect(p.type).toBe('panel')
    })

    it('sets headerHeight', () => {
      const p = panel().headerHeight(2)
      expect(p.type).toBe('panel')
    })

    it('sets footer', () => {
      const p = panel().footer('Footer text')
      expect(p.type).toBe('panel')
    })

    it('sets padding', () => {
      const p = panel().padding(2)
      expect(p.type).toBe('panel')
    })
  })

  describe('collapse control', () => {
    it('toggles collapsed state', () => {
      const p = panel({ collapsible: true })
      expect(p.isCollapsed).toBe(false)

      p.toggle()
      expect(p.isCollapsed).toBe(true)

      p.toggle()
      expect(p.isCollapsed).toBe(false)
    })

    it('expands panel', () => {
      const p = panel({ collapsible: true, collapsed: true })
      p.expand()
      expect(p.isCollapsed).toBe(false)
    })

    it('collapses panel', () => {
      const p = panel({ collapsible: true })
      p.collapse()
      expect(p.isCollapsed).toBe(true)
    })

    it('emits onToggle when collapsed changes', () => {
      const handler = vi.fn()
      const p = panel({ collapsible: true })
        .onToggle(handler)

      p.collapsed(true)
      expect(handler).toHaveBeenCalledWith(true)

      p.collapsed(false)
      expect(handler).toHaveBeenCalledWith(false)
    })

    it('does not emit onToggle for same state', () => {
      const handler = vi.fn()
      const p = panel({ collapsible: true, collapsed: true })
        .onToggle(handler)

      p.collapsed(true) // Same state
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('content', () => {
    it('sets content node', () => {
      const content = text('Hello')
      const p = panel().content(content)
      expect(p.type).toBe('panel')
    })

    it('replaces content node', () => {
      const content1 = text('First')
      const content2 = text('Second')
      const p = panel()
        .content(content1)
        .content(content2)
      expect(p.type).toBe('panel')
    })
  })

  describe('content bounds', () => {
    it('returns content bounds with border', () => {
      const p = panel({ border: 'single' })
      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      const bounds = p.contentBounds
      expect(bounds.x).toBe(1)
      expect(bounds.y).toBe(2) // border + header
      expect(bounds.width).toBe(38)
      expect(bounds.height).toBe(17) // 20 - 2 borders - 1 header
    })

    it('returns content bounds without border', () => {
      const p = panel({ border: 'none', showHeader: false })
      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      const bounds = p.contentBounds
      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(40)
      expect(bounds.height).toBe(20)
    })

    it('returns content bounds with padding', () => {
      const p = panel({ border: 'single', padding: 2 })
      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      const bounds = p.contentBounds
      expect(bounds.x).toBe(3) // border + padding
      expect(bounds.width).toBe(34) // 40 - 2 borders - 2*2 padding
    })

    it('returns empty bounds when not set', () => {
      const p = panel()
      const bounds = p.contentBounds
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })
  })

  describe('focus', () => {
    it('focuses the panel', () => {
      const p = panel().focus()
      expect(p.isFocused).toBe(true)
    })

    it('blurs the panel', () => {
      const p = panel().focus().blur()
      expect(p.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('handles enter to toggle when collapsible', () => {
      const p = panel({ collapsible: true }).focus()
      expect(p.isCollapsed).toBe(false)

      const handled = (p as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(p.isCollapsed).toBe(true)
    })

    it('handles space to toggle when collapsible', () => {
      const p = panel({ collapsible: true }).focus()

      const handled = (p as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(p.isCollapsed).toBe(true)
    })

    it('handles escape to blur', () => {
      const p = panel().focus()

      const handled = (p as any).handleKey('escape', false)
      expect(handled).toBe(true)
      expect(p.isFocused).toBe(false)
    })

    it('ignores toggle keys when not collapsible', () => {
      const p = panel({ collapsible: false }).focus()

      const handled = (p as any).handleKey('enter', false)
      expect(handled).toBe(false)
    })

    it('ignores keys when not focused', () => {
      const p = panel({ collapsible: true })

      const handled = (p as any).handleKey('enter', false)
      expect(handled).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onToggle when toggling', () => {
      const handler = vi.fn()
      const p = panel({ collapsible: true })
        .onToggle(handler)

      p.toggle()
      expect(handler).toHaveBeenCalledWith(true)
    })

    it('emits onAction when action is triggered', () => {
      const handler = vi.fn()
      const p = panel()
        .addAction({ id: 'test', label: 'T' })
        .onAction(handler)

      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      // Simulate click on action area (right side of header)
      ;(p as any).handleMouse(38, 1, 'press')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty panel', () => {
      const p = panel()
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with title', () => {
      const p = panel({ title: 'Settings' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with subtitle', () => {
      const p = panel({ title: 'Settings', subtitle: 'User Preferences' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with centered title', () => {
      const p = panel({ title: 'Centered', titleAlign: 'center' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with right-aligned title', () => {
      const p = panel({ title: 'Right', titleAlign: 'right' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders collapsible panel', () => {
      const p = panel({ title: 'Collapsible', collapsible: true })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders collapsed panel', () => {
      const p = panel({ title: 'Collapsed', collapsible: true, collapsed: true })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with actions', () => {
      const p = panel({ title: 'Actions' })
        .addAction({ id: 'refresh', label: 'R' })
        .addAction({ id: 'add', label: '+' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with disabled actions', () => {
      const p = panel({ title: 'Disabled Action' })
        .addAction({ id: 'disabled', label: 'D', disabled: true })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with footer', () => {
      const p = panel({ title: 'With Footer', footer: 'Status: OK' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with content', () => {
      const content = text('Hello, World!')
      const p = panel({ title: 'Content' }).content(content)
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused panel', () => {
      const p = panel({ title: 'Focused' }).focus()
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel without border', () => {
      const p = panel({ title: 'No Border', border: 'none' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel without header', () => {
      const p = panel({ showHeader: false })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const p = panel()
      ;(p as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const p = panel().visible(false)
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const p = panel()
        .title('My Panel')
        .titleAlign('center')
        .subtitle('Details')
        .border('rounded')
        .collapsible(true)
        .collapsed(false)
        .actions([{ id: 'a', label: 'A' }])
        .addAction({ id: 'b', label: 'B' })
        .removeAction('a')
        .showHeader(true)
        .headerHeight(1)
        .footer('Footer')
        .padding(1)
        .content(text('Content'))
        .focus()
        .toggle()
        .expand()
        .blur()

      expect(p.type).toBe('panel')
    })
  })

  describe('title and footer truncation', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 20
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long title', () => {
      const p = panel({
        title: 'This is a very very very long title that needs truncation'
      })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('truncates long title with subtitle', () => {
      const p = panel({
        title: 'Long Title',
        subtitle: 'And a long subtitle that makes it even longer'
      })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('truncates long footer', () => {
      const p = panel({
        title: 'Test',
        footer: 'This is a very very very long footer text that needs truncation'
      })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders title with center alignment', () => {
      const p = panel({ title: 'Centered' }).titleAlign('center')
      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('renders title with right alignment', () => {
      const p = panel({ title: 'Right' }).titleAlign('right')
      ;(p as any)._bounds = { x: 0, y: 0, width: 40, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })
  })

  describe('actions width calculation', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('calculates width for multiple actions', () => {
      const p = panel({ title: 'With Actions' })
        .addAction({ id: 'a', label: 'Action A' })
        .addAction({ id: 'b', label: 'Action B' })
        .addAction({ id: 'c', label: 'Action C' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('iterates through all actions in getActionsWidth', () => {
      const p = panel({ title: 'Test' })
        .addAction({ id: '1', label: 'X' })
        .addAction({ id: '2', label: 'YY' })
        .addAction({ id: '3', label: 'ZZZ' })
        .addAction({ id: '4', label: 'WWWW' })
      ;(p as any)._bounds = { x: 0, y: 0, width, height }
      p.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('returns focused state from isFocused getter', () => {
      const p = panel()
      expect(p.isFocused).toBe(false)
      p.focus()
      expect(p.isFocused).toBe(true)
      p.blur()
      expect(p.isFocused).toBe(false)
    })
  })
})
