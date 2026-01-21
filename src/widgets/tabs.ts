/**
 * @oxog/tui - Tabs Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension, TabItem } from '../types'
import { ContainerNode, BaseNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_INVERSE, ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Tabs widget properties.
 */
export interface TabsProps {
  /** Tab items */
  tabs?: TabItem[]
  /** Selected tab index */
  selected?: number
  /** Tab bar position */
  position?: 'top' | 'bottom'
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * Tabs node interface.
 */
export interface TabsNode extends Node {
  readonly type: 'tabs'

  // Configuration
  tabs(items: TabItem[]): this
  addTab(tab: TabItem): this
  removeTab(index: number): this
  selected(index: number): this
  position(value: 'top' | 'bottom'): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Events
  onChange(handler: (tab: TabItem, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly selectedIndex: number
  readonly selectedTab: TabItem | undefined
  readonly tabCount: number
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

class TabsNodeImpl extends ContainerNode implements TabsNode {
  readonly type = 'tabs' as const

  private _tabs: TabItem[] = []
  private _selectedIndex: number = 0
  private _position: 'top' | 'bottom' = 'top'
  private _focused: boolean = false

  private _onChangeHandlers: ((tab: TabItem, index: number) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: TabsProps) {
    super()
    if (props) {
      if (props.tabs) this._tabs = props.tabs
      if (props.selected !== undefined) this._selectedIndex = props.selected
      if (props.position) this._position = props.position
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
    }
  }

  get selectedIndex(): number {
    return this._selectedIndex
  }

  get selectedTab(): TabItem | undefined {
    return this._tabs[this._selectedIndex]
  }

  get tabCount(): number {
    return this._tabs.length
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  tabs(items: TabItem[]): this {
    this._tabs = items
    this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, items.length - 1))
    this.markDirty()
    return this
  }

  addTab(tab: TabItem): this {
    this._tabs.push(tab)
    this.markDirty()
    return this
  }

  removeTab(index: number): this {
    if (index >= 0 && index < this._tabs.length) {
      this._tabs.splice(index, 1)
      if (this._selectedIndex >= this._tabs.length) {
        this._selectedIndex = Math.max(0, this._tabs.length - 1)
      }
      this.markDirty()
    }
    return this
  }

  selected(index: number): this {
    const newIndex = Math.max(0, Math.min(index, this._tabs.length - 1))
    if (this._selectedIndex !== newIndex) {
      this._selectedIndex = newIndex
      this.markDirty()
      this.emitChange()
    }
    return this
  }

  position(value: 'top' | 'bottom'): this {
    this._position = value
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

  // Events
  onChange(handler: (tab: TabItem, index: number) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  // Focus control
  focus(): this {
    if (!this._focused) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  /**
   * Dispose of tabs and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    // Clear tab content parent references
    for (const tab of this._tabs) {
      if (tab.content instanceof BaseNode) {
        tab.content._parent = null
      }
    }
    this._tabs = []
    this._onChangeHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Navigation
  /** @internal */
  selectPrevious(): void {
    if (this._selectedIndex > 0) {
      // Skip disabled tabs
      let newIndex = this._selectedIndex - 1
      while (newIndex > 0 && this._tabs[newIndex]?.disabled) {
        newIndex--
      }
      if (!this._tabs[newIndex]?.disabled) {
        this._selectedIndex = newIndex
        this.markDirty()
        this.emitChange()
      }
    }
  }

  /** @internal */
  selectNext(): void {
    if (this._selectedIndex < this._tabs.length - 1) {
      // Skip disabled tabs
      let newIndex = this._selectedIndex + 1
      while (newIndex < this._tabs.length - 1 && this._tabs[newIndex]?.disabled) {
        newIndex++
      }
      if (!this._tabs[newIndex]?.disabled) {
        this._selectedIndex = newIndex
        this.markDirty()
        this.emitChange()
      }
    }
  }

  private emitChange(): void {
    const tab = this._tabs[this._selectedIndex]
    if (tab) {
      for (const handler of this._onChangeHandlers) {
        handler(tab, this._selectedIndex)
      }
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Render tab bar
    const tabBarY = this._position === 'top' ? y : y + height - 1

    let tabX = x
    for (let i = 0; i < this._tabs.length; i++) {
      const tab = this._tabs[i]!
      const isSelected = i === this._selectedIndex
      const isDisabled = tab.disabled

      // Build tab label
      let label = ` ${tab.label} `
      const labelWidth = stringWidth(label)

      // Truncate if needed
      if (tabX + labelWidth > x + width) {
        label = truncateToWidth(label, width - (tabX - x))
      }

      // Compute style
      let attrs = 0
      if (isSelected && this._focused) {
        attrs = ATTR_INVERSE | ATTR_BOLD
      } else if (isSelected) {
        attrs = ATTR_BOLD
      } else if (isDisabled) {
        attrs = ATTR_DIM
      }

      buffer.write(tabX, tabBarY, label, { fg, bg, attrs })
      tabX += stringWidth(label)

      // Add separator
      if (i < this._tabs.length - 1 && tabX < x + width) {
        buffer.write(tabX, tabBarY, '\u2502', { fg, bg, attrs: ATTR_DIM }) // │
        tabX++
      }
    }

    // Fill remaining space
    if (tabX < x + width) {
      buffer.write(tabX, tabBarY, ' '.repeat(x + width - tabX), { fg, bg, attrs: 0 })
    }

    // Render selected tab content
    const contentY = this._position === 'top' ? y + 1 : y
    const contentHeight = height - 1

    const selectedTab = this._tabs[this._selectedIndex]
    if (selectedTab?.content && contentHeight > 0) {
      const content = selectedTab.content
      if (content instanceof BaseNode) {
        // Set content bounds
        content._bounds = {
          x,
          y: contentY,
          width,
          height: contentHeight
        }
        content.render(buffer, { fg, bg, attrs: 0 })
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a tabs widget.
 *
 * @param props - Tabs properties
 * @returns Tabs node
 *
 * @example
 * ```typescript
 * import { tabs, box, text } from '@oxog/tui'
 *
 * // Basic tabs
 * const tabView = tabs()
 *   .tabs([
 *     { label: 'Home', content: text('Welcome!') },
 *     { label: 'Settings', content: box().add(text('Settings here')) },
 *     { label: 'About', content: text('Version 1.0.0') }
 *   ])
 *   .onChange((tab) => console.log('Tab changed:', tab.label))
 *
 * // With disabled tab
 * const withDisabled = tabs()
 *   .tabs([
 *     { label: 'Active', content: text('Active tab') },
 *     { label: 'Disabled', content: text('N/A'), disabled: true }
 *   ])
 *
 * // Bottom position
 * const bottomTabs = tabs()
 *   .position('bottom')
 *   .tabs([...])
 * ```
 */
export function tabs(props?: TabsProps): TabsNode {
  return new TabsNodeImpl(props)
}
