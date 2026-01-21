/**
 * @oxog/tui - Tooltip Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Tooltip position relative to target.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'

/**
 * Tooltip widget properties.
 */
export interface TooltipProps {
  /** Tooltip text content */
  text?: string
  /** Position relative to target */
  position?: TooltipPosition
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold' | 'none'
  /** Show delay in ms (for hover simulation) */
  delay?: number
  /** Max width */
  maxWidth?: number
  /** Show arrow pointer */
  showArrow?: boolean
}

/**
 * Tooltip node interface.
 */
export interface TooltipNode extends Node {
  readonly type: 'tooltip'

  // Configuration
  text(content: string): this
  position(pos: TooltipPosition): this
  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this
  delay(ms: number): this
  maxWidth(width: number): this
  showArrow(show: boolean): this

  // Control
  show(targetX: number, targetY: number, targetWidth?: number, targetHeight?: number): this
  hide(): this
  toggle(targetX: number, targetY: number, targetWidth?: number, targetHeight?: number): this

  // State
  readonly isVisible: boolean
  readonly content: string
  readonly tooltipPosition: TooltipPosition
}

// ============================================================
// Implementation
// ============================================================

class TooltipNodeImpl extends LeafNode implements TooltipNode {
  readonly type = 'tooltip' as const

  private _text: string = ''
  private _position: TooltipPosition = 'top'
  private _border: 'single' | 'double' | 'rounded' | 'bold' | 'none' = 'rounded'
  private _delay: number = 0
  private _maxWidth: number = 40

  /** Get delay before showing tooltip */
  get delayMs(): number { return this._delay }
  private _showArrow: boolean = true

  private _targetX: number = 0
  private _targetY: number = 0
  private _targetWidth: number = 1
  private _targetHeight: number = 1

  constructor(props?: TooltipProps) {
    super()
    if (props) {
      if (props.text) this._text = props.text
      if (props.position) this._position = props.position
      if (props.border) this._border = props.border
      if (props.delay !== undefined) this._delay = props.delay
      if (props.maxWidth !== undefined) this._maxWidth = props.maxWidth
      if (props.showArrow !== undefined) this._showArrow = props.showArrow
    }
    // Tooltip starts hidden
    this._visible = false
  }

  // State getters
  get content(): string {
    return this._text
  }

  get tooltipPosition(): TooltipPosition {
    return this._position
  }

  // Configuration
  text(content: string): this {
    this._text = content
    this.markDirty()
    return this
  }

  position(pos: TooltipPosition): this {
    this._position = pos
    this.markDirty()
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold' | 'none'): this {
    this._border = style
    this.markDirty()
    return this
  }

  delay(ms: number): this {
    this._delay = ms
    return this
  }

  maxWidth(width: number): this {
    this._maxWidth = width
    this.markDirty()
    return this
  }

  showArrow(show: boolean): this {
    this._showArrow = show
    this.markDirty()
    return this
  }

  // Control
  show(targetX: number, targetY: number, targetWidth = 1, targetHeight = 1): this {
    this._targetX = targetX
    this._targetY = targetY
    this._targetWidth = targetWidth
    this._targetHeight = targetHeight
    this._visible = true
    this.markDirty()
    return this
  }

  hide(): this {
    if (this._visible) {
      this._visible = false
      this.markDirty()
    }
    return this
  }

  toggle(targetX: number, targetY: number, targetWidth = 1, targetHeight = 1): this {
    return this._visible ? this.hide() : this.show(targetX, targetY, targetWidth, targetHeight)
  }

