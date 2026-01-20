/**
 * @oxog/tui - Box Widget Tests
 */

import { describe, it, expect } from 'vitest'
import { box } from '../../src/widgets/box'
import { text } from '../../src/widgets/text'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Box Widget', () => {
  describe('factory function', () => {
    it('should create a box node', () => {
      const b = box()
      expect(b.type).toBe('box')
    })

    it('should have a unique id', () => {
      const b1 = box()
      const b2 = box()
      expect(b1.id).not.toBe(b2.id)
    })

    it('should accept props', () => {
      const b = box({
        width: 100,
        height: 50,
        flexDirection: 'row'
      })
      expect(b).toBeDefined()
    })

    it('should apply props from constructor', () => {
      const b = box({
        width: 100,
        height: 50,
        flexDirection: 'row'
      })
      expect(b._layout.width).toBe(100)
      expect(b._layout.height).toBe(50)
      expect(b._layout.flexDirection).toBe('row')
    })
  })

  describe('chainable methods', () => {
    it('should set width', () => {
      const b = box().width(100)
      expect(b._layout.width).toBe(100)
    })

    it('should set height', () => {
      const b = box().height(50)
      expect(b._layout.height).toBe(50)
    })

    it('should set flex direction', () => {
      const b = box().flexDirection('row')
      expect(b._layout.flexDirection).toBe('row')
    })

    it('should set padding as number', () => {
      const b = box().padding(10)
      expect(b._layout.padding).toBe(10)
    })

    it('should set padding as object', () => {
      const b = box().padding({ top: 1, right: 2, bottom: 3, left: 4 })
      expect(b._layout.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 })
    })

    it('should set margin as number', () => {
      const b = box().margin(5)
      expect(b._layout.margin).toBe(5)
    })

    it('should set flex', () => {
      const b = box().flex(1)
      expect(b._layout.flex).toBe(1)
    })

    it('should set gap', () => {
      const b = box().gap(5)
      expect(b._layout.gap).toBe(5)
    })

    it('should set justify content', () => {
      const b = box().justifyContent('center')
      expect(b._layout.justifyContent).toBe('center')
    })

    it('should set align items', () => {
      const b = box().alignItems('center')
      expect(b._layout.alignItems).toBe('center')
    })

    it('should chain multiple methods', () => {
      const b = box().width(100).height(50).flexDirection('row').padding(10).flex(1)

      expect(b._layout.width).toBe(100)
      expect(b._layout.height).toBe(50)
      expect(b._layout.flexDirection).toBe('row')
      expect(b._layout.padding).toBe(10)
      expect(b._layout.flex).toBe(1)
    })
  })

  describe('border', () => {
    it('should set border style', () => {
      const b = box().border('single')
      expect(b._style.border).toBe('single')
    })

    it('should set double border style', () => {
      const b = box().border('double')
      expect(b._style.border).toBe('double')
    })

    it('should set rounded border style', () => {
      const b = box().border('rounded')
      expect(b._style.border).toBe('rounded')
    })
  })

  describe('style', () => {
    it('should set background color', () => {
      const b = box().bg('#0000ff')
      expect(b._style.bg).toBe('#0000ff')
    })

    it('should set border color', () => {
      const b = box().borderColor('#ff0000')
      expect(b._style.borderColor).toBe('#ff0000')
    })
  })

  describe('children', () => {
    it('should add child nodes', () => {
      const b = box().add(text('Child 1')).add(text('Child 2'))

      expect(b._children).toHaveLength(2)
    })

    it('should set parent on children', () => {
      const parent = box()
      const child = text('Child')
      parent.add(child)

      expect(child._parent).toBe(parent)
    })

    it('should remove child nodes', () => {
      const b = box()
      const child = text('Child')
      b.add(child)
      b.remove(child)

      expect(b._children).toHaveLength(0)
      expect(child._parent).toBeNull()
    })

    it('should add multiple children with chain', () => {
      const b = box().add(text('Child 1')).add(text('Child 2')).add(text('Child 3'))

      expect(b._children).toHaveLength(3)
    })

    it('should get child count', () => {
      const b = box().add(text('Child 1')).add(text('Child 2'))

      expect(b.childCount).toBe(2)
    })

    it('should check hasChildren', () => {
      const empty = box()
      const withChild = box().add(text('Child'))

      expect(empty.hasChildren).toBe(false)
      expect(withChild.hasChildren).toBe(true)
    })

    it('should get child by index', () => {
      const child1 = text('Child 1')
      const child2 = text('Child 2')
      const b = box().add(child1).add(child2)

      expect(b.getChild(0)).toBe(child1)
      expect(b.getChild(1)).toBe(child2)
      expect(b.getChild(5)).toBeUndefined()
    })

    it('should insert child at index', () => {
      const child1 = text('Child 1')
      const child2 = text('Child 2')
      const child3 = text('Child 3')
      const b = box().add(child1).add(child3)

      b.insertAt(1, child2)

      expect(b._children[0]).toBe(child1)
      expect(b._children[1]).toBe(child2)
      expect(b._children[2]).toBe(child3)
    })

    it('should clear all children', () => {
      const b = box().add(text('Child 1')).add(text('Child 2'))

      b.clear()

      expect(b._children).toHaveLength(0)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const b = box()
      expect(b.isVisible).toBe(true)
    })

    it('should hide with visible(false)', () => {
      const b = box().visible(false)
      expect(b.isVisible).toBe(false)
    })

    it('should show with visible(true)', () => {
      const b = box().visible(false).visible(true)
      expect(b.isVisible).toBe(true)
    })
  })

  describe('rendering', () => {
    it('should render to buffer', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).bg('#000000')

      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Box should have rendered background
      // Check that cells were modified
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('should fill background when bg color is set', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).bg('#ff0000')

      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Background should be filled with the custom color (0xff0000ff packed)
      const cell = buffer.get(2, 2)
      expect(cell?.char).toBe(' ')
      expect((cell?.bg ?? 0) >>> 0).toBe(0xff0000ff)
    })

    it('should not fill background when using default bg', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 })

      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      // Render without setting bg - should not call buffer.fill
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Cell should remain default
      const cell = buffer.get(2, 2)
      expect(cell?.char).toBe(' ')
    })

    it('should render with zero width bounds', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).bg('#ff0000')

      b._bounds = { x: 0, y: 0, width: 0, height: 5 }
      // Should return early and not throw
      expect(() => b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should render with zero height bounds', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).bg('#ff0000')

      b._bounds = { x: 0, y: 0, width: 10, height: 0 }
      // Should return early and not throw
      expect(() => b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should not render when hidden', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).visible(false)

      const originalCell = buffer.get(0, 0)
      const originalChar = originalCell?.char
      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should not be modified
      expect(buffer.get(0, 0)?.char).toBe(originalChar)
    })

    it('should render with border', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).border('single')

      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Border corners should be set
      expect(buffer.get(0, 0)?.char).not.toBe(' ')
    })

    it('should render with border and custom border color', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 10, height: 5 }).border('single').borderColor('#ff0000')

      b._bounds = { x: 0, y: 0, width: 10, height: 5 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Border corners should be set with custom color
      const cell = buffer.get(0, 0)
      expect(cell?.char).not.toBe(' ')
      // The red color should be applied (0xff0000ff in packed format)
      // Note: JavaScript treats large numbers as signed, so we use >>> 0 for unsigned comparison
      expect((cell?.fg ?? 0) >>> 0).toBe(0xff0000ff)
    })

    it('should render children', () => {
      const buffer = createBuffer(20, 10)
      const b = box({ width: 20, height: 10 }).add(text('Hello'))

      b._bounds = { x: 0, y: 0, width: 20, height: 10 }

      // Set child bounds
      const child = b._children[0]!
      child._bounds = { x: 0, y: 0, width: 20, height: 1 }

      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Child text should be rendered
      expect(buffer.get(0, 0)?.char).toBe('H')
    })
  })

  describe('dirty flag', () => {
    it('should mark dirty when properties change', () => {
      const b = box()
      b._dirty = false

      b.width(100)
      expect(b._dirty).toBe(true)
    })

    it('should mark dirty when adding children', () => {
      const b = box()
      b._dirty = false

      b.add(text('Child'))
      expect(b._dirty).toBe(true)
    })
  })

  describe('min/max constraints', () => {
    it('should set minWidth', () => {
      const b = box().minWidth(50)
      expect(b._layout.minWidth).toBe(50)
    })

    it('should set maxWidth', () => {
      const b = box().maxWidth(200)
      expect(b._layout.maxWidth).toBe(200)
    })

    it('should set minHeight', () => {
      const b = box().minHeight(30)
      expect(b._layout.minHeight).toBe(30)
    })

    it('should set maxHeight', () => {
      const b = box().maxHeight(100)
      expect(b._layout.maxHeight).toBe(100)
    })
  })
})
