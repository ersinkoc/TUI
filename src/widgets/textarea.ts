/**
 * @oxog/tui - Textarea Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, splitGraphemes } from '../utils/unicode'
import { ATTR_DIM } from '../constants'

// ============================================================
// Grapheme-aware cursor utilities
// ============================================================

/**
 * Get the string index for a grapheme index.
 * This allows us to navigate by grapheme clusters (visible characters)
 * rather than by UTF-16 code units.
 */
function graphemeIndexToStringIndex(line: string, graphemeIndex: number): number {
  const graphemes = splitGraphemes(line)
  let stringIndex = 0
  const targetIndex = Math.min(graphemeIndex, graphemes.length)
  for (let i = 0; i < targetIndex; i++) {
    stringIndex += graphemes[i]!.length
  }
  return stringIndex
}

/**
 * Get the grapheme index for a string index.
 * @internal - kept for future use in selection handling
 */
function _stringIndexToGraphemeIndex(line: string, stringIndex: number): number {
  const graphemes = splitGraphemes(line)
  let currentStringIndex = 0
  for (let i = 0; i < graphemes.length; i++) {
    if (currentStringIndex >= stringIndex) {
      return i
    }
    currentStringIndex += graphemes[i]!.length
  }
  return graphemes.length
}
// Re-export with underscore prefix to suppress unused warning
void _stringIndexToGraphemeIndex

/**
 * Get the grapheme count of a line.
 */
function graphemeLength(line: string): number {
  return splitGraphemes(line).length
}

/**
 * Delete the grapheme at the given grapheme index.
 */
function deleteGraphemeAt(line: string, graphemeIndex: number): string {
  const graphemes = splitGraphemes(line)
  if (graphemeIndex < 0 || graphemeIndex >= graphemes.length) {
    return line
  }
  graphemes.splice(graphemeIndex, 1)
  return graphemes.join('')
}

/**
 * Insert text at the given grapheme index.
 */
function insertAtGrapheme(line: string, graphemeIndex: number, text: string): string {
  const graphemes = splitGraphemes(line)
  const insertIndex = Math.min(graphemeIndex, graphemes.length)
  const before = graphemes.slice(0, insertIndex).join('')
  const after = graphemes.slice(insertIndex).join('')
  return before + text + after
}

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

  // Handler cleanup - prevent memory leaks
  offChange(handler: (value: string) => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this
  clearHandlers(): this

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
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

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
    // Validate that maxLength is positive and finite
    const validatedLength = Math.max(0, Math.floor(isFinite(value) ? value : 0))
    this._maxLength = validatedLength
    if (this._value.length > validatedLength) {
      this._value = this._value.slice(0, validatedLength)
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

  override onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  override onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  // Handler cleanup methods - prevent memory leaks
  offChange(handler: (value: string) => void): this {
    const index = this._onChangeHandlers.indexOf(handler)
    if (index > -1) {
      this._onChangeHandlers.splice(index, 1)
    }
    return this
  }

  offFocus(handler: () => void): this {
    const index = this._onFocusHandlers.indexOf(handler)
    if (index > -1) {
      this._onFocusHandlers.splice(index, 1)
    }
    return this
  }

  offBlur(handler: () => void): this {
    const index = this._onBlurHandlers.indexOf(handler)
    if (index > -1) {
      this._onBlurHandlers.splice(index, 1)
    }
    return this
  }

  clearHandlers(): this {
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    return this
  }

  // Focus control
  override focus(): this {
    if (!this._focused && !this._disposed) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  override blur(): this {
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
   * Dispose of textarea and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  // Uses grapheme-aware operations for proper Unicode support
  /** @internal */
  handleKey(key: string, _ctrl: boolean): void {
    if (!this._focused) return

    const lines = this._value.split('\n')

    switch (key) {
      case 'backspace':
        if (this._cursorCol > 0) {
          /* c8 ignore next */
          const line = lines[this._cursorLine] || ''
          // Delete the grapheme before cursor (not just one code unit)
          lines[this._cursorLine] = deleteGraphemeAt(line, this._cursorCol - 1)
          this._cursorCol--
          this._value = lines.join('\n')
          this.emitChange()
        } else if (this._cursorLine > 0) {
          // Join with previous line
          /* c8 ignore next 3 */
          const prevLine = lines[this._cursorLine - 1] || ''
          this._cursorCol = graphemeLength(prevLine)
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
          // Split at grapheme boundary
          const stringIndex = graphemeIndexToStringIndex(line, this._cursorCol)
          lines[this._cursorLine] = line.slice(0, stringIndex)
          lines.splice(this._cursorLine + 1, 0, line.slice(stringIndex))
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
          const prevLine = lines[this._cursorLine] || ''
          this._cursorCol = Math.min(this._cursorCol, graphemeLength(prevLine))
          this.markDirty()
        }
        break

      case 'down':
        if (this._cursorLine < lines.length - 1) {
          this._cursorLine++
          /* c8 ignore next */
          const nextLine = lines[this._cursorLine] || ''
          this._cursorCol = Math.min(this._cursorCol, graphemeLength(nextLine))
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
          const prevLine = lines[this._cursorLine] || ''
          this._cursorCol = graphemeLength(prevLine)
          this.markDirty()
        }
        break

      case 'right':
        /* c8 ignore next */
        const currentLine = lines[this._cursorLine] || ''
        if (this._cursorCol < graphemeLength(currentLine)) {
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
        this._cursorCol = graphemeLength(lines[this._cursorLine] || '')
        this.markDirty()
        break

      default:
        // Insert printable character (can be multi-codepoint grapheme)
        if (key.length >= 1 && this._value.length < this._maxLength) {
          const line = lines[this._cursorLine] || ''
          // Insert at grapheme boundary, not string index
          lines[this._cursorLine] = insertAtGrapheme(line, this._cursorCol, key)
          // Move cursor by grapheme count of inserted text
          this._cursorCol += splitGraphemes(key).length
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
