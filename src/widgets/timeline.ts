/**
 * @oxog/tui - Timeline Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Timeline item status.
 */
export type TimelineStatus = 'completed' | 'current' | 'pending' | 'error'

/**
 * Timeline orientation.
 */
export type TimelineOrientation = 'vertical' | 'horizontal'

/**
 * Timeline item.
 */
export interface TimelineItem {
  /** Unique identifier */
  id: string
  /** Item title */
  title: string
  /** Item description/content */
  description?: string
  /** Timestamp or date string */
  date?: string
  /** Item status */
  status?: TimelineStatus
  /** Custom icon (single character) */
  icon?: string
  /** Extra metadata */
  meta?: Record<string, unknown>
}

/**
 * Timeline widget properties.
 */
export interface TimelineProps {
  /** Timeline items */
  items?: TimelineItem[]
  /** Orientation */
  orientation?: TimelineOrientation
  /** Show line connecting items */
  showLine?: boolean
  /** Show timestamps */
  showDates?: boolean
  /** Reverse order (newest first) */
  reverse?: boolean
  /** Compact mode (single line per item) */
  compact?: boolean
  /** Enable selection */
  selectable?: boolean
  /** Date position */
  datePosition?: 'left' | 'right' | 'inline'
  /** Max description width */
  maxDescriptionWidth?: number
}

/**
 * Timeline node interface.
 */
export interface TimelineNode extends Node {
  readonly type: 'timeline'

  // Configuration
  items(items: TimelineItem[]): this
  addItem(item: TimelineItem): this
  removeItem(id: string): this
  updateItem(id: string, updates: Partial<TimelineItem>): this
  orientation(orient: TimelineOrientation): this
  showLine(show: boolean): this
  showDates(show: boolean): this
  reverse(rev: boolean): this
  compact(enabled: boolean): this
  selectable(enabled: boolean): this
  datePosition(pos: 'left' | 'right' | 'inline'): this
  maxDescriptionWidth(width: number): this

  // Navigation
  selectItem(id: string): this
  selectIndex(index: number): this
  nextItem(): this
  previousItem(): this
  scrollToItem(id: string): this

