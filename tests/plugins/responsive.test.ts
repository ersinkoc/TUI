import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  responsivePlugin,
  defaultBreakpoints,
  responsiveStyles,
  responsiveLayout,
  terminalPresets
} from '../../src/plugins/responsive'
import type { ResponsivePluginAPI } from '../../src/plugins/responsive'
import type { TUIApp } from '../../src/types'

// Mock TUIApp
function createMockApp(width = 80, height = 24): TUIApp & { responsive?: ResponsivePluginAPI } {
  const resizeHandlers: ((w: number, h: number) => void)[] = []

  return {
    use: vi.fn().mockReturnThis(),
    mount: vi.fn().mockReturnThis(),
    unmount: vi.fn().mockReturnThis(),
    start: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockReturnThis(),
    markDirty: vi.fn(),
    on: vi.fn((event: string, handler: (w: number, h: number) => void) => {
      if (event === 'resize') {
        resizeHandlers.push(handler)
      }
      return () => {
        const idx = resizeHandlers.indexOf(handler)
        if (idx !== -1) resizeHandlers.splice(idx, 1)
      }
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, w: number, h: number) => {
      if (event === 'resize') {
        for (const h of resizeHandlers) {
          h(w, h)
        }
      }
    }),
    onQuit: vi.fn().mockReturnThis(),
    getPlugin: vi.fn(),
    width,
    height,
    isRunning: false,
    root: null,
    focused: null,
    theme: {} as any,
    // Helper to trigger resize
    _triggerResize: (w: number, h: number) => {
      for (const handler of resizeHandlers) {
        handler(w, h)
      }
    }
  } as TUIApp & { responsive?: ResponsivePluginAPI; _triggerResize: (w: number, h: number) => void }
}

