# TUI - @oxog NPM Package

## Package Identity

| Field       | Value                             |
| ----------- | --------------------------------- |
| **npm**     | `@oxog/tui`                       |
| **GitHub**  | `https://github.com/ersinkoc/tui` |
| **Website** | `https://tui.oxog.dev`            |
| **Author**  | Ersin Koç                         |
| **License** | MIT                               |

> NO social media, Discord, email, or external links.

---

## Description

**One-line:** Build beautiful terminal interfaces with TypeScript

@oxog/tui is a zero-external-dependency terminal UI framework with micro-kernel architecture. It provides a hybrid API combining functional widget creation with chainable methods, making it intuitive for both simple CLI tools and complex terminal applications. Features include differential rendering, flexbox-like layout, comprehensive widget library, and full plugin extensibility.

---

## @oxog Dependencies

This package uses the following @oxog packages:

### @oxog/types

Type utilities and Result pattern for error handling.

```typescript
import { Result, Ok, Err, Option, Some, None } from '@oxog/types'

// Result pattern for operations that can fail
function parseInput(input: string): Result<ParsedData, ParseError> {
  if (!input) return Err(new ParseError('Empty input'))
  return Ok({ value: input.trim() })
}

// Option pattern for nullable values
function findWidget(id: string): Option<Widget> {
  const widget = widgets.get(id)
  return widget ? Some(widget) : None
}
```

### @oxog/emitter

Type-safe event emitter for keyboard, mouse, and widget events.

```typescript
import { createEmitter } from '@oxog/emitter'

interface TUIEvents {
  key: (event: KeyEvent) => void
  mouse: (event: MouseEvent) => void
  resize: (width: number, height: number) => void
  focus: (widget: Widget) => void
  blur: (widget: Widget) => void
}

const emitter = createEmitter<TUIEvents>()
emitter.on('key', event => {
  /* handle */
})
emitter.emit('key', { name: 'enter', ctrl: false })
```

### @oxog/plugin

Micro-kernel plugin system for extensible architecture.

```typescript
import { createKernel, Plugin } from '@oxog/plugin'

interface TUIContext {
  renderer: Renderer
  root: Node
}

const kernel = createKernel<TUIContext>()

const myPlugin: Plugin<TUIContext> = {
  name: 'my-plugin',
  version: '1.0.0',
  install(kernel) {
    kernel.on('render', ctx => {
      /* extend */
    })
  }
}

kernel.use(myPlugin)
```

### @oxog/pigment

Console color and styling utilities for ANSI output.

```typescript
import { rgb, hex, bold, italic, underline, bg } from '@oxog/pigment'

// Color utilities
const red = rgb(255, 0, 0)
const brand = hex('#00ff88')

// Style composition
const styled = bold(italic(red('Error!')))
const withBg = bg.hex('#333')(brand('Success'))

// ANSI code generation
import { ansi } from '@oxog/pigment'
ansi.fg(255, 100, 50) // '\x1b[38;2;255;100;50m'
ansi.reset() // '\x1b[0m'
```

---

## NON-NEGOTIABLE RULES

### 1. DEPENDENCY POLICY

```json
{
  "dependencies": {
    "@oxog/types": "^1.0.0",
    "@oxog/emitter": "^1.0.0",
    "@oxog/plugin": "^1.0.0",
    "@oxog/pigment": "^1.0.0"
  }
}
```

- ONLY `@oxog/*` packages allowed as runtime dependencies
- NO external packages (lodash, yoga-layout, blessed, ink, etc.)
- Implement layout engine, widgets, rendering from scratch

**Allowed devDependencies:**

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line, branch, function tested
- All tests must pass
- Use Vitest
- Thresholds enforced in config

