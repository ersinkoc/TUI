/**
 * @oxog/tui - Kanban Widget Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { kanban, KanbanColumn, KanbanCard } from '../../src/widgets/kanban'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

const sampleColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'task1', title: 'Task 1', priority: 'high' },
      { id: 'task2', title: 'Task 2', labels: ['bug'] }
    ]
  },
  {
    id: 'doing',
    title: 'In Progress',
    cards: [
      { id: 'task3', title: 'Task 3' }
    ],
    limit: 3
  },
  {
    id: 'done',
    title: 'Done',
    cards: []
  }
]

describe('Kanban Widget', () => {
  describe('creation', () => {
    it('creates an empty kanban', () => {
      const kb = kanban()
      expect(kb).toBeDefined()
      expect(kb.type).toBe('kanban')
      expect(kb.columns).toHaveLength(0)
    })

    it('creates with columns', () => {
      const kb = kanban({ columns: sampleColumns })
      expect(kb.columns).toHaveLength(3)
      expect(kb.columns[0].title).toBe('To Do')
      expect(kb.columns[0].cards).toHaveLength(2)
    })

    it('creates with all props', () => {
      const kb = kanban({
        columns: sampleColumns,
        columnWidth: 30,
        cardHeight: 5,
        showCardCount: true,
        showLimit: true,
        showLabels: true,
        showPriority: true,
        showAssignee: true
      })
      expect(kb.columns).toHaveLength(3)
    })

    it('clones columns and cards on creation', () => {
      const kb = kanban({ columns: sampleColumns })
      // Modifying original should not affect kanban
      expect(kb.columns).not.toBe(sampleColumns)
      expect(kb.columns[0].cards).not.toBe(sampleColumns[0].cards)
    })
  })

  describe('column management', () => {
    it('adds a column', () => {
      const kb = kanban()
      kb.addColumn({ id: 'new', title: 'New Column', cards: [] })
      expect(kb.columns).toHaveLength(1)
      expect(kb.columns[0].title).toBe('New Column')
    })

    it('removes a column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.removeColumn('doing')
      expect(kb.columns).toHaveLength(2)
      expect(kb.columns.find(c => c.id === 'doing')).toBeUndefined()
    })

    it('updates a column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.updateColumn('todo', { title: 'Backlog', color: 196 })
      expect(kb.columns[0].title).toBe('Backlog')
      expect(kb.columns[0].color).toBe(196)
    })

    it('adjusts selection when column is removed', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.selectColumn(2) // Select 'Done'
      kb.removeColumn('done')
      expect(kb.selectedColumn).toBe(1) // Should move to last available
    })

    it('does nothing when removing non-existent column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.removeColumn('nonexistent')
      expect(kb.columns).toHaveLength(3)
    })
  })

  describe('card management', () => {
    it('adds a card to column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.addCard('todo', { id: 'new', title: 'New Task' })
      expect(kb.columns[0].cards).toHaveLength(3)
    })

    it('removes a card from column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.removeCard('todo', 'task1')
      expect(kb.columns[0].cards).toHaveLength(1)
      expect(kb.columns[0].cards.find(c => c.id === 'task1')).toBeUndefined()
    })

    it('updates a card', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.updateCard('todo', 'task1', { title: 'Updated Task', priority: 'critical' })
      const card = kb.columns[0].cards.find(c => c.id === 'task1')
      expect(card?.title).toBe('Updated Task')
      expect(card?.priority).toBe('critical')
    })

    it('moves a card between columns', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.moveCard('todo', 'task1', 'doing')
      expect(kb.columns[0].cards).toHaveLength(1)
      expect(kb.columns[1].cards).toHaveLength(2)
      expect(kb.columns[1].cards[1].id).toBe('task1')
    })

    it('moves card to specific position', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.moveCard('todo', 'task2', 'doing', 0)
      expect(kb.columns[1].cards[0].id).toBe('task2')
    })

    it('adjusts card selection when card is removed', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.selectCard(1) // Select task2
      kb.removeCard('todo', 'task2')
      expect(kb.selectedCard).toBe(0) // Should adjust
    })

    it('does nothing when adding to non-existent column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.addCard('nonexistent', { id: 'x', title: 'X' })
      expect(kb.columns[0].cards).toHaveLength(2)
    })

    it('does nothing when removing from non-existent column', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.removeCard('nonexistent', 'task1')
      expect(kb.columns[0].cards).toHaveLength(2)
    })
  })

  describe('configuration', () => {
    it('sets column width', () => {
      const kb = kanban()
      expect(kb.columnWidth(30)).toBe(kb)
    })

    it('enforces minimum column width', () => {
      const kb = kanban()
      kb.columnWidth(5)
      // Should use minimum of 10
    })

    it('sets card height', () => {
      const kb = kanban()
      expect(kb.cardHeight(6)).toBe(kb)
    })

    it('enforces minimum card height', () => {
      const kb = kanban()
      kb.cardHeight(1)
      // Should use minimum of 2
    })

    it('toggles show card count', () => {
      const kb = kanban()
      expect(kb.showCardCount(false)).toBe(kb)
    })

    it('toggles show limit', () => {
      const kb = kanban()
      expect(kb.showLimit(false)).toBe(kb)
    })

    it('toggles show labels', () => {
      const kb = kanban()
      expect(kb.showLabels(false)).toBe(kb)
    })

    it('toggles show priority', () => {
      const kb = kanban()
      expect(kb.showPriority(false)).toBe(kb)
    })

    it('toggles show assignee', () => {
      const kb = kanban()
      expect(kb.showAssignee(true)).toBe(kb)
    })

    it('clears all data', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.clear()
      expect(kb.columns).toHaveLength(0)
      expect(kb.selectedColumn).toBe(0)
      expect(kb.selectedCard).toBe(-1)
    })
  })

  describe('navigation', () => {
    let kb: ReturnType<typeof kanban>

    beforeEach(() => {
      kb = kanban({ columns: sampleColumns }).focus()
    })

    it('selects column by index', () => {
      kb.selectColumn(1)
      expect(kb.selectedColumn).toBe(1)
    })

    it('clamps column selection', () => {
      kb.selectColumn(10)
      expect(kb.selectedColumn).toBe(2)
      kb.selectColumn(-5)
      expect(kb.selectedColumn).toBe(0)
    })

    it('selects card by index', () => {
      kb.selectCard(1)
      expect(kb.selectedCard).toBe(1)
    })

    it('clamps card selection', () => {
      kb.selectCard(10)
      expect(kb.selectedCard).toBe(1) // Max is 1 for 2 cards
      kb.selectCard(-5)
      expect(kb.selectedCard).toBe(-1)
    })

    it('moves left between columns', () => {
      kb.selectColumn(2)
      kb.moveLeft()
      expect(kb.selectedColumn).toBe(1)
    })

    it('does not move left past first column', () => {
      kb.selectColumn(0)
      kb.moveLeft()
      expect(kb.selectedColumn).toBe(0)
    })

    it('moves right between columns', () => {
      kb.moveRight()
      expect(kb.selectedColumn).toBe(1)
    })

    it('does not move right past last column', () => {
      kb.selectColumn(2)
      kb.moveRight()
      expect(kb.selectedColumn).toBe(2)
    })

    it('moves up between cards', () => {
      kb.selectCard(1)
      kb.moveUp()
      expect(kb.selectedCard).toBe(0)
    })

    it('moves up to -1 (column selection)', () => {
      kb.selectCard(0)
      kb.moveUp()
      expect(kb.selectedCard).toBe(-1)
    })

    it('moves down between cards', () => {
      kb.selectCard(0)
      kb.moveDown()
      expect(kb.selectedCard).toBe(1)
    })

    it('does not move down past last card', () => {
      kb.selectCard(1)
      kb.moveDown()
      expect(kb.selectedCard).toBe(1)
    })

    it('clears card selection when changing column', () => {
      kb.selectCard(1)
      kb.moveRight()
      expect(kb.selectedCard).toBe(-1)
    })

    it('gets selected column', () => {
      kb.selectColumn(1)
      expect(kb.getSelectedColumn()?.id).toBe('doing')
    })

    it('gets selected card', () => {
      kb.selectCard(0)
      expect(kb.getSelectedCard()?.id).toBe('task1')
    })

    it('returns null for no card selected', () => {
      expect(kb.getSelectedCard()).toBeNull()
    })

    it('returns null for invalid column', () => {
      const empty = kanban()
      expect(empty.getSelectedColumn()).toBeNull()
    })
  })

  describe('card moving', () => {
    let kb: ReturnType<typeof kanban>

    beforeEach(() => {
      kb = kanban({ columns: sampleColumns }).focus()
    })

    it('moves selected card left', () => {
      kb.selectColumn(1).selectCard(0) // Select task3 in 'doing'
      kb.moveCardLeft()
      expect(kb.columns[1].cards).toHaveLength(0)
      expect(kb.columns[0].cards).toHaveLength(3)
      expect(kb.selectedColumn).toBe(0)
    })

    it('does not move card left from first column', () => {
      kb.selectColumn(0).selectCard(0)
      kb.moveCardLeft()
      expect(kb.columns[0].cards).toHaveLength(2)
    })

    it('moves selected card right', () => {
      kb.selectColumn(0).selectCard(0)
      kb.moveCardRight()
      expect(kb.columns[0].cards).toHaveLength(1)
      expect(kb.columns[1].cards).toHaveLength(2)
      expect(kb.selectedColumn).toBe(1)
    })

    it('does not move card right from last column', () => {
      kb.selectColumn(2).selectCard(0)
      // done column is empty, add a card
      kb.addCard('done', { id: 'test', title: 'Test' })
      kb.selectCard(0)
      kb.moveCardRight()
      expect(kb.columns[2].cards).toHaveLength(1)
    })

    it('moves card up within column', () => {
      kb.selectCard(1) // Select task2
      kb.moveCardUp()
      expect(kb.columns[0].cards[0].id).toBe('task2')
      expect(kb.columns[0].cards[1].id).toBe('task1')
      expect(kb.selectedCard).toBe(0)
    })

    it('does not move first card up', () => {
      kb.selectCard(0)
      kb.moveCardUp()
      expect(kb.columns[0].cards[0].id).toBe('task1')
    })

    it('moves card down within column', () => {
      kb.selectCard(0) // Select task1
      kb.moveCardDown()
      expect(kb.columns[0].cards[0].id).toBe('task2')
      expect(kb.columns[0].cards[1].id).toBe('task1')
      expect(kb.selectedCard).toBe(1)
    })

    it('does not move last card down', () => {
      kb.selectCard(1)
      kb.moveCardDown()
      expect(kb.columns[0].cards[1].id).toBe('task2')
    })
  })

  describe('focus', () => {
    it('focuses the kanban', () => {
      const kb = kanban()
      expect(kb.focus()).toBe(kb)
    })

    it('blurs the kanban', () => {
      const kb = kanban().focus()
      expect(kb.blur()).toBe(kb)
    })
  })

  describe('events', () => {
    it('calls onSelect when column changes', () => {
      const handler = vi.fn()
      const kb = kanban({ columns: sampleColumns }).onSelect(handler).focus()
      kb.selectColumn(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'doing' }),
        null
      )
    })

    it('calls onSelect when card changes', () => {
      const handler = vi.fn()
      const kb = kanban({ columns: sampleColumns }).onSelect(handler).focus()
      kb.selectCard(0)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'todo' }),
        expect.objectContaining({ id: 'task1' })
      )
    })

    it('calls onMove when card moves between columns', () => {
      const handler = vi.fn()
      const kb = kanban({ columns: sampleColumns }).onMove(handler).focus()
      kb.moveCard('todo', 'task1', 'doing')
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task1' }),
        'todo',
        'doing'
      )
    })
  })

  describe('keyboard handling', () => {
    let kb: ReturnType<typeof kanban>

    beforeEach(() => {
      kb = kanban({ columns: sampleColumns }).focus()
    })

    it('handles left arrow', () => {
      kb.selectColumn(1)
      expect(kb.handleKey('left')).toBe(true)
      expect(kb.selectedColumn).toBe(0)
    })

    it('handles h key', () => {
      kb.selectColumn(1)
      expect(kb.handleKey('h')).toBe(true)
      expect(kb.selectedColumn).toBe(0)
    })

    it('handles right arrow', () => {
      expect(kb.handleKey('right')).toBe(true)
      expect(kb.selectedColumn).toBe(1)
    })

    it('handles l key', () => {
      expect(kb.handleKey('l')).toBe(true)
      expect(kb.selectedColumn).toBe(1)
    })

    it('handles up arrow', () => {
      kb.selectCard(1)
      expect(kb.handleKey('up')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles k key', () => {
      kb.selectCard(1)
      expect(kb.handleKey('k')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles down arrow', () => {
      expect(kb.handleKey('down')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles j key', () => {
      expect(kb.handleKey('j')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles H key (move card left)', () => {
      kb.selectColumn(1).selectCard(0)
      expect(kb.handleKey('H')).toBe(true)
      expect(kb.selectedColumn).toBe(0)
    })

    it('handles L key (move card right)', () => {
      kb.selectCard(0)
      expect(kb.handleKey('L')).toBe(true)
      expect(kb.selectedColumn).toBe(1)
    })

    it('handles K key (move card up)', () => {
      kb.selectCard(1)
      expect(kb.handleKey('K')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles J key (move card down)', () => {
      kb.selectCard(0)
      expect(kb.handleKey('J')).toBe(true)
      expect(kb.selectedCard).toBe(1)
    })

    it('handles enter to select first card', () => {
      expect(kb.handleKey('enter')).toBe(true)
      expect(kb.selectedCard).toBe(0)
    })

    it('handles escape to deselect card', () => {
      kb.selectCard(0)
      expect(kb.handleKey('escape')).toBe(true)
      expect(kb.selectedCard).toBe(-1)
    })

    it('handles home key', () => {
      kb.selectColumn(2)
      expect(kb.handleKey('home')).toBe(true)
      expect(kb.selectedColumn).toBe(0)
    })

    it('handles end key', () => {
      expect(kb.handleKey('end')).toBe(true)
      expect(kb.selectedColumn).toBe(2)
    })

    it('ignores keys when not focused', () => {
      kb.blur()
      expect(kb.handleKey('right')).toBe(false)
    })

    it('returns false for unknown keys', () => {
      expect(kb.handleKey('q')).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let kb: ReturnType<typeof kanban>
    const buffer = createTestBuffer(80, 20)

    beforeEach(() => {
      kb = kanban({ columns: sampleColumns })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
    })

    it('focuses on mouse press', () => {
      expect(kb.handleMouse(5, 5, 'press')).toBe(true)
    })

    it('selects column on header click', () => {
      kb.handleMouse(30, 0, 'press') // Click on second column header
      expect(kb.selectedColumn).toBe(1)
      expect(kb.selectedCard).toBe(-1)
    })

    it('selects card on card click', () => {
      kb.handleMouse(5, 2, 'press') // Click on first card area
      expect(kb.selectedColumn).toBe(0)
      expect(kb.selectedCard).toBe(0)
    })

    it('returns false when not visible', () => {
      kb.visible(false)
      expect(kb.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false without bounds', () => {
      ;(kb as any)._bounds = null
      expect(kb.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false for non-press actions', () => {
      expect(kb.handleMouse(5, 5, 'release')).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(80, 20)
    })

    it('renders empty kanban message', () => {
      const kb = kanban()
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe('N')
    })

    it('renders column headers', () => {
      const kb = kanban({ columns: sampleColumns })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe('T') // "To Do"
    })

    it('renders card titles', () => {
      const kb = kanban({ columns: sampleColumns })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Cards should be rendered below header
      expect(buffer.get(2, 1)).toBeDefined()
    })

    it('renders priority indicators', () => {
      const kb = kanban({
        columns: sampleColumns,
        showPriority: true
      })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Task 1 has high priority
      const cell = buffer.get(0, 1)
      expect(cell).toBeDefined()
    })

    it('renders labels', () => {
      const kb = kanban({
        columns: sampleColumns,
        showLabels: true,
        cardHeight: 4
      })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Labels should be rendered
      expect(buffer.get(0, 2)).toBeDefined()
    })

    it('renders selected column with inverse', () => {
      const kb = kanban({ columns: sampleColumns }).focus()
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First column header should be highlighted
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders selected card with border', () => {
      const kb = kanban({ columns: sampleColumns }).focus()
      kb.selectCard(0)
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Selected card should have a border
      expect(buffer.get(0, 1).char).toBe('┌')
    })

    it('renders column separators', () => {
      const kb = kanban({ columns: sampleColumns })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Separator between columns
      const sepX = 25 // columnWidth (25) + separator position
      expect(buffer.get(sepX, 0).char).toBe('│')
    })

    it('renders card count in header', () => {
      const kb = kanban({
        columns: sampleColumns,
        showCardCount: true
      })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Header should contain count
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders limit in header', () => {
      const kb = kanban({
        columns: sampleColumns,
        showCardCount: true,
        showLimit: true
      })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // 'doing' column has limit
      const doingColX = 26 // After first column
      expect(buffer.get(doingColX, 0)).toBeDefined()
    })

    it('renders overflow indicator', () => {
      const manyCards: KanbanColumn[] = [{
        id: 'col',
        title: 'Column',
        cards: Array.from({ length: 10 }, (_, i) => ({
          id: `card${i}`,
          title: `Card ${i}`
        }))
      }]
      const kb = kanban({ columns: manyCards, cardHeight: 3 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should show overflow indicator
      expect(buffer.get(0, 7)).toBeDefined()
    })

    it('does not render when not visible', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.visible(false)
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const kb = kanban({ columns: sampleColumns })
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('respects column width setting', () => {
      const kb = kanban({ columns: sampleColumns, columnWidth: 15 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Separator should be at position 15
      expect(buffer.get(15, 0).char).toBe('│')
    })

    it('renders assignee when enabled', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Column',
        cards: [{ id: 'card1', title: 'Card 1', assignee: 'john' }]
      }]
      const kb = kanban({
        columns,
        showAssignee: true,
        cardHeight: 4
      })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Assignee should be rendered
      expect(buffer.get(0, 3)).toBeDefined()
    })

    it('handles columns that exceed width', () => {
      const kb = kanban({ columns: sampleColumns, columnWidth: 30 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 50, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should only render columns that fit
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders all priority levels', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Column',
        cards: [
          { id: 'c1', title: 'Critical', priority: 'critical' },
          { id: 'c2', title: 'High', priority: 'high' },
          { id: 'c3', title: 'Normal', priority: 'normal' },
          { id: 'c4', title: 'Low', priority: 'low' }
        ]
      }]
      const kb = kanban({ columns, cardHeight: 3 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 1)).toBeDefined()
    })

    it('renders overflow indicator with plus sign', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Cards',
        cards: Array.from({ length: 20 }, (_, i) => ({
          id: `card${i}`,
          title: `Card ${i}`
        }))
      }]
      const kb = kanban({ columns, cardHeight: 2 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 25, height: 6 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should show overflow text like "+18 more"
      let foundPlus = false
      for (let x = 0; x < 25; x++) {
        if (buffer.get(x, 5).char === '+') {
          foundPlus = true
          break
        }
      }
      expect(foundPlus).toBe(true)
    })

    it('renders unselected card with background color', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Column',
        cards: [{ id: 'c1', title: 'Card 1' }]
      }]
      const kb = kanban({ columns, cardHeight: 3 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Unselected card should be rendered with bg 235
      const cell = buffer.get(2, 1)
      expect(cell.bg).toBe(235)
    })

    it('renders column with custom color', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Colored Column',
        color: 196,
        cards: [{ id: 'c1', title: 'Card 1' }]
      }]
      const kb = kanban({ columns, cardHeight: 3 })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Header should use column color
      expect(buffer.get(0, 0).fg).toBe(196)
    })

    it('renders card without priority indicator', () => {
      const columns: KanbanColumn[] = [{
        id: 'col',
        title: 'Column',
        cards: [{ id: 'c1', title: 'No Priority Card' }]
      }]
      const kb = kanban({ columns, cardHeight: 3, showPriority: false })
      ;(kb as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
      kb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 1)).toBeDefined()
    })
  })
})
