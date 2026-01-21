/**
 * @oxog/tui - Tree Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension, TreeNodeData } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Tree widget properties.
 */
export interface TreeProps<T = unknown> {
  /** Tree data */
  data?: TreeNodeData<T>[]
  /** Indentation width */
  indent?: number
  /** Show guide lines */
  guides?: boolean
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
}

/**
 * Tree node interface.
 */
export interface TreeWidgetNode<T = unknown> extends Node {
  readonly type: 'tree'

  // Configuration
  data(nodes: TreeNodeData<T>[]): this
  indent(spaces: number): this
  guides(enabled: boolean): this
  width(value: Dimension): this
  height(value: Dimension): this

  // Tree manipulation
  expand(path: number[]): this
  collapse(path: number[]): this
  toggle(path: number[]): this
  expandAll(): this
  collapseAll(): this

  // Events
  onSelect(handler: (node: TreeNodeData<T>, path: number[]) => void): this
  onToggle(handler: (node: TreeNodeData<T>, path: number[], expanded: boolean) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Focus control
  focus(): this
  blur(): this

  // State
  readonly selectedPath: number[]
  readonly selectedNode: TreeNodeData<T> | undefined
  readonly isFocused: boolean
}

// ============================================================
// Implementation
// ============================================================

interface FlatNode<T> {
  node: TreeNodeData<T>
  path: number[]
  depth: number
  isLast: boolean[]
}

class TreeWidgetNodeImpl<T = unknown> extends LeafNode implements TreeWidgetNode<T> {
  readonly type = 'tree' as const

  private _data: TreeNodeData<T>[] = []
  private _indent: number = 2
  private _guides: boolean = true
  private _selectedPath: number[] = [0]
  private _scrollOffset: number = 0
  private _focused: boolean = false
  private _expandedPaths: Set<string> = new Set()

  private _onSelectHandlers: ((node: TreeNodeData<T>, path: number[]) => void)[] = []
  private _onToggleHandlers: ((
    node: TreeNodeData<T>,
    path: number[],
    expanded: boolean
  ) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: TreeProps<T>) {
    super()
    if (props) {
      if (props.data) this._data = props.data
      if (props.indent !== undefined) this._indent = props.indent
      if (props.guides !== undefined) this._guides = props.guides
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
    }
  }

  get selectedPath(): number[] {
    return [...this._selectedPath]
  }

  get selectedNode(): TreeNodeData<T> | undefined {
    return this.getNodeAtPath(this._selectedPath)
  }

  get isFocused(): boolean {
    return this._focused
  }

  // Configuration
  data(nodes: TreeNodeData<T>[]): this {
    this._data = nodes
    this._selectedPath = nodes.length > 0 ? [0] : []
    this.markDirty()
    return this
  }

  indent(spaces: number): this {
    this._indent = spaces
    this.markDirty()
    return this
  }

  guides(enabled: boolean): this {
    this._guides = enabled
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

  // Tree manipulation
  expand(path: number[]): this {
    const pathKey = path.join(',')
    if (!this._expandedPaths.has(pathKey)) {
      this._expandedPaths.add(pathKey)
      const node = this.getNodeAtPath(path)
      if (node) {
        for (const handler of this._onToggleHandlers) {
          handler(node, path, true)
        }
      }
      this.markDirty()
    }
    return this
  }

  collapse(path: number[]): this {
    const pathKey = path.join(',')
    if (this._expandedPaths.has(pathKey)) {
      this._expandedPaths.delete(pathKey)
      const node = this.getNodeAtPath(path)
      if (node) {
        for (const handler of this._onToggleHandlers) {
          handler(node, path, false)
        }
      }
      this.markDirty()
    }
    return this
  }

  toggle(path: number[]): this {
    const pathKey = path.join(',')
    if (this._expandedPaths.has(pathKey)) {
      return this.collapse(path)
    } else {
      return this.expand(path)
    }
  }

  expandAll(): this {
    this.traverseAll((_, path) => {
      this._expandedPaths.add(path.join(','))
    })
    this.markDirty()
    return this
  }

  collapseAll(): this {
    this._expandedPaths.clear()
    this.markDirty()
    return this
  }

  // Events
  onSelect(handler: (node: TreeNodeData<T>, path: number[]) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onToggle(handler: (node: TreeNodeData<T>, path: number[], expanded: boolean) => void): this {
    this._onToggleHandlers.push(handler)
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
   * Dispose of tree and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._data = []
    this._expandedPaths.clear()
    this._onSelectHandlers = []
    this._onToggleHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal helpers
  private getNodeAtPath(path: number[]): TreeNodeData<T> | undefined {
    let nodes = this._data
    let node: TreeNodeData<T> | undefined

    for (const idx of path) {
      node = nodes[idx]
      if (!node) return undefined
      nodes = node.children || []
    }

    return node
  }

  private traverseAll(callback: (node: TreeNodeData<T>, path: number[]) => void): void {
    const traverse = (nodes: TreeNodeData<T>[], basePath: number[]) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!
        const path = [...basePath, i]
        callback(node, path)
        if (node.children) {
          traverse(node.children, path)
        }
      }
    }
    traverse(this._data, [])
  }

  private flattenTree(): FlatNode<T>[] {
    const flat: FlatNode<T>[] = []

    const traverse = (
      nodes: TreeNodeData<T>[],
      basePath: number[],
      depth: number,
      isLast: boolean[]
    ) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!
        const path = [...basePath, i]
        const last = i === nodes.length - 1
        const newIsLast = [...isLast, last]

        flat.push({ node, path, depth, isLast: newIsLast })

        const pathKey = path.join(',')
        if (node.children && node.children.length > 0 && this._expandedPaths.has(pathKey)) {
          traverse(node.children, path, depth + 1, newIsLast)
        }
      }
    }

