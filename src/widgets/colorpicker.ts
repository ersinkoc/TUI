/**
 * @oxog/tui - ColorPicker Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Color picker mode.
 */
export type ColorPickerMode = 'basic16' | 'palette256' | 'grayscale' | 'rgb'

/**
 * RGB color.
 */
export interface RgbColor {
  r: number
  g: number
  b: number
}

/**
 * ColorPicker widget properties.
 */
export interface ColorPickerProps {
  /** Initial selected color (0-255) */
  color?: number
  /** Picker mode */
  mode?: ColorPickerMode
  /** Show color preview */
  showPreview?: boolean
  /** Show color value */
  showValue?: boolean
}

/**
 * ColorPicker node interface.
 */
export interface ColorPickerNode extends Node {
  readonly type: 'colorpicker'

  // Configuration
  color(value: number): this
  mode(mode: ColorPickerMode): this
  showPreview(show: boolean): this
  showValue(show: boolean): this

  // Navigation
  moveLeft(): this
  moveRight(): this
  moveUp(): this
  moveDown(): this
  selectColor(value: number): this

  // Events
  onChange(handler: (color: number, rgb: RgbColor) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly selectedColor: number
  readonly selectedRgb: RgbColor
}

// ============================================================
// Implementation
// ============================================================

// Standard 16 colors (basic terminal colors)
const BASIC_16_COLORS: RgbColor[] = [
  { r: 0, g: 0, b: 0 },       // 0 black
  { r: 128, g: 0, b: 0 },     // 1 red
  { r: 0, g: 128, b: 0 },     // 2 green
  { r: 128, g: 128, b: 0 },   // 3 yellow
  { r: 0, g: 0, b: 128 },     // 4 blue
  { r: 128, g: 0, b: 128 },   // 5 magenta
  { r: 0, g: 128, b: 128 },   // 6 cyan
  { r: 192, g: 192, b: 192 }, // 7 white
  { r: 128, g: 128, b: 128 }, // 8 bright black
  { r: 255, g: 0, b: 0 },     // 9 bright red
  { r: 0, g: 255, b: 0 },     // 10 bright green
  { r: 255, g: 255, b: 0 },   // 11 bright yellow
  { r: 0, g: 0, b: 255 },     // 12 bright blue
  { r: 255, g: 0, b: 255 },   // 13 bright magenta
  { r: 0, g: 255, b: 255 },   // 14 bright cyan
  { r: 255, g: 255, b: 255 }  // 15 bright white
]

class ColorPickerNodeImpl extends LeafNode implements ColorPickerNode {
  readonly type = 'colorpicker' as const

  private _color: number = 7
  private _mode: ColorPickerMode = 'palette256'
  private _showPreview: boolean = true
  private _showValue: boolean = true
  private _isFocused: boolean = false

  private _onChangeHandlers: ((color: number, rgb: RgbColor) => void)[] = []

