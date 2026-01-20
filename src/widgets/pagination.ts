/**
 * @oxog/tui - Pagination Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, padToWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Pagination display style.
 */
export type PaginationStyle = 'full' | 'compact' | 'simple' | 'dots'

/**
 * Pagination widget properties.
 */
export interface PaginationProps {
  /** Total number of items */
  totalItems?: number
  /** Items per page */
  itemsPerPage?: number
  /** Current page (0-indexed) */
  currentPage?: number
  /** Display style */
  style?: PaginationStyle
  /** Show first/last buttons */
  showFirstLast?: boolean
  /** Show page numbers */
  showPageNumbers?: boolean
  /** Show item count info */
  showItemCount?: boolean
  /** Maximum visible page numbers */
  maxVisiblePages?: number
  /** Labels for navigation */
  labels?: {
    first?: string
    last?: string
    previous?: string
    next?: string
  }
}

/**
 * Pagination node interface.
 */
export interface PaginationNode extends Node {
  readonly type: 'pagination'

  // Configuration
  totalItems(count: number): this
  itemsPerPage(count: number): this
  currentPage(page: number): this
  style(style: PaginationStyle): this
  showFirstLast(show: boolean): this
  showPageNumbers(show: boolean): this
  showItemCount(show: boolean): this
  maxVisiblePages(count: number): this
  labels(labels: { first?: string; last?: string; previous?: string; next?: string }): this

  // Navigation
  goToPage(page: number): this
  nextPage(): this
  previousPage(): this
  firstPage(): this
  lastPage(): this

  // Events
  onPageChange(handler: (page: number, pageInfo: PageInfo) => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly page: number
  readonly totalPages: number
  readonly pageInfo: PageInfo
}

/**
 * Page information.
 */
export interface PageInfo {
  /** Current page (0-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  totalItems: number
  /** Items per page */
  itemsPerPage: number
  /** First item index on current page (0-indexed) */
  startIndex: number
  /** Last item index on current page (0-indexed, exclusive) */
  endIndex: number
  /** Has previous page */
  hasPrevious: boolean
  /** Has next page */
  hasNext: boolean
}

// ============================================================
// Implementation
// ============================================================

class PaginationNodeImpl extends LeafNode implements PaginationNode {
  readonly type = 'pagination' as const

  private _totalItems: number = 0
  private _itemsPerPage: number = 10
  private _currentPage: number = 0
  private _style: PaginationStyle = 'full'
  private _showFirstLast: boolean = true
  private _showPageNumbers: boolean = true
  private _showItemCount: boolean = true
  private _maxVisiblePages: number = 5
  private _labels = {
    first: '\u00ab', // «
    last: '\u00bb',  // »
    previous: '\u2039', // ‹
    next: '\u203a'  // ›
  }

  private _isFocused: boolean = false
  private _focusedButton: 'first' | 'prev' | 'page' | 'next' | 'last' = 'page'
  private _focusedPageIndex: number = 0

  private _onPageChangeHandlers: ((page: number, pageInfo: PageInfo) => void)[] = []

