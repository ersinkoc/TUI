# @oxog/tui - Implementation Tasks

> Total Tasks: 89
> Status: Ready for Implementation
> Last Updated: 2026-01-19

## Task Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked

---

## Phase 1: Project Setup (Tasks 1-8)

### Task 1: Initialize package.json

```bash
npm init -y
```

**File**: `package.json`

**Content**:

```json
{
  "name": "@oxog/tui",
  "version": "1.0.0",
  "description": "Build beautiful terminal interfaces with TypeScript",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./plugins": {
      "import": {
        "types": "./dist/plugins/index.d.ts",
        "default": "./dist/plugins/index.js"
      },
      "require": {
        "types": "./dist/plugins/index.d.cts",
        "default": "./dist/plugins/index.cjs"
      }
    }
  },
  "files": ["dist", "README.md", "LICENSE", "llms.txt"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
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
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/tui.git"
  },
  "homepage": "https://tui.oxog.dev",
  "bugs": {
    "url": "https://github.com/ersinkoc/tui/issues"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@oxog/types": "^1.0.0",
    "@oxog/emitter": "^1.0.0",
    "@oxog/plugin": "^1.0.0",
    "@oxog/pigment": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "tsup": "^8.3.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.4.0",
    "eslint": "^9.17.0"
  }
}
```

**Status**: `[ ]`

---

### Task 2: Create tsconfig.json

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "examples", "website"]
}
```

**Status**: `[ ]`

---

### Task 3: Create tsup.config.ts

**File**: `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  external: ['@oxog/types', '@oxog/emitter', '@oxog/plugin', '@oxog/pigment']
})
```

**Status**: `[ ]`

---

### Task 4: Create vitest.config.ts

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  }
})
```

**Status**: `[ ]`

---

### Task 5: Create .gitignore

**File**: `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/

# Test coverage
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local

# Temporary
tmp/
temp/
```

**Status**: `[ ]`

---

### Task 6: Create .prettierrc

**File**: `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

**Status**: `[ ]`

---

### Task 7: Create LICENSE

**File**: `LICENSE`

```
MIT License

Copyright (c) 2026 Ersin Koç

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Status**: `[ ]`

---

### Task 8: Create directory structure

**Command**:

```bash
mkdir -p src/{core,widgets,plugins/{core,optional},utils}
mkdir -p tests/{unit/{core,widgets,plugins,utils},integration,fixtures}
mkdir -p examples/{01-basic,02-widgets,03-plugins,04-layouts,05-themes,06-real-world}
```

**Status**: `[ ]`

---

## Phase 2: Core Types and Utilities (Tasks 9-19)

### Task 9: Create src/types.ts

**File**: `src/types.ts`

Core type definitions.

**Exports**:

- `Dimension`
- `Color`
- `NamedColor`
- `BorderStyle`
- `FlexDirection`
- `JustifyContent`
- `AlignItems`
- `AlignSelf`
- `TextAlign`
- `Spacing`
- `ResolvedSpacing`
- `Bounds`
- `Cell`
- `CellStyle`
- `KeyEvent`
- `MouseEvent`
- `TUIOptions`
- `TUIEvents`
- `Theme`
- `ThemeColors`
- `ThemeBorders`
- `ThemeSpacing`

**Status**: `[ ]`

---

### Task 10: Create src/errors.ts

**File**: `src/errors.ts`

Error classes.

**Exports**:

- `TUIError`
- `PluginError`
- `LayoutError`
- `RenderError`
- `ValidationError`
- `TUIErrorCode`

**Status**: `[ ]`

---

### Task 11: Create src/constants.ts

**File**: `src/constants.ts`

Package constants.

**Exports**:

- `ATTR_BOLD`
- `ATTR_ITALIC`
- `ATTR_UNDERLINE`
- `ATTR_DIM`
- `ATTR_STRIKETHROUGH`
- `ATTR_INVERSE`
- `DEFAULT_FPS`
- `DEFAULT_THEME`

