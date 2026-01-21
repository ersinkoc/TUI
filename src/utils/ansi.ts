/**
 * @oxog/tui - ANSI Escape Sequences
 * @packageDocumentation
 */

import {
  ESC,
  CSI,
  RESET,
  CURSOR_HIDE,
  CURSOR_SHOW,
  ALT_SCREEN_ON,
  ALT_SCREEN_OFF,
  MOUSE_ON,
  MOUSE_OFF,
  CLEAR_SCREEN,
  CLEAR_LINE
} from '../constants'

// ============================================================
// Cursor Control
// ============================================================

/**
 * Move cursor to position.
 * @param x - Column (0-indexed)
 * @param y - Row (0-indexed)
 * @returns ANSI escape sequence
 *
 * @example
 * ```typescript
 * process.stdout.write(cursorTo(10, 5))
 * ```
 */
export function cursorTo(x: number, y: number): string {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
    return '' // Return empty string for invalid input
  }
  return `${CSI}${y + 1};${x + 1}H`
}

/**
 * Move cursor up by n rows.
 * @param n - Number of rows
 * @returns ANSI escape sequence
 */
export function cursorUp(n: number = 1): string {
  return `${CSI}${n}A`
}

/**
 * Move cursor down by n rows.
 * @param n - Number of rows
 * @returns ANSI escape sequence
 */
export function cursorDown(n: number = 1): string {
  return `${CSI}${n}B`
}

/**
 * Move cursor forward by n columns.
 * @param n - Number of columns
 * @returns ANSI escape sequence
 */
export function cursorForward(n: number = 1): string {
  return `${CSI}${n}C`
}

/**
 * Move cursor back by n columns.
 * @param n - Number of columns
 * @returns ANSI escape sequence
 */
export function cursorBack(n: number = 1): string {
  return `${CSI}${n}D`
}

/**
 * Hide cursor.
 * @returns ANSI escape sequence
 */
export function cursorHide(): string {
  return CURSOR_HIDE
}

/**
 * Show cursor.
 * @returns ANSI escape sequence
 */
export function cursorShow(): string {
  return CURSOR_SHOW
}

/**
 * Save cursor position.
 * @returns ANSI escape sequence
 */
export function cursorSave(): string {
  return `${ESC}7`
}

/**
 * Restore cursor position.
 * @returns ANSI escape sequence
 */
export function cursorRestore(): string {
  return `${ESC}8`
}

// ============================================================
// Screen Control
// ============================================================

/**
 * Clear entire screen.
 * @returns ANSI escape sequence
 */
export function clearScreen(): string {
  return CLEAR_SCREEN
}

/**
 * Clear current line.
 * @returns ANSI escape sequence
 */
export function clearLine(): string {
  return CLEAR_LINE
}

/**
 * Clear from cursor to end of screen.
 * @returns ANSI escape sequence
 */
export function clearToEnd(): string {
  return `${CSI}0J`
}

/**
 * Clear from cursor to beginning of screen.
 * @returns ANSI escape sequence
 */
export function clearToStart(): string {
  return `${CSI}1J`
}

/**
 * Enter alternate screen buffer.
 * @returns ANSI escape sequence
 */
export function alternateScreen(): string {
  return ALT_SCREEN_ON
}

/**
 * Exit alternate screen buffer.
 * @returns ANSI escape sequence
 */
export function mainScreen(): string {
  return ALT_SCREEN_OFF
}

// ============================================================
// Color Control
// ============================================================

/**
 * Set 24-bit foreground color.
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI escape sequence
 *
 * @example
 * ```typescript
 * process.stdout.write(fgRgb(255, 0, 0) + 'Red text' + reset())
 * ```
 */
export function fgRgb(r: number, g: number, b: number): string {
  return `${CSI}38;2;${r};${g};${b}m`
}

/**
 * Set 24-bit background color.
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI escape sequence
 *
 * @example
 * ```typescript
 * process.stdout.write(bgRgb(0, 0, 255) + 'Blue background' + reset())
 * ```
 */
export function bgRgb(r: number, g: number, b: number): string {
  return `${CSI}48;2;${r};${g};${b}m`
}

/**
 * Set default foreground color.
 * @returns ANSI escape sequence
 */
export function fgDefault(): string {
  return `${CSI}39m`
}

/**
 * Set default background color.
 * @returns ANSI escape sequence
 */
export function bgDefault(): string {
  return `${CSI}49m`
}

/**
 * Convert packed color to foreground ANSI sequence.
 * @param packed - Packed RGBA color
 * @returns ANSI escape sequence
 */
