/**
 * @oxog/tui - Heatmap Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_DIM, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Color scale type.
 */
export type HeatmapColorScale =
  | 'default'     // Blue to red
  | 'grayscale'   // Black to white
  | 'viridis'     // Purple to yellow
  | 'plasma'      // Purple to yellow-orange
  | 'cool'        // Cyan to magenta
  | 'warm'        // Yellow to red
  | 'custom'      // Custom color array

/**
 * Heatmap widget properties.
 */
export interface HeatmapProps {
  /** 2D data array */
  data?: number[][]
  /** Row labels */
  rowLabels?: string[]
  /** Column labels */
  columnLabels?: string[]
  /** Color scale */
  colorScale?: HeatmapColorScale
  /** Custom colors (when colorScale is 'custom') */
  customColors?: number[]
  /** Show values in cells */
  showValues?: boolean
  /** Minimum value (for scaling) */
  minValue?: number
  /** Maximum value (for scaling) */
  maxValue?: number
  /** Cell width */
  cellWidth?: number
  /** Cell height */
  cellHeight?: number
}

/**
 * Heatmap node interface.
 */
export interface HeatmapNode extends Node {
  readonly type: 'heatmap'

  // Configuration
  data(values: number[][]): this
  rowLabels(labels: string[]): this
  columnLabels(labels: string[]): this
  colorScale(scale: HeatmapColorScale): this
  customColors(colors: number[]): this
  showValues(show: boolean): this
  minValue(value: number): this
  maxValue(value: number): this
  cellWidth(width: number): this
  cellHeight(height: number): this
  clear(): this

  // Navigation
  selectCell(row: number, col: number): this
  moveUp(): this
  moveDown(): this
  moveLeft(): this
  moveRight(): this

