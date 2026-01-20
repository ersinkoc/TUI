/**
 * @oxog/tui - Input Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Input widget properties.
 */
export interface InputProps {
  /** Placeholder text */
  placeholder?: string
  /** Initial value */
  value?: string
  /** Password mode */
  password?: boolean
  /** Password mask character */
  passwordChar?: string
  /** Maximum input length */
  maxLength?: number
  /** Width */
  width?: Dimension
}

/**
 * Input node interface.
 */
export interface InputNode extends Node {
  readonly type: 'input'

  // Configuration
  placeholder(value: string): this
  value(value: string): this
  password(enabled?: boolean, mask?: string): this
  maxLength(value: number): this
  width(value: Dimension): this

  // Events
  onChange(handler: (value: string) => void): this
  onSubmit(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly currentValue: string
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class InputNodeImpl extends LeafNode implements InputNode {
  readonly type = 'input' as const

  private _placeholder: string = ''
  private _value: string = ''
  private _password: boolean = false
  private _passwordChar: string = '*'
  private _maxLength: number = Infinity
  private _focused: boolean = false
  private _cursorPosition: number = 0

  private _onChangeHandlers: ((value: string) => void)[] = []
  private _onSubmitHandlers: ((value: string) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: InputProps) {
    super()
    if (props) {
      if (props.placeholder) this._placeholder = props.placeholder
      if (props.value) this._value = props.value
      if (props.password) this._password = props.password
      if (props.passwordChar) this._passwordChar = props.passwordChar
      if (props.maxLength) this._maxLength = props.maxLength
      if (props.width) this._layout.width = props.width
    }
    this._cursorPosition = this._value.length
  }

  get currentValue(): string {
    return this._value
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  placeholder(value: string): this {
    this._placeholder = value
    this.markDirty()
    return this
  }

  value(value: string): this {
    const newValue = value.slice(0, this._maxLength)
    if (this._value !== newValue) {
      this._value = newValue
      this._cursorPosition = Math.min(this._cursorPosition, newValue.length)
      this.markDirty()
    }
    return this
  }

  password(enabled: boolean = true, mask?: string): this {
    this._password = enabled
    if (mask) this._passwordChar = mask
    this.markDirty()
    return this
  }

  maxLength(value: number): this {
    this._maxLength = value
    if (this._value.length > value) {
      this._value = this._value.slice(0, value)
      this._cursorPosition = Math.min(this._cursorPosition, value)
    }
    this.markDirty()
    return this
  }

  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  // Events
  onChange(handler: (value: string) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  onSubmit(handler: (value: string) => void): this {
    this._onSubmitHandlers.push(handler)
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

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): void {
    if (!this._focused) return

    if (ctrl) {
      // Handle ctrl shortcuts
      return
    }

    switch (key) {
      case 'backspace':
        if (this._cursorPosition > 0) {
          this._value =
            this._value.slice(0, this._cursorPosition - 1) + this._value.slice(this._cursorPosition)
          this._cursorPosition--
          this.emitChange()
        }
        break

      case 'delete':
        if (this._cursorPosition < this._value.length) {
          this._value =
            this._value.slice(0, this._cursorPosition) + this._value.slice(this._cursorPosition + 1)
          this.emitChange()
        }
        break

      case 'left':
        if (this._cursorPosition > 0) {
          this._cursorPosition--
          this.markDirty()
        }
        break

      case 'right':
        if (this._cursorPosition < this._value.length) {
          this._cursorPosition++
          this.markDirty()
        }
        break

      case 'home':
        this._cursorPosition = 0
        this.markDirty()
        break

      case 'end':
        this._cursorPosition = this._value.length
        this.markDirty()
        break

      case 'enter':
        for (const handler of this._onSubmitHandlers) {
          handler(this._value)
        }
        break

      default:
        // Insert printable character
        if (key.length === 1 && this._value.length < this._maxLength) {
          this._value =
            this._value.slice(0, this._cursorPosition) +
            key +
            this._value.slice(this._cursorPosition)
          this._cursorPosition++
          this.emitChange()
        }
    }
  }

  private emitChange(): void {
    this.markDirty()
    for (const handler of this._onChangeHandlers) {
      handler(this._value)
    }
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

    // Show placeholder or value
    let displayText: string
    let attrs = 0

    if (this._value.length === 0 && this._placeholder) {
      displayText = this._placeholder
      attrs = ATTR_DIM
    } else if (this._password) {
      displayText = this._passwordChar.repeat(this._value.length)
    } else {
      displayText = this._value
    }

    // Truncate if necessary
    if (stringWidth(displayText) > width) {
      displayText = truncateToWidth(displayText, width)
    }

    // Write to buffer
    buffer.write(x, y, displayText, { fg, bg, attrs })

    // Fill remaining space
    const textWidth = stringWidth(displayText)
    if (textWidth < width) {
      buffer.write(x + textWidth, y, ' '.repeat(width - textWidth), { fg, bg, attrs: 0 })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create an input widget.
 *
 * @param props - Input properties
 * @returns Input node
 *
 * @example
 * ```typescript
 * // Basic input
 * const name = input()
 *   .placeholder('Enter your name...')
 *
 * // Password input
 * const password = input()
 *   .password(true)
 *   .placeholder('Password')
 *
 * // With handlers
 * const search = input()
 *   .placeholder('Search...')
 *   .onChange(value => console.log('Changed:', value))
 *   .onSubmit(value => console.log('Submitted:', value))
 * ```
 */
export function input(props?: InputProps): InputNode {
  return new InputNodeImpl(props)
}
