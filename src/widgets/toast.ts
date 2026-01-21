/**
 * @oxog/tui - Toast/Notification Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth } from '../utils/unicode'
import { BORDER_CHARS } from '../utils/border'
import { drawRect } from '../core/buffer'
import { ATTR_BOLD, ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Toast notification type.
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error'

/**
 * Toast position on screen.
 */
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

/**
 * Individual toast message.
 */
export interface ToastMessage {
  /** Unique ID */
  id: string
  /** Message text */
  message: string
  /** Toast type */
  type: ToastType
  /** Title (optional) */
  title?: string
  /** Duration in ms (0 for persistent) */
  duration: number
  /** Creation timestamp */
  createdAt: number
}

/**
 * Toast container properties.
 */
export interface ToastProps {
  /** Position on screen */
  position?: ToastPosition
  /** Default duration (ms) */
  defaultDuration?: number
  /** Max visible toasts */
  maxVisible?: number
  /** Toast width */
  width?: number
}

/**
 * Toast container node interface.
 */
export interface ToastNode extends Node {
  readonly type: 'toast'

  // Configuration
  position(pos: ToastPosition): this
  defaultDuration(ms: number): this
  maxVisible(count: number): this
  width(value: number): this

  // Show toasts
  info(message: string, title?: string): string
  success(message: string, title?: string): string
  warning(message: string, title?: string): string
  error(message: string, title?: string): string
  show(type: ToastType, message: string, title?: string, duration?: number): string

  // Control
  dismiss(id: string): this
  dismissAll(): this

  // State
  readonly toasts: ToastMessage[]
  readonly count: number
}

// ============================================================
// Implementation
// ============================================================

class ToastNodeImpl extends LeafNode implements ToastNode {
  readonly type = 'toast' as const

  private _position: ToastPosition = 'top-right'
  private _defaultDuration: number = 3000
  private _maxVisible: number = 5
  private _width: number = 40
  private _toasts: ToastMessage[] = []
  private _idCounter: number = 0
  /** Map of toast IDs to their auto-dismiss timeout handles */
  private _timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(props?: ToastProps) {
    super()
    if (props) {
      if (props.position) this._position = props.position
      if (props.defaultDuration !== undefined) this._defaultDuration = props.defaultDuration
      if (props.maxVisible !== undefined) this._maxVisible = props.maxVisible
      if (props.width !== undefined) this._width = props.width
    }
    // Toast container is always visible (but may have no toasts)
    this._visible = true
  }

  get toasts(): ToastMessage[] {
    return [...this._toasts]
  }

  get count(): number {
    return this._toasts.length
  }

  // Configuration
  position(pos: ToastPosition): this {
    this._position = pos
    this.markDirty()
    return this
  }

  defaultDuration(ms: number): this {
    this._defaultDuration = ms
    return this
  }

  maxVisible(count: number): this {
    this._maxVisible = count
    this.markDirty()
    return this
  }

  width(value: number): this {
    this._width = value
    this.markDirty()
    return this
  }

  // Show toasts
  info(message: string, title?: string): string {
    return this.show('info', message, title)
  }

  success(message: string, title?: string): string {
    return this.show('success', message, title)
  }

  warning(message: string, title?: string): string {
    return this.show('warning', message, title)
  }

  error(message: string, title?: string): string {
    return this.show('error', message, title)
  }

  show(type: ToastType, message: string, title?: string, duration?: number): string {
    const id = `toast-${++this._idCounter}`
    const toast: ToastMessage = {
      id,
      message,
      type,
      ...(title !== undefined && { title }),
      duration: duration ?? this._defaultDuration,
      createdAt: Date.now()
    }

    this._toasts.push(toast)

    // Auto-dismiss if duration > 0
    if (toast.duration > 0) {
      const timeoutId = setTimeout(() => {
        this._timeouts.delete(id)
        this.dismiss(id)
      }, toast.duration)
      this._timeouts.set(id, timeoutId)
    }

    this.markDirty()
    return id
  }

