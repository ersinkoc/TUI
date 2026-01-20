/**
 * @oxog/tui - Theming System
 * @packageDocumentation
 */

import { parseColor } from '../utils/color'

// ============================================================
// Types
// ============================================================

/**
 * Color value - can be hex string, RGB array, or number.
 */
export type ThemeColor = string | [number, number, number] | number

/**
 * Border style.
 */
export type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'bold' | 'ascii'

/**
 * Theme color palette.
 */
export interface ThemeColors {
  // Primary colors
  primary: ThemeColor
  secondary: ThemeColor
  accent: ThemeColor

  // Background colors
  background: ThemeColor
  surface: ThemeColor
  surfaceVariant: ThemeColor

  // Text colors
  text: ThemeColor
  textMuted: ThemeColor
  textInverse: ThemeColor

  // Semantic colors
  success: ThemeColor
  warning: ThemeColor
  error: ThemeColor
  info: ThemeColor

  // Interactive states
  hover: ThemeColor
  focus: ThemeColor
  selected: ThemeColor
  disabled: ThemeColor

  // Border colors
  border: ThemeColor
  borderFocus: ThemeColor

  // Scrollbar
  scrollbarTrack: ThemeColor
  scrollbarThumb: ThemeColor
}

/**
 * Theme spacing values.
 */
