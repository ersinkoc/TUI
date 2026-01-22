/**
 * @oxog/tui - Animation Plugin
 * @packageDocumentation
 *
 * Plugin that provides animation and timing capabilities.
 * This plugin supports requestAnimationFrame-like patterns for smooth updates.
 */

import type { Plugin, TUIApp } from '../types'

// ============================================================
// Types
// ============================================================

/**
 * Animation frame callback.
 */
export type AnimationCallback = (deltaTime: number, totalTime: number) => void

/**
 * Tween easing function.
 */
export type EasingFunction = (t: number) => number

/**
 * Tween options.
 */
export interface TweenOptions {
  /** Start value */
  from: number
  /** End value */
  to: number
  /** Duration in milliseconds */
  duration: number
  /** Easing function */
  easing?: EasingFunction
  /** Callback on each update */
  onUpdate: (value: number) => void
  /** Callback when complete */
  onComplete?: () => void
}

/**
 * Animation handle for cancellation.
 */
export interface AnimationHandle {
  /** Cancel the animation */
  cancel(): void
  /** Check if animation is running */
  isRunning(): boolean
}

/**
 * Animation plugin options.
 */
export interface AnimationPluginOptions {
  /** Target frame rate (default: 60) */
  fps?: number
  /** Debug mode */
  debug?: boolean
}

/**
 * Animation plugin API exposed to the app.
 */
export interface AnimationPluginAPI {
  /** Request animation frame */
  requestFrame(callback: AnimationCallback): AnimationHandle
  /** Create a tween animation */
  tween(options: TweenOptions): AnimationHandle
  /** Delay execution */
  delay(ms: number): Promise<void>
  /** Set interval */
  setInterval(callback: () => void, ms: number): AnimationHandle
  /** Get current frame rate */
  getFPS(): number
}

// ============================================================
// Easing Functions
// ============================================================

/**
 * Pre-defined easing functions.
 */
export const easings = {
  /** Linear (no easing) */
  linear: (t: number) => t,

  /** Ease in quad */
  easeInQuad: (t: number) => t * t,

  /** Ease out quad */
  easeOutQuad: (t: number) => t * (2 - t),

  /** Ease in/out quad */
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  /** Ease in cubic */
  easeInCubic: (t: number) => t * t * t,

  /** Ease out cubic */
  easeOutCubic: (t: number) => --t * t * t + 1,

  /** Ease in/out cubic */
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** Ease out elastic */
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },

  /** Ease out bounce */
  easeOutBounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }
} as const

// ============================================================
// Implementation
// ============================================================

/**
 * Create the animation plugin.
 *
 * @param options - Plugin options
 * @returns Animation plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { animationPlugin, easings } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [animationPlugin()]
 * })
 *
 * // Request animation frame
 * app.animation.requestFrame((delta, total) => {
 *   // Update state based on time
 * })
 *
 * // Tween animation
 * app.animation.tween({
 *   from: 0,
 *   to: 100,
 *   duration: 500,
 *   easing: easings.easeOutCubic,
 *   onUpdate: (value) => {
 *     progressBar.value(value)
 *   }
 * })
 * ```
 */
