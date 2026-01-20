/**
 * @oxog/tui - Image Widget (ASCII Art)
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'

// ============================================================
// Types
// ============================================================

/**
 * Pixel data.
 */
export interface Pixel {
  /** Red (0-255) */
  r: number
  /** Green (0-255) */
  g: number
  /** Blue (0-255) */
  b: number
  /** Alpha (0-255), optional */
  a?: number
}

/**
 * Image data format.
 */
export interface ImageData {
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Pixel data (row-major order) */
  pixels: Pixel[]
}

/**
 * ASCII character set type.
 */
export type AsciiCharset =
  | 'standard'   // Classic ASCII characters: @%#*+=-:.
  | 'blocks'     // Unicode block characters: ████▓▓▒▒░░
  | 'braille'    // Braille patterns for high resolution
  | 'simple'     // Simple: #=-.
  | 'detailed'   // More detailed: $@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`'.

/**
 * Dithering algorithm.
 */
export type DitherAlgorithm = 'none' | 'floyd-steinberg' | 'ordered' | 'random'

/**
 * Scaling mode.
 */
export type ScaleMode = 'fit' | 'fill' | 'stretch' | 'none'

/**
 * Image widget properties.
 */
export interface ImageProps {
  /** Image data */
  data?: ImageData
  /** ASCII character set */
  charset?: AsciiCharset
  /** Enable color rendering */
  color?: boolean
  /** Invert brightness */
  invert?: boolean
  /** Brightness adjustment (-100 to 100) */
  brightness?: number
  /** Contrast adjustment (-100 to 100) */
  contrast?: number
  /** Dithering algorithm */
  dither?: DitherAlgorithm
  /** Scale mode */
  scaleMode?: ScaleMode
  /** Aspect ratio correction (terminals have ~2:1 character ratio) */
  aspectCorrection?: boolean
}

/**
 * Image node interface.
 */
export interface ImageNode extends Node {
  readonly type: 'image'

  // Configuration
  data(imageData: ImageData): this
  fromGrayscale(width: number, height: number, values: number[]): this
  charset(set: AsciiCharset): this
  color(enabled: boolean): this
  invert(enabled: boolean): this
  brightness(value: number): this
  contrast(value: number): this
  dither(algorithm: DitherAlgorithm): this
  scaleMode(mode: ScaleMode): this
  aspectCorrection(enabled: boolean): this
  clear(): this

  // State
  readonly hasImage: boolean
  readonly imageWidth: number
  readonly imageHeight: number
  readonly renderWidth: number
  readonly renderHeight: number
}

// ============================================================
// Character sets
// ============================================================

const CHARSETS: Record<AsciiCharset, string> = {
  standard: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  braille: ' ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿',
  simple: ' .-=#',
  detailed: " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@"
}

// ============================================================
// Implementation
// ============================================================

class ImageNodeImpl extends LeafNode implements ImageNode {
  readonly type = 'image' as const

  private _data: ImageData | null = null
  private _charset: AsciiCharset = 'standard'
  private _color: boolean = false
  private _invert: boolean = false
  private _brightness: number = 0
  private _contrast: number = 0
  private _dither: DitherAlgorithm = 'none'
  private _scaleMode: ScaleMode = 'fit'
  private _aspectCorrection: boolean = true

  // Cached render data
  private _renderCache: { char: string; fg: number; bg: number }[][] | null = null
  private _cacheWidth: number = 0
  private _cacheHeight: number = 0

  constructor(props?: ImageProps) {
    super()
    if (props) {
      if (props.data) this._data = props.data
      if (props.charset) this._charset = props.charset
      if (props.color !== undefined) this._color = props.color
      if (props.invert !== undefined) this._invert = props.invert
      if (props.brightness !== undefined) this._brightness = props.brightness
      if (props.contrast !== undefined) this._contrast = props.contrast
      if (props.dither) this._dither = props.dither
      if (props.scaleMode) this._scaleMode = props.scaleMode
      if (props.aspectCorrection !== undefined) this._aspectCorrection = props.aspectCorrection
    }
  }

  // State getters
  get hasImage(): boolean {
    return this._data !== null
  }

  get imageWidth(): number {
    return this._data?.width ?? 0
  }

  get imageHeight(): number {
    return this._data?.height ?? 0
  }

  get renderWidth(): number {
    return this._cacheWidth
  }

  get renderHeight(): number {
    return this._cacheHeight
  }

  // Configuration
  data(imageData: ImageData): this {
    this._data = imageData
    this._renderCache = null
    this.markDirty()
    return this
  }

  fromGrayscale(width: number, height: number, values: number[]): this {
    const pixels: Pixel[] = values.map((v) => ({
      r: v,
      g: v,
      b: v,
      a: 255
    }))
    this._data = { width, height, pixels }
    this._renderCache = null
    this.markDirty()
    return this
  }

