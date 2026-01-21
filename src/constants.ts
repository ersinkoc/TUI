/**
 * @oxog/tui - Constants
 * @packageDocumentation
 */

import type { Theme, BorderChars } from './types'

// ============================================================
// Attribute Flags
// ============================================================

/** Bold text attribute flag */
export const ATTR_BOLD = 1 << 0 // 0x01

/** Italic text attribute flag */
export const ATTR_ITALIC = 1 << 1 // 0x02

/** Underline text attribute flag */
export const ATTR_UNDERLINE = 1 << 2 // 0x04

/** Dim text attribute flag */
export const ATTR_DIM = 1 << 3 // 0x08

/** Strikethrough text attribute flag */
export const ATTR_STRIKETHROUGH = 1 << 4 // 0x10

/** Inverse colors attribute flag */
export const ATTR_INVERSE = 1 << 5 // 0x20

// ============================================================
// Default Values
// ============================================================

/** Default frames per second */
export const DEFAULT_FPS = 30

/** Default foreground color (white) */
export const DEFAULT_FG = 0xffffffff

/** Default background color (transparent) */
export const DEFAULT_BG = 0x00000000

/** Empty cell character */
export const EMPTY_CHAR = ' '

// ============================================================
// Border Characters
// ============================================================

/**
 * Border character sets for different styles.
 */
export const BORDER_CHARS: Record<Exclude<import('./types').BorderStyle, 'none'>, BorderChars> = {
  single: {
    topLeft: '\u250c',
    topRight: '\u2510',
    bottomLeft: '\u2514',
    bottomRight: '\u2518',
    horizontal: '\u2500',
    vertical: '\u2502'
  },
  double: {
    topLeft: '\u2554',
    topRight: '\u2557',
    bottomLeft: '\u255a',
    bottomRight: '\u255d',
    horizontal: '\u2550',
    vertical: '\u2551'
  },
  rounded: {
    topLeft: '\u256d',
    topRight: '\u256e',
    bottomLeft: '\u2570',
    bottomRight: '\u256f',
    horizontal: '\u2500',
    vertical: '\u2502'
  },
  bold: {
    topLeft: '\u250f',
    topRight: '\u2513',
    bottomLeft: '\u2517',
    bottomRight: '\u251b',
    horizontal: '\u2501',
    vertical: '\u2503'
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|'
  }
}

// ============================================================
// Named Colors
// ============================================================

/**
 * Named color values as packed RGBA integers.
 */
export const NAMED_COLORS: Record<string, number> = {
  black: 0x000000ff,
  red: 0xff0000ff,
  green: 0x00ff00ff,
  yellow: 0xffff00ff,
  blue: 0x0000ffff,
  magenta: 0xff00ffff,
  cyan: 0x00ffffff,
  white: 0xffffffff,
  gray: 0x808080ff,
  grey: 0x808080ff,
  transparent: 0x00000000
}

// ============================================================
// Default Theme
// ============================================================

/**
 * Default dark theme.
 *
 * @example
 * ```typescript
 * const app = tui({ theme: DEFAULT_THEME })
 * ```
 */
export const DEFAULT_THEME: Theme = {
  colors: {
    primary: '#00ff88',
    secondary: '#0088ff',
    background: '#1a1a2e',
    surface: '#252542',
    text: '#ffffff',
    textMuted: '#888888',
    border: '#444466',
    error: '#ff4444',
    warning: '#ffaa00',
    success: '#00ff88',
    info: '#0088ff',
    inputBg: '#252542',
    inputBorder: '#444466',
    inputFocusBorder: '#00ff88',
    selectHighlight: '#00ff88',
    tableHeaderBg: '#333355',
    tableStripeBg: '#1f1f35'
  },
  borders: {
    default: 'rounded',
    focus: 'double',
    input: 'single'
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16
  }
}

// ============================================================
// Spinner Frames
// ============================================================

/**
 * Default spinner animation frames.
 */
export const SPINNER_FRAMES = {
  dots: [
    '\u280b',
    '\u2819',
    '\u2839',
    '\u2838',
    '\u283c',
    '\u2834',
    '\u2826',
    '\u2827',
    '\u2807',
    '\u280f'
  ],
  line: ['-', '\\', '|', '/'],
  arc: ['\u25dc', '\u25e0', '\u25dd', '\u25de'],
  circle: ['\u25cb', '\u25d4', '\u25d1', '\u25d5', '\u25cf', '\u25d5', '\u25d1', '\u25d4'],
  bounce: ['\u2801', '\u2802', '\u2804', '\u2840', '\u2880', '\u2820', '\u2810', '\u2808']
}

/** Default spinner frame set */
export const DEFAULT_SPINNER_FRAMES = SPINNER_FRAMES.dots

/** Default spinner interval in milliseconds */
export const DEFAULT_SPINNER_INTERVAL = 80