**Status**: `[ ]`

---

### Task 12: Create src/utils/ansi.ts

**File**: `src/utils/ansi.ts`

ANSI escape sequences.

**Exports**:

- `ANSI` object with all sequences
- `cursorTo(x, y)`
- `cursorHide()`
- `cursorShow()`
- `clearScreen()`
- `alternateScreen()`
- `mainScreen()`
- `fgRgb(r, g, b)`
- `bgRgb(r, g, b)`
- `reset()`
- `mouseOn()`
- `mouseOff()`

**Status**: `[ ]`

---

### Task 13: Create src/utils/color.ts

**File**: `src/utils/color.ts`

Color utilities.

**Exports**:

- `packColor(r, g, b, a)`
- `unpackColor(packed)`
- `parseColor(value)`
- `parseHexColor(hex)`
- `parseRgbColor(rgb)`
- `namedColors`
- `colorToAnsi(packed, isBg)`

**Status**: `[ ]`

---

### Task 14: Create src/utils/unicode.ts

**File**: `src/utils/unicode.ts`

Unicode width handling.

**Exports**:

- `getCharWidth(char)`
- `stringWidth(str)`
- `truncateToWidth(str, maxWidth)`
- `padToWidth(str, width, align)`

**Status**: `[ ]`

---

### Task 15: Create src/utils/border.ts

**File**: `src/utils/border.ts`

Border characters.

**Exports**:

- `BORDER_CHARS`
- `getBorderChars(style)`
- `BorderChars` type

**Status**: `[ ]`

---

### Task 16: Create src/utils/keys.ts

**File**: `src/utils/keys.ts`

Key parsing.

**Exports**:

- `createKeyParser()`
- `KeyParser` type
- `parseKeyAt(str, start)`
- `controlCharName(code)`

**Status**: `[ ]`

---

### Task 17: Create src/utils/index.ts

**File**: `src/utils/index.ts`

Re-export all utilities.

**Status**: `[ ]`

---

### Task 18: Create tests/fixtures/mock-stream.ts

**File**: `tests/fixtures/mock-stream.ts`

Mock stdin/stdout for testing.

**Exports**:

- `MockWriteStream`
- `MockReadStream`

**Status**: `[ ]`

---

### Task 19: Create tests/fixtures/test-utils.ts

**File**: `tests/fixtures/test-utils.ts`

Test helpers.

**Exports**:

- `createTestApp(options)`
- `getRenderedOutput(stdout)`
- `pressKey(stdin, key)`
- `pressKeys(stdin, keys)`
- `waitForRender(app)`

**Status**: `[ ]`

---

## Phase 3: Core Systems (Tasks 20-27)

### Task 20: Create src/core/buffer.ts

**File**: `src/core/buffer.ts`

Cell buffer management.

**Exports**:

- `createBuffer(width, height)`
- `Buffer` interface
- `cloneBuffer(buffer)`

**Status**: `[ ]`

---

### Task 21: Create src/core/renderer.ts

**File**: `src/core/renderer.ts`

ANSI rendering engine.

**Exports**:

- `createRenderer(stdout)`
- `Renderer` interface

**Status**: `[ ]`

---

### Task 22: Create src/core/layout.ts

**File**: `src/core/layout.ts`

Layout engine.

**Exports**:

- `createLayoutEngine()`
- `LayoutEngine` interface
- `resolveDimension(dim, available)`
- `resolvePadding(padding)`

**Status**: `[ ]`

---

### Task 23: Create src/core/style.ts

**File**: `src/core/style.ts`

Style resolution.

**Exports**:

- `createStyleResolver(theme)`
- `StyleResolver` interface
- `resolveStyle(node, theme)`
- `computeAttrs(style)`

**Status**: `[ ]`

---

### Task 24: Create src/core/screen.ts

**File**: `src/core/screen.ts`

