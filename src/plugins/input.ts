/**
 * @oxog/tui - Input Plugin
 * @packageDocumentation
 *
 * Plugin that provides keyboard input handling capabilities.
 * This plugin captures keyboard events and routes them to focused nodes.
 */

import type { Plugin, TUIApp, KeyEvent, Node } from '../types'
import { createKeyParser, matchKey } from '../utils/keys'

// ============================================================
// Types
// ============================================================

/**
 * Key binding definition.
 */
export interface KeyBinding {
  /** Key pattern to match */
  key: string
  /** Handler function */
  handler: (event: KeyEvent) => void | boolean
  /** Description for help */
  description?: string
}

/**
 * Input plugin options.
 */
export interface InputPluginOptions {
  /** Custom key bindings */
  bindings?: KeyBinding[]
  /** Enable raw mode (required for most key handling) */
  rawMode?: boolean
  /** Debug mode */
  debug?: boolean
}

/**
 * Input plugin API exposed to the app.
 */
export interface InputPluginAPI {
  /** Register a key binding */
  bind(key: string, handler: (event: KeyEvent) => void | boolean, description?: string): void
  /** Unregister a key binding */
  unbind(key: string): void
  /** Get all bindings */
  getBindings(): KeyBinding[]
  /** Simulate a key press */
  simulate(event: KeyEvent): void
  /** Enable/disable input handling */
  setEnabled(enabled: boolean): void
  /** Check if input is enabled */
  isEnabled(): boolean
}

// ============================================================
// Implementation
// ============================================================

/**
 * Create the input plugin.
 *
 * @param options - Plugin options
 * @returns Input plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { inputPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [inputPlugin({
 *     bindings: [
 *       { key: 'q', handler: () => app.quit() },
 *       { key: 'ctrl+c', handler: () => app.quit() }
 *     ]
 *   })]
 * })
 *
 * // Add bindings at runtime
 * app.input.bind('r', () => app.refresh(), 'Refresh screen')
 * ```
 */
