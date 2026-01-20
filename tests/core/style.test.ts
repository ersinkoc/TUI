/**
 * @oxog/tui - Style Tests
 */

import { describe, it, expect } from 'vitest'
import {
  createStyleResolver,
  computeAttrs,
  mergeStyles,
  mergeCellStyles,
  createCellStyle,
  applyStyle,
  hasAttrs,
  isBold,
  isItalic,
  isUnderlined,
  isDimmed,
  DEFAULT_CELL_STYLE,
  EMPTY_STYLE_PROPS
} from '../../src/core/style'
import type { Theme, Node, StyleProps, CellStyle } from '../../src/types'
import {
  ATTR_BOLD,
  ATTR_ITALIC,
  ATTR_UNDERLINE,
  ATTR_DIM,
  ATTR_STRIKETHROUGH,
  ATTR_INVERSE,
  DEFAULT_FG,
  DEFAULT_BG
} from '../../src/constants'

// Create mock theme
function createMockTheme(): Theme {
  return {
    colors: {
      primary: '#00ff00',
      secondary: '#0000ff',
      background: '#000000',
      surface: '#111111',
      text: '#ffffff',
      textMuted: '#888888',
      border: '#333333',
      error: '#ff0000',
      warning: '#ffaa00',
      success: '#00ff00',
      info: '#00aaff',
      inputBg: '#222222',
      inputBorder: '#444444',
      inputFocusBorder: '#00ff00',
      selectHighlight: '#00ff00',
      tableHeaderBg: '#333333',
      tableStripeBg: '#1a1a1a'
    },
    borders: {
      default: 'single',
      focus: 'double',
      input: 'rounded'
    },
    spacing: {
      xs: 1,
      sm: 2,
      md: 4,
      lg: 8,
      xl: 16
    }
  }
}

// Create mock node
function createMockNode(style: StyleProps = {}): Node {
  return {
    id: 'test-node',
    type: 'box',
    parent: null,
    children: [],
    isVisible: true,
    render: () => {},
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    _style: style
  } as unknown as Node
}

describe('createStyleResolver', () => {
  it('creates a style resolver', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)

    expect(resolver).toBeDefined()
    expect(resolver.resolve).toBeInstanceOf(Function)
  })

  it('resolves default style', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode()

    const style = resolver.resolve(node)

    expect(style).toEqual({
      fg: DEFAULT_FG,
      bg: DEFAULT_BG,
      attrs: 0
    })
  })

  it('resolves foreground color', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ color: '#ff0000' })

    const style = resolver.resolve(node)

    // 0xff0000ff as signed 32-bit = -16776961
    expect(style.fg).toBe(-16776961)
  })

  it('resolves background color', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ bg: '#00ff00' })

    const style = resolver.resolve(node)

    expect(style.bg).toBe(0x00ff00ff) // RGBA format
  })

  it('resolves theme color keys for foreground', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ color: 'primary' })

    const style = resolver.resolve(node)

    expect(style.fg).toBe(0x00ff00ff) // primary is #00ff00, RGBA format
  })

  it('resolves theme color keys for background', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ bg: 'error' })

    const style = resolver.resolve(node)

    // error is #ff0000 -> 0xff0000ff as signed 32-bit = -16776961
    expect(style.bg).toBe(-16776961)
  })

  it('caches theme colors', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)

    const node1 = createMockNode({ color: 'primary' })
    const node2 = createMockNode({ color: 'primary' })

    const style1 = resolver.resolve(node1)
    const style2 = resolver.resolve(node2)

    expect(style1.fg).toBe(style2.fg)
  })

  it('resolves bold attribute', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ bold: true })

    const style = resolver.resolve(node)

    expect(style.attrs).toBe(ATTR_BOLD)
  })

  it('resolves multiple attributes', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)
    const node = createMockNode({ bold: true, italic: true, underline: true })

    const style = resolver.resolve(node)

    expect(style.attrs).toBe(ATTR_BOLD | ATTR_ITALIC | ATTR_UNDERLINE)
  })

  it('resolves all theme color keys', () => {
    const theme = createMockTheme()
    const resolver = createStyleResolver(theme)

    const colorKeys = [
      'primary', 'secondary', 'background', 'surface', 'text', 'textMuted',
      'border', 'error', 'warning', 'success', 'info', 'inputBg',
      'inputBorder', 'inputFocusBorder', 'selectHighlight', 'tableHeaderBg', 'tableStripeBg'
    ] as const

    for (const key of colorKeys) {
      const node = createMockNode({ color: key })
      const style = resolver.resolve(node)
      expect(style.fg).not.toBe(DEFAULT_FG)
    }
  })
})

