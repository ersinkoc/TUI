/**
 * @oxog/tui - Terminal Emulator Widget
 *
 * A terminal emulator widget for displaying command output and handling input.
 */

import { LeafNode } from './node'
import type { Buffer, CellStyle } from '../types'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_BOLD, ATTR_DIM } from '../constants'
import { truncateToWidth, stringWidth } from '../utils/unicode'

export interface TerminalLine {
  content: string
  fg?: number
  bg?: number
  attrs?: number
  timestamp?: number
}

export interface TerminalProps {
  lines?: TerminalLine[]
  maxLines?: number
  prompt?: string
  promptColor?: number
  cursorChar?: string
  showCursor?: boolean
  showLineNumbers?: boolean
  showTimestamps?: boolean
  autoScroll?: boolean
  inputEnabled?: boolean
}

export interface TerminalNode extends LeafNode {
  readonly type: 'terminal'
  readonly lines: TerminalLine[]
  readonly inputBuffer: string
  readonly cursorPosition: number
  readonly scrollOffset: number
  readonly visibleLines: number

  // Output
  write(text: string, fg?: number, bg?: number, attrs?: number): this
  writeLine(text: string, fg?: number, bg?: number, attrs?: number): this
  writeError(text: string): this
  writeSuccess(text: string): this
  writeWarning(text: string): this
  writeInfo(text: string): this
  clear(): this

  // Configuration
  maxLines(max: number): this
  prompt(text: string): this
  promptColor(color: number): this
  cursorChar(char: string): this
  showCursor(show: boolean): this
  showLineNumbers(show: boolean): this
  showTimestamps(show: boolean): this
  autoScroll(enable: boolean): this
  inputEnabled(enable: boolean): this

  // Scrolling
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  scrollToTop(): this
  scrollToBottom(): this

  // Input
  insertChar(char: string): this
  deleteChar(): this
  deleteCharBefore(): this
  moveCursorLeft(): this
  moveCursorRight(): this
  moveCursorToStart(): this
  moveCursorToEnd(): this
  clearInput(): this
  getInput(): string
  submitInput(): string

  // Focus
  focus(): this
  blur(): this

  // Events
  onSubmit(handler: (input: string) => void): this
  onInput(handler: (char: string) => void): this
}

// Colors
const ERROR_COLOR = 196 // Red
const SUCCESS_COLOR = 46 // Green
const WARNING_COLOR = 208 // Orange
const INFO_COLOR = 39 // Blue

class TerminalNodeImpl extends LeafNode implements TerminalNode {
  readonly type = 'terminal' as const

  private _lines: TerminalLine[] = []
  private _maxLines = 1000
  private _prompt = '> '
  private _promptColor = 46 // Green
  private _cursorChar = '█'
  private _showCursor = true
  private _showLineNumbers = false
  private _showTimestamps = false
  private _autoScroll = true
  private _inputEnabled = true
  private _isFocused = false

  private _inputBuffer = ''
  private _cursorPosition = 0
  private _scrollOffset = 0
  private _currentLine = ''

  private _onSubmitHandlers: Array<(input: string) => void> = []
  private _onInputHandlers: Array<(char: string) => void> = []

  constructor(props?: TerminalProps) {
    super()
    if (props) {
      if (props.lines) this._lines = [...props.lines]
      if (props.maxLines !== undefined) this._maxLines = props.maxLines
      if (props.prompt !== undefined) this._prompt = props.prompt
      if (props.promptColor !== undefined) this._promptColor = props.promptColor
      if (props.cursorChar !== undefined) this._cursorChar = props.cursorChar
      if (props.showCursor !== undefined) this._showCursor = props.showCursor
      if (props.showLineNumbers !== undefined) this._showLineNumbers = props.showLineNumbers
      if (props.showTimestamps !== undefined) this._showTimestamps = props.showTimestamps
      if (props.autoScroll !== undefined) this._autoScroll = props.autoScroll
      if (props.inputEnabled !== undefined) this._inputEnabled = props.inputEnabled
    }
  }

  // Getters
  get lines(): TerminalLine[] {
    return this._lines
  }

  get inputBuffer(): string {
    return this._inputBuffer
  }

  get cursorPosition(): number {
    return this._cursorPosition
  }

  get scrollOffset(): number {
    return this._scrollOffset
  }

  get visibleLines(): number {
    const bounds = this._bounds
    if (!bounds || bounds.height <= 0) return 0
    // Reserve 1 line for input if enabled
    const lines = this._inputEnabled ? bounds.height - 1 : bounds.height
    return Math.max(0, lines)
  }

  // Output methods
  write(text: string, fg?: number, bg?: number, attrs?: number): this {
    this._currentLine += text

    // Check for newlines
    const parts = this._currentLine.split('\n')
    for (let i = 0; i < parts.length - 1; i++) {
      this.addLine(parts[i] ?? '', fg, bg, attrs)
    }
    this._currentLine = parts[parts.length - 1] ?? ''

    this.markDirty()
    return this
  }

