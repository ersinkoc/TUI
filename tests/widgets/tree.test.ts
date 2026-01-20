/**
 * @oxog/tui - Tree Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { tree } from '../../src/widgets/tree'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'
import type { TreeNodeData } from '../../src/types'

describe('Tree Widget', () => {
  // Factory function to create fresh test data for each test
  const createTestData = (): TreeNodeData[] => [
    {
      label: 'src',
      children: [
        { label: 'index.ts' },
        { label: 'utils.ts' },
        {
          label: 'widgets',
          children: [{ label: 'button.ts' }, { label: 'input.ts' }]
        }
      ]
    },
    {
      label: 'tests',
      children: [{ label: 'index.test.ts' }]
    },
    { label: 'package.json' }
  ]

  describe('factory function', () => {
    it('should create tree node', () => {
      const t = tree()
      expect(t).toBeDefined()
      expect(t.type).toBe('tree')
    })

    it('should create tree with initial data via props', () => {
      const t = tree({ data: createTestData() })
      expect(t.selectedNode?.label).toBe('src')
    })

    it('should create tree with indent via props', () => {
      const t = tree({ indent: 4 })
      expect(t).toBeDefined()
    })

    it('should create tree with guides via props', () => {
      const t = tree({ guides: false })
      expect(t).toBeDefined()
    })

    it('should create tree with dimensions via props', () => {
      const t = tree({ width: 40, height: 20 })
      expect(t).toBeDefined()
    })
  })

  describe('data()', () => {
    it('should set data', () => {
      const t = tree().data(createTestData())
      expect(t.selectedNode?.label).toBe('src')
    })

    it('should return this for chaining', () => {
      const t = tree()
      expect(t.data(createTestData())).toBe(t)
    })

    it('should reset selection to first item', () => {
      const t = tree().data(createTestData())
      expect(t.selectedPath).toEqual([0])
    })

    it('should handle empty data', () => {
      const t = tree().data([])
      expect(t.selectedPath).toEqual([])
      expect(t.selectedNode).toBeUndefined()
    })

    it('should mark dirty when data changes', () => {
      const t = tree()
      t.clearDirty()
      t.data(createTestData())
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('indent()', () => {
    it('should set indent', () => {
      const t = tree().indent(4)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = tree()
      expect(t.indent(4)).toBe(t)
    })

    it('should mark dirty when indent changes', () => {
      const t = tree()
      t.clearDirty()
      t.indent(3)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('guides()', () => {
    it('should enable guides', () => {
      const t = tree().guides(true)
      expect(t).toBeDefined()
    })

    it('should disable guides', () => {
      const t = tree().guides(false)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = tree()
      expect(t.guides(true)).toBe(t)
    })

    it('should mark dirty when guides changes', () => {
      const t = tree()
      t.clearDirty()
      t.guides(false)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('width() and height()', () => {
    it('should set width', () => {
      const t = tree().width(40)
      expect(t).toBeDefined()
    })

    it('should set height', () => {
      const t = tree().height(20)
      expect(t).toBeDefined()
    })

    it('should return this for chaining', () => {
      const t = tree()
      expect(t.width(40)).toBe(t)
      expect(t.height(20)).toBe(t)
    })

    it('should accept percentage dimensions', () => {
      const t = tree().width('100%').height('50%')
      expect(t).toBeDefined()
    })

    it('should mark dirty when dimensions change', () => {
      const t = tree()
      t.clearDirty()
      t.width(60)
      expect((t as any)._dirty).toBe(true)

      t.clearDirty()
      t.height(15)
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('expand()', () => {
    it('should expand a node', () => {
      const t = tree().data(createTestData())
      t.expand([0])
      expect((t as any)._expandedPaths.has('0')).toBe(true)
    })

    it('should return this for chaining', () => {
      const t = tree().data(createTestData())
      expect(t.expand([0])).toBe(t)
    })

    it('should not re-expand already expanded node', () => {
      const handler = vi.fn()
      const t = tree().data(createTestData()).onToggle(handler)
      t.expand([0])
      t.expand([0])
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should emit onToggle event', () => {
      const handler = vi.fn()
      const t = tree().data(createTestData()).onToggle(handler)
      t.expand([0])
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].label).toBe('src')
      expect(handler.mock.calls[0][1]).toEqual([0])
      expect(handler.mock.calls[0][2]).toBe(true)
    })

    it('should mark dirty when expanding', () => {
      const t = tree().data(createTestData())
      t.clearDirty()
      t.expand([0])
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('collapse()', () => {
    it('should collapse a node', () => {
      const t = tree().data(createTestData())
      t.expand([0])
      t.collapse([0])
      expect((t as any)._expandedPaths.has('0')).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = tree().data(createTestData())
      expect(t.collapse([0])).toBe(t)
    })

    it('should not re-collapse already collapsed node', () => {
      const handler = vi.fn()
      const t = tree().data(createTestData()).onToggle(handler)
      t.collapse([0])
      expect(handler).not.toHaveBeenCalled()
    })

    it('should emit onToggle event', () => {
      const handler = vi.fn()
      const t = tree().data(createTestData()).onToggle(handler).expand([0])
      handler.mockClear()
      t.collapse([0])
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].label).toBe('src')
      expect(handler.mock.calls[0][2]).toBe(false)
    })

    it('should mark dirty when collapsing', () => {
      const t = tree().data(createTestData()).expand([0])
      t.clearDirty()
      t.collapse([0])
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('toggle()', () => {
    it('should expand collapsed node', () => {
      const t = tree().data(createTestData())
      t.toggle([0])
      expect((t as any)._expandedPaths.has('0')).toBe(true)
    })

    it('should collapse expanded node', () => {
      const t = tree().data(createTestData()).expand([0])
      t.toggle([0])
      expect((t as any)._expandedPaths.has('0')).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = tree().data(createTestData())
      expect(t.toggle([0])).toBe(t)
    })
  })

  describe('expandAll()', () => {
    it('should expand all nodes', () => {
      const t = tree().data(createTestData())
      t.expandAll()
      expect((t as any)._expandedPaths.has('0')).toBe(true)
      expect((t as any)._expandedPaths.has('1')).toBe(true)
      expect((t as any)._expandedPaths.has('0,2')).toBe(true)
    })

    it('should return this for chaining', () => {
      const t = tree().data(createTestData())
      expect(t.expandAll()).toBe(t)
    })

    it('should mark dirty when expanding all', () => {
      const t = tree().data(createTestData())
      t.clearDirty()
      t.expandAll()
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('collapseAll()', () => {
    it('should collapse all nodes', () => {
      const t = tree().data(createTestData()).expandAll()
      t.collapseAll()
      expect((t as any)._expandedPaths.size).toBe(0)
    })

    it('should return this for chaining', () => {
      const t = tree().data(createTestData())
      expect(t.collapseAll()).toBe(t)
    })

    it('should mark dirty when collapsing all', () => {
      const t = tree().data(createTestData()).expandAll()
      t.clearDirty()
      t.collapseAll()
      expect((t as any)._dirty).toBe(true)
    })
  })

  describe('selectedPath and selectedNode', () => {
    it('should return selected path', () => {
      const t = tree().data(createTestData())
      expect(t.selectedPath).toEqual([0])
    })

    it('should return selected node', () => {
      const t = tree().data(createTestData())
      expect(t.selectedNode?.label).toBe('src')
    })

    it('should return copy of path (not reference)', () => {
      const t = tree().data(createTestData())
      const path1 = t.selectedPath
      const path2 = t.selectedPath
      expect(path1).not.toBe(path2)
      expect(path1).toEqual(path2)
    })

    it('should return undefined for empty tree', () => {
      const t = tree()
      expect(t.selectedNode).toBeUndefined()
    })
  })

  describe('focus() and blur()', () => {
    it('should focus the tree', () => {
      const t = tree()
      t.focus()
      expect(t.isFocused).toBe(true)
    })

    it('should blur the tree', () => {
      const t = tree()
      t.focus()
      t.blur()
      expect(t.isFocused).toBe(false)
    })

    it('should return this for chaining', () => {
      const t = tree()
      expect(t.focus()).toBe(t)
      expect(t.blur()).toBe(t)
    })

    it('should mark dirty when focus changes', () => {
      const t = tree()
      t.clearDirty()
      t.focus()
      expect((t as any)._dirty).toBe(true)
    })

    it('should not re-trigger focus if already focused', () => {
      const handler = vi.fn()
      const t = tree().onFocus(handler)
      t.focus()
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not re-trigger blur if already blurred', () => {
      const handler = vi.fn()
      const t = tree().onBlur(handler)
      t.blur()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('onSelect() should return this for chaining', () => {
      const t = tree()
      expect(t.onSelect(() => {})).toBe(t)
    })

    it('onToggle() should return this for chaining', () => {
      const t = tree()
      expect(t.onToggle(() => {})).toBe(t)
    })

    it('onFocus() should be called when focused', () => {
      const handler = vi.fn()
      const t = tree().onFocus(handler)
      t.focus()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('onBlur() should be called when blurred', () => {
      const handler = vi.fn()
      const t = tree().onBlur(handler)
      t.focus()
      t.blur()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support multiple onToggle handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = tree().data(createTestData()).onToggle(handler1).onToggle(handler2)
      t.expand([0])
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should support multiple onFocus handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const t = tree().onFocus(handler1).onFocus(handler2)
      t.focus()
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('render()', () => {
    it('should render to buffer', () => {
      const t = tree().data(createTestData())
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // First row should have "src"
      let text = ''
      for (let x = 0; x < 10; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) text += cell.char
      }
      expect(text).toContain('src')
    })

    it('should not render when not visible', () => {
      const t = tree().data(createTestData()).visible(false)
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      const cell = buffer.get(0, 0)
      expect(cell?.char).toBe(' ')
    })

    it('should not render with zero dimensions', () => {
      const t = tree().data(createTestData())
      ;(t as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(40, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should render expanded nodes', () => {
      const t = tree().data(createTestData()).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Second row should have children
      let text = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) text += cell.char
      }
      expect(text).toContain('index.ts')
    })

    it('should render with guides', () => {
      const t = tree().data(createTestData()).guides(true).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check for guide characters
      let text = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) text += cell.char
      }
      // Should contain tree guide characters
      expect(text.length).toBeGreaterThan(0)
    })

    it('should render without guides', () => {
      const t = tree().data(createTestData()).guides(false).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check that rendering completes without error
      let text = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) text += cell.char
      }
      expect(text).toContain('index.ts')
    })

    it('should handle empty data', () => {
      const t = tree().data([])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      expect(() => t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })).not.toThrow()
    })

    it('should scroll down when selected item is below visible area', () => {
      // Create a tree with many items to enable scrolling
      const manyItems: TreeNodeData[] = []
      for (let i = 0; i < 10; i++) {
        manyItems.push({ label: `Item ${i}` })
      }
      const t = tree().data(manyItems)
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 3 }
      // Set selection to item 5 which is beyond visible area (height 3)
      ;(t as any)._selectedPath = [5]

      const buffer = createBuffer(40, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Scroll should have adjusted to show selected item
      // Check that scroll offset was updated
      expect((t as any)._scrollOffset).toBeGreaterThan(0)
    })

    it('should scroll up when selected item is above visible area', () => {
      // Create a tree with many items
      const manyItems: TreeNodeData[] = []
      for (let i = 0; i < 10; i++) {
        manyItems.push({ label: `Item ${i}` })
      }
      const t = tree().data(manyItems)
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 3 }
      // Set scroll offset to 5 (showing items 5-7)
      ;(t as any)._scrollOffset = 5
      // Set selection to item 2 which is above visible area
      ;(t as any)._selectedPath = [2]

      const buffer = createBuffer(40, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Scroll should have adjusted up to show selected item
      expect((t as any)._scrollOffset).toBe(2)
    })

    it('should truncate long node labels when wider than available width', () => {
      const longData: TreeNodeData[] = [
        { label: 'This is a very long label that exceeds the available width' }
      ]
      const t = tree().data(longData)
      ;(t as any)._bounds = { x: 0, y: 0, width: 15, height: 5 }

      const buffer = createBuffer(20, 5)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Label should be truncated to fit in width (15)
      let text = ''
      for (let x = 0; x < 15; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) text += cell.char
      }
      expect(text.length).toBe(15)
    })

    it('should render guides with empty space for last items', () => {
      // Create a tree where first item has children and is NOT the last
      const dataWithMultipleRoots: TreeNodeData[] = [
        {
          label: 'First',
          children: [{ label: 'Child 1' }, { label: 'Child 2' }]
        },
        { label: 'Second' }
      ]
      const t = tree().data(dataWithMultipleRoots).guides(true).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // The tree should render correctly with guides
      // Check that rendering completes and contains expected content
      let firstRowText = ''
      for (let x = 0; x < 15; x++) {
        const cell = buffer.get(x, 0)
        if (cell?.char) firstRowText += cell.char
      }
      expect(firstRowText).toContain('First')
    })

    it('should render └─ guide for last child in expanded parent', () => {
      // Create a tree where we can verify the last child guide character
      const dataWithLastChild: TreeNodeData[] = [
        {
          label: 'Parent',
          children: [
            { label: 'First Child' },
            { label: 'Last Child' } // This is the LAST child, should use └─
          ]
        }
      ]
      const t = tree().data(dataWithLastChild).guides(true).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Row 0: Parent (▶ or ▼)
      // Row 1: ├─ First Child (not last)
      // Row 2: └─ Last Child (is last, should use └─ character)

      // Check row 2 for the └─ character (unicode \u2514\u2500)
      let row2Text = ''
      for (let x = 0; x < 15; x++) {
        const cell = buffer.get(x, 2)
        if (cell?.char) row2Text += cell.char
      }
      // Should contain the last child guide: └─ (unicode chars: \u2514\u2500)
      expect(row2Text).toContain('\u2514\u2500')
      expect(row2Text).toContain('Last Child')
    })

    it('should render ├─ guide for non-last child in expanded parent', () => {
      // Verify non-last children use ├─
      const dataWithChildren: TreeNodeData[] = [
        {
          label: 'Parent',
          children: [{ label: 'First Child' }, { label: 'Second Child' }, { label: 'Third Child' }]
        }
      ]
      const t = tree().data(dataWithChildren).guides(true).expand([0])
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Row 1: ├─ First Child (not last)
      let row1Text = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 1)
        if (cell?.char) row1Text += cell.char
      }
      // Should contain the branch guide: ├─ (unicode chars: \u251c\u2500)
      expect(row1Text).toContain('\u251c\u2500')
      expect(row1Text).toContain('First Child')
    })

    it('should render vertical guide │ for deep nesting with non-last ancestors', () => {
      // The vertical guide │ appears when an ancestor at lower depth is not last sibling
      // and we're rendering at depth >= 3 (since the immediate parent's guide gets replaced)
      const dataWithDeepNesting: TreeNodeData[] = [
        {
          label: 'Root1',
          children: [
            {
              label: 'Parent',
              children: [
                {
                  label: 'Child',
                  children: [
                    { label: 'Grandchild' } // depth = 3
                  ]
                }
              ]
            }
          ]
        },
        { label: 'Root2' } // This makes Root1 "not last"
      ]
      const t = tree()
        .data(dataWithDeepNesting)
        .guides(true)
        .expand([0]) // expand Root1
        .expand([0, 0]) // expand Parent
        .expand([0, 0, 0]) // expand Child
      ;(t as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      const buffer = createBuffer(40, 10)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

      // Check row 3 (Grandchild at depth 3) for the vertical bar
      let row3Text = ''
      for (let x = 0; x < 20; x++) {
        const cell = buffer.get(x, 3)
        if (cell?.char) row3Text += cell.char
      }
      // Should contain vertical bar for continuation from Root1: │ (\u2502)
      expect(row3Text).toContain('\u2502')
      expect(row3Text).toContain('Grandchild')
    })
  })

  describe('chainable API', () => {
    it('should support full chaining', () => {
      const result = tree()
        .data(createTestData())
        .indent(3)
        .guides(true)
        .width(50)
        .height(20)
        .expand([0])
        .onSelect(() => {})
        .onToggle(() => {})
        .onFocus(() => {})
        .onBlur(() => {})
        .focus()

      expect(result.isFocused).toBe(true)
      expect((result as any)._expandedPaths.has('0')).toBe(true)
    })
  })

  describe('visibility', () => {
    it('should be visible by default', () => {
      const t = tree()
      expect(t.isVisible).toBe(true)
    })

    it('should be hideable', () => {
      const t = tree().visible(false)
      expect(t.isVisible).toBe(false)
    })

    it('should be showable after hiding', () => {
      const t = tree().visible(false).visible(true)
      expect(t.isVisible).toBe(true)
    })
  })

  describe('generic type support', () => {
    interface FileData {
      path: string
      size: number
    }

    it('should support generic type for value', () => {
      const data: TreeNodeData<FileData>[] = [
        {
          label: 'main.ts',
          value: { path: '/src/main.ts', size: 1024 }
        }
      ]
      const t = tree<FileData>().data(data)
      expect(t.selectedNode?.value?.path).toBe('/src/main.ts')
    })

    it('should type check onSelect handler', () => {
      const data: TreeNodeData<FileData>[] = [
        {
          label: 'main.ts',
          value: { path: '/src/main.ts', size: 1024 }
        }
      ]
      const handler = vi.fn()
      tree<FileData>().data(data).onSelect(handler)
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
