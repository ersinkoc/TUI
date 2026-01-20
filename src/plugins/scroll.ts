/**
 * @oxog/tui - Scroll Plugin
 * @packageDocumentation
 *
 * Plugin that provides scrolling capabilities for content that exceeds view bounds.
 * This plugin enables virtual scrolling for efficient rendering of large content.
 */

import type { Plugin, TUIApp, Node } from '../types'
import { BaseNode } from '../widgets/node'

// ============================================================
// Types
// ============================================================

/**
 * Scroll state for a node.
 */
export interface ScrollState {
  /** Horizontal scroll offset */
  scrollX: number
  /** Vertical scroll offset */
  scrollY: number
  /** Total content width */
  contentWidth: number
  /** Total content height */
  contentHeight: number
  /** Visible view width */
  viewWidth: number
  /** Visible view height */
  viewHeight: number
}

/**
 * Scroll plugin options.
 */
export interface ScrollPluginOptions {
  /** Scroll amount per mouse wheel tick (default: 3) */
  scrollAmount?: number
  /** Enable smooth scrolling (default: false) */
  smooth?: boolean
  /** Show scroll indicators (default: true) */
  showIndicators?: boolean
  /** Debug mode */
  debug?: boolean
}

/**
 * Scroll plugin API exposed to the app.
 */
export interface ScrollPluginAPI {
  /** Get scroll state for a node */
  getScrollState(nodeId: string): ScrollState | null
  /** Set scroll position for a node */
  scrollTo(nodeId: string, x: number, y: number): void
  /** Scroll by delta amounts */
  scrollBy(nodeId: string, deltaX: number, deltaY: number): void
  /** Scroll to ensure an item is visible */
  scrollIntoView(nodeId: string, itemIndex: number): void
  /** Register a scrollable node */
  registerScrollable(node: Node, contentHeight: number, contentWidth?: number): void
  /** Unregister a scrollable node */
  unregisterScrollable(node: Node): void
  /** Get all scrollable nodes */
  getScrollableNodes(): string[]
}

// ============================================================
// Implementation
// ============================================================

/**
 * Create the scroll plugin.
 *
 * @param options - Plugin options
 * @returns Scroll plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { scrollPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [scrollPlugin({
 *     scrollAmount: 3,
 *     showIndicators: true
 *   })]
 * })
 *
 * // Scroll a list
 * app.scroll.scrollBy('my-list', 0, 10)
 *
 * // Ensure item is visible
 * app.scroll.scrollIntoView('my-list', 50)
 * ```
 */
