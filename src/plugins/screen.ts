/**
 * @oxog/tui - Screen Plugin
 * @packageDocumentation
 *
 * Plugin that provides enhanced screen management capabilities.
 * This plugin handles alternate screen buffer, cursor visibility, and more.
 */

import type { Plugin, TUIApp } from '../types'
import {
  enterAltScreen,
  exitAltScreen,
  hideCursor,
  showCursor,
  clearScreen,
  setTitle as setTerminalTitle,
  bell as terminalBell,
  enableBracketedPaste,
  disableBracketedPaste
} from '../utils/ansi'

// ============================================================
// Types
// ============================================================

/**
 * Screen plugin options.
 */
export interface ScreenPluginOptions {
  /** Use alternate screen buffer (default: true) */
  altScreen?: boolean
  /** Hide cursor (default: true) */
  hideCursor?: boolean
  /** Clear screen on start (default: true) */
  clearOnStart?: boolean
  /** Restore screen on exit (default: true) */
  restoreOnExit?: boolean
  /** Enable bracketed paste mode (default: true) */
  bracketedPaste?: boolean
  /** Initial title */
  title?: string
  /** Debug mode */
  debug?: boolean
}

/**
 * Screen plugin API exposed to the app.
 */
export interface ScreenPluginAPI {
  /** Set terminal title */
  setTitle(title: string): void
  /** Show cursor */
  showCursor(): void
  /** Hide cursor */
  hideCursor(): void
  /** Check if cursor is visible */
  isCursorVisible(): boolean
  /** Clear screen */
  clear(): void
  /** Play bell sound */
  bell(): void
  /** Get terminal size */
  getSize(): { width: number; height: number }
  /** Check if using alternate screen */
  isAltScreen(): boolean
  /** Enter alternate screen */
  enterAltScreen(): void
  /** Exit alternate screen */
  exitAltScreen(): void
}

// ============================================================
// Implementation
// ============================================================

/**
 * Create the screen plugin.
 *
 * @param options - Plugin options
 * @returns Screen plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { screenPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [screenPlugin({
 *     altScreen: true,
 *     title: 'My TUI App'
 *   })]
 * })
 *
 * // Change title at runtime
 * app.screen.setTitle('New Title')
 *
 * // Flash to alert user
 * app.screen.bell()
 * ```
 */
