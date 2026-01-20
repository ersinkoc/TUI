/**
 * DiffViewer widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { diffviewer, DiffHunk } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

const sampleUnifiedDiff = `diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,6 @@
 Line 1
-Line 2
+Line 2 modified
+Line 2.5 added
 Line 3
 Line 4
 Line 5
@@ -10,3 +11,4 @@
 Line 10
 Line 11
-Line 12
+Line 12 changed
+Line 13 new`

const sampleHunks: DiffHunk[] = [
  {
    oldStart: 1,
    oldCount: 5,
    newStart: 1,
    newCount: 6,
    lines: [
      { type: 'header', content: '@@ -1,5 +1,6 @@' },
      { type: 'context', content: 'Line 1', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'deletion', content: 'Line 2', oldLineNumber: 2 },
      { type: 'addition', content: 'Line 2 modified', newLineNumber: 2 },
      { type: 'addition', content: 'Line 2.5 added', newLineNumber: 3 },
      { type: 'context', content: 'Line 3', oldLineNumber: 3, newLineNumber: 4 }
    ]
  }
]

describe('DiffViewer Widget', () => {
  describe('creation', () => {
    it('creates a diffviewer with default properties', () => {
      const dv = diffviewer()
      expect(dv.type).toBe('diffviewer')
      expect(dv.hunkCount).toBe(0)
      expect(dv.lineCount).toBe(0)
    })

    it('creates a diffviewer with diff content', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.hunkCount).toBeGreaterThan(0)
      expect(dv.lineCount).toBeGreaterThan(0)
    })

    it('creates a diffviewer with mode', () => {
      const modes = ['unified', 'split', 'inline'] as const
      for (const m of modes) {
        const dv = diffviewer({ mode: m })
        expect(dv.type).toBe('diffviewer')
      }
    })

    it('creates a diffviewer without line numbers', () => {
      const dv = diffviewer({ showLineNumbers: false })
      expect(dv.type).toBe('diffviewer')
    })

    it('creates a diffviewer without markers', () => {
      const dv = diffviewer({ showMarkers: false })
      expect(dv.type).toBe('diffviewer')
    })

    it('creates a diffviewer with context lines', () => {
      const dv = diffviewer({ contextLines: 5 })
      expect(dv.type).toBe('diffviewer')
    })

    it('creates a diffviewer without inline highlight', () => {
      const dv = diffviewer({ highlightInline: false })
      expect(dv.type).toBe('diffviewer')
    })

    it('creates a diffviewer with word wrap', () => {
      const dv = diffviewer({ wordWrap: true })
      expect(dv.type).toBe('diffviewer')
    })

    it('creates a diffviewer with labels', () => {
      const dv = diffviewer({ oldLabel: 'original', newLabel: 'modified' })
      expect(dv.type).toBe('diffviewer')
    })
  })

  describe('configuration', () => {
    it('sets diff content', () => {
      const dv = diffviewer().diff(sampleUnifiedDiff)
      expect(dv.hunkCount).toBeGreaterThan(0)
    })

    it('sets hunks directly', () => {
      const dv = diffviewer().setHunks(sampleHunks)
      expect(dv.hunkCount).toBe(1)
    })

    it('sets mode', () => {
      const dv = diffviewer().mode('split')
      expect(dv.type).toBe('diffviewer')
    })

    it('sets showLineNumbers', () => {
      const dv = diffviewer().showLineNumbers(false)
      expect(dv.type).toBe('diffviewer')
    })

    it('sets showMarkers', () => {
      const dv = diffviewer().showMarkers(false)
      expect(dv.type).toBe('diffviewer')
    })

    it('sets contextLines', () => {
      const dv = diffviewer().contextLines(5)
      expect(dv.type).toBe('diffviewer')
    })

    it('sets highlightInline', () => {
      const dv = diffviewer().highlightInline(true)
      expect(dv.type).toBe('diffviewer')
    })

    it('sets wordWrap', () => {
      const dv = diffviewer().wordWrap(true)
      expect(dv.type).toBe('diffviewer')
    })

    it('sets labels', () => {
      const dv = diffviewer().labels('old.txt', 'new.txt')
      expect(dv.type).toBe('diffviewer')
    })
  })

  describe('statistics', () => {
    it('counts additions', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.additions).toBeGreaterThan(0)
    })

    it('counts deletions', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.deletions).toBeGreaterThan(0)
    })
  })

  describe('navigation', () => {
    it('scrolls to line', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.scrollToLine(5)
      expect(dv.type).toBe('diffviewer')
    })

    it('scrollToLine ignores invalid line', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.scrollToLine(1000)
      expect(dv.type).toBe('diffviewer')
    })

    it('scrolls up', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._scrollOffset = 5
      dv.scrollUp(2)
      expect((dv as any)._scrollOffset).toBe(3)
    })

    it('scrollUp stops at top', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.scrollUp(100)
      expect((dv as any)._scrollOffset).toBe(0)
    })

    it('scrolls down', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      dv.scrollDown(2)
      expect((dv as any)._scrollOffset).toBe(2)
    })

    it('scrollDown stops at bottom', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 50 }
      dv.scrollDown(1000)
      // Should be limited
      expect(dv.type).toBe('diffviewer')
    })

    it('navigates to next hunk', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.currentHunkIndex).toBe(0)
      dv.nextHunk()
      expect(dv.currentHunkIndex).toBe(1)
    })

    it('nextHunk stops at last', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      for (let i = 0; i < 10; i++) dv.nextHunk()
      expect(dv.currentHunkIndex).toBe(dv.hunkCount - 1)
    })

    it('navigates to previous hunk', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.nextHunk()
      dv.previousHunk()
      expect(dv.currentHunkIndex).toBe(0)
    })

    it('previousHunk stops at first', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.previousHunk()
      expect(dv.currentHunkIndex).toBe(0)
    })

    it('navigates to next change', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.nextChange()
      expect(dv.type).toBe('diffviewer')
    })

    it('navigates to previous change', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.nextChange()
      dv.nextChange()
      dv.previousChange()
      expect(dv.type).toBe('diffviewer')
    })
  })

  describe('focus', () => {
    it('focuses the viewer', () => {
      const dv = diffviewer().focus()
      expect(dv.isFocused).toBe(true)
    })

    it('blurs the viewer', () => {
      const dv = diffviewer().focus().blur()
      expect(dv.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('scrolls with up/down', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      dv.handleKey('down', false)
      expect((dv as any)._scrollOffset).toBe(1)

      dv.handleKey('up', false)
      expect((dv as any)._scrollOffset).toBe(0)
    })

    it('scrolls with j/k', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }

      dv.handleKey('j', false)
      expect((dv as any)._scrollOffset).toBe(1)

      dv.handleKey('k', false)
      expect((dv as any)._scrollOffset).toBe(0)
    })

    it('pages with pageup/pagedown', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      dv.handleKey('pagedown', false)
      expect((dv as any)._scrollOffset).toBeGreaterThan(0)

      dv.handleKey('pageup', false)
      expect((dv as any)._scrollOffset).toBe(0)
    })

    it('jumps to start/end with ctrl+home/end', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      dv.handleKey('end', true)
      dv.handleKey('home', true)
      expect((dv as any)._scrollOffset).toBe(0)
    })

    it('navigates changes with n/N', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()

      dv.handleKey('n', false)
      dv.handleKey('N', false)
      expect(dv.type).toBe('diffviewer')
    })

    it('navigates changes with p', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()

      dv.handleKey('n', false)
      dv.handleKey('p', false)
      expect(dv.type).toBe('diffviewer')
    })

    it('navigates hunks with [ and ]', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()

      dv.handleKey(']', false)
      expect(dv.currentHunkIndex).toBe(1)

      dv.handleKey('[', false)
      expect(dv.currentHunkIndex).toBe(0)
    })

    it('ignores keys when not focused', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.handleKey('j', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      expect(dv.handleKey('x', false)).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let dv: ReturnType<typeof diffviewer>

    beforeEach(() => {
      dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
    })

    it('clicks to focus and select line', () => {
      expect(dv.handleMouse(10, 3, 'press')).toBe(true)
      expect(dv.isFocused).toBe(true)
    })

    it('scrolls with scroll-up', () => {
      ;(dv as any)._scrollOffset = 5
      expect(dv.handleMouse(10, 0, 'scroll-up')).toBe(true)
    })

    it('scrolls with scroll-down', () => {
      expect(dv.handleMouse(10, 0, 'scroll-down')).toBe(true)
    })

    it('ignores when hidden', () => {
      ;(dv as any)._visible = false
      expect(dv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(dv as any)._bounds = null
      expect(dv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores invalid line click', () => {
      expect(dv.handleMouse(10, 100, 'press')).toBe(false)
    })
  })

  describe('events', () => {
    it('emits hunk select event', () => {
      const handler = vi.fn()
      const dv = diffviewer({ diff: sampleUnifiedDiff })
        .onHunkSelect(handler)

      dv.nextHunk()
      expect(handler).toHaveBeenCalled()
    })

    it('registers multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const dv = diffviewer({ diff: sampleUnifiedDiff })
        .onHunkSelect(handler1)
        .onHunkSelect(handler2)

      dv.nextHunk()
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
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

    it('renders empty viewer', () => {
      const dv = diffviewer()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders unified mode', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, mode: 'unified' })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders split mode', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, mode: 'split' })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 80, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders inline mode', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, mode: 'inline' })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with line numbers', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, showLineNumbers: true })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without line numbers', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, showLineNumbers: false })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with markers', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, showMarkers: true })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without markers', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff, showMarkers: false })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with focus highlight', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff }).focus()
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll indicator', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long lines', () => {
      const longDiff = `@@ -1,1 +1,1 @@
-${'x'.repeat(200)}
+${'y'.repeat(200)}`
      const dv = diffviewer({ diff: longDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._visible = false
      ;(dv as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      ;(dv as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      dv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('diff parsing', () => {
    it('parses hunk headers', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.hunkCount).toBeGreaterThanOrEqual(2)
    })

    it('parses additions', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.additions).toBeGreaterThan(0)
    })

    it('parses deletions', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.deletions).toBeGreaterThan(0)
    })

    it('parses context lines', () => {
      const dv = diffviewer({ diff: sampleUnifiedDiff })
      expect(dv.lineCount).toBeGreaterThan(dv.additions + dv.deletions)
    })

    it('handles no newline at end', () => {
      const diff = `@@ -1,1 +1,1 @@
-old
\\ No newline at end of file
+new
\\ No newline at end of file`
      const dv = diffviewer({ diff })
      expect(dv.lineCount).toBeGreaterThan(0)
    })

    it('handles single line changes', () => {
      const diff = `@@ -1 +1 @@
-old
+new`
      const dv = diffviewer({ diff })
      expect(dv.hunkCount).toBe(1)
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const handler = vi.fn()

      const dv = diffviewer()
        .diff(sampleUnifiedDiff)
        .mode('unified')
        .showLineNumbers(true)
        .showMarkers(true)
        .contextLines(3)
        .highlightInline(true)
        .wordWrap(false)
        .labels('old', 'new')
        .onHunkSelect(handler)
        .focus()

      expect(dv.type).toBe('diffviewer')
      expect(dv.hunkCount).toBeGreaterThan(0)
      expect(dv.isFocused).toBe(true)
    })
  })
})