  // Events
  onSelect(handler: (row: number, col: number, value: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly rows: number
  readonly cols: number
  readonly selectedRow: number
  readonly selectedCol: number
  readonly selectedValue: number | null
}

// ============================================================
// Color Scales
// ============================================================

const COLOR_SCALES: Record<HeatmapColorScale, number[]> = {
  default: [17, 18, 19, 20, 21, 27, 33, 39, 45, 51, 50, 49, 48, 47, 82, 118, 154, 190, 226, 220, 214, 208, 202, 196],
  grayscale: [232, 234, 236, 238, 240, 242, 244, 246, 248, 250, 252, 254, 255],
  viridis: [17, 18, 19, 23, 24, 29, 30, 35, 36, 41, 42, 48, 49, 84, 120, 156, 192, 228, 227, 226, 220],
  plasma: [53, 54, 55, 91, 127, 163, 199, 198, 197, 196, 202, 208, 214, 220, 226],
  cool: [51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 199, 198, 197, 196],
  warm: [226, 220, 214, 208, 202, 196, 160, 124, 88, 52],
  custom: [] // User-provided
}

// ============================================================
// Implementation
// ============================================================

class HeatmapNodeImpl extends LeafNode implements HeatmapNode {
  readonly type = 'heatmap' as const

  private _data: number[][] = []
  private _rowLabels: string[] = []
  private _columnLabels: string[] = []
  private _colorScale: HeatmapColorScale = 'default'
  private _customColors: number[] = []
  private _showValues: boolean = false
  private _minValue: number | null = null
  private _maxValue: number | null = null
  private _cellWidth: number = 4
  private _cellHeight: number = 1

  private _selectedRow: number = 0
  private _selectedCol: number = 0
  private _isFocused: boolean = false

  private _onSelectHandlers: ((row: number, col: number, value: number) => void)[] = []

  constructor(props?: HeatmapProps) {
    super()
    if (props) {
      if (props.data) this._data = props.data
      if (props.rowLabels) this._rowLabels = props.rowLabels
      if (props.columnLabels) this._columnLabels = props.columnLabels
      if (props.colorScale) this._colorScale = props.colorScale
      if (props.customColors) this._customColors = props.customColors
      if (props.showValues !== undefined) this._showValues = props.showValues
      if (props.minValue !== undefined) this._minValue = props.minValue
      if (props.maxValue !== undefined) this._maxValue = props.maxValue
      if (props.cellWidth !== undefined) this._cellWidth = props.cellWidth
      if (props.cellHeight !== undefined) this._cellHeight = props.cellHeight
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get rows(): number {
    return this._data.length
  }

  get cols(): number {
    return this._data.length > 0 ? (this._data[0]?.length ?? 0) : 0
  }

  get selectedRow(): number {
    return this._selectedRow
  }

  get selectedCol(): number {
    return this._selectedCol
  }

  get selectedValue(): number | null {
    if (this._selectedRow >= 0 && this._selectedRow < this._data.length) {
      const row = this._data[this._selectedRow]
      if (row && this._selectedCol >= 0 && this._selectedCol < row.length) {
        return row[this._selectedCol] ?? null
      }
    }
    return null
  }

  // Get data range
  private getRange(): { min: number; max: number } {
    if (this._data.length === 0) return { min: 0, max: 1 }

    let min = this._minValue ?? Infinity
    let max = this._maxValue ?? -Infinity

    if (this._minValue === null || this._maxValue === null) {
      for (const row of this._data) {
        for (const val of row) {
          if (this._minValue === null && val < min) min = val
          if (this._maxValue === null && val > max) max = val
        }
      }
    }

    if (min === max) {
      max = min + 1
    }

    return { min, max }
  }

  // Get color for value
  private getColor(value: number): number {
    const { min, max } = this.getRange()
    const normalized = (value - min) / (max - min)
    const colors = this._colorScale === 'custom' ? this._customColors : COLOR_SCALES[this._colorScale]

    if (colors.length === 0) return DEFAULT_FG

    const index = Math.floor(normalized * (colors.length - 1))
    return colors[Math.max(0, Math.min(colors.length - 1, index))] ?? DEFAULT_FG
  }

  // Configuration
  data(values: number[][]): this {
    this._data = values
    this._selectedRow = 0
    this._selectedCol = 0
    this.markDirty()
    return this
  }

  rowLabels(labels: string[]): this {
    this._rowLabels = labels
    this.markDirty()
    return this
  }

  columnLabels(labels: string[]): this {
    this._columnLabels = labels
    this.markDirty()
    return this
  }

  colorScale(scale: HeatmapColorScale): this {
    this._colorScale = scale
    this.markDirty()
    return this
  }

  customColors(colors: number[]): this {
    this._customColors = colors
    if (colors.length > 0) {
      this._colorScale = 'custom'
    }
    this.markDirty()
    return this
  }

  showValues(show: boolean): this {
    this._showValues = show
    this.markDirty()
    return this
  }

  minValue(value: number): this {
    this._minValue = value
    this.markDirty()
    return this
  }

  maxValue(value: number): this {
    this._maxValue = value
    this.markDirty()
    return this
  }

  cellWidth(width: number): this {
    this._cellWidth = Math.max(1, width)
    this.markDirty()
    return this
  }

  cellHeight(height: number): this {
    this._cellHeight = Math.max(1, height)
    this.markDirty()
    return this
  }

  clear(): this {
    this._data = []
    this._rowLabels = []
    this._columnLabels = []
    this._selectedRow = 0
    this._selectedCol = 0
    this.markDirty()
    return this
  }

  // Navigation
  selectCell(row: number, col: number): this {
    this._selectedRow = Math.max(0, Math.min(this._data.length - 1, row))
    this._selectedCol = Math.max(0, Math.min(this.cols - 1, col))
    this.emitSelect()
    this.markDirty()
    return this
  }

  moveUp(): this {
    if (this._selectedRow > 0) {
      this._selectedRow--
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveDown(): this {
    if (this._selectedRow < this._data.length - 1) {
      this._selectedRow++
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveLeft(): this {
    if (this._selectedCol > 0) {
      this._selectedCol--
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveRight(): this {
    if (this._selectedCol < this.cols - 1) {
      this._selectedCol++
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  // Events
  onSelect(handler: (row: number, col: number, value: number) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  private emitSelect(): void {
    const value = this.selectedValue
    if (value !== null) {
      for (const handler of this._onSelectHandlers) {
        handler(this._selectedRow, this._selectedCol, value)
      }
    }
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
   * Dispose of heatmap and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._data = []
    this._rowLabels = []
    this._columnLabels = []
    this._customColors = []
    this._onSelectHandlers = []
    super.dispose()
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.moveUp()
        return true
      case 'down':
      case 'j':
        this.moveDown()
        return true
      case 'left':
      case 'h':
        this.moveLeft()
        return true
      case 'right':
      case 'l':
        this.moveRight()
        return true
      case 'home':
        this.selectCell(0, 0)
        return true
      case 'end':
        this.selectCell(this._data.length - 1, this.cols - 1)
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
      this._isFocused = true

      // Calculate which cell was clicked
      const labelWidth = this.getLabelWidth()
      const hasColLabels = this._columnLabels.length > 0
      const dataStartY = hasColLabels ? 1 : 0

      const relX = x - bounds.x - labelWidth
      const relY = y - bounds.y - dataStartY

      if (relX >= 0 && relY >= 0) {
        const col = Math.floor(relX / this._cellWidth)
        const row = Math.floor(relY / this._cellHeight)

        if (row >= 0 && row < this._data.length && col >= 0 && col < this.cols) {
          this._selectedRow = row
          this._selectedCol = col
          this.emitSelect()
        }
      }

      this.markDirty()
      return true
    }

    return false
  }

  private getLabelWidth(): number {
    let maxLen = 0
    for (const label of this._rowLabels) {
      if (label.length > maxLen) maxLen = label.length
    }
    return maxLen > 0 ? maxLen + 1 : 0
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Clear buffer
    for (let y = 0; y < bounds.height; y++) {
      for (let x = 0; x < bounds.width; x++) {
        buffer.set(bounds.x + x, bounds.y + y, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    if (this._data.length === 0) return

    const labelWidth = this.getLabelWidth()
    const hasColLabels = this._columnLabels.length > 0
    let currentY = bounds.y

    // Column labels
    if (hasColLabels) {
      let x = bounds.x + labelWidth
      for (let col = 0; col < this._columnLabels.length && x < bounds.x + bounds.width; col++) {
        const colLabel = this._columnLabels[col] ?? ''
        const label = truncateToWidth(colLabel, this._cellWidth)
        const padded = padToWidth(label, this._cellWidth, 'center')
        buffer.write(x, currentY, padded, { fg, bg, attrs: ATTR_DIM })
        x += this._cellWidth
      }
      currentY++
    }

    // Data rows
    for (let row = 0; row < this._data.length && currentY < bounds.y + bounds.height; row++) {
      const rowData = this._data[row]
      if (!rowData) continue
      let x = bounds.x

      // Row label
      if (labelWidth > 0 && row < this._rowLabels.length) {
        const rowLabel = this._rowLabels[row] ?? ''
        const label = truncateToWidth(rowLabel, labelWidth - 1)
        buffer.write(x, currentY, label + ' ', { fg, bg, attrs: ATTR_DIM })
      }
      x += labelWidth

      // Cells
      for (let col = 0; col < rowData.length && x + this._cellWidth <= bounds.x + bounds.width; col++) {
        const value = rowData[col] ?? 0
        const color = this.getColor(value)
        const isSelected = this._isFocused && row === this._selectedRow && col === this._selectedCol

        // Render cell
        this.renderCell(buffer, x, currentY, value, color, isSelected, fg, bg)
        x += this._cellWidth
      }

      currentY += this._cellHeight
    }

    // Selected cell info
    if (this._isFocused && currentY < bounds.y + bounds.height) {
      const val = this.selectedValue
      if (val !== null) {
        const info = `[${this._selectedRow},${this._selectedCol}] = ${val.toFixed(2)}`
        buffer.write(bounds.x, currentY, truncateToWidth(info, bounds.width), { fg, bg, attrs: 0 })
      }
    }
  }

  private renderCell(
    buffer: Buffer,
    x: number,
    y: number,
    value: number,
    color: number,
    isSelected: boolean,
    _fg: number,
    bg: number
  ): void {
    const cellChar = '\u2588' // █
    const attrs = isSelected ? ATTR_BOLD | ATTR_INVERSE : 0

    for (let h = 0; h < this._cellHeight; h++) {
      if (this._showValues && h === 0) {
        // Show value
        const valStr = value.toFixed(1)
        const display = truncateToWidth(valStr, this._cellWidth)
        const padded = padToWidth(display, this._cellWidth, 'right')

        if (isSelected) {
          buffer.write(x, y + h, padded, { fg: bg, bg: color, attrs })
        } else {
          buffer.write(x, y + h, padded, { fg: 0, bg: color, attrs: 0 })
        }
      } else {
        // Fill with color block
        for (let w = 0; w < this._cellWidth; w++) {
          if (isSelected) {
            buffer.set(x + w, y + h, { char: cellChar, fg: color, bg: bg, attrs })
          } else {
            buffer.set(x + w, y + h, { char: cellChar, fg: color, bg: bg, attrs: 0 })
          }
        }
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a heatmap widget.
 *
 * @param props - Heatmap properties
 * @returns Heatmap node
 *
 * @example
 * ```typescript
 * // Basic heatmap
 * const hm = heatmap({
 *   data: [
 *     [1, 2, 3],
 *     [4, 5, 6],
 *     [7, 8, 9]
 *   ],
 *   rowLabels: ['A', 'B', 'C'],
 *   columnLabels: ['X', 'Y', 'Z'],
 *   colorScale: 'viridis',
 *   showValues: true
 * })
 *
 * // Handle selection
 * hm.onSelect((row, col, value) => {
 *   console.log(`Selected [${row},${col}] = ${value}`)
 * })
 *
 * // Navigate
 * hm.selectCell(1, 1)
 * hm.moveRight()
 * hm.moveDown()
 * ```
 */
export function heatmap(props?: HeatmapProps): HeatmapNode {
  return new HeatmapNodeImpl(props)
}