### 3. MICRO-KERNEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                        User Code                             │
│    tui().use(inputPlugin()).mount(ui).start()               │
├─────────────────────────────────────────────────────────────┤
│                    Widget Factory API                        │
│    box() · text() · input() · select() · table() · ...      │
├─────────────────────────────────────────────────────────────┤
│                   Plugin Registry API                        │
│         use() · unregister() · hasPlugin() · list()         │
├──────────┬───────────┬────────────┬─────────────────────────┤
│   Core   │  Optional │  Imported  │       Community         │
│ Plugins  │  Plugins  │  Plugins   │        Plugins          │
├──────────┴───────────┴────────────┴─────────────────────────┤
│                      Micro Kernel                            │
│   Event Bus · Render Loop · Layout Engine · Node Tree       │
└─────────────────────────────────────────────────────────────┘
```

### 4. DEVELOPMENT WORKFLOW

Create these documents FIRST:

1. **SPECIFICATION.md** - Complete spec
2. **IMPLEMENTATION.md** - Architecture
3. **TASKS.md** - Ordered task list

Only then implement code following TASKS.md.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 6. LLM-NATIVE DESIGN

- `llms.txt` file (< 2000 tokens)
- Predictable API naming
- Rich JSDoc with @example
- Minimum 15 examples
- README optimized for LLMs

---

## CORE FEATURES

### 1. Hybrid API Design

Functional widget creation with chainable methods for intuitive API.

```typescript
import { tui, box, text, input } from '@oxog/tui'

// Functional creation + chaining
const ui = box({ border: 'rounded' })
  .padding(1)
  .bg('#1a1a2e')
  .add(text('Welcome to TUI!').color('#00ff88').bold())
  .add(
    input()
      .placeholder('Enter your name...')
      .onSubmit(value => console.log(value))
  )

// App lifecycle
const app = tui({ fps: 30 }).use(inputPlugin()).mount(ui).start()
```

### 2. Micro-Kernel Plugin System

Extensible architecture where features are plugins.

```typescript
import { tui, Plugin } from '@oxog/tui'
import { inputPlugin, mousePlugin, focusPlugin } from '@oxog/tui/plugins'

// Built-in optional plugins
const app = tui()
  .use(inputPlugin()) // Keyboard handling
  .use(mousePlugin()) // Mouse events
  .use(focusPlugin()) // Focus management

// Custom plugin
const loggerPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  install(kernel) {
    kernel.on('render', () => console.log('Rendered'))
    kernel.on('key', e => console.log('Key:', e.name))
  }
}

app.use(loggerPlugin)
```

### 3. Lightweight Layout Engine

Flexbox-like layout without yoga-layout dependency.

```typescript
import { box, text } from '@oxog/tui'

// Flexbox-like layout
const layout = box({ width: '100%', height: '100%' })
  .flexDirection('column')
  .add(
    // Header - fixed height
    box({ height: 3 }).bg('#333').add(text('Header').color('white'))
  )
  .add(
    // Content - flex grow
    box({ flex: 1 })
      .flexDirection('row')
      .add(
        // Sidebar - fixed width
        box({ width: 20 }).border('single')
      )
      .add(
        // Main - flex grow
        box({ flex: 1 }).border('rounded')
      )
  )
  .add(
    // Footer - fixed height
    box({ height: 1 }).add(text('Press q to quit').color('gray'))
  )
```

### 4. Differential Rendering

Only changed cells are written to terminal for performance.

```typescript
// Internal: Buffer diff algorithm
interface Cell {
  char: string
  fg: number // Packed RGBA
  bg: number // Packed RGBA
  attrs: number // Bold, italic, underline flags
}

// Only emit ANSI for cells that changed between frames
// Group sequential changes for batched writes
// Skip unchanged regions entirely
```

### 5. Comprehensive Widget Library

11 built-in widgets covering common UI patterns.

```typescript
import {
  box, // Container with border, background
  text, // Styled text
  input, // Single-line text input
  textarea, // Multi-line text input
  select, // Selection list
  checkbox, // Toggle checkbox
  progress, // Progress bar
  spinner, // Loading spinner
  table, // Data table
  tree, // Tree view
  tabs // Tab navigation
} from '@oxog/tui'
```

### 6. Event System

Keyboard, mouse, and widget events via @oxog/emitter.

```typescript
import { tui, inputPlugin } from '@oxog/tui'

const app = tui().use(inputPlugin())

// Global key events
app.on('key', event => {
  if (event.name === 'q') app.stop()
  if (event.ctrl && event.name === 'c') app.stop()
})

