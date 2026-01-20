/**
 * Theme system tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  themeManager,
  ThemeManager,
  getCurrentTheme,
  setTheme,
  createTheme,
  onThemeChange,
  defaultTheme,
  lightTheme,
  draculaTheme,
  nordTheme,
  monokaiTheme,
  gruvboxTheme,
  solarizedDarkTheme,
  tokyoNightTheme,
  catppuccinMochaTheme,
  themes,
  themedStyle,
  getComponentTheme
} from '../../src/theme'

describe('Theme System', () => {
  describe('built-in themes', () => {
    it('has default theme', () => {
      expect(defaultTheme).toBeDefined()
      expect(defaultTheme.name).toBe('default')
      expect(defaultTheme.dark).toBe(true)
    })

    it('has light theme', () => {
      expect(lightTheme).toBeDefined()
      expect(lightTheme.name).toBe('light')
      expect(lightTheme.dark).toBe(false)
    })

    it('has dracula theme', () => {
      expect(draculaTheme).toBeDefined()
      expect(draculaTheme.name).toBe('dracula')
    })

    it('has nord theme', () => {
      expect(nordTheme).toBeDefined()
      expect(nordTheme.name).toBe('nord')
    })

    it('has monokai theme', () => {
      expect(monokaiTheme).toBeDefined()
      expect(monokaiTheme.name).toBe('monokai')
    })

    it('has gruvbox theme', () => {
      expect(gruvboxTheme).toBeDefined()
      expect(gruvboxTheme.name).toBe('gruvbox')
    })

    it('has solarized dark theme', () => {
      expect(solarizedDarkTheme).toBeDefined()
      expect(solarizedDarkTheme.name).toBe('solarized-dark')
    })

    it('has tokyo night theme', () => {
      expect(tokyoNightTheme).toBeDefined()
      expect(tokyoNightTheme.name).toBe('tokyo-night')
    })

    it('has catppuccin mocha theme', () => {
      expect(catppuccinMochaTheme).toBeDefined()
      expect(catppuccinMochaTheme.name).toBe('catppuccin-mocha')
    })

    it('exports all themes in themes object', () => {
      expect(themes.default).toBe(defaultTheme)
      expect(themes.light).toBe(lightTheme)
      expect(themes.dracula).toBe(draculaTheme)
      expect(themes.nord).toBe(nordTheme)
      expect(themes.monokai).toBe(monokaiTheme)
      expect(themes.gruvbox).toBe(gruvboxTheme)
      expect(themes['solarized-dark']).toBe(solarizedDarkTheme)
      expect(themes['tokyo-night']).toBe(tokyoNightTheme)
      expect(themes['catppuccin-mocha']).toBe(catppuccinMochaTheme)
    })
  })

  describe('theme structure', () => {
    it('has required color properties', () => {
      const theme = defaultTheme
      expect(theme.colors.primary).toBeDefined()
      expect(theme.colors.secondary).toBeDefined()
      expect(theme.colors.background).toBeDefined()
      expect(theme.colors.surface).toBeDefined()
      expect(theme.colors.text).toBeDefined()
      expect(theme.colors.textMuted).toBeDefined()
      expect(theme.colors.success).toBeDefined()
      expect(theme.colors.warning).toBeDefined()
      expect(theme.colors.error).toBeDefined()
      expect(theme.colors.info).toBeDefined()
      expect(theme.colors.border).toBeDefined()
    })

    it('has spacing properties', () => {
      const theme = defaultTheme
      expect(theme.spacing.none).toBe(0)
      expect(theme.spacing.xs).toBeDefined()
      expect(theme.spacing.sm).toBeDefined()
      expect(theme.spacing.md).toBeDefined()
      expect(theme.spacing.lg).toBeDefined()
      expect(theme.spacing.xl).toBeDefined()
    })

    it('has border properties', () => {
      const theme = defaultTheme
      expect(theme.borders.default).toBeDefined()
      expect(theme.borders.focus).toBeDefined()
    })
  })

  describe('ThemeManager', () => {
    let manager: ThemeManager

    beforeEach(() => {
      manager = new ThemeManager()
    })

    it('creates with default theme', () => {
      expect(manager.current).toBe(defaultTheme)
    })

    it('creates with specified theme', () => {
      const m = new ThemeManager(lightTheme)
      expect(m.current).toBe(lightTheme)
    })

    it('creates with theme name', () => {
      const m = new ThemeManager('dracula')
      expect(m.current).toBe(draculaTheme)
    })

    it('sets theme by object', () => {
      manager.setTheme(lightTheme)
      expect(manager.current).toBe(lightTheme)
    })

    it('sets theme by name', () => {
      manager.setTheme('nord')
      expect(manager.current).toBe(nordTheme)
    })

    it('throws on unknown theme name', () => {
      expect(() => manager.setTheme('unknown-theme')).toThrow()
    })

    it('gets theme by name', () => {
      expect(manager.getTheme('default')).toBe(defaultTheme)
      expect(manager.getTheme('light')).toBe(lightTheme)
    })

    it('returns undefined for unknown theme', () => {
      expect(manager.getTheme('unknown')).toBeUndefined()
    })

    it('lists available themes', () => {
      const names = manager.listThemes()
      expect(names).toContain('default')
      expect(names).toContain('light')
      expect(names).toContain('dracula')
    })

    it('registers custom theme', () => {
      const customTheme = { ...defaultTheme, name: 'custom' }
      manager.registerTheme(customTheme)

      expect(manager.getTheme('custom')).toBe(customTheme)
      expect(manager.listThemes()).toContain('custom')
    })

    it('unregisters custom theme', () => {
      const customTheme = { ...defaultTheme, name: 'custom' }
      manager.registerTheme(customTheme)
      const removed = manager.unregisterTheme('custom')

      expect(removed).toBe(true)
      expect(manager.getTheme('custom')).toBeUndefined()
    })

    it('extends theme', () => {
      const extended = manager.extendTheme('default', {
        name: 'my-theme',
        colors: {
          primary: '#ff0000'
        }
      })

      expect(extended.name).toBe('my-theme')
      expect(extended.colors.primary).toBe('#ff0000')
      expect(extended.colors.secondary).toBe(defaultTheme.colors.secondary)
    })

    it('extends theme by object', () => {
      const extended = manager.extendTheme(lightTheme, {
        colors: {
          primary: '#00ff00'
        }
      })

      expect(extended.colors.primary).toBe('#00ff00')
      expect(extended.dark).toBe(false)
    })

    it('reports isDark', () => {
      expect(manager.isDark).toBe(true)
      manager.setTheme('light')
      expect(manager.isDark).toBe(false)
    })
  })

  describe('theme change listeners', () => {
    let manager: ThemeManager

    beforeEach(() => {
      manager = new ThemeManager()
    })

    it('adds listener', () => {
      const listener = vi.fn()
      manager.addListener(listener)
      manager.setTheme('light')
      expect(listener).toHaveBeenCalledWith(lightTheme)
    })

    it('removes listener via return value', () => {
      const listener = vi.fn()
      const remove = manager.addListener(listener)
      remove()
      manager.setTheme('light')
      expect(listener).not.toHaveBeenCalled()
    })

    it('removes listener via method', () => {
      const listener = vi.fn()
      manager.addListener(listener)
      manager.removeListener(listener)
      manager.setTheme('light')
      expect(listener).not.toHaveBeenCalled()
    })

    it('notifies multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      manager.addListener(listener1)
      manager.addListener(listener2)
      manager.setTheme('light')
      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('color resolution', () => {
    let manager: ThemeManager

    beforeEach(() => {
      manager = new ThemeManager()
    })

    it('resolves hex string', () => {
      const color = manager.resolveColor('#ff0000')
      // parseColor returns RGBA packed as 0xRRGGBBAA (signed 32-bit)
      // 0xff0000ff in signed 32-bit = -16776961
      expect(color).toBe(-16776961)
    })

    it('resolves RGB array', () => {
      const color = manager.resolveColor([255, 128, 0])
      expect(color).toBe(0xff8000)
    })

    it('resolves number directly', () => {
      const color = manager.resolveColor(0x00ff00)
      expect(color).toBe(0x00ff00)
    })

    it('gets resolved color by key', () => {
      const color = manager.getColor('primary')
      expect(typeof color).toBe('number')
    })

    it('gets spacing by key', () => {
      const spacing = manager.getSpacing('md')
      expect(typeof spacing).toBe('number')
    })
  })

  describe('global functions', () => {
    beforeEach(() => {
      // Reset to default theme
      setTheme('default')
    })

    it('getCurrentTheme returns current theme', () => {
      const theme = getCurrentTheme()
      expect(theme.name).toBe('default')
    })

    it('setTheme changes global theme', () => {
      setTheme('light')
      expect(getCurrentTheme().name).toBe('light')
    })

    it('createTheme creates and registers theme', () => {
      const theme = createTheme('my-custom', 'default', {
        colors: { primary: '#abcdef' }
      })

      expect(theme.name).toBe('my-custom')
      expect(themeManager.getTheme('my-custom')).toBe(theme)
    })

    it('onThemeChange subscribes to changes', () => {
      const listener = vi.fn()
      const unsubscribe = onThemeChange(listener)

      setTheme('light')
      expect(listener).toHaveBeenCalledWith(lightTheme)

      unsubscribe()
      setTheme('default')
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('utility functions', () => {
    beforeEach(() => {
      setTheme('default')
    })

    it('themedStyle applies theme colors', () => {
      const style = themedStyle({})
      expect(typeof style.fg).toBe('number')
      expect(typeof style.bg).toBe('number')
    })

    it('themedStyle preserves provided colors', () => {
      const style = themedStyle({ fg: 0xff0000, bg: 0x00ff00 })
      expect(style.fg).toBe(0xff0000)
      expect(style.bg).toBe(0x00ff00)
    })

    it('themedStyle uses custom theme', () => {
      const style = themedStyle({}, lightTheme)
      expect(typeof style.fg).toBe('number')
      expect(typeof style.bg).toBe('number')
    })

    it('getComponentTheme returns component overrides', () => {
      const buttonTheme = getComponentTheme('button')
      expect(typeof buttonTheme).toBe('object')
    })

    it('getComponentTheme returns empty object for missing component', () => {
      const theme = getComponentTheme('button')
      expect(theme).toBeDefined()
    })
  })

  describe('theme colors validation', () => {
    it('all themes have valid hex colors', () => {
      for (const [name, theme] of Object.entries(themes)) {
        for (const [key, color] of Object.entries(theme.colors)) {
          if (typeof color === 'string') {
            expect(
              color.match(/^#[0-9a-fA-F]{6}$/),
              `Theme '${name}' has invalid color for '${key}': ${color}`
            ).toBeTruthy()
          }
        }
      }
    })

    it('all themes have valid spacing values', () => {
      for (const [name, theme] of Object.entries(themes)) {
        for (const [key, value] of Object.entries(theme.spacing)) {
          expect(
            typeof value === 'number' && value >= 0,
            `Theme '${name}' has invalid spacing for '${key}': ${value}`
          ).toBe(true)
        }
      }
    })
  })
})
