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
}

// ============================================================
// Implementation
// ============================================================

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
    quitHandlers: new Set()
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
   * Perform a render cycle.
   */
  function render(): void {
    if (!state.running || !state.root || !state.dirty) return

    state.renderScheduled = false
    state.dirty = false

    // Call plugin beforeRender hooks
    for (const plugin of state.plugins) {
      if (plugin.beforeRender) {
        plugin.beforeRender()
      }
    }

    // Call plugin render hooks
    for (const plugin of state.plugins) {
      if (plugin.render) {
        plugin.render(state.root)
      }
    }

    // Call plugin afterRender hooks
    for (const plugin of state.plugins) {
      if (plugin.afterRender) {
        plugin.afterRender()
      }
    }

    emit('render')
  }

  /**
   * Handle terminal resize.
   */
  function handleResize(): void {
    const size = getTerminalSize(process.stdout)
    if (size.width !== state.width || size.height !== state.height) {
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

      // Install plugins
      for (const plugin of plugins) {
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

    quit(): Promise<void> {
      return new Promise<void>(async resolve => {
        if (!state.running) {
          resolve()
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
        resolve()
      })
    },

    refresh(): TUIApp {
      state.dirty = true
      scheduleRender()
      return app
    },

    markDirty(): void {
      scheduleRender()
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
