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
