/**
 * @oxog/tui - Menubar Widget
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
 * Menu item for dropdown menus.
 */
export interface MenubarItem {
  /** Item label */
  label: string
  /** Item value/action id */
  value: string
  /** Keyboard shortcut hint */
  shortcut?: string
  /** Item is disabled */
  disabled?: boolean
  /** Separator (label is ignored) */
  separator?: boolean
  /** Submenu items (for nested menus) */
  submenu?: MenubarItem[]
  /** Icon character */
  icon?: string
}

/**
 * Top-level menu in the menubar.
 */
export interface MenubarMenu {
  /** Menu label displayed in the menubar */
  label: string
  /** Unique identifier */
  id: string
  /** Menu items (dropdown content) */
  items: MenubarItem[]
  /** Menu is disabled */
  disabled?: boolean
  /** Hotkey character (underlined) */
  hotkey?: string
}

/**
 * Menubar widget properties.
 */
export interface MenubarProps {
  /** Menus in the menubar */
  menus?: MenubarMenu[]
  /** Border style for dropdowns */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Auto-close on selection */
  autoClose?: boolean
  /** Max visible items in dropdown */
  maxVisible?: number
  /** Separator between menu labels */
  separator?: string
  /** Background style */
  style?: 'filled' | 'transparent'
}

/**
 * Menubar node interface.
 */
export interface MenubarNode extends Node {
  readonly type: 'menubar'

  // Configuration
  menus(menuList: MenubarMenu[]): this
  addMenu(menu: MenubarMenu): this
  removeMenu(id: string): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  autoClose(enabled: boolean): this
  maxVisible(count: number): this
  separator(sep: string): this
  style(style: 'filled' | 'transparent'): this

  // Control
  openMenu(id: string): this
  closeMenu(): this
  toggleMenu(id: string): this

  // Navigation
  nextMenu(): this
  previousMenu(): this
  nextItem(): this
  previousItem(): this
  confirm(): this

  // Events
  onSelect(handler: (item: MenubarItem, menuId: string) => void): this
  onMenuOpen(handler: (menuId: string) => void): this
  onMenuClose(handler: (menuId: string) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly isMenuOpen: boolean
  readonly activeMenuId: string | null
  readonly selectedMenuIndex: number
  readonly selectedItemIndex: number
  readonly menuList: MenubarMenu[]
}

// ============================================================
// Implementation
// ============================================================

class MenubarNodeImpl extends LeafNode implements MenubarNode {
  readonly type = 'menubar' as const

  private _menus: MenubarMenu[] = []
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'rounded'
  private _autoClose: boolean = true
  private _maxVisible: number = 10
  private _separator: string = '  '
  private _displayStyle: 'filled' | 'transparent' = 'filled'

  private _isFocused: boolean = false
  private _activeMenuIndex: number = -1
  private _selectedItemIndex: number = -1
  private _scrollOffset: number = 0

  private _onSelectHandlers: ((item: MenubarItem, menuId: string) => void)[] = []
  private _onMenuOpenHandlers: ((menuId: string) => void)[] = []
  private _onMenuCloseHandlers: ((menuId: string) => void)[] = []

