/**
 * @oxog/tui - LogViewer Widget
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
 * Log level.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Log entry.
 */
export interface LogEntry {
  /** Timestamp */
  timestamp?: Date | string
  /** Log level */
  level: LogLevel
  /** Log message */
  message: string
  /** Source/logger name */
  source?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

/**
 * LogViewer widget properties.
 */
export interface LogViewerProps {
  /** Initial log entries */
  entries?: LogEntry[]
  /** Maximum entries to keep */
  maxEntries?: number
  /** Show timestamps */
  showTimestamps?: boolean
  /** Show log levels */
  showLevels?: boolean
  /** Show source */
  showSource?: boolean
  /** Minimum visible level */
  minLevel?: LogLevel
  /** Auto-scroll to bottom */
  autoScroll?: boolean
  /** Timestamp format */
  timestampFormat?: 'full' | 'time' | 'relative'
  /** Wrap long lines */
  wordWrap?: boolean
  /** Enable filtering */
  filterable?: boolean
}

/**
 * LogViewer node interface.
 */
export interface LogViewerNode extends Node {
  readonly type: 'logviewer'

  // Configuration
  entries(entries: LogEntry[]): this
  addEntry(entry: LogEntry): this
  addEntries(entries: LogEntry[]): this
  clear(): this
  maxEntries(count: number): this
  showTimestamps(show: boolean): this
  showLevels(show: boolean): this
  showSource(show: boolean): this
  minLevel(level: LogLevel): this
  autoScroll(enabled: boolean): this
  timestampFormat(format: 'full' | 'time' | 'relative'): this
  wordWrap(enabled: boolean): this
  filter(text: string): this
  clearFilter(): this

  // Navigation
  scrollToTop(): this
  scrollToBottom(): this
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  pageUp(): this
  pageDown(): this
  nextError(): this
  previousError(): this

  // Events
  onEntrySelect(handler: (entry: LogEntry, index: number) => void): this
  onFilter(handler: (filteredCount: number) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly entryCount: number
  readonly visibleCount: number
  readonly errorCount: number
  readonly warnCount: number
  readonly currentFilter: string
}

// ============================================================
// Implementation
// ============================================================

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
}

const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  trace: '\u2022', // •
  debug: '\u2219', // ∙
  info: '\u2139',  // ℹ
  warn: '\u26a0',  // ⚠
  error: '\u2718', // ✘
  fatal: '\u2620'  // ☠
}

class LogViewerNodeImpl extends LeafNode implements LogViewerNode {
  readonly type = 'logviewer' as const

  private _entries: LogEntry[] = []
  private _filteredEntries: LogEntry[] = []
  private _maxEntries: number = 10000
  private _showTimestamps: boolean = true
  private _showLevels: boolean = true
  private _showSource: boolean = true
  private _minLevel: LogLevel = 'trace'
  private _autoScroll: boolean = true
  private _timestampFormat: 'full' | 'time' | 'relative' = 'time'
  private _wordWrap: boolean = false
  private _filterText: string = ''

  /** Get word wrap setting */
  get wordWrapEnabled(): boolean { return this._wordWrap }

  private _scrollOffset: number = 0
  private _selectedIndex: number = -1
  private _isFocused: boolean = false

  private _onEntrySelectHandlers: ((entry: LogEntry, index: number) => void)[] = []
  private _onFilterHandlers: ((filteredCount: number) => void)[] = []

