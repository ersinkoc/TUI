/**
 * @oxog/tui - CodeViewer Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Language for syntax highlighting hints.
 */
export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'shell'
  | 'sql'
  | 'html'
  | 'css'
  | 'text'

/**
 * Line highlight configuration.
 */
export interface LineHighlight {
  /** Line number (1-indexed) */
  line: number
  /** Highlight style */
  style?: 'highlight' | 'error' | 'warning' | 'success' | 'info'
  /** Optional annotation */
  annotation?: string
}

/**
 * CodeViewer widget properties.
 */
export interface CodeViewerProps {
  /** Source code content */
  code?: string
  /** Language hint for syntax highlighting */
  language?: CodeLanguage
  /** Show line numbers */
  showLineNumbers?: boolean
  /** Starting line number */
  startLineNumber?: number
  /** Highlight specific lines */
  highlightLines?: LineHighlight[]
  /** Enable word wrap */
  wordWrap?: boolean
  /** Tab width */
  tabWidth?: number
  /** Show gutter (margin for annotations) */
  showGutter?: boolean
  /** Enable selection */
  selectable?: boolean
  /** Current line (for cursor) */
  currentLine?: number
}

/**
 * CodeViewer node interface.
 */
export interface CodeViewerNode extends Node {
  readonly type: 'codeviewer'

  // Configuration
  code(content: string): this
  language(lang: CodeLanguage): this
  showLineNumbers(show: boolean): this
  startLineNumber(num: number): this
  highlightLines(lines: LineHighlight[]): this
  addHighlight(highlight: LineHighlight): this
  removeHighlight(line: number): this
  clearHighlights(): this
  wordWrap(enabled: boolean): this
  tabWidth(width: number): this
  showGutter(show: boolean): this
  selectable(enabled: boolean): this
  currentLine(line: number): this

  // Navigation
  scrollToLine(line: number): this
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  pageUp(): this
  pageDown(): this
  goToStart(): this
  goToEnd(): this

  // Selection
  selectLine(line: number): this
  selectRange(startLine: number, endLine: number): this
  clearSelection(): this

