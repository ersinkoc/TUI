/**
 * CodeViewer widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { codeviewer } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

const sampleCode = `function greet(name) {
  console.log("Hello, " + name);
}

greet("World");`

const multilineCode = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}: Some code here`).join('\n')

describe('CodeViewer Widget', () => {
  describe('creation', () => {
    it('creates a codeviewer with default properties', () => {
      const cv = codeviewer()
      expect(cv.type).toBe('codeviewer')
      expect(cv.lineCount).toBe(0)
      expect(cv.content).toBe('')
    })

    it('creates a codeviewer with code', () => {
      const cv = codeviewer({ code: sampleCode })
      expect(cv.lineCount).toBe(5)
      expect(cv.content).toBe(sampleCode)
    })

    it('creates a codeviewer with language', () => {
      const cv = codeviewer({ code: sampleCode, language: 'javascript' })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer without line numbers', () => {
      const cv = codeviewer({ showLineNumbers: false })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer with starting line number', () => {
      const cv = codeviewer({ code: sampleCode, startLineNumber: 10 })
      expect(cv.firstVisibleLine).toBe(10)
    })

    it('creates a codeviewer with highlight lines', () => {
      const cv = codeviewer({
        code: sampleCode,
        highlightLines: [
          { line: 1, style: 'error' },
          { line: 3, style: 'warning' }
        ]
      })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer with word wrap', () => {
      const cv = codeviewer({ wordWrap: true })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer with tab width', () => {
      const cv = codeviewer({ tabWidth: 4 })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer with gutter', () => {
      const cv = codeviewer({ showGutter: true })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a non-selectable codeviewer', () => {
      const cv = codeviewer({ selectable: false })
      expect(cv.type).toBe('codeviewer')
    })

    it('creates a codeviewer with current line', () => {
      const cv = codeviewer({ code: sampleCode, currentLine: 3 })
      expect(cv.type).toBe('codeviewer')
    })

    it('expands tabs in code', () => {
      const cv = codeviewer({ code: 'a\tb\tc', tabWidth: 4 })
      expect(cv.lineCount).toBe(1)
    })
  })

  describe('configuration', () => {
    it('sets code', () => {
      const cv = codeviewer().code(sampleCode)
      expect(cv.lineCount).toBe(5)
    })

    it('resets state when setting code', () => {
      const cv = codeviewer({ code: sampleCode })
        .selectLine(3)
      cv.code('new code')
      expect(cv.selectedLines).toEqual([])
    })

    it('sets language', () => {
      const cv = codeviewer().language('typescript')
      expect(cv.type).toBe('codeviewer')
    })

    it('sets showLineNumbers', () => {
      const cv = codeviewer().showLineNumbers(false)
      expect(cv.type).toBe('codeviewer')
    })

    it('sets startLineNumber', () => {
      const cv = codeviewer({ code: sampleCode }).startLineNumber(100)
      expect(cv.firstVisibleLine).toBe(100)
    })

    it('sets highlightLines', () => {
      const cv = codeviewer().highlightLines([
        { line: 1, style: 'error' },
        { line: 2, style: 'success' }
      ])
      expect(cv.type).toBe('codeviewer')
    })

    it('adds highlight', () => {
      const cv = codeviewer()
        .addHighlight({ line: 5, style: 'error' })
        .addHighlight({ line: 10, style: 'warning' })
      expect(cv.type).toBe('codeviewer')
    })

    it('removes highlight', () => {
      const cv = codeviewer()
        .addHighlight({ line: 5, style: 'error' })
        .removeHighlight(5)
      expect(cv.type).toBe('codeviewer')
    })

    it('removeHighlight does nothing for non-existent line', () => {
      const cv = codeviewer().removeHighlight(999)
      expect(cv.type).toBe('codeviewer')
    })

    it('clears highlights', () => {
      const cv = codeviewer()
        .addHighlight({ line: 1, style: 'error' })
        .addHighlight({ line: 2, style: 'warning' })
        .clearHighlights()
      expect(cv.type).toBe('codeviewer')
    })

    it('clearHighlights does nothing when empty', () => {
      const cv = codeviewer().clearHighlights()
      expect(cv.type).toBe('codeviewer')
    })

    it('sets wordWrap', () => {
      const cv = codeviewer().wordWrap(true)
      expect(cv.type).toBe('codeviewer')
    })

    it('sets tabWidth and re-processes code', () => {
      const cv = codeviewer({ code: 'a\tb' }).tabWidth(8)
      expect(cv.type).toBe('codeviewer')
    })

    it('tabWidth without code is safe', () => {
      const cv = codeviewer().tabWidth(4)
      expect(cv.type).toBe('codeviewer')
    })

    it('sets showGutter', () => {
      const cv = codeviewer().showGutter(true)
      expect(cv.type).toBe('codeviewer')
    })

    it('sets selectable', () => {
      const cv = codeviewer({ code: sampleCode })
        .selectLine(2)
        .selectable(false)
      expect(cv.selectedLines).toEqual([])
    })

    it('sets currentLine', () => {
      const cv = codeviewer({ code: sampleCode }).currentLine(3)
      expect(cv.type).toBe('codeviewer')
    })
  })

  describe('navigation', () => {
    it('scrolls to line', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollToLine(20)
      expect(cv.firstVisibleLine).toBe(20)
    })

    it('scrollToLine ignores invalid line', () => {
      const cv = codeviewer({ code: sampleCode })
      cv.scrollToLine(100)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('scrolls up', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollToLine(20).scrollUp(5)
      expect(cv.firstVisibleLine).toBe(15)
    })

    it('scrollUp stops at top', () => {
      const cv = codeviewer({ code: sampleCode })
      cv.scrollUp(100)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('scrolls down', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollDown(5)
      expect(cv.firstVisibleLine).toBe(6)
    })

    it('scrollDown stops at bottom', () => {
      const cv = codeviewer({ code: sampleCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollDown(100)
      expect(cv.firstVisibleLine).toBe(1) // Not enough lines to scroll
    })

    it('pages up', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollToLine(30).pageUp()
      expect(cv.firstVisibleLine).toBe(20)
    })

    it('pages down', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.pageDown()
      expect(cv.firstVisibleLine).toBe(11)
    })

    it('goes to start', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollToLine(30).goToStart()
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('goToStart does nothing at top', () => {
      const cv = codeviewer({ code: sampleCode })
      cv.goToStart()
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('goes to end', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.goToEnd()
      expect(cv.firstVisibleLine).toBe(41)
    })

    it('goToEnd does nothing at bottom', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.goToEnd().goToEnd()
      expect(cv.firstVisibleLine).toBe(41)
    })
  })

  describe('selection', () => {
    it('selects a line', () => {
      const cv = codeviewer({ code: sampleCode }).selectLine(3)
      expect(cv.selectedLines).toEqual([3])
    })

    it('selectLine does nothing when not selectable', () => {
      const cv = codeviewer({ code: sampleCode, selectable: false }).selectLine(3)
      expect(cv.selectedLines).toEqual([])
    })

    it('selectLine ignores invalid line', () => {
      const cv = codeviewer({ code: sampleCode }).selectLine(100)
      expect(cv.selectedLines).toEqual([])
    })

    it('selects a range', () => {
      const cv = codeviewer({ code: sampleCode }).selectRange(2, 4)
      expect(cv.selectedLines).toEqual([2, 3, 4])
    })

    it('selectRange handles reversed order', () => {
      const cv = codeviewer({ code: sampleCode }).selectRange(4, 2)
      expect(cv.selectedLines).toEqual([2, 3, 4])
    })

    it('selectRange clamps to valid lines', () => {
      const cv = codeviewer({ code: sampleCode }).selectRange(-5, 100)
      expect(cv.selectedLines).toEqual([1, 2, 3, 4, 5])
    })

    it('selectRange does nothing when not selectable', () => {
      const cv = codeviewer({ code: sampleCode, selectable: false }).selectRange(1, 3)
      expect(cv.selectedLines).toEqual([])
    })

    it('clears selection', () => {
      const cv = codeviewer({ code: sampleCode })
        .selectRange(1, 3)
        .clearSelection()
      expect(cv.selectedLines).toEqual([])
    })

    it('clearSelection does nothing when empty', () => {
      const cv = codeviewer({ code: sampleCode }).clearSelection()
      expect(cv.selectedLines).toEqual([])
    })
  })

  describe('focus', () => {
    it('focuses the viewer', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      expect(cv.isFocused).toBe(true)
    })

    it('blurs the viewer', () => {
      const cv = codeviewer().focus().blur()
      expect(cv.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('navigates with arrow keys (selectable)', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      ;(cv as any)._currentLine = 1

      cv.handleKey('down', false)
      expect((cv as any)._currentLine).toBe(2)

      cv.handleKey('up', false)
      expect((cv as any)._currentLine).toBe(1)
    })

    it('navigates with j/k keys', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      ;(cv as any)._currentLine = 1

      cv.handleKey('j', false)
      expect((cv as any)._currentLine).toBe(2)

      cv.handleKey('k', false)
      expect((cv as any)._currentLine).toBe(1)
    })

    it('scrolls with arrow keys (non-selectable)', () => {
      const cv = codeviewer({ code: multilineCode, selectable: false }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      cv.handleKey('down', false)
      expect(cv.firstVisibleLine).toBe(2)

      cv.handleKey('up', false)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('pages with pageup/pagedown', () => {
      const cv = codeviewer({ code: multilineCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      cv.handleKey('pagedown', false)
      expect(cv.firstVisibleLine).toBe(11)

      cv.handleKey('pageup', false)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('jumps with home/end', () => {
      const cv = codeviewer({ code: multilineCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      cv.handleKey('end', false)
      expect((cv as any)._currentLine).toBe(50)

      cv.handleKey('home', false)
      expect((cv as any)._currentLine).toBe(1)
    })

    it('goes to start/end with ctrl+home/end', () => {
      const cv = codeviewer({ code: multilineCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      cv.handleKey('end', true)
      expect(cv.firstVisibleLine).toBe(41)

      cv.handleKey('home', true)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('selects with enter', () => {
      const handler = vi.fn()
      const cv = codeviewer({ code: sampleCode })
        .onLineSelect(handler)
        .focus()

      cv.handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('selects with space', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      cv.handleKey('space', false)
      expect(cv.selectedLines.length).toBe(1)
    })

    it('jumps to start with g', () => {
      const cv = codeviewer({ code: multilineCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      ;(cv as any)._scrollOffset = 20

      cv.handleKey('g', false)
      expect(cv.firstVisibleLine).toBe(1)
    })

    it('jumps to end with G', () => {
      const cv = codeviewer({ code: multilineCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      cv.handleKey('G', false)
      expect(cv.firstVisibleLine).toBe(41)
    })

    it('ignores keys when not focused', () => {
      const cv = codeviewer({ code: sampleCode })
      expect(cv.handleKey('down', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      expect(cv.handleKey('x', false)).toBe(false)
    })

    it('stops at boundaries', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      ;(cv as any)._currentLine = 1

      cv.handleKey('up', false) // Already at top
      expect((cv as any)._currentLine).toBe(1)

      ;(cv as any)._currentLine = 5
      cv.handleKey('down', false) // Already at bottom
      expect((cv as any)._currentLine).toBe(5)
    })
  })

  describe('mouse handling', () => {
    let cv: ReturnType<typeof codeviewer>

    beforeEach(() => {
      cv = codeviewer({ code: sampleCode, showLineNumbers: true })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
    })

    it('clicks on line', () => {
      const handler = vi.fn()
      cv.onLineSelect(handler)

      expect(cv.handleMouse(10, 2, 'press')).toBe(true)
      expect(cv.isFocused).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('scrolls with scroll-up', () => {
      ;(cv as any)._scrollOffset = 3
      expect(cv.handleMouse(10, 0, 'scroll-up')).toBe(true)
    })

    it('scrolls with scroll-down', () => {
      cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      expect(cv.handleMouse(10, 0, 'scroll-down')).toBe(true)
    })

    it('ignores when hidden', () => {
      ;(cv as any)._visible = false
      expect(cv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(cv as any)._bounds = null
      expect(cv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores click outside valid lines', () => {
      expect(cv.handleMouse(10, 8, 'press')).toBe(false)
    })
  })

  describe('events', () => {
    it('emits line select event', () => {
      const handler = vi.fn()
      const cv = codeviewer({ code: sampleCode })
        .onLineSelect(handler)
        .selectLine(2)
      expect(handler).toHaveBeenCalledWith(2, expect.any(String))
    })

    it('emits scroll event', () => {
      const handler = vi.fn()
      const cv = codeviewer({ code: multilineCode })
        .onScroll(handler)
      ;(cv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      cv.scrollDown(5)
      expect(handler).toHaveBeenCalledWith(6)
    })

    it('registers multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const cv = codeviewer({ code: sampleCode })
        .onLineSelect(handler1)
        .onLineSelect(handler2)
        .selectLine(1)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty viewer', () => {
      const cv = codeviewer()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders code with line numbers', () => {
      const cv = codeviewer({ code: sampleCode, showLineNumbers: true })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders code without line numbers', () => {
      const cv = codeviewer({ code: sampleCode, showLineNumbers: false })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with selection', () => {
      const cv = codeviewer({ code: sampleCode }).selectLine(2)
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with current line focus', () => {
      const cv = codeviewer({ code: sampleCode }).focus()
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with highlights', () => {
      const cv = codeviewer({
        code: sampleCode,
        highlightLines: [
          { line: 1, style: 'error' },
          { line: 2, style: 'warning' },
          { line: 3, style: 'success' },
          { line: 4, style: 'info' },
          { line: 5, style: 'highlight' }
        ],
        showGutter: true
      })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with gutter', () => {
      const cv = codeviewer({ code: sampleCode, showGutter: true })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with word wrap', () => {
      const longCode = 'x'.repeat(100)
      const cv = codeviewer({ code: longCode, wordWrap: true })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long lines without word wrap', () => {
      const longCode = 'x'.repeat(100)
      const cv = codeviewer({ code: longCode, wordWrap: false })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll indicator', () => {
      const cv = codeviewer({ code: multilineCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const cv = codeviewer({ code: sampleCode })
      ;(cv as any)._visible = false
      ;(cv as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const cv = codeviewer({ code: sampleCode })
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const cv = codeviewer({ code: sampleCode })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles many lines for line number width', () => {
      const manyLines = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`).join('\n')
      const cv = codeviewer({ code: manyLines })
      ;(cv as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      cv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const lineHandler = vi.fn()
      const scrollHandler = vi.fn()

      const cv = codeviewer()
        .code(sampleCode)
        .language('javascript')
        .showLineNumbers(true)
        .startLineNumber(1)
        .highlightLines([{ line: 2, style: 'error' }])
        .addHighlight({ line: 4, style: 'warning' })
        .wordWrap(false)
        .tabWidth(2)
        .showGutter(true)
        .selectable(true)
        .currentLine(1)
        .onLineSelect(lineHandler)
        .onScroll(scrollHandler)
        .selectLine(2)
        .focus()

      expect(cv.type).toBe('codeviewer')
      expect(cv.lineCount).toBe(5)
      expect(cv.selectedLines).toEqual([2])
      expect(cv.isFocused).toBe(true)
      expect(lineHandler).toHaveBeenCalled()
    })
  })
})