    traverse(this._data, [], 0, [])
    return flat
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const flatNodes = this.flattenTree()
    const selectedPathStr = this._selectedPath.join(',')

    // Ensure selected is visible
    const selectedIdx = flatNodes.findIndex(n => n.path.join(',') === selectedPathStr)
    if (selectedIdx >= 0) {
      if (selectedIdx < this._scrollOffset) {
        this._scrollOffset = selectedIdx
      } else if (selectedIdx >= this._scrollOffset + height) {
        this._scrollOffset = selectedIdx - height + 1
      }
    }

    for (let i = 0; i < height; i++) {
      const nodeIdx = this._scrollOffset + i
      const flatNode = flatNodes[nodeIdx]
      /* c8 ignore next */
      if (!flatNode) continue

      const { node, path, depth, isLast } = flatNode
      const pathKey = path.join(',')
      const isSelected = pathKey === selectedPathStr && this._focused
      const hasChildren = node.children && node.children.length > 0
      const isExpanded = this._expandedPaths.has(pathKey)

      // Build prefix with guides
      let prefix = ''
      if (this._guides) {
        for (let d = 0; d < depth; d++) {
          if (isLast[d]) {
            prefix += '  '
          } else {
            prefix += '\u2502 ' // │
          }
        }
        if (depth > 0) {
          prefix = prefix.slice(0, -2)
          if (isLast[depth]) {
            prefix += '\u2514\u2500' // └─
          } else {
            prefix += '\u251c\u2500' // ├─
          }
        }
      } else {
        prefix = ' '.repeat(depth * this._indent)
      }

      // Build node display
      let display = prefix
      if (hasChildren) {
        display += isExpanded ? '\u25bc ' : '\u25b6 ' // ▼ ▶
      } else {
        display += '  '
      }
      display += node.label

      // Truncate if needed
      if (stringWidth(display) > width) {
        display = truncateToWidth(display, width)
      }

      // Pad to width
      display = display.padEnd(width)

      // Compute style
      /* c8 ignore next */
      const attrs = isSelected ? ATTR_INVERSE : 0

      buffer.write(x, y + i, display, { fg, bg, attrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a tree widget.
 *
 * @param props - Tree properties
 * @returns Tree node
 *
 * @example
 * ```typescript
 * // Basic tree
 * const fileTree = tree()
 *   .data([
 *     {
 *       label: 'src',
 *       children: [
 *         { label: 'index.ts' },
 *         { label: 'utils.ts' }
 *       ]
 *     },
 *     {
 *       label: 'tests',
 *       children: [
 *         { label: 'index.test.ts' }
 *       ]
 *     }
 *   ])
 *   .onSelect((node) => console.log('Selected:', node.label))
 *
 * // With custom values
 * interface FileData {
 *   path: string
 *   size: number
 * }
 *
 * const files = tree<FileData>()
 *   .data([
 *     { label: 'main.ts', value: { path: '/src/main.ts', size: 1024 } }
 *   ])
 * ```
 */
export function tree<T = unknown>(props?: TreeProps<T>): TreeWidgetNode<T> {
  return new TreeWidgetNodeImpl<T>(props)
}
