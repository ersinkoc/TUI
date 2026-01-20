# @oxog/tui - Implementation Guide

> Version: 1.0.0
> Status: Implementation Ready
> Last Updated: 2026-01-19

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Module Structure](#2-module-structure)
3. [Design Patterns](#3-design-patterns)
4. [Implementation Details](#4-implementation-details)
5. [Testing Strategy](#5-testing-strategy)
6. [Performance Optimizations](#6-performance-optimizations)
7. [Error Handling Strategy](#7-error-handling-strategy)
8. [API Design Principles](#8-api-design-principles)

---

## 1. Architecture Decisions

### 1.1 Why Micro-Kernel?

**Decision**: Use micro-kernel architecture with plugin system.

**Rationale**:

- Core stays minimal and stable
- Features can be added/removed at runtime
- Easy to test in isolation
- Community can extend without forking
- Follows @oxog/plugin patterns

**Trade-offs**:

- Slight overhead for plugin dispatch
- More complex initialization
- Plugin ordering matters

### 1.2 Why Hybrid API?

**Decision**: Combine functional factories with chainable methods.

**Rationale**:

```typescript
// Functional: familiar, composable
const ui = box({ width: 100 })

// Chainable: discoverable, fluent
ui.border('rounded').bg('#333')
```

Benefits:

- Factory functions are easy to type
- Method chaining enables IDE autocomplete
- Both styles are idiomatic TypeScript
- Matches React-like mental model

**Trade-offs**:

- More code for both patterns
- Need to keep props and methods in sync

### 1.3 Why Custom Layout Engine?

**Decision**: Implement simplified flexbox instead of using yoga-layout.

**Rationale**:

- Zero native dependencies
- Works on any platform
- Smaller bundle size
- Full control over behavior
- No WASM/native build complexity

**Scope**:

- flex, flexDirection
- justifyContent, alignItems
- padding, margin, gap
- width, height (fixed, %, auto)
- minWidth, maxWidth, minHeight, maxHeight

**Not Implemented**:

- flexWrap (complexity vs. utility)
- flexBasis (use width/height instead)
- order (rarely needed in TUI)
- alignContent (no multi-line flex)

### 1.4 Why Differential Rendering?

**Decision**: Use double-buffering with diff algorithm.

**Rationale**:

- Terminals are slow for full redraws
- Network latency matters (SSH)
- Reduces visual flicker
- Standard approach (blessed, ink)

**Implementation**:

```
Frame N-1 Buffer    Frame N Buffer
┌─────────────┐    ┌─────────────┐
│ A B C D E F │    │ A B X D E F │
│ G H I J K L │    │ G H I J K L │
└─────────────┘    └─────────────┘
                          ↓
            Only emit: cursor(2,0) + "X"
```

### 1.5 Why TypeScript Strict Mode?

**Decision**: Enable all strict flags plus extras.

**Rationale**:

- Catch bugs at compile time
- Better IDE experience
- Self-documenting code
- Required for quality library

**Configuration**:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "exactOptionalPropertyTypes": true
}
```

---

## 2. Module Structure

### 2.1 Dependency Graph

```
                              ┌──────────────┐
                              │   index.ts   │
                              │  (exports)   │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │    tui.ts    │
                              │  (factory)   │
                              └──────┬───────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
    ┌──────▼───────┐          ┌──────▼───────┐          ┌──────▼───────┐
    │  kernel.ts   │          │   types.ts   │          │  errors.ts   │
    │              │          │              │          │              │
    └──────┬───────┘          └──────────────┘          └──────────────┘
           │
    ┌──────▼───────┐
    │  @oxog/      │
    │  plugin      │
    └──────────────┘
```

### 2.2 Core Systems

```
src/core/
├── buffer.ts       ← Cell buffer, write operations
├── renderer.ts     ← ANSI generation, diff rendering
├── layout.ts       ← Flexbox algorithm
├── style.ts        ← Color resolution, attribute computation
└── screen.ts       ← TTY management, alternate screen
```

**buffer.ts**:

- `createBuffer(width, height): Buffer`
- Cell storage with packed colors
- Write/fill operations
- Resize handling

**renderer.ts**:

- `createRenderer(stdout): Renderer`
- Diff algorithm
- ANSI sequence batching
- Cursor optimization

**layout.ts**:

- `createLayoutEngine(): LayoutEngine`
- Measure pass (intrinsic sizes)
- Layout pass (constraint solving)
- Position pass (absolute coords)

**style.ts**:

- `createStyleResolver(theme): StyleResolver`
- Color parsing (hex, rgb, named)
- Color packing (RGBA → uint32)
- Style inheritance

**screen.ts**:

- `createScreen(stdin, stdout): Screen`
- Raw mode control
- Alternate screen buffer
- Resize event handling

### 2.3 Widgets

```
src/widgets/
├── node.ts         ← BaseNode, ContainerNode, LeafNode
├── box.ts          ← Box container
├── text.ts         ← Text display
├── input.ts        ← Single-line input
├── textarea.ts     ← Multi-line input
├── select.ts       ← Selection list
├── checkbox.ts     ← Toggle checkbox
├── progress.ts     ← Progress bar
├── spinner.ts      ← Loading spinner
├── table.ts        ← Data table
├── tree.ts         ← Tree view
└── tabs.ts         ← Tab navigation
```

Each widget file exports:

- Props interface
- Node interface (extends base)
- Factory function
- Internal state type

### 2.4 Plugins

```
src/plugins/
├── core/
│   ├── renderer.ts   ← Always loaded
│   ├── layout.ts     ← Always loaded
│   └── style.ts      ← Always loaded
└── optional/
    ├── input.ts      ← Keyboard handling
    ├── mouse.ts      ← Mouse events
    ├── focus.ts      ← Focus management
    ├── animation.ts  ← Transitions
    ├── scroll.ts     ← Scroll containers
    ├── clipboard.ts  ← Copy/paste
    └── screen.ts     ← Screen management
```

### 2.5 Utilities

```
src/utils/
├── ansi.ts         ← ANSI escape sequences
├── keys.ts         ← Key sequence parser
├── color.ts        ← Color parsing utilities
├── unicode.ts      ← Character width detection
└── border.ts       ← Border character sets
```

---

## 3. Design Patterns

### 3.1 Factory Pattern

All widgets use factory functions instead of classes.

```typescript
// Public API
export function box(props?: BoxProps): BoxNode {
  return new BoxNodeImpl(props)
}

// Implementation (not exported)
class BoxNodeImpl extends ContainerNode implements BoxNode {
  readonly type = 'box'

  constructor(props?: BoxProps) {
    super()
    if (props) this.applyProps(props)
  }

  // Chainable methods
  width(value: Dimension): this {
    this._layout.width = value
    this.markDirty()
    return this
  }

  // ... more methods
}
```

**Benefits**:

- Simpler import: `import { box } from '@oxog/tui'`
- No `new` keyword needed
- Can change implementation without breaking API
- Better tree-shaking

### 3.2 Builder Pattern

All node methods return `this` for chaining.

```typescript
interface BoxNode {
  width(value: Dimension): this
  height(value: Dimension): this
  border(style: BorderStyle): this
  // All return this
}

// Usage
const ui = box().width('100%').height('100%').border('rounded')
```

**Implementation**:

```typescript
width(value: Dimension): this {
  this._layout.width = value
  this.markDirty()
  return this  // Always return this
}
```

### 3.3 Observer Pattern (via @oxog/emitter)

Events are handled via type-safe emitter.

```typescript
// Kernel events
kernel.on('key', event => {
  /* KeyEvent typed */
})
kernel.on('render', () => {
  /* void */
})

// Widget events (internal)
class InputNodeImpl {
  private _onChange = createEmitter<[string]>()

  onChange(handler: (value: string) => void): this {
    this._onChange.on(handler)
    return this
  }

  private handleInput(char: string) {
    this._value += char
    this._onChange.emit(this._value)
  }
}
```

### 3.4 Strategy Pattern (Plugins)

Different behaviors are swappable via plugins.

```typescript
// Core plugin: rendererPlugin
function rendererPlugin(): Plugin<TUIContext> {
  return {
    name: 'renderer',
    version: '1.0.0',
    install(kernel) {
      const renderer = createRenderer(kernel.context.stdout)

      kernel.on('render', () => {
        renderer.render(kernel.context.buffer)
      })
    }
  }
}

// Swap rendering strategy
const customRenderer: Plugin = {
  name: 'custom-renderer',
  version: '1.0.0',
  install(kernel) {
    kernel.unregister('renderer') // Remove default
    // Install custom rendering
  }
}
```

### 3.5 Composite Pattern (Node Tree)

Widgets form a tree structure.

```typescript
abstract class BaseNode {
  protected _parent: Node | null = null
  protected _children: Node[] = []
}

class ContainerNode extends BaseNode {
  add(child: Node): this {
    this._children.push(child)
    child._parent = this
    return this
  }
}

// Tree traversal
function traverse(node: Node, visitor: (n: Node) => void) {
  visitor(node)
  for (const child of node.children) {
    traverse(child, visitor)
  }
}
```

### 3.6 Dirty Tracking Pattern

Nodes track when they need re-layout/re-render.

```typescript
abstract class BaseNode {
  protected _dirty = true
  protected _layoutDirty = true

  markDirty(): void {
    this._dirty = true
    this._layoutDirty = true
    // Propagate up
    if (this._parent instanceof BaseNode) {
      this._parent.markDirty()
    }
  }

  clearDirty(): void {
    this._dirty = false
  }
}

// Layout engine checks dirty flag
function needsLayout(node: Node): boolean {
  return node._layoutDirty
}
```

---

## 4. Implementation Details

### 4.1 Color Packing

Colors are packed into 32-bit integers for efficient storage and comparison.

```typescript
// Pack RGBA into uint32
function packColor(r: number, g: number, b: number, a: number = 255): number {
  return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)
}

// Unpack uint32 to RGBA
function unpackColor(packed: number): [number, number, number, number] {
  return [
    (packed >> 24) & 0xff, // R
    (packed >> 16) & 0xff, // G
    (packed >> 8) & 0xff, // B
    packed & 0xff // A
  ]
}

// Parse color string to packed
function parseColor(value: string): number {
  // Hex: #fff, #ffffff, #ffffffff
  if (value.startsWith('#')) {
    return parseHexColor(value)
  }

  // RGB: rgb(255, 255, 255)
  if (value.startsWith('rgb')) {
    return parseRgbColor(value)
  }

  // Named: red, blue, etc.
  return namedColors[value] ?? 0xffffffff
}
```

### 4.2 Unicode Width Handling

Terminal characters have different display widths.

```typescript
// East Asian Width categories
function getCharWidth(char: string): number {
  const code = char.codePointAt(0) ?? 0

  // ASCII control characters
  if (code < 32) return 0

  // ASCII printable
  if (code < 127) return 1

  // Common double-width ranges
  if (
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    (code >= 0x2e80 && code <= 0xa4cf) || // CJK
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility
    (code >= 0xfe10 && code <= 0xfe1f) || // Vertical forms
    (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compatibility Forms
    (code >= 0xff00 && code <= 0xff60) || // Fullwidth forms
    (code >= 0x20000 && code <= 0x2fffd) // CJK Extension B+
  ) {
    return 2
  }

  // Emoji (simplified check)
  if (code >= 0x1f300 && code <= 0x1f9ff) {
    return 2
  }

  return 1
}

// String display width
function stringWidth(str: string): number {
  let width = 0
  for (const char of str) {
    width += getCharWidth(char)
  }
  return width
}
```

### 4.3 Layout Algorithm

Simplified flexbox implementation.

```typescript
interface LayoutContext {
  availableWidth: number
  availableHeight: number
}

function layoutNode(node: Node, ctx: LayoutContext): void {
  const layout = node._layout
  const padding = resolvePadding(layout.padding)

  // 1. Resolve own dimensions
  const width = resolveDimension(layout.width, ctx.availableWidth)
  const height = resolveDimension(layout.height, ctx.availableHeight)

  // 2. Apply constraints
  const constrainedWidth = clamp(width, layout.minWidth ?? 0, layout.maxWidth ?? Infinity)
  const constrainedHeight = clamp(height, layout.minHeight ?? 0, layout.maxHeight ?? Infinity)

  // 3. Set bounds
  node._bounds = {
    x: 0, // Will be set by parent
    y: 0,
    width: constrainedWidth,
    height: constrainedHeight
  }

  // 4. Layout children if container
  if (node.children.length > 0) {
    const contentBox = {
      width: constrainedWidth - padding.left - padding.right,
      height: constrainedHeight - padding.top - padding.bottom
    }

    layoutFlexChildren(node, contentBox, padding)
  }
}

function layoutFlexChildren(
  node: Node,
  contentBox: { width: number; height: number },
  padding: ResolvedPadding
): void {
  const layout = node._layout
  const direction = layout.flexDirection ?? 'column'
  const isRow = direction === 'row'

  const mainAxis = isRow ? 'width' : 'height'
  const crossAxis = isRow ? 'height' : 'width'
  const mainStart = isRow ? 'x' : 'y'
  const crossStart = isRow ? 'y' : 'x'

  const children = node.children.filter(c => c.isVisible)
  const gap = layout.gap ?? 0
  const totalGap = gap * Math.max(0, children.length - 1)

  // Calculate flex totals
  let totalFlex = 0
  let fixedMain = 0

  for (const child of children) {
    const childLayout = child._layout
    const flex = childLayout.flex ?? 0

    if (flex > 0) {
      totalFlex += flex
    } else {
      const size = isRow
        ? resolveDimension(childLayout.width, contentBox.width)
        : resolveDimension(childLayout.height, contentBox.height)
      fixedMain += size
    }
  }

  const availableMain = contentBox[mainAxis] - totalGap
  const flexSpace = Math.max(0, availableMain - fixedMain)

  // Position children
  let mainOffset = isRow ? padding.left : padding.top

  // Apply justify-content
  const justify = layout.justifyContent ?? 'start'
  const unusedSpace = availableMain - fixedMain - (totalFlex > 0 ? flexSpace : 0)

  if (justify === 'center') {
    mainOffset += unusedSpace / 2
  } else if (justify === 'end') {
    mainOffset += unusedSpace
  } else if (justify === 'between' && children.length > 1) {
    // Space is distributed between items
  } else if (justify === 'around') {
    mainOffset += unusedSpace / (children.length * 2)
  }

  for (const child of children) {
    const childLayout = child._layout
    const flex = childLayout.flex ?? 0

    // Main axis size
    const mainSize =
      flex > 0
        ? (flexSpace * flex) / totalFlex
        : isRow
          ? resolveDimension(childLayout.width, contentBox.width)
          : resolveDimension(childLayout.height, contentBox.height)

    // Cross axis size
    const align = layout.alignItems ?? 'stretch'
    let crossSize: number
    let crossOffset = isRow ? padding.top : padding.left

    if (align === 'stretch') {
      crossSize = contentBox[crossAxis]
    } else {
      crossSize = isRow
        ? resolveDimension(childLayout.height, contentBox.height)
        : resolveDimension(childLayout.width, contentBox.width)

      const crossSpace = contentBox[crossAxis] - crossSize
      if (align === 'center') {
        crossOffset += crossSpace / 2
      } else if (align === 'end') {
        crossOffset += crossSpace
      }
    }

    // Set child bounds
    child._bounds = {
      x: isRow ? mainOffset : crossOffset,
      y: isRow ? crossOffset : mainOffset,
      width: isRow ? mainSize : crossSize,
      height: isRow ? crossSize : mainSize
    }

    // Recurse
    layoutNode(child, {
      availableWidth: child._bounds.width,
      availableHeight: child._bounds.height
    })

    mainOffset += mainSize + gap

    // Add between space
    if (justify === 'between' && children.length > 1) {
      mainOffset += unusedSpace / (children.length - 1)
    } else if (justify === 'around') {
      mainOffset += unusedSpace / children.length
    }
  }
}
```

### 4.4 Differential Rendering

```typescript
interface RenderState {
  lastBuffer: Cell[] | null
  lastWidth: number
  lastHeight: number
  forceRedraw: boolean
}

function renderDiff(buffer: Buffer, state: RenderState, stdout: NodeJS.WriteStream): number {
  const output: string[] = []
  let cellsUpdated = 0

  let currentFg = -1
  let currentBg = -1
  let currentAttrs = -1
  let cursorX = -1
  let cursorY = -1

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const cell = buffer.get(x, y)!
      const prevCell = state.forceRedraw ? null : getCellAt(state.lastBuffer, state.lastWidth, x, y)

      // Skip unchanged cells
      if (prevCell && cellsEqual(cell, prevCell)) {
        continue
      }

      cellsUpdated++

      // Move cursor if needed
      if (x !== cursorX + 1 || y !== cursorY) {
        output.push(`\x1b[${y + 1};${x + 1}H`)
      }

      // Update style if changed
      if (cell.fg !== currentFg) {
        output.push(packToFgAnsi(cell.fg))
        currentFg = cell.fg
      }

      if (cell.bg !== currentBg) {
        output.push(packToBgAnsi(cell.bg))
        currentBg = cell.bg
      }

      if (cell.attrs !== currentAttrs) {
        output.push(attrsToAnsi(cell.attrs, currentAttrs))
        currentAttrs = cell.attrs
      }

      // Write character
      output.push(cell.char)

      cursorX = x
      cursorY = y
    }
  }

  // Reset and flush
  if (output.length > 0) {
    output.push('\x1b[0m')
    stdout.write(output.join(''))
  }

  // Save buffer for next frame
  state.lastBuffer = buffer.cells.slice()
  state.lastWidth = buffer.width
  state.lastHeight = buffer.height
  state.forceRedraw = false

  return cellsUpdated
}

function cellsEqual(a: Cell, b: Cell): boolean {
  return a.char === b.char && a.fg === b.fg && a.bg === b.bg && a.attrs === b.attrs
}
```

### 4.5 Input Handling

```typescript
function createInputHandler(stdin: NodeJS.ReadStream): InputHandler {
  const keyParser = createKeyParser()
  const mouseParser = createMouseParser()
  const emitter = createEmitter<{
    key: (event: KeyEvent) => void
    mouse: (event: MouseEvent) => void
  }>()

  let isListening = false

  const onData = (data: Buffer) => {
    // Try parsing as key events
    const keys = keyParser.parse(data)
    for (const key of keys) {
      emitter.emit('key', key)
    }

    // Try parsing as mouse events
    const mice = mouseParser.parse(data)
    for (const mouse of mice) {
      emitter.emit('mouse', mouse)
    }
  }

  return {
    start() {
      if (isListening) return

      stdin.setRawMode?.(true)
      stdin.resume()
      stdin.on('data', onData)
      isListening = true
    },

    stop() {
      if (!isListening) return

      stdin.removeListener('data', onData)
      stdin.pause()
      stdin.setRawMode?.(false)
      isListening = false
    },

    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter)
  }
}
```

---

## 5. Testing Strategy

### 5.1 Test Structure

```
tests/
├── unit/                    # Individual function tests
│   ├── utils/
│   │   ├── ansi.test.ts
│   │   ├── color.test.ts
│   │   ├── keys.test.ts
│   │   ├── unicode.test.ts
│   │   └── border.test.ts
│   ├── core/
│   │   ├── buffer.test.ts
│   │   ├── renderer.test.ts
│   │   ├── layout.test.ts
│   │   ├── style.test.ts
│   │   └── screen.test.ts
│   ├── widgets/
│   │   ├── node.test.ts
│   │   ├── box.test.ts
│   │   ├── text.test.ts
│   │   ├── input.test.ts
│   │   └── ...
│   └── plugins/
│       ├── input.test.ts
│       ├── mouse.test.ts
│       └── ...
├── integration/             # Component interaction tests
│   ├── app-lifecycle.test.ts
│   ├── rendering.test.ts
│   ├── events.test.ts
│   └── layout.test.ts
└── fixtures/                # Test utilities
    ├── mock-stream.ts
    └── test-utils.ts
```

### 5.2 Mock Utilities

```typescript
// tests/fixtures/mock-stream.ts

export class MockWriteStream implements NodeJS.WriteStream {
  public output: string[] = []
  public isTTY = true
  public columns = 80
  public rows = 24

  write(chunk: string): boolean {
    this.output.push(chunk)
    return true
  }

  getOutput(): string {
    return this.output.join('')
  }

  clear(): void {
    this.output = []
  }

  // ... other WriteStream methods
}

export class MockReadStream implements NodeJS.ReadStream {
  public isTTY = true
  private _rawMode = false
  private handlers: Map<string, Function[]> = new Map()

  setRawMode(mode: boolean): this {
    this._rawMode = mode
    return this
  }

  resume(): this {
    return this
  }
  pause(): this {
    return this
  }

  on(event: string, handler: Function): this {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
    return this
  }

  removeListener(event: string, handler: Function): this {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
    return this
  }

  // Simulate input
  emit(event: string, data: unknown): void {
    const handlers = this.handlers.get(event) ?? []
    for (const h of handlers) h(data)
  }

  simulateKey(key: string): void {
    this.emit('data', Buffer.from(key))
  }

  simulateKeyEvent(event: Partial<KeyEvent>): void {
    // Convert to raw sequence
    const seq = keyEventToSequence(event)
    this.emit('data', Buffer.from(seq))
  }
}
```

### 5.3 Test Helpers

```typescript
// tests/fixtures/test-utils.ts

export function createTestApp(options?: Partial<TUIOptions>): {
  app: TUIApp
  stdin: MockReadStream
  stdout: MockWriteStream
} {
  const stdin = new MockReadStream()
  const stdout = new MockWriteStream()

  const app = tui({
    fps: 60,
    fullscreen: false,
    handleSignals: false,
    stdout,
    stdin,
    ...options
  })

  return { app, stdin, stdout }
}

export function getRenderedOutput(stdout: MockWriteStream): string[][] {
  // Parse ANSI output into 2D character grid
  const output = stdout.getOutput()
  return parseAnsiToGrid(output, stdout.columns, stdout.rows)
}

export function pressKey(stdin: MockReadStream, key: string): void {
  stdin.simulateKey(key)
}

export function pressKeys(stdin: MockReadStream, keys: string[]): void {
  for (const key of keys) {
    stdin.simulateKey(key)
  }
}

export async function waitForRender(app: TUIApp): Promise<void> {
  return new Promise(resolve => {
    app.on('render', () => resolve())
  })
}
```

### 5.4 Example Tests

```typescript
// tests/unit/widgets/box.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { box } from '../../../src/widgets/box'

describe('box', () => {
  describe('factory', () => {
    it('creates box with default props', () => {
      const b = box()
      expect(b.type).toBe('box')
      expect(b.children).toHaveLength(0)
    })

    it('creates box with initial props', () => {
      const b = box({ width: 100, height: 50, border: 'rounded' })
      expect(b._layout.width).toBe(100)
      expect(b._layout.height).toBe(50)
      expect(b._style.border).toBe('rounded')
    })
  })

  describe('chainable methods', () => {
    it('returns this for chaining', () => {
      const b = box()
      expect(b.width(100)).toBe(b)
      expect(b.height(50)).toBe(b)
      expect(b.border('single')).toBe(b)
    })

    it('updates layout properties', () => {
      const b = box().width('50%').height(10)
      expect(b._layout.width).toBe('50%')
      expect(b._layout.height).toBe(10)
    })
  })

  describe('children', () => {
    it('adds children', () => {
      const parent = box()
      const child = box()

      parent.add(child)

      expect(parent.children).toContain(child)
      expect(child.parent).toBe(parent)
    })

    it('removes children', () => {
      const parent = box()
      const child = box()

      parent.add(child)
      parent.remove(child)

      expect(parent.children).not.toContain(child)
      expect(child.parent).toBeNull()
    })
  })

  describe('dirty tracking', () => {
    it('marks dirty on property change', () => {
      const b = box()
      b.clearDirty()
      expect(b._dirty).toBe(false)

      b.width(100)
      expect(b._dirty).toBe(true)
    })

    it('propagates dirty to parent', () => {
      const parent = box()
      const child = box()
      parent.add(child)
      parent.clearDirty()

      child.width(100)

      expect(parent._dirty).toBe(true)
    })
  })
})
```

### 5.5 Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      },
      exclude: ['tests/**', 'examples/**', 'website/**', '*.config.*']
    }
  }
})
```

---

## 6. Performance Optimizations

### 6.1 Object Pooling

Reuse Cell objects to reduce GC pressure.

```typescript
class CellPool {
  private pool: Cell[] = []
  private size = 0

  acquire(): Cell {
    if (this.size > 0) {
      return this.pool[--this.size]!
    }
    return { char: ' ', fg: 0xffffffff, bg: 0, attrs: 0 }
  }

  release(cell: Cell): void {
    if (this.size < 10000) {
      // Cap pool size
      this.pool[this.size++] = cell
    }
  }

  releaseAll(cells: Cell[]): void {
    for (const cell of cells) {
      this.release(cell)
    }
  }
}
```

### 6.2 Layout Caching

Skip layout if nothing changed.

```typescript
class LayoutCache {
  private cache = new WeakMap<Node, CachedLayout>()

  get(node: Node): CachedLayout | undefined {
    return this.cache.get(node)
  }

  set(node: Node, layout: CachedLayout): void {
    this.cache.set(node, layout)
  }

  invalidate(node: Node): void {
    this.cache.delete(node)
    // Invalidate children too
    for (const child of node.children) {
      this.invalidate(child)
    }
  }
}

function computeLayout(node: Node, cache: LayoutCache, constraints: Constraints): Bounds {
  // Check cache
  const cached = cache.get(node)
  if (cached && !node._layoutDirty && constraintsMatch(cached.constraints, constraints)) {
    return cached.bounds
  }

  // Compute layout
  const bounds = doLayout(node, constraints)

  // Store in cache
  cache.set(node, { bounds, constraints: { ...constraints } })
  node._layoutDirty = false

  return bounds
}
```

### 6.3 Batch ANSI Writes

Group sequential writes for efficiency.

```typescript
function batchRender(changes: CellChange[], stdout: NodeJS.WriteStream): void {
  // Sort by position
  changes.sort((a, b) => a.y * 10000 + a.x - (b.y * 10000 + b.x))

  const chunks: string[] = []
  let lastX = -1
  let lastY = -1
  let lastStyle = ''

  for (const change of changes) {
    // Cursor move only if not sequential
    if (change.x !== lastX + 1 || change.y !== lastY) {
      chunks.push(`\x1b[${change.y + 1};${change.x + 1}H`)
    }

    // Style only if changed
    const style = styleToAnsi(change.fg, change.bg, change.attrs)
    if (style !== lastStyle) {
      chunks.push(style)
      lastStyle = style
    }

    chunks.push(change.char)
    lastX = change.x
    lastY = change.y
  }

  // Single write
  if (chunks.length > 0) {
    stdout.write(chunks.join(''))
  }
}
```

### 6.4 Lazy Style Resolution

Defer color parsing until needed.

```typescript
class LazyColor {
  private _value: string
  private _packed: number | null = null

  constructor(value: string) {
    this._value = value
  }

  get packed(): number {
    if (this._packed === null) {
      this._packed = parseColor(this._value)
    }
    return this._packed
  }
}
```

---

## 7. Error Handling Strategy

### 7.1 Error Hierarchy

```typescript
// Base error
export class TUIError extends Error {
  constructor(
    message: string,
    public readonly code: TUIErrorCode
  ) {
    super(message)
    this.name = 'TUIError'
  }
}

// Specific errors
export class PluginError extends TUIError {
  constructor(
    message: string,
    public readonly pluginName: string
  ) {
    super(message, 'PLUGIN_ERROR')
    this.name = 'PluginError'
  }
}

export class LayoutError extends TUIError {
  constructor(message: string) {
    super(message, 'LAYOUT_ERROR')
    this.name = 'LayoutError'
  }
}

export class RenderError extends TUIError {
  constructor(message: string) {
    super(message, 'RENDER_ERROR')
    this.name = 'RenderError'
  }
}

export class ValidationError extends TUIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export type TUIErrorCode =
  | 'PLUGIN_ERROR'
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_DEPENDENCY'
  | 'LAYOUT_ERROR'
  | 'RENDER_ERROR'
  | 'VALIDATION_ERROR'
  | 'STREAM_ERROR'
  | 'INVALID_NODE'
```

### 7.2 Result Pattern Usage

```typescript
import { Result, Ok, Err } from '@oxog/types'

// Parsing functions return Result
function parseColor(value: string): Result<number, ValidationError> {
  if (!value) {
    return Err(new ValidationError('Color value is required'))
  }

  const parsed = tryParseColor(value)
  if (parsed === null) {
    return Err(new ValidationError(`Invalid color: ${value}`))
  }

  return Ok(parsed)
}

// Usage
const colorResult = parseColor('#ff0000')
if (colorResult.isOk()) {
  const color = colorResult.value
} else {
  console.error(colorResult.error.message)
}
```

### 7.3 Error Propagation

```typescript
// Kernel emits errors
kernel.on('error', error => {
  // Default: log and continue
  console.error(`[TUI Error] ${error.message}`)
})

// User can override
app.on('error', error => {
  if (error instanceof PluginError) {
    // Handle plugin errors specifically
  }
})
```

---

## 8. API Design Principles

### 8.1 Predictable Naming

| Pattern   | Example              | Description              |
| --------- | -------------------- | ------------------------ |
| Factory   | `box()`, `text()`    | Creates new widget       |
| Getter    | `readonly value`     | Returns current value    |
| Setter    | `value(v): this`     | Sets value, returns this |
| Handler   | `onChange(fn): this` | Registers callback       |
| Action    | `focus(): this`      | Triggers action          |
| Predicate | `readonly isFocused` | Returns boolean state    |

### 8.2 Consistent Return Types

```typescript
// Setters always return this
width(value: Dimension): this
height(value: Dimension): this
border(style: BorderStyle): this

// Getters are readonly properties
readonly currentValue: string
readonly isFocused: boolean
readonly bounds: Bounds

// Handlers return this for chaining
onChange(fn: (v: string) => void): this
onSubmit(fn: (v: string) => void): this
```

### 8.3 Props vs Methods Parity

Everything available in props is available as a method.

```typescript
// Props
box({
  width: 100,
  height: 50,
  border: 'rounded',
  bg: '#333'
})

// Methods
box().width(100).height(50).border('rounded').bg('#333')

// Both produce identical result
```

### 8.4 Sensible Defaults

```typescript
const DEFAULT_OPTIONS: Required<TUIOptions> = {
  fps: 30,
  fullscreen: true,
  mouse: false,
  handleSignals: true,
  theme: defaultTheme,
  stdout: process.stdout,
  stdin: process.stdin
}

const DEFAULT_BOX_PROPS: Required<BoxProps> = {
  width: 'auto',
  height: 'auto',
  minWidth: 0,
  maxWidth: Infinity,
  minHeight: 0,
  maxHeight: Infinity,
  flex: 0,
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'stretch',
  gap: 0,
  padding: 0,
  margin: 0,
  border: 'none',
  borderColor: 'inherit',
  bg: 'transparent'
}
```

### 8.5 Type Safety

```typescript
// Generic widgets for type inference
function select<T extends SelectOption>(props?: SelectProps<T>): SelectNode<T>

// Usage with inferred types
interface MenuItem extends SelectOption {
  icon: string
  action: () => void
}

const menu = select<MenuItem>()
  .options([{ label: 'New', value: 'new', icon: '+', action: () => {} }])
  .onSelect(item => {
    // item is MenuItem, not just SelectOption
    console.log(item.icon)
    item.action()
  })
```

---

## Appendix: File Templates

### Widget Template

````typescript
// src/widgets/[widget].ts
import { LeafNode } from './node'
import type { Color, Bounds } from '../types'
import type { Buffer } from '../core/buffer'

// ============================================================
// Types
// ============================================================

export interface [Widget]Props {
  // Props here
}

export interface [Widget]Node extends LeafNode {
  // Chainable methods
  // Event handlers
  // Readonly properties
}

// ============================================================
// State
// ============================================================

interface [Widget]State {
  // Internal state
}

// ============================================================
// Implementation
// ============================================================

class [Widget]NodeImpl extends LeafNode implements [Widget]Node {
  readonly type = '[widget]'
  private _state: [Widget]State

  constructor(props?: [Widget]Props) {
    super()
    this._state = this.createInitialState()
    if (props) this.applyProps(props)
  }

  private createInitialState(): [Widget]State {
    return {
      // Initial state
    }
  }

  private applyProps(props: [Widget]Props): void {
    // Apply props
  }

  // Chainable methods
  // ...

  // Rendering
  render(buffer: Buffer, bounds: Bounds): void {
    if (!this.isVisible) return
    // Render implementation
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a [widget] widget.
 *
 * @example
 * ```typescript
 * const w = [widget]()
 * ```
 */
export function [widget](props?: [Widget]Props): [Widget]Node {
  return new [Widget]NodeImpl(props)
}
````

### Plugin Template

````typescript
// src/plugins/optional/[plugin].ts
import type { Plugin, TUIContext } from '../../types'

// ============================================================
// Types
// ============================================================

export interface [Plugin]Config {
  // Configuration
}

// ============================================================
// Implementation
// ============================================================

/**
 * [Plugin] plugin.
 *
 * @example
 * ```typescript
 * const app = tui().use([plugin]Plugin())
 * ```
 */
export function [plugin]Plugin(config?: [Plugin]Config): Plugin<TUIContext> {
  return {
    name: '[plugin]',
    version: '1.0.0',
    dependencies: [],

    install(kernel) {
      // Hook into kernel events
    },

    onInit(context) {
      // Initialize plugin
    },

    onDestroy() {
      // Cleanup
    },

    onError(error) {
      // Handle errors
    }
  }
}
````

---

_End of Implementation Guide_
