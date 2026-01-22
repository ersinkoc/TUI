/**
 * @oxog/tui - Color Utilities
 * @packageDocumentation
 */

import { NAMED_COLORS, DEFAULT_FG, DEFAULT_BG } from '../constants'

// ============================================================
// Color Packing/Unpacking
// ============================================================

/**
 * Pack RGBA values into a 32-bit integer.
 * Format: 0xRRGGBBAA
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @param a - Alpha (0-255), defaults to 255
 * @returns Packed color integer
 *
 * @example
 * ```typescript
 * const red = packColor(255, 0, 0)
 * const semiTransparent = packColor(255, 0, 0, 128)
 * ```
 */
export function packColor(r: number, g: number, b: number, a: number = 255): number {
  // Use bitwise masking to handle values outside 0-255 range
  // This ensures that values like 256 are wrapped to 0, 257 to 1, etc.
  r = r | 0
  g = g | 0
  b = b | 0
  a = a | 0

  // Use >>> 0 to convert to unsigned 32-bit integer
  return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0
}

/**
 * Unpack a 32-bit color integer to RGBA values.
 *
 * @param packed - Packed color integer
 * @returns Tuple of [r, g, b, a]
 *
 * @example
 * ```typescript
 * const [r, g, b, a] = unpackColor(0xff0000ff)
 * // r=255, g=0, b=0, a=255
 * ```
 */
export function unpackColor(packed: number): [number, number, number, number] {
  // Use >>> for unsigned right shift to handle large values correctly
  return [(packed >>> 24) & 0xff, (packed >>> 16) & 0xff, (packed >>> 8) & 0xff, packed & 0xff]
}

// ============================================================
// Color Parsing
// ============================================================

/**
 * Parse a hex color string to packed integer.
 *
 * @param hex - Hex color string (#fff, #ffffff, #ffffffff)
 * @returns Packed color integer or null if invalid
 *
 * @example
 * ```typescript
 * parseHexColor('#ff0000')  // 0xff0000ff
 * parseHexColor('#f00')     // 0xff0000ff
 * parseHexColor('#ff000080') // 0xff000080
 * ```
 */
export function parseHexColor(hex: string): number | null {
  if (!hex || typeof hex !== 'string') {
    return null
  }

  // Remove # prefix
  const h = hex.startsWith('#') ? hex.slice(1) : hex

  // Validate hex characters and non-empty string
  if (h.length === 0 || !/^[0-9a-fA-F]*$/.test(h)) {
    return null
  }

  let r: number
  let g: number
  let b: number
  let a = 255

  if (h.length === 3) {
    // #RGB -> #RRGGBB
    r = parseInt(h[0]! + h[0]!, 16)
    g = parseInt(h[1]! + h[1]!, 16)
    b = parseInt(h[2]! + h[2]!, 16)
  } else if (h.length === 4) {
    // #RGBA -> #RRGGBBAA
    r = parseInt(h[0]! + h[0]!, 16)
    g = parseInt(h[1]! + h[1]!, 16)
    b = parseInt(h[2]! + h[2]!, 16)
    a = parseInt(h[3]! + h[3]!, 16)
  } else if (h.length === 6) {
    // #RRGGBB
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  } else if (h.length === 8) {
    // #RRGGBBAA
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
    a = parseInt(h.slice(6, 8), 16)
  } else {
    return null
  }

  // Validate parsed values
  if (
    isNaN(r) ||
    r < 0 ||
    r > 255 ||
    isNaN(g) ||
    g < 0 ||
    g > 255 ||
    isNaN(b) ||
    b < 0 ||
    b > 255 ||
    isNaN(a) ||
    a < 0 ||
    a > 255
  ) {
    return null
  }

  return packColor(r, g, b, a)
}

/**
 * Parse an RGB/RGBA color string to packed integer.
 *
 * @param rgb - RGB color string (rgb(255,0,0) or rgba(255,0,0,0.5))
 * @returns Packed color integer or null if invalid
 *
 * @example
 * ```typescript
 * parseRgbColor('rgb(255, 0, 0)')      // 0xff0000ff
 * parseRgbColor('rgba(255, 0, 0, 0.5)') // 0xff000080
 * ```
 */
