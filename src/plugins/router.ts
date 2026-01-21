/**
 * @oxog/tui - Router Plugin
 * @packageDocumentation
 *
 * Screen/view navigation system for multi-screen TUI applications.
 * Supports parameterized routes, history management, and navigation guards.
 */

import type { Plugin, TUIApp, Node } from '../types'
import {
  ROUTER_MAX_HISTORY_SIZE,
  ROUTER_MAX_REDIRECT_DEPTH,
  ROUTER_MAX_CACHE_SIZE
} from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Route parameters.
 */
export type RouteParams = Record<string, string | number | boolean>

/**
 * Route query parameters.
 */
export type RouteQuery = Record<string, string | number | boolean | undefined>

/**
 * Route definition.
 */
export interface RouteDefinition {
  /** Route path pattern (e.g., '/users/:id') */
  path: string
  /** Route name for programmatic navigation */
  name?: string
  /** View component factory */
  component: (params: RouteParams, query: RouteQuery) => Node
  /** Route metadata */
  meta?: Record<string, unknown>
  /** Navigation guard */
  beforeEnter?: NavigationGuard
}

/**
 * Matched route information.
 */
export interface Route {
  /** Full path */
  path: string
  /** Route name */
  name?: string
  /** Extracted parameters */
  params: RouteParams
  /** Query parameters */
  query: RouteQuery
  /** Route metadata */
  meta: Record<string, unknown>
  /** Matched route definition */
  matched: RouteDefinition | null
}

/**
 * Navigation guard function.
 */
export type NavigationGuard = (
  to: Route,
  from: Route | null,
  next: (path?: string | false) => void
) => void | Promise<void>

/**
 * Navigation direction.
 */
export type NavigationDirection = 'forward' | 'back' | 'replace'

/**
 * Navigation event handler.
 */
export type NavigationHandler = (
  to: Route,
  from: Route | null,
  direction: NavigationDirection
) => void

/**
 * Router plugin options.
 */
export interface RouterPluginOptions {
  /** Initial routes */
  routes?: RouteDefinition[]
  /** Default route path */
  defaultRoute?: string
  /** Enable debug logging */
  debug?: boolean
  /** Maximum history size */
  maxHistorySize?: number
}

/**
 * Router plugin API exposed to the app.
 */
export interface RouterPluginAPI {
  /** Navigate to a path */
  push(path: string, query?: RouteQuery): Promise<boolean>
  /** Navigate by route name */
  pushNamed(name: string, params?: RouteParams, query?: RouteQuery): Promise<boolean>
  /** Replace current route */
  replace(path: string, query?: RouteQuery): Promise<boolean>
  /** Go back in history */
  back(): Promise<boolean>
  /** Go forward in history */
  forward(): Promise<boolean>
  /** Go to specific history index */
  go(delta: number): Promise<boolean>
  /** Get current route */
  current(): Route
  /** Get current view node */
  currentView(): Node | null
  /** Get navigation history */
  getHistory(): Route[]
  /** Get history index */
  getHistoryIndex(): number
  /** Check if can go back */
  canGoBack(): boolean
  /** Check if can go forward */
  canGoForward(): boolean
  /** Register a route */
  addRoute(route: RouteDefinition): void
  /** Remove a route */
  removeRoute(path: string): void
  /** Get all routes */
  getRoutes(): RouteDefinition[]
  /** Add global navigation guard */
  beforeEach(guard: NavigationGuard): () => void
  /** Add global after hook */
  afterEach(handler: NavigationHandler): () => void
  /** Check if path matches a route */
  hasRoute(path: string): boolean
  /** Resolve a path to route info without navigating */
  resolve(path: string, query?: RouteQuery): Route
}

// ============================================================
// Implementation
// ============================================================

// Cache for compiled route patterns (performance fix)
const routePatternCache = new Map<string, { regex: RegExp; paramNames: string[] }>()

// Use centralized constant for cache size

