/**
 * @oxog/tui - Utilities
 * @packageDocumentation
 */

// ANSI utilities
export {
  ANSI,
  cursorTo,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorHide,
  cursorShow,
  cursorSave,
  cursorRestore,
  clearScreen,
  clearLine,
  clearToEnd,
  clearToStart,
  alternateScreen,
  mainScreen,
  fgRgb,
  bgRgb,
  fgDefault,
  bgDefault,
  packedToFgAnsi,
  packedToBgAnsi,
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  strikethrough,
  attrsToAnsi,
  mouseOn,
  mouseOff,
  // Aliases
  hideCursor,
  showCursor,
  saveCursor,
  restoreCursor,
  cursorColumn,
  cursorPosition,
  enterAltScreen,
  exitAltScreen,
  clearToEndOfLine,
  clearToEndOfScreen,
  scrollUp,
  scrollDown,
  fgReset,
  bgReset,
  boldOn,
  italicOn,
  underlineOn,
  dimOn,
  inverseOn,
  allOff,
  enableMouse,
  disableMouse,
  setTitle,
  bell,
  enableBracketedPaste,
  disableBracketedPaste,
  // ANSI sanitization
  sanitizeAnsi,
  stripAllAnsi,
  hasDangerousAnsi
} from './ansi'

// Color utilities
export {
  packColor,
  unpackColor,
  parseHexColor,
  parseRgbColor,
  parseColor,
  parseColorWithDefault,
  packedToHex,
  packedToRgb,
  packedToRgba,
  isTransparent,
  blendColors,
  lighten,
  darken,
  NAMED_COLORS,
  DEFAULT_FG,
  DEFAULT_BG
} from './color'

// Re-export with aliases
export { packedToHex as colorToHex, parseColor as isValidColor } from './color'

// Unicode utilities
export {
  getCharWidth,
  stringWidth,
  truncateToWidth,
  padToWidth,
  wrapText,
  sliceByWidth,
  // Grapheme cluster support
  splitGraphemes,
  graphemeWidth,
  truncateByGrapheme
} from './unicode'

// Re-export with aliases from unicode
export { padToWidth as padEnd } from './unicode'

// Additional unicode exports
export function padStart(str: string, width: number, char: string = ' '): string {
  const strWidth = stringWidth(str)
  if (strWidth >= width) return str
  return char.repeat(width - strWidth) + str
}

export function padCenter(str: string, width: number, char: string = ' '): string {
  const strWidth = stringWidth(str)
  if (strWidth >= width) return str
  const totalPad = width - strWidth
  const leftPad = Math.floor(totalPad / 2)
  const rightPad = totalPad - leftPad
  return char.repeat(leftPad) + str + char.repeat(rightPad)
}

export function isEmoji(codePoint: number): boolean {
  return (
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) || // Misc symbols
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport
    (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff) || // Flags
    (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) // Dingbats
  )
}

export function isCJK(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Korean
    (codePoint >= 0x3040 && codePoint <= 0x309f) || // Hiragana
    (codePoint >= 0x30a0 && codePoint <= 0x30ff) // Katakana
  )
}

export function isFullWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0xff01 && codePoint <= 0xff60) || // Fullwidth ASCII
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) // Fullwidth symbols
  )
}

export { stripAllAnsi as stripAnsi } from './ansi'

import { stringWidth } from './unicode'

// Border utilities
export {
  getBorderChars,
  drawBorder,
  isOnBorder,
  getBorderCharAt,
  getContentArea,
  getBorderThickness,
  BORDER_CHARS
} from './border'

// Export border styles as an object
export const borderStyles = {
  single: 'single',
  double: 'double',
  rounded: 'rounded',
  bold: 'bold',
  ascii: 'ascii',
  none: 'none'
} as const

export type BorderChars = {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horizontal: string
  vertical: string
}

// Key utilities
export {
  createKeyParser,
  createMouseParser,
  parseKeyAt,
  controlCharName,
  matchKey,
  isPrintable,
  isNavigation,
  keyToString
} from './keys'

// Export parseKeyPattern alias
export function parseKeyPattern(pattern: string): {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
} {
  const parts = pattern.toLowerCase().split('+')
  return {
    key: parts[parts.length - 1] ?? '',
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift')
  }
}

export type { KeyParser, MouseParser } from './keys'

export type ParsedKeyPattern = ReturnType<typeof parseKeyPattern>

// Easing utilities
export {
  // Linear
  linear,
  // Quadratic
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  // Cubic
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  // Quartic
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  // Quintic
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  // Sinusoidal
  easeInSine,
  easeOutSine,
  easeInOutSine,
  // Exponential
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  // Circular
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  // Back (overshoot)
  easeInBack,
  easeOutBack,
  easeInOutBack,
  // Elastic
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  // Bounce
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
  // Spring
  spring,
  createSpring,
  // Utilities
  easingFunctions,
  getEasing,
  interpolate,
  tween
} from './easing'

export type { EasingFunction, EasingName } from './easing'

// Event emitter utilities
export {
  EventEmitter,
  createEventEmitter
} from './events'

export type { EventHandler, EventMap, IEventEmitter } from './events'

// Logger utilities
export {
  LogLevel,
  setLogLevel,
  getLogLevel,
  setLoggingEnabled,
  isLoggingEnabled,
  setLogHandler,
  log,
  logError,
  logWarn,
  logInfo,
  logDebug,
  createLogger
} from './logger'