export function parseRgbColor(rgb: string): number | null {
  if (!rgb || typeof rgb !== 'string') {
    return null
  }

  // Check for percentage notation first: rgba(r,g,b, a%)
  const percentMatch = rgb.match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+)%)\s*\)$/i
  )

  if (percentMatch) {
    const r = parseInt(percentMatch[1]!, 10)
    const g = parseInt(percentMatch[2]!, 10)
    const b = parseInt(percentMatch[3]!, 10)
    const alphaPercent = parseFloat(percentMatch[4]!)

    if (isNaN(alphaPercent)) {
      return null
    }

    // Percentage format: alpha is 0-100
    const a = Math.round((alphaPercent / 100) * 255)

    // Check for NaN values
    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
      return null
    }

    // Clamp values to 0-255 range
    const clampedR = Math.max(0, Math.min(255, r))
    const clampedG = Math.max(0, Math.min(255, g))
    const clampedB = Math.max(0, Math.min(255, b))
    const clampedA = Math.max(0, Math.min(255, a))

    return packColor(clampedR, clampedG, clampedB, clampedA)
  }

  // Match rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = rgb.match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  )

  if (!rgbMatch) {
    return null
  }

  const r = parseInt(rgbMatch[1]!, 10)
  const g = parseInt(rgbMatch[2]!, 10)
  const b = parseInt(rgbMatch[3]!, 10)
  let a = 255

  if (rgbMatch[4] !== undefined) {
    const alphaStr = rgbMatch[4]!
    const alpha = parseFloat(alphaStr)

    if (isNaN(alpha)) {
      return null
    }

    // Disambiguate alpha format:
    // - If string contains decimal point AND value <= 1: decimal format (0.0-1.0)
    // - Otherwise: direct format (0-255)
    // This correctly handles: 1.0 -> 255, 1 -> 1, 0.5 -> 128
    const hasDecimalPoint = alphaStr.includes('.')

    if (hasDecimalPoint && alpha <= 1) {
      // Decimal format: 0.0-1.0 -> 0-255
      a = Math.round(alpha * 255)
    } else if (alpha <= 255) {
      // Direct format: 0-255
      a = Math.round(alpha)
    } else {
      // Values > 255 are clamped
      a = 255
    }
  }

  // Check for NaN values (return null for invalid numbers)
  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    return null
  }

  // Clamp values to 0-255 range (instead of returning null)
  const clampedR = Math.max(0, Math.min(255, r))
  const clampedG = Math.max(0, Math.min(255, g))
  const clampedB = Math.max(0, Math.min(255, b))
  const clampedA = Math.max(0, Math.min(255, a))

  return packColor(clampedR, clampedG, clampedB, clampedA)
}

/**
 * Maximum color string length to prevent ReDoS attacks.
 * @internal
 */
const MAX_COLOR_STRING_LENGTH = 64

/**
 * Safely check if a key exists in NAMED_COLORS without prototype pollution.
 * Prevents attacks using '__proto__', 'constructor', etc.
 * @internal
 */
function getNamedColor(name: string): number | undefined {
  // Reject prototype pollution attempts
  if (name === '__proto__' || name === 'constructor' || name === 'prototype') {
    return undefined
  }
  if (!Object.prototype.hasOwnProperty.call(NAMED_COLORS, name)) {
    return undefined
  }
  return NAMED_COLORS[name]
}

/**
 * Parse any color string to packed integer.
 *
 * @param value - Color string (hex, rgb, or named)
 * @returns Packed color integer or null if invalid
 *
 * @example
 * ```typescript
 * parseColor('#ff0000')        // 0xff0000ff
 * parseColor('rgb(255, 0, 0)') // 0xff0000ff
 * parseColor('red')            // 0xff0000ff
 * parseColor('transparent')    // 0x00000000
 * ```
 */
export function parseColor(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null
  }

  // ReDoS prevention: reject overly long strings
  if (value.length > MAX_COLOR_STRING_LENGTH) {
    return null
  }

  const trimmed = value.trim().toLowerCase()

  // Check named colors first (with prototype pollution protection)
  const namedColor = getNamedColor(trimmed)
  if (namedColor !== undefined) {
    return namedColor
  }

  // Try hex format
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed)
  }

  // Try rgb/rgba format
  if (trimmed.startsWith('rgb')) {
    return parseRgbColor(trimmed)
  }

  return null
}

/**
 * Parse color with fallback to default.
 *
 * @param value - Color string
 * @param defaultColor - Default color if parsing fails
 * @returns Packed color integer
 */
export function parseColorWithDefault(value: string | undefined, defaultColor: number): number {
  if (!value) {
    return defaultColor
  }

  const parsed = parseColor(value)
  return parsed ?? defaultColor
}

// ============================================================
// Color Conversion
// ============================================================

/**
 * Convert packed color to hex string.
 *
 * @param packed - Packed color integer
 * @param includeAlpha - Include alpha channel
 * @returns Hex color string
 *
 * @example
 * ```typescript
 * packedToHex(0xff0000ff)       // '#ff0000'
 * packedToHex(0xff000080, true) // '#ff000080'
 * ```
 */