  constructor(props?: ColorPickerProps) {
    super()
    if (props) {
      if (props.color !== undefined) this._color = Math.max(0, Math.min(255, props.color))
      if (props.mode) this._mode = props.mode
      if (props.showPreview !== undefined) this._showPreview = props.showPreview
      if (props.showValue !== undefined) this._showValue = props.showValue
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get selectedColor(): number {
    return this._color
  }

  get selectedRgb(): RgbColor {
    return this.colorToRgb(this._color)
  }

  // Convert color index to RGB
  private colorToRgb(color: number): RgbColor {
    if (color < 16) {
      return BASIC_16_COLORS[color] ?? { r: 0, g: 0, b: 0 }
    }

    if (color >= 232) {
      // Grayscale (232-255)
      const gray = (color - 232) * 10 + 8
      return { r: gray, g: gray, b: gray }
    }

    // 216 color cube (16-231)
    const c = color - 16
    const r = Math.floor(c / 36)
    const g = Math.floor((c % 36) / 6)
    const b = c % 6

    return {
      r: r > 0 ? r * 40 + 55 : 0,
      g: g > 0 ? g * 40 + 55 : 0,
      b: b > 0 ? b * 40 + 55 : 0
    }
  }

  // Configuration
  color(value: number): this {
    const newColor = Math.max(0, Math.min(255, value))
    if (newColor !== this._color) {
      this._color = newColor
      this.emitChange()
      this.markDirty()
    }
    return this
  }

  mode(mode: ColorPickerMode): this {
    this._mode = mode
    this.markDirty()
    return this
  }

  showPreview(show: boolean): this {
    this._showPreview = show
    this.markDirty()
    return this
  }

  showValue(show: boolean): this {
    this._showValue = show
    this.markDirty()
    return this
  }

  // Navigation
  moveLeft(): this {
    switch (this._mode) {
      case 'basic16':
        this._color = Math.max(0, this._color - 1)
        break
      case 'palette256':
        if (this._color >= 16 && this._color < 232) {
          // In the 6x6x6 cube
          const c = this._color - 16
          const row = Math.floor(c / 6)
          const col = c % 6
          if (col > 0) {
            this._color = 16 + row * 6 + (col - 1)
          }
        } else {
          this._color = Math.max(0, this._color - 1)
        }
        break
      case 'grayscale':
        this._color = Math.max(232, this._color - 1)
        break
      case 'rgb':
        // Decrement blue
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const b = c % 6
          if (b > 0) {
            this._color = this._color - 1
          }
        }
        break
    }
    this.emitChange()
    this.markDirty()
    return this
  }

  moveRight(): this {
    switch (this._mode) {
      case 'basic16':
        this._color = Math.min(15, this._color + 1)
        break
      case 'palette256':
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const row = Math.floor(c / 6)
          const col = c % 6
          if (col < 5) {
            this._color = 16 + row * 6 + (col + 1)
          }
        } else if (this._color < 16) {
          this._color = Math.min(15, this._color + 1)
        } else {
          this._color = Math.min(255, this._color + 1)
        }
        break
      case 'grayscale':
        this._color = Math.min(255, this._color + 1)
        break
      case 'rgb':
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const b = c % 6
          if (b < 5) {
            this._color = this._color + 1
          }
        }
        break
    }
    this.emitChange()
    this.markDirty()
    return this
  }

