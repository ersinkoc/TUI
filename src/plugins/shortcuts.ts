/**
 * @oxog/tui - Shortcuts Plugin
 * @packageDocumentation
 *
 * Global keyboard shortcuts registry with Vim mode support,
 * key chords, context-aware bindings, and help generation.
 */

import type { Plugin, TUIApp, KeyEvent } from '../types'

// ============================================================
// Types
// ============================================================

/**
 * Shortcut context for conditional activation.
 */
export type ShortcutContext = string | string[] | ((app: TUIApp) => boolean)

/**
 * Shortcut priority for conflict resolution.
 */
export type ShortcutPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Shortcut definition.
 */
export interface Shortcut {
  /** Unique identifier */
  id: string
  /** Key or key sequence (e.g., 'ctrl+s', 'g g', 'ctrl+k ctrl+c') */
  keys: string | string[]
  /** Handler function */
  handler: (event?: KeyEvent) => void | boolean
  /** Human-readable description */
  description: string
  /** Category for grouping in help */
  category?: string
  /** Context for conditional activation */
  context?: ShortcutContext
  /** Priority for conflict resolution */
  priority?: ShortcutPriority
  /** Whether shortcut is currently enabled */
  enabled?: boolean
  /** Vim mode only */
  vimOnly?: boolean
  /** Normal mode only (not vim) */
  normalOnly?: boolean
}

/**
 * Shortcut conflict information.
 */
export interface ShortcutConflict {
  key: string
  shortcuts: Shortcut[]
}

/**
 * Vim mode state.
 */
export type VimMode = 'normal' | 'insert' | 'visual' | 'command'

/**
 * Shortcuts plugin options.
 */
export interface ShortcutsPluginOptions {
  /** Initial shortcuts */
  shortcuts?: Shortcut[]
  /** Enable vim mode by default */
  vimMode?: boolean
  /** Enable chord timeout (ms) */
  chordTimeout?: number
  /** Debug mode */
  debug?: boolean
  /** Leader key for vim (default: space) */
  leaderKey?: string
}

/**
 * Shortcuts plugin API exposed to the app.
 */
export interface ShortcutsPluginAPI {
  /** Register a shortcut */
  register(shortcut: Shortcut): void
  /** Register multiple shortcuts */
  registerMany(shortcuts: Shortcut[]): void
  /** Unregister a shortcut by ID */
  unregister(id: string): void
  /** Enable a shortcut */
  enable(id: string): void
  /** Disable a shortcut */
  disable(id: string): void
  /** Check if vim mode is enabled */
  isVimMode(): boolean
  /** Enable vim mode */
  enableVimMode(): void
  /** Disable vim mode */
  disableVimMode(): void
  /** Toggle vim mode */
  toggleVimMode(): void
  /** Get current vim mode */
  getVimMode(): VimMode
  /** Set vim mode */
  setVimMode(mode: VimMode): void
  /** Get all shortcuts */
  getShortcuts(): Shortcut[]
  /** Get shortcuts by category */
  getShortcutsByCategory(): Map<string, Shortcut[]>
  /** Get shortcut conflicts */
  getConflicts(): ShortcutConflict[]
  /** Generate help text */
  getHelpText(options?: { category?: string; markdown?: boolean }): string
  /** Set active context */
  setContext(context: string | string[]): void
  /** Clear active context */
  clearContext(): void
  /** Simulate key press */
  simulate(key: string): boolean
  /** Execute shortcut by ID */
  execute(id: string): boolean
}

// ============================================================
// Priority Weights
// ============================================================

const PRIORITY_WEIGHTS: Record<ShortcutPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4
}

// ============================================================
// Implementation
// ============================================================

/**
 * Parse a key string into normalized form.
 */
export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split('+')
    .sort((a, b) => {
      // Sort modifiers first: ctrl, alt, shift, meta
      const order = ['ctrl', 'alt', 'shift', 'meta']
      const aIdx = order.indexOf(a)
      const bIdx = order.indexOf(b)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return 0
    })
    .join('+')
}

