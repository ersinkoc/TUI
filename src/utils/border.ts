/**
 * @oxog/tui - Border Utilities
 * @packageDocumentation
 */

import type { BorderStyle, BorderChars } from '../types'
import { BORDER_CHARS } from '../constants'

/**
 * Get border characters for a style.
 *
 * @param style - Border style
 * @returns Border character set or undefined for 'none'
 *
 * @example
 * ```typescript
 * const chars = getBorderChars('rounded')
 * // { topLeft: '╭', topRight: '╮', ... }
 * ```
 */
export function getBorderChars(style: BorderStyle): BorderChars | undefined {
  if (style === 'none') {
    return undefined
  }
  return BORDER_CHARS[style]
}

/**
 * Draw a border box to buffer.
 *
 * @param options - Border drawing options
 * @returns Array of strings representing the border
 *
 * @example
 * ```typescript
 * const lines = drawBorder({
 *   width: 10,
 *   height: 5,
 *   style: 'rounded',
 *   title: 'Box'
 * })
 * ```
 */
export function drawBorder(options: {
  width: number
  height: number
  style: BorderStyle
  title?: string
}): string[] {
  const { width, height, style, title } = options

  if (style === 'none' || width < 2 || height < 2) {
    return []
  }

  const chars = BORDER_CHARS[style]
  const lines: string[] = []

  // Top border
  let top = chars.topLeft
  if (title && width > 4) {
    const maxTitleLen = width - 4
    const truncatedTitle = title.slice(0, maxTitleLen)
    const remaining = width - 2 - truncatedTitle.length
    top += truncatedTitle + chars.horizontal.repeat(remaining) + chars.topRight
  } else {
    top += chars.horizontal.repeat(width - 2) + chars.topRight
  }
  lines.push(top)

  // Middle rows
  const middleRow = chars.vertical + ' '.repeat(width - 2) + chars.vertical
  for (let i = 1; i < height - 1; i++) {
    lines.push(middleRow)
  }

  // Bottom border
  const bottom = chars.bottomLeft + chars.horizontal.repeat(width - 2) + chars.bottomRight
  lines.push(bottom)

  return lines
}

/**
 * Check if a position is on the border.
 *
 * @param x - X position
 * @param y - Y position
 * @param width - Total width
 * @param height - Total height
 * @param style - Border style
 * @returns True if position is on border
 */
export function isOnBorder(
  x: number,
  y: number,
  width: number,
  height: number,
  style: BorderStyle
): boolean {
  if (style === 'none') {
    return false
  }

  return x === 0 || x === width - 1 || y === 0 || y === height - 1
}

/**
 * Get border character at position.
 *
 * @param x - X position relative to box
 * @param y - Y position relative to box
 * @param width - Box width
 * @param height - Box height
 * @param style - Border style
 * @returns Border character or undefined
 */
export function getBorderCharAt(
  x: number,
  y: number,
  width: number,
  height: number,
  style: BorderStyle
): string | undefined {
  if (style === 'none') {
    return undefined
  }

  const chars = BORDER_CHARS[style]

  // Corners
  if (x === 0 && y === 0) return chars.topLeft
  if (x === width - 1 && y === 0) return chars.topRight
  if (x === 0 && y === height - 1) return chars.bottomLeft
  if (x === width - 1 && y === height - 1) return chars.bottomRight

  // Edges
  if (y === 0 || y === height - 1) return chars.horizontal
  if (x === 0 || x === width - 1) return chars.vertical

  return undefined
}

/**
 * Calculate content area inside border.
 *
 * @param width - Total width
 * @param height - Total height
 * @param style - Border style
 * @returns Content area dimensions
 */
export function getContentArea(
  width: number,
  height: number,
  style: BorderStyle
): { x: number; y: number; width: number; height: number } {
  if (style === 'none') {
    return { x: 0, y: 0, width, height }
  }

  return {
    x: 1,
    y: 1,
    width: Math.max(0, width - 2),
    height: Math.max(0, height - 2)
  }
}

/**
 * Get border thickness.
 *
 * @param style - Border style
 * @returns Border thickness (0 or 1)
 */
export function getBorderThickness(style: BorderStyle): number {
  return style === 'none' ? 0 : 1
}

// Re-export from constants
export { BORDER_CHARS }
