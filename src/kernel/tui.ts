/**
 * @oxog/tui - TUI Application Factory
 * @packageDocumentation
 *
 * The main entry point for creating TUI applications.
 * This module provides the `tui()` factory function that creates and manages
 * the application lifecycle.
 */

import type { TUIApp, TUIOptions, TUIEvents, Plugin, Node, Theme, Buffer } from '../types'
import { TUIError } from '../errors'
import { DEFAULT_THEME } from '../constants'
import { BaseNode } from '../widgets/node'
import { getTerminalSize, setupSignalHandlers } from '../core/screen'
import { createBuffer } from '../core/buffer'
import { standardPlugins } from '../plugins'

// ============================================================
// Types
// ============================================================

/**
 * Internal application state.
 */
interface AppState {
  /** Application running state */
  running: boolean
  /** Installed plugins */
  plugins: Plugin[]
  /** Root node */
  root: Node | null
  /** Focused node */
  focusedNode: Node | null
  /** Current theme */
  theme: Theme
  /** Terminal width */
  width: number
  /** Terminal height */
  height: number
  /** Render buffer */
  buffer: Buffer | null
  /** Dirty flag for re-render */
  dirty: boolean
  /** Event listeners */
  listeners: Map<string, Set<(...args: unknown[]) => void>>
  /** Render scheduled flag */
  renderScheduled: boolean
  /** Quit handlers */
  quitHandlers: Set<() => void | Promise<void>>
  /** Critical error state for rendering to screen */
  criticalError: Error | null
  /** Error timestamp for display */
  errorTime: number | null
  /** Disposal in progress flag - prevents use-after-free */
  disposalInProgress: boolean
  /** Pending disposal handler - queued until after render */
  pendingDisposal: (() => void) | null
}

// ============================================================
// Implementation
// ============================================================

/**
 * Resolve plugin load order based on dependencies and constraints.
 * Uses topological sorting with cycle detection.
 *
 * "before" constraints are problematic: if plugin A wants to load before B,
 * but B is already loaded, this creates a deadlock. The solution is to track
 * attempted loads and detect unsatisfiable "before" constraints early.
 *
 * @param plugins - Plugins to resolve
 * @returns Ordered array of plugins
 * @throws Error if circular dependencies detected or missing dependencies
 */
