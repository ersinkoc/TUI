/**
 * @oxog/tui - MarkdownViewer Widget Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { markdownviewer } from '../../src/widgets/markdownviewer'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

function createTestBuffer(width: number, height: number) {
  const buffer = createBuffer(width, height)
  fillBuffer(buffer, ' ', DEFAULT_FG, DEFAULT_BG, 0)
  return buffer
}

const sampleMarkdown = `# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

- Item 1
- Item 2
- Item 3

### Code Example

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

> This is a blockquote

1. First
2. Second
3. Third

---

Regular text with \`inline code\` and [a link](https://example.com).
`

describe('MarkdownViewer Widget', () => {
  describe('creation', () => {
    it('creates an empty markdownviewer', () => {
      const md = markdownviewer()
      expect(md).toBeDefined()
      expect(md.type).toBe('markdownviewer')
      expect(md.lineCount).toBe(0)
    })

    it('creates with content', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      expect(md.lineCount).toBeGreaterThan(0)
    })

    it('creates with all props', () => {
      const md = markdownviewer({
        content: '# Test',
        showLineNumbers: true,
        wordWrap: false,
        codeBackground: true,
        headingColors: { 1: 9, 2: 10 }
      })
      expect(md.lineCount).toBe(1)
    })
  })

  describe('content', () => {
    it('sets content via method', () => {
      const md = markdownviewer()
      md.content('# Hello\n\nWorld')
      expect(md.lineCount).toBe(3)
    })

    it('clears content', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      expect(md.lineCount).toBeGreaterThan(0)

      md.clear()
      expect(md.lineCount).toBe(0)
    })

    it('parses headings', () => {
      const md = markdownviewer({ content: '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6' })
      expect(md.lineCount).toBe(6)
    })

    it('parses code blocks', () => {
      const md = markdownviewer({ content: '```\ncode\n```' })
      expect(md.lineCount).toBe(3)
    })

    it('parses blockquotes', () => {
      const md = markdownviewer({ content: '> Quote\n> More' })
      expect(md.lineCount).toBe(2)
    })

    it('parses unordered lists', () => {
      const md = markdownviewer({ content: '- One\n- Two\n* Three\n+ Four' })
      expect(md.lineCount).toBe(4)
    })

    it('parses ordered lists', () => {
      const md = markdownviewer({ content: '1. First\n2. Second\n3. Third' })
      expect(md.lineCount).toBe(3)
    })

    it('parses horizontal rules', () => {
      const md = markdownviewer({ content: '---\n***\n___' })
      expect(md.lineCount).toBe(3)
    })

    it('parses indented code', () => {
      const md = markdownviewer({ content: '    indented code' })
      expect(md.lineCount).toBe(1)
    })

    it('parses inline styles', () => {
      const md = markdownviewer({
        content: '**bold** *italic* `code` [link](url) ~~strike~~'
      })
      expect(md.lineCount).toBe(1)
    })
  })

  describe('navigation', () => {
    let md: ReturnType<typeof markdownviewer>

    beforeEach(() => {
      md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('scrolls to top', () => {
      md.scrollDown(5)
      expect(md.currentLine).toBeGreaterThan(1)

      md.scrollToTop()
      expect(md.currentLine).toBe(1)
    })

    it('scrolls to bottom', () => {
      md.scrollToBottom()
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('scrolls up', () => {
      md.scrollDown(5)
      const line = md.currentLine
      md.scrollUp(2)
      expect(md.currentLine).toBe(line - 2)
    })

    it('scrolls down', () => {
      md.scrollDown(3)
      expect(md.currentLine).toBe(4)
    })

    it('pages up', () => {
      md.scrollToBottom()
      const line = md.currentLine
      md.pageUp()
      expect(md.currentLine).toBeLessThan(line)
    })

    it('pages down', () => {
      md.pageDown()
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('goes to specific line', () => {
      md.goToLine(5)
      expect(md.currentLine).toBe(5)
    })

    it('clamps scroll to valid range', () => {
      md.scrollUp(100)
      expect(md.currentLine).toBe(1)
    })
  })

  describe('search', () => {
    let md: ReturnType<typeof markdownviewer>

    beforeEach(() => {
      md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('searches for text', () => {
      md.search('Item')
      expect(md.matchCount).toBeGreaterThan(0)
    })

    it('goes to next match', () => {
      md.search('Item')
      expect(md.currentMatch).toBe(1)

      md.nextMatch()
      expect(md.currentMatch).toBe(2)
    })

    it('goes to previous match', () => {
      md.search('Item')
      md.nextMatch()
      md.nextMatch()
      const current = md.currentMatch

      md.previousMatch()
      expect(md.currentMatch).toBe(current - 1)
    })

    it('wraps around matches', () => {
      md.search('Item')
      const total = md.matchCount

      // Go to last match
      for (let i = 1; i < total; i++) {
        md.nextMatch()
      }
      expect(md.currentMatch).toBe(total)

      // Next should wrap to first
      md.nextMatch()
      expect(md.currentMatch).toBe(1)
    })

    it('clears search', () => {
      md.search('Item')
      expect(md.matchCount).toBeGreaterThan(0)

      md.clearSearch()
      expect(md.matchCount).toBe(0)
      expect(md.currentMatch).toBe(0)
    })

    it('handles no matches', () => {
      md.search('xyznonexistent')
      expect(md.matchCount).toBe(0)
    })

    it('handles empty query', () => {
      md.search('')
      expect(md.matchCount).toBe(0)
    })

    it('scrolls to match', () => {
      md.goToLine(1)
      md.search('blockquote')
      // Should have scrolled to show the match
      expect(md.currentMatch).toBe(1)
    })
  })

  describe('configuration', () => {
    it('toggles line numbers', () => {
      const md = markdownviewer({ content: '# Test' })
      md.showLineNumbers(true)
      expect(md).toBeDefined()

      md.showLineNumbers(false)
      expect(md).toBeDefined()
    })

    it('toggles word wrap', () => {
      const md = markdownviewer({ content: '# Test' })
      md.wordWrap(true)
      expect(md).toBeDefined()

      md.wordWrap(false)
      expect(md).toBeDefined()
    })

    it('toggles code background', () => {
      const md = markdownviewer({ content: '```\ncode\n```' })
      md.codeBackground(true)
      expect(md).toBeDefined()

      md.codeBackground(false)
      expect(md).toBeDefined()
    })
  })

  describe('focus', () => {
    it('focuses and blurs', () => {
      const md = markdownviewer()
      expect(md.isFocused).toBe(false)

      md.focus()
      expect(md.isFocused).toBe(true)

      md.blur()
      expect(md.isFocused).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    let md: ReturnType<typeof markdownviewer>

    beforeEach(() => {
      md = markdownviewer({ content: sampleMarkdown }).focus()
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('handles up arrow', () => {
      md.scrollDown(5)
      const line = md.currentLine
      ;(md as any).handleKey('up', false)
      expect(md.currentLine).toBe(line - 1)
    })

    it('handles down arrow', () => {
      ;(md as any).handleKey('down', false)
      expect(md.currentLine).toBe(2)
    })

    it('handles k for up', () => {
      md.scrollDown(5)
      const line = md.currentLine
      ;(md as any).handleKey('k', false)
      expect(md.currentLine).toBe(line - 1)
    })

    it('handles j for down', () => {
      ;(md as any).handleKey('j', false)
      expect(md.currentLine).toBe(2)
    })

    it('handles pageup', () => {
      md.scrollToBottom()
      const line = md.currentLine
      ;(md as any).handleKey('pageup', false)
      expect(md.currentLine).toBeLessThan(line)
    })

    it('handles pagedown', () => {
      ;(md as any).handleKey('pagedown', false)
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('handles g for top', () => {
      md.scrollDown(5)
      ;(md as any).handleKey('g', false)
      expect(md.currentLine).toBe(1)
    })

    it('handles G for bottom', () => {
      ;(md as any).handleKey('G', false)
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('handles ctrl+home for top', () => {
      md.scrollDown(5)
      ;(md as any).handleKey('home', true)
      expect(md.currentLine).toBe(1)
    })

    it('handles ctrl+end for bottom', () => {
      ;(md as any).handleKey('end', true)
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('handles n for next match', () => {
      md.search('Item')
      ;(md as any).handleKey('n', false)
      expect(md.currentMatch).toBe(2)
    })

    it('handles N for previous match', () => {
      md.search('Item')
      md.nextMatch()
      md.nextMatch()
      ;(md as any).handleKey('N', false)
      expect(md.currentMatch).toBe(2)
    })

    it('ignores keys when not focused', () => {
      md.blur()
      const result = (md as any).handleKey('down', false)
      expect(result).toBe(false)
    })
  })

  describe('mouse handling', () => {
    let md: ReturnType<typeof markdownviewer>

    beforeEach(() => {
      md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
    })

    it('focuses on click', () => {
      expect(md.isFocused).toBe(false)
      ;(md as any).handleMouse(5, 5, 'press')
      expect(md.isFocused).toBe(true)
    })

    it('scrolls on mouse wheel up', () => {
      md.scrollDown(5)
      const line = md.currentLine
      ;(md as any).handleMouse(5, 5, 'scroll-up')
      expect(md.currentLine).toBeLessThan(line)
    })

    it('scrolls on mouse wheel down', () => {
      ;(md as any).handleMouse(5, 5, 'scroll-down')
      expect(md.currentLine).toBeGreaterThan(1)
    })

    it('ignores when not visible', () => {
      md.visible(false)
      const result = (md as any).handleMouse(5, 5, 'press')
      expect(result).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createTestBuffer>

    beforeEach(() => {
      buffer = createTestBuffer(80, 20)
    })

    it('renders markdown content', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 20 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Should have rendered something
      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders headings', () => {
      const md = markdownviewer({ content: '# Big Heading' })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check heading marker
      expect(buffer.get(0, 0).char).toBe('#')
    })

    it('renders with line numbers', () => {
      const md = markdownviewer({ content: '# Test\nLine 2\nLine 3', showLineNumbers: true })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Line number should be present (format: "1 " for 3-line content = 1 digit + space)
      expect(buffer.get(0, 0).char).toBe('1')
      expect(buffer.get(1, 0).char).toBe(' ')
    })

    it('renders code blocks', () => {
      const md = markdownviewer({ content: '```\ncode here\n```' })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer.get(0, 0)).toBeDefined()
    })

    it('renders blockquotes', () => {
      const md = markdownviewer({ content: '> Quote text' })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Blockquote marker
      expect(buffer.get(0, 0).char).toBe('\u2502')
    })

    it('renders lists', () => {
      const md = markdownviewer({ content: '- Item' })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Bullet marker
      expect(buffer.get(0, 0).char).toBe('\u2022')
    })

    it('renders horizontal rules', () => {
      const md = markdownviewer({ content: '---' })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // HR character
      expect(buffer.get(0, 0).char).toBe('\u2500')
    })

    it('renders scroll indicator', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 5 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Scroll indicator should be present
      expect(buffer.get(79, 0).char).toBe('\u2588')
    })

    it('does not render when not visible', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      md.visible(false)
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should be unchanged
      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render without bounds', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should be unchanged
      expect(buffer.get(0, 0).char).toBe(' ')
    })

    it('does not render with zero dimensions', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      md.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Buffer should be unchanged
      expect(buffer.get(0, 0).char).toBe(' ')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', () => {
      const md = markdownviewer()
        .content('# Test')
        .showLineNumbers(true)
        .wordWrap(false)
        .codeBackground(true)
        .focus()

      expect(md.lineCount).toBe(1)
      expect(md.isFocused).toBe(true)
    })

    it('chains navigation methods', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }

      md.scrollDown(5)
        .scrollUp(2)
        .pageDown()
        .pageUp()
        .scrollToTop()

      expect(md.currentLine).toBe(1)
    })

    it('chains search methods', () => {
      const md = markdownviewer({ content: sampleMarkdown })
      ;(md as any)._bounds = { x: 0, y: 0, width: 80, height: 10 }

      md.search('Item')
        .nextMatch()
        .nextMatch()
        .previousMatch()
        .clearSearch()

      expect(md.matchCount).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty content', () => {
      const md = markdownviewer({ content: '' })
      expect(md.lineCount).toBe(0)
    })

    it('handles only whitespace', () => {
      const md = markdownviewer({ content: '   \n   \n   ' })
      expect(md.lineCount).toBe(3)
    })

    it('handles nested lists', () => {
      const md = markdownviewer({ content: '- Parent\n  - Child\n    - Grandchild' })
      expect(md.lineCount).toBe(3)
    })

    it('handles multiple code blocks', () => {
      const md = markdownviewer({ content: '```\ncode1\n```\n\n```\ncode2\n```' })
      expect(md.lineCount).toBe(7)
    })

    it('handles unclosed code blocks', () => {
      const md = markdownviewer({ content: '```\nunclosed code' })
      expect(md.lineCount).toBe(2)
    })

    it('handles tab-indented code', () => {
      const md = markdownviewer({ content: '\tcode with tab' })
      expect(md.lineCount).toBe(1)
    })

    it('handles mixed inline styles', () => {
      const md = markdownviewer({
        content: '**bold *bold-italic* bold** *italic*'
      })
      expect(md.lineCount).toBe(1)
    })
  })
})