  constructor(props?: PaginationProps) {
    super()
    if (props) {
      if (props.totalItems !== undefined) this._totalItems = props.totalItems
      if (props.itemsPerPage !== undefined) this._itemsPerPage = props.itemsPerPage
      if (props.currentPage !== undefined) this._currentPage = props.currentPage
      if (props.style) this._style = props.style
      if (props.showFirstLast !== undefined) this._showFirstLast = props.showFirstLast
      if (props.showPageNumbers !== undefined) this._showPageNumbers = props.showPageNumbers
      if (props.showItemCount !== undefined) this._showItemCount = props.showItemCount
      if (props.maxVisiblePages !== undefined) this._maxVisiblePages = props.maxVisiblePages
      if (props.labels) {
        this._labels = { ...this._labels, ...props.labels }
      }
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get page(): number {
    return this._currentPage
  }

  get totalPages(): number {
    if (this._itemsPerPage <= 0) return 1
    return Math.max(1, Math.ceil(this._totalItems / this._itemsPerPage))
  }

  get pageInfo(): PageInfo {
    const totalPages = this.totalPages
    const startIndex = this._currentPage * this._itemsPerPage
    const endIndex = Math.min(startIndex + this._itemsPerPage, this._totalItems)

    return {
      currentPage: this._currentPage,
      totalPages,
      totalItems: this._totalItems,
      itemsPerPage: this._itemsPerPage,
      startIndex,
      endIndex,
      hasPrevious: this._currentPage > 0,
      hasNext: this._currentPage < totalPages - 1
    }
  }

  // Configuration
  totalItems(count: number): this {
    this._totalItems = count
    // Clamp current page
    const maxPage = Math.max(0, this.totalPages - 1)
    if (this._currentPage > maxPage) {
      this._currentPage = maxPage
    }
    this.markDirty()
    return this
  }

  itemsPerPage(count: number): this {
    this._itemsPerPage = count
    // Clamp current page
    const maxPage = Math.max(0, this.totalPages - 1)
    if (this._currentPage > maxPage) {
      this._currentPage = maxPage
    }
    this.markDirty()
    return this
  }

  currentPage(page: number): this {
    const maxPage = Math.max(0, this.totalPages - 1)
    const newPage = Math.max(0, Math.min(page, maxPage))
    if (newPage !== this._currentPage) {
      this._currentPage = newPage
      this.markDirty()
    }
    return this
  }

  style(style: PaginationStyle): this {
    this._style = style
    this.markDirty()
    return this
  }

  showFirstLast(show: boolean): this {
    this._showFirstLast = show
    this.markDirty()
    return this
  }

  showPageNumbers(show: boolean): this {
    this._showPageNumbers = show
    this.markDirty()
    return this
  }

  showItemCount(show: boolean): this {
    this._showItemCount = show
    this.markDirty()
    return this
  }

  maxVisiblePages(count: number): this {
    this._maxVisiblePages = count
    this.markDirty()
    return this
  }

  labels(labels: { first?: string; last?: string; previous?: string; next?: string }): this {
    this._labels = { ...this._labels, ...labels }
    this.markDirty()
    return this
  }

  // Navigation
  goToPage(page: number): this {
    const maxPage = Math.max(0, this.totalPages - 1)
    const newPage = Math.max(0, Math.min(page, maxPage))
    if (newPage !== this._currentPage) {
      this._currentPage = newPage
      this.emitPageChangeEvent()
      this.markDirty()
    }
    return this
  }

  nextPage(): this {
    return this.goToPage(this._currentPage + 1)
  }

  previousPage(): this {
    return this.goToPage(this._currentPage - 1)
  }

  firstPage(): this {
    return this.goToPage(0)
  }

  lastPage(): this {
    return this.goToPage(this.totalPages - 1)
  }

  private emitPageChangeEvent(): void {
    for (const handler of this._onPageChangeHandlers) {
      handler(this._currentPage, this.pageInfo)
    }
  }

  // Events
  onPageChange(handler: (page: number, pageInfo: PageInfo) => void): this {
    this._onPageChangeHandlers.push(handler)
    return this
  }

  // Focus
  focus(): this {
    this._isFocused = true
    this._focusedButton = 'page'
    this._focusedPageIndex = this._currentPage
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, _ctrl: boolean): boolean {
    if (!this._isFocused) return false

    const info = this.pageInfo

    switch (key) {
      case 'left':
      case 'h':
        this.moveFocus(-1)
        return true
      case 'right':
      case 'l':
        this.moveFocus(1)
        return true
      case 'enter':
      case 'space':
        this.activateFocused()
        return true
      case 'home':
        if (info.hasPrevious) {
          this.firstPage()
        }
        return true
      case 'end':
        if (info.hasNext) {
          this.lastPage()
        }
        return true
      case 'pageup':
        if (info.hasPrevious) {
          this.previousPage()
        }
        return true
      case 'pagedown':
        if (info.hasNext) {
          this.nextPage()
        }
        return true
    }

    return false
  }

  private moveFocus(direction: number): void {
    const buttons = this.getNavigableButtons()
    const currentIndex = buttons.indexOf(this._focusedButton)
    let newIndex = currentIndex + direction

    if (newIndex < 0) newIndex = buttons.length - 1
    if (newIndex >= buttons.length) newIndex = 0

    this._focusedButton = buttons[newIndex]
    this.markDirty()
  }

  private getNavigableButtons(): ('first' | 'prev' | 'page' | 'next' | 'last')[] {
    const buttons: ('first' | 'prev' | 'page' | 'next' | 'last')[] = []
    if (this._showFirstLast) buttons.push('first')
    buttons.push('prev')
    if (this._showPageNumbers) buttons.push('page')
    buttons.push('next')
    if (this._showFirstLast) buttons.push('last')
    return buttons
  }

  private activateFocused(): void {
    const info = this.pageInfo

    switch (this._focusedButton) {
      case 'first':
        if (info.hasPrevious) this.firstPage()
        break
      case 'prev':
        if (info.hasPrevious) this.previousPage()
        break
      case 'next':
        if (info.hasNext) this.nextPage()
        break
      case 'last':
        if (info.hasNext) this.lastPage()
        break
      case 'page':
        // Already on page number, could implement number input
        break
    }
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action !== 'press') return false

    // Simple click detection based on relative x position
    const relX = x - bounds.x
    const info = this.pageInfo

    // Calculate approximate button positions
    let currentX = 0
    const buttonWidth = 3

    // First button
    if (this._showFirstLast) {
      if (relX >= currentX && relX < currentX + buttonWidth) {
        this._isFocused = true
        if (info.hasPrevious) this.firstPage()
        this.markDirty()
        return true
      }
      currentX += buttonWidth + 1
    }

    // Previous button
    if (relX >= currentX && relX < currentX + buttonWidth) {
      this._isFocused = true
      if (info.hasPrevious) this.previousPage()
      this.markDirty()
      return true
    }
    currentX += buttonWidth + 1

    // Page numbers
    if (this._showPageNumbers) {
      const pages = this.getVisiblePages()
      for (const p of pages) {
        const pageWidth = String(p + 1).length + 2
        if (relX >= currentX && relX < currentX + pageWidth) {
          this._isFocused = true
          this.goToPage(p)
          this.markDirty()
          return true
        }
        currentX += pageWidth + 1
      }
    }

    // Next button
    if (relX >= currentX && relX < currentX + buttonWidth) {
      this._isFocused = true
      if (info.hasNext) this.nextPage()
      this.markDirty()
      return true
    }
    currentX += buttonWidth + 1

    // Last button
    if (this._showFirstLast) {
      if (relX >= currentX && relX < currentX + buttonWidth) {
        this._isFocused = true
        if (info.hasNext) this.lastPage()
        this.markDirty()
        return true
      }
    }

    return false
  }

  private getVisiblePages(): number[] {
    const total = this.totalPages
    const current = this._currentPage
    const max = this._maxVisiblePages

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i)
    }