function resolvePluginOrder(plugins: Plugin[]): Plugin[] {
  const resolved: Plugin[] = []
  const remaining = new Map(plugins.map(p => [p.name, p]))
  const loaded = new Set<string>()

  // Track attempted loads to detect deadlock conditions
  const attempted = new Set<string>()

  // Track passes to detect cycles
  let passes = 0
  const maxPasses = plugins.length * 2 // Double to handle two-phase loading

  // First pass: load plugins without "before" constraints or where before is satisfiable
  // Second pass: handle plugins with unsatisfiable "before" constraints (warn and load anyway)
  let phase = 1

  while (remaining.size > 0 && passes < maxPasses) {
    passes++
    let loadedThisPass = false

    for (const [name, plugin] of remaining) {
      // Skip if we already tried to load this plugin in this phase
      if (phase === 1 && attempted.has(name)) continue

      // Check if all dependencies are loaded
      const deps = plugin.dependencies ?? []
      const after = plugin.after ?? []
      const before = plugin.before ?? []

      // Required dependencies must be loaded
      const depsLoaded = deps.every(d => loaded.has(d))

      // Optional dependencies don't block loading, but we prefer to load them after
      // after constraints: these plugins should be loaded before us
      const afterSatisfied = after.every(a => loaded.has(a))

      // before constraints: we should load before these plugins
      // In phase 1: only load if no "before" targets are loaded yet
      // In phase 2: ignore "before" constraints (they're now unsatisfiable)
      let beforeSatisfied = true
      if (phase === 1 && before.length > 0) {
        beforeSatisfied = before.every(b => !loaded.has(b))
      }

      if (depsLoaded && afterSatisfied && beforeSatisfied) {
        resolved.push(plugin)
        loaded.add(name)
        remaining.delete(name)
        loadedThisPass = true
        attempted.delete(name)
      } else {
        // Mark as attempted for this phase
        attempted.add(name)
      }
    }

    if (!loadedThisPass) {
      if (phase === 1) {
        // Move to phase 2: ignore unsatisfiable "before" constraints
        phase = 2
        attempted.clear()
        // Check if we have "before" constraints that are now unsatisfiable
        for (const [name, plugin] of remaining) {
          const before = plugin.before ?? []
          const hasUnsatisfiableBefore = before.some(b => loaded.has(b))
          if (hasUnsatisfiableBefore && !attempted.has(name)) {
            console.warn(
              `[tui] Plugin "${name}" has unsatisfiable "before" constraint(s). ` +
              `Target plugins (${before.filter(b => loaded.has(b)).join(', ')}) are already loaded. ` +
              `Loading "${name}" anyway.`
            )
          }
        }
      } else {
        // Phase 2 also failed - genuine circular dependency or missing dependency
        const remainingNames = Array.from(remaining.keys()).join(', ')

        // Try to provide helpful error message
        for (const [name, plugin] of remaining) {
          const deps = plugin.dependencies ?? []
          const after = plugin.after ?? []
          const allConstraints = [...deps, ...after]

          for (const constraint of allConstraints) {
            if (!loaded.has(constraint) && !remaining.has(constraint)) {
              throw new TUIError(
                `Plugin "${name}" depends on "${constraint}" which is not available. ` +
                `Available plugins: ${plugins.map(p => p.name).join(', ')}. `,
                'PLUGIN_ERROR'
              )
            }
          }
        }

        throw new TUIError(
          `Could not resolve plugin dependencies - possible circular dependency. ` +
          `Remaining plugins: ${remainingNames}.`,
          'PLUGIN_ERROR'
        )
      }
    }
  }

  return resolved
}

/**
 * Create a TUI application.
 *
 * This is the main entry point for creating terminal user interfaces.
 * The function returns an application instance that manages the UI lifecycle,
 * plugins, and rendering.
 *
 * @param options - Application options
 * @returns TUI application instance
 *
 * @example
 * ```typescript
 * import { tui, box, text } from '@oxog/tui'
 * import { standardPlugins } from '@oxog/tui/plugins'
 *
 * // Create application
 * const app = tui({
 *   plugins: standardPlugins(),
 *   title: 'My App'
 * })
 *
 * // Build UI
 * const root = box()
 *   .add(text('Hello, World!'))
 *
 * // Start application
 * app.mount(root)
 * app.start()
 * ```
 *
 * @example
 * ```typescript
 * // With custom theme
 * import { tui } from '@oxog/tui'
 * import { standardPlugins, darkTheme } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: standardPlugins(),
 *   theme: darkTheme
 * })
 * ```
 */
