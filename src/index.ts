/**
 * @oxog/tui - Terminal User Interface Framework
 * @packageDocumentation
 *
 * A zero-external-dependency, micro-kernel TUI framework for Node.js.
 */

// ============================================================
// Kernel - Application Factory
// ============================================================

export { tui, createApp } from './kernel'

// ============================================================
// Types
// ============================================================

export type {
  // Core types
  TUIApp,
  TUIOptions,
  Plugin,
  Node,
  Theme,
  ThemeColors,

  // Layout types
  Bounds,
  Dimension,
  FlexDirection,
  FlexAlign,
  FlexJustify,
  Spacing,
  LayoutProps,
  JustifyContent,
  AlignItems,

  // Style types
  Color,
  Cell,
  CellStyle,
  StyleProps,
  BorderStyle,

  // Event types
  KeyEvent,
  MouseEvent,

  // Buffer type
  Buffer,

  // Widget data types
  SelectItem,
  SelectOption,
  TableColumn,
  TreeItem,
  TreeNodeData,
  TabItem
} from './types'

// ============================================================
// Widgets
// ============================================================

// Base node (for advanced use)
export { BaseNode, ContainerNode, LeafNode, generateNodeId } from './widgets'

// Widget factories
export { box } from './widgets'
export type { BoxProps, BoxNode } from './widgets'

export { text } from './widgets'
export type { TextProps, TextNode } from './widgets'

export { input } from './widgets'
export type { InputProps, InputNode } from './widgets'

export { select } from './widgets'
export type { SelectProps, SelectNode } from './widgets'

export { checkbox } from './widgets'
export type { CheckboxProps, CheckboxNode } from './widgets'

export { progress } from './widgets'
export type { ProgressProps, ProgressNode } from './widgets'

export { spinner } from './widgets'
export type { SpinnerProps, SpinnerNode, SpinnerStyle } from './widgets'

export { textarea } from './widgets'
export type { TextareaProps, TextareaNode } from './widgets'

export { table } from './widgets'
export type { TableProps, TableNode } from './widgets'

export { tree } from './widgets'
export type { TreeProps, TreeNode } from './widgets'

export { tabs } from './widgets'
export type { TabsProps, TabsNode } from './widgets'

// Modal & Dialog
export { modal, alertDialog, confirmDialog, inputDialog } from './widgets'
export type { ModalProps, ModalNode, ModalButton } from './widgets'

// SplitPane
export { splitpane } from './widgets'
export type { SplitPaneProps, SplitPaneNode } from './widgets'

// ContextMenu
export { contextmenu } from './widgets'
export type { ContextMenuProps, ContextMenuNode, MenuItem } from './widgets'

// CommandPalette
export { commandpalette } from './widgets'
export type { CommandPaletteProps, CommandPaletteNode, CommandItem } from './widgets'

// Toast/Notification
export { toast } from './widgets'
export type { ToastProps, ToastNode, ToastMessage, ToastType, ToastPosition } from './widgets'

// Button
export { button } from './widgets'
export type { ButtonProps, ButtonNode, ButtonVariant, ButtonSize } from './widgets'

// List with virtual scroll
export { list } from './widgets'
export type { ListProps, ListNode, ListItem } from './widgets'

// Scrollbar
export { scrollbar } from './widgets'
export type { ScrollbarProps, ScrollbarNode, ScrollbarOrientation } from './widgets'

// Grid layout
export { grid } from './widgets'
export type { GridProps, GridNode, GridCell, GridTemplate } from './widgets'

// Slider/Range
export { slider } from './widgets'
export type { SliderProps, SliderNode } from './widgets'

// Calendar/DatePicker
export { calendar } from './widgets'
export type { CalendarProps, CalendarNode } from './widgets'

// Accordion
export { accordion } from './widgets'
export type { AccordionProps, AccordionNode, AccordionPanel } from './widgets'

