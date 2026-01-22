/**
 * @oxog/tui - DataGrid Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD, ATTR_UNDERLINE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc' | 'none'

/**
 * Column alignment.
 */
export type ColumnAlign = 'left' | 'center' | 'right'

/**
 * DataGrid column definition.
 */
export interface DataGridColumn<T = any> {
  /** Column unique key */
  key: string
  /** Column header text */
  header: string
  /** Column width (fixed or minimum) */
  width?: number
  /** Minimum width */
  minWidth?: number
  /** Maximum width */
  maxWidth?: number
  /** Flexible width (takes remaining space) */
  flex?: number
  /** Column alignment */
  align?: ColumnAlign
  /** Column is sortable */
  sortable?: boolean
  /** Column is resizable */
  resizable?: boolean
  /** Custom cell renderer */
  render?: (value: any, row: T, rowIndex: number) => string
  /** Custom sort comparator */
  compare?: (a: T, b: T) => number
}

/**
 * DataGrid widget properties.
 */
export interface DataGridProps<T = any> {
  /** Column definitions */
  columns?: DataGridColumn<T>[]
  /** Data rows */
  data?: T[]
  /** Enable row selection */
  selectable?: boolean
  /** Multi-select mode */
  multiSelect?: boolean
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Enable sorting */
  sortable?: boolean
  /** Stripe alternating rows */
  striped?: boolean
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Row height */
  rowHeight?: number
  /** Header height */
  headerHeight?: number
  /** Page size (0 = no pagination) */
  pageSize?: number
}

/**
 * DataGrid node interface.
 */
export interface DataGridNode<T = any> extends Node {
  readonly type: 'datagrid'

  // Configuration
  columns(cols: DataGridColumn<T>[]): this
  data(rows: T[]): this
  selectable(enabled: boolean): this
  multiSelect(enabled: boolean): this
  showRowNumbers(show: boolean): this
  sortable(enabled: boolean): this
  striped(enabled: boolean): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  pageSize(size: number): this

  // Sorting
  sortBy(columnKey: string, direction?: SortDirection): this
  clearSort(): this

  // Selection
  selectRow(index: number): this
  deselectRow(index: number): this
  selectAll(): this
  deselectAll(): this
  toggleRow(index: number): this

  // Navigation
  nextRow(): this
  previousRow(): this
  nextPage(): this
  previousPage(): this
  goToPage(page: number): this
  scrollToRow(index: number): this

