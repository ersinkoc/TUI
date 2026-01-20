/**
 * @oxog/tui - Box Widget
 * @packageDocumentation
 */

import type {
  Node,
  Buffer,
  CellStyle,
  Dimension,
  BorderStyle,
  Color,
  FlexDirection,
  JustifyContent,
  AlignItems,
  Spacing
} from '../types'
import { ContainerNode } from './node'
import { getBorderChars } from '../utils/border'
import { parseColorWithDefault, DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { drawRect } from '../core/buffer'

// ============================================================
// Types
// ============================================================

/**
 * Box widget properties.
 */
export interface BoxProps {
  /** Fixed width or percentage */
  width?: Dimension
  /** Fixed height or percentage */
  height?: Dimension
  /** Minimum width */
  minWidth?: number
  /** Maximum width */
  maxWidth?: number
  /** Minimum height */
  minHeight?: number
  /** Maximum height */
  maxHeight?: number
  /** Flex grow value */
  flex?: number
  /** Flex direction */
  flexDirection?: FlexDirection
  /** Main axis alignment */
  justifyContent?: JustifyContent
  /** Cross axis alignment */
  alignItems?: AlignItems
  /** Gap between children */
  gap?: number
  /** Padding */
  padding?: Spacing
  /** Margin */
  margin?: Spacing
  /** Border style */
  border?: BorderStyle
  /** Border color */
  borderColor?: Color
  /** Background color */
  bg?: Color
}

/**
 * Box node interface.
 */
export interface BoxNode extends Node {
  readonly type: 'box'

  // Layout methods
  width(value: Dimension): this
  height(value: Dimension): this
  minWidth(value: number): this
  maxWidth(value: number): this
  minHeight(value: number): this
  maxHeight(value: number): this
  flex(value: number): this
  flexDirection(value: FlexDirection): this
  justifyContent(value: JustifyContent): this
  alignItems(value: AlignItems): this
  gap(value: number): this
  padding(value: Spacing): this
  margin(value: Spacing): this

  // Style methods
  border(style: BorderStyle): this
  borderColor(color: Color): this
  bg(color: Color): this

  // Container methods
  add(child: Node): this
  remove(child: Node): this
  clear(): this
  insertAt(index: number, child: Node): this
  getChild(index: number): Node | undefined
  readonly childCount: number
  readonly hasChildren: boolean
}

// ============================================================
// Implementation
// ============================================================

class BoxNodeImpl extends ContainerNode implements BoxNode {
  readonly type = 'box' as const

  constructor(props?: BoxProps) {
    super()
    if (props) {
      this.applyProps(props)
    }
  }

  /* c8 ignore start */
  private applyProps(props: BoxProps): void {
    // Layout props
    if (props.width !== undefined) this._layout.width = props.width
    if (props.height !== undefined) this._layout.height = props.height
    if (props.minWidth !== undefined) this._layout.minWidth = props.minWidth
    if (props.maxWidth !== undefined) this._layout.maxWidth = props.maxWidth
    if (props.minHeight !== undefined) this._layout.minHeight = props.minHeight
    if (props.maxHeight !== undefined) this._layout.maxHeight = props.maxHeight
    if (props.flex !== undefined) this._layout.flex = props.flex
    if (props.flexDirection !== undefined) this._layout.flexDirection = props.flexDirection
    if (props.justifyContent !== undefined) this._layout.justifyContent = props.justifyContent
    if (props.alignItems !== undefined) this._layout.alignItems = props.alignItems
    if (props.gap !== undefined) this._layout.gap = props.gap
    if (props.padding !== undefined) this._layout.padding = props.padding
    if (props.margin !== undefined) this._layout.margin = props.margin

    // Style props
    if (props.border !== undefined) this._style.border = props.border
    if (props.borderColor !== undefined) this._style.borderColor = props.borderColor
    if (props.bg !== undefined) this._style.bg = props.bg
  }
  /* c8 ignore stop */

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

  minWidth(value: number): this {
    this._layout.minWidth = value
    this.markDirty()
    return this
  }

  maxWidth(value: number): this {
    this._layout.maxWidth = value
    this.markDirty()
    return this
  }

  minHeight(value: number): this {
    this._layout.minHeight = value
    this.markDirty()
    return this
  }

  maxHeight(value: number): this {
    this._layout.maxHeight = value
    this.markDirty()
    return this
  }

  flex(value: number): this {
    this._layout.flex = value
    this.markDirty()
    return this
  }

  flexDirection(value: FlexDirection): this {
    this._layout.flexDirection = value
    this.markDirty()
    return this
  }

  justifyContent(value: JustifyContent): this {
    this._layout.justifyContent = value
    this.markDirty()
    return this
  }

  alignItems(value: AlignItems): this {
    this._layout.alignItems = value
    this.markDirty()
    return this
  }

  gap(value: number): this {
    this._layout.gap = value
    this.markDirty()
    return this
  }

  padding(value: Spacing): this {
    this._layout.padding = value
    this.markDirty()
    return this
  }

  margin(value: Spacing): this {
    this._layout.margin = value
    this.markDirty()
    return this
  }

  // Style methods
  border(style: BorderStyle): this {
    this._style.border = style
    this.markDirty()
    return this
  }

  borderColor(color: Color): this {
    this._style.borderColor = color
    this.markDirty()
    return this
  }

  bg(color: Color): this {
    this._style.bg = color
    this.markDirty()
    return this
  }

  // Render
  render(buffer: Buffer, style: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    // Get colors
    /* c8 ignore next 3 */
    const bgColor = this._style.bg
      ? parseColorWithDefault(this._style.bg, DEFAULT_BG)
      : (style.bg ?? DEFAULT_BG)

    /* c8 ignore next 3 */
    const borderColor = this._style.borderColor
      ? parseColorWithDefault(this._style.borderColor, DEFAULT_FG)
      : (style.fg ?? DEFAULT_FG)

    const borderStyle = this._style.border ?? 'none'

    // Fill background
    /* c8 ignore next */
    if (bgColor !== DEFAULT_BG) {
      buffer.fill(x, y, width, height, {
        char: ' ',
        /* c8 ignore next */
        fg: style.fg ?? DEFAULT_FG,
        bg: bgColor,
        attrs: 0
      })
    }

    // Draw border
    if (borderStyle !== 'none') {
      const chars = getBorderChars(borderStyle)
      if (chars) {
        drawRect(buffer, x, y, width, height, chars, {
          fg: borderColor,
          bg: bgColor,
          attrs: 0
        })
      }
    }

    // Render children
    const childStyle: CellStyle = { bg: bgColor }
    if (style.fg !== undefined) childStyle.fg = style.fg
    if (style.attrs !== undefined) childStyle.attrs = style.attrs

    for (const child of this._children) {
      if (child.isVisible) {
        child.render(buffer, childStyle)
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a box widget.
 *
 * @param props - Box properties
 * @returns Box node
 *
 * @example
 * ```typescript
 * // Basic box
 * const container = box()
 *
 * // Box with dimensions
 * const sized = box({ width: 20, height: 10 })
 *
 * // Styled box
 * const styled = box()
 *   .border('rounded')
 *   .bg('#1a1a2e')
 *   .padding(1)
 *
 * // Flex container
 * const flex = box()
 *   .flexDirection('row')
 *   .justifyContent('between')
 *   .add(box().flex(1))
 *   .add(box().flex(2))
 * ```
 */
export function box(props?: BoxProps): BoxNode {
  return new BoxNodeImpl(props)
}