  charset(set: AsciiCharset): this {
    this._charset = set
    this._renderCache = null
    this.markDirty()
    return this
  }

  color(enabled: boolean): this {
    this._color = enabled
    this._renderCache = null
    this.markDirty()
    return this
  }

  invert(enabled: boolean): this {
    this._invert = enabled
    this._renderCache = null
    this.markDirty()
    return this
  }

  brightness(value: number): this {
    this._brightness = Math.max(-100, Math.min(100, value))
    this._renderCache = null
    this.markDirty()
    return this
  }

  contrast(value: number): this {
    this._contrast = Math.max(-100, Math.min(100, value))
    this._renderCache = null
    this.markDirty()
    return this
  }

  dither(algorithm: DitherAlgorithm): this {
    this._dither = algorithm
    this._renderCache = null
    this.markDirty()
    return this
  }

  scaleMode(mode: ScaleMode): this {
    this._scaleMode = mode
    this._renderCache = null
    this.markDirty()
    return this
  }

  aspectCorrection(enabled: boolean): this {
    this._aspectCorrection = enabled
    this._renderCache = null
    this.markDirty()
    return this
  }

  clear(): this {
    this._data = null
    this._renderCache = null
    this.markDirty()
    return this
  }

  // Get pixel at position with bounds checking
  private getPixel(x: number, y: number): Pixel {
    if (!this._data) return { r: 0, g: 0, b: 0, a: 255 }
    const { width, height, pixels } = this._data
    x = Math.max(0, Math.min(width - 1, Math.floor(x)))
    y = Math.max(0, Math.min(height - 1, Math.floor(y)))
    return pixels[y * width + x] || { r: 0, g: 0, b: 0, a: 255 }
  }

  // Apply brightness and contrast adjustment
  private adjustPixel(pixel: Pixel): Pixel {
    let { r, g, b, a } = pixel

    // Apply brightness
    if (this._brightness !== 0) {
      const adj = (this._brightness / 100) * 255
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }

    // Apply contrast
    if (this._contrast !== 0) {
      const factor = (259 * (this._contrast + 255)) / (255 * (259 - this._contrast))
      r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
      g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
      b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
    }

    return { r, g, b, a }
  }

  // Convert pixel to grayscale (0-255)
  private pixelToGray(pixel: Pixel): number {
    // Use luminosity formula
    let gray = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b

    if (this._invert) {
      gray = 255 - gray
    }

    return Math.max(0, Math.min(255, gray))
  }

  // Convert grayscale to ASCII character
  private grayToChar(gray: number): string {
    const chars = CHARSETS[this._charset]
    const index = Math.floor((gray / 256) * chars.length)
    return chars[Math.min(chars.length - 1, Math.max(0, index))]
  }

  // Convert RGB to terminal color (basic 16 colors or 256 colors)
  private rgbToTermColor(r: number, g: number, b: number): number {
    // Use 256-color palette (16-231 for RGB cube)
    // RGB cube: 16 + 36*r + 6*g + b where r,g,b are 0-5
    const r6 = Math.round((r / 255) * 5)
    const g6 = Math.round((g / 255) * 5)
    const b6 = Math.round((b / 255) * 5)
    return 16 + 36 * r6 + 6 * g6 + b6
  }

