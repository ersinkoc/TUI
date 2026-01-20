/**
 * @oxog/tui - Node System
 * @packageDocumentation
 */

import type { Node, Bounds, LayoutProps, StyleProps, Buffer, CellStyle } from '../types'

// ============================================================
// ID Generation
// ============================================================

let idCounter = 0

/**
 * Generate a unique node ID.
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  return `node_${++idCounter}`
}

/**
 * Reset ID counter (for testing).
 */
export function resetIdCounter(): void {
  idCounter = 0
}

// ============================================================
// Base Node
// ============================================================

/**
 * Base node class.
 * All widgets extend this class.
 */
export abstract class BaseNode implements Node {
  readonly id: string
  abstract readonly type: string

  /** @internal */
  _parent: BaseNode | null = null

  /** @internal */
  _children: BaseNode[] = []

  /** @internal */
  _visible: boolean = true

  /** @internal */
  _bounds: Bounds = { x: 0, y: 0, width: 0, height: 0 }

  /** @internal */
  _layout: LayoutProps = {}

  /** @internal */
  _style: StyleProps = {}

  /** @internal */
  _dirty: boolean = true

  /** @internal */
  _layoutDirty: boolean = true

  constructor() {
    this.id = generateId()
  }

  get parent(): Node | null {
    return this._parent
  }

  get children(): readonly Node[] {
    return this._children
  }

  get isVisible(): boolean {
    return this._visible
  }

  get bounds(): Bounds {
    return { ...this._bounds }
  }

  /**
   * Set visibility.
   * @param value - Visible or hidden
   */
  visible(value: boolean): this {
    if (this._visible !== value) {
      this._visible = value
      this.markDirty()
    }
    return this
  }

  /**
   * Mark node as needing re-render.
   */
  markDirty(): void {
    this._dirty = true
    this._layoutDirty = true
    // Propagate to parent
    if (this._parent) {
      this._parent.markDirty()
    }
  }

  /**
   * Clear dirty flag.
   */
  clearDirty(): void {
    this._dirty = false
  }

  /**
   * Clear layout dirty flag.
   */
  clearLayoutDirty(): void {
    this._layoutDirty = false
  }

  /**
   * Render node to buffer.
   * @param buffer - Target buffer
   * @param style - Computed style
   */
  abstract render(buffer: Buffer, style: CellStyle): void
}

// ============================================================
// Container Node
// ============================================================

/**
 * Container node that can hold children.
 * Used for box, tabs, etc.
 */
export abstract class ContainerNode extends BaseNode {
  /**
   * Add a child node.
   * @param child - Child to add
   */
  add(child: Node): this {
    if (child instanceof BaseNode) {
      // Remove from previous parent
      if (child._parent && child._parent instanceof ContainerNode) {
        child._parent.remove(child)
      }
      child._parent = this
      this._children.push(child)
      this.markDirty()
    }
    return this
  }

  /**
   * Remove a child node.
   * @param child - Child to remove
   */
  remove(child: Node): this {
    if (child instanceof BaseNode) {
      const index = this._children.indexOf(child)
      if (index !== -1) {
        child._parent = null
        this._children.splice(index, 1)
        this.markDirty()
      }
    }
    return this
  }

  /**
   * Remove all children.
   */
  clear(): this {
    for (const child of this._children) {
      child._parent = null
    }
    this._children = []
    this.markDirty()
    return this
  }

  /**
   * Insert child at index.
   * @param index - Position to insert at
   * @param child - Child to insert
   */
  insertAt(index: number, child: Node): this {
    if (child instanceof BaseNode) {
      if (child._parent && child._parent instanceof ContainerNode) {
        child._parent.remove(child)
      }
      child._parent = this
      this._children.splice(index, 0, child)
      this.markDirty()
    }
    return this
  }

  /**
   * Get child at index.
   * @param index - Child index
   */
  getChild(index: number): Node | undefined {
    return this._children[index]
  }

