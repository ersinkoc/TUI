# @oxog/tui - Technical Specification

> Version: 1.0.0
> Status: Draft
> Last Updated: 2026-01-19

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Core Concepts](#3-core-concepts)
4. [Type System](#4-type-system)
5. [Kernel](#5-kernel)
6. [Node System](#6-node-system)
7. [Layout Engine](#7-layout-engine)
8. [Rendering System](#8-rendering-system)
9. [Event System](#9-event-system)
10. [Widget Specifications](#10-widget-specifications)
11. [Plugin System](#11-plugin-system)
12. [Theming](#12-theming)
13. [Public API](#13-public-api)
14. [Error Handling](#14-error-handling)
15. [Performance Requirements](#15-performance-requirements)
16. [Testing Requirements](#16-testing-requirements)

---

## 1. Overview

### 1.1 Purpose

@oxog/tui is a zero-external-dependency terminal UI framework for Node.js. It provides a complete solution for building interactive terminal applications with a hybrid API combining functional widget creation with chainable methods.

### 1.2 Goals

- **Zero External Dependencies**: Only @oxog/\* packages as runtime dependencies
- **Micro-Kernel Architecture**: Core is minimal, features are plugins
- **Hybrid API**: Functional creation + method chaining for intuitive DX
- **Type Safety**: Full TypeScript with strict mode
- **Performance**: Differential rendering, minimal memory allocation
- **Extensibility**: Everything is a plugin

### 1.3 Non-Goals

- Browser support (Node.js only)
- Native bindings (pure JavaScript/TypeScript)
- Legacy terminal support (requires ANSI escape sequences)

### 1.4 Dependencies

```
@oxog/types    - Result/Option patterns, type utilities
@oxog/emitter  - Type-safe event emitter
@oxog/plugin   - Micro-kernel plugin system
@oxog/pigment  - ANSI color/style utilities
```

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Code                                │
│      tui().use(inputPlugin()).mount(ui).start()                 │
├─────────────────────────────────────────────────────────────────┤
│                     Widget Factory API                           │
│      box() · text() · input() · select() · table() · ...        │
├─────────────────────────────────────────────────────────────────┤
│                    Plugin Registry API                           │
│           use() · unregister() · hasPlugin() · list()           │
├──────────┬───────────┬────────────┬─────────────────────────────┤
│   Core   │  Optional │  Exported  │        Community            │
│ Plugins  │  Plugins  │  Plugins   │         Plugins             │
├──────────┴───────────┴────────────┴─────────────────────────────┤
│                        Micro Kernel                              │
│     Event Bus · Render Loop · Layout Engine · Node Tree         │
├─────────────────────────────────────────────────────────────────┤
│                      Terminal I/O                                │
│          stdin · stdout · ANSI sequences · TTY control          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Input (stdin)
       │
       ▼
┌─────────────────┐
│  Input Parser   │ ◄── inputPlugin
│  (key/mouse)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Event Bus     │ ◄── @oxog/emitter
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Widget State   │
│    Updates      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Layout Pass    │ ◄── layoutPlugin
│  (constraints)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Style Pass     │ ◄── stylePlugin
│  (colors/attrs) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Pass    │ ◄── rendererPlugin
│  (diff buffer)  │
└────────┬────────┘
         │
         ▼
    stdout (ANSI)
```

### 2.3 Module Dependencies

```
index.ts
    └── tui.ts
        ├── kernel.ts
        │   └── @oxog/plugin
        ├── types.ts
        │   └── @oxog/types
        ├── core/
        │   ├── renderer.ts
        │   │   └── @oxog/pigment
        │   ├── buffer.ts
        │   ├── layout.ts
        │   ├── style.ts
        │   └── screen.ts
        ├── widgets/
        │   ├── node.ts
        │   ├── box.ts
        │   ├── text.ts
        │   └── ...
        └── plugins/
            ├── core/
            └── optional/
```

---

## 3. Core Concepts

### 3.1 Node

A Node is the fundamental building block. Every widget extends Node.

```typescript
interface Node {
  readonly id: string // Unique identifier (auto-generated)
  readonly type: string // Widget type name
  readonly parent: Node | null // Parent node reference
  readonly children: Node[] // Child nodes (for containers)

  // Visibility
  visible(value: boolean): this
  readonly isVisible: boolean

  // Computed bounds (after layout)
  readonly bounds: Bounds

  // Internal state
  readonly _state: NodeState
  readonly _style: ComputedStyle
}

interface Bounds {
  x: number // Absolute X position
  y: number // Absolute Y position
  width: number // Computed width
  height: number // Computed height
}
```

### 3.2 Widget

A Widget is a specialized Node with specific rendering behavior.

```typescript
// Widgets are created via factory functions
const myBox = box({ width: 10, height: 5 })
const myText = text('Hello')

// Factory functions return typed nodes
function box(props?: BoxProps): BoxNode
function text(content?: string): TextNode
```

### 3.3 Plugin

A Plugin extends kernel functionality.

```typescript
interface Plugin<TContext = TUIContext> {
  name: string
  version: string
  dependencies?: string[]
  install: (kernel: Kernel<TContext>) => void
  onInit?: (context: TContext) => void | Promise<void>
  onDestroy?: () => void | Promise<void>
  onError?: (error: Error) => void
}
```

### 3.4 Theme

A Theme defines colors and visual styles.

```typescript
interface Theme {
  colors: ThemeColors
  borders: ThemeBorders
  spacing: ThemeSpacing
}
```

---

## 4. Type System

### 4.1 Core Types

```typescript
// Dimension values
type Dimension = number | `${number}%` | 'auto'

// Color values
type Color =
  | string // Hex: '#fff', '#ffffff'
  | `rgb(${number},${number},${number})`
  | `rgba(${number},${number},${number},${number})`
  | NamedColor // 'red', 'blue', etc.

type NamedColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey'

// Border styles
type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'bold' | 'ascii'

// Flex properties
type FlexDirection = 'row' | 'column'
type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around'
type AlignItems = 'start' | 'center' | 'end' | 'stretch'
type AlignSelf = 'auto' | 'start' | 'center' | 'end' | 'stretch'

// Text alignment
type TextAlign = 'left' | 'center' | 'right'

// Spacing (padding/margin)
type Spacing =
  | number // All sides
  | [number, number] // [vertical, horizontal]
  | [number, number, number, number] // [top, right, bottom, left]
```

### 4.2 Event Types

```typescript
interface KeyEvent {
  name: string // Key name: 'a', 'enter', 'up', 'f1'
  sequence: string // Raw escape sequence
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

interface MouseEvent {
  x: number // Column (0-indexed)
  y: number // Row (0-indexed)
  button: 'left' | 'right' | 'middle' | 'none'
  action: 'press' | 'release' | 'move' | 'scroll'
  scroll?: 'up' | 'down'
  ctrl: boolean
  alt: boolean
  shift: boolean
}

interface ResizeEvent {
  width: number
  height: number
}
```

### 4.3 Internal Types

```typescript
// Cell in render buffer
interface Cell {
  char: string // Single character
  fg: number // Foreground color (packed RGBA)
  bg: number // Background color (packed RGBA)
  attrs: number // Attribute flags (bold, italic, etc.)
}

// Packed color format: 0xRRGGBBAA
const packColor = (r: number, g: number, b: number, a: number = 255): number =>
  ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)

// Attribute flags
const ATTR_BOLD = 1 << 0 // 0x01
const ATTR_ITALIC = 1 << 1 // 0x02
const ATTR_UNDERLINE = 1 << 2 // 0x04
const ATTR_DIM = 1 << 3 // 0x08
const ATTR_STRIKETHROUGH = 1 << 4 // 0x10
const ATTR_INVERSE = 1 << 5 // 0x20

// Layout constraints
interface LayoutConstraints {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
}

// Computed style
interface ComputedStyle {
  fg: number
  bg: number
  attrs: number
  borderStyle: BorderStyle
  borderColor: number
}
```

---

## 5. Kernel

### 5.1 Kernel Interface

```typescript
interface Kernel<TContext = TUIContext> {
  // Plugin management
  use(plugin: Plugin<TContext>): this
  unregister(name: string): boolean
  hasPlugin(name: string): boolean
  listPlugins(): string[]

  // Event system (from @oxog/emitter)
  on<K extends keyof KernelEvents>(event: K, handler: KernelEvents[K]): () => void
  off<K extends keyof KernelEvents>(event: K, handler: KernelEvents[K]): void
  emit<K extends keyof KernelEvents>(event: K, ...args: Parameters<KernelEvents[K]>): void

  // Lifecycle
  init(): Promise<void>
  destroy(): Promise<void>

  // Context access
  readonly context: TContext
}

interface KernelEvents {
  // Lifecycle events
  init: () => void
  destroy: () => void

  // Render events
  beforeRender: () => void
  render: () => void
  afterRender: () => void

  // Layout events
  beforeLayout: () => void
  layout: () => void
  afterLayout: () => void

  // Input events
  key: (event: KeyEvent) => void
  mouse: (event: MouseEvent) => void

  // Focus events
  focus: (node: Node) => void
  blur: (node: Node) => void

  // Resize event
  resize: (width: number, height: number) => void

  // Error event
  error: (error: Error) => void
}
```

### 5.2 TUI Context

```typescript
interface TUIContext {
  // Core systems
  renderer: Renderer
  screen: Screen

  // Node tree
  root: Node | null

  // Focus state
  focused: Node | null

  // Theme
  theme: Theme

  // Terminal info
  readonly width: number
  readonly height: number

  // Streams
  stdout: NodeJS.WriteStream
  stdin: NodeJS.ReadStream
}
```

### 5.3 Kernel Implementation Notes

- Kernel is created via `createKernel<TUIContext>()` from @oxog/plugin
- Plugins are installed in order, respecting dependencies
- Events are synchronous for predictable render timing
- Context is mutable only by plugins

---

## 6. Node System

### 6.1 Base Node

```typescript
abstract class BaseNode implements Node {
  readonly id: string
  abstract readonly type: string

  protected _parent: Node | null = null
  protected _children: Node[] = []
  protected _visible: boolean = true
  protected _state: NodeState
  protected _style: StyleProps = {}
  protected _layout: LayoutProps = {}
  protected _bounds: Bounds = { x: 0, y: 0, width: 0, height: 0 }

  constructor() {
    this.id = generateId()
    this._state = this.createInitialState()
  }

  // Visibility
  visible(value: boolean): this {
    this._visible = value
    this.markDirty()
    return this
  }

  get isVisible(): boolean {
    return this._visible
  }

  // Parent/children
  get parent(): Node | null {
    return this._parent
  }

  get children(): readonly Node[] {
    return this._children
  }

  get bounds(): Bounds {
    return { ...this._bounds }
  }

  // Dirty tracking
  protected _dirty: boolean = true

  markDirty(): void {
    this._dirty = true
    if (this._parent instanceof BaseNode) {
      this._parent.markDirty()
    }
  }

  // Abstract methods
  protected abstract createInitialState(): NodeState
  abstract render(buffer: Buffer, bounds: Bounds): void
}
```

### 6.2 Container Node

Nodes that can contain children (box, tabs, etc.):

```typescript
abstract class ContainerNode extends BaseNode {
  add(child: Node): this {
    if (child instanceof BaseNode) {
      child._parent = this
    }
    this._children.push(child)
    this.markDirty()
    return this
  }

  remove(child: Node): this {
    const index = this._children.indexOf(child)
    if (index !== -1) {
      if (child instanceof BaseNode) {
        child._parent = null
      }
      this._children.splice(index, 1)
      this.markDirty()
    }
    return this
  }

  clear(): this {
    for (const child of this._children) {
      if (child instanceof BaseNode) {
        child._parent = null
      }
    }
    this._children = []
    this.markDirty()
    return this
  }
}
```

### 6.3 Leaf Node

Nodes that cannot contain children (text, input, progress, etc.):

```typescript
abstract class LeafNode extends BaseNode {
  get children(): readonly Node[] {
    return []
  }
}
```

### 6.4 ID Generation

```typescript
let idCounter = 0

function generateId(): string {
  return `node_${++idCounter}`
}

// Reset for testing
function resetIdCounter(): void {
  idCounter = 0
}
```

---

## 7. Layout Engine

### 7.1 Algorithm Overview

The layout engine implements a simplified flexbox algorithm:

1. **Measure Pass**: Calculate intrinsic sizes (content-based)
2. **Constraint Pass**: Apply min/max constraints
3. **Flex Pass**: Distribute remaining space based on flex values
4. **Position Pass**: Calculate absolute positions

### 7.2 Layout Properties

```typescript
interface LayoutProps {
  // Dimensions
  width?: Dimension
  height?: Dimension
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number

  // Flex container
  flexDirection?: FlexDirection
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  gap?: number

  // Flex item
  flex?: number
  alignSelf?: AlignSelf

  // Spacing
  padding?: Spacing
  margin?: Spacing
}
```

### 7.3 Layout Algorithm

```typescript
interface LayoutEngine {
  /**
   * Compute layout for entire tree starting from root.
   */
  compute(root: Node, availableWidth: number, availableHeight: number): void
}

function createLayoutEngine(): LayoutEngine {
  return {
    compute(root, availableWidth, availableHeight) {
      // Phase 1: Measure intrinsic sizes (bottom-up)
      measureNode(root)

      // Phase 2: Apply constraints and flex (top-down)
      layoutNode(root, { x: 0, y: 0, width: availableWidth, height: availableHeight })
    }
  }
}

function measureNode(node: Node): { width: number; height: number } {
  // Base case: leaf node
  if (node.children.length === 0) {
    return measureLeaf(node)
  }

  // Recursive case: measure children first
  const childSizes = node.children.map(child => measureNode(child))

  // Calculate container size based on children and flex direction
  const layout = node._layout
  const direction = layout.flexDirection || 'column'

  if (direction === 'row') {
    return {
      width: childSizes.reduce((sum, s) => sum + s.width, 0),
      height: Math.max(...childSizes.map(s => s.height))
    }
  } else {
    return {
      width: Math.max(...childSizes.map(s => s.width)),
      height: childSizes.reduce((sum, s) => sum + s.height, 0)
    }
  }
}

function layoutNode(node: Node, available: Bounds): void {
  const layout = node._layout
  const padding = parsePadding(layout.padding)

  // Calculate own bounds
  const width = resolveDimension(layout.width, available.width)
  const height = resolveDimension(layout.height, available.height)

  node._bounds = {
    x: available.x,
    y: available.y,
    width: Math.min(width, available.width),
    height: Math.min(height, available.height)
  }

  // Layout children if container
  if (node.children.length > 0) {
    layoutChildren(node, padding)
  }
}

function layoutChildren(node: Node, padding: ResolvedSpacing): void {
  const layout = node._layout
  const direction = layout.flexDirection || 'column'
  const justify = layout.justifyContent || 'start'
  const align = layout.alignItems || 'stretch'
  const gap = layout.gap || 0

  const contentArea = {
    x: node._bounds.x + padding.left,
    y: node._bounds.y + padding.top,
    width: node._bounds.width - padding.left - padding.right,
    height: node._bounds.height - padding.top - padding.bottom
  }

  const children = node.children.filter(c => c.isVisible)
  if (children.length === 0) return

  // Calculate flex totals
  const flexChildren = children.filter(c => (c._layout.flex || 0) > 0)
  const fixedChildren = children.filter(c => (c._layout.flex || 0) === 0)

  const totalFlex = flexChildren.reduce((sum, c) => sum + (c._layout.flex || 0), 0)
  const fixedSize = fixedChildren.reduce((sum, c) => {
    const size =
      direction === 'row'
        ? resolveDimension(c._layout.width, contentArea.width)
        : resolveDimension(c._layout.height, contentArea.height)
    return sum + size
  }, 0)

  const totalGap = gap * (children.length - 1)
  const mainAxisSize = direction === 'row' ? contentArea.width : contentArea.height
  const availableForFlex = mainAxisSize - fixedSize - totalGap

  // Position children
  let mainOffset = direction === 'row' ? contentArea.x : contentArea.y

  // Apply justify-content
  const remainingSpace = availableForFlex - (totalFlex > 0 ? availableForFlex : 0)
  if (justify === 'center') {
    mainOffset += remainingSpace / 2
  } else if (justify === 'end') {
    mainOffset += remainingSpace
  }

  for (const child of children) {
    const flex = child._layout.flex || 0
    const childMainSize =
      flex > 0
        ? (availableForFlex * flex) / totalFlex
        : direction === 'row'
          ? resolveDimension(child._layout.width, contentArea.width)
          : resolveDimension(child._layout.height, contentArea.height)

    const crossAxisSize = direction === 'row' ? contentArea.height : contentArea.width
    const childCrossSize =
      align === 'stretch'
        ? crossAxisSize
        : direction === 'row'
          ? resolveDimension(child._layout.height, contentArea.height)
          : resolveDimension(child._layout.width, contentArea.width)

    const childBounds: Bounds =
      direction === 'row'
        ? {
            x: mainOffset,
            y: contentArea.y,
            width: childMainSize,
            height: childCrossSize
          }
        : {
            x: contentArea.x,
            y: mainOffset,
            width: childCrossSize,
            height: childMainSize
          }

    // Apply align-items
    if (align === 'center') {
      if (direction === 'row') {
        childBounds.y += (crossAxisSize - childCrossSize) / 2
      } else {
        childBounds.x += (crossAxisSize - childCrossSize) / 2
      }
    } else if (align === 'end') {
      if (direction === 'row') {
        childBounds.y += crossAxisSize - childCrossSize
      } else {
        childBounds.x += crossAxisSize - childCrossSize
      }
    }

    layoutNode(child, childBounds)
    mainOffset += childMainSize + gap
  }
}

function resolveDimension(dim: Dimension | undefined, available: number): number {
  if (dim === undefined || dim === 'auto') {
    return available
  }
  if (typeof dim === 'number') {
    return dim
  }
  // Percentage
  const percent = parseFloat(dim) / 100
  return Math.floor(available * percent)
}

function parsePadding(padding: Spacing | undefined): ResolvedSpacing {
  if (padding === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }
  if (padding.length === 2) {
    return { top: padding[0], right: padding[1], bottom: padding[0], left: padding[1] }
  }
  return { top: padding[0], right: padding[1], bottom: padding[2], left: padding[3] }
}

interface ResolvedSpacing {
  top: number
  right: number
  bottom: number
  left: number
}
```

---

## 8. Rendering System

### 8.1 Buffer

```typescript
interface Buffer {
  readonly width: number
  readonly height: number

  /**
   * Get cell at position.
   */
  get(x: number, y: number): Cell | undefined

  /**
   * Set cell at position.
   */
  set(x: number, y: number, cell: Cell): void

  /**
   * Write string starting at position.
   */
  write(x: number, y: number, text: string, style: CellStyle): void

  /**
   * Fill rectangle with cell.
   */
  fill(x: number, y: number, width: number, height: number, cell: Cell): void

  /**
   * Clear entire buffer.
   */
  clear(): void

  /**
   * Resize buffer.
   */
  resize(width: number, height: number): void
}

interface CellStyle {
  fg?: number
  bg?: number
  attrs?: number
}

function createBuffer(width: number, height: number): Buffer {
  let cells: Cell[] = new Array(width * height)
  let w = width
  let h = height

  const emptyCell: Cell = { char: ' ', fg: 0xffffffff, bg: 0x00000000, attrs: 0 }

  // Initialize with empty cells
  for (let i = 0; i < cells.length; i++) {
    cells[i] = { ...emptyCell }
  }

  return {
    get width() {
      return w
    },
    get height() {
      return h
    },

    get(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return undefined
      return cells[y * w + x]
    },

    set(x, y, cell) {
      if (x < 0 || x >= w || y < 0 || y >= h) return
      cells[y * w + x] = cell
    },

    write(x, y, text, style) {
      if (y < 0 || y >= h) return

      // Handle multi-width characters
      let col = x
      for (const char of text) {
        if (col >= w) break
        if (col >= 0) {
          cells[y * w + col] = {
            char,
            fg: style.fg ?? 0xffffffff,
            bg: style.bg ?? 0x00000000,
            attrs: style.attrs ?? 0
          }
        }
        col += getCharWidth(char)
      }
    },

    fill(x, y, width, height, cell) {
      for (let row = y; row < y + height && row < h; row++) {
        if (row < 0) continue
        for (let col = x; col < x + width && col < w; col++) {
          if (col < 0) continue
          cells[row * w + col] = { ...cell }
        }
      }
    },

    clear() {
      for (let i = 0; i < cells.length; i++) {
        cells[i] = { ...emptyCell }
      }
    },

    resize(newWidth, newHeight) {
      const newCells: Cell[] = new Array(newWidth * newHeight)
      for (let i = 0; i < newCells.length; i++) {
        newCells[i] = { ...emptyCell }
      }

      // Copy existing content
      const copyW = Math.min(w, newWidth)
      const copyH = Math.min(h, newHeight)
      for (let row = 0; row < copyH; row++) {
        for (let col = 0; col < copyW; col++) {
          newCells[row * newWidth + col] = cells[row * w + col]
        }
      }

      cells = newCells
      w = newWidth
      h = newHeight
    }
  }
}
```

### 8.2 Differential Rendering

```typescript
interface Renderer {
  /**
   * Render buffer to output stream.
   * Returns number of cells updated.
   */
  render(buffer: Buffer): number

  /**
   * Force full redraw next frame.
   */
  invalidate(): void

  /**
   * Get last frame buffer for comparison.
   */
  readonly lastBuffer: Buffer | null
}

function createRenderer(stdout: NodeJS.WriteStream): Renderer {
  let lastBuffer: Buffer | null = null
  let forceRedraw = true

  return {
    render(buffer) {
      let cellsUpdated = 0
      const output: string[] = []

      let lastX = -1
      let lastY = -1
      let lastFg = -1
      let lastBg = -1
      let lastAttrs = -1

      for (let y = 0; y < buffer.height; y++) {
        for (let x = 0; x < buffer.width; x++) {
          const cell = buffer.get(x, y)!
          const prevCell = forceRedraw ? null : lastBuffer?.get(x, y)

          // Skip if unchanged
          if (
            prevCell &&
            cell.char === prevCell.char &&
            cell.fg === prevCell.fg &&
            cell.bg === prevCell.bg &&
            cell.attrs === prevCell.attrs
          ) {
            continue
          }

          cellsUpdated++

          // Move cursor if not sequential
          if (x !== lastX + 1 || y !== lastY) {
            output.push(`\x1b[${y + 1};${x + 1}H`)
          }

          // Update colors if changed
          if (cell.fg !== lastFg) {
            output.push(fgColorToAnsi(cell.fg))
            lastFg = cell.fg
          }
          if (cell.bg !== lastBg) {
            output.push(bgColorToAnsi(cell.bg))
            lastBg = cell.bg
          }
          if (cell.attrs !== lastAttrs) {
            output.push(attrsToAnsi(cell.attrs))
            lastAttrs = cell.attrs
          }

          output.push(cell.char)
          lastX = x
          lastY = y
        }
      }

      // Reset attributes at end
      output.push('\x1b[0m')

      // Write to stdout
      if (output.length > 1) {
        stdout.write(output.join(''))
      }

      // Clone buffer for next frame comparison
      lastBuffer = cloneBuffer(buffer)
      forceRedraw = false

      return cellsUpdated
    },

    invalidate() {
      forceRedraw = true
    },

    get lastBuffer() {
      return lastBuffer
    }
  }
}

function fgColorToAnsi(packed: number): string {
  const r = (packed >> 24) & 0xff
  const g = (packed >> 16) & 0xff
  const b = (packed >> 8) & 0xff
  return `\x1b[38;2;${r};${g};${b}m`
}

function bgColorToAnsi(packed: number): string {
  const r = (packed >> 24) & 0xff
  const g = (packed >> 16) & 0xff
  const b = (packed >> 8) & 0xff
  const a = packed & 0xff

  // Transparent background
  if (a === 0) {
    return '\x1b[49m'
  }

  return `\x1b[48;2;${r};${g};${b}m`
}

function attrsToAnsi(attrs: number): string {
  const codes: number[] = [0] // Reset first

  if (attrs & ATTR_BOLD) codes.push(1)
  if (attrs & ATTR_DIM) codes.push(2)
  if (attrs & ATTR_ITALIC) codes.push(3)
  if (attrs & ATTR_UNDERLINE) codes.push(4)
  if (attrs & ATTR_STRIKETHROUGH) codes.push(9)
  if (attrs & ATTR_INVERSE) codes.push(7)

  return `\x1b[${codes.join(';')}m`
}
```

### 8.3 Render Loop

```typescript
interface RenderLoop {
  start(): void
  stop(): void
  requestRender(): void
  readonly isRunning: boolean
}

function createRenderLoop(fps: number, onRender: () => void): RenderLoop {
  const frameTime = Math.floor(1000 / fps)
  let timer: NodeJS.Timeout | null = null
  let renderRequested = true
  let running = false

  return {
    start() {
      if (running) return
      running = true

      const tick = () => {
        if (!running) return

        if (renderRequested) {
          renderRequested = false
          onRender()
        }

        timer = setTimeout(tick, frameTime)
      }

      tick()
    },

    stop() {
      running = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },

    requestRender() {
      renderRequested = true
    },

    get isRunning() {
      return running
    }
  }
}
```

---

## 9. Event System

### 9.1 Key Parsing

```typescript
interface KeyParser {
  parse(data: Buffer): KeyEvent[]
}

function createKeyParser(): KeyParser {
  return {
    parse(data) {
      const events: KeyEvent[] = []
      const str = data.toString('utf8')
      let i = 0

      while (i < str.length) {
        const event = parseKeyAt(str, i)
        events.push(event.key)
        i += event.consumed
      }

      return events
    }
  }
}

function parseKeyAt(str: string, start: number): { key: KeyEvent; consumed: number } {
  const char = str[start]

  // Escape sequence
  if (char === '\x1b') {
    // Check for multi-byte escape sequence
    if (start + 1 < str.length) {
      const next = str[start + 1]

      // CSI sequence: ESC [
      if (next === '[') {
        return parseCSI(str, start)
      }

      // SS3 sequence: ESC O
      if (next === 'O') {
        return parseSS3(str, start)
      }

      // Alt + key
      return {
        key: {
          name: str[start + 1],
          sequence: str.slice(start, start + 2),
          ctrl: false,
          alt: true,
          shift: /[A-Z]/.test(str[start + 1]),
          meta: false
        },
        consumed: 2
      }
    }

    // Bare escape
    return {
      key: { name: 'escape', sequence: '\x1b', ctrl: false, alt: false, shift: false, meta: false },
      consumed: 1
    }
  }

  // Control characters
  if (char.charCodeAt(0) < 32) {
    const name = controlCharName(char.charCodeAt(0))
    return {
      key: {
        name,
        sequence: char,
        ctrl: char.charCodeAt(0) !== 13 && char.charCodeAt(0) !== 10 && char.charCodeAt(0) !== 9,
        alt: false,
        shift: false,
        meta: false
      },
      consumed: 1
    }
  }

  // Regular character
  return {
    key: {
      name: char,
      sequence: char,
      ctrl: false,
      alt: false,
      shift: /[A-Z]/.test(char),
      meta: false
    },
    consumed: 1
  }
}

function parseCSI(str: string, start: number): { key: KeyEvent; consumed: number } {
  // Find end of CSI sequence
  let end = start + 2
  while (end < str.length && str[end] >= '0' && str[end] <= '?') {
    end++
  }

  // Include final byte
  if (end < str.length) {
    end++
  }

  const sequence = str.slice(start, end)
  const finalByte = sequence[sequence.length - 1]
  const params = sequence.slice(2, -1)

  const name = csiToName(finalByte, params)
  const modifiers = parseModifiers(params)

  return {
    key: {
      name,
      sequence,
      ...modifiers
    },
    consumed: end - start
  }
}

function parseSS3(str: string, start: number): { key: KeyEvent; consumed: number } {
  const sequence = str.slice(start, start + 3)
  const finalByte = sequence[2]

  const nameMap: Record<string, string> = {
    P: 'f1',
    Q: 'f2',
    R: 'f3',
    S: 'f4',
    H: 'home',
    F: 'end'
  }

  return {
    key: {
      name: nameMap[finalByte] || finalByte,
      sequence,
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    },
    consumed: 3
  }
}

function csiToName(finalByte: string, params: string): string {
  // Arrow keys
  if (finalByte === 'A') return 'up'
  if (finalByte === 'B') return 'down'
  if (finalByte === 'C') return 'right'
  if (finalByte === 'D') return 'left'

  // Home/End
  if (finalByte === 'H') return 'home'
  if (finalByte === 'F') return 'end'

  // Page Up/Down
  if (params === '5' && finalByte === '~') return 'pageup'
  if (params === '6' && finalByte === '~') return 'pagedown'

  // Insert/Delete
  if (params === '2' && finalByte === '~') return 'insert'
  if (params === '3' && finalByte === '~') return 'delete'

  // Function keys
  const fnMap: Record<string, string> = {
    '11': 'f1',
    '12': 'f2',
    '13': 'f3',
    '14': 'f4',
    '15': 'f5',
    '17': 'f6',
    '18': 'f7',
    '19': 'f8',
    '20': 'f9',
    '21': 'f10',
    '23': 'f11',
    '24': 'f12'
  }
  const baseParam = params.split(';')[0]
  if (fnMap[baseParam]) return fnMap[baseParam]

  return `csi-${params}-${finalByte}`
}

function parseModifiers(params: string): {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
} {
  const parts = params.split(';')
  if (parts.length < 2) {
    return { ctrl: false, alt: false, shift: false, meta: false }
  }

  const mod = parseInt(parts[1], 10) - 1
  return {
    shift: (mod & 1) !== 0,
    alt: (mod & 2) !== 0,
    ctrl: (mod & 4) !== 0,
    meta: (mod & 8) !== 0
  }
}

function controlCharName(code: number): string {
  const names: Record<number, string> = {
    0: 'c-@',
    1: 'c-a',
    2: 'c-b',
    3: 'c-c',
    4: 'c-d',
    5: 'c-e',
    6: 'c-f',
    7: 'c-g',
    8: 'backspace',
    9: 'tab',
    10: 'enter',
    11: 'c-k',
    12: 'c-l',
    13: 'enter',
    14: 'c-n',
    15: 'c-o',
    16: 'c-p',
    17: 'c-q',
    18: 'c-r',
    19: 'c-s',
    20: 'c-t',
    21: 'c-u',
    22: 'c-v',
    23: 'c-w',
    24: 'c-x',
    25: 'c-y',
    26: 'c-z',
    27: 'escape',
    28: 'c-\\',
    29: 'c-]',
    30: 'c-^',
    31: 'c-_',
    127: 'backspace'
  }
  return names[code] || `c-${String.fromCharCode(code + 64).toLowerCase()}`
}
```

### 9.2 Mouse Parsing

```typescript
interface MouseParser {
  parse(data: Buffer): MouseEvent[]
}

function createMouseParser(): MouseParser {
  return {
    parse(data) {
      const events: MouseEvent[] = []
      const str = data.toString('utf8')

      // SGR mouse encoding: ESC [ < Cb ; Cx ; Cy [Mm]
      const sgrRegex = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g
      let match

      while ((match = sgrRegex.exec(str)) !== null) {
        const cb = parseInt(match[1], 10)
        const x = parseInt(match[2], 10) - 1
        const y = parseInt(match[3], 10) - 1
        const released = match[4] === 'm'

        const button = cb & 3
        const shift = (cb & 4) !== 0
        const alt = (cb & 8) !== 0
        const ctrl = (cb & 16) !== 0
        const motion = (cb & 32) !== 0
        const scroll = (cb & 64) !== 0

        let buttonName: MouseEvent['button'] = 'none'
        if (button === 0) buttonName = 'left'
        else if (button === 1) buttonName = 'middle'
        else if (button === 2) buttonName = 'right'

        let action: MouseEvent['action'] = 'press'
        let scrollDir: MouseEvent['scroll'] = undefined

        if (released) {
          action = 'release'
        } else if (motion) {
          action = 'move'
        } else if (scroll) {
          action = 'scroll'
          scrollDir = button === 0 ? 'up' : 'down'
          buttonName = 'none'
        }

        events.push({
          x,
          y,
          button: buttonName,
          action,
          scroll: scrollDir,
          ctrl,
          alt,
          shift
        })
      }

      return events
    }
  }
}
```

---

## 10. Widget Specifications

### 10.1 Box Widget

Container widget with border, background, and flexbox layout.

```typescript
interface BoxProps {
  // Dimensions
  width?: Dimension
  height?: Dimension
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number

  // Flex container
  flex?: number
  flexDirection?: FlexDirection
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  gap?: number

  // Spacing
  padding?: Spacing
  margin?: Spacing

  // Appearance
  border?: BorderStyle
  borderColor?: Color
  bg?: Color
}

interface BoxNode extends ContainerNode {
  // Chainable setters
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

  border(style: BorderStyle): this
  borderColor(color: Color): this
  bg(color: Color): this

  // Container methods
  add(child: Node): this
  remove(child: Node): this
  clear(): this
}

function box(props?: BoxProps): BoxNode
```

**Rendering:**

1. Fill background rectangle
2. Draw border if not 'none'
3. Render children within content area (inside padding)

### 10.2 Text Widget

Text display with styling.

```typescript
interface TextProps {
  content?: string
  color?: Color
  bg?: Color
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  dim?: boolean
  align?: TextAlign
  wrap?: boolean
}

interface TextNode extends LeafNode {
  content(value: string): this
  color(fg: Color): this
  bg(color: Color): this
  bold(enabled?: boolean): this
  italic(enabled?: boolean): this
  underline(enabled?: boolean): this
  strikethrough(enabled?: boolean): this
  dim(enabled?: boolean): this
  align(value: TextAlign): this
  wrap(enabled: boolean): this

  readonly text: string
}

function text(content?: string): TextNode
```

**Rendering:**

1. Word-wrap if enabled and width constrained
2. Apply alignment within bounds
3. Write styled text to buffer

### 10.3 Input Widget

Single-line text input.

```typescript
interface InputProps {
  placeholder?: string
  value?: string
  password?: boolean
  passwordChar?: string
  maxLength?: number
}

interface InputNode extends LeafNode {
  placeholder(value: string): this
  value(value: string): this
  password(enabled?: boolean, mask?: string): this
  maxLength(value: number): this

  onChange(handler: (value: string) => void): this
  onSubmit(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly currentValue: string
  readonly isFocused: boolean
}

function input(props?: InputProps): InputNode
```

**State:**

- `value: string` - Current text content
- `cursorPosition: number` - Cursor position within value
- `focused: boolean` - Focus state

**Key Handling (when focused):**

- Printable chars: Insert at cursor
- Backspace: Delete before cursor
- Delete: Delete at cursor
- Left/Right: Move cursor
- Home/End: Move to start/end
- Enter: Emit submit event
- Escape: Blur

### 10.4 Textarea Widget

Multi-line text input.

```typescript
interface TextareaProps {
  placeholder?: string
  value?: string
  maxLength?: number
}

interface TextareaNode extends LeafNode {
  placeholder(value: string): this
  value(value: string): this
  maxLength(value: number): this

  onChange(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly currentValue: string
  readonly isFocused: boolean
  readonly lineCount: number
}

function textarea(props?: TextareaProps): TextareaNode
```

**Additional Key Handling:**

- Enter: Insert newline
- Up/Down: Move cursor vertically
- Ctrl+Enter: Submit (optional)

### 10.5 Select Widget

Selection list.

```typescript
interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface SelectProps<T extends SelectOption = SelectOption> {
  options?: T[]
  selected?: number
  maxVisible?: number
}

interface SelectNode<T extends SelectOption = SelectOption> extends LeafNode {
  options(items: T[]): this
  selected(index: number): this
  maxVisible(count: number): this

  onSelect(handler: (item: T, index: number) => void): this
  onChange(handler: (item: T, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly selectedIndex: number
  readonly selectedItem: T | undefined
  readonly isFocused: boolean
}

function select<T extends SelectOption = SelectOption>(props?: SelectProps<T>): SelectNode<T>
```

**State:**

- `options: T[]` - Available options
- `selectedIndex: number` - Currently selected index
- `scrollOffset: number` - Scroll position for long lists

**Key Handling:**

- Up/Down: Change selection
- Enter: Emit select event
- PageUp/PageDown: Jump by page

### 10.6 Checkbox Widget

Toggle checkbox.

```typescript
interface CheckboxProps {
  label?: string
  checked?: boolean
  disabled?: boolean
}

interface CheckboxNode extends LeafNode {
  label(value: string): this
  checked(value: boolean): this
  disabled(value: boolean): this

  toggle(): this

  onChange(handler: (checked: boolean) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly isChecked: boolean
  readonly isDisabled: boolean
  readonly isFocused: boolean
}

function checkbox(props?: CheckboxProps): CheckboxNode
```

**Rendering:**

- Unchecked: `[ ] Label`
- Checked: `[x] Label`
- Focused: Highlighted background

### 10.7 Progress Widget

Progress bar.

```typescript
interface ProgressProps {
  value?: number // 0-100
  showPercent?: boolean
  showValue?: boolean
  width?: number
  filled?: string // Fill character
  empty?: string // Empty character
  filledColor?: Color
  emptyColor?: Color
}

interface ProgressNode extends LeafNode {
  value(percent: number): this
  showPercent(enabled: boolean): this
  showValue(enabled: boolean): this
  width(value: number): this
  filled(char: string): this
  empty(char: string): this
  filledColor(color: Color): this
  emptyColor(color: Color): this

  increment(amount?: number): this
  decrement(amount?: number): this

  readonly percent: number
}

function progress(props?: ProgressProps): ProgressNode
```

**Rendering:**

```
[████████░░░░░░░░] 50%
```

### 10.8 Spinner Widget

Loading spinner.

```typescript
interface SpinnerProps {
  frames?: string[]
  interval?: number // ms per frame
  label?: string
}

interface SpinnerNode extends LeafNode {
  frames(frames: string[]): this
  interval(ms: number): this
  label(text: string): this

  start(): this
  stop(): this

  readonly isSpinning: boolean
}

function spinner(props?: SpinnerProps): SpinnerNode
```

**Default Frames:**

```typescript
;['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
```

### 10.9 Table Widget

Data table.

```typescript
interface TableColumn<T = unknown> {
  key: string
  header: string
  width?: number | 'auto'
  align?: TextAlign
  render?: (value: T, row: Record<string, unknown>) => string
}

interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns?: TableColumn[]
  data?: T[]
  showHeader?: boolean
  border?: BorderStyle
  striped?: boolean
  selectedRow?: number
}

interface TableNode<T extends Record<string, unknown> = Record<string, unknown>> extends LeafNode {
  columns(cols: TableColumn[]): this
  data(rows: T[]): this
  showHeader(enabled: boolean): this
  border(style: BorderStyle): this
  striped(enabled: boolean): this
  selectedRow(index: number): this

  onSelect(handler: (row: T, index: number) => void): this
  onChange(handler: (row: T, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly selected: T | undefined
  readonly selectedIndex: number
  readonly rowCount: number
  readonly isFocused: boolean
}

function table<T extends Record<string, unknown> = Record<string, unknown>>(
  props?: TableProps<T>
): TableNode<T>
```

### 10.10 Tree Widget

Tree view.

```typescript
interface TreeNode<T = unknown> {
  label: string
  value?: T
  children?: TreeNode<T>[]
  expanded?: boolean
}

interface TreeProps<T = unknown> {
  data?: TreeNode<T>[]
  indent?: number
  guides?: boolean
}

interface TreeWidgetNode<T = unknown> extends LeafNode {
  data(nodes: TreeNode<T>[]): this
  indent(spaces: number): this
  guides(enabled: boolean): this

  expand(path: number[]): this
  collapse(path: number[]): this
  toggle(path: number[]): this
  expandAll(): this
  collapseAll(): this

  onSelect(handler: (node: TreeNode<T>, path: number[]) => void): this
  onToggle(handler: (node: TreeNode<T>, path: number[], expanded: boolean) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly selectedPath: number[]
  readonly selectedNode: TreeNode<T> | undefined
  readonly isFocused: boolean
}

function tree<T = unknown>(props?: TreeProps<T>): TreeWidgetNode<T>
```

### 10.11 Tabs Widget

Tab navigation.

```typescript
interface TabItem {
  label: string
  content: Node
  disabled?: boolean
}

interface TabsProps {
  tabs?: TabItem[]
  selected?: number
  position?: 'top' | 'bottom'
}

interface TabsNode extends ContainerNode {
  tabs(items: TabItem[]): this
  addTab(tab: TabItem): this
  removeTab(index: number): this
  selected(index: number): this
  position(value: 'top' | 'bottom'): this

  onChange(handler: (tab: TabItem, index: number) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  focus(): this
  blur(): this

  readonly selectedIndex: number
  readonly selectedTab: TabItem | undefined
  readonly tabCount: number
  readonly isFocused: boolean
}

function tabs(props?: TabsProps): TabsNode
```

---

## 11. Plugin System

### 11.1 Core Plugins

These are always loaded and cannot be removed.

#### rendererPlugin

```typescript
interface RendererPluginConfig {
  // No configuration needed
}

function rendererPlugin(config?: RendererPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Manage render buffer
- Perform differential rendering
- Handle ANSI output
- Manage cursor visibility

#### layoutPlugin

```typescript
interface LayoutPluginConfig {
  // No configuration needed
}

function layoutPlugin(config?: LayoutPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Run layout algorithm on tree changes
- Cache layout results
- Handle resize recalculation

#### stylePlugin

```typescript
interface StylePluginConfig {
  // No configuration needed
}

function stylePlugin(config?: StylePluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Resolve color values
- Compute inherited styles
- Cache style computations

### 11.2 Optional Plugins

#### inputPlugin

```typescript
interface InputPluginConfig {
  // No configuration needed
}

function inputPlugin(config?: InputPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Parse keyboard input
- Emit 'key' events
- Enable raw mode on stdin

#### mousePlugin

```typescript
interface MousePluginConfig {
  sgr?: boolean // Use SGR mouse protocol (default: true)
}

function mousePlugin(config?: MousePluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Enable mouse reporting
- Parse mouse events
- Emit 'mouse' events

#### focusPlugin

```typescript
interface FocusPluginConfig {
  tabOrder?: 'document' | 'explicit'
}

function focusPlugin(config?: FocusPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Track focused widget
- Handle Tab/Shift+Tab navigation
- Emit 'focus' and 'blur' events

#### animationPlugin

```typescript
interface AnimationPluginConfig {
  defaultDuration?: number
  defaultEasing?: EasingFunction
}

type EasingFunction = (t: number) => number

function animationPlugin(config?: AnimationPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Provide animation API
- Schedule animation frames
- Interpolate values

#### scrollPlugin

```typescript
interface ScrollPluginConfig {
  scrollbarWidth?: number
  showScrollbar?: 'auto' | 'always' | 'never'
}

function scrollPlugin(config?: ScrollPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Handle scroll containers
- Virtual scrolling for large content
- Scrollbar rendering

#### clipboardPlugin

```typescript
interface ClipboardPluginConfig {
  useOSC52?: boolean
}

function clipboardPlugin(config?: ClipboardPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Copy text to clipboard (OSC 52)
- Paste from clipboard
- Fallback for unsupported terminals

#### screenPlugin

```typescript
interface ScreenPluginConfig {
  alternateScreen?: boolean
  hideCursor?: boolean
}

function screenPlugin(config?: ScreenPluginConfig): Plugin<TUIContext>
```

Responsibilities:

- Alternate screen buffer
- Cursor visibility
- Raw mode management

---

## 12. Theming

### 12.1 Theme Structure

```typescript
interface Theme {
  colors: ThemeColors
  borders: ThemeBorders
  spacing: ThemeSpacing
}

interface ThemeColors {
  primary: Color
  secondary: Color
  background: Color
  surface: Color
  text: Color
  textMuted: Color
  border: Color
  error: Color
  warning: Color
  success: Color
  info: Color

  // Widget-specific
  inputBg: Color
  inputBorder: Color
  inputFocusBorder: Color
  selectHighlight: Color
  tableHeaderBg: Color
  tableStripeBg: Color
}

interface ThemeBorders {
  default: BorderStyle
  focus: BorderStyle
  input: BorderStyle
}

interface ThemeSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}
```

### 12.2 Default Theme

```typescript
const defaultTheme: Theme = {
  colors: {
    primary: '#00ff88',
    secondary: '#0088ff',
    background: '#1a1a2e',
    surface: '#252542',
    text: '#ffffff',
    textMuted: '#888888',
    border: '#444466',
    error: '#ff4444',
    warning: '#ffaa00',
    success: '#00ff88',
    info: '#0088ff',
    inputBg: '#252542',
    inputBorder: '#444466',
    inputFocusBorder: '#00ff88',
    selectHighlight: '#00ff88',
    tableHeaderBg: '#333355',
    tableStripeBg: '#1f1f35'
  },
  borders: {
    default: 'rounded',
    focus: 'double',
    input: 'single'
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16
  }
}
```

### 12.3 Theme API

```typescript
function createTheme(overrides: DeepPartial<Theme>): Theme
function mergeThemes(base: Theme, overrides: DeepPartial<Theme>): Theme
```

---

## 13. Public API

### 13.1 Main Export

```typescript
// Main factory
export function tui(options?: TUIOptions): TUIApp

// Widget factories
export function box(props?: BoxProps): BoxNode
export function text(content?: string): TextNode
export function input(props?: InputProps): InputNode
export function textarea(props?: TextareaProps): TextareaNode
export function select<T extends SelectOption>(props?: SelectProps<T>): SelectNode<T>
export function checkbox(props?: CheckboxProps): CheckboxNode
export function progress(props?: ProgressProps): ProgressNode
export function spinner(props?: SpinnerProps): SpinnerNode
export function table<T extends Record<string, unknown>>(props?: TableProps<T>): TableNode<T>
export function tree<T>(props?: TreeProps<T>): TreeWidgetNode<T>
export function tabs(props?: TabsProps): TabsNode

// Theme utilities
export function createTheme(overrides: DeepPartial<Theme>): Theme
export const defaultTheme: Theme

// Types
export type {
  TUIOptions,
  TUIApp,
  Plugin,
  Theme,
  ThemeColors,
  Node,
  BoxNode,
  TextNode,
  InputNode,
  TextareaNode,
  SelectNode,
  SelectOption,
  CheckboxNode,
  ProgressNode,
  SpinnerNode,
  TableNode,
  TableColumn,
  TreeWidgetNode,
  TreeNode,
  TabsNode,
  TabItem,
  KeyEvent,
  MouseEvent,
  Color,
  Dimension,
  BorderStyle,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextAlign,
  Spacing
}
```

### 13.2 Plugin Export

```typescript
// @oxog/tui/plugins
export function inputPlugin(config?: InputPluginConfig): Plugin
export function mousePlugin(config?: MousePluginConfig): Plugin
export function focusPlugin(config?: FocusPluginConfig): Plugin
export function animationPlugin(config?: AnimationPluginConfig): Plugin
export function scrollPlugin(config?: ScrollPluginConfig): Plugin
export function clipboardPlugin(config?: ClipboardPluginConfig): Plugin
export function screenPlugin(config?: ScreenPluginConfig): Plugin
```

### 13.3 TUIApp Interface

```typescript
interface TUIApp {
  // Plugin management
  use(plugin: Plugin): this

  // Node mounting
  mount(node: Node): this
  unmount(): this

  // Lifecycle
  start(): this
  stop(): this

  // Rendering
  render(): this

  // Events
  on<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): () => void
  off<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): void
  emit<K extends keyof TUIEvents>(event: K, ...args: Parameters<TUIEvents[K]>): void

  // State
  readonly width: number
  readonly height: number
  readonly isRunning: boolean
  readonly root: Node | null
  readonly focused: Node | null
  readonly theme: Theme
}
```

---

## 14. Error Handling

### 14.1 Error Types

```typescript
class TUIError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'TUIError'
  }
}

class PluginError extends TUIError {
  constructor(
    message: string,
    public pluginName: string
  ) {
    super(message, 'PLUGIN_ERROR')
    this.name = 'PluginError'
  }
}

class LayoutError extends TUIError {
  constructor(message: string) {
    super(message, 'LAYOUT_ERROR')
    this.name = 'LayoutError'
  }
}

class RenderError extends TUIError {
  constructor(message: string) {
    super(message, 'RENDER_ERROR')
    this.name = 'RenderError'
  }
}
```

### 14.2 Error Codes

| Code                | Description                             |
| ------------------- | --------------------------------------- |
| `PLUGIN_ERROR`      | Plugin installation or execution failed |
| `PLUGIN_NOT_FOUND`  | Referenced plugin not installed         |
| `PLUGIN_DEPENDENCY` | Missing plugin dependency               |
| `LAYOUT_ERROR`      | Layout calculation failed               |
| `LAYOUT_OVERFLOW`   | Content exceeds available space         |
| `RENDER_ERROR`      | Rendering failed                        |
| `INVALID_NODE`      | Invalid node structure                  |
| `INVALID_OPTION`    | Invalid configuration option            |
| `STREAM_ERROR`      | stdin/stdout error                      |

### 14.3 Result Pattern Integration

```typescript
import { Result, Ok, Err } from '@oxog/types'

// Operations that can fail return Result
function parseColor(value: string): Result<number, TUIError> {
  const parsed = tryParseColor(value)
  if (parsed === null) {
    return Err(new TUIError(`Invalid color: ${value}`, 'INVALID_COLOR'))
  }
  return Ok(parsed)
}
```

---

## 15. Performance Requirements

### 15.1 Metrics

| Metric             | Target              |
| ------------------ | ------------------- |
| First render       | < 16ms              |
| Subsequent renders | < 8ms               |
| Layout pass        | < 2ms for 100 nodes |
| Memory per cell    | 16 bytes            |
| Idle CPU           | < 1%                |
| Bundle size (core) | < 5KB gzipped       |
| Bundle size (all)  | < 15KB gzipped      |

### 15.2 Optimization Strategies

1. **Differential Rendering**: Only update changed cells
2. **Layout Caching**: Skip layout if tree unchanged
3. **Style Caching**: Cache computed styles
4. **Batch Writes**: Group ANSI sequences
5. **Object Pooling**: Reuse Cell objects
6. **Lazy Evaluation**: Defer computation until needed

---

## 16. Testing Requirements

### 16.1 Coverage Targets

| Category           | Target |
| ------------------ | ------ |
| Line coverage      | 100%   |
| Branch coverage    | 100%   |
| Function coverage  | 100%   |
| Statement coverage | 100%   |

### 16.2 Test Categories

1. **Unit Tests**: Individual functions and classes
2. **Integration Tests**: Component interactions
3. **Snapshot Tests**: Render output verification
4. **Performance Tests**: Timing benchmarks

### 16.3 Test Utilities

```typescript
// Mock terminal stream
function createMockStream(): MockStream

// Capture render output
function captureOutput(app: TUIApp): string[]

// Simulate key press
function pressKey(app: TUIApp, key: string | KeyEvent): void

// Simulate mouse event
function mouseClick(app: TUIApp, x: number, y: number): void

// Wait for render
function waitForRender(app: TUIApp): Promise<void>
```

---

## Appendix A: Border Characters

```typescript
const BORDER_CHARS = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│'
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║'
  },
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│'
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃'
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|'
  }
}
```

## Appendix B: ANSI Escape Sequences

```typescript
const ANSI = {
  // Cursor
  cursorTo: (x: number, y: number) => `\x1b[${y + 1};${x + 1}H`,
  cursorUp: (n: number) => `\x1b[${n}A`,
  cursorDown: (n: number) => `\x1b[${n}B`,
  cursorForward: (n: number) => `\x1b[${n}C`,
  cursorBack: (n: number) => `\x1b[${n}D`,
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',

  // Screen
  clearScreen: '\x1b[2J',
  clearLine: '\x1b[2K',
  alternateScreen: '\x1b[?1049h',
  mainScreen: '\x1b[?1049l',

  // Colors (24-bit)
  fgRgb: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
  fgDefault: '\x1b[39m',
  bgDefault: '\x1b[49m',

  // Attributes
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  strikethrough: '\x1b[9m',
  inverse: '\x1b[7m',

  // Mouse
  mouseOn: '\x1b[?1000h\x1b[?1006h',
  mouseOff: '\x1b[?1000l\x1b[?1006l'
}
```

---

_End of Specification_
