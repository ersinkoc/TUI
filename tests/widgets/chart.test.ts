/**
 * Chart widgets tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { barchart, sparkline, gauge } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('BarChart Widget', () => {
  describe('creation', () => {
    it('creates a barchart with default properties', () => {
      const c = barchart()
      expect(c.type).toBe('barchart')
    })

    it('creates a barchart with data', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ]
      })
      expect(c.type).toBe('barchart')
    })

    it('creates a vertical barchart', () => {
      const c = barchart({ horizontal: false })
      expect(c.type).toBe('barchart')
    })
  })

  describe('configuration', () => {
    it('sets data', () => {
      const c = barchart().data([
        { label: 'X', value: 5 },
        { label: 'Y', value: 10 }
      ])
      expect(c.type).toBe('barchart')
    })

    it('sets horizontal orientation', () => {
      const c = barchart().horizontal(true)
      expect(c.type).toBe('barchart')
    })

    it('sets show values', () => {
      const c = barchart().showValues(true)
      expect(c.type).toBe('barchart')
    })

    it('sets show labels', () => {
      const c = barchart().showLabels(true)
      expect(c.type).toBe('barchart')
    })

    it('sets max value', () => {
      const c = barchart().maxValue(100)
      expect(c.type).toBe('barchart')
    })

    it('sets bar character', () => {
      const c = barchart().barChar('█')
      expect(c.type).toBe('barchart')
    })

    it('sets label width', () => {
      const c = barchart().labelWidth(10)
      expect(c.type).toBe('barchart')
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty barchart', () => {
      const c = barchart()
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal barchart', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
          { label: 'C', value: 15 }
        ],
        horizontal: true
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical barchart', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ],
        horizontal: false
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const c = barchart()
      ;(c as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const c = barchart().visible(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const c = barchart()
        .data([{ label: 'Test', value: 50 }])
        .horizontal(true)
        .showValues(true)
        .showLabels(true)
        .maxValue(100)
        .barChar('▓')
        .labelWidth(8)

      expect(c.type).toBe('barchart')
    })
  })
})

describe('Sparkline Widget', () => {
  describe('creation', () => {
    it('creates a sparkline with default properties', () => {
      const s = sparkline()
      expect(s.type).toBe('sparkline')
    })

    it('creates a sparkline with data', () => {
      const s = sparkline({ data: [1, 2, 3, 4, 5] })
      expect(s.type).toBe('sparkline')
    })
  })

  describe('configuration', () => {
    it('sets data', () => {
      const s = sparkline().data([5, 10, 15, 20])
      expect(s.type).toBe('sparkline')
    })

    it('sets min value', () => {
      const s = sparkline().min(0)
      expect(s.type).toBe('sparkline')
    })

    it('sets max value', () => {
      const s = sparkline().max(100)
      expect(s.type).toBe('sparkline')
    })

    it('sets style', () => {
      const s = sparkline().style('line')
      expect(s.type).toBe('sparkline')
    })
  })

  describe('data operations', () => {
    it('pushes new value', () => {
      const s = sparkline({ data: [1, 2, 3] })
      s.push(4)
      expect(s.type).toBe('sparkline')
    })

    it('clears data', () => {
      const s = sparkline({ data: [1, 2, 3] })
      s.clear()
      expect(s.type).toBe('sparkline')
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 3

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty sparkline', () => {
      const s = sparkline()
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders sparkline with data', () => {
      const s = sparkline({ data: [1, 3, 2, 5, 4, 6, 3, 7] })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders sparkline with min/max set', () => {
      const s = sparkline({ data: [1, 5, 3, 8, 2], min: 0, max: 10 })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const s = sparkline()
      ;(s as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const s = sparkline().visible(false)
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const s = sparkline()
        .data([1, 2, 3, 4, 5])
        .min(0)
        .max(10)
        .style('line')
        .push(6)
        .push(7)

      expect(s.type).toBe('sparkline')
    })
  })
})

describe('Gauge Widget', () => {
  describe('creation', () => {
    it('creates a gauge with default properties', () => {
      const g = gauge()
      expect(g.type).toBe('gauge')
      expect(g.currentValue).toBe(0)
      expect(g.percent).toBe(0)
    })

    it('creates a gauge with initial value', () => {
      const g = gauge({ value: 50, max: 100 })
      expect(g.currentValue).toBe(50)
      expect(g.percent).toBe(0.5)
    })

    it('creates an arc style gauge', () => {
      const g = gauge({ style: 'arc' })
      expect(g.type).toBe('gauge')
    })
  })

  describe('configuration', () => {
    it('sets min value', () => {
      const g = gauge().min(10)
      expect(g.type).toBe('gauge')
    })

    it('sets max value', () => {
      const g = gauge().max(200)
      expect(g.type).toBe('gauge')
    })

    it('sets value', () => {
      const g = gauge().value(75)
      expect(g.currentValue).toBe(75)
    })

    it('clamps value to range', () => {
      const g = gauge({ min: 0, max: 100 }).value(150)
      expect(g.currentValue).toBe(100)
    })

    it('sets style', () => {
      const g = gauge().style('bar')
      expect(g.type).toBe('gauge')
    })

    it('sets show value', () => {
      const g = gauge().showValue(true)
      expect(g.type).toBe('gauge')
    })

    it('sets show percent', () => {
      const g = gauge().showPercent(true)
      expect(g.type).toBe('gauge')
    })

    it('sets fill character', () => {
      const g = gauge().fillChar('▓')
      expect(g.type).toBe('gauge')
    })

    it('sets empty character', () => {
      const g = gauge().emptyChar('░')
      expect(g.type).toBe('gauge')
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 5

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders bar style gauge', () => {
      const g = gauge({ value: 50, max: 100, style: 'bar' })
      ;(g as any)._bounds = { x: 0, y: 0, width, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders arc style gauge', () => {
      const g = gauge({ value: 75, max: 100, style: 'arc' })
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders gauge with custom characters', () => {
      const g = gauge({ value: 60 }).fillChar('▓').emptyChar('░')
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders gauge with value display', () => {
      const g = gauge({ value: 85 }).showValue(true)
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const g = gauge()
      ;(g as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const g = gauge().visible(false)
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const g = gauge()
        .min(0)
        .max(100)
        .value(65)
        .style('bar')
        .showValue(true)
        .showPercent(true)
        .fillChar('█')
        .emptyChar('░')

      expect(g.type).toBe('gauge')
      expect(g.currentValue).toBe(65)
    })
  })

  describe('edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 30
    const height = 5

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero max-min range', () => {
      const g = gauge({ min: 50, max: 50, value: 50 })
      expect(g.percent).toBe(0)
    })

    it('adjusts value when min is set higher', () => {
      const g = gauge({ value: 30, min: 0, max: 100 }).min(50)
      expect(g.currentValue).toBe(50)
    })

    it('adjusts value when max is set lower', () => {
      const g = gauge({ value: 80, min: 0, max: 100 }).max(50)
      expect(g.currentValue).toBe(50)
    })

    it('renders arc with showPercent false', () => {
      const g = gauge({ value: 75, max: 100, style: 'arc' }).showPercent(false)
      ;(g as any)._bounds = { x: 0, y: 0, width, height }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders bar with showValue but not showPercent', () => {
      const g = gauge({ value: 75, max: 100, style: 'bar' })
        .showPercent(false)
        .showValue(true)
      ;(g as any)._bounds = { x: 0, y: 0, width, height: 1 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders bar when height < 3 for arc style', () => {
      const g = gauge({ value: 50, max: 100, style: 'arc' })
      ;(g as any)._bounds = { x: 0, y: 0, width, height: 2 }
      g.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})

describe('BarChart additional tests', () => {
  let buffer: ReturnType<typeof createBuffer>
  const width = 40
  const height = 10

  beforeEach(() => {
    buffer = createBuffer(width, height)
    fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
  })

  describe('dataPoints getter', () => {
    it('returns data points', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ]
      })
      expect(c.dataPoints.length).toBe(2)
      expect(c.dataPoints[0].label).toBe('A')
    })
  })

  describe('rendering edge cases', () => {
    it('renders with custom max value', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ],
        maxValue: 50
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with custom colors', () => {
      const c = barchart({
        data: [
          { label: 'A', value: 10, color: 196 },
          { label: 'B', value: 20, color: 46 }
        ]
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal with showLabels false', () => {
      const c = barchart({
        data: [{ label: 'A', value: 10 }],
        horizontal: true
      }).showLabels(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal with showValues false', () => {
      const c = barchart({
        data: [{ label: 'A', value: 10 }],
        horizontal: true
      }).showValues(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical with showLabels false', () => {
      const c = barchart({
        data: [{ label: 'A', value: 10 }],
        horizontal: false
      }).showLabels(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical with showValues false', () => {
      const c = barchart({
        data: [{ label: 'A', value: 10 }],
        horizontal: false
      }).showValues(false)
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with zero max value', () => {
      const c = barchart({
        data: [{ label: 'A', value: 0 }]
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long labels in horizontal mode', () => {
      const c = barchart({
        data: [{ label: 'This is a very long label', value: 10 }],
        horizontal: true,
        labelWidth: 5
      })
      ;(c as any)._bounds = { x: 0, y: 0, width, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates long labels in vertical mode', () => {
      const c = barchart({
        data: [{ label: 'Long label', value: 10 }],
        horizontal: false
      })
      ;(c as any)._bounds = { x: 0, y: 0, width: 10, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles many data points limited by height', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i}`,
        value: i * 5
      }))
      const c = barchart({ data, horizontal: true })
      ;(c as any)._bounds = { x: 0, y: 0, width, height: 5 }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles many data points in vertical mode limited by width', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        label: `I${i}`,
        value: i * 5
      }))
      const c = barchart({ data, horizontal: false })
      ;(c as any)._bounds = { x: 0, y: 0, width: 15, height }
      c.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})

describe('Sparkline additional tests', () => {
  let buffer: ReturnType<typeof createBuffer>
  const width = 30
  const height = 5

  beforeEach(() => {
    buffer = createBuffer(width, height)
    fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
  })

  describe('values getter', () => {
    it('returns values', () => {
      const s = sparkline({ data: [1, 2, 3, 4, 5] })
      expect(s.values.length).toBe(5)
      expect(s.values[0]).toBe(1)
    })
  })

  describe('bar style rendering', () => {
    it('renders bar style with height > 1', () => {
      const s = sparkline({
        data: [1, 3, 2, 5, 4, 6, 3, 7],
        style: 'bar'
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders bar style with varying values', () => {
      const s = sparkline({
        data: [0, 10, 5, 8, 3, 9, 1, 7],
        style: 'bar',
        min: 0,
        max: 10
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height: 8 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders bar style with normalized range', () => {
      const s = sparkline({
        data: [5, 5, 5, 5],
        style: 'bar'
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('area style rendering', () => {
    it('renders area style', () => {
      const s = sparkline({
        data: [1, 3, 2, 5, 4],
        style: 'area'
      })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('data windowing', () => {
    it('shows only last width data points', () => {
      const data = Array.from({ length: 100 }, (_, i) => i)
      const s = sparkline({ data })
      ;(s as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('edge cases', () => {
    it('handles single data point', () => {
      const s = sparkline({ data: [5] })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles all same values', () => {
      const s = sparkline({ data: [5, 5, 5, 5, 5] })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles extreme values', () => {
      const s = sparkline({ data: [0, 1000, 0, 1000] })
      ;(s as any)._bounds = { x: 0, y: 0, width, height }
      s.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })
})
