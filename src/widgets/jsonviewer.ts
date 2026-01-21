/**
 * @oxog/tui - JSONViewer Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_DIM, ATTR_ITALIC } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * JSON node type.
 */
export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

/**
 * Internal tree node for JSON.
 */
interface TreeNode {
  /** Key name (for object properties) */
  key: string | null
  /** Value */
  value: unknown
  /** Node type */
  type: JsonNodeType
  /** Depth level */
  depth: number
  /** Is expanded (for objects/arrays) */
  expanded: boolean
  /** Child count */
  childCount: number
  /** Parent node */
  parent: TreeNode | null
  /** Children nodes */
  children: TreeNode[]
  /** Line index in flattened view */
  lineIndex: number
}

/**
 * JSONViewer widget properties.
 */
export interface JsonViewerProps {
  /** JSON data to display */
  data?: unknown
  /** Initial expansion depth (-1 for all) */
  expandDepth?: number
  /** Show array indices */
  showIndices?: boolean
  /** Indent size */
  indentSize?: number
  /** Color scheme */
  colors?: JsonViewerColors
}

/**
 * Color configuration for JSON types.
 */
export interface JsonViewerColors {
  key?: number
  string?: number
  number?: number
  boolean?: number
  null?: number
  bracket?: number
}

/**
 * JSONViewer node interface.
 */
export interface JsonViewerNode extends Node {
  readonly type: 'jsonviewer'

  // Configuration
  data(json: unknown): this
  expandDepth(depth: number): this
  showIndices(show: boolean): this
  indentSize(size: number): this
  colors(colors: JsonViewerColors): this

  // Navigation
  expand(): this
  collapse(): this
  expandAll(): this
  collapseAll(): this
  toggle(): this
  moveUp(): this
  moveDown(): this
  moveToParent(): this
  moveToFirstChild(): this
  scrollToTop(): this
  scrollToBottom(): this
  pageUp(): this
  pageDown(): this

  // Search
  search(query: string): this
  nextMatch(): this
  previousMatch(): this
  clearSearch(): this

  // Copy
  copyValue(): string
  copyPath(): string

  // Focus
  focus(): this
  blur(): this

  // Events
  onSelect(handler: (path: string, value: unknown) => void): this

  // State
  readonly isFocused: boolean
  readonly lineCount: number
  readonly currentPath: string
  readonly currentValue: unknown
  readonly matchCount: number
}

// ============================================================
// Implementation
// ============================================================

const DEFAULT_COLORS: JsonViewerColors = {
  key: 14,      // cyan
  string: 10,   // green
  number: 11,   // yellow
  boolean: 13,  // magenta
  null: 8,      // gray
  bracket: 7    // white
}

class JsonViewerNodeImpl extends LeafNode implements JsonViewerNode {
  readonly type = 'jsonviewer' as const

  private _data: unknown = null
  private _root: TreeNode | null = null
  private _flatNodes: TreeNode[] = []
  private _expandDepth: number = 1
  private _showIndices: boolean = true
  private _indentSize: number = 2
  private _colors: JsonViewerColors = { ...DEFAULT_COLORS }

  private _selectedIndex: number = 0
  private _scrollOffset: number = 0
  private _isFocused: boolean = false

  // Search state
  private _matches: number[] = []
  private _currentMatchIndex: number = -1

  private _onSelectHandlers: ((path: string, value: unknown) => void)[] = []

  constructor(props?: JsonViewerProps) {
    super()
    if (props) {
      if (props.expandDepth !== undefined) this._expandDepth = props.expandDepth
      if (props.showIndices !== undefined) this._showIndices = props.showIndices
      if (props.indentSize !== undefined) this._indentSize = props.indentSize
      if (props.colors) this._colors = { ...DEFAULT_COLORS, ...props.colors }
      if (props.data !== undefined) {
        this._data = props.data
        this.buildTree()
      }
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get lineCount(): number {
    return this._flatNodes.length
  }

  get currentPath(): string {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) {
      return ''
    }
    return this.getNodePath(node)
  }

  get currentValue(): unknown {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) {
      return undefined
    }
    return node.value
  }

