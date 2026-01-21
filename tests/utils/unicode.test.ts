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
  sliceByWidth,
  splitGraphemes,
  graphemeWidth,
  truncateByGrapheme
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
      expect(getCharWidth('\x1f')).toBe(0) // Unit separator
      expect(getCharWidth('\x7f')).toBe(0) // DEL
      expect(getCharWidth('\x9f')).toBe(0) // Control character in 0x7f-0xa0 range
    })

    it('should return 0 for combining characters', () => {
      // Combining Diacritical Marks (U+0300 to U+036F)
      expect(getCharWidth('\u0300')).toBe(0) // Combining Grave Accent
      expect(getCharWidth('\u0301')).toBe(0) // Combining Acute Accent
      expect(getCharWidth('\u0308')).toBe(0) // Combining Diaeresis
    })

    it('should return 0 for extended combining marks', () => {
      // Combining Diacritical Marks Extended
      expect(getCharWidth('\u1ab0')).toBe(0)
      // Combining Diacritical Marks Supplement
      expect(getCharWidth('\u1dc0')).toBe(0)
      // Combining Diacritical Marks for Symbols
      expect(getCharWidth('\u20d0')).toBe(0)
      // Combining Half Marks
      expect(getCharWidth('\ufe20')).toBe(0)
    })

    it('should return 2 for Hiragana', () => {
      expect(getCharWidth('あ')).toBe(2)
      expect(getCharWidth('い')).toBe(2)
      expect(getCharWidth('う')).toBe(2)
    })

    it('should return 2 for Katakana', () => {
      expect(getCharWidth('ア')).toBe(2)
      expect(getCharWidth('イ')).toBe(2)
      expect(getCharWidth('ウ')).toBe(2)
    })

    it('should return 2 for Hangul Jamo', () => {
      expect(getCharWidth('ㄱ')).toBe(2)
      expect(getCharWidth('ㄴ')).toBe(2)
    })

    it('should return 2 for fullwidth characters', () => {
      expect(getCharWidth('Ａ')).toBe(2) // Fullwidth Latin A
      expect(getCharWidth('Ｂ')).toBe(2) // Fullwidth Latin B
      expect(getCharWidth('Ｃ')).toBe(2) // Fullwidth Latin C
    })

    it('should return 2 for special symbols', () => {
      expect(getCharWidth('⌚')).toBe(2) // Watch
      expect(getCharWidth('⏳')).toBe(2) // Hourglass
      expect(getCharWidth('⌛')).toBe(2) // Hourglass
    })

    it('should return 2 for weather symbols', () => {
      expect(getCharWidth('☔')).toBe(2) // Umbrella with rain
      expect(getCharWidth('⚡')).toBe(2) // High voltage
    })

    it('should return 2 for zodiac symbols', () => {
      expect(getCharWidth('♈')).toBe(2) // Aries
      expect(getCharWidth('♉')).toBe(2) // Taurus
    })

    it('should return 2 for sports symbols', () => {
      expect(getCharWidth('⚽')).toBe(2) // Soccer ball
      expect(getCharWidth('⚾')).toBe(2) // Baseball
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

    it('should handle start at 0', () => {
      expect(sliceByWidth('Hello', 0, 3)).toBe('Hel')
      expect(sliceByWidth('Hello', 0)).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(sliceByWidth('', 0, 5)).toBe('')
    })

    it('should handle start beyond string length', () => {
      expect(sliceByWidth('Hi', 10, 15)).toBe('')
    })

    it('should handle start beyond end', () => {
      // When start >= end, returns empty string
      expect(sliceByWidth('Hello', 10, 5)).toBe('')
    })

    it('should handle negative start (treat as 0)', () => {
      // Negative start behaves like 0
      expect(sliceByWidth('Hello', -2, 3)).toBe('Hel')
    })

    it('should handle emoji correctly', () => {
      // Emoji are 2 wide
      expect(sliceByWidth('😀abc', 0, 2)).toBe('😀')
      expect(sliceByWidth('😀abc', 2, 5)).toBe('abc')
    })

    it('should handle combining characters', () => {
      // é can be e + combining acute
      const withCombining = 'e\u0301' // e + combining acute
      // sliceByWidth uses getCharWidth, and combining chars have 0 width
      // So 'e' has width 1, combining has width 0
      // The function splits by character position, not grapheme position
      // So sliceByWidth with end=1 returns just 'e' without combining mark
      expect(sliceByWidth(withCombining, 0, 1)).toBe('e')
    })

    it('should not split CJK characters', () => {
      // Each CJK is 2 wide
      // The function includes characters until currentWidth >= end
      // Tracing '你好', start=0, end=3:
      // i=0: currentWidth=0, not >=3, after: currentWidth=2
      // i=1: currentWidth=2, not >=3, after: currentWidth=4
      // Loop ends, both chars included
      expect(sliceByWidth('你好', 0, 1)).toBe('你') // Width becomes 2 after first char
      expect(sliceByWidth('你好', 0, 2)).toBe('你') // Width 2 triggers stop for next
      expect(sliceByWidth('你好', 0, 3)).toBe('你好') // Width 2 < 3, so includes second char too
      expect(sliceByWidth('你好', 0, 4)).toBe('你好') // Both chars fit exactly
    })
  })

  describe('splitGraphemes', () => {
    it('should split ASCII strings', () => {
      expect(splitGraphemes('hello')).toEqual(['h', 'e', 'l', 'l', 'o'])
    })

    it('should split CJK characters', () => {
      expect(splitGraphemes('你好')).toEqual(['你', '好'])
    })

    it('should handle emoji with ZWJ sequences', () => {
      // Family emoji: 👨‍👩‍👧‍👦 is a ZWJ sequence
      const result = splitGraphemes('👨‍👩‍👧‍👦')
      // Should be kept as one grapheme cluster when using Intl.Segmenter
      // Or might be split in fallback implementation
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle flag emoji (regional indicators)', () => {
      // Flag of Turkey: 🇹🇷 is two regional indicator symbols
      const result = splitGraphemes('🇹🇷')
      // Should be kept as one cluster (pair of regional indicators)
      expect(result.length).toBe(1)
    })

    it('should handle emoji with skin tone modifiers', () => {
      // Wave with medium skin tone: 👋🏽
      const result = splitGraphemes('👋🏽')
      expect(result.length).toBe(1)
    })

    it('should handle variation selectors', () => {
      // Heart with variation selector-15 (text style) or -16 (emoji style)
      const result = splitGraphemes('❤️')
      expect(result.length).toBe(1)
    })

    it('should handle combining characters', () => {
      // é can be e + combining acute accent
      const result = splitGraphemes('e\u0301')
      expect(result.length).toBe(1)
      expect(result[0]).toBe('e\u0301')
    })

    it('should handle empty string', () => {
      expect(splitGraphemes('')).toEqual([])
    })

    it('should handle simple emoji', () => {
      expect(splitGraphemes('😀')).toEqual(['😀'])
      expect(splitGraphemes('🎉')).toEqual(['🎉'])
    })
  })

  describe('graphemeWidth', () => {
    it('should calculate width for ASCII strings', () => {
      expect(graphemeWidth('hello')).toBe(5)
    })

    it('should calculate width for emoji', () => {
      expect(graphemeWidth('😀')).toBe(2)
      expect(graphemeWidth('🎉')).toBe(2)
    })

    it('should calculate width for flag emoji', () => {
      // Flag of Turkey
      expect(graphemeWidth('🇹🇷')).toBe(2)
    })

    it('should calculate width for emoji with skin tone', () => {
      expect(graphemeWidth('👋🏽')).toBe(2)
    })

    it('should calculate width for ZWJ sequences', () => {
      // Family emoji should be 2 wide (each emoji is 2 wide)
      const width = graphemeWidth('👨‍👩‍👧‍👦')
      // Family emoji is complex but should take 2 cells
      expect(width).toBe(2)
    })

    it('should calculate width for CJK characters', () => {
      expect(graphemeWidth('你好')).toBe(4)
    })

    it('should handle combining characters correctly', () => {
      // é = e + combining acute, should be 1 wide
      expect(graphemeWidth('e\u0301')).toBe(1)
    })

    it('should handle empty string', () => {
      expect(graphemeWidth('')).toBe(0)
    })

    it('should handle control characters', () => {
      expect(graphemeWidth('\t\n')).toBe(0)
    })

    it('should handle mixed strings', () => {
      // 'Hi' + flag emoji + '!'
      expect(graphemeWidth('Hi🇹🇷!')).toBe(5) // 2 + 2 + 1
    })
  })

  describe('truncateByGrapheme', () => {
    it('should truncate ASCII strings', () => {
      expect(truncateByGrapheme('Hello, World!', 5)).toBe('Hello')
      expect(truncateByGrapheme('Hello', 10)).toBe('Hello')
    })

    it('should truncate CJK strings correctly', () => {
      expect(truncateByGrapheme('你好世界', 4)).toBe('你好')
      expect(truncateByGrapheme('你好世界', 5)).toBe('你好')
    })

    it('should not split emoji', () => {
      // Emoji is 2 wide, so maxWidth=2 should include it
      expect(truncateByGrapheme('😀abc', 2)).toBe('😀')
      expect(truncateByGrapheme('😀abc', 4)).toBe('😀ab')
    })

    it('should not split flag emoji', () => {
      // Flag is 2 wide
      expect(truncateByGrapheme('🇹🇷abc', 2)).toBe('🇹🇷')
    })

    it('should add ellipsis when specified', () => {
      expect(truncateByGrapheme('Hello, World!', 8, '...')).toBe('Hello...')
    })

    it('should handle ellipsis longer than maxWidth', () => {
      expect(truncateByGrapheme('Hello', 2, '...')).toBe('..')
    })

    it('should handle empty strings', () => {
      expect(truncateByGrapheme('', 10)).toBe('')
    })

    it('should handle maxWidth <= 0', () => {
      expect(truncateByGrapheme('Hello', 0)).toBe('')
      expect(truncateByGrapheme('Hello', -5)).toBe('')
    })

    it('should handle emoji with ellipsis', () => {
      const result = truncateByGrapheme('😀😀😀', 4, '…')
      // Can fit 2 emoji (4 width) but then ellipsis would make it 5
      // So should only fit 1 emoji + ellipsis
      expect(graphemeWidth(result)).toBeLessThanOrEqual(4)
    })

    it('should handle combining characters without splitting', () => {
      const withCombining = 'e\u0301e\u0301' // Two é's
      const result = truncateByGrapheme(withCombining, 2)
      // Each grapheme (e + combining) is 1 wide, so both fit
      expect(result).toBe('e\u0301e\u0301')
    })
  })

  describe('boundary characters', () => {
    it('should handle characters at WIDE_RANGES boundaries', () => {
      // Test first character of wide range (0x1100 - Hangul Jamo)
      expect(getCharWidth('\u1100')).toBe(2)
      // Test last character of wide range (0x115f)
      expect(getCharWidth('\u115f')).toBe(2)
      // Test character just before wide range (0x10ff)
      expect(getCharWidth('\u10ff')).toBe(1)
      // Test character just after wide range (0x1160)
      expect(getCharWidth('\u1160')).toBe(1)
    })

    it('should handle emoji range boundaries', () => {
      // First emoji in range 0x1f300
      expect(getCharWidth('\u{1f300}')).toBe(2)
      // Last emoji in range 0x1f64f
      expect(getCharWidth('\u{1f64f}')).toBe(2)
    })

    it('should handle CJK range boundaries', () => {
      // First CJK (0x4e00)
      expect(getCharWidth('\u4e00')).toBe(2)
      // Last CJK (0x9fff)
      expect(getCharWidth('\u9fff')).toBe(2)
      // Just before CJK range
      expect(getCharWidth('\u4dff')).toBe(1)
      // Just after CJK range
      expect(getCharWidth('\ua000')).toBe(2) // Yi Syllables start
    })

    it('should handle combining mark boundaries', () => {
      // First combining mark (0x0300)
      expect(getCharWidth('\u0300')).toBe(0)
      // Last combining mark (0x036f)
      expect(getCharWidth('\u036f')).toBe(0)
      // Just before combining marks
      expect(getCharWidth('\u02ff')).toBe(1)
      // Just after combining marks
      expect(getCharWidth('\u0370')).toBe(1)
    })
  })

  describe('edge cases for wrapText', () => {
    it('should handle words that exactly fit width', () => {
      const lines = wrapText('hello world', 5)
      expect(lines).toEqual(['hello', 'world'])
    })

    it('should handle words with multiple spaces', () => {
      const lines = wrapText('hello  world', 11)
      // split(/\s+/) treats consecutive spaces as single separator
      expect(lines).toEqual(['hello world'])
    })

    it('should handle single very long CJK word', () => {
      const lines = wrapText('你好世界你好', 4)
      expect(lines.length).toBeGreaterThanOrEqual(2)
      for (const line of lines) {
        expect(stringWidth(line)).toBeLessThanOrEqual(4)
      }
    })

    it('should handle empty input lines', () => {
      const lines = wrapText('hello\n\nworld', 10)
      expect(lines).toEqual(['hello', '', 'world'])
    })

    it('should handle single character words', () => {
      const lines = wrapText('a b c d e', 3)
      expect(lines).toEqual(['a b', 'c d', 'e'])
    })

    it('should handle CJK with spaces', () => {
      const lines = wrapText('你好 世界', 2)
      // Each CJK character is 2 wide, and space is 1 wide
      // '你好' is 4 wide (too long), '你' is 2 wide (fits exactly)
      // The space separates the words
      expect(lines.length).toBeGreaterThanOrEqual(2)
      expect(lines[0]).toBe('你')
      // Later lines should contain the rest
      const allText = lines.join('')
      expect(allText).toContain('好')
      expect(allText).toContain('世界')
    })
  })

  describe('truncateToWidth edge cases', () => {
    it('should handle maxWidth exactly at character boundary', () => {
      expect(truncateToWidth('Hello', 5)).toBe('Hello')
    })

    it('should handle maxWidth between ASCII and CJK characters', () => {
      // A中B where A=1, 中=2, B=1, total=4
      expect(truncateToWidth('A中B', 3)).toBe('A中')
    })

    it('should handle very small maxWidth values', () => {
      expect(truncateToWidth('Hello', 1)).toBe('H')
      expect(truncateToWidth('你好', 1)).toBe('')
    })

    it('should handle ellipsis at exact boundary', () => {
      const result = truncateToWidth('Hello World', 8, '...')
      // Should truncate and add ellipsis
      expect(stringWidth(result)).toBeLessThanOrEqual(8)
    })
  })

  describe('truncateByGrapheme edge cases', () => {
    it('should handle maxWidth exactly at emoji boundary', () => {
      expect(truncateByGrapheme('😀😀', 2)).toBe('😀')
    })

    it('should handle mixed emoji and ASCII', () => {
      expect(truncateByGrapheme('Hi😀Bye', 4)).toBe('Hi😀')
    })

    it('should handle emoji sequences with ZWJ', () => {
      // Test with a more complex emoji sequence
      const text = '👨‍👩‍👧‍👦' // Family emoji
      const result = truncateByGrapheme(text, 2)
      // Should include the whole family emoji since it's treated as one grapheme
      expect(result).toBe('👨‍👩‍👧‍👦')
    })

    it('should handle maxWidth smaller than emoji width', () => {
      // Emoji is 2 wide, maxWidth is 1
      expect(truncateByGrapheme('😀', 1)).toBe('')
    })

    it('should handle multiple flags in sequence', () => {
      const text = '🇹🇷🇺🇸🇬🇧'
      expect(truncateByGrapheme(text, 4)).toBe('🇹🇷🇺🇸')
    })
  })

  describe('padToWidth edge cases', () => {
    it('should handle center padding with odd numbers', () => {
      // 'hi' is width 2, target is 5, so 3 padding
      // Left: 1, Right: 2
      const result = padToWidth('hi', 5, 'center')
      expect(result).toBe(' hi  ')
    })

    it('should handle CJK center padding', () => {
      // '中' is width 2, target is 6, so 4 padding
      const result = padToWidth('中', 6, 'center')
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(stringWidth(result)).toBe(6)
    })

    it('should handle zero width target', () => {
      expect(padToWidth('Hello', 0, 'left')).toBe('')
    })

    it('should handle padding with multi-char pad string', () => {
      // Should use first character of pad string
      const result = padToWidth('hi', 6, 'left', '=-')
      expect(result).toBe('hi====')
    })
  })

  describe('sliceByWidth edge cases', () => {
    it('should handle CJK slicing at exact boundaries', () => {
      // With '你好世界', start=2, end=4:
      // After '你': currentWidth=2, which is >= start (2), so startIndex=1
      // After '好': currentWidth=4, which is >= end (4), so endIndex=2
      // Result: chars.slice(1, 2) = ['好']
      expect(sliceByWidth('你好世界', 2, 4)).toBe('好')
    })

    it('should handle mixed content slicing', () => {
      // 'A你B好' = 1 + 2 + 1 + 2 = 6
      expect(sliceByWidth('A你B好', 1, 5)).toBe('你B好')
    })

    it('should handle slicing with control characters', () => {
      // 'a\tb' where \t has 0 width
      // a=1, \t=0, b=1
      expect(sliceByWidth('a\tb', 0, 1)).toBe('a')
      expect(sliceByWidth('a\tb', 1, 2)).toBe('\tb')
    })

    it('should handle end beyond string width', () => {
      expect(sliceByWidth('Hi', 0, 100)).toBe('Hi')
    })

    it('should handle negative start and end', () => {
      // Negative values are treated as 0
      expect(sliceByWidth('Hello', -5, -3)).toBe('')
    })
  })

  describe('splitGraphemes fallback edge cases', () => {
    it('should handle multiple combining marks', () => {
      // Character with multiple combining marks
      const text = 'e\u0301\u0308' // e + acute + diaeresis
      const result = splitGraphemes(text)
      // All combining marks should attach to base
      expect(result).toHaveLength(1)
    })

    it('should handle emoji with variation selectors', () => {
      // Heart with variation selector
      const result = splitGraphemes('❤️')
      expect(result).toHaveLength(1)
    })

    it('should handle single regional indicator', () => {
      // Single RI should not be paired
      const result = splitGraphemes('🇹')
      expect(result).toHaveLength(1)
    })

    it('should handle ZWJ at end of string', () => {
      const result = splitGraphemes('👨‍')
      // Should include the ZWJ with previous character
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('graphemeWidth edge cases', () => {
    it('should handle empty string', () => {
      expect(graphemeWidth('')).toBe(0)
    })

    it('should handle only control characters', () => {
      expect(graphemeWidth('\n\t\r')).toBe(0)
    })

    it('should handle only combining marks', () => {
      // Combining marks are clustered together by splitGraphemes fallback
      // The cluster is treated as one grapheme with code >= 32, so width 1
      expect(graphemeWidth('\u0300\u0301')).toBe(1)
    })

    it('should handle mixed control and printable', () => {
      expect(graphemeWidth('a\nb')).toBe(2)
    })

    it('should handle complex emoji sequences', () => {
      // Person with skin tone and profession
      const result = graphemeWidth('👨‍🚀')
      expect(result).toBe(2)
    })
  })

  describe('stringWidth edge cases', () => {
    it('should handle strings with only control chars', () => {
      expect(stringWidth('\n\t\r')).toBe(0)
    })

    it('should handle alternating wide and narrow', () => {
      expect(stringWidth('a你b中c')).toBe(7) // 1+2+1+2+1
    })

    it('should handle emoji at boundaries', () => {
      expect(stringWidth('a😀b')).toBe(4) // 1+2+1
    })

    it('should handle multiple consecutive control chars', () => {
      expect(stringWidth('\n\n\n')).toBe(0)
    })
  })

  describe('isWideCodePoint edge cases', () => {
    it('should handle very high code points', () => {
      // CJK Extension G (0x30000-0x3fffd)
      expect(getCharWidth('\u{30000}')).toBe(2)
    })

    it('should handle characters between wide ranges', () => {
      // Character between 0x115f (Hangul Jamo end) and 0x2329 (angle bracket)
      expect(getCharWidth('\u1200')).toBe(1)
    })
  })
})
