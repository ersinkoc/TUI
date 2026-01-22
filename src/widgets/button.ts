/**
 * @oxog/tui - Button Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, padToWidth } from '../utils/unicode'
import { ATTR_INVERSE, ATTR_DIM, ATTR_BOLD, ATTR_UNDERLINE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Button variant/style.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

/**
 * Button size.
 */
export type ButtonSize = 'small' | 'medium' | 'large'

/**
 * Button widget properties.
 */
export interface ButtonProps {
  /** Button label */
  label?: string
  /** Button variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Disabled state */
  disabled?: boolean
  /** Icon (left) */
  icon?: string
  /** Icon (right) */
  iconRight?: string
  /** Width (auto if not specified) */
  width?: Dimension
}

/**
 * Button node interface.
 */
export interface ButtonNode extends Node {
  readonly type: 'button'

  // Configuration
  label(text: string): this
  variant(style: ButtonVariant): this
  size(size: ButtonSize): this
  disabled(isDisabled: boolean): this
  icon(char: string): this
  iconRight(char: string): this
  width(value: Dimension): this

  // Events
  onClick(handler: () => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // Handler cleanup - prevent memory leaks
  offClick(handler: () => void): this
  offFocus(handler: () => void): this
  offBlur(handler: () => void): this
  clearHandlers(): this

  // Focus control
  focus(): this
  blur(): this
  press(): this

  // State
  readonly isFocused: boolean
  readonly isDisabled: boolean
  readonly isPressed: boolean
}

// ============================================================
// Implementation
// ============================================================

class ButtonNodeImpl extends LeafNode implements ButtonNode {
  readonly type = 'button' as const

  private _label: string = 'Button'
  private _variant: ButtonVariant = 'primary'
  private _size: ButtonSize = 'medium'
  private _disabled: boolean = false
  private _icon: string = ''
  private _iconRight: string = ''
  private _focused: boolean = false
  private _pressed: boolean = false

  private _onClickHandlers: (() => void)[] = []
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

  constructor(props?: ButtonProps) {
    super()
    if (props) {
      if (props.label) this._label = props.label
      if (props.variant) this._variant = props.variant
      if (props.size) this._size = props.size
      if (props.disabled !== undefined) this._disabled = props.disabled
      if (props.icon) this._icon = props.icon
      if (props.iconRight) this._iconRight = props.iconRight
      if (props.width) this._layout.width = props.width
    }
  }

  get isFocused(): boolean {
    return this._focused
  }

  get isDisabled(): boolean {
    return this._disabled
  }

  get isPressed(): boolean {
    return this._pressed
  }

  // Configuration
  label(text: string): this {
    this._label = text
    this.markDirty()
    return this
  }

  variant(style: ButtonVariant): this {
    this._variant = style
    this.markDirty()
    return this
  }

  size(size: ButtonSize): this {
    this._size = size
    this.markDirty()
    return this
  }

  disabled(isDisabled: boolean): this {
    this._disabled = isDisabled
    if (isDisabled && this._focused) {
      this._focused = false
    }
    this.markDirty()
    return this
  }

  icon(char: string): this {
    this._icon = char
    this.markDirty()
    return this
  }

  iconRight(char: string): this {
    this._iconRight = char
    this.markDirty()
    return this
  }

  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  // Events
  onClick(handler: () => void): this {
    this._onClickHandlers.push(handler)
    return this
  }

  override onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  override onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  // Handler cleanup methods - prevent memory leaks
  offClick(handler: () => void): this {
    const index = this._onClickHandlers.indexOf(handler)
    if (index > -1) {
      this._onClickHandlers.splice(index, 1)
    }
    return this
  }

  offFocus(handler: () => void): this {
    const index = this._onFocusHandlers.indexOf(handler)
    if (index > -1) {
      this._onFocusHandlers.splice(index, 1)
    }
    return this
  }

  offBlur(handler: () => void): this {
    const index = this._onBlurHandlers.indexOf(handler)
    if (index > -1) {
      this._onBlurHandlers.splice(index, 1)
    }
    return this
  }

  clearHandlers(): this {
    this._onClickHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    return this
  }

