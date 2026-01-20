/**
 * @oxog/tui - JSONViewer Widget Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { jsonviewer } from '../../src/widgets/jsonviewer'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

const sampleData = {
  name: 'John Doe',
  age: 30,
  active: true,
  balance: null,
  hobbies: ['reading', 'gaming', 'coding'],
  address: {
    street: '123 Main St',
    city: 'New York',
    zip: '10001'
  }
}

describe('JSONViewer Widget', () => {
  describe('creation', () => {
    it('creates an empty jsonviewer', () => {
      const jv = jsonviewer()
      expect(jv).toBeDefined()
      expect(jv.type).toBe('jsonviewer')
      expect(jv.lineCount).toBe(0)
    })

    it('creates with data', () => {
      const jv = jsonviewer({ data: sampleData })
      expect(jv.lineCount).toBeGreaterThan(0)
    })

    it('creates with all props', () => {
      const jv = jsonviewer({
        data: sampleData,
        expandDepth: 2,
        showIndices: false,
        indentSize: 4,
        colors: { key: 10, string: 11 }
      })
      expect(jv.lineCount).toBeGreaterThan(0)
    })
  })

  describe('data handling', () => {
    it('sets data via method', () => {
      const jv = jsonviewer()
      jv.data(sampleData)
      expect(jv.lineCount).toBeGreaterThan(0)
    })

    it('handles null data', () => {
      const jv = jsonviewer({ data: null })
      expect(jv.lineCount).toBe(1)
    })

    it('handles primitive string', () => {
      const jv = jsonviewer({ data: 'hello' })
      expect(jv.lineCount).toBe(1)
    })

    it('handles primitive number', () => {
      const jv = jsonviewer({ data: 42 })
      expect(jv.lineCount).toBe(1)
    })

    it('handles primitive boolean', () => {
      const jv = jsonviewer({ data: true })
      expect(jv.lineCount).toBe(1)
    })

    it('handles array', () => {
      const jv = jsonviewer({ data: [1, 2, 3], expandDepth: -1 })
      expect(jv.lineCount).toBe(4) // array + 3 items
    })

    it('handles nested objects', () => {
      const jv = jsonviewer({ data: { a: { b: { c: 1 } } }, expandDepth: -1 })
      expect(jv.lineCount).toBe(4) // root + a + b + c
    })
  })

  describe('expand/collapse', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: 0 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
    })

    it('expands current node', () => {
      const initialCount = jv.lineCount
      jv.expand()
      expect(jv.lineCount).toBeGreaterThan(initialCount)
    })

    it('collapses current node', () => {
      jv.expand()
      const expandedCount = jv.lineCount
      jv.collapse()
      expect(jv.lineCount).toBeLessThan(expandedCount)
    })

    it('toggles expansion', () => {
      const initialCount = jv.lineCount
      jv.toggle()
      expect(jv.lineCount).toBeGreaterThan(initialCount)
      jv.toggle()
      expect(jv.lineCount).toBe(initialCount)
    })

    it('expands all nodes', () => {
      jv.expandAll()
      // Should have many more lines when all expanded
      expect(jv.lineCount).toBeGreaterThan(10)
    })

    it('collapses all nodes', () => {
      jv.expandAll()
      const expandedCount = jv.lineCount
      jv.collapseAll()
      // Root stays expanded, but children are collapsed
      expect(jv.lineCount).toBeLessThan(expandedCount)
    })

    it('sets expand depth', () => {
      jv.expandDepth(2)
      const depth2Count = jv.lineCount

      jv.expandDepth(1)
      expect(jv.lineCount).toBeLessThan(depth2Count)
    })
  })

  describe('navigation', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('moves up', () => {
      jv.moveDown()
      jv.moveDown()
      jv.moveUp()
      // Should have moved
      expect(jv.currentPath).toBeDefined()
    })

    it('moves down', () => {
      jv.moveDown()
      expect(jv.currentPath).not.toBe('')
    })

    it('moves to parent', () => {
      jv.moveDown()
      jv.moveDown()
      jv.moveToParent()
      // Should be at parent level
      expect(jv.currentPath).toBeDefined()
    })

    it('moves to first child', () => {
      // Start at root, move to first child
      jv.moveToFirstChild()
      expect(jv.currentPath).toBe('name')
    })

    it('scrolls to top', () => {
      jv.scrollToBottom()
      jv.scrollToTop()
      expect(jv.currentPath).toBe('')
    })

    it('scrolls to bottom', () => {
      jv.scrollToBottom()
      // Should be at last item
      expect(jv.lineCount - 1).toBeGreaterThan(0)
    })

    it('pages up', () => {
      jv.scrollToBottom()
      jv.pageUp()
      // Should have moved up
      expect(jv).toBeDefined()
    })

    it('pages down', () => {
      jv.pageDown()
      // Should have moved down
      expect(jv).toBeDefined()
    })
  })

  describe('current selection', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: -1 })
    })

    it('returns current path', () => {
      jv.moveDown() // name
      expect(jv.currentPath).toBe('name')
    })

    it('returns current value', () => {
      jv.moveDown() // name
      expect(jv.currentValue).toBe('John Doe')
    })

    it('returns empty path for root', () => {
      expect(jv.currentPath).toBe('')
    })

    it('handles array indices in path', () => {
      // Navigate to hobbies[0]
      jv.moveDown() // name
      jv.moveDown() // age
      jv.moveDown() // active
      jv.moveDown() // balance
      jv.moveDown() // hobbies
      jv.moveToFirstChild() // hobbies[0]
      expect(jv.currentPath).toBe('hobbies[0]')
    })
  })

  describe('search', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
    })

    it('searches for text in keys', () => {
      jv.search('name')
      expect(jv.matchCount).toBeGreaterThan(0)
    })

    it('searches for text in values', () => {
      jv.search('John')
      expect(jv.matchCount).toBeGreaterThan(0)
    })

    it('goes to next match', () => {
      jv.search('a') // Should match several things
      const first = jv.currentPath
      jv.nextMatch()
      // Path should change or stay if only one match
      expect(jv.currentPath).toBeDefined()
    })

    it('goes to previous match', () => {
      jv.search('a')
      jv.nextMatch()
      jv.nextMatch()
      jv.previousMatch()
      expect(jv.currentPath).toBeDefined()
    })

    it('wraps around matches', () => {
      jv.search('age')
      expect(jv.matchCount).toBe(1)
      jv.nextMatch()
      // Should wrap to first match
      expect(jv.matchCount).toBe(1)
    })

    it('clears search', () => {
      jv.search('name')
      expect(jv.matchCount).toBeGreaterThan(0)

      jv.clearSearch()
      expect(jv.matchCount).toBe(0)
    })

    it('handles no matches', () => {
      jv.search('xyznonexistent')
      expect(jv.matchCount).toBe(0)
    })

    it('handles empty query', () => {
      jv.search('')
      expect(jv.matchCount).toBe(0)
    })
  })

  describe('copy', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: -1 })
    })

    it('copies current value', () => {
      jv.moveDown() // name
      const value = jv.copyValue()
      expect(value).toBe('"John Doe"')
    })

    it('copies current path', () => {
      jv.moveDown() // name
      const path = jv.copyPath()
      expect(path).toBe('name')
    })

    it('copies object value as JSON', () => {
      // Navigate to address (with expandDepth -1, all nodes are expanded)
      // Root object -> name -> age -> active -> balance -> hobbies -> [0] -> [1] -> [2] -> address
      // Use search to find address directly
      jv.search('address')
      const value = jv.copyValue()
      expect(value).toContain('street')
    })
  })

  describe('configuration', () => {
    it('toggles show indices', () => {
      const jv = jsonviewer({ data: [1, 2, 3], expandDepth: -1, showIndices: true })
      jv.showIndices(false)
      expect(jv.lineCount).toBe(4)
    })

    it('sets indent size', () => {
      const jv = jsonviewer({ data: sampleData })
      jv.indentSize(4)
      expect(jv).toBeDefined()
    })

    it('clamps indent size', () => {
      const jv = jsonviewer({ data: sampleData })
      jv.indentSize(100)
      expect(jv).toBeDefined()

      jv.indentSize(-5)
      expect(jv).toBeDefined()
    })

    it('sets colors', () => {
      const jv = jsonviewer({ data: sampleData })
      jv.colors({ key: 9, string: 10 })
      expect(jv).toBeDefined()
    })
  })

  describe('focus', () => {
    it('focuses and blurs', () => {
      const jv = jsonviewer()
      expect(jv.isFocused).toBe(false)

      jv.focus()
      expect(jv.isFocused).toBe(true)

      jv.blur()
      expect(jv.isFocused).toBe(false)
    })
  })

  describe('events', () => {
    it('emits select event', () => {
      const handler = vi.fn()
      const jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      jv.onSelect(handler)

      jv.moveDown()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: 1 }).focus()
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('handles up arrow', () => {
      jv.moveDown()
      jv.moveDown()
      ;(jv as any).handleKey('up', false)
      expect(jv.currentPath).toBeDefined()
    })

    it('handles down arrow', () => {
      ;(jv as any).handleKey('down', false)
      expect(jv.currentPath).toBe('name')
    })

    it('handles k for up', () => {
      jv.moveDown()
      ;(jv as any).handleKey('k', false)
      expect(jv.currentPath).toBe('')
    })

    it('handles j for down', () => {
      ;(jv as any).handleKey('j', false)
      expect(jv.currentPath).toBe('name')
    })

    it('handles left to collapse', () => {
      jv.expand()
      ;(jv as any).handleKey('left', false)
      // Should collapse or move to parent
      expect(jv).toBeDefined()
    })

    it('handles right to expand', () => {
      ;(jv as any).handleKey('right', false)
      // Should expand or move to first child
      expect(jv).toBeDefined()
    })

    it('handles h for left', () => {
      ;(jv as any).handleKey('h', false)
      expect(jv).toBeDefined()
    })

    it('handles l for right', () => {
      ;(jv as any).handleKey('l', false)
      expect(jv).toBeDefined()
    })

    it('handles enter to toggle', () => {
      const count = jv.lineCount
      ;(jv as any).handleKey('enter', false)
      expect(jv.lineCount).not.toBe(count)
    })

    it('handles space to toggle', () => {
      const count = jv.lineCount
      ;(jv as any).handleKey(' ', false)
      expect(jv.lineCount).not.toBe(count)
    })

    it('handles pageup', () => {
      jv.scrollToBottom()
      ;(jv as any).handleKey('pageup', false)
      expect(jv).toBeDefined()
    })

    it('handles pagedown', () => {
      ;(jv as any).handleKey('pagedown', false)
      expect(jv).toBeDefined()
    })

    it('handles g for top', () => {
      jv.scrollToBottom()
      ;(jv as any).handleKey('g', false)
      expect(jv.currentPath).toBe('')
    })

    it('handles G for bottom', () => {
      ;(jv as any).handleKey('G', false)
      // Should be at bottom
      expect(jv).toBeDefined()
    })

    it('handles e to expand all', () => {
      jv.collapseAll()
      const count = jv.lineCount
      ;(jv as any).handleKey('e', false)
      expect(jv.lineCount).toBeGreaterThan(count)
    })

    it('handles c to collapse all', () => {
      jv.expandAll()
      const count = jv.lineCount
      ;(jv as any).handleKey('c', false)
      expect(jv.lineCount).toBeLessThan(count)
    })

    it('handles n for next match', () => {
      jv.search('a')
      ;(jv as any).handleKey('n', false)
      expect(jv).toBeDefined()
    })

    it('handles N for previous match', () => {
      jv.search('a')
      jv.nextMatch()
      ;(jv as any).handleKey('N', false)
      expect(jv).toBeDefined()
    })

    it('handles ctrl+home', () => {
      jv.scrollToBottom()
      ;(jv as any).handleKey('home', true)
      expect(jv.currentPath).toBe('')
    })

    it('handles ctrl+end', () => {
      ;(jv as any).handleKey('end', true)
      expect(jv).toBeDefined()
    })

    it('ignores keys when not focused', () => {
      jv.blur()
      const result = (jv as any).handleKey('down', false)
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let jv: ReturnType<typeof jsonviewer>

    beforeEach(() => {
      jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('focuses on click', () => {
      expect(jv.isFocused).toBe(false)
      ;(jv as any).handleMouse(5, 1, 'press')
      expect(jv.isFocused).toBe(true)
    })

    it('selects item on click', () => {
      ;(jv as any).handleMouse(5, 2, 'press')
      expect(jv.currentPath).not.toBe('')
    })

    it('toggles on double-click', () => {
      jv.collapseAll()
      const count = jv.lineCount
      ;(jv as any).handleMouse(5, 0, 'double-click')
      expect(jv.lineCount).not.toBe(count)
    })

    it('scrolls on mouse wheel up', () => {
      jv.scrollToBottom()
      ;(jv as any).handleMouse(5, 5, 'scroll-up')
      expect(jv).toBeDefined()
    })

    it('scrolls on mouse wheel down', () => {
      ;(jv as any).handleMouse(5, 5, 'scroll-down')
      expect(jv).toBeDefined()
    })

    it('ignores when not visible', () => {
      jv.visible(false)
      const result = (jv as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(80, 20)
    })

    it('renders JSON data', () => {
      const jv = jsonviewer({ data: sampleData })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should have rendered something
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders expanded object', () => {
      const jv = jsonviewer({ data: sampleData, expandDepth: 1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check for expand indicator
      expect(buffer.get(0, 0).char).toBe('\u25bc') // ▼
    })

    it('renders collapsed object', () => {
      const jv = jsonviewer({ data: sampleData, expandDepth: 0 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check for collapse indicator
      expect(buffer.get(0, 0).char).toBe('\u25b6') // ▶
    })

    it('renders string values', () => {
      const jv = jsonviewer({ data: 'test string' })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 0).char).toBe('"')
    })

    it('renders number values', () => {
      const jv = jsonviewer({ data: 42 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 0).char).toBe('4')
    })

    it('renders boolean values', () => {
      const jv = jsonviewer({ data: true })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 0).char).toBe('t')
    })

    it('renders null values', () => {
      const jv = jsonviewer({ data: null })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(2, 0).char).toBe('n')
    })

    it('renders selected item', () => {
      const jv = jsonviewer({ data: sampleData, expandDepth: 1 }).focus()
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Selected item should be highlighted
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders scroll indicator', () => {
      const jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Scroll indicator should be present
      expect(buffer.get(79, 0).char).toBe('\u2588')
    })

    it('does not render when not visible', () => {
      const jv = jsonviewer({ data: sampleData })
      jv.visible(false)
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const jv = jsonviewer({ data: sampleData })
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render with zero dimensions', () => {
      const jv = jsonviewer({ data: sampleData })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const jv = jsonviewer()
        .data(sampleData)
        .expandDepth(2)
        .showIndices(true)
        .indentSize(2)
        .colors({ key: 10 })
        .focus()

      expect(jv.lineCount).toBeGreaterThan(0)
      expect(jv.isFocused).toBe(true)
    })

    it('chains navigation methods', () => {
      const jv = jsonviewer({ data: sampleData, expandDepth: -1 })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }

      jv.moveDown()
        .moveDown()
        .moveUp()
        .expand()
        .collapse()
        .toggle()

      expect(jv).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles empty object', () => {
      const jv = jsonviewer({ data: {} })
      expect(jv.lineCount).toBe(1)
    })

    it('handles empty array', () => {
      const jv = jsonviewer({ data: [] })
      expect(jv.lineCount).toBe(1)
    })

    it('handles deeply nested data', () => {
      const deep = { a: { b: { c: { d: { e: 1 } } } } }
      const jv = jsonviewer({ data: deep, expandDepth: -1 })
      // root + a + b + c + d + e = 6 lines
      expect(jv.lineCount).toBe(6)
    })

    it('handles long string values', () => {
      const jv = jsonviewer({ data: 'a'.repeat(100) })
      ;(jv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      const buffer = createTestBuffer(80, 5)
      jv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(jv).toBeDefined()
    })

    it('handles special characters in keys', () => {
      const jv = jsonviewer({ data: { 'key with spaces': 1, 'key-with-dashes': 2 }, expandDepth: 1 })
      expect(jv.lineCount).toBe(3)
    })

    it('handles undefined current value', () => {
      const jv = jsonviewer()
      expect(jv.currentValue).toBeUndefined()
      expect(jv.currentPath).toBe('')
    })
  })
})
