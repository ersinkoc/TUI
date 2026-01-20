/**
 * @oxog/tui - Chart Widgets (Bar, Sparkline, Gauge)
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_BOLD } from '../constants'
import { stringWidth, truncateToWidth } from '../utils/unicode'

// ============================================================
// Bar Chart
// ============================================================

/**
 * Bar chart data point.
 */
export interface BarDataPoint {
  /** Label */
  label: string
  /** Value */
  value: number
  /** Custom color (optional) */
  color?: number
}

/**
 * Bar chart properties.
 */
export interface BarChartProps {
  /** Data points */
  data?: BarDataPoint[]
  /** Show values on bars */
  showValues?: boolean
  /** Show labels */
  showLabels?: boolean
  /** Bar character */
  barChar?: string
  /** Horizontal orientation */
  horizontal?: boolean
  /** Max value (auto if not set) */
  maxValue?: number
  /** Label width for horizontal bars */
  labelWidth?: number
}

/**
 * Bar chart node interface.
 */
export interface BarChartNode extends Node {
  readonly type: 'barchart'

  data(points: BarDataPoint[]): this
  showValues(enabled: boolean): this
  showLabels(enabled: boolean): this
  barChar(char: string): this
  horizontal(enabled: boolean): this
  maxValue(value: number | null): this
  labelWidth(width: number): this

  readonly dataPoints: BarDataPoint[]
}

class BarChartNodeImpl extends LeafNode implements BarChartNode {
  readonly type = 'barchart' as const

  private _data: BarDataPoint[] = []
  private _showValues: boolean = true
  private _showLabels: boolean = true
  private _barChar: string = '█'
  private _horizontal: boolean = true
  private _maxValue: number | null = null
  private _labelWidth: number = 10

  constructor(props?: BarChartProps) {
    super()
    if (props) {
      if (props.data) this._data = props.data
      if (props.showValues !== undefined) this._showValues = props.showValues
      if (props.showLabels !== undefined) this._showLabels = props.showLabels
      if (props.barChar) this._barChar = props.barChar
      if (props.horizontal !== undefined) this._horizontal = props.horizontal
      if (props.maxValue !== undefined) this._maxValue = props.maxValue
      if (props.labelWidth !== undefined) this._labelWidth = props.labelWidth
    }
  }

  get dataPoints(): BarDataPoint[] {
    return this._data
  }

  data(points: BarDataPoint[]): this {
    this._data = points
    this.markDirty()
    return this
  }

  showValues(enabled: boolean): this {
    this._showValues = enabled
    this.markDirty()
    return this
  }

  showLabels(enabled: boolean): this {
    this._showLabels = enabled
    this.markDirty()
    return this
  }

  barChar(char: string): this {
    this._barChar = char
    this.markDirty()
    return this
  }

  horizontal(enabled: boolean): this {
    this._horizontal = enabled
    this.markDirty()
    return this
  }

  maxValue(value: number | null): this {
    this._maxValue = value
    this.markDirty()
    return this
  }

  labelWidth(width: number): this {
    this._labelWidth = width
    this.markDirty()
    return this
  }

  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || this._data.length === 0) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const max = this._maxValue ?? Math.max(...this._data.map(d => d.value))

    if (this._horizontal) {
      this.renderHorizontal(buffer, x, y, width, height, fg, bg, max)
    } else {
      this.renderVertical(buffer, x, y, width, height, fg, bg, max)
    }
  }

  private renderHorizontal(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number,
    max: number
  ): void {
    const barAreaStart = this._showLabels ? this._labelWidth + 1 : 0
    const barAreaWidth = width - barAreaStart - (this._showValues ? 6 : 0)
    const barCount = Math.min(this._data.length, height)

    for (let i = 0; i < barCount; i++) {
      const point = this._data[i]!
      const barY = y + i

      // Label
      if (this._showLabels) {
        let label = point.label
        if (stringWidth(label) > this._labelWidth) {
          label = truncateToWidth(label, this._labelWidth)
        }
        buffer.write(x, barY, label.padEnd(this._labelWidth), { fg, bg, attrs: 0 })
      }

      // Bar
      const barWidth = max > 0 ? Math.floor((point.value / max) * barAreaWidth) : 0
      const barColor = point.color ?? fg

      for (let j = 0; j < barWidth; j++) {
        buffer.set(x + barAreaStart + j, barY, {
          char: this._barChar,
          fg: barColor,
          bg,
          attrs: 0
        })
      }

      // Value
      if (this._showValues) {
        const valueStr = String(Math.round(point.value * 100) / 100).padStart(5)
        buffer.write(x + width - 5, barY, valueStr, { fg, bg, attrs: ATTR_DIM })
      }
    }
  }

  private renderVertical(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number,
    max: number
  ): void {
    const barAreaHeight = height - (this._showLabels ? 2 : 0) - (this._showValues ? 1 : 0)
    const barCount = Math.min(this._data.length, Math.floor(width / 3))
    const barWidth = Math.floor(width / barCount) - 1

    for (let i = 0; i < barCount; i++) {
      const point = this._data[i]!
      const barX = x + i * (barWidth + 1)
      const barHeight = max > 0 ? Math.floor((point.value / max) * barAreaHeight) : 0
      const barColor = point.color ?? fg

      // Bar (from bottom up)
      for (let j = 0; j < barHeight; j++) {
        const barY = y + barAreaHeight - j - 1
        for (let k = 0; k < barWidth; k++) {
          buffer.set(barX + k, barY, {
            char: this._barChar,
            fg: barColor,
            bg,
            attrs: 0
          })
        }
      }

      // Value
      if (this._showValues) {
        const valueStr = String(Math.round(point.value))
        const valueX = barX + Math.floor((barWidth - stringWidth(valueStr)) / 2)
        buffer.write(valueX, y + barAreaHeight, valueStr, { fg, bg, attrs: ATTR_DIM })
      }

      // Label
      if (this._showLabels) {
        let label = point.label
        if (stringWidth(label) > barWidth) {
          label = truncateToWidth(label, barWidth)
        }
        const labelX = barX + Math.floor((barWidth - stringWidth(label)) / 2)
        buffer.write(labelX, y + height - 1, label, { fg, bg, attrs: 0 })
      }
    }
  }
}

