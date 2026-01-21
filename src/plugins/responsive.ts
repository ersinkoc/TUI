/**
 * @oxog/tui - Responsive Plugin
 * @packageDocumentation
 *
 * Terminal-responsive layout system with breakpoints,
 * media query-like conditions, and adaptive UI support.
 */

import type { Plugin, TUIApp } from '../types'

// ============================================================
// Types
// ============================================================

/**
 * Breakpoint definition.
 */
export interface Breakpoint {
  /** Breakpoint name */
  name: string
  /** Minimum width (inclusive) */
  minWidth: number
  /** Maximum width (exclusive, optional) */
  maxWidth?: number
}

/**
 * Predefined breakpoint names.
 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string

/**
 * Media query condition.
 */
export interface MediaQuery {
  /** Minimum width */
  minWidth?: number
  /** Maximum width */
  maxWidth?: number
  /** Minimum height */
  minHeight?: number
  /** Maximum height */
  maxHeight?: number
  /** Orientation */
  orientation?: 'portrait' | 'landscape'
}

/**
 * Responsive value that changes based on breakpoint.
 */
export type ResponsiveValue<T> = T | Partial<Record<BreakpointName, T>>

/**
 * Breakpoint change handler.
 */
export type BreakpointChangeHandler = (
  current: string,
  previous: string | null,
  width: number,
  height: number
) => void

/**
 * Responsive plugin options.
 */