Terminal screen management.

**Exports**:

- `createScreen(stdin, stdout)`
- `Screen` interface

**Status**: `[ ]`

---

### Task 25: Create src/core/index.ts

**File**: `src/core/index.ts`

Re-export core modules.

**Status**: `[ ]`

---

### Task 26: Create src/kernel.ts

**File**: `src/kernel.ts`

Micro-kernel wrapper.

**Exports**:

- `createTUIKernel(options)`
- `TUIKernel` interface
- `TUIContext` interface

**Status**: `[ ]`

---

### Task 27: Write tests for core systems

**Files**:

- `tests/unit/core/buffer.test.ts`
- `tests/unit/core/renderer.test.ts`
- `tests/unit/core/layout.test.ts`
- `tests/unit/core/style.test.ts`
- `tests/unit/core/screen.test.ts`
- `tests/unit/utils/ansi.test.ts`
- `tests/unit/utils/color.test.ts`
- `tests/unit/utils/unicode.test.ts`
- `tests/unit/utils/border.test.ts`
- `tests/unit/utils/keys.test.ts`

**Status**: `[ ]`

---

## Phase 4: Node System (Tasks 28-32)

### Task 28: Create src/widgets/node.ts

**File**: `src/widgets/node.ts`

Base node classes.

**Exports**:

- `BaseNode` abstract class
- `ContainerNode` abstract class
- `LeafNode` abstract class
- `Node` interface
- `generateId()`
- `resetIdCounter()` (for tests)

**Status**: `[ ]`

---

### Task 29: Create src/widgets/box.ts

**File**: `src/widgets/box.ts`

Box container widget.

**Exports**:

- `box(props?)`
- `BoxProps` interface
- `BoxNode` interface

**Status**: `[ ]`

---

### Task 30: Create src/widgets/text.ts

**File**: `src/widgets/text.ts`

Text display widget.

**Exports**:

- `text(content?)`
- `TextProps` interface
- `TextNode` interface

**Status**: `[ ]`

---

### Task 31: Write tests for node system

**Files**:

- `tests/unit/widgets/node.test.ts`
- `tests/unit/widgets/box.test.ts`
- `tests/unit/widgets/text.test.ts`

**Status**: `[ ]`

---

### Task 32: Create src/widgets/index.ts

**File**: `src/widgets/index.ts`

Re-export widgets (box, text for now).

**Status**: `[ ]`

---

## Phase 5: Interactive Widgets (Tasks 33-44)

### Task 33: Create src/widgets/input.ts

**File**: `src/widgets/input.ts`

Single-line text input.

**Exports**:

- `input(props?)`
- `InputProps` interface
- `InputNode` interface

**Status**: `[ ]`

---

### Task 34: Create src/widgets/textarea.ts

**File**: `src/widgets/textarea.ts`

Multi-line text input.

**Exports**:

- `textarea(props?)`
- `TextareaProps` interface
- `TextareaNode` interface

**Status**: `[ ]`

---

### Task 35: Create src/widgets/select.ts

**File**: `src/widgets/select.ts`

Selection list.

**Exports**:

- `select(props?)`
- `SelectProps` interface
- `SelectNode` interface
- `SelectOption` interface

**Status**: `[ ]`

---

### Task 36: Create src/widgets/checkbox.ts

**File**: `src/widgets/checkbox.ts`

Toggle checkbox.

**Exports**:

- `checkbox(props?)`
- `CheckboxProps` interface
- `CheckboxNode` interface

**Status**: `[ ]`

---

### Task 37: Create src/widgets/progress.ts

**File**: `src/widgets/progress.ts`

Progress bar.

**Exports**:

- `progress(props?)`
- `ProgressProps` interface
- `ProgressNode` interface

**Status**: `[ ]`

---

### Task 38: Create src/widgets/spinner.ts

**File**: `src/widgets/spinner.ts`

Loading spinner.

**Exports**:

- `spinner(props?)`
- `SpinnerProps` interface
- `SpinnerNode` interface

**Status**: `[ ]`

---

### Task 39: Create src/widgets/table.ts

**File**: `src/widgets/table.ts`

Data table.

**Exports**:

- `table(props?)`
- `TableProps` interface
- `TableNode` interface
- `TableColumn` interface

**Status**: `[ ]`

---

### Task 40: Create src/widgets/tree.ts

**File**: `src/widgets/tree.ts`

Tree view.

**Exports**:

- `tree(props?)`
- `TreeProps` interface
- `TreeWidgetNode` interface
- `TreeNode` interface

**Status**: `[ ]`

---

### Task 41: Create src/widgets/tabs.ts

**File**: `src/widgets/tabs.ts`

Tab navigation.

**Exports**:

- `tabs(props?)`
- `TabsProps` interface
- `TabsNode` interface
- `TabItem` interface

**Status**: `[ ]`

---

### Task 42: Update src/widgets/index.ts

Add all widgets to exports.

**Status**: `[ ]`

---

### Task 43: Write tests for interactive widgets

**Files**:

- `tests/unit/widgets/input.test.ts`
- `tests/unit/widgets/textarea.test.ts`
- `tests/unit/widgets/select.test.ts`
- `tests/unit/widgets/checkbox.test.ts`
- `tests/unit/widgets/progress.test.ts`
- `tests/unit/widgets/spinner.test.ts`
- `tests/unit/widgets/table.test.ts`
- `tests/unit/widgets/tree.test.ts`
- `tests/unit/widgets/tabs.test.ts`

**Status**: `[ ]`

---

### Task 44: Write integration tests for widgets

**File**: `tests/integration/widgets.test.ts`

Test widget interactions.

**Status**: `[ ]`

---

## Phase 6: Core Plugins (Tasks 45-51)

### Task 45: Create src/plugins/core/renderer.ts

**File**: `src/plugins/core/renderer.ts`

Renderer plugin (always loaded).

**Exports**:

- `rendererPlugin(config?)`

**Status**: `[ ]`

---

### Task 46: Create src/plugins/core/layout.ts

**File**: `src/plugins/core/layout.ts`

Layout plugin (always loaded).

**Exports**:

- `layoutPlugin(config?)`

**Status**: `[ ]`

---

### Task 47: Create src/plugins/core/style.ts

**File**: `src/plugins/core/style.ts`

Style plugin (always loaded).

**Exports**:

- `stylePlugin(config?)`

**Status**: `[ ]`

---

### Task 48: Create src/plugins/core/index.ts

**File**: `src/plugins/core/index.ts`

Re-export core plugins.

**Status**: `[ ]`

---

### Task 49: Write tests for core plugins

**Files**:

- `tests/unit/plugins/renderer.test.ts`
- `tests/unit/plugins/layout.test.ts`
- `tests/unit/plugins/style.test.ts`

**Status**: `[ ]`

---

### Task 50: Test core plugins integration

**File**: `tests/integration/core-plugins.test.ts`

Test all core plugins working together.

**Status**: `[ ]`

---

### Task 51: Create src/plugins/index.ts

**File**: `src/plugins/index.ts`

Main plugin exports (optional plugins only - core are internal).

**Status**: `[ ]`

---

## Phase 7: Optional Plugins (Tasks 52-63)

### Task 52: Create src/plugins/optional/input.ts

**File**: `src/plugins/optional/input.ts`

Keyboard input plugin.

**Exports**:

- `inputPlugin(config?)`

**Status**: `[ ]`

---

### Task 53: Create src/plugins/optional/mouse.ts

**File**: `src/plugins/optional/mouse.ts`

Mouse event plugin.

**Exports**:

- `mousePlugin(config?)`

**Status**: `[ ]`

---

### Task 54: Create src/plugins/optional/focus.ts

**File**: `src/plugins/optional/focus.ts`

