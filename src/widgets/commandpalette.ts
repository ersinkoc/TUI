/**
 * @oxog/tui - Command Palette Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Command item type.
 */
export interface CommandItem {
  /** Command label */
  label: string
  /** Command description */
  description?: string
  /** Command value/action identifier */
  value: string
  /** Keyboard shortcut hint */
  shortcut?: string
  /** Category/group */
  category?: string
  /** Icon character */
  icon?: string
}

/**
 * CommandPalette widget properties.
 */
export interface CommandPaletteProps {
  /** Available commands */
  commands?: CommandItem[]
  /** Placeholder text */
  placeholder?: string
  /** Max visible items */
  maxVisible?: number
  /** Width (in columns) */
  width?: number
}

/**
 * CommandPalette node interface.
 */
export interface CommandPaletteNode extends Node {
  readonly type: 'commandpalette'

  // Configuration
  commands(items: CommandItem[]): this
  placeholder(text: string): this
  maxVisible(count: number): this
  width(value: number): this

  // Control
  open(): this
  close(): this
  toggle(): this

  // Events
  onSelect(handler: (item: CommandItem) => void): this
  onClose(handler: () => void): this
  onChange(handler: (query: string) => void): this

  // State
  readonly isOpen: boolean
  readonly query: string
  readonly selectedIndex: number
  readonly filteredItems: CommandItem[]
}

// ============================================================
// Implementation
// ============================================================

class CommandPaletteNodeImpl extends LeafNode implements CommandPaletteNode {
  readonly type = 'commandpalette' as const

  private _commands: CommandItem[] = []
  private _placeholder: string = 'Type to search...'
  private _maxVisible: number = 10
  private _width: number = 60
  private _isOpen: boolean = false
  private _query: string = ''
  private _selectedIndex: number = 0
  private _scrollOffset: number = 0
  private _filteredItems: CommandItem[] = []

  private _onSelectHandlers: ((item: CommandItem) => void)[] = []
  private _onCloseHandlers: (() => void)[] = []
  private _onChangeHandlers: ((query: string) => void)[] = []

  constructor(props?: CommandPaletteProps) {
    super()
    if (props) {
      if (props.commands) {
        this._commands = props.commands
        this._filteredItems = props.commands
      }
      if (props.placeholder) this._placeholder = props.placeholder
      if (props.maxVisible !== undefined) this._maxVisible = props.maxVisible
      if (props.width !== undefined) this._width = props.width
    }
    // Command palette starts invisible
    this._visible = false
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  get query(): string {
    return this._query
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get filteredItems(): CommandItem[] {
    return this._filteredItems
  }

  // Configuration
  commands(items: CommandItem[]): this {
    this._commands = items
    this.filterItems()
    this.markDirty()
    return this
  }

  placeholder(text: string): this {
    this._placeholder = text
    this.markDirty()
    return this
  }

  maxVisible(count: number): this {
    this._maxVisible = count
    this.markDirty()
    return this
  }

  width(value: number): this {
    this._width = value
    this.markDirty()
    return this
  }

  // Control
  open(): this {
    if (!this._isOpen) {
      this._isOpen = true
      this._visible = true
      this._query = ''
      this._selectedIndex = 0
      this._scrollOffset = 0
      this.filterItems()
      this.markDirty()
    }
    return this
  }

  close(): this {
    if (this._isOpen) {
      this._isOpen = false
      this._visible = false
      this.markDirty()
      for (const handler of this._onCloseHandlers) {
        handler()
      }
    }
    return this
  }

  toggle(): this {
    return this._isOpen ? this.close() : this.open()
  }

  // Events
  onSelect(handler: (item: CommandItem) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onClose(handler: () => void): this {
    this._onCloseHandlers.push(handler)
    return this
  }

  onChange(handler: (query: string) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  // Internal: Filter items based on query
  private filterItems(): void {
    if (this._query === '') {
      this._filteredItems = this._commands
    } else {
      const query = this._query.toLowerCase()

      // Score and filter items
      const scored = this._commands
        .map(item => ({
          item,
          score: this.fuzzyScore(item.label.toLowerCase(), query) +
                 this.fuzzyScore((item.description || '').toLowerCase(), query) * 0.5 +
                 this.fuzzyScore((item.category || '').toLowerCase(), query) * 0.3
        }))
        .filter(({ score }) => score > 0)

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score)

      this._filteredItems = scored.map(({ item }) => item)
    }

    // Reset selection if out of bounds
    if (this._selectedIndex >= this._filteredItems.length) {
      this._selectedIndex = Math.max(0, this._filteredItems.length - 1)
    }
    this._scrollOffset = 0
  }

  /**
   * Advanced fuzzy matching with scoring.
   * Higher scores indicate better matches.
   *
   * Scoring factors:
   * - Exact match: highest score
   * - Starts with query: high score
   * - Consecutive character matches: bonus
   * - Word boundary matches: bonus
   * - Shorter strings with matches: slight bonus
   */
  private fuzzyScore(text: string, query: string): number {
    if (!text || !query) return 0
    if (text === query) return 100 // Exact match
    if (text.startsWith(query)) return 90 + (query.length / text.length) * 10

    let score = 0
    let queryIndex = 0
    let consecutiveBonus = 0
    let lastMatchIndex = -2

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        // Base score for match
        score += 10

        // Consecutive match bonus
        if (i === lastMatchIndex + 1) {
          consecutiveBonus += 5
          score += consecutiveBonus
        } else {
          consecutiveBonus = 0
        }

        // Word boundary bonus (start of word)
        if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '-' || text[i - 1] === '_') {
          score += 15
        }

        // Uppercase letter bonus (camelCase boundary)
        if (text[i] !== text[i].toLowerCase() && i > 0) {
          score += 10
        }

        lastMatchIndex = i
        queryIndex++
      }
    }

    // Return 0 if query didn't fully match
    if (queryIndex !== query.length) return 0

    // Bonus for shorter strings (query covers more of the text)
    score += (query.length / text.length) * 20

    return score
  }