/**
 * Create a bar chart widget.
 */
export function barchart(props?: BarChartProps): BarChartNode {
  return new BarChartNodeImpl(props)
}

// ============================================================
// Sparkline
// ============================================================

/**
 * Sparkline properties.
 */
export interface SparklineProps {
  /** Data values */
  data?: number[]
  /** Min value (auto if not set) */
  min?: number
  /** Max value (auto if not set) */
  max?: number
  /** Sparkline style */
  style?: 'line' | 'area' | 'bar'
}

/**
 * Sparkline node interface.
 */
export interface SparklineNode extends Node {
  readonly type: 'sparkline'

  data(values: number[]): this
  min(value: number | null): this
  max(value: number | null): this
  style(style: 'line' | 'area' | 'bar'): this

  push(value: number): this
  clear(): this

  readonly values: number[]
}

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

class SparklineNodeImpl extends LeafNode implements SparklineNode {
  readonly type = 'sparkline' as const

  private _data: number[] = []
  private _min: number | null = null
  private _max: number | null = null
  private _style: 'line' | 'area' | 'bar' = 'line'

  constructor(props?: SparklineProps) {
    super()
    if (props) {
      if (props.data) this._data = props.data
      if (props.min !== undefined) this._min = props.min
      if (props.max !== undefined) this._max = props.max
      if (props.style) this._style = props.style
    }
  }

  get values(): number[] {
    return this._data
  }

  data(values: number[]): this {
    this._data = values
    this.markDirty()
    return this
  }

  min(value: number | null): this {
    this._min = value
    this.markDirty()
    return this
  }

  max(value: number | null): this {
    this._max = value
    this.markDirty()
    return this
  }

  style(style: 'line' | 'area' | 'bar'): this {
    this._style = style
    this.markDirty()
    return this
  }

  push(value: number): this {
    this._data.push(value)
    this.markDirty()
    return this
  }

  clear(): this {
    this._data = []
    this.markDirty()
    return this
  }

  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || this._data.length === 0) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const dataMin = this._min ?? Math.min(...this._data)
    const dataMax = this._max ?? Math.max(...this._data)
    const range = dataMax - dataMin || 1

    // Take last 'width' data points
    const displayData = this._data.slice(-width)

    for (let i = 0; i < displayData.length; i++) {
      const value = displayData[i]!
      const normalized = (value - dataMin) / range
      const charIndex = Math.min(
        SPARK_CHARS.length - 1,
        Math.floor(normalized * SPARK_CHARS.length)
      )

      if (this._style === 'bar' && height > 1) {
        // Multi-line bar style
        const barHeight = Math.ceil(normalized * height)
        for (let row = 0; row < height; row++) {
          const rowFromBottom = height - row - 1
          if (rowFromBottom < barHeight) {
            buffer.set(x + i, y + row, {
              char: rowFromBottom === barHeight - 1 ? SPARK_CHARS[charIndex]! : '█',
              fg,
              bg,
              attrs: 0
            })
          }
        }
      } else {
        // Single line style
        buffer.set(x + i, y, {
          char: SPARK_CHARS[charIndex]!,
          fg,
          bg,
          attrs: 0
        })
      }
    }
  }
}

/**
 * Create a sparkline widget.
 */
export function sparkline(props?: SparklineProps): SparklineNode {
  return new SparklineNodeImpl(props)
}

// ============================================================
// Gauge
// ============================================================

/**
 * Gauge properties.
 */
export interface GaugeProps {
  /** Current value */
  value?: number
  /** Min value */
  min?: number
  /** Max value */
  max?: number
  /** Show percentage */
  showPercent?: boolean
  /** Show value */
  showValue?: boolean
  /** Fill character */
  fillChar?: string
  /** Empty character */
  emptyChar?: string
  /** Gauge style */
  style?: 'bar' | 'arc'
}

