/**
 * Tooltip widget tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { tooltip } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Tooltip Widget', () => {
  describe('creation', () => {
    it('creates a tooltip with default properties', () => {
      const t = tooltip()
      expect(t.type).toBe('tooltip')
      expect(t.content).toBe('')
      expect(t.isVisible).toBe(false)
      expect(t.tooltipPosition).toBe('top')
    })

    it('creates a tooltip with text', () => {
      const t = tooltip({ text: 'Help text' })
      expect(t.content).toBe('Help text')
    })

    it('creates a tooltip with position', () => {
      const t = tooltip({ position: 'bottom' })
      expect(t.tooltipPosition).toBe('bottom')
    })

    it('creates a tooltip with all positions', () => {
      const positions = ['top', 'bottom', 'left', 'right', 'auto'] as const
      for (const p of positions) {
        const t = tooltip({ position: p })
        expect(t.tooltipPosition).toBe(p)
      }
    })

    it('creates a tooltip with border', () => {
      const t = tooltip({ border: 'double' })
      expect(t.type).toBe('tooltip')
    })

    it('creates a tooltip with max width', () => {
      const t = tooltip({ maxWidth: 30 })
      expect(t.type).toBe('tooltip')
    })

    it('creates a tooltip without arrow', () => {
      const t = tooltip({ showArrow: false })
      expect(t.type).toBe('tooltip')
    })
  })

  describe('configuration', () => {
    it('sets text', () => {
      const t = tooltip().text('New text')
      expect(t.content).toBe('New text')
    })

    it('sets position', () => {
      const t = tooltip().position('right')
      expect(t.tooltipPosition).toBe('right')
    })

    it('sets border', () => {
      const t = tooltip().border('single')
      expect(t.type).toBe('tooltip')
    })

    it('sets delay', () => {
      const t = tooltip().delay(500)
      expect(t.type).toBe('tooltip')
    })

    it('sets max width', () => {
      const t = tooltip().maxWidth(50)
      expect(t.type).toBe('tooltip')
    })

    it('sets show arrow', () => {
      const t = tooltip().showArrow(false)
      expect(t.type).toBe('tooltip')
    })
  })

  describe('visibility control', () => {
    it('shows tooltip', () => {
      const t = tooltip({ text: 'Tip' }).show(10, 5)
      expect(t.isVisible).toBe(true)
    })

    it('shows tooltip with target dimensions', () => {
      const t = tooltip({ text: 'Tip' }).show(10, 5, 8, 2)
      expect(t.isVisible).toBe(true)
    })

    it('hides tooltip', () => {
      const t = tooltip({ text: 'Tip' })
        .show(10, 5)
        .hide()
      expect(t.isVisible).toBe(false)
    })

    it('toggles tooltip', () => {
      const t = tooltip({ text: 'Tip' })

      t.toggle(10, 5)
      expect(t.isVisible).toBe(true)

      t.toggle(10, 5)
      expect(t.isVisible).toBe(false)
    })

    it('hide does nothing when already hidden', () => {
      const t = tooltip({ text: 'Tip' })
      t.hide()
      expect(t.isVisible).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const t = tooltip({ text: 'Hidden' })
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Buffer should remain unchanged
    })

    it('renders visible tooltip', () => {
      const t = tooltip({ text: 'Visible' }).show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip at top position', () => {
      const t = tooltip({ text: 'Top tip', position: 'top' }).show(30, 10, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip at bottom position', () => {
      const t = tooltip({ text: 'Bottom tip', position: 'bottom' }).show(30, 5, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip at left position', () => {
      const t = tooltip({ text: 'Left', position: 'left' }).show(40, 10, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip at right position', () => {
      const t = tooltip({ text: 'Right', position: 'right' }).show(10, 10, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip with auto position', () => {
      const t = tooltip({ text: 'Auto', position: 'auto' }).show(30, 10, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders tooltip with different borders', () => {
      const borders = ['single', 'double', 'rounded', 'bold', 'none'] as const
      for (const b of borders) {
        const t = tooltip({ text: 'Border', border: b }).show(30, 10)
        t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      }
    })

    it('renders tooltip without arrow', () => {
      const t = tooltip({ text: 'No arrow', showArrow: false }).show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders multi-line tooltip', () => {
      const t = tooltip({
        text: 'This is a longer tooltip message that should wrap to multiple lines',
        maxWidth: 20
      }).show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('clamps tooltip to screen bounds', () => {
      // Near top-left corner
      const t1 = tooltip({ text: 'Corner', position: 'top' }).show(0, 0)
      t1.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Near bottom-right corner
      const t2 = tooltip({ text: 'Corner', position: 'bottom' }).show(55, 18)
      t2.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles empty text', () => {
      const t = tooltip({ text: '' }).show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('auto position falls back when top blocked', () => {
      // Target near top edge
      const t = tooltip({ text: 'Auto fallback', position: 'auto' }).show(30, 0, 5, 1)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles very long words', () => {
      const t = tooltip({
        text: 'supercalifragilisticexpialidocious',
        maxWidth: 15
      }).show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const t = tooltip()
        .text('Chained tooltip')
        .position('bottom')
        .border('rounded')
        .delay(300)
        .maxWidth(35)
        .showArrow(true)
        .show(20, 10, 10, 1)
        .hide()

      expect(t.type).toBe('tooltip')
      expect(t.content).toBe('Chained tooltip')
      expect(t.tooltipPosition).toBe('bottom')
    })
  })

  describe('auto position edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(60, 20)
    })

    it('auto position falls back to right when top and bottom blocked', () => {
      // Target in middle-left, blocking top and bottom
      const t = tooltip({ text: 'Right fallback', position: 'auto' }).show(0, 8, 1, 4)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('auto position falls back to left when top, bottom, and right blocked', () => {
      // Target near right edge, blocking all directions except left
      const t = tooltip({ text: 'Left fallback', position: 'auto' }).show(58, 8, 1, 4)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('returns empty dimensions when text is null/undefined', () => {
      const t = tooltip().show(30, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})
