/**
 * @oxog/tui - Statusbar Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Status item alignment.
 */
export type StatusItemAlign = 'left' | 'center' | 'right'

/**
 * Status item for the statusbar.
 */
export interface StatusItem {
  /** Unique item identifier */
  id: string
  /** Item text content */
  text: string
  /** Icon character */
  icon?: string
  /** Item alignment */
  align?: StatusItemAlign
  /** Priority (higher = shown first when space is limited) */
  priority?: number
  /** Minimum width */
  minWidth?: number
  /** Fixed width */
  width?: number
  /** Item is clickable */
  clickable?: boolean
  /** Tooltip text */
  tooltip?: string
  /** Custom foreground color */
  fg?: number
  /** Custom background color */
  bg?: number
  /** Item is visible */
  visible?: boolean
}

/**
 * Statusbar widget properties.
 */
export interface StatusbarProps {
  /** Status items */
  items?: StatusItem[]
  /** Show separator between items */
  showSeparator?: boolean
  /** Separator character */
  separator?: string
  /** Background style */
  style?: 'filled' | 'inverse'
  /** Padding between items */
  padding?: number
}

/**
 * Statusbar node interface.
 */
export interface StatusbarNode extends Node {
  readonly type: 'statusbar'

  // Configuration
  items(itemList: StatusItem[]): this
  addItem(item: StatusItem): this
  removeItem(id: string): this
  updateItem(id: string, updates: Partial<StatusItem>): this
  showSeparator(show: boolean): this
  separator(sep: string): this
  style(style: 'filled' | 'inverse'): this
  padding(pad: number): this

  // Convenience methods
  setMessage(text: string, timeout?: number): this
  clearMessage(): this
  setProgress(value: number, max?: number): this
  clearProgress(): this

  // Events
  onItemClick(handler: (item: StatusItem) => void): this

  // State
  readonly itemList: StatusItem[]
  readonly message: string | null
  readonly progressValue: number
  readonly progressMax: number
}

// ============================================================
// Implementation
// ============================================================

class StatusbarNodeImpl extends LeafNode implements StatusbarNode {
  readonly type = 'statusbar' as const

  private _items: StatusItem[] = []
  private _showSeparator: boolean = true
  private _separator: string = '|'
  private _statusbarStyle: 'filled' | 'inverse' = 'filled'
  private _padding: number = 1

  private _message: string | null = null
  private _messageTimeout: ReturnType<typeof setTimeout> | null = null
  private _progressValue: number = 0
  private _progressMax: number = 100
  private _showProgress: boolean = false

  private _onItemClickHandlers: ((item: StatusItem) => void)[] = []

  constructor(props?: StatusbarProps) {
    super()
    if (props) {
      if (props.items) this._items = props.items
      if (props.showSeparator !== undefined) this._showSeparator = props.showSeparator
      if (props.separator !== undefined) this._separator = props.separator
      if (props.style) this._statusbarStyle = props.style
      if (props.padding !== undefined) this._padding = props.padding
    }
  }

  // State getters
  get itemList(): StatusItem[] {
    return [...this._items]
  }

  get message(): string | null {
    return this._message
  }

  get progressValue(): number {
    return this._progressValue
  }

  get progressMax(): number {
    return this._progressMax
  }

  // Configuration
  items(itemList: StatusItem[]): this {
    this._items = itemList
    this.markDirty()
    return this
  }

  addItem(item: StatusItem): this {
    this._items.push(item)
    this.markDirty()
    return this
  }