  /**
   * Dispose of button and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._onClickHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Focus control
  override focus(): this {
    if (!this._disabled && !this._focused) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  override blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  press(): this {
    if (!this._disabled) {
      this._pressed = true
      this.markDirty()
      // Reset pressed state after a short delay
      // Store a reference to check disposal status in timeout
      const self = this
      setTimeout(() => {
        // Only update if not disposed
        if (!self._disposed) {
          self._pressed = false
          self.markDirty()
        }
      }, 100)
      for (const handler of this._onClickHandlers) {
        handler()
      }
    }
    return this
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._focused || this._disabled) return false

    switch (key) {
      case 'enter':
      case 'space':
        this.press()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    // Check if click is inside button
    if (x >= bx && x < bx + width && y >= by && y < by + height) {
      if (action === 'press' && !this._disabled) {
        this.press()
        return true
      }
      return true
    }

    return false
  }

  // Get padding based on size
  private getPadding(): { horizontal: number; vertical: number } {
    switch (this._size) {
      case 'small':
        return { horizontal: 1, vertical: 0 }
      case 'medium':
        return { horizontal: 2, vertical: 0 }
      case 'large':
        return { horizontal: 3, vertical: 1 }
    }
  }

  // Calculate button content
  private getContent(): string {
    let content = ''
    if (this._icon) {
      content += this._icon + ' '
    }
    content += this._label
    if (this._iconRight) {
      content += ' ' + this._iconRight
    }
    return content
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const padding = this.getPadding()
    const content = this.getContent()

    // Calculate attributes based on state and variant
    let attrs = 0

    if (this._disabled) {
      attrs = ATTR_DIM
    } else if (this._pressed) {
      attrs = ATTR_BOLD
    } else if (this._focused) {
      switch (this._variant) {
        case 'primary':
        case 'danger':
          attrs = ATTR_INVERSE | ATTR_BOLD
          break
        case 'secondary':
          attrs = ATTR_INVERSE
          break
        case 'outline':
          attrs = ATTR_BOLD
          break
        case 'ghost':
          attrs = ATTR_UNDERLINE
          break
      }
    } else {
      switch (this._variant) {
        case 'primary':
          attrs = ATTR_INVERSE
          break
        case 'secondary':
          attrs = 0
          break
        case 'outline':
          attrs = 0
          break
        case 'ghost':
          attrs = 0
          break
        case 'danger':
          attrs = ATTR_INVERSE
          break
      }
    }

    // Draw button background
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs })
      }
    }

    // Draw borders for outline variant
    if (this._variant === 'outline' && !this._disabled) {
      // Top and bottom borders
      for (let col = x; col < x + width; col++) {
        buffer.set(col, y, { char: '─', fg, bg, attrs })
        buffer.set(col, y + height - 1, { char: '─', fg, bg, attrs })
      }
      // Left and right borders
      for (let row = y; row < y + height; row++) {
        buffer.set(x, row, { char: '│', fg, bg, attrs })
        buffer.set(x + width - 1, row, { char: '│', fg, bg, attrs })
      }
      // Corners
      buffer.set(x, y, { char: '╭', fg, bg, attrs })
      buffer.set(x + width - 1, y, { char: '╮', fg, bg, attrs })
      buffer.set(x, y + height - 1, { char: '╰', fg, bg, attrs })
      buffer.set(x + width - 1, y + height - 1, { char: '╯', fg, bg, attrs })
    }

    // Draw content centered
    const contentWidth = width - (this._variant === 'outline' ? 2 : 0) - padding.horizontal * 2
    let displayContent = content
    if (stringWidth(displayContent) > contentWidth) {
      displayContent = truncateToWidth(displayContent, contentWidth)
    }
    displayContent = padToWidth(displayContent, contentWidth, 'center')

    const contentX = x + (this._variant === 'outline' ? 1 : 0) + padding.horizontal
    const contentY = y + Math.floor(height / 2)

    buffer.write(contentX, contentY, displayContent, { fg, bg, attrs })

    // Draw brackets for ghost variant
    if (this._variant === 'ghost' && this._focused && !this._disabled) {
      buffer.set(x, contentY, { char: '[', fg, bg, attrs: ATTR_BOLD })
      buffer.set(x + width - 1, contentY, { char: ']', fg, bg, attrs: ATTR_BOLD })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a button widget.
 *
 * @param props - Button properties
 * @returns Button node
 *
 * @example
 * ```typescript
 * // Basic button
 * const submitBtn = button()
 *   .label('Submit')
 *   .variant('primary')
 *   .onClick(() => {
 *     console.log('Button clicked!')
 *   })
 *
 * // Button with icon
 * const saveBtn = button()
 *   .label('Save')
 *   .icon('💾')
 *   .onClick(() => saveFile())
 *
 * // Different variants
 * const primary = button().label('Primary').variant('primary')
 * const secondary = button().label('Secondary').variant('secondary')
 * const outline = button().label('Outline').variant('outline')
 * const ghost = button().label('Ghost').variant('ghost')
 * const danger = button().label('Delete').variant('danger')
 *
 * // Different sizes
 * const small = button().label('Small').size('small')
 * const medium = button().label('Medium').size('medium')
 * const large = button().label('Large').size('large')
 *
 * // Disabled button
 * const disabled = button()
 *   .label('Disabled')
 *   .disabled(true)
 *
 * // Full example
 * const confirmBtn = button({
 *   label: 'Confirm',
 *   variant: 'primary',
 *   icon: '✓'
 * })
 *   .width(20)
 *   .onClick(() => handleConfirm())
 *   .onFocus(() => showHint('Press Enter to confirm'))
 * ```
 */
export function button(props?: ButtonProps): ButtonNode {
  return new ButtonNodeImpl(props)
}
