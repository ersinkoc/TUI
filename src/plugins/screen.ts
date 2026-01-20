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
    return {
      width: process.stdout.columns ?? 80,
      height: process.stdout.rows ?? 24
    }
  }

  return {
    name: 'screen',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      // Enter alternate screen
      if (altScreen) {
        process.stdout.write(enterAltScreen())
        inAltScreen = true
      }

      // Hide cursor
      if (shouldHideCursor) {
        process.stdout.write(hideCursor())
        cursorVisible = false
      }

      // Clear screen
      if (clearOnStart) {
        process.stdout.write(clearScreen())
      }

      // Enable bracketed paste
      if (bracketedPaste) {
        process.stdout.write(enableBracketedPaste())
      }

      // Set title
      if (title) {
        process.stdout.write(setTerminalTitle(title))
      }

      // Expose API on app
      ;(tuiApp as TUIApp & { screen: ScreenPluginAPI }).screen = {
        setTitle: (newTitle: string) => {
          currentTitle = newTitle
          process.stdout.write(setTerminalTitle(newTitle))
        },

        showCursor: () => {
          if (!cursorVisible) {
            process.stdout.write(showCursor())
            cursorVisible = true
          }
        },

        hideCursor: () => {
          if (cursorVisible) {
            process.stdout.write(hideCursor())
            cursorVisible = false
          }
        },

        isCursorVisible: () => cursorVisible,

        clear: () => {
          process.stdout.write(clearScreen())
        },

        bell: () => {
          process.stdout.write(terminalBell())
        },

        getSize: () => getTerminalSize(),

        isAltScreen: () => inAltScreen,

        enterAltScreen: () => {
          if (!inAltScreen) {
            process.stdout.write(enterAltScreen())
            inAltScreen = true
          }
        },

        exitAltScreen: () => {
          if (inAltScreen) {
            process.stdout.write(exitAltScreen())
            inAltScreen = false
          }
        }
      }

      // Handle resize events
      process.stdout.on('resize', () => {
        const { width, height } = getTerminalSize()
        if (debug) {
          console.error(`[screen] resize: ${width}x${height}`)
        }
      })

      if (debug) {
        const size = getTerminalSize()
        console.error(`[screen] plugin installed (${size.width}x${size.height})`)
      }
    },

    onResize(width: number, height: number): void {
      if (debug) {
        console.error(`[screen] resize event: ${width}x${height}`)
      }
    },

    destroy(): void {
      if (restoreOnExit) {
        // Disable bracketed paste
        if (bracketedPaste) {
          process.stdout.write(disableBracketedPaste())
        }

        // Show cursor
        if (!cursorVisible) {
          process.stdout.write(showCursor())
          cursorVisible = true
        }

        // Exit alternate screen
        if (inAltScreen) {
          process.stdout.write(exitAltScreen())
          inAltScreen = false
        }

        // Clear any custom title
        if (currentTitle) {
          process.stdout.write(setTerminalTitle(''))
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
    callback(process.stdout.columns ?? 80, process.stdout.rows ?? 24)
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
