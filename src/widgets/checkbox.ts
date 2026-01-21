/**
 * @oxog/tui - Checkbox Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Checkbox widget properties.
 */
export interface CheckboxProps {
  /** Checkbox label */
  label?: string
  /** Initial checked state */
  checked?: boolean
  /** Disabled state */
  disabled?: boolean
}

/**
 * Checkbox node interface.
 */
export interface CheckboxNode extends Node {
  readonly type: 'checkbox'

  // Configuration
  label(value: string): this
  checked(value: boolean): this
  disabled(value: boolean): this

  // Actions
  toggle(): this

  // Events
  onChange(handler: (checked: boolean) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly isChecked: boolean
  readonly isDisabled: boolean
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class CheckboxNodeImpl extends LeafNode implements CheckboxNode {
  readonly type = 'checkbox' as const

  private _label: string = ''
  private _checked: boolean = false
  private _disabled: boolean = false
  private _focused: boolean = false

  private _onChangeHandlers: ((checked: boolean) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: CheckboxProps) {
    super()
    if (props) {
      if (props.label) this._label = props.label
      if (props.checked) this._checked = props.checked
      if (props.disabled) this._disabled = props.disabled
    }
  }

  get isChecked(): boolean {
    return this._checked
  }

  get isDisabled(): boolean {
    return this._disabled
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  label(value: string): this {
    this._label = value
    this.markDirty()
    return this
  }

  checked(value: boolean): this {
    if (this._checked !== value) {
      this._checked = value
      this.markDirty()
    }
    return this
  }

  disabled(value: boolean): this {
    this._disabled = value
    this.markDirty()
    return this
  }

  // Actions
  toggle(): this {
    if (!this._disabled) {
      this._checked = !this._checked
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  // Events
  onChange(handler: (checked: boolean) => void): this {
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

  private emitChange(): void {
    for (const handler of this._onChangeHandlers) {
      handler(this._checked)
    }
  }

  /**
   * Dispose of checkbox and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Build checkbox display
    const checkChar = this._checked ? 'x' : ' '
    const bracket = this._focused ? '>' : '['
    const bracketEnd = this._focused ? '<' : ']'
    const display = `${bracket}${checkChar}${bracketEnd} ${this._label}`

    // Compute style
    let attrs = 0
    if (this._disabled) {
      attrs = ATTR_DIM
    }

    buffer.write(x, y, display, { fg, bg, attrs })
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a checkbox widget.
 *
 * @param props - Checkbox properties
 * @returns Checkbox node
 *
 * @example
 * ```typescript
 * // Basic checkbox
 * const agree = checkbox()
 *   .label('I agree to the terms')
 *   .onChange(checked => console.log('Agreed:', checked))
 *
 * // Pre-checked
 * const remember = checkbox({ checked: true })
 *   .label('Remember me')
 *
 * // Disabled
 * const disabled = checkbox()
 *   .label('Not available')
 *   .disabled(true)
 * ```
 */
export function checkbox(props?: CheckboxProps): CheckboxNode {
  return new CheckboxNodeImpl(props)
}
