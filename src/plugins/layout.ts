/**
 * @oxog/tui - Layout Plugin
 * @packageDocumentation
 *
 * Core plugin that provides flexbox-like layout capabilities.
 * This plugin is required for automatic layout computation.
 */

import type { Plugin, TUIApp, Bounds, FlexDirection, FlexAlign, FlexJustify } from '../types'
import { BaseNode, ContainerNode } from '../widgets/node'
import { resolveDimension, resolvePadding, resolveMargin, applyConstraints } from '../core/layout'

// ============================================================
// Types
// ============================================================

/**
 * Layout plugin options.
 */
export interface LayoutPluginOptions {
  /** Debug mode - log layout calculations */
  debug?: boolean
}

/**
 * Layout plugin API exposed to the app.
 */
export interface LayoutPluginAPI {
  /** Force layout recalculation */
  recalculate(): void
  /** Get layout stats */
  getStats(): { layoutCount: number; lastLayoutTime: number }
}

// ============================================================
// Implementation
// ============================================================

/**
 * Calculate layout for a node and its children.
 */
function calculateLayout(node: BaseNode, availableBounds: Bounds, debug: boolean): void {
  const { x, y, width, height } = availableBounds
  const layout = node._layout

  // Resolve padding and margin
  const padding = resolvePadding(layout.padding)
  const margin = resolveMargin(layout.margin)

  // Calculate actual bounds after margin
  const marginedX = x + margin.left
  const marginedY = y + margin.top
  const marginedWidth = width - margin.left - margin.right
  const marginedHeight = height - margin.top - margin.bottom

  // Resolve dimensions
  let nodeWidth = resolveDimension(layout.width, marginedWidth)
  let nodeHeight = resolveDimension(layout.height, marginedHeight)

  // Apply constraints
  nodeWidth = applyConstraints(nodeWidth, layout.minWidth, layout.maxWidth, marginedWidth)
  nodeHeight = applyConstraints(nodeHeight, layout.minHeight, layout.maxHeight, marginedHeight)

  // Set node bounds
  node._bounds = {
    x: marginedX,
    y: marginedY,
    width: nodeWidth,
    height: nodeHeight
  }

  if (debug) {
    console.error(`[layout] ${node.type}#${node.id} bounds=${JSON.stringify(node._bounds)}`)
  }

  // Layout children if container
  if (node instanceof ContainerNode && node._children.length > 0) {
    layoutChildren(node, padding, debug)
  }
}

/**
 * Layout children within a container using flexbox-like algorithm.
 */