describe('computeAttrs', () => {
  it('returns 0 for empty style', () => {
    expect(computeAttrs({})).toBe(0)
  })

  it('computes bold attribute', () => {
    expect(computeAttrs({ bold: true })).toBe(ATTR_BOLD)
  })

  it('computes italic attribute', () => {
    expect(computeAttrs({ italic: true })).toBe(ATTR_ITALIC)
  })

  it('computes underline attribute', () => {
    expect(computeAttrs({ underline: true })).toBe(ATTR_UNDERLINE)
  })

  it('computes dim attribute', () => {
    expect(computeAttrs({ dim: true })).toBe(ATTR_DIM)
  })

  it('computes strikethrough attribute', () => {
    expect(computeAttrs({ strikethrough: true })).toBe(ATTR_STRIKETHROUGH)
  })

  it('computes inverse attribute', () => {
    expect(computeAttrs({ inverse: true })).toBe(ATTR_INVERSE)
  })

  it('computes combined attributes', () => {
    const attrs = computeAttrs({
      bold: true,
      italic: true,
      underline: true,
      dim: true,
      strikethrough: true,
      inverse: true
    })

    expect(attrs).toBe(
      ATTR_BOLD | ATTR_ITALIC | ATTR_UNDERLINE | ATTR_DIM | ATTR_STRIKETHROUGH | ATTR_INVERSE
    )
  })

  it('ignores false values', () => {
    expect(computeAttrs({ bold: false, italic: false })).toBe(0)
  })
})

describe('mergeStyles', () => {
  it('returns base style for empty override', () => {
    const base: StyleProps = { color: '#ff0000', bold: true }
    const result = mergeStyles(base, {})

    expect(result).toEqual(base)
  })

  it('overrides specific properties', () => {
    const base: StyleProps = { color: '#ff0000', bold: true }
    const result = mergeStyles(base, { color: '#00ff00' })

    expect(result).toEqual({ color: '#00ff00', bold: true })
  })

  it('adds new properties', () => {
    const base: StyleProps = { color: '#ff0000' }
    const result = mergeStyles(base, { bold: true })

    expect(result).toEqual({ color: '#ff0000', bold: true })
  })
})

describe('mergeCellStyles', () => {
  it('returns base style for empty override', () => {
    const base: CellStyle = { fg: 0xff0000, bg: 0x00ff00, attrs: ATTR_BOLD }
    const result = mergeCellStyles(base, {})

    expect(result).toEqual(base)
  })

  it('overrides foreground', () => {
    const base: CellStyle = { fg: 0xff0000, bg: 0x00ff00 }
    const result = mergeCellStyles(base, { fg: 0x0000ff })

    expect(result.fg).toBe(0x0000ff)
    expect(result.bg).toBe(0x00ff00)
  })

  it('overrides background', () => {
    const base: CellStyle = { fg: 0xff0000, bg: 0x00ff00 }
    const result = mergeCellStyles(base, { bg: 0x0000ff })

    expect(result.fg).toBe(0xff0000)
    expect(result.bg).toBe(0x0000ff)
  })

  it('overrides attributes', () => {
    const base: CellStyle = { fg: 0xff0000, attrs: ATTR_BOLD }
    const result = mergeCellStyles(base, { attrs: ATTR_ITALIC })

    expect(result.attrs).toBe(ATTR_ITALIC)
  })
})

