/**
 * Badge widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { badge, tag } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Badge Widget', () => {
  describe('creation', () => {
    it('creates a badge with default properties', () => {
      const b = badge()
      expect(b.type).toBe('badge')
      expect(b.content).toBe('')
      expect(b.badgeVariant).toBe('default')
    })

    it('creates a badge with text', () => {
      const b = badge({ text: 'New' })
      expect(b.content).toBe('New')
    })

    it('creates a badge with variant', () => {
      const b = badge({ variant: 'success' })
      expect(b.badgeVariant).toBe('success')
    })

    it('creates a badge with all variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
      for (const v of variants) {
        const b = badge({ variant: v })
        expect(b.badgeVariant).toBe(v)
      }
    })

    it('creates a badge with size', () => {
      const b = badge({ size: 'large' })
      expect(b.type).toBe('badge')
    })

    it('creates a badge with shape', () => {
      const b = badge({ shape: 'pill' })
      expect(b.type).toBe('badge')
    })

    it('creates a badge with icon', () => {
      const b = badge({ icon: '\u2605' })
      expect(b.type).toBe('badge')
    })

    it('creates a removable badge', () => {
      const b = badge({ removable: true })
      expect(b.type).toBe('badge')
    })

    it('creates a clickable badge', () => {
      const b = badge({ clickable: true })
      expect(b.type).toBe('badge')
    })
  })

  describe('tag factory', () => {
    it('creates a tag with removable=true', () => {
      const t = tag({ text: 'react' })
      expect(t.type).toBe('badge')
    })
  })

  describe('configuration', () => {
    it('sets text', () => {
      const b = badge().text('Hello')
      expect(b.content).toBe('Hello')
    })

    it('sets variant', () => {
      const b = badge().variant('error')
      expect(b.badgeVariant).toBe('error')
    })

    it('sets size', () => {
      const b = badge().size('small')
      expect(b.type).toBe('badge')
    })

    it('sets shape', () => {
      const b = badge().shape('rounded')
      expect(b.type).toBe('badge')
    })

    it('sets icon', () => {
      const b = badge().icon('*')
      expect(b.type).toBe('badge')
    })

    it('sets fg color', () => {
      const b = badge().fg(0xffffffff)
      expect(b.type).toBe('badge')
    })

    it('sets bg color', () => {
      const b = badge().bg(0x000000ff)
      expect(b.type).toBe('badge')
    })

    it('sets outline', () => {
      const b = badge().outline(true)
      expect(b.type).toBe('badge')
    })

    it('sets removable', () => {
      const b = badge().removable(true)
      expect(b.type).toBe('badge')
    })

    it('sets clickable', () => {
      const b = badge().clickable(true)
      expect(b.type).toBe('badge')
    })
  })

  describe('badge width', () => {
    it('calculates width for text only', () => {
      const b = badge({ text: 'Test', size: 'small', shape: 'square' })
      expect(b.badgeWidth).toBeGreaterThan(0)
    })

    it('calculates width with icon', () => {
      const withoutIcon = badge({ text: 'Test', size: 'small', shape: 'square' })
      const withIcon = badge({ text: 'Test', icon: '*', size: 'small', shape: 'square' })
      expect(withIcon.badgeWidth).toBeGreaterThan(withoutIcon.badgeWidth)
    })

    it('calculates width with removable', () => {
      const withoutRemove = badge({ text: 'Test', size: 'small', shape: 'square' })
      const withRemove = badge({ text: 'Test', removable: true, size: 'small', shape: 'square' })
      expect(withRemove.badgeWidth).toBeGreaterThan(withoutRemove.badgeWidth)
    })

    it('calculates width with different sizes', () => {
      const small = badge({ text: 'X', size: 'small' })
      const medium = badge({ text: 'X', size: 'medium' })
      const large = badge({ text: 'X', size: 'large' })

      expect(medium.badgeWidth).toBeGreaterThan(small.badgeWidth)
      expect(large.badgeWidth).toBeGreaterThan(medium.badgeWidth)
    })
  })

  describe('events', () => {
    it('emits onClick when clicked', () => {
      const handler = vi.fn()
      const b = badge({ clickable: true }).onClick(handler)

      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      ;(b as any).handleMouse(5, 0, 'press')

      expect(handler).toHaveBeenCalled()
    })

    it('emits onRemove when remove button clicked', () => {
      const handler = vi.fn()
      const b = badge({ removable: true }).onRemove(handler)

      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      // Click on remove button (last 2 chars)
      ;(b as any).handleMouse(9, 0, 'press')

      expect(handler).toHaveBeenCalled()
    })

    it('does not emit onClick when not clickable', () => {
      const handler = vi.fn()
      const b = badge({ clickable: false }).onClick(handler)

      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      ;(b as any).handleMouse(5, 0, 'press')

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not emit when clicking outside', () => {
      const handler = vi.fn()
      const b = badge({ clickable: true }).onClick(handler)

      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height: 1 }
      ;(b as any).handleMouse(15, 0, 'press')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 1

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders basic badge', () => {
      const b = badge({ text: 'Test' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders badge with all variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
      for (const v of variants) {
        const b = badge({ text: v, variant: v })
        ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
        b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders badge with sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const
      for (const s of sizes) {
        const b = badge({ text: 'Size', size: s })
        ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
        b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders badge with shapes', () => {
      const shapes = ['square', 'rounded', 'pill'] as const
      for (const s of shapes) {
        const b = badge({ text: 'Shape', shape: s })
        ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
        b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders badge with icon', () => {
      const b = badge({ text: 'Star', icon: '\u2605' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders removable badge', () => {
      const b = badge({ text: 'Remove', removable: true })
      ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders outline badge', () => {
      const b = badge({ text: 'Outline', outline: true, variant: 'primary' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders badge with custom colors', () => {
      const b = badge({ text: 'Custom' }).fg(0xffffffff).bg(0x8b5cf6ff)
      ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const b = badge({ text: 'Test' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const b = badge({ text: 'Hidden' }).visible(false)
      ;(b as any)._bounds = { x: 0, y: 0, width: 15, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long text', () => {
      const b = badge({ text: 'Very Long Badge Text That Should Be Truncated' })
      ;(b as any)._bounds = { x: 0, y: 0, width: 10, height }
      b.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const b = badge()
        .text('Chained')
        .variant('success')
        .size('medium')
        .shape('pill')
        .icon('*')
        .fg(0xffffffff)
        .bg(0x22c55eff)
        .outline(false)
        .removable(true)
        .clickable(true)

      expect(b.type).toBe('badge')
      expect(b.content).toBe('Chained')
      expect(b.badgeVariant).toBe('success')
    })
  })
})
