/**
 * @oxog/tui - Animation Easing Functions
 * @packageDocumentation
 *
 * Standard easing functions for smooth animations.
 * All functions take a progress value (0-1) and return an eased value (0-1).
 */

// ============================================================
// Types
// ============================================================

/**
 * Easing function type.
 * Takes a progress value between 0 and 1, returns eased value between 0 and 1.
 */
export type EasingFunction = (t: number) => number

/**
 * Named easing functions.
 */
export type EasingName =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInQuint'
  | 'easeOutQuint'
  | 'easeInOutQuint'
  | 'easeInSine'
  | 'easeOutSine'
  | 'easeInOutSine'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'
  | 'easeInCirc'
  | 'easeOutCirc'
  | 'easeInOutCirc'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce'
  | 'spring'

// ============================================================
// Linear
// ============================================================

/** No easing, no acceleration */
export function linear(t: number): number {
  return t
}

// ============================================================
// Quadratic (power of 2)
// ============================================================

/** Accelerating from zero velocity */
export function easeInQuad(t: number): number {
  return t * t
}

/** Decelerating to zero velocity */
export function easeOutQuad(t: number): number {
  return t * (2 - t)
}

/** Acceleration until halfway, then deceleration */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ============================================================
// Cubic (power of 3)
// ============================================================

/** Accelerating from zero velocity */
export function easeInCubic(t: number): number {
  return t * t * t
}

/** Decelerating to zero velocity */
export function easeOutCubic(t: number): number {
  return (--t) * t * t + 1
}

/** Acceleration until halfway, then deceleration */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

// ============================================================
// Quartic (power of 4)
// ============================================================

/** Accelerating from zero velocity */
export function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Decelerating to zero velocity */
export function easeOutQuart(t: number): number {
  return 1 - (--t) * t * t * t
}

/** Acceleration until halfway, then deceleration */
export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
}

// ============================================================
// Quintic (power of 5)
// ============================================================

/** Accelerating from zero velocity */
export function easeInQuint(t: number): number {
  return t * t * t * t * t
}

/** Decelerating to zero velocity */
export function easeOutQuint(t: number): number {
  return 1 + (--t) * t * t * t * t
}

/** Acceleration until halfway, then deceleration */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
}

// ============================================================
// Sinusoidal
// ============================================================

/** Accelerating from zero velocity */
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2)
}

/** Decelerating to zero velocity */
export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}

/** Acceleration until halfway, then deceleration */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// ============================================================
// Exponential
// ============================================================

/** Accelerating from zero velocity */
export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/** Decelerating to zero velocity */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Acceleration until halfway, then deceleration */
export function easeInOutExpo(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2
}

// ============================================================
// Circular
// ============================================================

/** Accelerating from zero velocity */
export function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - t * t)
}

/** Decelerating to zero velocity */
export function easeOutCirc(t: number): number {
  return Math.sqrt(1 - (--t) * t)
}

/** Acceleration until halfway, then deceleration */
export function easeInOutCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2
}

// ============================================================
// Back (overshoot)
// ============================================================

const BACK_C1 = 1.70158
const BACK_C2 = BACK_C1 * 1.525
const BACK_C3 = BACK_C1 + 1

/** Accelerating with overshoot */
export function easeInBack(t: number): number {
  return BACK_C3 * t * t * t - BACK_C1 * t * t
}

/** Decelerating with overshoot */
export function easeOutBack(t: number): number {
  return 1 + BACK_C3 * Math.pow(t - 1, 3) + BACK_C1 * Math.pow(t - 1, 2)
}

/** Acceleration with overshoot until halfway, then deceleration */
export function easeInOutBack(t: number): number {
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((BACK_C2 + 1) * 2 * t - BACK_C2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((BACK_C2 + 1) * (t * 2 - 2) + BACK_C2) + 2) / 2
}

// ============================================================
// Elastic
// ============================================================

const ELASTIC_C4 = (2 * Math.PI) / 3
const ELASTIC_C5 = (2 * Math.PI) / 4.5

/** Accelerating with elastic effect */
export function easeInElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ELASTIC_C4)
}

/** Decelerating with elastic effect */
export function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ELASTIC_C4) + 1
}