  constructor(props?: LogViewerProps) {
    super()
    if (props) {
      // Set all configuration options BEFORE processing entries
      if (props.maxEntries !== undefined) this._maxEntries = props.maxEntries
      if (props.showTimestamps !== undefined) this._showTimestamps = props.showTimestamps
      if (props.showLevels !== undefined) this._showLevels = props.showLevels
      if (props.showSource !== undefined) this._showSource = props.showSource
      if (props.minLevel) this._minLevel = props.minLevel
      if (props.autoScroll !== undefined) this._autoScroll = props.autoScroll
      if (props.timestampFormat) this._timestampFormat = props.timestampFormat
      if (props.wordWrap !== undefined) this._wordWrap = props.wordWrap

      // Now process entries with correct filter settings
      if (props.entries) {
        this._entries = [...props.entries]
        this.applyFilter()
      }
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get entryCount(): number {
    return this._entries.length
  }

  get visibleCount(): number {
    return this._filteredEntries.length
  }

  get errorCount(): number {
    return this._entries.filter((e) => e.level === 'error' || e.level === 'fatal').length
  }

  get warnCount(): number {
    return this._entries.filter((e) => e.level === 'warn').length
  }

  get currentFilter(): string {
    return this._filterText
  }

  // Apply filter and level
  private applyFilter(): void {
    const minLevelNum = LOG_LEVEL_ORDER[this._minLevel]

    this._filteredEntries = this._entries.filter((entry) => {
      // Level filter
      if (LOG_LEVEL_ORDER[entry.level] < minLevelNum) {
        return false
      }

      // Text filter
      if (this._filterText) {
        const searchText = this._filterText.toLowerCase()
        const matchesMessage = entry.message.toLowerCase().includes(searchText)
        const matchesSource = entry.source?.toLowerCase().includes(searchText) ?? false
        if (!matchesMessage && !matchesSource) {
          return false
        }
      }

      return true
    })

    for (const handler of this._onFilterHandlers) {
      handler(this._filteredEntries.length)
    }
  }

  // Configuration
  entries(entries: LogEntry[]): this {
    this._entries = entries.slice(-this._maxEntries)
    this.applyFilter()
    this._scrollOffset = 0
    if (this._autoScroll) {
      this.scrollToBottomInternal()
    }
    this.markDirty()
    return this
  }

  addEntry(entry: LogEntry): this {
    this._entries.push(entry)
    if (this._entries.length > this._maxEntries) {
      this._entries.shift()
    }
    this.applyFilter()
    if (this._autoScroll) {
      this.scrollToBottomInternal()
    }
    this.markDirty()
    return this
  }

  addEntries(entries: LogEntry[]): this {
    this._entries.push(...entries)
    while (this._entries.length > this._maxEntries) {
      this._entries.shift()
    }
    this.applyFilter()
    if (this._autoScroll) {
      this.scrollToBottomInternal()
    }
    this.markDirty()
    return this
  }

  clear(): this {
    this._entries = []
    this._filteredEntries = []
    this._scrollOffset = 0
    this._selectedIndex = -1
    this.markDirty()
    return this
  }

  maxEntries(count: number): this {
    this._maxEntries = count
    if (this._entries.length > count) {
      this._entries = this._entries.slice(-count)
      this.applyFilter()
    }
    this.markDirty()
    return this
  }

  showTimestamps(show: boolean): this {
    this._showTimestamps = show
    this.markDirty()
    return this
  }

  showLevels(show: boolean): this {
    this._showLevels = show
    this.markDirty()
    return this
  }

  showSource(show: boolean): this {
    this._showSource = show
    this.markDirty()
    return this
  }

  minLevel(level: LogLevel): this {
    this._minLevel = level
    this.applyFilter()
    this.markDirty()
    return this
  }

  autoScroll(enabled: boolean): this {
    this._autoScroll = enabled
    if (enabled) {
      this.scrollToBottomInternal()
    }
    this.markDirty()
    return this
  }

  timestampFormat(format: 'full' | 'time' | 'relative'): this {
    this._timestampFormat = format
    this.markDirty()
    return this
  }

  wordWrap(enabled: boolean): this {
    this._wordWrap = enabled
    this.markDirty()
    return this
  }

  filter(text: string): this {
    this._filterText = text
    this.applyFilter()
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  clearFilter(): this {
    this._filterText = ''
    this.applyFilter()
    this.markDirty()
    return this
  }

  // Navigation
  scrollToTop(): this {
    this._scrollOffset = 0
    this._autoScroll = false
    this.markDirty()
    return this
  }

  scrollToBottom(): this {
    this.scrollToBottomInternal()
    this._autoScroll = true
    this.markDirty()
    return this
  }

  private scrollToBottomInternal(): void {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    this._scrollOffset = Math.max(0, this._filteredEntries.length - visibleLines)
  }

  scrollUp(lines = 1): this {
    if (this._scrollOffset > 0) {
      this._scrollOffset = Math.max(0, this._scrollOffset - lines)
      this._autoScroll = false
      this.markDirty()
    }
    return this
  }

  scrollDown(lines = 1): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    const maxOffset = Math.max(0, this._filteredEntries.length - visibleLines)

    if (this._scrollOffset < maxOffset) {
      this._scrollOffset = Math.min(maxOffset, this._scrollOffset + lines)
      this.markDirty()
    }

    // Re-enable auto-scroll if at bottom
    if (this._scrollOffset >= maxOffset) {
      this._autoScroll = true
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

  nextError(): this {
    for (let i = this._selectedIndex + 1; i < this._filteredEntries.length; i++) {
      const entry = this._filteredEntries[i]
      if (!entry) continue
      if (entry.level === 'error' || entry.level === 'fatal') {
        this._selectedIndex = i
        this.ensureSelectedVisible()
        this.markDirty()
        return this
      }
    }
    return this
  }

  previousError(): this {
    const start = this._selectedIndex < 0 ? this._filteredEntries.length : this._selectedIndex
    for (let i = start - 1; i >= 0; i--) {
      const entry = this._filteredEntries[i]
      if (!entry) continue
      if (entry.level === 'error' || entry.level === 'fatal') {
        this._selectedIndex = i
        this.ensureSelectedVisible()
        this.markDirty()
        return this
      }
    }
    return this
  }

  private ensureSelectedVisible(): void {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10

    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
      this._autoScroll = false
    } else if (this._selectedIndex >= this._scrollOffset + visibleLines) {
      this._scrollOffset = this._selectedIndex - visibleLines + 1
      this._autoScroll = false
    }
  }

  // Events
  onEntrySelect(handler: (entry: LogEntry, index: number) => void): this {
    this._onEntrySelectHandlers.push(handler)
    return this
  }

  onFilter(handler: (filteredCount: number) => void): this {
    this._onFilterHandlers.push(handler)
    return this
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
        if (ctrl) {
          this.scrollToTop()
        }
        return true
      case 'end':
        if (ctrl) {
          this.scrollToBottom()
        }
        return true
      case 'g':
        if (!ctrl) {
          this.scrollToTop()
          return true
        }
        break
      case 'G':
        this.scrollToBottom()
        return true
      case 'e':
        this.nextError()
        return true
      case 'E':
        this.previousError()
        return true
      case 'enter':
        if (this._selectedIndex >= 0 && this._selectedIndex < this._filteredEntries.length) {
          const entry = this._filteredEntries[this._selectedIndex]
          if (entry) {
            for (const handler of this._onEntrySelectHandlers) {
              handler(entry, this._selectedIndex)
            }
          }
        }
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
      if (clickedIndex >= 0 && clickedIndex < this._filteredEntries.length) {
        this._selectedIndex = clickedIndex
        this._autoScroll = false
        this.markDirty()

        const entry = this._filteredEntries[clickedIndex]
        if (entry) {
          for (const handler of this._onEntrySelectHandlers) {
            handler(entry, clickedIndex)
          }
        }
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

  // Format timestamp
  private formatTimestamp(ts: Date | string | undefined): string {
    if (!ts) return ''

    const date = typeof ts === 'string' ? new Date(ts) : ts
    if (isNaN(date.getTime())) return String(ts)

    switch (this._timestampFormat) {
      case 'full':
        return date.toISOString()
      case 'time':
        return date.toTimeString().slice(0, 8)
      case 'relative':
        const diff = Date.now() - date.getTime()
        if (diff < 1000) return 'now'
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return `${Math.floor(diff / 86400000)}d ago`
      default:
        return date.toTimeString().slice(0, 8)
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const visibleLines = bounds.height
    const endIndex = Math.min(this._scrollOffset + visibleLines, this._filteredEntries.length)

    // Calculate column widths
    const timestampWidth = this._showTimestamps ? 12 : 0
    const levelWidth = this._showLevels ? 3 : 0
    const sourceWidth = this._showSource ? 15 : 0
    const messageX = bounds.x + timestampWidth + levelWidth + sourceWidth
    const messageWidth = bounds.width - timestampWidth - levelWidth - sourceWidth

    for (let i = this._scrollOffset; i < endIndex; i++) {
      const entry = this._filteredEntries[i]
      if (!entry) continue
      const y = bounds.y + (i - this._scrollOffset)
      const isSelected = this._isFocused && i === this._selectedIndex

      // Determine style based on level
      let levelAttrs = 0
      switch (entry.level) {
        case 'trace':
        case 'debug':
          levelAttrs = ATTR_DIM
          break
        case 'info':
          levelAttrs = 0
          break
        case 'warn':
          levelAttrs = ATTR_BOLD
          break
        case 'error':
        case 'fatal':
          levelAttrs = ATTR_BOLD
          break
      }

      if (isSelected) {
        levelAttrs |= ATTR_INVERSE
      }

      // Fill background
      for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
        buffer.set(col, y, { char: ' ', fg, bg, attrs: levelAttrs })
      }

      let currentX = bounds.x

      // Draw timestamp
      if (this._showTimestamps) {
        const ts = this.formatTimestamp(entry.timestamp)
        const tsStr = padToWidth(ts, timestampWidth - 1, 'left')
        buffer.write(currentX, y, tsStr, { fg, bg, attrs: levelAttrs | ATTR_DIM })
        currentX += timestampWidth
      }

      // Draw level icon
      if (this._showLevels) {
        const icon = LOG_LEVEL_ICONS[entry.level]
        buffer.set(currentX, y, { char: icon, fg, bg, attrs: levelAttrs })
        currentX += levelWidth
      }

      // Draw source
      if (this._showSource && entry.source) {
        let src = truncateToWidth(entry.source, sourceWidth - 1)
        src = padToWidth(src, sourceWidth - 1, 'left')
        buffer.write(currentX, y, src, { fg, bg, attrs: levelAttrs | ATTR_DIM })
        currentX += sourceWidth
      } else if (this._showSource) {
        currentX += sourceWidth
      }

      // Draw message
      if (messageWidth > 0) {
        let message = entry.message
        if (stringWidth(message) > messageWidth) {
          message = truncateToWidth(message, messageWidth)
        }
        buffer.write(messageX, y, message, { fg, bg, attrs: levelAttrs })
      }
    }

    // Draw scroll indicator
    if (this._filteredEntries.length > visibleLines) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._filteredEntries.length - visibleLines)
      const indicatorY = bounds.y + Math.floor(scrollPercent * (bounds.height - 1))
      buffer.set(bounds.x + bounds.width - 1, indicatorY, { char: '\u2588', fg, bg, attrs: ATTR_DIM })
    }
  }

  /**
   * Dispose of log viewer and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._entries = []
    this._filteredEntries = []
    this._onEntrySelectHandlers = []
    this._onFilterHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a log viewer widget.
 *
 * @param props - LogViewer properties
 * @returns LogViewer node
 *
 * @example
 * ```typescript
 * // Basic log viewer
 * const logs = logviewer({
 *   showTimestamps: true,
 *   showLevels: true,
 *   autoScroll: true
 * })
 *
 * // Add log entries
 * logs.addEntry({
 *   timestamp: new Date(),
 *   level: 'info',
 *   message: 'Application started',
 *   source: 'main'
 * })
 *
 * logs.addEntry({
 *   timestamp: new Date(),
 *   level: 'error',
 *   message: 'Failed to connect to database',
 *   source: 'db'
 * })
 *
 * // Filter logs
 * logs.filter('error')
 * logs.minLevel('warn')
 *
 * // Navigate errors
 * logs.nextError()
 * logs.previousError()
 * ```
 */
export function logviewer(props?: LogViewerProps): LogViewerNode {
  return new LogViewerNodeImpl(props)
}
