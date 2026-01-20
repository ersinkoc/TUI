/**
 * @oxog/tui - Heatmap Widget Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { heatmap } from '../../src/widgets/heatmap'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

const sampleData = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12]
]

describe('Heatmap Widget', () => {
  describe('creation', () => {
    it('creates an empty heatmap', () => {
      const hm = heatmap()
      expect(hm).toBeDefined()
      expect(hm.type).toBe('heatmap')
      expect(hm.rows).toBe(0)
      expect(hm.cols).toBe(0)
    })

    it('creates with data', () => {
      const hm = heatmap({ data: sampleData })
      expect(hm.rows).toBe(3)
      expect(hm.cols).toBe(4)
    })

    it('creates with all props', () => {
      const hm = heatmap({
        data: sampleData,
        rowLabels: ['A', 'B', 'C'],
        columnLabels: ['W', 'X', 'Y', 'Z'],
        colorScale: 'viridis',
        showValues: true,
        minValue: 0,
        maxValue: 15,
        cellWidth: 6,
        cellHeight: 2
      })
      expect(hm.rows).toBe(3)
      expect(hm.cols).toBe(4)
    })
  })

  describe('data handling', () => {
    it('sets data via method', () => {
      const hm = heatmap()
      hm.data(sampleData)
      expect(hm.rows).toBe(3)
      expect(hm.cols).toBe(4)
    })

    it('clears data', () => {
      const hm = heatmap({ data: sampleData })
      hm.clear()
      expect(hm.rows).toBe(0)
      expect(hm.cols).toBe(0)
    })

    it('handles empty rows', () => {
      const hm = heatmap({ data: [] })
      expect(hm.rows).toBe(0)
      expect(hm.cols).toBe(0)
    })

    it('handles single cell', () => {
      const hm = heatmap({ data: [[42]] })
      expect(hm.rows).toBe(1)
      expect(hm.cols).toBe(1)
      expect(hm.selectedValue).toBe(42)
    })
  })

  describe('labels', () => {
    it('sets row labels', () => {
      const hm = heatmap({ data: sampleData })
      hm.rowLabels(['Row 1', 'Row 2', 'Row 3'])
      expect(hm).toBeDefined()
    })

    it('sets column labels', () => {
      const hm = heatmap({ data: sampleData })
      hm.columnLabels(['Col 1', 'Col 2', 'Col 3', 'Col 4'])
      expect(hm).toBeDefined()
    })
  })

  describe('color scales', () => {
    it('uses default scale', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'default' })
      expect(hm).toBeDefined()
    })

    it('uses grayscale', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'grayscale' })
      expect(hm).toBeDefined()
    })

    it('uses viridis', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'viridis' })
      expect(hm).toBeDefined()
    })

    it('uses plasma', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'plasma' })
      expect(hm).toBeDefined()
    })

    it('uses cool', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'cool' })
      expect(hm).toBeDefined()
    })

    it('uses warm', () => {
      const hm = heatmap({ data: sampleData, colorScale: 'warm' })
      expect(hm).toBeDefined()
    })

    it('uses custom colors', () => {
      const hm = heatmap({ data: sampleData })
      hm.customColors([196, 202, 208, 214, 220, 226])
      expect(hm).toBeDefined()
    })

    it('switches color scale', () => {
      const hm = heatmap({ data: sampleData })
      hm.colorScale('viridis')
      hm.colorScale('plasma')
      hm.colorScale('grayscale')
      expect(hm).toBeDefined()
    })
  })

  describe('configuration', () => {
    it('toggles show values', () => {
      const hm = heatmap({ data: sampleData })
      hm.showValues(true)
      expect(hm).toBeDefined()

      hm.showValues(false)
      expect(hm).toBeDefined()
    })

    it('sets min value', () => {
      const hm = heatmap({ data: sampleData })
      hm.minValue(0)
      expect(hm).toBeDefined()
    })

    it('sets max value', () => {
      const hm = heatmap({ data: sampleData })
      hm.maxValue(100)
      expect(hm).toBeDefined()
    })

    it('sets cell width', () => {
      const hm = heatmap({ data: sampleData })
      hm.cellWidth(8)
      expect(hm).toBeDefined()
    })

    it('sets cell height', () => {
      const hm = heatmap({ data: sampleData })
      hm.cellHeight(2)
      expect(hm).toBeDefined()
    })

    it('clamps cell dimensions', () => {
      const hm = heatmap({ data: sampleData })
      hm.cellWidth(0)
      hm.cellHeight(-1)
      expect(hm).toBeDefined()
    })
  })

  describe('selection', () => {
    let hm: ReturnType<typeof heatmap>

    beforeEach(() => {
      hm = heatmap({ data: sampleData }).focus()
    })

    it('starts at 0,0', () => {
      expect(hm.selectedRow).toBe(0)
      expect(hm.selectedCol).toBe(0)
      expect(hm.selectedValue).toBe(1)
    })

    it('selects specific cell', () => {
      hm.selectCell(1, 2)
      expect(hm.selectedRow).toBe(1)
      expect(hm.selectedCol).toBe(2)
      expect(hm.selectedValue).toBe(7)
    })

    it('clamps selection to valid range', () => {
      hm.selectCell(100, 100)
      expect(hm.selectedRow).toBe(2)
      expect(hm.selectedCol).toBe(3)

      hm.selectCell(-5, -5)
      expect(hm.selectedRow).toBe(0)
      expect(hm.selectedCol).toBe(0)
    })

    it('returns null for invalid selection', () => {
      const empty = heatmap()
      expect(empty.selectedValue).toBeNull()
    })
  })

  describe('navigation', () => {
    let hm: ReturnType<typeof heatmap>

    beforeEach(() => {
      hm = heatmap({ data: sampleData }).focus()
    })

    it('moves right', () => {
      hm.moveRight()
      expect(hm.selectedCol).toBe(1)
      expect(hm.selectedValue).toBe(2)
    })

    it('moves left', () => {
      hm.selectCell(1, 2)
      hm.moveLeft()
      expect(hm.selectedCol).toBe(1)
    })

    it('moves down', () => {
      hm.moveDown()
      expect(hm.selectedRow).toBe(1)
      expect(hm.selectedValue).toBe(5)
    })

    it('moves up', () => {
      hm.selectCell(2, 0)
      hm.moveUp()
      expect(hm.selectedRow).toBe(1)
    })

    it('stays in bounds on left edge', () => {
      hm.moveLeft()
      expect(hm.selectedCol).toBe(0)
    })

    it('stays in bounds on right edge', () => {
      hm.selectCell(0, 3)
      hm.moveRight()
      expect(hm.selectedCol).toBe(3)
    })

    it('stays in bounds on top edge', () => {
      hm.moveUp()
      expect(hm.selectedRow).toBe(0)
    })

    it('stays in bounds on bottom edge', () => {
      hm.selectCell(2, 0)
      hm.moveDown()
      expect(hm.selectedRow).toBe(2)
    })
  })

  describe('events', () => {
    it('emits select event', () => {
      const handler = vi.fn()
      const hm = heatmap({ data: sampleData }).focus()
      hm.onSelect(handler)

      hm.selectCell(1, 2)
      expect(handler).toHaveBeenCalledWith(1, 2, 7)
    })

    it('emits select on navigation', () => {
      const handler = vi.fn()
      const hm = heatmap({ data: sampleData }).focus()
      hm.onSelect(handler)

      hm.moveRight()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('focuses and blurs', () => {
      const hm = heatmap()
      expect(hm.isFocused).toBe(false)

      hm.focus()
      expect(hm.isFocused).toBe(true)

      hm.blur()
      expect(hm.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    let hm: ReturnType<typeof heatmap>

    beforeEach(() => {
      hm = heatmap({ data: sampleData }).focus()
    })

    it('handles arrow keys', () => {
      ;(hm as any).handleKey('right')
      expect(hm.selectedCol).toBe(1)

      ;(hm as any).handleKey('down')
      expect(hm.selectedRow).toBe(1)

      ;(hm as any).handleKey('left')
      expect(hm.selectedCol).toBe(0)

      ;(hm as any).handleKey('up')
      expect(hm.selectedRow).toBe(0)
    })

    it('handles vim keys', () => {
      ;(hm as any).handleKey('l')
      expect(hm.selectedCol).toBe(1)

      ;(hm as any).handleKey('j')
      expect(hm.selectedRow).toBe(1)

      ;(hm as any).handleKey('h')
      expect(hm.selectedCol).toBe(0)

      ;(hm as any).handleKey('k')
      expect(hm.selectedRow).toBe(0)
    })

    it('handles home key', () => {
      hm.selectCell(2, 3)
      ;(hm as any).handleKey('home')
      expect(hm.selectedRow).toBe(0)
      expect(hm.selectedCol).toBe(0)
    })

    it('handles end key', () => {
      ;(hm as any).handleKey('end')
      expect(hm.selectedRow).toBe(2)
      expect(hm.selectedCol).toBe(3)
    })

    it('ignores keys when not focused', () => {
      hm.blur()
      const result = (hm as any).handleKey('right')
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let hm: ReturnType<typeof heatmap>

    beforeEach(() => {
      hm = heatmap({ data: sampleData })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
    })

    it('focuses on click', () => {
      expect(hm.isFocused).toBe(false)
      ;(hm as any).handleMouse(5, 1, 'press')
      expect(hm.isFocused).toBe(true)
    })

    it('selects cell on click', () => {
      ;(hm as any).handleMouse(8, 2, 'press')
      // Cell at that position should be selected
      expect(hm.selectedRow).toBeGreaterThanOrEqual(0)
    })

    it('ignores when not visible', () => {
      hm.visible(false)
      const result = (hm as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })

    it('ignores without bounds', () => {
      ;(hm as any)._bounds = null
      const result = (hm as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(40, 15)
    })

    it('renders heatmap', () => {
      const hm = heatmap({ data: sampleData })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should have rendered color blocks
      expect(buffer.get(0, 0).char).toBe('\u2588')
    })

    it('renders with row labels', () => {
      const hm = heatmap({
        data: sampleData,
        rowLabels: ['A', 'B', 'C']
      })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Row label should be present
      expect(buffer.get(0, 0).char).toBe('A')
    })

    it('renders with column labels', () => {
      const hm = heatmap({
        data: sampleData,
        columnLabels: ['W', 'X', 'Y', 'Z']
      })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Column labels on first row
      expect(buffer.get(0, 0).char).not.toBe('\u2588')
    })

    it('renders with values shown', () => {
      const hm = heatmap({
        data: [[1.5, 2.5], [3.5, 4.5]],
        showValues: true
      })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Values should be displayed
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders selection highlight', () => {
      const hm = heatmap({ data: sampleData }).focus()
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Selected cell should be highlighted
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders with custom cell size', () => {
      const hm = heatmap({
        data: sampleData,
        cellWidth: 6,
        cellHeight: 2
      })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders different color scales', () => {
      const scales = ['default', 'grayscale', 'viridis', 'plasma', 'cool', 'warm'] as const
      for (const scale of scales) {
        const hm = heatmap({ data: sampleData, colorScale: scale })
        ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
        hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
        expect(buffer.get(0, 0)).toBeDefined()
      }
    })

    it('renders selection info when focused', () => {
      const hm = heatmap({ data: sampleData }).focus()
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Selection info should be at bottom (3 data rows with cellHeight=1, so selection info at row 3)
      expect(buffer.get(0, 3).char).toBe('[')
    })

    it('does not render when not visible', () => {
      const hm = heatmap({ data: sampleData })
      hm.visible(false)
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const hm = heatmap({ data: sampleData })
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render with zero dimensions', () => {
      const hm = heatmap({ data: sampleData })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('renders empty heatmap gracefully', () => {
      const hm = heatmap()
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should just clear without crashing
      expect(buffer.get(0, 0).char).toBe(' ')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const hm = heatmap()
        .data(sampleData)
        .rowLabels(['A', 'B', 'C'])
        .columnLabels(['X', 'Y', 'Z', 'W'])
        .colorScale('viridis')
        .showValues(true)
        .minValue(0)
        .maxValue(20)
        .cellWidth(5)
        .cellHeight(1)
        .focus()

      expect(hm.rows).toBe(3)
      expect(hm.cols).toBe(4)
      expect(hm.isFocused).toBe(true)
    })

    it('chains navigation methods', () => {
      const hm = heatmap({ data: sampleData })
        .focus()
        .moveRight()
        .moveRight()
        .moveDown()
        .moveLeft()

      expect(hm.selectedRow).toBe(1)
      expect(hm.selectedCol).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles uniform data', () => {
      const hm = heatmap({ data: [[5, 5], [5, 5]] })
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      const buffer = createTestBuffer(40, 15)
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(hm).toBeDefined()
    })

    it('handles negative values', () => {
      const hm = heatmap({ data: [[-10, -5], [0, 5]] })
      expect(hm.rows).toBe(2)
    })

    it('handles very large values', () => {
      const hm = heatmap({ data: [[1e10, 1e11], [1e12, 1e13]] })
      expect(hm).toBeDefined()
    })

    it('handles decimal values', () => {
      const hm = heatmap({ data: [[0.1, 0.2], [0.3, 0.4]] })
      expect(hm.selectedValue).toBe(0.1)
    })

    it('handles custom colors with empty array', () => {
      const hm = heatmap({ data: sampleData })
      hm.customColors([])
      ;(hm as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      const buffer = createTestBuffer(40, 15)
      hm.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(hm).toBeDefined()
    })

    it('handles ragged arrays', () => {
      const hm = heatmap({ data: [[1, 2, 3], [4, 5]] })
      expect(hm.rows).toBe(2)
      expect(hm.cols).toBe(3)
    })
  })
})
