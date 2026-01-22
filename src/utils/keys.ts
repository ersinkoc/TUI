/**
 * @oxog/tui - Key Parsing Utilities
 * @packageDocumentation
 */

import type { KeyEvent, MouseEvent } from '../types'
import {
  CONTROL_CHAR_NAMES,
  CSI_KEY_NAMES,
  CSI_PARAM_KEY_NAMES,
  SS3_KEY_NAMES,
  ESC,
  MAX_ESCAPE_SEQUENCE_LENGTH
} from '../constants'

// ============================================================
// Key Parser
// ============================================================

/** Pending buffer timeout in milliseconds (100ms) */
const PENDING_BUFFER_TIMEOUT = 100

/**
 * Key parser interface.
 */
export interface KeyParser {
  /**
   * Parse input buffer to key events.
   * @param data - Input buffer
   * @returns Array of key events
   */
  parse(data: Buffer): KeyEvent[]
  /**
   * Clear the pending buffer.
   * Useful for resetting parser state after timeout or connection issues.
   */
  clear(): void
}

/**
 * Create a key parser.
 *
 * Handles incomplete escape sequences by buffering partial data across calls.
 * Stale pending buffers are automatically cleared after a timeout.
 *
 * @returns Key parser instance
 *
 * @example
 * ```typescript
 * const parser = createKeyParser()
 * const events = parser.parse(Buffer.from('\x1b[A'))
 * // [{ name: 'up', ... }]
 *
 * // Manually clear buffer if needed
 * parser.clear()
 * ```
 */
export function createKeyParser(): KeyParser {
  // Buffer for incomplete escape sequences
  let pendingBuffer = ''
  let pendingBufferTime = 0

  return {
    parse(data: Buffer): KeyEvent[] {
      const events: KeyEvent[] = []

      // Clear stale pending buffer (timeout mechanism)
      if (pendingBuffer && Date.now() - pendingBufferTime > PENDING_BUFFER_TIMEOUT) {
        pendingBuffer = ''
        pendingBufferTime = 0
      }

      const str = pendingBuffer + data.toString('utf8')
      pendingBuffer = ''
      let i = 0

      while (i < str.length) {
        const result = parseKeyAt(str, i)

        // Check if this is an incomplete escape sequence
        if (result.incomplete) {
          // Buffer the remaining data for next parse call
          pendingBuffer = str.slice(i)
          pendingBufferTime = Date.now()
          break
        }

        events.push(result.key)
        i += result.consumed
      }

      // Clear timestamp if buffer is empty
      if (!pendingBuffer) {
        pendingBufferTime = 0
      }

      return events
    },

    clear(): void {
      pendingBuffer = ''
      pendingBufferTime = 0
    }
  }
}

/**
 * Result from parsing a key at a position.
 */
export interface ParseKeyResult {
  key: KeyEvent
  consumed: number
  /** True if the sequence is incomplete and needs more data */
  incomplete?: boolean
}

/**
 * Parse a key event at position in string.
 *
 * @param str - Input string
 * @param start - Start position
 * @returns Key event and number of characters consumed
 */
export function parseKeyAt(str: string, start: number): ParseKeyResult {
  const char = str[start]

  if (char === undefined) {
    return {
      key: createKeyEvent('', ''),
      consumed: 0
    }
  }

  // Escape sequence
  if (char === ESC) {
    // Check for multi-byte escape sequence
    if (start + 1 < str.length) {
      const next = str[start + 1]

      // CSI sequence: ESC [
      if (next === '[') {
        return parseCSI(str, start)
      }

      // SS3 sequence: ESC O
      if (next === 'O') {
        return parseSS3(str, start)
      }

      // Alt + key
      const altChar = str[start + 1]
      if (altChar !== undefined) {
        return {
          key: createKeyEvent(altChar, str.slice(start, start + 2), {
            alt: true,
            shift: /[A-Z]/.test(altChar)
          }),
          consumed: 2
        }
      }
    }

    // Lone ESC at end of string - return as escape key
    // Note: This could be start of an incomplete sequence, but we can't
    // distinguish between a user pressing ESC and an incomplete sequence
    // without a timeout mechanism. For immediate parsing, treat as ESC.
    return {
      key: createKeyEvent('escape', ESC),
      consumed: 1
    }
  }

  // Control characters
  const code = char.charCodeAt(0)
  if (code < 32 || code === 127) {
    const name = controlCharName(code)
    const isCtrl = code !== 9 && code !== 10 && code !== 13 // tab, enter
    return {
      key: createKeyEvent(name, char, { ctrl: isCtrl }),
      consumed: 1
    }
  }

  // Regular character
  return {
    key: createKeyEvent(char, char, { shift: /[A-Z]/.test(char) }),
    consumed: 1
  }
}