  // Events
  onSelect(handler: (item: TimelineItem, index: number) => void): this
  onClick(handler: (item: TimelineItem, index: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly selectedItem: TimelineItem | null
  readonly selectedIndex: number
  readonly itemCount: number
}

// ============================================================
// Implementation
// ============================================================

// Status icons
const STATUS_ICONS: Record<TimelineStatus, string> = {
  completed: '\u2714', // ✔
  current: '\u25cf',   // ●
  pending: '\u25cb',   // ○
  error: '\u2718'      // ✘
}

class TimelineNodeImpl extends LeafNode implements TimelineNode {
  readonly type = 'timeline' as const

  private _items: TimelineItem[] = []
  private _orientation: TimelineOrientation = 'vertical'
  private _showLine: boolean = true
  private _showDates: boolean = true
  private _reverse: boolean = false
  private _compact: boolean = false
  private _selectable: boolean = true
  private _datePosition: 'left' | 'right' | 'inline' = 'left'
  private _maxDescriptionWidth: number = 40

  private _selectedIndex: number = -1
  private _scrollOffset: number = 0
  private _isFocused: boolean = false

  private _onSelectHandlers: ((item: TimelineItem, index: number) => void)[] = []
  private _onClickHandlers: ((item: TimelineItem, index: number) => void)[] = []

  constructor(props?: TimelineProps) {
    super()
    if (props) {
      if (props.items) this._items = [...props.items]
      if (props.orientation) this._orientation = props.orientation
      if (props.showLine !== undefined) this._showLine = props.showLine
      if (props.showDates !== undefined) this._showDates = props.showDates
      if (props.reverse !== undefined) this._reverse = props.reverse
      if (props.compact !== undefined) this._compact = props.compact
      if (props.selectable !== undefined) this._selectable = props.selectable
      if (props.datePosition) this._datePosition = props.datePosition
      if (props.maxDescriptionWidth !== undefined) this._maxDescriptionWidth = props.maxDescriptionWidth
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get selectedItem(): TimelineItem | null {
    const items = this.getOrderedItems()
    return this._selectedIndex >= 0 && this._selectedIndex < items.length
      ? items[this._selectedIndex]
      : null
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get itemCount(): number {
    return this._items.length
  }

  private getOrderedItems(): TimelineItem[] {
    return this._reverse ? [...this._items].reverse() : this._items
  }

  // Configuration
  items(items: TimelineItem[]): this {
    this._items = [...items]
    this._selectedIndex = -1
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  addItem(item: TimelineItem): this {
    this._items.push(item)
    this.markDirty()
    return this
  }

  removeItem(id: string): this {
    const index = this._items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this._items.splice(index, 1)
      if (this._selectedIndex >= this._items.length) {
        this._selectedIndex = Math.max(-1, this._items.length - 1)
      }
      this.markDirty()
    }
    return this
  }

  updateItem(id: string, updates: Partial<TimelineItem>): this {
    const item = this._items.find((i) => i.id === id)
    if (item) {
      Object.assign(item, updates)
      this.markDirty()
    }
    return this
  }

  orientation(orient: TimelineOrientation): this {
    this._orientation = orient
    this.markDirty()
    return this
  }

  showLine(show: boolean): this {
    this._showLine = show
    this.markDirty()
    return this
  }

  showDates(show: boolean): this {
    this._showDates = show
    this.markDirty()
    return this
  }

  reverse(rev: boolean): this {
    this._reverse = rev
    this.markDirty()
    return this
  }

  compact(enabled: boolean): this {
    this._compact = enabled
    this.markDirty()
    return this
  }

  selectable(enabled: boolean): this {
    this._selectable = enabled
    if (!enabled) {
      this._selectedIndex = -1
    }
    this.markDirty()
    return this
  }

  datePosition(pos: 'left' | 'right' | 'inline'): this {
    this._datePosition = pos
    this.markDirty()
    return this
  }

  maxDescriptionWidth(width: number): this {
    this._maxDescriptionWidth = width
    this.markDirty()
    return this
  }

  // Navigation
  selectItem(id: string): this {
    if (!this._selectable) return this

    const items = this.getOrderedItems()
    const index = items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this._selectedIndex = index
      this.ensureSelectedVisible()
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  selectIndex(index: number): this {
    if (!this._selectable) return this

    const items = this.getOrderedItems()
    if (index >= 0 && index < items.length) {
      this._selectedIndex = index
      this.ensureSelectedVisible()
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  nextItem(): this {
    if (!this._selectable) return this

    const items = this.getOrderedItems()
    if (this._selectedIndex < items.length - 1) {
      this._selectedIndex++
      this.ensureSelectedVisible()
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  previousItem(): this {
    if (!this._selectable) return this

    if (this._selectedIndex > 0) {
      this._selectedIndex--
      this.ensureSelectedVisible()
      this.markDirty()
      this.emitSelectEvent()
    } else if (this._selectedIndex === -1 && this._items.length > 0) {
      this._selectedIndex = 0
      this.ensureSelectedVisible()
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  scrollToItem(id: string): this {
    const items = this.getOrderedItems()
    const index = items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this._selectedIndex = index
      this.ensureSelectedVisible()
      this.markDirty()
    }
    return this
  }

  private ensureSelectedVisible(): void {
    const bounds = this._bounds
    if (!bounds) return

    if (this._orientation === 'vertical') {
      const itemHeight = this._compact ? 1 : 3
      const visibleItems = Math.floor(bounds.height / itemHeight)

      if (this._selectedIndex < this._scrollOffset) {
        this._scrollOffset = this._selectedIndex
      } else if (this._selectedIndex >= this._scrollOffset + visibleItems) {
        this._scrollOffset = this._selectedIndex - visibleItems + 1
      }
    }
  }

  private emitSelectEvent(): void {
    const items = this.getOrderedItems()
    const item = items[this._selectedIndex]
    if (item) {
      for (const handler of this._onSelectHandlers) {
        handler(item, this._selectedIndex)
      }
    }
  }

  // Events
  onSelect(handler: (item: TimelineItem, index: number) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onClick(handler: (item: TimelineItem, index: number) => void): this {
    this._onClickHandlers.push(handler)
    return this
  }

  // Focus
  focus(): this {
    this._isFocused = true
    if (this._selectable && this._selectedIndex === -1 && this._items.length > 0) {
      this._selectedIndex = 0
      this.emitSelectEvent()
    }
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.previousItem()
        return true
      case 'down':
      case 'j':
        this.nextItem()
        return true
      case 'home':
        if (this._selectable && this._items.length > 0) {
          this.selectIndex(0)
        }
        return true
      case 'end':
        if (this._selectable && this._items.length > 0) {
          this.selectIndex(this._items.length - 1)
        }
        return true
      case 'enter':
      case 'space':
        if (this.selectedItem) {
          for (const handler of this._onClickHandlers) {
            handler(this.selectedItem, this._selectedIndex)
          }
        }
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      const items = this.getOrderedItems()

      if (this._orientation === 'vertical') {
        const itemHeight = this._compact ? 1 : 3
        const relY = y - bounds.y + this._scrollOffset * itemHeight
        const index = Math.floor(relY / itemHeight)

        if (index >= 0 && index < items.length) {
          this._isFocused = true
          if (this._selectable) {
            this._selectedIndex = index
            this.emitSelectEvent()
          }

          for (const handler of this._onClickHandlers) {
            handler(items[index], index)
          }

          this.markDirty()
          return true
        }
      } else {
        // Horizontal: estimate item widths
        const itemWidth = this._compact ? 15 : 25
        const relX = x - bounds.x + this._scrollOffset * itemWidth
        const index = Math.floor(relX / itemWidth)

        if (index >= 0 && index < items.length) {
          this._isFocused = true
          if (this._selectable) {
            this._selectedIndex = index
            this.emitSelectEvent()
          }

          for (const handler of this._onClickHandlers) {
            handler(items[index], index)
          }

          this.markDirty()
          return true
        }
      }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const items = this.getOrderedItems()

    if (this._orientation === 'vertical') {
      this.renderVertical(buffer, bounds, items, fg, bg)
    } else {
      this.renderHorizontal(buffer, bounds, items, fg, bg)
    }
  }

  private renderVertical(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    items: TimelineItem[],
    fg: number,
    bg: number
  ): void {
    const itemHeight = this._compact ? 1 : 3
    const visibleItems = Math.floor(bounds.height / itemHeight)
    const startIndex = this._scrollOffset
    const endIndex = Math.min(startIndex + visibleItems, items.length)

    // Calculate layout
    const dateWidth = this._showDates && this._datePosition === 'left' ? 12 : 0
    const iconCol = bounds.x + dateWidth
    const contentCol = iconCol + 3

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i]
      const rowY = bounds.y + (i - startIndex) * itemHeight
      const isSelected = this._selectable && this._selectedIndex === i

      // Date on left
      if (this._showDates && this._datePosition === 'left' && item.date) {
        const dateStr = truncateToWidth(item.date, dateWidth - 1)
        buffer.write(bounds.x, rowY, dateStr, { fg, bg, attrs: ATTR_DIM })
      }

      // Icon/status
      const icon = item.icon ?? STATUS_ICONS[item.status ?? 'pending']
      let iconAttrs = 0
      if (item.status === 'completed') iconAttrs = ATTR_DIM
      else if (item.status === 'current') iconAttrs = ATTR_BOLD
      else if (item.status === 'error') iconAttrs = ATTR_BOLD
      if (isSelected && this._isFocused) iconAttrs |= ATTR_INVERSE

      buffer.set(iconCol, rowY, { char: icon, fg, bg, attrs: iconAttrs })

      // Connecting line
      if (this._showLine && i < items.length - 1) {
        if (this._compact) {
          // No line in compact mode between items
        } else {
          buffer.set(iconCol, rowY + 1, { char: '\u2502', fg, bg, attrs: ATTR_DIM }) // │
          buffer.set(iconCol, rowY + 2, { char: '\u2502', fg, bg, attrs: ATTR_DIM })
        }
      }

      // Title
      const maxTitleWidth = bounds.width - (contentCol - bounds.x)
      let titleText = truncateToWidth(item.title, maxTitleWidth)

      // Date inline
      if (this._showDates && this._datePosition === 'inline' && item.date) {
        const dateSuffix = ` (${item.date})`
        if (stringWidth(titleText) + stringWidth(dateSuffix) <= maxTitleWidth) {
          titleText += dateSuffix
        }
      }

      let titleAttrs = isSelected && this._isFocused ? ATTR_INVERSE : 0
      if (item.status === 'current') titleAttrs |= ATTR_BOLD
      buffer.write(contentCol, rowY, titleText, { fg, bg, attrs: titleAttrs })

      // Date on right
      if (this._showDates && this._datePosition === 'right' && item.date) {
        const dateStr = truncateToWidth(item.date, 12)
        const dateX = bounds.x + bounds.width - stringWidth(dateStr)
        buffer.write(dateX, rowY, dateStr, { fg, bg, attrs: ATTR_DIM })
      }

      // Description (non-compact mode only)
      if (!this._compact && item.description) {
        const descY = rowY + 1
        const maxDescWidth = Math.min(this._maxDescriptionWidth, maxTitleWidth)
        const descText = truncateToWidth(item.description, maxDescWidth)
        buffer.write(contentCol, descY, descText, { fg, bg, attrs: ATTR_DIM })
      }
    }

    // Scroll indicator
    if (items.length > visibleItems) {
      if (this._scrollOffset > 0) {
        buffer.set(bounds.x + bounds.width - 1, bounds.y, { char: '\u25b2', fg, bg, attrs: ATTR_DIM })
      }
      if (endIndex < items.length) {
        buffer.set(bounds.x + bounds.width - 1, bounds.y + bounds.height - 1, { char: '\u25bc', fg, bg, attrs: ATTR_DIM })
      }
    }
  }

  private renderHorizontal(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    items: TimelineItem[],
    fg: number,
    bg: number
  ): void {
    const itemWidth = this._compact ? 15 : 25
    const visibleItems = Math.floor(bounds.width / itemWidth)
    const startIndex = this._scrollOffset
    const endIndex = Math.min(startIndex + visibleItems, items.length)

    // Draw horizontal line
    if (this._showLine) {
      const lineY = bounds.y + 1
      for (let x = bounds.x; x < bounds.x + bounds.width && x < bounds.x + (endIndex - startIndex) * itemWidth; x++) {
        buffer.set(x, lineY, { char: '\u2500', fg, bg, attrs: ATTR_DIM }) // ─
      }
    }

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i]
      const colX = bounds.x + (i - startIndex) * itemWidth
      const isSelected = this._selectable && this._selectedIndex === i

      // Icon
      const icon = item.icon ?? STATUS_ICONS[item.status ?? 'pending']
      let iconAttrs = 0
      if (item.status === 'completed') iconAttrs = ATTR_DIM
      else if (item.status === 'current') iconAttrs = ATTR_BOLD
      else if (item.status === 'error') iconAttrs = ATTR_BOLD
      if (isSelected && this._isFocused) iconAttrs |= ATTR_INVERSE

      const iconX = colX + Math.floor(itemWidth / 2)
      buffer.set(iconX, bounds.y + 1, { char: icon, fg, bg, attrs: iconAttrs })

      // Title below line
      const titleY = bounds.y + 2
      const maxTitleWidth = itemWidth - 2
      let titleText = truncateToWidth(item.title, maxTitleWidth)
      titleText = padToWidth(titleText, maxTitleWidth, 'center')

      let titleAttrs = isSelected && this._isFocused ? ATTR_INVERSE : 0
      if (item.status === 'current') titleAttrs |= ATTR_BOLD
      buffer.write(colX + 1, titleY, titleText, { fg, bg, attrs: titleAttrs })

      // Date above line (if space)
      if (this._showDates && item.date && bounds.height > 3) {
        const dateText = truncateToWidth(item.date, maxTitleWidth)
        const centeredDate = padToWidth(dateText, maxTitleWidth, 'center')
        buffer.write(colX + 1, bounds.y, centeredDate, { fg, bg, attrs: ATTR_DIM })
      }

      // Description below title
      if (!this._compact && item.description && bounds.height > 4) {
        const descY = bounds.y + 3
        const descText = truncateToWidth(item.description, maxTitleWidth)
        const centeredDesc = padToWidth(descText, maxTitleWidth, 'center')
        buffer.write(colX + 1, descY, centeredDesc, { fg, bg, attrs: ATTR_DIM })
      }
    }

    // Scroll indicators
    if (items.length > visibleItems) {
      if (this._scrollOffset > 0) {
        buffer.set(bounds.x, bounds.y + 1, { char: '\u25c0', fg, bg, attrs: ATTR_DIM })
      }
      if (endIndex < items.length) {
        buffer.set(bounds.x + bounds.width - 1, bounds.y + 1, { char: '\u25b6', fg, bg, attrs: ATTR_DIM })
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a timeline widget.
 *
 * @param props - Timeline properties
 * @returns Timeline node
 *
 * @example
 * ```typescript
 * // Basic timeline
 * const tl = timeline({
 *   items: [
 *     { id: '1', title: 'Project Started', date: '2024-01-01', status: 'completed' },
 *     { id: '2', title: 'Development', date: '2024-02-15', status: 'completed' },
 *     { id: '3', title: 'Testing', date: '2024-03-01', status: 'current' },
 *     { id: '4', title: 'Launch', date: '2024-04-01', status: 'pending' }
 *   ]
 * })
 *
 * // Activity feed (reversed, compact)
 * const feed = timeline({
 *   items: activityItems,
 *   reverse: true,
 *   compact: true,
 *   showDates: true,
 *   datePosition: 'right'
 * })
 *
 * // Horizontal stepper
 * const stepper = timeline({
 *   items: steps,
 *   orientation: 'horizontal',
 *   compact: true
 * })
 *
 * // Interactive timeline
 * const interactive = timeline()
 *   .items(events)
 *   .onSelect((item, index) => {
 *     console.log('Selected:', item.title)
 *   })
 *   .onClick((item, index) => {
 *     showDetails(item)
 *   })
 * ```
 */
export function timeline(props?: TimelineProps): TimelineNode {
  return new TimelineNodeImpl(props)
}
