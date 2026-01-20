/**
 * @oxog/tui - Grid Layout Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { ContainerNode, BaseNode } from './node'

// ============================================================
// Types
// ============================================================

/**
 * Grid cell configuration.
 */
export interface GridCell {
  /** Child node */
  node: Node
  /** Column start (1-based) */
  col?: number
  /** Row start (1-based) */
  row?: number
  /** Column span */
  colSpan?: number
  /** Row span */
  rowSpan?: number
}

/**
 * Grid template definition.
 */
export type GridTemplate = (number | string)[]

/**
 * Grid widget properties.
 */
export interface GridProps {
  /** Number of columns */
  columns?: number
  /** Number of rows */
  rows?: number
  /** Column template (sizes) */
  columnTemplate?: GridTemplate
  /** Row template (sizes) */
  rowTemplate?: GridTemplate
  /** Gap between cells */
  gap?: number
  /** Column gap */
  columnGap?: number
  /** Row gap */
  rowGap?: number
}

/**
 * Grid node interface.
 */
export interface GridNode extends Node {
  readonly type: 'grid'

  // Configuration
  columns(count: number): this
  rows(count: number): this
  columnTemplate(template: GridTemplate): this
  rowTemplate(template: GridTemplate): this
  gap(size: number): this
  columnGap(size: number): this
  rowGap(size: number): this

  // Content
  add(node: Node, col?: number, row?: number, colSpan?: number, rowSpan?: number): this
  cell(col: number, row: number, node: Node, colSpan?: number, rowSpan?: number): this
  remove(node: Node): this
  clear(): this

  // State
  readonly cellCount: number
}

// ============================================================
// Implementation
// ============================================================

class GridNodeImpl extends ContainerNode implements GridNode {
  readonly type = 'grid' as const

  private _columns: number = 1
  private _rows: number = 1
  private _columnTemplate: GridTemplate = []
  private _rowTemplate: GridTemplate = []
  private _columnGap: number = 0
  private _rowGap: number = 0
  private _cells: GridCell[] = []
  private _autoCol: number = 1
  private _autoRow: number = 1

  constructor(props?: GridProps) {
    super()
    if (props) {
      if (props.columns !== undefined) this._columns = props.columns
      if (props.rows !== undefined) this._rows = props.rows
      if (props.columnTemplate) this._columnTemplate = props.columnTemplate
      if (props.rowTemplate) this._rowTemplate = props.rowTemplate
      if (props.gap !== undefined) {
        this._columnGap = props.gap
        this._rowGap = props.gap
      }
      if (props.columnGap !== undefined) this._columnGap = props.columnGap
      if (props.rowGap !== undefined) this._rowGap = props.rowGap
    }
  }

  get cellCount(): number {
    return this._cells.length
  }

  // Configuration
  columns(count: number): this {
    this._columns = Math.max(1, count)
    this.markDirty()
    return this
  }

  rows(count: number): this {
    this._rows = Math.max(1, count)
    this.markDirty()
    return this
  }

  columnTemplate(template: GridTemplate): this {
    this._columnTemplate = template
    this.markDirty()
    return this
  }

  rowTemplate(template: GridTemplate): this {
    this._rowTemplate = template
    this.markDirty()
    return this
  }

  gap(size: number): this {
    this._columnGap = size
    this._rowGap = size
    this.markDirty()
    return this
  }

  columnGap(size: number): this {
    this._columnGap = size
    this.markDirty()
    return this
  }

  rowGap(size: number): this {
    this._rowGap = size
    this.markDirty()
    return this
  }

  // Content
  add(node: Node, col?: number, row?: number, colSpan?: number, rowSpan?: number): this {
    const cellCol = col ?? this._autoCol
    const cellRow = row ?? this._autoRow

    this._cells.push({
      node,
      col: cellCol,
      row: cellRow,
      colSpan: colSpan ?? 1,
      rowSpan: rowSpan ?? 1
    })

    if (node instanceof BaseNode) {
      node._parent = this
    }

    // Auto-advance position
    if (col === undefined && row === undefined) {
      this._autoCol++
      if (this._autoCol > this._columns) {
        this._autoCol = 1
        this._autoRow++
      }
    }

    this.markDirty()
    return this
  }

  cell(col: number, row: number, node: Node, colSpan?: number, rowSpan?: number): this {
    return this.add(node, col, row, colSpan, rowSpan)
  }

  remove(node: Node): this {
    const index = this._cells.findIndex(c => c.node === node)
    if (index !== -1) {
      this._cells.splice(index, 1)
      if (node instanceof BaseNode) {
        node._parent = null
      }
      this.markDirty()
    }
    return this
  }

  clear(): this {
    for (const cell of this._cells) {
      if (cell.node instanceof BaseNode) {
        cell.node._parent = null
      }
    }
    this._cells = []
    this._autoCol = 1
    this._autoRow = 1
    this.markDirty()
    return this
  }

