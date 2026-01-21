/**
 * @oxog/tui - Select Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension, SelectOption } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Select widget properties.
 */
export interface SelectProps<T extends SelectOption = SelectOption> {
  /** Available options */
  options?: T[]
  /** Initially selected index */
  selected?: number
  /** Maximum visible items */
  maxVisible?: number
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * Select node interface.
 */
export interface SelectNode<T extends SelectOption = SelectOption> extends Node {
  readonly type: 'select'

  // Configuration
  options(items: T[]): this
  selected(index: number): this
  maxVisible(count: number): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Events
  onSelect(handler: (item: T, index: number) => void): this
  onChange(handler: (item: T, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Handler cleanup - prevent memory leaks
  offSelect(handler: (item: T, index: number) => void): this
  offChange(handler: (item: T, index: number) => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this
  clearHandlers(): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly selectedIndex: number
  readonly selectedItem: T | undefined
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class SelectNodeImpl<T extends SelectOption = SelectOption>
  extends LeafNode
  implements SelectNode<T>
{
  readonly type = 'select' as const

  private _options: T[] = []
  private _selectedIndex: number = 0
  private _maxVisible: number = 10
  private _scrollOffset: number = 0
  private _focused: boolean = false

  private _onSelectHandlers: ((item: T, index: number) => void)[] = []
  private _onChangeHandlers: ((item: T, index: number) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: SelectProps<T>) {
    super()
    if (props) {
      if (props.options) this._options = props.options
      if (props.selected !== undefined) this._selectedIndex = props.selected
      if (props.maxVisible !== undefined) this._maxVisible = props.maxVisible
      if (props.width !== undefined) this._layout.width = props.width
      if (props.height !== undefined) this._layout.height = props.height
    }
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get selectedItem(): T | undefined {
    return this._options[this._selectedIndex]
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  options(items: T[]): this {
    this._options = items
    this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, items.length - 1))
    this.markDirty()
    return this
  }

  selected(index: number): this {
    const newIndex = Math.max(0, Math.min(index, this._options.length - 1))
    if (this._selectedIndex !== newIndex) {
      this._selectedIndex = newIndex
      this.ensureVisible()
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  maxVisible(count: number): this {
    this._maxVisible = count
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

  // Events
  onSelect(handler: (item: T, index: number) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onChange(handler: (item: T, index: number) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  // Handler cleanup methods - prevent memory leaks
  offSelect(handler: (item: T, index: number) => void): this {
    const index = this._onSelectHandlers.indexOf(handler)
    if (index > -1) {
      this._onSelectHandlers.splice(index, 1)
    }
    return this
  }

  offChange(handler: (item: T, index: number) => void): this {
    const index = this._onChangeHandlers.indexOf(handler)
    if (index > -1) {
      this._onChangeHandlers.splice(index, 1)
    }
    return this
  }

  offFocus(handler: () => void): this {
    const index = this._onFocusHandlers.indexOf(handler)
    if (index > -1) {
      this._onFocusHandlers.splice(index, 1)
    }
    return this
  }

  offBlur(handler: () => void): this {
    const index = this._onBlurHandlers.indexOf(handler)
    if (index > -1) {
      this._onBlurHandlers.splice(index, 1)
    }
    return this
  }

  clearHandlers(): this {
    this._onSelectHandlers = []
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    return this
  }

  // Focus control
  focus(): this {
    if (!this._focused && !this._disposed) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  /**
   * Dispose of select and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._options = []
    this._onSelectHandlers = []
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Navigation
  /** @internal */
  selectPrevious(): void {
    if (this._selectedIndex > 0) {
      // Skip disabled items - prevent infinite loop
      let newIndex = this._selectedIndex - 1
      let iterations = 0
      const maxIterations = this._options.length // Safety limit

      while (
        newIndex >= 0 &&
        iterations < maxIterations &&
        this._options[newIndex]?.disabled
      ) {
        newIndex--
        iterations++
      }

      // Only update if we found a valid selectable item
      if (
        newIndex >= 0 &&
        iterations < maxIterations &&
        !this._options[newIndex]?.disabled
      ) {
        this._selectedIndex = newIndex
        this.ensureVisible()
        this.markDirty()
        this.emitChange()
      }
    }
  }

  /** @internal */
  selectNext(): void {
    if (this._selectedIndex < this._options.length - 1) {
      // Skip disabled items - prevent infinite loop
      let newIndex = this._selectedIndex + 1
      let iterations = 0
      const maxIterations = this._options.length // Safety limit

      while (
        newIndex < this._options.length &&
        iterations < maxIterations &&
        this._options[newIndex]?.disabled
      ) {
        newIndex++
        iterations++
      }

      // Only update if we found a valid selectable item
      if (
        newIndex < this._options.length &&
        iterations < maxIterations &&
        !this._options[newIndex]?.disabled
      ) {
        this._selectedIndex = newIndex
        this.ensureVisible()
        this.markDirty()
        this.emitChange()
      }
    }
  }

  /** @internal */
  confirm(): void {
    const item = this._options[this._selectedIndex]
    if (item && !item.disabled) {
      for (const handler of this._onSelectHandlers) {
        handler(item, this._selectedIndex)
      }
    }
  }

  private ensureVisible(): void {
    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + this._maxVisible) {
      this._scrollOffset = this._selectedIndex - this._maxVisible + 1
    }
  }

  private emitChange(): void {
    const item = this._options[this._selectedIndex]
    if (item) {
      for (const handler of this._onChangeHandlers) {
        handler(item, this._selectedIndex)
      }
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const visibleCount = Math.min(this._maxVisible, height, this._options.length)

    for (let i = 0; i < visibleCount; i++) {
      const optionIndex = this._scrollOffset + i
      const option = this._options[optionIndex]
      /* c8 ignore next */
      if (!option) continue

      const isSelected = optionIndex === this._selectedIndex
      let line = option.label

      // Truncate if necessary
      if (stringWidth(line) > width - 2) {
        line = truncateToWidth(line, width - 2)
      }

      // Add indicator
      const indicator = isSelected && this._focused ? '> ' : '  '
      line = indicator + padToWidth(line, width - 2, 'left')

      // Compute style
      const cellFg = fg
      const cellBg = bg
      let attrs = 0

      if (option.disabled) {
        attrs = ATTR_DIM
      } else if (isSelected && this._focused) {
        attrs = ATTR_INVERSE
      }

      buffer.write(x, y + i, line, { fg: cellFg, bg: cellBg, attrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a select widget.
 *
 * @param props - Select properties
 * @returns Select node
 *
 * @example
 * ```typescript
 * // Basic select
 * const menu = select()
 *   .options([
 *     { label: 'Option 1', value: '1' },
 *     { label: 'Option 2', value: '2' },
 *     { label: 'Option 3', value: '3' }
 *   ])
 *   .onSelect((item) => console.log('Selected:', item.value))
 *
 * // With custom option type
 * interface MenuItem extends SelectOption {
 *   icon: string
 * }
 *
 * const iconMenu = select<MenuItem>()
 *   .options([
 *     { label: 'New', value: 'new', icon: '+' },
 *     { label: 'Open', value: 'open', icon: 'O' }
 *   ])
 * ```
 */
export function select<T extends SelectOption = SelectOption>(
  props?: SelectProps<T>
): SelectNode<T> {
  return new SelectNodeImpl<T>(props)
}
