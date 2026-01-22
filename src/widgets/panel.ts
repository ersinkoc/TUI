/**
 * @oxog/tui - Panel Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_DIM, ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Panel title alignment.
 */
export type PanelTitleAlign = 'left' | 'center' | 'right'

/**
 * Panel action button.
 */
export interface PanelAction {
  /** Action identifier */
  id: string
  /** Action label or icon */
  label: string
  /** Action tooltip */
  tooltip?: string
  /** Action is disabled */
  disabled?: boolean
}

/**
 * Panel widget properties.
 */
export interface PanelProps {
  /** Panel title */
  title?: string
  /** Title alignment */
  titleAlign?: PanelTitleAlign
  /** Subtitle */
  subtitle?: string
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Collapsible */
  collapsible?: boolean
  /** Initial collapsed state */
  collapsed?: boolean
  /** Panel actions (shown in header) */
  actions?: PanelAction[]
  /** Show header */
  showHeader?: boolean
  /** Header height (lines) */
  headerHeight?: number
  /** Footer text */
  footer?: string
  /** Padding inside panel */
  padding?: number
}

/**
 * Panel node interface.
 */
export interface PanelNode extends Node {
  readonly type: 'panel'

  // Configuration
  title(text: string): this
  titleAlign(align: PanelTitleAlign): this
  subtitle(text: string): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  collapsible(enable: boolean): this
  collapsed(state: boolean): this
  actions(actionList: PanelAction[]): this
  addAction(action: PanelAction): this
  removeAction(id: string): this
  showHeader(show: boolean): this
  headerHeight(height: number): this
  footer(text: string): this
  padding(pad: number): this

  // Control
  toggle(): this
  expand(): this
  collapse(): this

  // Content
  content(node: Node): this

  // Events
  onToggle(handler: (collapsed: boolean) => void): this
  onAction(handler: (action: PanelAction) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly isCollapsed: boolean
  readonly panelTitle: string
  readonly contentBounds: { x: number; y: number; width: number; height: number }
}

// ============================================================
// Implementation
// ============================================================

class PanelNodeImpl extends ContainerNode implements PanelNode {
  readonly type = 'panel' as const

  private _title: string = ''
  private _titleAlign: PanelTitleAlign = 'left'
  private _subtitle: string = ''
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'rounded'
  private _collapsible: boolean = false
  private _collapsed: boolean = false
  private _actions: PanelAction[] = []
  private _showHeader: boolean = true
  private _headerHeight: number = 1
  private _footer: string = ''
  private _padding: number = 0

  private _isFocused: boolean = false
  private _contentNode: Node | null = null

  private _onToggleHandlers: ((collapsed: boolean) => void)[] = []
  private _onActionHandlers: ((action: PanelAction) => void)[] = []

