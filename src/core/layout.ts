/**
 * @oxog/tui - Layout Engine
 * @packageDocumentation
 */

import type {
  LayoutEngine,
  Node,
  Bounds,
  Dimension,
  Spacing,
  ResolvedSpacing,
  LayoutProps
} from '../types'
import { LAYOUT_MAX_DEPTH } from '../constants'

// ============================================================
// Layout Engine Implementation
// ============================================================

/**
 * Create a layout engine.
 *
 * @returns Layout engine instance
 *
 * @example
 * ```typescript
 * const engine = createLayoutEngine()
 * engine.compute(root, 80, 24)
 * ```
 */
export function createLayoutEngine(): LayoutEngine {
  return {
    compute(root: Node, availableWidth: number, availableHeight: number): void {
      // Set root bounds
      const rootLayout = getLayoutProps(root)

      const rootBounds: Bounds = {
        x: 0,
        y: 0,
        width: resolveDimension(rootLayout.width, availableWidth),
        height: resolveDimension(rootLayout.height, availableHeight)
      }

      // Apply constraints
      rootBounds.width = applyConstraints(
        rootBounds.width,
        rootLayout.minWidth,
        rootLayout.maxWidth,
        availableWidth
      )
      rootBounds.height = applyConstraints(
        rootBounds.height,
        rootLayout.minHeight,
        rootLayout.maxHeight,
        availableHeight
      )

      setBounds(root, rootBounds)

      // Layout children
      if (root.children.length > 0) {
        layoutChildren(root, 0)
      }
    }
  }
}

/**
 * Layout children of a node.
 *
 * @param node - Parent node
 * @param depth - Current recursion depth
 */
