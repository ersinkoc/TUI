/**
 * @oxog/tui - Render Buffer
 * @packageDocumentation
 */

import type { Buffer, Cell, CellStyle } from '../types'
import { DEFAULT_FG, DEFAULT_BG, EMPTY_CHAR } from '../constants'
import { getCharWidth } from '../utils/unicode'

// ============================================================
// Buffer Implementation
// ============================================================

/**
 * Create a render buffer.
 *
 * @param width - Buffer width
 * @param height - Buffer height
 * @returns Buffer instance
 *
 * @example
 * ```typescript
 * const buffer = createBuffer(80, 24)
 * buffer.write(0, 0, 'Hello', { fg: 0xff0000ff })
 * ```
 */
export function createBuffer(width: number, height: number): Buffer {
  let w = Math.max(1, Math.floor(width))
  let h = Math.max(1, Math.floor(height))
  let cells: Cell[] = createEmptyCells(w, h)

  return {
    get width() {
      return w
    },

    get height() {
      return h
    },

    get cells(): readonly Cell[] {
      return cells
    },

    get(x: number, y: number): Cell | undefined {
      if (x < 0 || x >= w || y < 0 || y >= h) {
        return undefined
      }
      return cells[y * w + x]
    },

    set(x: number, y: number, cell: Cell): void {
      if (x < 0 || x >= w || y < 0 || y >= h) {
        return
      }
      cells[y * w + x] = cell
    },

    write(x: number, y: number, text: string, style: CellStyle): void {
      if (y < 0 || y >= h) {
        return
      }

      const fg = style.fg ?? DEFAULT_FG
      const bg = style.bg ?? DEFAULT_BG
      const attrs = style.attrs ?? 0

      let col = x
      for (const char of text) {
        if (col >= w) break

        const charWidth = getCharWidth(char)

        if (col >= 0) {
          cells[y * w + col] = {
            char,
            fg,
            bg,
            attrs
          }

          // For wide characters, fill next cell with empty space marker
          if (charWidth === 2 && col + 1 < w) {
            cells[y * w + col + 1] = {
              char: '',
              fg,
              bg,
              attrs
            }
          }
        }

        col += charWidth
      }
    },

    fill(x: number, y: number, fillWidth: number, fillHeight: number, cell: Cell): void {
      const startX = Math.max(0, x)
      const startY = Math.max(0, y)
      const endX = Math.min(w, x + fillWidth)
      const endY = Math.min(h, y + fillHeight)

      for (let row = startY; row < endY; row++) {
        for (let col = startX; col < endX; col++) {
          cells[row * w + col] = { ...cell }
        }
      }
    },

    clear(): void {
      cells = createEmptyCells(w, h)
    },

    resize(newWidth: number, newHeight: number): void {
      const nw = Math.max(1, Math.floor(newWidth))
      const nh = Math.max(1, Math.floor(newHeight))

      if (nw === w && nh === h) {
        return
      }

      const newCells = createEmptyCells(nw, nh)

      // Copy existing content
      const copyW = Math.min(w, nw)
      const copyH = Math.min(h, nh)

      for (let row = 0; row < copyH; row++) {
        for (let col = 0; col < copyW; col++) {
          const oldCell = cells[row * w + col]
          if (oldCell) {
            newCells[row * nw + col] = oldCell
          }
        }
      }

      cells = newCells
      w = nw
      h = nh
    }
  }
}

/**
 * Create an array of empty cells.
 *
 * @param width - Number of columns
 * @param height - Number of rows
 * @returns Array of empty cells
 */
function createEmptyCells(width: number, height: number): Cell[] {
  const size = width * height
  const cells: Cell[] = new Array(size)

  for (let i = 0; i < size; i++) {
    cells[i] = createEmptyCell()
  }

  return cells
}

/**
 * Create a single empty cell.
 *
 * @returns Empty cell
 */
export function createEmptyCell(): Cell {
  return {
    char: EMPTY_CHAR,
    fg: DEFAULT_FG,
    bg: DEFAULT_BG,
    attrs: 0
  }
}

/**
 * Clone a buffer.
 *
 * @param buffer - Buffer to clone
 * @returns Cloned buffer
 */
export function cloneBuffer(buffer: Buffer): Buffer {
  const clone = createBuffer(buffer.width, buffer.height)

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const cell = buffer.get(x, y)
      if (cell) {
        clone.set(x, y, { ...cell })
      }
    }
  }

  return clone
}