  writeLine(text: string, fg?: number, bg?: number, attrs?: number): this {
    if (this._currentLine) {
      this.addLine(this._currentLine + text, fg, bg, attrs)
      this._currentLine = ''
    } else {
      this.addLine(text, fg, bg, attrs)
    }
    this.markDirty()
    return this
  }

  private addLine(content: string, fg?: number, bg?: number, attrs?: number): void {
    const line: TerminalLine = {
      content,
      timestamp: Date.now()
    }
    if (fg !== undefined) line.fg = fg
    if (bg !== undefined) line.bg = bg
    if (attrs !== undefined) line.attrs = attrs
    this._lines.push(line)

    // Trim excess lines
    while (this._lines.length > this._maxLines) {
      this._lines.shift()
      if (this._scrollOffset > 0) this._scrollOffset--
    }

    // Auto-scroll to bottom
    if (this._autoScroll) {
      this.scrollToBottom()
    }
  }

  writeError(text: string): this {
    return this.writeLine(text, ERROR_COLOR)
  }

  writeSuccess(text: string): this {
    return this.writeLine(text, SUCCESS_COLOR)
  }

  writeWarning(text: string): this {
    return this.writeLine(text, WARNING_COLOR)
  }

  writeInfo(text: string): this {
    return this.writeLine(text, INFO_COLOR)
  }