export function screenPlugin(options: ScreenPluginOptions = {}): Plugin {
  const {
    altScreen = true,
    hideCursor: shouldHideCursor = true,
    clearOnStart = true,
    restoreOnExit = true,
    bracketedPaste = true,
    title,
    debug = false
  } = options

  let cursorVisible = true
  let inAltScreen = false
  let currentTitle = title ?? ''

  /**
   * Get current terminal size.
   */
  function getTerminalSize(): { width: number; height: number } {
    const cols = process.stdout.columns
    const rows = process.stdout.rows

    // Validate and clamp values
    const width = Number.isFinite(cols) && cols > 0 ? Math.min(cols, 10000) : 80
    const height = Number.isFinite(rows) && rows > 0 ? Math.min(rows, 10000) : 24

    return { width, height }
  }

  return {
    name: 'screen',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      // Store resize listener for cleanup
      let resizeListener: (() => void) | null = null

      // Safe stdout write helper
      const safeWrite = (data: string): void => {
        try {
          process.stdout.write(data)
        } catch (err) {
          if (debug) {
            console.error('[screen] stdout write error:', err)
          }
        }
      }

      // Enter alternate screen
      if (altScreen) {
        safeWrite(enterAltScreen())
        inAltScreen = true
      }

      // Hide cursor
      if (shouldHideCursor) {
        safeWrite(hideCursor())
        cursorVisible = false
      }

      // Clear screen
      if (clearOnStart) {
        safeWrite(clearScreen())
      }

      // Enable bracketed paste
      if (bracketedPaste) {
        safeWrite(enableBracketedPaste())
      }

      // Set title
      if (title) {
        safeWrite(setTerminalTitle(title))
      }

      // Expose API on app
      ;(tuiApp as TUIApp & { screen: ScreenPluginAPI }).screen = {
        setTitle: (newTitle: string) => {
          if (!newTitle) return
          currentTitle = newTitle
          safeWrite(setTerminalTitle(newTitle))
        },

        showCursor: () => {
          if (!cursorVisible) {
            safeWrite(showCursor())
            cursorVisible = true
          }
        },

        hideCursor: () => {
          if (cursorVisible) {
            safeWrite(hideCursor())
            cursorVisible = false
          }
        },

        isCursorVisible: () => cursorVisible,

        clear: () => {
          safeWrite(clearScreen())
        },

        bell: () => {
          safeWrite(terminalBell())
        },

        getSize: () => getTerminalSize(),

        isAltScreen: () => inAltScreen,

        enterAltScreen: () => {
          if (!inAltScreen) {
            safeWrite(enterAltScreen())
            inAltScreen = true
          }
        },

        exitAltScreen: () => {
          if (inAltScreen) {
            safeWrite(exitAltScreen())
            inAltScreen = false
          }
        }
      }

      // Handle resize events
      resizeListener = () => {
        const { width, height } = getTerminalSize()
        if (debug) {
          console.error(`[screen] resize: ${width}x${height}`)
        }
      }
      process.stdout.on('resize', resizeListener)

      if (debug) {
        const size = getTerminalSize()
        console.error(`[screen] plugin installed (${size.width}x${size.height})`)
      }

      // Store listener for cleanup in destroy
      ;(tuiApp as any)._screenResizeListener = resizeListener
    },

    onResize(width: number, height: number): void {
      if (debug) {
        console.error(`[screen] resize event: ${width}x${height}`)
      }
    },

    destroy(): void {
      // Clean up resize listener
      const resizeListener = (this as any)._screenResizeListener
      if (resizeListener) {
        process.stdout.removeListener('resize', resizeListener)
        ;(this as any)._screenResizeListener = null
      }

      if (restoreOnExit) {
        // Safe stdout write helper
        const safeWrite = (data: string): void => {
          try {
            process.stdout.write(data)
          } catch (err) {
            if (debug) {
              console.error('[screen] stdout write error during destroy:', err)
            }
          }
        }

        // Disable bracketed paste
        if (bracketedPaste) {
          safeWrite(disableBracketedPaste())
        }

        // Show cursor
        if (!cursorVisible) {
          safeWrite(showCursor())
          cursorVisible = true
        }

        // Exit alternate screen
        if (inAltScreen) {
          safeWrite(exitAltScreen())
          inAltScreen = false
        }

        // Clear any custom title
        if (currentTitle) {
          safeWrite(setTerminalTitle(''))
        }
      }

      if (debug) {
        console.error('[screen] plugin destroyed')
      }
    }
  }
}

/**
 * Screen size change handler.
 */
export function onResize(callback: (width: number, height: number) => void): () => void {
  const handler = () => {
    const cols = process.stdout.columns
    const rows = process.stdout.rows

    // Validate and clamp values
    const width = Number.isFinite(cols) && cols > 0 ? Math.min(cols, 10000) : 80
    const height = Number.isFinite(rows) && rows > 0 ? Math.min(rows, 10000) : 24

    callback(width, height)
  }

  process.stdout.on('resize', handler)

  return () => {
    process.stdout.removeListener('resize', handler)
  }
}

/**
 * Detect terminal capabilities.
 */
export function detectCapabilities(): {
  color: boolean
  trueColor: boolean
  unicode: boolean
  mouse: boolean
  altScreen: boolean
} {
  const env = process.env
  const term = env.TERM ?? ''
  const colorTerm = env.COLORTERM ?? ''

  return {
    // Basic color support
    color: term !== 'dumb' && process.stdout.isTTY === true,

    // True color (24-bit) support
    trueColor:
      colorTerm === 'truecolor' ||
      colorTerm === '24bit' ||
      term.includes('256color') ||
      term.includes('24bit'),

    // Unicode support (most modern terminals)
    unicode: !term.includes('linux') && !term.includes('console'),

    // Mouse support (most xterm-compatible terminals)
    mouse:
      term.includes('xterm') ||
      term.includes('rxvt') ||
      term.includes('screen') ||
      term.includes('tmux'),

    // Alternate screen buffer support
    altScreen: term !== 'dumb' && term !== 'linux'
  }
}