// Charts
export { barchart, sparkline, gauge } from './widgets'
export type {
  BarChartProps,
  BarChartNode,
  BarChartDataPoint,
  SparklineProps,
  SparklineNode,
  GaugeProps,
  GaugeNode
} from './widgets'

// Wizard/Stepper
export { wizard } from './widgets'
export type { WizardProps, WizardNode, WizardStep, WizardStepStatus } from './widgets'

// Form with validation
export { form } from './widgets'
export type {
  FormProps,
  FormNode,
  FormField,
  FormState,
  FieldState,
  ValidationResult,
  Validator,
  ValidatorConfig,
  BuiltinValidator
} from './widgets'

// File Browser
export { filebrowser } from './widgets'
export type {
  FileBrowserProps,
  FileBrowserNode,
  FileEntry,
  FileSortBy,
  FileSortOrder
} from './widgets'

// Menubar
export { menubar } from './widgets'
export type { MenubarProps, MenubarNode, MenubarMenu, MenubarItem } from './widgets'

// Statusbar
export { statusbar } from './widgets'
export type { StatusbarProps, StatusbarNode, StatusItem, StatusItemAlign } from './widgets'

// Breadcrumb
export { breadcrumb } from './widgets'
export type { BreadcrumbProps, BreadcrumbNode, BreadcrumbItem } from './widgets'

// Panel
export { panel } from './widgets'
export type { PanelProps, PanelNode, PanelAction, PanelTitleAlign } from './widgets'

// Badge/Tag
export { badge, tag } from './widgets'
export type { BadgeProps, BadgeNode, BadgeVariant, BadgeSize, BadgeShape } from './widgets'

// Tooltip
export { tooltip } from './widgets'
export type { TooltipProps, TooltipNode, TooltipPosition } from './widgets'

// Drawer/Sidebar
export { drawer } from './widgets'
export type { DrawerProps, DrawerNode, DrawerItem, DrawerPosition } from './widgets'

// DataGrid (advanced table)
export { datagrid } from './widgets'
export type { DataGridProps, DataGridNode, DataGridColumn, SortDirection, ColumnAlign } from './widgets'

// Timeline
export { timeline } from './widgets'
export type { TimelineProps, TimelineNode, TimelineItem, TimelineStatus, TimelineOrientation } from './widgets'

// CodeViewer
export { codeviewer } from './widgets'
export type { CodeViewerProps, CodeViewerNode, CodeLanguage, LineHighlight } from './widgets'

// Pagination
export { pagination } from './widgets'
export type { PaginationProps, PaginationNode, PaginationStyle, PageInfo } from './widgets'

// SearchInput
export { searchinput } from './widgets'
export type { SearchInputProps, SearchInputNode, SearchSuggestion } from './widgets'

// DiffViewer
export { diffviewer } from './widgets'
export type { DiffViewerProps, DiffViewerNode, DiffMode, DiffLineType, DiffLine, DiffHunk } from './widgets'

// LogViewer
export { logviewer } from './widgets'
export type { LogViewerProps, LogViewerNode, LogLevel, LogEntry } from './widgets'

// Image (ASCII art)
export { image } from './widgets'
export type { ImageProps, ImageNode, ImageData, Pixel, AsciiCharset, DitherAlgorithm, ScaleMode } from './widgets'

// MarkdownViewer
export { markdownviewer } from './widgets'
export type { MarkdownViewerProps, MarkdownViewerNode } from './widgets'

// JSONViewer
export { jsonviewer } from './widgets'
export type { JsonViewerProps, JsonViewerNode, JsonViewerColors } from './widgets'

// ColorPicker
export { colorpicker } from './widgets'
export type { ColorPickerProps, ColorPickerNode, ColorPickerMode, RgbColor } from './widgets'

// Heatmap
export { heatmap } from './widgets'
export type { HeatmapProps, HeatmapNode, HeatmapColorScale } from './widgets'

// Kanban
export { kanban } from './widgets'
export type { KanbanProps, KanbanNode, KanbanColumn, KanbanCard } from './widgets'

// Terminal
export { terminal } from './widgets'
export type { TerminalProps, TerminalNode, TerminalLine } from './widgets'

