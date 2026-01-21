/**
 * @oxog/tui - List Widget with Virtual Scrolling
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode, HandlerRegistry } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * List item type.
 */
export interface ListItem<T = unknown> {
  /** Item ID (must be unique) */
  id: string
  /** Display label */
  label: string
  /** Optional value/data */
  value?: T
  /** Icon character */
  icon?: string
  /** Secondary text */
  secondary?: string
  /** Is selectable */
  selectable?: boolean
  /** Is separator */
  separator?: boolean
}

/**
 * List widget properties.
 */
export interface ListProps<T = unknown> {
  /** List items */
  items?: ListItem<T>[]
  /** Show line numbers */
  lineNumbers?: boolean
  /** Multi-select mode */
  multiSelect?: boolean
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * List node interface.
 */
export interface ListNode<T = unknown> extends Node {
  readonly type: 'list'

  // Configuration
  items(data: ListItem<T>[]): this
  lineNumbers(show: boolean): this
  multiSelect(enabled: boolean): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Navigation
  selectIndex(index: number): this
  selectById(id: string): this
  selectNext(): this
  selectPrevious(): this
  selectFirst(): this
  selectLast(): this
  pageUp(): this
  pageDown(): this

  // Multi-select operations
  toggleSelection(): this
  selectAll(): this
  deselectAll(): this

  // Events - chainable, returns this for builder pattern
  onSelect(handler: (item: ListItem<T>) => void): this
  onChange(handler: (selectedItems: ListItem<T>[]) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Remove handlers (for cleanup)
  offSelect(handler: (item: ListItem<T>) => void): this
  offChange(handler: (selectedItems: ListItem<T>[]) => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this

  // Clear all handlers
  clearHandlers(): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly selectedIndex: number
  readonly selectedItem: ListItem<T> | undefined
  readonly selectedItems: ListItem<T>[]
  readonly selectedIds: Set<string>
  readonly isFocused: boolean
  readonly itemCount: number
  readonly visibleRange: { start: number; end: number }
}

// ============================================================
// Implementation
// ============================================================

class ListNodeImpl<T = unknown> extends LeafNode implements ListNode<T> {
  readonly type = 'list' as const

  private _items: ListItem<T>[] = []
  private _lineNumbers: boolean = false
  private _multiSelect: boolean = false
  private _selectedIndex: number = 0
  private _scrollOffset: number = 0
  private _selectedIds: Set<string> = new Set()
  private _focused: boolean = false

  private _selectHandlers = new HandlerRegistry<(item: ListItem<T>) => void>()
  private _changeHandlers = new HandlerRegistry<(selectedItems: ListItem<T>[]) => void>()
  private _focusHandlers = new HandlerRegistry<() => void>()
  private _blurHandlers = new HandlerRegistry<() => void>()

  constructor(props?: ListProps<T>) {
    super()
    if (props) {
      if (props.items) this._items = props.items
      if (props.lineNumbers !== undefined) this._lineNumbers = props.lineNumbers
      if (props.multiSelect !== undefined) this._multiSelect = props.multiSelect
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
    }
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get selectedItem(): ListItem<T> | undefined {
    return this._items[this._selectedIndex]
  }

  get selectedItems(): ListItem<T>[] {
    return this._items.filter(item => this._selectedIds.has(item.id))
  }

  get selectedIds(): Set<string> {
    return new Set(this._selectedIds)
  }

  get isFocused(): boolean {
    return this._focused
  }

  get itemCount(): number {
    return this._items.length
  }

  get visibleRange(): { start: number; end: number } {
    const height = this._bounds.height
    return {
      start: this._scrollOffset,
      end: Math.min(this._scrollOffset + height, this._items.length)
    }
  }

  // Configuration
  items(data: ListItem<T>[]): this {
    this._items = data
    // Reset selection if out of bounds
    if (this._selectedIndex >= data.length) {
      this._selectedIndex = Math.max(0, data.length - 1)
    }
    // Clear invalid selections
    const validIds = new Set(data.map(item => item.id))
    for (const id of this._selectedIds) {
      if (!validIds.has(id)) {
        this._selectedIds.delete(id)
      }
    }
    this.markDirty()
    return this
  }

  lineNumbers(show: boolean): this {
    this._lineNumbers = show
    this.markDirty()
    return this
  }

  multiSelect(enabled: boolean): this {
    this._multiSelect = enabled
    if (!enabled) {
      this._selectedIds.clear()
    }
    this.markDirty()
    return this
  }

  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  height(value: Dimension): this {
    this._layout.height = value
    this.markDirty()
    return this
  }

  // Navigation
  selectIndex(index: number): this {
    if (index >= 0 && index < this._items.length) {
      const item = this._items[index]
      if (item && item.selectable !== false && !item.separator) {
        this._selectedIndex = index
        this.ensureVisible()
        this.markDirty()
        this.emitSelect()
      }
    }
    return this
  }

  selectById(id: string): this {
    const index = this._items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.selectIndex(index)
    }
    return this
  }

  selectNext(): this {
    let index = this._selectedIndex + 1
    while (index < this._items.length) {
      const item = this._items[index]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(index)
      }
      index++
    }
    return this
  }

  selectPrevious(): this {
    let index = this._selectedIndex - 1
    while (index >= 0) {
      const item = this._items[index]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(index)
      }
      index--
    }
    return this
  }