// Widget-specific events
const nameInput = input()
  .onFocus(() => console.log('Focused'))
  .onBlur(() => console.log('Blurred'))
  .onChange(value => console.log('Changed:', value))
  .onSubmit(value => console.log('Submitted:', value))
```

### 7. Theming System

Color schemes and style presets.

```typescript
import { tui, createTheme } from '@oxog/tui'

const darkTheme = createTheme({
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
    success: '#00ff88'
  },
  borders: {
    default: 'rounded',
    focus: 'double'
  }
})

const app = tui({ theme: darkTheme })
```

### 8. Responsive Design

Automatic terminal resize handling.

```typescript
import { tui, box, text } from '@oxog/tui'

const app = tui()

// Percentage-based sizing
const ui = box({ width: '100%', height: '100%' }).add(
  box({ width: '50%', height: '50%' }).border('rounded')
)

// Resize event
app.on('resize', (width, height) => {
  console.log(`Terminal: ${width}x${height}`)
})

app.mount(ui).start()
```

### 9. Full TypeScript Support

Type inference and strict typing throughout.

```typescript
import { tui, box, text, select, SelectOption } from '@oxog/tui'

// Type-safe options
interface MenuItem extends SelectOption {
  icon: string
  action: () => void
}

const menuItems: MenuItem[] = [
  { label: 'New File', value: 'new', icon: '📄', action: () => {} },
  { label: 'Open', value: 'open', icon: '📂', action: () => {} },
  { label: 'Save', value: 'save', icon: '💾', action: () => {} }
]

const menu = select<MenuItem>()
  .options(menuItems)
  .onSelect(item => {
    // item is typed as MenuItem
    console.log(item.icon, item.label)
    item.action()
  })
```

### 10. Clean Lifecycle Management

Proper cleanup and resource management.

```typescript
import { tui } from '@oxog/tui'

const app = tui({ fullscreen: true })

// Graceful shutdown
process.on('SIGINT', () => {
  app.stop() // Restores terminal state
  process.exit(0)
})

// Or use built-in handling
const app = tui({
  fullscreen: true,
  handleSignals: true // Auto-cleanup on SIGINT/SIGTERM
})
```

---

## PLUGIN SYSTEM

### Standard Plugin Interface

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

interface TUIContext {
  renderer: Renderer
  root: Node | null
  focused: Node | null
  theme: Theme
  screen: Screen
}
```

### Core Plugins (Always Loaded)

| Plugin           | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `rendererPlugin` | ANSI rendering, buffer management, differential updates |
| `layoutPlugin`   | Flexbox-like layout calculations, constraint solving    |
| `stylePlugin`    | Color resolution, border drawing, attribute handling    |

### Optional Plugins (Opt-in)

| Plugin            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `inputPlugin`     | Keyboard input handling, key sequence parsing      |
| `mousePlugin`     | Mouse events, click/scroll detection, SGR protocol |
| `focusPlugin`     | Focus management, tab navigation, focus trapping   |
| `animationPlugin` | Transitions, spring physics, easing functions      |
| `scrollPlugin`    | Scroll containers, virtual scrolling, scrollbars   |
| `clipboardPlugin` | Copy/paste via OSC 52 or fallback                  |
| `screenPlugin`    | Alternate screen, cursor visibility, raw mode      |

### Exported Plugins (For Ecosystem)

| Plugin               | Description                               |
| -------------------- | ----------------------------------------- |
| `ansiPlugin`         | ANSI escape sequence generation utilities |
| `keyParserPlugin`    | Terminal key sequence parser (standalone) |
| `layoutEnginePlugin` | Layout calculation engine (standalone)    |

---

## API DESIGN

### Main Export - tui()

````typescript
import { tui } from '@oxog/tui'

/**
 * Create a new TUI application instance.
 *
 * @example
 * ```typescript
 * const app = tui({ fps: 30, fullscreen: true })
 *   .use(inputPlugin())
 *   .mount(myUI)
 *   .start()
 * ```
 */
function tui(options?: TUIOptions): TUIApp

