/**
 * @oxog/tui - DiffViewer Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Diff display mode.
 */
export type DiffMode = 'unified' | 'split' | 'inline'

/**
 * Diff line type.
 */
export type DiffLineType = 'context' | 'addition' | 'deletion' | 'header' | 'info'

/**
 * A single diff line.
 */
export interface DiffLine {
  /** Line type */
  type: DiffLineType
  /** Line content */
  content: string
  /** Old line number (for deletions and context) */
  oldLineNumber?: number
  /** New line number (for additions and context) */
  newLineNumber?: number
}

/**
 * Diff hunk (section of changes).
 */
export interface DiffHunk {
  /** Old file start line */
  oldStart: number
  /** Old file line count */
  oldCount: number
  /** New file start line */
  newStart: number
  /** New file line count */
  newCount: number
  /** Lines in this hunk */
  lines: DiffLine[]
}

/**
 * DiffViewer widget properties.
 */
export interface DiffViewerProps {
  /** Diff content (unified diff format) */
  diff?: string
  /** Display mode */
  mode?: DiffMode
  /** Show line numbers */
  showLineNumbers?: boolean
  /** Show +/- markers */
  showMarkers?: boolean
  /** Context lines around changes */
  contextLines?: number
  /** Highlight inline changes */
  highlightInline?: boolean
  /** Wrap long lines */
  wordWrap?: boolean
  /** Old file label */
  oldLabel?: string
  /** New file label */
  newLabel?: string
}

/**
 * DiffViewer node interface.
 */
export interface DiffViewerNode extends Node {
  readonly type: 'diffviewer'

  // Configuration
  diff(content: string): this
  setHunks(hunks: DiffHunk[]): this
  mode(m: DiffMode): this
  showLineNumbers(show: boolean): this
  showMarkers(show: boolean): this
  contextLines(count: number): this
  highlightInline(enabled: boolean): this
  wordWrap(enabled: boolean): this
  labels(oldLabel: string, newLabel: string): this

  // Navigation
  scrollToLine(line: number): this
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  nextHunk(): this
  previousHunk(): this
  nextChange(): this
  previousChange(): this

