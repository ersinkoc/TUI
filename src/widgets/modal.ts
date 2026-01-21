/**
 * @oxog/tui - Modal/Dialog Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { ContainerNode, BaseNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import {
  ATTR_BOLD,
  ATTR_DIM,
  MODAL_MIN_WIDTH,
  MODAL_MIN_HEIGHT,
  MODAL_MARGIN_X,
  MODAL_MARGIN_Y,
  MODAL_DEFAULT_WIDTH_RATIO,
  MODAL_DEFAULT_HEIGHT_RATIO
} from '../constants'
import { text } from './text'
import { input } from './input'
import { box } from './box'

// ============================================================
// Z-Index Management
// ============================================================

/**
 * Global z-index counter for modal stacking.
 * Each modal that opens gets the next available z-index.
 */
let globalZIndex = 0

/**
 * Active modal stack - tracks open modals in order.
 */
const modalStack: ModalNodeImpl[] = []

/**
 * Get the next z-index for a modal.
 * @internal
 */
function getNextZIndex(): number {
  return ++globalZIndex
}

/**
 * Push modal onto stack.
 * @internal
 */
function pushModal(modal: ModalNodeImpl): void {
  const index = modalStack.indexOf(modal)
  if (index !== -1) {
    // Already in stack, move to top
    modalStack.splice(index, 1)
  }
  modalStack.push(modal)
}

/**
 * Remove modal from stack.
 * @internal
 */
function removeModal(modal: ModalNodeImpl): void {
  const index = modalStack.indexOf(modal)
  if (index !== -1) {
    modalStack.splice(index, 1)
  }
}

/**
 * Get the topmost (focused) modal.
 * @internal
 */
export function getTopmostModal(): ModalNodeImpl | undefined {
  return modalStack[modalStack.length - 1]
}

/**
 * Check if a modal is the topmost one.
 * @internal
 */
export function isTopmostModal(modal: ModalNodeImpl): boolean {
  return modalStack[modalStack.length - 1] === modal
}

// ============================================================
// Types
// ============================================================

/**
 * Modal widget properties.
 */
export interface ModalProps {
  /** Modal title */
  title?: string
  /** Modal width */
  width?: Dimension
  /** Modal height */
  height?: Dimension
  /** Show backdrop */
  backdrop?: boolean
  /** Backdrop character */
  backdropChar?: string
  /** Close on escape */
  closeOnEscape?: boolean
  /** Close on backdrop click */
  closeOnBackdrop?: boolean
  /** Border style */
  border?: 'single' | 'double' | 'rounded' | 'bold'
  /** Center modal */
  centered?: boolean
}

/**
 * Modal button configuration.
 */
export interface ModalButton {
  label: string
  value: string
  primary?: boolean
}

/**
 * Modal node interface.
 */
export interface ModalNode extends Node {
  readonly type: 'modal'

  // Configuration
  title(text: string): this
  width(value: Dimension): this
  height(value: Dimension): this
  backdrop(enabled: boolean): this
  backdropChar(char: string): this
  closeOnEscape(enabled: boolean): this
  closeOnBackdrop(enabled: boolean): this
  border(style: 'single' | 'double' | 'rounded' | 'bold'): this
  centered(enabled: boolean): this

  // Content
  content(node: Node): this
  buttons(btns: ModalButton[]): this

  // Control
  open(): this
  close(): this
  toggle(): this

  // Button navigation
  selectNextButton(): this
  selectPreviousButton(): this
  confirm(): this

  // Events
  onOpen(handler: () => void): this
  onClose(handler: () => void): this
  onButton(handler: (value: string) => void): this

  // State
  readonly isOpen: boolean
  readonly selectedButtonIndex: number
}

// ============================================================
// Implementation
// ============================================================

class ModalNodeImpl extends ContainerNode implements ModalNode {
  readonly type = 'modal' as const

  private _title: string = ''
  private _backdrop: boolean = true
  private _backdropChar: string = ' '
  private _closeOnEscape: boolean = true
  private _closeOnBackdrop: boolean = true
  private _border: 'single' | 'double' | 'rounded' | 'bold' = 'rounded'
  private _centered: boolean = true
  private _isOpen: boolean = false
  private _content: Node | null = null
  private _buttons: ModalButton[] = []
  private _selectedButton: number = 0