/** Elastic effect on both sides */
export function easeInOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) / 2 + 1
}

// ============================================================
// Bounce
// ============================================================

const BOUNCE_N1 = 7.5625
const BOUNCE_D1 = 2.75

/** Accelerating with bounce effect */
export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t)
}

/** Decelerating with bounce effect */
export function easeOutBounce(t: number): number {
  if (t < 1 / BOUNCE_D1) {
    return BOUNCE_N1 * t * t
  } else if (t < 2 / BOUNCE_D1) {
    return BOUNCE_N1 * (t -= 1.5 / BOUNCE_D1) * t + 0.75
  } else if (t < 2.5 / BOUNCE_D1) {
    return BOUNCE_N1 * (t -= 2.25 / BOUNCE_D1) * t + 0.9375
  } else {
    return BOUNCE_N1 * (t -= 2.625 / BOUNCE_D1) * t + 0.984375
  }
}

/** Bounce effect on both sides */
export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2
}

// ============================================================
// Spring
// ============================================================

/**
 * Spring physics-based easing.
 *
 * @param stiffness - Spring stiffness (default: 100)
 * @param damping - Spring damping (default: 10)
 * @returns Easing function
 */
export function createSpring(stiffness: number = 100, damping: number = 10): EasingFunction {
  return (t: number): number => {
    const omega = Math.sqrt(stiffness)
    const zeta = damping / (2 * Math.sqrt(stiffness))

    if (zeta < 1) {
      // Underdamped
      const omega_d = omega * Math.sqrt(1 - zeta * zeta)
      return 1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omega_d * t) + (zeta * omega / omega_d) * Math.sin(omega_d * t)
      )
    } else {
      // Critically damped or overdamped
      return 1 - Math.exp(-omega * t) * (1 + omega * t)
    }
  }
}

/** Default spring easing */
export const spring = createSpring(100, 10)

// ============================================================
// Easing Map
// ============================================================

/**
 * Map of all named easing functions.
 */
export const easingFunctions: Record<EasingName, EasingFunction> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
  spring
}

/**
 * Get an easing function by name.
 *
 * @param name - Easing name
 * @returns Easing function
 *
 * @example
 * ```typescript
 * const ease = getEasing('easeOutQuad')
 * const value = ease(0.5) // 0.75
 * ```
 */
export function getEasing(name: EasingName): EasingFunction {
  return easingFunctions[name]
}

// ============================================================
// Animation Helpers
// ============================================================

/**
 * Interpolate between two values using an easing function.
 *
 * @param start - Start value
 * @param end - End value
 * @param progress - Progress (0-1)
 * @param easing - Easing function or name
 * @returns Interpolated value
 *
 * @example
 * ```typescript
 * interpolate(0, 100, 0.5, 'easeOutQuad') // 75
 * ```
 */
export function interpolate(
  start: number,
  end: number,
  progress: number,
  easing: EasingFunction | EasingName = linear
): number {
  const easeFn = typeof easing === 'string' ? getEasing(easing) : easing
  const t = Math.max(0, Math.min(1, progress))
  return start + (end - start) * easeFn(t)
}

/**
 * Create a tween animation.
 *
 * @param from - Start value
 * @param to - End value
 * @param duration - Duration in milliseconds
 * @param easing - Easing function or name
 * @param onUpdate - Called on each frame with current value
 * @param onComplete - Called when animation completes
 * @returns Stop function
 *
 * @example
 * ```typescript
 * const stop = tween(0, 100, 500, 'easeOutQuad', (value) => {
 *   console.log(value)
 * })
 * ```
 */
export function tween(
  from: number,
  to: number,
  duration: number,
  easing: EasingFunction | EasingName,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const startTime = Date.now()
  let animationId: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  function tick() {
    if (stopped) return

    const elapsed = Date.now() - startTime
    const progress = Math.min(1, elapsed / duration)

    onUpdate(interpolate(from, to, progress, easing))

    if (progress < 1) {
      animationId = setTimeout(tick, 16) // ~60fps
    } else {
      onComplete?.()
    }
  }

  tick()

  return () => {
    stopped = true
    if (animationId !== null) {
      clearTimeout(animationId)
    }
  }
}
