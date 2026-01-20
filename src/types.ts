/**
 * @oxog/tui - Type Definitions
 * @packageDocumentation
 */

// Plugin types are self-contained, no external dependencies needed

// ============================================================
// Dimension Types
// ============================================================

/**
 * Dimension value for width/height.
 * Can be a fixed number, percentage string, or 'auto'.
 *
 * @example
 * ```typescript
 * const fixed: Dimension = 100
 * const percent: Dimension = '50%'
 * const auto: Dimension = 'auto'
 * ```
 */
export type Dimension = number | `${number}%` | 'auto'

// ============================================================
// Color Types
// ============================================================

/**
 * Named color values supported by the terminal.
 */
export type NamedColor =
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
  | 'transparent'

/**
 * Color value.
 * Can be hex (#fff, #ffffff), RGB (rgb(255,255,255)), or named color.
 *
 * @example
 * ```typescript
 * const hex: Color = '#ff0000'
 * const rgb: Color = 'rgb(255, 0, 0)'
 * const named: Color = 'red'
 * ```
 */
export type Color = string | NamedColor

// ============================================================
// Border Types
// ============================================================

/**
 * Border style options.
 *
 * @example
 * ```typescript
 * box({ border: 'rounded' })
 * box({ border: 'single' })
 * ```
 */
export type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'bold' | 'ascii'

/**
 * Border character set.
 */
export interface BorderChars {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horizontal: string
  vertical: string
}

// ============================================================
// Layout Types
// ============================================================

/**
 * Flex direction for container layout.
 */
export type FlexDirection = 'row' | 'column'

/**
 * Main axis alignment for flex children.
 */
export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around'

/**
 * Cross axis alignment for flex children.
 */
export type AlignItems = 'start' | 'center' | 'end' | 'stretch'

/**
 * Individual item cross axis alignment override.
 */
export type AlignSelf = 'auto' | 'start' | 'center' | 'end' | 'stretch'

/**
 * Text alignment within container.
 */
export type TextAlign = 'left' | 'center' | 'right'

/**
 * Spacing value for padding/margin.
 * Can be single number (all sides), tuple of 2 (vertical, horizontal),
 * or tuple of 4 (top, right, bottom, left).
 *
 * @example
 * ```typescript
 * const all: Spacing = 1
 * const vertHoriz: Spacing = [1, 2]
 * const trbl: Spacing = [1, 2, 3, 4]
 * ```
 */
export type Spacing = number | [number, number] | [number, number, number, number]

/**
 * Resolved spacing with all four sides.
 */
export interface ResolvedSpacing {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Computed bounds for a node after layout.
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Layout properties for a node.
 */
export interface LayoutProps {
  width?: Dimension
  height?: Dimension
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  flex?: number
  flexDirection?: FlexDirection
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  alignSelf?: AlignSelf
  gap?: number
  padding?: Spacing
  margin?: Spacing
}

/**
 * Style properties for a node.
 */
export interface StyleProps {
  color?: Color
  bg?: Color
  border?: BorderStyle
  borderColor?: Color
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  strikethrough?: boolean
  inverse?: boolean
}

// ============================================================
// Cell Types
// ============================================================

/**
 * Single cell in render buffer.
 * Colors are packed as 32-bit RGBA integers.
 */
export interface Cell {
  char: string
  fg: number
  bg: number
  attrs: number
}

/**
 * Style for writing to buffer.
 */
export interface CellStyle {
  fg?: number
  bg?: number
  attrs?: number
}

// ============================================================
// Event Types
// ============================================================

/**
 * Keyboard event.
 *
 * @example
 * ```typescript
 * app.on('key', (event) => {
 *   if (event.name === 'q') app.stop()
 *   if (event.ctrl && event.name === 'c') app.stop()
 * })
 * ```
 */
export interface KeyEvent {
  /** Key name: 'a', 'enter', 'up', 'f1', etc. */
  name: string
  /** Raw escape sequence */
  sequence: string
  /** Control key pressed */
  ctrl: boolean
  /** Alt key pressed */
  alt: boolean
  /** Shift key pressed */
  shift: boolean
  /** Meta key pressed */
  meta: boolean
}

/**
 * Mouse event.
 *
 * @example
 * ```typescript
 * app.on('mouse', (event) => {
 *   if (event.action === 'press' && event.button === 'left') {
 *     console.log(`Clicked at ${event.x}, ${event.y}`)
 *   }
 * })
 * ```
 */
export interface MouseEvent {
  /** Column (0-indexed) */
  x: number
  /** Row (0-indexed) */
  y: number
  /** Mouse button */
  button: 'left' | 'right' | 'middle' | 'none'
  /** Event action */
  action: 'press' | 'release' | 'move' | 'scroll'
  /** Scroll direction if action is 'scroll' */
  scroll?: 'up' | 'down'
  /** Control key pressed */
  ctrl: boolean
  /** Alt key pressed */
  alt: boolean
  /** Shift key pressed */
  shift: boolean
}

/**
 * Resize event.
 */
export interface ResizeEvent {
  width: number
  height: number
}

// ============================================================
// Theme Types
// ============================================================

/**
 * Theme color palette.
 */
export interface ThemeColors {
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
  inputBg: Color
  inputBorder: Color
  inputFocusBorder: Color
  selectHighlight: Color
  tableHeaderBg: Color
  tableStripeBg: Color
}

/**
 * Theme border styles.
 */
export interface ThemeBorders {
  default: BorderStyle
  focus: BorderStyle
  input: BorderStyle
}

/**
 * Theme spacing values.
 */
export interface ThemeSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

/**
 * Complete theme definition.
 *
 * @example
 * ```typescript
 * const darkTheme = createTheme({
 *   colors: {
 *     primary: '#00ff88',
 *     background: '#1a1a2e'
 *   }
 * })
 * ```
 */
export interface Theme {
  colors: ThemeColors
  borders: ThemeBorders
  spacing: ThemeSpacing
}

/**
 * Deep partial type for theme overrides.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ============================================================
// Node Types
// ============================================================

/**
 * Base node interface.
 * All widgets implement this interface.
 */
export interface Node {
  /** Unique identifier */
  readonly id: string
  /** Widget type name */
  readonly type: string
  /** Parent node reference */
  readonly parent: Node | null
  /** Child nodes */
  readonly children: readonly Node[]
  /** Visibility */
  readonly isVisible: boolean
  /** Computed bounds after layout */
  readonly bounds: Bounds

