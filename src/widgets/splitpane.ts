/**
 * @oxog/tui - SplitPane Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode, BaseNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Split direction.
 */
export type SplitDirection = 'horizontal' | 'vertical'

/**
 * SplitPane widget properties.
 */
export interface SplitPaneProps {
  /** Split direction */
  direction?: SplitDirection
  /** Initial split ratio (0-1) */
  ratio?: number
  /** Minimum size for first pane */
  minFirst?: number
  /** Minimum size for second pane */
  minSecond?: number
  /** Show divider */
  showDivider?: boolean
  /** Divider width/height */
  dividerSize?: number
  /** Resizable */
  resizable?: boolean
}

/**
 * SplitPane node interface.
 */
export interface SplitPaneNode extends Node {
  readonly type: 'splitpane'

  // Configuration
  direction(dir: SplitDirection): this
  ratio(value: number): this
  minFirst(value: number): this
  minSecond(value: number): this
  showDivider(enabled: boolean): this
  dividerSize(value: number): this
  resizable(enabled: boolean): this

  // Panes
  first(node: Node): this
  second(node: Node): this

  // Events
  onResize(handler: (ratio: number) => void): this

  // State
  readonly currentRatio: number
  readonly firstPane: Node | null
  readonly secondPane: Node | null
}

// ============================================================
// Implementation
// ============================================================

class SplitPaneNodeImpl extends ContainerNode implements SplitPaneNode {
  readonly type = 'splitpane' as const

  private _direction: SplitDirection = 'horizontal'
  private _ratio: number = 0.5
  private _minFirst: number = 5
  private _minSecond: number = 5
  private _showDivider: boolean = true
  private _dividerSize: number = 1
  private _resizable: boolean = true
  private _firstPane: Node | null = null
  private _secondPane: Node | null = null
  private _isDragging: boolean = false

  private _onResizeHandlers: ((ratio: number) => void)[] = []

  constructor(props?: SplitPaneProps) {
    super()
    if (props) {
      if (props.direction) this._direction = props.direction
      if (props.ratio !== undefined) this._ratio = Math.max(0, Math.min(1, props.ratio))
      if (props.minFirst !== undefined) this._minFirst = props.minFirst
      if (props.minSecond !== undefined) this._minSecond = props.minSecond
      if (props.showDivider !== undefined) this._showDivider = props.showDivider
      if (props.dividerSize !== undefined) this._dividerSize = props.dividerSize
      if (props.resizable !== undefined) this._resizable = props.resizable
    }
  }

  get currentRatio(): number {
    return this._ratio
  }

  get firstPane(): Node | null {
    return this._firstPane
  }

  get secondPane(): Node | null {
    return this._secondPane
  }

  // Configuration
  direction(dir: SplitDirection): this {
    this._direction = dir
    this.markDirty()
    return this
  }

  ratio(value: number): this {
    this._ratio = Math.max(0, Math.min(1, value))
    this.markDirty()
    this.emitResize()
    return this
  }

  minFirst(value: number): this {
    this._minFirst = value
    return this
  }

  minSecond(value: number): this {
    this._minSecond = value
    return this
  }

  showDivider(enabled: boolean): this {
    this._showDivider = enabled
    this.markDirty()
    return this
  }

  dividerSize(value: number): this {
    this._dividerSize = value
    this.markDirty()
    return this
  }

  resizable(enabled: boolean): this {
    this._resizable = enabled
    return this
  }

  // Panes
  first(node: Node): this {
    this._firstPane = node
    if (node instanceof BaseNode) {
      node._parent = this
    }
    this.markDirty()
    return this
  }

  second(node: Node): this {
    this._secondPane = node
    if (node instanceof BaseNode) {
      node._parent = this
    }
    this.markDirty()
    return this
  }

  // Events
  onResize(handler: (ratio: number) => void): this {
    this._onResizeHandlers.push(handler)
    return this
  }

  private emitResize(): void {
    for (const handler of this._onResizeHandlers) {
      handler(this._ratio)
    }
  }