function layoutChildren(node: Node, depth: number): void {
  // Prevent stack overflow from deeply nested or circular structures
  if (depth >= LAYOUT_MAX_DEPTH) {
    console.error(
      `[layout] Maximum recursion depth (${LAYOUT_MAX_DEPTH}) exceeded! ` +
      `This indicates either extremely deep nesting (200+ levels) or a circular reference. ` +
      `Node: ${node.id}, Type: ${node.type}. ` +
      `Children will not be laid out.`
    )
    // Set all children to have zero bounds to prevent render errors
    for (const child of node.children) {
      if (child.isVisible) {
        setBounds(child, { x: 0, y: 0, width: 0, height: 0 })
      }
    }
    return
  }
  const layout = getLayoutProps(node)
  const bounds = node.bounds
  const padding = resolvePadding(layout.padding)

  // Content area
  const contentX = bounds.x + padding.left
  const contentY = bounds.y + padding.top
  const contentWidth = Math.max(0, bounds.width - padding.left - padding.right)
  const contentHeight = Math.max(0, bounds.height - padding.top - padding.bottom)

  const children = node.children.filter(c => c.isVisible)
  if (children.length === 0) return

  const direction = layout.flexDirection ?? 'column'
  const justify = layout.justifyContent ?? 'start'
  const align = layout.alignItems ?? 'stretch'
  const gap = layout.gap ?? 0

  const isRow = direction === 'row'
  const mainSize = isRow ? contentWidth : contentHeight
  const crossSize = isRow ? contentHeight : contentWidth
  const totalGap = gap * Math.max(0, children.length - 1)

  // Calculate flex totals and fixed sizes
  let totalFlex = 0
  let fixedMain = 0

  for (const child of children) {
    const childLayout = getLayoutProps(child)
    const flex = childLayout.flex ?? 0

    if (flex > 0) {
      totalFlex += flex
    } else {
      const childMainSize = isRow
        ? resolveDimension(childLayout.width, contentWidth)
        : resolveDimension(childLayout.height, contentHeight)
      fixedMain += childMainSize
    }
  }

  const availableForFlex = Math.max(0, mainSize - totalGap - fixedMain)

  // Calculate positions
  let mainOffset = isRow ? contentX : contentY
  const crossOffset = isRow ? contentY : contentX

  // Apply justify-content
  const usedMain = fixedMain + (totalFlex > 0 ? availableForFlex : 0) + totalGap
  const freeSpace = Math.max(0, mainSize - usedMain)

  let spaceBetween = 0
  let spaceAround = 0

  switch (justify) {
    case 'center':
      mainOffset += freeSpace / 2
      break
    case 'end':
      mainOffset += freeSpace
      break
    case 'between':
      if (children.length > 1) {
        spaceBetween = freeSpace / (children.length - 1)
      }
      break
    case 'around':
      spaceAround = freeSpace / (children.length * 2)
      mainOffset += spaceAround
      break
  }

  // Track accumulated remainder for precise pixel distribution
  // This prevents losing pixels when dividing space (e.g., 100/3 = 33+33+33 = 99, losing 1px)
  let accumulatedRemainder = 0

  // Position each child
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!
    const isLastChild = i === children.length - 1
    const childLayout = getLayoutProps(child)
    const flex = childLayout.flex ?? 0

    // Main axis size (floating point for precision)
    let childMainSize: number
    if (flex > 0 && totalFlex > 0) {
      childMainSize = (availableForFlex * flex) / totalFlex
    } else {
      childMainSize = isRow
        ? resolveDimension(childLayout.width, contentWidth)
        : resolveDimension(childLayout.height, contentHeight)
    }

    // Apply constraints
    if (isRow) {
      childMainSize = applyConstraints(
        childMainSize,
        childLayout.minWidth,
        childLayout.maxWidth,
        contentWidth
      )
    } else {
      childMainSize = applyConstraints(
        childMainSize,
        childLayout.minHeight,
        childLayout.maxHeight,
        contentHeight
      )
    }

    // Cross axis size
    let childCrossSize: number
    const childAlignSelf = childLayout.alignSelf ?? 'auto'
    const effectiveAlign = childAlignSelf === 'auto' ? align : childAlignSelf

    if (effectiveAlign === 'stretch') {
      childCrossSize = crossSize
    } else {
      childCrossSize = isRow
        ? resolveDimension(childLayout.height, contentHeight)
        : resolveDimension(childLayout.width, contentWidth)
    }

    // Apply constraints
    if (isRow) {
      childCrossSize = applyConstraints(
        childCrossSize,
        childLayout.minHeight,
        childLayout.maxHeight,
        contentHeight
      )
    } else {
      childCrossSize = applyConstraints(
        childCrossSize,
        childLayout.minWidth,
        childLayout.maxWidth,
        contentWidth
      )
    }

    // Cross axis offset
    let childCrossOffset = crossOffset
    const crossFreeSpace = crossSize - childCrossSize

    switch (effectiveAlign) {
      case 'center':
        childCrossOffset += crossFreeSpace / 2
        break
      case 'end':
        childCrossOffset += crossFreeSpace
        break
    }

    // Calculate final main size with precision correction
    let finalMainSize: number
    if (isLastChild && flex > 0) {
      // Last flex child gets remaining space to prevent pixel loss
      const contentEnd = isRow ? contentX + contentWidth : contentY + contentHeight
      finalMainSize = Math.max(0, Math.floor(contentEnd - mainOffset))
      // Re-apply constraints to the expanded size (maxWidth/maxHeight must still be respected)
      if (isRow) {
        finalMainSize = applyConstraints(
          finalMainSize,
          childLayout.minWidth,
          childLayout.maxWidth,
          contentWidth
        )
      } else {
        finalMainSize = applyConstraints(
          finalMainSize,
          childLayout.minHeight,
          childLayout.maxHeight,
          contentHeight
        )
      }
    } else {
      // Add accumulated remainder before flooring for better distribution
      const adjustedSize = childMainSize + accumulatedRemainder
      finalMainSize = Math.floor(adjustedSize)
      accumulatedRemainder = adjustedSize - finalMainSize
    }

    // Set child bounds
    const childBounds: Bounds = isRow
      ? {
          x: Math.floor(mainOffset),
          y: Math.floor(childCrossOffset),
          width: finalMainSize,
          height: Math.floor(childCrossSize)
        }
      : {
          x: Math.floor(childCrossOffset),
          y: Math.floor(mainOffset),
          width: Math.floor(childCrossSize),
          height: finalMainSize
        }

    setBounds(child, childBounds)

    // Recursively layout grandchildren
    if (child.children.length > 0) {
      layoutChildren(child, depth + 1)
    }

    // Move to next position
    mainOffset += childMainSize + gap + spaceBetween
    if (justify === 'around') {
      mainOffset += spaceAround * 2
    }
  }
}

// ============================================================
// Dimension Resolution
// ============================================================

