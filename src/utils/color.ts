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
  // Use >>> 0 to convert to unsigned 32-bit integer
  // This prevents negative values when r >= 128 (e.g., 255 << 24 would be -16777216 without this)
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
  // Remove # prefix
  const h = hex.startsWith('#') ? hex.slice(1) : hex

  let r: number,
    g: number,
    b: number,
    a: number = 255

  if (h.length === 3) {
    // #RGB -> #RRGGBB
    r = parseInt(h[0]! + h[0], 16)
    g = parseInt(h[1]! + h[1], 16)
    b = parseInt(h[2]! + h[2], 16)
  } else if (h.length === 4) {
    // #RGBA -> #RRGGBBAA
    r = parseInt(h[0]! + h[0], 16)
    g = parseInt(h[1]! + h[1], 16)
    b = parseInt(h[2]! + h[2], 16)
    a = parseInt(h[3]! + h[3], 16)
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

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
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
    const alpha = parseFloat(rgbMatch[4])
    // If alpha is 0-1, convert to 0-255
    a = alpha <= 1 ? Math.round(alpha * 255) : Math.round(alpha)
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    return null
  }

  return packColor(
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
    Math.max(0, Math.min(255, a))
  )
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
  if (!value) {
    return null
  }

  const trimmed = value.trim().toLowerCase()

  // Check named colors first
  if (trimmed in NAMED_COLORS) {
    return NAMED_COLORS[trimmed]!
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
  const [r, g, b] = unpackColor(packed)
  return `rgb(${r}, ${g}, ${b})`
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
  const [r, g, b, a] = unpackColor(packed)
  const alpha = (a / 255).toFixed(2).replace(/\.?0+$/, '')
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
  const [r, g, b, a] = unpackColor(packed)
  const factor = 1 + amount

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
  const [r, g, b, a] = unpackColor(packed)
  const factor = 1 - amount

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