export function scrollPlugin(options: ScrollPluginOptions = {}): Plugin {
  const {
    scrollAmount = 3,
    // smooth = false, // Reserved for future smooth scrolling implementation
    // showIndicators = true, // Reserved for future scroll indicator rendering
    debug = false
  } = options

  const scrollStates: Map<string, ScrollState> = new Map()
  const scrollableNodes: Map<string, Node> = new Map()

  /**
   * Clamp scroll position to valid range.
   */
  function clampScroll(state: ScrollState): void {
    const maxX = Math.max(0, state.contentWidth - state.viewWidth)
    const maxY = Math.max(0, state.contentHeight - state.viewHeight)

    state.scrollX = Math.max(0, Math.min(state.scrollX, maxX))
    state.scrollY = Math.max(0, Math.min(state.scrollY, maxY))
  }

  /**
   * Update node's scroll offset.
   */
  function applyScrollToNode(nodeId: string, state: ScrollState): void {
    const node = scrollableNodes.get(nodeId)
    /* c8 ignore next */
    if (!node) return

    // Update node's scroll properties if it has them
    const scrollableNode = node as {
      scrollOffset?: number
      setScrollOffset?: (offset: number) => void
      _scrollX?: number
      _scrollY?: number
    }

    if (typeof scrollableNode.setScrollOffset === 'function') {
      scrollableNode.setScrollOffset(state.scrollY)
    } else if ('_scrollY' in scrollableNode) {
      scrollableNode._scrollY = state.scrollY
      scrollableNode._scrollX = state.scrollX
    }

    // Mark node as dirty
    if (node instanceof BaseNode) {
      node.markDirty()
    }
  }

  return {
    name: 'scroll',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      // Expose API on app
      ;(tuiApp as TUIApp & { scroll: ScrollPluginAPI }).scroll = {
        getScrollState: (nodeId: string) => {
          return scrollStates.get(nodeId) ?? null
        },

        scrollTo: (nodeId: string, x: number, y: number) => {
          const state = scrollStates.get(nodeId)
          if (!state) return

          state.scrollX = x
          state.scrollY = y
          clampScroll(state)
          applyScrollToNode(nodeId, state)

          if (debug) {
            console.error(`[scroll] ${nodeId} scrollTo(${x}, ${y})`)
          }
        },

        scrollBy: (nodeId: string, deltaX: number, deltaY: number) => {
          const state = scrollStates.get(nodeId)
          if (!state) return

          state.scrollX += deltaX
          state.scrollY += deltaY
          clampScroll(state)
          applyScrollToNode(nodeId, state)

          if (debug) {
            console.error(`[scroll] ${nodeId} scrollBy(${deltaX}, ${deltaY})`)
          }
        },

        scrollIntoView: (nodeId: string, itemIndex: number) => {
          const state = scrollStates.get(nodeId)
          if (!state) return

          // Assume each item is 1 row high for simplicity
          // Nodes can override this by providing item height info
          const itemTop = itemIndex
          const itemBottom = itemIndex + 1

          // Check if item is above visible area
          if (itemTop < state.scrollY) {
            state.scrollY = itemTop
          }
          // Check if item is below visible area
          else if (itemBottom > state.scrollY + state.viewHeight) {
            state.scrollY = itemBottom - state.viewHeight
          }

          clampScroll(state)
          applyScrollToNode(nodeId, state)

          if (debug) {
            console.error(`[scroll] ${nodeId} scrollIntoView(${itemIndex})`)
          }
        },

        registerScrollable: (node: Node, contentHeight: number, contentWidth?: number) => {
          const bounds = (node as BaseNode)._bounds
          /* c8 ignore next 2 */
          const viewWidth = bounds?.width ?? 0
          const viewHeight = bounds?.height ?? 0

          const state: ScrollState = {
            scrollX: 0,
            scrollY: 0,
            contentWidth: contentWidth ?? viewWidth,
            contentHeight,
            viewWidth,
            viewHeight
          }

          scrollStates.set(node.id, state)
          scrollableNodes.set(node.id, node)

          if (debug) {
            console.error(
              `[scroll] registered ${node.id} content=${contentHeight}x${contentWidth ?? viewWidth}`
            )
          }
        },

        unregisterScrollable: (node: Node) => {
          scrollStates.delete(node.id)
          scrollableNodes.delete(node.id)
        },

        getScrollableNodes: () => Array.from(scrollableNodes.keys())
      }

      // Hook into mouse plugin for scroll wheel events
      const mouseAPI = (
        tuiApp as {
          mouse?: {
            on: (
              handler: (e: { action: string; scrollDelta?: number; x: number; y: number }) => void
            ) => () => void
          }
        }
      ).mouse
      if (mouseAPI) {
        mouseAPI.on(event => {
          if (event.action !== 'scroll') return

          // Find scrollable node under cursor
          for (const [nodeId, node] of scrollableNodes) {
            const bounds = (node as BaseNode)._bounds
            /* c8 ignore start */
            if (
              bounds &&
              event.x >= bounds.x &&
              event.x < bounds.x + bounds.width &&
              event.y >= bounds.y &&
              event.y < bounds.y + bounds.height
            ) {
              const delta = (event.scrollDelta ?? 1) * scrollAmount
              const api = (tuiApp as TUIApp & { scroll: ScrollPluginAPI }).scroll
              api.scrollBy(nodeId, 0, delta)
              break
            }
            /* c8 ignore stop */
          }
        })
      }

      if (debug) {
        console.error('[scroll] plugin installed')
      }
    },

    onResize(_width: number, _height: number): void {
      // Update view sizes for all scrollable nodes
      for (const [nodeId, node] of scrollableNodes) {
        const state = scrollStates.get(nodeId)
        /* c8 ignore next */
        if (!state) continue

        const bounds = (node as BaseNode)._bounds
        /* c8 ignore next */
        if (bounds) {
          state.viewWidth = bounds.width
          state.viewHeight = bounds.height
          clampScroll(state)
        }
      }
    },

    destroy(): void {
      scrollStates.clear()
      scrollableNodes.clear()
    }
  }
}

/**
 * Create scroll indicator characters.
 */
export function createScrollIndicators(state: ScrollState): {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
  verticalBar?: { position: number; size: number }
  horizontalBar?: { position: number; size: number }
} {
  const canScrollUp = state.scrollY > 0
  const canScrollDown = state.scrollY < state.contentHeight - state.viewHeight
  const canScrollLeft = state.scrollX > 0
  const canScrollRight = state.scrollX < state.contentWidth - state.viewWidth

  // Calculate scrollbar positions if content is scrollable
  let verticalBar: { position: number; size: number } | undefined
  let horizontalBar: { position: number; size: number } | undefined

  if (state.contentHeight > state.viewHeight) {
    const ratio = state.viewHeight / state.contentHeight
    const size = Math.max(1, Math.floor(state.viewHeight * ratio))
    const maxPosition = state.viewHeight - size
    const position = Math.floor(
      (state.scrollY / (state.contentHeight - state.viewHeight)) * maxPosition
    )
    verticalBar = { position, size }
  }

  if (state.contentWidth > state.viewWidth) {
    const ratio = state.viewWidth / state.contentWidth
    const size = Math.max(1, Math.floor(state.viewWidth * ratio))
    const maxPosition = state.viewWidth - size
    const position = Math.floor(
      (state.scrollX / (state.contentWidth - state.viewWidth)) * maxPosition
    )
    horizontalBar = { position, size }
  }

  const result: {
    top: boolean
    bottom: boolean
    left: boolean
    right: boolean
    verticalBar?: { position: number; size: number }
    horizontalBar?: { position: number; size: number }
  } = {
    top: canScrollUp,
    bottom: canScrollDown,
    left: canScrollLeft,
    right: canScrollRight
  }

  if (verticalBar) {
    result.verticalBar = verticalBar
  }

  if (horizontalBar) {
    result.horizontalBar = horizontalBar
  }

  return result
}
