/**
 * @oxog/tui - Unicode Utility Tests
 */

import { describe, it, expect } from 'vitest'
import {
  getCharWidth,
  stringWidth,
  truncateToWidth,
  padToWidth,
  wrapText,
  sliceByWidth
} from '../../src/utils/unicode'

describe('Unicode Utilities', () => {
  describe('getCharWidth', () => {
    it('should return 1 for ASCII characters', () => {
      expect(getCharWidth('a')).toBe(1)
      expect(getCharWidth('Z')).toBe(1)
      expect(getCharWidth('0')).toBe(1)
      expect(getCharWidth('!')).toBe(1)
    })

    it('should return 2 for CJK characters', () => {
      expect(getCharWidth('中')).toBe(2)
      expect(getCharWidth('日')).toBe(2)
      expect(getCharWidth('한')).toBe(2)
    })

    it('should return 2 for emoji', () => {
      expect(getCharWidth('😀')).toBe(2)
      expect(getCharWidth('🎉')).toBe(2)
    })

    it('should return 0 for empty string', () => {
      expect(getCharWidth('')).toBe(0)
    })

    it('should return 0 for control characters', () => {
      expect(getCharWidth('\t')).toBe(0)
      expect(getCharWidth('\n')).toBe(0)
      expect(getCharWidth('\x00')).toBe(0)
    })

    it('should return 0 for combining characters', () => {
      // Combining Diacritical Marks (U+0300 to U+036F)
      expect(getCharWidth('\u0300')).toBe(0) // Combining Grave Accent
      expect(getCharWidth('\u0301')).toBe(0) // Combining Acute Accent
      expect(getCharWidth('\u0308')).toBe(0) // Combining Diaeresis
    })
  })

  describe('stringWidth', () => {
    it('should calculate width for ASCII strings', () => {
      expect(stringWidth('hello')).toBe(5)
      expect(stringWidth('Hello, World!')).toBe(13)
      expect(stringWidth('')).toBe(0)
    })

    it('should calculate width for CJK strings', () => {
      expect(stringWidth('你好')).toBe(4)
      expect(stringWidth('日本語')).toBe(6)
    })

    it('should calculate width for mixed strings', () => {
      expect(stringWidth('Hello你好')).toBe(9) // 5 + 4
      expect(stringWidth('A中B')).toBe(4) // 1 + 2 + 1
    })

    it('should calculate width for emoji', () => {
      expect(stringWidth('😀')).toBe(2)
    })
  })

  describe('truncateToWidth', () => {
    it('should truncate ASCII strings', () => {
      expect(truncateToWidth('Hello, World!', 5)).toBe('Hello')
      expect(truncateToWidth('Hello', 10)).toBe('Hello')
      expect(truncateToWidth('Hello', 0)).toBe('')
    })

    it('should truncate CJK strings correctly', () => {
      expect(truncateToWidth('你好世界', 4)).toBe('你好')
      expect(truncateToWidth('你好世界', 5)).toBe('你好') // Can't fit half of 世
    })

    it('should add ellipsis when specified', () => {
      expect(truncateToWidth('Hello, World!', 8, '...')).toBe('Hello...')
    })

    it('should handle empty strings', () => {
      expect(truncateToWidth('', 10)).toBe('')
    })

    it('should handle ellipsis longer than maxWidth', () => {
      // If ellipsis is longer than maxWidth, slice the ellipsis
      expect(truncateToWidth('Hello', 2, '...')).toBe('..')
    })

    it('should not add ellipsis when string fits without it', () => {
      // When truncated string + ellipsis > maxWidth but truncated string alone fits
      const result = truncateToWidth('Hello World!', 10, '...')
      // Should truncate and add ellipsis if needed
      expect(stringWidth(result)).toBeLessThanOrEqual(10)
    })
  })

  describe('padToWidth', () => {
    it('should pad strings to the right (left align)', () => {
      expect(padToWidth('hi', 5, 'left')).toBe('hi   ')
      expect(padToWidth('hi', 5, 'left', '-')).toBe('hi---')
    })

    it('should pad strings to the left (right align)', () => {
      expect(padToWidth('hi', 5, 'right')).toBe('   hi')
      expect(padToWidth('hi', 5, 'right', '-')).toBe('---hi')
    })

    it('should center strings', () => {
      expect(padToWidth('hi', 6, 'center')).toBe('  hi  ')
    })

    it('should truncate if already longer than width', () => {
      // padToWidth truncates to width if string is longer
      expect(padToWidth('hello', 3, 'left')).toBe('hel')
    })

    it('should handle CJK correctly', () => {
      expect(padToWidth('你', 4, 'left')).toBe('你  ')
      expect(padToWidth('你', 4, 'right')).toBe('  你')
    })
  })

  describe('wrapText', () => {
    it('should wrap long lines', () => {
      const lines = wrapText('Hello World', 5)
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('Hello')
      expect(lines[1]).toBe('World')
    })

    it('should handle short lines', () => {
      const lines = wrapText('Hi', 10)
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('Hi')
    })

    it('should handle empty strings', () => {
      const lines = wrapText('', 10)
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('')
    })

    it('should preserve existing line breaks', () => {
      const lines = wrapText('Hello\nWorld', 20)
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('Hello')
      expect(lines[1]).toBe('World')
    })

    it('should handle CJK text', () => {
      const lines = wrapText('你好世界', 4)
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('你好')
      expect(lines[1]).toBe('世界')
    })

    it('should return empty array for width <= 0', () => {
      expect(wrapText('Hello World', 0)).toEqual([])
      expect(wrapText('Hello World', -5)).toEqual([])
    })

    it('should break very long words', () => {
      const lines = wrapText('Superlongwordthatdoesntfit', 5)
      expect(lines.length).toBeGreaterThan(1)
      // Each line should be <= 5 chars wide
      for (const line of lines) {
        expect(stringWidth(line)).toBeLessThanOrEqual(5)
      }
    })
  })

  describe('sliceByWidth', () => {
    it('should slice ASCII strings by width', () => {
      expect(sliceByWidth('Hello', 0, 3)).toBe('Hel')
      expect(sliceByWidth('Hello', 2, 5)).toBe('llo')
    })

    it('should slice CJK strings by width', () => {
      expect(sliceByWidth('你好世界', 0, 4)).toBe('你好')
      expect(sliceByWidth('你好世界', 4, 8)).toBe('世界')
    })

    it('should handle mixed strings', () => {
      expect(sliceByWidth('A中B', 0, 3)).toBe('A中')
    })

    it('should handle slice to end', () => {
      expect(sliceByWidth('Hello', 2)).toBe('llo')
    })
  })
})
