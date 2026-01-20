/**
 * @oxog/tui - MarkdownViewer Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_DIM, ATTR_ITALIC, ATTR_UNDERLINE, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Parsed markdown line.
 */
interface ParsedLine {
  /** Line type */
  type: 'text' | 'heading' | 'code' | 'codeblock' | 'blockquote' | 'list' | 'hr' | 'empty'
  /** Content text */
  content: string
  /** Heading level (1-6) */
  level?: number
  /** List indent level */
  indent?: number
  /** List marker type */
  listMarker?: 'bullet' | 'number'
  /** Inline styles */
  styles?: InlineStyle[]
}

/**
 * Inline text style.
 */
interface InlineStyle {
  /** Start position */
  start: number
  /** End position */
  end: number
  /** Style type */
  style: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough'
  /** Link URL if applicable */
  url?: string
}

/**
 * MarkdownViewer widget properties.
 */
export interface MarkdownViewerProps {
  /** Markdown content */
  content?: string
  /** Show line numbers */
  showLineNumbers?: boolean
  /** Word wrap */
  wordWrap?: boolean
  /** Code block background */
  codeBackground?: boolean
  /** Heading colors (map of level to color) */
  headingColors?: Record<number, number>
}

/**
 * MarkdownViewer node interface.
 */
export interface MarkdownViewerNode extends Node {
  readonly type: 'markdownviewer'

  // Configuration
  content(markdown: string): this
  showLineNumbers(show: boolean): this
  wordWrap(enabled: boolean): this
  codeBackground(enabled: boolean): this
  clear(): this

  // Navigation
  scrollToTop(): this
  scrollToBottom(): this
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  pageUp(): this
  pageDown(): this
  goToLine(line: number): this

  // Search
  search(query: string): this
  nextMatch(): this
  previousMatch(): this
  clearSearch(): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly lineCount: number
  readonly currentLine: number
  readonly matchCount: number
  readonly currentMatch: number
}

// ============================================================
// Implementation
// ============================================================

class MarkdownViewerNodeImpl extends LeafNode implements MarkdownViewerNode {
  readonly type = 'markdownviewer' as const

  private _content: string = ''
  private _parsedLines: ParsedLine[] = []
  private _showLineNumbers: boolean = false
  private _wordWrap: boolean = true
  private _codeBackground: boolean = true
  private _headingColors: Record<number, number> = {
    1: 14, // cyan
    2: 11, // yellow
    3: 10, // green
    4: 13, // magenta
    5: 12, // blue
    6: 8   // gray
  }

  private _scrollOffset: number = 0
  private _isFocused: boolean = false
  private _inCodeBlock: boolean = false

  // Search state
  private _searchQuery: string = ''
  private _matches: { line: number; start: number; end: number }[] = []
  private _currentMatchIndex: number = -1

  constructor(props?: MarkdownViewerProps) {
    super()
    if (props) {
      if (props.content) {
        this._content = props.content
        this.parseContent()
      }
      if (props.showLineNumbers !== undefined) this._showLineNumbers = props.showLineNumbers
      if (props.wordWrap !== undefined) this._wordWrap = props.wordWrap
      if (props.codeBackground !== undefined) this._codeBackground = props.codeBackground
      if (props.headingColors) this._headingColors = { ...this._headingColors, ...props.headingColors }
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get lineCount(): number {
    return this._parsedLines.length
  }

  get currentLine(): number {
    return this._scrollOffset + 1
  }

  get matchCount(): number {
    return this._matches.length
  }

  get currentMatch(): number {
    return this._currentMatchIndex + 1
  }

  // Parse markdown content
  private parseContent(): void {
    this._parsedLines = []
    this._inCodeBlock = false
    const lines = this._content.split('\n')

    for (const line of lines) {
      this._parsedLines.push(this.parseLine(line))
    }
  }

  private parseLine(line: string): ParsedLine {
    // Code block toggle
    if (line.startsWith('```')) {
      this._inCodeBlock = !this._inCodeBlock
      return { type: 'codeblock', content: line.slice(3) }
    }

    // Inside code block
    if (this._inCodeBlock) {
      return { type: 'code', content: line }
    }

    // Empty line
    if (line.trim() === '') {
      return { type: 'empty', content: '' }
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      return { type: 'hr', content: '' }
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      return {
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
        styles: this.parseInlineStyles(headingMatch[2])
      }
    }

    // Blockquote
    if (line.startsWith('>')) {
      const content = line.replace(/^>\s?/, '')
      return {
        type: 'blockquote',
        content,
        styles: this.parseInlineStyles(content)
      }
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/)
    if (ulMatch) {
      return {
        type: 'list',
        indent: Math.floor(ulMatch[1].length / 2),
        listMarker: 'bullet',
        content: ulMatch[3],
        styles: this.parseInlineStyles(ulMatch[3])
      }
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
    if (olMatch) {
      return {
        type: 'list',
        indent: Math.floor(olMatch[1].length / 2),
        listMarker: 'number',
        content: olMatch[3],
        styles: this.parseInlineStyles(olMatch[3])
      }
    }

    // Inline code line (starts with 4 spaces or tab)
    if (line.startsWith('    ') || line.startsWith('\t')) {
      return { type: 'code', content: line.slice(line.startsWith('\t') ? 1 : 4) }
    }

    // Regular text
    return {
      type: 'text',
      content: line,
      styles: this.parseInlineStyles(line)
    }
  }

  private parseInlineStyles(text: string): InlineStyle[] {
    const styles: InlineStyle[] = []

    // Bold (**text** or __text__)
    const boldRegex = /(\*\*|__)(.*?)\1/g
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[0].length,
        style: 'bold'
      })
    }

    // Italic (*text* or _text_)
    const italicRegex = /(?<![*_])([*_])(?![*_])(.*?)(?<![*_])\1(?![*_])/g
    while ((match = italicRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[0].length,
        style: 'italic'
      })
    }