    // Calculate window around current page
    let start = Math.max(0, current - Math.floor(max / 2))
    let end = start + max

    if (end > total) {
      end = total
      start = Math.max(0, end - max)
    }

    return Array.from({ length: end - start }, (_, i) => start + i)
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    switch (this._style) {
      case 'full':
        this.renderFull(buffer, bounds, fg, bg)
        break
      case 'compact':
        this.renderCompact(buffer, bounds, fg, bg)
        break
      case 'simple':
        this.renderSimple(buffer, bounds, fg, bg)
        break
      case 'dots':
        this.renderDots(buffer, bounds, fg, bg)
        break
    }
  }

  private renderFull(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const info = this.pageInfo
    let currentX = bounds.x

    // First button
    if (this._showFirstLast) {
      const isFocused = this._isFocused && this._focusedButton === 'first'
      const attrs = isFocused ? ATTR_INVERSE : (info.hasPrevious ? 0 : ATTR_DIM)
      const label = `[${this._labels.first}]`
      buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
      currentX += stringWidth(label) + 1
    }

    // Previous button
    {
      const isFocused = this._isFocused && this._focusedButton === 'prev'
      const attrs = isFocused ? ATTR_INVERSE : (info.hasPrevious ? 0 : ATTR_DIM)
      const label = `[${this._labels.previous}]`
      buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
      currentX += stringWidth(label) + 1
    }

    // Page numbers
    if (this._showPageNumbers) {
      const pages = this.getVisiblePages()
      const firstVisible = pages[0]
      const lastVisible = pages[pages.length - 1]

      // Ellipsis at start
      if (firstVisible > 0) {
        buffer.write(currentX, bounds.y, '...', { fg, bg, attrs: ATTR_DIM })
        currentX += 4
      }

      for (const p of pages) {
        const isCurrent = p === this._currentPage
        const isFocused = this._isFocused && this._focusedButton === 'page' && isCurrent
        let attrs = 0
        if (isFocused) attrs = ATTR_INVERSE
        else if (isCurrent) attrs = ATTR_BOLD

        const label = `[${p + 1}]`
        buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
        currentX += stringWidth(label) + 1
      }

      // Ellipsis at end
      if (lastVisible < this.totalPages - 1) {
        buffer.write(currentX, bounds.y, '...', { fg, bg, attrs: ATTR_DIM })
        currentX += 4
      }
    }

    // Next button
    {
      const isFocused = this._isFocused && this._focusedButton === 'next'
      const attrs = isFocused ? ATTR_INVERSE : (info.hasNext ? 0 : ATTR_DIM)
      const label = `[${this._labels.next}]`
      buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
      currentX += stringWidth(label) + 1
    }

    // Last button
    if (this._showFirstLast) {
      const isFocused = this._isFocused && this._focusedButton === 'last'
      const attrs = isFocused ? ATTR_INVERSE : (info.hasNext ? 0 : ATTR_DIM)
      const label = `[${this._labels.last}]`
      buffer.write(currentX, bounds.y, label, { fg, bg, attrs })
      currentX += stringWidth(label) + 1
    }

    // Item count
    if (this._showItemCount && bounds.height > 1) {
      const countText = `${info.startIndex + 1}-${info.endIndex} of ${info.totalItems}`
      buffer.write(bounds.x, bounds.y + 1, countText, { fg, bg, attrs: ATTR_DIM })
    }
  }

