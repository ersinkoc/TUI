/**
 * @oxog/tui - Drawer Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Drawer position (edge it slides from).
 */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'

/**
 * Drawer navigation item.
 */
export interface DrawerItem {
  /** Unique identifier */
  id: string
  /** Item label */
  label: string
  /** Item icon */
  icon?: string
  /** Item is disabled */
  disabled?: boolean
  /** Item has sub-items (expandable) */
  children?: DrawerItem[]
  /** Divider (label is ignored) */
  divider?: boolean
  /** Badge/count to show */
  badge?: string | number
}

/**
 * Drawer widget properties.
 */
export interface DrawerProps {
  /** Drawer position */
  position?: DrawerPosition
  /** Drawer width (for left/right) or height (for top/bottom) */
  size?: number
  /** Initial open state */
  open?: boolean
  /** Navigation items */
  items?: DrawerItem[]
  /** Header title */
  title?: string
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Show close button */
  showClose?: boolean
  /** Overlay (dims background when open) */
  overlay?: boolean
}

/**
 * Drawer node interface.
 */
export interface DrawerNode extends Node {
  readonly type: 'drawer'

  // Configuration
  position(pos: DrawerPosition): this
  size(s: number): this
  items(itemList: DrawerItem[]): this
  addItem(item: DrawerItem): this
  removeItem(id: string): this
  title(text: string): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  showClose(show: boolean): this
  overlay(enabled: boolean): this

  // Control
  open(): this
  close(): this
  toggle(): this

  // Navigation
  selectNext(): this
  selectPrevious(): this
  selectItem(id: string): this
  expandItem(id: string): this
  collapseItem(id: string): this
  confirm(): this

  // Content
  content(node: Node): this

  // Events
  onOpen(handler: () => void): this
  onClose(handler: () => void): this
  onSelect(handler: (item: DrawerItem) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly isOpen: boolean
  readonly selectedId: string | null
  readonly itemList: DrawerItem[]
  readonly drawerPosition: DrawerPosition
  readonly drawerSize: number
}

// ============================================================
// Implementation
// ============================================================

class DrawerNodeImpl extends ContainerNode implements DrawerNode {
  readonly type = 'drawer' as const

  private _position: DrawerPosition = 'left'
  private _size: number = 30
  private _isOpen: boolean = false
  private _items: DrawerItem[] = []
  private _title: string = ''
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'single'
  private _showClose: boolean = true
  private _overlay: boolean = true

  private _isFocused: boolean = false
  private _selectedIndex: number = -1
  private _expandedIds: Set<string> = new Set()
  private _contentNode: Node | null = null

  private _onOpenHandlers: (() => void)[] = []
  private _onCloseHandlers: (() => void)[] = []
  private _onSelectHandlers: ((item: DrawerItem) => void)[] = []

