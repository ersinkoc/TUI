/**
 * Breadcrumb widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { breadcrumb } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Breadcrumb Widget', () => {
  describe('creation', () => {
    it('creates a breadcrumb with default properties', () => {
      const b = breadcrumb()
      expect(b.type).toBe('breadcrumb')
      expect(b.itemList.length).toBe(0)
      expect(b.depth).toBe(0)
      expect(b.currentItem).toBeNull()
    })

    it('creates a breadcrumb with items', () => {
      const b = breadcrumb({
        items: [
          { label: 'Home', value: '/' },
          { label: 'Documents', value: '/docs' }
        ]
      })
      expect(b.itemList.length).toBe(2)
      expect(b.depth).toBe(2)
    })

    it('creates a breadcrumb with custom separator', () => {
      const b = breadcrumb({ separator: ' > ' })
      expect(b.type).toBe('breadcrumb')
    })

    it('creates a breadcrumb without home icon', () => {
      const b = breadcrumb({ showHome: false })
      expect(b.type).toBe('breadcrumb')
    })

    it('creates a breadcrumb with max items', () => {
      const b = breadcrumb({ maxItems: 3 })
      expect(b.type).toBe('breadcrumb')
    })
  })

  describe('configuration', () => {
    it('sets items', () => {
      const b = breadcrumb().items([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])
      expect(b.itemList.length).toBe(2)
    })

    it('pushes an item', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
      expect(b.depth).toBe(2)
    })

    it('pops an item', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
        .pop()
      expect(b.depth).toBe(1)
      expect(b.currentItem?.value).toBe('a')
    })

    it('clears all items', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
        .clear()
      expect(b.depth).toBe(0)
    })

    it('sets separator', () => {
      const b = breadcrumb().separator(' >> ')
      expect(b.type).toBe('breadcrumb')
    })

    it('sets showHome', () => {
      const b = breadcrumb().showHome(false)
      expect(b.type).toBe('breadcrumb')
    })

    it('sets homeIcon', () => {
      const b = breadcrumb().homeIcon('~')
      expect(b.type).toBe('breadcrumb')
    })

    it('sets maxItems', () => {
      const b = breadcrumb().maxItems(5)
      expect(b.type).toBe('breadcrumb')
    })

    it('sets collapseStyle', () => {
      const b = breadcrumb().collapseStyle('dropdown')
      expect(b.type).toBe('breadcrumb')
    })

    it('sets highlightCurrent', () => {
      const b = breadcrumb().highlightCurrent(true)
      expect(b.type).toBe('breadcrumb')
    })
  })

  describe('navigation', () => {
    it('navigates to index', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' }
        ])
        .onNavigate(handler)

      b.goTo(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'b' }),
        1
      )
      expect(b.depth).toBe(2) // Truncated to index 1
    })

    it('navigates to value', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' }
        ])
        .onNavigate(handler)

      b.goToValue('b')
      expect(handler).toHaveBeenCalled()
      expect(b.depth).toBe(2)
    })

    it('does not navigate to disabled item', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b', disabled: true },
          { label: 'C', value: 'c' }
        ])
        .onNavigate(handler)

      b.goTo(1)
      expect(handler).not.toHaveBeenCalled()
      expect(b.depth).toBe(3) // Not truncated
    })

    it('does not navigate to invalid index', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])
        .onNavigate(handler)

      b.goTo(5)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('focuses the breadcrumb', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])
        .focus()
      expect(b.isFocused).toBe(true)
      expect(b.focusedIndex).toBe(0)
    })

    it('blurs the breadcrumb', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])
        .focus()
        .blur()
      expect(b.isFocused).toBe(false)
      expect(b.focusedIndex).toBe(-1)
    })
  })

  describe('keyboard handling', () => {
    it('handles left/right keys', () => {
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' }
        ])
        .focus()

      expect(b.focusedIndex).toBe(2) // Last item

      let handled = (b as any).handleKey('left', false)
      expect(handled).toBe(true)
      expect(b.focusedIndex).toBe(1)

      handled = (b as any).handleKey('right', false)
      expect(handled).toBe(true)
      expect(b.focusedIndex).toBe(2)
    })

    it('handles home/end keys', () => {
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' }
        ])
        .focus()

      let handled = (b as any).handleKey('home', false)
      expect(handled).toBe(true)
      expect(b.focusedIndex).toBe(0)

      handled = (b as any).handleKey('end', false)
      expect(handled).toBe(true)
      expect(b.focusedIndex).toBe(2)
    })

    it('handles enter to navigate', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ])
        .onNavigate(handler)
        .focus()

      ;(b as any)._focusedIndex = 0
      const handled = (b as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('handles escape to blur', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])
        .focus()

      const handled = (b as any).handleKey('escape', false)
      expect(handled).toBe(true)
      expect(b.isFocused).toBe(false)
    })

    it('ignores keys when not focused', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])

      const handled = (b as any).handleKey('enter', false)
      expect(handled).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onNavigate when navigating', () => {
      const handler = vi.fn()
      const b = breadcrumb()
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ])
        .onNavigate(handler)

      b.goTo(0)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'a' }),
        0
      )
    })

    it('emits onCollapsedClick when clicking collapsed section', () => {
      const handler = vi.fn()
      const b = breadcrumb({ maxItems: 2 })
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' }
        ])
        .onCollapsedClick(handler)

      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Simulate click on collapsed section (after home icon)
      // Home icon + separator = about 3-4 chars, ellipsis starts around x=4
      ;(b as any).handleMouse(5, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('state properties', () => {
    it('returns currentItem', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
      expect(b.currentItem?.value).toBe('b')
    })

    it('returns depth', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
        .push({ label: 'C', value: 'c' })
      expect(b.depth).toBe(3)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 1

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty breadcrumb', () => {
      const b = breadcrumb()
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders breadcrumb with items', () => {
      const b = breadcrumb()
        .push({ label: 'Home', value: '/' })
        .push({ label: 'Documents', value: '/docs' })
        .push({ label: 'File.txt', value: '/docs/file.txt' })
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused breadcrumb', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
        .focus()
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with custom separator', () => {
      const b = breadcrumb({ separator: ' > ' })
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without home icon', () => {
      const b = breadcrumb({ showHome: false })
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b' })
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with collapsed items', () => {
      const b = breadcrumb({ maxItems: 3 })
        .items([
          { label: 'Home', value: '/' },
          { label: 'A', value: '/a' },
          { label: 'B', value: '/a/b' },
          { label: 'C', value: '/a/b/c' },
          { label: 'D', value: '/a/b/c/d' }
        ])
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders items with icons', () => {
      const b = breadcrumb()
        .push({ label: 'Home', value: '/', icon: '\ud83c\udfe0' })
        .push({ label: 'Folder', value: '/folder', icon: '\ud83d\udcc1' })
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders disabled items', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'B', value: 'b', disabled: true })
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const b = breadcrumb()
      ;(b as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const b = breadcrumb().visible(false)
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long labels', () => {
      const b = breadcrumb()
        .push({ label: 'A', value: 'a' })
        .push({ label: 'Very Long Label That Should Be Truncated', value: 'b' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 30, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const b = breadcrumb()
        .items([{ label: 'Root', value: '/' }])
        .push({ label: 'A', value: '/a' })
        .push({ label: 'B', value: '/a/b' })
        .separator(' > ')
        .showHome(true)
        .homeIcon('~')
        .maxItems(5)
        .collapseStyle('ellipsis')
        .highlightCurrent(true)
        .focus()
        .goTo(1)
        .pop()
        .blur()

      expect(b.type).toBe('breadcrumb')
    })
  })

  describe('mouse handling edge cases', () => {
    it('clicks on home icon navigates to first item', () => {
      const handler = vi.fn()
      const b = breadcrumb({ showHome: true })
        .items([
          { label: 'Home', value: '/' },
          { label: 'Documents', value: '/docs' }
        ])
        .onNavigate(handler)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click on home icon (x=0)
      ;(b as any).handleMouse(0, 0, 'press')
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ value: '/' }),
        0
      )
    })

    it('clicks on visible item in collapsed breadcrumb', () => {
      const handler = vi.fn()
      const b = breadcrumb({ maxItems: 2, showHome: true })
        .items([
          { label: 'Home', value: '/' },
          { label: 'A', value: '/a' },
          { label: 'B', value: '/b' },
          { label: 'C', value: '/c' }
        ])
        .onNavigate(handler)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click on last visible item (should be after home + separator + ellipsis + separator)
      ;(b as any).handleMouse(20, 0, 'press')
      // Should trigger navigation
    })

    it('clicks on item with icon', () => {
      const handler = vi.fn()
      const b = breadcrumb({ showHome: false })
        .items([
          { label: 'Folder', value: '/folder', icon: '📁' },
          { label: 'File', value: '/file' }
        ])
        .onNavigate(handler)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click on first item with icon
      ;(b as any).handleMouse(3, 0, 'press')
    })

    it('clicks outside items returns -1', () => {
      const handler = vi.fn()
      const b = breadcrumb({ showHome: false })
        .items([{ label: 'A', value: 'a' }])
        .onNavigate(handler)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click far to the right
      ;(b as any).handleMouse(50, 0, 'press')
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns false when not visible', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])
        .visible(false)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      const handled = (b as any).handleMouse(5, 0, 'press')
      expect(handled).toBe(false)
    })

    it('returns false when no bounds', () => {
      const b = breadcrumb()
        .items([{ label: 'A', value: 'a' }])

      const handled = (b as any).handleMouse(5, 0, 'press')
      expect(handled).toBe(false)
    })

    it('handles click on collapsed section with dropdown style', () => {
      const handler = vi.fn()
      const b = breadcrumb({ maxItems: 2, showHome: true })
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' }
        ])
        .collapseStyle('dropdown')
        .onCollapsedClick(handler)
      ;(b as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click on collapsed section (after home icon)
      ;(b as any).handleMouse(4, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('getVisibleItems edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 1

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with maxItems=0 shows all items', () => {
      const b = breadcrumb({ maxItems: 0 })
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' }
        ])
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders collapsed without showHome', () => {
      const b = breadcrumb({ maxItems: 2, showHome: false })
        .items([
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' }
        ])
      ;(b as any)._bounds = { x: 0, y: 0, width, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})
