/**
 * @oxog/tui - Render Buffer
 * @packageDocumentation
 */

import type { Buffer, Cell, CellStyle } from '../types'
import { DEFAULT_FG, DEFAULT_BG, EMPTY_CHAR } from '../constants'
import { getCharWidth, splitGraphemes, stringWidth } from '../utils/unicode'
import { sanitizeAnsi } from '../utils/ansi'

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
  // Validate dimensions are finite numbers
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(
      `Invalid buffer size: width=${width}, height=${height}. ` +
      `Dimensions must be finite numbers.`
    )
  }

  // Clamp to minimum size and ensure non-negative
  let w = Math.max(1, Math.floor(Math.max(0, width)))
  let h = Math.max(1, Math.floor(Math.max(0, height)))
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
      // Validate y first
      if (y < 0 || y >= h || !Number.isFinite(y)) {
        return
      }

      // Validate and clamp x to valid range BEFORE using it
      // This prevents issues with negative values like -100000 becoming Math.max(0, -100000) = 0
      // but then col manipulation in the loop still being wrong
      if (!Number.isFinite(x)) {
        return
      }
      // Clamp x to prevent excessive iterations in the loop
      // For negative values: clamp to -buffer_width (any further off-screen is useless)
      // For positive values: clamp to buffer_width (will be handled by loop's bounds check)
      const maxNegativeOffset = -w - 100  // Allow some off-screen but prevent huge negative values
      const clampedX = Math.max(maxNegativeOffset, Math.min(x, w))

      // Safety: if clamped position would require more than 10000 iterations to reach screen,
      // just skip entirely (prevent DoS via extreme negative positions)
      if (clampedX < -10000) {
        return
      }

      // Sanitize input to prevent ANSI injection attacks
      text = sanitizeAnsi(text)

      const fg = style.fg ?? DEFAULT_FG
      const bg = style.bg ?? DEFAULT_BG
      const attrs = style.attrs ?? 0

      // Pre-calculate row base index for efficiency and bounds checking
      const rowBase = y * w
      if (rowBase < 0 || rowBase >= cells.length) {
        return
      }

      // Split into grapheme clusters to handle combining marks properly
      const graphemes = splitGraphemes(text)

      let col = clampedX

      for (const grapheme of graphemes) {
        // Skip if starting position is beyond buffer
        if (col >= w) break

        // Get display width of entire grapheme cluster
        const graphemeWidth = stringWidth(grapheme)

        // Skip zero-width clusters (standalone combining marks)
        if (graphemeWidth === 0) {
          continue
        }

        // Skip clusters completely off-screen (left side)
        if (col + graphemeWidth <= 0) {
          col += graphemeWidth
          continue
        }

        // Clamp starting position to buffer bounds
        const writeCol = Math.max(0, col)

        // Check if we're past the buffer width
        if (writeCol >= w) {
          break
        }

        // Handle wide grapheme starting off-screen but extending into view
        if (col < 0 && graphemeWidth === 2) {
          if (rowBase >= 0 && rowBase < cells.length) {
            cells[rowBase] = { char: ' ', fg, bg, attrs }
          }
          col += graphemeWidth
          continue
        }

        // Validate target position
        const targetIdx = rowBase + writeCol
        if (targetIdx < 0 || targetIdx >= cells.length) {
          col += graphemeWidth
          continue
        }

        // Handle wide grapheme that would be cut off at the right edge
        if (graphemeWidth === 2 && writeCol + 1 >= w) {
          // Wide character doesn't fit, show a space instead
          cells[targetIdx] = { char: ' ', fg, bg, attrs }
          col += graphemeWidth
          continue
        }

        // Clear any wide character that would be partially overwritten
        clearWideCharacterAt(targetIdx, cells, w, y, h, fg, bg)

        // Extract base characters from grapheme, skipping combining marks
        // This ensures 'a\u0300' (a + combining grave) writes as just 'a'
        let charsToWrite = grapheme
        const baseChars: string[] = []
        let hasCombiningMark = false

        // Single loop: check for combining marks AND collect base chars
        for (const ch of grapheme) {
          const code = ch.codePointAt(0) ?? 0
          const isCombining =
            (code >= 0x0300 && code <= 0x036f) || // Combining Diacritical Marks
            (code >= 0x1ab0 && code <= 0x1aff) || // Combining Diacritical Marks Extended
            (code >= 0x1dc0 && code <= 0x1dff) || // Combining Diacritical Marks Supplement
            (code >= 0x20d0 && code <= 0x20ff) || // Combining Diacritical Marks for Symbols
            (code >= 0xfe20 && code <= 0xfe2f) // Combining Half Marks

          if (isCombining) {
            hasCombiningMark = true
          } else {
            baseChars.push(ch)
          }
        }

        if (hasCombiningMark) {
          charsToWrite = baseChars.join('') || grapheme // Fallback to original if empty
        }

        // Write the character(s) - base chars only for graphemes with combining marks
        cells[targetIdx] = { char: charsToWrite, fg, bg, attrs }

        // For wide graphemes, fill next cell with continuation marker
        if (graphemeWidth === 2 && writeCol + 1 < w) {
          const continuationIdx = targetIdx + 1
          if (continuationIdx < cells.length) {
            cells[continuationIdx] = { char: '', fg, bg, attrs }
          }
        }

        col += graphemeWidth
      }
    },

    fill(x: number, y: number, fillWidth: number, fillHeight: number, cell: Cell): void {
      const startX = Math.max(0, x)
      const startY = Math.max(0, y)
      const endX = Math.min(w, x + fillWidth)
      const endY = Math.min(h, y + fillHeight)

      // Pre-extract cell properties for better performance in tight loops
      // Avoids creating intermediate spread objects on each iteration
      const cellChar = cell.char
      const cellFg = cell.fg
      const cellBg = cell.bg
      const cellAttrs = cell.attrs

      for (let row = startY; row < endY; row++) {
        for (let col = startX; col < endX; col++) {
          cells[row * w + col] = { char: cellChar, fg: cellFg, bg: cellBg, attrs: cellAttrs }
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

      // Copy existing content with bounds checking
      const copyW = Math.min(w, nw)
      const copyH = Math.min(h, nh)

      for (let row = 0; row < copyH; row++) {
        let col = 0
        while (col < copyW) {
          const idx = row * w + col

          // Validate index
          if (idx < 0 || idx >= cells.length) {
            col++
            continue
          }

          const oldCell = cells[idx]
          if (!oldCell) {
            col++
            continue
          }

          // Skip continuation cells (right half of wide character)
          // We only copy the left half and recreate the continuation
          if (oldCell.char === '') {
            col++
            continue
          }

          // Check if this is a wide character
          const charWidth = getCharWidth(oldCell.char)

          if (charWidth === 2) {
            // Wide character - copy both cells if space permits
            const newIdx = row * nw + col

            // Validate new position
            if (newIdx >= 0 && newIdx < newCells.length) {
              newCells[newIdx] = oldCell

              // Add continuation cell if there's space
              if (col + 1 < nw) {
                const nextIdx = newIdx + 1
                if (nextIdx < newCells.length) {
                  newCells[nextIdx] = { char: '', fg: oldCell.fg, bg: oldCell.bg, attrs: oldCell.attrs }
                }
              }
            }
            col += 2
          } else {
            // Regular character
            const newIdx = row * nw + col
            if (newIdx >= 0 && newIdx < newCells.length) {
              newCells[newIdx] = oldCell
            }
            col++
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
 * Clear a wide character at the given position.
 * Handles the continuation cell properly.
 *
 * @param index - Cell index
 * @param cells - Cells array
 * @param width - Buffer width
 * @param y - Row
 * @param height - Buffer height
 * @param defaultFg - Default foreground color
 * @param defaultBg - Default background color
 */
function clearWideCharacterAt(
  index: number,
  cells: Cell[],
  width: number,
  y: number,
  _height: number,
  defaultFg: number,
  defaultBg: number
): void {
  if (index < 0 || index >= cells.length) return

  const cell = cells[index]
  if (!cell) return

  // Check if this is a continuation cell (empty char = right half of wide char)
  if (cell.char === '') {
    // This is the right half - clear the left half (the actual character)
    if (index > 0) {
      const leftIndex = index - 1
      const leftCell = cells[leftIndex]
      if (leftCell && leftCell.char !== '') {
        // Found the actual character - clear it
        cells[leftIndex] = { char: ' ', fg: leftCell.fg, bg: leftCell.bg, attrs: 0 }
      }
    }
  } else {
    // This might be the left half of a wide character
    const char = cell.char ?? ''
    const charWidth = getCharWidth(char)

    if (charWidth === 2) {
      // This is a wide character - clear its continuation cell
      // But first check if we're at a row boundary (wide char spanning rows is invalid)
      const rowStart = y * width
      const rowEnd = rowStart + width - 1

      // If continuation would be past row end, just clear current cell
      if (index >= rowEnd) {
        cells[index] = { char: ' ', fg: defaultFg, bg: defaultBg, attrs: 0 }
        return
      }

      // Safe to clear continuation cell
      if (index + 1 < cells.length) {
        const rightIndex = index + 1
        const rightCell = cells[rightIndex]
        if (rightCell && rightCell.char === '') {
          cells[rightIndex] = { char: ' ', fg: defaultFg, bg: defaultBg, attrs: 0 }
        }
      }
    }
  }
}

/**
 * Create an array of empty cells.
 *
 * Uses plain objects for optimal performance.
 * V8 optimizer handles plain objects much better than Object.create() calls.
 * Benchmark: ~50ns per cell (vs ~500ns with Object.create).
 *
 * @param width - Number of columns
 * @param height - Number of rows
 * @returns Array of empty cells
 */
function createEmptyCells(width: number, height: number): Cell[] {
  const size = width * height

  // Validate size to prevent memory issues
  if (size <= 0 || size > 1000000) {
    // Max 1M cells (1000x1000) to prevent OOM
    throw new Error(`Invalid buffer size: ${width}x${height}`)
  }

  const cells: Cell[] = new Array(size)

  // Use plain objects for optimal V8 performance
  // This is ~10x faster than Object.create() due to better JIT optimization
  for (let i = 0; i < size; i++) {
    cells[i] = { char: EMPTY_CHAR, fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 }
  }

  return cells
}

/**
 * Create a single empty cell.
 *
 * Returns a fresh empty cell object.
 *
 * @returns Empty cell
 */
export function createEmptyCell(): Cell {
  return { char: EMPTY_CHAR, fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 }
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
 * @param charOrCell - Character to fill with, or a full cell object
 * @param style - Style for the character (when charOrCell is a string)
 */
export function fillBuffer(buffer: Buffer, charOrCell: string | Cell, style: CellStyle = {}): void {
  const cell: Cell = typeof charOrCell === 'string'
    ? {
        char: charOrCell,
        fg: style.fg ?? DEFAULT_FG,
        bg: style.bg ?? DEFAULT_BG,
        attrs: style.attrs ?? 0
      }
    : {
        char: charOrCell.char,
        fg: charOrCell.fg ?? DEFAULT_FG,
        bg: charOrCell.bg ?? DEFAULT_BG,
        attrs: charOrCell.attrs ?? 0
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