/**
 * Normalize a single key combination (not multi-key sequences).
 * For multi-key sequences like "g g" or "ctrl+k ctrl+c", use normalizeSingleKey on each part.
 */
function normalizeSingleKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .split('+')
    .sort((a, b) => {
      const order = ['ctrl', 'alt', 'shift', 'meta']
      const aIdx = order.indexOf(a)
      const bIdx = order.indexOf(b)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return 0
    })
    .join('+')
}

/**
 * Normalize a key sequence (handles both single keys and multi-key sequences).
 */
function normalizeKeySequence(keySequence: string): string {
  return keySequence
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(part => normalizeSingleKey(part))
    .join(' ')
}

/**
 * Create the shortcuts plugin.
 *
 * @param options - Plugin options
 * @returns Shortcuts plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { shortcutsPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [shortcutsPlugin({ vimMode: true })]
 * })
 *
 * // Register shortcuts
 * app.shortcuts.register({
 *   id: 'save',
 *   keys: 'ctrl+s',
 *   handler: () => saveFile(),
 *   description: 'Save file',
 *   category: 'File'
 * })
 *
 * // Vim-style leader key shortcuts
 * app.shortcuts.register({
 *   id: 'leader-w',
 *   keys: 'space w',  // <leader>w
 *   handler: () => saveFile(),
 *   description: 'Save file',
 *   vimOnly: true
 * })
 * ```
 */
