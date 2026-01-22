/**
 * @oxog/tui - Calendar/DatePicker Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Calendar widget properties.
 */
export interface CalendarProps {
  /** Selected date */
  selected?: Date
  /** Current view date */
  viewDate?: Date
  /** Min selectable date */
  minDate?: Date
  /** Max selectable date */
  maxDate?: Date
  /** First day of week (0=Sunday, 1=Monday) */
  firstDayOfWeek?: 0 | 1
  /** Show week numbers */
  showWeekNumbers?: boolean
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Highlight today */
  highlightToday?: boolean
}

/**
 * Calendar node interface.
 */
export interface CalendarNode extends Node {
  readonly type: 'calendar'

  // Configuration
  selected(date: Date | null): this
  viewDate(date: Date): this
  minDate(date: Date | null): this
  maxDate(date: Date | null): this
  firstDayOfWeek(day: 0 | 1): this
  showWeekNumbers(enabled: boolean): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  highlightToday(enabled: boolean): this

  // Navigation
  previousMonth(): this
  nextMonth(): this
  previousYear(): this
  nextYear(): this
  goToToday(): this

  // Selection
  selectDay(day: number): this
  focus(): this
  blur(): this

  // Events
  onSelect(handler: (date: Date) => void): this
  onChange(handler: (viewDate: Date) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // State
  readonly selectedDate: Date | null
  readonly currentViewDate: Date
  readonly focusedDay: number
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

class CalendarNodeImpl extends LeafNode implements CalendarNode {
  readonly type = 'calendar' as const

  private _selected: Date | null = null
  private _viewDate: Date
  private _minDate: Date | null = null
  private _maxDate: Date | null = null
  private _firstDayOfWeek: 0 | 1 = 0
  private _showWeekNumbers: boolean = false
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'rounded'
  private _highlightToday: boolean = true
  private _focusedDay: number = 1
  private _focused: boolean = false

  private _onSelectHandlers: ((date: Date) => void)[] = []
  private _onChangeHandlers: ((viewDate: Date) => void)[] = []
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

  constructor(props?: CalendarProps) {
    super()
    this._viewDate = props?.viewDate ?? new Date()
    this._focusedDay = this._viewDate.getDate()

    if (props) {
      if (props.selected) this._selected = props.selected
      if (props.minDate) this._minDate = props.minDate
      if (props.maxDate) this._maxDate = props.maxDate
      if (props.firstDayOfWeek !== undefined) this._firstDayOfWeek = props.firstDayOfWeek
      if (props.showWeekNumbers !== undefined) this._showWeekNumbers = props.showWeekNumbers
      if (props.border) this._border = props.border
      if (props.highlightToday !== undefined) this._highlightToday = props.highlightToday
    }
  }

  get selectedDate(): Date | null {
    return this._selected
  }

  get currentViewDate(): Date {
    return this._viewDate
  }

  get focusedDay(): number {
    return this._focusedDay
  }

  get isFocused(): boolean {
    return this._focused
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
  }

  private getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay()
    return this._firstDayOfWeek === 1
      ? (day === 0 ? 6 : day - 1)
      : day
  }

  private isDateInRange(date: Date): boolean {
    if (this._minDate && date < this._minDate) return false
    if (this._maxDate && date > this._maxDate) return false
    return true
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  private emitChange(): void {
    for (const handler of this._onChangeHandlers) {
      handler(this._viewDate)
    }
  }

  // Configuration
  selected(date: Date | null): this {
    this._selected = date
    this.markDirty()
    return this
  }

  viewDate(date: Date): this {
    this._viewDate = date
    this._focusedDay = Math.min(this._focusedDay, this.getDaysInMonth(date.getFullYear(), date.getMonth()))
    this.markDirty()
    this.emitChange()
    return this
  }

  minDate(date: Date | null): this {
    this._minDate = date
    this.markDirty()
    return this
  }

  maxDate(date: Date | null): this {
    this._maxDate = date
    this.markDirty()
    return this
  }

  firstDayOfWeek(day: 0 | 1): this {
    this._firstDayOfWeek = day
    this.markDirty()
    return this
  }

  showWeekNumbers(enabled: boolean): this {
    this._showWeekNumbers = enabled
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  highlightToday(enabled: boolean): this {
    this._highlightToday = enabled
    this.markDirty()
    return this
  }

  // Navigation
  previousMonth(): this {
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    this._viewDate = new Date(year, month - 1, 1)
    this._focusedDay = Math.min(this._focusedDay, this.getDaysInMonth(year, month - 1))
    this.markDirty()
    this.emitChange()
    return this
  }

  nextMonth(): this {
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    this._viewDate = new Date(year, month + 1, 1)
    this._focusedDay = Math.min(this._focusedDay, this.getDaysInMonth(year, month + 1))
    this.markDirty()
    this.emitChange()
    return this
  }

  previousYear(): this {
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    this._viewDate = new Date(year - 1, month, 1)
    this._focusedDay = Math.min(this._focusedDay, this.getDaysInMonth(year - 1, month))
    this.markDirty()
    this.emitChange()
    return this
  }

  nextYear(): this {
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    this._viewDate = new Date(year + 1, month, 1)
    this._focusedDay = Math.min(this._focusedDay, this.getDaysInMonth(year + 1, month))
    this.markDirty()
    this.emitChange()
    return this
  }

  goToToday(): this {
    const today = new Date()
    this._viewDate = new Date(today.getFullYear(), today.getMonth(), 1)
    this._focusedDay = today.getDate()
    this.markDirty()
    this.emitChange()
    return this
  }

  // Selection
  selectDay(day: number): this {
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    const date = new Date(year, month, day)

    if (!this.isDateInRange(date)) return this

    this._selected = date
    this._focusedDay = day
    this.markDirty()

    for (const handler of this._onSelectHandlers) {
      handler(date)
    }
    return this
  }

  override focus(): this {
    if (!this._focused) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  override blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  // Events
  onSelect(handler: (date: Date) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onChange(handler: (viewDate: Date) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  override onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  override onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  /**
   * Dispose of calendar and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onSelectHandlers = []
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._focused) return false

    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    const daysInMonth = this.getDaysInMonth(year, month)

    switch (key) {
      case 'left':
      case 'h':
        if (this._focusedDay > 1) {
          this._focusedDay--
        } else {
          this.previousMonth()
          this._focusedDay = this.getDaysInMonth(
            this._viewDate.getFullYear(),
            this._viewDate.getMonth()
          )
        }
        this.markDirty()
        return true

      case 'right':
      case 'l':
        if (this._focusedDay < daysInMonth) {
          this._focusedDay++
        } else {
          this.nextMonth()
          this._focusedDay = 1
        }
        this.markDirty()
        return true

      case 'up':
      case 'k':
        if (this._focusedDay > 7) {
          this._focusedDay -= 7
        } else {
          this.previousMonth()
          const prevMonthDays = this.getDaysInMonth(
            this._viewDate.getFullYear(),
            this._viewDate.getMonth()
          )
          this._focusedDay = prevMonthDays - (7 - this._focusedDay)
        }
        this.markDirty()
        return true

      case 'down':
      case 'j':
        if (this._focusedDay + 7 <= daysInMonth) {
          this._focusedDay += 7
        } else {
          const overflow = (this._focusedDay + 7) - daysInMonth
          this.nextMonth()
          this._focusedDay = overflow
        }
        this.markDirty()
        return true

      case 'pageup':
        if (ctrl) {
          this.previousYear()
        } else {
          this.previousMonth()
        }
        return true

      case 'pagedown':
        if (ctrl) {
          this.nextYear()
        } else {
          this.nextMonth()
        }
        return true

      case 'home':
        this._focusedDay = 1
        this.markDirty()
        return true

      case 'end':
        this._focusedDay = daysInMonth
        this.markDirty()
        return true

      case 'enter':
      case 'space':
        this.selectDay(this._focusedDay)
        return true

      case 't':
        this.goToToday()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    if (x < bx || x >= bx + width || y < by || y >= by + height) {
      return false
    }

    if (action !== 'press') return true

    const borderOffset = this._border !== 'none' ? 1 : 0
    const weekNumOffset = this._showWeekNumbers ? 3 : 0

    // Header area (month/year navigation)
    if (y === by + borderOffset) {
      const headerX = x - bx - borderOffset
      if (headerX < 3) {
        this.previousMonth()
      } else if (headerX >= width - borderOffset * 2 - 3) {
        this.nextMonth()
      }
      return true
    }

    // Day area
    const dayY = y - by - borderOffset - 2 // Skip header and day names
    if (dayY >= 0) {
      const dayX = x - bx - borderOffset - weekNumOffset
      const col = Math.floor(dayX / 3)
      const row = dayY

      if (col >= 0 && col < 7) {
        const firstDay = this.getFirstDayOfMonth(
          this._viewDate.getFullYear(),
          this._viewDate.getMonth()
        )
        const day = row * 7 + col - firstDay + 1
        const daysInMonth = this.getDaysInMonth(
          this._viewDate.getFullYear(),
          this._viewDate.getMonth()
        )

        if (day >= 1 && day <= daysInMonth) {
          this.selectDay(day)
        }
      }
    }

    return true
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const borderOffset = this._border !== 'none' ? 1 : 0
    const weekNumOffset = this._showWeekNumbers ? 3 : 0

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      drawRect(buffer, x, y, width, height, chars, { fg, bg, attrs: 0 })
    }

    // Draw header (month and year)
    const year = this._viewDate.getFullYear()
    const month = this._viewDate.getMonth()
    const monthName = MONTHS[month]!
    const header = `${monthName} ${year}`
    const headerX = x + borderOffset + Math.floor((width - borderOffset * 2 - header.length) / 2)

    // Navigation arrows
    buffer.write(x + borderOffset + 1, y + borderOffset, '<', {
      fg, bg, attrs: this._focused ? ATTR_BOLD : 0
    })
    buffer.write(x + width - borderOffset - 2, y + borderOffset, '>', {
      fg, bg, attrs: this._focused ? ATTR_BOLD : 0
    })

    // Header text
    buffer.write(headerX, y + borderOffset, header, {
      fg, bg, attrs: ATTR_BOLD
    })

    // Draw day names
    const dayRow = y + borderOffset + 1
    const days = this._firstDayOfWeek === 1
      ? [...DAYS_SHORT.slice(1), DAYS_SHORT[0]!]
      : DAYS_SHORT

    for (let i = 0; i < 7; i++) {
      buffer.write(x + borderOffset + weekNumOffset + i * 3, dayRow, days[i]!, {
        fg, bg, attrs: ATTR_DIM
      })
    }

    // Draw days
    const firstDay = this.getFirstDayOfMonth(year, month)
    const daysInMonth = this.getDaysInMonth(year, month)
    const today = new Date()

    let currentDay = 1
    for (let row = 0; row < 6; row++) {
      const rowY = y + borderOffset + 2 + row

      // Week number
      if (this._showWeekNumbers && currentDay <= daysInMonth) {
        const weekDate = new Date(year, month, currentDay + (row === 0 ? 0 : 7 - firstDay))
        const weekNum = this.getWeekNumber(weekDate)
        buffer.write(x + borderOffset, rowY, String(weekNum).padStart(2), {
          fg, bg, attrs: ATTR_DIM
        })
      }

      for (let col = 0; col < 7; col++) {
        const cellX = x + borderOffset + weekNumOffset + col * 3
        const dayIndex = row * 7 + col

        if (dayIndex >= firstDay && currentDay <= daysInMonth) {
          const dayDate = new Date(year, month, currentDay)
          const isSelected = this._selected && this.isSameDay(dayDate, this._selected)
          const isToday = this._highlightToday && this.isSameDay(dayDate, today)
          const isFocused = this._focused && currentDay === this._focusedDay
          const inRange = this.isDateInRange(dayDate)

          let attrs = 0
          if (!inRange) {
            attrs = ATTR_DIM
          } else if (isSelected) {
            attrs = ATTR_INVERSE
          } else if (isFocused) {
            attrs = ATTR_BOLD
          }

          const dayStr = String(currentDay).padStart(2)
          const prefix = isToday && !isSelected ? '[' : ' '
          const suffix = isToday && !isSelected ? ']' : ' '

          if (isFocused && !isSelected) {
            buffer.write(cellX - 1, rowY, '[', { fg, bg, attrs: 0 })
            buffer.write(cellX, rowY, dayStr, { fg, bg, attrs })
            buffer.write(cellX + 2, rowY, ']', { fg, bg, attrs: 0 })
          } else if (isToday && !isSelected) {
            buffer.write(cellX - 1, rowY, prefix, { fg, bg, attrs: ATTR_DIM })
            buffer.write(cellX, rowY, dayStr, { fg, bg, attrs })
            buffer.write(cellX + 2, rowY, suffix, { fg, bg, attrs: ATTR_DIM })
          } else {
            buffer.write(cellX, rowY, dayStr, { fg, bg, attrs })
          }

          currentDay++
        }
      }

      if (currentDay > daysInMonth) break
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a calendar/datepicker widget.
 *
 * @param props - Calendar properties
 * @returns Calendar node
 *
 * @example
 * ```typescript
 * // Basic calendar
 * const cal = calendar()
 *   .onSelect(date => console.log('Selected:', date))
 *
 * // Calendar with constraints
 * const booking = calendar()
 *   .minDate(new Date())
 *   .maxDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
 *   .selected(new Date())
 *
 * // Monday-first calendar with week numbers
 * const europeCal = calendar()
 *   .firstDayOfWeek(1)
 *   .showWeekNumbers(true)
 *
 * // Navigate programmatically
 * cal.goToToday()
 * cal.nextMonth()
 * cal.previousYear()
 * ```
 */
export function calendar(props?: CalendarProps): CalendarNode {
  return new CalendarNodeImpl(props)
}