interface TUIOptions {
  /** Target frames per second. @default 30 */
  fps?: number
  /** Use alternate screen buffer. @default true */
  fullscreen?: boolean
  /** Enable mouse support. @default false */
  mouse?: boolean
  /** Auto-handle SIGINT/SIGTERM. @default true */
  handleSignals?: boolean
  /** Color theme. @default defaultTheme */
  theme?: Theme
  /** Output stream. @default process.stdout */
  stdout?: NodeJS.WriteStream
  /** Input stream. @default process.stdin */
  stdin?: NodeJS.ReadStream
}

interface TUIApp {
  /** Register a plugin */
  use(plugin: Plugin): this
  /** Mount root node */
  mount(node: Node): this
  /** Start render loop */
  start(): this
  /** Stop and cleanup */
  stop(): this
  /** Force re-render */
  render(): this
  /** Subscribe to events */
  on<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): () => void
  /** Emit event */
  emit<K extends keyof TUIEvents>(event: K, ...args: Parameters<TUIEvents[K]>): void
  /** Get terminal dimensions */
  readonly width: number
  readonly height: number
  /** Check if running */
  readonly isRunning: boolean
}
````

### Widget Factories

```typescript
// box() - Container widget
function box(props?: BoxProps): BoxNode

interface BoxProps {
  width?: number | `${number}%`
  height?: number | `${number}%`
  flex?: number
  flexDirection?: 'row' | 'column'
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around'
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  padding?: number | [number, number] | [number, number, number, number]
  margin?: number | [number, number] | [number, number, number, number]
  border?: 'none' | 'single' | 'double' | 'rounded' | 'bold' | 'ascii'
  borderColor?: string
  bg?: string
}

interface BoxNode extends Node {
  add(child: Node): this
  remove(child: Node): this
  width(value: number | `${number}%`): this
  height(value: number | `${number}%`): this
  flex(value: number): this
  flexDirection(value: 'row' | 'column'): this
  justifyContent(value: JustifyContent): this
  alignItems(value: AlignItems): this
  padding(value: number | number[]): this
  margin(value: number | number[]): this
  border(style: BorderStyle): this
  borderColor(color: string): this
  bg(color: string): this
}

// text() - Text widget
function text(content?: string): TextNode

interface TextNode extends Node {
  content(value: string): this
  color(fg: string): this
  bg(color: string): this
  bold(): this
  italic(): this
  underline(): this
  strikethrough(): this
  dim(): this
  align(value: 'left' | 'center' | 'right'): this
  wrap(value: boolean): this
}

// input() - Text input widget
function input(props?: InputProps): InputNode

interface InputNode extends Node {
  placeholder(value: string): this
  value(value: string): this
  password(mask?: string): this
  maxLength(value: number): this
  onChange(handler: (value: string) => void): this
  onSubmit(handler: (value: string) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this
  focus(): this
  blur(): this
  readonly currentValue: string
}

// select() - Selection list widget
function select<T extends SelectOption = SelectOption>(props?: SelectProps<T>): SelectNode<T>

interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface SelectNode<T> extends Node {
  options(items: T[]): this
  selected(index: number): this
  onSelect(handler: (item: T, index: number) => void): this
  onChange(handler: (item: T, index: number) => void): this
  scrollable(value: boolean): this
  maxVisible(count: number): this
  readonly selectedIndex: number
  readonly selectedItem: T | undefined
}

// Additional widgets follow same pattern:
// textarea(), checkbox(), progress(), spinner(), table(), tree(), tabs()
```

### Type Definitions

```typescript
// Core types
type Color = string // Hex (#fff, #ffffff), RGB (rgb(255,255,255)), named (red, blue)

type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'bold' | 'ascii'

type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around'

type AlignItems = 'start' | 'center' | 'end' | 'stretch'

// Event types
interface KeyEvent {
  name: string // 'a', 'enter', 'up', 'f1', etc.
  sequence: string // Raw escape sequence
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

interface MouseEvent {
  x: number
  y: number
  button: 'left' | 'right' | 'middle' | 'none'
  action: 'press' | 'release' | 'move' | 'scroll'
  scroll?: 'up' | 'down'
  ctrl: boolean
  alt: boolean
  shift: boolean
}

interface TUIEvents {
  key: (event: KeyEvent) => void
  mouse: (event: MouseEvent) => void
  resize: (width: number, height: number) => void
  focus: (node: Node) => void
  blur: (node: Node) => void
  render: () => void
  error: (error: Error) => void
}

// Node base
interface Node {
  readonly id: string
  readonly type: string
  readonly parent: Node | null
  readonly children: readonly Node[]
  visible(value: boolean): this
  readonly isVisible: boolean
  readonly bounds: { x: number; y: number; width: number; height: number }
}
```

