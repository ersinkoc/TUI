/**
 * @oxog/tui - Slider/Range Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Slider widget properties.
 */
export interface SliderProps {
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Current value */
  value?: number
  /** Step increment */
  step?: number
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Show value label */
  showValue?: boolean
  /** Show min/max labels */
  showRange?: boolean
  /** Track character */
  trackChar?: string
  /** Fill character */
  fillChar?: string
  /** Thumb character */
  thumbChar?: string
  /** Disabled state */
  disabled?: boolean
}

/**
 * Slider node interface.
 */
export interface SliderNode extends Node {
  readonly type: 'slider'

  // Configuration
  min(value: number): this
  max(value: number): this
  value(value: number): this
  step(value: number): this
  orientation(value: 'horizontal' | 'vertical'): this
  showValue(enabled: boolean): this
  showRange(enabled: boolean): this
  trackChar(char: string): this
  fillChar(char: string): this
  thumbChar(char: string): this
  disabled(value: boolean): this

  // Control
  increment(): this
  decrement(): this
  setValue(value: number): this
  setPercent(percent: number): this
  focus(): this
  blur(): this

  // Events
  onChange(handler: (value: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // State
  readonly currentValue: number
  readonly percent: number
  readonly isFocused: boolean
  readonly isDisabled: boolean
}

// ============================================================
// Implementation
// ============================================================

class SliderNodeImpl extends LeafNode implements SliderNode {
  readonly type = 'slider' as const

  private _min: number = 0
  private _max: number = 100
  private _value: number = 0
  private _step: number = 1
  private _orientation: 'horizontal' | 'vertical' = 'horizontal'
  private _showValue: boolean = true
  private _showRange: boolean = false
  private _trackChar: string = '─'
  private _fillChar: string = '━'
  private _thumbChar: string = '●'
  private _disabled: boolean = false
  private _focused: boolean = false

  private _onChangeHandlers: ((value: number) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: SliderProps) {
    super()
    if (props) {
      if (props.min !== undefined) this._min = props.min
      if (props.max !== undefined) this._max = props.max
      if (props.value !== undefined) this._value = this.clampValue(props.value)
      if (props.step !== undefined) this._step = props.step
      if (props.orientation) this._orientation = props.orientation
      if (props.showValue !== undefined) this._showValue = props.showValue
      if (props.showRange !== undefined) this._showRange = props.showRange
      if (props.trackChar) this._trackChar = props.trackChar
      if (props.fillChar) this._fillChar = props.fillChar
      if (props.thumbChar) this._thumbChar = props.thumbChar
      if (props.disabled !== undefined) this._disabled = props.disabled
    }
  }

  get currentValue(): number {
    return this._value
  }

  get percent(): number {
    const range = this._max - this._min
    if (range <= 0) return 0
    return (this._value - this._min) / range
  }

  get isFocused(): boolean {
    return this._focused
  }

  get isDisabled(): boolean {
    return this._disabled
  }

  private clampValue(value: number): number {
    return Math.max(this._min, Math.min(this._max, value))
  }

  private roundToStep(value: number): number {
    const steps = Math.round((value - this._min) / this._step)
    return this._min + steps * this._step
  }

  private emitChange(): void {
    for (const handler of this._onChangeHandlers) {
      handler(this._value)
    }
  }

  // Configuration
  min(value: number): this {
    this._min = value
    this._value = this.clampValue(this._value)
    this.markDirty()
    return this
  }

  max(value: number): this {
    this._max = value
    this._value = this.clampValue(this._value)
    this.markDirty()
    return this
  }

  value(value: number): this {
    const clamped = this.clampValue(value)
    if (clamped !== this._value) {
      this._value = clamped
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  step(value: number): this {
    this._step = Math.max(0.001, value)
    return this
  }

  orientation(value: 'horizontal' | 'vertical'): this {
    this._orientation = value
    this.markDirty()
    return this
  }

  showValue(enabled: boolean): this {
    this._showValue = enabled
    this.markDirty()
    return this
  }

  showRange(enabled: boolean): this {
    this._showRange = enabled
    this.markDirty()
    return this
  }

  trackChar(char: string): this {
    this._trackChar = char
    this.markDirty()
    return this
  }

  fillChar(char: string): this {
    this._fillChar = char
    this.markDirty()
    return this
  }

  thumbChar(char: string): this {
    this._thumbChar = char
    this.markDirty()
    return this
  }

  disabled(value: boolean): this {
    this._disabled = value
    if (value && this._focused) {
      this._focused = false
    }
    this.markDirty()
    return this
  }

  // Control
  increment(): this {
    if (this._disabled) return this
    const newValue = this.roundToStep(this._value + this._step)
    return this.value(newValue)
  }

  decrement(): this {
    if (this._disabled) return this
    const newValue = this.roundToStep(this._value - this._step)
    return this.value(newValue)
  }

  setValue(value: number): this {
    if (this._disabled) return this
    return this.value(this.roundToStep(value))
  }

  setPercent(percent: number): this {
    if (this._disabled) return this
    const p = Math.max(0, Math.min(1, percent))
    const value = this._min + (this._max - this._min) * p
    return this.setValue(value)
  }

  focus(): this {
    if (this._disabled) return this
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

  // Events
  onChange(handler: (value: number) => void): this {
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

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._focused || this._disabled) return false

    if (this._orientation === 'horizontal') {
      if (key === 'right' || key === 'l') {
        this.increment()
        return true
      }
      if (key === 'left' || key === 'h') {
        this.decrement()
        return true
      }
    } else {
      if (key === 'up' || key === 'k') {
        this.increment()
        return true
      }
      if (key === 'down' || key === 'j') {
        this.decrement()
        return true
      }
    }

    if (key === 'home') {
      this.setValue(this._min)
      return true
    }
    if (key === 'end') {
      this.setValue(this._max)
      return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (this._disabled) return false

    const { x: bx, y: by, width, height } = this._bounds

    // Check if inside bounds
    if (x < bx || x >= bx + width || y < by || y >= by + height) {
      return false
    }

    if (action === 'press' || action === 'move') {
      if (this._orientation === 'horizontal') {
        const trackStart = this._showRange ? 4 : 0
        const trackWidth = width - (this._showRange ? 8 : 0) - (this._showValue ? 6 : 0)
        const relX = x - bx - trackStart
        const percent = Math.max(0, Math.min(1, relX / trackWidth))
        this.setPercent(percent)
      } else {
        const trackStart = this._showRange ? 1 : 0
        const trackHeight = height - (this._showRange ? 2 : 0)
        const relY = y - by - trackStart
        const percent = 1 - Math.max(0, Math.min(1, relY / trackHeight))
        this.setPercent(percent)
      }
      return true
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
    const attrs = this._disabled ? ATTR_DIM : (this._focused ? ATTR_BOLD : 0)

    if (this._orientation === 'horizontal') {
      this.renderHorizontal(buffer, x, y, width, fg, bg, attrs)
    } else {
      this.renderVertical(buffer, x, y, width, height, fg, bg, attrs)
    }
  }

  private renderHorizontal(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    attrs: number
  ): void {
    let trackX = x
    let trackWidth = width

    // Show min label
    if (this._showRange) {
      const minLabel = String(this._min)
      buffer.write(x, y, minLabel.padStart(3), { fg, bg, attrs: ATTR_DIM })
      trackX += 4
      trackWidth -= 4
    }

    // Show max label
    if (this._showRange) {
      const maxLabel = String(this._max)
      buffer.write(x + width - 3, y, maxLabel.padEnd(3), { fg, bg, attrs: ATTR_DIM })
      trackWidth -= 4
    }

    // Show value label
    if (this._showValue) {
      const valueLabel = String(Math.round(this._value * 100) / 100)
      buffer.write(x + width - (this._showRange ? 7 : 0) - 5, y, valueLabel.padStart(5), {
        fg,
        bg,
        attrs: this._focused ? ATTR_BOLD : 0
      })
      trackWidth -= 6
    }

    // Draw track
    const thumbPos = Math.floor(this.percent * (trackWidth - 1))

    for (let i = 0; i < trackWidth; i++) {
      let char: string
      let charAttrs = attrs

      if (i === thumbPos) {
        char = this._thumbChar
        charAttrs = this._focused ? ATTR_INVERSE : attrs
      } else if (i < thumbPos) {
        char = this._fillChar
      } else {
        char = this._trackChar
        charAttrs = ATTR_DIM
      }

      buffer.set(trackX + i, y, { char, fg, bg, attrs: charAttrs })
    }
  }

  private renderVertical(
    buffer: Buffer,
    x: number,
    y: number,
    _width: number,
    height: number,
    fg: number,
    bg: number,
    attrs: number
  ): void {
    let trackY = y
    let trackHeight = height

    // Show max label (at top)
    if (this._showRange) {
      const maxLabel = String(this._max)
      buffer.write(x, y, maxLabel, { fg, bg, attrs: ATTR_DIM })
      trackY += 1
      trackHeight -= 1
    }

    // Show min label (at bottom)
    if (this._showRange) {
      const minLabel = String(this._min)
      buffer.write(x, y + height - 1, minLabel, { fg, bg, attrs: ATTR_DIM })
      trackHeight -= 1
    }

    // Show value label
    if (this._showValue) {
      const valueLabel = String(Math.round(this._value * 100) / 100)
      buffer.write(x + 2, y + Math.floor(height / 2), valueLabel, {
        fg,
        bg,
        attrs: this._focused ? ATTR_BOLD : 0
      })
    }

    // Draw track
    const thumbPos = Math.floor((1 - this.percent) * (trackHeight - 1))
    const trackX = x

    for (let i = 0; i < trackHeight; i++) {
      let char: string
      let charAttrs = attrs

      if (i === thumbPos) {
        char = this._thumbChar
        charAttrs = this._focused ? ATTR_INVERSE : attrs
      } else if (i > thumbPos) {
        char = '│' // Filled part (below thumb in vertical)
      } else {
        char = '┃'
        charAttrs = ATTR_DIM
      }

      buffer.set(trackX, trackY + i, { char, fg, bg, attrs: charAttrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a slider widget.
 *
 * @param props - Slider properties
 * @returns Slider node
 *
 * @example
 * ```typescript
 * // Basic slider
 * const volume = slider({ min: 0, max: 100, value: 50 })
 *   .onChange(v => console.log('Volume:', v))
 *
 * // Custom slider with labels
 * const brightness = slider()
 *   .min(0)
 *   .max(100)
 *   .value(75)
 *   .step(5)
 *   .showValue(true)
 *   .showRange(true)
 *
 * // Vertical slider
 * const level = slider({ orientation: 'vertical' })
 *   .min(0)
 *   .max(10)
 *   .value(5)
 *
 * // Custom characters
 * const progress = slider()
 *   .trackChar('░')
 *   .fillChar('█')
 *   .thumbChar('◆')
 * ```
 */
export function slider(props?: SliderProps): SliderNode {
  return new SliderNodeImpl(props)
}