export function packedToHex(packed: number, includeAlpha: boolean = false): string {
  const [r, g, b, a] = unpackColor(packed)

  const hex =
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')

  if (includeAlpha) {
    return hex + a.toString(16).padStart(2, '0')
  }

  return hex
}

/**
 * Convert packed color to RGB string.
 *
 * @param packed - Packed color integer
 * @returns RGB color string
 *
 * @example
 * ```typescript
 * packedToRgb(0xff0000ff) // 'rgb(255, 0, 0)'
 * ```
 */
export function packedToRgb(packed: number): string {
  if (!Number.isFinite(packed)) {
    return 'rgb(0, 0, 0)'
  }
  const [r, g, b] = unpackColor(packed)
  // Handle potential NaN values from unpacking
  const rr = isNaN(r) ? 0 : Math.max(0, Math.min(255, r))
  const gg = isNaN(g) ? 0 : Math.max(0, Math.min(255, g))
  const bb = isNaN(b) ? 0 : Math.max(0, Math.min(255, b))
  return `rgb(${rr}, ${gg}, ${bb})`
}

/**
 * Convert packed color to RGBA string.
 *
 * @param packed - Packed color integer
 * @returns RGBA color string
 *
 * @example
 * ```typescript
 * packedToRgba(0xff000080) // 'rgba(255, 0, 0, 0.5)'
 * ```
 */
export function packedToRgba(packed: number): string {
  if (!Number.isFinite(packed)) {
    return 'rgba(0, 0, 0, 0)'
  }
  const [r, g, b, a] = unpackColor(packed)
  // Handle potential NaN values from unpacking
  const rr = isNaN(r) ? 0 : Math.max(0, Math.min(255, r))
  const gg = isNaN(g) ? 0 : Math.max(0, Math.min(255, g))
  const bb = isNaN(b) ? 0 : Math.max(0, Math.min(255, b))
  const aa = isNaN(a) ? 0 : Math.max(0, Math.min(255, a))
  // Format alpha to 2 decimal places, removing trailing zeros but keeping at least one digit
  const alpha = (aa / 255).toFixed(2).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')
  return `rgba(${rr}, ${gg}, ${bb}, ${alpha})`
}

// ============================================================
// Color Utilities
// ============================================================

/**
 * Check if a packed color is transparent.
 *
 * @param packed - Packed color integer
 * @returns True if alpha is 0
 */
export function isTransparent(packed: number): boolean {
  return (packed & 0xff) === 0
}

/**
 * Blend two colors together.
 *
 * @param fg - Foreground color (packed)
 * @param bg - Background color (packed)
 * @returns Blended color (packed)
 */
export function blendColors(fg: number, bg: number): number {
  const [fgR, fgG, fgB, fgA] = unpackColor(fg)
  const [bgR, bgG, bgB, bgA] = unpackColor(bg)

  const alpha = fgA / 255
  const invAlpha = 1 - alpha

  const r = Math.round(fgR * alpha + bgR * invAlpha)
  const g = Math.round(fgG * alpha + bgG * invAlpha)
  const b = Math.round(fgB * alpha + bgB * invAlpha)
  const a = Math.round(fgA + bgA * invAlpha)

  return packColor(r, g, b, a)
}

/**
 * Lighten a color.
 *
 * @param packed - Packed color integer
 * @param amount - Amount to lighten (0-1)
 * @returns Lightened color (packed)
 */
export function lighten(packed: number, amount: number): number {
  if (!Number.isFinite(packed) || !Number.isFinite(amount)) {
    return packed
  }
  const [r, g, b, a] = unpackColor(packed)
  // Clamp amount to reasonable range
  const clampedAmount = Math.max(0, Math.min(1, amount))
  const factor = 1 + clampedAmount

  return packColor(
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor)),
    a
  )
}

/**
 * Darken a color.
 *
 * @param packed - Packed color integer
 * @param amount - Amount to darken (0-1)
 * @returns Darkened color (packed)
 */
export function darken(packed: number, amount: number): number {
  if (!Number.isFinite(packed) || !Number.isFinite(amount)) {
    return packed
  }
  const [r, g, b, a] = unpackColor(packed)
  // Clamp amount to reasonable range
  const clampedAmount = Math.max(0, Math.min(1, amount))
  const factor = 1 - clampedAmount

  return packColor(
    Math.max(0, Math.round(r * factor)),
    Math.max(0, Math.round(g * factor)),
    Math.max(0, Math.round(b * factor)),
    a
  )
}

// ============================================================
// Exports
// ============================================================

export { NAMED_COLORS, DEFAULT_FG, DEFAULT_BG }
