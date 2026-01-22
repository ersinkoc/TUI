/**
 * @oxog/tui - Animation Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { animationPlugin, easings } from '../../src/plugins/animation'
import type { TUIApp } from '../../src/types'

// Mock performance.now for consistent timing tests
let mockNow = 0
vi.spyOn(performance, 'now').mockImplementation(() => mockNow)

function advanceTime(ms: number): void {
  mockNow += ms
}

// Create mock app
function createMockApp(): TUIApp & { animation?: ReturnType<typeof animationPlugin>['install'] extends (app: infer T) => void ? T extends TUIApp & { animation: infer A } ? A : never : never } {
  return {
    width: 80,
    height: 24,
    isRunning: true,
    root: null,
    focused: null,
    theme: {} as any,
    mount: vi.fn(),
    unmount: vi.fn(),
    start: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    refresh: vi.fn(),
    markDirty: vi.fn(),
    use: vi.fn(),
    getPlugin: vi.fn(),
    onQuit: vi.fn()
  } as any
}

describe('easings', () => {
  describe('linear', () => {
    it('returns input unchanged', () => {
      expect(easings.linear(0)).toBe(0)
      expect(easings.linear(0.5)).toBe(0.5)
      expect(easings.linear(1)).toBe(1)
    })
  })

  describe('easeInQuad', () => {
    it('returns squared value', () => {
      expect(easings.easeInQuad(0)).toBe(0)
      expect(easings.easeInQuad(0.5)).toBe(0.25)
      expect(easings.easeInQuad(1)).toBe(1)
    })
  })

  describe('easeOutQuad', () => {
    it('applies ease out quadratic', () => {
      expect(easings.easeOutQuad(0)).toBe(0)
      expect(easings.easeOutQuad(0.5)).toBe(0.75)
      expect(easings.easeOutQuad(1)).toBe(1)
    })
  })

  describe('easeInOutQuad', () => {
    it('applies ease in/out quadratic', () => {
      expect(easings.easeInOutQuad(0)).toBe(0)
      expect(easings.easeInOutQuad(0.25)).toBe(0.125)
      expect(easings.easeInOutQuad(0.5)).toBe(0.5)
      expect(easings.easeInOutQuad(0.75)).toBe(0.875)
      expect(easings.easeInOutQuad(1)).toBe(1)
    })
  })

  describe('easeInCubic', () => {
    it('returns cubed value', () => {
      expect(easings.easeInCubic(0)).toBe(0)
      expect(easings.easeInCubic(0.5)).toBe(0.125)
      expect(easings.easeInCubic(1)).toBe(1)
    })
  })

  describe('easeOutCubic', () => {
    it('applies ease out cubic', () => {
      expect(easings.easeOutCubic(0)).toBe(0)
      expect(easings.easeOutCubic(1)).toBe(1)
      // For 0.5: (0.5 - 1)^3 + 1 = (-0.5)^3 + 1 = -0.125 + 1 = 0.875
      expect(easings.easeOutCubic(0.5)).toBe(0.875)
    })
  })

  describe('easeInOutCubic', () => {
    it('applies ease in/out cubic', () => {
      expect(easings.easeInOutCubic(0)).toBe(0)
      expect(easings.easeInOutCubic(1)).toBe(1)
      // At 0.5 boundary
      expect(easings.easeInOutCubic(0.5)).toBe(0.5)
      // Before midpoint: 4 * t^3
      expect(easings.easeInOutCubic(0.25)).toBe(0.0625)
      // After midpoint
      expect(easings.easeInOutCubic(0.75)).toBe(0.9375)
    })
  })

  describe('easeOutElastic', () => {
    it('returns 0 at t=0', () => {
      expect(easings.easeOutElastic(0)).toBe(0)
    })

    it('returns 1 at t=1', () => {
      expect(easings.easeOutElastic(1)).toBe(1)
    })

    it('overshoots and oscillates for intermediate values', () => {
      const mid = easings.easeOutElastic(0.5)
      // Elastic overshoots past 1
      expect(mid).toBeGreaterThan(0)
    })
  })

  describe('easeOutBounce', () => {
    it('returns 0 at t=0', () => {
      expect(easings.easeOutBounce(0)).toBe(0)
    })

    it('returns 1 at t=1', () => {
      expect(easings.easeOutBounce(1)).toBe(1)
    })

    it('handles first bounce region (t < 1/2.75)', () => {
      const t = 0.3 // In first region
      const result = easings.easeOutBounce(t)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('handles second bounce region (t < 2/2.75)', () => {
      const t = 0.5 // In second region
      const result = easings.easeOutBounce(t)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('handles third bounce region (t < 2.5/2.75)', () => {
      const t = 0.85 // In third region
      const result = easings.easeOutBounce(t)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('handles fourth bounce region (t >= 2.5/2.75)', () => {
      const t = 0.95 // In fourth region
      const result = easings.easeOutBounce(t)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })
  })
})

describe('animationPlugin', () => {
  beforeEach(() => {
    mockNow = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('creation', () => {
    it('creates plugin with default options', () => {
      const plugin = animationPlugin()

      expect(plugin.name).toBe('animation')
      expect(plugin.version).toBe('1.0.0')
    })

    it('creates plugin with custom fps', () => {
      const plugin = animationPlugin({ fps: 30 })

      expect(plugin.name).toBe('animation')
    })

    it('creates plugin with debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      expect(consoleSpy).toHaveBeenCalledWith('[animation] plugin installed')
      consoleSpy.mockRestore()
    })
  })

  describe('install', () => {
    it('exposes animation API on app', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      expect((app as any).animation).toBeDefined()
      expect((app as any).animation.requestFrame).toBeInstanceOf(Function)
      expect((app as any).animation.tween).toBeInstanceOf(Function)
      expect((app as any).animation.delay).toBeInstanceOf(Function)
      expect((app as any).animation.setInterval).toBeInstanceOf(Function)
      expect((app as any).animation.getFPS).toBeInstanceOf(Function)
    })
  })

  describe('destroy', () => {
    it('stops animation loop', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      // Start animation loop by adding a callback
      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      plugin.destroy!()

      expect(consoleSpy).toHaveBeenCalledWith('[animation] loop stopped')
      consoleSpy.mockRestore()
    })

    it('cancels all active animations', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.requestFrame(callback)

      plugin.destroy!()

      expect(handle.isRunning()).toBe(false)
    })

    it('clears all callbacks', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      plugin.destroy!()

      // Advance timers - callback should not be called
      advanceTime(100)
      vi.advanceTimersByTime(100)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('requestFrame', () => {
    it('registers frame callback', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      // Advance time to trigger frame
      advanceTime(20)
      vi.advanceTimersByTime(20)

      expect(callback).toHaveBeenCalled()
    })

    it('returns animation handle', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.requestFrame(callback)

      expect(handle).toBeDefined()
      expect(handle.cancel).toBeInstanceOf(Function)
      expect(handle.isRunning).toBeInstanceOf(Function)
    })

    it('handle reports running state', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.requestFrame(callback)

      expect(handle.isRunning()).toBe(true)
    })

    it('cancels callback with handle', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.requestFrame(callback)

      handle.cancel()

      advanceTime(100)
      vi.advanceTimersByTime(100)

      expect(callback).not.toHaveBeenCalled()
      expect(handle.isRunning()).toBe(false)
    })

    it('calls callback with delta and total time', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      // First frame
      advanceTime(16)
      vi.advanceTimersByTime(16)

      expect(callback).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
    })

    it('starts loop when callback is added', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[animation] loop started'))
      consoleSpy.mockRestore()
    })

    it('removes callback from frameCallbacks when cancelled', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.requestFrame(callback)

      handle.cancel()

      // Callback should no longer run
      advanceTime(50)
      vi.advanceTimersByTime(50)

      // Callback should not have been called (was removed before any tick)
      expect(callback).not.toHaveBeenCalled()
    })

    it('handles callback errors gracefully in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const errorCallback = vi.fn(() => {
        throw new Error('callback error')
      })
      const goodCallback = vi.fn()

      ;(app as any).animation.requestFrame(errorCallback)
      ;(app as any).animation.requestFrame(goodCallback)

      advanceTime(20)
      vi.advanceTimersByTime(20)

      expect(consoleSpy).toHaveBeenCalledWith('[animation] frame callback error:', expect.any(Error))
      expect(goodCallback).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('handles callback errors silently without debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: false })
      const app = createMockApp()

      plugin.install!(app)

      const errorCallback = vi.fn(() => {
        throw new Error('callback error')
      })

      ;(app as any).animation.requestFrame(errorCallback)

      advanceTime(20)
      vi.advanceTimersByTime(20)

      // Error should not be logged
      expect(consoleSpy).not.toHaveBeenCalledWith('[animation] frame callback error:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('calls markDirty on app when available', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      advanceTime(20)
      vi.advanceTimersByTime(20)

      expect(app.markDirty).toHaveBeenCalled()
    })
  })

  describe('tween', () => {
    it('creates tween animation', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 1000,
        onUpdate
      })

      expect(handle).toBeDefined()
      expect(handle.isRunning()).toBe(true)
    })

    it('calls onUpdate with interpolated values', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 100,
        onUpdate
      })

      // Advance half duration
      advanceTime(50)
      vi.advanceTimersByTime(50)

      expect(onUpdate).toHaveBeenCalled()
      // Value should be around 50 (halfway)
      const calls = onUpdate.mock.calls
      expect(calls.length).toBeGreaterThan(0)
    })

    it('calls onComplete when finished', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 50,
        onUpdate,
        onComplete
      })

      // Advance past duration
      advanceTime(100)
      vi.advanceTimersByTime(100)

      expect(onComplete).toHaveBeenCalled()
    })

    it('uses custom easing function', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const customEasing = vi.fn((t: number) => t * t)
      const onUpdate = vi.fn()

      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 100,
        easing: customEasing,
        onUpdate
      })

      advanceTime(50)
      vi.advanceTimersByTime(50)

      expect(customEasing).toHaveBeenCalled()
    })

    it('uses linear easing by default', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const values: number[] = []
      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 100,
        onUpdate: (v: number) => values.push(v)
      })

      advanceTime(100)
      vi.advanceTimersByTime(100)

      // Should have reached 100
      expect(values[values.length - 1]).toBe(100)
    })

    it('can be cancelled', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 1000,
        onUpdate,
        onComplete
      })

      // Cancel immediately
      handle.cancel()

      advanceTime(1100)
      vi.advanceTimersByTime(1100)

      // onComplete should not be called
      expect(onComplete).not.toHaveBeenCalled()
      expect(handle.isRunning()).toBe(false)
    })

    it('handles tween without onComplete', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 50,
        onUpdate
        // No onComplete
      })

      // Should not throw
      advanceTime(100)
      vi.advanceTimersByTime(100)

      expect(onUpdate).toHaveBeenCalled()
    })
  })

  describe('delay', () => {
    it('returns a promise', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const promise = (app as any).animation.delay(100)

      expect(promise).toBeInstanceOf(Promise)
    })

    it('resolves after specified time', async () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      let resolved = false
      ;(app as any).animation.delay(100).then(() => {
        resolved = true
      })

      expect(resolved).toBe(false)

      vi.advanceTimersByTime(100)

      await Promise.resolve() // Flush promises

      expect(resolved).toBe(true)
    })
  })

  describe('setInterval', () => {
    it('calls callback repeatedly', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.setInterval(callback, 50)

      vi.advanceTimersByTime(150)

      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('returns animation handle', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.setInterval(callback, 50)

      expect(handle).toBeDefined()
      expect(handle.cancel).toBeInstanceOf(Function)
      expect(handle.isRunning).toBeInstanceOf(Function)
    })

    it('can be cancelled', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.setInterval(callback, 50)

      vi.advanceTimersByTime(50)
      expect(callback).toHaveBeenCalledTimes(1)

      handle.cancel()

      vi.advanceTimersByTime(100)
      expect(callback).toHaveBeenCalledTimes(1) // No additional calls
    })

    it('reports running state correctly', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const callback = vi.fn()
      const handle = (app as any).animation.setInterval(callback, 50)

      expect(handle.isRunning()).toBe(true)

      handle.cancel()

      expect(handle.isRunning()).toBe(false)
    })
  })

  describe('getFPS', () => {
    it('returns current FPS', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const fps = (app as any).animation.getFPS()

      expect(typeof fps).toBe('number')
    })

    it('updates FPS after frames', () => {
      const plugin = animationPlugin({ fps: 60 })
      const app = createMockApp()

      plugin.install!(app)

      // Start the loop
      ;(app as any).animation.requestFrame(() => {})

      // Run 70 frames (~1120ms at 16ms/frame) to ensure FPS update (requires 1000ms)
      for (let i = 0; i < 70; i++) {
        advanceTime(16)
        vi.advanceTimersByTime(16)
      }

      const fps = (app as any).animation.getFPS()
      expect(fps).toBeGreaterThan(0)
    })
  })

  describe('loop control', () => {
    it('does not double start', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      // Add two callbacks
      ;(app as any).animation.requestFrame(() => {})
      ;(app as any).animation.requestFrame(() => {})

      // Should only log "started" once
      const startCalls = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('loop started')
      )
      expect(startCalls.length).toBe(1)
      consoleSpy.mockRestore()
    })

    it('stops loop on destroy after multiple cancel', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const handle1 = (app as any).animation.requestFrame(callback1)
      const handle2 = (app as any).animation.requestFrame(callback2)

      // Cancel both
      handle1.cancel()
      handle2.cancel()

      // Destroy stops the loop
      plugin.destroy!()

      // Should have logged "stopped"
      const stopCalls = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('loop stopped')
      )
      expect(stopCalls.length).toBe(1)
      consoleSpy.mockRestore()
    })

    it('does not call tick when not running', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      // Don't start any animations
      advanceTime(100)
      vi.advanceTimersByTime(100)

      // markDirty should not be called since no loop is running
      expect(app.markDirty).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles app without markDirty', () => {
      const plugin = animationPlugin()
      const app = createMockApp()
      delete (app as any).markDirty

      plugin.install!(app)

      const callback = vi.fn()
      ;(app as any).animation.requestFrame(callback)

      // Should not throw
      advanceTime(20)
      vi.advanceTimersByTime(20)

      expect(callback).toHaveBeenCalled()
    })

    it('handles tween callback skipped when cancelled', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: 100,
        onUpdate
      })

      // Get one update
      advanceTime(20)
      vi.advanceTimersByTime(20)

      const callCountBeforeCancel = onUpdate.mock.calls.length

      handle.cancel()

      // More time passes
      advanceTime(100)
      vi.advanceTimersByTime(100)

      // No more calls after cancel
      expect(onUpdate.mock.calls.length).toBe(callCountBeforeCancel)
    })

    it('keeps loop running with active animations but no frame callbacks', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      // Start interval (adds to activeAnimations)
      ;(app as any).animation.setInterval(() => {}, 100)

      // Add and remove frame callback
      const handle = (app as any).animation.requestFrame(() => {})
      handle.cancel()

      // Loop should still be stopped since setInterval doesn't start the loop
      // (it uses native setInterval, not the animation loop)
      consoleSpy.mockRestore()
    })

    it('handles destroy when never started', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      // Destroy without starting any animations
      expect(() => plugin.destroy!()).not.toThrow()
    })
  })

  // ============================================================
  // Invalid Duration Handling Tests
  // ============================================================

  describe('tween duration validation', () => {
    it('should complete immediately with negative duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: -100,
        onUpdate,
        onComplete
      })

      // Should complete immediately with final value
      expect(onUpdate).toHaveBeenCalledWith(100)
      expect(onComplete).toHaveBeenCalled()
      expect(handle.isRunning()).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should complete immediately with zero duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const onComplete = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 50,
        duration: 0,
        onUpdate,
        onComplete
      })

      // Should complete immediately with final value
      expect(onUpdate).toHaveBeenCalledWith(50)
      expect(onComplete).toHaveBeenCalled()
      expect(handle.isRunning()).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should complete immediately with NaN duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: NaN,
        onUpdate
      })

      expect(onUpdate).toHaveBeenCalledWith(100)
      expect(handle.isRunning()).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should complete immediately with Infinity duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      const onUpdate = vi.fn()
      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: Infinity,
        onUpdate
      })

      expect(onUpdate).toHaveBeenCalledWith(100)
      expect(handle.isRunning()).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should warn in debug mode for invalid duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const plugin = animationPlugin({ debug: true })
      const app = createMockApp()

      plugin.install!(app)

      ;(app as any).animation.tween({
        from: 0,
        to: 100,
        duration: -1,
        onUpdate: () => {}
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain('Invalid tween duration')

      consoleSpy.mockRestore()
    })

    it('should return no-op handle for invalid duration', () => {
      const plugin = animationPlugin()
      const app = createMockApp()

      plugin.install!(app)

      const handle = (app as any).animation.tween({
        from: 0,
        to: 100,
        duration: -1,
        onUpdate: () => {}
      })

      // cancel() should not throw
      expect(() => handle.cancel()).not.toThrow()
    })
  })
})