describe('createCellStyle', () => {
  it('creates default style for empty props', () => {
    const style = createCellStyle({})

    expect(style.fg).toBe(DEFAULT_FG)
    expect(style.bg).toBe(DEFAULT_BG)
    expect(style.attrs).toBe(0)
  })

  it('parses foreground color', () => {
    const style = createCellStyle({ color: '#ff0000' })

    // 0xff0000ff as signed 32-bit = -16776961
    expect(style.fg).toBe(-16776961)
  })

  it('parses background color', () => {
    const style = createCellStyle({ bg: '#00ff00' })

    expect(style.bg).toBe(0x00ff00ff) // RGBA format
  })

  it('computes attributes', () => {
    const style = createCellStyle({ bold: true, italic: true })

    expect(style.attrs).toBe(ATTR_BOLD | ATTR_ITALIC)
  })
})

describe('applyStyle', () => {
  it('returns base style for empty props', () => {
    const base: CellStyle = { fg: 0xff0000, bg: 0x00ff00, attrs: ATTR_BOLD }
    const result = applyStyle(base, {})

    expect(result).toEqual(base)
  })

  it('applies foreground color', () => {
    const base: CellStyle = { fg: 0xff0000ff }
    const result = applyStyle(base, { color: '#0000ff' })

    expect(result.fg).toBe(0x0000ffff) // RGBA format
  })

  it('applies background color', () => {
    const base: CellStyle = { bg: 0xff0000ff }
    const result = applyStyle(base, { bg: '#0000ff' })

    expect(result.bg).toBe(0x0000ffff) // RGBA format
  })

  it('adds bold attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { bold: true })

    expect(result.attrs).toBe(ATTR_BOLD)
  })

  it('removes bold attribute', () => {
    const base: CellStyle = { attrs: ATTR_BOLD }
    const result = applyStyle(base, { bold: false })

    expect(result.attrs).toBe(0)
  })

  it('adds italic attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { italic: true })

    expect(result.attrs).toBe(ATTR_ITALIC)
  })

  it('removes italic attribute', () => {
    const base: CellStyle = { attrs: ATTR_ITALIC }
    const result = applyStyle(base, { italic: false })

    expect(result.attrs).toBe(0)
  })

  it('adds underline attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { underline: true })

    expect(result.attrs).toBe(ATTR_UNDERLINE)
  })

  it('removes underline attribute', () => {
    const base: CellStyle = { attrs: ATTR_UNDERLINE }
    const result = applyStyle(base, { underline: false })

    expect(result.attrs).toBe(0)
  })

  it('adds dim attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { dim: true })

    expect(result.attrs).toBe(ATTR_DIM)
  })

  it('removes dim attribute', () => {
    const base: CellStyle = { attrs: ATTR_DIM }
    const result = applyStyle(base, { dim: false })

    expect(result.attrs).toBe(0)
  })

  it('adds strikethrough attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { strikethrough: true })

    expect(result.attrs).toBe(ATTR_STRIKETHROUGH)
  })

  it('removes strikethrough attribute', () => {
    const base: CellStyle = { attrs: ATTR_STRIKETHROUGH }
    const result = applyStyle(base, { strikethrough: false })

    expect(result.attrs).toBe(0)
  })

  it('adds inverse attribute', () => {
    const base: CellStyle = { attrs: 0 }
    const result = applyStyle(base, { inverse: true })

    expect(result.attrs).toBe(ATTR_INVERSE)
  })

  it('removes inverse attribute', () => {
    const base: CellStyle = { attrs: ATTR_INVERSE }
    const result = applyStyle(base, { inverse: false })

    expect(result.attrs).toBe(0)
  })

  it('combines multiple attribute changes', () => {
    const base: CellStyle = { attrs: ATTR_BOLD }
    const result = applyStyle(base, { bold: false, italic: true })

    expect(result.attrs).toBe(ATTR_ITALIC)
  })

  it('handles undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { bold: true })

    expect(result.attrs).toBe(ATTR_BOLD)
  })

  it('adds strikethrough with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { strikethrough: true })

    expect(result.attrs).toBe(ATTR_STRIKETHROUGH)
  })

  it('removes strikethrough with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { strikethrough: false })

    expect(result.attrs).toBe(0)
  })

  it('adds inverse with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { inverse: true })

    expect(result.attrs).toBe(ATTR_INVERSE)
  })

  it('removes inverse with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { inverse: false })

    expect(result.attrs).toBe(0)
  })

  it('adds dim with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { dim: true })

    expect(result.attrs).toBe(ATTR_DIM)
  })

  it('removes dim with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { dim: false })

    expect(result.attrs).toBe(0)
  })

  it('adds underline with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { underline: true })

    expect(result.attrs).toBe(ATTR_UNDERLINE)
  })

  it('removes underline with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { underline: false })

    expect(result.attrs).toBe(0)
  })

  it('adds italic with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { italic: true })

    expect(result.attrs).toBe(ATTR_ITALIC)
  })

  it('removes italic with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { italic: false })

    expect(result.attrs).toBe(0)
  })

  it('removes bold with undefined base attrs', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { bold: false })

    expect(result.attrs).toBe(0)
  })

  it('applies color with undefined base fg', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { color: '#ff0000' })

    expect(result.fg).toBe(-16776961)
  })

  it('applies bg with undefined base bg', () => {
    const base: CellStyle = {}
    const result = applyStyle(base, { bg: '#00ff00' })

    expect(result.bg).toBe(0x00ff00ff)
  })
})

