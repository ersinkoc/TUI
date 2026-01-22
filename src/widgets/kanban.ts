/**
 * @oxog/tui - Kanban Board Widget
 *
 * A kanban board widget for task management with columns and cards.
 */

import { LeafNode } from './node'
import type { Buffer, CellStyle } from '../types'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_BOLD, ATTR_DIM, ATTR_INVERSE } from '../constants'
import { truncateToWidth, padToWidth, stringWidth } from '../utils/unicode'

export interface KanbanCard {
  id: string
  title: string
  description?: string
  labels?: string[]
  priority?: 'low' | 'normal' | 'high' | 'critical'
  assignee?: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
  color?: number
  limit?: number
}

export interface KanbanProps {
  columns?: KanbanColumn[]
  columnWidth?: number
  cardHeight?: number
  showCardCount?: boolean
  showLimit?: boolean
  showLabels?: boolean
  showPriority?: boolean
  showAssignee?: boolean
}

export interface KanbanNode extends LeafNode {
  readonly type: 'kanban'
  readonly columns: KanbanColumn[]
  readonly selectedColumn: number
  readonly selectedCard: number

  // Configuration
  addColumn(column: KanbanColumn): this
  removeColumn(id: string): this
  updateColumn(id: string, updates: Partial<Omit<KanbanColumn, 'id' | 'cards'>>): this
  addCard(columnId: string, card: KanbanCard): this
  removeCard(columnId: string, cardId: string): this
  updateCard(columnId: string, cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>): this
  moveCard(fromColumnId: string, cardId: string, toColumnId: string, position?: number): this
  columnWidth(width: number): this
  cardHeight(height: number): this
  showCardCount(show: boolean): this
  showLimit(show: boolean): this
  showLabels(show: boolean): this
  showPriority(show: boolean): this
  showAssignee(show: boolean): this
  clear(): this

  // Navigation
  selectColumn(index: number): this
  selectCard(index: number): this
  moveLeft(): this
  moveRight(): this
  moveUp(): this
  moveDown(): this
  moveCardLeft(): this
  moveCardRight(): this
  moveCardUp(): this
  moveCardDown(): this

  // Getters
  getSelectedCard(): KanbanCard | null
  getSelectedColumn(): KanbanColumn | null

  // Focus
  focus(): this
  blur(): this

  // Events
  onSelect(handler: (column: KanbanColumn, card: KanbanCard | null) => void): this
  onMove(handler: (card: KanbanCard, fromColumn: string, toColumn: string) => void): this
}

// Priority colors
const PRIORITY_COLORS: Record<string, number> = {
  low: 244, // Gray
  normal: 39, // Blue
  high: 208, // Orange
  critical: 196, // Red
}

// Default label colors
const LABEL_COLORS: number[] = [39, 208, 196, 46, 201, 226, 51, 165]

class KanbanNodeImpl extends LeafNode implements KanbanNode {
  readonly type = 'kanban' as const

  private _columns: KanbanColumn[] = []
  private _selectedColumn = 0
  private _selectedCard = -1
  private _columnWidth = 25
  private _cardHeight = 4
  private _showCardCount = true
  private _showLimit = true
  private _showLabels = true
  private _showPriority = true
  private _showAssignee = false
  private _isFocused = false
  private _scrollY = 0

  private _onSelectHandlers: Array<(column: KanbanColumn, card: KanbanCard | null) => void> = []
  private _onMoveHandlers: Array<(card: KanbanCard, fromColumn: string, toColumn: string) => void> = []

  constructor(props?: KanbanProps) {
    super()
    if (props) {
      if (props.columns) this._columns = props.columns.map(c => ({ ...c, cards: [...c.cards] }))
      if (props.columnWidth !== undefined) this._columnWidth = props.columnWidth
      if (props.cardHeight !== undefined) this._cardHeight = props.cardHeight
      if (props.showCardCount !== undefined) this._showCardCount = props.showCardCount
      if (props.showLimit !== undefined) this._showLimit = props.showLimit
      if (props.showLabels !== undefined) this._showLabels = props.showLabels
      if (props.showPriority !== undefined) this._showPriority = props.showPriority
      if (props.showAssignee !== undefined) this._showAssignee = props.showAssignee
    }
  }

  // Getters
  get columns(): KanbanColumn[] {
    return this._columns
  }