  // Control
  dismiss(id: string): this {
    const index = this._toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      // Clear any pending timeout for this toast
      const timeoutId = this._timeouts.get(id)
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        this._timeouts.delete(id)
      }
      this._toasts.splice(index, 1)
      this.markDirty()
    }
    return this
  }

  dismissAll(): this {
    if (this._toasts.length > 0) {
      // Clear all pending timeouts
      for (const timeoutId of this._timeouts.values()) {
        clearTimeout(timeoutId)
      }
      this._timeouts.clear()
      this._toasts = []
      this.markDirty()
    }
    return this
  }

  /**
   * Dispose of toast container and clear all pending timeouts.
   */
  override dispose(): void {
    if (this._disposed) return
    // Clear all pending timeouts
    for (const timeoutId of this._timeouts.values()) {
      clearTimeout(timeoutId)
    }
    this._timeouts.clear()
    this._toasts = []
    super.dispose()
  }

  // Get icon for toast type
  private getIcon(type: ToastType): string {
    switch (type) {
      case 'info':
        return 'ℹ'
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✗'
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (this._toasts.length === 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const screenWidth = buffer.width
    const screenHeight = buffer.height
    const width = Math.min(this._width, screenWidth - 4)
    const visibleToasts = this._toasts.slice(-this._maxVisible)

    // Calculate toast heights
    const toastHeights: number[] = []
    for (const toast of visibleToasts) {
      let height = 2 // border
      if (toast.title) height++
      // Wrap message to width
      const contentWidth = width - 6 // icon + borders + padding
      const lines = this.wrapText(toast.message, contentWidth)
      height += lines.length
      toastHeights.push(height)
    }

    // Calculate starting position based on position setting
    let startX: number
    let startY: number
    let yDirection: 1 | -1

    switch (this._position) {
      case 'top-left':
        startX = 1
        startY = 1
        yDirection = 1
        break
      case 'top-right':
        startX = screenWidth - width - 1
        startY = 1
        yDirection = 1
        break
      case 'top-center':
        startX = Math.floor((screenWidth - width) / 2)
        startY = 1
        yDirection = 1
        break
      case 'bottom-left':
        startX = 1
        startY = screenHeight - 2
        yDirection = -1
        break
      case 'bottom-right':
        startX = screenWidth - width - 1
        startY = screenHeight - 2
        yDirection = -1
        break
      case 'bottom-center':
        startX = Math.floor((screenWidth - width) / 2)
        startY = screenHeight - 2
        yDirection = -1
        break
    }

    // Render each toast
    let currentY = startY
    for (let i = 0; i < visibleToasts.length; i++) {
      const toast = visibleToasts[i]!
      const height = toastHeights[i]!

      // Adjust Y for bottom positions
      const toastY = yDirection === 1 ? currentY : currentY - height + 1

      this.renderToast(buffer, toast, startX, toastY, width, height, fg, bg)

      currentY += yDirection * (height + 1) // +1 for spacing
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = []
    const words = text.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (stringWidth(testLine) <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
        // Handle words longer than maxWidth
        while (stringWidth(currentLine) > maxWidth) {
          lines.push(truncateToWidth(currentLine, maxWidth))
          currentLine = currentLine.slice(maxWidth)
        }
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines.length > 0 ? lines : ['']
  }

  private renderToast(
    buffer: Buffer,
    toast: ToastMessage,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number
  ): void {
    // Draw background
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    // Draw border
    const chars = BORDER_CHARS['rounded']
    drawRect(buffer, x, y, width, height, chars, { fg, bg, attrs: 0 })

    // Draw icon
    const icon = this.getIcon(toast.type)
    buffer.write(x + 2, y + 1, icon, { fg, bg, attrs: ATTR_BOLD })

    // Content start position
    const contentX = x + 4
    const contentWidth = width - 6
    let contentY = y + 1

    // Draw title if present
    if (toast.title) {
      let title = toast.title
      if (stringWidth(title) > contentWidth) {
        title = truncateToWidth(title, contentWidth)
      }
      buffer.write(contentX, contentY, title, { fg, bg, attrs: ATTR_BOLD })
      contentY++
    }

    // Draw message
    const lines = this.wrapText(toast.message, contentWidth)
    for (const line of lines) {
      buffer.write(contentX, contentY, line, { fg, bg, attrs: 0 })
      contentY++
    }

    // Draw dismiss hint (X in top-right corner)
    buffer.set(x + width - 3, y, { char: '×', fg, bg, attrs: ATTR_DIM })
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a toast notification container.
 *
 * @param props - Toast container properties
 * @returns Toast node
 *
 * @example
 * ```typescript
 * // Basic toast container
 * const toasts = toast()
 *   .position('top-right')
 *   .defaultDuration(3000)
 *
 * // Show different types of notifications
 * toasts.info('Operation started')
 * toasts.success('File saved successfully')
 * toasts.warning('Connection unstable')
 * toasts.error('Failed to connect', 'Network Error')
 *
 * // Custom duration
 * toasts.show('info', 'This stays longer', undefined, 10000)
 *
 * // Persistent toast (duration = 0)
 * const loadingId = toasts.show('info', 'Loading...', undefined, 0)
 * // Later: toasts.dismiss(loadingId)
 *
 * // Position options
 * const bottomToasts = toast()
 *   .position('bottom-center')
 *   .maxVisible(3)
 * ```
 */
export function toast(props?: ToastProps): ToastNode {
  return new ToastNodeImpl(props)
}
