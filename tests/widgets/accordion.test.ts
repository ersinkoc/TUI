/**
 * Accordion widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { accordion, text } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Accordion Widget', () => {
  describe('creation', () => {
    it('creates an accordion with default properties', () => {
      const a = accordion()
      expect(a.type).toBe('accordion')
      expect(a.panelCount).toBe(0)
      expect(a.expandedPanels).toEqual([])
      expect(a.isFocused).toBe(false)
    })

    it('creates an accordion with panels', () => {
      const a = accordion({
        panels: [
          { id: 'p1', title: 'Panel 1', content: text('Content 1') },
          { id: 'p2', title: 'Panel 2', content: text('Content 2') }
        ]
      })
      expect(a.panelCount).toBe(2)
    })

    it('creates an accordion with expanded panel', () => {
      const a = accordion({
        panels: [
          { id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true }
        ]
      })
      expect(a.expandedPanels).toContain('p1')
    })

    it('creates an accordion with multiple mode', () => {
      const a = accordion({ multiple: true })
      expect(a.type).toBe('accordion')
    })
  })

  describe('configuration', () => {
    it('sets panels', () => {
      const a = accordion().panels([
        { id: 'p1', title: 'Panel 1', content: text('Content 1') },
        { id: 'p2', title: 'Panel 2', content: text('Content 2') }
      ])
      expect(a.panelCount).toBe(2)
    })

    it('adds a panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
      expect(a.panelCount).toBe(1)
    })

    it('removes a panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .removePanel('p1')
      expect(a.panelCount).toBe(1)
    })

    it('removes panel and adjusts focus when focused panel is last', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()
        .focusNext() // Focus p2 (index 1)
      expect(a.focusedPanel).toBe('p2')
      a.removePanel('p2') // Remove focused panel
      expect(a.focusedPanel).toBe('p1') // Focus should adjust to p1
    })

    it('sets multiple mode', () => {
      const a = accordion().multiple(true)
      expect(a.type).toBe('accordion')
    })

    it('disabling multiple mode keeps only first expanded panel', () => {
      const a = accordion()
        .multiple(true)
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .expand('p1')
        .expand('p2')
      expect(a.expandedPanels).toContain('p1')
      expect(a.expandedPanels).toContain('p2')
      a.multiple(false)
      expect(a.expandedPanels.length).toBe(1)
      expect(a.expandedPanels).toContain('p1')
    })

    it('sets collapsible mode', () => {
      const a = accordion().collapsible(true)
      expect(a.type).toBe('accordion')
    })

    it('sets show borders', () => {
      const a = accordion().showBorders(true)
      expect(a.type).toBe('accordion')
    })

    it('sets expand icon', () => {
      const a = accordion().expandIcon('+')
      expect(a.type).toBe('accordion')
    })

    it('sets collapse icon', () => {
      const a = accordion().collapseIcon('-')
      expect(a.type).toBe('accordion')
    })
  })

  describe('expand/collapse', () => {
    it('expands a panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .expand('p1')
      expect(a.expandedPanels).toContain('p1')
    })

    it('collapses a panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .collapse('p1')
      expect(a.expandedPanels).not.toContain('p1')
    })

    it('toggles a panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })

      a.toggle('p1')
      expect(a.expandedPanels).toContain('p1')

      a.toggle('p1')
      expect(a.expandedPanels).not.toContain('p1')
    })

    it('expands all panels in multiple mode', () => {
      const a = accordion({ multiple: true })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .expandAll()
      expect(a.expandedPanels).toContain('p1')
      expect(a.expandedPanels).toContain('p2')
    })

    it('collapses all panels', () => {
      const a = accordion({ multiple: true })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2'), expanded: true })
        .collapseAll()
      expect(a.expandedPanels).toEqual([])
    })

    it('single mode collapses other panels on expand', () => {
      const a = accordion({ multiple: false })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .expand('p2')
      expect(a.expandedPanels).toEqual(['p2'])
    })

    it('does not expand disabled panels', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), disabled: true })
        .expand('p1')
      expect(a.expandedPanels).not.toContain('p1')
    })

    it('non-collapsible mode keeps at least one panel open', () => {
      const a = accordion({ collapsible: false })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .collapse('p1')
      expect(a.expandedPanels).toContain('p1')
    })
  })

  describe('focus', () => {
    it('focuses the accordion', () => {
      const a = accordion()
      a.focus()
      expect(a.isFocused).toBe(true)
    })

    it('blurs the accordion', () => {
      const a = accordion()
      a.focus()
      a.blur()
      expect(a.isFocused).toBe(false)
    })

    it('focuses next panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()

      expect(a.focusedPanel).toBe('p1')
      a.focusNext()
      expect(a.focusedPanel).toBe('p2')
    })

    it('focuses previous panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()

      a.focusNext()
      a.focusPrevious()
      expect(a.focusedPanel).toBe('p1')
    })

    it('wraps focus around', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()

      a.focusNext()
      a.focusNext()
      expect(a.focusedPanel).toBe('p1')
    })
  })

  describe('events', () => {
    it('emits onExpand when panel is expanded', () => {
      const handler = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .onExpand(handler)
        .expand('p1')
      expect(handler).toHaveBeenCalledWith('p1')
    })

    it('emits onCollapse when panel is collapsed', () => {
      const handler = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .onCollapse(handler)
        .collapse('p1')
      expect(handler).toHaveBeenCalledWith('p1')
    })

    it('emits onFocus when focused', () => {
      const handler = vi.fn()
      const a = accordion().onFocus(handler)
      a.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onBlur when blurred', () => {
      const handler = vi.fn()
      const a = accordion().onBlur(handler)
      a.focus()
      a.blur()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('handles down/j to focus next', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()

      let handled = (a as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(a.focusedPanel).toBe('p2')
    })

    it('handles up/k to focus previous', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()
        .focusNext()

      let handled = (a as any).handleKey('up', false)
      expect(handled).toBe(true)
      expect(a.focusedPanel).toBe('p1')
    })

    it('handles enter/space to toggle panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .focus()

      let handled = (a as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(a.expandedPanels).toContain('p1')
    })

    it('handles home to focus first', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()
        .focusNext()

      let handled = (a as any).handleKey('home', false)
      expect(handled).toBe(true)
      expect(a.focusedPanel).toBe('p1')
    })

    it('handles end to focus last', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .focus()

      let handled = (a as any).handleKey('end', false)
      expect(handled).toBe(true)
      expect(a.focusedPanel).toBe('p2')
    })

    it('ignores keys when not focused', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })

      let handled = (a as any).handleKey('down', false)
      expect(handled).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('returns false for clicks outside bounds', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
      ;(a as any)._bounds = { x: 10, y: 10, width: 30, height: 10 }

      const result = (a as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })

    it('returns true for non-press actions within bounds', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
      ;(a as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      const result = (a as any).handleMouse(5, 0, 'move')
      expect(result).toBe(true)
    })

    it('clicks on panel header to toggle', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
      ;(a as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // Click on first panel header (y=0)
      ;(a as any).handleMouse(5, 0, 'press')
      expect(a.expandedPanels).toContain('p1')
      expect(a.focusedPanel).toBe('p1')
    })

    it('clicks on second panel header', () => {
      const a = accordion()
        .showBorders(false)
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
      ;(a as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // Click on second panel header (y=1, since first panel is collapsed and no borders)
      ;(a as any).handleMouse(5, 1, 'press')
      expect(a.expandedPanels).toContain('p2')
      expect(a.focusedPanel).toBe('p2')
    })

    it('does not toggle disabled panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), disabled: true })
      ;(a as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      ;(a as any).handleMouse(5, 0, 'press')
      expect(a.expandedPanels).not.toContain('p1')
      expect(a.focusedPanel).toBe('p1') // Focus still moves
    })

    it('returns true for click in content area', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .expand('p1')
      ;(a as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // Click in content area (below header)
      const result = (a as any).handleMouse(5, 2, 'press')
      expect(result).toBe(true)
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

    it('renders empty accordion', () => {
      const a = accordion()
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('renders accordion with panels', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders accordion with expanded panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused accordion', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .focus()
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with icon', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Settings', icon: '⚙', content: text('Content') })
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders panel with long title truncation', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'This is a very long panel title that exceeds available width', content: text('Content') })
      ;(a as any)._bounds = { x: 0, y: 0, width: 20, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const a = accordion()
      ;(a as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const a = accordion().visible(false)
      ;(a as any)._bounds = { x: 0, y: 0, width, height }
      a.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const a = accordion()
        .multiple(true)
        .collapsible(true)
        .showBorders(true)
        .expandIcon('+')
        .collapseIcon('-')
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })
        .expand('p1')
        .expand('p2')
        .collapse('p1')
        .focus()
        .focusNext()
        .blur()

      expect(a.type).toBe('accordion')
      expect(a.panelCount).toBe(2)
    })
  })
})