  // Events
  onSelect(handler: (rows: T[], indices: number[]) => void): this
  onSort(handler: (column: string, direction: SortDirection) => void): this
  onRowClick(handler: (row: T, index: number) => void): this
  onPageChange(handler: (page: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly selectedRows: T[]
  readonly selectedIndices: number[]
  readonly sortColumn: string | null
  readonly sortDirection: SortDirection
  readonly currentPage: number
  readonly totalPages: number
  readonly rowCount: number
  readonly focusedRowIndex: number
}

// ============================================================
// Implementation
// ============================================================

class DataGridNodeImpl<T = any> extends LeafNode implements DataGridNode<T> {
  readonly type = 'datagrid' as const

  private _columns: DataGridColumn<T>[] = []
  private _data: T[] = []
  private _selectable: boolean = true
  private _multiSelect: boolean = false
  private _showRowNumbers: boolean = false
  private _sortable: boolean = true
  private _striped: boolean = true
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'single'
  private _pageSize: number = 0

  private _sortColumn: string | null = null
  private _sortDirection: SortDirection = 'none'
  private _selectedIndices: Set<number> = new Set()
  private _focusedIndex: number = 0
  private _scrollOffset: number = 0
  private _currentPage: number = 0
  private _isFocused: boolean = false

  private _onSelectHandlers: ((rows: T[], indices: number[]) => void)[] = []
  private _onSortHandlers: ((column: string, direction: SortDirection) => void)[] = []
  private _onRowClickHandlers: ((row: T, index: number) => void)[] = []
  private _onPageChangeHandlers: ((page: number) => void)[] = []

  constructor(props?: DataGridProps<T>) {
    super()
    if (props) {
      if (props.columns) this._columns = props.columns
      if (props.data) this._data = props.data
      if (props.selectable !== undefined) this._selectable = props.selectable
      if (props.multiSelect !== undefined) this._multiSelect = props.multiSelect
      if (props.showRowNumbers !== undefined) this._showRowNumbers = props.showRowNumbers
      if (props.sortable !== undefined) this._sortable = props.sortable
      if (props.striped !== undefined) this._striped = props.striped
      if (props.border) this._border = props.border
      if (props.pageSize !== undefined) this._pageSize = props.pageSize
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get selectedRows(): T[] {
    const sortedData = this.getSortedData()
    return Array.from(this._selectedIndices)
      .sort((a, b) => a - b)
      .map((i) => sortedData[i])
      .filter((row): row is T => row !== undefined)
  }

  get selectedIndices(): number[] {
    return Array.from(this._selectedIndices).sort((a, b) => a - b)
  }

  get sortColumn(): string | null {
    return this._sortColumn
  }

  get sortDirection(): SortDirection {
    return this._sortDirection
  }

  get currentPage(): number {
    return this._currentPage
  }

  get totalPages(): number {
    if (this._pageSize <= 0) return 1
    return Math.max(1, Math.ceil(this._data.length / this._pageSize))
  }

  get rowCount(): number {
    return this._data.length
  }

  get focusedRowIndex(): number {
    return this._focusedIndex
  }

  // Configuration
  columns(cols: DataGridColumn<T>[]): this {
    this._columns = cols
    this.markDirty()
    return this
  }

  data(rows: T[]): this {
    this._data = rows
    this._selectedIndices.clear()
    this._focusedIndex = 0
    this._scrollOffset = 0
    this._currentPage = 0
    this.markDirty()
    return this
  }

  selectable(enabled: boolean): this {
    this._selectable = enabled
    this.markDirty()
    return this
  }

  multiSelect(enabled: boolean): this {
    this._multiSelect = enabled
    if (!enabled && this._selectedIndices.size > 1) {
      const first = this._selectedIndices.values().next().value
      this._selectedIndices.clear()
      if (first !== undefined) this._selectedIndices.add(first)
    }
    this.markDirty()
    return this
  }

  showRowNumbers(show: boolean): this {
    this._showRowNumbers = show
    this.markDirty()
    return this
  }

  sortable(enabled: boolean): this {
    this._sortable = enabled
    this.markDirty()
    return this
  }

  striped(enabled: boolean): this {
    this._striped = enabled
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  pageSize(size: number): this {
    this._pageSize = size
    this._currentPage = 0
    this.markDirty()
    return this
  }

  // Sorting
  sortBy(columnKey: string, direction?: SortDirection): this {
    const column = this._columns.find((c) => c.key === columnKey)
    if (!column || (column.sortable === false && this._sortable)) {
      return this
    }

    if (direction !== undefined) {
      this._sortDirection = direction
    } else {
      // Cycle through: none -> asc -> desc -> none
      if (this._sortColumn !== columnKey) {
        this._sortDirection = 'asc'
      } else if (this._sortDirection === 'asc') {
        this._sortDirection = 'desc'
      } else if (this._sortDirection === 'desc') {
        this._sortDirection = 'none'
      } else {
        this._sortDirection = 'asc'
      }
    }

    this._sortColumn = this._sortDirection === 'none' ? null : columnKey
    this.markDirty()

    for (const handler of this._onSortHandlers) {
      handler(columnKey, this._sortDirection)
    }

    return this
  }

  clearSort(): this {
    this._sortColumn = null
    this._sortDirection = 'none'
    this.markDirty()
    return this
  }

  private getSortedData(): T[] {
    if (!this._sortColumn || this._sortDirection === 'none') {
      return this._data
    }

    const column = this._columns.find((c) => c.key === this._sortColumn)
    if (!column) return this._data

    const sorted = [...this._data].sort((a, b) => {
      if (column.compare) {
        return column.compare(a, b)
      }

      const aVal = (a as any)[column.key]
      const bVal = (b as any)[column.key]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal
      }

      return String(aVal).localeCompare(String(bVal))
    })

    return this._sortDirection === 'desc' ? sorted.reverse() : sorted
  }

  // Selection
  selectRow(index: number): this {
    if (!this._selectable) return this

    if (!this._multiSelect) {
      this._selectedIndices.clear()
    }

    if (index >= 0 && index < this._data.length) {
      this._selectedIndices.add(index)
      this.markDirty()
      this.emitSelectEvent()
    }

    return this
  }

  deselectRow(index: number): this {
    if (this._selectedIndices.has(index)) {
      this._selectedIndices.delete(index)
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  selectAll(): this {
    if (!this._selectable || !this._multiSelect) return this

    for (let i = 0; i < this._data.length; i++) {
      this._selectedIndices.add(i)
    }
    this.markDirty()
    this.emitSelectEvent()
    return this
  }

  deselectAll(): this {
    if (this._selectedIndices.size > 0) {
      this._selectedIndices.clear()
      this.markDirty()
      this.emitSelectEvent()
    }
    return this
  }

  toggleRow(index: number): this {
    if (!this._selectable) return this

    if (this._selectedIndices.has(index)) {
      this.deselectRow(index)
    } else {
      this.selectRow(index)
    }
    return this
  }

  private emitSelectEvent(): void {
    const sortedData = this.getSortedData()
    const rows = this.selectedIndices.map((i) => sortedData[i]).filter((row): row is T => row !== undefined)
    for (const handler of this._onSelectHandlers) {
      handler(rows, this.selectedIndices)
    }
  }

  // Navigation
  nextRow(): this {
    const maxIndex = this._data.length - 1
    if (this._focusedIndex < maxIndex) {
      this._focusedIndex++
      this.ensureFocusedVisible()
      this.markDirty()
    }
    return this
  }

  previousRow(): this {
    if (this._focusedIndex > 0) {
      this._focusedIndex--
      this.ensureFocusedVisible()
      this.markDirty()
    }
    return this
  }

  nextPage(): this {
    if (this._pageSize > 0 && this._currentPage < this.totalPages - 1) {
      this._currentPage++
      this._focusedIndex = this._currentPage * this._pageSize
      this.markDirty()
      for (const handler of this._onPageChangeHandlers) {
        handler(this._currentPage)
      }
    } else if (this._pageSize <= 0) {
      // Scroll mode
      const bounds = this._bounds
      if (bounds) {
        const visibleRows = this.getVisibleRowCount(bounds.height)
        this._scrollOffset = Math.min(
          this._scrollOffset + visibleRows,
          Math.max(0, this._data.length - visibleRows)
        )
        this.markDirty()
      }
    }
    return this
  }

  previousPage(): this {
    if (this._pageSize > 0 && this._currentPage > 0) {
      this._currentPage--
      this._focusedIndex = this._currentPage * this._pageSize
      this.markDirty()
      for (const handler of this._onPageChangeHandlers) {
        handler(this._currentPage)
      }
    } else if (this._pageSize <= 0) {
      // Scroll mode
      const bounds = this._bounds
      if (bounds) {
        const visibleRows = this.getVisibleRowCount(bounds.height)
        this._scrollOffset = Math.max(0, this._scrollOffset - visibleRows)
        this.markDirty()
      }
    }
    return this
  }

  goToPage(page: number): this {
    if (this._pageSize > 0 && page >= 0 && page < this.totalPages) {
      this._currentPage = page
      this._focusedIndex = page * this._pageSize
      this.markDirty()
      for (const handler of this._onPageChangeHandlers) {
        handler(this._currentPage)
      }
    }
    return this
  }

  scrollToRow(index: number): this {
    if (index >= 0 && index < this._data.length) {
      this._focusedIndex = index
      this.ensureFocusedVisible()
      this.markDirty()
    }
    return this
  }

  private ensureFocusedVisible(): void {
    if (this._pageSize > 0) {
      // Pagination mode
      const page = Math.floor(this._focusedIndex / this._pageSize)
      if (page !== this._currentPage) {
        this._currentPage = page
        for (const handler of this._onPageChangeHandlers) {
          handler(this._currentPage)
        }
      }
    } else {
      // Scroll mode
      const bounds = this._bounds
      if (!bounds) return

      const visibleRows = this.getVisibleRowCount(bounds.height)
      if (this._focusedIndex < this._scrollOffset) {
        this._scrollOffset = this._focusedIndex
      } else if (this._focusedIndex >= this._scrollOffset + visibleRows) {
        this._scrollOffset = this._focusedIndex - visibleRows + 1
      }
    }
  }

  private getVisibleRowCount(height: number): number {
    const borderOffset = this._border !== 'none' ? 2 : 0
    const headerHeight = 1
    return Math.max(1, height - borderOffset - headerHeight)
  }

  // Events
  onSelect(handler: (rows: T[], indices: number[]) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onSort(handler: (column: string, direction: SortDirection) => void): this {
    this._onSortHandlers.push(handler)
    return this
  }

  onRowClick(handler: (row: T, index: number) => void): this {
    this._onRowClickHandlers.push(handler)
    return this
  }

  onPageChange(handler: (page: number) => void): this {
    this._onPageChangeHandlers.push(handler)
    return this
  }

  // Focus
  override focus(): this {
    this._isFocused = true
    this.markDirty()
    return this
  }

  override blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  /**
   * Dispose of datagrid and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._columns = []
    this._data = []
    this._selectedIndices.clear()
    this._onSelectHandlers = []
    this._onSortHandlers = []
    this._onRowClickHandlers = []
    this._onPageChangeHandlers = []
    super.dispose()
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.previousRow()
        return true
      case 'down':
      case 'j':
        this.nextRow()
        return true
      case 'pageup':
        this.previousPage()
        return true
      case 'pagedown':
        this.nextPage()
        return true
      case 'home':
        this._focusedIndex = 0
        this.ensureFocusedVisible()
        this.markDirty()
        return true
      case 'end':
        this._focusedIndex = Math.max(0, this._data.length - 1)
        this.ensureFocusedVisible()
        this.markDirty()
        return true
      case 'space':
        if (this._selectable) {
          this.toggleRow(this._focusedIndex)
        }
        return true
      case 'enter':
        const sortedData = this.getSortedData()
        const row = sortedData[this._focusedIndex]
        if (row) {
          for (const handler of this._onRowClickHandlers) {
            handler(row, this._focusedIndex)
          }
        }
        return true
      case 'a':
        if (ctrl && this._multiSelect) {
          this.selectAll()
          return true
        }
        break
      case 'escape':
        this.deselectAll()
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
      const borderOffset = this._border !== 'none' ? 1 : 0
      const headerY = bounds.y + borderOffset
      const dataStartY = headerY + 1

      // Click on header (sorting)
      if (y === headerY && this._sortable) {
        const columnIndex = this.getColumnAtX(x - bounds.x - borderOffset)
        if (columnIndex !== -1) {
          const col = this._columns[columnIndex]
          if (col && col.sortable !== false) {
            this.sortBy(col.key)
            return true
          }
        }
      }

      // Click on row
      if (y >= dataStartY && y < bounds.y + bounds.height - borderOffset) {
        const rowOffset = y - dataStartY
        const actualIndex = this._pageSize > 0
          ? this._currentPage * this._pageSize + rowOffset
          : this._scrollOffset + rowOffset

        if (actualIndex >= 0 && actualIndex < this._data.length) {
          this._isFocused = true
          this._focusedIndex = actualIndex

          if (this._selectable) {
            this.toggleRow(actualIndex)
          }

          const sortedData = this.getSortedData()
          const row = sortedData[actualIndex]
          if (row) {
            for (const handler of this._onRowClickHandlers) {
              handler(row, actualIndex)
            }
          }

          this.markDirty()
          return true
        }
      }
    }

    return false
  }

  private getColumnAtX(relX: number): number {
    const widths = this.calculateColumnWidths()
    let currentX = this._showRowNumbers ? 4 : 0

    for (let i = 0; i < widths.length; i++) {
      const colWidth = widths[i] ?? 0
      if (relX >= currentX && relX < currentX + colWidth) {
        return i
      }
      currentX += colWidth + 1 // +1 for separator
    }

    return -1
  }

  private calculateColumnWidths(): number[] {
    const bounds = this._bounds
    if (!bounds) return this._columns.map(() => 10)

    const borderOffset = this._border !== 'none' ? 2 : 0
    const rowNumWidth = this._showRowNumbers ? 4 : 0
    const availableWidth = bounds.width - borderOffset - rowNumWidth - (this._columns.length - 1) // separators

    const widths: number[] = []
    let totalFixed = 0
    let totalFlex = 0

    // First pass: fixed widths
    for (const col of this._columns) {
      if (col.width) {
        widths.push(col.width)
        totalFixed += col.width
      } else if (col.flex) {
        widths.push(0)
        totalFlex += col.flex
      } else {
        // Default width based on header
        const defaultWidth = Math.max(stringWidth(col.header) + 2, col.minWidth ?? 8)
        widths.push(defaultWidth)
        totalFixed += defaultWidth
      }
    }

    // Second pass: flex widths
    if (totalFlex > 0) {
      const remainingWidth = availableWidth - totalFixed
      for (let i = 0; i < this._columns.length; i++) {
        const col = this._columns[i]
        if (col && col.flex) {
          const flexWidth = Math.floor((remainingWidth * col.flex) / totalFlex)
          widths[i] = Math.max(flexWidth, col.minWidth ?? 5)
          if (col.maxWidth) {
            widths[i] = Math.min(widths[i] ?? 0, col.maxWidth)
          }
        }
      }
    }

    return widths
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const borderOffset = this._border !== 'none' ? 1 : 0

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      for (let row = bounds.y; row < bounds.y + bounds.height; row++) {
        for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
          let char = ' '
          const isTop = row === bounds.y
          const isBottom = row === bounds.y + bounds.height - 1
          const isLeft = col === bounds.x
          const isRight = col === bounds.x + bounds.width - 1

          if (isTop && isLeft) char = chars.topLeft
          else if (isTop && isRight) char = chars.topRight
          else if (isBottom && isLeft) char = chars.bottomLeft
          else if (isBottom && isRight) char = chars.bottomRight
          else if (isTop || isBottom) char = chars.horizontal
          else if (isLeft || isRight) char = chars.vertical
          else continue

          buffer.set(col, row, { char, fg, bg, attrs: 0 })
        }
      }
    }

    const columnWidths = this.calculateColumnWidths()
    const contentStartX = bounds.x + borderOffset
    const contentWidth = bounds.width - 2 * borderOffset

    // Draw header
    this.renderHeader(buffer, contentStartX, bounds.y + borderOffset, contentWidth, columnWidths, fg, bg)

    // Draw rows
    const sortedData = this.getSortedData()
    const visibleRows = this.getVisibleRowCount(bounds.height)
    const startIndex = this._pageSize > 0
      ? this._currentPage * this._pageSize
      : this._scrollOffset
    const endIndex = Math.min(startIndex + visibleRows, sortedData.length)

    for (let i = startIndex; i < endIndex; i++) {
      const row = sortedData[i]
      if (!row) continue

      const rowY = bounds.y + borderOffset + 1 + (i - startIndex)
      const isSelected = this._selectedIndices.has(i)
      const isFocused = this._isFocused && this._focusedIndex === i
      const isStriped = this._striped && (i - startIndex) % 2 === 1

      this.renderRow(buffer, row, i, contentStartX, rowY, contentWidth, columnWidths, fg, bg, isSelected, isFocused, isStriped)
    }

    // Draw pagination info
    if (this._pageSize > 0 && this.totalPages > 1) {
      const pageInfo = `Page ${this._currentPage + 1}/${this.totalPages}`
      const infoX = bounds.x + bounds.width - stringWidth(pageInfo) - borderOffset - 1
      buffer.write(infoX, bounds.y + bounds.height - 1, pageInfo, { fg, bg, attrs: ATTR_DIM })
    }
  }

  private renderHeader(
    buffer: Buffer,
    x: number,
    y: number,
    _width: number,
    columnWidths: number[],
    fg: number,
    bg: number
  ): void {
    let currentX = x

    // Row number column
    if (this._showRowNumbers) {
      buffer.write(currentX, y, padToWidth('#', 3, 'right'), { fg, bg, attrs: ATTR_BOLD })
      currentX += 4
    }

    // Column headers
    for (let i = 0; i < this._columns.length; i++) {
      const col = this._columns[i]
      const colWidth = columnWidths[i]
      if (!col || colWidth === undefined) continue

      let headerText = col.header

      // Add sort indicator
      if (this._sortColumn === col.key) {
        const indicator = this._sortDirection === 'asc' ? ' \u25b2' : ' \u25bc' // ▲ or ▼
        headerText += indicator
      }

      // Truncate/pad
      if (stringWidth(headerText) > colWidth) {
        headerText = truncateToWidth(headerText, colWidth)
      } else {
        const align = col.align ?? 'left'
        headerText = padToWidth(headerText, colWidth, align)
      }

      const attrs = ATTR_BOLD | (col.sortable !== false && this._sortable ? ATTR_UNDERLINE : 0)
      buffer.write(currentX, y, headerText, { fg, bg, attrs })

      currentX += colWidth
      if (i < this._columns.length - 1) {
        buffer.set(currentX, y, { char: '\u2502', fg, bg, attrs: ATTR_DIM }) // │
        currentX++
      }
    }
  }

  private renderRow(
    buffer: Buffer,
    row: T,
    rowIndex: number,
    x: number,
    y: number,
    width: number,
    columnWidths: number[],
    fg: number,
    bg: number,
    isSelected: boolean,
    isFocused: boolean,
    isStriped: boolean
  ): void {
    let attrs = 0
    if (isSelected) attrs |= ATTR_BOLD
    if (isFocused) attrs |= ATTR_INVERSE
    if (isStriped && !isFocused) attrs |= ATTR_DIM

    // Fill row background if focused
    if (isFocused) {
      for (let col = x; col < x + width; col++) {
        buffer.set(col, y, { char: ' ', fg, bg, attrs })
      }
    }

    let currentX = x

    // Row number
    if (this._showRowNumbers) {
      const rowNum = padToWidth(String(rowIndex + 1), 3, 'right')
      buffer.write(currentX, y, rowNum, { fg, bg, attrs: attrs | ATTR_DIM })
      currentX += 4
    }

    // Cells
    for (let i = 0; i < this._columns.length; i++) {
      const col = this._columns[i]
      const colWidth = columnWidths[i]
      if (!col || colWidth === undefined) continue

      // Get cell value
      let cellValue: string
      if (col.render) {
        cellValue = col.render((row as any)[col.key], row, rowIndex)
      } else {
        const val = (row as any)[col.key]
        cellValue = val === null || val === undefined ? '' : String(val)
      }

      // Truncate/pad
      if (stringWidth(cellValue) > colWidth) {
        cellValue = truncateToWidth(cellValue, colWidth)
      } else {
        const align = col.align ?? 'left'
        cellValue = padToWidth(cellValue, colWidth, align)
      }

      buffer.write(currentX, y, cellValue, { fg, bg, attrs })

      currentX += colWidth
      if (i < this._columns.length - 1) {
        buffer.set(currentX, y, { char: '\u2502', fg, bg, attrs: ATTR_DIM }) // │
        currentX++
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a datagrid widget.
 *
 * @param props - DataGrid properties
 * @returns DataGrid node
 *
 * @example
 * ```typescript
 * // Basic datagrid
 * const grid = datagrid({
 *   columns: [
 *     { key: 'id', header: 'ID', width: 6, align: 'right' },
 *     { key: 'name', header: 'Name', flex: 1 },
 *     { key: 'email', header: 'Email', flex: 2 },
 *     { key: 'status', header: 'Status', width: 10 }
 *   ],
 *   data: [
 *     { id: 1, name: 'John', email: 'john@example.com', status: 'Active' },
 *     { id: 2, name: 'Jane', email: 'jane@example.com', status: 'Inactive' }
 *   ]
 * })
 *   .onSelect((rows, indices) => {
 *     console.log('Selected:', rows)
 *   })
 *   .onSort((column, direction) => {
 *     console.log('Sorted by:', column, direction)
 *   })
 *
 * // With custom rendering
 * const statusGrid = datagrid({
 *   columns: [
 *     { key: 'name', header: 'Name', flex: 1 },
 *     {
 *       key: 'status',
 *       header: 'Status',
 *       width: 12,
 *       render: (value) => value === 'active' ? '\u2714 Active' : '\u2718 Inactive'
 *     }
 *   ]
 * })
 *
 * // With pagination
 * const pagedGrid = datagrid({ pageSize: 20 })
 *   .columns([...])
 *   .data(largeDataset)
 *   .onPageChange(page => console.log('Page:', page))
 * ```
 */
export function datagrid<T = any>(props?: DataGridProps<T>): DataGridNode<T> {
  return new DataGridNodeImpl<T>(props)
}