/**
 * Parse a route path pattern into regex and param names.
 * Results are cached to avoid O(n) regex compilation on every navigation.
 */
function parseRoutePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  // Check cache first
  const cached = routePatternCache.get(pattern)
  if (cached) return cached

  const paramNames: string[] = []

  // Escape special regex chars except : and *
  let regexStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Replace :param with capture groups
  regexStr = regexStr.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    paramNames.push(name)
    return '([^/]+)'
  })

  // Replace * with wildcard
  regexStr = regexStr.replace(/\\\*/g, '.*')

  const result = {
    regex: new RegExp(`^${regexStr}$`),
    paramNames
  }

  // Evict oldest entries if cache is full (LRU-like behavior)
  if (routePatternCache.size >= ROUTER_MAX_CACHE_SIZE) {
    const firstKey = routePatternCache.keys().next().value
    if (firstKey) {
      routePatternCache.delete(firstKey)
    }
  }

  // Cache the result
  routePatternCache.set(pattern, result)

  return result
}

/**
 * Match a path against a route definition.
 */
function matchRoute(
  path: string,
  route: RouteDefinition
): { matched: boolean; params: RouteParams } {
  const { regex, paramNames } = parseRoutePath(route.path)
  const match = path.match(regex)

  if (!match) {
    return { matched: false, params: {} }
  }

  const params: RouteParams = {}
  for (let i = 0; i < paramNames.length; i++) {
    const paramName = paramNames[i]
    const value = match[i + 1]
    if (paramName !== undefined && value !== undefined) {
      // Try to parse as number
      const num = Number(value)
      params[paramName] = isNaN(num) ? value : num
    }
  }

  return { matched: true, params }
}

/**
 * Parse query string into object.
 */
function parseQuery(queryString: string): RouteQuery {
  const query: RouteQuery = {}
  if (!queryString) return query

  const params = new URLSearchParams(queryString)
  for (const [key, value] of params) {
    // Try to parse as number or boolean
    if (value === 'true') {
      query[key] = true
    } else if (value === 'false') {
      query[key] = false
    } else {
      const num = Number(value)
      query[key] = isNaN(num) ? value : num
    }
  }

  return query
}

/**
 * Build query string from object.
 */
export function buildQuery(query: RouteQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}

/**
 * Create the router plugin.
 *
 * @param options - Plugin options
 * @returns Router plugin
 *
 * @example
 * ```typescript
 * import { tui, box, text } from '@oxog/tui'
 * import { routerPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [routerPlugin({
 *     routes: [
 *       {
 *         path: '/',
 *         name: 'home',
 *         component: () => box().add(text('Home'))
 *       },
 *       {
 *         path: '/users/:id',
 *         name: 'user',
 *         component: (params) => box().add(text(`User ${params.id}`))
 *       }
 *     ],
 *     defaultRoute: '/'
 *   })]
 * })
 *
 * // Navigate
 * app.router.push('/users/123')
 * app.router.pushNamed('user', { id: 456 })
 *
 * // Navigation guards
 * app.router.beforeEach((to, from, next) => {
 *   if (to.path === '/admin' && !isAuthenticated) {
 *     next('/login')
 *   } else {
 *     next()
 *   }
 * })
 * ```
 */