  /**
   * Set visibility.
   * @param value - Visible or hidden
   */
  visible(value: boolean): this
}

/**
 * Internal node state (for implementation).
 */
export interface NodeState {
  dirty: boolean
  layoutDirty: boolean
}

// ============================================================
// TUI App Types
// ============================================================

/**
 * TUI application options.
 *
 * @example
 * ```typescript
 * const app = tui({
 *   fps: 30,
 *   fullscreen: true,
 *   mouse: true
 * })
 * ```
 */
export interface TUIOptions {
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
  /** Plugins to install. @default [] */
  plugins?: Plugin[]
  /** Window title. @default undefined */
  title?: string
}

/**
 * TUI application events.
 */
export interface TUIEvents {
  /** Keyboard input event */
  key: (event: KeyEvent) => void
  /** Mouse input event */
  mouse: (event: MouseEvent) => void
  /** Terminal resize event */
  resize: (width: number, height: number) => void
  /** Focus changed event */
  focus: (node: Node) => void
  /** Focus lost event */
  blur: (node: Node) => void
  /** After render event */
  render: () => void
  /** Error event */
  error: (error: Error) => void
}

/**
 * TUI application context.
 * Shared state accessible by plugins.
 */
export interface TUIContext {
  /** Output stream */
  stdout: NodeJS.WriteStream
  /** Input stream */
  stdin: NodeJS.ReadStream
  /** Root node */
  root: Node | null
  /** Focused node */
  focused: Node | null
  /** Current theme */
  theme: Theme
  /** Terminal width */
  width: number
  /** Terminal height */
  height: number
}

/**
 * TUI application interface.
 *
 * @example
 * ```typescript
 * const app = tui({ fps: 30 })
 *   .use(inputPlugin())
 *   .mount(myUI)
 *   .start()
 * ```
 */
export interface TUIApp {
  /**
   * Register a plugin.
   * @param plugin - Plugin to register
   */
  use(plugin: Plugin): this

  /**
   * Mount root node.
   * @param node - Root node to mount
   */
  mount(node: Node): this

  /**
   * Unmount root node.
   */
  unmount(): this

  /**
   * Start render loop.
   */
  start(): this

  /**
   * Stop and cleanup (async).
   */
  quit(): Promise<void>

  /**
   * Force re-render.
   */
  refresh(): this

  /**
   * Mark screen as dirty for re-render.
   */
  markDirty(): void

  /**
   * Subscribe to events.
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): () => void

  /**
   * Unsubscribe from events.
   * @param event - Event name
   * @param handler - Event handler
   */
  off<K extends keyof TUIEvents>(event: K, handler: TUIEvents[K]): void

