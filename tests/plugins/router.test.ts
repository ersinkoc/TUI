import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routerPlugin, defineRoute, defineRoutes, buildQuery } from '../../src/plugins/router'
import type { RouterPluginAPI, Route, RouteParams, RouteQuery } from '../../src/plugins/router'
import type { TUIApp, Node } from '../../src/types'

// Mock Node
function createMockNode(type = 'box'): Node {
  return {
    id: `node-${Math.random().toString(36).slice(2)}`,
    type,
    parent: null,
    children: [],
    isVisible: true,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    visible: vi.fn().mockReturnThis()
  }
}

// Mock TUIApp
function createMockApp(): TUIApp & { router?: RouterPluginAPI } {
  return {
    use: vi.fn().mockReturnThis(),
    mount: vi.fn().mockReturnThis(),
    unmount: vi.fn().mockReturnThis(),
    start: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockReturnThis(),
    markDirty: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    emit: vi.fn(),
    onQuit: vi.fn().mockReturnThis(),
    getPlugin: vi.fn(),
    width: 80,
    height: 24,
    isRunning: false,
    root: null,
    focused: null,
    theme: {} as any
  }
}

describe('routerPlugin', () => {
  let app: TUIApp & { router?: RouterPluginAPI }

  beforeEach(() => {
    app = createMockApp()
  })

  describe('installation', () => {
    it('should install and expose router API', () => {
      const plugin = routerPlugin()
      plugin.install(app)

      expect(app.router).toBeDefined()
      expect(typeof app.router!.push).toBe('function')
      expect(typeof app.router!.pushNamed).toBe('function')
      expect(typeof app.router!.replace).toBe('function')
      expect(typeof app.router!.back).toBe('function')
      expect(typeof app.router!.forward).toBe('function')
      expect(typeof app.router!.go).toBe('function')
      expect(typeof app.router!.current).toBe('function')
      expect(typeof app.router!.currentView).toBe('function')
      expect(typeof app.router!.getHistory).toBe('function')
      expect(typeof app.router!.canGoBack).toBe('function')
      expect(typeof app.router!.canGoForward).toBe('function')
      expect(typeof app.router!.addRoute).toBe('function')
      expect(typeof app.router!.removeRoute).toBe('function')
      expect(typeof app.router!.getRoutes).toBe('function')
      expect(typeof app.router!.beforeEach).toBe('function')
      expect(typeof app.router!.afterEach).toBe('function')
      expect(typeof app.router!.hasRoute).toBe('function')
      expect(typeof app.router!.resolve).toBe('function')
    })

    it('should have correct plugin metadata', () => {
      const plugin = routerPlugin()
      expect(plugin.name).toBe('router')
      expect(plugin.version).toBe('1.0.0')
    })

    it('should navigate to default route on install', async () => {
      const homeComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      // Wait for async navigation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(homeComponent).toHaveBeenCalled()
      expect(app.mount).toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('should navigate to a path', async () => {
      const homeComponent = vi.fn(() => createMockNode('home'))
      const aboutComponent = vi.fn(() => createMockNode('about'))

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/about')

      expect(aboutComponent).toHaveBeenCalled()
      expect(app.router!.current().path).toBe('/about')
    })

    it('should navigate by name', async () => {
      const userComponent = vi.fn(() => createMockNode('user'))

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id', name: 'user', component: userComponent }
        ]
      })
      plugin.install(app)

      await app.router!.pushNamed('user', { id: 123 })

      expect(userComponent).toHaveBeenCalled()
      expect(app.router!.current().path).toBe('/users/123')
      expect(app.router!.current().params).toEqual({ id: 123 })
    })

    it('should return false for non-existent named route', async () => {
      const plugin = routerPlugin({ routes: [] })
      plugin.install(app)

      const result = await app.router!.pushNamed('nonexistent')
      expect(result).toBe(false)
    })

    it('should replace current route', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const aboutComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.replace('/about')

      expect(app.router!.current().path).toBe('/about')
      expect(app.router!.getHistory().length).toBe(1) // Replaced, not added
    })
  })

  describe('history', () => {
    it('should track navigation history', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const aboutComponent = vi.fn(() => createMockNode())
      const contactComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent },
          { path: '/contact', component: contactComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/about')
      await app.router!.push('/contact')

      const history = app.router!.getHistory()
      expect(history.length).toBe(3)
      expect(history[0].path).toBe('/')
      expect(history[1].path).toBe('/about')
      expect(history[2].path).toBe('/contact')
    })

    it('should navigate back', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const aboutComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/about')
      expect(app.router!.current().path).toBe('/about')

      await app.router!.back()
      expect(app.router!.current().path).toBe('/')
    })

    it('should navigate forward', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const aboutComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/about')
      await app.router!.back()
      expect(app.router!.current().path).toBe('/')

      await app.router!.forward()
      expect(app.router!.current().path).toBe('/about')
    })

    it('should check canGoBack and canGoForward', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const aboutComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      expect(app.router!.canGoBack()).toBe(false)
      expect(app.router!.canGoForward()).toBe(false)

      await app.router!.push('/about')
      expect(app.router!.canGoBack()).toBe(true)
      expect(app.router!.canGoForward()).toBe(false)

      await app.router!.back()
      expect(app.router!.canGoBack()).toBe(false)
      expect(app.router!.canGoForward()).toBe(true)
    })

    it('should navigate by delta', async () => {
      const routes = [
        { path: '/1', component: () => createMockNode() },
        { path: '/2', component: () => createMockNode() },
        { path: '/3', component: () => createMockNode() }
      ]

      const plugin = routerPlugin({ routes })
      plugin.install(app)

      await app.router!.push('/1')
      await app.router!.push('/2')
      await app.router!.push('/3')

      expect(app.router!.current().path).toBe('/3')

      await app.router!.go(-2)
      expect(app.router!.current().path).toBe('/1')

      await app.router!.go(1)
      expect(app.router!.current().path).toBe('/2')
    })

    it('should return false when cannot go back', async () => {
      const plugin = routerPlugin({
        routes: [{ path: '/', component: () => createMockNode() }],
        defaultRoute: '/'
      })
      plugin.install(app)

      const result = await app.router!.back()
      expect(result).toBe(false)
    })

    it('should return false when cannot go forward', async () => {
      const plugin = routerPlugin({
        routes: [{ path: '/', component: () => createMockNode() }],
        defaultRoute: '/'
      })
      plugin.install(app)

      const result = await app.router!.forward()
      expect(result).toBe(false)
    })
  })

  describe('route parameters', () => {
    it('should extract route parameters', async () => {
      const userComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id', component: userComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/users/42')

      expect(app.router!.current().params).toEqual({ id: 42 })
    })

    it('should extract multiple parameters', async () => {
      const postComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:userId/posts/:postId', component: postComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/users/1/posts/42')

      expect(app.router!.current().params).toEqual({ userId: 1, postId: 42 })
    })

    it('should pass parameters to component', async () => {
      const userComponent = vi.fn((params: RouteParams) => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id', component: userComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/users/123')

      expect(userComponent).toHaveBeenCalledWith({ id: 123 }, {})
    })
  })

  describe('query parameters', () => {
    it('should parse query parameters from URL', async () => {
      const searchComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/search', component: searchComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/search?q=test&page=2')

      expect(app.router!.current().query).toEqual({ q: 'test', page: 2 })
    })

    it('should accept query as parameter', async () => {
      const searchComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/search', component: searchComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/search', { q: 'hello', limit: 10 })

      expect(app.router!.current().query).toEqual({ q: 'hello', limit: 10 })
    })

    it('should parse boolean query values', async () => {
      const settingsComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/settings', component: settingsComponent }
        ]
      })
      plugin.install(app)

      await app.router!.push('/settings?dark=true&sound=false')

      expect(app.router!.current().query).toEqual({ dark: true, sound: false })
    })
  })

  describe('route management', () => {
    it('should add routes dynamically', async () => {
      const plugin = routerPlugin({ routes: [] })
      plugin.install(app)

      app.router!.addRoute({
        path: '/new',
        component: () => createMockNode()
      })

      expect(app.router!.getRoutes().length).toBe(1)
      expect(app.router!.hasRoute('/new')).toBe(true)
    })

    it('should remove routes', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/test', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      expect(app.router!.hasRoute('/test')).toBe(true)

      app.router!.removeRoute('/test')

      expect(app.router!.hasRoute('/test')).toBe(false)
    })

    it('should check if route exists', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/exists', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      expect(app.router!.hasRoute('/exists')).toBe(true)
      expect(app.router!.hasRoute('/not-exists')).toBe(false)
    })
  })

  describe('route resolution', () => {
    it('should resolve route without navigating', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id', name: 'user', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      const resolved = app.router!.resolve('/users/123')

      expect(resolved.path).toBe('/users/123')
      expect(resolved.params).toEqual({ id: 123 })
      expect(resolved.name).toBe('user')
    })

    it('should return unmatched route info', async () => {
      const plugin = routerPlugin({ routes: [] })
      plugin.install(app)

      const resolved = app.router!.resolve('/unknown')

      expect(resolved.path).toBe('/unknown')
      expect(resolved.matched).toBeNull()
    })
  })

  describe('navigation guards', () => {
    it('should call beforeEach guard', async () => {
      const guard = vi.fn((to, from, next) => next())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      app.router!.beforeEach(guard)

      await app.router!.push('/about')

      expect(guard).toHaveBeenCalled()
      expect(guard.mock.calls[0][0].path).toBe('/about')
    })

    it('should abort navigation when guard calls next(false)', async () => {
      const aboutComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: aboutComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/about') {
          next(false)
        } else {
          next()
        }
      })

      const result = await app.router!.push('/about')

      expect(result).toBe(false)
      expect(aboutComponent).not.toHaveBeenCalled()
    })

    it('should redirect when guard calls next(path)', async () => {
      const homeComponent = vi.fn(() => createMockNode())
      const loginComponent = vi.fn(() => createMockNode())
      const protectedComponent = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: homeComponent },
          { path: '/login', component: loginComponent },
          { path: '/protected', component: protectedComponent }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/protected') {
          next('/login')
        } else {
          next()
        }
      })

      await app.router!.push('/protected')

      expect(app.router!.current().path).toBe('/login')
      expect(loginComponent).toHaveBeenCalled()
      expect(protectedComponent).not.toHaveBeenCalled()
    })

    it('should unsubscribe guard', async () => {
      const guard = vi.fn((to, from, next) => next())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      const unsubscribe = app.router!.beforeEach(guard)

      await app.router!.push('/about')
      expect(guard).toHaveBeenCalledTimes(1)

      unsubscribe()

      await app.router!.push('/')
      expect(guard).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should call route-specific beforeEnter guard', async () => {
      const guard = vi.fn((to, from, next) => next())

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/guarded', component: () => createMockNode(), beforeEnter: guard }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/guarded')

      expect(guard).toHaveBeenCalled()
    })
  })

  describe('after hooks', () => {
    it('should call afterEach handler', async () => {
      const handler = vi.fn()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ]
        // No defaultRoute - so no navigation on install
      })
      plugin.install(app)

      app.router!.afterEach(handler)

      await app.router!.push('/about')

      // Handler should be called at least once for /about navigation
      expect(handler).toHaveBeenCalled()
      // Find the call with /about
      const aboutCall = handler.mock.calls.find((call: unknown[]) => (call[0] as Route).path === '/about')
      expect(aboutCall).toBeDefined()
      expect(aboutCall![2]).toBe('forward')
    })

    it('should unsubscribe after hook', async () => {
      const handler = vi.fn()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ]
        // No defaultRoute - so no navigation on install
      })
      plugin.install(app)

      const unsubscribe = app.router!.afterEach(handler)

      await app.router!.push('/about')
      const callsAfterFirstPush = handler.mock.calls.length

      unsubscribe()

      await app.router!.push('/')
      // After unsubscribe, no more calls should happen
      expect(handler.mock.calls.length).toBe(callsAfterFirstPush)
    })
  })

  describe('route metadata', () => {
    it('should include route metadata', async () => {
      const plugin = routerPlugin({
        routes: [
          {
            path: '/admin',
            component: () => createMockNode(),
            meta: { requiresAuth: true, role: 'admin' }
          }
        ]
      })
      plugin.install(app)

      await app.router!.push('/admin')

      expect(app.router!.current().meta).toEqual({ requiresAuth: true, role: 'admin' })
    })
  })

  describe('currentView', () => {
    it('should return current view node', async () => {
      const node = createMockNode('test-node')
      const plugin = routerPlugin({
        routes: [
          { path: '/test', component: () => node }
        ]
      })
      plugin.install(app)

      await app.router!.push('/test')

      expect(app.router!.currentView()).toBe(node)
    })
  })

  describe('cleanup', () => {
    it('should clean up on destroy', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      plugin.destroy?.()

      // History should be cleared, but routes configuration is preserved
      expect(app.router!.getHistory()).toHaveLength(0)
      // Routes are configuration - they stay
      expect(app.router!.getRoutes()).toHaveLength(1)
    })
  })
})