  removeItem(id: string): this {
    const index = this._items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this._items.splice(index, 1)
      this.markDirty()
    }
    return this
  }

  updateItem(id: string, updates: Partial<StatusItem>): this {
    const item = this._items.find((i) => i.id === id)
    if (item) {
      Object.assign(item, updates)
      this.markDirty()
    }
    return this
  }

  showSeparator(show: boolean): this {
    this._showSeparator = show
    this.markDirty()
    return this
  }

  separator(sep: string): this {
    this._separator = sep
    this.markDirty()
    return this
  }

  style(style: 'filled' | 'inverse'): this {
    this._statusbarStyle = style
    this.markDirty()
    return this
  }

  padding(pad: number): this {
    this._padding = pad
    this.markDirty()
    return this
  }

  // Convenience methods
  setMessage(text: string, timeout?: number): this {
    if (this._messageTimeout) {
      clearTimeout(this._messageTimeout)
      this._messageTimeout = null
    }

    this._message = text
    this.markDirty()

    if (timeout && timeout > 0) {
      this._messageTimeout = setTimeout(() => {
        this._message = null
        this._messageTimeout = null
        this.markDirty()
      }, timeout)
    }

    return this
  }

  clearMessage(): this {
    if (this._messageTimeout) {
      clearTimeout(this._messageTimeout)
      this._messageTimeout = null
    }
    this._message = null
    this.markDirty()
    return this
  }

  /**
   * Dispose of statusbar and clear pending timeouts.
   */
  override dispose(): void {
    if (this._disposed) return
    // Clear message timeout
    if (this._messageTimeout) {
      clearTimeout(this._messageTimeout)
      this._messageTimeout = null
    }
    // Clear handlers
    this._onItemClickHandlers = []
    super.dispose()
  }

  setProgress(value: number, max?: number): this {
    this._progressValue = Math.max(0, Math.min(value, max ?? this._progressMax))
    if (max !== undefined) {
      this._progressMax = max
    }
    this._showProgress = true
    this.markDirty()
    return this
  }

  clearProgress(): this {
    this._showProgress = false
    this._progressValue = 0
    this.markDirty()
    return this
  }

  // Events
  onItemClick(handler: (item: StatusItem) => void): this {
    this._onItemClickHandlers.push(handler)
    return this
  }

  // Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    // Check if click is in statusbar area
    if (y !== bounds.y || x < bounds.x || x >= bounds.x + bounds.width) {
      return false
    }

    if (action === 'press') {
      // Find clicked item
      const clickedItem = this.getItemAtPosition(x - bounds.x)
      if (clickedItem && clickedItem.clickable) {
        for (const handler of this._onItemClickHandlers) {
          handler(clickedItem)
        }
        return true
      }
    }

    return false
  }

  private getItemAtPosition(relX: number): StatusItem | null {
    const bounds = this._bounds
    if (!bounds) return null

    // Build layout to determine positions
    const leftItems = this._items.filter((i) => i.align !== 'center' && i.align !== 'right' && i.visible !== false)
    const centerItems = this._items.filter((i) => i.align === 'center' && i.visible !== false)
    const rightItems = this._items.filter((i) => i.align === 'right' && i.visible !== false)

    // Sort by priority
    const sortByPriority = (a: StatusItem, b: StatusItem) => (b.priority ?? 0) - (a.priority ?? 0)
    leftItems.sort(sortByPriority)
    centerItems.sort(sortByPriority)
    rightItems.sort(sortByPriority)

    let currentX = this._padding
    const sepWidth = this._showSeparator ? stringWidth(this._separator) + 2 : 1

    // Check left items
    for (const item of leftItems) {
      const itemWidth = this.getItemWidth(item)
      if (relX >= currentX && relX < currentX + itemWidth) {
        return item
      }
      currentX += itemWidth + sepWidth
    }

    // Check right items (calculate from right edge)
    let rightX = bounds.width - this._padding
    for (const item of [...rightItems].reverse()) {
      const itemWidth = this.getItemWidth(item)
      rightX -= itemWidth
      if (relX >= rightX && relX < rightX + itemWidth) {
        return item
      }
      rightX -= sepWidth
    }

    // Check center items
    if (centerItems.length > 0) {
      let totalCenterWidth = 0
      for (const item of centerItems) {
        totalCenterWidth += this.getItemWidth(item)
      }
      totalCenterWidth += (centerItems.length - 1) * sepWidth

      let centerX = Math.floor((bounds.width - totalCenterWidth) / 2)
      for (const item of centerItems) {
        const itemWidth = this.getItemWidth(item)
        if (relX >= centerX && relX < centerX + itemWidth) {
          return item
        }
        centerX += itemWidth + sepWidth
      }
    }

    return null
  }

  private getItemWidth(item: StatusItem): number {
    if (item.width) return item.width

    let width = stringWidth(item.text)
    if (item.icon) width += stringWidth(item.icon) + 1

    if (item.minWidth && width < item.minWidth) {
      width = item.minWidth
    }

    return width
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const baseAttrs = this._statusbarStyle === 'inverse' ? ATTR_INVERSE : 0

    // Fill background
    for (let col = bounds.x; col < bounds.x + bounds.width; col++) {
      buffer.set(col, bounds.y, { char: ' ', fg, bg, attrs: baseAttrs })
    }

    // If there's a message, show it prominently
    if (this._message) {
      const msgText = truncateToWidth(this._message, bounds.width - 2)
      buffer.write(bounds.x + 1, bounds.y, msgText, { fg, bg, attrs: baseAttrs })
      return
    }

    // Separate items by alignment
    const leftItems = this._items.filter((i) => i.align !== 'center' && i.align !== 'right' && i.visible !== false)
    const centerItems = this._items.filter((i) => i.align === 'center' && i.visible !== false)
    const rightItems = this._items.filter((i) => i.align === 'right' && i.visible !== false)

    // Sort by priority
    const sortByPriority = (a: StatusItem, b: StatusItem) => (b.priority ?? 0) - (a.priority ?? 0)
    leftItems.sort(sortByPriority)
    centerItems.sort(sortByPriority)
    rightItems.sort(sortByPriority)

    const sepText = this._showSeparator ? ` ${this._separator} ` : ' '
    const sepWidth = stringWidth(sepText)

    // Render left items
    let leftX = bounds.x + this._padding
    for (let i = 0; i < leftItems.length; i++) {
      const item = leftItems[i]
      if (!item) continue
      const itemWidth = this.getItemWidth(item)

      if (leftX + itemWidth > bounds.x + bounds.width - this._padding) break // No more space

      this.renderItem(buffer, item, leftX, bounds.y, itemWidth, fg, bg, baseAttrs)
      leftX += itemWidth

      if (i < leftItems.length - 1 && this._showSeparator) {
        buffer.write(leftX, bounds.y, sepText, { fg, bg, attrs: baseAttrs | ATTR_DIM })
        leftX += sepWidth
      } else {
        leftX += 1
      }
    }

    // Render right items (from right edge)
    let rightX = bounds.x + bounds.width - this._padding
    for (let i = rightItems.length - 1; i >= 0; i--) {
      const item = rightItems[i]
      if (!item) continue
      const itemWidth = this.getItemWidth(item)

      rightX -= itemWidth
      if (rightX < leftX) break // Overlapping with left items

      this.renderItem(buffer, item, rightX, bounds.y, itemWidth, fg, bg, baseAttrs)

      if (i > 0 && this._showSeparator) {
        rightX -= sepWidth
        buffer.write(rightX, bounds.y, sepText, { fg, bg, attrs: baseAttrs | ATTR_DIM })
      } else {
        rightX -= 1
      }
    }

    // Render center items
    if (centerItems.length > 0) {
      let totalCenterWidth = 0
      for (const item of centerItems) {
        totalCenterWidth += this.getItemWidth(item)
      }
      totalCenterWidth += (centerItems.length - 1) * (this._showSeparator ? sepWidth : 1)

      let centerX = bounds.x + Math.floor((bounds.width - totalCenterWidth) / 2)

      // Only render if there's space
      if (centerX > leftX && centerX + totalCenterWidth < rightX) {
        for (let i = 0; i < centerItems.length; i++) {
          const item = centerItems[i]
          if (!item) continue
          const itemWidth = this.getItemWidth(item)

          this.renderItem(buffer, item, centerX, bounds.y, itemWidth, fg, bg, baseAttrs)
          centerX += itemWidth

          if (i < centerItems.length - 1) {
            if (this._showSeparator) {
              buffer.write(centerX, bounds.y, sepText, { fg, bg, attrs: baseAttrs | ATTR_DIM })
              centerX += sepWidth
            } else {
              centerX += 1
            }
          }
        }
      }
    }

    // Render progress if active
    if (this._showProgress) {
      this.renderProgress(buffer, bounds.x, bounds.y, bounds.width, fg, bg, baseAttrs)
    }
  }

  private renderItem(
    buffer: Buffer,
    item: StatusItem,
    x: number,
    y: number,
    width: number,
    defaultFg: number,
    defaultBg: number,
    baseAttrs: number
  ): void {
    const fg = item.fg ?? defaultFg
    const bg = item.bg ?? defaultBg
    let attrs = baseAttrs

    if (item.clickable) {
      attrs |= ATTR_BOLD
    }

    let text = ''
    if (item.icon) {
      text += item.icon + ' '
    }
    text += item.text

    // Truncate or pad to width
    if (stringWidth(text) > width) {
      text = truncateToWidth(text, width)
    } else if (stringWidth(text) < width) {
      text = padToWidth(text, width, 'left')
    }

    buffer.write(x, y, text, { fg, bg, attrs })
  }

  private renderProgress(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    baseAttrs: number
  ): void {
    // Reserve space for progress indicator (last 20 chars or 1/4 of width)
    const progressWidth = Math.min(20, Math.floor(width / 4))
    const startX = x + width - progressWidth - this._padding

    const percent = this._progressMax > 0 ? this._progressValue / this._progressMax : 0
    const filledWidth = Math.floor(progressWidth * percent)

    // Draw progress bar
    for (let i = 0; i < progressWidth; i++) {
      const char = i < filledWidth ? '\u2588' : '\u2591' // █ or ░
      buffer.set(startX + i, y, { char, fg, bg, attrs: baseAttrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a statusbar widget.
 *
 * @param props - Statusbar properties
 * @returns Statusbar node
 *
 * @example
 * ```typescript
 * // Basic statusbar
 * const status = statusbar()
 *   .items([
 *     { id: 'mode', text: 'INSERT', align: 'left' },
 *     { id: 'file', text: 'index.ts', align: 'center' },
 *     { id: 'line', text: 'Ln 42, Col 15', align: 'right' },
 *     { id: 'encoding', text: 'UTF-8', align: 'right' }
 *   ])
 *
 * // With icons and priority
 * const richStatus = statusbar()
 *   .addItem({ id: 'git', text: 'main', icon: '\u2387', align: 'left', priority: 10 })
 *   .addItem({ id: 'errors', text: '3', icon: '\u2717', align: 'right', priority: 5, fg: 0xff0000ff })
 *   .addItem({ id: 'warnings', text: '12', icon: '\u26a0', align: 'right', priority: 4 })
 *
 * // Show temporary message
 * status.setMessage('File saved successfully!', 3000) // Clears after 3 seconds
 *
 * // Show progress
 * status.setProgress(45, 100)
 *
 * // With click handlers
 * const clickableStatus = statusbar()
 *   .addItem({ id: 'branch', text: 'main', clickable: true })
 *   .onItemClick(item => {
 *     if (item.id === 'branch') {
 *       showBranchPicker()
 *     }
 *   })
 * ```
 */
export function statusbar(props?: StatusbarProps): StatusbarNode {
  return new StatusbarNodeImpl(props)
}
