# @oxog/tui

A zero-external-dependency, micro-kernel Terminal User Interface framework for Node.js.

[![npm version](https://img.shields.io/npm/v/@oxog/tui.svg)](https://www.npmjs.com/package/@oxog/tui)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Zero external dependencies** - Only uses `@oxog/*` packages
- 🔌 **Micro-kernel architecture** - Modular plugin system
- 📦 **TypeScript-first** - Full type safety and IntelliSense
- ⚡ **Differential rendering** - Optimal performance with minimal redraws
- 🎨 **Flexbox-like layout** - Familiar layout system without yoga-layout
- 🧩 **11 built-in widgets** - Box, Text, Input, Select, Checkbox, Progress, Spinner, Textarea, Table, Tree, Tabs
- 🎭 **Theming support** - Built-in themes and custom theme creation
- ⌨️ **Full input handling** - Keyboard and mouse support
- 🔄 **Animation support** - Tweening and frame-based animations

## Installation

```bash
npm install @oxog/tui
```

## Quick Start

```typescript
import { tui, box, text } from '@oxog/tui'
import { standardPlugins } from '@oxog/tui/plugins'

// Create the application
const app = tui({
  plugins: standardPlugins(),
  title: 'My TUI App'
})

// Build the UI
const root = box({ flexDirection: 'column' })
  .justify('center')
  .align('center')
  .add(text('Hello, World!').fg('#00ff00').bold(true))

// Handle quit
app.on('key', event => {
  if (event.key === 'q') app.quit()
})

// Mount and start
app.mount(root)
app.start()
```

## Architecture

@oxog/tui follows a micro-kernel architecture:

```
┌─────────────────────────────────────────────┐
│                 Application                  │
├─────────────────────────────────────────────┤
│   Widgets (box, text, input, select, ...)   │
├─────────────────────────────────────────────┤
│  Plugins (renderer, layout, style, input)   │
├─────────────────────────────────────────────┤
│              Kernel (tui factory)           │
└─────────────────────────────────────────────┘
```

## Widgets

### Box Container

```typescript
import { box, text } from '@oxog/tui'

const container = box()
  .direction('row')
  .padding(1)
  .gap(2)
  .border(true)
  .add(text('Left'))
  .add(text('Right'))
```

### Text Display

```typescript
const label = text('Hello!').fg('#ff0000').bg('#000000').bold(true).underline(true)
```

### Input Field

```typescript
const nameInput = input()
  .placeholder('Enter your name')
  .onChange(value => console.log('Name:', value))
  .onSubmit(value => console.log('Submitted:', value))
```

### Select List

```typescript
const menu = select()
  .items([
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' }
  ])
  .onChange(item => console.log('Selected:', item.value))
```

### Checkbox

```typescript
const terms = checkbox()
  .label('I agree to the terms')
  .checked(false)
  .onChange(checked => console.log('Checked:', checked))
```

### Progress Bar

```typescript
const loading = progress().value(50).showPercent(true).filledChar('█').emptyChar('░')
```

### Spinner

```typescript
const loader = spinner().style('dots').label('Loading...')
```

### Textarea

```typescript
const editor = textarea().placeholder('Type here...').wrap(true).showLineNumbers(true)
```

### Table

```typescript
const data = table()
  .columns([
    { key: 'name', label: 'Name', width: 20 },
    { key: 'email', label: 'Email', width: 30 }
  ])
  .data([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ])
```

### Tree View

```typescript
const files = tree()
  .items([
    {
      label: 'src',
      children: [{ label: 'index.ts' }, { label: 'utils.ts' }]
    }
  ])
  .showGuides(true)
```

### Tabs

```typescript
const mainTabs = tabs()
  .tabs([
    { label: 'Home', content: homeBox },
    { label: 'Settings', content: settingsBox }
  ])
  .position('top')
```

## Plugins

### Standard Plugins

```typescript
import { standardPlugins } from '@oxog/tui/plugins'

const app = tui({
  plugins: standardPlugins() // renderer, layout, style, screen, input, focus
})
```

### Individual Plugins

```typescript
import {
  rendererPlugin,
  layoutPlugin,
  stylePlugin,
  inputPlugin,
  mousePlugin,
  focusPlugin,
  animationPlugin,
  scrollPlugin,
  clipboardPlugin,
  screenPlugin
} from '@oxog/tui/plugins'
```

### Theming

```typescript
import { stylePlugin, darkTheme, lightTheme, draculaTheme, nordTheme } from '@oxog/tui/plugins'

const app = tui({
  plugins: [
    // ... other plugins
    stylePlugin({ theme: draculaTheme })
  ]
})

// Change theme at runtime
app.style.setTheme(nordTheme)
```

## Layout System

@oxog/tui uses a flexbox-like layout system:

```typescript
const layout = box()
  .direction('column') // or 'row', 'column-reverse', 'row-reverse'
  .justify('center') // 'start', 'end', 'center', 'space-between', 'space-around'
  .align('stretch') // 'start', 'end', 'center', 'stretch'
  .gap(1) // spacing between children
  .padding(2) // padding inside
  .margin(1) // margin outside
  .flex(1) // flex grow factor
  .width(50) // fixed width
  .height('50%') // percentage height
```

## Event Handling

### Keyboard Events

```typescript
app.on('key', event => {
  console.log(event.key) // 'a', 'Enter', 'ArrowUp', etc.
  console.log(event.ctrl) // true if Ctrl pressed
  console.log(event.alt) // true if Alt pressed
  console.log(event.shift) // true if Shift pressed
})

// Or use input plugin bindings
app.input.bind('ctrl+s', () => save())
app.input.bind('q', () => app.quit())
```

### Mouse Events

```typescript
app.mouse.on(event => {
  console.log(event.action) // 'click', 'scroll', 'move'
  console.log(event.x, event.y)
  console.log(event.button) // 'left', 'right', 'middle'
})
```

## Examples

See the [examples](./examples) directory for complete examples:

- `01-hello-world.ts` - Basic setup
- `02-box-layout.ts` - Flexbox layout
- `03-form.ts` - Form inputs
- `04-progress-spinner.ts` - Progress and spinner
- `05-table.ts` - Data table
- `06-tree.ts` - Tree view
- `07-tabs.ts` - Tabbed interface
- `08-textarea.ts` - Text editor
- `09-theming.ts` - Theme switching

## API Reference

### tui(options)

Creates a TUI application.

```typescript
const app = tui({
  plugins: Plugin[],      // Plugins to install
  theme?: Theme,          // Default theme
  title?: string,         // Terminal title
  fps?: number            // Target frame rate (default: 60)
})
```

### TUIApp

```typescript
interface TUIApp {
  // Properties
  width: number
  height: number
  root: Node | null
  isRunning: boolean

  // Methods
  mount(node: Node): this
  unmount(): this
  start(): this
  quit(): Promise<void>
  refresh(): this

  // Events
  on(event: string, handler: Function): this
  off(event: string, handler: Function): this
  emit(event: string, ...args: any[]): this

  // Plugins
  use(plugin: Plugin): this
  getPlugin<T>(name: string): T | undefined
}
```

## License

MIT © Ersin Koç
