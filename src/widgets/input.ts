/**
 * @oxog/tui - Input Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, splitGraphemes } from '../utils/unicode'
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
  onChangeDebounced(handler: (value: string) => void, ms?: number): this
  onSubmit(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Handler cleanup - prevent memory leaks
  offChange(handler: (value: string) => void): this
  offSubmit(handler: (value: string) => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this
  clearHandlers(): this

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
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

  // Debouncing support
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null
  private _debouncedHandlers: Array<{ handler: (value: string) => void; ms: number }> = []

  // Cached grapheme array for efficient cursor movement
  private _graphemes: string[] = []

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
    this._graphemes = splitGraphemes(this._value)
    this._cursorPosition = this._graphemes.length
  }

  /**
   * Update the grapheme cache when value changes.
   */
  private updateGraphemes(): void {
    this._graphemes = splitGraphemes(this._value)
  }

  /**
   * Get character index from grapheme index.
   */
  private graphemeToCharIndex(graphemeIndex: number): number {
    if (graphemeIndex <= 0) return 0
    if (graphemeIndex >= this._graphemes.length) return this._value.length
    return this._graphemes.slice(0, graphemeIndex).join('').length
  }

  /**
   * Get grapheme index from character index.
   */
  private charToGraphemeIndex(charIndex: number): number {
    if (charIndex <= 0) return 0
    let chars = 0
    for (let i = 0; i < this._graphemes.length; i++) {
      chars += this._graphemes[i]!.length
      if (chars >= charIndex) return i + 1
    }
    return this._graphemes.length
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
      this.updateGraphemes()
      this._cursorPosition = Math.min(this._cursorPosition, this._graphemes.length)
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
    // Validate that maxLength is positive and finite
    // Explicit check for NaN and Infinity
    if (!Number.isFinite(value) || value < 0) {
      // Invalid value - reset to default (unlimited)
      this._maxLength = Infinity
      this.markDirty()
      return this
    }

    const validatedLength = Math.floor(value)
    this._maxLength = validatedLength

    if (this._value.length > validatedLength) {
      this._value = this._value.slice(0, validatedLength)
      this.updateGraphemes()
      this._cursorPosition = Math.min(this._cursorPosition, this._graphemes.length)
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

  onChangeDebounced(handler: (value: string) => void, ms: number = 300): this {
    this._debouncedHandlers.push({ handler, ms })
    return this
  }

  onSubmit(handler: (value: string) => void): this {
    this._onSubmitHandlers.push(handler)
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

  offSubmit(handler: (value: string) => void): this {
    const index = this._onSubmitHandlers.indexOf(handler)
    if (index > -1) {
      this._onSubmitHandlers.splice(index, 1)
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

  // Clear all handlers at once
  clearHandlers(): this {
    this._onChangeHandlers = []
    this._onSubmitHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    this._debouncedHandlers = []
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
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
   * Dispose of input and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onChangeHandlers = []
    this._onSubmitHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    this._debouncedHandlers = []
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): void {
    if (!this._focused) return

    // Validate input to prevent injection and DoS attacks
    if (typeof key !== 'string') {
      console.warn('[input] Invalid key type:', typeof key)
      return
    }

    // Prevent ANSI escape injection - sanitize like buffer.write does
    // Only allow printable ASCII and basic UTF-8 characters
    // Reject escape sequences that could corrupt terminal
    if (key.length > 100) {
      // Prevent DoS via extremely long keys
      console.warn('[input] Key too long, truncating to 100 chars')
      key = key.slice(0, 100)
    }

    // Check for escape sequences (potential injection)
    if (key.includes('\x1b') || key.includes('\x07') || key.includes('\x00')) {
      console.warn('[input] Rejecting key with control characters')
      return
    }

    // Additional safety: reject keys with suspicious patterns
    if (/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/.test(key)) {
      console.warn('[input] Rejecting key with unprintable control characters')
      return
    }

    if (ctrl) {
      // Handle ctrl shortcuts
      switch (key) {
        case 'a':
          // Select all - move cursor to end (visual selection not implemented yet)
          this._cursorPosition = this._graphemes.length
          this.markDirty()
          break

        case 'u':
          // Clear line from cursor to start (like bash)
          if (this._cursorPosition > 0) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            this._value = this._value.slice(charIndex)
            this._cursorPosition = 0
            this.updateGraphemes()
            this.emitChange()
          }
          break

        case 'k':
          // Clear line from cursor to end (like bash)
          if (this._cursorPosition < this._graphemes.length) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            this._value = this._value.slice(0, charIndex)
            this.updateGraphemes()
            this.emitChange()
          }
          break

        case 'w':
        case 'backspace':
          // Delete word backward from cursor
          if (this._cursorPosition > 0) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            const beforeCursor = this._value.slice(0, charIndex)

            // Find word boundary going backward from cursor
            // First, skip any trailing spaces immediately before cursor
            let searchPos = charIndex - 1
            while (searchPos > 0 && beforeCursor[searchPos - 1] === ' ') {
              searchPos--
            }

            // Now find the previous space (word boundary) before the word
            const lastSpace = beforeCursor.lastIndexOf(' ', searchPos - 1)
            const newCharPos = lastSpace === -1 ? 0 : lastSpace + 1

            this._value = this._value.slice(0, newCharPos) + this._value.slice(charIndex)
            this.updateGraphemes()
            this._cursorPosition = this.charToGraphemeIndex(newCharPos)
            this.emitChange()
          }
          break

        case 'left':
          // Move cursor one word left
          if (this._cursorPosition > 0) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            const beforeCursor = this._value.slice(0, charIndex)

            // Find word boundary going backward from cursor
            // First, skip any trailing spaces immediately before cursor
            let searchPos = charIndex - 1
            while (searchPos > 0 && beforeCursor[searchPos - 1] === ' ') {
              searchPos--
            }

            // Now find the previous space (word boundary) before the word
            const lastSpace = beforeCursor.lastIndexOf(' ', searchPos - 1)
            const newCharPos = lastSpace === -1 ? 0 : lastSpace + 1
            this._cursorPosition = this.charToGraphemeIndex(newCharPos)
            this.markDirty()
          }
          break

        case 'right':
          // Move cursor one word right
          if (this._cursorPosition < this._graphemes.length) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            const afterCursor = this._value.slice(charIndex)
            // Skip current word, then skip spaces
            const firstSpace = afterCursor.search(/\s/)
            if (firstSpace === -1) {
              this._cursorPosition = this._graphemes.length
            } else {
              const afterSpace = afterCursor.slice(firstSpace).search(/\S/)
              if (afterSpace === -1) {
                this._cursorPosition = this._graphemes.length
              } else {
                const newCharPos = charIndex + firstSpace + afterSpace
                this._cursorPosition = this.charToGraphemeIndex(newCharPos)
              }
            }
            this.markDirty()
          }
          break

        case 'home':
        case 'e':
          // Go to start of line
          this._cursorPosition = 0
          this.markDirty()
          break

        case 'end':
        case 'f':
          // Go to end of line (Ctrl+E in bash, but we use Ctrl+End too)
          this._cursorPosition = this._graphemes.length
          this.markDirty()
          break

        case 'd':
          // Delete grapheme at cursor (like Delete key)
          if (this._cursorPosition < this._graphemes.length) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            const nextCharIndex = this.graphemeToCharIndex(this._cursorPosition + 1)
            this._value = this._value.slice(0, charIndex) + this._value.slice(nextCharIndex)
            this.updateGraphemes()
            this.emitChange()
          }
          break

        case 'h':
          // Delete grapheme before cursor (like Backspace)
          if (this._cursorPosition > 0) {
            const charIndex = this.graphemeToCharIndex(this._cursorPosition)
            const prevCharIndex = this.graphemeToCharIndex(this._cursorPosition - 1)
            this._value = this._value.slice(0, prevCharIndex) + this._value.slice(charIndex)
            this._cursorPosition--
            this.updateGraphemes()
            this.emitChange()
          }
          break
      }
      return
    }

    switch (key) {
      case 'backspace':
        if (this._cursorPosition > 0) {
          // Delete the grapheme before cursor
          const charIndex = this.graphemeToCharIndex(this._cursorPosition)
          const prevCharIndex = this.graphemeToCharIndex(this._cursorPosition - 1)
          this._value = this._value.slice(0, prevCharIndex) + this._value.slice(charIndex)
          this._cursorPosition--
          this.updateGraphemes()
          this.emitChange()
        }
        break

      case 'delete':
        if (this._cursorPosition < this._graphemes.length) {
          // Delete the grapheme at cursor
          const charIndex = this.graphemeToCharIndex(this._cursorPosition)
          const nextCharIndex = this.graphemeToCharIndex(this._cursorPosition + 1)
          this._value = this._value.slice(0, charIndex) + this._value.slice(nextCharIndex)
          this.updateGraphemes()
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
        if (this._cursorPosition < this._graphemes.length) {
          this._cursorPosition++
          this.markDirty()
        }
        break

      case 'home':
        this._cursorPosition = 0
        this.markDirty()
        break

      case 'end':
        this._cursorPosition = this._graphemes.length
        this.markDirty()
        break

      case 'enter':
        for (const handler of this._onSubmitHandlers) {
          handler(this._value)
        }
        break

      default:
        // Insert printable character (or grapheme)
        // Additional safety check for default case - handleKey validation above catches most issues
        // but this ensures paste operations and multi-character inserts are also safe
        if (key.length >= 1 && this._value.length < this._maxLength) {
          // Double-check for printable characters only (reject any remaining suspicious content)
          // Allow: regular text, numbers, basic punctuation, common unicode
          // Reject: remaining control chars that might have bypassed earlier checks
          const code = key.codePointAt(0) ?? 0
          if (code < 32 || (code >= 0x7f && code < 0xa0)) {
            // Control character - should have been caught earlier, but be defensive
            break
          }
          const charIndex = this.graphemeToCharIndex(this._cursorPosition)

          // Calculate how many characters we can insert
          const remainingChars = this._maxLength - this._value.length
          let textToInsert = key

          // If inserting would exceed maxLength, truncate at grapheme boundary
          if (textToInsert.length > remainingChars) {
            const insertGraphemes = splitGraphemes(textToInsert)
            let truncatedLength = 0
            let truncatedGraphemes = 0

            // Find how many complete graphemes fit within remaining chars
            for (const grapheme of insertGraphemes) {
              if (truncatedLength + grapheme.length <= remainingChars) {
                truncatedLength += grapheme.length
                truncatedGraphemes++
              } else {
                break
              }
            }

            // Only insert complete graphemes
            textToInsert = insertGraphemes.slice(0, truncatedGraphemes).join('')
          }

          if (textToInsert.length > 0) {
            this._value = this._value.slice(0, charIndex) + textToInsert + this._value.slice(charIndex)
            this.updateGraphemes()
            // Move cursor by the number of graphemes inserted
            const insertedGraphemes = splitGraphemes(textToInsert)
            this._cursorPosition += insertedGraphemes.length
            this.emitChange()
          }
        }
    }
  }

  private emitChange(): void {
    this.markDirty()
    for (const handler of this._onChangeHandlers) {
      handler(this._value)
    }

    // Handle debounced handlers
    if (this._debouncedHandlers.length > 0) {
      // Clear existing timer
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer)
      }

      // Use the smallest debounce time from all handlers
      const minMs = Math.min(...this._debouncedHandlers.map((h) => h.ms))

      this._debounceTimer = setTimeout(() => {
        for (const { handler } of this._debouncedHandlers) {
          handler(this._value)
        }
        this._debounceTimer = null
      }, minMs)
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
