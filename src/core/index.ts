/**
 * @oxog/tui - Core Systems
 * @packageDocumentation
 */

// Buffer
export {
  createBuffer,
  createEmptyCell,
  cloneBuffer,
  cellsEqual,
  copyRegion,
  fillBuffer,
  drawHLine,
  drawVLine,
  drawRect
} from './buffer'

// Renderer
export {
  createRenderer,
  createBatchedRenderer,
  createStringRenderer,
  createRenderLoop
} from './renderer'

export type { RenderLoop } from './renderer'

// Layout
export {
  createLayoutEngine,
  resolveDimension,
  applyConstraints,
  resolvePadding,
  resolveMargin,
  measureContent,
  boundsIntersect,
  pointInBounds,
  boundsIntersection
} from './layout'

// Style
export {
  createStyleResolver,
  computeAttrs,
  mergeStyles,
  mergeCellStyles,
  createCellStyle,
  applyStyle,
  hasAttrs,
  isBold,
  isItalic,
  isUnderlined,
  isDimmed,
  DEFAULT_CELL_STYLE,
  EMPTY_STYLE_PROPS
} from './style'

// Screen
export {
  createScreen,
  cleanupScreen,
  setupScreen,
  getTerminalSize,
  isTTY,
  writeAt,
  clear,
  bell,
  setTitle,
  setupSignalHandlers
} from './screen'
