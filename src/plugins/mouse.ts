/**
 * @oxog/tui - Mouse Plugin
 * @packageDocumentation
 *
 * Plugin that provides mouse input handling capabilities.
 * This plugin captures mouse events and routes them to nodes under the cursor.
 */

import type { Plugin, TUIApp, MouseEvent, Node, Bounds } from '../types'
import { createMouseParser } from '../utils/keys'
import { enableMouse, disableMouse } from '../utils/ansi'
import { BaseNode, ContainerNode } from '../widgets/node'
import { TREE_MAX_DEPTH } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Mouse handler definition.
 */
export interface MouseHandler {
  /** Handler function */
  handler: (event: MouseEvent) => void | boolean
  /** Only handle events in specific bounds */
  bounds?: Bounds
}

/**
 * Mouse plugin options.
 */
export interface MousePluginOptions {
  /** Enable mouse tracking (default: true) */
  enabled?: boolean
  /** Enable SGR extended mouse protocol (default: true) */
  sgr?: boolean
  /** Debug mode */
  debug?: boolean
}

/**
 * Mouse plugin API exposed to the app.
 */
export interface MousePluginAPI {
  /** Register a global mouse handler */
  on(handler: (event: MouseEvent) => void | boolean): () => void
  /** Enable mouse tracking */
  enable(): void
  /** Disable mouse tracking */
  disable(): void
  /** Check if mouse tracking is enabled */
  isEnabled(): boolean
  /** Get node at position */
  getNodeAt(x: number, y: number): Node | null
}

// ============================================================
// Implementation
// ============================================================

/**
 * Check if a point is within bounds.
 */
function pointInBounds(x: number, y: number, bounds: Bounds): boolean {
  return (
    x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height
  )
}

/**
 * Type guard to check if a node has click handler.
 */
function hasClickHandler(node: Node): node is Node & { onClick(event: MouseEvent): void } {
  return typeof (node as { onClick?: unknown }).onClick === 'function'
}

/**
 * Type guard to check if a node has scroll handler.
 */
function hasScrollHandler(node: Node): node is Node & { onScroll(event: MouseEvent): void } {
  return typeof (node as { onScroll?: unknown }).onScroll === 'function'
}

/**
 * Type guard to check if a node has mouse move handler.
 */
function hasMouseMoveHandler(node: Node): node is Node & { onMouseMove(event: MouseEvent): void } {
  return typeof (node as { onMouseMove?: unknown }).onMouseMove === 'function'
}

/**
 * Type guard to check if a node has generic mouse handler.
 */
function hasGenericMouseHandler(node: Node): node is Node & { handleMouse(event: MouseEvent): void } {
  return typeof (node as { handleMouse?: unknown }).handleMouse === 'function'
}

/**
 * Type guard to check if a node has mouse enter handler.
 */
function hasMouseEnterHandler(node: Node): node is Node & { onMouseEnter(): void } {
  return typeof (node as { onMouseEnter?: unknown }).onMouseEnter === 'function'
}

/**
 * Type guard to check if a node has mouse leave handler.
 */
function hasMouseLeaveHandler(node: Node): node is Node & { onMouseLeave(): void } {
  return typeof (node as { onMouseLeave?: unknown }).onMouseLeave === 'function'
}

/**
 * Find node at position using hit testing.
 * @param node - Node to search in
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param depth - Current recursion depth (internal)
 */
function findNodeAt(node: BaseNode, x: number, y: number, depth: number = 0): BaseNode | null {
  // Prevent stack overflow from deeply nested or circular structures
  if (depth >= TREE_MAX_DEPTH) {
    return null
  }

  if (!node.isVisible) return null
  if (node._disposed) return null
  if (!pointInBounds(x, y, node._bounds)) return null

  // Check children first (reverse order for z-index)
  if (node instanceof ContainerNode) {
    for (let i = node._children.length - 1; i >= 0; i--) {
      const child = node._children[i]!
      const found = findNodeAt(child, x, y, depth + 1)
      if (found) return found
    }
  }

  return node
}

/**
 * Create the mouse plugin.
 *
 * @param options - Plugin options
 * @returns Mouse plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { mousePlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [mousePlugin()]
 * })
 *
 * // Listen for mouse events
 * app.mouse.on((event) => {
 *   console.log(`Mouse ${event.action} at ${event.x},${event.y}`)
 * })
 * ```
 */
