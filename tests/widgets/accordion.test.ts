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

  describe('handler cleanup', () => {
    it('should remove onExpand handler with offExpand', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .onExpand(handler)

      a.expand('p1')
      expect(callCount).toBe(1)

      a.offExpand(handler)
      a.expand('p1')
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onExpand handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .onExpand(handler1)
        .onExpand(handler2)

      a.expand('p1')
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      a.offExpand(handler1)
      a.collapse('p1')
      a.expand('p1')
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should be chainable after offExpand', () => {
      const a = accordion()
      const handler = vi.fn()
      const result = a.onExpand(handler).offExpand(handler)
      expect(result).toBe(a)
    })

    it('should handle offExpand with non-existent handler gracefully', () => {
      const a = accordion()
      const handler = vi.fn()
      expect(() => a.offExpand(handler)).not.toThrow()
    })

    it('should remove onCollapse handler with offCollapse', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .onCollapse(handler)

      a.collapse('p1')
      expect(callCount).toBe(1)

      a.offCollapse(handler)
      a.expand('p1')
      a.collapse('p1')
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onFocus handler with offFocus', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const a = accordion().onFocus(handler)

      a.focus()
      expect(callCount).toBe(1)

      a.offFocus(handler)
      a.blur()
      a.focus()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onBlur handler with offBlur', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const a = accordion().onBlur(handler)

      a.focus()
      a.blur()
      expect(callCount).toBe(1)

      a.offBlur(handler)
      a.focus()
      a.blur()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const expandHandler = vi.fn()
      const collapseHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })
        .onExpand(expandHandler)
        .onCollapse(collapseHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      a.clearHandlers()

      a.collapse('p1')
      a.expand('p1')
      a.focus()
      a.blur()

      expect(expandHandler).not.toHaveBeenCalled()
      expect(collapseHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should be chainable after clearHandlers', () => {
      const a = accordion()
      const result = a.onExpand(vi.fn()).clearHandlers()
      expect(result).toBe(a)
    })

    it('should allow adding handlers after clearHandlers', () => {
      const handler = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .onExpand(vi.fn())
        .clearHandlers()
        .onExpand(handler)

      a.expand('p1')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const expandHandler = vi.fn()
      const collapseHandler = vi.fn()
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .onExpand(expandHandler)
        .onCollapse(collapseHandler)
        .onFocus(focusHandler)
        .onBlur(blurHandler)

      a.dispose()

      a.expand('p1')
      a.collapse('p1')
      a.focus()
      a.blur()

      expect(expandHandler).not.toHaveBeenCalled()
      expect(collapseHandler).not.toHaveBeenCalled()
      expect(focusHandler).not.toHaveBeenCalled()
      expect(blurHandler).not.toHaveBeenCalled()
    })

    it('should clear panels on dispose', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })

      a.dispose()
      expect(a.panelCount).toBe(0)
      expect(a.expandedPanels).toEqual([])
    })

    it('should clear content parent references on dispose', () => {
      const content = text('Test')
      const a = accordion().addPanel({ id: 'p1', title: 'Panel 1', content })
      // Content parent should be set
      expect(content._parent).toBeDefined()

      a.dispose()
      // Parent reference should be cleared
      expect(content._parent).toBeNull()
    })

    it('should mark as disposed on dispose', () => {
      const a = accordion()
      a.dispose()
      expect((a as any)._disposed).toBe(true)
    })

    it('should not throw when disposing already disposed accordion', () => {
      const a = accordion()
      a.dispose()
      expect(() => a.dispose()).not.toThrow()
    })

    it('should not focus when disposed', () => {
      const handler = vi.fn()
      const a = accordion().onFocus(handler)
      a.dispose()

      a.focus()
      expect(handler).not.toHaveBeenCalled()
      expect(a.isFocused).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should not expand all when not in multiple mode', () => {
      const a = accordion({ multiple: false })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })

      a.expandAll()
      // Should only expand first panel in single mode
      expect(a.expandedPanels.length).toBe(0)
    })

    it('should not collapse all when not collapsible', () => {
      const a = accordion({ collapsible: false })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), expanded: true })

      a.collapseAll()
      expect(a.expandedPanels).toContain('p1')
    })

    it('should handle removing non-existent panel', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1') })

      a.removePanel('non-existent')
      expect(a.panelCount).toBe(1)
    })

    it('should handle focus navigation with no panels', () => {
      const a = accordion()

      a.focusNext()
      a.focusPrevious()
      expect(a.panelCount).toBe(0)
      expect(a.focusedPanel).toBeNull()
    })

    it('should handle expand on non-existent panel', () => {
      const a = accordion()
      a.expand('non-existent')
      expect(a.expandedPanels).toEqual([])
    })

    it('should handle collapse on non-existent panel', () => {
      const a = accordion()
      a.collapse('non-existent')
      expect(a.expandedPanels).toEqual([])
    })

    it('should handle toggle on non-existent panel', () => {
      const a = accordion()
      a.toggle('non-existent')
      expect(a.expandedPanels).toEqual([])
    })

    it('should handle keyboard navigation with no panels', () => {
      const a = accordion().focus()

      const downResult = (a as any).handleKey('down', false)
      const upResult = (a as any).handleKey('up', false)
      const enterResult = (a as any).handleKey('enter', false)

      expect(downResult).toBe(false)
      expect(upResult).toBe(false)
      expect(enterResult).toBe(false)
    })

    it('should not expand disabled panel via keyboard', () => {
      const a = accordion()
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), disabled: true })
        .focus()

      ;(a as any).handleKey('enter', false)
      expect(a.expandedPanels).not.toContain('p1')
    })

    it('should handle setting panels clears old panel parents', () => {
      const oldContent = text('Old')
      const a = accordion().addPanel({ id: 'p1', title: 'Panel 1', content: oldContent })
      expect(oldContent._parent).toBe(a)

      const newContent = text('New')
      a.panels([{ id: 'p2', title: 'Panel 2', content: newContent }])
      expect(oldContent._parent).toBeNull()
      expect(newContent._parent).toBe(a)
    })

    it('should handle adding panel with existing parent', () => {
      const content = text('Test')
      const a1 = accordion().addPanel({ id: 'p1', title: 'Panel 1', content })
      expect(content._parent).toBe(a1)

      const a2 = accordion().addPanel({ id: 'p2', title: 'Panel 2', content })
      expect(content._parent).toBe(a2)
    })

    it('should handle expandAll with disabled panels', () => {
      const a = accordion({ multiple: true })
        .addPanel({ id: 'p1', title: 'Panel 1', content: text('Content 1'), disabled: true })
        .addPanel({ id: 'p2', title: 'Panel 2', content: text('Content 2') })

      a.expandAll()
      expect(a.expandedPanels).not.toContain('p1')
      expect(a.expandedPanels).toContain('p2')
    })
  })
})
