/**
 * @oxog/tui - Widgets
 * @packageDocumentation
 */

// Base node system
export { BaseNode, ContainerNode, LeafNode, generateId, generateId as generateNodeId } from './node'

// Box container
export { box } from './box'
export type { BoxProps, BoxNode } from './box'

// Text display
export { text } from './text'
export type { TextProps, TextNode } from './text'

// Input field
export { input } from './input'
export type { InputProps, InputNode } from './input'

// Select list
export { select } from './select'
export type { SelectProps, SelectNode } from './select'

// Checkbox toggle
export { checkbox } from './checkbox'
export type { CheckboxProps, CheckboxNode } from './checkbox'

// Progress bar
export { progress } from './progress'
export type { ProgressProps, ProgressNode } from './progress'

// Spinner
export { spinner, spinners } from './spinner'
export type { SpinnerProps, SpinnerNode } from './spinner'

// Re-export spinners as SpinnerStyle type
export type SpinnerStyle = keyof typeof import('./spinner').spinners

// Textarea
export { textarea } from './textarea'
export type { TextareaProps, TextareaNode } from './textarea'

// Table
export { table } from './table'
export type { TableProps, TableNode } from './table'

// Tree
export { tree } from './tree'
export type { TreeProps, TreeWidgetNode, TreeWidgetNode as TreeNode } from './tree'

// Tabs
export { tabs } from './tabs'
export type { TabsProps, TabsNode } from './tabs'

// Modal/Dialog
export { modal, alertDialog, confirmDialog, inputDialog } from './modal'
export type { ModalProps, ModalNode, ModalButton } from './modal'

// SplitPane
export { splitpane } from './splitpane'
export type { SplitPaneProps, SplitPaneNode } from './splitpane'

// ContextMenu
export { contextmenu } from './contextmenu'
export type { ContextMenuProps, ContextMenuNode, MenuItem } from './contextmenu'

// CommandPalette
export { commandpalette } from './commandpalette'
export type { CommandPaletteProps, CommandPaletteNode, CommandItem } from './commandpalette'

// Toast/Notification
export { toast } from './toast'
export type { ToastProps, ToastNode, ToastMessage, ToastType, ToastPosition } from './toast'

// Button
export { button } from './button'
export type { ButtonProps, ButtonNode, ButtonVariant, ButtonSize } from './button'

// List with virtual scroll
export { list } from './list'
export type { ListProps, ListNode, ListItem } from './list'

// Scrollbar
export { scrollbar } from './scrollbar'
export type { ScrollbarProps, ScrollbarNode, ScrollbarOrientation } from './scrollbar'

// Grid layout
export { grid } from './grid'
export type { GridProps, GridNode, GridCell, GridTemplate } from './grid'

// Slider/Range
export { slider } from './slider'
export type { SliderProps, SliderNode } from './slider'

// Calendar/DatePicker
export { calendar } from './calendar'
export type { CalendarProps, CalendarNode } from './calendar'

// Accordion
export { accordion } from './accordion'
export type { AccordionProps, AccordionNode, AccordionPanel } from './accordion'

// Charts (Bar, Sparkline, Gauge)
export { barchart, sparkline, gauge } from './chart'
export type {
  BarChartProps,
  BarChartNode,
  BarChartDataPoint,
  SparklineProps,
  SparklineNode,
  GaugeProps,
  GaugeNode
} from './chart'

// Wizard/Stepper
export { wizard } from './wizard'
export type { WizardProps, WizardNode, WizardStep, WizardStepStatus } from './wizard'

// Form with validation
export { form } from './form'
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
} from './form'

// File Browser
export { filebrowser } from './filebrowser'
export type {
  FileBrowserProps,
  FileBrowserNode,
  FileEntry,
  FileSortBy,
  FileSortOrder
} from './filebrowser'

// Menubar
export { menubar } from './menubar'
export type {
  MenubarProps,
  MenubarNode,
  MenubarMenu,
  MenubarItem
} from './menubar'