Focus management plugin.

**Exports**:

- `focusPlugin(config?)`

**Status**: `[ ]`

---

### Task 55: Create src/plugins/optional/animation.ts

**File**: `src/plugins/optional/animation.ts`

Animation plugin.

**Exports**:

- `animationPlugin(config?)`
- `EasingFunction` type

**Status**: `[ ]`

---

### Task 56: Create src/plugins/optional/scroll.ts

**File**: `src/plugins/optional/scroll.ts`

Scroll plugin.

**Exports**:

- `scrollPlugin(config?)`

**Status**: `[ ]`

---

### Task 57: Create src/plugins/optional/clipboard.ts

**File**: `src/plugins/optional/clipboard.ts`

Clipboard plugin.

**Exports**:

- `clipboardPlugin(config?)`

**Status**: `[ ]`

---

### Task 58: Create src/plugins/optional/screen.ts

**File**: `src/plugins/optional/screen.ts`

Screen management plugin.

**Exports**:

- `screenPlugin(config?)`

**Status**: `[ ]`

---

### Task 59: Create src/plugins/optional/index.ts

**File**: `src/plugins/optional/index.ts`

Re-export optional plugins.

**Status**: `[ ]`

---

### Task 60: Update src/plugins/index.ts

Add optional plugins to exports.

**Status**: `[ ]`

---

### Task 61: Write tests for optional plugins

**Files**:

- `tests/unit/plugins/input.test.ts`
- `tests/unit/plugins/mouse.test.ts`
- `tests/unit/plugins/focus.test.ts`
- `tests/unit/plugins/animation.test.ts`
- `tests/unit/plugins/scroll.test.ts`
- `tests/unit/plugins/clipboard.test.ts`
- `tests/unit/plugins/screen.test.ts`

**Status**: `[ ]`

---

### Task 62: Test optional plugins integration

**File**: `tests/integration/optional-plugins.test.ts`

Test plugin interactions.

**Status**: `[ ]`

---

### Task 63: Test full plugin stack

**File**: `tests/integration/full-stack.test.ts`

Test all plugins working together.

**Status**: `[ ]`

---

## Phase 8: TUI App (Tasks 64-70)

### Task 64: Create src/theme.ts

**File**: `src/theme.ts`

Theme utilities.

**Exports**:

- `createTheme(overrides)`
- `mergeThemes(base, overrides)`
- `defaultTheme`

**Status**: `[ ]`

---

### Task 65: Create src/tui.ts

**File**: `src/tui.ts`

Main TUI app factory.

**Exports**:

- `tui(options?)`
- `TUIApp` interface

**Status**: `[ ]`

---

### Task 66: Create src/index.ts

**File**: `src/index.ts`

Main entry point, re-export everything.

**Status**: `[ ]`

---

### Task 67: Write tests for TUI app

**Files**:

- `tests/unit/theme.test.ts`
- `tests/unit/tui.test.ts`

**Status**: `[ ]`

---

### Task 68: Write app lifecycle tests

**File**: `tests/integration/app-lifecycle.test.ts`

Test start, stop, mount, unmount.

**Status**: `[ ]`

---

### Task 69: Write rendering tests

**File**: `tests/integration/rendering.test.ts`

Test full rendering pipeline.

**Status**: `[ ]`

---

### Task 70: Write event tests

**File**: `tests/integration/events.test.ts`

Test event flow through system.

**Status**: `[ ]`

---

## Phase 9: Examples (Tasks 71-79)

### Task 71: Create examples/01-basic/minimal.ts

Minimal TUI app.

**Status**: `[ ]`

---

### Task 72: Create examples/01-basic/hello-world.ts

Hello world example.

**Status**: `[ ]`

---

### Task 73: Create examples/02-widgets/box-layouts.ts

Box layout examples.

**Status**: `[ ]`

---

### Task 74: Create examples/02-widgets/text-styles.ts