export function tui(options: TUIOptions = {}): TUIApp {
  const { plugins = [], theme = DEFAULT_THEME, fps = 60 } = options

  // Initialize state
  const state: AppState = {
    running: false,
    plugins: [],
    root: null,
    focusedNode: null,
    theme: { ...DEFAULT_THEME, ...theme },
    width: 80,
    height: 24,
    buffer: null,
    dirty: true,
    listeners: new Map(),
    renderScheduled: false,
    quitHandlers: new Set(),
    criticalError: null,
    errorTime: null,
    disposalInProgress: false,
    pendingDisposal: null
  }

  // Get initial terminal size
  try {
    const size = getTerminalSize(process.stdout)
    state.width = size.width
    state.height = size.height
  } catch {
    // Use defaults if terminal size unavailable
  }

  // Initialize buffer
  state.buffer = createBuffer(state.width, state.height)

  // Render frame interval
  const frameInterval = Math.floor(1000 / fps)
  let renderTimer: ReturnType<typeof setInterval> | null = null
  let cleanupSignalHandlers: (() => void) | null = null
  let isRendering = false // Prevents race conditions during resize
  let resizeGeneration = 0 // Tracks resize events to detect stale renders

  /**
   * Emit an event to listeners.
   */
  function emit(event: string, ...args: unknown[]): void {
    const handlers = state.listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in ${event} handler:`, error)
        }
      }
    }
  }

  /**
   * Schedule a render on next frame.
   */
  function scheduleRender(): void {
    if (!state.renderScheduled && state.running) {
      state.renderScheduled = true
      state.dirty = true
    }
  }

  /**
   * Perform a render cycle with error boundary protection.
   */
  function render(): void {
    if (!state.running || !state.root || !state.dirty) return

    // Use compare-and-swap pattern for isRendering
    // If another render is in progress, just mark dirty and return
    if (isRendering) {
      state.dirty = true
      return
    }

    isRendering = true
    // Set disposal lock to prevent disposal during render
    state.disposalInProgress = true

    // Capture current generation to detect if resize happened during render
    const currentGeneration = resizeGeneration

    try {
      state.renderScheduled = false
      state.dirty = false

      // CRITICAL: Check resize BEFORE capturing buffer reference
      // This prevents use-after-free when resize happens between capture and check
      if (resizeGeneration !== currentGeneration) {
        // Resize happened before we could start rendering
        state.dirty = true
        return
      }

      // Now capture buffer reference AFTER resize check
      // If resize happens after this point, the generation check below will catch it
      const renderBuffer = state.buffer

      // Validate buffer exists
      if (!renderBuffer) return

      // Additional safety: validate buffer dimensions match current state
      // This catches edge cases where buffer was replaced but generation wasn't incremented
      if (renderBuffer.width !== state.width || renderBuffer.height !== state.height) {
        state.dirty = true
        return
      }

      // Call plugin beforeRender hooks with error boundary
      for (const plugin of state.plugins) {
        if (plugin.beforeRender) {
          try {
            plugin.beforeRender()
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            state.criticalError = error
            state.errorTime = Date.now()
            console.error(`[tui] Error in ${plugin.name} beforeRender:`, err)
          }
        }
      }

      // Check resize again after beforeRender hooks
      if (resizeGeneration !== currentGeneration || state.buffer !== renderBuffer) {
        state.dirty = true
        return
      }

      // Call plugin render hooks with error boundary
      let renderError: Error | null = null
      for (const plugin of state.plugins) {
        if (plugin.render) {
          try {
            plugin.render(state.root)
          } catch (err) {
            renderError = err instanceof Error ? err : new Error(String(err))
            state.criticalError = renderError
            state.errorTime = Date.now()
            console.error(`[tui] Error in ${plugin.name} render:`, err)
          }
        }
      }

      // Display critical error on buffer (persisted until cleared)
      if (state.criticalError && renderBuffer) {
        try {
          const errorTitle = '╔ CRITICAL ERROR ═════════════════════════════════════════╗'
          const errorLine = '║' + ' '.repeat(63) + '║'
          const errorFooter = '╚═══════════════════════════════════════════════════════════════╝'
          const errorMsg = `║ ${state.criticalError.message}`
          const truncatedMsg = errorMsg.slice(0, 63) + ' '.repeat(Math.max(0, 63 - errorMsg.length)) + '║'
          const errorTime = state.errorTime ? new Date(state.errorTime).toLocaleTimeString() : ''

          // Red error banner at top of screen
          renderBuffer.write(0, 0, errorTitle, { fg: 0xff0000ff, bg: 0x000000ff, attrs: 0 })
          renderBuffer.write(0, 1, errorLine, { fg: 0xff0000ff, bg: 0x000000ff, attrs: 0 })
          renderBuffer.write(0, 2, truncatedMsg, { fg: 0xff0000ff, bg: 0x000000ff, attrs: 0 })
          renderBuffer.write(0, 3, errorLine, { fg: 0xff0000ff, bg: 0x000000ff, attrs: 0 })
          renderBuffer.write(0, 4, errorFooter, { fg: 0xff0000ff, bg: 0x000000ff, attrs: 0 })

          // Timestamp in yellow
          const timeLine = `Time: ${errorTime} | Press Ctrl+C to quit`
          renderBuffer.write(0, 5, timeLine.padEnd(64), { fg: 0xffff00ff, bg: 0x000000ff, attrs: 0 })
        } catch {
          // If even writing error fails, just log to console
          console.error('[tui] Failed to display critical error:', state.criticalError)
        }
      }

      // Final check for resize during render
      if (resizeGeneration !== currentGeneration) {
        state.dirty = true
        return
      }

      // Call plugin afterRender hooks with error boundary
      for (const plugin of state.plugins) {
        if (plugin.afterRender) {
          try {
            plugin.afterRender()
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            state.criticalError = error
            state.errorTime = Date.now()
            console.error(`[tui] Error in ${plugin.name} afterRender:`, err)
          }
        }
      }

      emit('render')
    } finally {
      isRendering = false
      // Clear disposal in progress flag
      state.disposalInProgress = false

      // Execute pending disposal if any
      if (state.pendingDisposal) {
        const pending = state.pendingDisposal
        state.pendingDisposal = null
        try {
          pending()
        } catch (error) {
          console.error('[tui] Error executing pending disposal:', error)
        }
      }

      // If resize happened during render, schedule another render
      if (resizeGeneration !== currentGeneration) {
        state.dirty = true
      }
    }
  }

  /**
   * Handle terminal resize.
   */
  function handleResize(): void {
    const size = getTerminalSize(process.stdout)
    if (size.width !== state.width || size.height !== state.height) {
      // Increment generation to invalidate any in-progress renders
      resizeGeneration++

      state.width = size.width
      state.height = size.height
      state.buffer = createBuffer(state.width, state.height)
      state.dirty = true

      // Notify plugins
      for (const plugin of state.plugins) {
        if (plugin.onResize) {
          plugin.onResize(state.width, state.height)
        }
      }

      emit('resize', state.width, state.height)
      scheduleRender()
    }
  }

  /**
   * Safely execute a disposal operation.
   * If render is in progress, the disposal is queued until after render completes.
   *
   * @param disposalFn - Function that performs the disposal
   */
  function safeDispose(disposalFn: () => void): void {
    if (state.disposalInProgress) {
      // Queue disposal for after render completes
      state.pendingDisposal = disposalFn
    } else {
      // Execute immediately
      disposalFn()
    }
  }

  // Create the application object
  const app: TUIApp = {
    // Getters
    get width() {
      return state.width
    },

    get height() {
      return state.height
    },

    get root() {
      return state.root
    },

    get focused() {
      return state.focusedNode
    },

    get theme() {
      return state.theme
    },

    get isRunning() {
      return state.running
    },

    // Methods
    mount(node: Node): TUIApp {
      state.root = node
      state.dirty = true

      // Set node as mounted
      if (node instanceof BaseNode) {
        // Could add mounted flag or lifecycle hooks here
      }

      emit('mount', node)
      return app
    },

    unmount(): TUIApp {
      if (state.root) {
        emit('unmount', state.root)
        state.root = null
        state.dirty = true
      }
      return app
    },

    start(): TUIApp {
      if (state.running) return app

      state.running = true

      // Resolve plugin load order based on dependencies
      const resolvedPlugins = resolvePluginOrder(plugins)

      // Install plugins in resolved order
      for (const plugin of resolvedPlugins) {
        try {
          plugin.install(app)
          state.plugins.push(plugin)
          /* c8 ignore start */
        } catch (error) {
          throw new TUIError(
            `Failed to install plugin "${plugin.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            'PLUGIN_ERROR'
          )
        }
        /* c8 ignore stop */
      }

      // Set up signal handlers for clean exit
      cleanupSignalHandlers = setupSignalHandlers(() => {
        void app.quit()
      })

      // Set up resize handler
      process.stdout.on('resize', handleResize)

      // Start render loop
      renderTimer = setInterval(() => {
        if (state.dirty) {
          render()
        }
      }, frameInterval)

      // Initial render
      scheduleRender()

      emit('start')
      return app
    },

    async quit(): Promise<void> {
      if (!state.running) {
        return
      }

      state.running = false

      // Call quit handlers
      for (const handler of state.quitHandlers) {
        try {
          await handler()
        } catch (error) {
          console.error('Error in quit handler:', error)
        }
      }

      // Stop render loop
      if (renderTimer) {
        clearInterval(renderTimer)
        renderTimer = null
      }

      // Remove resize handler
      process.stdout.removeListener('resize', handleResize)

      // Clean up signal handlers
      if (cleanupSignalHandlers) {
        cleanupSignalHandlers()
        cleanupSignalHandlers = null
      }

      // Destroy plugins in reverse order
      for (const plugin of [...state.plugins].reverse()) {
        try {
          if (plugin.destroy) {
            plugin.destroy()
          }
        } catch (error) {
          console.error(`Error destroying plugin "${plugin.name}":`, error)
        }
      }
      state.plugins = []

      emit('quit')

      // Clear error state
      state.criticalError = null
      state.errorTime = null

      // Clear all event listeners to prevent memory leaks
      state.listeners.clear()
      state.quitHandlers.clear()
    },

    refresh(): TUIApp {
      state.dirty = true
      scheduleRender()
      return app
    },

    markDirty(): void {
      scheduleRender()
    },

    /**
     * Clear the critical error state.
     * Call this after handling or recovering from an error.
     */
    clearError(): TUIApp {
      state.criticalError = null
      state.errorTime = null
      state.dirty = true
      scheduleRender()
      return app
    },

    /**
     * Get the current critical error if any.
     */
    getError(): Error | null {
      return state.criticalError
    },

    /**
     * Safely dispose the root node.
     * If render is in progress, disposal is queued until after render completes.
     *
     * @returns This app for method chaining
     */
    disposeRoot(): TUIApp {
      safeDispose(() => {
        if (state.root && state.root instanceof BaseNode) {
          try {
            state.root.dispose()
          } catch (error) {
            console.error('[tui] Error disposing root node:', error)
            state.criticalError = error instanceof Error ? error : new Error(String(error))
            state.errorTime = Date.now()
          }
          state.root = null
          state.focusedNode = null
          state.dirty = true
        }
      })
      return app
    },

    // Events
    on<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): () => void {
      if (!state.listeners.has(event)) {
        state.listeners.set(event, new Set())
      }
      state.listeners.get(event)!.add(handler as (...args: unknown[]) => void)
      return () => {
        const handlers = state.listeners.get(event)
        if (handlers) {
          handlers.delete(handler as (...args: unknown[]) => void)
        }
      }
    },

    off<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): void {
      const handlers = state.listeners.get(event)
      if (handlers) {
        handlers.delete(handler as (...args: unknown[]) => void)
      }
    },

    emit<K extends keyof TUIEvents>(event: K, ...args: Parameters<TUIEvents[K]>): void {
      emit(event, ...args)
    },

    onQuit(handler: () => void | Promise<void>): TUIApp {
      state.quitHandlers.add(handler)
      return app
    },

    // Plugin API
    use(plugin: Plugin): TUIApp {
      if (state.running) {
        // Hot-load plugin
        try {
          plugin.install(app)
          state.plugins.push(plugin)
          /* c8 ignore start */
        } catch (error) {
          throw new TUIError(
            `Failed to install plugin "${plugin.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            'PLUGIN_ERROR'
          )
        }
        /* c8 ignore stop */
      } else {
        // Queue for installation on start
        plugins.push(plugin)
      }
      return app
    },

    getPlugin<T extends Plugin>(name: string): T | undefined {
      return state.plugins.find(p => p.name === name) as T | undefined
    }
  }

  return app
}

/**
 * Create a TUI application with standard plugins pre-configured.
 * This is a convenience function for common use cases.
 *
 * @param options - Application options (plugins will be merged)
 * @returns TUI application instance
 *
 * @example
 * ```typescript
 * import { createApp, box, text } from '@oxog/tui'
 *
 * const app = createApp({ title: 'My App' })
 * app.mount(box().add(text('Hello!')))
 * app.start()
 * ```
 */
export function createApp(options: Omit<TUIOptions, 'plugins'> = {}): TUIApp {
  return tui({
    ...options,
    plugins: standardPlugins()
  })
}