describe('hasAttrs', () => {
  it('returns false for no attrs', () => {
    expect(hasAttrs({ attrs: 0 })).toBe(false)
  })

  it('returns true for some attrs', () => {
    expect(hasAttrs({ attrs: ATTR_BOLD })).toBe(true)
  })

  it('returns false for undefined attrs', () => {
    expect(hasAttrs({})).toBe(false)
  })
})

describe('isBold', () => {
  it('returns true when bold', () => {
    expect(isBold({ attrs: ATTR_BOLD })).toBe(true)
  })

  it('returns false when not bold', () => {
    expect(isBold({ attrs: ATTR_ITALIC })).toBe(false)
  })

  it('returns true when bold with other attrs', () => {
    expect(isBold({ attrs: ATTR_BOLD | ATTR_ITALIC })).toBe(true)
  })

  it('returns false for undefined attrs', () => {
    expect(isBold({})).toBe(false)
  })
})

describe('isItalic', () => {
  it('returns true when italic', () => {
    expect(isItalic({ attrs: ATTR_ITALIC })).toBe(true)
  })

  it('returns false when not italic', () => {
    expect(isItalic({ attrs: ATTR_BOLD })).toBe(false)
  })

  it('returns false for undefined attrs', () => {
    expect(isItalic({})).toBe(false)
  })
})

describe('isUnderlined', () => {
  it('returns true when underlined', () => {
    expect(isUnderlined({ attrs: ATTR_UNDERLINE })).toBe(true)
  })

  it('returns false when not underlined', () => {
    expect(isUnderlined({ attrs: ATTR_BOLD })).toBe(false)
  })

  it('returns false for undefined attrs', () => {
    expect(isUnderlined({})).toBe(false)
  })
})

describe('isDimmed', () => {
  it('returns true when dimmed', () => {
    expect(isDimmed({ attrs: ATTR_DIM })).toBe(true)
  })

  it('returns false when not dimmed', () => {
    expect(isDimmed({ attrs: ATTR_BOLD })).toBe(false)
  })

  it('returns false for undefined attrs', () => {
    expect(isDimmed({})).toBe(false)
  })
})

describe('DEFAULT_CELL_STYLE', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_CELL_STYLE.fg).toBe(DEFAULT_FG)
    expect(DEFAULT_CELL_STYLE.bg).toBe(DEFAULT_BG)
    expect(DEFAULT_CELL_STYLE.attrs).toBe(0)
  })
})

describe('EMPTY_STYLE_PROPS', () => {
  it('is empty object', () => {
    expect(EMPTY_STYLE_PROPS).toEqual({})
  })
})
