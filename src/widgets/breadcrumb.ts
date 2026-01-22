/**
 * @oxog/tui - Breadcrumb Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_INVERSE, ATTR_DIM, ATTR_UNDERLINE, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Breadcrumb item.
 */
export interface BreadcrumbItem {
  /** Item label */
  label: string
  /** Item value/identifier */
  value: string
  /** Icon character */
  icon?: string
  /** Item is disabled */
  disabled?: boolean
}

/**
 * Breadcrumb widget properties.
 */
export interface BreadcrumbProps {
  /** Breadcrumb items */
  items?: BreadcrumbItem[]
  /** Separator between items */
  separator?: string
  /** Show home icon */
  showHome?: boolean
  /** Home icon character */
  homeIcon?: string
  /** Max items to show (rest are collapsed) */
  maxItems?: number
  /** Collapse style */
  collapseStyle?: 'ellipsis' | 'dropdown'
  /** Highlight current (last) item */
  highlightCurrent?: boolean
}

/**
 * Breadcrumb node interface.
 */
export interface BreadcrumbNode extends Node {
  readonly type: 'breadcrumb'

  // Configuration
  items(itemList: BreadcrumbItem[]): this
  push(item: BreadcrumbItem): this
  pop(): this
  clear(): this
  separator(sep: string): this
  showHome(show: boolean): this
  homeIcon(icon: string): this
  maxItems(max: number): this
  collapseStyle(style: 'ellipsis' | 'dropdown'): this
  highlightCurrent(highlight: boolean): this

  // Navigation
  goTo(index: number): this
  goToValue(value: string): this

  // Events
  onNavigate(handler: (item: BreadcrumbItem, index: number) => void): this
  onCollapsedClick(handler: (items: BreadcrumbItem[]) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly itemList: BreadcrumbItem[]
  readonly currentItem: BreadcrumbItem | null
  readonly focusedIndex: number
  readonly depth: number
}

// ============================================================
// Implementation
// ============================================================

class BreadcrumbNodeImpl extends LeafNode implements BreadcrumbNode {
  readonly type = 'breadcrumb' as const

  private _items: BreadcrumbItem[] = []
  private _separator: string = ' / '
  private _showHome: boolean = true
  private _homeIcon: string = '\u2302' // ⌂
  private _maxItems: number = 0 // 0 = no limit
  private _collapseStyle: 'ellipsis' | 'dropdown' = 'ellipsis'
  private _highlightCurrent: boolean = true

  /** Get collapse style setting */
  get collapseStyleSetting(): 'ellipsis' | 'dropdown' { return this._collapseStyle }

  private _isFocused: boolean = false
  private _focusedIndex: number = -1

  private _onNavigateHandlers: ((item: BreadcrumbItem, index: number) => void)[] = []
  private _onCollapsedClickHandlers: ((items: BreadcrumbItem[]) => void)[] = []