export function packedToFgAnsi(packed: number): string {
  if (!Number.isFinite(packed)) {
    return fgDefault()
  }
  // Use unsigned right shift (>>>) to handle large packed colors correctly
  const r = (packed >>> 24) & 0xff
  const g = (packed >>> 16) & 0xff
  const b = (packed >>> 8) & 0xff
  return fgRgb(r, g, b)
}

/**
 * Convert packed color to background ANSI sequence.
 * @param packed - Packed RGBA color
 * @returns ANSI escape sequence
 */
export function packedToBgAnsi(packed: number): string {
  if (!Number.isFinite(packed)) {
    return bgDefault()
  }
  // Use unsigned right shift (>>>) to handle large packed colors correctly
  const r = (packed >>> 24) & 0xff
  const g = (packed >>> 16) & 0xff
  const b = (packed >>> 8) & 0xff
  const a = packed & 0xff

  // Transparent background
  if (a === 0) {
    return bgDefault()
  }

  return bgRgb(r, g, b)
}

// ============================================================
// Text Attributes
// ============================================================

/**
 * Reset all attributes.
 * @returns ANSI escape sequence
 */
export function reset(): string {
  return RESET
}

/**
 * Enable bold text.
 * @returns ANSI escape sequence
 */
export function bold(): string {
  return `${CSI}1m`
}

/**
 * Enable dim text.
 * @returns ANSI escape sequence
 */
export function dim(): string {
  return `${CSI}2m`
}

/**
 * Enable italic text.
 * @returns ANSI escape sequence
 */
export function italic(): string {
  return `${CSI}3m`
}

/**
 * Enable underline.
 * @returns ANSI escape sequence
 */
export function underline(): string {
  return `${CSI}4m`
}

/**
 * Enable inverse colors.
 * @returns ANSI escape sequence
 */
export function inverse(): string {
  return `${CSI}7m`
}

/**
 * Enable strikethrough.
 * @returns ANSI escape sequence
 */
export function strikethrough(): string {
  return `${CSI}9m`
}

/**
 * Convert attribute flags to ANSI sequence.
 * @param attrs - Attribute flags
 * @returns ANSI escape sequence
 */
export function attrsToAnsi(attrs: number): string {
  if (!Number.isFinite(attrs) || attrs === 0) {
    return ''
  }

  const codes: number[] = []

  if (attrs & 0x01) codes.push(1) // Bold
  if (attrs & 0x08) codes.push(2) // Dim
  if (attrs & 0x02) codes.push(3) // Italic
  if (attrs & 0x04) codes.push(4) // Underline
  if (attrs & 0x20) codes.push(7) // Inverse
  if (attrs & 0x10) codes.push(9) // Strikethrough

  if (codes.length === 0) {
    return ''
  }

  return `${CSI}${codes.join(';')}m`
}

// ============================================================
// Mouse Control
// ============================================================

/**
 * Enable mouse tracking (SGR mode).
 * @returns ANSI escape sequence
 */
export function mouseOn(): string {
  return MOUSE_ON
}

/**
 * Disable mouse tracking.
 * @returns ANSI escape sequence
 */
export function mouseOff(): string {
  return MOUSE_OFF
}

// ============================================================
// Combined ANSI Object
// ============================================================

/**
 * ANSI escape sequence utilities.
 *
 * @example
 * ```typescript
 * import { ANSI } from '@oxog/tui'
 *
 * process.stdout.write(ANSI.cursorTo(0, 0))
 * process.stdout.write(ANSI.fgRgb(255, 0, 0))
 * process.stdout.write('Hello!')
 * process.stdout.write(ANSI.reset())
 * ```
 */
export const ANSI = {
  // Cursor
  cursorTo,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorHide,
  cursorShow,
  cursorSave,
  cursorRestore,

  // Screen
  clearScreen,
  clearLine,
  clearToEnd,
  clearToStart,
  alternateScreen,
  mainScreen,

  // Colors
  fgRgb,
  bgRgb,
  fgDefault,
  bgDefault,
  packedToFgAnsi,
  packedToBgAnsi,

  // Attributes
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  strikethrough,
  attrsToAnsi,

  // Mouse
  mouseOn,
  mouseOff
} as const

// ============================================================
// Alias Exports (for API consistency)
// ============================================================

// Cursor aliases
export const hideCursor = cursorHide
export const showCursor = cursorShow
export const saveCursor = cursorSave
export const restoreCursor = cursorRestore
export const cursorColumn = (x: number): string => `${CSI}${x + 1}G`
export const cursorPosition = cursorTo

