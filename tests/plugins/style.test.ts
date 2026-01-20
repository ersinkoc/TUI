/**
 * @oxog/tui - Style Plugin Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  stylePlugin,
  darkTheme,
  lightTheme,
  draculaTheme,
  nordTheme
} from '../../src/plugins/style'
import type { TUIApp } from '../../src/types'

// Mock TUI App
function createMockApp(): TUIApp {
  return {
    width: 80,
    height: 24,
    root: null,
    focused: null,
    theme: {} as any,
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

describe('stylePlugin', () => {
  describe('plugin creation', () => {
    it('creates a style plugin', () => {
      const plugin = stylePlugin()

      expect(plugin.name).toBe('style')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.install).toBeInstanceOf(Function)
      expect(plugin.destroy).toBeInstanceOf(Function)
    })

    it('accepts theme option', () => {
      const plugin = stylePlugin({
        theme: {
          colors: {
            primary: '#ff0000'
          }
        }
      })

      expect(plugin.name).toBe('style')
    })

    it('accepts debug option', () => {
      const plugin = stylePlugin({ debug: true })
      expect(plugin.name).toBe('style')
    })
  })

  describe('install', () => {
    it('exposes style API on app', () => {
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

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = stylePlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[style] plugin installed'),
        expect.any(Object)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('getTheme', () => {
    it('returns default theme when no custom theme provided', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      const theme = styleApp.style.getTheme()

      expect(theme.colors).toBeDefined()
      expect(theme.borders).toBeDefined()
      expect(theme.spacing).toBeDefined()
    })

    it('returns custom theme merged with defaults', () => {
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
      const theme = styleApp.style.getTheme()

      expect(theme.colors.primary).toBe('#ff0000')
      // Should still have other default colors
      expect(theme.colors.background).toBeDefined()
    })

    it('returns a copy of the theme', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      const theme1 = styleApp.style.getTheme()
      const theme2 = styleApp.style.getTheme()

      expect(theme1).not.toBe(theme2)
    })
  })

  describe('setTheme', () => {
    it('updates the theme', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      styleApp.style.setTheme({
        colors: {
          primary: '#00ff00'
        }
      })

      const theme = styleApp.style.getTheme()
      expect(theme.colors.primary).toBe('#00ff00')
    })

    it('marks app as dirty', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      styleApp.style.setTheme({
        colors: {
          primary: '#00ff00'
        }
      })

      expect(app.markDirty).toHaveBeenCalled()
    })

    it('logs in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = stylePlugin({ debug: true })
      const app = createMockApp()

      plugin.install(app)
      consoleSpy.mockClear()

      const styleApp = app as TUIApp & { style: any }
      styleApp.style.setTheme({
        colors: {
          primary: '#00ff00'
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith('[style] theme updated')
      consoleSpy.mockRestore()
    })

    it('handles app without markDirty method', () => {
      const plugin = stylePlugin()
      const app = createMockApp()
      delete (app as any).markDirty

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      // Should not throw
      styleApp.style.setTheme({
        colors: {
          primary: '#00ff00'
        }
      })
    })
  })

  describe('getColor', () => {
    it('returns theme color by name', () => {
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
  })

  describe('resolveColor', () => {
    it('resolves hex color to packed value', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      const result = styleApp.style.resolveColor('#ff0000', 0)

      // Packed color is a 32-bit integer (can be negative due to signed representation)
      expect(typeof result).toBe('number')
      expect(result).not.toBe(0)
    })

    it('returns default when color is undefined', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      const result = styleApp.style.resolveColor(undefined, 12345)

      expect(result).toBe(12345)
    })

    it('resolves named color', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)

      const styleApp = app as TUIApp & { style: any }
      const result = styleApp.style.resolveColor('red', 0)

      expect(typeof result).toBe('number')
      expect(result).not.toBe(0)
    })
  })

  describe('destroy', () => {
    it('cleans up internal state', () => {
      const plugin = stylePlugin()
      const app = createMockApp()

      plugin.install(app)
      plugin.destroy!()

      // Should not throw
    })
  })
})

describe('pre-defined themes', () => {
  it('has darkTheme with colors', () => {
    expect(darkTheme.colors).toBeDefined()
    expect(darkTheme.colors!.primary).toBeDefined()
    expect(darkTheme.colors!.background).toBeDefined()
    expect(darkTheme.borders).toBeDefined()
  })

  it('has lightTheme with colors', () => {
    expect(lightTheme.colors).toBeDefined()
    expect(lightTheme.colors!.primary).toBeDefined()
    expect(lightTheme.colors!.background).toBeDefined()
    expect(lightTheme.borders).toBeDefined()
  })

  it('has draculaTheme with colors', () => {
    expect(draculaTheme.colors).toBeDefined()
    expect(draculaTheme.colors!.primary).toBeDefined()
    expect(draculaTheme.colors!.background).toBeDefined()
    expect(draculaTheme.borders).toBeDefined()
  })

  it('has nordTheme with colors and rounded borders', () => {
    expect(nordTheme.colors).toBeDefined()
    expect(nordTheme.colors!.primary).toBeDefined()
    expect(nordTheme.borders).toBeDefined()
    expect(nordTheme.borders!.default).toBe('rounded')
  })
})
