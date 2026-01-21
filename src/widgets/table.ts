/**
 * @oxog/tui - Table Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension, BorderStyle, TableColumn } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_INVERSE, ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Table widget properties.
 */
export interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Column definitions */
  columns?: TableColumn[]
  /** Row data */
  data?: T[]
  /** Show header row */
  showHeader?: boolean
  /** Border style */
  border?: BorderStyle
  /** Striped rows */
  striped?: boolean
  /** Selected row index */
  selectedRow?: number
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * Table node interface.
 */
export interface TableNode<
  T extends Record<string, unknown> = Record<string, unknown>
> extends Node {
  readonly type: 'table'

  // Configuration
  columns(cols: TableColumn[]): this
  data(rows: T[]): this
  showHeader(enabled: boolean): this
  border(style: BorderStyle): this
  striped(enabled: boolean): this
  selectedRow(index: number): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Events
  onSelect(handler: (row: T, index: number) => void): this
  onChange(handler: (row: T, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly selected: T | undefined
  readonly selectedIndex: number
  readonly rowCount: number
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class TableNodeImpl<T extends Record<string, unknown> = Record<string, unknown>>
  extends LeafNode
  implements TableNode<T>
{
  readonly type = 'table' as const

  private _columns: TableColumn[] = []
  private _data: T[] = []
  private _showHeader: boolean = true
  private _border: BorderStyle = 'single'
  private _striped: boolean = false
  private _selectedIndex: number = -1
  private _scrollOffset: number = 0
  private _focused: boolean = false

  private _onSelectHandlers: ((row: T, index: number) => void)[] = []
  private _onChangeHandlers: ((row: T, index: number) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: TableProps<T>) {
    super()
    if (props) {
      if (props.columns) this._columns = props.columns
      if (props.data) this._data = props.data
      if (props.showHeader !== undefined) this._showHeader = props.showHeader
      if (props.border) this._border = props.border
      if (props.striped !== undefined) this._striped = props.striped
      if (props.selectedRow !== undefined) this._selectedIndex = props.selectedRow
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
    }
  }

  get selected(): T | undefined {
    return this._data[this._selectedIndex]
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get rowCount(): number {
    return this._data.length
  }

  get isFocused(): boolean {
    return this._focused
  }

  get borderStyle(): BorderStyle {
    return this._border
  }

  // Configuration
  columns(cols: TableColumn[]): this {
    this._columns = cols
    this.markDirty()
    return this
  }

  data(rows: T[]): this {
    this._data = rows
    this._selectedIndex = Math.min(this._selectedIndex, Math.max(-1, rows.length - 1))
    this.markDirty()
    return this
  }

  showHeader(enabled: boolean): this {
    this._showHeader = enabled
    this.markDirty()
    return this
  }

  border(style: BorderStyle): this {
    this._border = style
    this.markDirty()
    return this
  }

  striped(enabled: boolean): this {
    this._striped = enabled
    this.markDirty()
    return this
  }

  selectedRow(index: number): this {
    const newIndex = Math.max(-1, Math.min(index, this._data.length - 1))
    if (this._selectedIndex !== newIndex) {
      this._selectedIndex = newIndex
      this.ensureVisible()
      this.markDirty()
      this.emitChange()
    }
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
  onSelect(handler: (row: T, index: number) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onChange(handler: (row: T, index: number) => void): this {
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

  // Focus control
  focus(): this {
    if (!this._focused) {
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
   * Dispose of table and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._columns = []
    this._data = []
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
      this._selectedIndex--
      this.ensureVisible()
      this.markDirty()
      this.emitChange()
    }
  }

  /** @internal */
  selectNext(): void {
    if (this._selectedIndex < this._data.length - 1) {
      this._selectedIndex++
      this.ensureVisible()
      this.markDirty()
      this.emitChange()
    }
  }

  /** @internal */
  confirm(): void {
    const row = this._data[this._selectedIndex]
    if (row) {
      for (const handler of this._onSelectHandlers) {
        handler(row, this._selectedIndex)
      }
    }
  }

  private ensureVisible(): void {
    /* c8 ignore next */
    const visibleRows = this._bounds.height - (this._showHeader ? 1 : 0)
    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + visibleRows) {
      this._scrollOffset = this._selectedIndex - visibleRows + 1
    }
  }

  private emitChange(): void {
    const row = this._data[this._selectedIndex]
    if (row) {
      for (const handler of this._onChangeHandlers) {
        handler(row, this._selectedIndex)
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

    // Calculate column widths
    const colWidths = this.calculateColumnWidths(width)
    let row = 0

    // Render header
    if (this._showHeader && row < height) {
      let colX = x
      for (let i = 0; i < this._columns.length; i++) {
        /* c8 ignore next 2 */
        const col = this._columns[i]!
        const colWidth = colWidths[i] || 0

        let cellText = col.header
        if (stringWidth(cellText) > colWidth) {
          cellText = truncateToWidth(cellText, colWidth)
        }
        /* c8 ignore next */
        cellText = padToWidth(cellText, colWidth, col.align || 'left')

        buffer.write(colX, y + row, cellText, { fg, bg, attrs: ATTR_BOLD })
        colX += colWidth + 1 // +1 for separator
      }
      row++
    }

    // Render data rows
    const visibleRows = height - row
    for (let i = 0; i < visibleRows && this._scrollOffset + i < this._data.length; i++) {
      const dataIndex = this._scrollOffset + i
      const rowData = this._data[dataIndex]
      /* c8 ignore next */
      if (!rowData) continue

      /* c8 ignore next 2 */
      const isSelected = dataIndex === this._selectedIndex && this._focused
      const isStriped = this._striped && dataIndex % 2 === 1

      let rowAttrs = 0
      /* c8 ignore next 2 */
      if (isSelected) rowAttrs = ATTR_INVERSE
      else if (isStriped) rowAttrs = ATTR_DIM

      let colX = x
      for (let j = 0; j < this._columns.length; j++) {
        /* c8 ignore next 2 */
        const col = this._columns[j]!
        const colWidth = colWidths[j] || 0

        const value = rowData[col.key]
        /* c8 ignore next */
        let cellText = col.render ? col.render(value, rowData) : String(value ?? '')

        if (stringWidth(cellText) > colWidth) {
          cellText = truncateToWidth(cellText, colWidth)
        }
        /* c8 ignore next */
        cellText = padToWidth(cellText, colWidth, col.align || 'left')

        buffer.write(colX, y + row + i, cellText, { fg, bg, attrs: rowAttrs })
        colX += colWidth + 1
      }
    }
  }

  private calculateColumnWidths(totalWidth: number): number[] {
    const numCols = this._columns.length
    /* c8 ignore next */
    if (numCols === 0) return []

    // Guard against invalid total width
    if (totalWidth <= 0) {
      return this._columns.map(() => 1) // Minimum 1 char per column
    }

    const separatorWidth = numCols - 1
    const availableWidth = Math.max(numCols, totalWidth - separatorWidth) // At least 1 per column

    const widths: number[] = []
    let fixedWidth = 0
    let autoCount = 0

    // First pass: calculate fixed widths
    for (const col of this._columns) {
      if (typeof col.width === 'number') {
        // Ensure fixed width is at least 1
        const colWidth = Math.max(1, col.width)
        widths.push(colWidth)
        fixedWidth += colWidth
      } else {
        widths.push(0)
        autoCount++
      }
    }

    // Second pass: distribute remaining width
    if (autoCount > 0) {
      const remainingWidth = availableWidth - fixedWidth
      // Guard against negative remaining width
      const autoWidth = Math.max(1, Math.floor(remainingWidth / autoCount))

      // Track how much width we've assigned to auto columns
      let assignedAutoWidth = 0
      let autoIndex = 0

      for (let i = 0; i < widths.length; i++) {
        if (widths[i] === 0) {
          autoIndex++
          // Last auto column gets any remainder to ensure total matches
          if (autoIndex === autoCount) {
            widths[i] = Math.max(1, remainingWidth - assignedAutoWidth)
          } else {
            widths[i] = autoWidth
            assignedAutoWidth += autoWidth
          }
        }
      }
    }

    // Final validation: ensure no width is less than 1
    for (let i = 0; i < widths.length; i++) {
      if (widths[i]! < 1) {
        widths[i] = 1
      }
    }

    return widths
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a table widget.
 *
 * @param props - Table properties
 * @returns Table node
 *
 * @example
 * ```typescript
 * // Basic table
 * const users = table()
 *   .columns([
 *     { key: 'id', header: 'ID', width: 5 },
 *     { key: 'name', header: 'Name', width: 20 },
 *     { key: 'email', header: 'Email' }
 *   ])
 *   .data([
 *     { id: 1, name: 'Alice', email: 'alice@example.com' },
 *     { id: 2, name: 'Bob', email: 'bob@example.com' }
 *   ])
 *   .onSelect((row) => console.log('Selected:', row))
 *
 * // With custom renderer
 * const status = table()
 *   .columns([
 *     { key: 'name', header: 'Service' },
 *     {
 *       key: 'status',
 *       header: 'Status',
 *       render: (v) => v === 'up' ? '[+] Up' : '[-] Down'
 *     }
 *   ])
 * ```
 */
export function table<T extends Record<string, unknown> = Record<string, unknown>>(
  props?: TableProps<T>
): TableNode<T> {
  return new TableNodeImpl<T>(props)
}
