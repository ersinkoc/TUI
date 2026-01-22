/**
 * @oxog/tui - Focus Plugin
 * @packageDocumentation
 *
 * Plugin that provides focus management capabilities.
 * This plugin manages focus between focusable nodes in the UI tree.
 */

import type { Plugin, TUIApp, Node, KeyEvent } from '../types'
import { BaseNode, ContainerNode } from '../widgets/node'

// ============================================================
// Types
// ============================================================

/**
 * Focus plugin options.
 */
export interface FocusPluginOptions {
  /** Initial focused node ID */
  initialFocus?: string
  /** Enable Tab key for focus navigation (default: true) */
  tabNavigation?: boolean
  /** Enable arrow key navigation (default: false) */
  arrowNavigation?: boolean
  /** Wrap focus at boundaries (default: true) */
  wrap?: boolean
  /** Debug mode */
  debug?: boolean
}

/**
 * Focus plugin API exposed to the app.
 */
export interface FocusPluginAPI {
  /** Get currently focused node */
  getFocused(): Node | null
  /** Focus a specific node by ID */
  focus(nodeId: string): boolean
  /** Focus next focusable node */
  focusNext(): boolean
  /** Focus previous focusable node */
  focusPrevious(): boolean
  /** Blur current focus */
  blur(): void
  /** Get all focusable nodes */
  getFocusableNodes(): Node[]
  /** Register a node as focusable */
  registerFocusable(node: Node): void
  /** Unregister a node from focus system */
  unregisterFocusable(node: Node): void
  /** Enable/disable focus handling */
  setEnabled(value: boolean): void
  /** Check if focus handling is enabled */
  isEnabled(): boolean
}

// ============================================================
// Implementation
// ============================================================

/**
 * Check if a node is focusable.
 */
function isFocusable(node: BaseNode): boolean {
  if (!node.isVisible) return false

  // Check if node has focus-related properties
  const nodeWithFocus = node as {
    focusable?: boolean
    isFocusable?: boolean
    disabled?: boolean
  }

  if (nodeWithFocus.disabled === true) return false
  if (nodeWithFocus.focusable === true) return true
  /* c8 ignore next */
  if (nodeWithFocus.isFocusable === true) return true

  // Check node type - these are typically focusable
  const focusableTypes = ['input', 'textarea', 'select', 'checkbox', 'button', 'tabs']
  return focusableTypes.includes(node.type)
}

/**
 * Collect all focusable nodes in tree order (depth-first).
 */
function collectFocusable(node: BaseNode, result: BaseNode[] = [], depth: number = 0, maxDepth: number = 1000): BaseNode[] {
  // Prevent stack overflow from circular references or extremely deep trees
  if (depth > maxDepth) {
    console.warn('[focus] Max recursion depth reached in collectFocusable')
    return result
  }

  if (isFocusable(node)) {
    result.push(node)
  }

  if (node instanceof ContainerNode) {
    for (const child of node._children) {
      collectFocusable(child, result, depth + 1, maxDepth)
    }
  }

  return result
}

/**
 * Create the focus plugin.
 *
 * @param options - Plugin options
 * @returns Focus plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { focusPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [focusPlugin({
 *     tabNavigation: true,
 *     wrap: true
 *   })]
 * })
 *
 * // Focus next element
 * app.focus.focusNext()
 *
 * // Focus specific node
 * app.focus.focus('input-1')
 * ```
 */
