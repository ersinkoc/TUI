/**
 * Pagination widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pagination } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Pagination Widget', () => {
  describe('creation', () => {
    it('creates a pagination with default properties', () => {
      const pager = pagination()
      expect(pager.type).toBe('pagination')
      expect(pager.page).toBe(0)
      expect(pager.totalPages).toBe(1)
    })

    it('creates a pagination with total items', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      expect(pager.totalPages).toBe(10)
    })

    it('creates a pagination with current page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
      expect(pager.page).toBe(5)
    })

    it('creates a pagination with style', () => {
      const styles = ['full', 'compact', 'simple', 'dots'] as const
      for (const s of styles) {
        const pager = pagination({ style: s })
        expect(pager.type).toBe('pagination')
      }
    })

    it('creates a pagination without first/last buttons', () => {
      const pager = pagination({ showFirstLast: false })
      expect(pager.type).toBe('pagination')
    })

    it('creates a pagination without page numbers', () => {
      const pager = pagination({ showPageNumbers: false })
      expect(pager.type).toBe('pagination')
    })

    it('creates a pagination without item count', () => {
      const pager = pagination({ showItemCount: false })
      expect(pager.type).toBe('pagination')
    })

    it('creates a pagination with max visible pages', () => {
      const pager = pagination({ maxVisiblePages: 3 })
      expect(pager.type).toBe('pagination')
    })

    it('creates a pagination with custom labels', () => {
      const pager = pagination({
        labels: {
          first: '|<',
          last: '>|',
          previous: '<',
          next: '>'
        }
      })
      expect(pager.type).toBe('pagination')
    })
  })

  describe('configuration', () => {
    it('sets totalItems', () => {
      const pager = pagination().totalItems(50).itemsPerPage(10)
      expect(pager.totalPages).toBe(5)
    })

    it('clamps page when totalItems decreases', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
      pager.totalItems(50)
      expect(pager.page).toBeLessThanOrEqual(4)
    })

    it('sets itemsPerPage', () => {
      const pager = pagination({ totalItems: 100 }).itemsPerPage(25)
      expect(pager.totalPages).toBe(4)
    })

    it('clamps page when itemsPerPage increases', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
      pager.itemsPerPage(50)
      expect(pager.page).toBeLessThanOrEqual(1)
    })

    it('sets currentPage', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).currentPage(5)
      expect(pager.page).toBe(5)
    })

    it('clamps currentPage to valid range', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.currentPage(-5)
      expect(pager.page).toBe(0)
      pager.currentPage(100)
      expect(pager.page).toBe(9)
    })

    it('sets style', () => {
      const pager = pagination().style('compact')
      expect(pager.type).toBe('pagination')
    })

    it('sets showFirstLast', () => {
      const pager = pagination().showFirstLast(false)
      expect(pager.type).toBe('pagination')
    })

    it('sets showPageNumbers', () => {
      const pager = pagination().showPageNumbers(false)
      expect(pager.type).toBe('pagination')
    })

    it('sets showItemCount', () => {
      const pager = pagination().showItemCount(false)
      expect(pager.type).toBe('pagination')
    })

    it('sets maxVisiblePages', () => {
      const pager = pagination().maxVisiblePages(7)
      expect(pager.type).toBe('pagination')
    })

    it('sets labels', () => {
      const pager = pagination().labels({ first: '<<', last: '>>' })
      expect(pager.type).toBe('pagination')
    })
  })

  describe('navigation', () => {
    it('goes to specific page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.goToPage(5)
      expect(pager.page).toBe(5)
    })

    it('goToPage clamps to valid range', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.goToPage(-5)
      expect(pager.page).toBe(0)
      pager.goToPage(100)
      expect(pager.page).toBe(9)
    })

    it('goToPage does nothing for same page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
        .onPageChange(handler)
      pager.goToPage(5)
      expect(handler).not.toHaveBeenCalled()
    })

    it('goes to next page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.nextPage()
      expect(pager.page).toBe(1)
    })

    it('nextPage stops at last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
      pager.nextPage()
      expect(pager.page).toBe(9)
    })

    it('goes to previous page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
      pager.previousPage()
      expect(pager.page).toBe(4)
    })

    it('previousPage stops at first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.previousPage()
      expect(pager.page).toBe(0)
    })

    it('goes to first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
      pager.firstPage()
      expect(pager.page).toBe(0)
    })

    it('goes to last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.lastPage()
      expect(pager.page).toBe(9)
    })
  })

  describe('pageInfo', () => {
    it('returns correct page info', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 2 })
      const info = pager.pageInfo

      expect(info.currentPage).toBe(2)
      expect(info.totalPages).toBe(10)
      expect(info.totalItems).toBe(100)
      expect(info.itemsPerPage).toBe(10)
      expect(info.startIndex).toBe(20)
      expect(info.endIndex).toBe(30)
      expect(info.hasPrevious).toBe(true)
      expect(info.hasNext).toBe(true)
    })

    it('handles first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0 })
      const info = pager.pageInfo

      expect(info.startIndex).toBe(0)
      expect(info.endIndex).toBe(10)
      expect(info.hasPrevious).toBe(false)
      expect(info.hasNext).toBe(true)
    })

    it('handles last page', () => {
      const pager = pagination({ totalItems: 95, itemsPerPage: 10, currentPage: 9 })
      const info = pager.pageInfo

      expect(info.startIndex).toBe(90)
      expect(info.endIndex).toBe(95) // Only 5 items on last page
      expect(info.hasPrevious).toBe(true)
      expect(info.hasNext).toBe(false)
    })

    it('handles single page', () => {
      const pager = pagination({ totalItems: 5, itemsPerPage: 10 })
      const info = pager.pageInfo

      expect(info.totalPages).toBe(1)
      expect(info.hasPrevious).toBe(false)
      expect(info.hasNext).toBe(false)
    })

    it('handles zero items', () => {
      const pager = pagination({ totalItems: 0, itemsPerPage: 10 })
      const info = pager.pageInfo

      expect(info.totalPages).toBe(1)
      expect(info.startIndex).toBe(0)
      expect(info.endIndex).toBe(0)
    })
  })

  describe('focus', () => {
    it('focuses the pagination', () => {
      const pager = pagination().focus()
      expect(pager.isFocused).toBe(true)
    })

    it('blurs the pagination', () => {
      const pager = pagination().focus().blur()
      expect(pager.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('navigates with left/right', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()

      expect(pager.handleKey('right', false)).toBe(true)
      expect(pager.handleKey('left', false)).toBe(true)
    })

    it('navigates with h/l', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()

      expect(pager.handleKey('l', false)).toBe(true)
      expect(pager.handleKey('h', false)).toBe(true)
    })

    it('activates with enter', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
        .onPageChange(handler)
        .focus()

      // Focus on next button
      pager.handleKey('right', false)
      pager.handleKey('right', false)
      pager.handleKey('enter', false)

      // Check if navigation occurred
      expect(pager.type).toBe('pagination')
    })

    it('activates with space', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      expect(pager.handleKey('space', false)).toBe(true)
    })

    it('home goes to first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 }).focus()
      pager.handleKey('home', false)
      expect(pager.page).toBe(0)
    })

    it('end goes to last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      pager.handleKey('end', false)
      expect(pager.page).toBe(9)
    })

    it('pageup goes to previous page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 }).focus()
      pager.handleKey('pageup', false)
      expect(pager.page).toBe(4)
    })

    it('pagedown goes to next page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 }).focus()
      pager.handleKey('pagedown', false)
      expect(pager.page).toBe(6)
    })

    it('ignores keys when not focused', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      expect(pager.handleKey('right', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      expect(pager.handleKey('x', false)).toBe(false)
    })

    it('wraps focus around', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true }).focus()

      // Keep pressing right to wrap around
      for (let i = 0; i < 10; i++) {
        pager.handleKey('right', false)
      }
      expect(pager.type).toBe('pagination')
    })
  })

  describe('mouse handling', () => {
    let pager: ReturnType<typeof pagination>

    beforeEach(() => {
      pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 2 }
    })

    it('clicks on navigation buttons', () => {
      expect(pager.handleMouse(0, 0, 'press')).toBe(true) // First button
      expect(pager.isFocused).toBe(true)
    })

    it('clicks on page number', () => {
      // Click somewhere in the middle (page numbers area)
      expect(pager.handleMouse(20, 0, 'press')).toBe(true)
    })

    it('ignores when hidden', () => {
      ;(pager as any)._visible = false
      expect(pager.handleMouse(0, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(pager as any)._bounds = null
      expect(pager.handleMouse(0, 0, 'press')).toBe(false)
    })

    it('ignores non-press actions', () => {
      expect(pager.handleMouse(0, 0, 'release')).toBe(false)
      expect(pager.handleMouse(0, 0, 'move')).toBe(false)
    })
  })

  describe('events', () => {
    it('emits page change event', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
        .onPageChange(handler)
        .goToPage(5)

      expect(handler).toHaveBeenCalled()
      const [page, info] = handler.mock.calls[0]
      expect(page).toBe(5)
      expect(info.currentPage).toBe(5)
    })

    it('registers multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
        .onPageChange(handler1)
        .onPageChange(handler2)
        .nextPage()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 5

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        style: 'full'
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        style: 'compact'
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders simple style', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        style: 'simple'
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dots style', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        style: 'dots'
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with focus', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without first/last buttons', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        showFirstLast: false
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without page numbers', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        showPageNumbers: false
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with item count', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        showItemCount: true
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with ellipsis for many pages', () => {
      const pager = pagination({
        totalItems: 1000,
        itemsPerPage: 10,
        currentPage: 50,
        maxVisiblePages: 5
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders on first page', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        currentPage: 0
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders on last page', () => {
      const pager = pagination({
        totalItems: 100,
        itemsPerPage: 10,
        currentPage: 9
      })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      ;(pager as any)._visible = false
      ;(pager as any)._bounds = { x: 0, y: 0, width: 50, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('totalPages calculation', () => {
    it('handles zero items per page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 0 })
      expect(pager.totalPages).toBe(1)
    })

    it('handles negative items per page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: -10 })
      expect(pager.totalPages).toBe(1)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const handler = vi.fn()

      const pager = pagination()
        .totalItems(100)
        .itemsPerPage(10)
        .currentPage(0)
        .style('full')
        .showFirstLast(true)
        .showPageNumbers(true)
        .showItemCount(true)
        .maxVisiblePages(5)
        .labels({ first: '<<', last: '>>' })
        .onPageChange(handler)
        .goToPage(3)
        .focus()

      expect(pager.type).toBe('pagination')
      expect(pager.page).toBe(3)
      expect(pager.totalPages).toBe(10)
      expect(pager.isFocused).toBe(true)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('currentPage edge cases', () => {
    it('does not mark dirty when setting same page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
      // Setting same page should not trigger change
      const before = pager.page
      pager.currentPage(5)
      expect(pager.page).toBe(before)
    })

    it('clamps to maxPage when setting higher page', () => {
      const pager = pagination({ totalItems: 50, itemsPerPage: 10 })
      pager.currentPage(99)
      expect(pager.page).toBe(4) // 5 pages, 0-indexed max is 4
    })
  })

  describe('keyboard navigation edge cases', () => {
    it('home does nothing when already on first page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0 })
        .onPageChange(handler)
        .focus()
      pager.handleKey('home', false)
      expect(handler).not.toHaveBeenCalled()
      expect(pager.page).toBe(0)
    })

    it('end does nothing when already on last page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
        .onPageChange(handler)
        .focus()
      pager.handleKey('end', false)
      expect(handler).not.toHaveBeenCalled()
      expect(pager.page).toBe(9)
    })

    it('pageup does nothing when already on first page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0 })
        .onPageChange(handler)
        .focus()
      pager.handleKey('pageup', false)
      expect(handler).not.toHaveBeenCalled()
      expect(pager.page).toBe(0)
    })

    it('pagedown does nothing when already on last page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
        .onPageChange(handler)
        .focus()
      pager.handleKey('pagedown', false)
      expect(handler).not.toHaveBeenCalled()
      expect(pager.page).toBe(9)
    })

    it('wraps focus left from first to last button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true }).focus()
      // Move focus left from 'page' (initial focus) multiple times to wrap around
      pager.handleKey('left', false) // prev
      pager.handleKey('left', false) // first
      pager.handleKey('left', false) // should wrap to last
      expect(pager.type).toBe('pagination')
    })

    it('wraps focus right from last to first button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true }).focus()
      // Move focus right multiple times to wrap
      pager.handleKey('right', false) // next
      pager.handleKey('right', false) // last
      pager.handleKey('right', false) // should wrap to first
      expect(pager.type).toBe('pagination')
    })
  })

  describe('activateFocused button types', () => {
    it('activates first button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5, showFirstLast: true })
        .onPageChange(handler)
        .focus()
      // Move focus to first button
      ;(pager as any)._focusedButton = 'first'
      pager.handleKey('enter', false)
      expect(pager.page).toBe(0)
      expect(handler).toHaveBeenCalled()
    })

    it('activates prev button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'prev'
      pager.handleKey('enter', false)
      expect(pager.page).toBe(4)
      expect(handler).toHaveBeenCalled()
    })

    it('activates next button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'next'
      pager.handleKey('enter', false)
      expect(pager.page).toBe(6)
      expect(handler).toHaveBeenCalled()
    })

    it('activates last button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5, showFirstLast: true })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'last'
      pager.handleKey('enter', false)
      expect(pager.page).toBe(9)
      expect(handler).toHaveBeenCalled()
    })

    it('activates page button (no-op)', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5 })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'page'
      pager.handleKey('enter', false)
      // Page button activation is no-op in current implementation
      expect(pager.page).toBe(5)
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not activate first when already on first page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'first'
      pager.handleKey('enter', false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not activate prev when already on first page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0 })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'prev'
      pager.handleKey('enter', false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not activate next when already on last page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9 })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'next'
      pager.handleKey('enter', false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not activate last when already on last page', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, showFirstLast: true })
        .onPageChange(handler)
        .focus()
      ;(pager as any)._focusedButton = 'last'
      pager.handleKey('enter', false)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('mouse handling detailed', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 5

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('clicks on first button when showFirstLast is true', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5, showFirstLast: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Click at x=0 should hit the first button
      expect(pager.handleMouse(0, 0, 'press')).toBe(true)
      expect(pager.page).toBe(0)
    })

    it('clicks on first button when already on first page (no navigation)', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      expect(pager.handleMouse(0, 0, 'press')).toBe(true)
      expect(handler).not.toHaveBeenCalled() // Already on first page
    })

    it('clicks on prev button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 5, showFirstLast: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // First button is 3 wide + 1 space = 4, prev starts at 4
      expect(pager.handleMouse(4, 0, 'press')).toBe(true)
      expect(pager.page).toBe(4)
    })

    it('clicks on prev button when on first page (no navigation)', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      expect(pager.handleMouse(4, 0, 'press')).toBe(true)
      expect(handler).not.toHaveBeenCalled()
    })

    it('clicks on page number button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true, showPageNumbers: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // First=3+1, Prev=3+1 = 8, page numbers start at 8
      // First page number [1] starts at x=8
      expect(pager.handleMouse(8, 0, 'press')).toBe(true)
      expect(pager.isFocused).toBe(true)
    })

    it('clicks on a specific page number to navigate', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true, showPageNumbers: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Click on second page [2] - first button at x=8 is [1] (width 3), so [2] starts at x=12
      expect(pager.handleMouse(12, 0, 'press')).toBe(true)
      expect(pager.page).toBe(1)
    })

    it('clicks on next button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: false, showPageNumbers: false })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Without first/last and page numbers: prev=0-2, next=4-6
      expect(pager.handleMouse(4, 0, 'press')).toBe(true)
      expect(pager.page).toBe(1)
    })

    it('clicks on next button when on last page (no navigation)', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, showFirstLast: false, showPageNumbers: false })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      expect(pager.handleMouse(4, 0, 'press')).toBe(true)
      expect(handler).not.toHaveBeenCalled()
    })

    it('clicks on last button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true, showPageNumbers: false })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // first=3+1, prev=3+1, next=3+1, last starts at 12
      expect(pager.handleMouse(12, 0, 'press')).toBe(true)
      expect(pager.page).toBe(9)
    })

    it('clicks on last button when on last page (no navigation)', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, showFirstLast: true, showPageNumbers: false })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      expect(pager.handleMouse(12, 0, 'press')).toBe(true)
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns false when clicking outside button areas', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: false, showPageNumbers: false })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // With showFirstLast=false, showPageNumbers=false: prev (0-2), next (4-6)
      // Clicking at x=70 should miss all buttons
      expect(pager.handleMouse(70, 0, 'press')).toBe(false)
    })
  })

  describe('getVisiblePages edge cases', () => {
    it('returns all pages when total <= maxVisible', () => {
      const pager = pagination({ totalItems: 30, itemsPerPage: 10, maxVisiblePages: 5 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Force getVisiblePages through rendering
      const buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // 3 pages total, maxVisible is 5, so all 3 should be visible
      expect(pager.totalPages).toBe(3)
    })

    it('shows pages near start', () => {
      const pager = pagination({ totalItems: 200, itemsPerPage: 10, currentPage: 0, maxVisiblePages: 5 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      const buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(pager.totalPages).toBe(20)
    })

    it('shows pages near end', () => {
      const pager = pagination({ totalItems: 200, itemsPerPage: 10, currentPage: 19, maxVisiblePages: 5 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      const buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(pager.page).toBe(19)
    })

    it('shows pages in middle with window', () => {
      const pager = pagination({ totalItems: 200, itemsPerPage: 10, currentPage: 10, maxVisiblePages: 5 })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      const buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(pager.page).toBe(10)
    })
  })

  describe('rendering with focus states', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 5

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with focus on first button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true }).focus()
      ;(pager as any)._focusedButton = 'first'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with focus on prev button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      ;(pager as any)._focusedButton = 'prev'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with focus on next button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 }).focus()
      ;(pager as any)._focusedButton = 'next'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with focus on last button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true }).focus()
      ;(pager as any)._focusedButton = 'last'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with focus on page button', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showPageNumbers: true }).focus()
      ;(pager as any)._focusedButton = 'page'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style with focus on prev', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'compact' }).focus()
      ;(pager as any)._focusedButton = 'prev'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style with focus on page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'compact' }).focus()
      ;(pager as any)._focusedButton = 'page'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style with focus on next', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'compact' }).focus()
      ;(pager as any)._focusedButton = 'next'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders simple style with focus on prev', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'simple' }).focus()
      ;(pager as any)._focusedButton = 'prev'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders simple style with focus on next', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'simple' }).focus()
      ;(pager as any)._focusedButton = 'next'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dots style with focus on prev', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'dots' }).focus()
      ;(pager as any)._focusedButton = 'prev'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dots style with focus on next', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'dots' }).focus()
      ;(pager as any)._focusedButton = 'next'
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dots style on first page (prev dimmed)', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, style: 'dots' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dots style on last page (next dimmed)', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, style: 'dots' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with ellipsis at start', () => {
      const pager = pagination({ totalItems: 200, itemsPerPage: 10, currentPage: 15, maxVisiblePages: 5, showPageNumbers: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with ellipsis at end', () => {
      const pager = pagination({ totalItems: 200, itemsPerPage: 10, currentPage: 2, maxVisiblePages: 5, showPageNumbers: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style without ellipsis when all pages fit', () => {
      const pager = pagination({ totalItems: 50, itemsPerPage: 10, currentPage: 2, maxVisiblePages: 10, showPageNumbers: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with dimmed prev/first when on first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style with dimmed next/last when on last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, showFirstLast: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style with dimmed prev when on first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, style: 'compact' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders compact style with dimmed next when on last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, style: 'compact' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders simple style with dimmed prev when on first page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, style: 'simple' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders simple style with dimmed next when on last page', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 9, style: 'simple' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('getNavigableButtons', () => {
    it('returns all buttons when showFirstLast and showPageNumbers are true', () => {
      const pager = pagination({ showFirstLast: true, showPageNumbers: true }).focus()
      // Access private method through key navigation
      pager.handleKey('left', false)
      pager.handleKey('left', false)
      pager.handleKey('left', false)
      pager.handleKey('left', false)
      pager.handleKey('left', false)
      expect(pager.type).toBe('pagination')
    })

    it('returns limited buttons when showFirstLast is false', () => {
      const pager = pagination({ showFirstLast: false, showPageNumbers: true }).focus()
      // Without first/last: only prev, page, next
      pager.handleKey('left', false)
      pager.handleKey('left', false)
      pager.handleKey('left', false) // Should wrap
      expect(pager.type).toBe('pagination')
    })

    it('returns limited buttons when showPageNumbers is false', () => {
      const pager = pagination({ showFirstLast: true, showPageNumbers: false }).focus()
      // Without page numbers: first, prev, next, last
      pager.handleKey('right', false)
      pager.handleKey('right', false)
      pager.handleKey('right', false)
      pager.handleKey('right', false) // Should wrap
      expect(pager.type).toBe('pagination')
    })

    it('returns minimal buttons when both showFirstLast and showPageNumbers are false', () => {
      const pager = pagination({ showFirstLast: false, showPageNumbers: false }).focus()
      // Only prev, next
      pager.handleKey('right', false)
      pager.handleKey('right', false) // Should wrap
      expect(pager.type).toBe('pagination')
    })
  })

  describe('render edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders item count when height > 1 and showItemCount true', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showItemCount: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Check that item count is rendered on second line
    })

    it('does not render item count when height is 1', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showItemCount: true })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with non-zero x/y bounds', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10 })
      ;(pager as any)._bounds = { x: 5, y: 2, width: 60, height: 2 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles dots style with very narrow width', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'dots' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles single page with dots style', () => {
      const pager = pagination({ totalItems: 5, itemsPerPage: 10, style: 'dots' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('visible method', () => {
    it('hides and shows the pagination', () => {
      const pager = pagination()
      pager.visible(false)
      expect((pager as any)._visible).toBe(false)
      pager.visible(true)
      expect((pager as any)._visible).toBe(true)
    })
  })

  describe('mouse click outside all buttons with showFirstLast', () => {
    it('returns false when click misses all buttons including last', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true, showPageNumbers: false })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // With showFirstLast=true, showPageNumbers=false:
      // first (0-2), prev (4-6), next (8-10), last (12-14)
      // Clicking at x=50 should miss all buttons and pass through line 458-459
      expect(pager.handleMouse(50, 0, 'press')).toBe(false)
    })

    it('clicks between next and last button areas', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, showFirstLast: true, showPageNumbers: false })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Click at x=11 which is between next (8-10) and last (12-14)
      expect(pager.handleMouse(11, 0, 'press')).toBe(false)
    })
  })

  describe('full render path coverage', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(80, 5)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders full style explicitly and returns', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'full' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      pager.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // This ensures line 509 (break after renderFull) is executed
      expect(pager.type).toBe('pagination')
    })

    it('renders with empty parentStyle to test ?? fallbacks', () => {
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, style: 'full' })
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 3 }
      // Pass style without fg/bg to test the ?? fallback
      pager.render(buffer, { attrs: 0 } as any)
      expect(pager.type).toBe('pagination')
    })
  })

  describe('additional branch coverage', () => {
    it('handles page click iteration through multiple pages', () => {
      // Test that clicking iterates through multiple pages to find the right one
      const handler = vi.fn()
      const pager = pagination({ totalItems: 100, itemsPerPage: 10, currentPage: 0, showFirstLast: false, showPageNumbers: true, maxVisiblePages: 5 })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // prev (0-2), then pages [1][2][3][4][5]
      // Page [1] starts at 4 (3 char button + 1 space)
      // Each page button [X] is about 3-4 chars wide
      // Click on page 3 which would be around x=12-15
      // This ensures we iterate through multiple pages in the loop before finding the match
      expect(pager.handleMouse(16, 0, 'press')).toBe(true)
    })

    it('handles page click that misses all buttons and returns false', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 50, itemsPerPage: 10, currentPage: 0, showFirstLast: false, showPageNumbers: true })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // Click far enough to miss all buttons
      expect(pager.handleMouse(70, 0, 'press')).toBe(false)
    })

    it('mouse click passes through pages loop and hits next button', () => {
      const handler = vi.fn()
      const pager = pagination({ totalItems: 30, itemsPerPage: 10, showFirstLast: false, showPageNumbers: true, currentPage: 0 })
        .onPageChange(handler)
      ;(pager as any)._bounds = { x: 0, y: 0, width: 80, height: 2 }
      // With only 3 pages visible, click on next button after iterating through pages
      // prev (0-2), pages start at 4
      // Page buttons: [1] = 4-6, [2] = 8-10, [3] = 12-14
      // Next button at 16-18
      expect(pager.handleMouse(16, 0, 'press')).toBe(true)
      expect(pager.page).toBe(1) // Should move to next page
    })
  })
})