    // Inline code (`text`)
    const codeRegex = /`([^`]+)`/g
    while ((match = codeRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[0].length,
        style: 'code'
      })
    }

    // Links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    while ((match = linkRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[0].length,
        style: 'link',
        url: match[2]
      })
    }

    // Strikethrough ~~text~~
    const strikeRegex = /~~(.*?)~~/g
    while ((match = strikeRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[0].length,
        style: 'strikethrough'
      })
    }

    return styles
  }

  // Strip markdown syntax for display
  private stripMarkdown(text: string): string {
    return text
      .replace(/(\*\*|__)(.*?)\1/g, '$2')       // Bold
      .replace(/(?<![*_])([*_])(?![*_])(.*?)(?<![*_])\1(?![*_])/g, '$2') // Italic
      .replace(/`([^`]+)`/g, '$1')              // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
      .replace(/~~(.*?)~~/g, '$1')              // Strikethrough
  }

  // Configuration
  content(markdown: string): this {
    this._content = markdown
    this.parseContent()
    this._scrollOffset = 0
    this.clearSearch()
    this.markDirty()
    return this
  }

  showLineNumbers(show: boolean): this {
    this._showLineNumbers = show
    this.markDirty()
    return this
  }

  wordWrap(enabled: boolean): this {
    this._wordWrap = enabled
    this.markDirty()
    return this
  }

  codeBackground(enabled: boolean): this {
    this._codeBackground = enabled
    this.markDirty()
    return this
  }

  clear(): this {
    this._content = ''
    this._parsedLines = []
    this._scrollOffset = 0
    this.clearSearch()
    this.markDirty()
    return this
  }

  // Navigation
  scrollToTop(): this {
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  scrollToBottom(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    this._scrollOffset = Math.max(0, this._parsedLines.length - visibleLines)
    this.markDirty()
    return this
  }

  scrollUp(lines = 1): this {
    this._scrollOffset = Math.max(0, this._scrollOffset - lines)
    this.markDirty()
    return this
  }

  scrollDown(lines = 1): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    const maxOffset = Math.max(0, this._parsedLines.length - visibleLines)
    this._scrollOffset = Math.min(maxOffset, this._scrollOffset + lines)
    this.markDirty()
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

  goToLine(line: number): this {
    const targetLine = Math.max(0, Math.min(this._parsedLines.length - 1, line - 1))
    this._scrollOffset = targetLine
    this.markDirty()
    return this
  }

  // Search
  search(query: string): this {
    this._searchQuery = query
    this._matches = []
    this._currentMatchIndex = -1

    if (!query) {
      this.markDirty()
      return this
    }

    const lowerQuery = query.toLowerCase()
    for (let i = 0; i < this._parsedLines.length; i++) {
      const line = this._parsedLines[i]
      const content = this.stripMarkdown(line.content).toLowerCase()
      let pos = 0
      while ((pos = content.indexOf(lowerQuery, pos)) !== -1) {
        this._matches.push({
          line: i,
          start: pos,
          end: pos + query.length
        })
        pos++
      }
    }

    if (this._matches.length > 0) {
      this._currentMatchIndex = 0
      this.ensureMatchVisible()
    }

    this.markDirty()
    return this
  }

  nextMatch(): this {
    if (this._matches.length === 0) return this

    this._currentMatchIndex = (this._currentMatchIndex + 1) % this._matches.length
    this.ensureMatchVisible()
    this.markDirty()
    return this
  }

  previousMatch(): this {
    if (this._matches.length === 0) return this

    this._currentMatchIndex = (this._currentMatchIndex - 1 + this._matches.length) % this._matches.length
    this.ensureMatchVisible()
    this.markDirty()
    return this
  }

  clearSearch(): this {
    this._searchQuery = ''
    this._matches = []
    this._currentMatchIndex = -1
    this.markDirty()
    return this
  }

  private ensureMatchVisible(): void {
    if (this._currentMatchIndex < 0 || this._currentMatchIndex >= this._matches.length) return

    const match = this._matches[this._currentMatchIndex]
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10

    if (match.line < this._scrollOffset) {
      this._scrollOffset = match.line
    } else if (match.line >= this._scrollOffset + visibleLines) {
      this._scrollOffset = match.line - visibleLines + 1
    }
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

  // Keyboard handling
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.scrollUp()
        return true
      case 'down':
      case 'j':
        this.scrollDown()
        return true
      case 'pageup':
        this.pageUp()
        return true
      case 'pagedown':
        this.pageDown()
        return true
      case 'home':
        if (ctrl) this.scrollToTop()
        return true
      case 'end':
        if (ctrl) this.scrollToBottom()
        return true
      case 'g':
        this.scrollToTop()
        return true
      case 'G':
        this.scrollToBottom()
        return true
      case 'n':
        this.nextMatch()
        return true
      case 'N':
        this.previousMatch()
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    if (action === 'press') {
      this._isFocused = true
      this.markDirty()
      return true
    } else if (action === 'scroll-up') {
      this.scrollUp(3)
      return true
    } else if (action === 'scroll-down') {
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

    const lineNumWidth = this._showLineNumbers ? String(this._parsedLines.length).length + 2 : 0
    const contentWidth = bounds.width - lineNumWidth
    const visibleLines = bounds.height

    // Get current match line for highlighting
    const currentMatchLine = this._currentMatchIndex >= 0 && this._currentMatchIndex < this._matches.length
      ? this._matches[this._currentMatchIndex].line
      : -1

    for (let i = 0; i < visibleLines; i++) {
      const lineIndex = this._scrollOffset + i
      const y = bounds.y + i

      // Clear line
      for (let col = 0; col < bounds.width; col++) {
        buffer.set(bounds.x + col, y, { char: ' ', fg, bg, attrs: 0 })
      }

      if (lineIndex >= this._parsedLines.length) continue

      const parsed = this._parsedLines[lineIndex]
      let x = bounds.x

      // Line numbers
      if (this._showLineNumbers) {
        const lineNum = String(lineIndex + 1).padStart(lineNumWidth - 2, ' ') + ' '
        buffer.write(x, y, lineNum, { fg, bg, attrs: ATTR_DIM })
        x += lineNumWidth
      }

      // Render based on line type
      const isCurrentMatch = lineIndex === currentMatchLine
      this.renderLine(buffer, x, y, parsed, contentWidth, fg, bg, isCurrentMatch)
    }

    // Scroll indicator
    if (this._parsedLines.length > visibleLines) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._parsedLines.length - visibleLines)
      const indicatorY = bounds.y + Math.floor(scrollPercent * (bounds.height - 1))
      buffer.set(bounds.x + bounds.width - 1, indicatorY, { char: '\u2588', fg, bg, attrs: ATTR_DIM })
    }
  }

  private renderLine(
    buffer: Buffer,
    x: number,
    y: number,
    parsed: ParsedLine,
    width: number,
    fg: number,
    bg: number,
    isCurrentMatch: boolean
  ): void {
    let attrs = isCurrentMatch ? ATTR_INVERSE : 0
    let lineFg = fg
    let lineBg = bg
    let prefix = ''

    switch (parsed.type) {
      case 'heading':
        attrs |= ATTR_BOLD
        lineFg = this._headingColors[parsed.level || 1] || fg
        prefix = '#'.repeat(parsed.level || 1) + ' '
        break

      case 'code':
      case 'codeblock':
        attrs |= ATTR_DIM
        if (this._codeBackground) {
          lineBg = 8 // Gray background
        }
        break

      case 'blockquote':
        attrs |= ATTR_ITALIC
        prefix = '\u2502 ' // │
        break

      case 'list':
        const indent = '  '.repeat(parsed.indent || 0)
        prefix = indent + (parsed.listMarker === 'bullet' ? '\u2022 ' : '1. ')
        break

      case 'hr':
        const hr = '\u2500'.repeat(width)
        buffer.write(x, y, hr, { fg, bg: lineBg, attrs: ATTR_DIM })
        return

      case 'empty':
        return
    }

    // Write prefix
    if (prefix) {
      const prefixDisplay = truncateToWidth(prefix, width)
      buffer.write(x, y, prefixDisplay, { fg: lineFg, bg: lineBg, attrs })
      x += stringWidth(prefixDisplay)
    }

    // Write content
    const content = this.stripMarkdown(parsed.content)
    const remaining = width - stringWidth(prefix)
    if (remaining > 0) {
      const display = truncateToWidth(content, remaining)
      buffer.write(x, y, display, { fg: lineFg, bg: lineBg, attrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a markdown viewer widget.
 *
 * @param props - MarkdownViewer properties
 * @returns MarkdownViewer node
 *
 * @example
 * ```typescript
 * // Basic markdown viewer
 * const md = markdownviewer({
 *   content: `# Hello World
 *
 * This is **bold** and *italic* text.
 *
 * - Item 1
 * - Item 2
 *
 * \`\`\`javascript
 * console.log('Hello');
 * \`\`\`
 * `
 * })
 *
 * // With line numbers
 * md.showLineNumbers(true)
 *
 * // Search in content
 * md.search('bold')
 * md.nextMatch()
 * ```
 */
export function markdownviewer(props?: MarkdownViewerProps): MarkdownViewerNode {
  return new MarkdownViewerNodeImpl(props)
}
