/**
 * @oxog/tui - Scrollbar Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Dimension } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Scrollbar orientation.
 */
export type ScrollbarOrientation = 'vertical' | 'horizontal'

/**
 * Scrollbar widget properties.
 */
export interface ScrollbarProps {
  /** Scrollbar orientation */
  orientation?: ScrollbarOrientation
  /** Total content size (lines/columns) */
  contentSize?: number
  /** Visible viewport size */
  viewportSize?: number
  /** Current scroll position */
  scrollPosition?: number
  /** Width (for horizontal) or height (for vertical) */
  length?: Dimension
}

/**
 * Scrollbar node interface.
 */
export interface ScrollbarNode extends Node {
  readonly type: 'scrollbar'

  // Configuration
  orientation(dir: ScrollbarOrientation): this
  contentSize(size: number): this
  viewportSize(size: number): this
  scrollPosition(position: number): this
  length(value: Dimension): this

  // Events
  onScroll(handler: (position: number) => void): this

  // Control
  scrollTo(position: number): this
  scrollBy(delta: number): this
  scrollToStart(): this
  scrollToEnd(): this

  // State
  readonly position: number
  readonly maxPosition: number
  readonly thumbSize: number
  readonly thumbPosition: number
  readonly canScrollUp: boolean
  readonly canScrollDown: boolean
}

// ============================================================
// Implementation
// ============================================================

class ScrollbarNodeImpl extends LeafNode implements ScrollbarNode {
  readonly type = 'scrollbar' as const

  private _orientation: ScrollbarOrientation = 'vertical'
  private _contentSize: number = 100
  private _viewportSize: number = 20
  private _scrollPosition: number = 0

  private _onScrollHandlers: ((position: number) => void)[] = []

  constructor(props?: ScrollbarProps) {
    super()
    if (props) {
      if (props.orientation) this._orientation = props.orientation
      if (props.contentSize !== undefined) this._contentSize = props.contentSize
      if (props.viewportSize !== undefined) this._viewportSize = props.viewportSize
      if (props.scrollPosition !== undefined) this._scrollPosition = props.scrollPosition
      if (props.length) {
        if (this._orientation === 'vertical') {
          this._layout.height = props.length
          this._layout.width = 1
        } else {
          this._layout.width = props.length
          this._layout.height = 1
        }
      }
    }
  }

  get position(): number {
    return this._scrollPosition
  }

  get maxPosition(): number {
    return Math.max(0, this._contentSize - this._viewportSize)
  }

  get thumbSize(): number {
    if (this._contentSize <= this._viewportSize) return this.getTrackLength()
    const trackLength = this.getTrackLength()
    return Math.max(1, Math.floor((this._viewportSize / this._contentSize) * trackLength))
  }

  get thumbPosition(): number {
    const maxPos = this.maxPosition
    if (maxPos === 0) return 0
    const trackLength = this.getTrackLength()
    const availableSpace = trackLength - this.thumbSize
    // Guard against division by zero when thumb fills entire track
    if (availableSpace <= 0) return 0
    return Math.floor((this._scrollPosition / maxPos) * availableSpace)
  }

  get canScrollUp(): boolean {
    return this._scrollPosition > 0
  }

  get canScrollDown(): boolean {
    return this._scrollPosition < this.maxPosition
  }

  private getTrackLength(): number {
    if (this._orientation === 'vertical') {
      return this._bounds.height || 10
    } else {
      return this._bounds.width || 10
    }
  }

  // Configuration
  orientation(dir: ScrollbarOrientation): this {
    this._orientation = dir
    this.markDirty()
    return this
  }

  contentSize(size: number): this {
    this._contentSize = Math.max(1, size)
    this.clampPosition()
    this.markDirty()
    return this
  }

  viewportSize(size: number): this {
    this._viewportSize = Math.max(1, size)
    this.clampPosition()
    this.markDirty()
    return this
  }