Text styling examples.

**Status**: `[ ]`

---

### Task 75: Create examples/02-widgets/input-form.ts

Input form example.

**Status**: `[ ]`

---

### Task 76: Create examples/03-plugins/keyboard-input.ts

Keyboard handling example.

**Status**: `[ ]`

---

### Task 77: Create examples/04-layouts/flexbox-row.ts

Row layout example.

**Status**: `[ ]`

---

### Task 78: Create examples/05-themes/custom-theme.ts

Custom theme example.

**Status**: `[ ]`

---

### Task 79: Create examples/06-real-world/todo-app/index.ts

Full todo app example.

**Status**: `[ ]`

---

## Phase 10: Documentation (Tasks 80-85)

### Task 80: Create README.md

Comprehensive README with examples.

**Status**: `[ ]`

---

### Task 81: Create llms.txt

LLM-friendly documentation (< 2000 tokens).

**Status**: `[ ]`

---

### Task 82: Create CHANGELOG.md

Initial changelog.

**Status**: `[ ]`

---

### Task 83: Add JSDoc to all public APIs

Ensure all exports have complete JSDoc with @example.

**Status**: `[ ]`

---

### Task 84: Create example README files

**Files**:

- `examples/01-basic/README.md`
- `examples/02-widgets/README.md`
- `examples/03-plugins/README.md`
- `examples/04-layouts/README.md`
- `examples/05-themes/README.md`
- `examples/06-real-world/README.md`

**Status**: `[ ]`

---

### Task 85: Verify all JSDoc renders correctly

Run TypeScript and check generated `.d.ts` files.

**Status**: `[ ]`

---

## Phase 11: Finalization (Tasks 86-89)

### Task 86: Run full test suite

```bash
npm run test:coverage
```

Ensure 100% coverage.

**Status**: `[ ]`

---

### Task 87: Run build

```bash
npm run build
```

Verify build succeeds.

**Status**: `[ ]`

---

### Task 88: Test package locally

```bash
npm pack
# In test project:
npm install ../tui/oxog-tui-1.0.0.tgz
```

**Status**: `[ ]`

---

### Task 89: Final review

- [ ] All tests pass
- [ ] 100% coverage
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Package installs correctly
- [ ] Examples run
- [ ] README is complete
- [ ] llms.txt is under 2000 tokens
- [ ] JSDoc on all public APIs

**Status**: `[ ]`

---

## Summary

| Phase | Tasks | Description              |
| ----- | ----- | ------------------------ |
| 1     | 1-8   | Project Setup            |
| 2     | 9-19  | Core Types and Utilities |
| 3     | 20-27 | Core Systems             |
| 4     | 28-32 | Node System              |
| 5     | 33-44 | Interactive Widgets      |
| 6     | 45-51 | Core Plugins             |
| 7     | 52-63 | Optional Plugins         |
| 8     | 64-70 | TUI App                  |
| 9     | 71-79 | Examples                 |
| 10    | 80-85 | Documentation            |
| 11    | 86-89 | Finalization             |

**Total**: 89 tasks

---

## Dependencies Between Tasks

```
Task 1-8 (Setup)
    ↓
Task 9-11 (Types, Errors, Constants)
    ↓
Task 12-17 (Utilities) ←────────────┐
    ↓                               │
Task 20-26 (Core Systems) ←─────────┤
    ↓                               │
Task 28-32 (Node System) ←──────────┤
    ↓                               │
Task 33-44 (Widgets) ←──────────────┤
    ↓                               │
Task 45-51 (Core Plugins) ←─────────┤
    ↓                               │
Task 52-63 (Optional Plugins) ←─────┤
    ↓                               │
Task 64-70 (TUI App) ←──────────────┘
    ↓
Task 71-79 (Examples)
    ↓
Task 80-85 (Documentation)
    ↓
Task 86-89 (Finalization)
```

---

_Implementation should follow task order strictly._
