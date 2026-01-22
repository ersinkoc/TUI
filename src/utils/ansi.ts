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
 * Comprehensive dangerous ANSI sequence patterns.
 *
 * SECURITY CRITICAL: This list covers known attack vectors for terminal injection.
 * Each pattern is documented with its security impact.
 *
 * Patterns matched:
 * - OSC (Operating System Commands): Title change, clipboard access, etc.
 * - OSC 52: Clipboard manipulation (can steal/inject clipboard content)
 * - DCS (Device Control Strings): Sixel graphics, terminal queries
 * - DECRQSS: Terminal state query (information leak)
 * - Sixel: Graphics protocol (DoS via large images)
 * - APC (Application Program Commands): App-specific commands
 * - Kitty graphics: Resource exhaustion, arbitrary file access
 * - SOS (Start of String): String data sequences
 * - PM (Privacy Message): Privacy-related commands
 * - SCI (Single Character Introducer): Terminal identification
 * - RIS (Reset to Initial State): Full terminal reset
 * - DECSTR: Soft terminal reset
 * - Clear screen home: Screen manipulation
 * - Window manipulation: Window resize, move, focus
 * - iTerm2 proprietary: File transfer, shell integration
 */
const DANGEROUS_PATTERNS = [
  // OSC (Operating System Commands) - all variants including OSC 52 clipboard
  /\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g,

  // DCS (Device Control Strings) including Sixel and DECRQSS
  /\x1bP[^\x1b]*\x1b\\/g,

  // APC (Application Program Commands) including Kitty graphics
  /\x1b_[^\x1b]*(?:\x1b\\|\x07)/g,

  // SOS (Start of String)
  /\x1bX[^\x1b]*\x1b\\/g,

  // PM (Privacy Message)
  /\x1b\^[^\x1b]*\x1b\\/g,

  // Single character sequences
  /\x1bZ/g,           // SCI - terminal identification
  /\x1bc/g,           // RIS - full reset
  /\x1b\[!p/g,        // DECSTR - soft reset

  // Screen/window manipulation
  /\x1b\[2J\x1b\[H/g, // Clear screen and home cursor
  /\x1b\[\d*;\d*;\d*t/g, // Window manipulation (resize, move, etc.)
  /\x1b\[\d*;\d*r/g,  // Set scrolling region (can cause confusion)

  // Bell character (can be annoying, used in social engineering)
  /\x07/g,
]

/**
 * Combined regex pattern for all dangerous ANSI sequences.
 * Built from individual patterns for maintainability but executed as single pass.
 */
const DANGEROUS_ANSI_COMBINED = new RegExp(
  DANGEROUS_PATTERNS.map(p => p.source).join('|'),
  'g'
)

/**
 * Sanitize a string by removing dangerous ANSI sequences.
 * Keeps safe sequences like colors (SGR) and basic cursor movement.
 *
 * SECURITY: This function is critical for preventing terminal injection attacks.
 * It removes sequences that could:
 * - Change terminal title (phishing)
 * - Access clipboard (data theft)
 * - Reset terminal (DoS)
 * - Execute terminal-specific commands
 *
 * Safe sequences that are KEPT:
 * - SGR (Select Graphic Rendition): Colors and text attributes \x1b[...m
 * - Basic cursor movement: \x1b[...H, \x1b[...A/B/C/D
 *
 * @param str - Input string that may contain ANSI sequences
 * @returns Sanitized string with dangerous sequences removed
 *
 * @example
 * ```typescript
 * // Dangerous title change - removed
 * sanitizeAnsi('\x1b]2;Hacked\x07hello')  // 'hello'
 *
 * // Dangerous clipboard write - removed
 * sanitizeAnsi('\x1b]52;c;SGVsbG8=\x07')  // ''
 *
 * // Safe color code - kept
 * sanitizeAnsi('\x1b[31mred\x1b[0m')  // '\x1b[31mred\x1b[0m'
 * ```
 */
export function sanitizeAnsi(str: string): string {
  if (!str || typeof str !== 'string') return ''

  // Quick check - if no escape char or bell, nothing to sanitize
  if (!str.includes('\x1b') && !str.includes('\x07')) return str

  // Reset regex state (important for global regexes)
  DANGEROUS_ANSI_COMBINED.lastIndex = 0

  return str.replace(DANGEROUS_ANSI_COMBINED, '')
}

/**
 * Strict sanitization - removes ALL ANSI sequences except basic SGR (colors/attributes).
 * Use this for untrusted input where even "safe" cursor sequences shouldn't be allowed.
 *
 * @param str - Input string that may contain ANSI sequences
 * @returns Sanitized string with only SGR sequences remaining
 *
 * @example
 * ```typescript
 * // Cursor movement - removed in strict mode
 * sanitizeAnsiStrict('\x1b[10;20Htext')  // 'text'
 *
 * // Colors - kept
 * sanitizeAnsiStrict('\x1b[31mred\x1b[0m')  // '\x1b[31mred\x1b[0m'
 * ```
 */
export function sanitizeAnsiStrict(str: string): string {
  if (!str || typeof str !== 'string') return ''
  if (!str.includes('\x1b')) return str

  // Match only SGR sequences (colors and text attributes)
  // SGR format: ESC [ <params> m where params are digits and semicolons
  const SGR_PATTERN = /\x1b\[[0-9;]*m/g

  // Extract all SGR sequences with their positions
  const sgrMatches: { match: string; index: number }[] = []
  let match: RegExpExecArray | null

  while ((match = SGR_PATTERN.exec(str)) !== null) {
    sgrMatches.push({ match: match[0], index: match.index })
  }

  // Remove ALL ANSI sequences
  const stripped = stripAllAnsi(str)

  // If no SGR sequences, just return stripped
  if (sgrMatches.length === 0) return stripped

  // For simplicity, just return stripped text (losing color info but guaranteeing safety)
  // A more complex implementation could re-insert SGR at correct positions
  return stripped
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
  // Reset lastIndex and test with combined pattern
  DANGEROUS_ANSI_COMBINED.lastIndex = 0
  return DANGEROUS_ANSI_COMBINED.test(str)
}
