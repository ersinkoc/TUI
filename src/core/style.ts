/**
 * @oxog/tui - Style Resolution
 * @packageDocumentation
 */

import type { StyleResolver, CellStyle, Theme, ThemeColors, Node, StyleProps } from '../types'
import { parseColorWithDefault, DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import {
  ATTR_BOLD,
  ATTR_ITALIC,
  ATTR_UNDERLINE,
  ATTR_DIM,
  ATTR_STRIKETHROUGH,
  ATTR_INVERSE
} from '../constants'

// ============================================================
// Style Resolver Implementation
// ============================================================

/**
 * Create a style resolver.
 *
 * @param theme - Theme to use for resolving colors
 * @returns Style resolver instance
 *
 * @example
 * ```typescript
 * const resolver = createStyleResolver(defaultTheme)
 * const style = resolver.resolve(node)
 * ```
 */
export function createStyleResolver(theme: Theme): StyleResolver {
  // Cache parsed theme colors
  const themeColorCache = new Map<string, number>()

  const resolveThemeColor = (colorKey: keyof Theme['colors']): number => {
    const cacheKey = `theme:${colorKey}`
    const cached = themeColorCache.get(cacheKey)
    if (cached !== undefined) return cached

    const color = theme.colors[colorKey]
    const parsed = parseColorWithDefault(color, DEFAULT_FG)
    themeColorCache.set(cacheKey, parsed)
    return parsed
  }

  return {
    resolve(node: Node): CellStyle {
      const styleProps = getStyleProps(node)

      // Resolve foreground color
      let fg = DEFAULT_FG
      if (styleProps.color) {
        if (isThemeColorKey(styleProps.color)) {
          // Type guard narrows to keyof ThemeColors, no cast needed
          fg = resolveThemeColor(styleProps.color)
        } else {
          fg = parseColorWithDefault(styleProps.color, DEFAULT_FG)
        }
      }

      // Resolve background color
      let bg = DEFAULT_BG
      if (styleProps.bg) {
        if (isThemeColorKey(styleProps.bg)) {
          // Type guard narrows to keyof ThemeColors, no cast needed
          bg = resolveThemeColor(styleProps.bg)
        } else {
          bg = parseColorWithDefault(styleProps.bg, DEFAULT_BG)
        }
      }

      // Compute attributes
      const attrs = computeAttrs(styleProps)

      return { fg, bg, attrs }
    }
  }
}

/**
 * Compute attribute flags from style props.
 *
 * @param style - Style properties
 * @returns Attribute flags
 */
export function computeAttrs(style: StyleProps): number {
  let attrs = 0

  if (style.bold) attrs |= ATTR_BOLD
  if (style.italic) attrs |= ATTR_ITALIC
  if (style.underline) attrs |= ATTR_UNDERLINE
  if (style.dim) attrs |= ATTR_DIM
  if (style.strikethrough) attrs |= ATTR_STRIKETHROUGH
  if (style.inverse) attrs |= ATTR_INVERSE

  return attrs
}

/**
 * Get style props from a node.
 *
 * @param node - Node to get style from
 * @returns Style props
 */
function getStyleProps(node: Node): StyleProps {
  const anyNode = node as unknown as Record<string, unknown>
  /* c8 ignore next */
  return (anyNode._style as StyleProps) ?? {}
}

/**
 * All valid theme color keys, derived from ThemeColors interface.
 * This ensures type safety - if ThemeColors changes, TypeScript will catch it.
 */
const THEME_COLOR_KEYS: ReadonlySet<keyof ThemeColors> = new Set([
  'primary',
  'secondary',
  'background',
  'surface',
  'text',
  'textMuted',
  'border',
  'error',
  'warning',
  'success',
  'info',
  'inputBg',
  'inputBorder',
  'inputFocusBorder',
  'selectHighlight',
  'tableHeaderBg',
  'tableStripeBg'
] as const satisfies readonly (keyof ThemeColors)[])

/**
 * Check if a color value is a theme color key.
 * Type guard that narrows the type to keyof ThemeColors.
 *
 * @param color - Color value
 * @returns True if theme color key
 */
function isThemeColorKey(color: string): color is keyof ThemeColors {
  return THEME_COLOR_KEYS.has(color as keyof ThemeColors)
}

// ============================================================
// Style Utilities
// ============================================================

/**
 * Merge two style objects.
 *
 * @param base - Base style
 * @param override - Override style
 * @returns Merged style
 */
export function mergeStyles(base: StyleProps, override: Partial<StyleProps>): StyleProps {
  return { ...base, ...override }
}

/**
 * Merge two cell styles.
 *
 * @param base - Base cell style
 * @param override - Override cell style
 * @returns Merged cell style
 */
export function mergeCellStyles(base: CellStyle, override: Partial<CellStyle>): CellStyle {
  const result: CellStyle = {}
  const fg = override.fg ?? base.fg
  const bg = override.bg ?? base.bg
  const attrs = override.attrs ?? base.attrs
  if (fg !== undefined) result.fg = fg
  if (bg !== undefined) result.bg = bg
  if (attrs !== undefined) result.attrs = attrs
  return result
}

/**
 * Create a cell style from style props.
 *
 * @param props - Style properties
 * @returns Cell style
 */
export function createCellStyle(props: StyleProps): CellStyle {
  const fg = props.color ? parseColorWithDefault(props.color, DEFAULT_FG) : DEFAULT_FG
  const bg = props.bg ? parseColorWithDefault(props.bg, DEFAULT_BG) : DEFAULT_BG
  const attrs = computeAttrs(props)

  return { fg, bg, attrs }
}

/**
 * Apply style to a cell style.
 *
 * @param base - Base cell style
 * @param props - Style props to apply
 * @returns Modified cell style
 */
export function applyStyle(base: CellStyle, props: Partial<StyleProps>): CellStyle {
  let fg = base.fg
  let bg = base.bg
  let attrs = base.attrs

  if (props.color) {
    fg = parseColorWithDefault(props.color, fg ?? DEFAULT_FG)
  }

  if (props.bg) {
    bg = parseColorWithDefault(props.bg, bg ?? DEFAULT_BG)
  }

  if (props.bold !== undefined) {
    if (props.bold) attrs = (attrs ?? 0) | ATTR_BOLD
    else attrs = (attrs ?? 0) & ~ATTR_BOLD
  }

  if (props.italic !== undefined) {
    if (props.italic) attrs = (attrs ?? 0) | ATTR_ITALIC
    else attrs = (attrs ?? 0) & ~ATTR_ITALIC
  }

  if (props.underline !== undefined) {
    if (props.underline) attrs = (attrs ?? 0) | ATTR_UNDERLINE
    else attrs = (attrs ?? 0) & ~ATTR_UNDERLINE
  }

  if (props.dim !== undefined) {
    if (props.dim) attrs = (attrs ?? 0) | ATTR_DIM
    else attrs = (attrs ?? 0) & ~ATTR_DIM
  }

  if (props.strikethrough !== undefined) {
    if (props.strikethrough) attrs = (attrs ?? 0) | ATTR_STRIKETHROUGH
    else attrs = (attrs ?? 0) & ~ATTR_STRIKETHROUGH
  }

  if (props.inverse !== undefined) {
    if (props.inverse) attrs = (attrs ?? 0) | ATTR_INVERSE
    else attrs = (attrs ?? 0) & ~ATTR_INVERSE
  }

  const result: CellStyle = {}
  if (fg !== undefined) result.fg = fg
  if (bg !== undefined) result.bg = bg
  if (attrs !== undefined) result.attrs = attrs
  return result
}

/**
 * Check if style has any attributes.
 *
 * @param style - Cell style
 * @returns True if has attributes
 */
export function hasAttrs(style: CellStyle): boolean {
  return (style.attrs ?? 0) !== 0
}

/**
 * Check if style is bold.
 *
 * @param style - Cell style
 * @returns True if bold
 */
export function isBold(style: CellStyle): boolean {
  return ((style.attrs ?? 0) & ATTR_BOLD) !== 0
}

/**
 * Check if style is italic.
 *
 * @param style - Cell style
 * @returns True if italic
 */
export function isItalic(style: CellStyle): boolean {
  return ((style.attrs ?? 0) & ATTR_ITALIC) !== 0
}

/**
 * Check if style is underlined.
 *
 * @param style - Cell style
 * @returns True if underlined
 */
export function isUnderlined(style: CellStyle): boolean {
  return ((style.attrs ?? 0) & ATTR_UNDERLINE) !== 0
}

/**
 * Check if style is dimmed.
 *
 * @param style - Cell style
 * @returns True if dimmed
 */
export function isDimmed(style: CellStyle): boolean {
  return ((style.attrs ?? 0) & ATTR_DIM) !== 0
}

// ============================================================
// Style Constants
// ============================================================

/**
 * Default cell style (white on transparent).
 */
export const DEFAULT_CELL_STYLE: CellStyle = {
  fg: DEFAULT_FG,
  bg: DEFAULT_BG,
  attrs: 0
}

/**
 * Empty style props.
 */
export const EMPTY_STYLE_PROPS: StyleProps = {}