// Stopwatch
export { stopwatch } from './widgets'
export type { StopwatchProps, StopwatchNode, StopwatchMode, LapTime } from './widgets'

// ============================================================
// Theme System
// ============================================================

export {
  // Theme manager
  themeManager,
  ThemeManager,
  getCurrentTheme,
  setTheme,
  createTheme,
  onThemeChange,

  // Built-in themes
  defaultTheme,
  lightTheme,
  draculaTheme,
  nordTheme,
  monokaiTheme,
  gruvboxTheme,
  solarizedDarkTheme,
  tokyoNightTheme,
  catppuccinMochaTheme,
  themes,

  // Utilities
  themedStyle,
  getComponentTheme
} from './theme'

export type {
  ThemeColor,
  ThemeComponents,
  PartialTheme,
  ThemeChangeListener
} from './theme'

// ============================================================
// Core Systems
// ============================================================

export {
  // Buffer operations
  createBuffer,
  createEmptyCell,
  cloneBuffer,
  cellsEqual,
  copyRegion,
  fillBuffer,
  drawHLine,
  drawVLine,
  drawRect,

  // Renderer
  createRenderer,
  createBatchedRenderer,
  createStringRenderer,
  createRenderLoop,

  // Layout
  createLayoutEngine,
  resolveDimension,
  applyConstraints,
  resolvePadding,
  resolveMargin,
  measureContent,
  boundsIntersect,
  pointInBounds,
  boundsIntersection,

  // Style
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
  EMPTY_STYLE_PROPS,

  // Screen
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
} from './core'

export type { RenderLoop } from './core'

// ============================================================
// Utilities
// ============================================================

export {
  // ANSI escape sequences
  cursorTo,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorColumn,
  cursorPosition,
  saveCursor,
  restoreCursor,
  hideCursor,
  showCursor,
  clearScreen,
  clearLine,
  clearToEndOfLine,
  clearToEndOfScreen,
  scrollUp,
  scrollDown,
  enterAltScreen,
  exitAltScreen,
  enableMouse,
  disableMouse,
  enableBracketedPaste,
  disableBracketedPaste,
  setTitle as setTerminalTitle,
  bell as terminalBell,
  fgRgb,
  bgRgb,
  fgReset,
  bgReset,
  boldOn,
  italicOn,
  underlineOn,
  dimOn,
  inverseOn,
  allOff,
  packedToFgAnsi,
  packedToBgAnsi,
  attrsToAnsi,

  // Color utilities
  packColor,
  unpackColor,
  parseColor,
  parseHexColor,
  parseRgbColor,
  colorToHex,
  parseColorWithDefault,
  blendColors,
  DEFAULT_FG,
  DEFAULT_BG,

  // Unicode utilities
  getCharWidth,
  stringWidth,
  truncateToWidth,
  padEnd,
  padStart,
  padCenter,
  wrapText,
  isEmoji,
  isCJK,
  isFullWidth,
  stripAnsi,

  // Border utilities
  getBorderChars,
  drawBorder,
  borderStyles,

  // Key utilities
  createKeyParser,
  createMouseParser,
  matchKey,
  parseKeyPattern
} from './utils'

export type { KeyParser, MouseParser, ParsedKeyPattern, BorderChars } from './utils'

// ============================================================
// Errors
// ============================================================

export { TUIError, PluginError, LayoutError, RenderError, ValidationError } from './errors'

// ============================================================
// Constants
// ============================================================

export {
  // Attribute flags
  ATTR_BOLD,
  ATTR_ITALIC,
  ATTR_UNDERLINE,
  ATTR_DIM,
  ATTR_INVERSE,
  ATTR_STRIKETHROUGH,

  // Border characters
  BORDER_CHARS,

  // Named colors
  NAMED_COLORS,

  // Default theme
  DEFAULT_THEME,

  // Key names
  CONTROL_CHAR_NAMES,
  CSI_KEY_NAMES
} from './constants'
