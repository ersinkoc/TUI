/**
 * @oxog/tui - Terminal Widget Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { terminal } from '../../src/widgets/terminal'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

describe('Terminal Widget', () => {
  describe('creation', () => {
    it('creates an empty terminal', () => {
      const term = terminal()
      expect(term).toBeDefined()
      expect(term.type).toBe('terminal')
      expect(term.lines).toHaveLength(0)
    })

    it('creates with initial lines', () => {
      const term = terminal({
        lines: [
          { content: 'Line 1' },
          { content: 'Line 2' }
        ]
      })
      expect(term.lines).toHaveLength(2)
    })

    it('creates with all props', () => {
      const term = terminal({
        lines: [{ content: 'Test' }],
        maxLines: 500,
        prompt: '$ ',
        promptColor: 46,
        cursorChar: '_',
        showCursor: true,
        showLineNumbers: true,
        showTimestamps: true,
        autoScroll: true,
        inputEnabled: true
      })
      expect(term.lines).toHaveLength(1)
    })
  })

  describe('output', () => {
    let term: ReturnType<typeof terminal>

    beforeEach(() => {
      term = terminal()
    })

    it('writes text', () => {
      term.write('Hello')
      expect(term.lines).toHaveLength(0) // No newline yet
    })

    it('writes line', () => {
      term.writeLine('Hello')
      expect(term.lines).toHaveLength(1)
      expect(term.lines[0].content).toBe('Hello')
    })

    it('writes text with newline', () => {
      term.write('Line 1\nLine 2\n')
      expect(term.lines).toHaveLength(2)
    })

    it('writes error', () => {
      term.writeError('Error message')
      expect(term.lines[0].fg).toBe(196)
    })

    it('writes success', () => {
      term.writeSuccess('Success message')
      expect(term.lines[0].fg).toBe(46)
    })

    it('writes warning', () => {
      term.writeWarning('Warning message')
      expect(term.lines[0].fg).toBe(208)
    })

    it('writes info', () => {
      term.writeInfo('Info message')
      expect(term.lines[0].fg).toBe(39)
    })

    it('writes with custom colors', () => {
      term.writeLine('Colored', 123, 234, 1)
      expect(term.lines[0].fg).toBe(123)
      expect(term.lines[0].bg).toBe(234)
      expect(term.lines[0].attrs).toBe(1)
    })

    it('clears terminal', () => {
      term.writeLine('Line 1')
      term.writeLine('Line 2')
      term.clear()
      expect(term.lines).toHaveLength(0)
    })

    it('trims excess lines', () => {
      term.maxLines(5)
      for (let i = 0; i < 10; i++) {
        term.writeLine(`Line ${i}`)
      }
      expect(term.lines).toHaveLength(5)
      expect(term.lines[0].content).toBe('Line 5')
    })

    it('adds timestamp to lines', () => {
      term.writeLine('Test')
      expect(term.lines[0].timestamp).toBeDefined()
    })

    it('continues partial line with write then writeLine', () => {
      term.write('Hello ')
      term.writeLine('World')
      expect(term.lines).toHaveLength(1)
      expect(term.lines[0].content).toBe('Hello World')
    })
  })

  describe('configuration', () => {
    it('sets max lines', () => {
      const term = terminal()
      expect(term.maxLines(100)).toBe(term)
    })

    it('trims when setting lower max', () => {
      const term = terminal()
      for (let i = 0; i < 20; i++) term.writeLine(`Line ${i}`)
      term.maxLines(5)
      expect(term.lines).toHaveLength(5)
    })

    it('sets prompt', () => {
      const term = terminal()
      expect(term.prompt('$ ')).toBe(term)
    })

    it('sets prompt color', () => {
      const term = terminal()
      expect(term.promptColor(208)).toBe(term)
    })

    it('sets cursor char', () => {
      const term = terminal()
      expect(term.cursorChar('_')).toBe(term)
    })

    it('toggles cursor', () => {
      const term = terminal()
      expect(term.showCursor(false)).toBe(term)
    })

    it('toggles line numbers', () => {
      const term = terminal()
      expect(term.showLineNumbers(true)).toBe(term)
    })

    it('toggles timestamps', () => {
      const term = terminal()
      expect(term.showTimestamps(true)).toBe(term)
    })

    it('toggles auto scroll', () => {
      const term = terminal()
      expect(term.autoScroll(false)).toBe(term)
    })

    it('toggles input enabled', () => {
      const term = terminal()
      expect(term.inputEnabled(false)).toBe(term)
    })
  })

  describe('scrolling', () => {
    let term: ReturnType<typeof terminal>

    beforeEach(() => {
      term = terminal()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      for (let i = 0; i < 30; i++) {
        term.writeLine(`Line ${i}`)
      }
    })

    it('scrolls up', () => {
      term.scrollToBottom()
      const initial = term.scrollOffset
      term.scrollUp(5)
      expect(term.scrollOffset).toBe(initial - 5)
    })

    it('scrolls down', () => {
      term.scrollToTop()
      term.scrollDown(5)
      expect(term.scrollOffset).toBe(5)
    })

    it('scrolls to top', () => {
      term.scrollToTop()
      expect(term.scrollOffset).toBe(0)
    })

    it('scrolls to bottom', () => {
      term.scrollToTop()
      term.scrollToBottom()
      expect(term.scrollOffset).toBeGreaterThan(0)
    })

    it('clamps scroll to top', () => {
      term.scrollToTop()
      term.scrollUp(100)
      expect(term.scrollOffset).toBe(0)
    })

    it('clamps scroll to bottom', () => {
      term.scrollToBottom()
      term.scrollDown(100)
      // Should not exceed max scroll
      expect(term.scrollOffset).toBeLessThanOrEqual(30 - term.visibleLines)
    })

    it('returns visible lines count', () => {
      expect(term.visibleLines).toBe(9) // 10 - 1 for input line
    })

    it('returns 0 visible lines without bounds', () => {
      const term2 = terminal()
      expect(term2.visibleLines).toBe(0)
    })
  })

  describe('input', () => {
    let term: ReturnType<typeof terminal>

    beforeEach(() => {
      term = terminal().focus()
    })

    it('inserts character', () => {
      term.insertChar('a')
      expect(term.inputBuffer).toBe('a')
      expect(term.cursorPosition).toBe(1)
    })

    it('inserts multiple characters', () => {
      term.insertChar('h')
      term.insertChar('i')
      expect(term.inputBuffer).toBe('hi')
    })

    it('inserts at cursor position', () => {
      term.insertChar('h')
      term.insertChar('i')
      term.moveCursorLeft()
      term.insertChar('X')
      expect(term.inputBuffer).toBe('hXi')
    })

    it('deletes character at cursor', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorLeft()
      term.deleteChar()
      expect(term.inputBuffer).toBe('a')
    })

    it('deletes character before cursor', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.deleteCharBefore()
      expect(term.inputBuffer).toBe('a')
    })

    it('does not delete before if at start', () => {
      term.insertChar('a')
      term.moveCursorToStart()
      term.deleteCharBefore()
      expect(term.inputBuffer).toBe('a')
    })

    it('does not delete at cursor if at end', () => {
      term.insertChar('a')
      term.deleteChar()
      expect(term.inputBuffer).toBe('a')
    })

    it('moves cursor left', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorLeft()
      expect(term.cursorPosition).toBe(1)
    })

    it('moves cursor right', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorToStart()
      term.moveCursorRight()
      expect(term.cursorPosition).toBe(1)
    })

    it('does not move cursor left past start', () => {
      term.moveCursorLeft()
      expect(term.cursorPosition).toBe(0)
    })

    it('does not move cursor right past end', () => {
      term.insertChar('a')
      term.moveCursorRight()
      expect(term.cursorPosition).toBe(1)
    })

    it('moves cursor to start', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorToStart()
      expect(term.cursorPosition).toBe(0)
    })

    it('moves cursor to end', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorToStart()
      term.moveCursorToEnd()
      expect(term.cursorPosition).toBe(2)
    })

    it('clears input', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.clearInput()
      expect(term.inputBuffer).toBe('')
      expect(term.cursorPosition).toBe(0)
    })

    it('gets input', () => {
      term.insertChar('t')
      term.insertChar('e')
      term.insertChar('s')
      term.insertChar('t')
      expect(term.getInput()).toBe('test')
    })

    it('submits input', () => {
      term.insertChar('c')
      term.insertChar('m')
      term.insertChar('d')
      const input = term.submitInput()
      expect(input).toBe('cmd')
      expect(term.inputBuffer).toBe('')
      expect(term.lines.length).toBeGreaterThan(0)
    })

    it('does not insert when input disabled', () => {
      term.inputEnabled(false)
      term.insertChar('a')
      expect(term.inputBuffer).toBe('')
    })

    it('does not delete when input disabled', () => {
      term.insertChar('a')
      term.inputEnabled(false)
      term.deleteChar()
      expect(term.inputBuffer).toBe('a')
    })

    it('does not delete before when input disabled', () => {
      term.insertChar('a')
      term.inputEnabled(false)
      term.deleteCharBefore()
      expect(term.inputBuffer).toBe('a')
    })
  })

  describe('focus', () => {
    it('focuses the terminal', () => {
      const term = terminal()
      expect(term.focus()).toBe(term)
    })

    it('blurs the terminal', () => {
      const term = terminal().focus()
      expect(term.blur()).toBe(term)
    })
  })

  describe('events', () => {
    it('calls onSubmit when input is submitted', () => {
      const handler = vi.fn()
      const term = terminal().onSubmit(handler).focus()
      term.insertChar('t')
      term.insertChar('e')
      term.insertChar('s')
      term.insertChar('t')
      term.submitInput()
      expect(handler).toHaveBeenCalledWith('test')
    })

    it('calls onInput when character is inserted', () => {
      const handler = vi.fn()
      const term = terminal().onInput(handler).focus()
      term.insertChar('x')
      expect(handler).toHaveBeenCalledWith('x')
    })
  })

  describe('keyboard handling', () => {
    let term: ReturnType<typeof terminal>

    beforeEach(() => {
      term = terminal().focus()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('handles pageup', () => {
      for (let i = 0; i < 30; i++) term.writeLine(`Line ${i}`)
      const initial = term.scrollOffset
      expect(term.handleKey('pageup')).toBe(true)
      expect(term.scrollOffset).toBeLessThan(initial)
    })

    it('handles pagedown', () => {
      for (let i = 0; i < 30; i++) term.writeLine(`Line ${i}`)
      term.scrollToTop()
      expect(term.handleKey('pagedown')).toBe(true)
      expect(term.scrollOffset).toBeGreaterThan(0)
    })

    it('handles home for input', () => {
      term.insertChar('a')
      term.insertChar('b')
      expect(term.handleKey('home')).toBe(true)
      expect(term.cursorPosition).toBe(0)
    })

    it('handles end for input', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorToStart()
      expect(term.handleKey('end')).toBe(true)
      expect(term.cursorPosition).toBe(2)
    })

    it('handles home for scroll when input disabled', () => {
      for (let i = 0; i < 30; i++) term.writeLine(`Line ${i}`)
      term.inputEnabled(false)
      expect(term.handleKey('home')).toBe(true)
      expect(term.scrollOffset).toBe(0)
    })

    it('handles end for scroll when input disabled', () => {
      for (let i = 0; i < 30; i++) term.writeLine(`Line ${i}`)
      term.inputEnabled(false)
      term.scrollToTop()
      expect(term.handleKey('end')).toBe(true)
      expect(term.scrollOffset).toBeGreaterThan(0)
    })

    it('handles left arrow', () => {
      term.insertChar('a')
      expect(term.handleKey('left')).toBe(true)
      expect(term.cursorPosition).toBe(0)
    })

    it('handles right arrow', () => {
      term.insertChar('a')
      term.moveCursorToStart()
      expect(term.handleKey('right')).toBe(true)
      expect(term.cursorPosition).toBe(1)
    })

    it('handles backspace', () => {
      term.insertChar('a')
      expect(term.handleKey('backspace')).toBe(true)
      expect(term.inputBuffer).toBe('')
    })

    it('handles delete', () => {
      term.insertChar('a')
      term.insertChar('b')
      term.moveCursorToStart()
      expect(term.handleKey('delete')).toBe(true)
      expect(term.inputBuffer).toBe('b')
    })

    it('handles enter', () => {
      term.insertChar('c')
      term.insertChar('m')
      term.insertChar('d')
      expect(term.handleKey('enter')).toBe(true)
      expect(term.inputBuffer).toBe('')
    })

    it('handles printable characters', () => {
      expect(term.handleKey('x')).toBe(true)
      expect(term.inputBuffer).toBe('x')
    })

    it('ignores keys when not focused', () => {
      term.blur()
      expect(term.handleKey('a')).toBe(false)
    })

    it('ignores input keys when input disabled', () => {
      term.inputEnabled(false)
      expect(term.handleKey('a')).toBe(false)
    })

    it('returns false for unknown keys', () => {
      expect(term.handleKey('f1')).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let term: ReturnType<typeof terminal>

    beforeEach(() => {
      term = terminal()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      for (let i = 0; i < 30; i++) term.writeLine(`Line ${i}`)
    })

    it('focuses on click', () => {
      expect(term.handleMouse(5, 5, 'press')).toBe(true)
    })

    it('scrolls up on scroll_up', () => {
      term.scrollToBottom()
      const initial = term.scrollOffset
      expect(term.handleMouse(5, 5, 'scroll_up')).toBe(true)
      expect(term.scrollOffset).toBeLessThan(initial)
    })

    it('scrolls down on scroll_down', () => {
      term.scrollToTop()
      expect(term.handleMouse(5, 5, 'scroll_down')).toBe(true)
      expect(term.scrollOffset).toBeGreaterThan(0)
    })

    it('returns false when not visible', () => {
      term.visible(false)
      expect(term.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false without bounds', () => {
      ;(term as any)._bounds = null
      expect(term.handleMouse(5, 5, 'press')).toBe(false)
    })

    it('returns false for other actions', () => {
      expect(term.handleMouse(5, 5, 'release')).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(80, 20)
    })

    it('renders empty terminal', () => {
      const term = terminal()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should render prompt on last line
      expect(buffer.get(0, 19).char).toBe('>')
    })

    it('renders output lines', () => {
      const term = terminal()
      term.writeLine('Hello')
      term.writeLine('World')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe('H')
    })

    it('renders with line numbers', () => {
      const term = terminal({ showLineNumbers: true })
      term.writeLine('Test')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Line number should be rendered
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders with timestamps', () => {
      const term = terminal({ showTimestamps: true })
      term.writeLine('Test')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Timestamp should be rendered
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders input line', () => {
      const term = terminal().focus()
      term.insertChar('t')
      term.insertChar('e')
      term.insertChar('s')
      term.insertChar('t')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Input should be on last line after prompt
      expect(buffer.get(2, 19).char).toBe('t')
    })

    it('renders cursor', () => {
      const term = terminal().focus()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Cursor should be rendered at prompt position
      const cursorCell = buffer.get(2, 19)
      expect(cursorCell.bg).toBe(DEFAULT_FG) // Inverted colors
    })

    it('renders scroll indicator', () => {
      const term = terminal()
      for (let i = 0; i < 50; i++) term.writeLine(`Line ${i}`)
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Scroll indicator at right edge
      const indicatorCell = buffer.get(79, 0)
      expect(['│', '█']).toContain(indicatorCell.char)
    })

    it('does not render when not visible', () => {
      const term = terminal()
      term.visible(false)
      term.writeLine('Test')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const term = terminal()
      term.writeLine('Test')
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('renders without input line when disabled', () => {
      const term = terminal({ inputEnabled: false })
      term.writeLine('Test')
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // No prompt on last line
      expect(buffer.get(0, 19).char).not.toBe('>')
    })

    it('hides cursor when showCursor is false', () => {
      const term = terminal({ showCursor: false }).focus()
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Cursor position should not be inverted
      const cursorCell = buffer.get(2, 19)
      expect(cursorCell.bg).toBe(DEFAULT_BG)
    })

    it('renders colored output', () => {
      const term = terminal()
      term.writeLine('Colored', 196)
      ;(term as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      term.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0).fg).toBe(196)
    })
  })
})
