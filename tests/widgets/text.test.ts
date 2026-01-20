/**
 * @oxog/tui - Text Widget Tests
 */

import { describe, it, expect } from 'vitest'
import { text, styledText } from '../../src/widgets/text'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'
import {
  ATTR_BOLD,
  ATTR_ITALIC,
  ATTR_UNDERLINE,
  ATTR_DIM,
  ATTR_STRIKETHROUGH
} from '../../src/constants'

describe('Text Widget', () => {
  describe('factory function', () => {
    it('should create a text node', () => {
      const t = text('Hello')
      expect(t.type).toBe('text')
    })

    it('should accept string content', () => {
      const t = text('Hello World')
      expect(t.text).toBe('Hello World')
    })

    it('should default to empty content', () => {
      const t = text()
      expect(t.text).toBe('')
    })
  })

  describe('content methods', () => {
    it('should get content with text getter', () => {
      const t = text('Hello')
      expect(t.text).toBe('Hello')
    })

    it('should set content with content method', () => {
      const t = text('Initial').content('Updated')
      expect(t.text).toBe('Updated')
    })

    it('should return this for chaining', () => {
      const t = text('Initial')
      expect(t.content('Updated')).toBe(t)
    })

    it('should handle empty content', () => {
      const t = text('')
      expect(t.text).toBe('')
    })

    it('should handle multiline content', () => {
      const t = text('Line 1\nLine 2\nLine 3')
      expect(t.text).toBe('Line 1\nLine 2\nLine 3')
    })
  })

  describe('text options', () => {
    it('should set wrap option', () => {
      const t = text('Hello').wrap(true)
      expect(t).toBeDefined()
    })

    it('should set align option', () => {
      const t = text('Hello').align('center')
      expect(t).toBeDefined()
    })

    it('should set align to left', () => {
      const t = text('Hello').align('left')
      expect(t).toBeDefined()
    })

    it('should set align to right', () => {
      const t = text('Hello').align('right')
      expect(t).toBeDefined()
    })
  })

  describe('style methods', () => {
    it('should set foreground color', () => {
      const t = text('Hello').color('#ff0000')
      expect((t as any)._style.color).toBe('#ff0000')
    })

    it('should set background color', () => {
      const t = text('Hello').bg('#0000ff')
      expect((t as any)._style.bg).toBe('#0000ff')
    })

    it('should set bold', () => {
      const t = text('Hello').bold(true)
      expect((t as any)._style.bold).toBe(true)
    })

    it('should set italic', () => {
      const t = text('Hello').italic(true)
      expect((t as any)._style.italic).toBe(true)
    })

    it('should set underline', () => {
      const t = text('Hello').underline(true)
      expect((t as any)._style.underline).toBe(true)
    })

    it('should set dim', () => {
      const t = text('Hello').dim(true)
      expect((t as any)._style.dim).toBe(true)
    })

    it('should set strikethrough', () => {
      const t = text('Hello').strikethrough(true)
      expect((t as any)._style.strikethrough).toBe(true)
    })

    it('should support method chaining', () => {
      const t = text('Hi').color('#ff0000').bg('#000000').bold().italic()
      expect(t.text).toBe('Hi')
    })
  })

  describe('layout methods', () => {
    it('should set width', () => {
      const t = text('Hello').width(50)
      expect((t as any)._layout.width).toBe(50)
    })

    it('should set height', () => {
      const t = text('Hello').height(10)
      expect((t as any)._layout.height).toBe(10)
    })

    it('should set padding', () => {
      const t = text('Hello').padding(1)
      expect((t as any)._layout.padding).toBe(1)
    })
  })

  describe('rendering', () => {
    it('should render text to buffer', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Hello')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('e')
      expect(buffer.get(2, 0)?.char).toBe('l')
      expect(buffer.get(3, 0)?.char).toBe('l')
      expect(buffer.get(4, 0)?.char).toBe('o')
    })

    it('should truncate text that exceeds width', () => {
      const buffer = createBuffer(5, 1)
      const t = text('Hello World')

      ;(t as any)._bounds = { x: 0, y: 0, width: 5, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Only first 5 characters
      expect(buffer.get(4, 0)?.char).toBe('o')
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Hello')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      t.visible(false)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should have default space
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should render multiline text', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Line 1\nLine 2')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 5 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('L')
      expect(buffer.get(0, 1)?.char).toBe('L')
    })

    it('should apply styles when rendering', () => {
      const buffer = createBuffer(20, 1)
      const t = text('Hi').color('#ff0000').bold(true)

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Style should be applied (fg color parsed and attrs set)
      expect(buffer.get(0, 0)?.char).toBe('H')
    })

    it('should wrap text when enabled', () => {
      const buffer = createBuffer(5, 3)
      const t = text('Hello World').wrap(true)

      ;(t as any)._bounds = { x: 0, y: 0, width: 5, height: 3 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Text should wrap to multiple lines
      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(0, 1)?.char).toBe('W')
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const t = text('Hello')
      expect(t.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const t = text('Hello')
      t.visible(false)
      expect(t.isVisible).toBe(false)
    })

    it('should show with visible(true)', () => {
      const t = text('Hello')
      t.visible(false)
      t.visible(true)
      expect(t.isVisible).toBe(true)
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when content changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.content('World')
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when style changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.color('#ff0000')
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when visibility changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.visible(false)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('type and id', () => {
    it('should have correct type', () => {
      const t = text('Hello')
      expect(t.type).toBe('text')
    })

    it('should have unique id', () => {
      const t1 = text('Hello')
      const t2 = text('World')
      expect(t1.id).not.toBe(t2.id)
    })
  })

  describe('styledText() factory', () => {
    it('should create text with content', () => {
      const t = styledText('Hello', {})
      expect(t.text).toBe('Hello')
      expect(t.type).toBe('text')
    })

    it('should apply color prop', () => {
      const t = styledText('Hello', { color: '#ff0000' })
      expect((t as any)._style.color).toBe('#ff0000')
    })

    it('should apply bg prop', () => {
      const t = styledText('Hello', { bg: '#0000ff' })
      expect((t as any)._style.bg).toBe('#0000ff')
    })

    it('should apply bold prop', () => {
      const t = styledText('Hello', { bold: true })
      expect((t as any)._style.bold).toBe(true)
    })

    it('should apply italic prop', () => {
      const t = styledText('Hello', { italic: true })
      expect((t as any)._style.italic).toBe(true)
    })

    it('should apply underline prop', () => {
      const t = styledText('Hello', { underline: true })
      expect((t as any)._style.underline).toBe(true)
    })

    it('should apply strikethrough prop', () => {
      const t = styledText('Hello', { strikethrough: true })
      expect((t as any)._style.strikethrough).toBe(true)
    })

    it('should apply dim prop', () => {
      const t = styledText('Hello', { dim: true })
      expect((t as any)._style.dim).toBe(true)
    })

    it('should apply align prop', () => {
      const t = styledText('Hello', { align: 'center' })
      expect((t as any)._align).toBe('center')
    })

    it('should apply wrap prop', () => {
      const t = styledText('Hello', { wrap: true })
      expect((t as any)._wrap).toBe(true)
    })

    it('should apply width prop', () => {
      const t = styledText('Hello', { width: 50 })
      expect((t as any)._layout.width).toBe(50)
    })

    it('should apply height prop', () => {
      const t = styledText('Hello', { height: 10 })
      expect((t as any)._layout.height).toBe(10)
    })

    it('should apply padding prop', () => {
      const t = styledText('Hello', { padding: 2 })
      expect((t as any)._layout.padding).toBe(2)
    })

    it('should apply multiple props', () => {
      const t = styledText('Hello', {
        color: '#ff0000',
        bg: '#000000',
        bold: true,
        italic: true,
        align: 'center',
        width: 30
      })
      expect((t as any)._style.color).toBe('#ff0000')
      expect((t as any)._style.bg).toBe('#000000')
      expect((t as any)._style.bold).toBe(true)
      expect((t as any)._style.italic).toBe(true)
      expect((t as any)._align).toBe('center')
      expect((t as any)._layout.width).toBe(30)
    })
  })

  describe('style methods default parameters', () => {
    it('should default bold to true', () => {
      const t = text('Hello').bold()
      expect((t as any)._style.bold).toBe(true)
    })

    it('should default italic to true', () => {
      const t = text('Hello').italic()
      expect((t as any)._style.italic).toBe(true)
    })

    it('should default underline to true', () => {
      const t = text('Hello').underline()
      expect((t as any)._style.underline).toBe(true)
    })

    it('should default strikethrough to true', () => {
      const t = text('Hello').strikethrough()
      expect((t as any)._style.strikethrough).toBe(true)
    })

    it('should default dim to true', () => {
      const t = text('Hello').dim()
      expect((t as any)._style.dim).toBe(true)
    })

    it('should allow disabling bold', () => {
      const t = text('Hello').bold(true).bold(false)
      expect((t as any)._style.bold).toBe(false)
    })

    it('should allow disabling italic', () => {
      const t = text('Hello').italic(true).italic(false)
      expect((t as any)._style.italic).toBe(false)
    })
  })

  describe('dirty flag edge cases', () => {
    it('should not mark dirty when content is same', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.content('Hello')
      expect((t as any)._dirty).toBe(false)
    })

    it('should not mark dirty when align is same', () => {
      const t = text('Hello').align('center')
      ;(t as any)._dirty = false
      t.align('center')
      expect((t as any)._dirty).toBe(false)
    })

    it('should not mark dirty when wrap is same', () => {
      const t = text('Hello').wrap(true)
      ;(t as any)._dirty = false
      t.wrap(true)
      expect((t as any)._dirty).toBe(false)
    })

    it('should mark dirty when bg changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.bg('#ff0000')
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when width changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.width(50)
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when height changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.height(10)
      expect((t as any)._dirty).toBe(true)
    })

    it('should mark dirty when padding changes', () => {
      const t = text('Hello')
      ;(t as any)._dirty = false
      t.padding(2)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('rendering edge cases', () => {
    it('should not render empty content', () => {
      const buffer = createBuffer(20, 5)
      const t = text('')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should have default space
      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should not render with zero width', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Hello')

      ;(t as any)._bounds = { x: 0, y: 0, width: 0, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should not render with zero height', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Hello')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 0 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should not render with negative dimensions', () => {
      const buffer = createBuffer(20, 5)
      const t = text('Hello')

      ;(t as any)._bounds = { x: 0, y: 0, width: -5, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe(' ')
    })

    it('should inherit fg color from parent style', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi')
      const parentFg = 0xaabbccff

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: parentFg, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.fg).toBe(parentFg)
    })

    it('should inherit bg color from parent style', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi')
      const parentBg = 0x112233ff

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: parentBg, attrs: 0 })

      expect(buffer.get(0, 0)?.bg).toBe(parentBg)
    })

    it('should override fg color when set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').color('#ff0000')

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Use unsigned comparison (>>> 0) due to signed int representation
      expect((buffer.get(0, 0)?.fg ?? 0) >>> 0).toBe(0xff0000ff >>> 0)
    })

    it('should override bg color when set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').bg('#0000ff')

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // 0x0000ffff doesn't have sign bit issues, but use consistent comparison
      expect(buffer.get(0, 0)?.bg).toBe(0x0000ffff)
    })
  })

  describe('rendering with attributes', () => {
    it('should render with ATTR_BOLD when bold is set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').bold()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.attrs & ATTR_BOLD).toBe(ATTR_BOLD)
    })

    it('should render with ATTR_ITALIC when italic is set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').italic()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.attrs & ATTR_ITALIC).toBe(ATTR_ITALIC)
    })

    it('should render with ATTR_UNDERLINE when underline is set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').underline()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.attrs & ATTR_UNDERLINE).toBe(ATTR_UNDERLINE)
    })

    it('should render with ATTR_DIM when dim is set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').dim()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.attrs & ATTR_DIM).toBe(ATTR_DIM)
    })

    it('should render with ATTR_STRIKETHROUGH when strikethrough is set', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').strikethrough()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.attrs & ATTR_STRIKETHROUGH).toBe(ATTR_STRIKETHROUGH)
    })

    it('should combine multiple attributes', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').bold().italic().underline()

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const attrs = buffer.get(0, 0)?.attrs ?? 0
      expect(attrs & ATTR_BOLD).toBe(ATTR_BOLD)
      expect(attrs & ATTR_ITALIC).toBe(ATTR_ITALIC)
      expect(attrs & ATTR_UNDERLINE).toBe(ATTR_UNDERLINE)
    })

    it('should inherit parent attributes', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').bold()
      const parentAttrs = ATTR_DIM

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: parentAttrs })

      const attrs = buffer.get(0, 0)?.attrs ?? 0
      expect(attrs & ATTR_BOLD).toBe(ATTR_BOLD)
      expect(attrs & ATTR_DIM).toBe(ATTR_DIM)
    })
  })

  describe('rendering with alignment', () => {
    it('should left-align text by default', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi')

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(1, 0)?.char).toBe('i')
    })

    it('should center-align text', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').align('center')

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // 'Hi' is 2 chars, in width 10, centered = 4 spaces on each side
      expect(buffer.get(4, 0)?.char).toBe('H')
      expect(buffer.get(5, 0)?.char).toBe('i')
    })

    it('should right-align text', () => {
      const buffer = createBuffer(10, 1)
      const t = text('Hi').align('right')

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // 'Hi' is 2 chars, right-aligned in width 10 = starts at position 8
      expect(buffer.get(8, 0)?.char).toBe('H')
      expect(buffer.get(9, 0)?.char).toBe('i')
    })

    it('should limit rendered lines to height', () => {
      const buffer = createBuffer(20, 2)
      const t = text('Line 1\nLine 2\nLine 3\nLine 4')

      ;(t as any)._bounds = { x: 0, y: 0, width: 20, height: 2 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)?.char).toBe('L')
      expect(buffer.get(5, 0)?.char).toBe('1')
      expect(buffer.get(0, 1)?.char).toBe('L')
      expect(buffer.get(5, 1)?.char).toBe('2')
    })

    it('should render at specified position', () => {
      const buffer = createBuffer(20, 10)
      const t = text('Hi')

      ;(t as any)._bounds = { x: 5, y: 3, width: 10, height: 1 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(5, 3)?.char).toBe('H')
      expect(buffer.get(6, 3)?.char).toBe('i')
    })
  })

  describe('rendering with wrap', () => {
    it('should wrap long text to multiple lines', () => {
      const buffer = createBuffer(10, 5)
      const t = text('Hello World Test').wrap(true)

      ;(t as any)._bounds = { x: 0, y: 0, width: 10, height: 5 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // First line should have 'Hello'
      expect(buffer.get(0, 0)?.char).toBe('H')
      // Second line should have 'World'
      expect(buffer.get(0, 1)?.char).toBe('W')
    })

    it('should not wrap when disabled', () => {
      const buffer = createBuffer(5, 3)
      const t = text('Hello World').wrap(false)

      ;(t as any)._bounds = { x: 0, y: 0, width: 5, height: 3 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Text should be truncated to first 5 characters
      expect(buffer.get(0, 0)?.char).toBe('H')
      expect(buffer.get(4, 0)?.char).toBe('o')
      // Second line should be empty (no wrap)
      expect(buffer.get(0, 1)?.char).toBe(' ')
    })
  })
})
