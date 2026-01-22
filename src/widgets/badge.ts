/**
 * @oxog/tui - Badge Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Badge variant for styling.
 */
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

/**
 * Badge size.
 */
export type BadgeSize = 'small' | 'medium' | 'large'

/**
 * Badge shape.
 */
export type BadgeShape = 'square' | 'rounded' | 'pill'

/**
 * Badge widget properties.
 */
export interface BadgeProps {
  /** Badge text content */
  text?: string
  /** Badge variant */
  variant?: BadgeVariant
  /** Badge size */
  size?: BadgeSize
  /** Badge shape */
  shape?: BadgeShape
  /** Icon character */
  icon?: string
  /** Custom foreground color */
  fg?: number
  /** Custom background color */
  bg?: number
  /** Show outline instead of filled */
  outline?: boolean
  /** Removable (shows X) */
  removable?: boolean
  /** Clickable */
  clickable?: boolean
}

/**
 * Badge node interface.
 */
export interface BadgeNode extends Node {
  readonly type: 'badge'

  // Configuration
  text(content: string): this
  variant(v: BadgeVariant): this
  size(s: BadgeSize): this
  shape(s: BadgeShape): this
  icon(char: string): this
  fg(color: number): this
  bg(color: number): this
  outline(enabled: boolean): this
  removable(enabled: boolean): this
  clickable(enabled: boolean): this

  // Events
  onClick(handler: () => void): this
  onRemove(handler: () => void): this

  // State
  readonly content: string
  readonly badgeVariant: BadgeVariant
  readonly badgeWidth: number
}

// ============================================================
// Variant Colors (RGBA packed as 0xRRGGBBAA)
// ============================================================

const VARIANT_COLORS: Record<BadgeVariant, { fg: number; bg: number }> = {
  default: { fg: 0xffffffff, bg: 0x6b7280ff }, // Gray
  primary: { fg: 0xffffffff, bg: 0x3b82f6ff }, // Blue
  success: { fg: 0xffffffff, bg: 0x22c55eff }, // Green
  warning: { fg: 0x000000ff, bg: 0xeab308ff }, // Yellow
  error: { fg: 0xffffffff, bg: 0xef4444ff }, // Red
  info: { fg: 0xffffffff, bg: 0x06b6d4ff } // Cyan
}

// ============================================================
// Implementation
// ============================================================

class BadgeNodeImpl extends LeafNode implements BadgeNode {
  readonly type = 'badge' as const

  private _text: string = ''
  private _variant: BadgeVariant = 'default'
  private _size: BadgeSize = 'medium'
  private _shape: BadgeShape = 'rounded'
  private _icon: string = ''
  private _fg: number | null = null
  private _bg: number | null = null
  private _outline: boolean = false
  private _removable: boolean = false
  private _clickable: boolean = false

  private _onClickHandlers: (() => void)[] = []
  private _onRemoveHandlers: (() => void)[] = []

  constructor(props?: BadgeProps) {
    super()
    if (props) {
      if (props.text) this._text = props.text
      if (props.variant) this._variant = props.variant
      if (props.size) this._size = props.size
      if (props.shape) this._shape = props.shape
      if (props.icon) this._icon = props.icon
      if (props.fg !== undefined) this._fg = props.fg
      if (props.bg !== undefined) this._bg = props.bg
      if (props.outline !== undefined) this._outline = props.outline
      if (props.removable !== undefined) this._removable = props.removable
      if (props.clickable !== undefined) this._clickable = props.clickable
    }
  }

  // State getters
  get content(): string {
    return this._text
  }

  get badgeVariant(): BadgeVariant {
    return this._variant
  }

  get badgeWidth(): number {
    let width = 0

    // Add padding based on size
    const padding = this._size === 'small' ? 0 : this._size === 'medium' ? 1 : 2
    width += padding * 2

    // Add text width
    width += stringWidth(this._text)

    // Add icon width
    if (this._icon) {
      width += stringWidth(this._icon) + 1
    }

    // Add remove button
    if (this._removable) {
      width += 2 // " x"
    }

    // Add shape characters
    if (this._shape === 'rounded' || this._shape === 'pill') {
      width += 2 // For brackets/parentheses
    }

    return Math.max(width, 1)
  }

  // Configuration
  text(content: string): this {
    this._text = content
    this.markDirty()
    return this
  }

  variant(v: BadgeVariant): this {
    this._variant = v
    this.markDirty()
    return this
  }

  size(s: BadgeSize): this {
    this._size = s
    this.markDirty()
    return this
  }

  shape(s: BadgeShape): this {
    this._shape = s
    this.markDirty()
    return this
  }

  icon(char: string): this {
    this._icon = char
    this.markDirty()
    return this
  }