  constructor(props?: MenubarProps) {
    super()
    if (props) {
      if (props.menus) this._menus = props.menus
      if (props.border) this._border = props.border
      if (props.autoClose !== undefined) this._autoClose = props.autoClose
      if (props.maxVisible !== undefined) this._maxVisible = props.maxVisible
      if (props.separator !== undefined) this._separator = props.separator
      if (props.style) this._displayStyle = props.style
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get isMenuOpen(): boolean {
    return this._activeMenuIndex >= 0
  }

  get activeMenuId(): string | null {
    const menu = this._menus[this._activeMenuIndex]
    if (this._activeMenuIndex >= 0 && menu) {
      return menu.id
    }
    return null
  }

  get selectedMenuIndex(): number {
    return this._activeMenuIndex
  }

  get selectedItemIndex(): number {
    return this._selectedItemIndex
  }

  get menuList(): MenubarMenu[] {
    return [...this._menus]
  }

  // Configuration
  menus(menuList: MenubarMenu[]): this {
    this._menus = menuList
    this.markDirty()
    return this
  }

  addMenu(menu: MenubarMenu): this {
    this._menus.push(menu)
    this.markDirty()
    return this
  }

  removeMenu(id: string): this {
    const index = this._menus.findIndex((m) => m.id === id)
    if (index !== -1) {
      this._menus.splice(index, 1)
      if (this._activeMenuIndex >= this._menus.length) {
        this._activeMenuIndex = this._menus.length - 1
      }
      this.markDirty()
    }
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

  separator(sep: string): this {
    this._separator = sep
    this.markDirty()
    return this
  }

  style(style: 'filled' | 'transparent'): this {
    this._displayStyle = style
    this.markDirty()
    return this
  }

  // Control
  openMenu(id: string): this {
    const index = this._menus.findIndex((m) => m.id === id)
    const menu = this._menus[index]
    if (index !== -1 && menu && !menu.disabled) {
      const prevIndex = this._activeMenuIndex
      this._activeMenuIndex = index
      this._selectedItemIndex = this.findNextSelectableItem(0, 1)
      this._scrollOffset = 0
      this.markDirty()

      if (prevIndex !== index) {
        for (const handler of this._onMenuOpenHandlers) {
          handler(id)
        }
      }
    }
    return this
  }

  closeMenu(): this {
    if (this._activeMenuIndex >= 0) {
      const id = this._menus[this._activeMenuIndex]?.id
      this._activeMenuIndex = -1
      this._selectedItemIndex = -1
      this._scrollOffset = 0
      this.markDirty()

      if (id) {
        for (const handler of this._onMenuCloseHandlers) {
          handler(id)
        }
      }
    }
    return this
  }

  toggleMenu(id: string): this {
    if (this.activeMenuId === id) {
      return this.closeMenu()
    }
    return this.openMenu(id)
  }

  // Navigation
  nextMenu(): this {
    if (this._menus.length === 0) return this

    let nextIndex = this._activeMenuIndex + 1
    if (nextIndex >= this._menus.length) {
      nextIndex = 0
    }

    // Find next non-disabled menu
    const startIndex = nextIndex
    while (this._menus[nextIndex]?.disabled) {
      nextIndex = (nextIndex + 1) % this._menus.length
      if (nextIndex === startIndex) return this // All disabled
    }

    const nextMenu = this._menus[nextIndex]
    if (this._activeMenuIndex >= 0 && nextMenu) {
      // Menu was open, open next one
      this.openMenu(nextMenu.id)
    } else if (nextMenu) {
      // Just highlight without opening
      this._activeMenuIndex = nextIndex
      this.markDirty()
    }

    return this
  }

  previousMenu(): this {
    if (this._menus.length === 0) return this

    let prevIndex = this._activeMenuIndex - 1
    if (prevIndex < 0) {
      prevIndex = this._menus.length - 1
    }

    // Find previous non-disabled menu
    const startIndex = prevIndex
    while (this._menus[prevIndex]?.disabled) {
      prevIndex = prevIndex - 1
      if (prevIndex < 0) prevIndex = this._menus.length - 1
      if (prevIndex === startIndex) return this // All disabled
    }

    const prevMenu = this._menus[prevIndex]
    if (this._activeMenuIndex >= 0 && prevMenu) {
      this.openMenu(prevMenu.id)
    } else if (prevMenu) {
      this._activeMenuIndex = prevIndex
      this.markDirty()
    }

    return this
  }

  nextItem(): this {
    if (this._activeMenuIndex < 0) return this

    const menu = this._menus[this._activeMenuIndex]
    if (!menu || menu.items.length === 0) return this

    const nextIndex = this.findNextSelectableItem(this._selectedItemIndex + 1, 1)
    if (nextIndex !== -1) {
      this._selectedItemIndex = nextIndex
      this.ensureItemVisible()
      this.markDirty()
    }

    return this
  }

  previousItem(): this {
    if (this._activeMenuIndex < 0) return this

    const menu = this._menus[this._activeMenuIndex]
    if (!menu || menu.items.length === 0) return this

    const prevIndex = this.findNextSelectableItem(this._selectedItemIndex - 1, -1)
    if (prevIndex !== -1) {
      this._selectedItemIndex = prevIndex
      this.ensureItemVisible()
      this.markDirty()
    }

    return this
  }

  confirm(): this {
    if (this._activeMenuIndex < 0 || this._selectedItemIndex < 0) return this

    const menu = this._menus[this._activeMenuIndex]
    const item = menu?.items[this._selectedItemIndex]

    if (item && !item.disabled && !item.separator) {
      // Handle submenu
      if (item.submenu && item.submenu.length > 0) {
        // TODO: Implement submenu support
        return this
      }

      for (const handler of this._onSelectHandlers) {
        handler(item, menu.id)
      }

      if (this._autoClose) {
        this.closeMenu()
      }
    }

    return this
  }

  // Events
  onSelect(handler: (item: MenubarItem, menuId: string) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onMenuOpen(handler: (menuId: string) => void): this {
    this._onMenuOpenHandlers.push(handler)
    return this
  }

  onMenuClose(handler: (menuId: string) => void): this {
    this._onMenuCloseHandlers.push(handler)
    return this
  }

  // Focus
  override focus(): this {
    this._isFocused = true
    if (this._activeMenuIndex < 0 && this._menus.length > 0) {
      // Highlight first menu but don't open it
      this._activeMenuIndex = this.findNextSelectableMenu(0, 1)
    }
    this.markDirty()
    return this
  }

  override blur(): this {
    this._isFocused = false
    this.closeMenu()
    this._activeMenuIndex = -1
    this.markDirty()
    return this
  }

  // Internal helpers
  private findNextSelectableItem(startIndex: number, direction: 1 | -1): number {
    const menu = this._menus[this._activeMenuIndex]
    if (!menu) return -1

    let index = startIndex

    while (index >= 0 && index < menu.items.length) {
      const item = menu.items[index]
      if (item && !item.separator && !item.disabled) {
        return index
      }
      index += direction
    }

    // Wrap around
    if (direction === 1 && startIndex > 0) {
      return this.findNextSelectableItem(0, 1)
    }
    if (direction === -1 && startIndex < menu.items.length - 1) {
      return this.findNextSelectableItem(menu.items.length - 1, -1)
    }

    return this._selectedItemIndex
  }

  private findNextSelectableMenu(startIndex: number, direction: 1 | -1): number {
    let index = startIndex

    while (index >= 0 && index < this._menus.length) {
      const menu = this._menus[index]
      if (menu && !menu.disabled) {
        return index
      }
      index += direction
    }

    return -1
  }

  private ensureItemVisible(): void {
    if (this._selectedItemIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedItemIndex
    } else if (this._selectedItemIndex >= this._scrollOffset + this._maxVisible) {
      this._scrollOffset = this._selectedItemIndex - this._maxVisible + 1
    }
  }

  private getMenuPositions(): { x: number; width: number }[] {
    const positions: { x: number; width: number }[] = []
    let currentX = 1 // Start with padding

    for (const menu of this._menus) {
      const width = stringWidth(menu.label) + 2 // padding
      positions.push({ x: currentX, width })
      currentX += width + stringWidth(this._separator)
    }

    return positions
  }

  private calculateDropdownWidth(menu: MenubarMenu): number {
    let maxWidth = 0
    for (const item of menu.items) {
      if (item.separator) continue
      let width = stringWidth(item.label)
      if (item.icon) width += 2
      if (item.shortcut) width += stringWidth(item.shortcut) + 2
      if (item.submenu) width += 2 // Arrow indicator
      maxWidth = Math.max(maxWidth, width)
    }
    return maxWidth + (this._border !== 'none' ? 4 : 2)
  }

  // Handle keyboard
  /** @internal */
  handleKey(key: string, _ctrl: boolean, _shift: boolean = false): boolean {
    if (!this._isFocused) return false

    // When menu is closed, handle basic navigation
    if (this._activeMenuIndex < 0) {
      switch (key) {
        case 'enter':
        case 'down':
        case 'space':
          if (this._menus.length > 0) {
            const firstMenuIndex = this.findNextSelectableMenu(0, 1)
            const firstMenu = this._menus[firstMenuIndex]
            if (firstMenuIndex !== -1 && firstMenu) {
              this.openMenu(firstMenu.id)
            }
          }
          return true
        case 'right':
          this.nextMenu()
          return true
        case 'left':
          this.previousMenu()
          return true
        case 'escape':
          this.blur()
          return true
      }
      // Check for hotkey matches when menu is closed
      for (let i = 0; i < this._menus.length; i++) {
        const menu = this._menus[i]
        if (menu && menu.hotkey && key.toLowerCase() === menu.hotkey.toLowerCase() && !menu.disabled) {
          this.openMenu(menu.id)
          return true
        }
      }
      return false
    }

    // Menu is open
    switch (key) {
      case 'up':
      case 'k':
        this.previousItem()
        return true
      case 'down':
      case 'j':
        this.nextItem()
        return true
      case 'left':
      case 'h':
        this.previousMenu()
        return true
      case 'right':
      case 'l':
        this.nextMenu()
        return true
      case 'enter':
      case 'space':
        this.confirm()
        return true
      case 'escape':
        this.closeMenu()
        return true
      case 'home':
        if (this._activeMenuIndex >= 0) {
          this._selectedItemIndex = this.findNextSelectableItem(0, 1)
          this._scrollOffset = 0
          this.markDirty()
        }
        return true
      case 'end':
        if (this._activeMenuIndex >= 0) {
          const menu = this._menus[this._activeMenuIndex]
          if (menu) {
            this._selectedItemIndex = this.findNextSelectableItem(menu.items.length - 1, -1)
            this.ensureItemVisible()
            this.markDirty()
          }
        }
        return true
    }

    // Check for hotkey matches
    for (let i = 0; i < this._menus.length; i++) {
      const menu = this._menus[i]
      if (menu && menu.hotkey && key.toLowerCase() === menu.hotkey.toLowerCase() && !menu.disabled) {
        this.openMenu(menu.id)
        return true
      }
    }

    return false
  }

  // Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    const positions = this.getMenuPositions()

    // Check menubar clicks
    if (y === bounds.y) {
      for (let i = 0; i < this._menus.length; i++) {
        const pos = positions[i]
        const menu = this._menus[i]
        if (pos && menu && x >= bounds.x + pos.x && x < bounds.x + pos.x + pos.width) {
          if (action === 'press') {
            if (!menu.disabled) {
              this._isFocused = true
              this.toggleMenu(menu.id)
            }
            return true
          }
          if (action === 'move' && this.isMenuOpen) {
            if (menu && !menu.disabled) {
              this.openMenu(menu.id)
            }
            return true
          }
        }
      }
    }

    // Check dropdown clicks
    if (this._activeMenuIndex >= 0) {
      const menu = this._menus[this._activeMenuIndex]
      const menuPos = positions[this._activeMenuIndex]
      if (!menu || !menuPos) return false
      const dropdownWidth = this.calculateDropdownWidth(menu)
      const visibleItems = Math.min(menu.items.length, this._maxVisible)
      const dropdownHeight = visibleItems + (this._border !== 'none' ? 2 : 0)
      const borderOffset = this._border !== 'none' ? 1 : 0

      const dropX = bounds.x + menuPos.x
      const dropY = bounds.y + 1

      if (
        x >= dropX &&
        x < dropX + dropdownWidth &&
        y >= dropY &&
        y < dropY + dropdownHeight
      ) {
        if (action === 'press' || action === 'move') {
          const itemIndex = y - dropY - borderOffset + this._scrollOffset
          if (itemIndex >= 0 && itemIndex < menu.items.length) {
            const item = menu.items[itemIndex]
            if (item && !item.separator && !item.disabled) {
              this._selectedItemIndex = itemIndex
              if (action === 'press') {
                this.confirm()
              }
              this.markDirty()
              return true
            }
          }
        }
        return true
      }

      // Click outside dropdown - close menu
      if (action === 'press') {
        this.closeMenu()
        return true
      }
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

    // Draw menubar background
    if (this._displayStyle === 'filled') {
      for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
        buffer.set(col, bounds.y, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw menu labels
    const positions = this.getMenuPositions()
    for (let i = 0; i < this._menus.length; i++) {
      const menu = this._menus[i]
      const pos = positions[i]
      if (!menu || !pos) continue

      const isActive = i === this._activeMenuIndex
      const isDisabled = menu.disabled

      let attrs = 0
      if (isDisabled) {
        attrs = ATTR_DIM
      } else if (isActive && this._isFocused) {
        attrs = ATTR_INVERSE
      }

      // Draw label with padding
      const label = ` ${menu.label} `
      buffer.write(bounds.x + pos.x, bounds.y, label, { fg, bg, attrs })

      // Draw hotkey underline
      if (menu.hotkey && !isDisabled) {
        const hotkeyIndex = menu.label.toLowerCase().indexOf(menu.hotkey.toLowerCase())
        if (hotkeyIndex !== -1) {
          // Already visually indicated by the label, could add underline attr if supported
        }
      }
    }

    // Draw dropdown if menu is open
    if (this._activeMenuIndex >= 0) {
      const menu = this._menus[this._activeMenuIndex]
      const menuPos = positions[this._activeMenuIndex]
      if (menu && menuPos) {
        this.renderDropdown(buffer, fg, bg, menu, bounds.x + menuPos.x, bounds.y + 1)
      }
    }
  }

  private renderDropdown(
    buffer: Buffer,
    fg: number,
    bg: number,
    menu: MenubarMenu,
    posX: number,
    posY: number
  ): void {
    const dropdownWidth = this.calculateDropdownWidth(menu)
    const visibleItems = Math.min(menu.items.length, this._maxVisible)
    const dropdownHeight = visibleItems + (this._border !== 'none' ? 2 : 0)
    const borderOffset = this._border !== 'none' ? 1 : 0

    // Draw background
    for (let row = posY; row < posY + dropdownHeight; row++) {
      for (let col = posX; col < posX + dropdownWidth; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      drawRect(buffer, posX, posY, dropdownWidth, dropdownHeight, chars, { fg, bg, attrs: 0 })
    }

    // Draw items
    for (let i = 0; i < visibleItems; i++) {
      const itemIndex = this._scrollOffset + i
      const item = menu.items[itemIndex]
      if (!item) continue

      const itemY = posY + borderOffset + i
      const itemX = posX + borderOffset

      if (item.separator) {
        const sepChar = '\u2500' // ─
        buffer.write(itemX, itemY, sepChar.repeat(dropdownWidth - 2 * borderOffset), {
          fg,
          bg,
          attrs: ATTR_DIM
        })
        continue
      }

      const isSelected = itemIndex === this._selectedItemIndex
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

      // Add submenu indicator
      if (item.submenu && item.submenu.length > 0) {
        text += ' \u25b6' // ▶
      }

      // Add shortcut (right-aligned)
      const contentWidth = dropdownWidth - 2 * borderOffset
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
      buffer.set(posX + dropdownWidth - 2, posY + borderOffset, {
        char: '\u25b2', // ▲
        fg,
        bg,
        attrs: ATTR_DIM
      })
    }
    if (this._scrollOffset + visibleItems < menu.items.length) {
      buffer.set(posX + dropdownWidth - 2, posY + dropdownHeight - borderOffset - 1, {
        char: '\u25bc', // ▼
        fg,
        bg,
        attrs: ATTR_DIM
      })
    }
  }

  /**
   * Dispose of menubar and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._menus = []
    this._onSelectHandlers = []
    this._onMenuOpenHandlers = []
    this._onMenuCloseHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a menubar widget.
 *
 * @param props - Menubar properties
 * @returns Menubar node
 *
 * @example
 * ```typescript
 * // Basic menubar
 * const menu = menubar()
 *   .menus([
 *     {
 *       id: 'file',
 *       label: 'File',
 *       hotkey: 'f',
 *       items: [
 *         { label: 'New', value: 'new', shortcut: 'Ctrl+N' },
 *         { label: 'Open...', value: 'open', shortcut: 'Ctrl+O' },
 *         { label: 'Save', value: 'save', shortcut: 'Ctrl+S' },
 *         { separator: true, label: '', value: '' },
 *         { label: 'Exit', value: 'exit' }
 *       ]
 *     },
 *     {
 *       id: 'edit',
 *       label: 'Edit',
 *       hotkey: 'e',
 *       items: [
 *         { label: 'Undo', value: 'undo', shortcut: 'Ctrl+Z' },
 *         { label: 'Redo', value: 'redo', shortcut: 'Ctrl+Y' },
 *         { separator: true, label: '', value: '' },
 *         { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
 *         { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
 *         { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' }
 *       ]
 *     },
 *     {
 *       id: 'help',
 *       label: 'Help',
 *       hotkey: 'h',
 *       items: [
 *         { label: 'Documentation', value: 'docs' },
 *         { label: 'About', value: 'about' }
 *       ]
 *     }
 *   ])
 *   .onSelect((item, menuId) => {
 *     console.log(`Selected ${item.value} from ${menuId}`)
 *   })
 *
 * // With icons
 * const iconMenu = menubar()
 *   .addMenu({
 *     id: 'file',
 *     label: 'File',
 *     items: [
 *       { label: 'New File', value: 'new', icon: '+', shortcut: 'Ctrl+N' },
 *       { label: 'Open Folder', value: 'open-folder', icon: '\ud83d\udcc1' },
 *       { separator: true, label: '', value: '' },
 *       { label: 'Preferences', value: 'preferences', icon: '\u2699' }
 *     ]
 *   })
 * ```
 */
export function menubar(props?: MenubarProps): MenubarNode {
  return new MenubarNodeImpl(props)
}