export function inputPlugin(options: InputPluginOptions = {}): Plugin {
  const { bindings: initialBindings = [], rawMode = true, debug = false } = options

  let app: TUIApp | null = null
  let enabled = true
  let stdinListener: ((data: Buffer) => void) | null = null
  const bindings: KeyBinding[] = [...initialBindings]
  const keyParser = createKeyParser()

  /**
   * Handle incoming key data.
   */
  function handleKeyData(data: Buffer): void {
    if (!enabled || !app) return

    const events = keyParser.parse(data)

    for (const event of events) {
      // Validate event structure
      if (!event || typeof event.name !== 'string' || event.name.length === 0) {
        continue
      }

      if (debug) {
        console.error(
          `[input] key: ${event.name} ctrl=${event.ctrl} alt=${event.alt} shift=${event.shift}`
        )
      }

      // Check global bindings first
      let handled = false
      for (const binding of bindings) {
        if (matchKey(event, binding.key)) {
          try {
            const result = binding.handler(event)
            if (result === true) {
              handled = true
              break
            }
            // If result is false or undefined, continue trying other bindings
          } catch (err) {
            // Log error but don't crash
            console.error('[input] Handler error:', err)
          }
        }
      }

      // If not handled by global bindings, emit to focused node
      if (!handled) {
        emitKeyEvent(event)
      }
    }
  }

  /**
   * Validate a KeyEvent structure.
   */
  function isValidKeyEvent(event: KeyEvent): boolean {
    return !!event && typeof event.name === 'string' && event.name.length > 0
  }

  /**
   * Emit key event to the app and focused node.
   */
  function emitKeyEvent(event: KeyEvent): void {
    /* c8 ignore next */
    if (!app) return

    // Validate event before emitting
    if (!isValidKeyEvent(event)) {
      return
    }

    // Emit on app
    if (typeof (app as { emit?: (name: string, event: KeyEvent) => void }).emit === 'function') {
      try {
        ;(app as { emit: (name: string, event: KeyEvent) => void }).emit('key', event)
      } catch (err) {
        console.error('[input] App emit error:', err)
      }
    }

    // Route to focused node if available
    const focusedNode = (app as { focusedNode?: Node }).focusedNode
    if (focusedNode) {
      // Check if node has handleKey method
      const nodeWithHandler = focusedNode as { handleKey?: (event: KeyEvent) => void; _disposed?: boolean }
      if (typeof nodeWithHandler.handleKey === 'function') {
        // Check if node is disposed
        if (nodeWithHandler._disposed) {
          return
        }
        try {
          nodeWithHandler.handleKey(event)
        } catch (err) {
          console.error('[input] Node handler error:', err)
        }
      }
    }
  }

  return {
    name: 'input',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { input: InputPluginAPI }).input = {
        bind: (key: string, handler: (event: KeyEvent) => void | boolean, description?: string) => {
          // Remove existing binding for same key
          const existingIndex = bindings.findIndex(b => b.key === key)
          if (existingIndex !== -1) {
            bindings.splice(existingIndex, 1)
          }
          const binding: KeyBinding = { key, handler }
          if (description !== undefined) {
            binding.description = description
          }
          bindings.push(binding)
        },

        unbind: (key: string) => {
          const index = bindings.findIndex(b => b.key === key)
          if (index !== -1) {
            bindings.splice(index, 1)
          }
        },

        getBindings: () => [...bindings],

        simulate: (event: KeyEvent) => {
          if (!enabled) return

          // Validate event structure
          if (!isValidKeyEvent(event)) {
            return
          }

          // Check bindings
          for (const binding of bindings) {
            if (matchKey(event, binding.key)) {
              try {
                const result = binding.handler(event)
                if (result === true) {
                  return
                }
              } catch (err) {
                console.error('[input] Simulate handler error:', err)
              }
            }
          }

          // Emit to focused node
          emitKeyEvent(event)
        },

        setEnabled: (value: boolean) => {
          enabled = value
        },

        isEnabled: () => enabled
      }

      // Set up stdin listening
      if (process.stdin.isTTY && rawMode) {
        try {
          process.stdin.setRawMode(true)
        } catch (err) {
          console.error('[input] Failed to set raw mode:', err)
          return
        }
        process.stdin.resume()
        process.stdin.setEncoding('utf8')

        stdinListener = handleKeyData
        process.stdin.on('data', stdinListener)

        if (debug) {
          console.error('[input] raw mode enabled, listening for input')
        }
      }
    },

    destroy(): void {
      // Clean up stdin listener
      if (stdinListener) {
        process.stdin.removeListener('data', stdinListener)
        stdinListener = null

        if (process.stdin.isTTY) {
          try {
            process.stdin.setRawMode(false)
          } catch (err) {
            console.error('[input] Failed to disable raw mode:', err)
          }
        }
      }

      app = null
    }
  }
}

/**
 * Common key binding presets.
 */
export const keyBindingPresets = {
  /**
   * Vim-like navigation bindings.
   */
  vim: [
    { key: 'h', handler: () => {}, description: 'Move left' },
    { key: 'j', handler: () => {}, description: 'Move down' },
    { key: 'k', handler: () => {}, description: 'Move up' },
    { key: 'l', handler: () => {}, description: 'Move right' },
    { key: 'g', handler: () => {}, description: 'Go to top' },
    { key: 'G', handler: () => {}, description: 'Go to bottom' }
  ] as KeyBinding[],

  /**
   * Emacs-like bindings.
   */
  emacs: [
    { key: 'ctrl+f', handler: () => {}, description: 'Move forward' },
    { key: 'ctrl+b', handler: () => {}, description: 'Move backward' },
    { key: 'ctrl+n', handler: () => {}, description: 'Move down' },
    { key: 'ctrl+p', handler: () => {}, description: 'Move up' },
    { key: 'ctrl+a', handler: () => {}, description: 'Move to start' },
    { key: 'ctrl+e', handler: () => {}, description: 'Move to end' }
  ] as KeyBinding[],

  /**
   * Common application bindings.
   */
  common: [
    { key: 'q', handler: () => {}, description: 'Quit' },
    { key: 'ctrl+c', handler: () => {}, description: 'Force quit' },
    { key: 'ctrl+l', handler: () => {}, description: 'Refresh' },
    { key: '?', handler: () => {}, description: 'Show help' }
  ] as KeyBinding[]
}