// Screen aliases
export const enterAltScreen = alternateScreen
export const exitAltScreen = mainScreen
export const clearToEndOfLine = (): string => `${CSI}0K`
export const clearToEndOfScreen = clearToEnd
export const scrollUp = (n: number = 1): string => `${CSI}${n}S`
export const scrollDown = (n: number = 1): string => `${CSI}${n}T`

// Attribute aliases
export const fgReset = fgDefault
export const bgReset = bgDefault
export const boldOn = bold
export const italicOn = italic
export const underlineOn = underline
export const dimOn = dim
export const inverseOn = inverse
export const allOff = reset

// Mouse aliases
export function enableMouse(sgr: boolean = true): string {
  // Enable mouse tracking
  // 1000 = basic, 1002 = button event tracking, 1006 = SGR extended
  if (sgr) {
    return `${CSI}?1000h${CSI}?1002h${CSI}?1006h`
  }
  return `${CSI}?1000h${CSI}?1002h`
}

export function disableMouse(): string {
  return `${CSI}?1006l${CSI}?1002l${CSI}?1000l`
}

// Terminal title
export function setTitle(title: string): string {
  return `${ESC}]2;${title}\x07`
}

// Bell
export function bell(): string {
  return '\x07'
}

// Bracketed paste mode
export function enableBracketedPaste(): string {
  return `${CSI}?2004h`
}

export function disableBracketedPaste(): string {
  return `${CSI}?2004l`
}

// ============================================================
// ANSI Sanitization
// ============================================================

/**
 * Regex patterns for dangerous ANSI sequences.
 * These can be used for terminal injection attacks.
 * Note: Using non-global regexes to avoid state persistence issues
 */
const DANGEROUS_ANSI_PATTERNS = [
  // Operating System Commands (OSC) - can change terminal title, set clipboard, etc.
  /\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/,
  // Device Control Strings (DCS) - can download fonts, send data to devices
  /\x1bP[^\x1b]*\x1b\\/,
  // Application Program Commands (APC) - application-specific commands
  /\x1b_[^\x1b]*\x1b\\/,
  // Start of String (SOS) - string termination
  /\x1bX[^\x1b]*\x1b\\/,
  // Privacy Message (PM) - privacy-related commands
  /\x1b\^[^\x1b]*\x1b\\/,
  // Single Character Introducer (SCI) - legacy terminal commands
  /\x1bZ/,
  // Reset to Initial State (RIS) - can reset terminal completely
  /\x1bc/,
  // Clear screen and move to home (could be used to hide previous output)
  /\x1b\[2J\x1b\[H/,
  // Window manipulation sequences
  /\x1b\[\d*;\d*;\d*t/
]

/**
 * Safe ANSI patterns that are allowed (colors, cursor movement, attributes).
 */
export const SAFE_ANSI_PATTERN = /\x1b\[[\d;]*[mABCDHJKsu]/g

/**
 * Sanitize a string by removing dangerous ANSI sequences.
 * Keeps safe sequences like colors and cursor movement.
 *
 * @param str - Input string that may contain ANSI sequences
 * @returns Sanitized string with dangerous sequences removed
 *
 * @example
 * ```typescript
 * // Dangerous title change - removed
 * sanitizeAnsi('\x1b]2;Hacked\x07hello')  // 'hello'
 *
 * // Safe color code - kept
 * sanitizeAnsi('\x1b[31mred\x1b[0m')  // '\x1b[31mred\x1b[0m'
 * ```
 */
export function sanitizeAnsi(str: string): string {
  let result = str

  // Remove all dangerous patterns
  for (const pattern of DANGEROUS_ANSI_PATTERNS) {
    result = result.replace(pattern, '')
  }

  return result
}

/**
 * Strip all ANSI sequences from a string.
 * Useful for getting plain text content.
 *
 * @param str - Input string with ANSI sequences
 * @returns Plain text without any ANSI sequences
 *
 * @example
 * ```typescript
 * stripAllAnsi('\x1b[31mred\x1b[0m text')  // 'red text'
 * ```
 */
export function stripAllAnsi(str: string): string {
  // Match all ANSI escape sequences
  return str.replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[P\]X^_][^\x1b]*\x1b\\)/g, '')
}

/**
 * Check if a string contains potentially dangerous ANSI sequences.
 *
 * @param str - Input string to check
 * @returns True if dangerous sequences found
 */
export function hasDangerousAnsi(str: string): boolean {
  for (const pattern of DANGEROUS_ANSI_PATTERNS) {
    // Reset pattern lastIndex since we reuse the regex
    pattern.lastIndex = 0
    if (pattern.test(str)) {
      return true
    }
  }
  return false
}