  get selectedColumn(): number {
    return this._selectedColumn
  }

  get selectedCard(): number {
    return this._selectedCard
  }

  get scrollY(): number {
    return this._scrollY
  }

  // Configuration
  addColumn(column: KanbanColumn): this {
    this._columns.push({ ...column, cards: [...column.cards] })
    this.markDirty()
    return this
  }

  removeColumn(id: string): this {
    const index = this._columns.findIndex(c => c.id === id)
    if (index !== -1) {
      this._columns.splice(index, 1)
      if (this._selectedColumn >= this._columns.length) {
        this._selectedColumn = Math.max(0, this._columns.length - 1)
      }
      this._selectedCard = -1
      this.markDirty()
    }
    return this
  }

  updateColumn(id: string, updates: Partial<Omit<KanbanColumn, 'id' | 'cards'>>): this {
    const column = this._columns.find(c => c.id === id)
    if (column) {
      Object.assign(column, updates)
      this.markDirty()
    }
    return this
  }

  addCard(columnId: string, card: KanbanCard): this {
    const column = this._columns.find(c => c.id === columnId)
    if (column) {
      column.cards.push({ ...card })
      this.markDirty()
    }
    return this
  }

  removeCard(columnId: string, cardId: string): this {
    const column = this._columns.find(c => c.id === columnId)
    if (column) {
      const index = column.cards.findIndex(c => c.id === cardId)
      if (index !== -1) {
        column.cards.splice(index, 1)
        if (this._selectedColumn === this._columns.indexOf(column)) {
          if (this._selectedCard >= column.cards.length) {
            this._selectedCard = Math.max(-1, column.cards.length - 1)
          }
        }
        this.markDirty()
      }
    }
    return this
  }

  updateCard(columnId: string, cardId: string, updates: Partial<Omit<KanbanCard, 'id'>>): this {
    const column = this._columns.find(c => c.id === columnId)
    if (column) {
      const card = column.cards.find(c => c.id === cardId)
      if (card) {
        Object.assign(card, updates)
        this.markDirty()
      }
    }
    return this
  }

  moveCard(fromColumnId: string, cardId: string, toColumnId: string, position?: number): this {
    const fromColumn = this._columns.find(c => c.id === fromColumnId)
    const toColumn = this._columns.find(c => c.id === toColumnId)

    if (fromColumn && toColumn) {
      const cardIndex = fromColumn.cards.findIndex(c => c.id === cardId)
      if (cardIndex !== -1) {
        const [card] = fromColumn.cards.splice(cardIndex, 1)
        if (card) {
          const insertPos = position ?? toColumn.cards.length
          toColumn.cards.splice(insertPos, 0, card)
          this.emitMove(card, fromColumnId, toColumnId)
          this.markDirty()
        }
      }
    }
    return this
  }

  columnWidth(width: number): this {
    this._columnWidth = Math.max(10, width)
    this.markDirty()
    return this
  }

  cardHeight(height: number): this {
    this._cardHeight = Math.max(2, height)
    this.markDirty()
    return this
  }

  showCardCount(show: boolean): this {
    this._showCardCount = show
    this.markDirty()
    return this
  }

  showLimit(show: boolean): this {
    this._showLimit = show
    this.markDirty()
    return this
  }

  showLabels(show: boolean): this {
    this._showLabels = show
    this.markDirty()
    return this
  }

  showPriority(show: boolean): this {
    this._showPriority = show
    this.markDirty()
    return this
  }

  showAssignee(show: boolean): this {
    this._showAssignee = show
    this.markDirty()
    return this
  }

  clear(): this {
    this._columns = []
    this._selectedColumn = 0
    this._selectedCard = -1
    this._scrollY = 0
    this.markDirty()
    return this
  }

  // Navigation
  selectColumn(index: number): this {
    this._selectedColumn = Math.max(0, Math.min(this._columns.length - 1, index))
    this._selectedCard = -1
    this.emitSelect()
    this.markDirty()
    return this
  }

