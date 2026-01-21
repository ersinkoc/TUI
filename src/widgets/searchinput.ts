/**
 * @oxog/tui - SearchInput Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { stringWidth, truncateToWidth, sliceByWidth } from '../utils/unicode'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Search suggestion item.
 */
export interface SearchSuggestion {
  /** Display text */
  text: string
  /** Optional description */
  description?: string
  /** Optional icon (single char) */
  icon?: string
  /** Custom data */
  data?: unknown
}

/**
 * SearchInput widget properties.
 */
export interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string
  /** Initial value */
  value?: string
  /** Search icon */
  icon?: string
  /** Show clear button */
  showClear?: boolean
  /** Enable suggestions */
  showSuggestions?: boolean
  /** Maximum suggestions to show */
  maxSuggestions?: number
  /** Enable history */
  enableHistory?: boolean
  /** Maximum history items */
  maxHistory?: number
  /** Debounce delay in ms */
  debounceMs?: number
  /** Case sensitive search */
  caseSensitive?: boolean
}

/**
 * SearchInput node interface.
 */
export interface SearchInputNode extends Node {
  readonly type: 'searchinput'

  // Configuration
  placeholder(text: string): this
  value(text: string): this
  icon(char: string): this
  showClear(show: boolean): this
  showSuggestions(show: boolean): this
  maxSuggestions(count: number): this
  enableHistory(enabled: boolean): this
  maxHistory(count: number): this
  debounceMs(ms: number): this
  caseSensitive(enabled: boolean): this

  // Suggestions
  setSuggestions(items: SearchSuggestion[]): this
  clearSuggestions(): this

  // History
  addToHistory(text: string): this
  clearHistory(): this
  getHistory(): string[]

  // Actions
  clear(): this
  submit(): this
  selectSuggestion(index: number): this
  nextSuggestion(): this
  previousSuggestion(): this

  // Events
  onChange(handler: (value: string) => void): this
  onSearch(handler: (value: string) => void): this
  onSubmit(handler: (value: string) => void): this
  onSuggestionSelect(handler: (suggestion: SearchSuggestion, index: number) => void): this
  onClear(handler: () => void): this

  // Focus
  focus(): this
  blur(): this

  // State
  readonly isFocused: boolean
  readonly currentValue: string
  readonly selectedSuggestionIndex: number
  readonly suggestionsVisible: boolean
}

// ============================================================
// Implementation
// ============================================================

class SearchInputNodeImpl extends LeafNode implements SearchInputNode {
  readonly type = 'searchinput' as const

  private _placeholder: string = 'Search...'
  private _value: string = ''
  private _icon: string = '\u2315' // ⌕
  private _showClear: boolean = true
  private _showSuggestions: boolean = true
  private _maxSuggestions: number = 5
  private _enableHistory: boolean = true
  private _maxHistory: number = 10
  private _debounceMs: number = 150
  private _caseSensitive: boolean = false

  private _suggestions: SearchSuggestion[] = []
  private _history: string[] = []
  private _selectedSuggestionIndex: number = -1
  private _suggestionsOpen: boolean = false
  private _cursorPosition: number = 0
  private _scrollOffset: number = 0
  private _isFocused: boolean = false
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null

  private _onChangeHandlers: ((value: string) => void)[] = []
  private _onSearchHandlers: ((value: string) => void)[] = []
  private _onSubmitHandlers: ((value: string) => void)[] = []
  private _onSuggestionSelectHandlers: ((suggestion: SearchSuggestion, index: number) => void)[] = []
  private _onClearHandlers: (() => void)[] = []

  constructor(props?: SearchInputProps) {
    super()
    if (props) {
      if (props.placeholder) this._placeholder = props.placeholder
      if (props.value) {
        this._value = props.value
        this._cursorPosition = props.value.length
      }
      if (props.icon) this._icon = props.icon
      if (props.showClear !== undefined) this._showClear = props.showClear
      if (props.showSuggestions !== undefined) this._showSuggestions = props.showSuggestions
      if (props.maxSuggestions !== undefined) this._maxSuggestions = props.maxSuggestions
      if (props.enableHistory !== undefined) this._enableHistory = props.enableHistory
      if (props.maxHistory !== undefined) this._maxHistory = props.maxHistory
      if (props.debounceMs !== undefined) this._debounceMs = props.debounceMs
      if (props.caseSensitive !== undefined) this._caseSensitive = props.caseSensitive
    }
  }

  // State getters
  get isFocused(): boolean {
    return this._isFocused
  }

  get currentValue(): string {
    return this._value
  }

  get selectedSuggestionIndex(): number {
    return this._selectedSuggestionIndex
  }

