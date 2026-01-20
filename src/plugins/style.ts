/**
 * @oxog/tui - Style Plugin
 * @packageDocumentation
 *
 * Core plugin that provides theme and style resolution capabilities.
 * This plugin manages the global theme and resolves styles for nodes.
 */

import type { Plugin, TUIApp, Theme, ThemeColors, Color } from '../types'
import { DEFAULT_THEME } from '../constants'
import { parseColorWithDefault } from '../utils/color'

// ============================================================
// Types
// ============================================================

/**
 * Style plugin options.
 */
export interface StylePluginOptions {
  /** Custom theme */
  theme?: Partial<Theme>
  /** Debug mode */
  debug?: boolean
}

/**
 * Style plugin API exposed to the app.
 */
export interface StylePluginAPI {
  /** Get the current theme */
  getTheme(): Theme
  /** Set the theme */
  setTheme(theme: Partial<Theme>): void
  /** Get a theme color */
  getColor(name: keyof ThemeColors): Color
  /** Resolve color string to packed number */
  resolveColor(color: Color | undefined, defaultColor: number): number
}

// ============================================================
// Implementation
// ============================================================

/**
 * Create a complete theme by merging with defaults.
 */
function createTheme(partial?: Partial<Theme>): Theme {
  if (!partial) return { ...DEFAULT_THEME }

  /* c8 ignore start */
  return {
    colors: {
      ...DEFAULT_THEME.colors,
      ...(partial.colors ?? {})
    },
    borders: {
      ...DEFAULT_THEME.borders,
      ...(partial.borders ?? {})
    },
    spacing: {
      ...DEFAULT_THEME.spacing,
      ...(partial.spacing ?? {})
    }
  /* c8 ignore stop */
  }
}

/**
 * Create the style plugin.
 *
 * @param options - Plugin options
 * @returns Style plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { stylePlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [stylePlugin({
 *     theme: {
 *       colors: {
 *         primary: '#00ff00',
 *         background: '#1a1a1a'
 *       }
 *     }
 *   })]
 * })
 *
 * // Access theme colors
 * const primary = app.style.getColor('primary')
 * ```
 */
export function stylePlugin(options: StylePluginOptions = {}): Plugin {
  const { debug = false } = options

  let theme: Theme = createTheme(options.theme)
  let app: TUIApp | null = null

  /**
   * Resolve any color to packed RGBA.
   */
  function resolveColor(color: Color | undefined, defaultColor: number): number {
    if (color === undefined) return defaultColor
    return parseColorWithDefault(color, defaultColor)
  }

  return {
    name: 'style',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { style: StylePluginAPI }).style = {
        getTheme: () => ({ ...theme }),

        setTheme: (newTheme: Partial<Theme>) => {
          theme = createTheme(newTheme)

          if (debug) {
            console.error('[style] theme updated')
          }

          // Mark app as dirty to trigger re-render
          if (
            app &&
            typeof (app as unknown as { markDirty?: () => void }).markDirty === 'function'
          ) {
            ;(app as unknown as { markDirty: () => void }).markDirty()
          }
        },

        getColor: (name: keyof ThemeColors) => theme.colors[name],

        resolveColor: (color: Color | undefined, defaultColor: number) =>
          resolveColor(color, defaultColor)
      }

      if (debug) {
        console.error('[style] plugin installed with theme:', theme)
      }
    },

    destroy(): void {
      app = null
    }
  }
}

/**
 * Pre-defined dark theme.
 */
export const darkTheme: Partial<Theme> = {
  colors: {
    primary: '#61afef',
    secondary: '#98c379',
    background: '#282c34',
    surface: '#21252b',
    text: '#abb2bf',
    textMuted: '#5c6370',
    border: '#5c6370',
    error: '#e06c75',
    warning: '#e5c07b',
    success: '#98c379',
    info: '#56b6c2',
    inputBg: '#1d2025',
    inputBorder: '#5c6370',
    inputFocusBorder: '#61afef',
    selectHighlight: '#3a3f4b',
    tableHeaderBg: '#21252b',
    tableStripeBg: '#2c313a'
  },
  borders: {
    default: 'single',
    focus: 'double',
    input: 'single'
  }
}

/**
 * Pre-defined light theme.
 */
export const lightTheme: Partial<Theme> = {
  colors: {
    primary: '#4078f2',
    secondary: '#50a14f',
    background: '#fafafa',
    surface: '#f0f0f0',
    text: '#383a42',
    textMuted: '#a0a1a7',
    border: '#a0a1a7',
    error: '#e45649',
    warning: '#c18401',
    success: '#50a14f',
    info: '#0184bc',
    inputBg: '#ffffff',
    inputBorder: '#a0a1a7',
    inputFocusBorder: '#4078f2',
    selectHighlight: '#e5e5e6',
    tableHeaderBg: '#f0f0f0',
    tableStripeBg: '#f5f5f5'
  },
  borders: {
    default: 'single',
    focus: 'double',
    input: 'single'
  }
}

/**
 * Pre-defined dracula theme.
 */
export const draculaTheme: Partial<Theme> = {
  colors: {
    primary: '#bd93f9',
    secondary: '#50fa7b',
    background: '#282a36',
    surface: '#21222c',
    text: '#f8f8f2',
    textMuted: '#6272a4',
    border: '#44475a',
    error: '#ff5555',
    warning: '#ffb86c',
    success: '#50fa7b',
    info: '#8be9fd',
    inputBg: '#21222c',
    inputBorder: '#44475a',
    inputFocusBorder: '#bd93f9',
    selectHighlight: '#44475a',
    tableHeaderBg: '#21222c',
    tableStripeBg: '#2c2e3a'
  },
  borders: {
    default: 'single',
    focus: 'double',
    input: 'single'
  }
}

/**
 * Pre-defined nord theme.
 */
export const nordTheme: Partial<Theme> = {
  colors: {
    primary: '#88c0d0',
    secondary: '#a3be8c',
    background: '#2e3440',
    surface: '#3b4252',
    text: '#eceff4',
    textMuted: '#4c566a',
    border: '#434c5e',
    error: '#bf616a',
    warning: '#ebcb8b',
    success: '#a3be8c',
    info: '#81a1c1',
    inputBg: '#3b4252',
    inputBorder: '#434c5e',
    inputFocusBorder: '#88c0d0',
    selectHighlight: '#434c5e',
    tableHeaderBg: '#3b4252',
    tableStripeBg: '#373e4c'
  },
  borders: {
    default: 'rounded',
    focus: 'double',
    input: 'rounded'
  }
}