  get matchCount(): number {
    return this._matches.length
  }

  // Build tree from JSON data
  private buildTree(): void {
    this._root = this.createNode(null, this._data, 0, null)
    this.flattenTree()
    this._selectedIndex = 0
    this._scrollOffset = 0
  }

  private createNode(key: string | null, value: unknown, depth: number, parent: TreeNode | null): TreeNode {
    const type = this.getValueType(value)
    const node: TreeNode = {
      key,
      value,
      type,
      depth,
      expanded: this._expandDepth < 0 || depth < this._expandDepth,
      childCount: 0,
      parent,
      children: [],
      lineIndex: 0
    }

    if (type === 'object' && value !== null) {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)
      node.childCount = keys.length
      for (const k of keys) {
        node.children.push(this.createNode(k, obj[k], depth + 1, node))
      }
    } else if (type === 'array') {
      const arr = value as unknown[]
      node.childCount = arr.length
      for (let i = 0; i < arr.length; i++) {
        const childKey = this._showIndices ? String(i) : null
        node.children.push(this.createNode(childKey, arr[i], depth + 1, node))
      }
    }

    return node
  }

  private getValueType(value: unknown): JsonNodeType {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    const t = typeof value
    if (t === 'object') return 'object'
    if (t === 'string') return 'string'
    if (t === 'number') return 'number'
    if (t === 'boolean') return 'boolean'
    return 'string'
  }

  private flattenTree(): void {
    this._flatNodes = []
    if (this._root) {
      this.flattenNode(this._root)
    }
  }

  private flattenNode(node: TreeNode): void {
    node.lineIndex = this._flatNodes.length
    this._flatNodes.push(node)

    if (node.expanded && node.children.length > 0) {
      for (const child of node.children) {
        this.flattenNode(child)
      }
    }
  }

  private getNodePath(node: TreeNode): string {
    const parts: string[] = []
    let current: TreeNode | null = node

    while (current) {
      if (current.key !== null) {
        if (current.parent?.type === 'array') {
          parts.unshift(`[${current.key}]`)
        } else {
          parts.unshift(current.key)
        }
      }
      current = current.parent
    }

    return parts.join('.').replace(/\.\[/g, '[')
  }

  // Configuration
  data(json: unknown): this {
    this._data = json
    this.buildTree()
    this.clearSearch()
    this.markDirty()
    return this
  }

  expandDepth(depth: number): this {
    this._expandDepth = depth
    if (this._root) {
      this.setExpandDepth(this._root, depth)
      this.flattenTree()
    }
    this.markDirty()
    return this
  }

  private setExpandDepth(node: TreeNode, depth: number): void {
    node.expanded = depth < 0 || node.depth < depth
    for (const child of node.children) {
      this.setExpandDepth(child, depth)
    }
  }

  showIndices(show: boolean): this {
    this._showIndices = show
    if (this._data !== undefined) {
      this.buildTree()
    }
    this.markDirty()
    return this
  }

  indentSize(size: number): this {
    this._indentSize = Math.max(1, Math.min(8, size))
    this.markDirty()
    return this
  }

  colors(colors: JsonViewerColors): this {
    this._colors = { ...this._colors, ...colors }
    this.markDirty()
    return this
  }

  // Navigation
  expand(): this {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) return this

    if ((node.type === 'object' || node.type === 'array') && !node.expanded) {
      node.expanded = true
      this.flattenTree()
      this.markDirty()
    }
    return this
  }

  collapse(): this {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) return this

    if ((node.type === 'object' || node.type === 'array') && node.expanded) {
      node.expanded = false
      this.flattenTree()
      this.markDirty()
    }
    return this
  }

  expandAll(): this {
    if (this._root) {
      this.setExpandAll(this._root, true)
      this.flattenTree()
      this.markDirty()
    }
    return this
  }

  collapseAll(): this {
    if (this._root) {
      this.setExpandAll(this._root, false)
      // Keep root expanded
      if (this._root.type === 'object' || this._root.type === 'array') {
        this._root.expanded = true
      }
      this.flattenTree()
      this.markDirty()
    }
    return this
  }

  private setExpandAll(node: TreeNode, expanded: boolean): void {
    if (node.type === 'object' || node.type === 'array') {
      node.expanded = expanded
    }
    for (const child of node.children) {
      this.setExpandAll(child, expanded)
    }
  }

  toggle(): this {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) return this

    if (node.type === 'object' || node.type === 'array') {
      node.expanded = !node.expanded
      this.flattenTree()
      this.markDirty()
    }
    return this
  }

  moveUp(): this {
    if (this._selectedIndex > 0) {
      this._selectedIndex--
      this.ensureVisible()
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveDown(): this {
    if (this._selectedIndex < this._flatNodes.length - 1) {
      this._selectedIndex++
      this.ensureVisible()
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveToParent(): this {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) return this

    if (node.parent) {
      this._selectedIndex = node.parent.lineIndex
      this.ensureVisible()
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveToFirstChild(): this {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) return this

    const firstChild = node.children[0]
    if (node.expanded && node.children.length > 0 && firstChild) {
      this._selectedIndex = firstChild.lineIndex
      this.ensureVisible()
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  scrollToTop(): this {
    this._selectedIndex = 0
    this._scrollOffset = 0
    this.emitSelect()
    this.markDirty()
    return this
  }

  scrollToBottom(): this {
    this._selectedIndex = Math.max(0, this._flatNodes.length - 1)
    this.ensureVisible()
    this.emitSelect()
    this.markDirty()
    return this
  }

  pageUp(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    this._selectedIndex = Math.max(0, this._selectedIndex - visibleLines)
    this.ensureVisible()
    this.emitSelect()
    this.markDirty()
    return this
  }

  pageDown(): this {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10
    this._selectedIndex = Math.min(this._flatNodes.length - 1, this._selectedIndex + visibleLines)
    this.ensureVisible()
    this.emitSelect()
    this.markDirty()
    return this
  }

  private ensureVisible(): void {
    const bounds = this._bounds
    const visibleLines = bounds ? bounds.height : 10

    if (this._selectedIndex < this._scrollOffset) {
      this._scrollOffset = this._selectedIndex
    } else if (this._selectedIndex >= this._scrollOffset + visibleLines) {
      this._scrollOffset = this._selectedIndex - visibleLines + 1
    }
  }

  private emitSelect(): void {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex >= 0 && this._selectedIndex < this._flatNodes.length && node) {
      const path = this.getNodePath(node)
      for (const handler of this._onSelectHandlers) {
        handler(path, node.value)
      }
    }
  }

  // Search
  search(query: string): this {
    this._matches = []
    this._currentMatchIndex = -1

    if (!query) {
      this.markDirty()
      return this
    }

    const lowerQuery = query.toLowerCase()
    for (let i = 0; i < this._flatNodes.length; i++) {
      const node = this._flatNodes[i]
      if (!node) continue
      const keyMatch = node.key?.toLowerCase().includes(lowerQuery)
      const valueMatch = this.valueToString(node.value).toLowerCase().includes(lowerQuery)
      if (keyMatch || valueMatch) {
        this._matches.push(i)
      }
    }

    if (this._matches.length > 0) {
      this._currentMatchIndex = 0
      this._selectedIndex = this._matches[0] ?? 0
      this.ensureVisible()
    }

    this.markDirty()
    return this
  }

  nextMatch(): this {
    if (this._matches.length === 0) return this

    this._currentMatchIndex = (this._currentMatchIndex + 1) % this._matches.length
    this._selectedIndex = this._matches[this._currentMatchIndex] ?? 0
    this.ensureVisible()
    this.emitSelect()
    this.markDirty()
    return this
  }

  previousMatch(): this {
    if (this._matches.length === 0) return this

    this._currentMatchIndex = (this._currentMatchIndex - 1 + this._matches.length) % this._matches.length
    this._selectedIndex = this._matches[this._currentMatchIndex] ?? 0
    this.ensureVisible()
    this.emitSelect()
    this.markDirty()
    return this
  }

  clearSearch(): this {
    this._matches = []
    this._currentMatchIndex = -1
    this.markDirty()
    return this
  }

  // Copy
  copyValue(): string {
    const node = this._flatNodes[this._selectedIndex]
    if (this._selectedIndex < 0 || this._selectedIndex >= this._flatNodes.length || !node) {
      return ''
    }
    return JSON.stringify(node.value, null, 2)
  }

  copyPath(): string {
    return this.currentPath
  }

  // Focus
  focus(): this {
    this._isFocused = true
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  // Events
  onSelect(handler: (path: string, value: unknown) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'up':
      case 'k':
        this.moveUp()
        return true
      case 'down':
      case 'j':
        this.moveDown()
        return true
      case 'left':
      case 'h':
        const nodeL = this._flatNodes[this._selectedIndex]
        if (nodeL && nodeL.expanded) {
          this.collapse()
        } else {
          this.moveToParent()
        }
        return true
      case 'right':
      case 'l':
        const nodeR = this._flatNodes[this._selectedIndex]
        if (nodeR && !nodeR.expanded && nodeR.children.length > 0) {
          this.expand()
        } else {
          this.moveToFirstChild()
        }
        return true
      case 'enter':
      case ' ':
        this.toggle()
        return true
      case 'pageup':
        this.pageUp()
        return true
      case 'pagedown':
        this.pageDown()
        return true
      case 'home':
        if (ctrl) this.scrollToTop()
        return true
      case 'end':
        if (ctrl) this.scrollToBottom()
        return true
      case 'g':
        this.scrollToTop()
        return true
      case 'G':
        this.scrollToBottom()
        return true
      case 'e':
        this.expandAll()
        return true
      case 'c':
        this.collapseAll()
        return true
      case 'n':
        this.nextMatch()
        return true
      case 'N':
        this.previousMatch()
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(_x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      this._isFocused = true
      const clickedIndex = y - bounds.y + this._scrollOffset
      if (clickedIndex >= 0 && clickedIndex < this._flatNodes.length) {
        this._selectedIndex = clickedIndex
        this.emitSelect()
        this.markDirty()
      }
      return true
    } else if (action === 'double-click') {
      this.toggle()
      return true
    } else if (action === 'scroll-up') {
      this.moveUp()
      this.moveUp()
      this.moveUp()
      return true
    } else if (action === 'scroll-down') {
      this.moveDown()
      this.moveDown()
      this.moveDown()
      return true
    }

    return false
  }

  private valueToString(value: unknown): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `Array(${value.length})`
    if (typeof value === 'object') return `Object(${Object.keys(value).length})`
    return String(value)
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const visibleLines = bounds.height

    for (let i = 0; i < visibleLines; i++) {
      const nodeIndex = this._scrollOffset + i
      const y = bounds.y + i

      // Clear line
      for (let col = 0; col < bounds.width; col++) {
        buffer.set(bounds.x + col, y, { char: ' ', fg, bg, attrs: 0 })
      }

      if (nodeIndex >= this._flatNodes.length) continue

      const node = this._flatNodes[nodeIndex]
      if (!node) continue
      const isSelected = this._isFocused && nodeIndex === this._selectedIndex
      const isMatch = this._matches.includes(nodeIndex)

      this.renderNode(buffer, bounds.x, y, node, bounds.width, fg, bg, isSelected, isMatch)
    }

    // Scroll indicator
    if (this._flatNodes.length > visibleLines) {
      const scrollPercent = this._scrollOffset / Math.max(1, this._flatNodes.length - visibleLines)
      const indicatorY = bounds.y + Math.floor(scrollPercent * (bounds.height - 1))
      buffer.set(bounds.x + bounds.width - 1, indicatorY, { char: '\u2588', fg, bg, attrs: ATTR_DIM })
    }
  }

  private renderNode(
    buffer: Buffer,
    x: number,
    y: number,
    node: TreeNode,
    width: number,
    fg: number,
    bg: number,
    isSelected: boolean,
    isMatch: boolean
  ): void {
    const indent = ' '.repeat(node.depth * this._indentSize)
    let content = indent

    // Expand/collapse indicator
    if (node.type === 'object' || node.type === 'array') {
      content += node.expanded ? '\u25bc ' : '\u25b6 '  // ▼ or ▶
    } else {
      content += '  '
    }

    // Key
    if (node.key !== null) {
      content += `"${node.key}": `
    }

    // Value
    const valueStr = this.formatValue(node)
    content += valueStr

    // Truncate to width
    const display = truncateToWidth(content, width - 1)

    // Determine colors
    let lineAttrs = isSelected ? ATTR_BOLD : 0
    if (isMatch && !isSelected) {
      lineAttrs |= ATTR_ITALIC
    }

    // Write the line
    let col = x
    const chars = [...display]
    const indentLen = indent.length
    const keyStart = indentLen + 2
    const keyEnd = node.key !== null ? keyStart + node.key.length + 4 : keyStart

    for (let i = 0; i < chars.length && col < x + width - 1; i++) {
      const char = chars[i]
      if (!char) continue
      let charFg = fg
      let charAttrs = lineAttrs

      // Color based on position
      if (i < indentLen) {
        // Indent - dim
        charAttrs |= ATTR_DIM
      } else if (i < keyStart) {
        // Expand indicator
        charFg = this._colors.bracket ?? fg
      } else if (node.key !== null && i >= keyStart && i < keyEnd) {
        // Key
        charFg = this._colors.key ?? fg
      } else {
        // Value
        charFg = this.getValueColor(node.type, fg)
      }

      if (isSelected) {
        // Swap fg/bg for selection
        buffer.set(col, y, { char, fg: bg, bg: charFg, attrs: charAttrs })
      } else {
        buffer.set(col, y, { char, fg: charFg, bg, attrs: charAttrs })
      }
      col += stringWidth(char)
    }
  }

  private formatValue(node: TreeNode): string {
    switch (node.type) {
      case 'string':
        const str = node.value as string
        if (str.length > 50) {
          return `"${str.slice(0, 47)}..."`
        }
        return `"${str}"`
      case 'number':
        return String(node.value)
      case 'boolean':
        return String(node.value)
      case 'null':
        return 'null'
      case 'array':
        if (node.expanded) {
          return `[`
        }
        return `[...] (${node.childCount} items)`
      case 'object':
        if (node.expanded) {
          return `{`
        }
        return `{...} (${node.childCount} keys)`
      default:
        return String(node.value)
    }
  }

  private getValueColor(type: JsonNodeType, defaultFg: number): number {
    switch (type) {
      case 'string':
        return this._colors.string ?? defaultFg
      case 'number':
        return this._colors.number ?? defaultFg
      case 'boolean':
        return this._colors.boolean ?? defaultFg
      case 'null':
        return this._colors.null ?? defaultFg
      case 'array':
      case 'object':
        return this._colors.bracket ?? defaultFg
      default:
        return defaultFg
    }
  }

  /**
   * Dispose of JSON viewer and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._root = null
    this._flatNodes = []
    this._matches = []
    this._onSelectHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a JSON viewer widget.
 *
 * @param props - JSONViewer properties
 * @returns JSONViewer node
 *
 * @example
 * ```typescript
 * // Basic JSON viewer
 * const jv = jsonviewer({
 *   data: {
 *     name: "John",
 *     age: 30,
 *     hobbies: ["reading", "gaming"],
 *     address: {
 *       city: "NYC",
 *       zip: "10001"
 *     }
 *   },
 *   expandDepth: 2
 * })
 *
 * // Navigate
 * jv.moveDown()
 * jv.expand()
 * jv.toggle()
 *
 * // Search
 * jv.search('name')
 * jv.nextMatch()
 *
 * // Get current selection
 * console.log(jv.currentPath)   // "address.city"
 * console.log(jv.currentValue)  // "NYC"
 * ```
 */
export function jsonviewer(props?: JsonViewerProps): JsonViewerNode {
  return new JsonViewerNodeImpl(props)
}