export interface ResponsivePluginOptions {
  /** Custom breakpoints (overrides defaults) */
  breakpoints?: Breakpoint[]
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Responsive plugin API exposed to the app.
 */
export interface ResponsivePluginAPI {
  /** Get current breakpoint name */
  current(): string
  /** Get current terminal width */
  width(): number
  /** Get current terminal height */
  height(): number
  /** Check if current breakpoint matches */
  is(breakpoint: string): boolean
  /** Check if width is at least the given breakpoint */
  isAtLeast(breakpoint: string): boolean
  /** Check if width is at most the given breakpoint */
  isAtMost(breakpoint: string): boolean
  /** Check if width is between two breakpoints */
  isBetween(min: string, max: string): boolean
  /** Check a media query */
  matches(query: MediaQuery): boolean
  /** Get orientation */
  orientation(): 'portrait' | 'landscape' | 'square'
  /** Subscribe to breakpoint changes */
  onChange(handler: BreakpointChangeHandler): () => void
  /** Resolve a responsive value for current breakpoint */
  resolve<T>(value: ResponsiveValue<T>, defaultValue: T): T
  /** Get all breakpoints */
  getBreakpoints(): Breakpoint[]
  /** Add a custom breakpoint */
  addBreakpoint(breakpoint: Breakpoint): void
  /** Remove a breakpoint */
  removeBreakpoint(name: string): void
}

// ============================================================
// Default Breakpoints
// ============================================================

/**
 * Default terminal breakpoints (based on common terminal widths).
 */
export const defaultBreakpoints: Breakpoint[] = [
  { name: 'xs', minWidth: 0, maxWidth: 40 },      // Very narrow (< 40 cols)
  { name: 'sm', minWidth: 40, maxWidth: 60 },     // Small (40-59 cols)
  { name: 'md', minWidth: 60, maxWidth: 80 },     // Medium (60-79 cols)
  { name: 'lg', minWidth: 80, maxWidth: 120 },    // Large (80-119 cols)
  { name: 'xl', minWidth: 120, maxWidth: 160 },   // Extra large (120-159 cols)
  { name: '2xl', minWidth: 160 }                   // Ultra wide (160+ cols)
]

// ============================================================
// Implementation
// ============================================================

/**
 * Create the responsive plugin.
 *
 * @param options - Plugin options
 * @returns Responsive plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { responsivePlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [responsivePlugin()]
 * })
 *
 * // Check current breakpoint
 * if (app.responsive.is('sm')) {
 *   // Single column layout
 * } else if (app.responsive.isAtLeast('lg')) {
 *   // Multi-column layout
 * }
 *
 * // Subscribe to changes
 * app.responsive.onChange((current, previous) => {
 *   console.log(`Breakpoint: ${previous} -> ${current}`)
 *   rebuildUI()
 * })
 *
 * // Resolve responsive values
 * const columns = app.responsive.resolve({
 *   xs: 1,
 *   sm: 1,
 *   md: 2,
 *   lg: 3,
 *   xl: 4
 * }, 1)
 * ```
 */
export function responsivePlugin(options: ResponsivePluginOptions = {}): Plugin {
  const { breakpoints: customBreakpoints, debug = false } = options

  let _app: TUIApp | null = null
  // Make linter happy - _app is stored for potential future use
  void _app
  let currentWidth = 80
  let currentHeight = 24
  let currentBreakpoint: string = 'md'
  let previousBreakpoint: string | null = null
  const breakpoints: Breakpoint[] = customBreakpoints
    ? [...customBreakpoints].sort((a, b) => a.minWidth - b.minWidth)
    : [...defaultBreakpoints]
  const changeHandlers = new Set<BreakpointChangeHandler>()

  // Store unsubscribe function for cleanup (memory leak fix)
  let resizeUnsubscribe: (() => void) | null = null

  /**
   * Find the current breakpoint based on width.
   */
  function findBreakpoint(width: number): string {
    // Find the breakpoint that matches the width
    for (let i = breakpoints.length - 1; i >= 0; i--) {
      const bp = breakpoints[i]
      if (bp && width >= bp.minWidth && (bp.maxWidth === undefined || width < bp.maxWidth)) {
        return bp.name
      }
    }
    // Fallback to first breakpoint
    const firstBp = breakpoints[0]
    return firstBp ? firstBp.name : 'md'
  }

  /**
   * Update breakpoint based on new dimensions.
   */
  function updateBreakpoint(width: number, height: number): void {
    currentWidth = width
    currentHeight = height

    const newBreakpoint = findBreakpoint(width)

    if (newBreakpoint !== currentBreakpoint) {
      previousBreakpoint = currentBreakpoint
      currentBreakpoint = newBreakpoint

      if (debug) {
        console.error(`[responsive] Breakpoint: ${previousBreakpoint} -> ${currentBreakpoint} (${width}x${height})`)
      }

      // Notify handlers with error protection (snapshot to prevent modification during iteration)
      const handlersSnapshot = Array.from(changeHandlers)
      for (const handler of handlersSnapshot) {
        try {
          if (changeHandlers.has(handler)) {
            handler(currentBreakpoint, previousBreakpoint, width, height)
          }
        } catch (err) {
          if (debug) {
            console.error('[responsive] Handler error:', err)
          }
        }
      }
    }
  }

  /**
   * Get breakpoint index for comparison.
   */
  function getBreakpointIndex(name: string): number {
    return breakpoints.findIndex(bp => bp.name === name)
  }

  return {
    name: 'responsive',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      _app = tuiApp

      // Initialize with current terminal size
      currentWidth = tuiApp.width
      currentHeight = tuiApp.height
      currentBreakpoint = findBreakpoint(currentWidth)

      if (debug) {
        console.error(`[responsive] Initial: ${currentBreakpoint} (${currentWidth}x${currentHeight})`)
      }

      // Listen for resize events (store unsubscribe for cleanup)
      // Note: onResize hook is intentionally not used to avoid duplicate handling
      resizeUnsubscribe = tuiApp.on('resize', (width: number, height: number) => {
        updateBreakpoint(width, height)
      })

      // Expose API on app
      ;(tuiApp as TUIApp & { responsive: ResponsivePluginAPI }).responsive = {
        current: () => currentBreakpoint,

        width: () => currentWidth,

        height: () => currentHeight,

        is: (breakpoint: string) => currentBreakpoint === breakpoint,

        isAtLeast: (breakpoint: string) => {
          const currentIdx = getBreakpointIndex(currentBreakpoint)
          const targetIdx = getBreakpointIndex(breakpoint)
          // Return false if breakpoint not found (was returning true before)
          if (targetIdx === -1) {
            if (debug) {
              console.error(`[responsive] Unknown breakpoint: ${breakpoint}`)
            }
            return false
          }
          return currentIdx >= targetIdx
        },

        isAtMost: (breakpoint: string) => {
          const currentIdx = getBreakpointIndex(currentBreakpoint)
          const targetIdx = getBreakpointIndex(breakpoint)
          // Return false if breakpoint not found
          if (targetIdx === -1) {
            if (debug) {
              console.error(`[responsive] Unknown breakpoint: ${breakpoint}`)
            }
            return false
          }
          return currentIdx <= targetIdx
        },

        isBetween: (min: string, max: string) => {
          const currentIdx = getBreakpointIndex(currentBreakpoint)
          const minIdx = getBreakpointIndex(min)
          const maxIdx = getBreakpointIndex(max)
          // Return false if any breakpoint not found
          if (minIdx === -1 || maxIdx === -1) {
            if (debug) {
              console.error(`[responsive] Unknown breakpoint: ${minIdx === -1 ? min : max}`)
            }
            return false
          }
          return currentIdx >= minIdx && currentIdx <= maxIdx
        },

        matches: (query: MediaQuery) => {
          if (query.minWidth !== undefined && currentWidth < query.minWidth) return false
          if (query.maxWidth !== undefined && currentWidth > query.maxWidth) return false
          if (query.minHeight !== undefined && currentHeight < query.minHeight) return false
          if (query.maxHeight !== undefined && currentHeight > query.maxHeight) return false

          if (query.orientation) {
            // Consistent with orientation() method - square is treated as its own category
            // For query matching, square matches neither portrait nor landscape explicitly
            const actualOrientation = currentWidth > currentHeight
              ? 'landscape'
              : currentWidth < currentHeight
                ? 'portrait'
                : 'square'
            // Square doesn't match portrait or landscape queries
            if (actualOrientation === 'square') return false
            if (actualOrientation !== query.orientation) return false
          }

          return true
        },

        orientation: () => {
          if (currentWidth > currentHeight) return 'landscape'
          if (currentWidth < currentHeight) return 'portrait'
          return 'square'
        },

        onChange: (handler: BreakpointChangeHandler) => {
          changeHandlers.add(handler)
          return () => {
            changeHandlers.delete(handler)
          }
        },

        resolve: <T>(value: ResponsiveValue<T>, defaultValue: T): T => {
          // If it's not an object with breakpoint keys, return as-is
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return value as T
          }

          const obj = value as Partial<Record<BreakpointName, T>>

          // Try exact match first
          if (currentBreakpoint in obj) {
            return obj[currentBreakpoint] as T
          }

          // Fall back to smaller breakpoints
          const currentIdx = getBreakpointIndex(currentBreakpoint)
          for (let i = currentIdx - 1; i >= 0; i--) {
            const bp = breakpoints[i]
            if (bp && bp.name in obj) {
              return obj[bp.name] as T
            }
          }

          return defaultValue
        },

        getBreakpoints: () => [...breakpoints],

        addBreakpoint: (breakpoint: Breakpoint) => {
          // Remove existing with same name
          const idx = breakpoints.findIndex(bp => bp.name === breakpoint.name)
          if (idx !== -1) breakpoints.splice(idx, 1)

          // Add and sort
          breakpoints.push(breakpoint)
          breakpoints.sort((a, b) => a.minWidth - b.minWidth)

          // Re-evaluate current breakpoint
          updateBreakpoint(currentWidth, currentHeight)
        },

        removeBreakpoint: (name: string) => {
          const idx = breakpoints.findIndex(bp => bp.name === name)
          if (idx !== -1) {
            breakpoints.splice(idx, 1)
            // Re-evaluate current breakpoint
            updateBreakpoint(currentWidth, currentHeight)
          }
        }
      }
    },

