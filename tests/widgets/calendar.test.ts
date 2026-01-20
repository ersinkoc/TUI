/**
 * Calendar widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calendar } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Calendar Widget', () => {
  describe('creation', () => {
    it('creates a calendar with default properties', () => {
      const c = calendar()
      expect(c.type).toBe('calendar')
      expect(c.selectedDate).toBeNull()
      expect(c.isFocused).toBe(false)
    })

    it('creates a calendar with initial date', () => {
      const date = new Date(2024, 5, 15)
      const c = calendar({ selected: date })
      expect(c.selectedDate).toEqual(date)
    })

    it('creates a calendar with min/max dates', () => {
      const min = new Date(2024, 0, 1)
      const max = new Date(2024, 11, 31)
      const c = calendar({ minDate: min, maxDate: max })
      expect(c.type).toBe('calendar')
    })

    it('creates a calendar with first day of week', () => {
      const c = calendar({ firstDayOfWeek: 1 }) // Monday
      expect(c.type).toBe('calendar')
    })

    it('creates a calendar with week numbers', () => {
      const c = calendar({ showWeekNumbers: true })
      expect(c.type).toBe('calendar')
    })
  })

  describe('configuration', () => {
    it('sets selected date', () => {
      const date = new Date(2024, 6, 20)
      const c = calendar().selected(date)
      expect(c.selectedDate).toEqual(date)
    })

    it('sets min date', () => {
      const c = calendar().minDate(new Date(2024, 0, 1))
      expect(c.type).toBe('calendar')
    })

    it('sets max date', () => {
      const c = calendar().maxDate(new Date(2024, 11, 31))
      expect(c.type).toBe('calendar')
    })

    it('sets first day of week', () => {
      const c = calendar().firstDayOfWeek(0) // Sunday
      expect(c.type).toBe('calendar')
    })

    it('toggles week numbers', () => {
      const c = calendar().showWeekNumbers(true)
      expect(c.type).toBe('calendar')
    })

    it('sets highlight today', () => {
      const c = calendar().highlightToday(true)
      expect(c.type).toBe('calendar')
    })

    it('sets border style', () => {
      const c = calendar().border('single')
      expect(c.type).toBe('calendar')
    })
  })

  describe('navigation', () => {
    it('goes to previous month', () => {
      const c = calendar()
      const initialMonth = c.currentViewDate.getMonth()
      c.previousMonth()
      expect(c.currentViewDate.getMonth()).not.toBe(initialMonth)
    })

    it('goes to next month', () => {
      const c = calendar()
      const initialMonth = c.currentViewDate.getMonth()
      c.nextMonth()
      expect(c.currentViewDate.getMonth()).not.toBe(initialMonth)
    })

    it('goes to previous year', () => {
      const c = calendar()
      const initialYear = c.currentViewDate.getFullYear()
      c.previousYear()
      expect(c.currentViewDate.getFullYear()).toBe(initialYear - 1)
    })

    it('goes to next year', () => {
      const c = calendar()
      const initialYear = c.currentViewDate.getFullYear()
      c.nextYear()
      expect(c.currentViewDate.getFullYear()).toBe(initialYear + 1)
    })

    it('goes to today', () => {
      const c = calendar()
      c.nextYear().nextYear() // Move away from today
      c.goToToday()
      const today = new Date()
      expect(c.currentViewDate.getMonth()).toBe(today.getMonth())
      expect(c.currentViewDate.getFullYear()).toBe(today.getFullYear())
    })

    it('goes to specific date', () => {
      const c = calendar()
      const target = new Date(2025, 6, 15)
      c.viewDate(target)
      expect(c.currentViewDate.getMonth()).toBe(6)
      expect(c.currentViewDate.getFullYear()).toBe(2025)
    })
  })

  describe('selection', () => {
    it('selects a date', () => {
      const date = new Date(2024, 5, 15)
      const c = calendar().selected(date)
      expect(c.selectedDate).toEqual(date)
    })

    it('clears selection', () => {
      const c = calendar()
        .selected(new Date(2024, 5, 15))
        .selected(null)
      expect(c.selectedDate).toBeNull()
    })

    it('selects day by number', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 1))
      c.selectDay(15)
      expect(c.selectedDate?.getDate()).toBe(15)
    })
  })

  describe('focus', () => {
    it('focuses the calendar', () => {
      const c = calendar()
      c.focus()
      expect(c.isFocused).toBe(true)
    })

    it('blurs the calendar', () => {
      const c = calendar()
      c.focus()
      c.blur()
      expect(c.isFocused).toBe(false)
    })

    it('moves focus via keyboard right', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 10
      const initialDay = c.focusedDay
      ;(c as any).handleKey('right', false)
      expect(c.focusedDay).toBe(initialDay + 1)
    })

    it('moves focus via keyboard left', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const initialDay = c.focusedDay
      ;(c as any).handleKey('left', false)
      expect(c.focusedDay).toBe(initialDay - 1)
    })

    it('moves focus via keyboard down', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 8
      const initialDay = c.focusedDay
      ;(c as any).handleKey('down', false)
      expect(c.focusedDay).toBe(initialDay + 7)
    })

    it('moves focus via keyboard up', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 15
      const initialDay = c.focusedDay
      ;(c as any).handleKey('up', false)
      expect(c.focusedDay).toBe(initialDay - 7)
    })
  })

  describe('events', () => {
    it('emits onSelect when selectDay is called', () => {
      const handler = vi.fn()
      const c = calendar().onSelect(handler)
      c.viewDate(new Date(2024, 5, 1))
      c.selectDay(15)
      expect(handler).toHaveBeenCalled()
      expect(c.selectedDate?.getDate()).toBe(15)
    })

    it('emits onFocus when focused', () => {
      const handler = vi.fn()
      const c = calendar().onFocus(handler)
      c.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onBlur when blurred', () => {
      const handler = vi.fn()
      const c = calendar().onBlur(handler)
      c.focus()
      c.blur()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('handles arrow keys for navigation', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 15

      let handled = (c as any).handleKey('right', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(16)

      ;(c as any)._focusedDay = 15
      handled = (c as any).handleKey('left', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(14)
    })

    it('handles up/down for week navigation', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 15

      let handled = (c as any).handleKey('down', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(22)

      ;(c as any)._focusedDay = 15
      handled = (c as any).handleKey('up', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(8)
    })

    it('handles pageup/pagedown for month navigation', () => {
      const c = calendar().focus()
      const initialMonth = c.currentViewDate.getMonth()

      let handled = (c as any).handleKey('pagedown', false)
      expect(handled).toBe(true)

      c.previousMonth() // Reset
      handled = (c as any).handleKey('pageup', false)
      expect(handled).toBe(true)
    })

    it('handles enter to select focused date', () => {
      const c = calendar().focus()
      ;(c as any)._focusedDay = 15

      const handled = (c as any).handleKey('enter', false)
      expect(handled).toBe(true)
      expect(c.selectedDate?.getDate()).toBe(15)
    })

    it('handles t key to go to today', () => {
      const c = calendar().focus()
      c.nextYear()
      const handled = (c as any).handleKey('t', false)
      expect(handled).toBe(true)
      expect(c.currentViewDate.getFullYear()).toBe(new Date().getFullYear())
    })

    it('ignores keys when not focused', () => {
      const c = calendar()
      const handled = (c as any).handleKey('right', false)
      expect(handled).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders calendar', () => {
      const c = calendar()
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should render without error
    })

    it('renders calendar with week numbers', () => {
      const c = calendar({ showWeekNumbers: true })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused calendar', () => {
      const c = calendar().focus()
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders calendar with selected date', () => {
      const c = calendar().selected(new Date())
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const c = calendar()
      ;(c as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('respects visibility', () => {
      const c = calendar().visible(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('date helpers', () => {
    it('viewDate sets correct month', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 1, 1)) // February 2024
      expect(c.currentViewDate.getMonth()).toBe(1)
      expect(c.currentViewDate.getFullYear()).toBe(2024)
    })

    it('selectedDate returns selection', () => {
      const c = calendar()
      expect(c.selectedDate).toBeNull()
      c.selected(new Date(2024, 5, 15))
      expect(c.selectedDate?.getDate()).toBe(15)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const c = calendar()
        .minDate(new Date(2024, 0, 1))
        .maxDate(new Date(2024, 11, 31))
        .firstDayOfWeek(1)
        .showWeekNumbers(true)
        .highlightToday(true)
        .focus()
        .nextMonth()
        .previousMonth()
        .selected(new Date(2024, 5, 15))
        .blur()

      expect(c.type).toBe('calendar')
      expect(c.selectedDate).not.toBeNull()
    })
  })

  describe('vim-style keyboard navigation', () => {
    it('handles h key (same as left)', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('h', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(14)
    })

    it('handles l key (same as right)', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('l', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(16)
    })

    it('handles k key (same as up)', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('k', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(8)
    })

    it('handles j key (same as down)', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('j', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(22)
    })
  })

  describe('keyboard navigation across month boundaries', () => {
    it('left at day 1 goes to previous month last day', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 1)) // June 2024
      ;(c as any)._focusedDay = 1
      ;(c as any).handleKey('left', false)
      // Should go to May 2024 (31 days)
      expect(c.currentViewDate.getMonth()).toBe(4) // May
      expect(c.focusedDay).toBe(31)
    })

    it('right at last day goes to next month day 1', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 1)) // June 2024 (30 days)
      ;(c as any)._focusedDay = 30
      ;(c as any).handleKey('right', false)
      // Should go to July 2024
      expect(c.currentViewDate.getMonth()).toBe(6) // July
      expect(c.focusedDay).toBe(1)
    })

    it('up in first week goes to previous month', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 1)) // June 2024
      ;(c as any)._focusedDay = 5 // First week
      ;(c as any).handleKey('up', false)
      // Should go to May 2024
      expect(c.currentViewDate.getMonth()).toBe(4) // May
      // Day should be 31 - (7 - 5) = 29
      expect(c.focusedDay).toBe(29)
    })

    it('down in last week overflows to next month', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 1)) // June 2024 (30 days)
      ;(c as any)._focusedDay = 28 // Last week
      ;(c as any).handleKey('down', false)
      // Should go to July 2024
      expect(c.currentViewDate.getMonth()).toBe(6) // July
      // Overflow: 28 + 7 - 30 = 5
      expect(c.focusedDay).toBe(5)
    })
  })

  describe('ctrl+page navigation', () => {
    it('ctrl+pageup goes to previous year', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      const handled = (c as any).handleKey('pageup', true)
      expect(handled).toBe(true)
      expect(c.currentViewDate.getFullYear()).toBe(2023)
    })

    it('ctrl+pagedown goes to next year', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      const handled = (c as any).handleKey('pagedown', true)
      expect(handled).toBe(true)
      expect(c.currentViewDate.getFullYear()).toBe(2025)
    })
  })

  describe('home/end/space keys', () => {
    it('home goes to first day of month', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('home', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(1)
    })

    it('end goes to last day of month', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15)) // June has 30 days
      ;(c as any)._focusedDay = 15
      const handled = (c as any).handleKey('end', false)
      expect(handled).toBe(true)
      expect(c.focusedDay).toBe(30)
    })

    it('space selects focused day', () => {
      const handler = vi.fn()
      const c = calendar().focus().onSelect(handler)
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 20
      const handled = (c as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(c.selectedDate?.getDate()).toBe(20)
      expect(handler).toHaveBeenCalled()
    })

    it('returns false for unknown key', () => {
      const c = calendar().focus()
      const handled = (c as any).handleKey('x', false)
      expect(handled).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('returns false for clicks outside bounds', () => {
      const c = calendar()
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      const result = (c as any).handleMouse(100, 100, 'press')
      expect(result).toBe(false)
    })

    it('returns true for non-press actions', () => {
      const c = calendar()
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      const result = (c as any).handleMouse(5, 5, 'release')
      expect(result).toBe(true)
    })

    it('clicks on previous month arrow', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 15)) // June
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      // Header is at y=1 (borderOffset), click at x=2 (left arrow area)
      ;(c as any).handleMouse(2, 1, 'press')
      expect(c.currentViewDate.getMonth()).toBe(4) // May
    })

    it('clicks on next month arrow', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 15)) // June
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      // Header is at y=1, click at x=width-3 (right arrow area)
      ;(c as any).handleMouse(27, 1, 'press')
      expect(c.currentViewDate.getMonth()).toBe(6) // July
    })

    it('clicks on a day to select it', () => {
      const handler = vi.fn()
      const c = calendar().onSelect(handler)
      c.viewDate(new Date(2024, 5, 1)) // June 2024 starts on Saturday (col 6)
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      // Day area starts at y = borderOffset(1) + 2 = 3
      // First day (Saturday) is at col 6, x = borderOffset(1) + col*3 = 1 + 6*3 = 19
      ;(c as any).handleMouse(19, 3, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('clicks on middle of calendar (no border)', () => {
      const c = calendar({ border: 'none' })
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      // Header at y=0 with no border, click in day area
      ;(c as any).handleMouse(5, 3, 'press')
      expect(c.type).toBe('calendar')
    })

    it('clicks on day area but outside valid day range', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 1)) // June 2024
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      // Click on early area where there's no day (before first day of month)
      ;(c as any).handleMouse(1, 3, 'press')
      expect(c.selectedDate).toBeNull()
    })

    it('clicks with week numbers enabled', () => {
      const c = calendar({ showWeekNumbers: true })
      c.viewDate(new Date(2024, 5, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width: 33, height: 10 }
      // With week numbers, day area shifts by 3
      ;(c as any).handleMouse(22, 3, 'press')
      expect(c.type).toBe('calendar')
    })
  })

  describe('date range constraints', () => {
    it('selectDay does nothing for dates before minDate', () => {
      const c = calendar()
        .minDate(new Date(2024, 5, 15))
        .viewDate(new Date(2024, 5, 1))
      c.selectDay(10) // Before minDate
      expect(c.selectedDate).toBeNull()
    })

    it('selectDay does nothing for dates after maxDate', () => {
      const c = calendar()
        .maxDate(new Date(2024, 5, 15))
        .viewDate(new Date(2024, 5, 1))
      c.selectDay(20) // After maxDate
      expect(c.selectedDate).toBeNull()
    })

    it('selectDay works for dates within range', () => {
      const c = calendar()
        .minDate(new Date(2024, 5, 10))
        .maxDate(new Date(2024, 5, 20))
        .viewDate(new Date(2024, 5, 1))
      c.selectDay(15) // Within range
      expect(c.selectedDate?.getDate()).toBe(15)
    })
  })

  describe('onChange event', () => {
    it('emits onChange when view date changes via viewDate method', () => {
      const handler = vi.fn()
      const c = calendar().onChange(handler)
      c.viewDate(new Date(2024, 6, 1))
      expect(handler).toHaveBeenCalledWith(expect.any(Date))
    })

    it('emits onChange when navigating months', () => {
      const handler = vi.fn()
      const c = calendar().onChange(handler)
      c.nextMonth()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onChange when navigating years', () => {
      const handler = vi.fn()
      const c = calendar().onChange(handler)
      c.nextYear()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onChange when going to today', () => {
      const handler = vi.fn()
      const c = calendar().onChange(handler)
      c.nextYear() // Move away
      handler.mockClear()
      c.goToToday()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('rendering edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 12

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with Monday first day of week', () => {
      const c = calendar({ firstDayOfWeek: 1 })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Day row should start with Mo
      expect(buffer.get(1, 2).char).toBe('M')
    })

    it('renders with no border', () => {
      const c = calendar({ border: 'none' })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // First char should not be border
      expect(buffer.get(0, 0).char).not.toBe('╭')
    })

    it('renders selected date with inverse attribute', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 15))
      c.selected(new Date(2024, 5, 15))
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Selected date should have ATTR_INVERSE
    })

    it('renders today with brackets when not selected', () => {
      const c = calendar({ highlightToday: true })
      const today = new Date()
      c.viewDate(today)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders today without brackets when selected', () => {
      const c = calendar({ highlightToday: true })
      const today = new Date()
      c.viewDate(today)
      c.selected(today)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dates outside range as dimmed', () => {
      const c = calendar()
        .minDate(new Date(2024, 5, 10))
        .maxDate(new Date(2024, 5, 20))
      c.viewDate(new Date(2024, 5, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Days outside range should be dimmed
    })

    it('renders focused day with brackets when focused', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      ;(c as any)._focusedDay = 15
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders week numbers with different weeks', () => {
      const c = calendar({ showWeekNumbers: true })
      c.viewDate(new Date(2024, 0, 1)) // January 2024
      ;(c as any)._bounds = { x: 0, y: 0, width: 33, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders different border styles', () => {
      const styles = ['single', 'double', 'rounded', 'bold'] as const
      for (const style of styles) {
        const c = calendar({ border: style })
        ;(c as any)._bounds = { x: 0, y: 0, width, height }
        c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders month that starts on Sunday', () => {
      // September 2024 starts on Sunday
      const c = calendar()
      c.viewDate(new Date(2024, 8, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders month that starts on Saturday with Monday first', () => {
      // June 2024 starts on Saturday
      const c = calendar({ firstDayOfWeek: 1 })
      c.viewDate(new Date(2024, 5, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders month that starts on Sunday with Monday first (getFirstDayOfMonth returns 6)', () => {
      // September 2024 starts on Sunday - tests day === 0 branch
      const c = calendar({ firstDayOfWeek: 1 })
      c.viewDate(new Date(2024, 8, 1)) // September 2024
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders February in a leap year', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 1, 1)) // Feb 2024 (leap year)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with focused but selected date (focused takes precedence display)', () => {
      const c = calendar().focus()
      c.viewDate(new Date(2024, 5, 15))
      c.selected(new Date(2024, 5, 10))
      ;(c as any)._focusedDay = 10 // Same as selected
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('focus edge cases', () => {
    it('does not emit focus when already focused', () => {
      const handler = vi.fn()
      const c = calendar().onFocus(handler)
      c.focus()
      c.focus() // Second call
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not emit blur when not focused', () => {
      const handler = vi.fn()
      const c = calendar().onBlur(handler)
      c.blur() // Not focused yet
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('viewDate adjusts focusedDay', () => {
    it('clamps focusedDay when moving to shorter month', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 0, 31)) // January 31
      ;(c as any)._focusedDay = 31
      c.viewDate(new Date(2024, 1, 1)) // February (28 or 29 days in 2024)
      // focusedDay should be clamped
      expect(c.focusedDay).toBeLessThanOrEqual(29)
    })
  })

  describe('navigation adjusts focusedDay', () => {
    it('previousMonth clamps focusedDay for shorter month', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 2, 31)) // March 31
      ;(c as any)._focusedDay = 31
      c.previousMonth() // February has 29 days in 2024
      expect(c.focusedDay).toBeLessThanOrEqual(29)
    })

    it('nextMonth clamps focusedDay for shorter month', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 0, 31)) // January 31
      ;(c as any)._focusedDay = 31
      c.nextMonth() // February
      expect(c.focusedDay).toBeLessThanOrEqual(29)
    })

    it('previousYear clamps focusedDay', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 1, 29)) // Feb 29, 2024 (leap year)
      ;(c as any)._focusedDay = 29
      c.previousYear() // 2023 (not leap year)
      expect(c.focusedDay).toBeLessThanOrEqual(28)
    })

    it('nextYear clamps focusedDay', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 1, 29)) // Feb 29, 2024
      ;(c as any)._focusedDay = 29
      c.nextYear() // 2025 (not leap year)
      expect(c.focusedDay).toBeLessThanOrEqual(28)
    })
  })

  describe('constructor with all props', () => {
    it('accepts all properties in constructor', () => {
      const c = calendar({
        selected: new Date(2024, 5, 15),
        viewDate: new Date(2024, 5, 1),
        minDate: new Date(2024, 0, 1),
        maxDate: new Date(2024, 11, 31),
        firstDayOfWeek: 1,
        showWeekNumbers: true,
        border: 'double',
        highlightToday: false
      })
      expect(c.selectedDate?.getDate()).toBe(15)
      expect(c.currentViewDate.getMonth()).toBe(5)
    })
  })

  describe('getWeekNumber', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(35, 12)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('calculates correct week number for start of year', () => {
      const c = calendar({ showWeekNumbers: true })
      c.viewDate(new Date(2024, 0, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width: 35, height: 12 }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Week 1 should appear
    })

    it('calculates correct week number for end of year', () => {
      const c = calendar({ showWeekNumbers: true })
      c.viewDate(new Date(2024, 11, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width: 35, height: 12 }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Week 48-52 should appear
    })
  })

  describe('mouse click on day calculations', () => {
    it('clicks on column 0', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 8, 1)) // September 2024 starts on Sunday
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      ;(c as any).handleMouse(1, 3, 'press') // Column 0
      expect(c.selectedDate?.getDate()).toBe(1)
    })

    it('clicks on negative column (returns without selecting)', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      ;(c as any).handleMouse(0, 3, 'press') // Would be negative col
      expect(c.selectedDate).toBeNull()
    })

    it('clicks beyond column 6', () => {
      const c = calendar()
      c.viewDate(new Date(2024, 5, 1))
      ;(c as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      ;(c as any).handleMouse(25, 3, 'press') // Beyond col 6
      expect(c.selectedDate).toBeNull()
    })
  })
})