// ============================================================
// Progress Bar
// ============================================================

/** Default progress bar filled character */
export const PROGRESS_FILLED = '\u2588'

/** Default progress bar empty character */
export const PROGRESS_EMPTY = '\u2591'

// ============================================================
// Key Names
// ============================================================

/**
 * Control character to key name mapping.
 */
export const CONTROL_CHAR_NAMES: Record<number, string> = {
  0: 'c-@',
  1: 'c-a',
  2: 'c-b',
  3: 'c-c',
  4: 'c-d',
  5: 'c-e',
  6: 'c-f',
  7: 'c-g',
  8: 'backspace',
  9: 'tab',
  10: 'enter',
  11: 'c-k',
  12: 'c-l',
  13: 'enter',
  14: 'c-n',
  15: 'c-o',
  16: 'c-p',
  17: 'c-q',
  18: 'c-r',
  19: 'c-s',
  20: 'c-t',
  21: 'c-u',
  22: 'c-v',
  23: 'c-w',
  24: 'c-x',
  25: 'c-y',
  26: 'c-z',
  27: 'escape',
  28: 'c-\\',
  29: 'c-]',
  30: 'c-^',
  31: 'c-_',
  127: 'backspace'
}

/**
 * CSI final byte to key name mapping.
 */
export const CSI_KEY_NAMES: Record<string, string> = {
  A: 'up',
  B: 'down',
  C: 'right',
  D: 'left',
  H: 'home',
  F: 'end',
  Z: 'shift-tab'
}

/**
 * CSI parameter to key name mapping.
 */
export const CSI_PARAM_KEY_NAMES: Record<string, string> = {
  '2': 'insert',
  '3': 'delete',
  '5': 'pageup',
  '6': 'pagedown',
  '11': 'f1',
  '12': 'f2',
  '13': 'f3',
  '14': 'f4',
  '15': 'f5',
  '17': 'f6',
  '18': 'f7',
  '19': 'f8',
  '20': 'f9',
  '21': 'f10',
  '23': 'f11',
  '24': 'f12'
}

/**
 * SS3 final byte to key name mapping.
 */
export const SS3_KEY_NAMES: Record<string, string> = {
  P: 'f1',
  Q: 'f2',
  R: 'f3',
  S: 'f4',
  H: 'home',
  F: 'end'
}

// ============================================================
// ANSI Escape Sequences
// ============================================================

/** ESC character */
export const ESC = '\x1b'

/** CSI (Control Sequence Introducer) */
export const CSI = `${ESC}[`

/** SS3 (Single Shift 3) */
export const SS3 = `${ESC}O`

/** Reset all attributes */
export const RESET = `${CSI}0m`

/** Hide cursor */
export const CURSOR_HIDE = `${CSI}?25l`

/** Show cursor */
export const CURSOR_SHOW = `${CSI}?25h`

/** Enter alternate screen */
export const ALT_SCREEN_ON = `${CSI}?1049h`

/** Exit alternate screen */
export const ALT_SCREEN_OFF = `${CSI}?1049l`

/** Enable mouse tracking (SGR mode) */
export const MOUSE_ON = `${CSI}?1000h${CSI}?1006h`

/** Disable mouse tracking */
export const MOUSE_OFF = `${CSI}?1000l${CSI}?1006l`

/** Clear entire screen */
export const CLEAR_SCREEN = `${CSI}2J`

/** Clear current line */
export const CLEAR_LINE = `${CSI}2K`

// ============================================================
// Widget Defaults
// ============================================================

/** Minimum width for modal dialogs */
export const MODAL_MIN_WIDTH = 20

/** Minimum height for modal dialogs */
export const MODAL_MIN_HEIGHT = 5

/** Modal margin from screen edges */
export const MODAL_MARGIN_X = 4
export const MODAL_MARGIN_Y = 2

/** Default modal width ratio (0.6 = 60% of screen) */
export const MODAL_DEFAULT_WIDTH_RATIO = 0.6

/** Default modal height ratio (0.4 = 40% of screen) */
export const MODAL_DEFAULT_HEIGHT_RATIO = 0.4

/** Default list page size for keyboard navigation */
export const LIST_DEFAULT_PAGE_SIZE = 10

/** Default tree indentation width */
export const TREE_DEFAULT_INDENT = 2

/** Default scrollbar minimum thumb size */
export const SCROLLBAR_MIN_THUMB_SIZE = 1

/** Default input cursor blink interval in ms */
export const INPUT_CURSOR_BLINK_INTERVAL = 530

/** Maximum navigation history size */
export const ROUTER_MAX_HISTORY_SIZE = 50

/** Maximum redirect depth to prevent infinite loops */
export const ROUTER_MAX_REDIRECT_DEPTH = 10

/** Maximum route pattern cache size */
export const ROUTER_MAX_CACHE_SIZE = 100