export function animationPlugin(options: AnimationPluginOptions = {}): Plugin {
  const { fps: targetFPS = 60, debug = false } = options

  let app: TUIApp | null = null
  let running = false
  let animationTimer: ReturnType<typeof setTimeout> | null = null
  let startTime = 0
  let lastFrameTime = 0
  let frameCount = 0
  let currentFPS = 0
  let fpsUpdateTime = 0
  let fpsFrameCount = 0

  const frameCallbacks: Set<AnimationCallback> = new Set()
  const activeAnimations: Set<{ cancel: () => void }> = new Set()

  const frameInterval = Math.floor(1000 / targetFPS)

  /**
   * Main animation loop using setTimeout chain to prevent drift.
   * setInterval can drift over time; setTimeout chain recalculates timing each frame.
   */
  function tick(): void {
    /* c8 ignore next */
    if (!running) return

    const now = performance.now()

    // Guard against timing anomalies (negative delta from clock adjustment)
    // or first frame where lastFrameTime may not be initialized
    let deltaTime = now - lastFrameTime
    if (deltaTime < 0 || !Number.isFinite(deltaTime)) {
      // Negative or invalid delta - skip this frame's timing update
      // but still process callbacks with zero delta to maintain state
      deltaTime = 0
    }
    // Clamp deltaTime to reasonable maximum (e.g., 1 second)
    // to prevent huge jumps from long pauses
    if (deltaTime > 1000) {
      deltaTime = 1000
    }

    const totalTime = now - startTime
    lastFrameTime = now
    frameCount++
    fpsFrameCount++

    // Update FPS every second using accumulated time (more accurate than frame count)
    const fpsDelta = now - fpsUpdateTime
    // Handle negative deltas (clock went backwards due to manual adjustment or NTP sync)
    // Treat negative delta the same as >= 1000ms - reset FPS calculation
    if (fpsDelta >= 1000 || fpsDelta < 0) {
      // Guard against division by zero or invalid FPS values
      const safeDelta = Math.abs(fpsDelta)
      if (safeDelta > 0 && Number.isFinite(safeDelta)) {
        currentFPS = Math.round((fpsFrameCount * 1000) / safeDelta)
      } else {
        currentFPS = 0
      }
      fpsUpdateTime = now
      fpsFrameCount = 0
    }

    // Call frame callbacks (snapshot to safely handle modification during iteration)
    const callbackSnapshot = [...frameCallbacks]
    for (const callback of callbackSnapshot) {
      try {
        callback(deltaTime, totalTime)
      } catch (error) {
        if (debug) {
          console.error('[animation] frame callback error:', error)
        }
      }
    }

    // Trigger render if app has markDirty
    if (app && typeof (app as unknown as { markDirty?: () => void }).markDirty === 'function') {
      ;(app as unknown as { markDirty: () => void }).markDirty()
    }

    // Schedule next frame with drift compensation
    if (running) {
      const elapsed = performance.now() - now
      // Guard against negative elapsed time
      const safeElapsed = Math.max(0, Math.min(elapsed, frameInterval))
      const nextDelay = Math.max(0, frameInterval - safeElapsed)
      animationTimer = setTimeout(tick, nextDelay)
    }
  }

  /**
   * Start the animation loop.
   */
  function start(): void {
    /* c8 ignore next */
    if (running) return

    running = true
    startTime = performance.now()
    lastFrameTime = startTime
    frameCount = 0
    fpsUpdateTime = startTime
    fpsFrameCount = 0

    // Use setTimeout chain instead of setInterval to prevent drift
    animationTimer = setTimeout(tick, frameInterval)

    if (debug) {
      console.error(`[animation] loop started at ${targetFPS}fps`)
    }
  }

  /**
   * Stop the animation loop.
   */
  function stop(): void {
    if (!running) return

    running = false
    currentFPS = 0
    if (animationTimer) {
      clearTimeout(animationTimer)
      animationTimer = null
    }

    if (debug) {
      console.error('[animation] loop stopped')
    }
  }

  return {
    name: 'animation',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { animation: AnimationPluginAPI }).animation = {
        requestFrame: (callback: AnimationCallback) => {
          frameCallbacks.add(callback)

          // Start loop if not running and we have callbacks
          if (!running && frameCallbacks.size > 0) {
            start()
          }

          const handle: AnimationHandle = {
            cancel: () => {
              frameCallbacks.delete(callback)
              activeAnimations.delete(handle)
              // Stop loop if no more callbacks and no active animations
              if (frameCallbacks.size === 0 && activeAnimations.size === 0) {
                stop()
              }
            },
            isRunning: () => frameCallbacks.has(callback)
          }

          activeAnimations.add(handle)
          return handle
        },

        tween: (tweenOptions: TweenOptions) => {
          const { from, to, duration, easing = easings.linear, onUpdate, onComplete } = tweenOptions

          // Validate duration - must be positive finite number
          if (!Number.isFinite(duration) || duration <= 0) {
            // Invalid duration - complete immediately with final value
            if (debug) {
              console.warn(
                `[animation] Invalid tween duration: ${duration}. ` +
                `Duration must be a positive number. Completing immediately.`
              )
            }
            onUpdate(to)
            if (onComplete) {
              onComplete()
            }
            // Return no-op handle
            return {
              cancel: () => {},
              isRunning: () => false
            }
          }

          const tweenStart = performance.now()
          let cancelled = false

          const handle: AnimationHandle = {
            cancel: () => {
              cancelled = true
              activeAnimations.delete(handle)
              frameCallbacks.delete(tweenCallback)
            },
            isRunning: () => !cancelled
          }

          const tweenCallback: AnimationCallback = () => {
            /* c8 ignore next */
            if (cancelled) return

            const elapsed = performance.now() - tweenStart
            const progress = Math.min(1, elapsed / duration)
            const easedProgress = easing(progress)
            const value = from + (to - from) * easedProgress

            onUpdate(value)

            if (progress >= 1) {
              handle.cancel()
              if (onComplete) {
                onComplete()
              }
            }
          }

          frameCallbacks.add(tweenCallback)
          activeAnimations.add(handle)

          // Start loop if not running
          if (!running) {
            start()
          }

          return handle
        },

        delay: (ms: number) => {
          return new Promise<void>(resolve => {
            setTimeout(resolve, ms)
          })
        },

        setInterval: (callback: () => void, ms: number) => {
          const interval = setInterval(callback, ms)

          const handle: AnimationHandle = {
            cancel: () => {
              clearInterval(interval)
              activeAnimations.delete(handle)
            },
            isRunning: () => activeAnimations.has(handle)
          }

          activeAnimations.add(handle)
          return handle
        },

        getFPS: () => currentFPS
      }

      if (debug) {
        console.error('[animation] plugin installed')
      }
    },

    destroy(): void {
      stop()

      // Cancel all active animations (snapshot to safely handle modification during iteration)
      const animationsSnapshot = [...activeAnimations]
      for (const animation of animationsSnapshot) {
        try {
          animation.cancel()
        } catch (error) {
          if (debug) {
            console.error('[animation] error canceling animation:', error)
          }
        }
      }

      frameCallbacks.clear()
      activeAnimations.clear()
      app = null
    }
  }
}