  constructor(props?: PanelProps) {
    super()
    if (props) {
      if (props.title) this._title = props.title
      if (props.titleAlign) this._titleAlign = props.titleAlign
      if (props.subtitle) this._subtitle = props.subtitle
      if (props.border) this._border = props.border
      if (props.collapsible !== undefined) this._collapsible = props.collapsible
      if (props.collapsed !== undefined) this._collapsed = props.collapsed
      if (props.actions) this._actions = props.actions
      if (props.showHeader !== undefined) this._showHeader = props.showHeader
      if (props.headerHeight !== undefined) this._headerHeight = props.headerHeight
      if (props.footer !== undefined) this._footer = props.footer
      if (props.padding !== undefined) this._padding = props.padding
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get isCollapsed(): boolean {
    return this._collapsed
  }

  get panelTitle(): string {
    return this._title
  }

  get contentBounds(): { x: number; y: number; width: number; height: number } {
    const bounds = this._bounds
    if (!bounds) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const borderOffset = this._border !== 'none' ? 1 : 0
    const headerOffset = this._showHeader ? this._headerHeight : 0
    const footerOffset = this._footer ? 1 : 0

    return {
      x: bounds.x + borderOffset + this._padding,
      y: bounds.y + borderOffset + headerOffset + this._padding,
      width: Math.max(0, bounds.width - 2 * borderOffset - 2 * this._padding),
      height: Math.max(0, bounds.height - 2 * borderOffset - headerOffset - footerOffset - 2 * this._padding)
    }
  }

  // Configuration
  title(text: string): this {
    this._title = text
    this.markDirty()
    return this
  }

  titleAlign(align: PanelTitleAlign): this {
    this._titleAlign = align
    this.markDirty()
    return this
  }

  subtitle(text: string): this {
    this._subtitle = text
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  collapsible(enable: boolean): this {
    this._collapsible = enable
    this.markDirty()
    return this
  }

  collapsed(state: boolean): this {
    if (this._collapsed !== state) {
      this._collapsed = state
      this.markDirty()
      for (const handler of this._onToggleHandlers) {
        handler(state)
      }
    }
    return this
  }

  actions(actionList: PanelAction[]): this {
    this._actions = actionList
    this.markDirty()
    return this
  }

  addAction(action: PanelAction): this {
    this._actions.push(action)
    this.markDirty()
    return this
  }

  removeAction(id: string): this {
    const index = this._actions.findIndex((a) => a.id === id)
    if (index !== -1) {
      this._actions.splice(index, 1)
      this.markDirty()
    }
    return this
  }

  showHeader(show: boolean): this {
    this._showHeader = show
    this.markDirty()
    return this
  }

  headerHeight(height: number): this {
    this._headerHeight = height
    this.markDirty()
    return this
  }

  footer(text: string): this {
    this._footer = text
    this.markDirty()
    return this
  }

  padding(pad: number): this {
    this._padding = pad
    this.markDirty()
    return this
  }

  // Control
  toggle(): this {
    if (this._collapsible) {
      this.collapsed(!this._collapsed)
    }
    return this
  }

  expand(): this {
    return this.collapsed(false)
  }

  collapse(): this {
    return this.collapsed(true)
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
  onToggle(handler: (collapsed: boolean) => void): this {
    this._onToggleHandlers.push(handler)
    return this
  }

  onAction(handler: (action: PanelAction) => void): this {
    this._onActionHandlers.push(handler)
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
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'enter':
      case 'space':
        if (this._collapsible) {
          this.toggle()
          return true
        }
        break
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

    // Check header click
    if (action === 'press' && this._showHeader) {
      const borderOffset = this._border !== 'none' ? 1 : 0
      const headerY = bounds.y + borderOffset

      if (y >= headerY && y < headerY + this._headerHeight) {
        // Check if clicking on collapse toggle
        if (this._collapsible && x === bounds.x + borderOffset) {
          this.toggle()
          return true
        }

        // Check if clicking on action buttons
        const actionsStartX = bounds.x + bounds.width - borderOffset - this.getActionsWidth()
        if (x >= actionsStartX) {
          const clickedAction = this.getActionAtPosition(x - actionsStartX)
          if (clickedAction && !clickedAction.disabled) {
            for (const handler of this._onActionHandlers) {
              handler(clickedAction)
            }
            return true
          }
        }

        // Click on header - focus panel
        this._isFocused = true
        this.markDirty()
        return true
      }
    }

    return false
  }

  private getActionsWidth(): number {
    let width = 0
    for (const action of this._actions) {
      width += stringWidth(action.label) + 1 // +1 for spacing
    }
    return width
  }

  private getActionAtPosition(relX: number): PanelAction | null {
    let currentX = 0
    for (const action of this._actions) {
      const actionWidth = stringWidth(action.label) + 1
      if (relX >= currentX && relX < currentX + actionWidth) {
        return action
      }
      currentX += actionWidth
    }
    return null
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const borderOffset = this._border !== 'none' ? 1 : 0
    const headerOffset = this._showHeader ? this._headerHeight : 0

    // Calculate actual height (collapsed = header + border only)
    const actualHeight = this._collapsed
      ? headerOffset + 2 * borderOffset
      : bounds.height

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      drawRect(buffer, bounds.x, bounds.y, bounds.width, actualHeight, chars, { fg, bg, attrs: 0 })
    }

    // Draw header
    if (this._showHeader) {
      this.renderHeader(buffer, bounds.x, bounds.y, bounds.width, fg, bg, borderOffset)
    }

    // Draw content (if not collapsed)
    if (!this._collapsed && this._contentNode) {
      const contentBounds = this.contentBounds
      // Set bounds on content node
      ;(this._contentNode as any)._bounds = contentBounds
      ;(this._contentNode as any).render(buffer, parentStyle)
    }

    // Draw footer
    if (!this._collapsed && this._footer) {
      this.renderFooter(buffer, bounds.x, bounds.y + actualHeight - 1, bounds.width, fg, bg, borderOffset)
    }
  }

  private renderHeader(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    borderOffset: number
  ): void {
    const headerY = y + borderOffset
    const headerWidth = width - 2 * borderOffset
    const headerStartX = x + borderOffset

    // Clear header area
    for (let col = headerStartX; col < headerStartX + headerWidth; col++) {
      buffer.set(col, headerY, { char: ' ', fg, bg, attrs: 0 })
    }

    let titleStartX = headerStartX
    let availableWidth = headerWidth

    // Draw collapse indicator
    if (this._collapsible) {
      const indicator = this._collapsed ? '\u25b6' : '\u25bc' // ▶ or ▼
      buffer.write(headerStartX, headerY, indicator, { fg, bg, attrs: 0 })
      titleStartX += 2
      availableWidth -= 2
    }

    // Calculate actions width
    const actionsWidth = this.getActionsWidth()
    if (actionsWidth > 0) {
      availableWidth -= actionsWidth
    }

    // Build title text
    let titleText = this._title
    if (this._subtitle) {
      titleText += ` - ${this._subtitle}`
    }

    // Truncate if needed
    if (stringWidth(titleText) > availableWidth) {
      titleText = truncateToWidth(titleText, availableWidth)
    }

    // Calculate title position based on alignment
    let titleX = titleStartX
    switch (this._titleAlign) {
      case 'center':
        titleX = titleStartX + Math.floor((availableWidth - stringWidth(titleText)) / 2)
        break
      case 'right':
        titleX = titleStartX + availableWidth - stringWidth(titleText)
        break
    }

    // Draw title
    const titleAttrs = this._isFocused ? ATTR_BOLD : 0
    buffer.write(titleX, headerY, titleText, { fg, bg, attrs: titleAttrs })

    // Draw actions
    if (this._actions.length > 0) {
      let actionX = x + width - borderOffset - actionsWidth
      for (const action of this._actions) {
        const attrs = action.disabled ? ATTR_DIM : 0
        buffer.write(actionX, headerY, action.label, { fg, bg, attrs })
        actionX += stringWidth(action.label) + 1
      }
    }
  }

  private renderFooter(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    borderOffset: number
  ): void {
    const footerWidth = width - 2 * borderOffset - 2
    const footerStartX = x + borderOffset + 1

    let footerText = this._footer
    if (stringWidth(footerText) > footerWidth) {
      footerText = truncateToWidth(footerText, footerWidth)
    }

    buffer.write(footerStartX, y, footerText, { fg, bg, attrs: ATTR_DIM })
  }

  /**
   * Dispose of panel and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._actions = []
    this._contentNode = null
    this._onToggleHandlers = []
    this._onActionHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a panel widget.
 *
 * @param props - Panel properties
 * @returns Panel node
 *
 * @example
 * ```typescript
 * // Basic panel
 * const p = panel({ title: 'Settings' })
 *   .content(settingsForm)
 *   .border('rounded')
 *
 * // Collapsible panel
 * const collapsible = panel({
 *   title: 'Advanced Options',
 *   collapsible: true,
 *   collapsed: true
 * })
 *   .content(advancedContent)
 *   .onToggle(collapsed => {
 *     console.log(collapsed ? 'Collapsed' : 'Expanded')
 *   })
 *
 * // Panel with actions
 * const actionPanel = panel({ title: 'Files' })
 *   .actions([
 *     { id: 'refresh', label: '\u21bb' }, // ↻
 *     { id: 'add', label: '+' }
 *   ])
 *   .onAction(action => {
 *     if (action.id === 'refresh') refreshFiles()
 *     if (action.id === 'add') addNewFile()
 *   })
 *   .content(fileList)
 *
 * // Panel with subtitle and footer
 * const detailed = panel({
 *   title: 'User Profile',
 *   subtitle: 'John Doe',
 *   footer: 'Last updated: 2 hours ago'
 * })
 *   .titleAlign('center')
 *   .padding(1)
 *   .content(profileContent)
 * ```
 */
export function panel(props?: PanelProps): PanelNode {
  return new PanelNodeImpl(props)
}