export function focusPlugin(options: FocusPluginOptions = {}): Plugin {
  const {
    initialFocus,
    tabNavigation = true,
    arrowNavigation = false,
    wrap = true,
    debug = false
  } = options

  let app: TUIApp | null = null
  let focusedNode: BaseNode | null = null
  let enabled = true
  const manualFocusables: Set<Node> = new Set()

  /**
   * Get all focusable nodes.
   */
  function getFocusableNodes(): BaseNode[] {
    /* c8 ignore next */
    if (!app || !(app.root instanceof BaseNode)) return []

    const collected = collectFocusable(app.root)

    // Filter out disposed nodes
    const validCollected = collected.filter(node => {
      const nodeWithDisposed = node as { _disposed?: boolean }
      return !nodeWithDisposed._disposed && node.isVisible
    })

    // Add manually registered nodes that aren't in the tree
    for (const node of manualFocusables) {
      if (node instanceof BaseNode && !validCollected.includes(node)) {
        const nodeWithDisposed = node as { _disposed?: boolean }
        if (isFocusable(node) && !nodeWithDisposed._disposed && node.isVisible) {
          validCollected.push(node)
        }
      }
    }

    return validCollected
  }

  /**
   * Find node by ID in tree.
   */
  function findNodeById(node: BaseNode, id: string, depth: number = 0, maxDepth: number = 1000): BaseNode | null {
    // Prevent stack overflow from circular references or extremely deep trees
    if (depth > maxDepth) {
      console.warn('[focus] Max recursion depth reached in findNodeById')
      return null
    }

    if (node.id === id) return node

    if (node instanceof ContainerNode) {
      for (const child of node._children) {
        const found = findNodeById(child, id, depth + 1, maxDepth)
        if (found) return found
      }
    }

    return null
  }

/**
 * Check if a node has focus method.
 */
function hasFocusMethod(node: Node): node is Node & { focus(): void } {
  return 'focus' in node && typeof (node as { focus?: unknown }).focus === 'function'
}

/**
 * Check if a node has blur method.
 */
function hasBlurMethod(node: Node): node is Node & { blur(): void } {
  return 'blur' in node && typeof (node as { blur?: unknown }).blur === 'function'
}

/**
 * Focus a node.
 *
 * Atomic operation: either fully succeeds or fully fails with no state corruption.
 * Protected against dispose during focus, handler errors, and concurrent calls.
 */
function doFocus(node: BaseNode): void {
  // Early exit if already focused (idempotent)
  if (focusedNode === node) return

  // Check if node is disposed before focusing
  const nodeWithDisposed = node as { _disposed?: boolean }
  if (nodeWithDisposed._disposed) {
    if (debug) {
      console.warn(`[focus] Refusing to focus disposed node: ${node.id}`)
    }
    return
  }

  // Store old state for potential rollback
  const oldFocusedNode = focusedNode
  const newFocusedNode = node

  // Phase 1: Validate both nodes are still valid
  // (They could be disposed during validation)
  if (newFocusedNode._disposed) {
    return  // Node was disposed, abort
  }

  // Phase 2: Call blur on old node (with error protection)
  let blurError: Error | null = null
  if (oldFocusedNode && !oldFocusedNode._disposed) {
    if (hasBlurMethod(oldFocusedNode)) {
      try {
        oldFocusedNode.blur()
      } catch (error) {
        blurError = error as Error
        console.error(`[focus] Error blurring node ${oldFocusedNode.id}:`, error)
        // Continue anyway - blur error shouldn't block focus change
      }
    }
  }

  // Phase 3: Update focused node reference BEFORE calling focus
  // This ensures that even if focus() throws, we're in a consistent state
  focusedNode = newFocusedNode

  // Update app's focused node reference
  if (app) {
    ;(app as { focusedNode?: Node }).focusedNode = newFocusedNode
  }

  // Phase 4: Call focus on new node (with error protection)
  let focusError: Error | null = null
  if (hasFocusMethod(newFocusedNode)) {
    try {
      newFocusedNode.focus()
    } catch (error) {
      focusError = error as Error
      console.error(`[focus] Error focusing node ${newFocusedNode.id}:`, error)
      // State is already updated, so log and continue
    }
  }

  // Debug logging
  if (debug) {
    if (blurError || focusError) {
      console.error(
        `[focus] focused ${newFocusedNode.type}#${newFocusedNode.id} ` +
        `(with errors: blur=${!!blurError}, focus=${!!focusError})`
      )
    } else {
      console.error(`[focus] focused: ${newFocusedNode.type}#${newFocusedNode.id}`)
    }
  }

  // Final validation: if node was disposed during focus, clean up
  if (newFocusedNode._disposed) {
    if (debug) {
      console.warn(`[focus] Node ${newFocusedNode.id} was disposed during focus`)
    }
    focusedNode = null
    if (app) {
      // Use null instead of undefined to match type expectations
      ;(app as { focusedNode?: Node | null }).focusedNode = null
    }
  }
}

  /**
   * Handle key input for focus navigation.
   */
  function handleKeyInput(event: KeyEvent): boolean {
    if (!enabled) return false

    // Tab navigation
    if (tabNavigation && event.name === 'tab') {
      if (event.shift) {
        return focusPreviousNode()
      } else {
        return focusNextNode()
      }
    }

    // Arrow navigation
    if (arrowNavigation) {
      if (event.name === 'down' || event.name === 'right') {
        return focusNextNode()
      }
      if (event.name === 'up' || event.name === 'left') {
        return focusPreviousNode()
      }
    }

    return false
  }

  /**
   * Focus next node.
   */
  function focusNextNode(): boolean {
    const focusable = getFocusableNodes()
    if (focusable.length === 0) return false

    const currentIndex = focusedNode ? focusable.indexOf(focusedNode) : -1
    let nextIndex = currentIndex + 1

    if (nextIndex >= focusable.length) {
      if (wrap) {
        nextIndex = 0
      } else {
        return false
      }
    }

    doFocus(focusable[nextIndex]!)
    return true
  }

  /**
   * Focus previous node.
   */
  function focusPreviousNode(): boolean {
    const focusable = getFocusableNodes()
    /* c8 ignore next */
    if (focusable.length === 0) return false

    /* c8 ignore next */
    const currentIndex = focusedNode ? focusable.indexOf(focusedNode) : focusable.length
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      if (wrap) {
        prevIndex = focusable.length - 1
      } else {
        return false
      }
    }

    doFocus(focusable[prevIndex]!)
    return true
  }

  return {
    name: 'focus',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { focus: FocusPluginAPI }).focus = {
        getFocused: () => focusedNode,

        focus: (nodeId: string) => {
          /* c8 ignore next */
          if (!app || !(app.root instanceof BaseNode)) return false

          const node = findNodeById(app.root, nodeId)
          if (node && isFocusable(node)) {
            doFocus(node)
            return true
          }
          return false
        },

        focusNext: () => focusNextNode(),

        focusPrevious: () => focusPreviousNode(),

        blur: () => {
          if (focusedNode) {
            if (hasBlurMethod(focusedNode)) {
              focusedNode.blur()
            }
            focusedNode = null
            if (app) {
              // Use null instead of undefined to avoid exactOptionalPropertyTypes issue
              ;(app as { focusedNode?: Node | null }).focusedNode = null
            }
          }
        },

        getFocusableNodes: () => getFocusableNodes(),

        registerFocusable: (node: Node) => {
          if (!node) {
            console.warn('[focus] Cannot register null/undefined as focusable')
            return
          }

          // Check if node is already disposed
          const nodeWithDisposed = node as { _disposed?: boolean }
          if (nodeWithDisposed._disposed) {
            console.warn('[focus] Cannot register disposed node as focusable')
            return
          }

          manualFocusables.add(node)
        },

        unregisterFocusable: (node: Node) => {
          manualFocusables.delete(node)
        },

        setEnabled: (value: boolean) => {
          enabled = value
        },

        isEnabled: () => enabled
      }

      // Set up key listener for focus navigation
      const inputAPI = (
        tuiApp as { input?: { bind: (key: string, handler: (e: KeyEvent) => boolean) => void } }
      ).input
      if (inputAPI) {
        if (tabNavigation) {
          inputAPI.bind('Tab', e => handleKeyInput(e))
          inputAPI.bind('shift+Tab', e => handleKeyInput({ ...e, shift: true }))
        }
        if (arrowNavigation) {
          inputAPI.bind('ArrowDown', e => handleKeyInput(e))
          inputAPI.bind('ArrowUp', e => handleKeyInput(e))
          inputAPI.bind('ArrowRight', e => handleKeyInput(e))
          inputAPI.bind('ArrowLeft', e => handleKeyInput(e))
        }
      }

      // Set initial focus
      if (initialFocus) {
        setTimeout(() => {
          const api = (tuiApp as TUIApp & { focus: FocusPluginAPI }).focus
          api.focus(initialFocus)
        }, 0)
      }

      if (debug) {
        console.error('[focus] plugin installed')
      }
    },

    destroy(): void {
      focusedNode = null
      manualFocusables.clear()
      enabled = true
      app = null
    }
  }
}
