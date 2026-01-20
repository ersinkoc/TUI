/**
 * @oxog/tui - Plugins
 * @packageDocumentation
 *
 * This module exports all available plugins for the TUI framework.
 *
 * ## Core Plugins
 * These plugins provide essential functionality:
 * - `rendererPlugin` - Differential rendering to terminal
 * - `layoutPlugin` - Flexbox-like layout engine
 * - `stylePlugin` - Theme and style resolution
 *
 * ## Optional Plugins
 * These plugins provide additional features:
 * - `inputPlugin` - Keyboard input handling
 * - `mousePlugin` - Mouse event handling
 * - `focusPlugin` - Focus management
 * - `animationPlugin` - Animation and tweening
 * - `scrollPlugin` - Scrollable content
 * - `clipboardPlugin` - Copy/paste support
 * - `screenPlugin` - Screen management
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import {
 *   rendererPlugin,
 *   layoutPlugin,
 *   stylePlugin,
 *   inputPlugin,
 *   mousePlugin
 * } from '@oxog/tui/plugins'
 *
 * const app = tui({
 *   plugins: [
 *     rendererPlugin(),
 *     layoutPlugin(),
 *     stylePlugin({ theme: darkTheme }),
 *     inputPlugin(),
 *     mousePlugin()
 *   ]
 * })
 * ```
 */

// Core plugins
export { rendererPlugin } from './renderer'
export type { RendererPluginOptions, RendererPluginState, RendererPluginAPI } from './renderer'

export { layoutPlugin } from './layout'
export type { LayoutPluginOptions, LayoutPluginAPI } from './layout'

export { stylePlugin, darkTheme, lightTheme, draculaTheme, nordTheme } from './style'
export type { StylePluginOptions, StylePluginAPI } from './style'

// Optional plugins
export { inputPlugin, keyBindingPresets } from './input'
export type { InputPluginOptions, InputPluginAPI, KeyBinding } from './input'

export { mousePlugin } from './mouse'
export type { MousePluginOptions, MousePluginAPI, MouseHandler } from './mouse'

export { focusPlugin } from './focus'
export type { FocusPluginOptions, FocusPluginAPI } from './focus'

export { animationPlugin, easings } from './animation'
export type {
  AnimationPluginOptions,
  AnimationPluginAPI,
  AnimationCallback,
  AnimationHandle,
  EasingFunction,
  TweenOptions
} from './animation'

export { scrollPlugin, createScrollIndicators } from './scroll'
export type { ScrollPluginOptions, ScrollPluginAPI, ScrollState } from './scroll'

export { clipboardPlugin, copyWithSystemTool, readWithSystemTool } from './clipboard'
export type { ClipboardPluginOptions, ClipboardPluginAPI } from './clipboard'

export { screenPlugin, onResize, detectCapabilities } from './screen'
export type { ScreenPluginOptions, ScreenPluginAPI } from './screen'

// ============================================================
// Plugin Presets
// ============================================================

import type { Plugin } from '../types'
import { rendererPlugin } from './renderer'
import { layoutPlugin } from './layout'
import { stylePlugin } from './style'
import { inputPlugin } from './input'
import { mousePlugin } from './mouse'
import { focusPlugin } from './focus'
import { screenPlugin } from './screen'

/**
 * Create the minimal set of plugins for basic TUI functionality.
 * Includes: renderer, layout, style, screen
 */
export function minimalPlugins(): Plugin[] {
  return [rendererPlugin(), layoutPlugin(), stylePlugin(), screenPlugin()]
}

/**
 * Create a standard set of plugins for interactive TUI applications.
 * Includes: renderer, layout, style, screen, input, focus
 */
export function standardPlugins(): Plugin[] {
  return [
    rendererPlugin(),
    layoutPlugin(),
    stylePlugin(),
    screenPlugin(),
    inputPlugin(),
    focusPlugin()
  ]
}

/**
 * Create a full set of plugins with all features enabled.
 * Includes: all plugins
 */
export function fullPlugins(): Plugin[] {
  return [
    rendererPlugin(),
    layoutPlugin(),
    stylePlugin(),
    screenPlugin(),
    inputPlugin(),
    mousePlugin(),
    focusPlugin()
  ]
}
