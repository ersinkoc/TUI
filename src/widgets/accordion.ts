/**
 * @oxog/tui - Accordion Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode, BaseNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_INVERSE } from '../constants'
import { stringWidth, truncateToWidth } from '../utils/unicode'

// ============================================================
// Types
// ============================================================

/**
 * Accordion panel configuration.
 */
export interface AccordionPanel {
  /** Panel ID */
  id: string
  /** Panel title */
  title: string
  /** Panel content */
  content: Node
  /** Initially expanded */
  expanded?: boolean
  /** Panel is disabled */
  disabled?: boolean
  /** Panel icon */
  icon?: string
}

/**
 * Accordion widget properties.
 */
export interface AccordionProps {
  /** Accordion panels */
  panels?: AccordionPanel[]
  /** Allow multiple expanded panels */
  multiple?: boolean
  /** Collapsible (can close all) */
  collapsible?: boolean
  /** Border between panels */
  showBorders?: boolean
  /** Expand icon */
  expandIcon?: string
  /** Collapse icon */
  collapseIcon?: string
}

/**
 * Accordion node interface.
 */
export interface AccordionNode extends Node {
  readonly type: 'accordion'

  // Configuration
  panels(items: AccordionPanel[]): this
  addPanel(panel: AccordionPanel): this
  removePanel(id: string): this
  multiple(enabled: boolean): this
  collapsible(enabled: boolean): this
  showBorders(enabled: boolean): this
  expandIcon(icon: string): this
  collapseIcon(icon: string): this

  // Control
  expand(id: string): this
  collapse(id: string): this
  toggle(id: string): this
  expandAll(): this
  collapseAll(): this
  focus(): this
  blur(): this

  // Navigation
  focusNext(): this
  focusPrevious(): this