  private renderCompact(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const info = this.pageInfo

    // Previous
    const prevFocused = this._isFocused && this._focusedButton === 'prev'
    const prevAttrs = prevFocused ? ATTR_INVERSE : (info.hasPrevious ? 0 : ATTR_DIM)
    buffer.write(bounds.x, bounds.y, this._labels.previous, { fg, bg, attrs: prevAttrs })

    // Page info
    const pageText = ` ${this._currentPage + 1}/${this.totalPages} `
    const pageAttrs = this._isFocused && this._focusedButton === 'page' ? ATTR_INVERSE : ATTR_BOLD
    buffer.write(bounds.x + 2, bounds.y, pageText, { fg, bg, attrs: pageAttrs })

    // Next
    const nextFocused = this._isFocused && this._focusedButton === 'next'
    const nextAttrs = nextFocused ? ATTR_INVERSE : (info.hasNext ? 0 : ATTR_DIM)
    const nextX = bounds.x + 2 + stringWidth(pageText)
    buffer.write(nextX, bounds.y, this._labels.next, { fg, bg, attrs: nextAttrs })
  }

  private renderSimple(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const info = this.pageInfo

    // Previous
    const prevFocused = this._isFocused && this._focusedButton === 'prev'
    const prevAttrs = prevFocused ? ATTR_INVERSE : (info.hasPrevious ? 0 : ATTR_DIM)
    buffer.write(bounds.x, bounds.y, `[${this._labels.previous} Prev]`, { fg, bg, attrs: prevAttrs })

    // Page info in center
    const pageText = `Page ${this._currentPage + 1} of ${this.totalPages}`
    const centerX = bounds.x + Math.floor((bounds.width - stringWidth(pageText)) / 2)
    buffer.write(Math.max(bounds.x + 10, centerX), bounds.y, pageText, { fg, bg, attrs: ATTR_DIM })

    // Next
    const nextFocused = this._isFocused && this._focusedButton === 'next'
    const nextAttrs = nextFocused ? ATTR_INVERSE : (info.hasNext ? 0 : ATTR_DIM)
    const nextText = `[Next ${this._labels.next}]`
    const nextX = bounds.x + bounds.width - stringWidth(nextText)
    buffer.write(Math.max(centerX + stringWidth(pageText) + 2, nextX), bounds.y, nextText, { fg, bg, attrs: nextAttrs })
  }