  selectCard(index: number): this {
    const column = this._columns[this._selectedColumn]
    if (column) {
      this._selectedCard = Math.max(-1, Math.min(column.cards.length - 1, index))
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveLeft(): this {
    if (this._selectedColumn > 0) {
      this._selectedColumn--
      this._selectedCard = -1
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveRight(): this {
    if (this._selectedColumn < this._columns.length - 1) {
      this._selectedColumn++
      this._selectedCard = -1
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  moveUp(): this {
    const column = this._columns[this._selectedColumn]
    if (column) {
      if (this._selectedCard > -1) {
        this._selectedCard--
        this.emitSelect()
        this.markDirty()
      }
    }
    return this
  }

  moveDown(): this {
    const column = this._columns[this._selectedColumn]
    if (column) {
      if (this._selectedCard < column.cards.length - 1) {
        this._selectedCard++
        this.emitSelect()
        this.markDirty()
      }
    }
    return this
  }

  moveCardLeft(): this {
    if (this._selectedCard >= 0 && this._selectedColumn > 0) {
      const fromColumn = this._columns[this._selectedColumn]
      const toColumn = this._columns[this._selectedColumn - 1]
      if (!fromColumn || !toColumn) return this

      const card = fromColumn.cards[this._selectedCard]
      if (card) {
        this.moveCard(fromColumn.id, card.id, toColumn.id)
        this._selectedColumn--
        this._selectedCard = toColumn.cards.length - 1
        this.emitSelect()
      }
    }
    return this
  }

  moveCardRight(): this {
    if (this._selectedCard >= 0 && this._selectedColumn < this._columns.length - 1) {
      const fromColumn = this._columns[this._selectedColumn]
      const toColumn = this._columns[this._selectedColumn + 1]
      if (!fromColumn || !toColumn) return this

      const card = fromColumn.cards[this._selectedCard]
      if (card) {
        this.moveCard(fromColumn.id, card.id, toColumn.id)
        this._selectedColumn++
        this._selectedCard = toColumn.cards.length - 1
        this.emitSelect()
      }
    }
    return this
  }

  moveCardUp(): this {
    const column = this._columns[this._selectedColumn]
    if (column && this._selectedCard > 0) {
      const currentCard = column.cards[this._selectedCard]
      const prevCard = column.cards[this._selectedCard - 1]
      if (currentCard && prevCard) {
        column.cards[this._selectedCard] = prevCard
        column.cards[this._selectedCard - 1] = currentCard
        this._selectedCard--
        this.markDirty()
      }
    }
    return this
  }

  moveCardDown(): this {
    const column = this._columns[this._selectedColumn]
    if (column && this._selectedCard >= 0 && this._selectedCard < column.cards.length - 1) {
      const currentCard = column.cards[this._selectedCard]
      const nextCard = column.cards[this._selectedCard + 1]
      if (currentCard && nextCard) {
        column.cards[this._selectedCard] = nextCard
        column.cards[this._selectedCard + 1] = currentCard
        this._selectedCard++
        this.markDirty()
      }
    }
    return this
  }

  // Getters
  getSelectedCard(): KanbanCard | null {
    const column = this._columns[this._selectedColumn]
    if (column && this._selectedCard >= 0) {
      return column.cards[this._selectedCard] ?? null
    }
    return null
  }

  getSelectedColumn(): KanbanColumn | null {
    return this._columns[this._selectedColumn] ?? null
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

  // Events
  onSelect(handler: (column: KanbanColumn, card: KanbanCard | null) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onMove(handler: (card: KanbanCard, fromColumn: string, toColumn: string) => void): this {
    this._onMoveHandlers.push(handler)
    return this
  }

  private emitSelect(): void {
    const column = this._columns[this._selectedColumn]
    if (column) {
      const card = this._selectedCard >= 0 ? (column.cards[this._selectedCard] ?? null) : null
      for (const handler of this._onSelectHandlers) {
        handler(column, card)
      }
    }
  }

  private emitMove(card: KanbanCard, fromColumn: string, toColumn: string): void {
    for (const handler of this._onMoveHandlers) {
      handler(card, fromColumn, toColumn)
    }
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
      case 'H': // Shift+H - move card left
        this.moveCardLeft()
        return true
      case 'L': // Shift+L - move card right
        this.moveCardRight()
        return true
      case 'K': // Shift+K - move card up
        this.moveCardUp()
        return true
      case 'J': // Shift+J - move card down
        this.moveCardDown()
        return true
      case 'enter':
        // Select first card if none selected
        if (this._selectedCard === -1) {
          const col = this._columns[this._selectedColumn]
          if (col && col.cards.length > 0) {
            this._selectedCard = 0
            this.emitSelect()
            this.markDirty()
          }
        }
        return true
      case 'escape':
        if (this._selectedCard >= 0) {
          this._selectedCard = -1
          this.emitSelect()
          this.markDirty()
        }
        return true
      case 'home':
        this._selectedColumn = 0
        this._selectedCard = -1
        this.emitSelect()
        this.markDirty()
        return true
      case 'end':
        this._selectedColumn = Math.max(0, this._columns.length - 1)
        this._selectedCard = -1
        this.emitSelect()
        this.markDirty()
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

      const relX = x - bounds.x
      const relY = y - bounds.y

      // Determine which column was clicked
      const colIndex = Math.floor(relX / (this._columnWidth + 1)) // +1 for separator
      if (colIndex >= 0 && colIndex < this._columns.length) {
        this._selectedColumn = colIndex

        // Check if click is on header or cards
        if (relY === 0) {
          // Header click
          this._selectedCard = -1
        } else if (relY > 0) {
          // Card area
          const column = this._columns[colIndex]
          if (column) {
            const cardY = relY - 1 // Skip header
            const cardIndex = Math.floor(cardY / this._cardHeight)

            if (cardIndex >= 0 && cardIndex < column.cards.length) {
              this._selectedCard = cardIndex
            } else {
              this._selectedCard = -1
            }
          }
        }

        this.emitSelect()
        this.markDirty()
      }

      return true
    }

    return false
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

    if (this._columns.length === 0) {
      const msg = 'No columns'
      buffer.write(bounds.x, bounds.y, msg, { fg: 244, bg, attrs: ATTR_DIM })
      return
    }

    let currentX = bounds.x

    for (let colIdx = 0; colIdx < this._columns.length; colIdx++) {
      const column = this._columns[colIdx]
      if (!column) continue

      const isSelectedColumn = this._isFocused && colIdx === this._selectedColumn

      // Skip if column doesn't fit
      if (currentX + this._columnWidth > bounds.x + bounds.width) break

      // Render column
      this.renderColumn(
        buffer,
        currentX,
        bounds.y,
        this._columnWidth,
        bounds.height,
        column,
        colIdx,
        isSelectedColumn,
        fg,
        bg
      )

      currentX += this._columnWidth + 1 // +1 for separator

      // Draw separator
      if (colIdx < this._columns.length - 1 && currentX - 1 < bounds.x + bounds.width) {
        for (let y = 0; y < bounds.height; y++) {
          buffer.set(currentX - 1, bounds.y + y, { char: '│', fg: 240, bg, attrs: 0 })
        }
      }
    }
  }

  private renderColumn(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    column: KanbanColumn,
    _colIndex: number,
    isSelected: boolean,
    fg: number,
    bg: number
  ): void {
    const colColor = column.color ?? (isSelected ? 39 : 244)

    // Header
    let headerText = truncateToWidth(column.title, width - 2)

    // Add card count
    if (this._showCardCount) {
      const countStr = this._showLimit && column.limit
        ? ` (${column.cards.length}/${column.limit})`
        : ` (${column.cards.length})`

      if (stringWidth(headerText) + stringWidth(countStr) <= width) {
        headerText += countStr
      }
    }

    const headerAttrs = isSelected && this._selectedCard === -1 ? ATTR_INVERSE | ATTR_BOLD : ATTR_BOLD
    buffer.write(x, y, padToWidth(headerText, width), {
      fg: colColor,
      bg: isSelected && this._selectedCard === -1 ? colColor : bg,
      attrs: headerAttrs
    })

    // Cards
    let currentY = y + 1

    for (let cardIdx = 0; cardIdx < column.cards.length && currentY + this._cardHeight <= y + height; cardIdx++) {
      const card = column.cards[cardIdx]
      if (!card) continue

      const isCardSelected = isSelected && cardIdx === this._selectedCard
      this.renderCard(buffer, x, currentY, width, this._cardHeight, card, isCardSelected, fg)
      currentY += this._cardHeight
    }

    // Show overflow indicator
    const visibleCards = Math.floor((height - 1) / this._cardHeight)
    if (column.cards.length > visibleCards && currentY < y + height) {
      const moreText = `+${column.cards.length - visibleCards} more`
      buffer.write(x, currentY, truncateToWidth(moreText, width), { fg: 244, bg, attrs: ATTR_DIM })
    }
  }

  private renderCard(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    card: KanbanCard,
    isSelected: boolean,
    fg: number
  ): void {
    const cardBg = isSelected ? 237 : 235
    const cardFg = isSelected ? 255 : fg

    // Card background
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        buffer.set(x + dx, y + dy, { char: ' ', fg: cardFg, bg: cardBg, attrs: 0 })
      }
    }

    // Draw border for selected card
    if (isSelected) {
      // Top
      buffer.set(x, y, { char: '┌', fg: 39, bg: cardBg, attrs: 0 })
      buffer.set(x + width - 1, y, { char: '┐', fg: 39, bg: cardBg, attrs: 0 })
      for (let dx = 1; dx < width - 1; dx++) {
        buffer.set(x + dx, y, { char: '─', fg: 39, bg: cardBg, attrs: 0 })
      }

      // Bottom
      if (height > 1) {
        buffer.set(x, y + height - 1, { char: '└', fg: 39, bg: cardBg, attrs: 0 })
        buffer.set(x + width - 1, y + height - 1, { char: '┘', fg: 39, bg: cardBg, attrs: 0 })
        for (let dx = 1; dx < width - 1; dx++) {
          buffer.set(x + dx, y + height - 1, { char: '─', fg: 39, bg: cardBg, attrs: 0 })
        }
      }

      // Sides
      for (let dy = 1; dy < height - 1; dy++) {
        buffer.set(x, y + dy, { char: '│', fg: 39, bg: cardBg, attrs: 0 })
        buffer.set(x + width - 1, y + dy, { char: '│', fg: 39, bg: cardBg, attrs: 0 })
      }
    }

    let lineY = y + (isSelected ? 1 : 0)
    const innerWidth = isSelected ? width - 2 : width
    const innerX = isSelected ? x + 1 : x

    // Priority indicator
    if (this._showPriority && card.priority) {
      const priorityColor = PRIORITY_COLORS[card.priority] ?? fg
      const priorityChar = card.priority === 'critical' ? '!' : card.priority === 'high' ? '▲' : card.priority === 'low' ? '▽' : '●'
      buffer.set(innerX, lineY, { char: priorityChar, fg: priorityColor, bg: cardBg, attrs: 0 })

      // Title with priority
      const title = truncateToWidth(card.title, innerWidth - 2)
      buffer.write(innerX + 2, lineY, title, { fg: cardFg, bg: cardBg, attrs: ATTR_BOLD })
    } else {
      // Title only
      const title = truncateToWidth(card.title, innerWidth)
      buffer.write(innerX, lineY, title, { fg: cardFg, bg: cardBg, attrs: ATTR_BOLD })
    }
    lineY++

    // Labels
    if (this._showLabels && card.labels && card.labels.length > 0 && lineY < y + height - (isSelected ? 1 : 0)) {
      let labelX = innerX
      for (let i = 0; i < card.labels.length && labelX < innerX + innerWidth - 2; i++) {
        const label = card.labels[i]
        const labelColor = LABEL_COLORS[i % LABEL_COLORS.length]
        if (!label || labelColor === undefined) continue

        const truncLabel = truncateToWidth(label, Math.min(8, innerWidth - (labelX - innerX) - 1))

        if (stringWidth(truncLabel) > 0) {
          buffer.write(labelX, lineY, truncLabel, { fg: 0, bg: labelColor, attrs: 0 })
          labelX += stringWidth(truncLabel) + 1
        }
      }
      lineY++
    }

    // Assignee
    if (this._showAssignee && card.assignee && lineY < y + height - (isSelected ? 1 : 0)) {
      const assigneeText = truncateToWidth(`@${card.assignee}`, innerWidth)
      buffer.write(innerX, lineY, assigneeText, { fg: 244, bg: cardBg, attrs: ATTR_DIM })
    }
  }

  /**
   * Dispose of kanban and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._columns = []
    this._onSelectHandlers = []
    this._onMoveHandlers = []
    super.dispose()
  }
}

export function kanban(props?: KanbanProps): KanbanNode {
  return new KanbanNodeImpl(props)
}