  fg(color: number): this {
    this._fg = color
    this.markDirty()
    return this
  }

  bg(color: number): this {
    this._bg = color
    this.markDirty()
    return this
  }

  outline(enabled: boolean): this {
    this._outline = enabled
    this.markDirty()
    return this
  }

  removable(enabled: boolean): this {
    this._removable = enabled
    this.markDirty()
    return this
  }

  clickable(enabled: boolean): this {
    this._clickable = enabled
    this.markDirty()
    return this
  }

  // Events
  onClick(handler: () => void): this {
    this._onClickHandlers.push(handler)
    return this
  }

  onRemove(handler: () => void): this {
    this._onRemoveHandlers.push(handler)
    return this
  }

  /**
   * Dispose of badge and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onClickHandlers = []
    this._onRemoveHandlers = []
    super.dispose()
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    // Check if click is within badge
    if (y !== bounds.y || x < bounds.x || x >= bounds.x + bounds.width) {
      return false
    }

    if (action === 'press') {
      // Check if clicking on remove button
      if (this._removable) {
        const removeX = bounds.x + bounds.width - 2
        if (x >= removeX) {
          for (const handler of this._onRemoveHandlers) {
            handler()
          }
          return true
        }
      }

      // Regular click
      if (this._clickable) {
        for (const handler of this._onClickHandlers) {
          handler()
        }
        return true
      }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    // Get colors
    const variantColors = VARIANT_COLORS[this._variant]
    const fg = this._fg ?? (this._outline ? variantColors.bg : variantColors.fg)
    const bg = this._bg ?? (this._outline ? (parentStyle.bg ?? DEFAULT_BG) : variantColors.bg)

    // Build badge content
    let content = ''

    // Left bracket based on shape
    switch (this._shape) {
      case 'rounded':
        content += '['
        break
      case 'pill':
        content += '('
        break
      default:
        content += ' '
    }

    // Padding
    const padding = this._size === 'small' ? '' : this._size === 'medium' ? ' ' : '  '
    content += padding

    // Icon
    if (this._icon) {
      content += this._icon + ' '
    }

    // Text
    content += this._text

    // Padding
    content += padding

    // Remove button
    if (this._removable) {
      content += ' \u00d7' // ×
    }

    // Right bracket based on shape
    switch (this._shape) {
      case 'rounded':
        content += ']'
        break
      case 'pill':
        content += ')'
        break
      default:
        content += ' '
    }

    // Truncate if needed
    const availableWidth = bounds.width
    if (stringWidth(content) > availableWidth) {
      content = truncateToWidth(content, availableWidth)
    }

    // Determine attributes
    let attrs = 0
    if (this._outline) {
      attrs = ATTR_BOLD
    }

    // Render
    buffer.write(bounds.x, bounds.y, content, { fg, bg, attrs })
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a badge widget.
 *
 * @param props - Badge properties
 * @returns Badge node
 *
 * @example
 * ```typescript
 * // Basic badge
 * const b = badge({ text: 'New' })
 *
 * // Colored variants
 * const success = badge({ text: 'Active', variant: 'success' })
 * const error = badge({ text: 'Error', variant: 'error' })
 * const warning = badge({ text: 'Warning', variant: 'warning' })
 *
 * // With icon
 * const iconBadge = badge({ text: 'TypeScript', icon: '\u2605' }) // ★
 *
 * // Removable tag
 * const tag = badge({ text: 'react', removable: true })
 *   .onRemove(() => {
 *     removeTag('react')
 *   })
 *
 * // Clickable badge
 * const clickable = badge({ text: 'View Details', clickable: true, variant: 'primary' })
 *   .onClick(() => {
 *     showDetails()
 *   })
 *
 * // Different sizes and shapes
 * const small = badge({ text: 'sm', size: 'small', shape: 'pill' })
 * const large = badge({ text: 'large', size: 'large', shape: 'rounded' })
 *
 * // Outline style
 * const outlined = badge({ text: 'Outline', variant: 'primary', outline: true })
 *
 * // Custom colors
 * const custom = badge({ text: 'Custom' })
 *   .fg(0xffffffff)
 *   .bg(0x8b5cf6ff) // Purple
 * ```
 */
export function badge(props?: BadgeProps): BadgeNode {
  return new BadgeNodeImpl(props)
}

/**
 * Create a tag widget (alias for badge with removable=true).
 *
 * @param props - Badge properties
 * @returns Badge node configured as a tag
 *
 * @example
 * ```typescript
 * const t = tag({ text: 'javascript' })
 *   .onRemove(() => console.log('Removed'))
 * ```
 */
export function tag(props?: BadgeProps): BadgeNode {
  return new BadgeNodeImpl({ ...props, removable: true, shape: 'pill' })
}