  /**
   * Get number of children.
   */
  get childCount(): number {
    return this._children.length
  }

  /**
   * Check if has children.
   */
  get hasChildren(): boolean {
    return this._children.length > 0
  }
}

// ============================================================
// Leaf Node
// ============================================================

/**
 * Leaf node that cannot hold children.
 * Used for text, input, progress, etc.
 */
export abstract class LeafNode extends BaseNode {
  override get children(): readonly Node[] {
    return []
  }
}

// ============================================================
// Node Utilities
// ============================================================

/**
 * Find node by ID in tree.
 *
 * @param root - Root node to search from
 * @param id - ID to find
 * @returns Found node or undefined
 */
export function findNodeById(root: Node, id: string): Node | undefined {
  if (root.id === id) {
    return root
  }

  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }

  return undefined
}

/**
 * Find nodes by type in tree.
 *
 * @param root - Root node to search from
 * @param type - Type to find
 * @returns Array of matching nodes
 */
export function findNodesByType(root: Node, type: string): Node[] {
  const results: Node[] = []

  if (root.type === type) {
    results.push(root)
  }

  for (const child of root.children) {
    results.push(...findNodesByType(child, type))
  }

  return results
}

/**
 * Traverse tree depth-first.
 *
 * @param root - Root node
 * @param visitor - Visitor function
 */
export function traverseDepthFirst(root: Node, visitor: (node: Node) => void): void {
  visitor(root)
  for (const child of root.children) {
    traverseDepthFirst(child, visitor)
  }
}

/**
 * Traverse tree breadth-first.
 *
 * @param root - Root node
 * @param visitor - Visitor function
 */
export function traverseBreadthFirst(root: Node, visitor: (node: Node) => void): void {
  const queue: Node[] = [root]

  while (queue.length > 0) {
    const node = queue.shift()!
    visitor(node)
    queue.push(...node.children)
  }
}

/**
 * Get all ancestors of a node.
 *
 * @param node - Node to get ancestors of
 * @returns Array of ancestors (parent first)
 */
export function getAncestors(node: Node): Node[] {
  const ancestors: Node[] = []
  let current = node.parent

  while (current) {
    ancestors.push(current)
    current = current.parent
  }

  return ancestors
}

/**
 * Get all descendants of a node.
 *
 * @param node - Node to get descendants of
 * @returns Array of descendants (depth-first order)
 */
export function getDescendants(node: Node): Node[] {
  const descendants: Node[] = []

  for (const child of node.children) {
    descendants.push(child)
    descendants.push(...getDescendants(child))
  }

  return descendants
}

/**
 * Check if node is ancestor of another.
 *
 * @param ancestor - Potential ancestor
 * @param descendant - Potential descendant
 * @returns True if is ancestor
 */
export function isAncestorOf(ancestor: Node, descendant: Node): boolean {
  let current = descendant.parent

  while (current) {
    if (current === ancestor) return true
    current = current.parent
  }

  return false
}

/**
 * Get common ancestor of two nodes.
 *
 * @param a - First node
 * @param b - Second node
 * @returns Common ancestor or undefined
 */
export function getCommonAncestor(a: Node, b: Node): Node | undefined {
  const ancestorsA = new Set<Node>([a, ...getAncestors(a)])

  let current: Node | null = b
  while (current) {
    if (ancestorsA.has(current)) return current
    current = current.parent
  }

  return undefined
}

/**
 * Find node at position.
 *
 * @param root - Root node
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Node at position or undefined
 */
export function findNodeAtPosition(root: Node, x: number, y: number): Node | undefined {
  // Check if point is in bounds
  const bounds = root.bounds
  if (
    x < bounds.x ||
    x >= bounds.x + bounds.width ||
    y < bounds.y ||
    y >= bounds.y + bounds.height
  ) {
    return undefined
  }

  // Check children (last child first for z-order)
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i]!
    if (child.isVisible) {
      const found = findNodeAtPosition(child, x, y)
      if (found) return found
    }
  }

  return root
}
