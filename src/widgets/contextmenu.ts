/**
 * @oxog/tui - Context Menu Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_INVERSE, ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Menu item type.
 */
export interface MenuItem {
  /** Item label */
  label: string
  /** Item value/action */
  value: string
  /** Keyboard shortcut hint */
  shortcut?: string
  /** Item is disabled */
  disabled?: boolean
  /** Separator (label is ignored) */
  separator?: boolean
  /** Submenu items */
  submenu?: MenuItem[]
  /** Icon character */
  icon?: string
}

/**
 * ContextMenu widget properties.
 */
export interface ContextMenuProps {
  /** Menu items */
  items?: MenuItem[]
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Auto-close on selection */
  autoClose?: boolean
  /** Max visible items */
  maxVisible?: number
}

/**
 * ContextMenu node interface.
 */
export interface ContextMenuNode extends Node {
  readonly type: 'contextmenu'

  // Configuration
  items(menuItems: MenuItem[]): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  autoClose(enabled: boolean): this
  maxVisible(count: number): this

  // Control
  show(x: number, y: number): this
  hide(): this
  toggle(x: number, y: number): this

  // Navigation
  selectNext(): this
  selectPrevious(): this
  confirm(): this

  // Events
  onSelect(handler: (item: MenuItem) => void): this
  onClose(handler: () => void): this

  // State
  readonly isVisible: boolean
  readonly selectedIndex: number
  readonly selectedItem: MenuItem | undefined
}

// ============================================================
// Implementation
// ============================================================

class ContextMenuNodeImpl extends LeafNode implements ContextMenuNode {
  readonly type = 'contextmenu' as const

  private _items: MenuItem[] = []
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'rounded'
  private _autoClose: boolean = true
  private _maxVisible: number = 10
  private _selectedIndex: number = 0
  private _scrollOffset: number = 0
  private _posX: number = 0
  private _posY: number = 0

  private _onSelectHandlers: ((item: MenuItem) => void)[] = []
  private _onCloseHandlers: (() => void)[] = []

