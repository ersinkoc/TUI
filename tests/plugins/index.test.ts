/**
 * @oxog/tui - Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  minimalPlugins,
  standardPlugins,
  fullPlugins,
  stylePlugin,
  darkTheme,
  lightTheme,
  draculaTheme,
  nordTheme,
  rendererPlugin,
  layoutPlugin,
  inputPlugin,
  focusPlugin,
  mousePlugin,
  screenPlugin,
  animationPlugin,
  scrollPlugin,
  clipboardPlugin,
  easings
} from '../../src/plugins'
import type { TUIApp, Plugin } from '../../src/types'
import { DEFAULT_THEME, DEFAULT_FG } from '../../src/constants'

// Mock TUI App
function createMockApp(): TUIApp {
  return {
    width: 80,
    height: 24,
    root: null,
    focused: null,
    theme: DEFAULT_THEME,
    isRunning: true,
    mount: vi.fn(),
    unmount: vi.fn(),
    start: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    markDirty: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
    emit: vi.fn(),
    onQuit: vi.fn(),
    use: vi.fn(),
    getPlugin: vi.fn()
  } as unknown as TUIApp
}

describe('Plugin Presets', () => {
  describe('minimalPlugins', () => {
    it('returns array of plugins', () => {
      const plugins = minimalPlugins()

      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(4)
    })

    it('includes core plugins', () => {
      const plugins = minimalPlugins()
      const names = plugins.map(p => p.name)

      expect(names).toContain('renderer')
      expect(names).toContain('layout')
      expect(names).toContain('style')
      expect(names).toContain('screen')
    })

    it('all plugins have install method', () => {
      const plugins = minimalPlugins()

      for (const plugin of plugins) {
        expect(plugin.install).toBeInstanceOf(Function)
      }
    })
  })

  describe('standardPlugins', () => {
    it('returns array of plugins', () => {
      const plugins = standardPlugins()

      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(6)
    })

    it('includes standard plugins', () => {
      const plugins = standardPlugins()
      const names = plugins.map(p => p.name)

      expect(names).toContain('renderer')
      expect(names).toContain('layout')
      expect(names).toContain('style')
      expect(names).toContain('screen')
      expect(names).toContain('input')
      expect(names).toContain('focus')
    })
  })

  describe('fullPlugins', () => {
    it('returns array of plugins', () => {
      const plugins = fullPlugins()

      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(7)
    })

    it('includes all plugins', () => {
      const plugins = fullPlugins()
      const names = plugins.map(p => p.name)

      expect(names).toContain('renderer')
      expect(names).toContain('layout')
      expect(names).toContain('style')
      expect(names).toContain('screen')
      expect(names).toContain('input')
      expect(names).toContain('mouse')
      expect(names).toContain('focus')
    })
  })
})

describe('stylePlugin', () => {
  it('creates a style plugin', () => {
    const plugin = stylePlugin()

    expect(plugin.name).toBe('style')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    expect(styleApp.style).toBeDefined()
    expect(styleApp.style.getTheme).toBeInstanceOf(Function)
    expect(styleApp.style.setTheme).toBeInstanceOf(Function)
    expect(styleApp.style.getColor).toBeInstanceOf(Function)
    expect(styleApp.style.resolveColor).toBeInstanceOf(Function)
  })

  it('returns default theme', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    const theme = styleApp.style.getTheme()

    expect(theme.colors).toBeDefined()
    expect(theme.borders).toBeDefined()
    expect(theme.spacing).toBeDefined()
  })

  it('accepts custom theme', () => {
    const plugin = stylePlugin({
      theme: {
        colors: {
          primary: '#ff0000'
        }
      }
    })
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    expect(styleApp.style.getColor('primary')).toBe('#ff0000')
  })

  it('sets theme', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    styleApp.style.setTheme({
      colors: {
        primary: '#00ff00'
      }
    })

    expect(styleApp.style.getColor('primary')).toBe('#00ff00')
  })

  it('resolves color', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    const color = styleApp.style.resolveColor('#ff0000', DEFAULT_FG)

    expect(color).toBeDefined()
    expect(typeof color).toBe('number')
  })

  it('resolves undefined color to default', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    const color = styleApp.style.resolveColor(undefined, DEFAULT_FG)

    expect(color).toBe(DEFAULT_FG)
  })

  it('marks app dirty on theme change', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)

    const styleApp = app as TUIApp & { style: any }
    styleApp.style.setTheme({ colors: { primary: '#ff00ff' } })

    expect(app.markDirty).toHaveBeenCalled()
  })

  it('supports debug mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plugin = stylePlugin({ debug: true })
    const app = createMockApp()

    plugin.install(app)

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('destroy cleans up', () => {
    const plugin = stylePlugin()
    const app = createMockApp()

    plugin.install(app)
    plugin.destroy?.()

    // Should not throw
  })
})

describe('Theme Presets', () => {
  it('darkTheme is defined', () => {
    expect(darkTheme).toBeDefined()
    expect(darkTheme.colors).toBeDefined()
  })

  it('lightTheme is defined', () => {
    expect(lightTheme).toBeDefined()
    expect(lightTheme.colors).toBeDefined()
  })

  it('draculaTheme is defined', () => {
    expect(draculaTheme).toBeDefined()
    expect(draculaTheme.colors).toBeDefined()
  })

  it('nordTheme is defined', () => {
    expect(nordTheme).toBeDefined()
    expect(nordTheme.colors).toBeDefined()
  })

  it('themes have required color keys', () => {
    const themes = [darkTheme, lightTheme, draculaTheme, nordTheme]
    const requiredKeys = ['primary', 'secondary', 'background', 'text', 'error', 'success']

    for (const theme of themes) {
      for (const key of requiredKeys) {
        expect(theme.colors[key as keyof typeof theme.colors]).toBeDefined()
      }
    }
  })
})

describe('layoutPlugin', () => {
  it('creates a layout plugin', () => {
    const plugin = layoutPlugin()

    expect(plugin.name).toBe('layout')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = layoutPlugin()
    const app = createMockApp()

    plugin.install(app)

    const layoutApp = app as TUIApp & { layout: any }
    expect(layoutApp.layout).toBeDefined()
  })

  it('has beforeRender hook', () => {
    const plugin = layoutPlugin()

    expect(plugin.beforeRender).toBeInstanceOf(Function)
  })

  it('accepts options', () => {
    const plugin = layoutPlugin({ debug: true })

    expect(plugin.name).toBe('layout')
  })
})

describe('inputPlugin', () => {
  it('creates an input plugin', () => {
    const plugin = inputPlugin()

    expect(plugin.name).toBe('input')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = inputPlugin()
    const app = createMockApp()

    plugin.install(app)

    const inputApp = app as TUIApp & { input: any }
    expect(inputApp.input).toBeDefined()
  })

  it('accepts options', () => {
    const plugin = inputPlugin({ debug: true })

    expect(plugin.name).toBe('input')
  })
})

describe('focusPlugin', () => {
  it('creates a focus plugin', () => {
    const plugin = focusPlugin()

    expect(plugin.name).toBe('focus')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = focusPlugin()
    const app = createMockApp()

    plugin.install(app)

    const focusApp = app as TUIApp & { focus: any }
    expect(focusApp.focus).toBeDefined()
  })
})

describe('mousePlugin', () => {
  it('creates a mouse plugin', () => {
    const plugin = mousePlugin()

    expect(plugin.name).toBe('mouse')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = mousePlugin()
    const app = createMockApp()

    plugin.install(app)

    const mouseApp = app as TUIApp & { mouse: any }
    expect(mouseApp.mouse).toBeDefined()
  })

  it('accepts options', () => {
    const plugin = mousePlugin({ debug: true })

    expect(plugin.name).toBe('mouse')
  })
})

describe('screenPlugin', () => {
  it('creates a screen plugin', () => {
    const plugin = screenPlugin()

    expect(plugin.name).toBe('screen')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = screenPlugin()
    const app = createMockApp()

    plugin.install(app)

    const screenApp = app as TUIApp & { screen: any }
    expect(screenApp.screen).toBeDefined()
  })

  it('has onResize hook', () => {
    const plugin = screenPlugin()

    expect(plugin.onResize).toBeInstanceOf(Function)
  })
})

describe('animationPlugin', () => {
  it('creates an animation plugin', () => {
    const plugin = animationPlugin()

    expect(plugin.name).toBe('animation')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = animationPlugin()
    const app = createMockApp()

    plugin.install(app)

    const animApp = app as TUIApp & { animation: any }
    expect(animApp.animation).toBeDefined()
  })

  it('accepts options', () => {
    const plugin = animationPlugin({ debug: true })

    expect(plugin.name).toBe('animation')
  })
})

describe('scrollPlugin', () => {
  it('creates a scroll plugin', () => {
    const plugin = scrollPlugin()

    expect(plugin.name).toBe('scroll')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = scrollPlugin()
    const app = createMockApp()

    plugin.install(app)

    const scrollApp = app as TUIApp & { scroll: any }
    expect(scrollApp.scroll).toBeDefined()
  })
})

describe('clipboardPlugin', () => {
  it('creates a clipboard plugin', () => {
    const plugin = clipboardPlugin()

    expect(plugin.name).toBe('clipboard')
    expect(plugin.install).toBeInstanceOf(Function)
  })

  it('installs and exposes API', () => {
    const plugin = clipboardPlugin()
    const app = createMockApp()

    plugin.install(app)

    const clipApp = app as TUIApp & { clipboard: any }
    expect(clipApp.clipboard).toBeDefined()
  })
})

describe('easings', () => {
  it('exports easing functions', () => {
    expect(easings).toBeDefined()
    expect(easings.linear).toBeInstanceOf(Function)
    expect(easings.easeInQuad).toBeInstanceOf(Function)
    expect(easings.easeOutQuad).toBeInstanceOf(Function)
    expect(easings.easeInOutQuad).toBeInstanceOf(Function)
    expect(easings.easeInCubic).toBeInstanceOf(Function)
    expect(easings.easeOutCubic).toBeInstanceOf(Function)
    expect(easings.easeInOutCubic).toBeInstanceOf(Function)
    expect(easings.easeOutElastic).toBeInstanceOf(Function)
    expect(easings.easeOutBounce).toBeInstanceOf(Function)
  })

  it('linear returns correct values', () => {
    expect(easings.linear(0)).toBe(0)
    expect(easings.linear(0.5)).toBe(0.5)
    expect(easings.linear(1)).toBe(1)
  })

  it('easeInQuad returns correct values', () => {
    expect(easings.easeInQuad(0)).toBe(0)
    expect(easings.easeInQuad(0.5)).toBe(0.25)
    expect(easings.easeInQuad(1)).toBe(1)
  })

  it('easeOutQuad returns correct values', () => {
    expect(easings.easeOutQuad(0)).toBe(0)
    expect(easings.easeOutQuad(0.5)).toBe(0.75)
    expect(easings.easeOutQuad(1)).toBe(1)
  })

  it('easeInOutQuad returns correct values', () => {
    expect(easings.easeInOutQuad(0)).toBe(0)
    expect(easings.easeInOutQuad(0.25)).toBe(0.125)
    expect(easings.easeInOutQuad(0.5)).toBe(0.5)
    expect(easings.easeInOutQuad(0.75)).toBe(0.875)
    expect(easings.easeInOutQuad(1)).toBe(1)
  })

  it('easeInCubic returns correct values', () => {
    expect(easings.easeInCubic(0)).toBe(0)
    expect(easings.easeInCubic(0.5)).toBe(0.125)
    expect(easings.easeInCubic(1)).toBe(1)
  })

  it('easeOutCubic returns correct values', () => {
    expect(easings.easeOutCubic(0)).toBe(0)
    expect(easings.easeOutCubic(1)).toBe(1)
  })

  it('easeInOutCubic returns correct values', () => {
    expect(easings.easeInOutCubic(0)).toBe(0)
    expect(easings.easeInOutCubic(0.25)).toBeCloseTo(0.0625, 5)
    expect(easings.easeInOutCubic(0.5)).toBeCloseTo(0.5, 5)
    expect(easings.easeInOutCubic(0.75)).toBeCloseTo(0.9375, 5)
    expect(easings.easeInOutCubic(1)).toBe(1)
  })

  it('easeOutElastic returns correct values', () => {
    expect(easings.easeOutElastic(0)).toBe(0)
    expect(easings.easeOutElastic(1)).toBe(1)
    // Middle value should oscillate
    const mid = easings.easeOutElastic(0.5)
    expect(mid).toBeGreaterThan(0)
  })

  it('easeOutBounce returns correct values', () => {
    expect(easings.easeOutBounce(0)).toBe(0)
    expect(easings.easeOutBounce(1)).toBeCloseTo(1, 5)
    // Test different segments
    expect(easings.easeOutBounce(0.2)).toBeGreaterThan(0)
    expect(easings.easeOutBounce(0.5)).toBeGreaterThan(0)
    expect(easings.easeOutBounce(0.8)).toBeGreaterThan(0)
    expect(easings.easeOutBounce(0.95)).toBeGreaterThan(0)
  })
})
