/**
 * @oxog/tui - Screen Management
 * @packageDocumentation
 */

import type { Screen } from '../types'
import {
  cursorHide,
  cursorShow,
  alternateScreen,
  mainScreen,
  mouseOn,
  mouseOff,
  clearScreen,
  cursorTo,
  reset
} from '../utils/ansi'

// ============================================================
// Screen Implementation
// ============================================================

/**
 * Create a screen manager.
 *
 * @param stdin - Input stream
 * @param stdout - Output stream
 * @returns Screen instance
 *
 * @example
 * ```typescript
 * const screen = createScreen(process.stdin, process.stdout)
 * screen.enterAlternateScreen()
 * screen.hideCursor()
 * // ... render
 * screen.exitAlternateScreen()
 * ```
 */
export function createScreen(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream): Screen {
  let isRawMode = false
  let isAlternateScreen = false
  let isCursorHidden = false
  let isMouseEnabled = false
  const resizeHandlers: Set<(width: number, height: number) => void> = new Set()

  // Handle resize events
  const handleResize = () => {
    /* c8 ignore next 2 */
    const width = stdout.columns || 80
    const height = stdout.rows || 24
    for (const handler of resizeHandlers) {
      handler(width, height)
    }
  }

  return {
    get width(): number {
      return stdout.columns || 80
    },

    get height(): number {
      return stdout.rows || 24
    },

    enterRawMode(): void {
      if (isRawMode) return
      if (stdin.isTTY && stdin.setRawMode) {
        stdin.setRawMode(true)
        stdin.resume()
        isRawMode = true
      }
    },

    exitRawMode(): void {
      if (!isRawMode) return
      if (stdin.isTTY && stdin.setRawMode) {
        stdin.setRawMode(false)
        stdin.pause()
        isRawMode = false
      }
    },

    enterAlternateScreen(): void {
      if (isAlternateScreen) return
      stdout.write(alternateScreen())
      stdout.write(clearScreen())
      stdout.write(cursorTo(0, 0))
      isAlternateScreen = true
    },

    exitAlternateScreen(): void {
      if (!isAlternateScreen) return
      stdout.write(mainScreen())
      isAlternateScreen = false
    },

    showCursor(): void {
      if (!isCursorHidden) return
      stdout.write(cursorShow())
      isCursorHidden = false
    },

    hideCursor(): void {
      if (isCursorHidden) return
      stdout.write(cursorHide())
      isCursorHidden = true
    },

    enableMouse(): void {
      if (isMouseEnabled) return
      stdout.write(mouseOn())
      isMouseEnabled = true
    },

    disableMouse(): void {
      if (!isMouseEnabled) return
      stdout.write(mouseOff())
      isMouseEnabled = false
    },

    onResize(handler: (width: number, height: number) => void): () => void {
      resizeHandlers.add(handler)

      // Add process resize listener if first handler
      if (resizeHandlers.size === 1) {
        stdout.on('resize', handleResize)
      }

      // Return unsubscribe function
      return () => {
        resizeHandlers.delete(handler)

        // Remove process listener if last handler
        if (resizeHandlers.size === 0) {
          stdout.off('resize', handleResize)
        }
      }
    }
  }
}

/**
 * Cleanup function to restore terminal state.
 *
 * @param stdout - Output stream
 */
export function cleanupScreen(stdout: NodeJS.WriteStream): void {
  stdout.write(reset())
  stdout.write(cursorShow())
  stdout.write(mouseOff())
  stdout.write(mainScreen())
}

/**
 * Setup function to prepare terminal for TUI.
 *
 * @param stdout - Output stream
 * @param options - Setup options
 */
export function setupScreen(
  stdout: NodeJS.WriteStream,
  options: {
    alternateScreen?: boolean
    hideCursor?: boolean
    enableMouse?: boolean
  } = {}
): void {
  if (options.alternateScreen) {
    stdout.write(alternateScreen())
    stdout.write(clearScreen())
    stdout.write(cursorTo(0, 0))
  }

  if (options.hideCursor) {
    stdout.write(cursorHide())
  }

  if (options.enableMouse) {
    stdout.write(mouseOn())
  }
}

// ============================================================
// Terminal Utilities
// ============================================================

/**
 * Get terminal size.
 *
 * @param stdout - Output stream
 * @returns Terminal dimensions
 */
export function getTerminalSize(stdout: NodeJS.WriteStream): { width: number; height: number } {
  return {
    width: stdout.columns || 80,
    height: stdout.rows || 24
  }
}

/**
 * Check if output is a TTY.
 *
 * @param stdout - Output stream
 * @returns True if TTY
 */
export function isTTY(stdout: NodeJS.WriteStream): boolean {
  return stdout.isTTY === true
}

/**
 * Write directly to terminal at position.
 *
 * @param stdout - Output stream
 * @param x - X position
 * @param y - Y position
 * @param text - Text to write
 */
export function writeAt(stdout: NodeJS.WriteStream, x: number, y: number, text: string): void {
  stdout.write(cursorTo(x, y) + text)
}

/**
 * Clear the screen.
 *
 * @param stdout - Output stream
 */
export function clear(stdout: NodeJS.WriteStream): void {
  stdout.write(clearScreen())
  stdout.write(cursorTo(0, 0))
}

/**
 * Ring the terminal bell.
 *
 * @param stdout - Output stream
 */
export function bell(stdout: NodeJS.WriteStream): void {
  stdout.write('\x07')
}

/**
 * Set terminal title.
 *
 * @param stdout - Output stream
 * @param title - Title to set
 */
export function setTitle(stdout: NodeJS.WriteStream, title: string): void {
  stdout.write(`\x1b]0;${title}\x07`)
}

// ============================================================
// Signal Handling
// ============================================================

/**
 * Setup signal handlers for graceful shutdown.
 *
 * @param cleanup - Cleanup function to call
 * @returns Function to remove handlers
 */
export function setupSignalHandlers(cleanup: () => void): () => void {
  const handler = () => {
    cleanup()
    process.exit(0)
  }

  process.on('SIGINT', handler)
  process.on('SIGTERM', handler)

  // Handle uncaught exceptions
  const errorHandler = (err: Error) => {
    cleanup()
    console.error(err)
    process.exit(1)
  }

  process.on('uncaughtException', errorHandler)
  process.on('unhandledRejection', errorHandler as (reason: unknown) => void)

  return () => {
    process.off('SIGINT', handler)
    process.off('SIGTERM', handler)
    process.off('uncaughtException', errorHandler)
    process.off('unhandledRejection', errorHandler as (reason: unknown) => void)
  }
}
