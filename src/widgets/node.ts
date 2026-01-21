/**
 * @oxog/tui - Node System
 * @packageDocumentation
 */

import type { Node, Bounds, LayoutProps, StyleProps, Buffer, CellStyle } from '../types'

// ============================================================
// ID Generation
// ============================================================

// Use BigInt for safe counter that never overflows
let idCounter = 0n

/**
 * Generate a unique node ID.
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  idCounter++
  return `node_${idCounter}`
}

/**
 * Reset ID counter (for testing only - DO NOT use in production).
 * @internal
 */
export function resetIdCounter(): void {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    console.warn('resetIdCounter() should only be used in tests')
  }
  idCounter = 0n
}

// ============================================================
// Event Handler Utilities
// ============================================================

/**
 * Type for unsubscribe function returned by event subscription.
 */
export type Unsubscribe = () => void

/**
 * Helper class for managing event handlers with cleanup support.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HandlerRegistry<T extends (...args: any[]) => void> {
  private handlers: T[] = []

  /**
   * Add a handler and return unsubscribe function.
   */
  add(handler: T): Unsubscribe {
    this.handlers.push(handler)
    return () => this.remove(handler)
  }

  /**
   * Remove a specific handler.
   */
  remove(handler: T): boolean {
    const index = this.handlers.indexOf(handler)
    if (index !== -1) {
      this.handlers.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Call all handlers with arguments.
   */
  emit(...args: Parameters<T>): void {
    // Create a copy to handle removal during iteration
    const snapshot = [...this.handlers]
    for (const handler of snapshot) {
      handler(...args)
    }
  }

  /**
   * Remove all handlers.
   */
  clear(): void {
    this.handlers = []
  }

  /**
   * Get number of registered handlers.
   */
  get size(): number {
    return this.handlers.length
  }
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

  /** @internal */
  _disposed: boolean = false

  // Cache for bounds getter to avoid object creation
  private _boundsCache: Bounds | null = null
  private _boundsVersion: number = 0
  private _currentVersion: number = 0

  // Focus/Blur handler registries
  /** @internal */
  _onFocusHandlers: (() => void)[] = []
  /** @internal */
  _onBlurHandlers: (() => void)[] = []

  constructor() {
    this.id = generateId()
  }

  /**
   * Check if node has been disposed.
   */
  get isDisposed(): boolean {
    return this._disposed
  }

  /**
   * Dispose of the node and release all resources.
   * Subclasses should override this to clean up timers, handlers, etc.
   * Always call super.dispose() when overriding.
   */
  dispose(): void {
    if (this._disposed) return
    this._disposed = true

    // Dispose all children first
    for (const child of this._children) {
      child.dispose()
    }

    // Remove from parent
    if (this._parent instanceof ContainerNode) {
      this._parent.remove(this)
    }
    this._parent = null
    this._children = []
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
    // Always return a fresh copy to prevent external mutations
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
   * Focus this node.
   * Emits all registered focus handlers.
   */
  focus(): this {
    for (const handler of this._onFocusHandlers) {
      handler()
    }
    return this
  }

  /**
   * Blur (remove focus from) this node.
   * Emits all registered blur handlers.
   */
  blur(): this {
    for (const handler of this._onBlurHandlers) {
      handler()
    }
    return this
  }

  /**
   * Register a handler to be called when this node is focused.
   * @param handler - Function to call on focus
   * @returns Unsubscribe function
   */
  onFocus(handler: () => void): () => void {
    this._onFocusHandlers.push(handler)
    return () => {
      const index = this._onFocusHandlers.indexOf(handler)
      if (index !== -1) {
        this._onFocusHandlers.splice(index, 1)
      }
    }
  }

  /**
   * Register a handler to be called when this node is blurred.
   * @param handler - Function to call on blur
   * @returns Unsubscribe function
   */
  onBlur(handler: () => void): () => void {
    this._onBlurHandlers.push(handler)
    return () => {
      const index = this._onBlurHandlers.indexOf(handler)
      if (index !== -1) {
        this._onBlurHandlers.splice(index, 1)
      }
    }
  }

  /**
   * Mark node as needing re-render.
   * No-op if node is disposed.
   */
  markDirty(): void {
    if (this._disposed) return
    this._dirty = true
    this._layoutDirty = true
    // Invalidate bounds cache
    this._currentVersion++
    // Propagate to parent
    if (this._parent) {
      this._parent.markDirty()
    }
  }

  /**
   * Throws an error if node has been disposed.
   * Use this in methods that shouldn't be called after dispose.
   * @internal
   */
  protected assertNotDisposed(): void {
    if (this._disposed) {
      throw new Error(`Cannot perform operation on disposed node (id: ${this.id})`)
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
      if (child._disposed) {
        console.warn('Attempting to add a disposed node')
        return this
      }
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
   * @param dispose - Whether to dispose the child (default: false)
   */
  remove(child: Node, dispose: boolean = false): this {
    if (child instanceof BaseNode) {
      const index = this._children.indexOf(child)
      if (index !== -1) {
        child._parent = null
        this._children.splice(index, 1)
        if (dispose) {
          child.dispose()
        }
        this.markDirty()
      }
    }
    return this
  }

  /**
   * Remove all children.
   * @param dispose - Whether to dispose all children (default: false)
   */
  clear(dispose: boolean = false): this {
    for (const child of this._children) {
      child._parent = null
      if (dispose) {
        child.dispose()
      }
    }
    this._children = []
    this.markDirty()
    return this
  }

  /**
   * Dispose of container and all children.
   */
  override dispose(): void {
    if (this._disposed) return
    // Children will be disposed by super.dispose()
    super.dispose()
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