export interface ThemeSpacing {
  none: number
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

/**
 * Theme border configuration.
 */
export interface ThemeBorders {
  default: BorderStyle
  focus: BorderStyle
  radius: number
}

/**
 * Component-specific theme overrides.
 */
export interface ThemeComponents {
  button?: {
    primary?: { fg?: ThemeColor; bg?: ThemeColor }
    secondary?: { fg?: ThemeColor; bg?: ThemeColor }
    danger?: { fg?: ThemeColor; bg?: ThemeColor }
  }
  input?: {
    fg?: ThemeColor
    bg?: ThemeColor
    border?: ThemeColor
    focusBorder?: ThemeColor
    placeholder?: ThemeColor
  }
  select?: {
    fg?: ThemeColor
    bg?: ThemeColor
    selectedFg?: ThemeColor
    selectedBg?: ThemeColor
  }
  list?: {
    fg?: ThemeColor
    bg?: ThemeColor
    selectedFg?: ThemeColor
    selectedBg?: ThemeColor
    hoverBg?: ThemeColor
  }
  table?: {
    headerFg?: ThemeColor
    headerBg?: ThemeColor
    rowFg?: ThemeColor
    rowBg?: ThemeColor
    altRowBg?: ThemeColor
    border?: ThemeColor
  }
  tabs?: {
    fg?: ThemeColor
    bg?: ThemeColor
    activeFg?: ThemeColor
    activeBg?: ThemeColor
  }
  modal?: {
    fg?: ThemeColor
    bg?: ThemeColor
    backdropBg?: ThemeColor
    border?: ThemeColor
  }
  progress?: {
    trackFg?: ThemeColor
    trackBg?: ThemeColor
    fillFg?: ThemeColor
    fillBg?: ThemeColor
  }
  toast?: {
    successFg?: ThemeColor
    successBg?: ThemeColor
    errorFg?: ThemeColor
    errorBg?: ThemeColor
    warningFg?: ThemeColor
    warningBg?: ThemeColor
    infoFg?: ThemeColor
    infoBg?: ThemeColor
  }
  scrollbar?: {
    track?: ThemeColor
    thumb?: ThemeColor
    thumbHover?: ThemeColor
  }
  menu?: {
    fg?: ThemeColor
    bg?: ThemeColor
    selectedFg?: ThemeColor
    selectedBg?: ThemeColor
    separator?: ThemeColor
    disabledFg?: ThemeColor
  }
  tree?: {
    fg?: ThemeColor
    bg?: ThemeColor
    selectedFg?: ThemeColor
    selectedBg?: ThemeColor
    expandIcon?: ThemeColor
  }
}

/**
 * Complete theme definition.
 */
export interface Theme {
  /** Theme name */
  name: string
  /** Theme description */
  description?: string
  /** Is dark theme */
  dark: boolean
  /** Color palette */
  colors: ThemeColors
  /** Spacing values */
  spacing: ThemeSpacing
  /** Border configuration */
  borders: ThemeBorders
  /** Component overrides */
  components?: ThemeComponents
}

/**
 * Partial theme for extending.
 */
export type PartialTheme = Partial<Omit<Theme, 'colors' | 'spacing' | 'borders' | 'components'>> & {
  colors?: Partial<ThemeColors>
  spacing?: Partial<ThemeSpacing>
  borders?: Partial<ThemeBorders>
  components?: ThemeComponents
}

// ============================================================
// Default Theme
// ============================================================

/**
 * Default dark theme.
 */
export const defaultTheme: Theme = {
  name: 'default',
  description: 'Default dark theme',
  dark: true,
  colors: {
    primary: '#61afef',
    secondary: '#c678dd',
    accent: '#e5c07b',

    background: '#282c34',
    surface: '#21252b',
    surfaceVariant: '#2c323c',

    text: '#abb2bf',
    textMuted: '#5c6370',
    textInverse: '#282c34',

    success: '#98c379',
    warning: '#e5c07b',
    error: '#e06c75',
    info: '#61afef',

    hover: '#3e4451',
    focus: '#528bff',
    selected: '#3e4451',
    disabled: '#5c6370',

    border: '#3e4451',
    borderFocus: '#528bff',

    scrollbarTrack: '#21252b',
    scrollbarThumb: '#4b5263'
  },
  spacing: {
    none: 0,
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

// ============================================================
// Built-in Themes
// ============================================================

/**
 * Light theme.
 */
export const lightTheme: Theme = {
  name: 'light',
  description: 'Light theme',
  dark: false,
  colors: {
    primary: '#0066cc',
    secondary: '#6f42c1',
    accent: '#d97706',

    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceVariant: '#e9ecef',

    text: '#212529',
    textMuted: '#6c757d',
    textInverse: '#ffffff',

    success: '#198754',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#0dcaf0',

    hover: '#e9ecef',
    focus: '#0066cc',
    selected: '#cce5ff',
    disabled: '#adb5bd',

    border: '#dee2e6',
    borderFocus: '#0066cc',

    scrollbarTrack: '#f8f9fa',
    scrollbarThumb: '#adb5bd'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Dracula theme.
 */
export const draculaTheme: Theme = {
  name: 'dracula',
  description: 'Dracula color scheme',
  dark: true,
  colors: {
    primary: '#bd93f9',
    secondary: '#ff79c6',
    accent: '#f1fa8c',

    background: '#282a36',
    surface: '#21222c',
    surfaceVariant: '#343746',

    text: '#f8f8f2',
    textMuted: '#6272a4',
    textInverse: '#282a36',

    success: '#50fa7b',
    warning: '#ffb86c',
    error: '#ff5555',
    info: '#8be9fd',

    hover: '#44475a',
    focus: '#bd93f9',
    selected: '#44475a',
    disabled: '#6272a4',

    border: '#44475a',
    borderFocus: '#bd93f9',

    scrollbarTrack: '#21222c',
    scrollbarThumb: '#44475a'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Nord theme.
 */
export const nordTheme: Theme = {
  name: 'nord',
  description: 'Nord color scheme',
  dark: true,
  colors: {
    primary: '#88c0d0',
    secondary: '#b48ead',
    accent: '#ebcb8b',

    background: '#2e3440',
    surface: '#3b4252',
    surfaceVariant: '#434c5e',

    text: '#eceff4',
    textMuted: '#4c566a',
    textInverse: '#2e3440',

    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    info: '#81a1c1',

    hover: '#434c5e',
    focus: '#88c0d0',
    selected: '#434c5e',
    disabled: '#4c566a',

    border: '#4c566a',
    borderFocus: '#88c0d0',

    scrollbarTrack: '#3b4252',
    scrollbarThumb: '#4c566a'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Monokai theme.
 */
export const monokaiTheme: Theme = {
  name: 'monokai',
  description: 'Monokai color scheme',
  dark: true,
  colors: {
    primary: '#66d9ef',
    secondary: '#ae81ff',
    accent: '#e6db74',

    background: '#272822',
    surface: '#1e1f1c',
    surfaceVariant: '#3e3d32',

    text: '#f8f8f2',
    textMuted: '#75715e',
    textInverse: '#272822',

    success: '#a6e22e',
    warning: '#fd971f',
    error: '#f92672',
    info: '#66d9ef',

    hover: '#3e3d32',
    focus: '#66d9ef',
    selected: '#49483e',
    disabled: '#75715e',

    border: '#3e3d32',
    borderFocus: '#66d9ef',

    scrollbarTrack: '#1e1f1c',
    scrollbarThumb: '#3e3d32'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Gruvbox theme.
 */
export const gruvboxTheme: Theme = {
  name: 'gruvbox',
  description: 'Gruvbox color scheme',
  dark: true,
  colors: {
    primary: '#458588',
    secondary: '#b16286',
    accent: '#d79921',

    background: '#282828',
    surface: '#1d2021',
    surfaceVariant: '#3c3836',

    text: '#ebdbb2',
    textMuted: '#928374',
    textInverse: '#282828',

    success: '#98971a',
    warning: '#d79921',
    error: '#cc241d',
    info: '#458588',

    hover: '#3c3836',
    focus: '#458588',
    selected: '#504945',
    disabled: '#928374',

    border: '#504945',
    borderFocus: '#458588',

    scrollbarTrack: '#1d2021',
    scrollbarThumb: '#504945'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Solarized Dark theme.
 */
export const solarizedDarkTheme: Theme = {
  name: 'solarized-dark',
  description: 'Solarized Dark color scheme',
  dark: true,
  colors: {
    primary: '#268bd2',
    secondary: '#d33682',
    accent: '#b58900',

    background: '#002b36',
    surface: '#073642',
    surfaceVariant: '#094553',

    text: '#839496',
    textMuted: '#586e75',
    textInverse: '#002b36',

    success: '#859900',
    warning: '#b58900',
    error: '#dc322f',
    info: '#2aa198',

    hover: '#073642',
    focus: '#268bd2',
    selected: '#094553',
    disabled: '#586e75',

    border: '#586e75',
    borderFocus: '#268bd2',

    scrollbarTrack: '#073642',
    scrollbarThumb: '#586e75'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Tokyo Night theme.
 */
export const tokyoNightTheme: Theme = {
  name: 'tokyo-night',
  description: 'Tokyo Night color scheme',
  dark: true,
  colors: {
    primary: '#7aa2f7',
    secondary: '#bb9af7',
    accent: '#e0af68',

    background: '#1a1b26',
    surface: '#16161e',
    surfaceVariant: '#24283b',

    text: '#a9b1d6',
    textMuted: '#565f89',
    textInverse: '#1a1b26',

    success: '#9ece6a',
    warning: '#e0af68',
    error: '#f7768e',
    info: '#7dcfff',

    hover: '#24283b',
    focus: '#7aa2f7',
    selected: '#364a82',
    disabled: '#565f89',

    border: '#3b4261',
    borderFocus: '#7aa2f7',

    scrollbarTrack: '#16161e',
    scrollbarThumb: '#3b4261'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * Catppuccin Mocha theme.
 */
export const catppuccinMochaTheme: Theme = {
  name: 'catppuccin-mocha',
  description: 'Catppuccin Mocha color scheme',
  dark: true,
  colors: {
    primary: '#89b4fa',
    secondary: '#cba6f7',
    accent: '#f9e2af',

    background: '#1e1e2e',
    surface: '#181825',
    surfaceVariant: '#313244',

    text: '#cdd6f4',
    textMuted: '#6c7086',
    textInverse: '#1e1e2e',

    success: '#a6e3a1',
    warning: '#fab387',
    error: '#f38ba8',
    info: '#89dceb',

    hover: '#313244',
    focus: '#89b4fa',
    selected: '#45475a',
    disabled: '#6c7086',

    border: '#45475a',
    borderFocus: '#89b4fa',

    scrollbarTrack: '#181825',
    scrollbarThumb: '#45475a'
  },
  spacing: defaultTheme.spacing,
  borders: {
    default: 'single',
    focus: 'single',
    radius: 0
  }
}

/**
 * All built-in themes.
 */
export const themes: Record<string, Theme> = {
  default: defaultTheme,
  light: lightTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  monokai: monokaiTheme,
  gruvbox: gruvboxTheme,
  'solarized-dark': solarizedDarkTheme,
  'tokyo-night': tokyoNightTheme,
  'catppuccin-mocha': catppuccinMochaTheme
}

// ============================================================
// Theme Manager
// ============================================================

/**
 * Theme change listener.
 */
export type ThemeChangeListener = (theme: Theme) => void

/**
 * Theme manager class.
 */
export class ThemeManager {
  private _currentTheme: Theme
  private _customThemes: Map<string, Theme> = new Map()
  private _listeners: Set<ThemeChangeListener> = new Set()

  constructor(initialTheme?: Theme | string) {
    if (typeof initialTheme === 'string') {
      this._currentTheme = themes[initialTheme] ?? defaultTheme
    } else {
      this._currentTheme = initialTheme ?? defaultTheme
    }
  }

  /**
   * Get current theme.
   */
  get current(): Theme {
    return this._currentTheme
  }

  /**
   * Get theme by name.
   */
  getTheme(name: string): Theme | undefined {
    return this._customThemes.get(name) ?? themes[name]
  }

  /**
   * List all available theme names.
   */
  listThemes(): string[] {
    return [
      ...Object.keys(themes),
      ...this._customThemes.keys()
    ]
  }

  /**
   * Set current theme.
   */
  setTheme(theme: Theme | string): void {
    if (typeof theme === 'string') {
      const found = this.getTheme(theme)
      if (!found) {
        throw new Error(`Theme '${theme}' not found`)
      }
      this._currentTheme = found
    } else {
      this._currentTheme = theme
    }

    this.notifyListeners()
  }

  /**
   * Register a custom theme.
   */
  registerTheme(theme: Theme): void {
    this._customThemes.set(theme.name, theme)
  }

  /**
   * Unregister a custom theme.
   */
  unregisterTheme(name: string): boolean {
    return this._customThemes.delete(name)
  }

  /**
   * Create a theme by extending an existing one.
   */
  extendTheme(base: Theme | string, overrides: PartialTheme): Theme {
    const baseTheme = typeof base === 'string'
      ? (this.getTheme(base) ?? defaultTheme)
      : base

    return {
      ...baseTheme,
      ...overrides,
      name: overrides.name ?? `${baseTheme.name}-extended`,
      colors: {
        ...baseTheme.colors,
        ...overrides.colors
      },
      spacing: {
        ...baseTheme.spacing,
        ...overrides.spacing
      },
      borders: {
        ...baseTheme.borders,
        ...overrides.borders
      },
      components: {
        ...baseTheme.components,
        ...overrides.components
      }
    }
  }

  /**
   * Add a theme change listener.
   */
  addListener(listener: ThemeChangeListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  /**
   * Remove a theme change listener.
   */
  removeListener(listener: ThemeChangeListener): boolean {
    return this._listeners.delete(listener)
  }

  /**
   * Notify all listeners of theme change.
   */
  private notifyListeners(): void {
    for (const listener of this._listeners) {
      listener(this._currentTheme)
    }
  }

  /**
   * Resolve a theme color to a number.
   */
  resolveColor(color: ThemeColor): number {
    if (typeof color === 'number') {
      return color
    }
    if (typeof color === 'string') {
      return parseColor(color) ?? 0xffffff
    }
    // RGB array
    const [r, g, b] = color
    return (r << 16) | (g << 8) | b
  }

  /**
   * Get a resolved color from the current theme.
   */
  getColor(key: keyof ThemeColors): number {
    return this.resolveColor(this._currentTheme.colors[key])
  }

  /**
   * Get spacing value from the current theme.
   */
  getSpacing(key: keyof ThemeSpacing): number {
    return this._currentTheme.spacing[key]
  }

  /**
   * Check if current theme is dark.
   */
  get isDark(): boolean {
    return this._currentTheme.dark
  }
}

// ============================================================
// Global Instance
// ============================================================

/**
 * Global theme manager instance.
 */
export const themeManager = new ThemeManager()

/**
 * Get the current theme.
 */
export function getCurrentTheme(): Theme {
  return themeManager.current
}

/**
 * Set the current theme.
 */
export function setTheme(theme: Theme | string): void {
  themeManager.setTheme(theme)
}

/**
 * Create a custom theme.
 */
export function createTheme(name: string, base: Theme | string, overrides: PartialTheme): Theme {
  const theme = themeManager.extendTheme(base, { ...overrides, name })
  themeManager.registerTheme(theme)
  return theme
}

/**
 * Subscribe to theme changes.
 */
export function onThemeChange(listener: ThemeChangeListener): () => void {
  return themeManager.addListener(listener)
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Apply theme colors to a style object.
 */
export function themedStyle(
  base: { fg?: number; bg?: number },
  theme: Theme = themeManager.current
): { fg: number; bg: number } {
  return {
    fg: base.fg ?? themeManager.resolveColor(theme.colors.text),
    bg: base.bg ?? themeManager.resolveColor(theme.colors.background)
  }
}

/**
 * Get component-specific theme colors.
 */
export function getComponentTheme<K extends keyof ThemeComponents>(
  component: K,
  theme: Theme = themeManager.current
): NonNullable<ThemeComponents[K]> {
  return (theme.components?.[component] ?? {}) as NonNullable<ThemeComponents[K]>
}
