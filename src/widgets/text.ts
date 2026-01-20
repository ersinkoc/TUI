/**
 * @oxog/tui - Text Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Color, TextAlign, Dimension, Spacing } from '../types'
import { LeafNode } from './node'
import { parseColorWithDefault, DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, padToWidth, wrapText, truncateToWidth } from '../utils/unicode'
import { ATTR_BOLD, ATTR_ITALIC, ATTR_UNDERLINE, ATTR_DIM, ATTR_STRIKETHROUGH } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Text widget properties.
 */
export interface TextProps {
  /** Text content */
  content?: string
  /** Text color */
  color?: Color
  /** Background color */
  bg?: Color
  /** Bold text */
  bold?: boolean
  /** Italic text */
  italic?: boolean
  /** Underlined text */
  underline?: boolean
  /** Strikethrough text */
  strikethrough?: boolean
  /** Dim text */
  dim?: boolean
  /** Text alignment */
  align?: TextAlign
  /** Word wrap */
  wrap?: boolean
  /** Width */
  width?: Dimension
  /** Height */
  height?: Dimension
  /** Padding */
  padding?: Spacing
}

/**
 * Text node interface.
 */
export interface TextNode extends Node {
  readonly type: 'text'

  // Content
  content(value: string): this
  readonly text: string

  // Style methods
  color(fg: Color): this
  bg(color: Color): this
  bold(enabled?: boolean): this
  italic(enabled?: boolean): this
  underline(enabled?: boolean): this
  strikethrough(enabled?: boolean): this
  dim(enabled?: boolean): this
  align(value: TextAlign): this
  wrap(enabled: boolean): this

  // Layout methods
  width(value: Dimension): this
  height(value: Dimension): this
  padding(value: Spacing): this
}

// ============================================================
// Implementation
// ============================================================

class TextNodeImpl extends LeafNode implements TextNode {
  readonly type = 'text' as const

  private _content: string = ''
  private _align: TextAlign = 'left'
  private _wrap: boolean = false

  constructor(content?: string) {
    super()
    if (content !== undefined) {
      this._content = content
    }
  }

  get text(): string {
    return this._content
  }

  // Content
  content(value: string): this {
    if (this._content !== value) {
      this._content = value
      this.markDirty()
    }
    return this
  }

  // Style methods
  color(fg: Color): this {
    this._style.color = fg
    this.markDirty()
    return this
  }

  bg(color: Color): this {
    this._style.bg = color
    this.markDirty()
    return this
  }

  bold(enabled: boolean = true): this {
    this._style.bold = enabled
    this.markDirty()
    return this
  }

  italic(enabled: boolean = true): this {
    this._style.italic = enabled
    this.markDirty()
    return this
  }

  underline(enabled: boolean = true): this {
    this._style.underline = enabled
    this.markDirty()
    return this
  }

  strikethrough(enabled: boolean = true): this {
    this._style.strikethrough = enabled
    this.markDirty()
    return this
  }

  dim(enabled: boolean = true): this {
    this._style.dim = enabled
    this.markDirty()
    return this
  }

  align(value: TextAlign): this {
    if (this._align !== value) {
      this._align = value
      this.markDirty()
    }
    return this
  }

  wrap(enabled: boolean): this {
    if (this._wrap !== enabled) {
      this._wrap = enabled
      this.markDirty()
    }
    return this
  }

  // Layout methods
  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  height(value: Dimension): this {
    this._layout.height = value
    this.markDirty()
    return this
  }

  padding(value: Spacing): this {
    this._layout.padding = value
    this.markDirty()
    return this
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible || !this._content) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    // Compute style
    /* c8 ignore next 3 */
    const fg = this._style.color
      ? parseColorWithDefault(this._style.color, DEFAULT_FG)
      : (parentStyle.fg ?? DEFAULT_FG)

    /* c8 ignore next 3 */
    const bg = this._style.bg
      ? parseColorWithDefault(this._style.bg, DEFAULT_BG)
      : (parentStyle.bg ?? DEFAULT_BG)

    /* c8 ignore next */
    let attrs = parentStyle.attrs ?? 0
    if (this._style.bold) attrs |= ATTR_BOLD
    if (this._style.italic) attrs |= ATTR_ITALIC
    if (this._style.underline) attrs |= ATTR_UNDERLINE
    if (this._style.dim) attrs |= ATTR_DIM
    if (this._style.strikethrough) attrs |= ATTR_STRIKETHROUGH

    const style: CellStyle = { fg, bg, attrs }

    // Get lines to render
    let lines: string[]

    if (this._wrap) {
      lines = wrapText(this._content, width)
    } else {
      lines = this._content.split('\n')
    }

    // Render each line
    for (let i = 0; i < Math.min(lines.length, height); i++) {
      let line = lines[i]!

      // Truncate if too long
      if (stringWidth(line) > width) {
        line = truncateToWidth(line, width)
      }

      // Apply alignment
      if (this._align !== 'left') {
        line = padToWidth(line, width, this._align)
      }

      // Write to buffer
      buffer.write(x, y + i, line, style)
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a text widget.
 *
 * @param content - Initial text content
 * @returns Text node
 *
 * @example
 * ```typescript
 * // Basic text
 * const label = text('Hello, World!')
 *
 * // Styled text
 * const styled = text('Important!')
 *   .color('#ff0000')
 *   .bold()
 *
 * // Multi-line text
 * const multi = text('Line 1\nLine 2\nLine 3')
 *   .wrap(true)
 *
 * // Aligned text
 * const centered = text('Centered')
 *   .align('center')
 *   .width(20)
 * ```
 */
export function text(content?: string): TextNode {
  return new TextNodeImpl(content)
}

/**
 * Create a styled text widget.
 *
 * @param content - Text content
 * @param props - Text properties
 * @returns Text node
 *
 * @example
 * ```typescript
 * const styled = styledText('Hello', {
 *   color: '#00ff88',
 *   bold: true,
 *   align: 'center'
 * })
 * ```
 */
export function styledText(content: string, props: Omit<TextProps, 'content'>): TextNode {
  const node = new TextNodeImpl(content)

  if (props.color) node.color(props.color)
  if (props.bg) node.bg(props.bg)
  if (props.bold) node.bold(props.bold)
  if (props.italic) node.italic(props.italic)
  if (props.underline) node.underline(props.underline)
  if (props.strikethrough) node.strikethrough(props.strikethrough)
  if (props.dim) node.dim(props.dim)
  if (props.align) node.align(props.align)
  if (props.wrap) node.wrap(props.wrap)
  if (props.width) node.width(props.width)
  if (props.height) node.height(props.height)
  if (props.padding) node.padding(props.padding)

  return node
}