/**
 * Parse CSI (Control Sequence Introducer) sequence.
 *
 * @param str - Input string
 * @param start - Start position
 * @returns Key event and consumed length
 */
function parseCSI(str: string, start: number): ParseKeyResult {
  // Find end of CSI sequence (letter that's not a parameter)
  let end = start + 2
  let foundTerminator = false
  const maxEnd = Math.min(str.length, start + MAX_ESCAPE_SEQUENCE_LENGTH)

  while (end < maxEnd) {
    const c = str[end]
    if (c !== undefined && c >= '@' && c <= '~') {
      end++
      foundTerminator = true
      break
    }
    end++
  }

  // If we exceeded max length without finding terminator, treat as malformed
  if (!foundTerminator && end >= start + MAX_ESCAPE_SEQUENCE_LENGTH) {
    // Skip the malformed sequence
    return {
      key: createKeyEvent('unknown', str.slice(start, start + 2)),
      consumed: 2
    }
  }

  // If we didn't find a terminator, the sequence is incomplete
  if (!foundTerminator) {
    return {
      key: createKeyEvent('', ''),
      consumed: 0,
      incomplete: true
    }
  }

  const sequence = str.slice(start, end)
  const body = sequence.slice(2) // Remove ESC [
  /* c8 ignore next */
  const finalByte = body[body.length - 1] || ''
  const params = body.slice(0, -1)

  // Mouse event (SGR format)
  if (finalByte === 'M' || finalByte === 'm') {
    if (params.startsWith('<')) {
      // This is a mouse event, not a key event
      // Return a special key event
      return {
        key: createKeyEvent('mouse', sequence),
        consumed: end - start
      }
    }
  }

  const name = csiToName(finalByte, params)
  const modifiers = parseModifiers(params)

  return {
    key: createKeyEvent(name, sequence, modifiers),
    consumed: end - start
  }
}

/**
 * Parse SS3 (Single Shift 3) sequence.
 *
 * @param str - Input string
 * @param start - Start position
 * @returns Key event and consumed length
 */
function parseSS3(str: string, start: number): ParseKeyResult {
  // SS3 sequences are 3 bytes: ESC O <char>
  // Check if we have enough data
  if (start + 2 >= str.length) {
    return {
      key: createKeyEvent('', ''),
      consumed: 0,
      incomplete: true
    }
  }

  const sequence = str.slice(start, start + 3)
  /* c8 ignore next 3 */
  const finalByte = sequence[2] || ''

  const name = SS3_KEY_NAMES[finalByte] || finalByte

  return {
    key: createKeyEvent(name, sequence),
    consumed: 3
  }
}

/**
 * Convert CSI final byte to key name.
 *
 * @param finalByte - Final byte of CSI sequence
 * @param params - Parameters before final byte
 * @returns Key name
 */
function csiToName(finalByte: string, params: string): string {
  // Check direct mapping
  if (CSI_KEY_NAMES[finalByte]) {
    return CSI_KEY_NAMES[finalByte]
  }

  // Check parameterized keys
  if (finalByte === '~') {
    /* c8 ignore next */
    const baseParam = params.split(';')[0] || ''
    if (CSI_PARAM_KEY_NAMES[baseParam]) {
      return CSI_PARAM_KEY_NAMES[baseParam]
    }
  }

  return `csi-${params}-${finalByte}`
}

/**
 * Parse modifier keys from CSI parameters.
 *
 * @param params - CSI parameters
 * @returns Modifier flags
 */
function parseModifiers(params: string): {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
} {
  const parts = params.split(';')
  if (parts.length < 2) {
    return { ctrl: false, alt: false, shift: false, meta: false }
  }

  /* c8 ignore next */
  const mod = parseInt(parts[1] || '1', 10) - 1
  return {
    shift: (mod & 1) !== 0,
    alt: (mod & 2) !== 0,
    ctrl: (mod & 4) !== 0,
    meta: (mod & 8) !== 0
  }
}

/**
 * Get control character name.
 *
 * @param code - Character code
 * @returns Key name
 */
export function controlCharName(code: number): string {
  if (CONTROL_CHAR_NAMES[code] !== undefined) {
    return CONTROL_CHAR_NAMES[code]
  }

  return `ctrl-${code}`
}

/**
 * Create a key event object.
 *
 * @param name - Key name
 * @param sequence - Raw sequence
 * @param modifiers - Modifier flags
 * @returns Key event
 */
function createKeyEvent(
  name: string,
  sequence: string,
  modifiers: Partial<{ ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }> = {}
): KeyEvent {
  return {
    name,
    sequence,
    ctrl: modifiers.ctrl ?? false,
    alt: modifiers.alt ?? false,
    shift: modifiers.shift ?? false,
    meta: modifiers.meta ?? false
  }
}

// ============================================================
// Mouse Parser
// ============================================================

