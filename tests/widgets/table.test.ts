/**
 * @oxog/tui - Table Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { table } from '../../src/widgets/table'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Table Widget', () => {
  const testColumns = [
    { key: 'id', header: 'ID', width: 5 },
    { key: 'name', header: 'Name', width: 15 },
    { key: 'email', header: 'Email' }
  ]

  const testData = [
    { id: 1, name: 'Alice', email: 'alice@test.com' },
    { id: 2, name: 'Bob', email: 'bob@test.com' },
    { id: 3, name: 'Charlie', email: 'charlie@test.com' }
  ]

  describe('factory function', () => {
    it('should create table node', () => {
      const t = table()
      expect(t).toBeDefined()
      expect(t.type).toBe('table')
    })

    it('should create table with initial columns via props', () => {
      const t = table({ columns: testColumns })
      expect(t).toBeDefined()
    })

    it('should create table with initial data via props', () => {
      const t = table({ data: testData })
      expect(t.rowCount).toBe(3)
    })

    it('should create table with selected row', () => {
      const t = table({ data: testData, selectedRow: 1 })
      expect(t.selectedIndex).toBe(1)
    })

    it('should create table with dimensions', () => {
      const t = table({ width: 60, height: 20 })
      expect(t).toBeDefined()
    })

    it('should create table with border style', () => {
      const t = table({ border: 'rounded' })
      expect(t.borderStyle).toBe('rounded')
    })

    it('should create table with striped rows', () => {
      const t = table({ striped: true })
      expect(t).toBeDefined()
    })

    it('should create table with header disabled', () => {
      const t = table({ showHeader: false })
      expect(t).toBeDefined()
    })
  })

  describe('columns()', () => {
    it('should set columns', () => {
      const t = table().columns(testColumns)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.columns(testColumns)).toBe(t)
    })

    it('should mark dirty when columns change', () => {
      const t = table()
      t.clearDirty()
      t.columns(testColumns)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('data()', () => {
    it('should set data', () => {
      const t = table().data(testData)
      expect(t.rowCount).toBe(3)
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.data(testData)).toBe(t)
    })

    it('should clamp selected index when data changes', () => {
      const t = table().data(testData).selectedRow(2)
      t.data([{ id: 1, name: 'Only' }])
      expect(t.selectedIndex).toBe(0)
    })

    it('should mark dirty when data changes', () => {
      const t = table()
      t.clearDirty()
      t.data(testData)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('showHeader()', () => {
    it('should enable header', () => {
      const t = table().showHeader(true)
      expect(t).toBeDefined()
    })

    it('should disable header', () => {
      const t = table().showHeader(false)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.showHeader(true)).toBe(t)
    })
  })

  describe('border()', () => {
    it('should set border style', () => {
      const t = table().border('rounded')
      expect(t.borderStyle).toBe('rounded')
    })

    it('should accept different styles', () => {
      expect(table().border('single').borderStyle).toBe('single')
      expect(table().border('double').borderStyle).toBe('double')
      expect(table().border('none').borderStyle).toBe('none')
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.border('single')).toBe(t)
    })
  })

  describe('striped()', () => {
    it('should enable striped rows', () => {
      const t = table().striped(true)
      expect(t).toBeDefined()
    })

    it('should disable striped rows', () => {
      const t = table().striped(false)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.striped(true)).toBe(t)
    })
  })

  describe('selectedRow()', () => {
    it('should set selected row', () => {
      const t = table().data(testData).selectedRow(1)
      expect(t.selectedIndex).toBe(1)
    })

    it('should return this for chaining', () => {
      const t = table().data(testData)
      expect(t.selectedRow(1)).toBe(t)
    })

    it('should clamp to valid range (lower bound)', () => {
      const t = table().data(testData).selectedRow(-10)
      expect(t.selectedIndex).toBe(-1)
    })

    it('should clamp to valid range (upper bound)', () => {
      const t = table().data(testData).selectedRow(100)
      expect(t.selectedIndex).toBe(2)
    })

    it('should mark dirty when selection changes', () => {
      const t = table().data(testData)
      t.clearDirty()
      t.selectedRow(1)
      expect((t as any)._dirty).toBe(true)
    })

    it('should not mark dirty when selection stays the same', () => {
      const t = table().data(testData).selectedRow(1)
      t.clearDirty()
      t.selectedRow(1)
      expect((t as any)._dirty).toBe(false)
    })
  })

  describe('width() and height()', () => {
    it('should set width', () => {
      const t = table().width(60)
      expect(t).toBeDefined()
    })

    it('should set height', () => {
      const t = table().height(20)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.width(60)).toBe(t)
      expect(t.height(20)).toBe(t)
    })

    it('should accept percentage dimensions', () => {
      const t = table().width('100%').height('50%')
      expect(t).toBeDefined()
    })
  })

  describe('selected and selectedIndex', () => {
    it('should return selected row', () => {
      const t = table().data(testData).selectedRow(1)
      expect(t.selected).toEqual(testData[1])
    })

    it('should return undefined when no selection', () => {
      const t = table().data(testData)
      expect(t.selected).toBeUndefined()
    })

    it('should return selected index', () => {
      const t = table().data(testData).selectedRow(2)
      expect(t.selectedIndex).toBe(2)
    })
  })

  describe('rowCount', () => {
    it('should return number of rows', () => {
      const t = table().data(testData)
      expect(t.rowCount).toBe(3)
    })

    it('should return 0 for empty data', () => {
      const t = table()
      expect(t.rowCount).toBe(0)
    })
  })

  describe('focus() and blur()', () => {
    it('should focus the table', () => {
      const t = table()
      t.focus()
      expect(t.isFocused).toBe(true)
    })

    it('should blur the table', () => {
      const t = table()
      t.focus()
      t.blur()
      expect(t.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = table()
      expect(t.focus()).toBe(t)
      expect(t.blur()).toBe(t)
    })

    it('should mark dirty when focus changes', () => {
      const t = table()
      t.clearDirty()
      t.focus()
      expect((t as any)._dirty).toBe(true)
    })

    it('should not re-trigger focus if already focused', () => {
      const handler = vi.fn()
      const t = table().onFocus(handler)
      t.focus()
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      const handler = vi.fn()
      const t = table().onBlur(handler)
      t.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('selectNext() should move to next row', () => {
      const t = table().data(testData).selectedRow(0)
      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(1)
    })

    it('selectNext() should not go past last row', () => {
      const t = table().data(testData).selectedRow(2)
      ;(t as any).selectNext()
      expect(t.selectedIndex).toBe(2)
    })

    it('selectPrevious() should move to previous row', () => {
      const t = table().data(testData).selectedRow(2)
      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(1)
    })

    it('selectPrevious() should not go past first row', () => {
      const t = table().data(testData).selectedRow(0)
      ;(t as any).selectPrevious()
      expect(t.selectedIndex).toBe(0)
    })
  })

  describe('confirm()', () => {
    it('should call onSelect handlers', () => {
      const handler = vi.fn()
      const t = table().data(testData).selectedRow(1).onSelect(handler)
      ;(t as any).confirm()
      expect(handler).toHaveBeenCalledWith(testData[1], 1)
    })

    it('should not call onSelect when no row selected', () => {
      const handler = vi.fn()
      const t = table().data(testData).onSelect(handler)
      ;(t as any).confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('onSelect() should register handler', () => {
      const handler = vi.fn()
      const t = table().data(testData).selectedRow(0).onSelect(handler)
      ;(t as any).confirm()
      expect(handler).toHaveBeenCalledWith(testData[0], 0)
    })

    it('onChange() should be called when selection changes', () => {
      const handler = vi.fn()
      const t = table().data(testData).onChange(handler)
      t.selectedRow(1)
      expect(handler).toHaveBeenCalledWith(testData[1], 1)
    })

    it('onChange() should be called on navigation', () => {
      const handler = vi.fn()
      const t = table().data(testData).selectedRow(0).onChange(handler)
      ;(t as any).selectNext()
      expect(handler).toHaveBeenCalledWith(testData[1], 1)
    })

    it('onFocus() should be called when focused', () => {
      const handler = vi.fn()
      const t = table().onFocus(handler)
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('onBlur() should be called when blurred', () => {
      const handler = vi.fn()
      const t = table().onBlur(handler)
      t.focus()
      t.blur()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = table().data(testData).onChange(handler1).onChange(handler2)
      t.selectedRow(1)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('handlers should return this for chaining', () => {
      const t = table()
      expect(t.onSelect(() => {})).toBe(t)
      expect(t.onChange(() => {})).toBe(t)
      expect(t.onFocus(() => {})).toBe(t)
      expect(t.onBlur(() => {})).toBe(t)
    })
  })

  describe('render()', () => {
    it('should render to buffer', () => {
      const t = table().columns(testColumns).data(testData)
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check that header is rendered
      const firstChar = buffer.get(0, 0)
      expect(firstChar).toBeDefined()
    })

    it('should not render when not visible', () => {
      const t = table().columns(testColumns).data(testData).visible(false)
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Buffer should remain empty
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should not render with zero dimensions', () => {
      const t = table().columns(testColumns).data(testData)
      ;(t as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should handle empty data', () => {
      const t = table().columns(testColumns)
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render header row', () => {
      const t = table().columns(testColumns).data(testData).showHeader(true)
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First row should have header text
      let headerText = ''
      for (let x = 0; x < 10; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) headerText += cell.char
      }
      expect(headerText).toContain('ID')
    })
  })

  describe('column width calculation', () => {
    it('should respect fixed column widths', () => {
      const t = table()
        .columns([
          { key: 'a', header: 'A', width: 10 },
          { key: 'b', header: 'B', width: 20 }
        ])
        .data([{ a: 'test', b: 'value' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should auto-distribute remaining width', () => {
      const t = table()
        .columns([
          { key: 'a', header: 'A' },
          { key: 'b', header: 'B' }
        ])
        .data([{ a: 'test', b: 'value' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }

      const buffer = createBuffer(50, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should truncate header text when wider than column width', () => {
      const t = table()
        .columns([{ key: 'a', header: 'This is a very long header', width: 8 }])
        .data([{ a: 'test' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Header should be truncated - verify it rendered
      let headerText = ''
      for (let x = 0; x < 8; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) headerText += cell.char
      }
      expect(headerText.length).toBe(8)
      expect(headerText).toBe('This is ')
    })

    it('should truncate cell text when wider than column width', () => {
      const t = table()
        .columns([{ key: 'a', header: 'A', width: 8 }])
        .data([{ a: 'This is a very long cell value' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Cell should be truncated - check row 1 (after header)
      let cellText = ''
      for (let x = 0; x < 8; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) cellText += cell.char
      }
      expect(cellText.length).toBe(8)
      expect(cellText).toBe('This is ')
    })
  })

  describe('custom render function', () => {
    it('should use custom render for cell value', () => {
      const t = table()
        .columns([
          {
            key: 'status',
            header: 'Status',
            render: v => (v === 'up' ? '[+]' : '[-]')
          }
        ])
        .data([{ status: 'up' }, { status: 'down' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Custom render should be applied
      let text = ''
      for (let x = 0; x < 10; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) text += cell.char
      }
      expect(text).toContain('[+]')
    })
  })

  describe('data row rendering', () => {
    it('should render multiple columns in data rows', () => {
      const t = table()
        .columns([
          { key: 'id', header: 'ID', width: 5 },
          { key: 'name', header: 'Name', width: 10 },
          { key: 'status', header: 'Status', width: 8 }
        ])
        .data([
          { id: 1, name: 'Alice', status: 'active' },
          { id: 2, name: 'Bob', status: 'inactive' }
        ])
      ;(t as any)._bounds = { x: 0, y: 0, width: 30, height: 5 }

      const buffer = createBuffer(30, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check first data row (row 1 after header)
      let row1 = ''
      for (let x = 0; x < 25; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) row1 += cell.char
      }
      expect(row1).toContain('1')
      expect(row1).toContain('Alice')
      expect(row1).toContain('active')
    })

    it('should render data rows with column alignment', () => {
      const t = table()
        .columns([
          { key: 'num', header: 'Num', width: 8, align: 'right' },
          { key: 'text', header: 'Text', width: 10, align: 'center' }
        ])
        .data([{ num: 42, text: 'hi' }])
      ;(t as any)._bounds = { x: 0, y: 0, width: 25, height: 5 }

      const buffer = createBuffer(25, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Verify rendering without throwing
      expect(buffer.get(0, 1)).toBeDefined()
    })

    it('should render data row with null/undefined values', () => {
      const t = table()
        .columns([
          { key: 'a', header: 'A', width: 5 },
          { key: 'b', header: 'B', width: 5 }
        ])
        .data([{ a: null, b: undefined }] as any)
      ;(t as any)._bounds = { x: 0, y: 0, width: 15, height: 5 }

      const buffer = createBuffer(15, 5)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render focused table with selected row', () => {
      // Create table with data, focus it, and select a row
      const t = table()
        .columns([
          { key: 'name', header: 'Name', width: 10 },
          { key: 'id', header: 'ID', width: 5 }
        ])
        .data([
          { name: 'Alice', id: 1 },
          { name: 'Bob', id: 2 },
          { name: 'Carol', id: 3 }
        ])
        .focus()
        .selectedRow(1) // Select Bob's row

      // Set bounds and render
      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      const buffer = createBuffer(20, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Verify the table state
      expect((t as any)._focused).toBe(true)
      expect((t as any)._selectedIndex).toBe(1)
      expect(t.selected?.name).toBe('Bob')

      // Verify header row was rendered (row 0)
      const headerCell = buffer.get(0, 0)
      expect(headerCell?.char).toBe('N') // First char of 'Name'
    })

    it('should render striped odd rows with dim attribute', () => {
      const t = table()
        .columns([{ key: 'name', header: 'Name', width: 10 }])
        .data([{ name: 'Row0' }, { name: 'Row1' }, { name: 'Row2' }])
        .striped(true)
      ;(t as any)._bounds = { x: 0, y: 0, width: 15, height: 5 }

      const buffer = createBuffer(15, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Row 1 (index 1, odd) should have ATTR_DIM (8)
      const cell = buffer.get(0, 2) // Row 2 in buffer (header + data row 1)
      expect(cell?.attrs).toBe(8) // ATTR_DIM
    })
  })

  describe('chainable API', () => {
    it('should support full chaining', () => {
      const result = table()
        .columns(testColumns)
        .data(testData)
        .showHeader(true)
        .border('single')
        .striped(true)
        .selectedRow(1)
        .width(60)
        .height(20)
        .onSelect(() => {})
        .onChange(() => {})
        .onFocus(() => {})
        .onBlur(() => {})
        .focus()

      expect(result.selectedIndex).toBe(1)
      expect(result.isFocused).toBe(true)
      expect(result.rowCount).toBe(3)
    })
  })

  describe('generic type support', () => {
    interface User {
      id: number
      name: string
      active: boolean
    }

    it('should work with typed data', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false }
      ]

      const t = table<User>()
        .columns([
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' }
        ])
        .data(users)
        .selectedRow(0)

      expect(t.selected?.name).toBe('Alice')
    })

    it('should pass typed row to handlers', () => {
      const users: User[] = [{ id: 1, name: 'Alice', active: true }]

      let receivedUser: User | undefined
      const t = table<User>()
        .data(users)
        .selectedRow(0)
        .onSelect(row => {
          receivedUser = row
        })

      ;(t as any).confirm()
      expect(receivedUser?.name).toBe('Alice')
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const t = table()
      expect(t.isVisible).toBe(true)
    })

    it('should be hideable', () => {
      const t = table().visible(false)
      expect(t.isVisible).toBe(false)
    })

    it('should be showable after hiding', () => {
      const t = table().visible(false).visible(true)
      expect(t.isVisible).toBe(true)
    })
  })
})