export function mousePlugin(options: MousePluginOptions = {}): Plugin {
  const { enabled: initialEnabled = true, sgr = true, debug = false } = options

  let app: TUIApp | null = null
  let enabled = initialEnabled
  let stdinListener: ((data: Buffer) => void) | null = null
  const handlers: Set<(event: MouseEvent) => void | boolean> = new Set()
  const mouseParser = createMouseParser()

  // Track mouse state for hover detection
  let lastHoveredNode: BaseNode | null = null

  // Hover state timeout: clear hover if no mouse events for 5 seconds
  // This handles cases where mouse leaves terminal without sending a leave event
  const HOVER_TIMEOUT = 5000
  let hoverTimeoutTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Clear hover state safely.
   */
  function clearHoverState(): void {
    if (lastHoveredNode && !lastHoveredNode._disposed && hasMouseLeaveHandler(lastHoveredNode)) {
      try {
        lastHoveredNode.onMouseLeave()
      } catch (error) {
        console.error('[mouse] Error in onMouseLeave during clear:', error)
      }
    }
    lastHoveredNode = null
  }

  /**
   * Schedule hover state cleanup after timeout.
   */
  function scheduleHoverCleanup(): void {
    if (hoverTimeoutTimer) {
      clearTimeout(hoverTimeoutTimer)
    }
    hoverTimeoutTimer = setTimeout(() => {
      clearHoverState()
      hoverTimeoutTimer = null
    }, HOVER_TIMEOUT)
  }

  /**
   * Handle incoming mouse data.
   */
  function handleMouseData(data: Buffer): void {
    if (!enabled || !app) return

    const events = mouseParser.parse(data)

    // Reset hover timeout on any mouse activity
    scheduleHoverCleanup()

    for (const event of events) {
      // Validate coordinates are within valid bounds (non-negative)
      if (event.x < 0 || event.y < 0 || !Number.isFinite(event.x) || !Number.isFinite(event.y)) {
        if (debug) {
          console.error(`[mouse] ignoring event with invalid coordinates: x=${event.x} y=${event.y}`)
        }
        continue
      }

      if (debug) {
        console.error(
          `[mouse] action=${event.action} x=${event.x} y=${event.y} button=${event.button}`
        )
      }

      // Find node under cursor
      let targetNode: BaseNode | null = null
      if (app.root instanceof BaseNode) {
        targetNode = findNodeAt(app.root, event.x, event.y)
      }

      // Handle hover enter/leave
      if (event.action === 'move') {
        // Clear stale reference if node was disposed
        if (lastHoveredNode && lastHoveredNode._disposed) {
          lastHoveredNode = null
        }

        if (targetNode !== lastHoveredNode) {
          // Leave old node (only if not disposed)
          if (lastHoveredNode && !lastHoveredNode._disposed && hasMouseLeaveHandler(lastHoveredNode)) {
            lastHoveredNode.onMouseLeave()
          }

          // Enter new node (only if not disposed)
          if (targetNode && !targetNode._disposed && hasMouseEnterHandler(targetNode)) {
            targetNode.onMouseEnter()
          }

          lastHoveredNode = targetNode
        }
      }

      // Call global handlers
      let handled = false
      for (const handler of handlers) {
        const result = handler(event)
        if (result === true) {
          handled = true
          break
        }
      }

      // If not handled, route to target node
      if (!handled && targetNode) {
        routeToNode(targetNode, event)
      }

      // Emit on app
      if (
        typeof (app as { emit?: (name: string, event: MouseEvent) => void }).emit === 'function'
      ) {
        ;(app as { emit: (name: string, event: MouseEvent) => void }).emit('mouse', event)
      }
    }
  }

  /**
   * Route mouse event to node using type-safe handler checks.
   */
  function routeToNode(node: BaseNode, event: MouseEvent): void {
    // Check for specific handlers based on action using type guards
    switch (event.action) {
      case 'press':
        if (hasClickHandler(node)) {
          node.onClick(event)
        }
        break
      case 'scroll':
        if (hasScrollHandler(node)) {
          node.onScroll(event)
        }
        break
      case 'move':
        if (hasMouseMoveHandler(node)) {
          node.onMouseMove(event)
        }
        break
    }

    // Also check for generic mouse handler using type guard
    if (hasGenericMouseHandler(node)) {
      node.handleMouse(event)
    }
  }

  return {
    name: 'mouse',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { mouse: MousePluginAPI }).mouse = {
        on: (handler: (event: MouseEvent) => void | boolean) => {
          handlers.add(handler)
          return () => handlers.delete(handler)
        },

        enable: () => {
          if (!enabled) {
            enabled = true
            process.stdout.write(enableMouse(sgr))
            if (debug) {
              console.error('[mouse] tracking enabled')
            }
          }
        },

        disable: () => {
          if (enabled) {
            enabled = false
            process.stdout.write(disableMouse())

            // Clear hover state when disabling mouse tracking
            if (lastHoveredNode && !lastHoveredNode._disposed && hasMouseLeaveHandler(lastHoveredNode)) {
              try {
                lastHoveredNode.onMouseLeave()
              } catch (error) {
                console.error('[mouse] Error in onMouseLeave during disable:', error)
              }
            }
            lastHoveredNode = null

            if (debug) {
              console.error('[mouse] tracking disabled')
            }
          }
        },

        isEnabled: () => enabled,

        getNodeAt: (x: number, y: number) => {
          if (!app || !(app.root instanceof BaseNode)) return null
          return findNodeAt(app.root, x, y)
        }
      }

      // Enable mouse tracking
      if (enabled) {
        process.stdout.write(enableMouse(sgr))
      }

      // Set up stdin listening for mouse events
      if (process.stdin.isTTY) {
        stdinListener = handleMouseData
        process.stdin.on('data', stdinListener)

        if (debug) {
          console.error('[mouse] plugin installed, listening for events')
        }
      }
    },

    destroy(): void {
      // Clear hover timeout
      if (hoverTimeoutTimer) {
        clearTimeout(hoverTimeoutTimer)
        hoverTimeoutTimer = null
      }

      // Clear hover state on destroy
      if (lastHoveredNode && !lastHoveredNode._disposed && hasMouseLeaveHandler(lastHoveredNode)) {
        try {
          lastHoveredNode.onMouseLeave()
        } catch (error) {
          console.error('[mouse] Error in onMouseLeave during destroy:', error)
        }
      }
      lastHoveredNode = null

      // Disable mouse tracking
      if (enabled) {
        process.stdout.write(disableMouse())
        enabled = false
      }

      // Clean up stdin listener
      if (stdinListener) {
        process.stdin.removeListener('data', stdinListener)
        stdinListener = null
      }

      handlers.clear()
      app = null
    }
  }
}