/**
 * Resolve a dimension value to pixels.
 *
 * @param dim - Dimension value
 * @param available - Available space
 * @returns Resolved pixel value
 *
 * @example
 * ```typescript
 * resolveDimension(100, 200)    // 100
 * resolveDimension('50%', 200)  // 100
 * resolveDimension('auto', 200) // 200
 * ```
 */
export function resolveDimension(dim: Dimension | undefined, available: number): number {
  // Validate available space
  if (!isFinite(available) || available <= 0) {
    return 0
  }

  if (dim === undefined || dim === 'auto') {
    return available
  }

  if (typeof dim === 'number') {
    // Validate and clamp numeric dimension
    if (!isFinite(dim)) {
      console.warn(
        `[layout] Invalid numeric dimension specified: ${dim}. ` +
        `Dimensions must be finite numbers. Using available space.`
      )
      return available
    }
    return Math.max(0, Math.floor(dim))
  }

  // Percentage
  const percentStr = dim.replace('%', '')
  const percent = parseFloat(percentStr)

  // Validate parsed percentage
  if (!isFinite(percent) || isNaN(percent)) {
    console.warn(
      `[layout] Invalid percentage dimension specified: "${dim}". ` +
      `Could not parse as percentage. Using available space.`
    )
    return available
  }

  // Clamp percentage to valid range (0% to 100%)
  // Values >100% typically indicate a layout error and could cause overflow
  if (percent > 100) {
    console.warn(
      `[layout] Percentage >100% specified (${percent}%). ` +
      `This may indicate a layout error. Clamping to 100%.`
    )
  }
  if (percent < 0) {
    console.warn(
      `[layout] Negative percentage specified (${percent}%). ` +
      `This is not valid. Using 0% instead.`
    )
  }
  const clampedPercent = Math.max(0, Math.min(100, percent))
  return Math.floor((available * clampedPercent) / 100)
}

/**
 * Apply min/max constraints.
 *
 * @param value - Current value
 * @param min - Minimum value
 * @param max - Maximum value
 * @param available - Available space (for percentage values)
 * @returns Constrained value
 */
export function applyConstraints(
  value: number,
  min: number | undefined,
  max: number | undefined,
  available: number
): number {
  let result = value

  if (min !== undefined) {
    result = Math.max(result, min)
  }

  if (max !== undefined) {
    result = Math.min(result, max)
  }

  return Math.max(0, Math.min(result, available))
}

// ============================================================
// Padding/Margin Resolution
// ============================================================

/**
 * Resolve spacing value to all four sides.
 *
 * @param spacing - Spacing value
 * @returns Resolved spacing for all sides
 *
 * @example
 * ```typescript
 * resolvePadding(1)          // { top: 1, right: 1, bottom: 1, left: 1 }
 * resolvePadding([1, 2])     // { top: 1, right: 2, bottom: 1, left: 2 }
 * resolvePadding([1,2,3,4])  // { top: 1, right: 2, bottom: 3, left: 4 }
 * ```
 */
export function resolvePadding(spacing: Spacing | undefined): ResolvedSpacing {
  if (spacing === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  if (typeof spacing === 'number') {
    return { top: spacing, right: spacing, bottom: spacing, left: spacing }
  }

  if (spacing.length === 2) {
    const [vertical, horizontal] = spacing
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal }
  }

  const [top, right, bottom, left] = spacing
  return { top, right, bottom, left }
}

/**
 * Alias for resolvePadding (same logic for margin).
 */
export const resolveMargin = resolvePadding

// ============================================================
// Node Helpers
// ============================================================

/**
 * Type guard to check if an object has a specific property.
 */
function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

/**
 * Check if a value is a valid LayoutProps object.
 */
function isValidLayoutProps(value: unknown): value is LayoutProps {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // Check that all properties in LayoutProps are valid types
  const props = value as Record<string, unknown>

  // Validate width
  if (
    props.width !== undefined &&
    typeof props.width !== 'number' &&
    typeof props.width !== 'string'
  ) {
    return false
  }

  // Validate height
  if (
    props.height !== undefined &&
    typeof props.height !== 'number' &&
    typeof props.height !== 'string'
  ) {
    return false
  }

  // Validate flex
  if (props.flex !== undefined && typeof props.flex !== 'number') {
    return false
  }

  // Validate flexDirection
  if (
    props.flexDirection !== undefined &&
    typeof props.flexDirection !== 'string'
  ) {
    return false
  }

  // Validate other properties...
  return true
}