  scrollPosition(position: number): this {
    const clamped = Math.max(0, Math.min(this.maxPosition, position))
    if (this._scrollPosition !== clamped) {
      this._scrollPosition = clamped
      this.markDirty()
    }
    return this
  }

  length(value: Dimension): this {
    if (this._orientation === 'vertical') {
      this._layout.height = value
      this._layout.width = 1
    } else {
      this._layout.width = value
      this._layout.height = 1
    }
    this.markDirty()
    return this
  }

  // Events
  onScroll(handler: (position: number) => void): this {
    this._onScrollHandlers.push(handler)
    return this
  }

  // Control
  scrollTo(position: number): this {
    const clamped = Math.max(0, Math.min(this.maxPosition, position))
    if (this._scrollPosition !== clamped) {
      this._scrollPosition = clamped
      this.markDirty()
      this.emitScroll()
    }
    return this
  }

  scrollBy(delta: number): this {
    return this.scrollTo(this._scrollPosition + delta)
  }

  scrollToStart(): this {
    return this.scrollTo(0)
  }

  scrollToEnd(): this {
    return this.scrollTo(this.maxPosition)
  }

  // Internal helpers
  private clampPosition(): void {
    const maxPos = this.maxPosition
    if (this._scrollPosition > maxPos) {
      this._scrollPosition = maxPos
    }
  }

  private emitScroll(): void {
    for (const handler of this._onScrollHandlers) {
      handler(this._scrollPosition)
    }
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    // Check if click is inside scrollbar
    if (x >= bx && x < bx + width && y >= by && y < by + height) {
      if (action === 'press') {
        // Calculate position from click
        const trackLength = this.getTrackLength()
        const clickPos = this._orientation === 'vertical' ? y - by : x - bx
        const ratio = clickPos / trackLength
        const newPosition = Math.floor(ratio * this.maxPosition)
        this.scrollTo(newPosition)
        return true
      }

      if (action === 'scroll-up') {
        this.scrollBy(-1)
        return true
      }

      if (action === 'scroll-down') {
        this.scrollBy(1)
        return true
      }

      return true
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    const trackLength = this.getTrackLength()
    const thumbStart = this.thumbPosition
    const thumbEnd = thumbStart + this.thumbSize

    if (this._orientation === 'vertical') {
      // Vertical scrollbar
      for (let i = 0; i < trackLength; i++) {
        const isThumb = i >= thumbStart && i < thumbEnd
        const char = isThumb ? '█' : '░'
        buffer.set(x, y + i, { char, fg, bg, attrs: isThumb ? 0 : ATTR_DIM })
      }
    } else {
      // Horizontal scrollbar
      for (let i = 0; i < trackLength; i++) {
        const isThumb = i >= thumbStart && i < thumbEnd
        const char = isThumb ? '█' : '░'
        buffer.set(x + i, y, { char, fg, bg, attrs: isThumb ? 0 : ATTR_DIM })
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a scrollbar widget.
 *
 * @param props - Scrollbar properties
 * @returns Scrollbar node
 *
 * @example
 * ```typescript
 * // Basic vertical scrollbar
 * const vScroll = scrollbar()
 *   .orientation('vertical')
 *   .contentSize(100)
 *   .viewportSize(20)
 *   .length(20)
 *   .onScroll(pos => {
 *     console.log('Scroll position:', pos)
 *   })
 *
 * // Horizontal scrollbar
 * const hScroll = scrollbar()
 *   .orientation('horizontal')
 *   .contentSize(200)
 *   .viewportSize(80)
 *   .length(80)
 *
 * // Sync with content
 * const content = text('...')
 * const scroll = scrollbar()
 *   .contentSize(totalLines)
 *   .viewportSize(visibleLines)
 *   .onScroll(pos => {
 *     content.scrollTo(pos)
 *   })
 *
 * // Check scroll state
 * if (scroll.canScrollDown) {
 *   console.log('More content below')
 * }
 * ```
 */
export function scrollbar(props?: ScrollbarProps): ScrollbarNode {
  return new ScrollbarNodeImpl(props)
}