---

## TECHNICAL REQUIREMENTS

| Requirement          | Value          |
| -------------------- | -------------- |
| Runtime              | Node.js >= 18  |
| Module Format        | ESM + CJS      |
| TypeScript           | >= 5.0         |
| Bundle (core)        | < 5KB gzipped  |
| Bundle (all plugins) | < 10KB gzipped |
| Bundle (all widgets) | < 15KB gzipped |

---

## PROJECT STRUCTURE

```
tui/
├── .github/workflows/
│   ├── deploy.yml              # Website deployment
│   └── publish.yml             # npm publishing
├── src/
│   ├── index.ts                # Main entry, public exports
│   ├── tui.ts                  # TUI app factory
│   ├── kernel.ts               # Micro kernel implementation
│   ├── types.ts                # Type definitions
│   ├── errors.ts               # Custom error classes
│   ├── constants.ts            # Package constants
│   ├── core/
│   │   ├── renderer.ts         # ANSI rendering engine
│   │   ├── buffer.ts           # Cell buffer management
│   │   ├── layout.ts           # Layout engine
│   │   ├── style.ts            # Style resolution
│   │   └── screen.ts           # Terminal screen management
│   ├── widgets/
│   │   ├── index.ts            # Widget exports
│   │   ├── node.ts             # Base node class
│   │   ├── box.ts              # Box widget
│   │   ├── text.ts             # Text widget
│   │   ├── input.ts            # Input widget
│   │   ├── textarea.ts         # Textarea widget
│   │   ├── select.ts           # Select widget
│   │   ├── checkbox.ts         # Checkbox widget
│   │   ├── progress.ts         # Progress bar
│   │   ├── spinner.ts          # Loading spinner
│   │   ├── table.ts            # Data table
│   │   ├── tree.ts             # Tree view
│   │   └── tabs.ts             # Tab navigation
│   ├── plugins/
│   │   ├── index.ts            # Plugin exports
│   │   ├── core/
│   │   │   ├── index.ts
│   │   │   ├── renderer.ts     # Renderer plugin
│   │   │   ├── layout.ts       # Layout plugin
│   │   │   └── style.ts        # Style plugin
│   │   └── optional/
│   │       ├── index.ts
│   │       ├── input.ts        # Input plugin
│   │       ├── mouse.ts        # Mouse plugin
│   │       ├── focus.ts        # Focus plugin
│   │       ├── animation.ts    # Animation plugin
│   │       ├── scroll.ts       # Scroll plugin
│   │       ├── clipboard.ts    # Clipboard plugin
│   │       └── screen.ts       # Screen plugin
│   └── utils/
│       ├── ansi.ts             # ANSI escape codes
│       ├── keys.ts             # Key sequence parser
│       ├── color.ts            # Color utilities
│       ├── unicode.ts          # Unicode width handling
│       └── border.ts           # Border character sets
├── tests/
│   ├── unit/
│   │   ├── tui.test.ts
│   │   ├── kernel.test.ts
│   │   ├── renderer.test.ts
│   │   ├── layout.test.ts
│   │   ├── widgets/
│   │   │   ├── box.test.ts
│   │   │   ├── text.test.ts
│   │   │   ├── input.test.ts
│   │   │   └── ...
│   │   └── plugins/
│   │       ├── input.test.ts
│   │       ├── mouse.test.ts
│   │       └── ...
│   ├── integration/
│   │   ├── app-lifecycle.test.ts
│   │   ├── rendering.test.ts
│   │   └── events.test.ts
│   └── fixtures/
│       ├── mock-stream.ts
│       └── test-utils.ts
├── examples/
│   ├── 01-basic/
│   │   ├── minimal.ts
│   │   ├── hello-world.ts
│   │   ├── with-options.ts
│   │   └── README.md
│   ├── 02-widgets/
│   │   ├── box-layouts.ts
│   │   ├── text-styles.ts
│   │   ├── input-form.ts
│   │   ├── select-menu.ts
│   │   ├── progress-bar.ts
│   │   ├── data-table.ts
│   │   └── README.md
│   ├── 03-plugins/
│   │   ├── keyboard-input.ts
│   │   ├── mouse-events.ts
│   │   ├── focus-management.ts
│   │   ├── custom-plugin.ts
│   │   └── README.md
│   ├── 04-layouts/
│   │   ├── flexbox-row.ts
│   │   ├── flexbox-column.ts
│   │   ├── nested-layouts.ts
│   │   ├── responsive.ts
│   │   └── README.md
│   ├── 05-themes/
│   │   ├── dark-theme.ts
│   │   ├── light-theme.ts
│   │   ├── custom-theme.ts
│   │   └── README.md
│   └── 06-real-world/
│       ├── todo-app/
│       ├── file-browser/
│       ├── dashboard/
│       └── README.md
├── website/
│   ├── public/
│   │   ├── CNAME              # tui.oxog.dev
│   │   ├── llms.txt
│   │   ├── favicon.svg
│   │   └── og-image.png
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── llms.txt
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .gitignore
```

