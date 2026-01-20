/**
 * @oxog/tui - Border Utilities Tests
 */

import { describe, it, expect } from 'vitest'
import {
  getBorderChars,
  drawBorder,
  isOnBorder,
  getBorderCharAt,
  getContentArea,
  getBorderThickness,
  BORDER_CHARS
} from '../../src/utils/border'

describe('Border Utilities', () => {
  describe('getBorderChars()', () => {
    it('should return undefined for none style', () => {
      expect(getBorderChars('none')).toBeUndefined()
    })

    it('should return characters for single style', () => {
      const chars = getBorderChars('single')
      expect(chars).toBeDefined()
      expect(chars?.topLeft).toBe('┌')
      expect(chars?.topRight).toBe('┐')
      expect(chars?.bottomLeft).toBe('└')
      expect(chars?.bottomRight).toBe('┘')
      expect(chars?.horizontal).toBe('─')
      expect(chars?.vertical).toBe('│')
    })

    it('should return characters for double style', () => {
      const chars = getBorderChars('double')
      expect(chars).toBeDefined()
      expect(chars?.topLeft).toBe('╔')
      expect(chars?.topRight).toBe('╗')
      expect(chars?.bottomLeft).toBe('╚')
      expect(chars?.bottomRight).toBe('╝')
      expect(chars?.horizontal).toBe('═')
      expect(chars?.vertical).toBe('║')
    })

    it('should return characters for rounded style', () => {
      const chars = getBorderChars('rounded')
      expect(chars).toBeDefined()
      expect(chars?.topLeft).toBe('╭')
      expect(chars?.topRight).toBe('╮')
      expect(chars?.bottomLeft).toBe('╰')
      expect(chars?.bottomRight).toBe('╯')
    })

    it('should return characters for bold style', () => {
      const chars = getBorderChars('bold')
      expect(chars).toBeDefined()
      expect(chars?.topLeft).toBe('┏')
      expect(chars?.topRight).toBe('┓')
    })

    it('should return characters for ascii style', () => {
      const chars = getBorderChars('ascii')
      expect(chars).toBeDefined()
      expect(chars?.topLeft).toBe('+')
      expect(chars?.horizontal).toBe('-')
      expect(chars?.vertical).toBe('|')
    })
  })

  describe('drawBorder()', () => {
    it('should return empty array for none style', () => {
      const lines = drawBorder({ width: 10, height: 5, style: 'none' })
      expect(lines).toEqual([])
    })

    it('should return empty array for width < 2', () => {
      const lines = drawBorder({ width: 1, height: 5, style: 'single' })
      expect(lines).toEqual([])
    })

    it('should return empty array for height < 2', () => {
      const lines = drawBorder({ width: 10, height: 1, style: 'single' })
      expect(lines).toEqual([])
    })

    it('should draw 2x2 border', () => {
      const lines = drawBorder({ width: 2, height: 2, style: 'single' })
      expect(lines.length).toBe(2)
      expect(lines[0]).toBe('┌┐')
      expect(lines[1]).toBe('└┘')
    })

    it('should draw single border', () => {
      const lines = drawBorder({ width: 5, height: 3, style: 'single' })
      expect(lines.length).toBe(3)
      expect(lines[0]).toBe('┌───┐')
      expect(lines[1]).toBe('│   │')
      expect(lines[2]).toBe('└───┘')
    })

    it('should draw double border', () => {
      const lines = drawBorder({ width: 5, height: 3, style: 'double' })
      expect(lines[0]).toBe('╔═══╗')
      expect(lines[1]).toBe('║   ║')
      expect(lines[2]).toBe('╚═══╝')
    })

    it('should draw rounded border', () => {
      const lines = drawBorder({ width: 5, height: 3, style: 'rounded' })
      expect(lines[0]).toBe('╭───╮')
      expect(lines[2]).toBe('╰───╯')
    })

    it('should include title in border', () => {
      const lines = drawBorder({ width: 10, height: 3, style: 'single', title: 'Hi' })
      expect(lines[0]).toContain('Hi')
      // width=10: topLeft(1) + title(2) + remaining horizontal(6) + topRight(1) = 10
      expect(lines[0]).toBe('┌Hi──────┐')
    })

    it('should truncate long title', () => {
      const lines = drawBorder({ width: 10, height: 3, style: 'single', title: 'Very Long Title' })
      expect(lines[0].length).toBe(10)
    })

    it('should not include title if width too small', () => {
      const lines = drawBorder({ width: 4, height: 3, style: 'single', title: 'Test' })
      expect(lines[0]).toBe('┌──┐') // No room for title
    })

    it('should handle multiple middle rows', () => {
      const lines = drawBorder({ width: 5, height: 5, style: 'single' })
      expect(lines.length).toBe(5)
      expect(lines[1]).toBe('│   │')
      expect(lines[2]).toBe('│   │')
      expect(lines[3]).toBe('│   │')
    })
  })

  describe('isOnBorder()', () => {
    it('should return false for none style', () => {
      expect(isOnBorder(0, 0, 10, 10, 'none')).toBe(false)
    })

    it('should return true for top-left corner', () => {
      expect(isOnBorder(0, 0, 10, 10, 'single')).toBe(true)
    })

    it('should return true for top-right corner', () => {
      expect(isOnBorder(9, 0, 10, 10, 'single')).toBe(true)
    })

    it('should return true for bottom-left corner', () => {
      expect(isOnBorder(0, 9, 10, 10, 'single')).toBe(true)
    })

    it('should return true for bottom-right corner', () => {
      expect(isOnBorder(9, 9, 10, 10, 'single')).toBe(true)
    })

    it('should return true for top edge', () => {
      expect(isOnBorder(5, 0, 10, 10, 'single')).toBe(true)
    })

    it('should return true for bottom edge', () => {
      expect(isOnBorder(5, 9, 10, 10, 'single')).toBe(true)
    })

    it('should return true for left edge', () => {
      expect(isOnBorder(0, 5, 10, 10, 'single')).toBe(true)
    })

    it('should return true for right edge', () => {
      expect(isOnBorder(9, 5, 10, 10, 'single')).toBe(true)
    })

    it('should return false for interior position', () => {
      expect(isOnBorder(5, 5, 10, 10, 'single')).toBe(false)
    })

    it('should return false for position just inside border', () => {
      expect(isOnBorder(1, 1, 10, 10, 'single')).toBe(false)
      expect(isOnBorder(8, 8, 10, 10, 'single')).toBe(false)
    })
  })

  describe('getBorderCharAt()', () => {
    it('should return undefined for none style', () => {
      expect(getBorderCharAt(0, 0, 10, 10, 'none')).toBeUndefined()
    })

    it('should return top-left corner char', () => {
      expect(getBorderCharAt(0, 0, 10, 10, 'single')).toBe('┌')
      expect(getBorderCharAt(0, 0, 10, 10, 'rounded')).toBe('╭')
    })

    it('should return top-right corner char', () => {
      expect(getBorderCharAt(9, 0, 10, 10, 'single')).toBe('┐')
      expect(getBorderCharAt(9, 0, 10, 10, 'rounded')).toBe('╮')
    })

    it('should return bottom-left corner char', () => {
      expect(getBorderCharAt(0, 9, 10, 10, 'single')).toBe('└')
      expect(getBorderCharAt(0, 9, 10, 10, 'rounded')).toBe('╰')
    })

    it('should return bottom-right corner char', () => {
      expect(getBorderCharAt(9, 9, 10, 10, 'single')).toBe('┘')
      expect(getBorderCharAt(9, 9, 10, 10, 'rounded')).toBe('╯')
    })

    it('should return horizontal char for top edge', () => {
      expect(getBorderCharAt(5, 0, 10, 10, 'single')).toBe('─')
    })

    it('should return horizontal char for bottom edge', () => {
      expect(getBorderCharAt(5, 9, 10, 10, 'single')).toBe('─')
    })

    it('should return vertical char for left edge', () => {
      expect(getBorderCharAt(0, 5, 10, 10, 'single')).toBe('│')
    })

    it('should return vertical char for right edge', () => {
      expect(getBorderCharAt(9, 5, 10, 10, 'single')).toBe('│')
    })

    it('should return undefined for interior position', () => {
      expect(getBorderCharAt(5, 5, 10, 10, 'single')).toBeUndefined()
    })
  })

  describe('getContentArea()', () => {
    it('should return full area for none style', () => {
      const area = getContentArea(20, 15, 'none')
      expect(area).toEqual({ x: 0, y: 0, width: 20, height: 15 })
    })

    it('should return reduced area for single style', () => {
      const area = getContentArea(20, 15, 'single')
      expect(area).toEqual({ x: 1, y: 1, width: 18, height: 13 })
    })

    it('should return reduced area for double style', () => {
      const area = getContentArea(10, 10, 'double')
      expect(area).toEqual({ x: 1, y: 1, width: 8, height: 8 })
    })

    it('should handle small dimensions', () => {
      const area = getContentArea(2, 2, 'single')
      expect(area).toEqual({ x: 1, y: 1, width: 0, height: 0 })
    })

    it('should not return negative dimensions', () => {
      const area = getContentArea(1, 1, 'single')
      expect(area.width).toBeGreaterThanOrEqual(0)
      expect(area.height).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getBorderThickness()', () => {
    it('should return 0 for none style', () => {
      expect(getBorderThickness('none')).toBe(0)
    })

    it('should return 1 for single style', () => {
      expect(getBorderThickness('single')).toBe(1)
    })

    it('should return 1 for double style', () => {
      expect(getBorderThickness('double')).toBe(1)
    })

    it('should return 1 for rounded style', () => {
      expect(getBorderThickness('rounded')).toBe(1)
    })

    it('should return 1 for bold style', () => {
      expect(getBorderThickness('bold')).toBe(1)
    })

    it('should return 1 for ascii style', () => {
      expect(getBorderThickness('ascii')).toBe(1)
    })
  })

  describe('BORDER_CHARS', () => {
    it('should export BORDER_CHARS constant', () => {
      expect(BORDER_CHARS).toBeDefined()
      expect(BORDER_CHARS.single).toBeDefined()
      expect(BORDER_CHARS.double).toBeDefined()
      expect(BORDER_CHARS.rounded).toBeDefined()
      expect(BORDER_CHARS.bold).toBeDefined()
      expect(BORDER_CHARS.ascii).toBeDefined()
    })
  })
})