  private renderDots(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const total = this.totalPages
    const current = this._currentPage
    let currentX = bounds.x

    // Previous arrow
    const prevFocused = this._isFocused && this._focusedButton === 'prev'
    const prevAttrs = prevFocused ? ATTR_INVERSE : (current > 0 ? 0 : ATTR_DIM)
    buffer.set(currentX, bounds.y, { char: this._labels.previous, fg, bg, attrs: prevAttrs })
    currentX += 2

    // Dots for pages (limited to fit)
    const maxDots = Math.min(total, Math.floor((bounds.width - 6) / 2))
    const startPage = Math.max(0, Math.min(current - Math.floor(maxDots / 2), total - maxDots))

    for (let i = 0; i < maxDots; i++) {
      const page = startPage + i
      const isCurrent = page === current
      let attrs = 0
      if (isCurrent) attrs = ATTR_BOLD
      else attrs = ATTR_DIM

      const dot = isCurrent ? '\u25cf' : '\u25cb' // ● or ○
      buffer.set(currentX, bounds.y, { char: dot, fg, bg, attrs })
      currentX += 2
    }

    // Next arrow
    const nextFocused = this._isFocused && this._focusedButton === 'next'
    const nextAttrs = nextFocused ? ATTR_INVERSE : (current < total - 1 ? 0 : ATTR_DIM)
    buffer.set(currentX, bounds.y, { char: this._labels.next, fg, bg, attrs: nextAttrs })
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a pagination widget.
 *
 * @param props - Pagination properties
 * @returns Pagination node
 *
 * @example
 * ```typescript
 * // Basic pagination
 * const pager = pagination({
 *   totalItems: 100,
 *   itemsPerPage: 10
 * }).onPageChange((page, info) => {
 *   console.log(`Page ${page + 1} of ${info.totalPages}`)
 *   console.log(`Showing items ${info.startIndex + 1}-${info.endIndex}`)
 * })
 *
 * // Compact style
 * const compact = pagination({
 *   totalItems: 50,
 *   itemsPerPage: 5,
 *   style: 'compact',
 *   showFirstLast: false
 * })
 *
 * // Dot indicators
 * const dots = pagination({
 *   totalItems: 30,
 *   itemsPerPage: 3,
 *   style: 'dots'
 * })
 *
 * // With custom labels
 * const custom = pagination({
 *   totalItems: 100,
 *   itemsPerPage: 20,
 *   labels: {
 *     first: '|<',
 *     previous: '<',
 *     next: '>',
 *     last: '>|'
 *   }
 * })
 * ```
 */
export function pagination(props?: PaginationProps): PaginationNode {
  return new PaginationNodeImpl(props)
}