  clear(): this {
    this._lines = []
    this._currentLine = ''
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  // Configuration
  maxLines(max: number): this {
    this._maxLines = Math.max(1, max)
    while (this._lines.length > this._maxLines) {
      this._lines.shift()
    }
    this.markDirty()
    return this
  }

  prompt(text: string): this {
    this._prompt = text
    this.markDirty()
    return this
  }

  promptColor(color: number): this {
    this._promptColor = color
    this.markDirty()
    return this
  }

  cursorChar(char: string): this {
    this._cursorChar = char
    this.markDirty()
    return this
  }

  showCursor(show: boolean): this {
    this._showCursor = show
    this.markDirty()
    return this
  }

  showLineNumbers(show: boolean): this {
    this._showLineNumbers = show
    this.markDirty()
    return this
  }

  showTimestamps(show: boolean): this {
    this._showTimestamps = show
    this.markDirty()
    return this
  }

  autoScroll(enable: boolean): this {
    this._autoScroll = enable
    return this
  }

  inputEnabled(enable: boolean): this {
    this._inputEnabled = enable
    this.markDirty()
    return this
  }

  // Scrolling
  scrollUp(lines: number = 1): this {
    this._scrollOffset = Math.max(0, this._scrollOffset - lines)
    this.markDirty()
    return this
  }

  scrollDown(lines: number = 1): this {
    const maxScroll = Math.max(0, this._lines.length - this.visibleLines)
    this._scrollOffset = Math.min(maxScroll, this._scrollOffset + lines)
    this.markDirty()
    return this
  }

  scrollToTop(): this {
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  scrollToBottom(): this {
    // Only scroll if bounds are set, otherwise defer until render
    if (this._bounds && this._bounds.height > 0) {
      const maxScroll = Math.max(0, this._lines.length - this.visibleLines)
      this._scrollOffset = maxScroll
    }
    this.markDirty()
    return this
  }

  // Input methods
  insertChar(char: string): this {
    if (!this._inputEnabled) return this

    this._inputBuffer =
      this._inputBuffer.slice(0, this._cursorPosition) +
      char +
      this._inputBuffer.slice(this._cursorPosition)
    this._cursorPosition += char.length

    for (const handler of this._onInputHandlers) {
      handler(char)
    }

    this.markDirty()
    return this
  }

  deleteChar(): this {
    if (!this._inputEnabled) return this
    if (this._cursorPosition >= this._inputBuffer.length) return this

    this._inputBuffer =
      this._inputBuffer.slice(0, this._cursorPosition) +
      this._inputBuffer.slice(this._cursorPosition + 1)
    this.markDirty()
    return this
  }

  deleteCharBefore(): this {
    if (!this._inputEnabled) return this
    if (this._cursorPosition === 0) return this

    this._inputBuffer =
      this._inputBuffer.slice(0, this._cursorPosition - 1) +
      this._inputBuffer.slice(this._cursorPosition)
    this._cursorPosition--
    this.markDirty()
    return this
  }

  moveCursorLeft(): this {
    if (this._cursorPosition > 0) {
      this._cursorPosition--
      this.markDirty()
    }
    return this
  }

  moveCursorRight(): this {
    if (this._cursorPosition < this._inputBuffer.length) {
      this._cursorPosition++
      this.markDirty()
    }
    return this
  }

  moveCursorToStart(): this {
    this._cursorPosition = 0
    this.markDirty()
    return this
  }

  moveCursorToEnd(): this {
    this._cursorPosition = this._inputBuffer.length
    this.markDirty()
    return this
  }

  clearInput(): this {
    this._inputBuffer = ''
    this._cursorPosition = 0
    this.markDirty()
    return this
  }

  getInput(): string {
    return this._inputBuffer
  }

  submitInput(): string {
    const input = this._inputBuffer

    // Add input to terminal output
    this.writeLine(this._prompt + input, this._promptColor)

    // Clear input buffer
    this._inputBuffer = ''
    this._cursorPosition = 0

    // Emit submit event
    for (const handler of this._onSubmitHandlers) {
      handler(input)
    }

    this.markDirty()
    return input
  }

  // Focus
  focus(): this {
    this._isFocused = true
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  // Events
  onSubmit(handler: (input: string) => void): this {
    this._onSubmitHandlers.push(handler)
    return this
  }

  onInput(handler: (char: string) => void): this {
    this._onInputHandlers.push(handler)
    return this
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'pageup':
        this.scrollUp(this.visibleLines)
        return true
      case 'pagedown':
        this.scrollDown(this.visibleLines)
        return true
      case 'home':
        if (this._inputEnabled) {
          this.moveCursorToStart()
        } else {
          this.scrollToTop()
        }
        return true
      case 'end':
        if (this._inputEnabled) {
          this.moveCursorToEnd()
        } else {
          this.scrollToBottom()
        }
        return true
    }

    if (!this._inputEnabled) return false

    switch (key) {
      case 'left':
        this.moveCursorLeft()
        return true
      case 'right':
        this.moveCursorRight()
        return true
      case 'backspace':
        this.deleteCharBefore()
        return true
      case 'delete':
        this.deleteChar()
        return true
      case 'enter':
        this.submitInput()
        return true
      default:
        // Single printable character
        if (key.length === 1 && key >= ' ') {
          this.insertChar(key)
          return true
        }
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(_x: number, _y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      this._isFocused = true
      this.markDirty()
      return true
    }

    if (action === 'scroll_up') {
      this.scrollUp(3)
      return true
    }

    if (action === 'scroll_down') {
      this.scrollDown(3)
      return true
    }

    return false
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

    const lineNumberWidth = this._showLineNumbers ? Math.max(4, String(this._lines.length).length + 1) : 0
    const timestampWidth = this._showTimestamps ? 9 : 0 // HH:MM:SS + space
    const contentWidth = bounds.width - lineNumberWidth - timestampWidth

    // Render output lines
    const outputHeight = this._inputEnabled ? bounds.height - 1 : bounds.height
    const startLine = this._scrollOffset
    const endLine = Math.min(this._lines.length, startLine + outputHeight)

    for (let i = startLine; i < endLine; i++) {
      const line = this._lines[i]
      if (!line) continue
      const screenY = bounds.y + (i - startLine)
      let screenX = bounds.x

      // Line number
      if (this._showLineNumbers) {
        const lineNum = String(i + 1).padStart(lineNumberWidth - 1, ' ') + ' '
        buffer.write(screenX, screenY, lineNum, { fg: 244, bg, attrs: ATTR_DIM })
        screenX += lineNumberWidth
      }

      // Timestamp
      if (this._showTimestamps && line.timestamp) {
        const date = new Date(line.timestamp)
        const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} `
        buffer.write(screenX, screenY, time, { fg: 244, bg, attrs: ATTR_DIM })
        screenX += timestampWidth
      }

      // Content
      const content = truncateToWidth(line.content, contentWidth)
      buffer.write(screenX, screenY, content, {
        fg: line.fg ?? fg,
        bg: line.bg ?? bg,
        attrs: line.attrs ?? 0
      })
    }

    // Render scroll indicator
    if (this._lines.length > outputHeight) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._lines.length - outputHeight)
      const indicatorY = Math.floor(scrollPercent * (outputHeight - 1))

      for (let y = 0; y < outputHeight; y++) {
        const char = y === indicatorY ? '█' : '│'
        buffer.set(bounds.x + bounds.width - 1, bounds.y + y, {
          char,
          fg: y === indicatorY ? 39 : 240,
          bg,
          attrs: 0
        })
      }
    }

    // Render input line
    if (this._inputEnabled) {
      const inputY = bounds.y + bounds.height - 1
      let inputX = bounds.x

      // Prompt
      buffer.write(inputX, inputY, this._prompt, {
        fg: this._promptColor,
        bg,
        attrs: ATTR_BOLD
      })
      inputX += stringWidth(this._prompt)

      // Input text
      const availableWidth = bounds.width - stringWidth(this._prompt) - 1
      const inputText = truncateToWidth(this._inputBuffer, availableWidth)
      buffer.write(inputX, inputY, inputText, { fg, bg, attrs: 0 })

      // Cursor
      if (this._isFocused && this._showCursor) {
        const cursorX = inputX + this._cursorPosition
        if (cursorX < bounds.x + bounds.width - 1) {
          const cursorChar = this._cursorPosition < this._inputBuffer.length
            ? (this._inputBuffer[this._cursorPosition] ?? this._cursorChar)
            : this._cursorChar
          buffer.set(cursorX, inputY, {
            char: cursorChar,
            fg: bg,
            bg: fg,
            attrs: 0
          })
        }
      }
    }
  }
}

export function terminal(props?: TerminalProps): TerminalNode {
  return new TerminalNodeImpl(props)
}
