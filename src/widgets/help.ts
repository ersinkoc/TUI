/**
 * @oxog/tui - Help Widget
 * @packageDocumentation
 *
 * Contextual help and command discovery widget.
 * Shows keyboard shortcuts, commands, and documentation.
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { ContainerNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_DIM, ATTR_UNDERLINE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Help item definition.
 */
export interface HelpItem {
  /** Keyboard shortcut or command */
  key: string
  /** Description of what it does */
  description: string
  /** Category for grouping */
  category?: string
  /** Context where this is available */
  context?: string
  /** Whether this is a command (vs shortcut) */
  isCommand?: boolean
}

/**
 * Help section with grouped items.
 */
export interface HelpSection {
  /** Section title */
  title: string
  /** Items in this section */
  items: HelpItem[]
  /** Section icon (optional) */
  icon?: string
}

/**
 * Help widget properties.
 */
export interface HelpProps {
  /** Widget title */
  title?: string
  /** Widget width */
  width?: Dimension
  /** Widget height */
  height?: Dimension
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold'
  /** Show search input */
  searchable?: boolean
  /** Center the widget */
  centered?: boolean
  /** Show backdrop */
  backdrop?: boolean
  /** Close on escape */
  closeOnEscape?: boolean
}

/**
 * Help widget node interface.
 */
export interface HelpNode extends Node {
  readonly type: 'help'

  // Configuration
  title(text: string): this
  width(value: Dimension): this
  height(value: Dimension): this
  border(style: 'single' | 'double' | 'rounded' | 'bold'): this
  searchable(enabled: boolean): this
  centered(enabled: boolean): this
  backdrop(enabled: boolean): this
  closeOnEscape(enabled: boolean): this

  // Content
  addItem(item: HelpItem): this
  addItems(items: HelpItem[]): this
  addSection(section: HelpSection): this
  setSections(sections: HelpSection[]): this
  clearItems(): this

  // Control
  open(): this
  close(): this
  toggle(): this

  // Navigation
  scrollUp(lines?: number): this
  scrollDown(lines?: number): this
  pageUp(): this
  pageDown(): this
  scrollToTop(): this
  scrollToBottom(): this
  search(query: string): this
  clearSearch(): this

  // Events
  onOpen(handler: () => void): this
  onClose(handler: () => void): this
  onSelect(handler: (item: HelpItem) => void): this

  // State
  readonly isOpen: boolean
  readonly currentSearch: string
  readonly visibleItems: HelpItem[]
  readonly scrollOffset: number
}

// ============================================================
// Implementation
// ============================================================

class HelpNodeImpl extends ContainerNode implements HelpNode {
  readonly type = 'help' as const

  private _title: string = 'Help'
  private _border: 'single' | 'double' | 'rounded' | 'bold' = 'rounded'
  private _searchable: boolean = true
  private _centered: boolean = true
  private _backdrop: boolean = true
  private _closeOnEscape: boolean = true
  private _isOpen: boolean = false

  private _sections: HelpSection[] = []
  private _flatItems: HelpItem[] = []
  private _filteredItems: HelpItem[] = []
  private _searchQuery: string = ''
  private _scrollOffset: number = 0
  private _selectedIndex: number = 0
  private _isSearching: boolean = false
  private _searchInputValue: string = ''

  private _onOpenHandlers: (() => void)[] = []
  private _onCloseHandlers: (() => void)[] = []
  private _onSelectHandlers: ((item: HelpItem) => void)[] = []

  constructor(props?: HelpProps) {
    super()
    if (props) {
      if (props.title) this._title = props.title
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
      if (props.border) this._border = props.border
      if (props.searchable !== undefined) this._searchable = props.searchable
      if (props.centered !== undefined) this._centered = props.centered
      if (props.backdrop !== undefined) this._backdrop = props.backdrop
      if (props.closeOnEscape !== undefined) this._closeOnEscape = props.closeOnEscape
    }
    this._visible = false
  }

  // Getters
  get isOpen(): boolean {
    return this._isOpen
  }

  get currentSearch(): string {
    return this._searchQuery
  }

  get visibleItems(): HelpItem[] {
    return this._filteredItems
  }

  get scrollOffset(): number {
    return this._scrollOffset
  }

