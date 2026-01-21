/**
 * @oxog/tui - Easing Utilities Tests
 * Comprehensive tests for easing functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  // Linear
  linear,
  // Quad
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  // Cubic
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  // Quart
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  // Quint
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  // Sine
  easeInSine,
  easeOutSine,
  easeInOutSine,
  // Expo
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  // Circ
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  // Back
  easeInBack,
  easeOutBack,
  easeInOutBack,
  // Elastic
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  // Bounce
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
  // Spring
  createSpring,
  spring,
  // Utilities
  getEasing,
  easingFunctions,
  interpolate,
  tween
} from '../../src/utils/easing'
import type { EasingFunction } from '../../src/utils/easing'

describe('Easing Functions', () => {
  describe('Linear', () => {
    it('should return input value', () => {
      expect(linear(0)).toBe(0)
      expect(linear(0.5)).toBe(0.5)
      expect(linear(1)).toBe(1)
      expect(linear(0.25)).toBe(0.25)
    })
  })

  describe('Quadratic', () => {
    it('easeInQuad should accelerate from zero', () => {
      expect(easeInQuad(0)).toBe(0)
      expect(easeInQuad(0.5)).toBe(0.25)
      expect(easeInQuad(1)).toBe(1)
    })

    it('easeOutQuad should decelerate to zero', () => {
      expect(easeOutQuad(0)).toBe(0)
      expect(easeOutQuad(0.5)).toBe(0.75)
      expect(easeOutQuad(1)).toBe(1)
    })

    it('easeInOutQuad should accelerate then decelerate', () => {
      expect(easeInOutQuad(0)).toBe(0)
      expect(easeInOutQuad(0.25)).toBeCloseTo(0.125)
      expect(easeInOutQuad(0.5)).toBe(0.5)
      expect(easeInOutQuad(0.75)).toBeCloseTo(0.875)
      expect(easeInOutQuad(1)).toBe(1)
    })
  })

  describe('Cubic', () => {
    it('easeInCubic should accelerate from zero', () => {
      expect(easeInCubic(0)).toBe(0)
      expect(easeInCubic(0.5)).toBe(0.125)
      expect(easeInCubic(1)).toBe(1)
    })

    it('easeOutCubic should decelerate to zero', () => {
      expect(easeOutCubic(0)).toBe(0)
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
      expect(easeOutCubic(1)).toBe(1)
    })

    it('easeInOutCubic should accelerate then decelerate', () => {
      expect(easeInOutCubic(0)).toBe(0)
      expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625)
      expect(easeInOutCubic(0.5)).toBe(0.5)
      expect(easeInOutCubic(1)).toBe(1)
    })
  })

  describe('Quartic', () => {
    it('easeInQuart should accelerate from zero', () => {
      expect(easeInQuart(0)).toBe(0)
      expect(easeInQuart(0.5)).toBe(0.0625)
      expect(easeInQuart(1)).toBe(1)
    })

    it('easeOutQuart should decelerate to zero', () => {
      expect(easeOutQuart(0)).toBe(0)
      expect(easeOutQuart(0.5)).toBeCloseTo(0.9375)
      expect(easeOutQuart(1)).toBe(1)
    })

    it('easeInOutQuart should accelerate then decelerate', () => {
      expect(easeInOutQuart(0)).toBe(0)
      expect(easeInOutQuart(0.25)).toBeCloseTo(0.03125, 4)
      expect(easeInOutQuart(0.5)).toBe(0.5)
      expect(easeInOutQuart(1)).toBe(1)
    })
  })

  describe('Quintic', () => {
    it('easeInQuint should accelerate from zero', () => {
      expect(easeInQuint(0)).toBe(0)
      expect(easeInQuint(0.5)).toBe(0.03125)
      expect(easeInQuint(1)).toBe(1)
    })

    it('easeOutQuint should decelerate to zero', () => {
      expect(easeOutQuint(0)).toBe(0)
      expect(easeOutQuint(0.5)).toBeCloseTo(0.96875)
      expect(easeOutQuint(1)).toBe(1)
    })

    it('easeInOutQuint should accelerate then decelerate', () => {
      expect(easeInOutQuint(0)).toBe(0)
      expect(easeInOutQuint(0.5)).toBe(0.5)
      expect(easeInOutQuint(1)).toBe(1)
    })
  })

  describe('Sinusoidal', () => {
    it('easeInSine should accelerate from zero', () => {
      expect(easeInSine(0)).toBeCloseTo(0, 10)
      expect(easeInSine(0.5)).toBeCloseTo(0.2929, 3)
      expect(easeInSine(1)).toBeCloseTo(1, 10)
    })

    it('easeOutSine should decelerate to zero', () => {
      expect(easeOutSine(0)).toBe(0)
      expect(easeOutSine(0.5)).toBeCloseTo(0.7071, 3)
      expect(easeOutSine(1)).toBe(1)
    })

    it('easeInOutSine should accelerate then decelerate', () => {
      expect(easeInOutSine(0)).toBeCloseTo(0, 10)
      expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10)
      expect(easeInOutSine(1)).toBe(1)
    })
  })

  describe('Exponential', () => {
    it('easeInExpo should accelerate from zero', () => {
      expect(easeInExpo(0)).toBe(0)
      expect(easeInExpo(0.5)).toBeCloseTo(0.031, 2)
      expect(easeInExpo(1)).toBe(1)
    })

    it('easeOutExpo should decelerate to zero', () => {
      expect(easeOutExpo(0)).toBe(0)
      expect(easeOutExpo(0.5)).toBeCloseTo(0.969, 2)
      expect(easeOutExpo(1)).toBe(1)
    })

    it('easeInOutExpo should accelerate then decelerate', () => {
      expect(easeInOutExpo(0)).toBe(0)
      expect(easeInOutExpo(0.5)).toBe(0.5)
      expect(easeInOutExpo(1)).toBe(1)
    })

    it('easeInOutExpo should handle edge cases at 0 and 1', () => {
      // Test exact 0 and 1 values which have special handling
      expect(easeInOutExpo(0)).toBe(0)
      expect(easeInOutExpo(1)).toBe(1)
    })
  })

  describe('Circular', () => {
    it('easeInCirc should accelerate from zero', () => {
      expect(easeInCirc(0)).toBe(0)
      expect(easeInCirc(0.5)).toBeCloseTo(0.1339, 3)
      expect(easeInCirc(1)).toBe(1)
    })

    it('easeOutCirc should decelerate to zero', () => {
      expect(easeOutCirc(0)).toBe(0)
      expect(easeOutCirc(0.5)).toBeCloseTo(0.866, 2)
      expect(easeOutCirc(1)).toBe(1)
    })

    it('easeInOutCirc should accelerate then decelerate', () => {
      expect(easeInOutCirc(0)).toBe(0)
      expect(easeInOutCirc(0.25)).toBeCloseTo(0.067, 2)
      expect(easeInOutCirc(0.5)).toBe(0.5)
      expect(easeInOutCirc(1)).toBe(1)
    })
  })

  describe('Back (overshoot)', () => {
    it('easeInBack should accelerate with overshoot', () => {
      expect(easeInBack(0)).toBeCloseTo(0, 10)
      // easeInBack goes negative at small values due to overshoot
      // But eventually reaches 1 at t=1
      expect(easeInBack(1)).toBeCloseTo(1, 10)
    })

    it('easeOutBack should decelerate with overshoot', () => {
      expect(easeOutBack(0)).toBeCloseTo(0, 10)
      expect(easeOutBack(1)).toBe(1)
      // Should overshoot 1 before settling
      const t = 0.9
      expect(easeOutBack(t)).toBeGreaterThan(1)
    })

    it('easeInOutBack should have overshoot on both sides', () => {
      expect(easeInOutBack(0)).toBeCloseTo(0, 10)
      expect(easeInOutBack(0.5)).toBe(0.5)
      expect(easeInOutBack(1)).toBe(1)
    })
  })

  describe('Elastic', () => {
    it('easeInElastic should handle edge cases', () => {
      expect(easeInElastic(0)).toBe(0)
      expect(easeInElastic(1)).toBe(1)
    })

    it('easeOutElastic should handle edge cases', () => {
      expect(easeOutElastic(0)).toBe(0)
      expect(easeOutElastic(1)).toBe(1)
    })

    it('easeInOutElastic should handle edge cases', () => {
      expect(easeInOutElastic(0)).toBe(0)
      expect(easeInOutElastic(0.5)).toBe(0.5)
      expect(easeInOutElastic(1)).toBe(1)
    })

    it('elastic functions should oscillate', () => {
      // Test that elastic functions produce values that oscillate
      const values: number[] = []
      for (let i = 0; i <= 10; i++) {
        values.push(easeOutElastic(i / 10))
      }
      // Just verify the function produces valid output (can exceed 1 during oscillation)
      expect(values.every(v => v >= -0.5 && v <= 1.5)).toBe(true)
      // Verify we actually get different values
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBeGreaterThan(1)
    })
  })

  describe('Bounce', () => {
    it('easeInBounce should bounce at start', () => {
      expect(easeInBounce(0)).toBe(0)
      expect(easeInBounce(1)).toBe(1)
    })

    it('easeOutBounce should bounce at end', () => {
      expect(easeOutBounce(0)).toBe(0)
      expect(easeOutBounce(1)).toBe(1)
      // Should have a bounce effect
      const at90 = easeOutBounce(0.9)
      const at95 = easeOutBounce(0.95)
      const at100 = easeOutBounce(1)
      // Near 1, the function might bounce above 1 briefly
      expect(at100).toBe(1)
    })

    it('easeInOutBounce should bounce on both sides', () => {
      expect(easeInOutBounce(0)).toBe(0)
      expect(easeInOutBounce(0.5)).toBe(0.5)
      expect(easeInOutBounce(1)).toBe(1)
    })

    it('easeOutBounce should handle all ranges', () => {
      // Test the different bounce ranges
      expect(easeOutBounce(0.2)).toBeGreaterThan(0)
      expect(easeOutBounce(0.5)).toBeGreaterThan(0.5)
      expect(easeOutBounce(0.8)).toBeLessThan(1)
    })
  })

  describe('Spring', () => {
    it('createSpring should return an easing function', () => {
      const springFn = createSpring()
      expect(typeof springFn).toBe('function')
      expect(springFn(0)).toBe(0)
      expect(springFn(1)).toBeCloseTo(1, 0)
    })

    it('default spring should work', () => {
      expect(spring(0)).toBe(0)
      expect(spring(1)).toBeGreaterThan(0.9)
      expect(spring(1)).toBeLessThanOrEqual(1.1)
    })

    it('createSpring with custom stiffness', () => {
      const stiffSpring = createSpring(200, 10)
      expect(stiffSpring(1)).toBeGreaterThan(0.9)

      const softSpring = createSpring(50, 10)
      expect(softSpring(0.5)).toBeGreaterThan(0)
    })

    it('createSpring with custom damping', () => {
      const highlyDamped = createSpring(100, 20)
      expect(highlyDamped(1)).toBeCloseTo(1, 1)

      const lightlyDamped = createSpring(100, 2)
      expect(lightlyDamped(1)).toBeGreaterThan(0)
      // Should overshoot with low damping
      expect(lightlyDamped(1.5)).toBeGreaterThan(0.9)
    })

    it('spring should be monotonic for high damping', () => {
      const highlyDamped = createSpring(100, 20)
      const v1 = highlyDamped(0.2)
      const v2 = highlyDamped(0.4)
      const v3 = highlyDamped(0.6)
      expect(v2).toBeGreaterThan(v1)
      expect(v3).toBeGreaterThan(v2)
    })
  })

  describe('Easing Map', () => {
    it('easingFunctions should contain all easing functions', () => {
      expect(easingFunctions.linear).toBe(linear)
      expect(easingFunctions.easeInQuad).toBe(easeInQuad)
      expect(easingFunctions.easeOutQuad).toBe(easeOutQuad)
      expect(easingFunctions.spring).toBe(spring)
    })

    it('getEasing should return correct function', () => {
      expect(getEasing('linear')).toBe(linear)
      expect(getEasing('easeInQuad')).toBe(easeInQuad)
      expect(getEasing('spring')).toBe(spring)
    })

    it('getEasing should support all easing names', () => {
      const easingNames: Array<keyof typeof easingFunctions> = [
        'linear',
        'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
        'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
        'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
        'easeInSine', 'easeOutSine', 'easeInOutSine',
        'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
        'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
        'easeInBack', 'easeOutBack', 'easeInOutBack',
        'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
        'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
        'spring'
      ]

      for (const name of easingNames) {
        const fn = getEasing(name)
        expect(typeof fn).toBe('function')
        expect(fn(0)).toBeCloseTo(0, 10)
        expect(fn(1)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('interpolate', () => {
    it('should interpolate between values', () => {
      expect(interpolate(0, 100, 0.5)).toBe(50)
      expect(interpolate(0, 100, 0)).toBe(0)
      expect(interpolate(0, 100, 1)).toBe(100)
    })

    it('should use easing function', () => {
      expect(interpolate(0, 100, 0.5, linear)).toBe(50)
      expect(interpolate(0, 100, 0.5, 'easeInQuad')).toBe(25)
    })

    it('should clamp progress to 0-1', () => {
      expect(interpolate(0, 100, -0.5)).toBe(0)
      expect(interpolate(0, 100, 1.5)).toBe(100)
    })

    it('should handle negative ranges', () => {
      expect(interpolate(100, 0, 0.5)).toBe(50)
      expect(interpolate(-50, 50, 0.5)).toBe(0)
    })

    it('should handle decimal ranges', () => {
      expect(interpolate(0.5, 1.5, 0.5)).toBe(1.0)
    })

    it('should accept easing function directly', () => {
      const customEasing: EasingFunction = (t) => t * 2
      const result = interpolate(0, 100, 0.25, customEasing)
      expect(result).toBe(50)
    })
  })

  describe('tween', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should animate from start to end', () => {
      const updates: number[] = []
      const stop = tween(0, 100, 100, linear, (value) => {
        updates.push(value)
      })

      // Fast forward through animation
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(16)
      }

      expect(updates.length).toBeGreaterThan(0)
      expect(updates[updates.length - 1]).toBe(100)
      stop()
    })

    it('should call onComplete when finished', () => {
      const onComplete = vi.fn()
      const stop = tween(0, 100, 100, linear, () => {}, onComplete)

      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(16)
      }

      expect(onComplete).toHaveBeenCalled()
      stop()
    })

    it('should stop when stop function is called', () => {
      const updates: number[] = []
      const stop = tween(0, 100, 1000, linear, (value) => {
        updates.push(value)
      })

      vi.advanceTimersByTime(50)
      stop()
      const beforeStop = updates.length

      vi.advanceTimersByTime(100)
      expect(updates.length).toBe(beforeStop)
    })

    it('should work with custom easing', () => {
      const updates: number[] = []
      const stop = tween(0, 100, 100, 'easeOutQuad', (value) => {
        updates.push(value)
      })

      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(16)
      }

      expect(updates.length).toBeGreaterThan(0)
      stop()
    })

    it('should handle very short durations', () => {
      const updates: number[] = []
      const stop = tween(0, 100, 1, linear, (value) => {
        updates.push(value)
      })

      vi.advanceTimersByTime(50)

      expect(updates.length).toBeGreaterThan(0)
      stop()
    })

    it('should handle zero duration', () => {
      const updates: number[] = []
      const onComplete = vi.fn()
      const stop = tween(0, 100, 0, linear, (value) => {
        updates.push(value)
      }, onComplete)

      vi.advanceTimersByTime(50)

      // Should complete immediately or very quickly
      expect(updates.length).toBeGreaterThanOrEqual(1)
      // onComplete should be called
      expect(onComplete).toHaveBeenCalled()
      stop()
    })

    it('should not call onComplete if stopped early', () => {
      const onComplete = vi.fn()
      const stop = tween(0, 100, 1000, linear, () => {}, onComplete)

      vi.advanceTimersByTime(50)
      stop()
      vi.advanceTimersByTime(2000)

      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('all easing functions should handle t=0', () => {
      const easingFns = [
        linear, easeInQuad, easeOutQuad, easeInOutQuad,
        easeInCubic, easeOutCubic, easeInOutCubic,
        easeInQuart, easeOutQuart, easeInOutQuart,
        easeInQuint, easeOutQuint, easeInOutQuint,
        easeInSine, easeOutSine, easeInOutSine,
        easeInExpo, easeOutExpo, easeInOutExpo,
        easeInCirc, easeOutCirc, easeInOutCirc,
        easeInBack, easeOutBack, easeInOutBack,
        easeInElastic, easeOutElastic, easeInOutElastic,
        easeInBounce, easeOutBounce, easeInOutBounce
      ]

      for (const fn of easingFns) {
        expect(fn(0)).toBeCloseTo(0, 10)
      }
    })

    it('all easing functions should handle t=1', () => {
      const easingFns = [
        linear, easeInQuad, easeOutQuad, easeInOutQuad,
        easeInCubic, easeOutCubic, easeInOutCubic,
        easeInQuart, easeOutQuart, easeInOutQuart,
        easeInQuint, easeOutQuint, easeInOutQuint,
        easeInSine, easeOutSine, easeInOutSine,
        easeInExpo, easeOutExpo, easeInOutExpo,
        easeInCirc, easeOutCirc, easeInOutCirc,
        easeInBack, easeOutBack, easeInOutBack,
        easeInElastic, easeOutElastic, easeInOutElastic,
        easeInBounce, easeOutBounce, easeInOutBounce
      ]

      for (const fn of easingFns) {
        expect(fn(1)).toBeCloseTo(1, 10)
      }
    })

    it('all easing functions should handle t=0.5', () => {
      const easingFns = [
        linear, easeInQuad, easeOutQuad, easeInOutQuad,
        easeInCubic, easeOutCubic, easeInOutCubic,
        easeInQuart, easeOutQuart, easeInOutQuart,
        easeInQuint, easeOutQuint, easeInOutQuint,
        easeInSine, easeOutSine, easeInOutSine,
        easeInExpo, easeOutExpo, easeInOutExpo,
        easeInCirc, easeOutCirc, easeInOutCirc,
        easeInBack, easeOutBack, easeInOutBack,
        easeInElastic, easeOutElastic, easeInOutElastic,
        easeInBounce, easeOutBounce, easeInOutBounce
      ]

      for (const fn of easingFns) {
        const result = fn(0.5)
        // Allow negative values for overshoot (back easing functions)
        expect(result).toBeGreaterThanOrEqual(-0.5)
        expect(result).toBeLessThanOrEqual(1.5)
      }
    })

    it('all easing functions should handle out of range values gracefully', () => {
      const easingFns = [
        linear, easeInQuad, easeOutQuad, easeInOutQuad,
        easeInCubic, easeOutCubic, easeInOutCubic,
        easeInSine, easeOutSine, easeInOutSine
      ]

      // These should handle negative values and >1 values gracefully
      for (const fn of easingFns) {
        const negResult = fn(-0.5)
        expect(typeof negResult).toBe('number')

        const highResult = fn(1.5)
        expect(typeof highResult).toBe('number')
      }
    })
  })
})