  // Simple fuzzy matching (for backwards compatibility)
  private fuzzyMatch(text: string, query: string): boolean {
    return this.fuzzyScore(text, query) > 0
  }

  private ensureVisible(): void {
    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + this._maxVisible) {
      this._scrollOffset = this._selectedIndex - this._maxVisible + 1
    }
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isOpen) return false

    switch (key) {
      case 'escape':
        this.close()
        return true

      case 'enter':
        if (this._filteredItems.length > 0) {
          const item = this._filteredItems[this._selectedIndex]
          if (item) {
            for (const handler of this._onSelectHandlers) {
              handler(item)
            }
            this.close()
          }
        }
        return true

      case 'up':
        if (this._selectedIndex > 0) {
          this._selectedIndex--
          this.ensureVisible()
          this.markDirty()
        }
        return true

      case 'down':
        if (this._selectedIndex < this._filteredItems.length - 1) {
          this._selectedIndex++
          this.ensureVisible()
          this.markDirty()
        }
        return true

      case 'backspace':
        if (this._query.length > 0) {
          this._query = this._query.slice(0, -1)
          this.filterItems()
          this.markDirty()
          for (const handler of this._onChangeHandlers) {
            handler(this._query)
          }
        }
        return true

      default:
        // Insert printable character
        if (key.length === 1) {
          this._query += key
          this.filterItems()
          this.markDirty()
          for (const handler of this._onChangeHandlers) {
            handler(this._query)
          }
          return true
        }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._isOpen) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const width = this._width
    const visibleItems = Math.min(this._filteredItems.length, this._maxVisible)
    const height = visibleItems + 3 // input + border + items

    // Center horizontally
    const screenWidth = buffer.width
    const screenHeight = buffer.height
    const posX = Math.floor((screenWidth - width) / 2)
    const posY = Math.max(2, Math.floor((screenHeight - height) / 4)) // Upper third

    // Draw backdrop (dimmed)
    for (let row = 0; row < screenHeight; row++) {
      for (let col = 0; col < screenWidth; col++) {
        const cell = buffer.get(col, row)
        if (cell) {
          buffer.set(col, row, { ...cell, attrs: (cell.attrs || 0) | ATTR_DIM })
        }
      }
    }

    // Draw background
    for (let row = posY; row < posY + height; row++) {
      for (let col = posX; col < posX + width; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    const chars = BORDER_CHARS['rounded']
    drawRect(buffer, posX, posY, width, height, chars, { fg, bg, attrs: 0 })

    // Draw input area
    const inputY = posY + 1
    const inputX = posX + 2
    const inputWidth = width - 4

    // Input prefix (search icon)
    buffer.write(inputX - 1, inputY, '>', { fg, bg, attrs: ATTR_BOLD })

    // Input text or placeholder
    if (this._query.length > 0) {
      let displayQuery = this._query
      if (stringWidth(displayQuery) > inputWidth - 1) {
        displayQuery = truncateToWidth(displayQuery, inputWidth - 1)
      }
      buffer.write(inputX, inputY, displayQuery, { fg, bg, attrs: 0 })
      // Cursor
      const cursorX = inputX + stringWidth(displayQuery)
      if (cursorX < inputX + inputWidth) {
        buffer.set(cursorX, inputY, { char: '█', fg, bg, attrs: 0 })
      }
    } else {
      buffer.write(inputX, inputY, this._placeholder, { fg, bg, attrs: ATTR_DIM })
    }

    // Draw separator line
    const sepY = posY + 2
    buffer.set(posX, sepY, { char: '\u251c', fg, bg, attrs: 0 }) // ├
    for (let col = posX + 1; col < posX + width - 1; col++) {
      buffer.set(col, sepY, { char: chars.horizontal, fg, bg, attrs: 0 })
    }
    buffer.set(posX + width - 1, sepY, { char: '\u2524', fg, bg, attrs: 0 }) // ┤

    // Draw items
    const itemsStartY = sepY + 1
    for (let i = 0; i < visibleItems; i++) {
      const itemIndex = this._scrollOffset + i
      const item = this._filteredItems[itemIndex]
      if (!item) continue

      const itemY = itemsStartY + i
      const isSelected = itemIndex === this._selectedIndex
      const attrs = isSelected ? ATTR_INVERSE : 0

      // Build item text
      let text = ''
      if (item.icon) {
        text += item.icon + ' '
      }
      text += item.label

      // Add description (dimmed)
      const labelWidth = stringWidth(text)
      const contentWidth = width - 4

      if (item.shortcut) {
        const shortcutWidth = stringWidth(item.shortcut)
        const space = contentWidth - labelWidth - shortcutWidth
        if (space > 2) {
          text = padToWidth(text, contentWidth - shortcutWidth - 1, 'left')
          text += item.shortcut
        }
      } else if (item.description) {
        const descWidth = stringWidth(item.description)
        const space = contentWidth - labelWidth - descWidth - 2
        if (space > 0) {
          text += ' '.repeat(space + 2) + item.description
        }
      }

      // Truncate if needed
      if (stringWidth(text) > contentWidth) {
        text = truncateToWidth(text, contentWidth)
      }

      // Pad to fill width
      text = padToWidth(text, contentWidth, 'left')

      buffer.write(posX + 2, itemY, text, { fg, bg, attrs })
    }

    // Draw "no results" message if empty
    if (this._filteredItems.length === 0 && this._query.length > 0) {
      const noResults = 'No matching commands'
      const noResultsX = posX + Math.floor((width - stringWidth(noResults)) / 2)
      buffer.write(noResultsX, itemsStartY, noResults, { fg, bg, attrs: ATTR_DIM })
    }

    // Draw scroll indicators
    if (this._scrollOffset > 0) {
      buffer.set(posX + width - 2, itemsStartY, {
        char: '\u25b2', // ▲
        fg,
        bg,
        attrs: ATTR_DIM
      })
    }
    if (this._scrollOffset + visibleItems < this._filteredItems.length) {
      buffer.set(posX + width - 2, itemsStartY + visibleItems - 1, {
        char: '\u25bc', // ▼
        fg,
        bg,
        attrs: ATTR_DIM
      })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a command palette widget.
 *
 * @param props - CommandPalette properties
 * @returns CommandPalette node
 *
 * @example
 * ```typescript
 * // Basic command palette
 * const palette = commandpalette()
 *   .commands([
 *     { label: 'Open File', value: 'file.open', shortcut: 'Ctrl+O' },
 *     { label: 'Save File', value: 'file.save', shortcut: 'Ctrl+S' },
 *     { label: 'Find', value: 'edit.find', shortcut: 'Ctrl+F' },
 *     { label: 'Replace', value: 'edit.replace', shortcut: 'Ctrl+H' },
 *     { label: 'Go to Line', value: 'edit.goto', shortcut: 'Ctrl+G' },
 *     { label: 'Toggle Terminal', value: 'view.terminal', shortcut: 'Ctrl+`' }
 *   ])
 *   .placeholder('Type a command...')
 *   .onSelect(item => {
 *     console.log('Execute:', item.value)
 *   })
 *
 * // Open with Ctrl+P
 * app.on('key', event => {
 *   if (event.ctrl && event.name === 'p') {
 *     palette.open()
 *   }
 * })
 *
 * // With categories
 * const commands = commandpalette()
 *   .commands([
 *     { label: 'New File', value: 'file.new', category: 'File' },
 *     { label: 'New Folder', value: 'folder.new', category: 'File' },
 *     { label: 'Run Build', value: 'build.run', category: 'Build' },
 *     { label: 'Run Tests', value: 'test.run', category: 'Test' }
 *   ])
 * ```
 */
export function commandpalette(props?: CommandPaletteProps): CommandPaletteNode {
  return new CommandPaletteNodeImpl(props)
}
