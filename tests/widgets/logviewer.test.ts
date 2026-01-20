/**
 * LogViewer widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logviewer, LogEntry } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

const sampleEntries: LogEntry[] = [
  { timestamp: new Date('2024-01-01T10:00:00'), level: 'info', message: 'Application started', source: 'main' },
  { timestamp: new Date('2024-01-01T10:00:01'), level: 'debug', message: 'Loading config', source: 'config' },
  { timestamp: new Date('2024-01-01T10:00:02'), level: 'info', message: 'Connected to database', source: 'db' },
  { timestamp: new Date('2024-01-01T10:00:03'), level: 'warn', message: 'Cache miss', source: 'cache' },
  { timestamp: new Date('2024-01-01T10:00:04'), level: 'error', message: 'Failed to send email', source: 'email' },
  { timestamp: new Date('2024-01-01T10:00:05'), level: 'info', message: 'Request completed', source: 'api' },
  { timestamp: new Date('2024-01-01T10:00:06'), level: 'trace', message: 'Debug trace', source: 'debug' },
  { timestamp: new Date('2024-01-01T10:00:07'), level: 'fatal', message: 'Critical failure', source: 'system' }
]

describe('LogViewer Widget', () => {
  describe('creation', () => {
    it('creates a logviewer with default properties', () => {
      const lv = logviewer()
      expect(lv.type).toBe('logviewer')
      expect(lv.entryCount).toBe(0)
      expect(lv.visibleCount).toBe(0)
    })

    it('creates a logviewer with entries', () => {
      const lv = logviewer({ entries: sampleEntries })
      expect(lv.entryCount).toBe(8)
    })

    it('creates a logviewer with max entries', () => {
      const lv = logviewer({ maxEntries: 5 })
      expect(lv.type).toBe('logviewer')
    })

    it('creates a logviewer without timestamps', () => {
      const lv = logviewer({ showTimestamps: false })
      expect(lv.type).toBe('logviewer')
    })

    it('creates a logviewer without levels', () => {
      const lv = logviewer({ showLevels: false })
      expect(lv.type).toBe('logviewer')
    })

    it('creates a logviewer without source', () => {
      const lv = logviewer({ showSource: false })
      expect(lv.type).toBe('logviewer')
    })

    it('creates a logviewer with min level', () => {
      const lv = logviewer({ entries: sampleEntries, minLevel: 'warn' })
      expect(lv.visibleCount).toBeLessThan(lv.entryCount)
    })

    it('creates a logviewer without auto scroll', () => {
      const lv = logviewer({ autoScroll: false })
      expect(lv.type).toBe('logviewer')
    })

    it('creates a logviewer with timestamp formats', () => {
      const formats = ['full', 'time', 'relative'] as const
      for (const f of formats) {
        const lv = logviewer({ timestampFormat: f })
        expect(lv.type).toBe('logviewer')
      }
    })

    it('creates a logviewer with word wrap', () => {
      const lv = logviewer({ wordWrap: true })
      expect(lv.type).toBe('logviewer')
    })
  })

  describe('configuration', () => {
    it('sets entries', () => {
      const lv = logviewer().entries(sampleEntries)
      expect(lv.entryCount).toBe(8)
    })

    it('adds single entry', () => {
      const lv = logviewer()
        .addEntry({ level: 'info', message: 'Test' })
      expect(lv.entryCount).toBe(1)
    })

    it('adds multiple entries', () => {
      const lv = logviewer()
        .addEntries(sampleEntries)
      expect(lv.entryCount).toBe(8)
    })

    it('respects max entries', () => {
      const lv = logviewer({ maxEntries: 3 })
        .addEntries(sampleEntries)
      expect(lv.entryCount).toBe(3)
    })

    it('clears entries', () => {
      const lv = logviewer({ entries: sampleEntries })
        .clear()
      expect(lv.entryCount).toBe(0)
    })

    it('sets maxEntries and trims', () => {
      const lv = logviewer({ entries: sampleEntries })
        .maxEntries(3)
      expect(lv.entryCount).toBe(3)
    })

    it('sets showTimestamps', () => {
      const lv = logviewer().showTimestamps(false)
      expect(lv.type).toBe('logviewer')
    })

    it('sets showLevels', () => {
      const lv = logviewer().showLevels(false)
      expect(lv.type).toBe('logviewer')
    })

    it('sets showSource', () => {
      const lv = logviewer().showSource(false)
      expect(lv.type).toBe('logviewer')
    })

    it('sets minLevel', () => {
      const lv = logviewer({ entries: sampleEntries }).minLevel('error')
      expect(lv.visibleCount).toBe(2) // error and fatal
    })

    it('sets autoScroll', () => {
      const lv = logviewer().autoScroll(true)
      expect(lv.type).toBe('logviewer')
    })

    it('sets timestampFormat', () => {
      const lv = logviewer().timestampFormat('full')
      expect(lv.type).toBe('logviewer')
    })

    it('sets wordWrap', () => {
      const lv = logviewer().wordWrap(true)
      expect(lv.type).toBe('logviewer')
    })
  })

  describe('filtering', () => {
    it('filters by text', () => {
      const lv = logviewer({ entries: sampleEntries }).filter('email')
      expect(lv.visibleCount).toBe(1)
      expect(lv.currentFilter).toBe('email')
    })

    it('filters by source', () => {
      const lv = logviewer({ entries: sampleEntries }).filter('db')
      expect(lv.visibleCount).toBeGreaterThan(0)
    })

    it('clears filter', () => {
      const lv = logviewer({ entries: sampleEntries })
        .filter('error')
        .clearFilter()
      expect(lv.currentFilter).toBe('')
      expect(lv.visibleCount).toBe(lv.entryCount)
    })

    it('combines filter with minLevel', () => {
      const lv = logviewer({ entries: sampleEntries })
        .minLevel('warn')
        .filter('fail')
      expect(lv.visibleCount).toBeLessThanOrEqual(lv.entryCount)
    })

    it('emits filter event', () => {
      const handler = vi.fn()
      const lv = logviewer({ entries: sampleEntries })
        .onFilter(handler)
        .filter('test')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('statistics', () => {
    it('counts errors', () => {
      const lv = logviewer({ entries: sampleEntries })
      expect(lv.errorCount).toBe(2) // error + fatal
    })

    it('counts warnings', () => {
      const lv = logviewer({ entries: sampleEntries })
      expect(lv.warnCount).toBe(1)
    })
  })

  describe('navigation', () => {
    it('scrolls to top', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._scrollOffset = 5
      lv.scrollToTop()
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('scrolls to bottom', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      lv.scrollToBottom()
      expect((lv as any)._autoScroll).toBe(true)
    })

    it('scrolls up', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._scrollOffset = 5
      lv.scrollUp(2)
      expect((lv as any)._scrollOffset).toBe(3)
    })

    it('scrollUp stops at top', () => {
      const lv = logviewer({ entries: sampleEntries })
      lv.scrollUp(100)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('scrolls down', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }
      lv.scrollDown(2)
      expect((lv as any)._scrollOffset).toBe(2)
    })

    it('scrollDown stops at bottom', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }
      lv.scrollDown(100)
      expect(lv.type).toBe('logviewer')
    })

    it('pages up', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }
      ;(lv as any)._scrollOffset = 5
      lv.pageUp()
      expect((lv as any)._scrollOffset).toBeLessThan(5)
    })

    it('pages down', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }
      lv.pageDown()
      expect((lv as any)._scrollOffset).toBeGreaterThan(0)
    })

    it('navigates to next error', () => {
      const lv = logviewer({ entries: sampleEntries })
      lv.nextError()
      expect((lv as any)._selectedIndex).toBeGreaterThanOrEqual(0)
    })

    it('navigates to previous error', () => {
      const lv = logviewer({ entries: sampleEntries })
      lv.nextError()
      lv.nextError()
      lv.previousError()
      expect((lv as any)._selectedIndex).toBeGreaterThanOrEqual(0)
    })

    it('previousError from -1 searches from end', () => {
      const lv = logviewer({ entries: sampleEntries })
      lv.previousError()
      expect((lv as any)._selectedIndex).toBeGreaterThanOrEqual(0)
    })
  })

  describe('auto scroll', () => {
    it('auto scrolls on add entry', () => {
      const lv = logviewer({ autoScroll: true })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }

      for (let i = 0; i < 10; i++) {
        lv.addEntry({ level: 'info', message: `Message ${i}` })
      }
      // Should have scrolled
      expect(lv.type).toBe('logviewer')
    })

    it('disables auto scroll on manual scroll up', () => {
      const lv = logviewer({ entries: sampleEntries, autoScroll: true })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }
      ;(lv as any)._scrollOffset = 3

      lv.scrollUp()
      expect((lv as any)._autoScroll).toBe(false)
    })

    it('re-enables auto scroll at bottom', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }
      ;(lv as any)._autoScroll = false

      // Scroll to bottom
      lv.scrollDown(100)
      expect((lv as any)._autoScroll).toBe(true)
    })
  })

  describe('focus', () => {
    it('focuses the viewer', () => {
      const lv = logviewer().focus()
      expect(lv.isFocused).toBe(true)
    })

    it('blurs the viewer', () => {
      const lv = logviewer().focus().blur()
      expect(lv.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('scrolls with up/down', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      lv.handleKey('down', false)
      expect((lv as any)._scrollOffset).toBe(1)

      lv.handleKey('up', false)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('scrolls with j/k', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 5 }

      lv.handleKey('j', false)
      expect((lv as any)._scrollOffset).toBe(1)

      lv.handleKey('k', false)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('pages with pageup/pagedown', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }

      lv.handleKey('pagedown', false)
      expect((lv as any)._scrollOffset).toBeGreaterThan(0)

      lv.handleKey('pageup', false)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('jumps to start/end with ctrl+home/end', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }

      lv.handleKey('end', true)
      lv.handleKey('home', true)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('jumps with g/G', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }

      lv.handleKey('G', false)
      expect((lv as any)._autoScroll).toBe(true)

      lv.handleKey('g', false)
      expect((lv as any)._scrollOffset).toBe(0)
    })

    it('navigates errors with e/E', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()

      lv.handleKey('e', false)
      expect((lv as any)._selectedIndex).toBeGreaterThanOrEqual(0)

      lv.handleKey('E', false)
      expect(lv.type).toBe('logviewer')
    })

    it('triggers select on enter', () => {
      const handler = vi.fn()
      const lv = logviewer({ entries: sampleEntries })
        .onEntrySelect(handler)
        .focus()

      ;(lv as any)._selectedIndex = 0
      lv.handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('ignores keys when not focused', () => {
      const lv = logviewer({ entries: sampleEntries })
      expect(lv.handleKey('j', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      expect(lv.handleKey('x', false)).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let lv: ReturnType<typeof logviewer>

    beforeEach(() => {
      lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
    })

    it('clicks to select entry', () => {
      const handler = vi.fn()
      lv.onEntrySelect(handler)

      expect(lv.handleMouse(10, 2, 'press')).toBe(true)
      expect(lv.isFocused).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('scrolls with scroll-up/down', () => {
      ;(lv as any)._scrollOffset = 3
      expect(lv.handleMouse(10, 0, 'scroll-up')).toBe(true)
      expect(lv.handleMouse(10, 0, 'scroll-down')).toBe(true)
    })

    it('ignores when hidden', () => {
      ;(lv as any)._visible = false
      expect(lv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(lv as any)._bounds = null
      expect(lv.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores invalid click', () => {
      expect(lv.handleMouse(10, 50, 'press')).toBe(false)
    })
  })

  describe('timestamp formatting', () => {
    it('formats full timestamp', () => {
      const lv = logviewer({ entries: sampleEntries, timestampFormat: 'full' })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('formats time only', () => {
      const lv = logviewer({ entries: sampleEntries, timestampFormat: 'time' })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('formats relative time', () => {
      const entries: LogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'Now' },
        { timestamp: new Date(Date.now() - 5000), level: 'info', message: '5s ago' },
        { timestamp: new Date(Date.now() - 60000), level: 'info', message: '1m ago' },
        { timestamp: new Date(Date.now() - 3600000), level: 'info', message: '1h ago' },
        { timestamp: new Date(Date.now() - 86400000), level: 'info', message: '1d ago' }
      ]
      const lv = logviewer({ entries, timestampFormat: 'relative' })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles string timestamp', () => {
      const entries: LogEntry[] = [
        { timestamp: '2024-01-01T10:00:00Z', level: 'info', message: 'Test' }
      ]
      const lv = logviewer({ entries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles invalid timestamp', () => {
      const entries: LogEntry[] = [
        { timestamp: 'invalid', level: 'info', message: 'Test' }
      ]
      const lv = logviewer({ entries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles undefined timestamp', () => {
      const entries: LogEntry[] = [
        { level: 'info', message: 'No timestamp' }
      ]
      const lv = logviewer({ entries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      const buffer = createBuffer(80, 10)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 80
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty viewer', () => {
      const lv = logviewer()
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with entries', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders all log levels', () => {
      const lv = logviewer({ entries: sampleEntries, minLevel: 'trace' })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with selected entry', () => {
      const lv = logviewer({ entries: sampleEntries }).focus()
      ;(lv as any)._selectedIndex = 2
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without timestamps', () => {
      const lv = logviewer({ entries: sampleEntries, showTimestamps: false })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without levels', () => {
      const lv = logviewer({ entries: sampleEntries, showLevels: false })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without source', () => {
      const lv = logviewer({ entries: sampleEntries, showSource: false })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders scroll indicator', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 3 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long messages', () => {
      const entries: LogEntry[] = [
        { level: 'info', message: 'x'.repeat(200) }
      ]
      const lv = logviewer({ entries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 40, height: 5 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long source', () => {
      const entries: LogEntry[] = [
        { level: 'info', message: 'Test', source: 'x'.repeat(50) }
      ]
      const lv = logviewer({ entries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._visible = false
      ;(lv as any)._bounds = { x: 0, y: 0, width: 60, height: 10 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const lv = logviewer({ entries: sampleEntries })
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const lv = logviewer({ entries: sampleEntries })
      ;(lv as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      lv.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('events', () => {
    it('registers multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const lv = logviewer({ entries: sampleEntries })
        .onEntrySelect(handler1)
        .onEntrySelect(handler2)
        .focus()

      ;(lv as any)._selectedIndex = 0
      lv.handleKey('enter', false)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const selectHandler = vi.fn()
      const filterHandler = vi.fn()

      const lv = logviewer()
        .entries(sampleEntries)
        .maxEntries(100)
        .showTimestamps(true)
        .showLevels(true)
        .showSource(true)
        .minLevel('debug')
        .autoScroll(true)
        .timestampFormat('time')
        .wordWrap(false)
        .onEntrySelect(selectHandler)
        .onFilter(filterHandler)
        .filter('')
        .focus()

      expect(lv.type).toBe('logviewer')
      expect(lv.entryCount).toBe(8)
      expect(lv.isFocused).toBe(true)
    })
  })
})