  // Apply dithering
  private applyDither(gray: number, x: number, y: number): number {
    switch (this._dither) {
      case 'ordered': {
        // 4x4 Bayer matrix
        const bayerMatrix = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5]
        ]
        const threshold = (bayerMatrix[y % 4][x % 4] / 16) * 255
        return gray > threshold ? gray + 32 : gray - 32
      }
      case 'random': {
        const noise = (Math.random() - 0.5) * 64
        return gray + noise
      }
      case 'floyd-steinberg':
      case 'none':
      default:
        return gray
    }
  }

  // Build render cache
  private buildCache(targetWidth: number, targetHeight: number): void {
    if (!this._data) {
      this._renderCache = []
      this._cacheWidth = 0
      this._cacheHeight = 0
      return
    }

    const { width: srcWidth, height: srcHeight } = this._data

    // Calculate render dimensions based on scale mode
    let renderWidth = targetWidth
    let renderHeight = targetHeight

    // Apply aspect correction (terminal chars are roughly 2:1)
    const aspectRatio = srcWidth / srcHeight
    const correctedAspect = this._aspectCorrection ? aspectRatio * 2 : aspectRatio

    switch (this._scaleMode) {
      case 'fit': {
        const targetAspect = targetWidth / targetHeight
        if (correctedAspect > targetAspect) {
          renderWidth = targetWidth
          renderHeight = Math.max(1, Math.round(targetWidth / correctedAspect))
        } else {
          renderHeight = targetHeight
          renderWidth = Math.max(1, Math.round(targetHeight * correctedAspect))
        }
        break
      }
      case 'fill': {
        const targetAspect = targetWidth / targetHeight
        if (correctedAspect > targetAspect) {
          renderHeight = targetHeight
          renderWidth = Math.max(1, Math.round(targetHeight * correctedAspect))
        } else {
          renderWidth = targetWidth
          renderHeight = Math.max(1, Math.round(targetWidth / correctedAspect))
        }
        break
      }
      case 'stretch':
        // Use target dimensions directly
        break
      case 'none':
        renderWidth = Math.min(srcWidth, targetWidth)
        renderHeight = Math.min(srcHeight, targetHeight)
        break
    }

    // Clamp to target dimensions
    renderWidth = Math.min(renderWidth, targetWidth)
    renderHeight = Math.min(renderHeight, targetHeight)

    this._cacheWidth = renderWidth
    this._cacheHeight = renderHeight

    // Build the cache
    const cache: { char: string; fg: number; bg: number }[][] = []

    for (let y = 0; y < renderHeight; y++) {
      const row: { char: string; fg: number; bg: number }[] = []

      for (let x = 0; x < renderWidth; x++) {
        // Sample source image
        const srcX = (x / renderWidth) * srcWidth
        const srcY = (y / renderHeight) * srcHeight
        const pixel = this.getPixel(srcX, srcY)
        const adjustedPixel = this.adjustPixel(pixel)

        // Get grayscale value
        let gray = this.pixelToGray(adjustedPixel)

        // Apply dithering
        gray = this.applyDither(gray, x, y)
        gray = Math.max(0, Math.min(255, gray))

        // Get character
        const char = this.grayToChar(gray)

        // Get color if enabled
        let fg = DEFAULT_FG
        if (this._color) {
          fg = this.rgbToTermColor(adjustedPixel.r, adjustedPixel.g, adjustedPixel.b)
        }

        row.push({ char, fg, bg: DEFAULT_BG })
      }

      cache.push(row)
    }

    this._renderCache = cache
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Check if we need to rebuild cache
    if (
      !this._renderCache ||
      this._cacheWidth !== bounds.width ||
      this._cacheHeight !== bounds.height
    ) {
      this.buildCache(bounds.width, bounds.height)
    }

    if (!this._renderCache || !this._data) {
      // No image - fill with background
      for (let y = 0; y < bounds.height; y++) {
        for (let x = 0; x < bounds.width; x++) {
          buffer.set(bounds.x + x, bounds.y + y, { char: ' ', fg, bg, attrs: 0 })
        }
      }
      return
    }

    // Calculate centering offset
    const offsetX = Math.floor((bounds.width - this._cacheWidth) / 2)
    const offsetY = Math.floor((bounds.height - this._cacheHeight) / 2)

    // Fill background
    for (let y = 0; y < bounds.height; y++) {
      for (let x = 0; x < bounds.width; x++) {
        buffer.set(bounds.x + x, bounds.y + y, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Render the image
    for (let y = 0; y < this._cacheHeight; y++) {
      const row = this._renderCache[y]
      if (!row) continue

      for (let x = 0; x < this._cacheWidth; x++) {
        const cell = row[x]
        if (!cell) continue

        buffer.set(bounds.x + offsetX + x, bounds.y + offsetY + y, {
          char: cell.char,
          fg: this._color ? cell.fg : fg,
          bg,
          attrs: 0
        })
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create an image (ASCII art) widget.
 *
 * @param props - Image properties
 * @returns Image node
 *
 * @example
 * ```typescript
 * // Create image from grayscale data
 * const img = image()
 *   .fromGrayscale(4, 4, [
 *     0, 64, 128, 255,
 *     32, 96, 160, 224,
 *     64, 128, 192, 255,
 *     96, 160, 224, 255
 *   ])
 *   .charset('blocks')
 *
 * // Create image with color
 * const colorImg = image({
 *   color: true,
 *   charset: 'standard',
 *   scaleMode: 'fit'
 * }).data({
 *   width: 2,
 *   height: 2,
 *   pixels: [
 *     { r: 255, g: 0, b: 0 },   // red
 *     { r: 0, g: 255, b: 0 },   // green
 *     { r: 0, g: 0, b: 255 },   // blue
 *     { r: 255, g: 255, b: 0 }  // yellow
 *   ]
 * })
 *
 * // Apply adjustments
 * img.brightness(20)
 *    .contrast(10)
 *    .invert(true)
 *    .dither('ordered')
 * ```
 */
export function image(props?: ImageProps): ImageNode {
  return new ImageNodeImpl(props)
}