---

## GITHUB WORKFLOWS

### deploy.yml (Website)

```yaml
name: Deploy Website

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - working-directory: ./website
        run: npm ci && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### publish.yml (npm)

```yaml
name: Publish to npm

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## WEBSITE REQUIREMENTS

- React 19 + Vite 6 + Tailwind CSS v4
- @oxog/codeshine for syntax highlighting
- shadcn/ui components
- Lucide React icons
- JetBrains Mono + Inter fonts
- CNAME: tui.oxog.dev
- Footer: "Made with ❤️ by Ersin KOÇ"
- GitHub link only (no social media)

### Website Pages

1. **Home** - Hero, features, quick example
2. **Getting Started** - Installation, first app
3. **Widgets** - All widget documentation
4. **Plugins** - Plugin system, built-in plugins
5. **Themes** - Theming system
6. **Examples** - Interactive examples
7. **API Reference** - Full API docs

---

## IMPLEMENTATION CHECKLIST

### Before Starting

- [ ] Create SPECIFICATION.md
- [ ] Create IMPLEMENTATION.md
- [ ] Create TASKS.md

### During Implementation

- [ ] Follow TASKS.md sequentially
- [ ] Write tests with each feature
- [ ] Maintain 100% coverage
- [ ] JSDoc on every public API

### Package Completion

- [ ] All tests passing (100%)
- [ ] Coverage at 100%
- [ ] No TypeScript errors
- [ ] Package builds

### LLM-Native Completion

- [ ] llms.txt created (< 2000 tokens)
- [ ] README optimized
- [ ] 15+ examples
- [ ] 8-12 npm keywords

### Website Completion

- [ ] All pages implemented
- [ ] @oxog/codeshine integrated
- [ ] Dark/Light theme
- [ ] CNAME configured

### Final

- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds
- [ ] All examples run

---

## KEYWORDS FOR npm

```json
{
  "keywords": [
    "tui",
    "terminal",
    "cli",
    "console",
    "ui",
    "interface",
    "typescript",
    "zero-dependency",
    "plugin",
    "micro-kernel",
    "oxog",
    "nodejs"
  ]
}
```

---

## BEGIN IMPLEMENTATION

Start with **SPECIFICATION.md**, then **IMPLEMENTATION.md**, then **TASKS.md**.

Only after all three documents are complete, implement code following TASKS.md sequentially.

**Remember:**

- Production-ready for npm publish
- Only @oxog/\* dependencies allowed
- 100% test coverage
- LLM-native design
- Beautiful documentation website

**Key differentiators from OpenTUI:**

- Zero external dependencies (no yoga-layout, no native code)
- Hybrid API (functional + chainable) vs pure imperative
- Lighter bundle (< 15KB vs 50KB+)
- Plugin-based everything
- Works on any Node.js (no Bun/Zig requirement)