  // Events
  onLineSelect(handler: (line: number, content: string) => void): this
  onScroll(handler: (firstVisibleLine: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly lineCount: number
  readonly firstVisibleLine: number
  readonly selectedLines: number[]
  readonly content: string
}

// ============================================================
// Implementation
// ============================================================

class CodeViewerNodeImpl extends LeafNode implements CodeViewerNode {
  readonly type = 'codeviewer' as const

  private _code: string = ''
  private _lines: string[] = []
  private _language: CodeLanguage = 'text'
  private _showLineNumbers: boolean = true
  private _startLineNumber: number = 1
  private _highlightLines: Map<number, LineHighlight> = new Map()
  private _wordWrap: boolean = false
  private _tabWidth: number = 2
  private _showGutter: boolean = false
  private _selectable: boolean = true
  private _currentLine: number = 1

  private _scrollOffset: number = 0
  private _selectedLines: Set<number> = new Set()
  private _isFocused: boolean = false

  private _onLineSelectHandlers: ((line: number, content: string) => void)[] = []
  private _onScrollHandlers: ((firstVisibleLine: number) => void)[] = []

  constructor(props?: CodeViewerProps) {
    super()
    if (props) {
      if (props.code) this.setCode(props.code)
      if (props.language) this._language = props.language
      if (props.showLineNumbers !== undefined) this._showLineNumbers = props.showLineNumbers
      if (props.startLineNumber !== undefined) this._startLineNumber = props.startLineNumber
      if (props.highlightLines) {
        for (const hl of props.highlightLines) {
          this._highlightLines.set(hl.line, hl)
        }
      }
      if (props.wordWrap !== undefined) this._wordWrap = props.wordWrap
      if (props.tabWidth !== undefined) this._tabWidth = props.tabWidth
      if (props.showGutter !== undefined) this._showGutter = props.showGutter
      if (props.selectable !== undefined) this._selectable = props.selectable
      if (props.currentLine !== undefined) this._currentLine = props.currentLine
    }
  }

  private setCode(content: string): void {
    this._code = content
    // Expand tabs and split into lines
    const expanded = content.replace(/\t/g, ' '.repeat(this._tabWidth))
    this._lines = expanded.split('\n')
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get lineCount(): number {
    return this._lines.length
  }

  get firstVisibleLine(): number {
    return this._scrollOffset + this._startLineNumber
  }

  get selectedLines(): number[] {
    return Array.from(this._selectedLines).sort((a, b) => a - b)
  }

  get content(): string {
    return this._code
  }

  get lang(): CodeLanguage {
    return this._language
  }

  // Configuration
  code(content: string): this {
    this.setCode(content)
    this._scrollOffset = 0
    this._selectedLines.clear()
    this.markDirty()
    return this
  }

  language(lang: CodeLanguage): this {
    this._language = lang
    this.markDirty()
    return this
  }

  showLineNumbers(show: boolean): this {
    this._showLineNumbers = show
    this.markDirty()
    return this
  }

  startLineNumber(num: number): this {
    this._startLineNumber = num
    this.markDirty()
    return this
  }

  highlightLines(lines: LineHighlight[]): this {
    this._highlightLines.clear()
    for (const hl of lines) {
      this._highlightLines.set(hl.line, hl)
    }
    this.markDirty()
    return this
  }

  addHighlight(highlight: LineHighlight): this {
    this._highlightLines.set(highlight.line, highlight)
    this.markDirty()
    return this
  }

  removeHighlight(line: number): this {
    if (this._highlightLines.has(line)) {
      this._highlightLines.delete(line)
      this.markDirty()
    }
    return this
  }

  clearHighlights(): this {
    if (this._highlightLines.size > 0) {
      this._highlightLines.clear()
      this.markDirty()
    }
    return this
  }

  wordWrap(enabled: boolean): this {
    this._wordWrap = enabled
    this.markDirty()
    return this
  }

  tabWidth(width: number): this {
    this._tabWidth = width
    // Re-process code with new tab width
    if (this._code) {
      this.setCode(this._code)
    }
    this.markDirty()
    return this
  }

  showGutter(show: boolean): this {
    this._showGutter = show
    this.markDirty()
    return this
  }

  selectable(enabled: boolean): this {
    this._selectable = enabled
    if (!enabled) {
      this._selectedLines.clear()
    }
    this.markDirty()
    return this
  }

  currentLine(line: number): this {
    this._currentLine = line
    this.ensureLineVisible(line)
    this.markDirty()
    return this
  }

  // Navigation
  scrollToLine(line: number): this {
    const lineIndex = line - this._startLineNumber
    if (lineIndex >= 0 && lineIndex < this._lines.length) {
      this._scrollOffset = lineIndex
      this.emitScrollEvent()
      this.markDirty()
    }
    return this
  }

  scrollUp(lines = 1): this {
    if (this._scrollOffset > 0) {
      this._scrollOffset = Math.max(0, this._scrollOffset - lines)
      this.emitScrollEvent()
      this.markDirty()
    }
    return this
  }

  scrollDown(lines = 1): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    const maxOffset = Math.max(0, this._lines.length - visibleLines)

    if (this._scrollOffset < maxOffset) {
      this._scrollOffset = Math.min(maxOffset, this._scrollOffset + lines)
      this.emitScrollEvent()
      this.markDirty()
    }
    return this
  }

  pageUp(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    return this.scrollUp(visibleLines)
  }

  pageDown(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    return this.scrollDown(visibleLines)
  }

  goToStart(): this {
    if (this._scrollOffset !== 0) {
      this._scrollOffset = 0
      this._currentLine = this._startLineNumber
      this.emitScrollEvent()
      this.markDirty()
    }
    return this
  }

  goToEnd(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    const newOffset = Math.max(0, this._lines.length - visibleLines)

    if (this._scrollOffset !== newOffset) {
      this._scrollOffset = newOffset
      this._currentLine = this._startLineNumber + this._lines.length - 1
      this.emitScrollEvent()
      this.markDirty()
    }
    return this
  }

  private ensureLineVisible(line: number): void {
    const lineIndex = line - this._startLineNumber
    if (lineIndex < 0 || lineIndex >= this._lines.length) return

    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10

    if (lineIndex < this._scrollOffset) {
      this._scrollOffset = lineIndex
      this.emitScrollEvent()
    } else if (lineIndex >= this._scrollOffset + visibleLines) {
      this._scrollOffset = lineIndex - visibleLines + 1
      this.emitScrollEvent()
    }
  }

  private emitScrollEvent(): void {
    const firstVisible = this._scrollOffset + this._startLineNumber
    for (const handler of this._onScrollHandlers) {
      handler(firstVisible)
    }
  }

  // Selection
  selectLine(line: number): this {
    if (!this._selectable) return this

    const lineIndex = line - this._startLineNumber
    if (lineIndex >= 0 && lineIndex < this._lines.length) {
      this._selectedLines.clear()
      this._selectedLines.add(line)
      this._currentLine = line
      this.ensureLineVisible(line)
      this.markDirty()
      this.emitLineSelectEvent(line)
    }
    return this
  }

  selectRange(startLine: number, endLine: number): this {
    if (!this._selectable) return this

    const start = Math.max(this._startLineNumber, Math.min(startLine, endLine))
    const end = Math.min(this._startLineNumber + this._lines.length - 1, Math.max(startLine, endLine))

    this._selectedLines.clear()
    for (let line = start; line <= end; line++) {
      this._selectedLines.add(line)
    }
    this.markDirty()
    return this
  }

  clearSelection(): this {
    if (this._selectedLines.size > 0) {
      this._selectedLines.clear()
      this.markDirty()
    }
    return this
  }

  private emitLineSelectEvent(line: number): void {
    const lineIndex = line - this._startLineNumber
    const content = this._lines[lineIndex] ?? ''
    for (const handler of this._onLineSelectHandlers) {
      handler(line, content)
    }
  }

  // Events
  onLineSelect(handler: (line: number, content: string) => void): this {
    this._onLineSelectHandlers.push(handler)
    return this
  }

  onScroll(handler: (firstVisibleLine: number) => void): this {
    this._onScrollHandlers.push(handler)
    return this
  }

  /**
   * Dispose of codeviewer and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._lines = []
    this._highlightLines.clear()
    this._selectedLines.clear()
    this._onLineSelectHandlers = []
    this._onScrollHandlers = []
    super.dispose()
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

  // Keyboard handling
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        if (this._selectable) {
          const newLine = Math.max(this._startLineNumber, this._currentLine - 1)
          if (newLine !== this._currentLine) {
            this._currentLine = newLine
            this.ensureLineVisible(newLine)
            this.markDirty()
          }
        } else {
          this.scrollUp()
        }
        return true
      case 'down':
      case 'j':
        if (this._selectable) {
          const maxLine = this._startLineNumber + this._lines.length - 1
          const newLine = Math.min(maxLine, this._currentLine + 1)
          if (newLine !== this._currentLine) {
            this._currentLine = newLine
            this.ensureLineVisible(newLine)
            this.markDirty()
          }
        } else {
          this.scrollDown()
        }
        return true
      case 'pageup':
        this.pageUp()
        return true
      case 'pagedown':
        this.pageDown()
        return true
      case 'home':
        if (ctrl) {
          this.goToStart()
        } else {
          this._currentLine = this._startLineNumber
          this.ensureLineVisible(this._currentLine)
          this.markDirty()
        }
        return true
      case 'end':
        if (ctrl) {
          this.goToEnd()
        } else {
          this._currentLine = this._startLineNumber + this._lines.length - 1
          this.ensureLineVisible(this._currentLine)
          this.markDirty()
        }
        return true
      case 'enter':
      case 'space':
        if (this._selectable) {
          this.selectLine(this._currentLine)
        }
        return true
      case 'g':
        if (!ctrl) {
          this.goToStart()
          return true
        }
        break
      case 'G':
        this.goToEnd()
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
      const lineNumWidth = this._showLineNumbers ? this.getLineNumberWidth() + 1 : 0
      const gutterWidth = this._showGutter ? 2 : 0

      // Check if clicked on content area
      if (x >= bounds.x + lineNumWidth + gutterWidth) {
        const clickedIndex = y - bounds.y + this._scrollOffset
        if (clickedIndex >= 0 && clickedIndex < this._lines.length) {
          this._isFocused = true
          const lineNum = clickedIndex + this._startLineNumber
          this._currentLine = lineNum

          if (this._selectable) {
            this.selectLine(lineNum)
          }

          this.markDirty()
          return true
        }
      }
    } else if (action === 'scroll-up') {
      this.scrollUp(3)
      return true
    } else if (action === 'scroll-down') {
      this.scrollDown(3)
      return true
    }

    return false
  }

  private getLineNumberWidth(): number {
    const maxLineNum = this._startLineNumber + this._lines.length - 1
    return Math.max(3, String(maxLineNum).length)
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const lineNumWidth = this._showLineNumbers ? this.getLineNumberWidth() + 1 : 0
    const gutterWidth = this._showGutter ? 2 : 0
    const contentX = bounds.x + lineNumWidth + gutterWidth
    const contentWidth = bounds.width - lineNumWidth - gutterWidth

    const visibleLines = bounds.height
    const endIndex = Math.min(this._scrollOffset + visibleLines, this._lines.length)

    for (let i = this._scrollOffset; i < endIndex; i++) {
      const line = this._lines[i] ?? ''
      const lineNum = i + this._startLineNumber
      const rowY = bounds.y + (i - this._scrollOffset)

      const isCurrentLine = this._currentLine === lineNum
      const isSelected = this._selectedLines.has(lineNum)
      const highlight = this._highlightLines.get(lineNum)

      // Determine line attributes
      let lineAttrs = 0
      if (isSelected) lineAttrs |= ATTR_INVERSE
      else if (isCurrentLine && this._isFocused) lineAttrs |= ATTR_INVERSE
      else if (highlight) {
        if (highlight.style === 'error') lineAttrs |= ATTR_BOLD
        else if (highlight.style === 'warning') lineAttrs |= ATTR_DIM
      }

      // Draw line number
      if (this._showLineNumbers) {
        const numStr = padToWidth(String(lineNum), lineNumWidth - 1, 'right')
        const numAttrs = isCurrentLine && this._isFocused ? ATTR_BOLD : ATTR_DIM
        buffer.write(bounds.x, rowY, numStr, { fg, bg, attrs: numAttrs })
        buffer.set(bounds.x + lineNumWidth - 1, rowY, { char: '\u2502', fg, bg, attrs: ATTR_DIM })
      }

      // Draw gutter marker
      if (this._showGutter) {
        let marker = ' '
        if (highlight) {
          switch (highlight.style) {
            case 'error':
              marker = '\u25cf' // ●
              break
            case 'warning':
              marker = '\u25b2' // ▲
              break
            case 'success':
              marker = '\u2714' // ✔
              break
            case 'info':
              marker = '\u25c6' // ◆
              break
            default:
              marker = '\u25cf'
          }
        }
        buffer.set(bounds.x + lineNumWidth, rowY, { char: marker, fg, bg, attrs: highlight ? ATTR_BOLD : 0 })
      }

      // Draw content
      if (contentWidth > 0) {
        // Fill background for highlighted/selected lines
        if (lineAttrs !== 0 || highlight) {
          for (let col = contentX; col < contentX + contentWidth && col < bounds.x + bounds.width; col++) {
            buffer.set(col, rowY, { char: ' ', fg, bg, attrs: lineAttrs })
          }
        }

        // Draw line content
        let displayLine = line
        if (this._wordWrap && stringWidth(line) > contentWidth) {
          displayLine = truncateToWidth(line, contentWidth)
        } else if (stringWidth(line) > contentWidth) {
          displayLine = truncateToWidth(line, contentWidth)
        }

        buffer.write(contentX, rowY, displayLine, { fg, bg, attrs: lineAttrs })
      }
    }

    // Draw scroll position indicator
    if (this._lines.length > visibleLines) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._lines.length - visibleLines)
      const indicatorY = bounds.y + Math.floor(scrollPercent * (bounds.height - 1))

      buffer.set(bounds.x + bounds.width - 1, indicatorY, { char: '\u2588', fg, bg, attrs: ATTR_DIM })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a code viewer widget.
 *
 * @param props - CodeViewer properties
 * @returns CodeViewer node
 *
 * @example
 * ```typescript
 * // Basic code viewer
 * const viewer = codeviewer({
 *   code: 'function hello() {\n  console.log("Hello!");\n}',
 *   language: 'javascript',
 *   showLineNumbers: true
 * })
 *
 * // With line highlights
 * const errorViewer = codeviewer({
 *   code: sourceCode,
 *   highlightLines: [
 *     { line: 15, style: 'error', annotation: 'Syntax error' },
 *     { line: 20, style: 'warning', annotation: 'Unused variable' }
 *   ],
 *   showGutter: true
 * })
 *
 * // Interactive code viewer
 * const interactive = codeviewer()
 *   .code(fileContent)
 *   .language('typescript')
 *   .showLineNumbers(true)
 *   .selectable(true)
 *   .onLineSelect((line, content) => {
 *     console.log(`Selected line ${line}: ${content}`)
 *   })
 *
 * // Log viewer (no line numbers, word wrap)
 * const logs = codeviewer({
 *   code: logContent,
 *   showLineNumbers: false,
 *   wordWrap: true,
 *   language: 'text'
 * })
 * ```
 */
export function codeviewer(props?: CodeViewerProps): CodeViewerNode {
  return new CodeViewerNodeImpl(props)
}
