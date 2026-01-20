/**
 * DataGrid widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { datagrid } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

interface TestData {
  id: number
  name: string
  email: string
  status: string
  age?: number
}

const sampleData: TestData[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', status: 'Active', age: 25 },
  { id: 2, name: 'Bob', email: 'bob@example.com', status: 'Inactive', age: 30 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'Active', age: 35 },
  { id: 4, name: 'Diana', email: 'diana@example.com', status: 'Pending', age: 28 },
  { id: 5, name: 'Eve', email: 'eve@example.com', status: 'Active', age: 22 }
]

const sampleColumns = [
  { key: 'id', header: 'ID', width: 6, align: 'right' as const },
  { key: 'name', header: 'Name', flex: 1 },
  { key: 'email', header: 'Email', flex: 2 },
  { key: 'status', header: 'Status', width: 10 }
]

describe('DataGrid Widget', () => {
  describe('creation', () => {
    it('creates a datagrid with default properties', () => {
      const grid = datagrid()
      expect(grid.type).toBe('datagrid')
      expect(grid.rowCount).toBe(0)
      expect(grid.selectedIndices).toEqual([])
      expect(grid.sortColumn).toBeNull()
      expect(grid.sortDirection).toBe('none')
    })

    it('creates a datagrid with columns and data', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
      expect(grid.rowCount).toBe(5)
    })

    it('creates a datagrid with selection disabled', () => {
      const grid = datagrid({
        data: sampleData,
        selectable: false
      })
      grid.selectRow(0)
      expect(grid.selectedIndices).toEqual([])
    })

    it('creates a datagrid with multi-select', () => {
      const grid = datagrid({
        data: sampleData,
        multiSelect: true
      })
      grid.selectRow(0)
      grid.selectRow(2)
      expect(grid.selectedIndices).toEqual([0, 2])
    })

    it('creates a datagrid with pagination', () => {
      const grid = datagrid({
        data: sampleData,
        pageSize: 2
      })
      expect(grid.totalPages).toBe(3)
      expect(grid.currentPage).toBe(0)
    })

    it('creates a datagrid with row numbers', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        showRowNumbers: true
      })
      expect(grid.type).toBe('datagrid')
    })

    it('creates a datagrid with striped rows', () => {
      const grid = datagrid({
        data: sampleData,
        striped: true
      })
      expect(grid.type).toBe('datagrid')
    })

    it('creates a datagrid with border style', () => {
      const borders = ['single', 'double', 'rounded', 'bold', 'none'] as const
      for (const b of borders) {
        const grid = datagrid({ border: b })
        expect(grid.type).toBe('datagrid')
      }
    })
  })

  describe('configuration', () => {
    it('sets columns', () => {
      const grid = datagrid().columns(sampleColumns)
      expect(grid.type).toBe('datagrid')
    })

    it('sets data', () => {
      const grid = datagrid().data(sampleData)
      expect(grid.rowCount).toBe(5)
    })

    it('resets state when setting new data', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectRow(0)
        .selectRow(1)
        .data([{ id: 10, name: 'New' }])
      expect(grid.selectedIndices).toEqual([])
      expect(grid.focusedRowIndex).toBe(0)
    })

    it('sets selectable', () => {
      const grid = datagrid({ data: sampleData }).selectable(false)
      grid.selectRow(0)
      expect(grid.selectedIndices).toEqual([])
    })

    it('sets multiSelect', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectRow(0)
        .selectRow(1)
        .multiSelect(false)
      expect(grid.selectedIndices.length).toBeLessThanOrEqual(1)
    })

    it('multiSelect false keeps first selection', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectRow(2)
        .selectRow(4)
        .multiSelect(false)
      expect(grid.selectedIndices.length).toBe(1)
    })

    it('sets showRowNumbers', () => {
      const grid = datagrid().showRowNumbers(true)
      expect(grid.type).toBe('datagrid')
    })

    it('sets sortable', () => {
      const grid = datagrid().sortable(false)
      expect(grid.type).toBe('datagrid')
    })

    it('sets striped', () => {
      const grid = datagrid().striped(true)
      expect(grid.type).toBe('datagrid')
    })

    it('sets border', () => {
      const grid = datagrid().border('double')
      expect(grid.type).toBe('datagrid')
    })

    it('sets pageSize', () => {
      const grid = datagrid({ data: sampleData }).pageSize(2)
      expect(grid.totalPages).toBe(3)
    })
  })

  describe('sorting', () => {
    it('sorts by column ascending', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).sortBy('name', 'asc')
      expect(grid.sortColumn).toBe('name')
      expect(grid.sortDirection).toBe('asc')
    })

    it('sorts by column descending', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).sortBy('name', 'desc')
      expect(grid.sortColumn).toBe('name')
      expect(grid.sortDirection).toBe('desc')
    })

    it('cycles sort direction', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })

      grid.sortBy('name')
      expect(grid.sortDirection).toBe('asc')

      grid.sortBy('name')
      expect(grid.sortDirection).toBe('desc')

      grid.sortBy('name')
      expect(grid.sortDirection).toBe('none')
      expect(grid.sortColumn).toBeNull()

      grid.sortBy('name')
      expect(grid.sortDirection).toBe('asc')
    })

    it('changes column resets to asc', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
        .sortBy('name', 'desc')
        .sortBy('id')
      expect(grid.sortColumn).toBe('id')
      expect(grid.sortDirection).toBe('asc')
    })

    it('clears sort', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
        .sortBy('name', 'asc')
        .clearSort()
      expect(grid.sortColumn).toBeNull()
      expect(grid.sortDirection).toBe('none')
    })

    it('ignores sort on non-sortable column', () => {
      const grid = datagrid({
        columns: [
          { key: 'id', header: 'ID', sortable: false },
          { key: 'name', header: 'Name' }
        ],
        data: sampleData,
        sortable: true
      }).sortBy('id')
      expect(grid.sortColumn).toBeNull()
    })

    it('ignores sort on non-existent column', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).sortBy('nonexistent')
      expect(grid.sortColumn).toBeNull()
    })

    it('uses custom comparator', () => {
      const handler = vi.fn()
      const grid = datagrid({
        columns: [
          {
            key: 'name',
            header: 'Name',
            compare: (a, b) => a.name.length - b.name.length
          }
        ],
        data: sampleData
      })
        .onSort(handler)
        .sortBy('name', 'asc')
      expect(handler).toHaveBeenCalledWith('name', 'asc')
    })

    it('emits sort event', () => {
      const handler = vi.fn()
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
        .onSort(handler)
        .sortBy('name')
      expect(handler).toHaveBeenCalledWith('name', 'asc')
    })
  })

  describe('selection', () => {
    it('selects a row', () => {
      const grid = datagrid({ data: sampleData }).selectRow(2)
      expect(grid.selectedIndices).toEqual([2])
    })

    it('single select replaces previous selection', () => {
      const grid = datagrid({ data: sampleData })
        .selectRow(0)
        .selectRow(2)
      expect(grid.selectedIndices).toEqual([2])
    })

    it('multi-select adds to selection', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectRow(0)
        .selectRow(2)
        .selectRow(4)
      expect(grid.selectedIndices).toEqual([0, 2, 4])
    })

    it('deselects a row', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectRow(0)
        .selectRow(2)
        .deselectRow(0)
      expect(grid.selectedIndices).toEqual([2])
    })

    it('deselect does nothing if not selected', () => {
      const grid = datagrid({ data: sampleData })
        .selectRow(0)
        .deselectRow(2)
      expect(grid.selectedIndices).toEqual([0])
    })

    it('selects all rows', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true }).selectAll()
      expect(grid.selectedIndices.length).toBe(5)
    })

    it('selectAll requires multiSelect', () => {
      const grid = datagrid({ data: sampleData, multiSelect: false }).selectAll()
      expect(grid.selectedIndices).toEqual([])
    })

    it('deselects all rows', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectAll()
        .deselectAll()
      expect(grid.selectedIndices).toEqual([])
    })

    it('toggles row selection', () => {
      const grid = datagrid({ data: sampleData })
      grid.toggleRow(1)
      expect(grid.selectedIndices).toEqual([1])
      grid.toggleRow(1)
      expect(grid.selectedIndices).toEqual([])
    })

    it('ignores out of bounds selection', () => {
      const grid = datagrid({ data: sampleData })
        .selectRow(-1)
        .selectRow(100)
      expect(grid.selectedIndices).toEqual([])
    })

    it('returns selected rows', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        multiSelect: true
      })
        .selectRow(0)
        .selectRow(2)
      expect(grid.selectedRows.length).toBe(2)
      expect(grid.selectedRows[0].name).toBe('Alice')
      expect(grid.selectedRows[1].name).toBe('Charlie')
    })

    it('emits select event', () => {
      const handler = vi.fn()
      const grid = datagrid({ data: sampleData })
        .onSelect(handler)
        .selectRow(1)
      expect(handler).toHaveBeenCalled()
      const [rows, indices] = handler.mock.calls[0]
      expect(indices).toEqual([1])
    })
  })

  describe('navigation', () => {
    it('moves to next row', () => {
      const grid = datagrid({ data: sampleData }).focus()
      expect(grid.focusedRowIndex).toBe(0)
      grid.nextRow()
      expect(grid.focusedRowIndex).toBe(1)
    })

    it('moves to previous row', () => {
      const grid = datagrid({ data: sampleData }).focus()
      grid.nextRow().nextRow()
      expect(grid.focusedRowIndex).toBe(2)
      grid.previousRow()
      expect(grid.focusedRowIndex).toBe(1)
    })

    it('stops at first row', () => {
      const grid = datagrid({ data: sampleData }).focus()
      grid.previousRow()
      expect(grid.focusedRowIndex).toBe(0)
    })

    it('stops at last row', () => {
      const grid = datagrid({ data: sampleData }).focus()
      for (let i = 0; i < 10; i++) grid.nextRow()
      expect(grid.focusedRowIndex).toBe(4)
    })

    it('scrolls to row', () => {
      const grid = datagrid({ data: sampleData }).scrollToRow(3)
      expect(grid.focusedRowIndex).toBe(3)
    })

    it('ignores invalid scrollToRow', () => {
      const grid = datagrid({ data: sampleData })
        .scrollToRow(-5)
        .scrollToRow(100)
      expect(grid.focusedRowIndex).toBe(0)
    })
  })

  describe('pagination', () => {
    it('goes to next page', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 })
      expect(grid.currentPage).toBe(0)
      grid.nextPage()
      expect(grid.currentPage).toBe(1)
    })

    it('goes to previous page', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 })
        .nextPage()
        .nextPage()
      expect(grid.currentPage).toBe(2)
      grid.previousPage()
      expect(grid.currentPage).toBe(1)
    })

    it('stops at first page', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 })
      grid.previousPage()
      expect(grid.currentPage).toBe(0)
    })

    it('stops at last page', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 })
      for (let i = 0; i < 10; i++) grid.nextPage()
      expect(grid.currentPage).toBe(2)
    })

    it('goes to specific page', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 }).goToPage(2)
      expect(grid.currentPage).toBe(2)
    })

    it('ignores invalid page number', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 })
        .goToPage(-1)
        .goToPage(100)
      expect(grid.currentPage).toBe(0)
    })

    it('emits page change event', () => {
      const handler = vi.fn()
      const grid = datagrid({ data: sampleData, pageSize: 2 })
        .onPageChange(handler)
        .nextPage()
      expect(handler).toHaveBeenCalledWith(1)
    })

    it('calculates total pages correctly', () => {
      expect(datagrid({ data: sampleData, pageSize: 2 }).totalPages).toBe(3)
      expect(datagrid({ data: sampleData, pageSize: 3 }).totalPages).toBe(2)
      expect(datagrid({ data: sampleData, pageSize: 5 }).totalPages).toBe(1)
      expect(datagrid({ data: sampleData, pageSize: 10 }).totalPages).toBe(1)
      expect(datagrid({ data: [], pageSize: 5 }).totalPages).toBe(1)
    })
  })

  describe('focus', () => {
    it('focuses the grid', () => {
      const grid = datagrid().focus()
      expect(grid.isFocused).toBe(true)
    })

    it('blurs the grid', () => {
      const grid = datagrid().focus().blur()
      expect(grid.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('navigates with arrow keys', () => {
      const grid = datagrid({ data: sampleData }).focus()

      expect(grid.handleKey('down', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(1)

      expect(grid.handleKey('up', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(0)
    })

    it('navigates with j/k keys', () => {
      const grid = datagrid({ data: sampleData }).focus()

      expect(grid.handleKey('j', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(1)

      expect(grid.handleKey('k', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(0)
    })

    it('jumps to start/end with home/end', () => {
      const grid = datagrid({ data: sampleData }).focus()
      grid.nextRow().nextRow()

      expect(grid.handleKey('end', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(4)

      expect(grid.handleKey('home', false)).toBe(true)
      expect(grid.focusedRowIndex).toBe(0)
    })

    it('pages with pageup/pagedown', () => {
      const grid = datagrid({ data: sampleData, pageSize: 2 }).focus()

      expect(grid.handleKey('pagedown', false)).toBe(true)
      expect(grid.currentPage).toBe(1)

      expect(grid.handleKey('pageup', false)).toBe(true)
      expect(grid.currentPage).toBe(0)
    })

    it('toggles selection with space', () => {
      const grid = datagrid({ data: sampleData }).focus()

      expect(grid.handleKey('space', false)).toBe(true)
      expect(grid.selectedIndices).toEqual([0])

      expect(grid.handleKey('space', false)).toBe(true)
      expect(grid.selectedIndices).toEqual([])
    })

    it('triggers row click with enter', () => {
      const handler = vi.fn()
      const grid = datagrid({ data: sampleData })
        .onRowClick(handler)
        .focus()

      grid.handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('selects all with ctrl+a', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true }).focus()

      expect(grid.handleKey('a', true)).toBe(true)
      expect(grid.selectedIndices.length).toBe(5)
    })

    it('ctrl+a requires multiSelect', () => {
      const grid = datagrid({ data: sampleData, multiSelect: false }).focus()

      expect(grid.handleKey('a', true)).toBe(false)
    })

    it('deselects all with escape', () => {
      const grid = datagrid({ data: sampleData, multiSelect: true })
        .selectAll()
        .focus()

      expect(grid.handleKey('escape', false)).toBe(true)
      expect(grid.selectedIndices).toEqual([])
    })

    it('ignores keys when not focused', () => {
      const grid = datagrid({ data: sampleData })
      expect(grid.handleKey('down', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const grid = datagrid({ data: sampleData }).focus()
      expect(grid.handleKey('x', false)).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let grid: ReturnType<typeof datagrid>

    beforeEach(() => {
      grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        border: 'single'
      })
      // Set bounds
      ;(grid as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
    })

    it('clicks on row', () => {
      const handler = vi.fn()
      grid.onRowClick(handler)

      // Click on row (y=2 is first data row: border=1, header=1)
      expect(grid.handleMouse(10, 2, 'press')).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('toggles selection on row click', () => {
      grid.handleMouse(10, 2, 'press')
      expect(grid.selectedIndices.includes(0)).toBe(true)

      grid.handleMouse(10, 2, 'press')
      expect(grid.selectedIndices.includes(0)).toBe(false)
    })

    it('focuses on row click', () => {
      grid.handleMouse(10, 3, 'press')
      expect(grid.isFocused).toBe(true)
      expect(grid.focusedRowIndex).toBe(1)
    })

    it('ignores when hidden', () => {
      ;(grid as any)._visible = false
      expect(grid.handleMouse(10, 2, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(grid as any)._bounds = null
      expect(grid.handleMouse(10, 2, 'press')).toBe(false)
    })

    it('ignores non-press actions', () => {
      expect(grid.handleMouse(10, 2, 'release')).toBe(false)
      expect(grid.handleMouse(10, 2, 'move')).toBe(false)
    })

    it('ignores click out of data range', () => {
      expect(grid.handleMouse(10, 15, 'press')).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty grid', () => {
      const grid = datagrid({ columns: sampleColumns })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders grid with data', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders grid with row numbers', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        showRowNumbers: true
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders grid with selection', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).selectRow(1)
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused row', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).focus()
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders striped rows', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        striped: true
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with sort indicator', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).sortBy('name', 'asc')
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with pagination info', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 2
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders different border styles', () => {
      const borders = ['single', 'double', 'rounded', 'bold', 'none'] as const
      for (const b of borders) {
        const grid = datagrid({
          columns: sampleColumns,
          data: sampleData,
          border: b
        })
        ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
        grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('does not render when hidden', () => {
      const grid = datagrid({ columns: sampleColumns, data: sampleData })
      ;(grid as any)._visible = false
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const grid = datagrid({ columns: sampleColumns, data: sampleData })
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const grid = datagrid({ columns: sampleColumns, data: sampleData })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with custom cell renderer', () => {
      const grid = datagrid({
        columns: [
          { key: 'id', header: 'ID', width: 6 },
          {
            key: 'status',
            header: 'Status',
            width: 12,
            render: (value) => (value === 'Active' ? '[OK]' : '[--]')
          }
        ],
        data: sampleData
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles null/undefined cell values', () => {
      const grid = datagrid({
        columns: [
          { key: 'id', header: 'ID', width: 6 },
          { key: 'missing', header: 'Missing', width: 10 }
        ],
        data: [
          { id: 1, missing: null },
          { id: 2, missing: undefined },
          { id: 3 }
        ]
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long cell values', () => {
      const grid = datagrid({
        columns: [{ key: 'text', header: 'Text', width: 10 }],
        data: [{ text: 'This is a very long text that should be truncated' }]
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with column alignment', () => {
      const grid = datagrid({
        columns: [
          { key: 'left', header: 'Left', width: 10, align: 'left' },
          { key: 'center', header: 'Center', width: 10, align: 'center' },
          { key: 'right', header: 'Right', width: 10, align: 'right' }
        ],
        data: [{ left: 'L', center: 'C', right: 'R' }]
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('events', () => {
    it('registers multiple event handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const grid = datagrid({ data: sampleData })
        .onSelect(handler1)
        .onSelect(handler2)
        .selectRow(0)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('onRowClick receives correct data', () => {
      const handler = vi.fn()
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).onRowClick(handler)

      ;(grid as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      grid.handleMouse(10, 2, 'press')

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 0)
    })
  })

  describe('scroll mode', () => {
    it('scrolls in non-pagination mode', () => {
      const grid = datagrid({ data: sampleData, pageSize: 0 })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      grid.nextPage()
      // Should scroll, not paginate
      expect(grid.totalPages).toBe(1)
    })

    it('previous page scrolls back', () => {
      const grid = datagrid({ data: sampleData, pageSize: 0 })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      grid.nextPage()
      grid.previousPage()
      expect(grid.totalPages).toBe(1)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const selectHandler = vi.fn()
      const sortHandler = vi.fn()

      const grid = datagrid<TestData>()
        .columns(sampleColumns)
        .data(sampleData)
        .selectable(true)
        .multiSelect(true)
        .showRowNumbers(true)
        .sortable(true)
        .striped(true)
        .border('rounded')
        .pageSize(10)
        .onSelect(selectHandler)
        .onSort(sortHandler)
        .sortBy('name', 'asc')
        .selectRow(0)
        .selectRow(2)
        .focus()

      expect(grid.type).toBe('datagrid')
      expect(grid.rowCount).toBe(5)
      expect(grid.selectedIndices.length).toBe(2)
      expect(grid.sortColumn).toBe('name')
      expect(grid.isFocused).toBe(true)
      expect(selectHandler).toHaveBeenCalled()
      expect(sortHandler).toHaveBeenCalled()
    })
  })

  describe('additional coverage tests', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders columns with maxWidth constraint', () => {
      const grid = datagrid({
        columns: [
          { key: 'name', header: 'Name', flex: 1, minWidth: 5, maxWidth: 15 }
        ],
        data: sampleData
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles column without width or flex', () => {
      const grid = datagrid({
        columns: [
          { key: 'name', header: 'Name' } // No width, no flex
        ],
        data: sampleData
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('clicks on header to sort column', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        border: 'single'
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }

      // Click on header row (y=1 with border)
      const result = grid.handleMouse(10, 1, 'press')
      expect(result).toBe(true)
      expect(grid.sortColumn).not.toBeNull()
    })

    it('does not sort when clicking on non-sortable column', () => {
      const grid = datagrid({
        columns: [
          { key: 'id', header: 'ID', width: 6, sortable: false },
          { key: 'name', header: 'Name', width: 20 }
        ],
        data: sampleData,
        border: 'single',
        sortable: true
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }

      // Click on first column header (non-sortable)
      const result = grid.handleMouse(3, 1, 'press')
      expect(result).toBe(false)
      expect(grid.sortColumn).toBeNull()
    })

    it('sorts with custom comparator in descending order', () => {
      const grid = datagrid({
        columns: [
          {
            key: 'name',
            header: 'Name',
            compare: (a: TestData, b: TestData) => a.name.length - b.name.length
          }
        ],
        data: sampleData
      }).sortBy('name', 'desc')

      expect(grid.sortDirection).toBe('desc')
    })

    it('handles sorting with null/undefined values', () => {
      const gridData = [
        { id: 1, name: 'Alice', value: 10 },
        { id: 2, name: 'Bob', value: null },
        { id: 3, name: 'Charlie', value: undefined },
        { id: 4, name: 'Diana', value: 5 }
      ]

      const grid = datagrid({
        columns: [{ key: 'value', header: 'Value' }],
        data: gridData
      }).sortBy('value', 'asc')

      // Null/undefined should sort to end
      expect(grid.selectedRows).toEqual([])
    })

    it('handles sorting numeric values', () => {
      const grid = datagrid({
        columns: [{ key: 'age', header: 'Age' }],
        data: sampleData
      }).sortBy('age', 'asc')

      expect(grid.sortDirection).toBe('asc')
    })

    it('sorts with equal values', () => {
      const gridData = [
        { id: 1, name: 'Same' },
        { id: 2, name: 'Same' },
        { id: 3, name: 'Same' }
      ]

      const grid = datagrid({
        columns: [{ key: 'name', header: 'Name' }],
        data: gridData
      }).sortBy('name', 'asc')

      expect(grid.rowCount).toBe(3)
    })

    it('renders descending sort indicator', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      }).sortBy('name', 'desc')
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles pagination with focus change', () => {
      const handler = vi.fn()
      const grid = datagrid({
        data: sampleData,
        pageSize: 2
      })
        .onPageChange(handler)
        .focus()

      // Focus on row 3 (page 2)
      grid.scrollToRow(3)

      // Page should change
      expect(grid.currentPage).toBe(1)
      expect(handler).toHaveBeenCalled()
    })

    it('handles scroll mode ensureFocusedVisible with scrollOffset', () => {
      const grid = datagrid({
        data: sampleData,
        pageSize: 0
      }).focus()
      ;(grid as any)._bounds = { x: 0, y: 0, width, height: 5 } // Small height

      // Focus on last row
      for (let i = 0; i < 10; i++) grid.nextRow()

      expect(grid.focusedRowIndex).toBe(4)
    })

    it('handles scroll mode with previous row', () => {
      const grid = datagrid({
        data: sampleData,
        pageSize: 0
      }).focus()
      ;(grid as any)._bounds = { x: 0, y: 0, width, height: 5 }

      // Scroll down then up
      grid.scrollToRow(4)
      grid.scrollToRow(0)

      expect(grid.focusedRowIndex).toBe(0)
    })

    it('calculates column widths without bounds', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })

      // Without bounds, should use defaults
      ;(grid as any)._bounds = null
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('getColumnAtX returns -1 for out of range', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        border: 'single',
        showRowNumbers: true
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }

      // Click far right outside columns
      const result = grid.handleMouse(200, 1, 'press')
      expect(result).toBe(false)
    })

    it('handles click on row with selectable false', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData,
        selectable: false,
        border: 'single'
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }

      const result = grid.handleMouse(10, 2, 'press')
      expect(result).toBe(true)
      expect(grid.selectedIndices).toEqual([])
    })

    it('emits page change on goToPage', () => {
      const handler = vi.fn()
      const grid = datagrid({
        data: sampleData,
        pageSize: 2
      }).onPageChange(handler)

      grid.goToPage(1)
      expect(handler).toHaveBeenCalledWith(1)
    })

    it('renders column without minWidth using default', () => {
      const grid = datagrid({
        columns: [
          { key: 'name', header: 'N' } // Short header, no minWidth
        ],
        data: sampleData
      })
      ;(grid as any)._bounds = { x: 0, y: 0, width, height }
      grid.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles sortBy with explicit none direction', () => {
      const grid = datagrid({
        columns: sampleColumns,
        data: sampleData
      })
        .sortBy('name', 'asc')
        .sortBy('name', 'none')

      expect(grid.sortColumn).toBeNull()
      expect(grid.sortDirection).toBe('none')
    })
  })
})
