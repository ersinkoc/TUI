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
 * Find node at position using hit testing.
 */
function findNodeAt(node: BaseNode, x: number, y: number): BaseNode | null {
  if (!node.isVisible) return null
  if (!pointInBounds(x, y, node._bounds)) return null

  // Check children first (reverse order for z-index)
  if (node instanceof ContainerNode) {
    for (let i = node._children.length - 1; i >= 0; i--) {
      const child = node._children[i]!
      const found = findNodeAt(child, x, y)
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

  /**
   * Handle incoming mouse data.
   */
  function handleMouseData(data: Buffer): void {
    if (!enabled || !app) return

    const events = mouseParser.parse(data)

    for (const event of events) {
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
        if (targetNode !== lastHoveredNode) {
          // Leave old node
          if (lastHoveredNode) {
            const leaveHandler = (lastHoveredNode as { onMouseLeave?: () => void }).onMouseLeave
            if (typeof leaveHandler === 'function') {
              leaveHandler()
            }
          }

          // Enter new node
          if (targetNode) {
            const enterHandler = (targetNode as { onMouseEnter?: () => void }).onMouseEnter
            if (typeof enterHandler === 'function') {
              enterHandler()
            }
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
   * Route mouse event to node.
   */
  function routeToNode(node: BaseNode, event: MouseEvent): void {
    // Check for specific handlers based on action
    switch (event.action) {
      case 'press': {
        const handler = (node as { onClick?: (event: MouseEvent) => void }).onClick
        if (typeof handler === 'function') {
          handler(event)
        }
        break
      }
      case 'scroll': {
        const handler = (node as { onScroll?: (event: MouseEvent) => void }).onScroll
        if (typeof handler === 'function') {
          handler(event)
        }
        break
      }
      case 'move': {
        const handler = (node as { onMouseMove?: (event: MouseEvent) => void }).onMouseMove
        if (typeof handler === 'function') {
          handler(event)
        }
        break
      }
    }

    // Also check for generic mouse handler
    const genericHandler = (node as { handleMouse?: (event: MouseEvent) => void }).handleMouse
    if (typeof genericHandler === 'function') {
      genericHandler(event)
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
      // Disable mouse tracking
      if (enabled) {
        process.stdout.write(disableMouse())
      }

      // Clean up stdin listener
      if (stdinListener) {
        process.stdin.removeListener('data', stdinListener)
        stdinListener = null
      }

      handlers.clear()
      lastHoveredNode = null
      app = null
    }
  }
}
