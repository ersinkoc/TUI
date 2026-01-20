/**
 * @oxog/tui - Spinner Widget Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { spinner, spinners } from '../../src/widgets/spinner'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Spinner Widget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('factory function', () => {
    it('should create a spinner node', () => {
      const s = spinner()
      expect(s.type).toBe('spinner')
    })

    it('should have a unique id', () => {
      const s1 = spinner()
      const s2 = spinner()
      expect(s1.id).not.toBe(s2.id)
    })

    it('should accept props', () => {
      const s = spinner({
        frames: ['-', '|'],
        interval: 100,
        label: 'Loading'
      })
      expect(s).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set frames', () => {
      const s = spinner().frames(['-', '\\', '|', '/'])
      expect(s).toBeDefined()
    })

    it('should set interval', () => {
      const s = spinner().interval(100)
      expect(s).toBeDefined()
    })

    it('should set label', () => {
      const s = spinner().label('Loading...')
      expect(s).toBeDefined()
    })

    it('should set color', () => {
      const s = spinner().color('#00ff00')
      expect(s).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const s = spinner().frames(['-', '|']).interval(100).label('Loading').color('#00ff00')

      expect(s).toBeDefined()
    })
  })

  describe('start/stop', () => {
    it('should not be spinning by default', () => {
      const s = spinner()
      expect(s.isSpinning).toBe(false)
    })

    it('should start spinning', () => {
      const s = spinner().start()
      expect(s.isSpinning).toBe(true)
      s.stop()
    })

    it('should stop spinning', () => {
      const s = spinner().start()
      s.stop()
      expect(s.isSpinning).toBe(false)
    })

    it('should not start twice', () => {
      const s = spinner().start()
      s.start() // Should be a no-op
      expect(s.isSpinning).toBe(true)
      s.stop()
    })

    it('should not stop if not spinning', () => {
      const s = spinner()
      s.stop() // Should be a no-op
      expect(s.isSpinning).toBe(false)
    })

    it('should animate through frames', () => {
      const s = spinner().frames(['a', 'b', 'c']).interval(100).start()

      // Initially at frame 0
      vi.advanceTimersByTime(100)
      // Now at frame 1

      vi.advanceTimersByTime(100)
      // Now at frame 2

      vi.advanceTimersByTime(100)
      // Should wrap back to frame 0

      s.stop()
    })

    it('should restart with new interval', () => {
      const s = spinner().interval(100).start()
      s.interval(200) // Should restart

      expect(s.isSpinning).toBe(true)
      s.stop()
    })
  })

  describe('preset spinners', () => {
    it('should have dots preset', () => {
      expect(spinners.dots.frames).toBeDefined()
      expect(spinners.dots.interval).toBeDefined()
    })

    it('should have line preset', () => {
      expect(spinners.line.frames).toEqual(['-', '\\', '|', '/'])
      expect(spinners.line.interval).toBe(100)
    })

    it('should have arc preset', () => {
      expect(spinners.arc.frames).toBeDefined()
      expect(spinners.arc.interval).toBeDefined()
    })

    it('should have circle preset', () => {
      expect(spinners.circle.frames).toBeDefined()
      expect(spinners.circle.interval).toBeDefined()
    })

    it('should have bounce preset', () => {
      expect(spinners.bounce.frames).toBeDefined()
      expect(spinners.bounce.interval).toBeDefined()
    })

    it('should have arrows preset', () => {
      expect(spinners.arrows.frames).toBeDefined()
      expect(spinners.arrows.interval).toBeDefined()
    })

    it('should be usable with spinner factory', () => {
      const s = spinner({
        frames: spinners.line.frames,
        interval: spinners.line.interval
      })
      expect(s).toBeDefined()
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const s = spinner()
      expect(s.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const s = spinner().visible(false)
      expect(s.isVisible).toBe(false)
    })
  })

  describe('rendering', () => {
    it('should render spinning state', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().frames(['-', '\\', '|', '/']).start()

      s._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render first frame
      expect(buffer.get(0, 0)?.char).toBe('-')
      s.stop()
    })

    it('should render with label', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().frames(['-']).label('Loading').start()

      s._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render "- Loading"
      expect(buffer.get(0, 0)?.char).toBe('-')
      expect(buffer.get(2, 0)?.char).toBe('L')
      s.stop()
    })

    it('should only render label when not spinning', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().label('Ready')

      s._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render just the label
      expect(buffer.get(0, 0)?.char).toBe('R')
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().label('Test').visible(false)

      const originalChar = buffer.get(0, 0)?.char
      s._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(originalChar)
    })

    it('should not render with zero dimensions', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().label('Test').start()

      s._bounds = { x: 0, y: 0, width: 0, height: 0 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
      s.stop()
    })

    it('should render with custom color', () => {
      const buffer = createBuffer(20, 1)
      const s = spinner().frames(['-']).color('#ff0000').start()

      s._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render with custom red color (0xff0000ff in packed format)
      // Note: JavaScript treats large numbers as signed, so we use >>> 0 for unsigned comparison
      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe('-')
      expect((cell?.fg ?? 0) >>> 0).toBe(0xff0000ff)
      s.stop()
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when frames change', () => {
      const s = spinner()
      s._dirty = false

      s.frames(['-', '|'])
      expect(s._dirty).toBe(true)
    })

    it('should mark dirty when label changes', () => {
      const s = spinner()
      s._dirty = false

      s.label('Test')
      expect(s._dirty).toBe(true)
    })

    it('should mark dirty when color changes', () => {
      const s = spinner()
      s._dirty = false

      s.color('#ff0000')
      expect(s._dirty).toBe(true)
    })

    it('should mark dirty on start', () => {
      const s = spinner()
      s._dirty = false

      s.start()
      expect(s._dirty).toBe(true)
      s.stop()
    })

    it('should mark dirty on stop', () => {
      const s = spinner().start()
      s._dirty = false

      s.stop()
      expect(s._dirty).toBe(true)
    })

    it('should mark dirty on frame advance', () => {
      const s = spinner().interval(100).start()
      s._dirty = false

      vi.advanceTimersByTime(100)

      expect(s._dirty).toBe(true)
      s.stop()
    })
  })
})