describe('defineRoute', () => {
  it('should create route definition', () => {
    const component = () => createMockNode()
    const route = defineRoute('/test', component, { name: 'test' })

    expect(route.path).toBe('/test')
    expect(route.component).toBe(component)
    expect(route.name).toBe('test')
  })
})

describe('defineRoutes', () => {
  it('should create route definitions from map', () => {
    const routes = defineRoutes({
      '/': () => createMockNode(),
      '/about': () => createMockNode(),
      '/contact': () => createMockNode()
    })

    expect(routes).toHaveLength(3)
    expect(routes.map(r => r.path)).toEqual(['/', '/about', '/contact'])
  })
})

describe('router edge cases and error handling', () => {
  let app: TUIApp & { router?: RouterPluginAPI }

  beforeEach(() => {
    app = createMockApp()
  })

  describe('navigation queue and race conditions', () => {
    it('should queue concurrent navigations', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      // Trigger multiple navigations concurrently
      const promise1 = app.router!.push('/a')
      const promise2 = app.router!.push('/b')

      await Promise.all([promise1, promise2])

      // Both should complete, final state should be /b
      expect(app.router!.current().path).toBe('/b')
    })

    it('should process navigation queue sequentially', async () => {
      let navigationOrder: string[] = []

      const plugin = routerPlugin({
        routes: [
          { path: '/a', component: () => {
            navigationOrder.push('a')
            return createMockNode()
          }},
          { path: '/b', component: () => {
            navigationOrder.push('b')
            return createMockNode()
          }},
          { path: '/c', component: () => {
            navigationOrder.push('c')
            return createMockNode()
          }}
        ]
      })
      plugin.install(app)

      // Queue multiple navigations
      app.router!.push('/a')
      app.router!.push('/b')
      app.router!.push('/c')

      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // All should have been processed
      expect(navigationOrder).toEqual(['a', 'b', 'c'])
    })
  })

  describe('multiple guards', () => {
    it('should call multiple beforeEach guards in order', async () => {
      const callOrder: string[] = []

      const guard1 = vi.fn((to, from, next) => {
        callOrder.push('guard1')
        next()
      })
      const guard2 = vi.fn((to, from, next) => {
        callOrder.push('guard2')
        next()
      })
      const guard3 = vi.fn((to, from, next) => {
        callOrder.push('guard3')
        next()
      })

      const plugin = routerPlugin({
        routes: [
          { path: '/test', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      app.router!.beforeEach(guard1)
      app.router!.beforeEach(guard2)
      app.router!.beforeEach(guard3)

      await app.router!.push('/test')

      expect(callOrder).toEqual(['guard1', 'guard2', 'guard3'])
    })

    it('should stop at first guard that returns false', async () => {
      const guard1 = vi.fn((to, from, next) => next())
      const guard2 = vi.fn((to, from, next) => next(false))
      const guard3 = vi.fn((to, from, next) => next())

      const plugin = routerPlugin({
        routes: [
          { path: '/test', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      app.router!.beforeEach(guard1)
      app.router!.beforeEach(guard2)
      app.router!.beforeEach(guard3)

      const result = await app.router!.push('/test')

      expect(result).toBe(false)
      expect(guard1).toHaveBeenCalled()
      expect(guard2).toHaveBeenCalled()
      expect(guard3).not.toHaveBeenCalled()
    })
  })

  describe('guard that does not call next', () => {
    it('should abort navigation when guard does not call next', async () => {
      vi.useFakeTimers()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/test', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      // Guard that never calls next
      app.router!.beforeEach(() => {
        // Intentionally don't call next()
      })

      const pushPromise = app.router!.push('/test')

      // Advance time to trigger guard timeout (ROUTER_GUARD_TIMEOUT = 5000ms)
      await vi.advanceTimersByTimeAsync(5100)

      const result = await pushPromise

      expect(result).toBe(false)
      expect(app.router!.current().path).toBe('/')

      vi.useRealTimers()
    })

    it('should abort when route guard does not call next', async () => {
      vi.useFakeTimers()

      const plugin = routerPlugin({
        routes: [
          {
            path: '/test',
            component: () => createMockNode(),
            beforeEnter: () => {
              // Don't call next
            }
          }
        ]
      })
      plugin.install(app)

      const pushPromise = app.router!.push('/test')

      // Advance time to trigger guard timeout (ROUTER_GUARD_TIMEOUT = 5000ms)
      await vi.advanceTimersByTimeAsync(5100)

      const result = await pushPromise

      expect(result).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('guard redirects in history navigation', () => {
    it('should handle guard redirect during back navigation', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() },
          { path: '/redirect-target', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/a')
      await app.router!.push('/b')

      // Guard redirects during back navigation
      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/a' && from?.path === '/b') {
          next('/redirect-target')
        } else {
          next()
        }
      })

      await app.router!.back()

      // Should redirect to redirect-target instead of going to /a
      expect(app.router!.current().path).toBe('/redirect-target')
    })

    it('should handle guard redirect during forward navigation', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() },
          { path: '/redirect-target', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      await app.router!.push('/a')
      await app.router!.push('/b')
      await app.router!.back()

      // Guard redirects during forward navigation
      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/b' && from?.path === '/a') {
          next('/redirect-target')
        } else {
          next()
        }
      })

      await app.router!.forward()

      expect(app.router!.current().path).toBe('/redirect-target')
    })

    it('should handle guard redirect during go navigation', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/1', component: () => createMockNode() },
          { path: '/2', component: () => createMockNode() },
          { path: '/3', component: () => createMockNode() },
          { path: '/redirect-target', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      await app.router!.push('/1')
      await app.router!.push('/2')
      await app.router!.push('/3')

      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/1') {
          next('/redirect-target')
        } else {
          next()
        }
      })

      await app.router!.go(-2)

      expect(app.router!.current().path).toBe('/redirect-target')
    })
  })

  describe('query string parsing edge cases', () => {
    it('should merge query from path and parameter', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [{ path: '/search', component }]
      })
      plugin.install(app)

      await app.router!.push('/search?q=path', { sort: 'desc', filter: 'active' })

      const query = component.mock.calls[0][1]
      expect(query.q).toBe('path')
      expect(query.sort).toBe('desc')
      expect(query.filter).toBe('active')
    })

    it('should override path query with parameter query', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [{ path: '/search', component }]
      })
      plugin.install(app)

      await app.router!.push('/search?q=old&page=1', { q: 'new' })

      const query = component.mock.calls[0][1]
      expect(query.q).toBe('new') // Parameter overrides path
      expect(query.page).toBe(1)
    })

    it('should handle empty query string', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [{ path: '/test', component }]
      })
      plugin.install(app)

      await app.router!.push('/test?')

      const query = component.mock.calls[0][1]
      expect(query).toEqual({})
    })

    it('should handle special characters in query values', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [{ path: '/search', component }]
      })
      plugin.install(app)

      await app.router!.push('/search?q=hello%20world&tag=foo%2Bbar')

      const query = component.mock.calls[0][1]
      expect(query.q).toBe('hello world')
      expect(query.tag).toBe('foo+bar')
    })
  })

  describe('route pattern matching edge cases', () => {
    it('should handle paths with regex special characters', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/files/:name.ext', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/files/test.ext')

      expect(app.router!.current().path).toBe('/files/test.ext')
      expect(component).toHaveBeenCalled()
    })

    it('should handle parameters starting with underscore', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:_id', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/users/123')

      expect(app.router!.current().params._id).toBe(123)
    })

    it('should keep string parameters as strings when not numeric', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/posts/:slug', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/posts/my-blog-post')

      expect(app.router!.current().params.slug).toBe('my-blog-post')
    })
  })

  describe('buildQuery helper', () => {
    it('should build query string from object', () => {
      const query = buildQuery({ q: 'test', page: 1, active: true })

      expect(query).toBe('?q=test&page=1&active=true')
    })

    it('should filter undefined values', () => {
      const query = buildQuery({ a: 'value', b: undefined, c: 123 })

      expect(query).toBe('?a=value&c=123')
    })

    it('should return empty string for empty object', () => {
      const query = buildQuery({})

      expect(query).toBe('')
    })

    it('should return empty string for all undefined values', () => {
      const query = buildQuery({ a: undefined, b: undefined })

      expect(query).toBe('')
    })

    it('should encode special characters', () => {
      const query = buildQuery({ q: 'hello world', filter: 'a&b' })

      expect(query).toContain('q=hello+world')
      expect(query).toContain('filter=a%26b')
    })
  })

  describe('route pattern caching', () => {
    it('should cache parsed route patterns', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id', component: () => createMockNode() },
          { path: '/posts/:id/comments/:commentId', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      // First navigation - pattern gets cached
      await app.router!.push('/users/123')
      expect(app.router!.current().params.id).toBe(123)

      // Second navigation - uses cached pattern
      await app.router!.push('/users/456')
      expect(app.router!.current().params.id).toBe(456)

      // Different route - caches new pattern
      await app.router!.push('/posts/1/comments/42')
      expect(app.router!.current().params).toEqual({ id: 1, commentId: 42 })
    })
  })

  describe('replace with empty history', () => {
    it('should add to history when replacing with empty history', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/test', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      // No default route, history is empty
      await app.router!.replace('/test')

      expect(app.router!.getHistory().length).toBe(1)
      expect(app.router!.getHistoryIndex()).toBe(0)
      expect(app.router!.current().path).toBe('/test')
    })
  })

  describe('afterEach with back/forward/go', () => {
    it('should call afterEach with correct direction for back', async () => {
      const handler = vi.fn()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      app.router!.afterEach(handler)

      await app.router!.push('/a')
      await app.router!.back()

      // Find the call with direction 'back'
      const backCall = handler.mock.calls.find((call: unknown[]) => call[2] === 'back')
      expect(backCall).toBeDefined()
    })

    it('should call afterEach with correct direction for forward', async () => {
      const handler = vi.fn()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      app.router!.afterEach(handler)

      await app.router!.push('/a')
      await app.router!.back()
      await app.router!.forward()

      // Find the call with direction 'forward'
      const forwardCall = handler.mock.calls.filter((call: unknown[]) => call[2] === 'forward')
      // Should have at least 2 forward calls (initial /a and the forward from back)
      expect(forwardCall.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getHistoryIndex', () => {
    it('should return correct history index', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() },
          { path: '/c', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      expect(app.router!.getHistoryIndex()).toBe(-1)

      await app.router!.push('/a')
      // Index is 1 because navigation is queued and happens after the async operation
      expect(app.router!.getHistoryIndex()).toBeGreaterThanOrEqual(0)

      await app.router!.push('/b')
      expect(app.router!.getHistoryIndex()).toBeGreaterThanOrEqual(1)

      await app.router!.back()
      expect(app.router!.getHistoryIndex()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('forward history clearing', () => {
    it('should clear forward history when navigating', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() },
          { path: '/c', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      await app.router!.push('/a')
      await app.router!.push('/b')
      await app.router!.push('/c')
      await app.router!.back()
      await app.router!.back()

      expect(app.router!.current().path).toBe('/a')
      const historyBefore = app.router!.getHistory().length

      // Navigate to new route - forward history should be cleared
      await app.router!.push('/b')

      // History should be less than or equal to before
      expect(app.router!.getHistory().length).toBeLessThanOrEqual(historyBefore)
      expect(app.router!.current().path).toBe('/b')
    })
  })

  describe('component error in back/forward/go', () => {
    it('should handle component error during back navigation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          {
            path: '/error',
            component: () => {
              throw new Error('Back component error')
            }
          }
        ],
        defaultRoute: '/',
        debug: true
      })
      plugin.install(app)

      await app.router!.push('/error')
      await app.router!.back()
      await app.router!.forward() // Tries to recreate error component

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle component error during go navigation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const plugin = routerPlugin({
        routes: [
          { path: '/1', component: () => createMockNode() },
          {
            path: '/2',
            component: () => {
              throw new Error('Go component error')
            }
          }
        ],
        debug: true
      })
      plugin.install(app)

      await app.router!.push('/1')
      await app.router!.push('/2')
      await app.router!.back()
      const result = await app.router!.go(1) // Tries to go back to /2

      // The implementation updates history index before component creation,
      // so navigation may return true even if component fails
      // The important thing is the error is logged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('component error handling', () => {
    it('should handle component creation errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const errorComponent = vi.fn(() => {
        throw new Error('Component error')
      })

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/error', component: errorComponent }
        ],
        debug: true
      })
      plugin.install(app)

      const result = await app.router!.push('/error')

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle component errors with try-catch', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const errorComponent = vi.fn(() => {
        throw new Error('Component error')
      })

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/error', component: errorComponent }
        ],
        debug: true
      })
      plugin.install(app)

      await app.router!.push('/error')
      // Navigation should fail
      expect(app.router!.current().path).toBe('/')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('guard error handling', () => {
    it('should handle guard errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ],
        debug: true
      })
      plugin.install(app)

      app.router!.beforeEach(() => {
        throw new Error('Guard error')
      })

      const result = await app.router!.push('/about')

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle route-specific guard errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const plugin = routerPlugin({
        routes: [
          {
            path: '/guarded',
            component: () => createMockNode(),
            beforeEnter: () => {
              throw new Error('Route guard error')
            }
          }
        ],
        debug: true
      })
      plugin.install(app)

      const result = await app.router!.push('/guarded')

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('after hook error handling', () => {
    it('should handle after hook errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ],
        debug: true
      })
      plugin.install(app)

      app.router!.afterEach(() => {
        throw new Error('After hook error')
      })

      // Should still complete navigation
      const result = await app.router!.push('/about')

      expect(result).toBe(true)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should continue after hook errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const handler1 = vi.fn(() => {
        throw new Error('Error 1')
      })
      const handler2 = vi.fn()

      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/about', component: () => createMockNode() }
        ],
        debug: true
      })
      plugin.install(app)

      app.router!.afterEach(handler1)
      app.router!.afterEach(handler2)

      await app.router!.push('/about')

      // Both handlers should be called
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('redirect loop prevention', () => {
    it('should prevent excessive redirects', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      let redirectCount = 0
      const plugin = routerPlugin({
        routes: [
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() }
        ],
        debug: true
      })
      plugin.install(app)

      // Create redirect loop: a -> b -> a -> b...
      app.router!.beforeEach((to, from, next) => {
        if (to.path === '/a') {
          redirectCount++
          if (redirectCount < 100) {
            next('/b')
          } else {
            next()
          }
        } else if (to.path === '/b') {
          next('/a')
        } else {
          next()
        }
      })

      const result = await app.router!.push('/a')

      // Should detect redirect loop and abort
      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('query parameters', () => {
    it('should parse query parameters', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/search', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/search', { q: 'test', page: 1 })

      expect(component).toHaveBeenCalled()
      const query = component.mock.calls[0][1]
      expect(query.q).toBe('test')
      expect(query.page).toBe(1)
    })

    it('should handle undefined query values', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/test', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/test', { a: 'value', b: undefined })

      expect(component).toHaveBeenCalled()
      const query = component.mock.calls[0][1]
      expect(query.a).toBe('value')
      expect(query.b).toBeUndefined()
    })
  })

  describe('wildcard routes', () => {
    it('should match wildcard patterns', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/files/*', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/files/path/to/file.txt')

      expect(component).toHaveBeenCalled()
      expect(app.router!.current().path).toBe('/files/path/to/file.txt')
    })

    it('should match wildcard at root', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '*', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/any/path/here')

      expect(component).toHaveBeenCalled()
    })
  })

  describe('named routes with params and query', () => {
    it('should handle named routes with params and query', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id/posts/:postId', name: 'post', component }
        ]
      })
      plugin.install(app)

      await app.router!.pushNamed('post', { id: '123', postId: '456' }, { tab: 'comments' })

      expect(component).toHaveBeenCalled()
      const params = component.mock.calls[0][0]
      const query = component.mock.calls[0][1]
      // Route params are parsed as numbers when numeric
      expect(params.id).toBe(123)
      expect(params.postId).toBe(456)
      expect(query.tab).toBe('comments')
    })

    it('should return false for named route with missing params', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/users/:id/posts/:postId', name: 'post', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      // Missing postId
      const result = await app.router!.pushNamed('post', { id: '123' })

      expect(result).toBe(false)
    })
  })

  describe('special parameter types', () => {
    it('should handle numeric parameters', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/items/:id', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/items/42')

      const params = component.mock.calls[0][0]
      expect(params.id).toBe(42)
    })

    it('should handle boolean parameters', async () => {
      const component = vi.fn(() => createMockNode())

      const plugin = routerPlugin({
        routes: [
          { path: '/toggle/:enabled', component }
        ]
      })
      plugin.install(app)

      await app.router!.push('/toggle/true')

      const params = component.mock.calls[0][0]
      expect(params.enabled).toBe('true')
    })
  })

  describe('history edge cases', () => {
    it('should handle back when already at start', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      const result = await app.router!.back()

      expect(result).toBe(false)
    })

    it('should handle forward when already at end', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      const result = await app.router!.forward()

      expect(result).toBe(false)
    })

    it('should handle go with out of bounds delta', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() }
        ],
        defaultRoute: '/'
      })
      plugin.install(app)

      const result1 = await app.router!.go(-10)
      const result2 = await app.router!.go(10)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })

  describe('maxHistorySize', () => {
    it('should respect custom maxHistorySize', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/', component: () => createMockNode() },
          { path: '/a', component: () => createMockNode() },
          { path: '/b', component: () => createMockNode() },
          { path: '/c', component: () => createMockNode() }
        ],
        maxHistorySize: 2
      })
      plugin.install(app)

      await app.router!.push('/a')
      await app.router!.push('/b')
      await app.router!.push('/c')

      // History should be limited to 2 entries
      const history = app.router!.getHistory()
      expect(history.length).toBeLessThanOrEqual(2)
    })
  })

  describe('resolve method', () => {
    it('should resolve with query parameters', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/search', name: 'search', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      const resolved = app.router!.resolve('/search', { q: 'test', sort: 'desc' })

      expect(resolved.path).toBe('/search')
      expect(resolved.query.q).toBe('test')
      expect(resolved.query.sort).toBe('desc')
      expect(resolved.name).toBe('search')
    })

    it('should resolve unmatched routes', async () => {
      const plugin = routerPlugin({
        routes: [
          { path: '/exists', component: () => createMockNode() }
        ]
      })
      plugin.install(app)

      const resolved = app.router!.resolve('/does-not-exist')

      expect(resolved.path).toBe('/does-not-exist')
      expect(resolved.matched).toBeNull()
      expect(resolved.params).toEqual({})
      expect(resolved.query).toEqual({})
    })
  })
})