export function shortcutsPlugin(options: ShortcutsPluginOptions = {}): Plugin {
  const {
    shortcuts: initialShortcuts = [],
    vimMode: initialVimMode = false,
    chordTimeout = 1000,
    debug = false,
    leaderKey = 'space'
  } = options

  let app: TUIApp | null = null
  let vimEnabled = initialVimMode
  let vimMode: VimMode = 'normal'
  const shortcuts: Shortcut[] = [...initialShortcuts]
  let activeContext: string[] = []

  // Chord state
  let chordBuffer: string[] = []
  let chordTimer: ReturnType<typeof setTimeout> | null = null

  // Store unsubscribe function for cleanup (memory leak fix)
  let keyUnsubscribe: (() => void) | null = null

  /**
   * Clear chord buffer.
   */
  function clearChord(): void {
    chordBuffer = []
    if (chordTimer) {
      clearTimeout(chordTimer)
      chordTimer = null
    }
  }

  /**
   * Check if shortcut is active in current context.
   */
  function isShortcutActive(shortcut: Shortcut): boolean {
    // Check enabled
    if (shortcut.enabled === false) return false

    // Check vim mode restrictions
    if (shortcut.vimOnly && !vimEnabled) return false
    if (shortcut.normalOnly && vimEnabled) return false

    // Check vim mode (only normal mode triggers shortcuts in vim)
    if (vimEnabled && vimMode !== 'normal' && !shortcut.keys.toString().includes('escape')) {
      return false
    }

    // Check context
    if (!shortcut.context) return true

    if (typeof shortcut.context === 'function') {
      return app ? shortcut.context(app) : false
    }

    const contexts = Array.isArray(shortcut.context) ? shortcut.context : [shortcut.context]
    return contexts.some(ctx => activeContext.includes(ctx))
  }

  /**
   * Find matching shortcuts for a key sequence.
   */
  function findMatchingShortcuts(keySequence: string[]): Shortcut[] {
    const seqStr = keySequence.join(' ')

    return shortcuts
      .filter(s => {
        if (!isShortcutActive(s)) return false

        const keys = Array.isArray(s.keys) ? s.keys : [s.keys]
        return keys.some(k => {
          const normalized = k
            .toLowerCase()
            .replace(/<leader>/g, leaderKey)
            .replace(/\s+/g, ' ')
            .trim()
          return normalized === seqStr
        })
      })
      .sort((a, b) => {
        const aPriority = PRIORITY_WEIGHTS[a.priority || 'normal']
        const bPriority = PRIORITY_WEIGHTS[b.priority || 'normal']
        return bPriority - aPriority
      })
  }

  /**
   * Check if any shortcut starts with the given sequence.
   */
  function hasPartialMatch(keySequence: string[]): boolean {
    const seqStr = keySequence.join(' ')

    return shortcuts.some(s => {
      if (!isShortcutActive(s)) return false

      const keys = Array.isArray(s.keys) ? s.keys : [s.keys]
      return keys.some(k => {
        const normalized = k
          .toLowerCase()
          .replace(/<leader>/g, leaderKey)
          .replace(/\s+/g, ' ')
          .trim()
        return normalized.startsWith(seqStr) && normalized !== seqStr
      })
    })
  }

  /**
   * Handle key event.
   */
  function handleKey(event: KeyEvent): boolean {
    // Build key string from event
    // Fix: Include shift modifier for all keys, not just multi-character keys
    // This allows distinguishing between 'g' and 'shift+g' (or 'G')
    let keyStr = ''
    if (event.ctrl) keyStr += 'ctrl+'
    if (event.alt) keyStr += 'alt+'
    // Include shift for all keys when shift is pressed
    // However, for uppercase single letters (like 'G'), the terminal often sends
    // the uppercase letter with shift=true, so we need to handle both cases
    if (event.shift) {
      // Only add shift+ if the key is not already uppercase or if it's a special key
      const isUppercaseLetter = event.name.length === 1 && event.name === event.name.toUpperCase() && event.name !== event.name.toLowerCase()
      if (!isUppercaseLetter || event.name.length > 1) {
        keyStr += 'shift+'
      }
    }
    if (event.meta) keyStr += 'meta+'
    keyStr += event.name.toLowerCase()

    // Handle escape in vim mode
    if (vimEnabled && event.name === 'escape') {
      vimMode = 'normal'
      clearChord()
      app?.markDirty()
      return true
    }

    // Handle i for insert mode in vim
    if (vimEnabled && vimMode === 'normal' && event.name === 'i' && !event.ctrl && !event.alt) {
      vimMode = 'insert'
      clearChord()
      app?.markDirty()
      return true
    }

    // Handle v for visual mode in vim
    if (vimEnabled && vimMode === 'normal' && event.name === 'v' && !event.ctrl && !event.alt) {
      vimMode = 'visual'
      clearChord()
      app?.markDirty()
      return true
    }

    // In insert mode, pass through to normal input
    if (vimEnabled && vimMode === 'insert') {
      return false
    }

    // Add to chord buffer
    chordBuffer.push(keyStr)

    if (debug) {
      console.error(`[shortcuts] Key: ${keyStr}, Chord: ${chordBuffer.join(' ')}`)
    }

    // Check for exact match
    const matches = findMatchingShortcuts(chordBuffer)
    const match = matches[0]

    if (match) {
      // Execute highest priority match
      if (debug) {
        console.error(`[shortcuts] Executing: ${match.id}`)
      }
      clearChord()
      const result = match.handler(event)
      return result !== false
    }

    // Check for partial match (chord in progress)
    if (hasPartialMatch(chordBuffer)) {
      // Set timeout to clear chord
      if (chordTimer) clearTimeout(chordTimer)
      chordTimer = setTimeout(() => {
        if (debug && chordBuffer.length > 0) {
          console.error(`[shortcuts] Chord timeout: ${chordBuffer.join(' ')}`)
        }
        clearChord()
      }, chordTimeout)
      return true // Consume key while building chord
    }

    // No match - clear chord and let event pass through
    clearChord()
    return false
  }

  return {
    name: 'shortcuts',
    version: '1.0.0',
    dependencies: ['input'],

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Hook into input events
      const inputAPI = (tuiApp as { input?: { bind: (key: string, handler: (e: KeyEvent) => void | boolean) => void } }).input
      if (inputAPI) {
        // We need to intercept all keys before other handlers
        // This is a bit hacky but works with the current architecture
      }

      // Listen to key events on app (store unsubscribe for cleanup)
      keyUnsubscribe = tuiApp.on('key', (event: KeyEvent) => {
        handleKey(event)
      })

      // Expose API on app
      ;(tuiApp as TUIApp & { shortcuts: ShortcutsPluginAPI }).shortcuts = {
        register: (shortcut: Shortcut) => {
          // Remove existing with same ID
          const idx = shortcuts.findIndex(s => s.id === shortcut.id)
          if (idx !== -1) shortcuts.splice(idx, 1)
          shortcuts.push({ ...shortcut, enabled: shortcut.enabled !== false })
          if (debug) {
            console.error(`[shortcuts] Registered: ${shortcut.id} -> ${shortcut.keys}`)
          }
        },

        registerMany: (newShortcuts: Shortcut[]) => {
          for (const s of newShortcuts) {
            const idx = shortcuts.findIndex(existing => existing.id === s.id)
            if (idx !== -1) shortcuts.splice(idx, 1)
            shortcuts.push({ ...s, enabled: s.enabled !== false })
          }
        },

        unregister: (id: string) => {
          const idx = shortcuts.findIndex(s => s.id === id)
          if (idx !== -1) {
            shortcuts.splice(idx, 1)
            if (debug) {
              console.error(`[shortcuts] Unregistered: ${id}`)
            }
          }
        },

        enable: (id: string) => {
          const shortcut = shortcuts.find(s => s.id === id)
          if (shortcut) shortcut.enabled = true
        },

        disable: (id: string) => {
          const shortcut = shortcuts.find(s => s.id === id)
          if (shortcut) shortcut.enabled = false
        },

        isVimMode: () => vimEnabled,

        enableVimMode: () => {
          vimEnabled = true
          vimMode = 'normal'
          app?.markDirty()
        },

        disableVimMode: () => {
          vimEnabled = false
          app?.markDirty()
        },

        toggleVimMode: () => {
          vimEnabled = !vimEnabled
          if (vimEnabled) vimMode = 'normal'
          app?.markDirty()
        },

        getVimMode: () => vimMode,

        setVimMode: (mode: VimMode) => {
          vimMode = mode
          app?.markDirty()
        },

        getShortcuts: () => [...shortcuts],

        getShortcutsByCategory: () => {
          const map = new Map<string, Shortcut[]>()
          for (const s of shortcuts) {
            const category = s.category || 'General'
            if (!map.has(category)) map.set(category, [])
            map.get(category)!.push(s)
          }
          return map
        },

        getConflicts: () => {
          const keyMap = new Map<string, Shortcut[]>()

          for (const s of shortcuts) {
            if (s.enabled === false) continue
            const keys = Array.isArray(s.keys) ? s.keys : [s.keys]
            for (const k of keys) {
              // Use normalizeKeySequence for proper multi-key handling
              const normalized = normalizeKeySequence(k)
              if (!keyMap.has(normalized)) keyMap.set(normalized, [])
              keyMap.get(normalized)!.push(s)
            }
          }

          const conflicts: ShortcutConflict[] = []
          for (const [key, list] of keyMap) {
            if (list.length > 1) {
              // Check if any pair can actually conflict
              // Filter out false positives: shortcuts with different contexts can coexist
              const conflictingIds = new Set<string>()

              for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                  const s = list[i]
                  const other = list[j]
                  if (!s || !other) continue

                  let canConflict = false

                  // If both have no context, they conflict
                  if (!s.context && !other.context) {
                    canConflict = true
                  }
                  // If one has no context, they might conflict
                  else if (!s.context || !other.context) {
                    canConflict = true
                  }
                  // Check if contexts overlap
                  else {
                    const sContexts = typeof s.context === 'function' ? [] :
                      Array.isArray(s.context) ? s.context : [s.context]
                    const otherContexts = typeof other.context === 'function' ? [] :
                      Array.isArray(other.context) ? other.context : [other.context]

                    // Function contexts are hard to compare, assume they might conflict
                    if (sContexts.length === 0 || otherContexts.length === 0) {
                      canConflict = true
                    } else {
                      // Check for overlap
                      canConflict = sContexts.some(ctx => otherContexts.includes(ctx))
                    }
                  }

                  if (canConflict) {
                    conflictingIds.add(s.id)
                    conflictingIds.add(other.id)
                  }
                }
              }

              if (conflictingIds.size > 1) {
                const conflictingShortcuts = list.filter(s => conflictingIds.has(s.id))
                conflicts.push({ key, shortcuts: conflictingShortcuts })
              }
            }
          }

          return conflicts
        },

        getHelpText: (opts = {}) => {
          const { category, markdown = false } = opts
          const byCategory = new Map<string, Shortcut[]>()

          for (const s of shortcuts) {
            if (s.enabled === false) continue
            if (category && s.category !== category) continue
            const cat = s.category || 'General'
            if (!byCategory.has(cat)) byCategory.set(cat, [])
            byCategory.get(cat)!.push(s)
          }

          const lines: string[] = []

          if (markdown) {
            lines.push('# Keyboard Shortcuts\n')
            if (vimEnabled) {
              lines.push(`*Vim mode: ${vimMode}*\n`)
            }
          } else {
            lines.push('Keyboard Shortcuts')
            lines.push('─'.repeat(40))
            if (vimEnabled) {
              lines.push(`Vim mode: ${vimMode}`)
              lines.push('')
            }
          }

          for (const [cat, list] of byCategory) {
            if (markdown) {
              lines.push(`## ${cat}\n`)
              lines.push('| Key | Description |')
              lines.push('|-----|-------------|')
              for (const s of list) {
                const keys = Array.isArray(s.keys) ? s.keys.join(', ') : s.keys
                lines.push(`| \`${keys}\` | ${s.description} |`)
              }
              lines.push('')
            } else {
              lines.push(`\n${cat}`)
              lines.push('─'.repeat(cat.length))
              for (const s of list) {
                const keys = Array.isArray(s.keys) ? s.keys.join(', ') : s.keys
                lines.push(`  ${keys.padEnd(20)} ${s.description}`)
              }
            }
          }

          return lines.join('\n')
        },

        setContext: (context: string | string[]) => {
          activeContext = Array.isArray(context) ? context : [context]
        },

        clearContext: () => {
          activeContext = []
        },

        simulate: (key: string) => {
          // Create a synthetic key event
          const parts = key.toLowerCase().split('+')
          const keyName = parts.pop() || ''
          const event: KeyEvent = {
            name: keyName,
            sequence: key,
            ctrl: parts.includes('ctrl'),
            alt: parts.includes('alt'),
            shift: parts.includes('shift'),
            meta: parts.includes('meta')
          }
          return handleKey(event)
        },

        execute: (id: string) => {
          const shortcut = shortcuts.find(s => s.id === id)
          if (shortcut && isShortcutActive(shortcut)) {
            const result = shortcut.handler()
            return result !== false
          }
          return false
        }
      }
    },

    destroy(): void {
      // Clean up event listener (memory leak fix)
      if (keyUnsubscribe) {
        keyUnsubscribe()
        keyUnsubscribe = null
      }
      clearChord()
      shortcuts.length = 0
      app = null
    }
  }
}

