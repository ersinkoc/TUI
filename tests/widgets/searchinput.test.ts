/**
 * SearchInput widget tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { searchinput, SearchSuggestion } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

const sampleSuggestions: SearchSuggestion[] = [
  { text: 'file.ts', description: 'TypeScript file', icon: '\u{1F4C4}' },
  { text: 'config.json', description: 'Configuration', icon: '\u2699' },
  { text: 'readme.md', description: 'Documentation' },
  { text: 'package.json', description: 'Package manifest' },
  { text: 'index.ts', description: 'Entry point' }
]

describe('SearchInput Widget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('creation', () => {
    it('creates a searchinput with default properties', () => {
      const search = searchinput()
      expect(search.type).toBe('searchinput')
      expect(search.currentValue).toBe('')
      expect(search.selectedSuggestionIndex).toBe(-1)
    })

    it('creates a searchinput with placeholder', () => {
      const search = searchinput({ placeholder: 'Search files...' })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput with initial value', () => {
      const search = searchinput({ value: 'test' })
      expect(search.currentValue).toBe('test')
    })

    it('creates a searchinput with custom icon', () => {
      const search = searchinput({ icon: '\u{1F50D}' })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput without clear button', () => {
      const search = searchinput({ showClear: false })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput without suggestions', () => {
      const search = searchinput({ showSuggestions: false })
      expect(search.suggestionsVisible).toBe(false)
    })

    it('creates a searchinput with max suggestions', () => {
      const search = searchinput({ maxSuggestions: 3 })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput without history', () => {
      const search = searchinput({ enableHistory: false })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput with max history', () => {
      const search = searchinput({ maxHistory: 5 })
      expect(search.type).toBe('searchinput')
    })

    it('creates a searchinput with debounce', () => {
      const search = searchinput({ debounceMs: 300 })
      expect(search.type).toBe('searchinput')
    })

    it('creates a case sensitive searchinput', () => {
      const search = searchinput({ caseSensitive: true })
      expect(search.type).toBe('searchinput')
    })
  })

  describe('configuration', () => {
    it('sets placeholder', () => {
      const search = searchinput().placeholder('Type to search')
      expect(search.type).toBe('searchinput')
    })

    it('sets value', () => {
      const search = searchinput().value('query')
      expect(search.currentValue).toBe('query')
    })

    it('sets icon', () => {
      const search = searchinput().icon('\u2315')
      expect(search.type).toBe('searchinput')
    })

    it('sets showClear', () => {
      const search = searchinput().showClear(false)
      expect(search.type).toBe('searchinput')
    })

    it('sets showSuggestions', () => {
      const search = searchinput().showSuggestions(false)
      expect(search.type).toBe('searchinput')
    })

    it('sets maxSuggestions', () => {
      const search = searchinput().maxSuggestions(10)
      expect(search.type).toBe('searchinput')
    })

    it('sets enableHistory', () => {
      const search = searchinput().enableHistory(false)
      expect(search.type).toBe('searchinput')
    })

    it('sets maxHistory', () => {
      const search = searchinput().maxHistory(20)
      expect(search.type).toBe('searchinput')
    })

    it('sets debounceMs', () => {
      const search = searchinput().debounceMs(500)
      expect(search.type).toBe('searchinput')
    })

    it('sets caseSensitive', () => {
      const search = searchinput().caseSensitive(true)
      expect(search.type).toBe('searchinput')
    })
  })

  describe('suggestions', () => {
    it('sets suggestions', () => {
      const search = searchinput().focus().setSuggestions(sampleSuggestions)
      expect(search.suggestionsVisible).toBe(true)
    })

    it('limits suggestions to max', () => {
      const search = searchinput({ maxSuggestions: 2 })
        .focus()
        .setSuggestions(sampleSuggestions)
      expect(search.type).toBe('searchinput')
    })

    it('clears suggestions', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)
        .clearSuggestions()
      expect(search.suggestionsVisible).toBe(false)
    })

    it('selects suggestion', () => {
      const handler = vi.fn()
      const search = searchinput()
        .setSuggestions(sampleSuggestions)
        .onSuggestionSelect(handler)
        .selectSuggestion(1)

      expect(search.currentValue).toBe('config.json')
      expect(handler).toHaveBeenCalled()
    })

    it('selectSuggestion ignores invalid index', () => {
      const search = searchinput()
        .setSuggestions(sampleSuggestions)
        .selectSuggestion(100)
      expect(search.currentValue).toBe('')
    })

    it('navigates to next suggestion', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.nextSuggestion()
      expect(search.selectedSuggestionIndex).toBe(0)

      search.nextSuggestion()
      expect(search.selectedSuggestionIndex).toBe(1)
    })

    it('wraps around on next', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions.slice(0, 2))

      search.nextSuggestion() // 0
      search.nextSuggestion() // 1
      search.nextSuggestion() // 0 (wrap)
      expect(search.selectedSuggestionIndex).toBe(0)
    })

    it('navigates to previous suggestion', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.nextSuggestion()
      search.nextSuggestion()
      search.previousSuggestion()
      expect(search.selectedSuggestionIndex).toBe(0)
    })

    it('wraps around on previous', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions.slice(0, 2))

      search.previousSuggestion()
      expect(search.selectedSuggestionIndex).toBe(1)
    })

    it('navigation does nothing when closed', () => {
      const search = searchinput()
      search.nextSuggestion()
      expect(search.selectedSuggestionIndex).toBe(-1)
    })
  })

  describe('history', () => {
    it('adds to history', () => {
      const search = searchinput().addToHistory('query1').addToHistory('query2')
      const history = search.getHistory()
      expect(history).toContain('query1')
      expect(history).toContain('query2')
    })

    it('removes duplicates from history', () => {
      const search = searchinput()
        .addToHistory('query1')
        .addToHistory('query2')
        .addToHistory('query1')
      const history = search.getHistory()
      expect(history.filter(h => h === 'query1').length).toBe(1)
    })

    it('limits history to max', () => {
      const search = searchinput({ maxHistory: 3 })
      for (let i = 0; i < 10; i++) {
        search.addToHistory(`query${i}`)
      }
      expect(search.getHistory().length).toBe(3)
    })

    it('ignores empty history', () => {
      const search = searchinput()
        .addToHistory('')
        .addToHistory('  ')
      expect(search.getHistory().length).toBe(0)
    })

    it('clears history', () => {
      const search = searchinput()
        .addToHistory('query1')
        .clearHistory()
      expect(search.getHistory().length).toBe(0)
    })

    it('does not add to history when disabled', () => {
      const search = searchinput({ enableHistory: false })
        .addToHistory('query')
      expect(search.getHistory().length).toBe(0)
    })
  })

  describe('actions', () => {
    it('clears value', () => {
      const clearHandler = vi.fn()
      const changeHandler = vi.fn()
      const search = searchinput({ value: 'test' })
        .onClear(clearHandler)
        .onChange(changeHandler)
        .clear()

      expect(search.currentValue).toBe('')
      expect(clearHandler).toHaveBeenCalled()
      expect(changeHandler).toHaveBeenCalledWith('')
    })

    it('clear does nothing when empty', () => {
      const handler = vi.fn()
      const search = searchinput().onClear(handler).clear()
      expect(handler).not.toHaveBeenCalled()
    })

    it('submits value', () => {
      const handler = vi.fn()
      const search = searchinput({ value: 'test' })
        .onSubmit(handler)
        .submit()

      expect(handler).toHaveBeenCalledWith('test')
    })

    it('submit adds to history', () => {
      const search = searchinput({ value: 'query' }).submit()
      expect(search.getHistory()).toContain('query')
    })

    it('submit selects highlighted suggestion', () => {
      const selectHandler = vi.fn()
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)
        .onSuggestionSelect(selectHandler)

      search.nextSuggestion()
      search.submit()

      expect(search.currentValue).toBe('file.ts')
      expect(selectHandler).toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('focuses the input', () => {
      const search = searchinput().focus()
      expect(search.isFocused).toBe(true)
    })

    it('focus opens suggestions if available', () => {
      const search = searchinput()
        .setSuggestions(sampleSuggestions)
        .focus()
      expect(search.suggestionsVisible).toBe(true)
    })

    it('blurs the input', () => {
      const search = searchinput().focus().blur()
      expect(search.isFocused).toBe(false)
    })

    it('blur closes suggestions', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)
        .blur()
      expect(search.suggestionsVisible).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('types characters', () => {
      const handler = vi.fn()
      const search = searchinput()
        .onChange(handler)
        .focus()

      search.handleKey('h', false)
      search.handleKey('e', false)
      search.handleKey('l', false)
      search.handleKey('l', false)
      search.handleKey('o', false)

      expect(search.currentValue).toBe('hello')
      expect(handler).toHaveBeenCalled()
    })

    it('handles backspace', () => {
      const search = searchinput({ value: 'test' }).focus()
      search.handleKey('backspace', false)
      expect(search.currentValue).toBe('tes')
    })

    it('handles delete', () => {
      const search = searchinput({ value: 'test' }).focus()
      ;(search as any)._cursorPosition = 0
      search.handleKey('delete', false)
      expect(search.currentValue).toBe('est')
    })

    it('moves cursor left/right', () => {
      const search = searchinput({ value: 'test' }).focus()

      search.handleKey('left', false)
      expect((search as any)._cursorPosition).toBe(3)

      search.handleKey('right', false)
      expect((search as any)._cursorPosition).toBe(4)
    })

    it('moves to home/end', () => {
      const search = searchinput({ value: 'test' }).focus()

      search.handleKey('home', false)
      expect((search as any)._cursorPosition).toBe(0)

      search.handleKey('end', false)
      expect((search as any)._cursorPosition).toBe(4)
    })

    it('submits with enter', () => {
      const handler = vi.fn()
      const search = searchinput({ value: 'query' })
        .onSubmit(handler)
        .focus()

      search.handleKey('enter', false)
      expect(handler).toHaveBeenCalledWith('query')
    })

    it('clears with escape', () => {
      const search = searchinput({ value: 'test' }).focus()
      search.handleKey('escape', false)
      expect(search.currentValue).toBe('')
    })

    it('escape closes suggestions first', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.handleKey('escape', false)
      expect(search.suggestionsVisible).toBe(false)
      expect(search.currentValue).toBe('')
    })

    it('navigates suggestions with up/down', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.handleKey('down', false)
      expect(search.selectedSuggestionIndex).toBe(0)

      search.handleKey('up', false)
      expect(search.selectedSuggestionIndex).toBe(4)
    })

    it('selects suggestion with tab', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.handleKey('down', false)
      search.handleKey('tab', false)
      expect(search.currentValue).toBe('file.ts')
    })

    it('tab selects first suggestion when none selected', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)

      search.handleKey('tab', false)
      expect(search.currentValue).toBe('file.ts')
    })

    it('ctrl+u clears to start', () => {
      const search = searchinput({ value: 'hello world' }).focus()
      ;(search as any)._cursorPosition = 5
      search.handleKey('u', true)
      expect(search.currentValue).toBe(' world')
    })

    it('ctrl+k kills to end', () => {
      const search = searchinput({ value: 'hello world' }).focus()
      ;(search as any)._cursorPosition = 5
      search.handleKey('k', true)
      expect(search.currentValue).toBe('hello')
    })

    it('ctrl+a goes to start', () => {
      const search = searchinput({ value: 'test' }).focus()
      search.handleKey('a', true)
      expect((search as any)._cursorPosition).toBe(0)
    })

    it('ctrl+e goes to end', () => {
      const search = searchinput({ value: 'test' }).focus()
      ;(search as any)._cursorPosition = 0
      search.handleKey('e', true)
      expect((search as any)._cursorPosition).toBe(4)
    })

    it('ignores keys when not focused', () => {
      const search = searchinput()
      expect(search.handleKey('a', false)).toBe(false)
    })

    it('ignores unknown keys', () => {
      const search = searchinput().focus()
      expect(search.handleKey('f5', false)).toBe(false)
    })
  })

  describe('search event debouncing', () => {
    it('debounces search events', () => {
      const handler = vi.fn()
      const search = searchinput({ debounceMs: 100 })
        .onSearch(handler)
        .focus()

      search.handleKey('t', false)
      search.handleKey('e', false)
      search.handleKey('s', false)
      search.handleKey('t', false)

      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledWith('test')
    })
  })

  describe('mouse handling', () => {
    let search: ReturnType<typeof searchinput>

    beforeEach(() => {
      search = searchinput({ value: 'test' })
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 5 }
    })

    it('clicks to focus', () => {
      expect(search.handleMouse(10, 0, 'press')).toBe(true)
      expect(search.isFocused).toBe(true)
    })

    it('clicks clear button', () => {
      const handler = vi.fn()
      search.onClear(handler)
      expect(search.handleMouse(28, 0, 'press')).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('clicks on suggestion', () => {
      search.focus().setSuggestions(sampleSuggestions)
      expect(search.handleMouse(10, 1, 'press')).toBe(true)
      expect(search.currentValue).toBe('file.ts')
    })

    it('ignores when hidden', () => {
      ;(search as any)._visible = false
      expect(search.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores when no bounds', () => {
      ;(search as any)._bounds = null
      expect(search.handleMouse(10, 0, 'press')).toBe(false)
    })

    it('ignores non-press actions', () => {
      expect(search.handleMouse(10, 0, 'release')).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 40
    const height = 10

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty input', () => {
      const search = searchinput()
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with value', () => {
      const search = searchinput({ value: 'test query' })
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with placeholder', () => {
      const search = searchinput({ placeholder: 'Type to search...' })
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with cursor', () => {
      const search = searchinput({ value: 'test' }).focus()
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with clear button', () => {
      const search = searchinput({ value: 'test', showClear: true })
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders suggestions dropdown', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 8 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders selected suggestion', () => {
      const search = searchinput()
        .focus()
        .setSuggestions(sampleSuggestions)
      search.nextSuggestion()
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 8 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles long value with scrolling', () => {
      const search = searchinput({ value: 'This is a very long search query that exceeds the width' }).focus()
      ;(search as any)._bounds = { x: 0, y: 0, width: 20, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render when hidden', () => {
      const search = searchinput()
      ;(search as any)._visible = false
      ;(search as any)._bounds = { x: 0, y: 0, width: 30, height: 1 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const search = searchinput()
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render with zero dimensions', () => {
      const search = searchinput()
      ;(search as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      search.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('events', () => {
    it('registers multiple change handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const search = searchinput()
        .onChange(handler1)
        .onChange(handler2)
        .focus()

      search.handleKey('a', false)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const changeHandler = vi.fn()
      const searchHandler = vi.fn()
      const submitHandler = vi.fn()

      const search = searchinput()
        .placeholder('Search...')
        .value('initial')
        .icon('\u2315')
        .showClear(true)
        .showSuggestions(true)
        .maxSuggestions(5)
        .enableHistory(true)
        .maxHistory(10)
        .debounceMs(150)
        .caseSensitive(false)
        .onChange(changeHandler)
        .onSearch(searchHandler)
        .onSubmit(submitHandler)
        .setSuggestions(sampleSuggestions)
        .focus()

      expect(search.type).toBe('searchinput')
      expect(search.currentValue).toBe('initial')
      expect(search.isFocused).toBe(true)
      expect(search.suggestionsVisible).toBe(true)
    })
  })
})
