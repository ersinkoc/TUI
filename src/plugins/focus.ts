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
function collectFocusable(node: BaseNode, result: BaseNode[] = []): BaseNode[] {
  if (isFocusable(node)) {
    result.push(node)
  }

  if (node instanceof ContainerNode) {
    for (const child of node._children) {
      collectFocusable(child, result)
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
  const manualFocusables: Set<Node> = new Set()

  /**
   * Get all focusable nodes.
   */
  function getFocusableNodes(): BaseNode[] {
    /* c8 ignore next */
    if (!app || !(app.root instanceof BaseNode)) return []

    const collected = collectFocusable(app.root)

    // Add manually registered nodes that aren't in the tree
    for (const node of manualFocusables) {
      if (node instanceof BaseNode && !collected.includes(node)) {
        if (isFocusable(node)) {
          collected.push(node)
        }
      }
    }

    return collected
  }

  /**
   * Find node by ID in tree.
   */
  function findNodeById(node: BaseNode, id: string): BaseNode | null {
    if (node.id === id) return node

    if (node instanceof ContainerNode) {
      for (const child of node._children) {
        const found = findNodeById(child, id)
        if (found) return found
      }
    }

    return null
  }

  /**
   * Focus a node.
   */
  function doFocus(node: BaseNode): void {
    if (focusedNode === node) return

    // Blur previous
    if (focusedNode) {
      const blurMethod = (focusedNode as { blur?: () => void }).blur
      if (typeof blurMethod === 'function') {
        blurMethod.call(focusedNode)
      }

      // Emit blur event
      const onBlur = (focusedNode as { _onBlurHandlers?: (() => void)[] })._onBlurHandlers
      if (Array.isArray(onBlur)) {
        for (const handler of onBlur) {
          handler()
        }
      }
    }

    focusedNode = node

    // Focus new
    const focusMethod = (node as { focus?: () => void }).focus
    if (typeof focusMethod === 'function') {
      focusMethod.call(node)
    }

    // Emit focus event
    const onFocus = (node as { _onFocusHandlers?: (() => void)[] })._onFocusHandlers
    if (Array.isArray(onFocus)) {
      for (const handler of onFocus) {
        handler()
      }
    }

    // Update app's focused node reference
    if (app) {
      ;(app as { focusedNode?: Node }).focusedNode = node
    }

    if (debug) {
      console.error(`[focus] focused: ${node.type}#${node.id}`)
    }
  }

  /**
   * Handle key input for focus navigation.
   */
  function handleKeyInput(event: KeyEvent): boolean {
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
            const blurMethod = (focusedNode as { blur?: () => void }).blur
            if (typeof blurMethod === 'function') {
              blurMethod.call(focusedNode)
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
          manualFocusables.add(node)
        },

        unregisterFocusable: (node: Node) => {
          manualFocusables.delete(node)
        }
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
      app = null
    }
  }
}