  get suggestionsVisible(): boolean {
    return this._suggestionsOpen && this._suggestions.length > 0
  }

  get isCaseSensitive(): boolean {
    return this._caseSensitive
  }

  // Configuration
  placeholder(text: string): this {
    this._placeholder = text
    this.markDirty()
    return this
  }

  value(text: string): this {
    this._value = text
    this._cursorPosition = text.length
    this.markDirty()
    return this
  }

  icon(char: string): this {
    this._icon = char
    this.markDirty()
    return this
  }

  showClear(show: boolean): this {
    this._showClear = show
    this.markDirty()
    return this
  }

  showSuggestions(show: boolean): this {
    this._showSuggestions = show
    if (!show) {
      this._suggestionsOpen = false
    }
    this.markDirty()
    return this
  }

  maxSuggestions(count: number): this {
    this._maxSuggestions = count
    this.markDirty()
    return this
  }

  enableHistory(enabled: boolean): this {
    this._enableHistory = enabled
    return this
  }

  maxHistory(count: number): this {
    this._maxHistory = count
    return this
  }

  debounceMs(ms: number): this {
    this._debounceMs = ms
    return this
  }

  caseSensitive(enabled: boolean): this {
    this._caseSensitive = enabled
    return this
  }

  // Suggestions
  setSuggestions(items: SearchSuggestion[]): this {
    this._suggestions = items.slice(0, this._maxSuggestions)
    this._selectedSuggestionIndex = -1
    if (this._showSuggestions && items.length > 0 && this._isFocused) {
      this._suggestionsOpen = true
    }
    this.markDirty()
    return this
  }

  clearSuggestions(): this {
    this._suggestions = []
    this._selectedSuggestionIndex = -1
    this._suggestionsOpen = false
    this.markDirty()
    return this
  }