  constructor(props?: BreadcrumbProps) {
    super()
    if (props) {
      if (props.items) this._items = props.items
      if (props.separator !== undefined) this._separator = props.separator
      if (props.showHome !== undefined) this._showHome = props.showHome
      if (props.homeIcon !== undefined) this._homeIcon = props.homeIcon
      if (props.maxItems !== undefined) this._maxItems = props.maxItems
      if (props.collapseStyle) this._collapseStyle = props.collapseStyle
      if (props.highlightCurrent !== undefined) this._highlightCurrent = props.highlightCurrent
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get itemList(): BreadcrumbItem[] {
    return [...this._items]
  }

  get currentItem(): BreadcrumbItem | null {
    return this._items.length > 0 ? (this._items[this._items.length - 1] ?? null) : null
  }

  get focusedIndex(): number {
    return this._focusedIndex
  }

  get depth(): number {
    return this._items.length
  }

  // Configuration
  items(itemList: BreadcrumbItem[]): this {
    this._items = itemList
    this._focusedIndex = -1
    this.markDirty()
    return this
  }

  push(item: BreadcrumbItem): this {
    this._items.push(item)
    this.markDirty()
    return this
  }

  pop(): this {
    if (this._items.length > 0) {
      this._items.pop()
      if (this._focusedIndex >= this._items.length) {
        this._focusedIndex = this._items.length - 1
      }
      this.markDirty()
    }
    return this
  }

  clear(): this {
    this._items = []
    this._focusedIndex = -1
    this.markDirty()
    return this
  }

  separator(sep: string): this {
    this._separator = sep
    this.markDirty()
    return this
  }

  showHome(show: boolean): this {
    this._showHome = show
    this.markDirty()
    return this
  }

  homeIcon(icon: string): this {
    this._homeIcon = icon
    this.markDirty()
    return this
  }

  maxItems(max: number): this {
    this._maxItems = max
    this.markDirty()
    return this
  }

  collapseStyle(style: 'ellipsis' | 'dropdown'): this {
    this._collapseStyle = style
    this.markDirty()
    return this
  }

  highlightCurrent(highlight: boolean): this {
    this._highlightCurrent = highlight
    this.markDirty()
    return this
  }

  // Navigation
  goTo(index: number): this {
    if (index >= 0 && index < this._items.length) {
      const item = this._items[index]
      if (item && !item.disabled) {
        // Truncate to this level
        this._items = this._items.slice(0, index + 1)
        this.markDirty()

        for (const handler of this._onNavigateHandlers) {
          handler(item, index)
        }
      }
    }
    return this
  }

  goToValue(value: string): this {
    const index = this._items.findIndex((i) => i.value === value)
    if (index !== -1) {
      this.goTo(index)
    }
    return this
  }

  // Events
  onNavigate(handler: (item: BreadcrumbItem, index: number) => void): this {
    this._onNavigateHandlers.push(handler)
    return this
  }

  onCollapsedClick(handler: (items: BreadcrumbItem[]) => void): this {
    this._onCollapsedClickHandlers.push(handler)
    return this
  }

  /**
   * Dispose of breadcrumb and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._items = []
    this._onNavigateHandlers = []
    this._onCollapsedClickHandlers = []
    super.dispose()
  }

  // Focus
  override focus(): this {
    this._isFocused = true
    if (this._focusedIndex < 0 && this._items.length > 0) {
      this._focusedIndex = this._items.length - 1
    }
    this.markDirty()
    return this
  }

  override blur(): this {
    this._isFocused = false
    this._focusedIndex = -1
    this.markDirty()
    return this
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'left':
      case 'h':
        if (this._focusedIndex > 0) {
          this._focusedIndex--
          this.markDirty()
        }
        return true
      case 'right':
      case 'l':
        if (this._focusedIndex < this._items.length - 1) {
          this._focusedIndex++
          this.markDirty()
        }
        return true
      case 'home':
        this._focusedIndex = 0
        this.markDirty()
        return true
      case 'end':
        this._focusedIndex = this._items.length - 1
        this.markDirty()
        return true
      case 'enter':
      case 'space':
        if (this._focusedIndex >= 0 && this._focusedIndex < this._items.length) {
          this.goTo(this._focusedIndex)
        }
        return true
      case 'escape':
        this.blur()
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

    if (y !== bounds.y || x < bounds.x || x >= bounds.x + bounds.width) {
      return false
    }

    if (action === 'press') {
      const clickedIndex = this.getItemAtPosition(x - bounds.x)
      if (clickedIndex === -2) {
        // Clicked on collapsed section
        if (this._maxItems > 0 && this._items.length > this._maxItems) {
          const collapsedItems = this._items.slice(1, this._items.length - this._maxItems + 2)
          for (const handler of this._onCollapsedClickHandlers) {
            handler(collapsedItems)
          }
        }
        return true
      } else if (clickedIndex >= 0) {
        this._isFocused = true
        this._focusedIndex = clickedIndex
        this.goTo(clickedIndex)
        return true
      }
    }

    return false
  }

  private getItemAtPosition(relX: number): number {
    const { visibleItems, hasCollapsed } = this.getVisibleItems()
    let currentX = 0

    // Home icon
    if (this._showHome) {
      const homeWidth = stringWidth(this._homeIcon)
      if (relX < currentX + homeWidth) {
        return 0 // First item (home/root)
      }
      currentX += homeWidth + stringWidth(this._separator)
    }

    // Collapsed section
    if (hasCollapsed) {
      const ellipsisWidth = 3 // "..."
      if (relX >= currentX && relX < currentX + ellipsisWidth) {
        return -2 // Collapsed indicator
      }
      currentX += ellipsisWidth + stringWidth(this._separator)
    }

    // Visible items
    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i]
      if (!item) continue
      let itemWidth = stringWidth(item.label)
      if (item.icon) itemWidth += stringWidth(item.icon) + 1

      if (relX >= currentX && relX < currentX + itemWidth) {
        // Find actual index
        return this._items.indexOf(item)
      }

      currentX += itemWidth
      if (i < visibleItems.length - 1) {
        currentX += stringWidth(this._separator)
      }
    }

    return -1
  }

  private getVisibleItems(): { visibleItems: BreadcrumbItem[]; hasCollapsed: boolean } {
    if (this._maxItems <= 0 || this._items.length <= this._maxItems) {
      return { visibleItems: this._items, hasCollapsed: false }
    }

    // Keep first and last (maxItems - 1) items
    const visibleItems: BreadcrumbItem[] = []
    if (this._showHome && this._items.length > 0) {
      const firstItem = this._items[0]
      if (firstItem) visibleItems.push(firstItem)
    }

    // Add last items
    const lastCount = this._maxItems - (this._showHome ? 1 : 0) - 1
    const lastItems = this._items.slice(-lastCount)
    visibleItems.push(...lastItems)

    return { visibleItems, hasCollapsed: true }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const { visibleItems, hasCollapsed } = this.getVisibleItems()
    let currentX = bounds.x

    // Render home icon
    if (this._showHome && this._items.length > 0) {
      const isFocused = this._isFocused && this._focusedIndex === 0
      const attrs = isFocused ? ATTR_INVERSE : 0

      buffer.write(currentX, bounds.y, this._homeIcon, { fg, bg, attrs })
      currentX += stringWidth(this._homeIcon)

      if (visibleItems.length > 1 || hasCollapsed) {
        buffer.write(currentX, bounds.y, this._separator, { fg, bg, attrs: ATTR_DIM })
        currentX += stringWidth(this._separator)
      }
    }

    // Render collapsed indicator
    if (hasCollapsed) {
      buffer.write(currentX, bounds.y, '...', { fg, bg, attrs: ATTR_DIM })
      currentX += 3

      buffer.write(currentX, bounds.y, this._separator, { fg, bg, attrs: ATTR_DIM })
      currentX += stringWidth(this._separator)
    }

    // Render visible items (skip first if it was the home)
    const startIndex = this._showHome && visibleItems.length > 0 ? 1 : 0

    for (let i = startIndex; i < visibleItems.length; i++) {
      const item = visibleItems[i]
      if (!item) continue
      const actualIndex = this._items.indexOf(item)
      const isLast = actualIndex === this._items.length - 1
      const isFocused = this._isFocused && this._focusedIndex === actualIndex

      let attrs = 0
      if (item.disabled) {
        attrs = ATTR_DIM
      } else if (isFocused) {
        attrs = ATTR_INVERSE
      } else if (isLast && this._highlightCurrent) {
        attrs = ATTR_BOLD
      } else {
        attrs = ATTR_UNDERLINE
      }

      // Render icon
      if (item.icon) {
        buffer.write(currentX, bounds.y, item.icon + ' ', { fg, bg, attrs })
        currentX += stringWidth(item.icon) + 1
      }

      // Render label
      const maxLabelWidth = bounds.x + bounds.width - currentX - (isLast ? 0 : stringWidth(this._separator))
      let label = item.label
      if (stringWidth(label) > maxLabelWidth) {
        label = truncateToWidth(label, maxLabelWidth)
      }

      buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
      currentX += stringWidth(label)

      // Render separator
      if (!isLast && currentX < bounds.x + bounds.width) {
        buffer.write(currentX, bounds.y, this._separator, { fg, bg, attrs: ATTR_DIM })
        currentX += stringWidth(this._separator)
      }

      // Check if we've exceeded bounds
      if (currentX >= bounds.x + bounds.width) break
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a breadcrumb widget.
 *
 * @param props - Breadcrumb properties
 * @returns Breadcrumb node
 *
 * @example
 * ```typescript
 * // Basic breadcrumb for file navigation
 * const path = breadcrumb()
 *   .items([
 *     { label: 'Home', value: '/' },
 *     { label: 'Documents', value: '/documents' },
 *     { label: 'Projects', value: '/documents/projects' },
 *     { label: 'my-app', value: '/documents/projects/my-app' }
 *   ])
 *   .onNavigate((item, index) => {
 *     navigateToPath(item.value)
 *   })
 *
 * // With icons
 * const iconPath = breadcrumb()
 *   .push({ label: 'Root', value: '/', icon: '\ud83c\udfe0' })
 *   .push({ label: 'src', value: '/src', icon: '\ud83d\udcc1' })
 *   .push({ label: 'index.ts', value: '/src/index.ts', icon: '\ud83d\udcdd' })
 *
 * // With max items (collapse middle)
 * const longPath = breadcrumb({ maxItems: 4 })
 *   .items([...manyItems])
 *   .onCollapsedClick(items => {
 *     showDropdown(items)
 *   })
 *
 * // Custom separator
 * const customSep = breadcrumb({ separator: ' > ', showHome: false })
 *   .items([
 *     { label: 'Category', value: 'cat' },
 *     { label: 'Subcategory', value: 'subcat' },
 *     { label: 'Item', value: 'item' }
 *   ])
 * ```
 */
export function breadcrumb(props?: BreadcrumbProps): BreadcrumbNode {
  return new BreadcrumbNodeImpl(props)
}
