/**
 * @oxog/tui - Textarea Widget
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
 * Textarea widget properties.
 */
export interface TextareaProps {
  /** Placeholder text */
  placeholder?: string
  /** Initial value */
  value?: string
  /** Maximum input length */
  maxLength?: number
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * Textarea node interface.
 */
export interface TextareaNode extends Node {
  readonly type: 'textarea'

  // Configuration
  placeholder(value: string): this
  value(value: string): this
  maxLength(value: number): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Events
  onChange(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly currentValue: string
  readonly isFocused: boolean
  readonly lineCount: number
}

// ============================================================
// Implementation
// ============================================================

class TextareaNodeImpl extends LeafNode implements TextareaNode {
  readonly type = 'textarea' as const

  private _placeholder: string = ''
  private _value: string = ''
  private _maxLength: number = Infinity
  private _focused: boolean = false
  private _cursorLine: number = 0
  private _cursorCol: number = 0
  private _scrollY: number = 0

  private _onChangeHandlers: ((value: string) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: TextareaProps) {
    super()
    if (props) {
      if (props.placeholder) this._placeholder = props.placeholder
      if (props.value) this._value = props.value
      if (props.maxLength) this._maxLength = props.maxLength
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
    }
  }

  get currentValue(): string {
    return this._value
  }

  get isFocused(): boolean {
    return this._focused
  }

  get lineCount(): number {
    return this._value.split('\n').length
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
      this.markDirty()
    }
    return this
  }

  maxLength(value: number): this {
    this._maxLength = value
    if (this._value.length > value) {
      this._value = this._value.slice(0, value)
    }
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
  onChange(handler: (value: string) => void): this {
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

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): void {
    if (!this._focused) return

    const lines = this._value.split('\n')

    switch (key) {
      case 'backspace':
        if (this._cursorCol > 0) {
          /* c8 ignore next */
          const line = lines[this._cursorLine] || ''
          lines[this._cursorLine] = line.slice(0, this._cursorCol - 1) + line.slice(this._cursorCol)
          this._cursorCol--
          this._value = lines.join('\n')
          this.emitChange()
        } else if (this._cursorLine > 0) {
          // Join with previous line
          /* c8 ignore next 3 */
          const prevLine = lines[this._cursorLine - 1] || ''
          this._cursorCol = prevLine.length
          lines[this._cursorLine - 1] = prevLine + (lines[this._cursorLine] || '')
          lines.splice(this._cursorLine, 1)
          this._cursorLine--
          this._value = lines.join('\n')
          this.emitChange()
        }
        break

      case 'enter':
        if (this._value.length < this._maxLength) {
          /* c8 ignore next */
          const line = lines[this._cursorLine] || ''
          lines[this._cursorLine] = line.slice(0, this._cursorCol)
          lines.splice(this._cursorLine + 1, 0, line.slice(this._cursorCol))
          this._cursorLine++
          this._cursorCol = 0
          this._value = lines.join('\n')
          this.emitChange()
        }
        break

      case 'up':
        if (this._cursorLine > 0) {
          this._cursorLine--
          /* c8 ignore next */
          this._cursorCol = Math.min(this._cursorCol, (lines[this._cursorLine] || '').length)
          this.markDirty()
        }
        break

      case 'down':
        if (this._cursorLine < lines.length - 1) {
          this._cursorLine++
          /* c8 ignore next */
          this._cursorCol = Math.min(this._cursorCol, (lines[this._cursorLine] || '').length)
          this.markDirty()
        }
        break

      case 'left':
        if (this._cursorCol > 0) {
          this._cursorCol--
          this.markDirty()
        } else if (this._cursorLine > 0) {
          this._cursorLine--
          /* c8 ignore next */
          this._cursorCol = (lines[this._cursorLine] || '').length
          this.markDirty()
        }
        break

      case 'right':
        /* c8 ignore next */
        if (this._cursorCol < (lines[this._cursorLine] || '').length) {
          this._cursorCol++
          this.markDirty()
        } else if (this._cursorLine < lines.length - 1) {
          this._cursorLine++
          this._cursorCol = 0
          this.markDirty()
        }
        break

      case 'home':
        this._cursorCol = 0
        this.markDirty()
        break

      case 'end':
        /* c8 ignore next */
        this._cursorCol = (lines[this._cursorLine] || '').length
        this.markDirty()
        break

      default:
        // Insert printable character
        if (key.length === 1 && this._value.length < this._maxLength) {
          const line = lines[this._cursorLine] || ''
          lines[this._cursorLine] =
            line.slice(0, this._cursorCol) + key + line.slice(this._cursorCol)
          this._cursorCol++
          this._value = lines.join('\n')
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
    const bg = parentStyle.bg ?? DEFAULT_BG

    let lines: string[]
    let attrs = 0

    if (this._value.length === 0 && this._placeholder) {
      lines = this._placeholder.split('\n')
      attrs = ATTR_DIM
    } else {
      lines = this._value.split('\n')
    }

    // Ensure cursor is visible
    if (this._cursorLine < this._scrollY) {
      this._scrollY = this._cursorLine
    } else if (this._cursorLine >= this._scrollY + height) {
      this._scrollY = this._cursorLine - height + 1
    }

    // Render visible lines
    for (let i = 0; i < height; i++) {
      const lineIndex = this._scrollY + i
      let line = lines[lineIndex] || ''

      // Truncate if necessary
      if (stringWidth(line) > width) {
        line = truncateToWidth(line, width)
      }

      // Pad to width
      line = line.padEnd(width)

      buffer.write(x, y + i, line, { fg, bg, attrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a textarea widget.
 *
 * @param props - Textarea properties
 * @returns Textarea node
 *
 * @example
 * ```typescript
 * // Basic textarea
 * const notes = textarea()
 *   .placeholder('Enter your notes...')
 *   .width(40)
 *   .height(10)
 *
 * // With initial value
 * const editor = textarea()
 *   .value('Line 1\nLine 2\nLine 3')
 *   .onChange(value => console.log('Changed'))
 * ```
 */
export function textarea(props?: TextareaProps): TextareaNode {
  return new TextareaNodeImpl(props)
}