/**
 * Mouse parser interface.
 */
export interface MouseParser {
  /**
   * Parse input buffer to mouse events.
   * @param data - Input buffer
   * @returns Array of mouse events
   */
  parse(data: Buffer): MouseEvent[]
}

/**
 * Create a mouse parser.
 *
 * @returns Mouse parser instance
 *
 * @example
 * ```typescript
 * const parser = createMouseParser()
 * const events = parser.parse(Buffer.from('\x1b[<0;10;20M'))
 * // [{ x: 9, y: 19, button: 'left', action: 'press', ... }]
 * ```
 */
export function createMouseParser(): MouseParser {
  return {
    parse(data: Buffer): MouseEvent[] {
      const events: MouseEvent[] = []
      const str = data.toString('utf8')

      // SGR mouse encoding: ESC [ < Cb ; Cx ; Cy [Mm]
      const sgrRegex = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g
      let match

      while ((match = sgrRegex.exec(str)) !== null) {
        const cb = parseInt(match[1]!, 10)
        const x = parseInt(match[2]!, 10) - 1
        const y = parseInt(match[3]!, 10) - 1
        const released = match[4] === 'm'

        const button = cb & 3
        const shift = (cb & 4) !== 0
        const alt = (cb & 8) !== 0
        const ctrl = (cb & 16) !== 0
        const motion = (cb & 32) !== 0
        const scroll = (cb & 64) !== 0

        let buttonName: MouseEvent['button'] = 'none'
        if (!scroll) {
          if (button === 0) buttonName = 'left'
          else if (button === 1) buttonName = 'middle'
          else if (button === 2) buttonName = 'right'
        }

        let action: MouseEvent['action'] = 'press'
        let scrollDir: 'up' | 'down' | null = null

        if (released) {
          action = 'release'
        } else if (motion) {
          action = 'move'
        } else if (scroll) {
          action = 'scroll'
          scrollDir = button === 0 ? 'up' : 'down'
          buttonName = 'none'
        }

        const event: MouseEvent = {
          x,
          y,
          button: buttonName,
          action,
          ctrl,
          alt,
          shift
        }
        if (scrollDir !== null) {
          event.scroll = scrollDir
        }
        events.push(event)
      }

      return events
    }
  }
}

// ============================================================
// Key Utilities
// ============================================================

/**
 * Check if key event matches a key description.
 *
 * @param event - Key event
 * @param key - Key description (e.g., 'c-c', 'enter', 'shift-tab')
 * @returns True if matches
 *
 * @example
 * ```typescript
 * if (matchKey(event, 'c-c')) {
 *   // Ctrl+C pressed
 * }
 * ```
 */
export function matchKey(event: KeyEvent, key: string): boolean {
  const parts = key.toLowerCase().split('-')
  let expectedCtrl = false
  let expectedAlt = false
  let expectedShift = false
  let expectedName = ''

  for (const part of parts) {
    if (part === 'c' || part === 'ctrl') {
      expectedCtrl = true
    } else if (part === 'a' || part === 'alt') {
      expectedAlt = true
    } else if (part === 's' || part === 'shift') {
      expectedShift = true
    } else {
      expectedName = part
    }
  }

  return (
    event.name.toLowerCase() === expectedName &&
    event.ctrl === expectedCtrl &&
    event.alt === expectedAlt &&
    event.shift === expectedShift
  )
}

/**
 * Check if key is a printable character.
 *
 * @param event - Key event
 * @returns True if printable
 */
export function isPrintable(event: KeyEvent): boolean {
  // Single character, no modifiers except shift
  return (
    event.name.length === 1 &&
    !event.ctrl &&
    !event.alt &&
    !event.meta &&
    event.name.charCodeAt(0) >= 32
  )
}

/**
 * Check if key is a navigation key.
 *
 * @param event - Key event
 * @returns True if navigation key
 */
export function isNavigation(event: KeyEvent): boolean {
  const navKeys = ['up', 'down', 'left', 'right', 'home', 'end', 'pageup', 'pagedown']
  return navKeys.includes(event.name.toLowerCase())
}

/**
 * Convert key event to human-readable string.
 *
 * @param event - Key event
 * @returns Human-readable key description
 *
 * @example
 * ```typescript
 * keyToString({ name: 'c', ctrl: true, ... }) // 'Ctrl+C'
 * ```
 */
export function keyToString(event: KeyEvent): string {
  const parts: string[] = []

  if (event.ctrl) parts.push('Ctrl')
  if (event.alt) parts.push('Alt')
  if (event.shift) parts.push('Shift')
  if (event.meta) parts.push('Meta')

  // Capitalize key name
  const name = event.name.charAt(0).toUpperCase() + event.name.slice(1)
  parts.push(name)

  return parts.join('+')
}
