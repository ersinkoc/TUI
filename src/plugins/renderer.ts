/**
 * @oxog/tui - Renderer Plugin
 * @packageDocumentation
 *
 * Core plugin that provides differential rendering capabilities.
 * This plugin is required for any TUI application.
 */

import type { Plugin, TUIApp, Buffer, CellStyle, Node, Renderer } from '../types'
import { createBuffer } from '../core/buffer'
import { createRenderer } from '../core/renderer'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { BaseNode } from '../widgets/node'

// ============================================================
// Types
// ============================================================

/**
 * Renderer plugin options.
 */
export interface RendererPluginOptions {
  /** Force full redraw on each render (disable differential) */
  forceFullRedraw?: boolean
  /** Debug mode - log render statistics */
  debug?: boolean
}

/**
 * Renderer plugin state.
 */
export interface RendererPluginState {
  /** Current buffer */
  buffer: Buffer
  /** Renderer instance */
  renderer: Renderer
  /** Whether a render is scheduled */
  renderScheduled: boolean
  /** Dirty flag */
  dirty: boolean
  /** Render count for debug */
  renderCount: number
}

/**
 * Renderer plugin API exposed to the app.
 */
export interface RendererPluginAPI {
  /** Force a full redraw on next render */
  forceRedraw(): void
  /** Mark the screen as dirty */
  markDirty(): void
  /** Get render statistics */
  getStats(): { renderCount: number; lastRenderTime: number }
}

// ============================================================
// Implementation
// ============================================================

/**
 * Create the renderer plugin.
 *
 * @param options - Plugin options
 * @returns Renderer plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { rendererPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [rendererPlugin()]
 * })
 * ```
 */
export function rendererPlugin(options: RendererPluginOptions = {}): Plugin {
  const { forceFullRedraw = false, debug = false } = options

  let state: RendererPluginState | null = null
  let app: TUIApp | null = null
  let lastRenderTime = 0

  return {
    name: 'renderer',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp
      const { width, height } = tuiApp

      // Initialize buffer
      const buffer = createBuffer(width, height)

      // Create renderer with process.stdout
      const renderer = createRenderer(process.stdout)

      state = {
        buffer,
        renderer,
        renderScheduled: false,
        dirty: true,
        renderCount: 0
      }

      // Expose API on app
      ;(tuiApp as TUIApp & { renderer: RendererPluginAPI }).renderer = {
        forceRedraw: () => {
          if (state) {
            state.renderer.invalidate()
            state.dirty = true
          }
        },
        markDirty: () => {
          if (state) {
            state.dirty = true
          }
        },
        /* c8 ignore next 4 */
        getStats: () => ({
          renderCount: state?.renderCount ?? 0,
          lastRenderTime
        })
      }
    },

    onResize(width: number, height: number): void {
      if (!state) return

      // Recreate buffer with new size
      state.buffer = createBuffer(width, height)
      // Invalidate renderer to force full redraw
      state.renderer.invalidate()
      state.dirty = true
    },

    beforeRender(): void {
      if (!state || !app) return

      // Clear current buffer using the buffer's clear method
      state.buffer.clear()
    },

    render(root: Node): void {
      if (!state || !app) return

      const startTime = performance.now()

      // Render the root node into buffer with error boundary
      if (root instanceof BaseNode) {
        // Set root bounds to full screen
        root._bounds = {
          x: 0,
          y: 0,
          width: app.width,
          height: app.height
        }

        // Default style
        const defaultStyle: CellStyle = {
          fg: DEFAULT_FG,
          bg: DEFAULT_BG,
          attrs: 0
        }

        // Error boundary: catch render errors to prevent app crash
        // This allows partial rendering if only some widgets fail
        try {
          root.render(state.buffer, defaultStyle)
        } catch (error) {
          // Log error but continue - better to show partial UI than crash
          console.error('[renderer] Error during render:', error)

          // Try to show error message in buffer if possible
          try {
            const errorMsg = error instanceof Error ? error.message : 'Render error'
            const truncatedMsg = errorMsg.slice(0, Math.min(app.width - 4, 60))
            state.buffer.write(2, 0, `[!] ${truncatedMsg}`, {
              fg: DEFAULT_FG,
              bg: DEFAULT_BG,
              attrs: 0
            })
          } catch {
            // Ignore error display errors
          }
        }
      }

      // Force redraw if configured
      if (forceFullRedraw) {
        state.renderer.invalidate()
      }

      // Differential render to terminal - also wrapped in try/catch
      try {
        state.renderer.render(state.buffer)
      } catch (error) {
        console.error('[renderer] Error writing to terminal:', error)
      }

      // Update stats
      state.renderCount++
      lastRenderTime = performance.now() - startTime
      state.dirty = false

      if (debug) {
        // Log stats to stderr to not interfere with terminal
        console.error(`[renderer] frame=${state.renderCount} time=${lastRenderTime.toFixed(2)}ms`)
      }
    },

    destroy(): void {
      state = null
      app = null
    }
  }
}