// ============================================================
// Preset Shortcuts
// ============================================================

/**
 * Common application shortcuts.
 */
export const commonShortcuts: Shortcut[] = [
  {
    id: 'quit',
    keys: ['q', 'ctrl+c'],
    handler: () => {},
    description: 'Quit application',
    category: 'Application',
    priority: 'critical'
  },
  {
    id: 'help',
    keys: ['?', 'f1'],
    handler: () => {},
    description: 'Show help',
    category: 'Application'
  },
  {
    id: 'refresh',
    keys: 'ctrl+l',
    handler: () => {},
    description: 'Refresh screen',
    category: 'Application'
  }
]

/**
 * Vim navigation shortcuts.
 */
export const vimNavigationShortcuts: Shortcut[] = [
  {
    id: 'vim-up',
    keys: 'k',
    handler: () => {},
    description: 'Move up',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-down',
    keys: 'j',
    handler: () => {},
    description: 'Move down',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-left',
    keys: 'h',
    handler: () => {},
    description: 'Move left',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-right',
    keys: 'l',
    handler: () => {},
    description: 'Move right',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-top',
    keys: 'g g',
    handler: () => {},
    description: 'Go to top',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-bottom',
    keys: 'G',
    handler: () => {},
    description: 'Go to bottom',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-page-up',
    keys: 'ctrl+u',
    handler: () => {},
    description: 'Page up',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-page-down',
    keys: 'ctrl+d',
    handler: () => {},
    description: 'Page down',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-half-up',
    keys: 'ctrl+b',
    handler: () => {},
    description: 'Half page up',
    category: 'Navigation',
    vimOnly: true
  },
  {
    id: 'vim-half-down',
    keys: 'ctrl+f',
    handler: () => {},
    description: 'Half page down',
    category: 'Navigation',
    vimOnly: true
  }
]