  // History
  addToHistory(text: string): this {
    if (!this._enableHistory || !text.trim()) return this

    // Remove duplicates
    this._history = this._history.filter((h) => h !== text)
    // Add to front
    this._history.unshift(text)
    // Trim to max
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(0, this._maxHistory)
    }
    return this
  }

  clearHistory(): this {
    this._history = []
    return this
  }

  getHistory(): string[] {
    return [...this._history]
  }

  // Actions
  clear(): this {
    if (this._value) {
      this._value = ''
      this._cursorPosition = 0
      this._scrollOffset = 0
      this.clearSuggestions()
      this.markDirty()

      for (const handler of this._onClearHandlers) {
        handler()
      }
      for (const handler of this._onChangeHandlers) {
        handler('')
      }
    }
    return this
  }

  submit(): this {
    if (this._selectedSuggestionIndex >= 0 && this._selectedSuggestionIndex < this._suggestions.length) {
      const suggestion = this._suggestions[this._selectedSuggestionIndex]
      if (suggestion) {
        this._value = suggestion.text
        this._cursorPosition = suggestion.text.length
        this.clearSuggestions()

        for (const handler of this._onSuggestionSelectHandlers) {
          handler(suggestion, this._selectedSuggestionIndex)
        }
      }
    }

    if (this._value.trim()) {
      this.addToHistory(this._value)
    }

    for (const handler of this._onSubmitHandlers) {
      handler(this._value)
    }

    this._suggestionsOpen = false
    this.markDirty()
    return this
  }

  selectSuggestion(index: number): this {
    if (index >= 0 && index < this._suggestions.length) {
      const suggestion = this._suggestions[index]
      if (suggestion) {
        this._value = suggestion.text
        this._cursorPosition = suggestion.text.length
        this._selectedSuggestionIndex = -1
        this._suggestionsOpen = false
        this.markDirty()

        for (const handler of this._onSuggestionSelectHandlers) {
          handler(suggestion, index)
        }
        for (const handler of this._onChangeHandlers) {
          handler(this._value)
        }
      }
    }
    return this
  }

  nextSuggestion(): this {
    if (!this._suggestionsOpen || this._suggestions.length === 0) return this

    this._selectedSuggestionIndex++
    if (this._selectedSuggestionIndex >= this._suggestions.length) {
      this._selectedSuggestionIndex = 0
    }
    this.markDirty()
    return this
  }

  previousSuggestion(): this {
    if (!this._suggestionsOpen || this._suggestions.length === 0) return this

    this._selectedSuggestionIndex--
    if (this._selectedSuggestionIndex < 0) {
      this._selectedSuggestionIndex = this._suggestions.length - 1
    }
    this.markDirty()
    return this
  }

  // Events
  onChange(handler: (value: string) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  onSearch(handler: (value: string) => void): this {
    this._onSearchHandlers.push(handler)
    return this
  }

  onSubmit(handler: (value: string) => void): this {
    this._onSubmitHandlers.push(handler)
    return this
  }

  onSuggestionSelect(handler: (suggestion: SearchSuggestion, index: number) => void): this {
    this._onSuggestionSelectHandlers.push(handler)
    return this
  }

  onClear(handler: () => void): this {
    this._onClearHandlers.push(handler)
    return this
  }

  // Focus
  focus(): this {
    this._isFocused = true
    if (this._showSuggestions && this._suggestions.length > 0) {
      this._suggestionsOpen = true
    }
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this._suggestionsOpen = false
    this.markDirty()
    return this
  }

  private emitSearchEvent(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }

    this._debounceTimer = setTimeout(() => {
      for (const handler of this._onSearchHandlers) {
        handler(this._value)
      }
    }, this._debounceMs)
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._isFocused) return false

    // Suggestion navigation
    if (this._suggestionsOpen) {
      if (key === 'down') {
        this.nextSuggestion()
        return true
      }
      if (key === 'up') {
        this.previousSuggestion()
        return true
      }
      if (key === 'escape') {
        this._suggestionsOpen = false
        this._selectedSuggestionIndex = -1
        this.markDirty()
        return true
      }
      if (key === 'tab') {
        if (this._selectedSuggestionIndex >= 0) {
          this.selectSuggestion(this._selectedSuggestionIndex)
        } else if (this._suggestions.length > 0) {
          this.selectSuggestion(0)
        }
        return true
      }
    }

    // Text input handling
    switch (key) {
      case 'enter':
        this.submit()
        return true

      case 'backspace':
        if (this._cursorPosition > 0) {
          this._value = this._value.slice(0, this._cursorPosition - 1) + this._value.slice(this._cursorPosition)
          this._cursorPosition--
          this.emitChange()
        }
        return true

      case 'delete':
        if (this._cursorPosition < this._value.length) {
          this._value = this._value.slice(0, this._cursorPosition) + this._value.slice(this._cursorPosition + 1)
          this.emitChange()
        }
        return true

      case 'left':
        if (this._cursorPosition > 0) {
          this._cursorPosition--
          this.markDirty()
        }
        return true

      case 'right':
        if (this._cursorPosition < this._value.length) {
          this._cursorPosition++
          this.markDirty()
        }
        return true

      case 'home':
        this._cursorPosition = 0
        this._scrollOffset = 0
        this.markDirty()
        return true

      case 'end':
        this._cursorPosition = this._value.length
        this.markDirty()
        return true

      case 'escape':
        if (this._value) {
          this.clear()
          return true
        }
        return false

      case 'u':
        if (ctrl) {
          // Clear line
          this._value = this._value.slice(this._cursorPosition)
          this._cursorPosition = 0
          this.emitChange()
          return true
        }
        break

      case 'k':
        if (ctrl) {
          // Kill to end
          this._value = this._value.slice(0, this._cursorPosition)
          this.emitChange()
          return true
        }
        break

      case 'a':
        if (ctrl) {
          // Go to start
          this._cursorPosition = 0
          this._scrollOffset = 0
          this.markDirty()
          return true
        }
        break

      case 'e':
        if (ctrl) {
          // Go to end
          this._cursorPosition = this._value.length
          this.markDirty()
          return true
        }
        break
    }

    // Regular character input
    if (key.length === 1 && !ctrl) {
      this._value = this._value.slice(0, this._cursorPosition) + key + this._value.slice(this._cursorPosition)
      this._cursorPosition++
      this.emitChange()
      return true
    }

    return false
  }

  private emitChange(): void {
    this.markDirty()
    for (const handler of this._onChangeHandlers) {
      handler(this._value)
    }
    this.emitSearchEvent()

    // Show suggestions on typing
    if (this._showSuggestions && this._value && this._suggestions.length > 0) {
      this._suggestionsOpen = true
    }
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      const relX = x - bounds.x
      const relY = y - bounds.y

      // Click on main input area
      if (relY === 0) {
        this._isFocused = true

        // Check clear button
        if (this._showClear && this._value && relX >= bounds.width - 3) {
          this.clear()
          return true
        }

        // Position cursor
        const inputStartX = 2 // icon + space
        const clickPos = relX - inputStartX + this._scrollOffset
        this._cursorPosition = Math.max(0, Math.min(clickPos, this._value.length))
        this.markDirty()
        return true
      }

      // Click on suggestion
      if (this._suggestionsOpen && relY > 0 && relY <= this._suggestions.length) {
        const suggestionIndex = relY - 1
        this.selectSuggestion(suggestionIndex)
        return true
      }
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Draw icon
    buffer.set(bounds.x, bounds.y, { char: this._icon, fg, bg, attrs: ATTR_DIM })

    // Calculate input area
    const inputX = bounds.x + 2
    const clearWidth = this._showClear && this._value ? 3 : 0
    const inputWidth = bounds.width - 2 - clearWidth

    // Draw input background
    for (let i = 0; i < inputWidth; i++) {
      buffer.set(inputX + i, bounds.y, { char: ' ', fg, bg, attrs: 0 })
    }

    // Draw value or placeholder
    if (this._value) {
      // Ensure cursor is visible
      if (this._cursorPosition < this._scrollOffset) {
        this._scrollOffset = this._cursorPosition
      } else if (this._cursorPosition >= this._scrollOffset + inputWidth) {
        this._scrollOffset = this._cursorPosition - inputWidth + 1
      }

      const visibleValue = sliceByWidth(this._value, this._scrollOffset, inputWidth)
      buffer.write(inputX, bounds.y, visibleValue, { fg, bg, attrs: 0 })
    } else {
      // Placeholder
      const placeholder = truncateToWidth(this._placeholder, inputWidth)
      buffer.write(inputX, bounds.y, placeholder, { fg, bg, attrs: ATTR_DIM })
    }

    // Draw cursor
    if (this._isFocused) {
      const cursorX = inputX + this._cursorPosition - this._scrollOffset
      if (cursorX >= inputX && cursorX < inputX + inputWidth) {
        const cursorChar = this._cursorPosition < this._value.length
          ? (this._value[this._cursorPosition] ?? ' ')
          : ' '
        buffer.set(cursorX, bounds.y, { char: cursorChar, fg: bg, bg: fg, attrs: 0 })
      }
    }

    // Draw clear button
    if (this._showClear && this._value) {
      const clearX = bounds.x + bounds.width - 2
      buffer.set(clearX, bounds.y, { char: '\u2715', fg, bg, attrs: ATTR_DIM }) // ✕
    }

    // Draw suggestions dropdown
    if (this._suggestionsOpen && this._suggestions.length > 0) {
      this.renderSuggestions(buffer, bounds, fg, bg)
    }
  }

  private renderSuggestions(
    buffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    fg: number,
    bg: number
  ): void {
    const startY = bounds.y + 1
    const maxY = Math.min(startY + this._suggestions.length, buffer.height)

    for (let i = 0; i < this._suggestions.length && startY + i < maxY; i++) {
      const suggestion = this._suggestions[i]
      if (!suggestion) continue

      const y = startY + i
      const isSelected = i === this._selectedSuggestionIndex

      // Background
      const attrs = isSelected ? ATTR_INVERSE : 0
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        buffer.set(x, y, { char: ' ', fg, bg, attrs })
      }

      // Icon
      if (suggestion.icon) {
        buffer.set(bounds.x + 1, y, { char: suggestion.icon, fg, bg, attrs: attrs | ATTR_DIM })
      }

      // Text
      const textX = bounds.x + (suggestion.icon ? 3 : 1)
      const maxTextWidth = bounds.width - (suggestion.icon ? 4 : 2)
      const text = truncateToWidth(suggestion.text, maxTextWidth)
      buffer.write(textX, y, text, { fg, bg, attrs: attrs | (isSelected ? ATTR_BOLD : 0) })

      // Description (if space)
      if (suggestion.description && stringWidth(text) + 3 < maxTextWidth) {
        const descX = textX + stringWidth(text) + 1
        const descWidth = maxTextWidth - stringWidth(text) - 2
        if (descWidth > 5) {
          const desc = truncateToWidth(suggestion.description, descWidth)
          buffer.write(descX, y, desc, { fg, bg, attrs: attrs | ATTR_DIM })
        }
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a search input widget.
 *
 * @param props - SearchInput properties
 * @returns SearchInput node
 *
 * @example
 * ```typescript
 * // Basic search input
 * const search = searchinput({
 *   placeholder: 'Search files...'
 * }).onSearch((query) => {
 *   const results = findFiles(query)
 *   search.setSuggestions(results.map(f => ({ text: f.name })))
 * }).onSubmit((query) => {
 *   openFile(query)
 * })
 *
 * // With history
 * const cmdSearch = searchinput({
 *   placeholder: 'Enter command',
 *   enableHistory: true,
 *   maxHistory: 20
 * })
 *
 * // Without suggestions
 * const simple = searchinput({
 *   placeholder: 'Quick search',
 *   showSuggestions: false,
 *   showClear: true
 * })
 *
 * // Custom icon
 * const filter = searchinput({
 *   placeholder: 'Filter items...',
 *   icon: '\u2263' // ≣
 * })
 * ```
 */
export function searchinput(props?: SearchInputProps): SearchInputNode {
  return new SearchInputNodeImpl(props)
}