/**
 * Get layout props from a node.
 * Works with internal node structure with proper type safety.
 *
 * @param node - Node to get layout from
 * @returns Layout props
 */
function getLayoutProps(node: Node): LayoutProps {
  // Access internal _layout property with comprehensive type guard
  if (
    hasProperty(node, '_layout') &&
    node._layout !== null &&
    typeof node._layout === 'object' &&
    isValidLayoutProps(node._layout)
  ) {
    return node._layout
  }
  return {}
}

/**
 * Set bounds on a node.
 * Works with both internal node structure and test mocks.
 *
 * @param node - Node to set bounds on
 * @param bounds - Bounds to set
 */
function setBounds(node: Node, bounds: Bounds): void {
  // Try to use the internal _bounds property first (real BaseNode instances)
  if (
    hasProperty(node, '_bounds') &&
    node._bounds !== null &&
    typeof node._bounds === 'object'
  ) {
    const boundsObj = node._bounds as { x: number; y: number; width: number; height: number }
    if (
      typeof boundsObj.x === 'number' &&
      typeof boundsObj.y === 'number' &&
      typeof boundsObj.width === 'number' &&
      typeof boundsObj.height === 'number'
    ) {
      // Valid bounds object, update it
      boundsObj.x = bounds.x
      boundsObj.y = bounds.y
      boundsObj.width = bounds.width
      boundsObj.height = bounds.height
      return
    }
  }

  // Fallback: Try to use the _bounds setter if it exists
  // Check both the object itself and its prototype chain
  try {
    const descriptor =
      Object.getOwnPropertyDescriptor(node, '_bounds') ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), '_bounds')
    if (descriptor && descriptor.set) {
      // Use the setter (test mocks have this)
      descriptor.set.call(node, bounds)
    }
  } catch {
    // Ignore errors, the setter might not exist or might throw
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Calculate minimum size needed for content.
 *
 * @param node - Node to measure
 * @param depth - Current recursion depth (internal)
 * @returns Minimum width and height
 */
export function measureContent(node: Node, depth: number = 0): { width: number; height: number } {
  // Prevent stack overflow from deeply nested or circular structures
  if (depth >= LAYOUT_MAX_DEPTH) {
    console.warn(
      `[layout] measureContent exceeded maximum depth (${LAYOUT_MAX_DEPTH}). ` +
      `Node: ${node.id}, Type: ${node.type}. This may indicate a circular reference.`
    )
    return { width: 0, height: 0 }
  }

  const layout = getLayoutProps(node)

  // If fixed size, return that
  if (typeof layout.width === 'number' && typeof layout.height === 'number') {
    return { width: layout.width, height: layout.height }
  }

  // For containers, measure children
  if (node.children.length > 0) {
    const direction = layout.flexDirection ?? 'column'
    const gap = layout.gap ?? 0
    const padding = resolvePadding(layout.padding)

    let width = 0
    let height = 0

    for (const child of node.children.filter(c => c.isVisible)) {
      const childSize = measureContent(child, depth + 1)

      if (direction === 'row') {
        width += childSize.width
        height = Math.max(height, childSize.height)
      } else {
        width = Math.max(width, childSize.width)
        height += childSize.height
      }
    }

    // Add gaps
    const numChildren = node.children.filter(c => c.isVisible).length
    if (direction === 'row') {
      width += gap * Math.max(0, numChildren - 1)
    } else {
      height += gap * Math.max(0, numChildren - 1)
    }

    // Add padding
    width += padding.left + padding.right
    height += padding.top + padding.bottom

    return { width, height }
  }

  // Default minimum size
  return { width: 0, height: 0 }
}

/**
 * Check if bounds intersect.
 *
 * @param a - First bounds
 * @param b - Second bounds
 * @returns True if intersecting
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

/**
 * Check if point is inside bounds.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bounds - Bounds to check
 * @returns True if inside
 */
export function pointInBounds(x: number, y: number, bounds: Bounds): boolean {
  return (
    x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height
  )
}

/**
 * Get intersection of two bounds.
 *
 * @param a - First bounds
 * @param b - Second bounds
 * @returns Intersection bounds or null
 */
export function boundsIntersection(a: Bounds, b: Bounds): Bounds | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)

  if (right <= x || bottom <= y) {
    return null
  }

  return { x, y, width: right - x, height: bottom - y }
}