describe('responsivePlugin', () => {
  describe('installation', () => {
    it('should install and expose responsive API', () => {
      const app = createMockApp()
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive).toBeDefined()
      expect(typeof app.responsive!.current).toBe('function')
      expect(typeof app.responsive!.width).toBe('function')
      expect(typeof app.responsive!.height).toBe('function')
      expect(typeof app.responsive!.is).toBe('function')
      expect(typeof app.responsive!.isAtLeast).toBe('function')
      expect(typeof app.responsive!.isAtMost).toBe('function')
      expect(typeof app.responsive!.isBetween).toBe('function')
      expect(typeof app.responsive!.matches).toBe('function')
      expect(typeof app.responsive!.orientation).toBe('function')
      expect(typeof app.responsive!.onChange).toBe('function')
      expect(typeof app.responsive!.resolve).toBe('function')
      expect(typeof app.responsive!.getBreakpoints).toBe('function')
      expect(typeof app.responsive!.addBreakpoint).toBe('function')
      expect(typeof app.responsive!.removeBreakpoint).toBe('function')
    })

    it('should have correct plugin metadata', () => {
      const plugin = responsivePlugin()
      expect(plugin.name).toBe('responsive')
      expect(plugin.version).toBe('1.0.0')
    })
  })

  describe('breakpoint detection', () => {
    it('should detect xs breakpoint', () => {
      const app = createMockApp(30, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('xs')
    })

    it('should detect sm breakpoint', () => {
      const app = createMockApp(50, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('sm')
    })

    it('should detect md breakpoint', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('md')
    })

    it('should detect lg breakpoint', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('lg')
    })

    it('should detect xl breakpoint', () => {
      const app = createMockApp(140, 40)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('xl')
    })

    it('should detect 2xl breakpoint', () => {
      const app = createMockApp(200, 50)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.current()).toBe('2xl')
    })
  })

  describe('breakpoint comparison', () => {
    it('should check exact breakpoint match', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.is('md')).toBe(true)
      expect(app.responsive!.is('lg')).toBe(false)
    })

    it('should check isAtLeast', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.isAtLeast('xs')).toBe(true)
      expect(app.responsive!.isAtLeast('sm')).toBe(true)
      expect(app.responsive!.isAtLeast('md')).toBe(true)
      expect(app.responsive!.isAtLeast('lg')).toBe(true)
      expect(app.responsive!.isAtLeast('xl')).toBe(false)
    })

    it('should check isAtMost', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.isAtMost('xs')).toBe(false)
      expect(app.responsive!.isAtMost('sm')).toBe(false)
      expect(app.responsive!.isAtMost('md')).toBe(true)
      expect(app.responsive!.isAtMost('lg')).toBe(true)
      expect(app.responsive!.isAtMost('xl')).toBe(true)
    })

    it('should check isBetween', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.isBetween('sm', 'lg')).toBe(true)
      expect(app.responsive!.isBetween('xs', 'sm')).toBe(false)
      expect(app.responsive!.isBetween('lg', 'xl')).toBe(false)
    })
  })

  describe('media queries', () => {
    it('should match minWidth query', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.matches({ minWidth: 80 })).toBe(true)
      expect(app.responsive!.matches({ minWidth: 120 })).toBe(false)
    })

    it('should match maxWidth query', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.matches({ maxWidth: 120 })).toBe(true)
      expect(app.responsive!.matches({ maxWidth: 80 })).toBe(false)
    })

    it('should match height queries', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.matches({ minHeight: 20 })).toBe(true)
      expect(app.responsive!.matches({ minHeight: 40 })).toBe(false)
      expect(app.responsive!.matches({ maxHeight: 40 })).toBe(true)
      expect(app.responsive!.matches({ maxHeight: 20 })).toBe(false)
    })

    it('should match orientation query', () => {
      const landscapeApp = createMockApp(100, 30)
      const plugin1 = responsivePlugin()
      plugin1.install(landscapeApp)

      expect(landscapeApp.responsive!.matches({ orientation: 'landscape' })).toBe(true)
      expect(landscapeApp.responsive!.matches({ orientation: 'portrait' })).toBe(false)

      const portraitApp = createMockApp(30, 100)
      const plugin2 = responsivePlugin()
      plugin2.install(portraitApp)

      expect(portraitApp.responsive!.matches({ orientation: 'portrait' })).toBe(true)
      expect(portraitApp.responsive!.matches({ orientation: 'landscape' })).toBe(false)
    })

    it('should match combined queries', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.matches({ minWidth: 80, maxWidth: 120 })).toBe(true)
      expect(app.responsive!.matches({ minWidth: 80, maxWidth: 90 })).toBe(false)
    })
  })

  describe('orientation', () => {
    it('should detect landscape', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.orientation()).toBe('landscape')
    })

    it('should detect portrait', () => {
      const app = createMockApp(30, 100)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.orientation()).toBe('portrait')
    })

    it('should detect square', () => {
      const app = createMockApp(50, 50)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.orientation()).toBe('square')
    })
  })

  describe('breakpoint change handlers', () => {
    it('should notify on breakpoint change', () => {
      const app = createMockApp(70, 20) as TUIApp & { responsive?: ResponsivePluginAPI; _triggerResize: (w: number, h: number) => void }
      const plugin = responsivePlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.responsive!.onChange(handler)

      // Trigger resize to a different breakpoint (100 is within lg: 80-120)
      app._triggerResize(100, 30)
      plugin.onResize?.(100, 30)

      expect(handler).toHaveBeenCalledWith('lg', 'md', 100, 30)
    })

    it('should not notify if breakpoint stays the same', () => {
      const app = createMockApp(70, 20) as TUIApp & { responsive?: ResponsivePluginAPI; _triggerResize: (w: number, h: number) => void }
      const plugin = responsivePlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.responsive!.onChange(handler)

      // Trigger resize within same breakpoint
      app._triggerResize(75, 25)
      plugin.onResize?.(75, 25)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should allow unsubscribing from changes', () => {
      const app = createMockApp(70, 20) as TUIApp & { responsive?: ResponsivePluginAPI; _triggerResize: (w: number, h: number) => void }
      const plugin = responsivePlugin()
      plugin.install(app)

      const handler = vi.fn()
      const unsubscribe = app.responsive!.onChange(handler)

      unsubscribe()

      app._triggerResize(120, 30)
      plugin.onResize?.(120, 30)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('responsive values', () => {
    it('should resolve exact breakpoint match', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      const result = app.responsive!.resolve(
        { xs: 1, sm: 2, md: 3, lg: 4 },
        0
      )

      expect(result).toBe(3)
    })

    it('should fall back to smaller breakpoint', () => {
      const app = createMockApp(120, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      const result = app.responsive!.resolve(
        { xs: 1, md: 3 },
        0
      )

      expect(result).toBe(3) // Falls back to md
    })

    it('should return default if no match', () => {
      const app = createMockApp(30, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      const result = app.responsive!.resolve(
        { md: 3, lg: 4 },
        0
      )

      expect(result).toBe(0) // No xs or sm defined, use default
    })

    it('should return non-object values as-is', () => {
      const app = createMockApp(70, 20)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.resolve(42, 0)).toBe(42)
      expect(app.responsive!.resolve('test', '')).toBe('test')
      expect(app.responsive!.resolve([1, 2, 3], [])).toEqual([1, 2, 3])
    })
  })

  describe('custom breakpoints', () => {
    it('should use custom breakpoints', () => {
      const app = createMockApp(150, 40)
      const plugin = responsivePlugin({
        breakpoints: [
          { name: 'tiny', minWidth: 0, maxWidth: 50 },
          { name: 'small', minWidth: 50, maxWidth: 100 },
          { name: 'medium', minWidth: 100, maxWidth: 150 },
          { name: 'large', minWidth: 150 }
        ]
      })
      plugin.install(app)

      expect(app.responsive!.current()).toBe('large')
    })

    it('should add breakpoints dynamically', () => {
      const app = createMockApp(200, 50) as TUIApp & { responsive?: ResponsivePluginAPI; _triggerResize: (w: number, h: number) => void }
      const plugin = responsivePlugin()
      plugin.install(app)

      app.responsive!.addBreakpoint({ name: '3xl', minWidth: 200 })

      app._triggerResize(200, 50)
      plugin.onResize?.(200, 50)

      expect(app.responsive!.current()).toBe('3xl')
    })

    it('should remove breakpoints', () => {
      const app = createMockApp(200, 50)
      const plugin = responsivePlugin()
      plugin.install(app)

      app.responsive!.removeBreakpoint('2xl')

      const breakpoints = app.responsive!.getBreakpoints()
      expect(breakpoints.find(b => b.name === '2xl')).toBeUndefined()
    })
  })

  describe('dimensions', () => {
    it('should return current width', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.width()).toBe(100)
    })

    it('should return current height', () => {
      const app = createMockApp(100, 30)
      const plugin = responsivePlugin()
      plugin.install(app)

      expect(app.responsive!.height()).toBe(30)
    })
  })
})