  // Events
  onHunkSelect(handler: (hunk: DiffHunk, index: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly hunkCount: number
  readonly lineCount: number
  readonly currentHunkIndex: number
  readonly additions: number
  readonly deletions: number
}

// ============================================================
// Implementation
// ============================================================

class DiffViewerNodeImpl extends LeafNode implements DiffViewerNode {
  readonly type = 'diffviewer' as const

  private _hunks: DiffHunk[] = []
  private _flatLines: DiffLine[] = []
  private _mode: DiffMode = 'unified'
  private _showLineNumbers: boolean = true
  private _showMarkers: boolean = true
  private _contextLines: number = 3
  private _highlightInline: boolean = true
  private _wordWrap: boolean = false
  private _oldLabel: string = 'a'
  private _newLabel: string = 'b'

  private _scrollOffset: number = 0
  private _currentHunkIndex: number = 0
  private _currentLineIndex: number = 0
  private _isFocused: boolean = false

  private _onHunkSelectHandlers: ((hunk: DiffHunk, index: number) => void)[] = []

  constructor(props?: DiffViewerProps) {
    super()
    if (props) {
      if (props.diff) this.parseDiff(props.diff)
      if (props.mode) this._mode = props.mode
      if (props.showLineNumbers !== undefined) this._showLineNumbers = props.showLineNumbers
      if (props.showMarkers !== undefined) this._showMarkers = props.showMarkers
      if (props.contextLines !== undefined) this._contextLines = props.contextLines
      if (props.highlightInline !== undefined) this._highlightInline = props.highlightInline
      if (props.wordWrap !== undefined) this._wordWrap = props.wordWrap
      if (props.oldLabel) this._oldLabel = props.oldLabel
      if (props.newLabel) this._newLabel = props.newLabel
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get hunkCount(): number {
    return this._hunks.length
  }

  get lineCount(): number {
    return this._flatLines.length
  }

  get currentHunkIndex(): number {
    return this._currentHunkIndex
  }

  get additions(): number {
    return this._flatLines.filter((l) => l.type === 'addition').length
  }

  get deletions(): number {
    return this._flatLines.filter((l) => l.type === 'deletion').length
  }

  /** Get current configuration (for debugging/testing) */
  get config(): {
    contextLines: number
    highlightInline: boolean
    wordWrap: boolean
    oldLabel: string
    newLabel: string
  } {
    return {
      contextLines: this._contextLines,
      highlightInline: this._highlightInline,
      wordWrap: this._wordWrap,
      oldLabel: this._oldLabel,
      newLabel: this._newLabel
    }
  }

  // Parse unified diff format
  private parseDiff(content: string): void {
    const lines = content.split('\n')
    const hunks: DiffHunk[] = []
    let currentHunk: DiffHunk | null = null
    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
      // Hunk header: @@ -start,count +start,count @@
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk)
        }
        oldLine = parseInt(hunkMatch[1] ?? '1', 10)
        newLine = parseInt(hunkMatch[3] ?? '1', 10)
        currentHunk = {
          oldStart: oldLine,
          oldCount: parseInt(hunkMatch[2] ?? '1', 10),
          newStart: newLine,
          newCount: parseInt(hunkMatch[4] ?? '1', 10),
          lines: [{ type: 'header', content: line }]
        }
        continue
      }

      if (!currentHunk) {
        // File header lines
        if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff ')) {
          // Add as info line
          if (hunks.length === 0 && !currentHunk) {
            currentHunk = {
              oldStart: 0,
              oldCount: 0,
              newStart: 0,
              newCount: 0,
              lines: []
            }
          }
        }
        continue
      }

      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'addition',
          content: line.slice(1),
          newLineNumber: newLine++
        })
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'deletion',
          content: line.slice(1),
          oldLineNumber: oldLine++
        })
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNumber: oldLine++,
          newLineNumber: newLine++
        })
      } else if (line.startsWith('\\')) {
        // "\ No newline at end of file"
        currentHunk.lines.push({
          type: 'info',
          content: line
        })
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk)
    }

    this._hunks = hunks
    this.flattenLines()
  }

  private flattenLines(): void {
    this._flatLines = []
    for (const hunk of this._hunks) {
      this._flatLines.push(...hunk.lines)
    }
  }

  // Configuration
  diff(content: string): this {
    this.parseDiff(content)
    this._scrollOffset = 0
    this._currentHunkIndex = 0
    this._currentLineIndex = 0
    this.markDirty()
    return this
  }

  setHunks(hunks: DiffHunk[]): this {
    this._hunks = hunks
    this.flattenLines()
    this._scrollOffset = 0
    this._currentHunkIndex = 0
    this._currentLineIndex = 0
    this.markDirty()
    return this
  }

  mode(m: DiffMode): this {
    this._mode = m
    this.markDirty()
    return this
  }

  showLineNumbers(show: boolean): this {
    this._showLineNumbers = show
    this.markDirty()
    return this
  }

  showMarkers(show: boolean): this {
    this._showMarkers = show
    this.markDirty()
    return this
  }

  contextLines(count: number): this {
    this._contextLines = count
    this.markDirty()
    return this
  }

  highlightInline(enabled: boolean): this {
    this._highlightInline = enabled
    this.markDirty()
    return this
  }

  wordWrap(enabled: boolean): this {
    this._wordWrap = enabled
    this.markDirty()
    return this
  }

  labels(oldLabel: string, newLabel: string): this {
    this._oldLabel = oldLabel
    this._newLabel = newLabel
    this.markDirty()
    return this
  }

  // Navigation
  scrollToLine(line: number): this {
    if (line >= 0 && line < this._flatLines.length) {
      this._scrollOffset = line
      this._currentLineIndex = line
      this.markDirty()
    }
    return this
  }

  scrollUp(lines = 1): this {
    if (this._scrollOffset > 0) {
      this._scrollOffset = Math.max(0, this._scrollOffset - lines)
      this.markDirty()
    }
    return this
  }

  scrollDown(lines = 1): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    const maxOffset = Math.max(0, this._flatLines.length - visibleLines)

    if (this._scrollOffset < maxOffset) {
      this._scrollOffset = Math.min(maxOffset, this._scrollOffset + lines)
      this.markDirty()
    }
    return this
  }

  nextHunk(): this {
    if (this._currentHunkIndex < this._hunks.length - 1) {
      this._currentHunkIndex++
      this.scrollToHunk(this._currentHunkIndex)
      this.emitHunkSelectEvent()
    }
    return this
  }

  previousHunk(): this {
    if (this._currentHunkIndex > 0) {
      this._currentHunkIndex--
      this.scrollToHunk(this._currentHunkIndex)
      this.emitHunkSelectEvent()
    }
    return this
  }

  private scrollToHunk(index: number): void {
    let lineIndex = 0
    for (let i = 0; i < index; i++) {
      const hunk = this._hunks[i]
      if (hunk) lineIndex += hunk.lines.length
    }
    this._scrollOffset = lineIndex
    this._currentLineIndex = lineIndex
    this.markDirty()
  }

  nextChange(): this {
    // Find next addition or deletion
    for (let i = this._currentLineIndex + 1; i < this._flatLines.length; i++) {
      const line = this._flatLines[i]
      if (line && (line.type === 'addition' || line.type === 'deletion')) {
        this._currentLineIndex = i
        this.ensureLineVisible(i)
        this.markDirty()
        return this
      }
    }
    return this
  }

  previousChange(): this {
    // Find previous addition or deletion
    for (let i = this._currentLineIndex - 1; i >= 0; i--) {
      const line = this._flatLines[i]
      if (line && (line.type === 'addition' || line.type === 'deletion')) {
        this._currentLineIndex = i
        this.ensureLineVisible(i)
        this.markDirty()
        return this
      }
    }
    return this
  }

  private ensureLineVisible(index: number): void {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10

    if (index < this._scrollOffset) {
      this._scrollOffset = index
    } else if (index >= this._scrollOffset + visibleLines) {
      this._scrollOffset = index - visibleLines + 1
    }
  }

  private emitHunkSelectEvent(): void {
    const hunk = this._hunks[this._currentHunkIndex]
    if (hunk) {
      for (const handler of this._onHunkSelectHandlers) {
        handler(hunk, this._currentHunkIndex)
      }
    }
  }

  // Events
  onHunkSelect(handler: (hunk: DiffHunk, index: number) => void): this {
    this._onHunkSelectHandlers.push(handler)
    return this
  }

  /**
   * Dispose of diffviewer and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._hunks = []
    this._flatLines = []
    this._onHunkSelectHandlers = []
    super.dispose()
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
        const pageUp = this._bounds ? this._bounds.height : 10
        this.scrollUp(pageUp)
        return true
      case 'pagedown':
        const pageDown = this._bounds ? this._bounds.height : 10
        this.scrollDown(pageDown)
        return true
      case 'home':
        if (ctrl) {
          this._scrollOffset = 0
          this._currentLineIndex = 0
          this.markDirty()
        }
        return true
      case 'end':
        if (ctrl) {
          const bounds = this._bounds
          const visibleLines = bounds ? bounds.height : 10
          this._scrollOffset = Math.max(0, this._flatLines.length - visibleLines)
          this._currentLineIndex = this._flatLines.length - 1
          this.markDirty()
        }
        return true
      case 'n':
        if (!ctrl) {
          this.nextChange()
          return true
        }
        break
      case 'N':
      case 'p':
        this.previousChange()
        return true
      case ']':
        this.nextHunk()
        return true
      case '[':
        this.previousHunk()
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(_x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      this._isFocused = true
      const clickedIndex = y - bounds.y + this._scrollOffset
      if (clickedIndex >= 0 && clickedIndex < this._flatLines.length) {
        this._currentLineIndex = clickedIndex
        this.markDirty()
        return true
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

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    switch (this._mode) {
      case 'unified':
        this.renderUnified(buffer, bounds, fg, bg)
        break
      case 'split':
        this.renderSplit(buffer, bounds, fg, bg)
        break
      case 'inline':
        this.renderInline(buffer, bounds, fg, bg)
        break
    }
  }

  private renderUnified(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const visibleLines = bounds.height
    const endIndex = Math.min(this._scrollOffset + visibleLines, this._flatLines.length)

    // Calculate column widths
    const markerWidth = this._showMarkers ? 2 : 0
    const lineNumWidth = this._showLineNumbers ? 10 : 0 // "old|new "
    const contentX = bounds.x + markerWidth + lineNumWidth
    const contentWidth = bounds.width - markerWidth - lineNumWidth

    for (let i = this._scrollOffset; i < endIndex; i++) {
      const line = this._flatLines[i]
      if (!line) continue

      const y = bounds.y + (i - this._scrollOffset)
      const isCurrent = this._isFocused && i === this._currentLineIndex

      // Determine colors and markers
      let marker = ' '
      let lineAttrs = 0

      switch (line.type) {
        case 'addition':
          marker = '+'
          lineAttrs = ATTR_BOLD
          break
        case 'deletion':
          marker = '-'
          lineAttrs = ATTR_DIM
          break
        case 'header':
          lineAttrs = ATTR_BOLD | ATTR_INVERSE
          break
        case 'info':
          lineAttrs = ATTR_DIM
          break
        case 'context':
        default:
          marker = ' '
          break
      }

      if (isCurrent) {
        lineAttrs |= ATTR_INVERSE
      }

      // Fill background
      for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
        buffer.set(col, y, { char: ' ', fg, bg, attrs: lineAttrs })
      }

      // Draw marker
      if (this._showMarkers) {
        buffer.set(bounds.x, y, { char: marker, fg, bg, attrs: lineAttrs | ATTR_BOLD })
      }

      // Draw line numbers
      if (this._showLineNumbers && line.type !== 'header' && line.type !== 'info') {
        const oldNum = line.oldLineNumber !== undefined ? String(line.oldLineNumber).padStart(4, ' ') : '    '
        const newNum = line.newLineNumber !== undefined ? String(line.newLineNumber).padStart(4, ' ') : '    '
        const lineNumStr = `${oldNum}|${newNum}`
        buffer.write(bounds.x + markerWidth, y, lineNumStr, { fg, bg, attrs: lineAttrs | ATTR_DIM })
      }

      // Draw content
      if (contentWidth > 0) {
        let content = line.content
        if (stringWidth(content) > contentWidth) {
          content = truncateToWidth(content, contentWidth)
        }
        buffer.write(contentX, y, content, { fg, bg, attrs: lineAttrs })
      }
    }

    // Draw scroll position
    if (this._flatLines.length > visibleLines) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._flatLines.length - visibleLines)
      const indicatorY = bounds.y + Math.floor(scrollPercent * (bounds.height - 1))
      buffer.set(bounds.x + bounds.width - 1, indicatorY, { char: '\u2588', fg, bg, attrs: ATTR_DIM })
    }
  }

  private renderSplit(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    // Split view: old on left, new on right
    const halfWidth = Math.floor((bounds.width - 1) / 2)
    const lineNumWidth = this._showLineNumbers ? 5 : 0

    // Build parallel arrays of old and new lines
    const oldLines: (DiffLine | null)[] = []
    const newLines: (DiffLine | null)[] = []

    for (const line of this._flatLines) {
      if (line.type === 'header' || line.type === 'info') {
        oldLines.push(line)
        newLines.push(line)
      } else if (line.type === 'deletion') {
        oldLines.push(line)
        newLines.push(null)
      } else if (line.type === 'addition') {
        oldLines.push(null)
        newLines.push(line)
      } else {
        oldLines.push(line)
        newLines.push(line)
      }
    }

    const visibleLines = bounds.height
    const endIndex = Math.min(this._scrollOffset + visibleLines, oldLines.length)

    for (let i = this._scrollOffset; i < endIndex; i++) {
      const oldLine = oldLines[i] ?? null
      const newLine = newLines[i] ?? null
      const y = bounds.y + (i - this._scrollOffset)

      // Draw old side
      this.renderSplitLine(buffer, bounds.x, y, halfWidth, oldLine, lineNumWidth, fg, bg, 'old')

      // Draw separator
      buffer.set(bounds.x + halfWidth, y, { char: '\u2502', fg, bg, attrs: ATTR_DIM })

      // Draw new side
      this.renderSplitLine(buffer, bounds.x + halfWidth + 1, y, halfWidth, newLine, lineNumWidth, fg, bg, 'new')
    }
  }

  private renderSplitLine(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    line: DiffLine | null,
    lineNumWidth: number,
    fg: number,
    bg: number,
    side: 'old' | 'new'
  ): void {
    let attrs = 0
    let content = ''
    let lineNum = ''

    if (line) {
      switch (line.type) {
        case 'addition':
          attrs = ATTR_BOLD
          break
        case 'deletion':
          attrs = ATTR_DIM
          break
        case 'header':
          attrs = ATTR_BOLD | ATTR_INVERSE
          break
        case 'info':
          attrs = ATTR_DIM
          break
      }

      content = line.content
      if (this._showLineNumbers) {
        const num = side === 'old' ? line.oldLineNumber : line.newLineNumber
        lineNum = num !== undefined ? String(num).padStart(4, ' ') + ' ' : '     '
      }
    }

    // Fill background
    for (let col = x; col < x + width; col++) {
      buffer.set(col, y, { char: ' ', fg, bg, attrs })
    }

    // Draw line number
    if (this._showLineNumbers) {
      buffer.write(x, y, lineNum, { fg, bg, attrs: attrs | ATTR_DIM })
    }

    // Draw content
    const contentX = x + lineNumWidth
    const contentWidth = width - lineNumWidth
    if (contentWidth > 0 && content) {
      if (stringWidth(content) > contentWidth) {
        content = truncateToWidth(content, contentWidth)
      }
      buffer.write(contentX, y, content, { fg, bg, attrs })
    }
  }

  private renderInline(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    // Inline mode shows changes within lines (simplified version)
    // For now, render similar to unified but with inline markers
    this.renderUnified(buffer, bounds, fg, bg)
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a diff viewer widget.
 *
 * @param props - DiffViewer properties
 * @returns DiffViewer node
 *
 * @example
 * ```typescript
 * // Basic diff viewer
 * const viewer = diffviewer({
 *   diff: unifiedDiffString,
 *   mode: 'unified',
 *   showLineNumbers: true
 * })
 *
 * // Split view
 * const split = diffviewer({
 *   diff: diffContent,
 *   mode: 'split',
 *   labels: ['original.ts', 'modified.ts']
 * })
 *
 * // Interactive navigation
 * const interactive = diffviewer()
 *   .diff(diffContent)
 *   .mode('unified')
 *   .onHunkSelect((hunk, index) => {
 *     console.log(`Hunk ${index}: ${hunk.oldStart}-${hunk.newStart}`)
 *   })
 * ```
 */
export function diffviewer(props?: DiffViewerProps): DiffViewerNode {
  return new DiffViewerNodeImpl(props)
}