  // Calculate tooltip dimensions
  private calculateDimensions(): { width: number; height: number; lines: string[] } {
    if (!this._text) {
      return { width: 0, height: 0, lines: [] }
    }

    // Word wrap text to max width
    const contentWidth = this._maxWidth - (this._border !== 'none' ? 4 : 2)
    const lines = this.wrapText(this._text, contentWidth)

    let maxLineWidth = 0
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, stringWidth(line))
    }

    const width = maxLineWidth + (this._border !== 'none' ? 4 : 2)
    const height = lines.length + (this._border !== 'none' ? 2 : 0)

    return { width, height, lines }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (stringWidth(text) <= maxWidth) {
      return [text]
    }

    const lines: string[] = []
    const words = text.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word

      if (stringWidth(testLine) <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        // Handle very long words
        if (stringWidth(word) > maxWidth) {
          currentLine = truncateToWidth(word, maxWidth)
        } else {
          currentLine = word
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  private calculatePosition(
    tooltipWidth: number,
    tooltipHeight: number,
    screenWidth: number,
    screenHeight: number
  ): { x: number; y: number; actualPosition: 'top' | 'bottom' | 'left' | 'right' } {
    let pos = this._position
    let x = 0
    let y = 0

    // Auto-detect best position
    if (pos === 'auto') {
      // Prefer top, then bottom, then right, then left
      if (this._targetY - tooltipHeight - 1 >= 0) {
        pos = 'top'
      } else if (this._targetY + this._targetHeight + tooltipHeight < screenHeight) {
        pos = 'bottom'
      } else if (this._targetX + this._targetWidth + tooltipWidth < screenWidth) {
        pos = 'right'
      } else {
        pos = 'left'
      }
    }

    switch (pos) {
      case 'top':
        x = this._targetX + Math.floor(this._targetWidth / 2) - Math.floor(tooltipWidth / 2)
        y = this._targetY - tooltipHeight - (this._showArrow ? 1 : 0)
        break
      case 'bottom':
        x = this._targetX + Math.floor(this._targetWidth / 2) - Math.floor(tooltipWidth / 2)
        y = this._targetY + this._targetHeight + (this._showArrow ? 1 : 0)
        break
      case 'left':
        x = this._targetX - tooltipWidth - (this._showArrow ? 1 : 0)
        y = this._targetY + Math.floor(this._targetHeight / 2) - Math.floor(tooltipHeight / 2)
        break
      case 'right':
        x = this._targetX + this._targetWidth + (this._showArrow ? 1 : 0)
        y = this._targetY + Math.floor(this._targetHeight / 2) - Math.floor(tooltipHeight / 2)
        break
    }

    // Clamp to screen bounds
    x = Math.max(0, Math.min(x, screenWidth - tooltipWidth))
    y = Math.max(0, Math.min(y, screenHeight - tooltipHeight))

    return { x, y, actualPosition: pos }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || !this._text) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const { width, height, lines } = this.calculateDimensions()
    if (width === 0 || height === 0) return

    // Get screen dimensions from buffer
    const screenWidth = buffer.width
    const screenHeight = buffer.height

    const { x, y, actualPosition } = this.calculatePosition(width, height, screenWidth, screenHeight)

    // Draw background
    for (let row = y; row < y + height && row < screenHeight; row++) {
      for (let col = x; col < x + width && col < screenWidth; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    if (this._border !== 'none') {
      const chars = BORDER_CHARS[this._border]
      drawRect(buffer, x, y, width, height, chars, { fg, bg, attrs: 0 })
    }

    // Draw text
    const borderOffset = this._border !== 'none' ? 1 : 0
    const textX = x + borderOffset + 1
    const textY = y + borderOffset

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (textY + i < screenHeight) {
        buffer.write(textX, textY + i, line, { fg, bg, attrs: 0 })
      }
    }

    // Draw arrow
    if (this._showArrow) {
      const arrowX = this._targetX + Math.floor(this._targetWidth / 2)
      const arrowY = actualPosition === 'top' ? y + height : y - 1

      let arrowChar = ''
      switch (actualPosition) {
        case 'top':
          arrowChar = '\u25bc' // ▼
          break
        case 'bottom':
          arrowChar = '\u25b2' // ▲
          break
        case 'left':
          arrowChar = '\u25b6' // ▶
          break
        case 'right':
          arrowChar = '\u25c0' // ◀
          break
      }

      if (actualPosition === 'top' || actualPosition === 'bottom') {
        if (arrowY >= 0 && arrowY < screenHeight && arrowX >= 0 && arrowX < screenWidth) {
          buffer.set(arrowX, arrowY, { char: arrowChar, fg, bg, attrs: ATTR_DIM })
        }
      } else {
        const sideArrowY = this._targetY + Math.floor(this._targetHeight / 2)
        const sideArrowX = actualPosition === 'left' ? x + width : x - 1
        if (sideArrowY >= 0 && sideArrowY < screenHeight && sideArrowX >= 0 && sideArrowX < screenWidth) {
          buffer.set(sideArrowX, sideArrowY, { char: arrowChar, fg, bg, attrs: ATTR_DIM })
        }
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a tooltip widget.
 *
 * @param props - Tooltip properties
 * @returns Tooltip node
 *
 * @example
 * ```typescript
 * // Basic tooltip
 * const tip = tooltip({ text: 'Click to submit' })
 *
 * // Show on focus
 * button.onFocus(() => {
 *   tip.show(button.x, button.y, button.width, 1)
 * })
 * button.onBlur(() => {
 *   tip.hide()
 * })
 *
 * // Positioned tooltip
 * const sideTip = tooltip({
 *   text: 'Additional information',
 *   position: 'right',
 *   maxWidth: 30
 * })
 *
 * // Without border
 * const simpleTip = tooltip({
 *   text: 'Quick hint',
 *   border: 'none',
 *   showArrow: false
 * })
 *
 * // Multi-line tooltip
 * const helpTip = tooltip({
 *   text: 'This is a longer tooltip with helpful information that will wrap across multiple lines.',
 *   maxWidth: 40,
 *   position: 'bottom'
 * })
 * ```
 */
export function tooltip(props?: TooltipProps): TooltipNode {
  return new TooltipNodeImpl(props)
}
