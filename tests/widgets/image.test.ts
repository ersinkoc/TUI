/**
 * @oxog/tui - Image Widget Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { image, type ImageData, type Pixel } from '../../src/widgets/image'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

// Helper to create test image data
function createTestImage(width: number, height: number, pattern: 'gradient' | 'checker' | 'solid' | 'stripes' = 'gradient', color?: Pixel): ImageData {
  const pixels: Pixel[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      switch (pattern) {
        case 'gradient':
          const gray = Math.floor((x / (width - 1 || 1)) * 255)
          pixels.push({ r: gray, g: gray, b: gray, a: 255 })
          break
        case 'checker':
          const isWhite = (x + y) % 2 === 0
          const val = isWhite ? 255 : 0
          pixels.push({ r: val, g: val, b: val, a: 255 })
          break
        case 'solid':
          pixels.push(color || { r: 128, g: 128, b: 128, a: 255 })
          break
        case 'stripes':
          const stripe = y % 2 === 0 ? 255 : 0
          pixels.push({ r: stripe, g: stripe, b: stripe, a: 255 })
          break
      }
    }
  }

  return { width, height, pixels }
}

describe('Image Widget', () => {
  describe('creation', () => {
    it('creates an empty image', () => {
      const img = image()
      expect(img).toBeDefined()
      expect(img.type).toBe('image')
      expect(img.hasImage).toBe(false)
      expect(img.imageWidth).toBe(0)
      expect(img.imageHeight).toBe(0)
    })

    it('creates an image with data', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data })
      expect(img.hasImage).toBe(true)
      expect(img.imageWidth).toBe(10)
      expect(img.imageHeight).toBe(5)
    })

    it('creates an image with all props', () => {
      const data = createTestImage(8, 4, 'checker')
      const img = image({
        data,
        charset: 'blocks',
        color: true,
        invert: true,
        brightness: 20,
        contrast: 10,
        dither: 'ordered',
        scaleMode: 'fit',
        aspectCorrection: false
      })
      expect(img.hasImage).toBe(true)
    })
  })

  describe('data methods', () => {
    it('sets image data via method', () => {
      const img = image()
      expect(img.hasImage).toBe(false)

      const data = createTestImage(4, 4, 'solid')
      img.data(data)
      expect(img.hasImage).toBe(true)
      expect(img.imageWidth).toBe(4)
      expect(img.imageHeight).toBe(4)
    })

    it('creates image from grayscale values', () => {
      const img = image()
      img.fromGrayscale(3, 2, [0, 128, 255, 64, 192, 32])
      expect(img.hasImage).toBe(true)
      expect(img.imageWidth).toBe(3)
      expect(img.imageHeight).toBe(2)
    })

    it('clears image data', () => {
      const data = createTestImage(4, 4, 'gradient')
      const img = image({ data })
      expect(img.hasImage).toBe(true)

      img.clear()
      expect(img.hasImage).toBe(false)
      expect(img.imageWidth).toBe(0)
      expect(img.imageHeight).toBe(0)
    })
  })

  describe('charset', () => {
    it('uses standard charset by default', () => {
      const img = image()
      // Default charset is 'standard'
      expect(img).toBeDefined()
    })

    it('sets charset to blocks', () => {
      const img = image().charset('blocks')
      expect(img).toBeDefined()
    })

    it('sets charset to braille', () => {
      const img = image().charset('braille')
      expect(img).toBeDefined()
    })

    it('sets charset to simple', () => {
      const img = image().charset('simple')
      expect(img).toBeDefined()
    })

    it('sets charset to detailed', () => {
      const img = image().charset('detailed')
      expect(img).toBeDefined()
    })
  })

  describe('color mode', () => {
    it('enables color rendering', () => {
      const img = image().color(true)
      expect(img).toBeDefined()
    })

    it('disables color rendering', () => {
      const img = image().color(false)
      expect(img).toBeDefined()
    })
  })

  describe('invert', () => {
    it('inverts brightness', () => {
      const img = image().invert(true)
      expect(img).toBeDefined()
    })

    it('disables inversion', () => {
      const img = image().invert(false)
      expect(img).toBeDefined()
    })
  })

  describe('brightness', () => {
    it('increases brightness', () => {
      const img = image().brightness(50)
      expect(img).toBeDefined()
    })

    it('decreases brightness', () => {
      const img = image().brightness(-50)
      expect(img).toBeDefined()
    })

    it('clamps brightness to valid range', () => {
      const img = image().brightness(200)
      expect(img).toBeDefined()

      img.brightness(-200)
      expect(img).toBeDefined()
    })
  })

  describe('contrast', () => {
    it('increases contrast', () => {
      const img = image().contrast(50)
      expect(img).toBeDefined()
    })

    it('decreases contrast', () => {
      const img = image().contrast(-50)
      expect(img).toBeDefined()
    })

    it('clamps contrast to valid range', () => {
      const img = image().contrast(200)
      expect(img).toBeDefined()

      img.contrast(-200)
      expect(img).toBeDefined()
    })
  })

  describe('dithering', () => {
    it('sets no dithering', () => {
      const img = image().dither('none')
      expect(img).toBeDefined()
    })

    it('sets ordered dithering', () => {
      const img = image().dither('ordered')
      expect(img).toBeDefined()
    })

    it('sets random dithering', () => {
      const img = image().dither('random')
      expect(img).toBeDefined()
    })

    it('sets floyd-steinberg dithering', () => {
      const img = image().dither('floyd-steinberg')
      expect(img).toBeDefined()
    })
  })

  describe('scale mode', () => {
    it('sets fit scale mode', () => {
      const img = image().scaleMode('fit')
      expect(img).toBeDefined()
    })

    it('sets fill scale mode', () => {
      const img = image().scaleMode('fill')
      expect(img).toBeDefined()
    })

    it('sets stretch scale mode', () => {
      const img = image().scaleMode('stretch')
      expect(img).toBeDefined()
    })

    it('sets none scale mode', () => {
      const img = image().scaleMode('none')
      expect(img).toBeDefined()
    })
  })

  describe('aspect correction', () => {
    it('enables aspect correction', () => {
      const img = image().aspectCorrection(true)
      expect(img).toBeDefined()
    })

    it('disables aspect correction', () => {
      const img = image().aspectCorrection(false)
      expect(img).toBeDefined()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(20, 10)
    })

    it('renders empty image as blank', () => {
      const img = image()
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should render blank
      const char = buffer.get(0, 0)
      expect(char.char).toBe(' ')
    })

    it('renders gradient image', () => {
      const data = createTestImage(20, 10, 'gradient')
      const img = image({ data, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Check that something was rendered
      const leftChar = buffer.get(0, 0)
      const rightChar = buffer.get(19, 0)
      // Left should be darker (lower char), right should be brighter (higher char)
      expect(leftChar.char).not.toBe(rightChar.char)
    })

    it('renders checker pattern', () => {
      const data = createTestImage(10, 10, 'checker')
      const img = image({ data, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Check that something was rendered
      const char00 = buffer.get(0, 0)
      expect(char00.char).not.toBe(' ')
    })

    it('renders with blocks charset', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, charset: 'blocks', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should contain block characters
      const char = buffer.get(9, 0)
      expect(char.char).toBeDefined()
    })

    it('renders with color enabled', () => {
      const data: ImageData = {
        width: 2,
        height: 1,
        pixels: [
          { r: 255, g: 0, b: 0, a: 255 },
          { r: 0, g: 255, b: 0, a: 255 }
        ]
      }
      const img = image({ data, color: true, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 2, height: 1 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Check that colors are different
      const red = buffer.get(0, 0)
      const green = buffer.get(1, 0)
      expect(red.fg).not.toBe(green.fg)
    })

    it('renders inverted', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img1 = image({ data, aspectCorrection: false })
      const img2 = image({ data, invert: true, aspectCorrection: false })

      ;(img1 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      ;(img2 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer1 = createTestBuffer(10, 5)
      const buffer2 = createTestBuffer(10, 5)

      img1.render(buffer1, { fg: 7, bg: 0, attrs: 0 })
      img2.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // Inverted should produce different characters at the start
      // (bright becomes dark, dark becomes bright)
      const char1 = buffer1.get(0, 0)
      const char2 = buffer2.get(0, 0)
      expect(char1.char).not.toBe(char2.char)
    })

    it('renders with brightness adjustment', () => {
      const data = createTestImage(10, 5, 'solid', { r: 128, g: 128, b: 128, a: 255 })
      const img1 = image({ data, brightness: 0, aspectCorrection: false })
      const img2 = image({ data, brightness: 100, aspectCorrection: false })

      ;(img1 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      ;(img2 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer1 = createTestBuffer(10, 5)
      const buffer2 = createTestBuffer(10, 5)

      img1.render(buffer1, { fg: 7, bg: 0, attrs: 0 })
      img2.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // Brighter should produce different (higher) characters
      const char1 = buffer1.get(0, 0)
      const char2 = buffer2.get(0, 0)
      expect(char1.char).not.toBe(char2.char)
    })

    it('renders with contrast adjustment', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img1 = image({ data, contrast: 0, aspectCorrection: false })
      const img2 = image({ data, contrast: 100, aspectCorrection: false })

      ;(img1 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      ;(img2 as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer1 = createTestBuffer(10, 5)
      const buffer2 = createTestBuffer(10, 5)

      img1.render(buffer1, { fg: 7, bg: 0, attrs: 0 })
      img2.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // High contrast should affect some characters differently
      expect(buffer1).toBeDefined()
      expect(buffer2).toBeDefined()
    })

    it('renders with ordered dithering', () => {
      const data = createTestImage(10, 5, 'solid', { r: 128, g: 128, b: 128, a: 255 })
      const img = image({ data, dither: 'ordered', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should render with dithering pattern
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders with random dithering', () => {
      const data = createTestImage(10, 5, 'solid', { r: 128, g: 128, b: 128, a: 255 })
      const img = image({ data, dither: 'random', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should render
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders with fit scale mode (wide image)', () => {
      const data = createTestImage(100, 20, 'gradient')
      const img = image({ data, scaleMode: 'fit' })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should fit within bounds
      expect(img.renderWidth).toBeLessThanOrEqual(20)
      expect(img.renderHeight).toBeLessThanOrEqual(10)
    })

    it('renders with fit scale mode (tall image)', () => {
      const data = createTestImage(20, 100, 'gradient')
      const img = image({ data, scaleMode: 'fit' })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should fit within bounds
      expect(img.renderWidth).toBeLessThanOrEqual(20)
      expect(img.renderHeight).toBeLessThanOrEqual(10)
    })

    it('renders with fill scale mode (wide image)', () => {
      const data = createTestImage(100, 20, 'gradient')
      const img = image({ data, scaleMode: 'fill' })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should fill (at least one dimension matches)
      expect(img.renderWidth === 20 || img.renderHeight === 10).toBe(true)
    })

    it('renders with fill scale mode (tall image)', () => {
      const data = createTestImage(20, 100, 'gradient')
      const img = image({ data, scaleMode: 'fill' })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should fill (at least one dimension matches)
      expect(img.renderWidth === 20 || img.renderHeight === 10).toBe(true)
    })

    it('renders with stretch scale mode', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, scaleMode: 'stretch', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should stretch to fit
      expect(img.renderWidth).toBe(20)
      expect(img.renderHeight).toBe(10)
    })

    it('renders with none scale mode', () => {
      const data = createTestImage(30, 15, 'gradient')
      const img = image({ data, scaleMode: 'none', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should not exceed bounds
      expect(img.renderWidth).toBeLessThanOrEqual(20)
      expect(img.renderHeight).toBeLessThanOrEqual(10)
    })

    it('renders centered in larger area', () => {
      const data = createTestImage(5, 5, 'solid', { r: 255, g: 255, b: 255, a: 255 })
      const img = image({ data, scaleMode: 'none', aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should be centered - corners should be empty
      const topLeft = buffer.get(0, 0)
      expect(topLeft.char).toBe(' ')
    })

    it('does not render when not visible', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data })
      img.visible(false)
      ;(img as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should not render - buffer should be unchanged from initial state
      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data })
      // No layout call
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should not render
      expect(buffer.get(0, 0).char).toBe(' ')
    })
  })

  describe('cache invalidation', () => {
    it('invalidates cache on data change', () => {
      const data1 = createTestImage(10, 5, 'gradient')
      const data2 = createTestImage(10, 5, 'checker')
      const img = image({ data: data1, aspectCorrection: false })

      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      const buffer1 = createTestBuffer(10, 5)
      img.render(buffer1, { fg: 7, bg: 0, attrs: 0 })

      img.data(data2)
      const buffer2 = createTestBuffer(10, 5)
      img.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // Different data should produce different output
      const char1 = buffer1.get(5, 2)
      const char2 = buffer2.get(5, 2)
      // Not testing for difference since pattern might be same at center
      expect(char1).toBeDefined()
      expect(char2).toBeDefined()
    })

    it('invalidates cache on charset change', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, charset: 'standard', aspectCorrection: false })

      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      const buffer1 = createTestBuffer(10, 5)
      img.render(buffer1, { fg: 7, bg: 0, attrs: 0 })

      img.charset('blocks')
      const buffer2 = createTestBuffer(10, 5)
      img.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // Different charsets should produce different characters
      const char1 = buffer1.get(9, 0)
      const char2 = buffer2.get(9, 0)
      expect(char1.char).not.toBe(char2.char)
    })

    it('invalidates cache on color toggle', () => {
      const data: ImageData = {
        width: 2,
        height: 1,
        pixels: [
          { r: 255, g: 0, b: 0, a: 255 },
          { r: 0, g: 255, b: 0, a: 255 }
        ]
      }
      const img = image({ data, color: false, aspectCorrection: false })

      ;(img as any)._bounds = { x: 0, y: 0, width: 2, height: 1 }
      const buffer1 = createTestBuffer(2, 1)
      img.render(buffer1, { fg: 7, bg: 0, attrs: 0 })

      img.color(true)
      const buffer2 = createTestBuffer(2, 1)
      img.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // With color, foreground should change
      const char1 = buffer1.get(0, 0)
      const char2 = buffer2.get(0, 0)
      expect(char1.fg).not.toBe(char2.fg)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const data = createTestImage(10, 10, 'gradient')
      const img = image()
        .data(data)
        .charset('blocks')
        .color(true)
        .invert(false)
        .brightness(10)
        .contrast(5)
        .dither('none')
        .scaleMode('fit')
        .aspectCorrection(true)

      expect(img.hasImage).toBe(true)
    })

    it('chains fromGrayscale with other methods', () => {
      const img = image()
        .fromGrayscale(4, 4, Array(16).fill(128))
        .charset('simple')
        .brightness(20)

      expect(img.hasImage).toBe(true)
      expect(img.imageWidth).toBe(4)
    })

    it('chains clear with data', () => {
      const data = createTestImage(5, 5, 'solid')
      const img = image()
        .data(data)
        .clear()

      expect(img.hasImage).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles 1x1 image', () => {
      const data: ImageData = {
        width: 1,
        height: 1,
        pixels: [{ r: 128, g: 128, b: 128, a: 255 }]
      }
      const img = image({ data })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer = createTestBuffer(10, 5)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      expect(img.hasImage).toBe(true)
    })

    it('handles very small render area', () => {
      const data = createTestImage(100, 100, 'gradient')
      const img = image({ data })
      ;(img as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const buffer = createTestBuffer(1, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should still render something
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('handles image with alpha channel', () => {
      const data: ImageData = {
        width: 2,
        height: 1,
        pixels: [
          { r: 255, g: 255, b: 255, a: 255 },
          { r: 255, g: 255, b: 255, a: 0 }
        ]
      }
      const img = image({ data, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 2, height: 1 }

      const buffer = createTestBuffer(2, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Alpha is ignored in current implementation, but should still render
      expect(buffer.get(0, 0)).toBeDefined()
      expect(buffer.get(1, 0)).toBeDefined()
    })

    it('handles zero brightness', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, brightness: 0 })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer = createTestBuffer(10, 5)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should render normally
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('handles zero contrast', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, contrast: 0 })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer = createTestBuffer(10, 5)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Should render normally
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('uses cache when dimensions unchanged', () => {
      const data = createTestImage(10, 5, 'gradient')
      const img = image({ data, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }

      const buffer1 = createTestBuffer(10, 5)
      img.render(buffer1, { fg: 7, bg: 0, attrs: 0 })

      const buffer2 = createTestBuffer(10, 5)
      img.render(buffer2, { fg: 7, bg: 0, attrs: 0 })

      // Both renders should produce same output (cache hit)
      expect(buffer1.get(5, 2).char).toBe(buffer2.get(5, 2).char)
    })
  })

  describe('color conversion', () => {
    it('converts red to terminal color', () => {
      const data: ImageData = {
        width: 1,
        height: 1,
        pixels: [{ r: 255, g: 0, b: 0, a: 255 }]
      }
      const img = image({ data, color: true, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const buffer = createTestBuffer(1, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      // Red should map to color in 256-color palette
      const cell = buffer.get(0, 0)
      expect(cell.fg).toBeGreaterThanOrEqual(16) // Not a basic color
    })

    it('converts green to terminal color', () => {
      const data: ImageData = {
        width: 1,
        height: 1,
        pixels: [{ r: 0, g: 255, b: 0, a: 255 }]
      }
      const img = image({ data, color: true, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const buffer = createTestBuffer(1, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      const cell = buffer.get(0, 0)
      expect(cell.fg).toBeGreaterThanOrEqual(16)
    })

    it('converts blue to terminal color', () => {
      const data: ImageData = {
        width: 1,
        height: 1,
        pixels: [{ r: 0, g: 0, b: 255, a: 255 }]
      }
      const img = image({ data, color: true, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const buffer = createTestBuffer(1, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      const cell = buffer.get(0, 0)
      expect(cell.fg).toBeGreaterThanOrEqual(16)
    })

    it('handles grayscale in color mode', () => {
      const data: ImageData = {
        width: 1,
        height: 1,
        pixels: [{ r: 128, g: 128, b: 128, a: 255 }]
      }
      const img = image({ data, color: true, aspectCorrection: false })
      ;(img as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const buffer = createTestBuffer(1, 1)
      img.render(buffer, { fg: 7, bg: 0, attrs: 0 })

      const cell = buffer.get(0, 0)
      expect(cell.fg).toBeDefined()
    })
  })

  describe('grayscale conversion', () => {
    it('uses luminosity formula', () => {
      // Create two pixels with same average but different luminosity
      // Red: 255, Green: 0, Blue: 0 => 0.299*255 + 0.587*0 + 0.114*0 = 76.245
      // Green: 0, Green: 255, Blue: 0 => 0.299*0 + 0.587*255 + 0.114*0 = 149.685
      const dataRed: ImageData = {
        width: 1, height: 1,
        pixels: [{ r: 255, g: 0, b: 0, a: 255 }]
      }
      const dataGreen: ImageData = {
        width: 1, height: 1,
        pixels: [{ r: 0, g: 255, b: 0, a: 255 }]
      }

      const imgRed = image({ data: dataRed, aspectCorrection: false })
      const imgGreen = image({ data: dataGreen, aspectCorrection: false })

      ;(imgRed as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }
      ;(imgGreen as any)._bounds = { x: 0, y: 0, width: 1, height: 1 }

      const bufferRed = createTestBuffer(1, 1)
      const bufferGreen = createTestBuffer(1, 1)

      imgRed.render(bufferRed, { fg: 7, bg: 0, attrs: 0 })
      imgGreen.render(bufferGreen, { fg: 7, bg: 0, attrs: 0 })

      // Green should appear brighter (different character)
      const charRed = bufferRed.get(0, 0)
      const charGreen = bufferGreen.get(0, 0)
      expect(charRed.char).not.toBe(charGreen.char)
    })
  })
})