describe('defaultBreakpoints', () => {
  it('should have all standard breakpoints', () => {
    expect(defaultBreakpoints).toHaveLength(6)
    expect(defaultBreakpoints.map(b => b.name)).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl'])
  })

  it('should be sorted by minWidth', () => {
    for (let i = 1; i < defaultBreakpoints.length; i++) {
      expect(defaultBreakpoints[i].minWidth).toBeGreaterThan(defaultBreakpoints[i - 1].minWidth)
    }
  })
})

describe('responsiveStyles', () => {
  it('should pass through styles object', () => {
    const styles = responsiveStyles({
      width: { xs: '100%', md: '50%' },
      padding: { xs: 1, lg: 3 }
    })

    expect(styles.width).toEqual({ xs: '100%', md: '50%' })
    expect(styles.padding).toEqual({ xs: 1, lg: 3 })
  })
})

describe('responsiveLayout', () => {
  it('should pass through layout config', () => {
    const layout = responsiveLayout({
      columns: { xs: 1, md: 2, lg: 3 },
      gap: { xs: 1, md: 2 },
      direction: { xs: 'column', md: 'row' }
    })

    expect(layout.columns).toEqual({ xs: 1, md: 2, lg: 3 })
    expect(layout.gap).toEqual({ xs: 1, md: 2 })
    expect(layout.direction).toEqual({ xs: 'column', md: 'row' })
  })
})

describe('terminalPresets', () => {
  it('should have standard terminal preset', () => {
    expect(terminalPresets.standard).toEqual({ width: 80, height: 24 })
  })

  it('should have wide terminal preset', () => {
    expect(terminalPresets.wide).toEqual({ width: 120, height: 30 })
  })

  it('should have fullHD preset', () => {
    expect(terminalPresets.fullHD).toEqual({ width: 180, height: 45 })
  })

  it('should have minimal preset', () => {
    expect(terminalPresets.minimal).toEqual({ width: 40, height: 12 })
  })

  it('should have vscode preset', () => {
    expect(terminalPresets.vscode).toEqual({ width: 100, height: 20 })
  })
})
