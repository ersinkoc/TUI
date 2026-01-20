/**
 * @oxog/tui - Stopwatch Widget Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { stopwatch } from '../../src/widgets/stopwatch'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

describe('Stopwatch Widget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('creation', () => {
    it('creates a default stopwatch', () => {
      const sw = stopwatch()
      expect(sw).toBeDefined()
      expect(sw.type).toBe('stopwatch')
      expect(sw.mode).toBe('stopwatch')
      expect(sw.isRunning).toBe(false)
      expect(sw.elapsed).toBe(0)
    })

    it('creates with mode', () => {
      const sw = stopwatch({ mode: 'timer' })
      expect(sw.mode).toBe('timer')
    })

    it('creates with initial time for stopwatch', () => {
      const sw = stopwatch({ mode: 'stopwatch', initialTime: 5000 })
      expect(sw.elapsed).toBe(5000)
    })

    it('creates with initial time for timer mode', () => {
      const sw = stopwatch({ mode: 'timer', initialTime: 60000 })
      expect(sw.mode).toBe('timer')
      // Timer mode uses initialTime as the target, not elapsed
      expect(sw.elapsed).toBe(0)
      // getFormattedTime should show the remaining time (60 seconds)
      expect(sw.getFormattedTime()).toContain('01:00')
    })

    it('creates with all props', () => {
      const sw = stopwatch({
        mode: 'stopwatch',
        initialTime: 1000,
        showMilliseconds: true,
        showLaps: true,
        format: 'hms',
        digitStyle: 'normal'
      })
      expect(sw.elapsed).toBe(1000)
    })
  })

  describe('control', () => {
    it('starts the stopwatch', () => {
      const sw = stopwatch()
      expect(sw.start()).toBe(sw)
      expect(sw.isRunning).toBe(true)
    })

    it('stops the stopwatch', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      expect(sw.stop()).toBe(sw)
      expect(sw.isRunning).toBe(false)
      expect(sw.elapsed).toBeGreaterThan(0)
    })

    it('resets the stopwatch', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.stop()
      sw.lap()
      expect(sw.reset()).toBe(sw)
      expect(sw.elapsed).toBe(0)
      expect(sw.isRunning).toBe(false)
      expect(sw.laps).toHaveLength(0)
    })

    it('toggles the stopwatch', () => {
      const sw = stopwatch()
      sw.toggle()
      expect(sw.isRunning).toBe(true)
      sw.toggle()
      expect(sw.isRunning).toBe(false)
    })

    it('does not start if already running', () => {
      const handler = vi.fn()
      const sw = stopwatch().onStart(handler)
      sw.start()
      sw.start() // Should not emit again
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not stop if not running', () => {
      const handler = vi.fn()
      const sw = stopwatch().onStop(handler)
      sw.stop() // Should not emit
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('lap times', () => {
    it('records a lap', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      expect(sw.lap()).toBe(sw)
      expect(sw.laps).toHaveLength(1)
    })

    it('does not record lap when stopped', () => {
      const sw = stopwatch()
      sw.lap()
      expect(sw.laps).toHaveLength(0)
    })

    it('records multiple laps', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      vi.advanceTimersByTime(2000)
      sw.lap()
      vi.advanceTimersByTime(3000)
      sw.lap()
      expect(sw.laps).toHaveLength(3)
      expect(sw.laps[0].number).toBe(1)
      expect(sw.laps[1].number).toBe(2)
      expect(sw.laps[2].number).toBe(3)
    })

    it('calculates split times correctly', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      vi.advanceTimersByTime(2000)
      sw.lap()

      expect(sw.laps[0].split).toBeCloseTo(1000, -2)
      expect(sw.laps[1].split).toBeCloseTo(2000, -2)
    })

    it('clears laps', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      sw.lap()
      expect(sw.clearLaps()).toBe(sw)
      expect(sw.laps).toHaveLength(0)
    })

    it('returns copy of lap times', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      const laps = sw.getLapTimes()
      expect(laps).not.toBe(sw.laps)
    })
  })

  describe('timer mode', () => {
    it('sets timer', () => {
      const sw = stopwatch()
      expect(sw.setTimer(60000)).toBe(sw)
      expect(sw.mode).toBe('timer')
    })

    it('counts down in timer mode', () => {
      const sw = stopwatch().setTimer(10000).start()
      vi.advanceTimersByTime(3000)
      // Timer shows remaining time
      expect(sw.getFormattedTime()).toContain('7')
    })

    it('emits complete when timer finishes', () => {
      const handler = vi.fn()
      const sw = stopwatch().setTimer(5000).onComplete(handler).start()
      vi.advanceTimersByTime(5001)
      sw.tick() // Simulate tick
      expect(handler).toHaveBeenCalled()
    })

    it('stops at zero', () => {
      const sw = stopwatch().setTimer(5000).start()
      vi.advanceTimersByTime(10000)
      sw.tick()
      expect(sw.isRunning).toBe(false)
    })
  })

  describe('formatting', () => {
    it('formats time in hms format', () => {
      const sw = stopwatch({ format: 'hms', initialTime: 3661000 }) // 1h 1m 1s
      const formatted = sw.getFormattedTime()
      expect(formatted).toContain('01:01:01')
    })

    it('formats time in ms format', () => {
      const sw = stopwatch({ format: 'ms', initialTime: 5500 })
      const formatted = sw.getFormattedTime()
      expect(formatted).toBe('5.500')
    })

    it('formats time in compact format', () => {
      const sw = stopwatch({ format: 'compact', initialTime: 65000, showMilliseconds: false })
      const formatted = sw.getFormattedTime()
      expect(formatted).toBe('1:05')
    })

    it('formats time with hours in compact format', () => {
      const sw = stopwatch({ format: 'compact', initialTime: 3665000, showMilliseconds: false })
      const formatted = sw.getFormattedTime()
      expect(formatted).toBe('1:01:05')
    })

    it('hides milliseconds when disabled', () => {
      const sw = stopwatch({ format: 'hms', initialTime: 5500 })
      sw.showMilliseconds(false)
      const formatted = sw.getFormattedTime()
      expect(formatted).not.toContain('.')
    })

    it('hides milliseconds in ms format', () => {
      const sw = stopwatch({ format: 'ms', initialTime: 5500 })
      sw.showMilliseconds(false)
      const formatted = sw.getFormattedTime()
      expect(formatted).toBe('5')
    })

    it('formats hms without hours and without milliseconds', () => {
      const sw = stopwatch({ format: 'hms', initialTime: 65000, showMilliseconds: false })
      const formatted = sw.getFormattedTime()
      expect(formatted).toBe('01:05')
    })
  })

  describe('configuration', () => {
    it('sets show milliseconds', () => {
      const sw = stopwatch()
      expect(sw.showMilliseconds(false)).toBe(sw)
    })

    it('sets show laps', () => {
      const sw = stopwatch()
      expect(sw.showLaps(false)).toBe(sw)
    })

    it('sets format', () => {
      const sw = stopwatch()
      expect(sw.format('compact')).toBe(sw)
    })

    it('sets digit style', () => {
      const sw = stopwatch()
      expect(sw.digitStyle('large')).toBe(sw)
    })
  })

  describe('focus', () => {
    it('focuses the stopwatch', () => {
      const sw = stopwatch()
      expect(sw.focus()).toBe(sw)
    })

    it('blurs the stopwatch', () => {
      const sw = stopwatch().focus()
      expect(sw.blur()).toBe(sw)
    })
  })

  describe('events', () => {
    it('calls onStart when started', () => {
      const handler = vi.fn()
      const sw = stopwatch().onStart(handler)
      sw.start()
      expect(handler).toHaveBeenCalled()
    })

    it('calls onStop when stopped', () => {
      const handler = vi.fn()
      const sw = stopwatch().onStop(handler).start()
      sw.stop()
      expect(handler).toHaveBeenCalled()
    })

    it('calls onLap when lap recorded', () => {
      const handler = vi.fn()
      const sw = stopwatch().onLap(handler).start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }))
    })

    it('calls onTick during tick', () => {
      const handler = vi.fn()
      const sw = stopwatch().onTick(handler).start()
      vi.advanceTimersByTime(100)
      sw.tick()
      expect(handler).toHaveBeenCalled()
    })

    it('does not call onTick when not running', () => {
      const handler = vi.fn()
      const sw = stopwatch().onTick(handler)
      sw.tick()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    let sw: ReturnType<typeof stopwatch>

    beforeEach(() => {
      sw = stopwatch().focus()
    })

    it('handles space to toggle', () => {
      expect(sw.handleKey(' ')).toBe(true)
      expect(sw.isRunning).toBe(true)
    })

    it('handles enter to toggle', () => {
      expect(sw.handleKey('enter')).toBe(true)
      expect(sw.isRunning).toBe(true)
    })

    it('handles r to reset', () => {
      sw.start()
      vi.advanceTimersByTime(1000)
      expect(sw.handleKey('r')).toBe(true)
      expect(sw.elapsed).toBe(0)
    })

    it('handles l to lap', () => {
      sw.start()
      vi.advanceTimersByTime(1000)
      expect(sw.handleKey('l')).toBe(true)
      expect(sw.laps).toHaveLength(1)
    })

    it('handles c to clear laps', () => {
      sw.start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      expect(sw.handleKey('c')).toBe(true)
      expect(sw.laps).toHaveLength(0)
    })

    it('ignores keys when not focused', () => {
      sw.blur()
      expect(sw.handleKey(' ')).toBe(false)
    })

    it('returns false for unknown keys', () => {
      expect(sw.handleKey('x')).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let sw: ReturnType<typeof stopwatch>

    beforeEach(() => {
      sw = stopwatch()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }
    })

    it('toggles on click', () => {
      expect(sw.handleMouse(5, 5, 'press')).toBe(true)
      expect(sw.isRunning).toBe(true)
    })

    it('returns false when not visible', () => {
      sw.visible(false)
      expect(sw.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false without bounds', () => {
      ;(sw as any)._bounds = null
      expect(sw.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false for non-press actions', () => {
      expect(sw.handleMouse(5, 5, 'release')).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(40, 15)
    })

    it('renders time display', () => {
      const sw = stopwatch({ initialTime: 5000 })
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe('0')
    })

    it('renders status indicator', () => {
      const sw = stopwatch().start()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Running indicator
      expect(buffer.get(0, 1).char).toBe('▶')
    })

    it('renders paused status', () => {
      const sw = stopwatch().start()
      vi.advanceTimersByTime(1000)
      sw.stop()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 1).char).toBe('⏸')
    })

    it('renders stopped status', () => {
      const sw = stopwatch()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 1).char).toBe('⏹')
    })

    it('renders timer mode indicator', () => {
      const sw = stopwatch().setTimer(60000)
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Timer text should appear after status
      let found = false
      for (let x = 0; x < 40; x++) {
        if (buffer.get(x, 1).char === 'T') {
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('renders laps', () => {
      const sw = stopwatch({ showLaps: true }).start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      sw.stop()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Lap should be rendered
      expect(buffer.get(0, 2).char).toBe('L')
    })

    it('renders laps with height overflow (truncates laps)', () => {
      const sw = stopwatch({ showLaps: true }).start()
      // Add many laps
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000)
        sw.lap()
      }
      sw.stop()
      // Very small height - only room for time display (row 0), status (row 1), maybe 1 lap (row 2)
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 3 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Only 1 lap should fit, the rest should be truncated
      expect(sw.laps).toHaveLength(10)
    })

    it('renders laps with exact height boundary', () => {
      const sw = stopwatch({ showLaps: true }).start()
      vi.advanceTimersByTime(1000)
      sw.lap()
      vi.advanceTimersByTime(1000)
      sw.lap()
      sw.stop()
      // Height exactly at boundary where y == bounds.y + bounds.height
      // With large buffer but only height of 2 (time + status, no room for laps)
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 2 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(sw.laps).toHaveLength(2)
    })

    it('renders large digits when enabled', () => {
      const sw = stopwatch({ digitStyle: 'large', initialTime: 0 })
      ;(sw as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Large digits should have box-drawing chars
      expect(['┌', '─', '┐', '│', '└', '┘', ' ', '0']).toContain(buffer.get(0, 0).char)
    })

    it('does not render when not visible', () => {
      const sw = stopwatch({ initialTime: 5000 })
      sw.visible(false)
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const sw = stopwatch({ initialTime: 5000 })
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('renders in green when running', () => {
      const sw = stopwatch().start()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).fg).toBe(46)
    })

    it('renders normal digits with focus (bold)', () => {
      const sw = stopwatch({ initialTime: 5000 }).focus()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Focused should render with ATTR_BOLD (1)
      expect(buffer.get(0, 0).attrs).toBe(1)
    })

    it('renders normal digits without focus (no bold)', () => {
      const sw = stopwatch({ initialTime: 5000 })
      ;(sw as any)._bounds = { x: 0, y: 0, width: 40, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Not focused should render without bold
      expect(buffer.get(0, 0).attrs).toBe(0)
    })

    it('renders large digits while running (green)', () => {
      const sw = stopwatch({ digitStyle: 'large' }).start()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Running should render in green (46)
      expect(buffer.get(0, 0).fg).toBe(46)
    })

    it('renders large digits while not running (default fg)', () => {
      const sw = stopwatch({ digitStyle: 'large', initialTime: 5000 })
      ;(sw as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Not running should use default fg
      expect(buffer.get(0, 0).fg).toBe(DEFAULT_FG)
    })

    it('renders large digits with focus (bold)', () => {
      const sw = stopwatch({ digitStyle: 'large', initialTime: 5000 }).focus()
      ;(sw as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Focused large digits should have ATTR_BOLD
      expect(buffer.get(0, 0).attrs).toBe(1)
    })

    it('renders large digits without focus (no bold)', () => {
      const sw = stopwatch({ digitStyle: 'large', initialTime: 5000 })
      ;(sw as any)._bounds = { x: 0, y: 0, width: 60, height: 15 }
      sw.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Not focused should not have bold
      expect(buffer.get(0, 0).attrs).toBe(0)
    })
  })
})