  // Configuration methods
  title(text: string): this {
    this._title = text
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

  border(style: 'single' | 'double' | 'rounded' | 'bold'): this {
    this._border = style
    this.markDirty()
    return this
  }

  searchable(enabled: boolean): this {
    this._searchable = enabled
    this.markDirty()
    return this
  }

  centered(enabled: boolean): this {
    this._centered = enabled
    this.markDirty()
    return this
  }

  backdrop(enabled: boolean): this {
    this._backdrop = enabled
    this.markDirty()
    return this
  }

  closeOnEscape(enabled: boolean): this {
    this._closeOnEscape = enabled
    return this
  }

  // Content methods
  addItem(item: HelpItem): this {
    // Add to appropriate section or create "General" section
    const category = item.category || 'General'
    let section = this._sections.find(s => s.title === category)
    if (!section) {
      section = { title: category, items: [] }
      this._sections.push(section)
    }
    section.items.push(item)
    this._rebuildFlatItems()
    this.markDirty()
    return this
  }

  addItems(items: HelpItem[]): this {
    for (const item of items) {
      this.addItem(item)
    }
    return this
  }

  addSection(section: HelpSection): this {
    // Merge with existing section if same title
    const existing = this._sections.find(s => s.title === section.title)
    if (existing) {
      existing.items.push(...section.items)
      if (section.icon) existing.icon = section.icon
    } else {
      this._sections.push(section)
    }
    this._rebuildFlatItems()
    this.markDirty()
    return this
  }

  setSections(sections: HelpSection[]): this {
    this._sections = [...sections]
    this._rebuildFlatItems()
    this.markDirty()
    return this
  }

  clearItems(): this {
    this._sections = []
    this._flatItems = []
    this._filteredItems = []
    this._scrollOffset = 0
    this._selectedIndex = 0
    this.markDirty()
    return this
  }

  private _rebuildFlatItems(): void {
    this._flatItems = []
    for (const section of this._sections) {
      for (const item of section.items) {
        this._flatItems.push({
          ...item,
          category: section.title
        })
      }
    }
    this._applyFilter()
  }

  private _applyFilter(): void {
    if (!this._searchQuery) {
      this._filteredItems = [...this._flatItems]
    } else {
      const query = this._searchQuery.toLowerCase()
      this._filteredItems = this._flatItems.filter(item =>
        item.key.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      )
    }
    this._scrollOffset = 0
    this._selectedIndex = 0
  }

  // Control methods
  open(): this {
    if (!this._isOpen) {
      this._isOpen = true
      this._visible = true
      this._scrollOffset = 0
      this._selectedIndex = 0
      this._searchQuery = ''
      this._searchInputValue = ''
      this._isSearching = false
      this._applyFilter()
      this.markDirty()
      for (const handler of this._onOpenHandlers) {
        handler()
      }
    }
    return this
  }

  close(): this {
    if (this._isOpen) {
      this._isOpen = false
      this._visible = false
      this._isSearching = false
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

  // Navigation methods
  scrollUp(lines: number = 1): this {
    this._selectedIndex = Math.max(0, this._selectedIndex - lines)
    this._ensureVisible()
    this.markDirty()
    return this
  }

  scrollDown(lines: number = 1): this {
    this._selectedIndex = Math.min(this._filteredItems.length - 1, this._selectedIndex + lines)
    this._ensureVisible()
    this.markDirty()
    return this
  }

  pageUp(): this {
    const pageSize = this._getPageSize()
    return this.scrollUp(pageSize)
  }

  pageDown(): this {
    const pageSize = this._getPageSize()
    return this.scrollDown(pageSize)
  }

  scrollToTop(): this {
    this._selectedIndex = 0
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  scrollToBottom(): this {
    this._selectedIndex = Math.max(0, this._filteredItems.length - 1)
    this._ensureVisible()
    this.markDirty()
    return this
  }

  search(query: string): this {
    this._searchQuery = query
    this._searchInputValue = query
    this._applyFilter()
    this.markDirty()
    return this
  }

  clearSearch(): this {
    this._searchQuery = ''
    this._searchInputValue = ''
    this._isSearching = false
    this._applyFilter()
    this.markDirty()
    return this
  }

  private _getPageSize(): number {
    const height = typeof this._layout.height === 'number'
      ? this._layout.height
      : Math.floor(this._bounds.height * 0.7)
    return Math.max(1, height - 6) // Account for borders, title, search
  }

  private _ensureVisible(): void {
    const pageSize = this._getPageSize()
    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + pageSize) {
      this._scrollOffset = this._selectedIndex - pageSize + 1
    }
  }

  // Event methods
  onOpen(handler: () => void): this {
    this._onOpenHandlers.push(handler)
    return this
  }

  onClose(handler: () => void): this {
    this._onCloseHandlers.push(handler)
    return this
  }

  onSelect(handler: (item: HelpItem) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  // Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isOpen) return false

    // Handle escape
    if (key === 'escape') {
      if (this._isSearching) {
        this._isSearching = false
        this.clearSearch()
        return true
      }
      if (this._closeOnEscape) {
        this.close()
        return true
      }
    }

    // Handle search mode
    if (this._isSearching) {
      if (key === 'enter') {
        this._isSearching = false
        this.markDirty()
        return true
      }
      if (key === 'backspace') {
        this._searchInputValue = this._searchInputValue.slice(0, -1)
        this._searchQuery = this._searchInputValue
        this._applyFilter()
        this.markDirty()
        return true
      }
      if (key.length === 1 && !ctrl) {
        this._searchInputValue += key
        this._searchQuery = this._searchInputValue
        this._applyFilter()
        this.markDirty()
        return true
      }
      return true
    }

    // Navigation
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
      case 'g':
        this.scrollToTop()
        return true
      case 'end':
        this.scrollToBottom()
        return true
      case '/':
        if (this._searchable) {
          this._isSearching = true
          this._searchInputValue = ''
          this.markDirty()
          return true
        }
        break
      case 'enter':
        if (this._filteredItems[this._selectedIndex]) {
          for (const handler of this._onSelectHandlers) {
            handler(this._filteredItems[this._selectedIndex]!)
          }
          return true
        }
        break
      case 'q':
        this.close()
        return true
    }

    // Ctrl shortcuts
    if (ctrl) {
      switch (key) {
        case 'u':
          this.pageUp()
          return true
        case 'd':
          this.pageDown()
          return true
      }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || !this._isOpen) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Calculate modal dimensions
    let modalWidth = typeof this._layout.width === 'number'
      ? this._layout.width
      : Math.floor(width * 0.7)
    let modalHeight = typeof this._layout.height === 'number'
      ? this._layout.height
      : Math.floor(height * 0.8)

    // Ensure minimum size
    modalWidth = Math.max(40, Math.min(modalWidth, width - 4))
    modalHeight = Math.max(10, Math.min(modalHeight, height - 2))

    // Calculate position
    let modalX = x
    let modalY = y
    if (this._centered) {
      modalX = x + Math.floor((width - modalWidth) / 2)
      modalY = y + Math.floor((height - modalHeight) / 2)
    }

    // Draw backdrop
    if (this._backdrop) {
      for (let row = y; row < y + height; row++) {
        for (let col = x; col < x + width; col++) {
          if (col >= modalX && col < modalX + modalWidth &&
              row >= modalY && row < modalY + modalHeight) {
            continue
          }
          buffer.set(col, row, {
            char: ' ',
            fg,
            bg,
            attrs: ATTR_DIM
          })
        }
      }
    }

    // Draw modal background
    for (let row = modalY; row < modalY + modalHeight; row++) {
      for (let col = modalX; col < modalX + modalWidth; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    const chars = BORDER_CHARS[this._border]
    drawRect(buffer, modalX, modalY, modalWidth, modalHeight, chars, { fg, bg, attrs: 0 })

    // Draw title
    let titleText = ` ${this._title} `
    if (stringWidth(titleText) > modalWidth - 4) {
      titleText = truncateToWidth(titleText, modalWidth - 4)
    }
    const titleX = modalX + Math.floor((modalWidth - stringWidth(titleText)) / 2)
    buffer.write(titleX, modalY, titleText, { fg, bg, attrs: ATTR_BOLD })

    // Draw search bar if searchable
    let contentStartY = modalY + 1
    if (this._searchable) {
      const searchLabel = this._isSearching ? '/' : ' Search: /'
      const searchValue = this._searchInputValue || (this._searchQuery ? this._searchQuery : '')
      const searchText = `${searchLabel}${searchValue}${this._isSearching ? '_' : ''}`

      buffer.write(modalX + 2, contentStartY, truncateToWidth(searchText, modalWidth - 4), {
        fg,
        bg,
        attrs: this._isSearching ? ATTR_BOLD : ATTR_DIM
      })
      contentStartY++

      // Separator - use vertical + horizontal pattern
      buffer.set(modalX, contentStartY, { char: chars.vertical, fg, bg, attrs: 0 })
      for (let col = modalX + 1; col < modalX + modalWidth - 1; col++) {
        buffer.set(col, contentStartY, { char: chars.horizontal, fg, bg, attrs: 0 })
      }
      buffer.set(modalX + modalWidth - 1, contentStartY, { char: chars.vertical, fg, bg, attrs: 0 })
      contentStartY++
    }

    // Calculate content area
    const contentHeight = modalY + modalHeight - contentStartY - 2 // -2 for bottom border and footer
    const contentWidth = modalWidth - 4 // -4 for borders and padding

    // Draw items
    let currentCategory = ''
    let visibleLine = 0
    let itemIndex = 0

    for (let i = 0; i < this._filteredItems.length && visibleLine < contentHeight; i++) {
      const item = this._filteredItems[i]!
      const displayIndex = i

      // Skip items before scroll offset
      if (displayIndex < this._scrollOffset) {
        continue
      }

      // Draw category header if changed
      if (item.category && item.category !== currentCategory) {
        currentCategory = item.category
        if (visibleLine < contentHeight) {
          const categoryText = ` ${currentCategory} `
          buffer.write(modalX + 2, contentStartY + visibleLine, categoryText, {
            fg,
            bg,
            attrs: ATTR_BOLD | ATTR_UNDERLINE
          })
          visibleLine++
        }
      }

      if (visibleLine >= contentHeight) break

      // Draw item
      const isSelected = displayIndex === this._selectedIndex
      const keyWidth = Math.min(15, Math.floor(contentWidth * 0.3))
      const descWidth = contentWidth - keyWidth - 2

      // Format key
      let keyText = item.key
      if (stringWidth(keyText) > keyWidth) {
        keyText = truncateToWidth(keyText, keyWidth)
      } else {
        keyText = keyText.padEnd(keyWidth)
      }

      // Format description
      let descText = item.description
      if (stringWidth(descText) > descWidth) {
        descText = truncateToWidth(descText, descWidth)
      }

      // Draw with selection highlight
      const lineY = contentStartY + visibleLine
      const keyAttrs = isSelected ? ATTR_BOLD : 0
      const descAttrs = isSelected ? 0 : ATTR_DIM

      if (isSelected) {
        // Draw selection background
        for (let col = modalX + 1; col < modalX + modalWidth - 1; col++) {
          buffer.set(col, lineY, { char: ' ', fg: bg, bg: fg, attrs: 0 })
        }
        buffer.write(modalX + 2, lineY, keyText, { fg: bg, bg: fg, attrs: keyAttrs })
        buffer.write(modalX + 2 + keyWidth + 2, lineY, descText, { fg: bg, bg: fg, attrs: descAttrs })
      } else {
        buffer.write(modalX + 2, lineY, keyText, { fg, bg, attrs: keyAttrs })
        buffer.write(modalX + 2 + keyWidth + 2, lineY, descText, { fg, bg, attrs: descAttrs })
      }

      visibleLine++
      itemIndex++
    }

    // Draw footer with help hints
    const footerY = modalY + modalHeight - 1
    const footerText = ' q:Close  /:Search  j/k:Navigate  Enter:Select '
    const footerX = modalX + Math.floor((modalWidth - stringWidth(footerText)) / 2)
    buffer.write(footerX, footerY, footerText, { fg, bg, attrs: ATTR_DIM })

    // Draw scroll indicator
    if (this._filteredItems.length > contentHeight) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._filteredItems.length - contentHeight)
      const indicatorY = contentStartY + Math.floor(scrollPercent * (contentHeight - 1))
      buffer.set(modalX + modalWidth - 2, indicatorY, {
        char: '█',
        fg,
        bg,
        attrs: 0
      })
    }
  }

  /**
   * Dispose of help widget and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._sections = []
    this._flatItems = []
    this._filteredItems = []
    this._onOpenHandlers = []
    this._onCloseHandlers = []
    this._onSelectHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a help widget.
 *
 * @param props - Help widget properties
 * @returns Help node
 *
 * @example
 * ```typescript
 * import { help } from '@oxog/tui'
 *
 * const helpPanel = help({ title: 'Keyboard Shortcuts' })
 *   .addSection({
 *     title: 'Navigation',
 *     items: [
 *       { key: 'j/k', description: 'Move up/down' },
 *       { key: 'h/l', description: 'Move left/right' },
 *       { key: 'g/G', description: 'Go to top/bottom' }
 *     ]
 *   })
 *   .addSection({
 *     title: 'Actions',
 *     items: [
 *       { key: 'Enter', description: 'Select item' },
 *       { key: 'Space', description: 'Toggle selection' },
 *       { key: 'd', description: 'Delete' }
 *     ]
 *   })
 *
 * // Open help
 * helpPanel.open()
 *
 * // Handle selection
 * helpPanel.onSelect(item => {
 *   console.log(`Selected: ${item.key}`)
 * })
 * ```
 */
export function help(props?: HelpProps): HelpNode {
  return new HelpNodeImpl(props)
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create help items from a key-description map.
 */
export function helpItems(
  items: Record<string, string>,
  category?: string
): HelpItem[] {
  return Object.entries(items).map(([key, description]) => {
    const item: HelpItem = { key, description }
    if (category !== undefined) item.category = category
    return item
  })
}

/**
 * Create a help section from a key-description map.
 */
export function helpSection(
  title: string,
  items: Record<string, string>
): HelpSection {
  return {
    title,
    items: Object.entries(items).map(([key, description]) => ({
      key,
      description,
      category: title
    }))
  }
}

/**
 * Common TUI keyboard shortcuts.
 */
export const commonHelpItems: HelpSection[] = [
  {
    title: 'Navigation',
    items: [
      { key: '↑/k', description: 'Move up', category: 'Navigation' },
      { key: '↓/j', description: 'Move down', category: 'Navigation' },
      { key: '←/h', description: 'Move left', category: 'Navigation' },
      { key: '→/l', description: 'Move right', category: 'Navigation' },
      { key: 'g', description: 'Go to top', category: 'Navigation' },
      { key: 'G', description: 'Go to bottom', category: 'Navigation' },
      { key: 'Ctrl+u', description: 'Page up', category: 'Navigation' },
      { key: 'Ctrl+d', description: 'Page down', category: 'Navigation' }
    ]
  },
  {
    title: 'Actions',
    items: [
      { key: 'Enter', description: 'Select/Confirm', category: 'Actions' },
      { key: 'Space', description: 'Toggle', category: 'Actions' },
      { key: 'Esc', description: 'Cancel/Close', category: 'Actions' },
      { key: 'Tab', description: 'Next field', category: 'Actions' },
      { key: 'Shift+Tab', description: 'Previous field', category: 'Actions' }
    ]
  },
  {
    title: 'Search & Filter',
    items: [
      { key: '/', description: 'Start search', category: 'Search & Filter' },
      { key: 'n', description: 'Next match', category: 'Search & Filter' },
      { key: 'N', description: 'Previous match', category: 'Search & Filter' },
      { key: 'Esc', description: 'Clear search', category: 'Search & Filter' }
    ]
  }
]

/**
 * Vim-mode help items.
 */
export const vimHelpItems: HelpSection[] = [
  {
    title: 'Vim Modes',
    items: [
      { key: 'Esc', description: 'Return to normal mode', category: 'Vim Modes' },
      { key: 'i', description: 'Insert mode', category: 'Vim Modes' },
      { key: 'v', description: 'Visual mode', category: 'Vim Modes' },
      { key: ':', description: 'Command mode', category: 'Vim Modes' }
    ]
  },
  {
    title: 'Vim Navigation',
    items: [
      { key: 'h/j/k/l', description: 'Left/Down/Up/Right', category: 'Vim Navigation' },
      { key: 'w/b', description: 'Next/Previous word', category: 'Vim Navigation' },
      { key: '0/$', description: 'Start/End of line', category: 'Vim Navigation' },
      { key: 'gg/G', description: 'Top/Bottom of file', category: 'Vim Navigation' },
      { key: 'Ctrl+f/b', description: 'Page down/up', category: 'Vim Navigation' }
    ]
  },
  {
    title: 'Vim Actions',
    items: [
      { key: 'dd', description: 'Delete line', category: 'Vim Actions' },
      { key: 'yy', description: 'Yank (copy) line', category: 'Vim Actions' },
      { key: 'p', description: 'Paste', category: 'Vim Actions' },
      { key: 'u', description: 'Undo', category: 'Vim Actions' },
      { key: 'Ctrl+r', description: 'Redo', category: 'Vim Actions' },
      { key: ':w', description: 'Save', category: 'Vim Actions' },
      { key: ':q', description: 'Quit', category: 'Vim Actions' },
      { key: ':wq', description: 'Save and quit', category: 'Vim Actions' }
    ]
  }
]