  // Events
  onExpand(handler: (id: string) => void): this
  onCollapse(handler: (id: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Handler cleanup - prevent memory leaks
  offExpand(handler: (id: string) => void): this
  offCollapse(handler: (id: string) => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this
  clearHandlers(): this

  // State
  readonly expandedPanels: string[]
  readonly focusedPanel: string | null
  readonly panelCount: number
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class AccordionNodeImpl extends ContainerNode implements AccordionNode {
  readonly type = 'accordion' as const

  private _panels: AccordionPanel[] = []
  private _expandedPanels: Set<string> = new Set()
  private _multiple: boolean = false
  private _collapsible: boolean = true
  private _showBorders: boolean = true
  private _expandIcon: string = '▶'
  private _collapseIcon: string = '▼'
  private _focusedIndex: number = 0
  private _focused: boolean = false

  private _onExpandHandlers: ((id: string) => void)[] = []
  private _onCollapseHandlers: ((id: string) => void)[] = []
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

  constructor(props?: AccordionProps) {
    super()
    if (props) {
      if (props.panels) {
        this._panels = props.panels
        for (const panel of props.panels) {
          if (panel.expanded) {
            this._expandedPanels.add(panel.id)
          }
          if (panel.content instanceof BaseNode) {
            panel.content._parent = this
          }
        }
      }
      if (props.multiple !== undefined) this._multiple = props.multiple
      if (props.collapsible !== undefined) this._collapsible = props.collapsible
      if (props.showBorders !== undefined) this._showBorders = props.showBorders
      if (props.expandIcon) this._expandIcon = props.expandIcon
      if (props.collapseIcon) this._collapseIcon = props.collapseIcon
    }
  }

  get expandedPanels(): string[] {
    return Array.from(this._expandedPanels)
  }

  get focusedPanel(): string | null {
    const panel = this._panels[this._focusedIndex]
    return panel?.id ?? null
  }

  get panelCount(): number {
    return this._panels.length
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  panels(items: AccordionPanel[]): this {
    // Clear old parents
    for (const panel of this._panels) {
      if (panel.content instanceof BaseNode) {
        panel.content._parent = null
      }
    }

    this._panels = items
    this._expandedPanels.clear()

    for (const panel of items) {
      if (panel.expanded) {
        this._expandedPanels.add(panel.id)
      }
      if (panel.content instanceof BaseNode) {
        panel.content._parent = this
      }
    }

    this._focusedIndex = 0
    this.markDirty()
    return this
  }

  addPanel(panel: AccordionPanel): this {
    this._panels.push(panel)
    if (panel.expanded) {
      if (!this._multiple) {
        this._expandedPanels.clear()
      }
      this._expandedPanels.add(panel.id)
    }
    if (panel.content instanceof BaseNode) {
      panel.content._parent = this
    }
    this.markDirty()
    return this
  }

  removePanel(id: string): this {
    const index = this._panels.findIndex(p => p.id === id)
    if (index !== -1) {
      const panel = this._panels[index]!
      if (panel.content instanceof BaseNode) {
        panel.content._parent = null
      }
      this._panels.splice(index, 1)
      this._expandedPanels.delete(id)
      if (this._focusedIndex >= this._panels.length) {
        this._focusedIndex = Math.max(0, this._panels.length - 1)
      }
      this.markDirty()
    }
    return this
  }

  multiple(enabled: boolean): this {
    this._multiple = enabled
    if (!enabled && this._expandedPanels.size > 1) {
      // Keep only first expanded
      const first = this._expandedPanels.values().next().value
      this._expandedPanels.clear()
      if (first) this._expandedPanels.add(first)
    }
    this.markDirty()
    return this
  }

  collapsible(enabled: boolean): this {
    this._collapsible = enabled
    return this
  }

  showBorders(enabled: boolean): this {
    this._showBorders = enabled
    this.markDirty()
    return this
  }

  expandIcon(icon: string): this {
    this._expandIcon = icon
    this.markDirty()
    return this
  }

  collapseIcon(icon: string): this {
    this._collapseIcon = icon
    this.markDirty()
    return this
  }

  // Control
  expand(id: string): this {
    const panel = this._panels.find(p => p.id === id)
    if (!panel || panel.disabled) return this

    if (!this._multiple) {
      this._expandedPanels.clear()
    }
    this._expandedPanels.add(id)
    this.markDirty()

    for (const handler of this._onExpandHandlers) {
      handler(id)
    }
    return this
  }

  collapse(id: string): this {
    if (!this._collapsible && this._expandedPanels.size === 1 && this._expandedPanels.has(id)) {
      return this
    }

    if (this._expandedPanels.delete(id)) {
      this.markDirty()
      for (const handler of this._onCollapseHandlers) {
        handler(id)
      }
    }
    return this
  }

  toggle(id: string): this {
    if (this._expandedPanels.has(id)) {
      return this.collapse(id)
    }
    return this.expand(id)
  }

  expandAll(): this {
    if (!this._multiple) return this
    for (const panel of this._panels) {
      if (!panel.disabled) {
        this._expandedPanels.add(panel.id)
      }
    }
    this.markDirty()
    return this
  }

  collapseAll(): this {
    if (!this._collapsible) return this
    this._expandedPanels.clear()
    this.markDirty()
    return this
  }

  override focus(): this {
    if (!this._focused && !this._disposed) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  override blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  // Navigation
  focusNext(): this {
    if (this._panels.length === 0) return this
    this._focusedIndex = (this._focusedIndex + 1) % this._panels.length
    this.markDirty()
    return this
  }

  focusPrevious(): this {
    if (this._panels.length === 0) return this
    this._focusedIndex = (this._focusedIndex - 1 + this._panels.length) % this._panels.length
    this.markDirty()
    return this
  }

  // Events
  onExpand(handler: (id: string) => void): this {
    this._onExpandHandlers.push(handler)
    return this
  }

  onCollapse(handler: (id: string) => void): this {
    this._onCollapseHandlers.push(handler)
    return this
  }

  override onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  override onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  // Handler cleanup methods - prevent memory leaks
  offExpand(handler: (id: string) => void): this {
    const index = this._onExpandHandlers.indexOf(handler)
    if (index > -1) {
      this._onExpandHandlers.splice(index, 1)
    }
    return this
  }

  offCollapse(handler: (id: string) => void): this {
    const index = this._onCollapseHandlers.indexOf(handler)
    if (index > -1) {
      this._onCollapseHandlers.splice(index, 1)
    }
    return this
  }

  offFocus(handler: () => void): this {
    const index = this._onFocusHandlers.indexOf(handler)
    if (index > -1) {
      this._onFocusHandlers.splice(index, 1)
    }
    return this
  }

  offBlur(handler: () => void): this {
    const index = this._onBlurHandlers.indexOf(handler)
    if (index > -1) {
      this._onBlurHandlers.splice(index, 1)
    }
    return this
  }

  clearHandlers(): this {
    this._onExpandHandlers = []
    this._onCollapseHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    return this
  }

  /**
   * Dispose of accordion and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    // Clear panel content parents
    for (const panel of this._panels) {
      if (panel.content instanceof BaseNode) {
        panel.content._parent = null
      }
    }
    this._panels = []
    this._expandedPanels.clear()
    // Clear all handlers
    this._onExpandHandlers = []
    this._onCollapseHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._focused || this._panels.length === 0) return false

    switch (key) {
      case 'down':
      case 'j':
        this.focusNext()
        return true

      case 'up':
      case 'k':
        this.focusPrevious()
        return true

      case 'enter':
      case 'space': {
        const panel = this._panels[this._focusedIndex]
        if (panel && !panel.disabled) {
          this.toggle(panel.id)
        }
        return true
      }

      case 'home':
        this._focusedIndex = 0
        this.markDirty()
        return true

      case 'end':
        this._focusedIndex = this._panels.length - 1
        this.markDirty()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    if (x < bx || x >= bx + width || y < by || y >= by + height) {
      return false
    }

    if (action !== 'press') return true

    // Find which panel header was clicked
    let currentY = by
    for (let i = 0; i < this._panels.length; i++) {
      const panel = this._panels[i]!
      const isExpanded = this._expandedPanels.has(panel.id)
      const headerHeight = 1
      const contentHeight = isExpanded ? this.getPanelContentHeight(panel) : 0
      const borderHeight = this._showBorders && i < this._panels.length - 1 ? 1 : 0

      if (y === currentY) {
        // Clicked on header
        this._focusedIndex = i
        if (!panel.disabled) {
          this.toggle(panel.id)
        }
        return true
      }

      currentY += headerHeight + contentHeight + borderHeight
    }

    return true
  }

  private getPanelContentHeight(_panel: AccordionPanel): number {
    // Default content height, can be customized
    return 3
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    let currentY = y

    for (let i = 0; i < this._panels.length && currentY < y + height; i++) {
      const panel = this._panels[i]!
      const isExpanded = this._expandedPanels.has(panel.id)
      const isFocused = this._focused && i === this._focusedIndex

      // Render header
      const icon = isExpanded ? this._collapseIcon : this._expandIcon
      const headerAttrs = panel.disabled ? ATTR_DIM : (isFocused ? ATTR_INVERSE : 0)

      // Icon
      buffer.write(x, currentY, icon, { fg, bg, attrs: headerAttrs })

      // Panel icon if present
      let titleX = x + 2
      if (panel.icon) {
        buffer.write(titleX, currentY, panel.icon, { fg, bg, attrs: headerAttrs })
        titleX += 2
      }

      // Title
      let title = panel.title
      const maxTitleWidth = width - titleX + x
      if (stringWidth(title) > maxTitleWidth) {
        title = truncateToWidth(title, maxTitleWidth)
      }
      buffer.write(titleX, currentY, title, { fg, bg, attrs: headerAttrs })

      // Fill rest of header
      const titleEnd = titleX + stringWidth(title)
      for (let col = titleEnd; col < x + width; col++) {
        buffer.set(col, currentY, { char: ' ', fg, bg, attrs: headerAttrs })
      }

      currentY++

      // Render content if expanded
      if (isExpanded && currentY < y + height) {
        const contentHeight = Math.min(
          this.getPanelContentHeight(panel),
          y + height - currentY
        )

        if (panel.content instanceof BaseNode) {
          panel.content._bounds = {
            x: x + 2,
            y: currentY,
            width: width - 2,
            height: contentHeight
          }
          panel.content.render(buffer, { fg, bg, attrs: 0 })
        }

        currentY += contentHeight
      }

      // Render border
      if (this._showBorders && i < this._panels.length - 1 && currentY < y + height) {
        for (let col = x; col < x + width; col++) {
          buffer.set(col, currentY, { char: '─', fg, bg, attrs: ATTR_DIM })
        }
        currentY++
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create an accordion widget.
 *
 * @param props - Accordion properties
 * @returns Accordion node
 *
 * @example
 * ```typescript
 * // Basic accordion
 * const acc = accordion()
 *   .panels([
 *     { id: 'section1', title: 'Section 1', content: text('Content 1'), expanded: true },
 *     { id: 'section2', title: 'Section 2', content: text('Content 2') },
 *     { id: 'section3', title: 'Section 3', content: text('Content 3') }
 *   ])
 *   .onExpand(id => console.log('Expanded:', id))
 *
 * // Multiple panels open
 * const faq = accordion({ multiple: true })
 *   .addPanel({ id: 'q1', title: 'Question 1?', content: text('Answer 1') })
 *   .addPanel({ id: 'q2', title: 'Question 2?', content: text('Answer 2') })
 *
 * // With custom icons
 * const settings = accordion()
 *   .expandIcon('+')
 *   .collapseIcon('-')
 *   .panels([...])
 *
 * // Programmatic control
 * acc.expand('section2')
 * acc.collapseAll()
 * acc.toggle('section1')
 * ```
 */
export function accordion(props?: AccordionProps): AccordionNode {
  return new AccordionNodeImpl(props)
}
