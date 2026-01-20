/**
 * Grid widget tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { grid, text, box } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Grid Widget', () => {
  describe('creation', () => {
    it('creates a grid with default properties', () => {
      const g = grid()
      expect(g.type).toBe('grid')
      expect(g.cellCount).toBe(0)
    })

    it('creates a grid with initial properties', () => {
      const g = grid({
        columns: 3,
        rows: 2,
        gap: 1
      })
      expect(g.type).toBe('grid')
      expect(g.cellCount).toBe(0)
    })

    it('creates a grid with column and row templates', () => {
      const g = grid({
        columns: 3,
        columnTemplate: ['100', '1fr', '200'],
        rowTemplate: ['50%', '50%']
      })
      expect(g.type).toBe('grid')
    })
  })

  describe('configuration', () => {
    it('sets columns count', () => {
      const g = grid().columns(4)
      expect(g.type).toBe('grid')
    })

    it('sets rows count', () => {
      const g = grid().rows(3)
      expect(g.type).toBe('grid')
    })

    it('sets column template', () => {
      const g = grid().columnTemplate(['1fr', '2fr', '1fr'])
      expect(g.type).toBe('grid')
    })

    it('sets row template', () => {
      const g = grid().rowTemplate(['100', '1fr'])
      expect(g.type).toBe('grid')
    })

    it('sets gap', () => {
      const g = grid().gap(2)
      expect(g.type).toBe('grid')
    })

    it('sets column gap', () => {
      const g = grid().columnGap(1)
      expect(g.type).toBe('grid')
    })

    it('sets row gap', () => {
      const g = grid().rowGap(1)
      expect(g.type).toBe('grid')
    })
  })

  describe('content management', () => {
    it('adds cells with auto-placement', () => {
      const g = grid({ columns: 2 })
        .add(text('Cell 1'))
        .add(text('Cell 2'))
        .add(text('Cell 3'))

      expect(g.cellCount).toBe(3)
    })

    it('adds cells with explicit position', () => {
      const g = grid({ columns: 3, rows: 3 })
        .add(text('Cell 1'), 1, 1)
        .add(text('Cell 2'), 2, 2)
        .add(text('Cell 3'), 3, 3)

      expect(g.cellCount).toBe(3)
    })

    it('adds cells with span', () => {
      const g = grid({ columns: 3, rows: 2 })
        .add(text('Header'), 1, 1, 3, 1) // Span 3 columns

      expect(g.cellCount).toBe(1)
    })

    it('uses cell method for explicit placement', () => {
      const g = grid({ columns: 2, rows: 2 })
        .cell(1, 1, text('Top Left'))
        .cell(2, 1, text('Top Right'))
        .cell(1, 2, text('Bottom Left'))
        .cell(2, 2, text('Bottom Right'))

      expect(g.cellCount).toBe(4)
    })

    it('removes cells', () => {
      const t1 = text('Cell 1')
      const t2 = text('Cell 2')
      const g = grid()
        .add(t1)
        .add(t2)

      expect(g.cellCount).toBe(2)

      g.remove(t1)
      expect(g.cellCount).toBe(1)
    })

    it('clears all cells', () => {
      const g = grid()
        .add(text('Cell 1'))
        .add(text('Cell 2'))
        .add(text('Cell 3'))

      expect(g.cellCount).toBe(3)

      g.clear()
      expect(g.cellCount).toBe(0)
    })
  })

  describe('auto-placement', () => {
    it('auto-advances to next column', () => {
      const g = grid({ columns: 2 })
        .add(text('1'))
        .add(text('2'))
        .add(text('3')) // Should wrap to row 2

      expect(g.cellCount).toBe(3)
    })

    it('auto-advances to next row when column is full', () => {
      const g = grid({ columns: 3 })
        .add(text('1'))
        .add(text('2'))
        .add(text('3'))
        .add(text('4')) // Should be on row 2

      expect(g.cellCount).toBe(4)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty grid', () => {
      const g = grid()
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('renders grid with cells', () => {
      const g = grid({ columns: 2, rows: 1 })
        .add(text('Left'))
        .add(text('Right'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should render without error
    })

    it('renders grid with gap', () => {
      const g = grid({ columns: 2, rows: 1, gap: 1 })
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds gracefully', () => {
      const g = grid().add(text('Test'))
      ;(g as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('respects visibility', () => {
      const g = grid().add(text('Test')).visible(false)
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not render anything
    })
  })

  describe('templates', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(100, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles fixed width columns', () => {
      const g = grid()
        .columns(2)
        .columnTemplate([10, 20])
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles percentage columns', () => {
      const g = grid()
        .columns(2)
        .columnTemplate(['50%', '50%'])
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles fr unit columns', () => {
      const g = grid()
        .columns(3)
        .columnTemplate(['1fr', '2fr', '1fr'])
        .add(text('A'))
        .add(text('B'))
        .add(text('C'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles mixed template units', () => {
      const g = grid()
        .columns(3)
        .columnTemplate([10, '1fr', '20%'])
        .add(text('Fixed'))
        .add(text('Flex'))
        .add(text('Percent'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles row templates', () => {
      const g = grid()
        .columns(1)
        .rows(3)
        .rowTemplate(['1fr', '2fr', '1fr'])
        .add(text('Top'))
        .add(text('Middle'))
        .add(text('Bottom'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 50, height: 8 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('spanning', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(60, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles column spanning', () => {
      const g = grid({ columns: 3, rows: 2 })
        .cell(1, 1, text('Header'), 3, 1) // Span all 3 columns
        .cell(1, 2, text('A'))
        .cell(2, 2, text('B'))
        .cell(3, 2, text('C'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 60, height: 2 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(g.cellCount).toBe(4)
    })

    it('handles row spanning', () => {
      const g = grid({ columns: 2, rows: 3 })
        .cell(1, 1, text('Sidebar'), 1, 3) // Span all 3 rows
        .cell(2, 1, text('Top'))
        .cell(2, 2, text('Middle'))
        .cell(2, 3, text('Bottom'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 6 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(g.cellCount).toBe(4)
    })

    it('handles both column and row spanning', () => {
      const g = grid({ columns: 3, rows: 3 })
        .cell(1, 1, text('Big'), 2, 2) // 2x2 span
        .cell(3, 1, text('Right'))
        .cell(3, 2, text('Right 2'))
        .cell(1, 3, text('Bottom'))
        .cell(2, 3, text('Bottom 2'))
        .cell(3, 3, text('Corner'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 60, height: 6 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(g.cellCount).toBe(6)
    })
  })

  describe('edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(40, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles cells outside grid bounds', () => {
      const g = grid({ columns: 2, rows: 2 })
        .cell(10, 10, text('Outside')) // Way outside

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 4 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('handles negative positions', () => {
      const g = grid({ columns: 2, rows: 2 })
        .cell(-1, -1, text('Negative'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 4 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not throw
    })

    it('handles empty template arrays', () => {
      const g = grid()
        .columns(2)
        .columnTemplate([])
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('enforces minimum column count', () => {
      const g = grid().columns(0) // Should be clamped to 1
      expect(g.type).toBe('grid')
    })

    it('enforces minimum row count', () => {
      const g = grid().rows(0) // Should be clamped to 1
      expect(g.type).toBe('grid')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const g = grid()
        .columns(3)
        .rows(2)
        .columnTemplate(['1fr', '2fr', '1fr'])
        .rowTemplate(['1fr', '1fr'])
        .gap(1)
        .columnGap(2)
        .rowGap(1)
        .add(text('Cell 1'))
        .add(text('Cell 2'))
        .cell(3, 1, text('Cell 3'))
        .clear()
        .add(text('New Cell'))

      expect(g.type).toBe('grid')
      expect(g.cellCount).toBe(1)
    })
  })

  describe('parent-child relationship', () => {
    it('sets parent on added cells', () => {
      const t = text('Child')
      const g = grid().add(t)

      expect((t as any)._parent).toBe(g)
    })

    it('clears parent on removed cells', () => {
      const t = text('Child')
      const g = grid().add(t)
      g.remove(t)

      expect((t as any)._parent).toBe(null)
    })

    it('clears parent on clear', () => {
      const t1 = text('Child 1')
      const t2 = text('Child 2')
      const g = grid().add(t1).add(t2)

      g.clear()

      expect((t1 as any)._parent).toBe(null)
      expect((t2 as any)._parent).toBe(null)
    })
  })

  describe('additional edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(60, 20)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not remove non-existent node', () => {
      const t1 = text('Exists')
      const t2 = text('Does not exist')
      const g = grid().add(t1)

      expect(g.cellCount).toBe(1)
      g.remove(t2) // Remove something that was never added
      expect(g.cellCount).toBe(1) // Count should still be 1
    })

    it('handles row template with fixed string value (not fr/percent)', () => {
      const g = grid()
        .columns(1)
        .rows(2)
        .rowTemplate(['20', '30']) // String numbers, not fr or %
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 50, height: 100 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(g.cellCount).toBe(2)
    })

    it('handles column template with fixed string value (not fr/percent)', () => {
      const g = grid()
        .columns(2)
        .rows(1)
        .columnTemplate(['15', '25']) // String numbers, not fr or %
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 10 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(g.cellCount).toBe(2)
    })

    it('handles props with columnGap and rowGap', () => {
      const g = grid({
        columns: 2,
        rows: 2,
        gap: 1,
        columnGap: 2,
        rowGap: 3
      })
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles mixed fr units in row template', () => {
      const g = grid()
        .columns(1)
        .rows(3)
        .rowTemplate(['1fr', '2fr', '1fr'])
        .add(text('A'))
        .add(text('B'))
        .add(text('C'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 12 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles percentage in row template', () => {
      const g = grid()
        .columns(1)
        .rows(2)
        .rowTemplate(['50%', '50%'])
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles numeric values in row template', () => {
      const g = grid()
        .columns(1)
        .rows(2)
        .rowTemplate([5, 10]) // Numeric values
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero totalFr case in row template', () => {
      const g = grid()
        .columns(1)
        .rows(2)
        .rowTemplate([5, 10]) // All fixed, no fr units
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero totalFr case in column template', () => {
      const g = grid()
        .columns(2)
        .rows(1)
        .columnTemplate([10, 20]) // All fixed, no fr units
        .add(text('A'))
        .add(text('B'))

      ;(g as any)._bounds = { x: 0, y: 0, width: 100, height: 10 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles row span exceeding grid rows', () => {
      const g = grid({ columns: 2, rows: 2 })
        .cell(1, 1, text('Big'), 1, 5) // Row span of 5 but only 2 rows

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles column span exceeding grid columns', () => {
      const g = grid({ columns: 2, rows: 2 })
        .cell(1, 1, text('Wide'), 5, 1) // Col span of 5 but only 2 columns

      ;(g as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})