  /**
   * Emit event.
   * @param event - Event name
   * @param args - Event arguments
   */
  emit<K extends keyof TUIEvents>(event: K, ...args: Parameters<TUIEvents[K]>): void

  /**
   * Register a quit handler.
   * @param handler - Handler to call on quit
   */
  onQuit(handler: () => void | Promise<void>): this

  /**
   * Get a plugin by name.
   * @param name - Plugin name
   */
  getPlugin<T extends Plugin>(name: string): T | undefined

  /** Terminal width */
  readonly width: number

  /** Terminal height */
  readonly height: number

  /** Whether app is running */
  readonly isRunning: boolean

  /** Root node */
  readonly root: Node | null

  /** Focused node */
  readonly focused: Node | null

  /** Current theme */
  readonly theme: Theme
}

// ============================================================
// Plugin Types
// ============================================================

/**
 * TUI plugin interface.
 *
 * @example
 * ```typescript
 * const myPlugin: Plugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(app) {
 *     app.on('render', () => {
 *       // Do something on render
 *     })
 *   }
 * }
 * ```
 */
export interface Plugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin dependencies */
  dependencies?: string[]
  /** Install hook - receives the TUI app instance */
  install(app: TUIApp): void
  /** Called before render */
  beforeRender?(): void
  /** Called to render the root node */
  render?(root: Node): void
  /** Called after render */
  afterRender?(): void
  /** Called when terminal resizes */
  onResize?(width: number, height: number): void
  /** Destroy hook */
  destroy?(): void
}

// ============================================================
// Widget Option Types
// ============================================================

/**
 * Selection option for select widget.
 */
export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

/**
 * Table column definition.
 */
export interface TableColumn<T = unknown> {
  key: string
  header: string
  width?: number | 'auto'
  align?: TextAlign
  render?: (value: T, row: Record<string, unknown>) => string
}

/**
 * Tree node data.
 */
export interface TreeNodeData<T = unknown> {
  label: string
  value?: T
  children?: TreeNodeData<T>[]
  expanded?: boolean
}

/**
 * Tab item definition.
 */
export interface TabItem {
  label: string
  content: Node
  disabled?: boolean
}

// ============================================================
// Kernel Event Types
// ============================================================

/**
 * Kernel events for plugins.
 */
export interface KernelEvents {
  init: () => void
  destroy: () => void
  beforeRender: () => void
  render: () => void
  afterRender: () => void
  beforeLayout: () => void
  layout: () => void
  afterLayout: () => void
  key: (event: KeyEvent) => void
  mouse: (event: MouseEvent) => void
  focus: (node: Node) => void
  blur: (node: Node) => void
  resize: (width: number, height: number) => void
  error: (error: Error) => void
}

// ============================================================
// Buffer Types
// ============================================================

/**
 * Render buffer interface.
 */
export interface Buffer {
  readonly width: number
  readonly height: number
  get(x: number, y: number): Cell | undefined
  set(x: number, y: number, cell: Cell): void
  write(x: number, y: number, text: string, style: CellStyle): void
  fill(x: number, y: number, width: number, height: number, cell: Cell): void
  clear(): void
  resize(width: number, height: number): void
  readonly cells: readonly Cell[]
}

/**
 * Renderer interface.
 */
export interface Renderer {
  render(buffer: Buffer): number
  invalidate(): void
  readonly lastBuffer: Buffer | null
}

/**
 * Layout engine interface.
 */
export interface LayoutEngine {
  compute(root: Node, availableWidth: number, availableHeight: number): void
}

/**
 * Style resolver interface.
 */
export interface StyleResolver {
  resolve(node: Node): CellStyle
}

/**
 * Screen manager interface.
 */
export interface Screen {
  readonly width: number
  readonly height: number
  enterRawMode(): void
  exitRawMode(): void
  enterAlternateScreen(): void
  exitAlternateScreen(): void
  showCursor(): void
  hideCursor(): void
  enableMouse(): void
  disableMouse(): void
  onResize(handler: (width: number, height: number) => void): () => void
}

// ============================================================
// Type Aliases (for API compatibility)
// ============================================================

/**
 * Alias for JustifyContent.
 */
export type FlexJustify = JustifyContent | 'space-between' | 'space-around' | 'space-evenly'

/**
 * Alias for AlignItems.
 */
export type FlexAlign = AlignItems

/**
 * Alias for SelectOption.
 */
export type SelectItem = SelectOption

/**
 * Alias for TreeNodeData.
 */
export type TreeItem<T = unknown> = TreeNodeData<T>
