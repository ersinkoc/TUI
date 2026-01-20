/**
 * @oxog/tui - Color Utility Tests
 */

import { describe, it, expect } from 'vitest'
import {
  packColor,
  unpackColor,
  parseColor,
  parseHexColor,
  parseRgbColor,
  parseColorWithDefault,
  blendColors,
  packedToHex,
  packedToRgb,
  packedToRgba,
  isTransparent,
  lighten,
  darken,
  DEFAULT_FG,
  DEFAULT_BG,
  NAMED_COLORS
} from '../../src/utils/color'

describe('Color Utilities', () => {
  describe('packColor', () => {
    it('should pack RGBA values into a single number', () => {
      const packed = packColor(255, 128, 64, 255)
      expect(typeof packed).toBe('number')
    })

    it('should handle pure colors', () => {
      const red = packColor(255, 0, 0, 255)
      const green = packColor(0, 255, 0, 255)
      const blue = packColor(0, 0, 255, 255)

      expect(red).not.toBe(green)
      expect(green).not.toBe(blue)
      expect(blue).not.toBe(red)
    })

    it('should handle black and white', () => {
      const black = packColor(0, 0, 0, 255)
      const white = packColor(255, 255, 255, 255)

      expect(black).toBe(255) // Only alpha set
      expect(white).not.toBe(black)
    })

    it('should handle alpha transparency', () => {
      const opaque = packColor(100, 100, 100, 255)
      const halfTransparent = packColor(100, 100, 100, 128)
      const transparent = packColor(100, 100, 100, 0)

      expect(opaque).not.toBe(halfTransparent)
      expect(halfTransparent).not.toBe(transparent)
    })
  })

  describe('unpackColor', () => {
    it('should unpack a number back to RGBA tuple', () => {
      const packed = packColor(255, 128, 64, 200)
      const [r, g, b, a] = unpackColor(packed)

      expect(r).toBe(255)
      expect(g).toBe(128)
      expect(b).toBe(64)
      expect(a).toBe(200)
    })

    it('should round-trip correctly', () => {
      const testCases = [
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [128, 64, 32, 100],
        [1, 2, 3, 4]
      ] as const

      for (const [r, g, b, a] of testCases) {
        const packed = packColor(r, g, b, a)
        const unpacked = unpackColor(packed)
        expect(unpacked).toEqual([r, g, b, a])
      }
    })
  })

  describe('parseHexColor', () => {
    it('should parse 6-digit hex colors', () => {
      const red = parseHexColor('#ff0000')
      expect(red).not.toBeNull()
      const [r, g, b] = unpackColor(red!)
      expect(r).toBe(255)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })

    it('should parse 3-digit hex colors', () => {
      const white = parseHexColor('#fff')
      expect(white).not.toBeNull()
      const [r, g, b] = unpackColor(white!)
      expect(r).toBe(255)
      expect(g).toBe(255)
      expect(b).toBe(255)
    })

    it('should parse without hash', () => {
      const blue = parseHexColor('0000ff')
      expect(blue).not.toBeNull()
      const [r, g, b] = unpackColor(blue!)
      expect(r).toBe(0)
      expect(g).toBe(0)
      expect(b).toBe(255)
    })

    it('should return null for invalid input', () => {
      expect(parseHexColor('')).toBeNull()
      expect(parseHexColor('invalid')).toBeNull()
      expect(parseHexColor('#gg0000')).toBeNull()
    })
  })

  describe('parseRgbColor', () => {
    it('should parse rgb() format', () => {
      const color = parseRgbColor('rgb(100, 150, 200)')
      expect(color).not.toBeNull()
      const [r, g, b] = unpackColor(color!)
      expect(r).toBe(100)
      expect(g).toBe(150)
      expect(b).toBe(200)
    })

    it('should parse rgba() format', () => {
      const color = parseRgbColor('rgba(100, 150, 200, 0.5)')
      expect(color).not.toBeNull()
      const [r, g, b, a] = unpackColor(color!)
      expect(r).toBe(100)
      expect(g).toBe(150)
      expect(b).toBe(200)
      expect(a).toBe(128) // 0.5 * 255 = 127.5 ≈ 128
    })

    it('should handle whitespace variations', () => {
      const color1 = parseRgbColor('rgb(100,150,200)')
      const color2 = parseRgbColor('rgb( 100 , 150 , 200 )')
      expect(color1).not.toBeNull()
      expect(color2).not.toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(parseRgbColor('')).toBeNull()
      expect(parseRgbColor('not rgb')).toBeNull()
      expect(parseRgbColor('rgb()')).toBeNull()
    })
  })

  describe('parseColor', () => {
    it('should parse hex colors', () => {
      expect(parseColor('#ff0000')).not.toBeNull()
      expect(parseColor('#f00')).not.toBeNull()
    })

    it('should parse rgb colors', () => {
      expect(parseColor('rgb(255, 0, 0)')).not.toBeNull()
      expect(parseColor('rgba(255, 0, 0, 0.5)')).not.toBeNull()
    })

    it('should parse named colors', () => {
      expect(parseColor('red')).not.toBeNull()
      expect(parseColor('blue')).not.toBeNull()
      expect(parseColor('white')).not.toBeNull()
      expect(parseColor('black')).not.toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(parseColor('')).toBeNull()
      expect(parseColor('invalid')).toBeNull()
    })
  })

  describe('packedToHex', () => {
    it('should convert packed color to hex string', () => {
      const red = packColor(255, 0, 0, 255)
      expect(packedToHex(red)).toBe('#ff0000')

      const white = packColor(255, 255, 255, 255)
      expect(packedToHex(white)).toBe('#ffffff')
    })

    it('should include alpha when requested', () => {
      const color = packColor(255, 128, 64, 200)
      expect(packedToHex(color, true)).toBe('#ff8040c8')
    })
  })

  describe('parseColorWithDefault', () => {
    it('should return parsed color for valid input', () => {
      const result = parseColorWithDefault('#ff0000', DEFAULT_FG)
      expect(result).not.toBe(DEFAULT_FG)
    })

    it('should return default for invalid input', () => {
      const result = parseColorWithDefault('invalid', DEFAULT_FG)
      expect(result).toBe(DEFAULT_FG)
    })

    it('should return default for undefined input', () => {
      const result = parseColorWithDefault(undefined, DEFAULT_FG)
      expect(result).toBe(DEFAULT_FG)
    })
  })

  describe('blendColors', () => {
    it('should blend foreground onto background', () => {
      // Blend semi-transparent foreground onto opaque background
      const fg = packColor(255, 0, 0, 128) // semi-transparent red
      const bg = packColor(0, 0, 255, 255) // opaque blue
      const result = blendColors(fg, bg)

      const [r, , b] = unpackColor(result)
      // Should be a mix of red and blue
      expect(r).toBeGreaterThan(0)
      expect(b).toBeGreaterThan(0)
    })

    it('should return foreground when fully opaque', () => {
      const fg = packColor(255, 0, 0, 255)
      const bg = packColor(0, 0, 255, 255)
      const result = blendColors(fg, bg)

      const [r, g, b] = unpackColor(result)
      expect(r).toBe(255)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })

    it('should return background when foreground is transparent', () => {
      const fg = packColor(255, 0, 0, 0)
      const bg = packColor(0, 0, 255, 255)
      const result = blendColors(fg, bg)

      const [r, g, b] = unpackColor(result)
      expect(r).toBe(0)
      expect(g).toBe(0)
      expect(b).toBe(255)
    })
  })

  describe('Default colors', () => {
    it('should have valid default foreground', () => {
      expect(typeof DEFAULT_FG).toBe('number')
    })

    it('should have valid default background', () => {
      expect(typeof DEFAULT_BG).toBe('number')
    })
  })

  describe('packColor edge cases', () => {
    it('should default alpha to 255', () => {
      const color = packColor(100, 100, 100)
      const [, , , a] = unpackColor(color)
      expect(a).toBe(255)
    })

    it('should mask values to 8 bits', () => {
      // Values > 255 should be masked
      const color = packColor(256, 257, 258, 259)
      const [r, g, b, a] = unpackColor(color)
      expect(r).toBe(0) // 256 & 0xff = 0
      expect(g).toBe(1) // 257 & 0xff = 1
      expect(b).toBe(2) // 258 & 0xff = 2
      expect(a).toBe(3) // 259 & 0xff = 3
    })
  })

  describe('parseHexColor edge cases', () => {
    it('should parse 4-digit hex with alpha', () => {
      // #RGBA format
      const color = parseHexColor('#f008')
      expect(color).not.toBeNull()
      const [r, g, b, a] = unpackColor(color!)
      expect(r).toBe(255)
      expect(g).toBe(0)
      expect(b).toBe(0)
      expect(a).toBe(136) // 88 in hex = 136
    })

    it('should parse 8-digit hex with alpha', () => {
      // #RRGGBBAA format
      const color = parseHexColor('#ff000080')
      expect(color).not.toBeNull()
      const [r, g, b, a] = unpackColor(color!)
      expect(r).toBe(255)
      expect(g).toBe(0)
      expect(b).toBe(0)
      expect(a).toBe(128)
    })

    it('should return null for invalid hex length', () => {
      expect(parseHexColor('#12')).toBeNull()
      expect(parseHexColor('#12345')).toBeNull()
      expect(parseHexColor('#1234567')).toBeNull()
      expect(parseHexColor('#123456789')).toBeNull()
    })

    it('should return null for invalid hex characters', () => {
      expect(parseHexColor('#zzzzzz')).toBeNull()
    })
  })

  describe('parseRgbColor edge cases', () => {
    it('should be case insensitive', () => {
      const color1 = parseRgbColor('RGB(100, 150, 200)')
      const color2 = parseRgbColor('Rgb(100, 150, 200)')
      const color3 = parseRgbColor('RGBA(100, 150, 200, 0.5)')
      expect(color1).not.toBeNull()
      expect(color2).not.toBeNull()
      expect(color3).not.toBeNull()
    })

    it('should handle alpha > 1 as 0-255 value', () => {
      // If alpha > 1, treat as 0-255 value directly
      const color = parseRgbColor('rgba(100, 100, 100, 200)')
      expect(color).not.toBeNull()
      const [, , , a] = unpackColor(color!)
      expect(a).toBe(200)
    })

    it('should clamp RGB values to 0-255', () => {
      // The regex only accepts positive numbers, so we test clamping on the high end
      const color = parseRgbColor('rgb(300, 50, 500)')
      expect(color).not.toBeNull()
      const [r, g, b] = unpackColor(color!)
      expect(r).toBe(255) // 300 clamped to 255
      expect(g).toBe(50) // 50 unchanged
      expect(b).toBe(255) // 500 clamped to 255
    })

    it('should handle rgb without spaces', () => {
      const color = parseRgbColor('rgb(100,150,200)')
      expect(color).not.toBeNull()
    })

    it('should return null for malformed rgb', () => {
      expect(parseRgbColor('rgb(100)')).toBeNull()
      expect(parseRgbColor('rgb(a, b, c)')).toBeNull()
    })

    it('should return null when alpha parses to NaN', () => {
      // [\d.]+ matches "." but parseFloat(".") returns NaN
      expect(parseRgbColor('rgba(100, 100, 100, .)')).toBeNull()
    })
  })

  describe('parseColor edge cases', () => {
    it('should trim whitespace', () => {
      expect(parseColor('  #ff0000  ')).not.toBeNull()
      expect(parseColor('  red  ')).not.toBeNull()
    })

    it('should handle case insensitive named colors', () => {
      expect(parseColor('RED')).not.toBeNull()
      expect(parseColor('Red')).not.toBeNull()
      expect(parseColor('BLUE')).not.toBeNull()
    })

    it('should return null for empty string', () => {
      expect(parseColor('')).toBeNull()
    })

    it('should return null for non-hex/rgb/named colors', () => {
      expect(parseColor('notacolor')).toBeNull()
    })

    it('should parse transparent', () => {
      const color = parseColor('transparent')
      expect(color).not.toBeNull()
      expect(color).toBe(0x00000000)
    })
  })

  describe('packedToRgb', () => {
    it('should convert packed color to rgb string', () => {
      const red = packColor(255, 0, 0, 255)
      expect(packedToRgb(red)).toBe('rgb(255, 0, 0)')
    })

    it('should handle various colors', () => {
      const color = packColor(100, 150, 200, 255)
      expect(packedToRgb(color)).toBe('rgb(100, 150, 200)')
    })

    it('should ignore alpha channel', () => {
      const semiTransparent = packColor(255, 128, 64, 128)
      expect(packedToRgb(semiTransparent)).toBe('rgb(255, 128, 64)')
    })
  })

  describe('packedToRgba', () => {
    it('should convert packed color to rgba string', () => {
      const red = packColor(255, 0, 0, 255)
      expect(packedToRgba(red)).toBe('rgba(255, 0, 0, 1)')
    })

    it('should format alpha correctly', () => {
      const halfTransparent = packColor(255, 0, 0, 128)
      const result = packedToRgba(halfTransparent)
      // 128/255 ≈ 0.50
      expect(result).toMatch(/rgba\(255, 0, 0, 0\.5/)
    })

    it('should handle fully transparent', () => {
      const transparent = packColor(255, 0, 0, 0)
      expect(packedToRgba(transparent)).toBe('rgba(255, 0, 0, 0)')
    })

    it('should trim trailing zeros in alpha', () => {
      const opaque = packColor(100, 100, 100, 255)
      // 255/255 = 1.00 -> "1"
      expect(packedToRgba(opaque)).toBe('rgba(100, 100, 100, 1)')
    })
  })

  describe('isTransparent', () => {
    it('should return true for fully transparent', () => {
      const transparent = packColor(255, 0, 0, 0)
      expect(isTransparent(transparent)).toBe(true)
    })

    it('should return false for opaque', () => {
      const opaque = packColor(255, 0, 0, 255)
      expect(isTransparent(opaque)).toBe(false)
    })

    it('should return false for semi-transparent', () => {
      const semiTransparent = packColor(255, 0, 0, 128)
      expect(isTransparent(semiTransparent)).toBe(false)
    })

    it('should return true for black transparent', () => {
      expect(isTransparent(0x00000000)).toBe(true)
    })

    it('should return false for alpha = 1', () => {
      const almostTransparent = packColor(0, 0, 0, 1)
      expect(isTransparent(almostTransparent)).toBe(false)
    })
  })

  describe('lighten', () => {
    it('should lighten a color', () => {
      const dark = packColor(100, 100, 100, 255)
      const light = lighten(dark, 0.5)
      const [r, g, b] = unpackColor(light)

      expect(r).toBeGreaterThan(100)
      expect(g).toBeGreaterThan(100)
      expect(b).toBeGreaterThan(100)
    })

    it('should cap at 255', () => {
      const bright = packColor(200, 200, 200, 255)
      const lighter = lighten(bright, 1.0)
      const [r, g, b] = unpackColor(lighter)

      expect(r).toBe(255)
      expect(g).toBe(255)
      expect(b).toBe(255)
    })

    it('should preserve alpha', () => {
      const color = packColor(100, 100, 100, 128)
      const lighter = lighten(color, 0.5)
      const [, , , a] = unpackColor(lighter)

      expect(a).toBe(128)
    })

    it('should handle zero amount', () => {
      const color = packColor(100, 100, 100, 255)
      const same = lighten(color, 0)
      const [r, g, b] = unpackColor(same)

      expect(r).toBe(100)
      expect(g).toBe(100)
      expect(b).toBe(100)
    })
  })

  describe('darken', () => {
    it('should darken a color', () => {
      const light = packColor(200, 200, 200, 255)
      const dark = darken(light, 0.5)
      const [r, g, b] = unpackColor(dark)

      expect(r).toBeLessThan(200)
      expect(g).toBeLessThan(200)
      expect(b).toBeLessThan(200)
    })

    it('should not go below 0', () => {
      const dark = packColor(50, 50, 50, 255)
      const darker = darken(dark, 1.0)
      const [r, g, b] = unpackColor(darker)

      expect(r).toBe(0)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })

    it('should preserve alpha', () => {
      const color = packColor(200, 200, 200, 128)
      const darker = darken(color, 0.5)
      const [, , , a] = unpackColor(darker)

      expect(a).toBe(128)
    })

    it('should handle zero amount', () => {
      const color = packColor(100, 100, 100, 255)
      const same = darken(color, 0)
      const [r, g, b] = unpackColor(same)

      expect(r).toBe(100)
      expect(g).toBe(100)
      expect(b).toBe(100)
    })
  })

  describe('NAMED_COLORS', () => {
    it('should export NAMED_COLORS', () => {
      expect(NAMED_COLORS).toBeDefined()
      expect(typeof NAMED_COLORS).toBe('object')
    })

    it('should contain standard colors', () => {
      expect(NAMED_COLORS.red).toBeDefined()
      expect(NAMED_COLORS.green).toBeDefined()
      expect(NAMED_COLORS.blue).toBeDefined()
      expect(NAMED_COLORS.black).toBeDefined()
      expect(NAMED_COLORS.white).toBeDefined()
      expect(NAMED_COLORS.transparent).toBeDefined()
    })

    it('should have correct red color', () => {
      const [r, g, b] = unpackColor(NAMED_COLORS.red!)
      expect(r).toBe(255)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })

    it('should have correct green color', () => {
      const [r, g, b] = unpackColor(NAMED_COLORS.green!)
      expect(r).toBe(0)
      expect(g).toBe(255)
      expect(b).toBe(0)
    })

    it('should have correct blue color', () => {
      const [r, g, b] = unpackColor(NAMED_COLORS.blue!)
      expect(r).toBe(0)
      expect(g).toBe(0)
      expect(b).toBe(255)
    })

    it('should have grey as alias for gray', () => {
      expect(NAMED_COLORS.grey).toBe(NAMED_COLORS.gray)
    })
  })

  describe('blendColors edge cases', () => {
    it('should blend 50% opacity correctly', () => {
      const fg = packColor(255, 0, 0, 128) // 50% red
      const bg = packColor(0, 0, 255, 255) // 100% blue
      const result = blendColors(fg, bg)
      const [r, , b] = unpackColor(result)

      // Should be roughly equal mix
      expect(r).toBeGreaterThan(100)
      expect(r).toBeLessThan(150)
      expect(b).toBeGreaterThan(100)
      expect(b).toBeLessThan(150)
    })

    it('should handle blending with transparent background', () => {
      const fg = packColor(255, 0, 0, 128)
      const bg = packColor(0, 0, 0, 0)
      const result = blendColors(fg, bg)
      const [r, g, b] = unpackColor(result)

      expect(r).toBeGreaterThan(0)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })
  })
})