  // Internal: Handle mouse for resizing
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._resizable) return false

    const { x: bx, y: by, width, height } = this._bounds
    const dividerPos = this.getDividerPosition()

    if (action === 'press') {
      // Check if click is on divider
      if (this._direction === 'horizontal') {
        if (x >= dividerPos && x < dividerPos + this._dividerSize) {
          this._isDragging = true
          return true
        }
      } else {
        if (y >= dividerPos && y < dividerPos + this._dividerSize) {
          this._isDragging = true
          return true
        }
      }
    }

    if (action === 'release') {
      if (this._isDragging) {
        this._isDragging = false
        return true
      }
    }

    if (action === 'move' && this._isDragging) {
      // Calculate new ratio
      if (this._direction === 'horizontal') {
        const availableWidth = width - this._dividerSize
        const newFirst = x - bx
        this._ratio = Math.max(
          this._minFirst / availableWidth,
          Math.min(1 - this._minSecond / availableWidth, newFirst / availableWidth)
        )
      } else {
        const availableHeight = height - this._dividerSize
        const newFirst = y - by
        this._ratio = Math.max(
          this._minFirst / availableHeight,
          Math.min(1 - this._minSecond / availableHeight, newFirst / availableHeight)
        )
      }
      this.markDirty()
      this.emitResize()
      return true
    }

    return false
  }

  private getDividerPosition(): number {
    const { x, y, width, height } = this._bounds

    if (this._direction === 'horizontal') {
      const availableWidth = width - this._dividerSize
      return x + Math.floor(availableWidth * this._ratio)
    } else {
      const availableHeight = height - this._dividerSize
      return y + Math.floor(availableHeight * this._ratio)
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const dividerSize = this._showDivider ? this._dividerSize : 0

    if (this._direction === 'horizontal') {
      // Horizontal split (left | right)
      const availableWidth = width - dividerSize
      const firstWidth = Math.floor(availableWidth * this._ratio)
      const secondWidth = availableWidth - firstWidth
      const dividerX = x + firstWidth

      // Render first pane
      if (this._firstPane && this._firstPane instanceof BaseNode) {
        this._firstPane._bounds = { x, y, width: firstWidth, height }
        this._firstPane.render(buffer, parentStyle)
      }

      // Render divider
      if (this._showDivider) {
        const dividerChar = this._isDragging ? '\u2503' : '\u2502' // ┃ or │
        for (let row = y; row < y + height; row++) {
          buffer.set(dividerX, row, {
            char: dividerChar,
            fg,
            bg,
            attrs: this._isDragging ? 0 : ATTR_DIM
          })
        }
      }

      // Render second pane
      if (this._secondPane && this._secondPane instanceof BaseNode) {
        this._secondPane._bounds = {
          x: dividerX + dividerSize,
          y,
          width: secondWidth,
          height
        }
        this._secondPane.render(buffer, parentStyle)
      }
    } else {
      // Vertical split (top / bottom)
      const availableHeight = height - dividerSize
      const firstHeight = Math.floor(availableHeight * this._ratio)
      const secondHeight = availableHeight - firstHeight
      const dividerY = y + firstHeight

      // Render first pane
      if (this._firstPane && this._firstPane instanceof BaseNode) {
        this._firstPane._bounds = { x, y, width, height: firstHeight }
        this._firstPane.render(buffer, parentStyle)
      }

      // Render divider
      if (this._showDivider) {
        const dividerChar = this._isDragging ? '\u2501' : '\u2500' // ━ or ─
        for (let col = x; col < x + width; col++) {
          buffer.set(col, dividerY, {
            char: dividerChar,
            fg,
            bg,
            attrs: this._isDragging ? 0 : ATTR_DIM
          })
        }
      }

      // Render second pane
      if (this._secondPane && this._secondPane instanceof BaseNode) {
        this._secondPane._bounds = {
          x,
          y: dividerY + dividerSize,
          width,
          height: secondHeight
        }
        this._secondPane.render(buffer, parentStyle)
      }
    }
  }

  /**
   * Dispose of splitpane and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    if (this._firstPane instanceof BaseNode) {
      this._firstPane._parent = null
    }
    if (this._secondPane instanceof BaseNode) {
      this._secondPane._parent = null
    }
    this._firstPane = null
    this._secondPane = null
    this._onResizeHandlers = []
    super.dispose()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a split pane widget.
 *
 * @param props - SplitPane properties
 * @returns SplitPane node
 *
 * @example
 * ```typescript
 * // Horizontal split (sidebar | content)
 * const layout = splitpane({ direction: 'horizontal', ratio: 0.25 })
 *   .first(sidebar)
 *   .second(content)
 *
 * // Vertical split (editor / terminal)
 * const editorLayout = splitpane({ direction: 'vertical', ratio: 0.7 })
 *   .first(editor)
 *   .second(terminal)
 *
 * // Nested splits
 * const complexLayout = splitpane({ direction: 'horizontal' })
 *   .first(fileTree)
 *   .second(
 *     splitpane({ direction: 'vertical' })
 *       .first(codeEditor)
 *       .second(outputPanel)
 *   )
 *
 * // Handle resize
 * layout.onResize(ratio => {
 *   console.log('New ratio:', ratio)
 * })
 * ```
 */
export function splitpane(props?: SplitPaneProps): SplitPaneNode {
  return new SplitPaneNodeImpl(props)
}