// Statusbar
export { statusbar } from './statusbar'
export type {
  StatusbarProps,
  StatusbarNode,
  StatusItem,
  StatusItemAlign
} from './statusbar'

// Breadcrumb
export { breadcrumb } from './breadcrumb'
export type {
  BreadcrumbProps,
  BreadcrumbNode,
  BreadcrumbItem
} from './breadcrumb'

// Panel
export { panel } from './panel'
export type {
  PanelProps,
  PanelNode,
  PanelAction,
  PanelTitleAlign
} from './panel'

// Badge/Tag
export { badge, tag } from './badge'
export type {
  BadgeProps,
  BadgeNode,
  BadgeVariant,
  BadgeSize,
  BadgeShape
} from './badge'

// Tooltip
export { tooltip } from './tooltip'
export type {
  TooltipProps,
  TooltipNode,
  TooltipPosition
} from './tooltip'

// Drawer/Sidebar
export { drawer } from './drawer'
export type {
  DrawerProps,
  DrawerNode,
  DrawerItem,
  DrawerPosition
} from './drawer'

// DataGrid (advanced table)
export { datagrid } from './datagrid'
export type {
  DataGridProps,
  DataGridNode,
  DataGridColumn,
  SortDirection,
  ColumnAlign
} from './datagrid'

// Timeline
export { timeline } from './timeline'
export type {
  TimelineProps,
  TimelineNode,
  TimelineItem,
  TimelineStatus,
  TimelineOrientation
} from './timeline'

// CodeViewer
export { codeviewer } from './codeviewer'
export type {
  CodeViewerProps,
  CodeViewerNode,
  CodeLanguage,
  LineHighlight
} from './codeviewer'

// Pagination
export { pagination } from './pagination'
export type {
  PaginationProps,
  PaginationNode,
  PaginationStyle,
  PageInfo
} from './pagination'

// SearchInput
export { searchinput } from './searchinput'
export type {
  SearchInputProps,
  SearchInputNode,
  SearchSuggestion
} from './searchinput'

// DiffViewer
export { diffviewer } from './diffviewer'
export type {
  DiffViewerProps,
  DiffViewerNode,
  DiffMode,
  DiffLineType,
  DiffLine,
  DiffHunk
} from './diffviewer'

// LogViewer
export { logviewer } from './logviewer'
export type {
  LogViewerProps,
  LogViewerNode,
  LogLevel,
  LogEntry
} from './logviewer'

// Image (ASCII art)
export { image } from './image'
export type {
  ImageProps,
  ImageNode,
  ImageData,
  Pixel,
  AsciiCharset,
  DitherAlgorithm,
  ScaleMode
} from './image'

// MarkdownViewer
export { markdownviewer } from './markdownviewer'
export type {
  MarkdownViewerProps,
  MarkdownViewerNode
} from './markdownviewer'

// JSONViewer
export { jsonviewer } from './jsonviewer'
export type {
  JsonViewerProps,
  JsonViewerNode,
  JsonViewerColors
} from './jsonviewer'

// ColorPicker
export { colorpicker } from './colorpicker'
export type {
  ColorPickerProps,
  ColorPickerNode,
  ColorPickerMode,
  RgbColor
} from './colorpicker'

// Heatmap
export { heatmap } from './heatmap'
export type {
  HeatmapProps,
  HeatmapNode,
  HeatmapColorScale
} from './heatmap'

// Kanban
export { kanban } from './kanban'
export type {
  KanbanProps,
  KanbanNode,
  KanbanColumn,
  KanbanCard
} from './kanban'

// Terminal
export { terminal } from './terminal'
export type {
  TerminalProps,
  TerminalNode,
  TerminalLine
} from './terminal'

// Stopwatch
export { stopwatch } from './stopwatch'
export type {
  StopwatchProps,
  StopwatchNode,
  StopwatchMode,
  LapTime
} from './stopwatch'

// Help
export { help, helpItems, helpSection, commonHelpItems, vimHelpItems } from './help'
export type {
  HelpProps,
  HelpNode,
  HelpItem,
  HelpSection
} from './help'
