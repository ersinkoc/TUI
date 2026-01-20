/**
 * @oxog/tui - Clipboard Plugin
 * @packageDocumentation
 *
 * Plugin that provides clipboard access for copy/paste operations.
 * Uses OSC 52 escape sequences for terminal clipboard access.
 */

import type { Plugin, TUIApp } from '../types'

// ============================================================
// Types
// ============================================================

/**
 * Clipboard plugin options.
 */
export interface ClipboardPluginOptions {
  /** Use OSC 52 sequences (default: true, works in most modern terminals) */
  useOsc52?: boolean
  /** Fallback to internal clipboard if OSC 52 fails (default: true) */
  useInternalFallback?: boolean
  /** Debug mode */
  debug?: boolean
}

/**
 * Clipboard plugin API exposed to the app.
 */
export interface ClipboardPluginAPI {
  /** Copy text to clipboard */
  copy(text: string): Promise<void>
  /** Read text from clipboard */
  read(): Promise<string>
  /** Check if clipboard is available */
  isAvailable(): boolean
  /** Get internal clipboard content (fallback) */
  getInternalClipboard(): string
}

// ============================================================
// Implementation
// ============================================================

/**
 * Base64 encode a string.
 */
function base64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
}

/**
 * Create OSC 52 copy sequence.
 * OSC 52 ; Pc ; Pd ST
 * Pc = clipboard selection (c = clipboard, p = primary, s = secondary)
 * Pd = base64 encoded data
 */
function createOsc52CopySequence(text: string, selection: string = 'c'): string {
  const encoded = base64Encode(text)
  return `\x1b]52;${selection};${encoded}\x07`
}

/**
 * Create the clipboard plugin.
 *
 * @param options - Plugin options
 * @returns Clipboard plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { clipboardPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [clipboardPlugin()]
 * })
 *
 * // Copy to clipboard
 * await app.clipboard.copy('Hello, World!')
 *
 * // Read from clipboard (may not work in all terminals)
 * const text = await app.clipboard.read()
 * ```
 */
export function clipboardPlugin(options: ClipboardPluginOptions = {}): Plugin {
  const { useOsc52 = true, useInternalFallback = true, debug = false } = options

  let internalClipboard = ''
  let available = true

  return {
    name: 'clipboard',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      // Check if we're in a TTY environment
      available = process.stdout.isTTY === true

      // Expose API on app
      ;(tuiApp as TUIApp & { clipboard: ClipboardPluginAPI }).clipboard = {
        copy: async (text: string) => {
          if (debug) {
            console.error(
              `[clipboard] copy: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`
            )
          }

          // Store in internal clipboard
          internalClipboard = text

          // Try OSC 52 if available
          if (useOsc52 && available) {
            try {
              const sequence = createOsc52CopySequence(text)
              process.stdout.write(sequence)
              return
              /* c8 ignore start */
            } catch (error) {
              if (debug) {
                console.error('[clipboard] OSC 52 failed:', error)
              }
            }
            /* c8 ignore stop */
          }

          // Fallback to internal only
          if (!useInternalFallback) {
            throw new Error('Clipboard not available')
          }
        },

        read: async () => {
          if (debug) {
            console.error('[clipboard] read requested')
          }

          // OSC 52 read is not widely supported and requires terminal response handling
          // which is complex to implement correctly. Most applications use the internal
          // clipboard or external tools like xclip/pbcopy for reading.

          // For now, we return the internal clipboard
          if (useInternalFallback) {
            return internalClipboard
          }

          throw new Error('Clipboard read not supported in this terminal')
        },

        isAvailable: () => available,

        getInternalClipboard: () => internalClipboard
      }

      if (debug) {
        console.error(`[clipboard] plugin installed (osc52=${useOsc52}, available=${available})`)
      }
    },

    destroy(): void {
      internalClipboard = ''
    }
  }
}

/**
 * Copy text using system clipboard tools (cross-platform).
 * This is an alternative to OSC 52 that works more reliably.
 */
export async function copyWithSystemTool(text: string): Promise<boolean> {
  const { spawn } = await import('child_process')

  return new Promise(resolve => {
    let command: string
    let args: string[]

    /* c8 ignore start */
    switch (process.platform) {
      case 'darwin':
        command = 'pbcopy'
        args = []
        break
      case 'win32':
        command = 'clip'
        args = []
        break
      default:
        // Linux - try xclip first, then xsel
        command = 'xclip'
        args = ['-selection', 'clipboard']
    }
    /* c8 ignore stop */

    try {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'ignore', 'ignore']
      })

      proc.stdin.write(text)
      proc.stdin.end()

      proc.on('close', code => {
        resolve(code === 0)
      })

      /* c8 ignore start */
      proc.on('error', () => {
        resolve(false)
      })
    } catch {
      resolve(false)
    }
    /* c8 ignore stop */
  })
}

/**
 * Read text using system clipboard tools (cross-platform).
 */
export async function readWithSystemTool(): Promise<string | null> {
  const { spawn } = await import('child_process')

  return new Promise(resolve => {
    let command: string
    let args: string[]

    /* c8 ignore start */
    switch (process.platform) {
      case 'darwin':
        command = 'pbpaste'
        args = []
        break
      case 'win32':
        command = 'powershell'
        args = ['-command', 'Get-Clipboard']
        break
      default:
        // Linux
        command = 'xclip'
        args = ['-selection', 'clipboard', '-o']
    }
    /* c8 ignore stop */

    try {
      const proc = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'ignore']
      })

      let output = ''
      proc.stdout.on('data', (data: Buffer) => {
        output += data.toString()
      })

      proc.on('close', code => {
        if (code === 0) {
          resolve(output)
          /* c8 ignore next 3 */
        } else {
          resolve(null)
        }
      })

      /* c8 ignore start */
      proc.on('error', () => {
        resolve(null)
      })
    } catch {
      resolve(null)
    }
    /* c8 ignore stop */
  })
}