  constructor(props?: DrawerProps) {
    super()
    if (props) {
      if (props.position) this._position = props.position
      if (props.size !== undefined) this._size = props.size
      if (props.open !== undefined) this._isOpen = props.open
      if (props.items) this._items = props.items
      if (props.title) this._title = props.title
      if (props.border) this._border = props.border
      if (props.showClose !== undefined) this._showClose = props.showClose
      if (props.overlay !== undefined) this._overlay = props.overlay
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  get selectedId(): string | null {
    const flatItems = this.flattenItems()
    return flatItems[this._selectedIndex]?.id ?? null
  }

  get itemList(): DrawerItem[] {
    return [...this._items]
  }

  get drawerPosition(): DrawerPosition {
    return this._position
  }

  get drawerSize(): number {
    return this._size
  }

  // Configuration
  position(pos: DrawerPosition): this {
    this._position = pos
    this.markDirty()
    return this
  }

  size(s: number): this {
    this._size = s
    this.markDirty()
    return this
  }

  items(itemList: DrawerItem[]): this {
    this._items = itemList
    this._selectedIndex = -1
    this.markDirty()
    return this
  }

  addItem(item: DrawerItem): this {
    this._items.push(item)
    this.markDirty()
    return this
  }

  removeItem(id: string): this {
    const removeFromList = (list: DrawerItem[]): boolean => {
      const index = list.findIndex((i) => i.id === id)
      if (index !== -1) {
        list.splice(index, 1)
        return true
      }
      for (const item of list) {
        if (item.children && removeFromList(item.children)) {
          return true
        }
      }
      return false
    }
    removeFromList(this._items)
    this.markDirty()
    return this
  }

  title(text: string): this {
    this._title = text
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  showClose(show: boolean): this {
    this._showClose = show
    this.markDirty()
    return this
  }

  overlay(enabled: boolean): this {
    this._overlay = enabled
    this.markDirty()
    return this
  }

  // Control
  open(): this {
    if (!this._isOpen) {
      this._isOpen = true
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

  // Navigation
  private flattenItems(): DrawerItem[] {
    const result: DrawerItem[] = []
    const addItems = (items: DrawerItem[], depth: number) => {
      for (const item of items) {
        if (!item.divider) {
          result.push(item)
          if (item.children && this._expandedIds.has(item.id)) {
            addItems(item.children, depth + 1)
          }
        }
      }
    }
    addItems(this._items, 0)
    return result
  }

  selectNext(): this {
    const flatItems = this.flattenItems()
    if (flatItems.length === 0) return this

    let nextIndex = this._selectedIndex + 1
    while (nextIndex < flatItems.length && flatItems[nextIndex]?.disabled) {
      nextIndex++
    }

    if (nextIndex >= flatItems.length) {
      // Wrap to start
      nextIndex = 0
      while (nextIndex < flatItems.length && flatItems[nextIndex]?.disabled) {
        nextIndex++
      }
    }

    if (nextIndex < flatItems.length && !flatItems[nextIndex]?.disabled) {
      this._selectedIndex = nextIndex
      this.markDirty()
    }

    return this
  }

  selectPrevious(): this {
    const flatItems = this.flattenItems()
    if (flatItems.length === 0) return this

    let prevIndex = this._selectedIndex - 1
    while (prevIndex >= 0 && flatItems[prevIndex]?.disabled) {
      prevIndex--
    }

    if (prevIndex < 0) {
      // Wrap to end
      prevIndex = flatItems.length - 1
      while (prevIndex >= 0 && flatItems[prevIndex]?.disabled) {
        prevIndex--
      }
    }

    if (prevIndex >= 0 && !flatItems[prevIndex]?.disabled) {
      this._selectedIndex = prevIndex
      this.markDirty()
    }

    return this
  }

  selectItem(id: string): this {
    const flatItems = this.flattenItems()
    const index = flatItems.findIndex((i) => i.id === id)
    const item = flatItems[index]
    if (index !== -1 && item && !item.disabled) {
      this._selectedIndex = index
      this.markDirty()
    }
    return this
  }

  expandItem(id: string): this {
    this._expandedIds.add(id)
    this.markDirty()
    return this
  }

  collapseItem(id: string): this {
    this._expandedIds.delete(id)
    this.markDirty()
    return this
  }

  confirm(): this {
    const flatItems = this.flattenItems()
    const item = flatItems[this._selectedIndex]

    if (item && !item.disabled && !item.divider) {
      // Toggle expand/collapse if has children
      if (item.children && item.children.length > 0) {
        if (this._expandedIds.has(item.id)) {
          this.collapseItem(item.id)
        } else {
          this.expandItem(item.id)
        }
      }

      for (const handler of this._onSelectHandlers) {
        handler(item)
      }
    }

    return this
  }

  // Content
  content(node: Node): this {
    if (this._contentNode) {
      this.remove(this._contentNode)
    }
    this._contentNode = node
    this.add(node)
    this.markDirty()
    return this
  }

  // Events
  onOpen(handler: () => void): this {
    this._onOpenHandlers.push(handler)
    return this
  }

  onClose(handler: () => void): this {
    this._onCloseHandlers.push(handler)
    return this
  }

  onSelect(handler: (item: DrawerItem) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  // Focus
  focus(): this {
    this._isFocused = true
    if (this._selectedIndex < 0) {
      const flatItems = this.flattenItems()
      for (let i = 0; i < flatItems.length; i++) {
        const item = flatItems[i]
        if (item && !item.disabled && !item.divider) {
          this._selectedIndex = i
          break
        }
      }
    }
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
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isFocused || !this._isOpen) return false

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
      case 'right':
      case 'l':
        // Expand if has children
        const flatItems = this.flattenItems()
        const item = flatItems[this._selectedIndex]
        if (item?.children && item.children.length > 0) {
          this.expandItem(item.id)
        }
        return true
      case 'left':
      case 'h':
        // Collapse if expanded
        const flatItems2 = this.flattenItems()
        const item2 = flatItems2[this._selectedIndex]
        if (item2 && this._expandedIds.has(item2.id)) {
          this.collapseItem(item2.id)
        }
        return true
      case 'escape':
        this.close()
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._isOpen) return false

    const bounds = this._bounds
    if (!bounds) return false

    const drawerBounds = this.getDrawerBounds(bounds)

    // Check if click is inside drawer
    if (
      x >= drawerBounds.x &&
      x < drawerBounds.x + drawerBounds.width &&
      y >= drawerBounds.y &&
      y < drawerBounds.y + drawerBounds.height
    ) {
      if (action === 'press') {
        // Check close button
        if (this._showClose && this._title) {
          const closeX = drawerBounds.x + drawerBounds.width - 2
          const closeY = drawerBounds.y + (this._border !== 'none' ? 1 : 0)
          if (x === closeX && y === closeY) {
            this.close()
            return true
          }
        }

        // Check item click
        const borderOffset = this._border !== 'none' ? 1 : 0
        const headerOffset = this._title ? 1 : 0
        const itemY = y - drawerBounds.y - borderOffset - headerOffset

        if (itemY >= 0) {
          const flatItems = this.flattenItems()
          if (itemY < flatItems.length) {
            this._isFocused = true
            this._selectedIndex = itemY
            this.confirm()
            return true
          }
        }
      }
      return true
    }

    // Click on overlay - close drawer
    if (this._overlay && action === 'press') {
      this.close()
      return true
    }

    return false
  }

  private getDrawerBounds(bounds: { x: number; y: number; width: number; height: number }): {
    x: number
    y: number
    width: number
    height: number
  } {
    switch (this._position) {
      case 'left':
        return { x: bounds.x, y: bounds.y, width: this._size, height: bounds.height }
      case 'right':
        return {
          x: bounds.x + bounds.width - this._size,
          y: bounds.y,
          width: this._size,
          height: bounds.height
        }
      case 'top':
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: this._size }
      case 'bottom':
        return {
          x: bounds.x,
          y: bounds.y + bounds.height - this._size,
          width: bounds.width,
          height: this._size
        }
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || !this._isOpen) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Draw overlay
    if (this._overlay) {
      for (let row = bounds.y; row < bounds.y + bounds.height; row++) {
        for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
          const cell = buffer.get(col, row)
          if (cell) {
            buffer.set(col, row, { ...cell, attrs: cell.attrs | ATTR_DIM })
          }
        }
      }
    }

    // Get drawer bounds
    const drawerBounds = this.getDrawerBounds(bounds)
    const borderOffset = this._border !== 'none' ? 1 : 0

    // Clear drawer area
    for (let row = drawerBounds.y; row < drawerBounds.y + drawerBounds.height; row++) {
      for (let col = drawerBounds.x; col < drawerBounds.x + drawerBounds.width; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      // Draw vertical/horizontal lines based on position
      for (let row = drawerBounds.y; row < drawerBounds.y + drawerBounds.height; row++) {
        for (let col = drawerBounds.x; col < drawerBounds.x + drawerBounds.width; col++) {
          let char = ' '
          const isTop = row === drawerBounds.y
          const isBottom = row === drawerBounds.y + drawerBounds.height - 1
          const isLeft = col === drawerBounds.x
          const isRight = col === drawerBounds.x + drawerBounds.width - 1

          if (isTop && isLeft) char = chars.topLeft
          else if (isTop && isRight) char = chars.topRight
          else if (isBottom && isLeft) char = chars.bottomLeft
          else if (isBottom && isRight) char = chars.bottomRight
          else if (isTop || isBottom) char = chars.horizontal
          else if (isLeft || isRight) char = chars.vertical
          else continue

          buffer.set(col, row, { char, fg, bg, attrs: 0 })
        }
      }
    }

    // Draw title
    let contentStartY = drawerBounds.y + borderOffset
    if (this._title) {
      const titleWidth = drawerBounds.width - 2 * borderOffset - (this._showClose ? 2 : 0)
      let titleText = this._title
      if (stringWidth(titleText) > titleWidth) {
        titleText = truncateToWidth(titleText, titleWidth)
      }

      buffer.write(drawerBounds.x + borderOffset + 1, contentStartY, titleText, {
        fg,
        bg,
        attrs: ATTR_BOLD
      })

      // Draw close button
      if (this._showClose) {
        buffer.set(drawerBounds.x + drawerBounds.width - borderOffset - 2, contentStartY, {
          char: '\u00d7', // ×
          fg,
          bg,
          attrs: 0
        })
      }

      contentStartY++
    }

    // Draw items
    const flatItems = this.flattenItems()
    const contentHeight = drawerBounds.height - 2 * borderOffset - (this._title ? 1 : 0)
    const contentWidth = drawerBounds.width - 2 * borderOffset

    for (let i = 0; i < Math.min(flatItems.length, contentHeight); i++) {
      const item = flatItems[i]
      if (!item) continue
      const itemY = contentStartY + i
      const itemX = drawerBounds.x + borderOffset

      // Calculate indent level
      let depth = 0
      const findDepth = (items: DrawerItem[], target: string, currentDepth: number): number => {
        for (const it of items) {
          if (it.id === target) return currentDepth
          if (it.children && this._expandedIds.has(it.id)) {
            const found = findDepth(it.children, target, currentDepth + 1)
            if (found !== -1) return found
          }
        }
        return -1
      }
      depth = Math.max(0, findDepth(this._items, item.id, 0))

      const isSelected = this._selectedIndex === i && this._isFocused

      let attrs = 0
      if (item.disabled) {
        attrs = ATTR_DIM
      } else if (isSelected) {
        attrs = ATTR_INVERSE
      }

      // Build item text
      const indent = '  '.repeat(depth)
      let text = indent

      // Expand/collapse indicator
      if (item.children && item.children.length > 0) {
        text += this._expandedIds.has(item.id) ? '\u25bc ' : '\u25b6 ' // ▼ or ▶
      } else {
        text += '  '
      }

      // Icon
      if (item.icon) {
        text += item.icon + ' '
      }

      // Label
      text += item.label

      // Badge
      if (item.badge !== undefined) {
        const badgeText = ` (${item.badge})`
        const availableWidth = contentWidth - stringWidth(text)
        if (availableWidth >= stringWidth(badgeText)) {
          text += badgeText
        }
      }

      // Truncate if needed
      if (stringWidth(text) > contentWidth) {
        text = truncateToWidth(text, contentWidth)
      }

      buffer.write(itemX, itemY, text, { fg, bg, attrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a drawer widget.
 *
 * @param props - Drawer properties
 * @returns Drawer node
 *
 * @example
 * ```typescript
 * // Basic navigation drawer
 * const nav = drawer({
 *   title: 'Navigation',
 *   items: [
 *     { id: 'home', label: 'Home', icon: '\ud83c\udfe0' },
 *     { id: 'files', label: 'Files', icon: '\ud83d\udcc1' },
 *     { id: 'settings', label: 'Settings', icon: '\u2699' }
 *   ]
 * })
 *   .onSelect(item => {
 *     navigateTo(item.id)
 *   })
 *
 * // Toggle with hamburger menu
 * hamburgerButton.onClick(() => nav.toggle())
 *
 * // Drawer with nested items
 * const folderNav = drawer({ position: 'left', size: 35 })
 *   .items([
 *     {
 *       id: 'projects',
 *       label: 'Projects',
 *       children: [
 *         { id: 'proj-a', label: 'Project A' },
 *         { id: 'proj-b', label: 'Project B' }
 *       ]
 *     },
 *     { divider: true, id: 'div1', label: '' },
 *     { id: 'archived', label: 'Archived', disabled: true }
 *   ])
 *
 * // Right-side drawer
 * const sidebar = drawer({
 *   position: 'right',
 *   title: 'Details',
 *   overlay: true
 * }).content(detailsPanel)
 * ```
 */
export function drawer(props?: DrawerProps): DrawerNode {
  return new DrawerNodeImpl(props)
}
