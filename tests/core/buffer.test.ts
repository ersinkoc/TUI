/**
 * @oxog/tui - Buffer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  createBuffer,
  createEmptyCell,
  cloneBuffer,
  cellsEqual,
  copyRegion,
  fillBuffer,
  drawHLine,
  drawVLine,
  drawRect
} from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'
import { BORDER_CHARS } from '../../src/utils/border'

describe('Buffer', () => {
  describe('createBuffer', () => {
    it('should create buffer with correct dimensions', () => {
      const buffer = createBuffer(80, 24)
      expect(buffer.width).toBe(80)
      expect(buffer.height).toBe(24)
    })

    it('should create buffer with cells as flat array', () => {
      const buffer = createBuffer(10, 5)
      // Flat array: 10 * 5 = 50 cells
      expect(buffer.cells).toHaveLength(50)
    })

    it('should initialize cells with spaces', () => {
      const buffer = createBuffer(10, 5)
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should initialize cells with default colors', () => {
      const buffer = createBuffer(10, 5)
      const cell = buffer.get(0, 0)
      expect(cell?.fg).toBe(DEFAULT_FG)
      expect(cell?.bg).toBe(DEFAULT_BG)
      expect(cell?.attrs).toBe(0)
    })

    it('should enforce minimum dimensions of 1x1', () => {
      const buffer = createBuffer(0, 0)
      expect(buffer.width).toBe(1)
      expect(buffer.height).toBe(1)
      expect(buffer.cells).toHaveLength(1)
    })
  })

  describe('createEmptyCell', () => {
    it('should create cell with space character', () => {
      const cell = createEmptyCell()
      expect(cell.char).toBe(' ')
    })

    it('should create cell with default colors', () => {
      const cell = createEmptyCell()
      expect(cell.fg).toBe(DEFAULT_FG)
      expect(cell.bg).toBe(DEFAULT_BG)
      expect(cell.attrs).toBe(0)
    })
  })

  describe('cloneBuffer', () => {
    it('should create deep copy of buffer', () => {
      const original = createBuffer(10, 5)
      original.set(0, 0, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const clone = cloneBuffer(original)
      expect(clone.get(0, 0)?.char).toBe('X')

      // Modify original, clone should not change
      original.set(0, 0, { char: 'Y', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(clone.get(0, 0)?.char).toBe('X')
    })

    it('should preserve dimensions', () => {
      const original = createBuffer(80, 24)
      const clone = cloneBuffer(original)
      expect(clone.width).toBe(80)
      expect(clone.height).toBe(24)
    })
  })

  describe('cellsEqual', () => {
    it('should return true for identical cells', () => {
      const cell1 = createEmptyCell()
      const cell2 = createEmptyCell()
      expect(cellsEqual(cell1, cell2)).toBe(true)
    })

    it('should return false for different characters', () => {
      const cell1 = createEmptyCell()
      const cell2 = createEmptyCell()
      cell2.char = 'X'
      expect(cellsEqual(cell1, cell2)).toBe(false)
    })

    it('should return false for different colors', () => {
      const cell1 = createEmptyCell()
      const cell2 = createEmptyCell()
      cell2.fg = 12345
      expect(cellsEqual(cell1, cell2)).toBe(false)
    })

    it('should return false for different attributes', () => {
      const cell1 = createEmptyCell()
      const cell2 = createEmptyCell()
      cell2.attrs = 1
      expect(cellsEqual(cell1, cell2)).toBe(false)
    })
  })

  describe('copyRegion', () => {
    it('should copy region between buffers', () => {
      const src = createBuffer(10, 10)
      const dst = createBuffer(10, 10)

      src.set(2, 2, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      copyRegion(src, dst, 2, 2, 5, 5, 0, 0)

      expect(dst.get(0, 0)?.char).toBe('X')
    })

    it('should handle out-of-bounds gracefully', () => {
      const src = createBuffer(5, 5)
      const dst = createBuffer(5, 5)

      // Should not throw
      expect(() => copyRegion(src, dst, 0, 0, 10, 10, 0, 0)).not.toThrow()
    })
  })

  describe('fillBuffer', () => {
    it('should fill buffer with character', () => {
      const buffer = createBuffer(5, 5)
      fillBuffer(buffer, '#')

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          expect(buffer.get(x, y)?.char).toBe('#')
        }
      }
    })

    it('should fill buffer with style', () => {
      const buffer = createBuffer(5, 5)
      fillBuffer(buffer, 'X', { fg: 12345, bg: 54321, attrs: 1 })

      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe('X')
      expect(cell?.fg).toBe(12345)
      expect(cell?.bg).toBe(54321)
      expect(cell?.attrs).toBe(1)
    })
  })

  describe('drawHLine', () => {
    it('should draw horizontal line', () => {
      const buffer = createBuffer(10, 5)
      drawHLine(buffer, 0, 2, 10, '-')

      for (let x = 0; x < 10; x++) {
        expect(buffer.get(x, 2)?.char).toBe('-')
      }
    })

    it('should respect buffer boundaries', () => {
      const buffer = createBuffer(5, 5)
      // Should not throw when drawing beyond boundaries
      expect(() => drawHLine(buffer, 0, 2, 100, '-')).not.toThrow()
    })
  })

  describe('drawVLine', () => {
    it('should draw vertical line', () => {
      const buffer = createBuffer(10, 5)
      drawVLine(buffer, 2, 0, 5, '|')

      for (let y = 0; y < 5; y++) {
        expect(buffer.get(2, y)?.char).toBe('|')
      }
    })

    it('should respect buffer boundaries', () => {
      const buffer = createBuffer(5, 5)
      // Should not throw when drawing beyond boundaries
      expect(() => drawVLine(buffer, 2, 0, 100, '|')).not.toThrow()
    })
  })

  describe('drawRect', () => {
    it('should draw rectangle outline', () => {
      const buffer = createBuffer(10, 10)
      const chars = BORDER_CHARS.single
      drawRect(buffer, 0, 0, 5, 5, chars)

      // Check corners
      expect(buffer.get(0, 0)?.char).toBe(chars.topLeft)
      expect(buffer.get(4, 0)?.char).toBe(chars.topRight)
      expect(buffer.get(0, 4)?.char).toBe(chars.bottomLeft)
      expect(buffer.get(4, 4)?.char).toBe(chars.bottomRight)
    })

    it('should draw horizontal and vertical lines', () => {
      const buffer = createBuffer(10, 10)
      const chars = BORDER_CHARS.single
      drawRect(buffer, 0, 0, 5, 5, chars)

      // Check top line
      expect(buffer.get(1, 0)?.char).toBe(chars.horizontal)
      expect(buffer.get(2, 0)?.char).toBe(chars.horizontal)

      // Check left line
      expect(buffer.get(0, 1)?.char).toBe(chars.vertical)
      expect(buffer.get(0, 2)?.char).toBe(chars.vertical)
    })

    it('should return early for width < 2', () => {
      const buffer = createBuffer(10, 10)
      const chars = BORDER_CHARS.single
      // Fill with X to detect any changes
      buffer.write(0, 0, 'XXXXX', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      drawRect(buffer, 0, 0, 1, 5, chars)

      // Buffer should be unchanged
      expect(buffer.get(0, 0)?.char).toBe('X')
    })

    it('should return early for height < 2', () => {
      const buffer = createBuffer(10, 10)
      const chars = BORDER_CHARS.single
      // Fill with X to detect any changes
      buffer.write(0, 0, 'XXXXX', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      drawRect(buffer, 0, 0, 5, 1, chars)

      // Buffer should be unchanged
      expect(buffer.get(0, 0)?.char).toBe('X')
    })
  })

  describe('buffer.write', () => {
    it('should write text to buffer', () => {
      const buffer = createBuffer(20, 5)
      buffer.write(0, 0, 'Hello', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('e')
      expect(buffer.get(2, 0)?.char).toBe('l')
      expect(buffer.get(3, 0)?.char).toBe('l')
      expect(buffer.get(4, 0)?.char).toBe('o')
    })

    it('should apply style when writing', () => {
      const buffer = createBuffer(20, 5)
      buffer.write(0, 0, 'Hi', { fg: 12345, bg: 54321, attrs: 1 })

      expect(buffer.get(0, 0)?.fg).toBe(12345)
      expect(buffer.get(0, 0)?.bg).toBe(54321)
      expect(buffer.get(0, 0)?.attrs).toBe(1)
    })

    it('should truncate text at buffer boundary', () => {
      const buffer = createBuffer(5, 1)
      buffer.write(0, 0, 'Hello World', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Only first 5 characters should be written
      expect(buffer.get(4, 0)?.char).toBe('o')
    })

    it('should ignore write when y is out of bounds (negative)', () => {
      const buffer = createBuffer(10, 5)
      buffer.write(0, -1, 'Hello', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First row should remain unchanged
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should ignore write when y is out of bounds (beyond height)', () => {
      const buffer = createBuffer(10, 5)
      buffer.write(0, 5, 'Hello', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Last valid row should remain unchanged
      expect(buffer.get(0, 4)?.char).toBe(' ')
    })

    it('should handle CJK characters', () => {
      const buffer = createBuffer(10, 1)
      buffer.write(0, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // CJK chars take 2 cells
      expect(buffer.get(0, 0)?.char).toBe('你')
      expect(buffer.get(1, 0)?.char).toBe('')
      expect(buffer.get(2, 0)?.char).toBe('好')
      expect(buffer.get(3, 0)?.char).toBe('')
    })
  })

  describe('buffer.get', () => {
    it('should return cell at position', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const cell = buffer.get(5, 5)
      expect(cell?.char).toBe('X')
    })

    it('should return undefined for out-of-bounds', () => {
      const buffer = createBuffer(10, 10)
      expect(buffer.get(-1, 0)).toBeUndefined()
      expect(buffer.get(0, -1)).toBeUndefined()
      expect(buffer.get(100, 0)).toBeUndefined()
      expect(buffer.get(0, 100)).toBeUndefined()
    })
  })

  describe('buffer.set', () => {
    it('should set cell at position', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: 12345, bg: 54321, attrs: 1 })

      const cell = buffer.get(5, 5)
      expect(cell?.char).toBe('X')
      expect(cell?.fg).toBe(12345)
      expect(cell?.bg).toBe(54321)
      expect(cell?.attrs).toBe(1)
    })

    it('should ignore out-of-bounds positions', () => {
      const buffer = createBuffer(10, 10)
      // Should not throw
      expect(() => buffer.set(-1, 0, createEmptyCell())).not.toThrow()
      expect(() => buffer.set(100, 0, createEmptyCell())).not.toThrow()
    })
  })

  describe('buffer.fill', () => {
    it('should fill a region with a cell', () => {
      const buffer = createBuffer(10, 10)
      buffer.fill(2, 2, 3, 3, { char: '#', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 2)?.char).toBe('#')
      expect(buffer.get(3, 3)?.char).toBe('#')
      expect(buffer.get(4, 4)?.char).toBe('#')
      // Outside the fill region
      expect(buffer.get(1, 1)?.char).toBe(' ')
      expect(buffer.get(5, 5)?.char).toBe(' ')
    })
  })

  describe('buffer.clear', () => {
    it('should reset all cells to empty', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: 12345, bg: 54321, attrs: 1 })
      buffer.clear()

      const cell = buffer.get(5, 5)
      expect(cell?.char).toBe(' ')
      expect(cell?.fg).toBe(DEFAULT_FG)
      expect(cell?.bg).toBe(DEFAULT_BG)
    })
  })

  describe('buffer.resize', () => {
    it('should resize buffer preserving content', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(2, 2, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      buffer.resize(20, 20)

      expect(buffer.width).toBe(20)
      expect(buffer.height).toBe(20)
      expect(buffer.get(2, 2)?.char).toBe('X')
    })

    it('should truncate content when shrinking', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(8, 8, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      buffer.resize(5, 5)

      expect(buffer.width).toBe(5)
      expect(buffer.height).toBe(5)
      expect(buffer.get(8, 8)).toBeUndefined()
    })

    it('should do nothing when resizing to same dimensions', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: 12345, bg: 54321, attrs: 1 })

      // Resize to same dimensions
      buffer.resize(10, 10)

      // Content should be preserved
      expect(buffer.width).toBe(10)
      expect(buffer.height).toBe(10)
      expect(buffer.get(5, 5)?.char).toBe('X')
      expect(buffer.get(5, 5)?.fg).toBe(12345)
    })
  })

  describe('write edge cases', () => {
    it('should handle writing with negative starting position', () => {
      const buffer = createBuffer(10, 5)
      buffer.write(-2, 0, 'Hello', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First 2 positions should show 'llo' (H-e are off-screen)
      expect(buffer.get(0, 0)?.char).toBe('l')
      expect(buffer.get(1, 0)?.char).toBe('l')
      expect(buffer.get(2, 0)?.char).toBe('o')
    })

    it('should handle writing with zero-width characters', () => {
      const buffer = createBuffer(10, 5)
      buffer.write(0, 0, 'a\u0300b', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Combining mark should be skipped
      expect(buffer.get(0, 0)?.char).toBe('a')
      expect(buffer.get(1, 0)?.char).toBe('b')
    })

    it('should handle writing with control characters', () => {
      const buffer = createBuffer(10, 5)
      buffer.write(0, 0, 'a\nb\tc', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Control chars should be skipped
      expect(buffer.get(0, 0)?.char).toBe('a')
      expect(buffer.get(1, 0)?.char).toBe('b')
      expect(buffer.get(2, 0)?.char).toBe('c')
    })

    it('should handle CJK at right edge', () => {
      const buffer = createBuffer(5, 1)
      buffer.write(3, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First CJK (你) at position 3, continuation at 4
      expect(buffer.get(3, 0)?.char).toBe('你')
      expect(buffer.get(4, 0)?.char).toBe('')
      // Second CJK doesn't fit, should show space at position 5 (out of bounds)
      // Actually, position 5 is beyond width 5, so nothing should be written
      // The CJK char that doesn't fit is replaced with space
      // Let me check the code again...
      // writeCol = 4, charWidth = 2, writeCol + 1 >= w (4 + 1 >= 5 = true)
      // So it writes a space instead
      expect(buffer.get(4, 0)?.char).toBe('')
    })

    it('should handle CJK starting off-screen extending into view', () => {
      const buffer = createBuffer(5, 1)
      buffer.write(-1, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First CJK starts at -1, should show space at position 0
      expect(buffer.get(0, 0)?.char).toBe(' ')
      // Then the second CJK at position 1-2
      expect(buffer.get(1, 0)?.char).toBe('好')
    })

    it('should clear wide character at row end correctly', () => {
      const buffer = createBuffer(6, 2)
      // Write a wide character at position 4-5 (end of first row)
      buffer.write(4, 0, '中', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(4, 0)?.char).toBe('中')
      expect(buffer.get(5, 0)?.char).toBe('') // continuation

      // Overwrite position 4 with narrow char - should clear wide char at row end
      buffer.write(4, 0, 'A', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(4, 0)?.char).toBe('A')
      // Position 5 should be cleared
      expect(buffer.get(5, 0)?.char).toBe(' ')
    })

    it('should clear existing wide character when overwriting', () => {
      const buffer = createBuffer(10, 1)
      // Write a wide character first
      buffer.write(0, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer.get(1, 0)?.char).toBe('')

      // Now overwrite part of it
      buffer.write(1, 0, 'X', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The clearWideCharacterAt function clears the wide character's first cell
      // when writing to its continuation cell
      expect(buffer.get(0, 0)?.char).toBe(' ')
      expect(buffer.get(1, 0)?.char).toBe('X')
    })
  })

  describe('fill edge cases', () => {
    it('should handle negative coordinates', () => {
      const buffer = createBuffer(10, 10)
      buffer.fill(-5, -5, 10, 10, { char: '#', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should fill starting from (0, 0)
      expect(buffer.get(0, 0)?.char).toBe('#')
    })

    it('should handle fill beyond buffer boundaries', () => {
      const buffer = createBuffer(5, 5)
      buffer.fill(3, 3, 10, 10, { char: '#', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should only fill within bounds
      expect(buffer.get(3, 3)?.char).toBe('#')
      expect(buffer.get(4, 4)?.char).toBe('#')
    })

    it('should handle zero width or height', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      buffer.fill(0, 0, 0, 5, { char: '#', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      buffer.fill(0, 0, 5, 0, { char: '#', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The X should remain unchanged
      expect(buffer.get(5, 5)?.char).toBe('X')
    })
  })

  describe('createBuffer error cases', () => {
    it('should throw for extremely large buffers', () => {
      // 1001 x 1001 = 1002001 > 1000000
      expect(() => createBuffer(1001, 1001)).toThrow('Invalid buffer size')
    })

    it('should clamp negative dimensions', () => {
      const buffer = createBuffer(-5, -10)
      expect(buffer.width).toBe(1)
      expect(buffer.height).toBe(1)
    })
  })

  describe('fillBuffer with cell object', () => {
    it('should accept full cell object', () => {
      const buffer = createBuffer(5, 5)
      const cell: Cell = {
        char: '#',
        fg: 12345,
        bg: 54321,
        attrs: 1
      }
      fillBuffer(buffer, cell)

      const result = buffer.get(0, 0)
      expect(result?.char).toBe('#')
      expect(result?.fg).toBe(12345)
      expect(result?.bg).toBe(54321)
      expect(result?.attrs).toBe(1)
    })
  })

  describe('drawHLine edge cases', () => {
    it('should handle negative starting position', () => {
      const buffer = createBuffer(10, 5)
      drawHLine(buffer, -5, 2, 10, '-')

      // Should draw from position 0
      expect(buffer.get(0, 2)?.char).toBe('-')
    })

    it('should handle zero length', () => {
      const buffer = createBuffer(10, 5)
      buffer.set(0, 2, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      drawHLine(buffer, 0, 2, 0, '-')

      // Should remain unchanged
      expect(buffer.get(0, 2)?.char).toBe('X')
    })

    it('should apply style', () => {
      const buffer = createBuffer(10, 5)
      drawHLine(buffer, 0, 2, 5, '-', { fg: 12345, bg: 54321, attrs: 1 })

      expect(buffer.get(0, 2)?.fg).toBe(12345)
      expect(buffer.get(0, 2)?.bg).toBe(54321)
      expect(buffer.get(0, 2)?.attrs).toBe(1)
    })
  })

  describe('drawVLine edge cases', () => {
    it('should handle negative starting position', () => {
      const buffer = createBuffer(5, 10)
      drawVLine(buffer, 2, -5, 10, '|')

      // Should draw from row 0
      expect(buffer.get(2, 0)?.char).toBe('|')
    })

    it('should handle zero length', () => {
      const buffer = createBuffer(10, 5)
      buffer.set(2, 0, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      drawVLine(buffer, 2, 0, 0, '|')

      // Should remain unchanged
      expect(buffer.get(2, 0)?.char).toBe('X')
    })

    it('should apply style', () => {
      const buffer = createBuffer(10, 5)
      drawVLine(buffer, 2, 0, 5, '|', { fg: 12345, bg: 54321, attrs: 1 })

      expect(buffer.get(2, 0)?.fg).toBe(12345)
      expect(buffer.get(2, 0)?.bg).toBe(54321)
      expect(buffer.get(2, 0)?.attrs).toBe(1)
    })
  })

  describe('drawRect edge cases', () => {
    it('should apply style to border', () => {
      const buffer = createBuffer(10, 10)
      const chars = BORDER_CHARS.single
      drawRect(buffer, 0, 0, 5, 5, chars, { fg: 12345, bg: 54321, attrs: 1 })

      expect(buffer.get(0, 0)?.fg).toBe(12345)
      expect(buffer.get(0, 0)?.bg).toBe(54321)
      expect(buffer.get(0, 0)?.attrs).toBe(1)
    })

    it('should handle negative dimensions gracefully', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(0, 0, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      const chars = BORDER_CHARS.single

      // Should return early without drawing
      drawRect(buffer, 0, 0, -5, 5, chars)
      expect(buffer.get(0, 0)?.char).toBe('X')
    })
  })

  describe('resize edge cases', () => {
    it('should handle negative dimensions', () => {
      const buffer = createBuffer(10, 10)
      buffer.set(5, 5, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      buffer.resize(-5, -10)

      // Should clamp to minimum 1x1
      expect(buffer.width).toBe(1)
      expect(buffer.height).toBe(1)
      // Content should be preserved (position 5,5 is now out of bounds)
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should preserve content when expanding', () => {
      const buffer = createBuffer(5, 5)
      buffer.write(0, 0, 'Hello', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      buffer.resize(10, 10)

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(4, 0)?.char).toBe('o')
      // New cells should be empty
      expect(buffer.get(9, 9)?.char).toBe(' ')
    })

    it('should preserve wide characters with continuation cells during resize', () => {
      const buffer = createBuffer(10, 2)
      // Write CJK characters that each take 2 cells
      buffer.write(0, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Resize to larger
      buffer.resize(15, 3)

      // Wide chars should be preserved with continuations
      expect(buffer.get(0, 0)?.char).toBe('你')
      expect(buffer.get(1, 0)?.char).toBe('') // continuation
      expect(buffer.get(2, 0)?.char).toBe('好')
      expect(buffer.get(3, 0)?.char).toBe('') // continuation
    })

    it('should handle wide character at edge during resize', () => {
      const buffer = createBuffer(5, 1)
      // Write CJK at position 3-4 (last two cells)
      buffer.write(3, 0, '中', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Resize to smaller - wide char at edge
      buffer.resize(4, 1)

      // Position 3 should still have the char if it fits
      expect(buffer.get(3, 0)?.char).toBe('中')
    })

    it('should handle resize when wide character continuation would overflow', () => {
      const buffer = createBuffer(5, 1)
      // Write CJK at position 3-4
      buffer.write(3, 0, '中', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Resize to smaller where continuation would not fit
      buffer.resize(4, 1)

      // Should preserve content up to new width
      expect(buffer.width).toBe(4)
    })
  })

  describe('write with CJK continuation', () => {
    it('should properly fill continuation cells', () => {
      const buffer = createBuffer(10, 1)
      buffer.write(0, 0, '你好世界', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('你')
      expect(buffer.get(1, 0)?.char).toBe('')
      expect(buffer.get(2, 0)?.char).toBe('好')
      expect(buffer.get(3, 0)?.char).toBe('')
      expect(buffer.get(4, 0)?.char).toBe('世')
      expect(buffer.get(5, 0)?.char).toBe('')
      expect(buffer.get(6, 0)?.char).toBe('界')
      expect(buffer.get(7, 0)?.char).toBe('')
    })

    it('should handle multiple CJK in sequence', () => {
      const buffer = createBuffer(10, 1)
      buffer.write(2, 0, '你好', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 0)?.char).toBe('你')
      expect(buffer.get(3, 0)?.char).toBe('')
      expect(buffer.get(4, 0)?.char).toBe('好')
      expect(buffer.get(5, 0)?.char).toBe('')
    })
  })

  describe('write truncation', () => {
    it('should truncate long text at buffer width', () => {
      const buffer = createBuffer(5, 1)
      buffer.write(0, 0, 'HelloWorld', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should only write first 5 characters
      expect(buffer.get(4, 0)?.char).toBe('o')
      // Position 5 doesn't exist
      expect(buffer.get(5, 0)).toBeUndefined()
    })

    it('should handle text shorter than buffer', () => {
      const buffer = createBuffer(10, 1)
      buffer.write(0, 0, 'Hi', { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('i')
      // Rest should be empty
      expect(buffer.get(2, 0)?.char).toBe(' ')
    })
  })

  describe('copyRegion edge cases', () => {
    it('should handle source outside buffer bounds', () => {
      const src = createBuffer(5, 5)
      const dst = createBuffer(5, 5)

      src.set(0, 0, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Copy from out-of-bounds source
      copyRegion(src, dst, 10, 10, 5, 5, 0, 0)

      // Destination should remain unchanged
      expect(dst.get(0, 0)?.char).toBe(' ')
    })

    it('should handle destination outside buffer bounds', () => {
      const src = createBuffer(5, 5)
      const dst = createBuffer(5, 5)

      src.set(0, 0, { char: 'X', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Copy to out-of-bounds destination
      copyRegion(src, dst, 0, 0, 5, 5, 10, 10)

      // Destination should remain unchanged (out of bounds)
      expect(dst.get(4, 4)?.char).toBe(' ')
    })
  })
})