    // Note: onResize hook intentionally removed to avoid duplicate resize handling
    // The event listener in install() handles resize events

    destroy(): void {
      // Clean up event listener (memory leak fix)
      if (resizeUnsubscribe) {
        resizeUnsubscribe()
        resizeUnsubscribe = null
      }
      changeHandlers.clear()
      _app = null
    }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create responsive styles object.
 *
 * @example
 * ```typescript
 * const styles = responsiveStyles({
 *   width: { xs: '100%', md: '50%', lg: '33%' },
 *   padding: { xs: 1, md: 2, lg: 3 }
 * })
 * ```
 */
export function responsiveStyles<T extends Record<string, ResponsiveValue<unknown>>>(
  styles: T
): T {
  return styles
}

/**
 * Create a responsive layout configuration.
 *
 * @example
 * ```typescript
 * const layout = responsiveLayout({
 *   columns: { xs: 1, sm: 2, lg: 3 },
 *   gap: { xs: 1, md: 2 },
 *   direction: { xs: 'column', md: 'row' }
 * })
 * ```
 */
export function responsiveLayout<T extends {
  columns?: ResponsiveValue<number>
  gap?: ResponsiveValue<number>
  direction?: ResponsiveValue<'row' | 'column'>
  padding?: ResponsiveValue<number>
}>(config: T): T {
  return config
}

/**
 * Terminal size presets for common configurations.
 */
export const terminalPresets = {
  /** Standard 80x24 terminal */
  standard: { width: 80, height: 24 },
  /** Wide terminal (120 cols) */
  wide: { width: 120, height: 30 },
  /** Full HD equivalent (~180 cols) */
  fullHD: { width: 180, height: 45 },
  /** Minimal terminal */
  minimal: { width: 40, height: 12 },
  /** VS Code integrated terminal (typical) */
  vscode: { width: 100, height: 20 }
} as const