  /** Z-index for modal stacking - higher values appear on top */
  private _zIndex: number = 0

  private _onOpenHandlers: (() => void)[] = []
  private _onCloseHandlers: (() => void)[] = []
  private _onButtonHandlers: ((value: string) => void)[] = []

  constructor(props?: ModalProps) {
    super()
    if (props) {
      if (props.title) this._title = props.title
      if (props.width) this._layout.width = props.width
      if (props.height) this._layout.height = props.height
      if (props.backdrop !== undefined) this._backdrop = props.backdrop
      if (props.backdropChar) this._backdropChar = props.backdropChar
      if (props.closeOnEscape !== undefined) this._closeOnEscape = props.closeOnEscape
      if (props.closeOnBackdrop !== undefined) this._closeOnBackdrop = props.closeOnBackdrop
      if (props.border) this._border = props.border
      if (props.centered !== undefined) this._centered = props.centered
    }
    // Modal starts invisible
    this._visible = false
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  // Configuration
  title(text: string): this {
    this._title = text
    this.markDirty()
    return this
  }

  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  height(value: Dimension): this {
    this._layout.height = value
    this.markDirty()
    return this
  }

  backdrop(enabled: boolean): this {
    this._backdrop = enabled
    this.markDirty()
    return this
  }

  backdropChar(char: string): this {
    this._backdropChar = char
    this.markDirty()
    return this
  }

  closeOnEscape(enabled: boolean): this {
    this._closeOnEscape = enabled
    return this
  }

  closeOnBackdrop(enabled: boolean): this {
    this._closeOnBackdrop = enabled
    return this
  }

  border(style: 'single' | 'double' | 'rounded' | 'bold'): this {
    this._border = style
    this.markDirty()
    return this
  }

  centered(enabled: boolean): this {
    this._centered = enabled
    this.markDirty()
    return this
  }

  // Content
  content(node: Node): this {
    this._content = node
    if (node instanceof BaseNode) {
      node._parent = this
    }
    this.markDirty()
    return this
  }

  buttons(btns: ModalButton[]): this {
    this._buttons = btns
    // findIndex returns -1 when not found (not undefined), so ?? doesn't work
    const primaryIndex = btns.findIndex(b => b.primary)
    this._selectedButton = primaryIndex >= 0 ? primaryIndex : 0
    this.markDirty()
    return this
  }

  // Control
  open(): this {
    if (!this._isOpen) {
      this._isOpen = true
      this._visible = true
      // Assign z-index and push onto modal stack
      this._zIndex = getNextZIndex()
      pushModal(this)
      this.markDirty()
      for (const handler of this._onOpenHandlers) {
        handler()
      }
    }
    return this
  }

  close(): this {
    if (this._isOpen) {
      this._isOpen = false
      this._visible = false
      // Remove from modal stack
      removeModal(this)
      this.markDirty()
      for (const handler of this._onCloseHandlers) {
        handler()
      }
    }
    return this
  }

  /**
   * Get the z-index of this modal.
   * Higher values appear on top of lower values.
   */
  get zIndex(): number {
    return this._zIndex
  }

  /**
   * Check if this modal is the topmost (focused) modal.
   */
  get isTopmost(): boolean {
    return isTopmostModal(this)
  }

  /**
   * Bring this modal to the front.
   */
  bringToFront(): this {
    if (this._isOpen) {
      this._zIndex = getNextZIndex()
      pushModal(this)
      this.markDirty()
    }
    return this
  }

  toggle(): this {
    return this._isOpen ? this.close() : this.open()
  }

  // Button navigation
  get selectedButtonIndex(): number {
    return this._selectedButton
  }

  selectNextButton(): this {
    if (this._buttons.length > 0) {
      this._selectedButton = (this._selectedButton + 1) % this._buttons.length
      this.markDirty()
    }
    return this
  }

  selectPreviousButton(): this {
    if (this._buttons.length > 0) {
      this._selectedButton = (this._selectedButton - 1 + this._buttons.length) % this._buttons.length
      this.markDirty()
    }
    return this
  }

  confirm(): this {
    if (this._buttons.length > 0 && this._isOpen) {
      const btn = this._buttons[this._selectedButton]
      if (btn) {
        for (const handler of this._onButtonHandlers) {
          handler(btn.value)
        }
        this.close()
      }
    }
    return this
  }

  // Events
  onOpen(handler: () => void): this {
    this._onOpenHandlers.push(handler)
    return this
  }

  onClose(handler: () => void): this {
    this._onCloseHandlers.push(handler)
    return this
  }

  onButton(handler: (value: string) => void): this {
    this._onButtonHandlers.push(handler)
    return this
  }

  /**
   * Dispose of modal and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    // Remove from modal stack
    removeModal(this)
    // Clear content parent reference
    if (this._content instanceof BaseNode) {
      this._content._parent = null
    }
    this._content = null
    this._buttons = []
    this._onOpenHandlers = []
    this._onCloseHandlers = []
    this._onButtonHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isOpen) return false

    if (key === 'escape' && this._closeOnEscape) {
      this.close()
      return true
    }

    if (this._buttons.length > 0) {
      if (key === 'left' || key === 'h') {
        this._selectedButton = Math.max(0, this._selectedButton - 1)
        this.markDirty()
        return true
      }
      if (key === 'right' || key === 'l') {
        this._selectedButton = Math.min(this._buttons.length - 1, this._selectedButton + 1)
        this.markDirty()
        return true
      }
      if (key === 'enter' || key === 'space') {
        const btn = this._buttons[this._selectedButton]
        if (btn) {
          for (const handler of this._onButtonHandlers) {
            handler(btn.value)
          }
          if (btn.value === 'cancel' || btn.value === 'close') {
            this.close()
          }
        }
        return true
      }
      if (key === 'tab') {
        this._selectedButton = (this._selectedButton + 1) % this._buttons.length
        this.markDirty()
        return true
      }
    }

    return false
  }

  // Internal: Handle mouse click
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._isOpen) return false

    const { x: bx, y: by, width, height } = this._bounds

    // Check if click is outside modal (backdrop)
    if (action === 'press') {
      if (x < bx || x >= bx + width || y < by || y >= by + height) {
        if (this._closeOnBackdrop) {
          this.close()
          return true
        }
      }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible || !this._isOpen) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Calculate modal dimensions
    let modalWidth = typeof this._layout.width === 'number' ? this._layout.width : Math.floor(width * MODAL_DEFAULT_WIDTH_RATIO)
    let modalHeight = typeof this._layout.height === 'number' ? this._layout.height : Math.floor(height * MODAL_DEFAULT_HEIGHT_RATIO)

    // Ensure minimum size
    modalWidth = Math.max(MODAL_MIN_WIDTH, Math.min(modalWidth, width - MODAL_MARGIN_X))
    modalHeight = Math.max(MODAL_MIN_HEIGHT, Math.min(modalHeight, height - MODAL_MARGIN_Y))

    // Calculate position
    let modalX = x
    let modalY = y
    if (this._centered) {
      modalX = x + Math.floor((width - modalWidth) / 2)
      modalY = y + Math.floor((height - modalHeight) / 2)
    }

    // Draw backdrop
    if (this._backdrop) {
      for (let row = y; row < y + height; row++) {
        for (let col = x; col < x + width; col++) {
          // Skip modal area
          if (col >= modalX && col < modalX + modalWidth &&
              row >= modalY && row < modalY + modalHeight) {
            continue
          }
          buffer.set(col, row, {
            char: this._backdropChar,
            fg,
            bg,
            attrs: ATTR_DIM
          })
        }
      }
    }

    // Draw modal background
    for (let row = modalY; row < modalY + modalHeight; row++) {
      for (let col = modalX; col < modalX + modalWidth; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    const chars = BORDER_CHARS[this._border]
    drawRect(buffer, modalX, modalY, modalWidth, modalHeight, chars, { fg, bg, attrs: 0 })

    // Draw title
    if (this._title) {
      let titleText = ` ${this._title} `
      if (stringWidth(titleText) > modalWidth - 4) {
        titleText = truncateToWidth(titleText, modalWidth - 4)
      }
      const titleX = modalX + Math.floor((modalWidth - stringWidth(titleText)) / 2)
      buffer.write(titleX, modalY, titleText, { fg, bg, attrs: ATTR_BOLD })
    }

    // Draw content
    if (this._content && this._content instanceof BaseNode) {
      const contentHeight = modalHeight - 2 - (this._buttons.length > 0 ? 2 : 0)
      this._content._bounds = {
        x: modalX + 1,
        y: modalY + 1,
        width: modalWidth - 2,
        height: contentHeight
      }
      this._content.render(buffer, { fg, bg, attrs: 0 })
    }

    // Draw buttons
    if (this._buttons.length > 0) {
      const buttonY = modalY + modalHeight - 2
      const buttonTexts = this._buttons.map((btn, i) => {
        const selected = i === this._selectedButton
        return selected ? `[${btn.label}]` : ` ${btn.label} `
      })
      const totalWidth = buttonTexts.reduce((sum, t) => sum + stringWidth(t) + 2, 0) - 2
      let buttonX = modalX + Math.floor((modalWidth - totalWidth) / 2)

      for (let i = 0; i < this._buttons.length; i++) {
        const text = buttonTexts[i]!
        const selected = i === this._selectedButton
        buffer.write(buttonX, buttonY, text, {
          fg,
          bg,
          attrs: selected ? ATTR_BOLD : 0
        })
        buttonX += stringWidth(text) + 2
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a modal/dialog widget.
 *
 * @param props - Modal properties
 * @returns Modal node
 *
 * @example
 * ```typescript
 * // Confirmation dialog
 * const confirmDialog = modal({ title: 'Confirm' })
 *   .content(text('Are you sure you want to delete this file?'))
 *   .buttons([
 *     { label: 'Cancel', value: 'cancel' },
 *     { label: 'Delete', value: 'delete', primary: true }
 *   ])
 *   .onButton(value => {
 *     if (value === 'delete') {
 *       // Delete file
 *     }
 *     confirmDialog.close()
 *   })
 *
 * // Open the modal
 * confirmDialog.open()
 *
 * // Alert dialog
 * const alert = modal({ title: 'Error' })
 *   .content(text('Something went wrong!'))
 *   .buttons([{ label: 'OK', value: 'ok', primary: true }])
 *   .onButton(() => alert.close())
 * ```
 */
export function modal(props?: ModalProps): ModalNode {
  return new ModalNodeImpl(props)
}

// ============================================================
// Preset Dialogs
// ============================================================

/**
 * Create a simple alert dialog.
 */
export function alertDialog(title: string, message: string, onClose?: () => void): ModalNode {
  const m = modal({ title, width: 40, height: 8 })
    .content(text(message))
    .buttons([{ label: 'OK', value: 'ok', primary: true }])
    .open()

  if (onClose) {
    m.onButton(onClose)
  }

  return m
}

/**
 * Create a confirmation dialog.
 */
export function confirmDialog(title: string, message: string, onResult?: (confirmed: boolean) => void): ModalNode {
  const m = modal({ title, width: 50, height: 10 })
    .content(text(message))
    .buttons([
      { label: 'Cancel', value: 'cancel' },
      { label: 'Confirm', value: 'confirm', primary: true }
    ])
    .open()

  if (onResult) {
    m.onButton(value => {
      onResult(value === 'confirm')
    })
  }

  return m
}

/**
 * Create an input dialog.
 */
export function inputDialog(title: string, placeholder?: string, onResult?: (value: string | null) => void): ModalNode {
  const inputField = input({ placeholder: placeholder || 'Enter value...' }).width('100%')

  const m = modal({ title, width: 50, height: 10 })
    .content(box().add(inputField))
    .buttons([
      { label: 'Cancel', value: 'cancel' },
      { label: 'OK', value: 'ok', primary: true }
    ])
    .open()

  if (onResult) {
    m.onButton(value => {
      if (value === 'ok') {
        onResult(inputField.currentValue)
      } else {
        onResult(null)
      }
    })
  }

  return m
}