  moveUp(): this {
    switch (this._mode) {
      case 'basic16':
        if (this._color >= 8) {
          this._color -= 8
        }
        break
      case 'palette256':
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const layer = Math.floor(c / 36)
          const inLayer = c % 36
          if (layer > 0) {
            this._color = 16 + (layer - 1) * 36 + inLayer
          }
        } else if (this._color >= 232) {
          // Move from grayscale to color cube
          this._color = 231
        } else if (this._color >= 8) {
          this._color -= 8
        }
        break
      case 'grayscale':
        this._color = Math.max(232, this._color - 6)
        break
      case 'rgb':
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const g = Math.floor((c % 36) / 6)
          if (g > 0) {
            this._color = this._color - 6
          }
        }
        break
    }
    this.emitChange()
    this.markDirty()
    return this
  }

  moveDown(): this {
    switch (this._mode) {
      case 'basic16':
        if (this._color < 8) {
          this._color += 8
        }
        break
      case 'palette256':
        if (this._color < 16 && this._color < 8) {
          this._color += 8
        } else if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const layer = Math.floor(c / 36)
          const inLayer = c % 36
          if (layer < 5) {
            this._color = 16 + (layer + 1) * 36 + inLayer
          }
        } else if (this._color < 16) {
          // Move to color cube
          this._color = 16
        }
        break
      case 'grayscale':
        this._color = Math.min(255, this._color + 6)
        break
      case 'rgb':
        if (this._color >= 16 && this._color < 232) {
          const c = this._color - 16
          const g = Math.floor((c % 36) / 6)
          if (g < 5) {
            this._color = this._color + 6
          }
        }
        break
    }
    this.emitChange()
    this.markDirty()
    return this
  }

  selectColor(value: number): this {
    return this.color(value)
  }

  // Events
  onChange(handler: (color: number, rgb: RgbColor) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  private emitChange(): void {
    const rgb = this.colorToRgb(this._color)
    for (const handler of this._onChangeHandlers) {
      handler(this._color, rgb)
    }
  }

  // Focus
  override focus(): this {
    this._isFocused = true
    this.markDirty()
    return this
  }

  override blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  /**
   * Dispose of colorpicker and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onChangeHandlers = []
    super.dispose()
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case 'left':
      case 'h':
        this.moveLeft()
        return true
      case 'right':
      case 'l':
        this.moveRight()
        return true
      case 'up':
      case 'k':
        this.moveUp()
        return true
      case 'down':
      case 'j':
        this.moveDown()
        return true
      case '1':
        this.mode('basic16')
        return true
      case '2':
        this.mode('palette256')
        return true
      case '3':
        this.mode('grayscale')
        return true
      case '4':
        this.mode('rgb')
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      this._isFocused = true

      // Calculate which color was clicked
      const relX = x - bounds.x
      const relY = y - bounds.y

      const clickedColor = this.getColorAtPosition(relX, relY, bounds.width, bounds.height)
      if (clickedColor !== null) {
        this._color = clickedColor
        this.emitChange()
      }

      this.markDirty()
      return true
    }

    return false
  }

  private getColorAtPosition(x: number, y: number, width: number, height: number): number | null {
    const previewHeight = this._showPreview ? 2 : 0
    const valueHeight = this._showValue ? 1 : 0
    const paletteHeight = height - previewHeight - valueHeight

    if (y >= previewHeight && y < previewHeight + paletteHeight) {
      const paletteY = y - previewHeight

      switch (this._mode) {
        case 'basic16': {
          const cols = Math.min(8, width / 2)
          const rows = 2
          const col = Math.floor(x / 2)
          const row = paletteY
          if (col < cols && row < rows) {
            return row * 8 + col
          }
          break
        }
        case 'palette256': {
          // 6x6 grid per layer, 6 layers
          const cellWidth = Math.max(1, Math.floor(width / 6))
          const col = Math.floor(x / cellWidth)
          const layer = paletteY
          if (col < 6 && layer < 6) {
            return 16 + layer * 36 + col * 6
          }
          break
        }
        case 'grayscale': {
          const grayIdx = Math.floor(x / (width / 24))
          if (grayIdx < 24) {
            return 232 + grayIdx
          }
          break
        }
      }
    }

    return null
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Clear buffer
    for (let y = 0; y < bounds.height; y++) {
      for (let x = 0; x < bounds.width; x++) {
        buffer.set(bounds.x + x, bounds.y + y, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    let currentY = bounds.y

    // Preview
    if (this._showPreview && bounds.height >= 2) {
      this.renderPreview(buffer, bounds.x, currentY, bounds.width, fg, bg)
      currentY += 2
    }

    // Palette
    const paletteHeight = bounds.height - (this._showPreview ? 2 : 0) - (this._showValue ? 1 : 0)
    if (paletteHeight > 0) {
      this.renderPalette(buffer, bounds.x, currentY, bounds.width, paletteHeight, fg, bg)
      currentY += paletteHeight
    }

    // Value display
    if (this._showValue && currentY < bounds.y + bounds.height) {
      this.renderValue(buffer, bounds.x, currentY, bounds.width, fg, bg)
    }
  }

  private renderPreview(buffer: Buffer, x: number, y: number, width: number, fg: number, bg: number): void {
    // Show preview swatch
    const rgb = this.colorToRgb(this._color)
    const previewChar = '\u2588' // █

    // Top row: colored block
    for (let i = 0; i < Math.min(4, width); i++) {
      buffer.set(x + i, y, { char: previewChar, fg: this._color, bg, attrs: 0 })
    }

    // Label
    const label = `Color ${this._color}`
    if (width > 6) {
      buffer.write(x + 5, y, label, { fg, bg, attrs: 0 })
    }

    // Second row: RGB values
    const rgbStr = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`
    buffer.write(x, y + 1, rgbStr, { fg, bg, attrs: 0 })
  }

  private renderPalette(buffer: Buffer, x: number, y: number, width: number, height: number, _fg: number, _bg: number): void {
    switch (this._mode) {
      case 'basic16':
        this.renderBasic16(buffer, x, y, width, height)
        break
      case 'palette256':
        this.renderPalette256(buffer, x, y, width, height)
        break
      case 'grayscale':
        this.renderGrayscale(buffer, x, y, width, height)
        break
      case 'rgb':
        this.renderRgbCube(buffer, x, y, width, height)
        break
    }
  }

  private renderBasic16(buffer: Buffer, x: number, y: number, width: number, height: number): void {
    const cellWidth = Math.max(2, Math.floor(width / 8))
    const block = '\u2588\u2588' // ██

    for (let row = 0; row < Math.min(2, height); row++) {
      for (let col = 0; col < 8; col++) {
        const color = row * 8 + col
        const cx = x + col * cellWidth
        const isSelected = color === this._color && this._isFocused

        if (isSelected) {
          buffer.write(cx, y + row, '[]', { fg: color, bg: DEFAULT_BG, attrs: ATTR_BOLD | ATTR_INVERSE })
        } else {
          buffer.write(cx, y + row, block.slice(0, cellWidth), { fg: color, bg: DEFAULT_BG, attrs: 0 })
        }
      }
    }
  }

  private renderPalette256(buffer: Buffer, x: number, y: number, width: number, height: number): void {
    const cellWidth = Math.max(1, Math.floor(width / 36))
    const block = '\u2588'

    // Render 6 layers of 6x6 color grid
    for (let layer = 0; layer < Math.min(6, height); layer++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          const color = 16 + layer * 36 + g * 6 + b
          const cx = x + (g * 6 + b) * cellWidth
          const isSelected = color === this._color && this._isFocused

          if (cx < x + width) {
            if (isSelected) {
              buffer.set(cx, y + layer, { char: '\u25a0', fg: color, bg: DEFAULT_BG, attrs: ATTR_BOLD })
            } else {
              buffer.set(cx, y + layer, { char: block, fg: color, bg: DEFAULT_BG, attrs: 0 })
            }
          }
        }
      }
    }
  }

  private renderGrayscale(buffer: Buffer, x: number, y: number, width: number, height: number): void {
    const cellWidth = Math.max(1, Math.floor(width / 24))
    const block = '\u2588'

    for (let row = 0; row < Math.min(4, height); row++) {
      for (let col = 0; col < 6; col++) {
        const idx = row * 6 + col
        if (idx >= 24) break

        const color = 232 + idx
        const cx = x + col * cellWidth
        const isSelected = color === this._color && this._isFocused

        if (isSelected) {
          buffer.set(cx, y + row, { char: '\u25a0', fg: color, bg: DEFAULT_BG, attrs: ATTR_BOLD })
        } else {
          buffer.set(cx, y + row, { char: block, fg: color, bg: DEFAULT_BG, attrs: 0 })
        }
      }
    }
  }

  private renderRgbCube(buffer: Buffer, x: number, y: number, width: number, height: number): void {
    // Show current RGB layer
    if (this._color < 16 || this._color >= 232) {
      // Not in cube, show nothing special
      return
    }

    const c = this._color - 16
    const r = Math.floor(c / 36)
    const block = '\u2588'

    // Show 6x6 grid for current red value
    for (let g = 0; g < Math.min(6, height); g++) {
      for (let b = 0; b < Math.min(6, width); b++) {
        const color = 16 + r * 36 + g * 6 + b
        const cx = x + b * 2
        const isSelected = color === this._color && this._isFocused

        if (isSelected) {
          buffer.write(cx, y + g, '[]', { fg: color, bg: DEFAULT_BG, attrs: ATTR_BOLD | ATTR_INVERSE })
        } else {
          buffer.write(cx, y + g, block + block, { fg: color, bg: DEFAULT_BG, attrs: 0 })
        }
      }
    }

    // Show R value label
    if (width > 14) {
      buffer.write(x + 14, y, `R=${r}`, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    }
  }

  private renderValue(buffer: Buffer, x: number, y: number, width: number, fg: number, bg: number): void {
    const rgb = this.colorToRgb(this._color)
    const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`
    const modeLabels: Record<ColorPickerMode, string> = {
      basic16: '1:Basic',
      palette256: '2:256',
      grayscale: '3:Gray',
      rgb: '4:RGB'
    }
    const info = `${hex} | ${modeLabels[this._mode]}`
    buffer.write(x, y, info.slice(0, width), { fg, bg, attrs: 0 })
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a color picker widget.
 *
 * @param props - ColorPicker properties
 * @returns ColorPicker node
 *
 * @example
 * ```typescript
 * // Basic color picker
 * const picker = colorpicker({
 *   color: 10,
 *   mode: 'palette256',
 *   showPreview: true
 * })
 *
 * // Handle color changes
 * picker.onChange((color, rgb) => {
 *   console.log(`Selected: ${color} RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
 * })
 *
 * // Navigate
 * picker.moveRight()
 * picker.moveDown()
 *
 * // Switch modes
 * picker.mode('grayscale')
 * picker.mode('basic16')
 * ```
 */
export function colorpicker(props?: ColorPickerProps): ColorPickerNode {
  return new ColorPickerNodeImpl(props)
}