  constructor(props?: ContextMenuProps) {
    super()
    if (props) {
      if (props.items) this._items = props.items
      if (props.border) this._border = props.border
      if (props.autoClose !== undefined) this._autoClose = props.autoClose
      if (props.maxVisible !== undefined) this._maxVisible = props.maxVisible
    }
    // Context menu starts invisible
    this._visible = false
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get selectedItem(): MenuItem | undefined {
    return this._items[this._selectedIndex]
  }

  // Configuration
  items(menuItems: MenuItem[]): this {
    this._items = menuItems
    this._selectedIndex = this.findNextSelectable(0, 1)
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  autoClose(enabled: boolean): this {
    this._autoClose = enabled
    return this
  }

  maxVisible(count: number): this {
    this._maxVisible = count
    this.markDirty()
    return this
  }

  // Control
  show(x: number, y: number): this {
    this._posX = x
    this._posY = y
    this._visible = true
    this._selectedIndex = this.findNextSelectable(0, 1)
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  hide(): this {
    if (this._visible) {
      this._visible = false
      this.markDirty()
      for (const handler of this._onCloseHandlers) {
        handler()
      }
    }
    return this
  }

  toggle(x: number, y: number): this {
    return this._visible ? this.hide() : this.show(x, y)
  }

  // Navigation
  selectNext(): this {
    const nextIndex = this.findNextSelectable(this._selectedIndex + 1, 1)
    if (nextIndex !== -1) {
      this._selectedIndex = nextIndex
      this.ensureVisible()
      this.markDirty()
    }
    return this
  }

  selectPrevious(): this {
    const prevIndex = this.findNextSelectable(this._selectedIndex - 1, -1)
    if (prevIndex !== -1) {
      this._selectedIndex = prevIndex
      this.ensureVisible()
      this.markDirty()
    }
    return this
  }

  confirm(): this {
    const item = this._items[this._selectedIndex]
    if (item && !item.disabled && !item.separator) {
      for (const handler of this._onSelectHandlers) {
        handler(item)
      }
      if (this._autoClose) {
        this.hide()
      }
    }
    return this
  }

  // Events
  onSelect(handler: (item: MenuItem) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onClose(handler: () => void): this {
    this._onCloseHandlers.push(handler)
    return this
  }

  /**
   * Dispose of context menu and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._items = []
    this._onSelectHandlers = []
    this._onCloseHandlers = []
    super.dispose()
  }

  // Internal helpers
  private findNextSelectable(startIndex: number, direction: 1 | -1): number {
    let index = startIndex

    while (index >= 0 && index < this._items.length) {
      const item = this._items[index]
      if (item && !item.separator && !item.disabled) {
        return index
      }
      index += direction
    }

    // Wrap around
    if (direction === 1 && startIndex > 0) {
      return this.findNextSelectable(0, 1)
    }
    if (direction === -1 && startIndex < this._items.length - 1) {
      return this.findNextSelectable(this._items.length - 1, -1)
    }

    return this._selectedIndex
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
    if (!this._visible) return false

    switch (key) {
      case 'up':
      case 'k':
        this.selectPrevious()
        return true
      case 'down':
      case 'j':
        this.selectNext()
        return true
      case 'enter':
      case 'space':
        this.confirm()
        return true
      case 'escape':
        this.hide()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const menuWidth = this.calculateWidth()
    const menuHeight = Math.min(this._items.length, this._maxVisible) + (this._border !== 'none' ? 2 : 0)
    const borderOffset = this._border !== 'none' ? 1 : 0

    // Check if click is inside menu
    if (x >= this._posX && x < this._posX + menuWidth &&
        y >= this._posY && y < this._posY + menuHeight) {

      if (action === 'press') {
        const itemIndex = y - this._posY - borderOffset + this._scrollOffset
        if (itemIndex >= 0 && itemIndex < this._items.length) {
          const item = this._items[itemIndex]
          if (item && !item.separator && !item.disabled) {
            this._selectedIndex = itemIndex
            this.confirm()
            return true
          }
        }
      }

      if (action === 'move') {
        const itemIndex = y - this._posY - borderOffset + this._scrollOffset
        if (itemIndex >= 0 && itemIndex < this._items.length) {
          const item = this._items[itemIndex]
          if (item && !item.separator && !item.disabled) {
            this._selectedIndex = itemIndex
            this.markDirty()
          }
        }
        return true
      }

      return true
    }

    // Click outside - close menu
    if (action === 'press') {
      this.hide()
      return true
    }

    return false
  }

  private calculateWidth(): number {
    let maxWidth = 0
    for (const item of this._items) {
      if (item.separator) continue
      let width = stringWidth(item.label)
      if (item.icon) width += 2
      if (item.shortcut) width += stringWidth(item.shortcut) + 2
      maxWidth = Math.max(maxWidth, width)
    }
    return maxWidth + (this._border !== 'none' ? 4 : 2)
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const menuWidth = this.calculateWidth()
    const visibleItems = Math.min(this._items.length, this._maxVisible)
    const menuHeight = visibleItems + (this._border !== 'none' ? 2 : 0)
    const borderOffset = this._border !== 'none' ? 1 : 0

    // Adjust position if menu would go off screen
    const posX = this._posX
    const posY = this._posY

    // Draw background
    for (let row = posY; row < posY + menuHeight; row++) {
      for (let col = posX; col < posX + menuWidth; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      drawRect(buffer, posX, posY, menuWidth, menuHeight, chars, { fg, bg, attrs: 0 })
    }

    // Draw items
    for (let i = 0; i < visibleItems; i++) {
      const itemIndex = this._scrollOffset + i
      const item = this._items[itemIndex]
      if (!item) continue

      const itemY = posY + borderOffset + i
      const itemX = posX + borderOffset

      if (item.separator) {
        // Draw separator
        const sepChar = '\u2500' // ─
        buffer.write(itemX, itemY, sepChar.repeat(menuWidth - 2 * borderOffset), {
          fg,
          bg,
          attrs: ATTR_DIM
        })
        continue
      }

      const isSelected = itemIndex === this._selectedIndex
      let attrs = 0
      if (item.disabled) {
        attrs = ATTR_DIM
      } else if (isSelected) {
        attrs = ATTR_INVERSE
      }

      // Build item text
      let text = ''
      if (item.icon) {
        text += item.icon + ' '
      }
      text += item.label

      // Add shortcut (right-aligned)
      const contentWidth = menuWidth - 2 * borderOffset
      if (item.shortcut) {
        const shortcutWidth = stringWidth(item.shortcut)
        const labelWidth = stringWidth(text)
        const padding = contentWidth - labelWidth - shortcutWidth
        if (padding > 0) {
          text += ' '.repeat(padding) + item.shortcut
        }
      } else {
        text = padToWidth(text, contentWidth, 'left')
      }

      // Truncate if needed
      if (stringWidth(text) > contentWidth) {
        text = truncateToWidth(text, contentWidth)
      }

      buffer.write(itemX, itemY, text, { fg, bg, attrs })
    }

    // Draw scroll indicators
    if (this._scrollOffset > 0) {
      buffer.set(posX + menuWidth - 2, posY + borderOffset, {
        char: '\u25b2', // ▲
        fg,
        bg,
        attrs: ATTR_DIM
      })
    }
    if (this._scrollOffset + visibleItems < this._items.length) {
      buffer.set(posX + menuWidth - 2, posY + menuHeight - borderOffset - 1, {
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
 * Create a context menu widget.
 *
 * @param props - ContextMenu properties
 * @returns ContextMenu node
 *
 * @example
 * ```typescript
 * // Basic context menu
 * const menu = contextmenu()
 *   .items([
 *     { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
 *     { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
 *     { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' },
 *     { separator: true, label: '', value: '' },
 *     { label: 'Delete', value: 'delete', shortcut: 'Del' }
 *   ])
 *   .onSelect(item => {
 *     console.log('Selected:', item.value)
 *   })
 *
 * // Show on right-click
 * app.on('mouse', event => {
 *   if (event.button === 'right' && event.action === 'press') {
 *     menu.show(event.x, event.y)
 *   }
 * })
 *
 * // With icons
 * const fileMenu = contextmenu()
 *   .items([
 *     { label: 'New File', value: 'new', icon: '+' },
 *     { label: 'Open...', value: 'open', icon: 'O', shortcut: 'Ctrl+O' },
 *     { label: 'Save', value: 'save', icon: 'S', shortcut: 'Ctrl+S' },
 *     { separator: true, label: '', value: '' },
 *     { label: 'Exit', value: 'exit', disabled: true }
 *   ])
 * ```
 */
export function contextmenu(props?: ContextMenuProps): ContextMenuNode {
  return new ContextMenuNodeImpl(props)
}