  selectFirst(): this {
    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(i)
      }
    }
    return this
  }

  selectLast(): this {
    for (let i = this._items.length - 1; i >= 0; i--) {
      const item = this._items[i]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(i)
      }
    }
    return this
  }

  pageUp(): this {
    const height = this._bounds.height || 10
    let targetIndex = Math.max(0, this._selectedIndex - height)
    while (targetIndex < this._selectedIndex) {
      const item = this._items[targetIndex]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(targetIndex)
      }
      targetIndex++
    }
    return this.selectFirst()
  }

  pageDown(): this {
    const height = this._bounds.height || 10
    let targetIndex = Math.min(this._items.length - 1, this._selectedIndex + height)
    while (targetIndex > this._selectedIndex) {
      const item = this._items[targetIndex]
      if (item && item.selectable !== false && !item.separator) {
        return this.selectIndex(targetIndex)
      }
      targetIndex--
    }
    return this.selectLast()
  }

  // Multi-select operations
  toggleSelection(): this {
    if (!this._multiSelect) return this

    const item = this._items[this._selectedIndex]
    if (item && item.selectable !== false && !item.separator) {
      if (this._selectedIds.has(item.id)) {
        this._selectedIds.delete(item.id)
      } else {
        this._selectedIds.add(item.id)
      }
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  selectAll(): this {
    if (!this._multiSelect) return this

    for (const item of this._items) {
      if (item.selectable !== false && !item.separator) {
        this._selectedIds.add(item.id)
      }
    }
    this.markDirty()
    this.emitChange()
    return this
  }

  deselectAll(): this {
    if (this._selectedIds.size > 0) {
      this._selectedIds.clear()
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  // Events - chainable for builder pattern
  onSelect(handler: (item: ListItem<T>) => void): this {
    this._selectHandlers.add(handler)
    return this
  }

  onChange(handler: (selectedItems: ListItem<T>[]) => void): this {
    this._changeHandlers.add(handler)
    return this
  }

  onFocus(handler: () => void): this {
    this._focusHandlers.add(handler)
    return this
  }

  onBlur(handler: () => void): this {
    this._blurHandlers.add(handler)
    return this
  }

  // Remove handlers (for cleanup)
  offSelect(handler: (item: ListItem<T>) => void): this {
    this._selectHandlers.remove(handler)
    return this
  }

  offChange(handler: (selectedItems: ListItem<T>[]) => void): this {
    this._changeHandlers.remove(handler)
    return this
  }

  offFocus(handler: () => void): this {
    this._focusHandlers.remove(handler)
    return this
  }

  offBlur(handler: () => void): this {
    this._blurHandlers.remove(handler)
    return this
  }

  // Clear all handlers
  clearHandlers(): this {
    this._selectHandlers.clear()
    this._changeHandlers.clear()
    this._focusHandlers.clear()
    this._blurHandlers.clear()
    return this
  }

  // Override dispose to clean up handlers
  override dispose(): void {
    this.clearHandlers()
    super.dispose()
  }

  // Focus control
  focus(): this {
    if (!this._focused && !this._disposed) {
      this._focused = true
      this.markDirty()
      this._focusHandlers.emit()
    }
    return this
  }

  blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      this._blurHandlers.emit()
    }
    return this
  }

  // Internal helpers
  private ensureVisible(): void {
    const height = this._bounds.height || 10
    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + height) {
      this._scrollOffset = this._selectedIndex - height + 1
    }
  }

  private emitSelect(): void {
    const item = this._items[this._selectedIndex]
    if (item) {
      this._selectHandlers.emit(item)
    }
  }

  private emitChange(): void {
    const selected = this.selectedItems
    this._changeHandlers.emit(selected)
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._focused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.selectPrevious()
        return true

      case 'down':
      case 'j':
        this.selectNext()
        return true

      case 'home':
      case 'g':
        this.selectFirst()
        return true

      case 'end':
        this.selectLast()
        return true

      case 'pageup':
        this.pageUp()
        return true

      case 'pagedown':
        this.pageDown()
        return true

      case 'space':
        if (this._multiSelect) {
          this.toggleSelection()
          return true
        }
        break

      case 'a':
        if (ctrl && this._multiSelect) {
          this.selectAll()
          return true
        }
        break

      case 'enter':
        this.emitSelect()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    // Validate bounds to prevent overflow
    if (width <= 0 || height <= 0) {
      return false
    }

    // Check if click is inside list
    if (x >= bx && x < bx + width && y >= by && y < by + height) {
      if (action === 'press') {
        const itemIndex = this._scrollOffset + (y - by)
        // Fixed: Add bounds checking to prevent index overflow
        if (itemIndex >= 0 && itemIndex < this._items.length) {
          const item = this._items[itemIndex]
          if (item && item.selectable !== false && !item.separator) {
            this._selectedIndex = itemIndex
            if (this._multiSelect) {
              this.toggleSelection()
            }
            this.markDirty()
            this.emitSelect()
          }
        }
        return true
      }

      if (action === 'scroll-up') {
        this.selectPrevious()
        return true
      }

      if (action === 'scroll-down') {
        this.selectNext()
        return true
      }

      return true
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Calculate line number width
    const lineNumWidth = this._lineNumbers ? String(this._items.length).length + 1 : 0

    // Virtual scroll: only render visible items
    const startIndex = this._scrollOffset

    for (let i = 0; i < height; i++) {
      const itemIndex = startIndex + i
      const item = this._items[itemIndex]

      if (!item) {
        // Empty row
        buffer.write(x, y + i, ' '.repeat(width), { fg, bg, attrs: 0 })
        continue
      }

      // Determine styling
      const isCurrent = itemIndex === this._selectedIndex && this._focused
      const isSelected = this._selectedIds.has(item.id)
      let attrs = 0

      if (item.separator) {
        attrs = ATTR_DIM
      } else if (isCurrent) {
        attrs = ATTR_INVERSE
      } else if (isSelected) {
        attrs = ATTR_BOLD
      } else if (item.selectable === false) {
        attrs = ATTR_DIM
      }

      // Build line content
      let line = ''

      // Line number
      if (this._lineNumbers) {
        const lineNum = String(itemIndex + 1).padStart(lineNumWidth - 1, ' ')
        line += lineNum + ' '
      }

      // Selection indicator
      if (this._multiSelect) {
        line += isSelected ? '[×] ' : '[ ] '
      }

      // Separator
      if (item.separator) {
        const sepWidth = width - stringWidth(line)
        line += '─'.repeat(sepWidth)
      } else {
        // Icon
        if (item.icon) {
          line += item.icon + ' '
        }

        // Label
        line += item.label

        // Secondary text
        if (item.secondary) {
          const availableWidth = width - stringWidth(line) - 2
          if (availableWidth > 4) {
            const secondary = truncateToWidth(item.secondary, availableWidth)
            line = padToWidth(line, width - stringWidth(secondary) - 1, 'left')
            line += secondary
          }
        }
      }

      // Truncate and pad
      if (stringWidth(line) > width) {
        line = truncateToWidth(line, width)
      }
      line = padToWidth(line, width, 'left')

      buffer.write(x, y + i, line, { fg, bg, attrs })
    }

    // Draw scrollbar if needed
    // Safety checks: ensure all values are valid before calculations
    const itemCount = this._items.length
    if (itemCount > 0 && itemCount > height && height > 0 && width > 0) {
      // Calculate scrollbar height - minimum 1, never exceed available height
      const scrollbarHeight = Math.max(1, Math.min(height, Math.floor((height / itemCount) * height)))

      // Calculate scroll range - items that can be scrolled past
      const scrollRange = itemCount - height

      // Calculate scrollbar position with all edge cases handled
      let scrollbarPos = 0
      if (scrollRange > 0) {
        // Clamp scroll offset to valid range
        const clampedOffset = Math.max(0, Math.min(this._scrollOffset, scrollRange))
        // Calculate position, ensuring it stays within bounds
        const availableTrack = Math.max(0, height - scrollbarHeight)
        scrollbarPos = Math.floor((clampedOffset / scrollRange) * availableTrack)
        // Final clamp to ensure we never exceed bounds
        scrollbarPos = Math.max(0, Math.min(scrollbarPos, availableTrack))
      }

      // Draw scrollbar track and thumb
      for (let i = 0; i < height; i++) {
        const isThumb = i >= scrollbarPos && i < scrollbarPos + scrollbarHeight
        const char = isThumb ? '█' : '░'
        buffer.set(x + width - 1, y + i, { char, fg, bg, attrs: ATTR_DIM })
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a list widget with virtual scrolling.
 *
 * @param props - List properties
 * @returns List node
 *
 * @example
 * ```typescript
 * // Basic list
 * const fileList = list()
 *   .items([
 *     { id: '1', label: 'index.ts', icon: '📄' },
 *     { id: '2', label: 'package.json', icon: '📦' },
 *     { id: '3', label: 'README.md', icon: '📝' }
 *   ])
 *   .onSelect(item => {
 *     console.log('Selected:', item.label)
 *   })
 *
 * // Multi-select list
 * const todoList = list()
 *   .multiSelect(true)
 *   .items([
 *     { id: 'task1', label: 'Write documentation' },
 *     { id: 'task2', label: 'Fix bugs' },
 *     { id: 'task3', label: 'Add tests' }
 *   ])
 *   .onChange(selected => {
 *     console.log('Selected items:', selected.length)
 *   })
 *
 * // With line numbers and separators
 * const menuList = list()
 *   .lineNumbers(true)
 *   .items([
 *     { id: 'file', label: 'File Operations' },
 *     { id: 'sep1', label: '', separator: true },
 *     { id: 'new', label: 'New File', secondary: 'Ctrl+N' },
 *     { id: 'open', label: 'Open File', secondary: 'Ctrl+O' },
 *     { id: 'sep2', label: '', separator: true },
 *     { id: 'exit', label: 'Exit', secondary: 'Ctrl+Q' }
 *   ])
 *
 * // Large dataset with virtual scrolling
 * const bigList = list()
 *   .items(
 *     Array.from({ length: 10000 }, (_, i) => ({
 *       id: `item-${i}`,
 *       label: `Item ${i + 1}`,
 *       secondary: `Description for item ${i + 1}`
 *     }))
 *   )
 *   .height(20)
 * ```
 */
export function list<T = unknown>(props?: ListProps<T>): ListNode<T> {
  return new ListNodeImpl<T>(props)
}