  // Calculate column widths
  private calculateColumnWidths(totalWidth: number): number[] {
    const template = this._columnTemplate.length > 0
      ? this._columnTemplate
      : Array(this._columns).fill('1fr')

    const gaps = (this._columns - 1) * this._columnGap
    const availableWidth = totalWidth - gaps

    // First pass: calculate fixed and percentage widths
    let usedWidth = 0
    let totalFr = 0
    const widths: (number | null)[] = []

    for (let i = 0; i < this._columns; i++) {
      const size = template[i] ?? '1fr'

      if (typeof size === 'number') {
        widths.push(size)
        usedWidth += size
      } else if (size.endsWith('%')) {
        const percent = parseFloat(size) / 100
        const w = Math.floor(availableWidth * percent)
        widths.push(w)
        usedWidth += w
      } else if (size.endsWith('fr')) {
        const fr = parseFloat(size) || 1
        totalFr += fr
        widths.push(null) // Will be calculated
      } else {
        // Treat as fixed number
        const w = parseInt(size, 10) || 10
        widths.push(w)
        usedWidth += w
      }
    }

    // Second pass: distribute remaining space to fr units
    const remainingWidth = availableWidth - usedWidth
    const frUnit = totalFr > 0 ? remainingWidth / totalFr : 0

    for (let i = 0; i < widths.length; i++) {
      if (widths[i] === null) {
        const size = template[i]
        const fr = typeof size === 'string' && size.endsWith('fr')
          ? (parseFloat(size) || 1)
          : 1
        widths[i] = Math.floor(frUnit * fr)
      }
    }

    return widths as number[]
  }

  // Calculate row heights
  private calculateRowHeights(totalHeight: number): number[] {
    const template = this._rowTemplate.length > 0
      ? this._rowTemplate
      : Array(this._rows).fill('1fr')

    const gaps = (this._rows - 1) * this._rowGap
    const availableHeight = totalHeight - gaps

    let usedHeight = 0
    let totalFr = 0
    const heights: (number | null)[] = []

    for (let i = 0; i < this._rows; i++) {
      const size = template[i] ?? '1fr'

      if (typeof size === 'number') {
        heights.push(size)
        usedHeight += size
      } else if (size.endsWith('%')) {
        const percent = parseFloat(size) / 100
        const h = Math.floor(availableHeight * percent)
        heights.push(h)
        usedHeight += h
      } else if (size.endsWith('fr')) {
        const fr = parseFloat(size) || 1
        totalFr += fr
        heights.push(null)
      } else {
        const h = parseInt(size, 10) || 3
        heights.push(h)
        usedHeight += h
      }
    }

    const remainingHeight = availableHeight - usedHeight
    const frUnit = totalFr > 0 ? remainingHeight / totalFr : 0

    for (let i = 0; i < heights.length; i++) {
      if (heights[i] === null) {
        const size = template[i]
        const fr = typeof size === 'string' && size.endsWith('fr')
          ? (parseFloat(size) || 1)
          : 1
        heights[i] = Math.floor(frUnit * fr)
      }
    }

    return heights as number[]
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    const columnWidths = this.calculateColumnWidths(width)
    const rowHeights = this.calculateRowHeights(height)

    // Calculate cell positions
    const colPositions: number[] = [x]
    for (let i = 0; i < columnWidths.length; i++) {
      colPositions.push(colPositions[i]! + columnWidths[i]! + this._columnGap)
    }

    const rowPositions: number[] = [y]
    for (let i = 0; i < rowHeights.length; i++) {
      rowPositions.push(rowPositions[i]! + rowHeights[i]! + this._rowGap)
    }

    // Render each cell
    for (const cell of this._cells) {
      const col = (cell.col ?? 1) - 1
      const row = (cell.row ?? 1) - 1
      const colSpan = cell.colSpan ?? 1
      const rowSpan = cell.rowSpan ?? 1

      if (col < 0 || col >= this._columns || row < 0 || row >= this._rows) {
        continue
      }

      const cellX = colPositions[col] ?? x
      let cellWidth = 0
      for (let c = col; c < col + colSpan && c < columnWidths.length; c++) {
        cellWidth += columnWidths[c] ?? 0
        if (c < col + colSpan - 1) cellWidth += this._columnGap
      }

      const cellY = rowPositions[row] ?? y
      let cellHeight = 0
      for (let r = row; r < row + rowSpan && r < rowHeights.length; r++) {
        cellHeight += rowHeights[r] ?? 0
        if (r < row + rowSpan - 1) cellHeight += this._rowGap
      }

      if (cell.node instanceof BaseNode) {
        cell.node._bounds = {
          x: cellX,
          y: cellY,
          width: cellWidth,
          height: cellHeight
        }
        cell.node.render(buffer, parentStyle)
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a grid layout widget.
 *
 * @param props - Grid properties
 * @returns Grid node
 *
 * @example
 * ```typescript
 * // Simple 2x2 grid
 * const g = grid({ columns: 2, rows: 2 })
 *   .add(text('Cell 1'))
 *   .add(text('Cell 2'))
 *   .add(text('Cell 3'))
 *   .add(text('Cell 4'))
 *
 * // Grid with custom template
 * const dashboard = grid()
 *   .columns(3)
 *   .rows(2)
 *   .columnTemplate(['200', '1fr', '200'])
 *   .rowTemplate(['100', '1fr'])
 *   .gap(1)
 *   .cell(1, 1, sidebar)
 *   .cell(2, 1, header, 2, 1)  // Span 2 columns
 *   .cell(2, 2, content)
 *   .cell(3, 2, panel)
 *
 * // Responsive-like grid
 * const cards = grid({ columns: 4, gap: 2 })
 *   .columnTemplate(['1fr', '1fr', '1fr', '1fr'])
 *   .add(card1)
 *   .add(card2)
 *   .add(card3)
 *   .add(card4)
 * ```
 */
export function grid(props?: GridProps): GridNode {
  return new GridNodeImpl(props)
}
