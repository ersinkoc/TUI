/**
 * @oxog/tui - Progress Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Color, Dimension } from '../types'
import { LeafNode } from './node'
import { parseColorWithDefault, DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { PROGRESS_FILLED, PROGRESS_EMPTY } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Progress widget properties.
 */
export interface ProgressProps {
  /** Progress value (0-100) */
  value?: number
  /** Show percentage text */
  showPercent?: boolean
  /** Show value text */
  showValue?: boolean
  /** Bar width */
  width?: Dimension
  /** Filled character */
  filled?: string
  /** Empty character */
  empty?: string
  /** Filled section color */
  filledColor?: Color
  /** Empty section color */
  emptyColor?: Color
}

/**
 * Progress node interface.
 */
export interface ProgressNode extends Node {
  readonly type: 'progress'

  // Configuration
  value(percent: number): this
  showPercent(enabled: boolean): this
  showValue(enabled: boolean): this
  width(value: Dimension): this
  filled(char: string): this
  empty(char: string): this
  filledColor(color: Color): this
  emptyColor(color: Color): this

  // Actions
  increment(amount?: number): this
  decrement(amount?: number): this

  // State
  readonly percent: number
}

// ============================================================
// Implementation
// ============================================================

class ProgressNodeImpl extends LeafNode implements ProgressNode {
  readonly type = 'progress' as const

  private _value: number = 0
  private _showPercent: boolean = true
  private _showValue: boolean = false
  private _filled: string = PROGRESS_FILLED
  private _empty: string = PROGRESS_EMPTY
  private _filledColor: Color | undefined
  private _emptyColor: Color | undefined

  constructor(props?: ProgressProps) {
    super()
    if (props) {
      if (props.value !== undefined) this._value = Math.max(0, Math.min(100, props.value))
      if (props.showPercent !== undefined) this._showPercent = props.showPercent
      if (props.showValue !== undefined) this._showValue = props.showValue
      if (props.width !== undefined) this._layout.width = props.width
      if (props.filled) this._filled = props.filled
      if (props.empty) this._empty = props.empty
      if (props.filledColor) this._filledColor = props.filledColor
      if (props.emptyColor) this._emptyColor = props.emptyColor
    }
  }

  get percent(): number {
    return this._value
  }

  // Configuration
  value(percent: number): this {
    const newValue = Math.max(0, Math.min(100, percent))
    if (this._value !== newValue) {
      this._value = newValue
      this.markDirty()
    }
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

  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  filled(char: string): this {
    this._filled = char
    this.markDirty()
    return this
  }

  empty(char: string): this {
    this._empty = char
    this.markDirty()
    return this
  }

  filledColor(color: Color): this {
    this._filledColor = color
    this.markDirty()
    return this
  }

  emptyColor(color: Color): this {
    this._emptyColor = color
    this.markDirty()
    return this
  }

  // Actions
  increment(amount: number = 1): this {
    return this.value(this._value + amount)
  }

  decrement(amount: number = 1): this {
    return this.value(this._value - amount)
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    /* c8 ignore next */
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Calculate bar dimensions
    let barWidth = width
    let suffixWidth = 0

    if (this._showPercent) {
      suffixWidth = 5 // " 100%"
      barWidth -= suffixWidth
    } else if (this._showValue) {
      suffixWidth = 4 // " 100"
      barWidth -= suffixWidth
    }

    barWidth = Math.max(1, barWidth)

    // Calculate filled portion
    const filledWidth = Math.round((this._value / 100) * barWidth)
    const emptyWidth = barWidth - filledWidth

    // Get colors
    const filledFg = this._filledColor ? parseColorWithDefault(this._filledColor, fg) : fg
    const emptyFg = this._emptyColor ? parseColorWithDefault(this._emptyColor, fg) : fg

    // Draw filled portion
    buffer.write(x, y, this._filled.repeat(filledWidth), {
      fg: filledFg,
      bg,
      attrs: 0
    })

    // Draw empty portion
    buffer.write(x + filledWidth, y, this._empty.repeat(emptyWidth), {
      fg: emptyFg,
      bg,
      attrs: 0
    })

    // Draw suffix
    if (this._showPercent) {
      const percentText = ` ${Math.round(this._value)}%`.padStart(5)
      buffer.write(x + barWidth, y, percentText, { fg, bg, attrs: 0 })
    } else if (this._showValue) {
      const valueText = ` ${Math.round(this._value)}`.padStart(4)
      buffer.write(x + barWidth, y, valueText, { fg, bg, attrs: 0 })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a progress widget.
 *
 * @param props - Progress properties
 * @returns Progress node
 *
 * @example
 * ```typescript
 * // Basic progress bar
 * const loading = progress()
 *   .value(50)
 *   .showPercent(true)
 *
 * // Custom characters
 * const custom = progress()
 *   .filled('=')
 *   .empty('-')
 *   .value(75)
 *
 * // With colors
 * const colored = progress()
 *   .filledColor('#00ff88')
 *   .emptyColor('#444444')
 *   .value(30)
 *
 * // Animated progress
 * let p = progress().value(0)
 * setInterval(() => p.increment(1), 100)
 * ```
 */
export function progress(props?: ProgressProps): ProgressNode {
  return new ProgressNodeImpl(props)
}