/**
 * Gauge node interface.
 */
export interface GaugeNode extends Node {
  readonly type: 'gauge'

  value(val: number): this
  min(val: number): this
  max(val: number): this
  showPercent(enabled: boolean): this
  showValue(enabled: boolean): this
  fillChar(char: string): this
  emptyChar(char: string): this
  style(style: 'bar' | 'arc'): this

  readonly currentValue: number
  readonly percent: number
}

class GaugeNodeImpl extends LeafNode implements GaugeNode {
  readonly type = 'gauge' as const

  private _value: number = 0
  private _min: number = 0
  private _max: number = 100
  private _showPercent: boolean = true
  private _showValue: boolean = false
  private _fillChar: string = '█'
  private _emptyChar: string = '░'
  private _style: 'bar' | 'arc' = 'bar'

  constructor(props?: GaugeProps) {
    super()
    if (props) {
      if (props.value !== undefined) this._value = props.value
      if (props.min !== undefined) this._min = props.min
      if (props.max !== undefined) this._max = props.max
      if (props.showPercent !== undefined) this._showPercent = props.showPercent
      if (props.showValue !== undefined) this._showValue = props.showValue
      if (props.fillChar) this._fillChar = props.fillChar
      if (props.emptyChar) this._emptyChar = props.emptyChar
      if (props.style) this._style = props.style
    }
  }

  get currentValue(): number {
    return this._value
  }

  get percent(): number {
    const range = this._max - this._min
    if (range <= 0) return 0
    return Math.max(0, Math.min(1, (this._value - this._min) / range))
  }

  value(val: number): this {
    this._value = Math.max(this._min, Math.min(this._max, val))
    this.markDirty()
    return this
  }

  min(val: number): this {
    this._min = val
    this._value = Math.max(val, this._value)
    this.markDirty()
    return this
  }

  max(val: number): this {
    this._max = val
    this._value = Math.min(val, this._value)
    this.markDirty()
    return this
  }

  showPercent(enabled: boolean): this {
    this._showPercent = enabled
    this.markDirty()
    return this
  }

  showValue(enabled: boolean): this {
    this._showValue = enabled
    this.markDirty()
    return this
  }

  fillChar(char: string): this {
    this._fillChar = char
    this.markDirty()
    return this
  }

  emptyChar(char: string): this {
    this._emptyChar = char
    this.markDirty()
    return this
  }

  style(style: 'bar' | 'arc'): this {
    this._style = style
    this.markDirty()
    return this
  }

  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const percentVal = this.percent
    const labelWidth = this._showPercent ? 5 : (this._showValue ? 8 : 0)
    const barWidth = width - labelWidth

    if (this._style === 'arc' && height >= 3) {
      this.renderArc(buffer, x, y, width, height, fg, bg, percentVal)
    } else {
      this.renderBar(buffer, x, y, barWidth, fg, bg, percentVal)

      // Label
      if (this._showPercent) {
        const label = `${Math.round(percentVal * 100)}%`
        buffer.write(x + barWidth + 1, y, label.padStart(4), { fg, bg, attrs: ATTR_BOLD })
      } else if (this._showValue) {
        const label = String(Math.round(this._value * 100) / 100)
        buffer.write(x + barWidth + 1, y, label.padStart(7), { fg, bg, attrs: ATTR_BOLD })
      }
    }
  }

  private renderBar(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    percent: number
  ): void {
    const filled = Math.floor(percent * width)

    for (let i = 0; i < width; i++) {
      buffer.set(x + i, y, {
        char: i < filled ? this._fillChar : this._emptyChar,
        fg,
        bg,
        attrs: i < filled ? 0 : ATTR_DIM
      })
    }
  }

  private renderArc(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number,
    percent: number
  ): void {
    // Simple arc representation using characters
    const arcChars = ['╭', '─', '╮', '│', ' ', '│', '╰', '─', '╯']
    const centerX = x + Math.floor(width / 2)
    const centerY = y + Math.floor(height / 2)

    // Draw arc outline
    buffer.set(centerX - 2, y, { char: '╭', fg, bg, attrs: ATTR_DIM })
    buffer.set(centerX - 1, y, { char: '─', fg, bg, attrs: ATTR_DIM })
    buffer.set(centerX, y, { char: '─', fg, bg, attrs: ATTR_DIM })
    buffer.set(centerX + 1, y, { char: '─', fg, bg, attrs: ATTR_DIM })
    buffer.set(centerX + 2, y, { char: '╮', fg, bg, attrs: ATTR_DIM })

    // Percent in center
    const label = this._showPercent
      ? `${Math.round(percent * 100)}%`
      : String(Math.round(this._value))
    const labelX = centerX - Math.floor(stringWidth(label) / 2)
    buffer.write(labelX, centerY, label, { fg, bg, attrs: ATTR_BOLD })
  }
}

/**
 * Create a gauge widget.
 */
export function gauge(props?: GaugeProps): GaugeNode {
  return new GaugeNodeImpl(props)
}