/**
 * Vim editing shortcuts.
 */
export const vimEditingShortcuts: Shortcut[] = [
  {
    id: 'vim-delete',
    keys: 'd d',
    handler: () => {},
    description: 'Delete line',
    category: 'Editing',
    vimOnly: true
  },
  {
    id: 'vim-yank',
    keys: 'y y',
    handler: () => {},
    description: 'Yank (copy) line',
    category: 'Editing',
    vimOnly: true
  },
  {
    id: 'vim-paste',
    keys: 'p',
    handler: () => {},
    description: 'Paste',
    category: 'Editing',
    vimOnly: true
  },
  {
    id: 'vim-undo',
    keys: 'u',
    handler: () => {},
    description: 'Undo',
    category: 'Editing',
    vimOnly: true
  },
  {
    id: 'vim-redo',
    keys: 'ctrl+r',
    handler: () => {},
    description: 'Redo',
    category: 'Editing',
    vimOnly: true
  }
]

/**
 * Create a complete vim shortcuts preset.
 */
export function createVimShortcuts(handlers: {
  up?: () => void
  down?: () => void
  left?: () => void
  right?: () => void
  top?: () => void
  bottom?: () => void
  pageUp?: () => void
  pageDown?: () => void
  delete?: () => void
  yank?: () => void
  paste?: () => void
  undo?: () => void
  redo?: () => void
}): Shortcut[] {
  const result: Shortcut[] = []
  const nav = vimNavigationShortcuts
  const edit = vimEditingShortcuts

  if (nav[0]) result.push({ ...nav[0], handler: handlers.up || (() => {}) })
  if (nav[1]) result.push({ ...nav[1], handler: handlers.down || (() => {}) })
  if (nav[2]) result.push({ ...nav[2], handler: handlers.left || (() => {}) })
  if (nav[3]) result.push({ ...nav[3], handler: handlers.right || (() => {}) })
  if (nav[4]) result.push({ ...nav[4], handler: handlers.top || (() => {}) })
  if (nav[5]) result.push({ ...nav[5], handler: handlers.bottom || (() => {}) })
  if (nav[6]) result.push({ ...nav[6], handler: handlers.pageUp || (() => {}) })
  if (nav[7]) result.push({ ...nav[7], handler: handlers.pageDown || (() => {}) })
  if (edit[0]) result.push({ ...edit[0], handler: handlers.delete || (() => {}) })
  if (edit[1]) result.push({ ...edit[1], handler: handlers.yank || (() => {}) })
  if (edit[2]) result.push({ ...edit[2], handler: handlers.paste || (() => {}) })
  if (edit[3]) result.push({ ...edit[3], handler: handlers.undo || (() => {}) })
  if (edit[4]) result.push({ ...edit[4], handler: handlers.redo || (() => {}) })

  return result
}