/**
 * Compare two cells for equality.
 *
 * @param a - First cell
 * @param b - Second cell
 * @returns True if cells are equal
 */
export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.char === b.char && a.fg === b.fg && a.bg === b.bg && a.attrs === b.attrs
}

/**
 * Copy a region from one buffer to another.
 *
 * @param source - Source buffer
 * @param target - Target buffer
 * @param srcX - Source X position
 * @param srcY - Source Y position
 * @param width - Region width
 * @param height - Region height
 * @param destX - Destination X position
 * @param destY - Destination Y position
 */
export function copyRegion(
  source: Buffer,
  target: Buffer,
  srcX: number,
  srcY: number,
  width: number,
  height: number,
  destX: number,
  destY: number
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = source.get(srcX + x, srcY + y)
      if (cell) {
        target.set(destX + x, destY + y, { ...cell })
      }
    }
  }
}

/**
 * Fill buffer with a character.
 *
 * @param buffer - Buffer to fill
 * @param char - Character to fill with
 * @param style - Style for the character
 */
export function fillBuffer(buffer: Buffer, char: string, style: CellStyle = {}): void {
  const cell: Cell = {
    char,
    fg: style.fg ?? DEFAULT_FG,
    bg: style.bg ?? DEFAULT_BG,
    attrs: style.attrs ?? 0
  }

  buffer.fill(0, 0, buffer.width, buffer.height, cell)
}

/**
 * Draw a horizontal line.
 *
 * @param buffer - Buffer to draw on
 * @param x - Start X position
 * @param y - Y position
 * @param length - Line length
 * @param char - Line character
 * @param style - Style for the line
 */
export function drawHLine(
  buffer: Buffer,
  x: number,
  y: number,
  length: number,
  char: string,
  style: CellStyle = {}
): void {
  const cell: Cell = {
    char,
    fg: style.fg ?? DEFAULT_FG,
    bg: style.bg ?? DEFAULT_BG,
    attrs: style.attrs ?? 0
  }

  for (let i = 0; i < length; i++) {
    buffer.set(x + i, y, { ...cell })
  }
}

/**
 * Draw a vertical line.
 *
 * @param buffer - Buffer to draw on
 * @param x - X position
 * @param y - Start Y position
 * @param length - Line length
 * @param char - Line character
 * @param style - Style for the line
 */
export function drawVLine(
  buffer: Buffer,
  x: number,
  y: number,
  length: number,
  char: string,
  style: CellStyle = {}
): void {
  const cell: Cell = {
    char,
    fg: style.fg ?? DEFAULT_FG,
    bg: style.bg ?? DEFAULT_BG,
    attrs: style.attrs ?? 0
  }

  for (let i = 0; i < length; i++) {
    buffer.set(x, y + i, { ...cell })
  }
}

/**
 * Draw a rectangle outline.
 *
 * @param buffer - Buffer to draw on
 * @param x - X position
 * @param y - Y position
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param chars - Border characters
 * @param style - Style for the border
 */
export function drawRect(
  buffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number,
  chars: {
    topLeft: string
    topRight: string
    bottomLeft: string
    bottomRight: string
    horizontal: string
    vertical: string
  },
  style: CellStyle = {}
): void {
  if (width < 2 || height < 2) return

  const fg = style.fg ?? DEFAULT_FG
  const bg = style.bg ?? DEFAULT_BG
  const attrs = style.attrs ?? 0

  // Corners
  buffer.set(x, y, { char: chars.topLeft, fg, bg, attrs })
  buffer.set(x + width - 1, y, { char: chars.topRight, fg, bg, attrs })
  buffer.set(x, y + height - 1, { char: chars.bottomLeft, fg, bg, attrs })
  buffer.set(x + width - 1, y + height - 1, { char: chars.bottomRight, fg, bg, attrs })

  // Horizontal lines
  for (let i = 1; i < width - 1; i++) {
    buffer.set(x + i, y, { char: chars.horizontal, fg, bg, attrs })
    buffer.set(x + i, y + height - 1, { char: chars.horizontal, fg, bg, attrs })
  }

  // Vertical lines
  for (let i = 1; i < height - 1; i++) {
    buffer.set(x, y + i, { char: chars.vertical, fg, bg, attrs })
    buffer.set(x + width - 1, y + i, { char: chars.vertical, fg, bg, attrs })
  }
}
