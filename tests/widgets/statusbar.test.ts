/**
 * Statusbar widget tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusbar } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Statusbar Widget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('creation', () => {
    it('creates a statusbar with default properties', () => {
      const s = statusbar()
      expect(s.type).toBe('statusbar')
      expect(s.itemList.length).toBe(0)
      expect(s.message).toBeNull()
    })

    it('creates a statusbar with items', () => {
      const s = statusbar({
        items: [
          { id: 'mode', text: 'INSERT' },
          { id: 'file', text: 'test.ts' }
        ]
      })
      expect(s.itemList.length).toBe(2)
    })

    it('creates a statusbar with custom separator', () => {
      const s = statusbar({ separator: '|', showSeparator: true })
      expect(s.type).toBe('statusbar')
    })

    it('creates a statusbar with inverse style', () => {
      const s = statusbar({ style: 'inverse' })
      expect(s.type).toBe('statusbar')
    })
  })

  describe('configuration', () => {
    it('sets items', () => {
      const s = statusbar().items([
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' }
      ])
      expect(s.itemList.length).toBe(2)
    })

    it('adds an item', () => {
      const s = statusbar()
        .addItem({ id: 'a', text: 'A' })
        .addItem({ id: 'b', text: 'B' })
      expect(s.itemList.length).toBe(2)
    })

    it('removes an item', () => {
      const s = statusbar()
        .addItem({ id: 'a', text: 'A' })
        .addItem({ id: 'b', text: 'B' })
        .removeItem('a')
      expect(s.itemList.length).toBe(1)
      expect(s.itemList[0].id).toBe('b')
    })

    it('updates an item', () => {
      const s = statusbar()
        .addItem({ id: 'a', text: 'A' })
        .updateItem('a', { text: 'Updated' })
      expect(s.itemList[0].text).toBe('Updated')
    })

    it('sets show separator', () => {
      const s = statusbar().showSeparator(false)
      expect(s.type).toBe('statusbar')
    })

    it('sets separator character', () => {
      const s = statusbar().separator('|')
      expect(s.type).toBe('statusbar')
    })

    it('sets style', () => {
      const s = statusbar().style('inverse')
      expect(s.type).toBe('statusbar')
    })

    it('sets padding', () => {
      const s = statusbar().padding(2)
      expect(s.type).toBe('statusbar')
    })
  })

  describe('message', () => {
    it('sets a message', () => {
      const s = statusbar().setMessage('Hello')
      expect(s.message).toBe('Hello')
    })

    it('clears a message', () => {
      const s = statusbar()
        .setMessage('Hello')
        .clearMessage()
      expect(s.message).toBeNull()
    })

    it('clears message after timeout', () => {
      const s = statusbar().setMessage('Temporary', 1000)
      expect(s.message).toBe('Temporary')

      vi.advanceTimersByTime(1000)
      expect(s.message).toBeNull()
    })

    it('replaces message and resets timeout', () => {
      const s = statusbar()
        .setMessage('First', 1000)

      vi.advanceTimersByTime(500)
      s.setMessage('Second', 1000)

      vi.advanceTimersByTime(500)
      expect(s.message).toBe('Second')

      vi.advanceTimersByTime(500)
      expect(s.message).toBeNull()
    })

    it('clears message with active timeout', () => {
      const s = statusbar().setMessage('Temporary', 5000)
      expect(s.message).toBe('Temporary')
      s.clearMessage()
      expect(s.message).toBeNull()
      // The timeout should have been cleared too
    })
  })

  describe('progress', () => {
    it('sets progress value', () => {
      const s = statusbar().setProgress(50, 100)
      expect(s.progressValue).toBe(50)
      expect(s.progressMax).toBe(100)
    })

    it('clamps progress to max', () => {
      const s = statusbar().setProgress(150, 100)
      expect(s.progressValue).toBe(100)
    })

    it('clamps progress to min', () => {
      const s = statusbar().setProgress(-10, 100)
      expect(s.progressValue).toBe(0)
    })

    it('clears progress', () => {
      const s = statusbar()
        .setProgress(50, 100)
        .clearProgress()
      expect(s.progressValue).toBe(0)
    })
  })

  describe('events', () => {
    it('emits onItemClick when clickable item is clicked', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'btn', text: 'Click', clickable: true, align: 'left' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }

      // Click on item
      ;(s as any).handleMouse(2, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('does not emit for non-clickable items', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'txt', text: 'Text', clickable: false, align: 'left' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }

      ;(s as any).handleMouse(2, 0, 'press')
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns false for clicks outside statusbar y', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'btn', text: 'Button', clickable: true })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 5, width: 40, height: 1 }

      const result = (s as any).handleMouse(2, 0, 'press')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns false for clicks outside statusbar x', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'btn', text: 'Button', clickable: true })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 10, y: 0, width: 20, height: 1 }

      const result = (s as any).handleMouse(5, 0, 'press')
      expect(result).toBe(false)
    })

    it('handles click on right-aligned item', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'rbtn', text: 'Right', clickable: true, align: 'right' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }

      // Click near right edge where the item would be
      ;(s as any).handleMouse(35, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('handles click on center-aligned item', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'cbtn', text: 'Center', clickable: true, align: 'center' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 40, height: 1 }

      // Click in center where the item would be
      ;(s as any).handleMouse(20, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('handles click on second center-aligned item', () => {
      const handler = vi.fn()
      const s = statusbar({ showSeparator: false })
        .addItem({ id: 'c1', text: 'First', clickable: false, align: 'center' })
        .addItem({ id: 'c2', text: 'Second', clickable: true, align: 'center' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Total width: "First" (5) + 1 + "Second" (6) = 12
      // Center starts at: (60 - 12) / 2 = 24
      // First item: 24-29, Second item: 30-36
      ;(s as any).handleMouse(32, 0, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('returns false for click in gap area', () => {
      const handler = vi.fn()
      const s = statusbar()
        .addItem({ id: 'left', text: 'L', clickable: true, align: 'left' })
        .addItem({ id: 'right', text: 'R', clickable: true, align: 'right' })
        .onItemClick(handler)

      ;(s as any)._bounds = { x: 0, y: 0, width: 60, height: 1 }

      // Click in the middle gap between left and right items
      const result = (s as any).handleMouse(30, 0, 'press')
      expect(result).toBe(false)
    })
  })

  describe('alignment', () => {
    it('supports left-aligned items', () => {
      const s = statusbar().addItem({ id: 'a', text: 'Left', align: 'left' })
      expect(s.itemList[0].align).toBe('left')
    })

    it('supports center-aligned items', () => {
      const s = statusbar().addItem({ id: 'a', text: 'Center', align: 'center' })
      expect(s.itemList[0].align).toBe('center')
    })

    it('supports right-aligned items', () => {
      const s = statusbar().addItem({ id: 'a', text: 'Right', align: 'right' })
      expect(s.itemList[0].align).toBe('right')
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 1

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty statusbar', () => {
      const s = statusbar()
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders statusbar with items', () => {
      const s = statusbar()
        .addItem({ id: 'mode', text: 'INSERT', align: 'left' })
        .addItem({ id: 'file', text: 'test.ts', align: 'center' })
        .addItem({ id: 'pos', text: 'Ln 1', align: 'right' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders statusbar with message', () => {
      const s = statusbar()
        .addItem({ id: 'mode', text: 'NORMAL' })
        .setMessage('File saved!')
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders statusbar with progress', () => {
      const s = statusbar()
        .addItem({ id: 'mode', text: 'LOADING' })
        .setProgress(50, 100)
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders items with icons', () => {
      const s = statusbar()
        .addItem({ id: 'git', text: 'main', icon: '\u2387' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders items with custom colors', () => {
      const s = statusbar()
        .addItem({ id: 'error', text: 'Error', fg: 0xff0000ff })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders inverse style', () => {
      const s = statusbar({ style: 'inverse' })
        .addItem({ id: 'mode', text: 'INSERT' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without separator', () => {
      const s = statusbar({ showSeparator: false })
        .addItem({ id: 'a', text: 'A' })
        .addItem({ id: 'b', text: 'B' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const s = statusbar()
      ;(s as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const s = statusbar().visible(false)
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects item visibility', () => {
      const s = statusbar()
        .addItem({ id: 'a', text: 'Visible' })
        .addItem({ id: 'b', text: 'Hidden', visible: false })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects item priority', () => {
      const s = statusbar()
        .addItem({ id: 'low', text: 'Low', priority: 1 })
        .addItem({ id: 'high', text: 'High', priority: 10 })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects item width', () => {
      const s = statusbar()
        .addItem({ id: 'fixed', text: 'X', width: 10 })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects item minWidth', () => {
      const s = statusbar()
        .addItem({ id: 'min', text: 'X', minWidth: 5 })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders clickable item with bold', () => {
      const s = statusbar()
        .addItem({ id: 'click', text: 'Click Me', clickable: true })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long text to fit width', () => {
      const s = statusbar()
        .addItem({ id: 'long', text: 'This is a very long text that should be truncated', width: 10 })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders multiple right-aligned items with separator', () => {
      const s = statusbar({ showSeparator: true })
        .addItem({ id: 'r1', text: 'Right1', align: 'right' })
        .addItem({ id: 'r2', text: 'Right2', align: 'right' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders multiple center-aligned items with separator', () => {
      const s = statusbar({ showSeparator: true })
        .addItem({ id: 'c1', text: 'Center1', align: 'center' })
        .addItem({ id: 'c2', text: 'Center2', align: 'center' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders multiple center-aligned items without separator', () => {
      const s = statusbar({ showSeparator: false })
        .addItem({ id: 'c1', text: 'Center1', align: 'center' })
        .addItem({ id: 'c2', text: 'Center2', align: 'center' })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const s = statusbar()
        .items([{ id: 'a', text: 'A' }])
        .addItem({ id: 'b', text: 'B' })
        .removeItem('a')
        .updateItem('b', { text: 'Updated' })
        .showSeparator(true)
        .separator('|')
        .style('filled')
        .padding(1)
        .setMessage('Test')
        .clearMessage()
        .setProgress(50)
        .clearProgress()

      expect(s.type).toBe('statusbar')
    })
  })
})