function layoutChildren(
  container: ContainerNode,
  padding: { top: number; right: number; bottom: number; left: number },
  debug: boolean
): void {
  const { x, y, width, height } = container._bounds
  const children = container._children.filter(c => c.isVisible)

  /* c8 ignore next */
  if (children.length === 0) return

  // Content area after padding
  const contentX = x + padding.left
  const contentY = y + padding.top
  const contentWidth = Math.max(0, width - padding.left - padding.right)
  const contentHeight = Math.max(0, height - padding.top - padding.bottom)

  const layout = container._layout
  /* c8 ignore next 4 */
  const direction: FlexDirection = layout.flexDirection ?? 'column'
  const justify: FlexJustify = layout.justifyContent ?? 'start'
  const align: FlexAlign = layout.alignItems ?? 'stretch'
  const gap = layout.gap ?? 0

  const isRow = direction === 'row'
  const isReverse = false // Reverse directions not supported in current API

  // Calculate sizes along main axis
  const mainSize = isRow ? contentWidth : contentHeight
  const crossSize = isRow ? contentHeight : contentWidth

  // First pass: measure children and calculate flex
  const childMeasurements: Array<{
    node: BaseNode
    mainSize: number
    crossSize: number
    flex: number
    resolved: boolean
  }> = []

  let totalFixedMain = 0
  let totalFlex = 0
  let visibleCount = 0

  for (const child of children) {
    const childLayout = child._layout
    const flex = childLayout.flex ?? 0

    let childMainSize = 0
    let childCrossSize = 0
    let resolved = false

    if (flex > 0) {
      // Flex items get sized later
      totalFlex += flex
    } else {
      // Fixed size items
      if (isRow) {
        childMainSize = resolveDimension(childLayout.width, contentWidth)
        childCrossSize = resolveDimension(childLayout.height, contentHeight)
      } else {
        childMainSize = resolveDimension(childLayout.height, contentHeight)
        childCrossSize = resolveDimension(childLayout.width, contentWidth)
      }

      // Apply constraints
      if (isRow) {
        childMainSize = applyConstraints(
          childMainSize,
          childLayout.minWidth,
          childLayout.maxWidth,
          contentWidth
        )
        childCrossSize = applyConstraints(
          childCrossSize,
          childLayout.minHeight,
          childLayout.maxHeight,
          contentHeight
        )
      } else {
        childMainSize = applyConstraints(
          childMainSize,
          childLayout.minHeight,
          childLayout.maxHeight,
          contentHeight
        )
        childCrossSize = applyConstraints(
          childCrossSize,
          childLayout.minWidth,
          childLayout.maxWidth,
          contentWidth
        )
      }

      totalFixedMain += childMainSize
      resolved = true
    }

    childMeasurements.push({
      node: child,
      mainSize: childMainSize,
      crossSize: childCrossSize,
      flex,
      resolved
    })
    visibleCount++
  }

  // Account for gaps
  const totalGap = Math.max(0, visibleCount - 1) * gap
  const availableForFlex = Math.max(0, mainSize - totalFixedMain - totalGap)

  // Second pass: resolve flex items
  for (const measurement of childMeasurements) {
    if (!measurement.resolved && measurement.flex > 0) {
      measurement.mainSize = Math.floor((measurement.flex / totalFlex) * availableForFlex)

      // Resolve cross size
      const childLayout = measurement.node._layout
      if (isRow) {
        measurement.crossSize = resolveDimension(childLayout.height, contentHeight)
        measurement.crossSize = applyConstraints(
          measurement.crossSize,
          childLayout.minHeight,
          childLayout.maxHeight,
          contentHeight
        )
      } else {
        measurement.crossSize = resolveDimension(childLayout.width, contentWidth)
        measurement.crossSize = applyConstraints(
          measurement.crossSize,
          childLayout.minWidth,
          childLayout.maxWidth,
          contentWidth
        )
      }

      measurement.resolved = true
    }
  }

  // Calculate total content size for justification
  let totalContentMain = 0
  for (const m of childMeasurements) {
    totalContentMain += m.mainSize
  }
  totalContentMain += totalGap

  // Calculate start position based on justify
  let mainPos = 0
  let spacing = 0

  // Normalize justify value (support both short and CSS-style names)
  const normalizedJustify =
    justify === 'between'
      ? 'space-between'
      : justify === 'around'
        ? 'space-around'
        : (justify as string)

  switch (normalizedJustify) {
    case 'start':
      mainPos = 0
      break
    case 'end':
      mainPos = mainSize - totalContentMain
      break
    case 'center':
      mainPos = Math.floor((mainSize - totalContentMain) / 2)
      break
    case 'space-between':
      mainPos = 0
      if (visibleCount > 1) {
        spacing = Math.floor((mainSize - totalContentMain + totalGap) / (visibleCount - 1))
      }
      break
    case 'space-around':
      spacing = Math.floor((mainSize - totalContentMain + totalGap) / visibleCount)
      mainPos = Math.floor(spacing / 2)
      break
    case 'space-evenly':
      spacing = Math.floor((mainSize - totalContentMain + totalGap) / (visibleCount + 1))
      mainPos = spacing
      break
  }

  // Reverse if needed
  /* c8 ignore next */
  const orderedMeasurements = isReverse ? [...childMeasurements].reverse() : childMeasurements

  // Third pass: position children
  for (const measurement of orderedMeasurements) {
    const { node, mainSize: childMain, crossSize: childCross } = measurement

    // Calculate cross position based on align
    let crossPos = 0
    const actualCross = align === 'stretch' ? crossSize : childCross

    switch (align) {
      case 'start':
        crossPos = 0
        break
      case 'end':
        crossPos = crossSize - actualCross
        break
      case 'center':
        crossPos = Math.floor((crossSize - actualCross) / 2)
        break
      case 'stretch':
        crossPos = 0
        break
    }

    // Set child bounds
    if (isRow) {
      node._bounds = {
        x: contentX + mainPos,
        y: contentY + crossPos,
        width: childMain,
        height: actualCross
      }
    } else {
      node._bounds = {
        x: contentX + crossPos,
        y: contentY + mainPos,
        width: actualCross,
        height: childMain
      }
    }

    // Recursively layout children
    if (node instanceof ContainerNode) {
      const childPadding = resolvePadding(node._layout.padding)
      layoutChildren(node, childPadding, debug)
    }

    // Move main position
    const useSpacing =
      normalizedJustify === 'space-between' ||
      normalizedJustify === 'space-around' ||
      normalizedJustify === 'space-evenly'
    mainPos += childMain + (useSpacing ? spacing : gap)
  }
}

/**
 * Create the layout plugin.
 *
 * @param options - Plugin options
 * @returns Layout plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { layoutPlugin } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [layoutPlugin()]
 * })
 * ```
 */
export function layoutPlugin(options: LayoutPluginOptions = {}): Plugin {
  const { debug = false } = options

  let app: TUIApp | null = null
  let layoutCount = 0
  let lastLayoutTime = 0

  return {
    name: 'layout',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      // Expose API on app
      ;(tuiApp as TUIApp & { layout: LayoutPluginAPI }).layout = {
        recalculate: () => {
          if (app && app.root) {
            const bounds: Bounds = {
              x: 0,
              y: 0,
              width: app.width,
              height: app.height
            }
            if (app.root instanceof BaseNode) {
              calculateLayout(app.root, bounds, debug)
            }
          }
        },
        getStats: () => ({
          layoutCount,
          lastLayoutTime
        })
      }
    },

    beforeRender(): void {
      if (!app || !app.root) return

      const startTime = performance.now()

      // Calculate layout from root
      const bounds: Bounds = {
        x: 0,
        y: 0,
        width: app.width,
        height: app.height
      }

      if (app.root instanceof BaseNode) {
        calculateLayout(app.root, bounds, debug)
      }

      layoutCount++
      lastLayoutTime = performance.now() - startTime

      if (debug) {
        console.error(`[layout] frame=${layoutCount} time=${lastLayoutTime.toFixed(2)}ms`)
      }
    },

    onResize(width: number, height: number): void {
      // Layout will be recalculated on next render
      if (debug) {
        console.error(`[layout] resize width=${width} height=${height}`)
      }
    },

    destroy(): void {
      app = null
    }
  }
}