export function routerPlugin(options: RouterPluginOptions = {}): Plugin {
  const {
    routes: initialRoutes = [],
    defaultRoute = '/',
    debug = false,
    maxHistorySize = ROUTER_MAX_HISTORY_SIZE
  } = options

  let app: TUIApp | null = null
  const routes: RouteDefinition[] = [...initialRoutes]
  const history: Route[] = []
  let historyIndex = -1
  let currentView: Node | null = null

  const beforeGuards = new Set<NavigationGuard>()
  const afterHandlers = new Set<NavigationHandler>()

  // Navigation lock to prevent race conditions
  let isNavigating = false
  const navigationQueue: Array<() => Promise<boolean>> = []

  // Use centralized constant for redirect depth

  /**
   * Create a route object from path.
   */
  function createRoute(path: string, query: RouteQuery = {}): Route {
    // Extract query from path if present
    let actualPath = path
    let actualQuery = query

    const queryStart = path.indexOf('?')
    if (queryStart !== -1) {
      actualPath = path.substring(0, queryStart)
      actualQuery = { ...parseQuery(path.substring(queryStart + 1)), ...query }
    }

    // Find matching route
    for (const route of routes) {
      const { matched, params } = matchRoute(actualPath, route)
      if (matched) {
        const routeObj: Route = {
          path: actualPath,
          params,
          query: actualQuery,
          meta: route.meta || {},
          matched: route
        }
        if (route.name !== undefined) {
          routeObj.name = route.name
        }
        return routeObj
      }
    }

    // No match
    return {
      path: actualPath,
      params: {},
      query: actualQuery,
      meta: {},
      matched: null
    }
  }

  /**
   * Run navigation guards.
   */
  async function runGuards(to: Route, from: Route | null): Promise<string | false | undefined> {
    // Run global guards
    for (const guard of beforeGuards) {
      let result: string | false | undefined
      let resolved = false

      await guard(to, from, (path) => {
        resolved = true
        result = path
      })

      // If guard called next(false), abort
      if (result === false) {
        return false
      }

      // If guard redirected, return new path
      if (typeof result === 'string') {
        return result
      }

      // If guard didn't resolve, abort
      if (!resolved) {
        return false
      }
    }

    // Run route-specific guard
    if (to.matched?.beforeEnter) {
      let result: string | false | undefined
      let resolved = false

      await to.matched.beforeEnter(to, from, (path) => {
        resolved = true
        result = path
      })

      if (result === false || !resolved) {
        return false
      }

      if (typeof result === 'string') {
        return result
      }
    }

    return undefined
  }

  /**
   * Process navigation queue to prevent race conditions.
   */
  async function processNavigationQueue(): Promise<void> {
    if (isNavigating) return

    while (navigationQueue.length > 0) {
      isNavigating = true
      const next = navigationQueue.shift()
      if (next) {
        try {
          await next()
        } catch (err) {
          if (debug) {
            console.error('[router] Navigation error:', err)
          }
        }
      }
      isNavigating = false
    }
  }

  /**
   * Perform navigation (internal implementation).
   */
  async function navigateInternal(
    path: string,
    query: RouteQuery = {},
    direction: NavigationDirection = 'forward',
    redirectDepth: number = 0
  ): Promise<boolean> {
    // Check redirect depth to prevent infinite recursion
    if (redirectDepth > ROUTER_MAX_REDIRECT_DEPTH) {
      if (debug) {
        console.error(`[router] Maximum redirect depth (${ROUTER_MAX_REDIRECT_DEPTH}) exceeded`)
      }
      return false
    }

    const to = createRoute(path, query)
    const from = history[historyIndex] || null

    if (debug) {
      console.error(`[router] Navigate: ${from?.path || '(none)'} -> ${to.path}`)
    }

    // Run guards
    const guardResult = await runGuards(to, from)

    if (guardResult === false) {
      if (debug) {
        console.error('[router] Navigation aborted by guard')
      }
      return false
    }

    if (typeof guardResult === 'string') {
      // Redirect - increment depth to prevent infinite recursion
      return navigateInternal(guardResult, {}, direction, redirectDepth + 1)
    }

    // Update history
    if (direction === 'forward') {
      // Remove forward history if we're not at the end
      if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1)
      }
      history.push(to)
      historyIndex = history.length - 1

      // Trim history if needed
      if (history.length > maxHistorySize) {
        history.shift()
        historyIndex = history.length - 1
      }
    } else if (direction === 'replace') {
      if (historyIndex >= 0) {
        history[historyIndex] = to
      } else {
        history.push(to)
        historyIndex = 0
      }
    }

    // Create view with error handling
    if (to.matched) {
      try {
        currentView = to.matched.component(to.params, to.query)

        // Mount new view
        if (app) {
          app.mount(currentView)
          app.markDirty()
        }
      } catch (err) {
        if (debug) {
          console.error(`[router] Component error:`, err)
        }
        currentView = null
        return false
      }
    } else {
      if (debug) {
        console.error(`[router] No route matched: ${to.path}`)
      }
      currentView = null
    }

    // Run after handlers with error protection
    for (const handler of afterHandlers) {
      try {
        handler(to, from, direction)
      } catch (err) {
        if (debug) {
          console.error('[router] After handler error:', err)
        }
      }
    }

    return true
  }

  /**
   * Perform navigation (queued to prevent race conditions).
   */
  async function navigate(
    path: string,
    query: RouteQuery = {},
    direction: NavigationDirection = 'forward'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      navigationQueue.push(async () => {
        const result = await navigateInternal(path, query, direction, 0)
        resolve(result)
        return result
      })
      processNavigationQueue()
    })
  }

  return {
    name: 'router',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { router: RouterPluginAPI }).router = {
        push: async (path: string, query?: RouteQuery) => {
          return navigate(path, query, 'forward')
        },

        pushNamed: async (name: string, params?: RouteParams, query?: RouteQuery) => {
          const route = routes.find(r => r.name === name)
          if (!route) {
            if (debug) {
              console.error(`[router] Route not found: ${name}`)
            }
            return false
          }

          // Extract required params from route path
          const { paramNames } = parseRoutePath(route.path)

          // Validate all required params are provided
          const missingParams = paramNames.filter(
            name => params === undefined || !(name in params)
          )
          if (missingParams.length > 0) {
            if (debug) {
              console.error(`[router] Missing required params for route '${name}': ${missingParams.join(', ')}`)
            }
            return false
          }

          // Build path from params
          let path = route.path
          if (params) {
            for (const [key, value] of Object.entries(params)) {
              path = path.replace(`:${key}`, String(value))
            }
          }

          return navigate(path, query, 'forward')
        },

        replace: async (path: string, query?: RouteQuery) => {
          return navigate(path, query, 'replace')
        },

        back: async () => {
          if (historyIndex <= 0) return false

          const targetIndex = historyIndex - 1
          const to = history[targetIndex]
          const from = history[historyIndex]
          if (!to) return false

          // Run guards (security fix - guards were bypassed before)
          const guardResult = await runGuards(to, from || null)
          if (guardResult === false) {
            if (debug) {
              console.error('[router] Back navigation aborted by guard')
            }
            return false
          }

          // If guard redirected, use navigate instead
          if (typeof guardResult === 'string') {
            return navigate(guardResult, {}, 'forward')
          }

          historyIndex = targetIndex

          // Recreate view with error handling
          if (to.matched) {
            try {
              currentView = to.matched.component(to.params, to.query)
              if (app) {
                app.mount(currentView)
                app.markDirty()
              }
            } catch (err) {
              if (debug) {
                console.error('[router] Component error:', err)
              }
              return false
            }
          }

          // Run after handlers with error protection
          for (const handler of afterHandlers) {
            try {
              handler(to, from || null, 'back')
            } catch (err) {
              if (debug) {
                console.error('[router] After handler error:', err)
              }
            }
          }

          return true
        },

        forward: async () => {
          if (historyIndex >= history.length - 1) return false

          const targetIndex = historyIndex + 1
          const to = history[targetIndex]
          const from = history[historyIndex]
          if (!to) return false

          // Run guards (security fix - guards were bypassed before)
          const guardResult = await runGuards(to, from || null)
          if (guardResult === false) {
            if (debug) {
              console.error('[router] Forward navigation aborted by guard')
            }
            return false
          }

          // If guard redirected, use navigate instead
          if (typeof guardResult === 'string') {
            return navigate(guardResult, {}, 'forward')
          }

          historyIndex = targetIndex

          // Recreate view with error handling
          if (to.matched) {
            try {
              currentView = to.matched.component(to.params, to.query)
              if (app) {
                app.mount(currentView)
                app.markDirty()
              }
            } catch (err) {
              if (debug) {
                console.error('[router] Component error:', err)
              }
              return false
            }
          }

          // Run after handlers with error protection
          for (const handler of afterHandlers) {
            try {
              handler(to, from || null, 'forward')
            } catch (err) {
              if (debug) {
                console.error('[router] After handler error:', err)
              }
            }
          }

          return true
        },

        go: async (delta: number) => {
          const newIndex = historyIndex + delta
          if (newIndex < 0 || newIndex >= history.length) return false

          const direction: NavigationDirection = delta > 0 ? 'forward' : 'back'
          const to = history[newIndex]
          const from = history[historyIndex]
          if (!to) return false

          // Run guards (security fix - guards were bypassed before)
          const guardResult = await runGuards(to, from || null)
          if (guardResult === false) {
            if (debug) {
              console.error('[router] Go navigation aborted by guard')
            }
            return false
          }

          // If guard redirected, use navigate instead
          if (typeof guardResult === 'string') {
            return navigate(guardResult, {}, 'forward')
          }

          historyIndex = newIndex

          // Recreate view with error handling
          if (to.matched) {
            try {
              currentView = to.matched.component(to.params, to.query)
              if (app) {
                app.mount(currentView)
                app.markDirty()
              }
            } catch (err) {
              if (debug) {
                console.error('[router] Component error:', err)
              }
              return false
            }
          }

          // Run after handlers with error protection
          for (const handler of afterHandlers) {
            try {
              handler(to, from || null, direction)
            } catch (err) {
              if (debug) {
                console.error('[router] After handler error:', err)
              }
            }
          }

          return true
        },

        current: () => {
          return history[historyIndex] || createRoute(defaultRoute)
        },

        currentView: () => currentView,

        getHistory: () => [...history],

        getHistoryIndex: () => historyIndex,

        canGoBack: () => historyIndex > 0,

        canGoForward: () => historyIndex < history.length - 1,

        addRoute: (route: RouteDefinition) => {
          // Remove existing with same path
          const idx = routes.findIndex(r => r.path === route.path)
          if (idx !== -1) routes.splice(idx, 1)
          routes.push(route)
        },

        removeRoute: (path: string) => {
          const idx = routes.findIndex(r => r.path === path)
          if (idx !== -1) routes.splice(idx, 1)
        },

        getRoutes: () => [...routes],

        beforeEach: (guard: NavigationGuard) => {
          beforeGuards.add(guard)
          return () => {
            beforeGuards.delete(guard)
          }
        },

        afterEach: (handler: NavigationHandler) => {
          afterHandlers.add(handler)
          return () => {
            afterHandlers.delete(handler)
          }
        },

        hasRoute: (path: string) => {
          return routes.some(r => matchRoute(path, r).matched)
        },

        resolve: (path: string, query?: RouteQuery) => {
          return createRoute(path, query)
        }
      }

      // Navigate to default route
      if (defaultRoute) {
        navigate(defaultRoute, {}, 'forward')
      }
    },

    destroy(): void {
      beforeGuards.clear()
      afterHandlers.clear()
      history.length = 0
      historyIndex = -1
      currentView = null
      app = null
    }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create a simple route definition.
 */
export function defineRoute(
  path: string,
  component: (params: RouteParams, query: RouteQuery) => Node,
  options?: Partial<Omit<RouteDefinition, 'path' | 'component'>>
): RouteDefinition {
  return {
    path,
    component,
    ...options
  }
}

/**
 * Create route definitions from a simple map.
 */
export function defineRoutes(
  routeMap: Record<string, (params: RouteParams, query: RouteQuery) => Node>
): RouteDefinition[] {
  return Object.entries(routeMap).map(([path, component]) => ({
    path,
    component
  }))
}
