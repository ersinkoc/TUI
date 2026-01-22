/**
 * @oxog/tui - Layout Engine Tests
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createLayoutEngine,
  resolveDimension,
  applyConstraints,
  resolvePadding,
  resolveMargin,
  measureContent,
  boundsIntersect,
  pointInBounds,
  boundsIntersection
} from '../../src/core/layout'
import type { Node, Bounds, LayoutProps } from '../../src/types'

// Helper to create mock nodes with proper bounds getter
function createMockNode(layout: LayoutProps = {}, children: Node[] = []): Node {
  const internal = {
    _layout: layout,
    _bounds: { x: 0, y: 0, width: 0, height: 0 }
  }

  const node = {
    id: Math.random().toString(36),
    type: 'box',
    parent: null,
    children,
    isVisible: true,
    render: () => {},
    get bounds() {
      return internal._bounds
    },
    get _layout() {
      return internal._layout
    },
    set _bounds(value: Bounds) {
      internal._bounds = value
    }
  } as unknown as Node

  // Set parent reference for children
  children.forEach(c => {
    (c as { parent: Node | null }).parent = node
  })
  return node
}

describe('resolveDimension', () => {
  it('returns available for undefined', () => {
    expect(resolveDimension(undefined, 100)).toBe(100)
  })

  it('returns available for auto', () => {
    expect(resolveDimension('auto', 100)).toBe(100)
  })

  it('returns number directly', () => {
    expect(resolveDimension(50, 100)).toBe(50)
  })

  it('resolves percentage', () => {
    expect(resolveDimension('50%', 100)).toBe(50)
    expect(resolveDimension('100%', 200)).toBe(200)
    expect(resolveDimension('25%', 80)).toBe(20)
  })

  it('floors percentage results', () => {
    expect(resolveDimension('33%', 100)).toBe(33)
    expect(resolveDimension('33.33%', 100)).toBe(33)
  })
})

describe('applyConstraints', () => {
  it('returns value when no constraints', () => {
    expect(applyConstraints(50, undefined, undefined, 100)).toBe(50)
  })

  it('applies minimum', () => {
    expect(applyConstraints(10, 20, undefined, 100)).toBe(20)
    expect(applyConstraints(30, 20, undefined, 100)).toBe(30)
  })

  it('applies maximum', () => {
    expect(applyConstraints(80, undefined, 60, 100)).toBe(60)
    expect(applyConstraints(40, undefined, 60, 100)).toBe(40)
  })

  it('applies both min and max', () => {
    expect(applyConstraints(50, 30, 70, 100)).toBe(50)
    expect(applyConstraints(20, 30, 70, 100)).toBe(30)
    expect(applyConstraints(90, 30, 70, 100)).toBe(70)
  })

  it('clamps to available space', () => {
    expect(applyConstraints(150, undefined, undefined, 100)).toBe(100)
  })

  it('ensures non-negative', () => {
    expect(applyConstraints(-10, undefined, undefined, 100)).toBe(0)
  })
})

describe('resolvePadding', () => {
  it('returns zeros for undefined', () => {
    expect(resolvePadding(undefined)).toEqual({
      top: 0, right: 0, bottom: 0, left: 0
    })
  })

  it('spreads single number to all sides', () => {
    expect(resolvePadding(5)).toEqual({
      top: 5, right: 5, bottom: 5, left: 5
    })
  })

  it('handles two-value array (vertical, horizontal)', () => {
    expect(resolvePadding([2, 4])).toEqual({
      top: 2, right: 4, bottom: 2, left: 4
    })
  })

  it('handles four-value array (top, right, bottom, left)', () => {
    expect(resolvePadding([1, 2, 3, 4])).toEqual({
      top: 1, right: 2, bottom: 3, left: 4
    })
  })
})

describe('resolveMargin', () => {
  it('is alias for resolvePadding', () => {
    expect(resolveMargin).toBe(resolvePadding)
    expect(resolveMargin(5)).toEqual({
      top: 5, right: 5, bottom: 5, left: 5
    })
  })
})

describe('boundsIntersect', () => {
  it('returns true for overlapping bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 5, y: 5, width: 10, height: 10 }
    expect(boundsIntersect(a, b)).toBe(true)
  })

  it('returns false for non-overlapping horizontal', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 20, y: 0, width: 10, height: 10 }
    expect(boundsIntersect(a, b)).toBe(false)
  })

  it('returns false for non-overlapping vertical', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 0, y: 20, width: 10, height: 10 }
    expect(boundsIntersect(a, b)).toBe(false)
  })

  it('returns false for adjacent bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 10, y: 0, width: 10, height: 10 }
    expect(boundsIntersect(a, b)).toBe(false)
  })

  it('returns true for contained bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 20, height: 20 }
    const b: Bounds = { x: 5, y: 5, width: 5, height: 5 }
    expect(boundsIntersect(a, b)).toBe(true)
  })
})

describe('pointInBounds', () => {
  it('returns true for point inside', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 }
    expect(pointInBounds(15, 15, bounds)).toBe(true)
    expect(pointInBounds(10, 10, bounds)).toBe(true)
    expect(pointInBounds(29, 29, bounds)).toBe(true)
  })

  it('returns false for point outside', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 }
    expect(pointInBounds(5, 15, bounds)).toBe(false)
    expect(pointInBounds(15, 5, bounds)).toBe(false)
    expect(pointInBounds(35, 15, bounds)).toBe(false)
    expect(pointInBounds(15, 35, bounds)).toBe(false)
  })

  it('returns false for point on far edge', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 }
    expect(pointInBounds(30, 15, bounds)).toBe(false)
    expect(pointInBounds(15, 30, bounds)).toBe(false)
  })
})

describe('boundsIntersection', () => {
  it('returns intersection for overlapping bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 5, y: 5, width: 10, height: 10 }
    expect(boundsIntersection(a, b)).toEqual({
      x: 5, y: 5, width: 5, height: 5
    })
  })

  it('returns null for non-overlapping bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 20, y: 20, width: 10, height: 10 }
    expect(boundsIntersection(a, b)).toBeNull()
  })

  it('returns null for adjacent bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 }
    const b: Bounds = { x: 10, y: 0, width: 10, height: 10 }
    expect(boundsIntersection(a, b)).toBeNull()
  })

  it('returns smaller bounds for containment', () => {
    const a: Bounds = { x: 0, y: 0, width: 20, height: 20 }
    const b: Bounds = { x: 5, y: 5, width: 5, height: 5 }
    expect(boundsIntersection(a, b)).toEqual({
      x: 5, y: 5, width: 5, height: 5
    })
  })
})

describe('measureContent', () => {
  it('returns fixed dimensions if set', () => {
    const node = createMockNode({ width: 50, height: 30 })
    expect(measureContent(node)).toEqual({ width: 50, height: 30 })
  })

  it('returns zero for empty node', () => {
    const node = createMockNode({})
    expect(measureContent(node)).toEqual({ width: 0, height: 0 })
  })

  it('measures column children', () => {
    const child1 = createMockNode({ width: 20, height: 10 })
    const child2 = createMockNode({ width: 30, height: 15 })
    const parent = createMockNode({ flexDirection: 'column' }, [child1, child2])

    expect(measureContent(parent)).toEqual({ width: 30, height: 25 })
  })

  it('measures row children', () => {
    const child1 = createMockNode({ width: 20, height: 10 })
    const child2 = createMockNode({ width: 30, height: 15 })
    const parent = createMockNode({ flexDirection: 'row' }, [child1, child2])

    expect(measureContent(parent)).toEqual({ width: 50, height: 15 })
  })

  it('includes gap in measurement', () => {
    const child1 = createMockNode({ width: 20, height: 10 })
    const child2 = createMockNode({ width: 30, height: 15 })
    const parent = createMockNode({ flexDirection: 'column', gap: 5 }, [child1, child2])

    expect(measureContent(parent)).toEqual({ width: 30, height: 30 })
  })

  it('includes padding in measurement', () => {
    const child = createMockNode({ width: 20, height: 10 })
    const parent = createMockNode({ padding: 5 }, [child])

    expect(measureContent(parent)).toEqual({ width: 30, height: 20 })
  })

  it('excludes invisible children', () => {
    const child1 = createMockNode({ width: 20, height: 10 })
    const child2 = createMockNode({ width: 30, height: 15 });
    (child2 as { isVisible: boolean }).isVisible = false
    const parent = createMockNode({ flexDirection: 'column' }, [child1, child2])

    expect(measureContent(parent)).toEqual({ width: 20, height: 10 })
  })

  it('returns zero dimensions when depth limit exceeded', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const node = createMockNode({ width: 100, height: 100 })

    // Call with depth already at/above LAYOUT_MAX_DEPTH (200)
    const result = measureContent(node, 200)

    expect(result).toEqual({ width: 0, height: 0 })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('measureContent exceeded maximum depth')
    )
    consoleSpy.mockRestore()
  })
})

describe('createLayoutEngine', () => {
  it('creates a layout engine', () => {
    const engine = createLayoutEngine()
    expect(engine).toBeDefined()
    expect(engine.compute).toBeInstanceOf(Function)
  })

  it('computes root bounds', () => {
    const engine = createLayoutEngine()
    const root = createMockNode({ width: 80, height: 24 })

    engine.compute(root, 80, 24)

    expect(root.bounds).toEqual({ x: 0, y: 0, width: 80, height: 24 })
  })

  it('computes root with auto dimensions', () => {
    const engine = createLayoutEngine()
    const root = createMockNode({})

    engine.compute(root, 100, 50)

    expect(root.bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 })
  })

  it('applies constraints to root', () => {
    const engine = createLayoutEngine()
    const root = createMockNode({ minWidth: 40, maxWidth: 60 })

    engine.compute(root, 100, 50)

    expect(root.bounds.width).toBe(60)
  })

  it('layouts column children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ height: 20 })
    const root = createMockNode({ flexDirection: 'column' }, [child1, child2])

    engine.compute(root, 80, 40)

    expect(child1.bounds.y).toBe(0)
    expect(child2.bounds.y).toBe(10)
  })

  it('layouts row children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ width: 20 })
    const child2 = createMockNode({ width: 30 })
    const root = createMockNode({ flexDirection: 'row' }, [child1, child2])

    engine.compute(root, 80, 40)

    expect(child1.bounds.x).toBe(0)
    expect(child2.bounds.x).toBe(20)
  })

  it('applies padding', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({})
    const root = createMockNode({ padding: 5 }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.x).toBe(5)
    expect(child.bounds.y).toBe(5)
    expect(child.bounds.width).toBe(70)
    expect(child.bounds.height).toBe(30)
  })

  it('applies gap between children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column', gap: 5 }, [child1, child2])

    engine.compute(root, 80, 40)

    expect(child1.bounds.y).toBe(0)
    expect(child2.bounds.y).toBe(15)
  })

  it('handles flex distribution', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ flex: 1 })
    const child2 = createMockNode({ flex: 2 })
    const root = createMockNode({ flexDirection: 'column' }, [child1, child2])

    engine.compute(root, 80, 30)

    expect(child1.bounds.height).toBe(10)
    expect(child2.bounds.height).toBe(20)
  })

  it('handles justify-content: center', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column', justifyContent: 'center' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.y).toBe(15)
  })

  it('handles justify-content: end', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column', justifyContent: 'end' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.y).toBe(30)
  })

  it('handles justify-content: between', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column', justifyContent: 'between' }, [child1, child2])

    engine.compute(root, 80, 40)

    expect(child1.bounds.y).toBe(0)
    expect(child2.bounds.y).toBe(30)
  })

  it('handles justify-content: around', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column', justifyContent: 'around' }, [child1, child2])

    engine.compute(root, 80, 40)

    // Free space = 20, spaceAround = 5, offset starts at 5
    expect(child1.bounds.y).toBe(5)
    expect(child2.bounds.y).toBe(25)
  })

  it('handles align-items: center', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: 20, height: 10 })
    const root = createMockNode({ flexDirection: 'column', alignItems: 'center' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.x).toBe(30)
  })

  it('handles align-items: end', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: 20, height: 10 })
    const root = createMockNode({ flexDirection: 'column', alignItems: 'end' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.x).toBe(60)
  })

  it('handles align-items: stretch (default)', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.width).toBe(80)
  })

  it('handles alignSelf override', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: 20, height: 10, alignSelf: 'center' })
    const root = createMockNode({ flexDirection: 'column', alignItems: 'start' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.x).toBe(30)
  })

  it('handles alignItems in row layout with non-stretch alignment', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: 20, height: 10 })
    const root = createMockNode({ flexDirection: 'row', alignItems: 'center' }, [child])

    engine.compute(root, 80, 40)

    // Child should be centered vertically in row layout
    expect(child.bounds.y).toBe(15) // (40 - 10) / 2 = 15
    expect(child.bounds.height).toBe(10)
  })

  it('skips invisible children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ height: 10 });
    (child2 as { isVisible: boolean }).isVisible = false
    const child3 = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column' }, [child1, child2, child3])

    engine.compute(root, 80, 40)

    expect(child1.bounds.y).toBe(0)
    expect(child3.bounds.y).toBe(10)
  })

  it('recursively layouts grandchildren', () => {
    const engine = createLayoutEngine()
    const grandchild = createMockNode({ width: 20, height: 10 })
    const child = createMockNode({ padding: 5 }, [grandchild])
    const root = createMockNode({}, [child])

    engine.compute(root, 80, 40)

    expect(grandchild.bounds.x).toBe(5)
    expect(grandchild.bounds.y).toBe(5)
  })

  it('applies child constraints', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ flex: 1, maxHeight: 15 })
    const root = createMockNode({ flexDirection: 'column' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.height).toBe(15)
  })

  it('handles mixed fixed and flex children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    const child2 = createMockNode({ flex: 1 })
    const child3 = createMockNode({ height: 10 })
    const root = createMockNode({ flexDirection: 'column' }, [child1, child2, child3])

    engine.compute(root, 80, 40)

    expect(child1.bounds.height).toBe(10)
    expect(child2.bounds.height).toBe(20)
    expect(child3.bounds.height).toBe(10)
  })

  it('handles row with padding', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: 20, height: 10 })
    const root = createMockNode({ flexDirection: 'row', padding: [5, 10] }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.x).toBe(10)
    expect(child.bounds.y).toBe(5)
    expect(child.bounds.width).toBe(20)
    expect(child.bounds.height).toBe(30)
  })

  it('handles no children', () => {
    const engine = createLayoutEngine()
    const root = createMockNode({})

    engine.compute(root, 80, 40)

    expect(root.bounds).toEqual({ x: 0, y: 0, width: 80, height: 40 })
  })

  it('handles percentage widths', () => {
    const engine = createLayoutEngine()
    const child = createMockNode({ width: '50%', height: 10 })
    // Need alignItems: 'start' to prevent stretch from overriding width
    const root = createMockNode({ flexDirection: 'column', alignItems: 'start' }, [child])

    engine.compute(root, 80, 40)

    expect(child.bounds.width).toBe(40)
  })

  it('handles node with no visible children', () => {
    const engine = createLayoutEngine()
    const child1 = createMockNode({ height: 10 })
    ;(child1 as { isVisible: boolean }).isVisible = false
    const child2 = createMockNode({ height: 10 })
    ;(child2 as { isVisible: boolean }).isVisible = false
    const root = createMockNode({ flexDirection: 'column' }, [child1, child2])

    engine.compute(root, 80, 40)

    // Root should still have bounds, children should have zero bounds
    expect(root.bounds.width).toBe(80)
    expect(root.bounds.height).toBe(40)
  })

  it('handles node without _layout property', () => {
    const engine = createLayoutEngine()

    // Create a node without _layout using internal storage
    const internalBounds = { x: 0, y: 0, width: 0, height: 0 }

    const nodeWithoutLayout = {
      id: 'test',
      type: 'box',
      parent: null,
      children: [],
      isVisible: true,
      render: () => {},
      get bounds() {
        return internalBounds
      },
      set _bounds(value: Bounds) {
        Object.assign(internalBounds, value)
      }
    } as unknown as Node

    // Should not throw
    engine.compute(nodeWithoutLayout, 80, 40)

    expect(nodeWithoutLayout.bounds.width).toBe(80)
  })
})
