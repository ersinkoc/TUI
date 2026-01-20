/**
 * @oxog/tui - Node System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  BaseNode,
  ContainerNode,
  LeafNode,
  generateId,
  resetIdCounter,
  findNodeById,
  findNodesByType,
  traverseDepthFirst,
  traverseBreadthFirst,
  getAncestors,
  getDescendants,
  isAncestorOf,
  getCommonAncestor,
  findNodeAtPosition
} from '../../src/widgets/node'
import { createBuffer } from '../../src/core/buffer'
import type { Buffer, CellStyle } from '../../src/types'

// Mock implementations for testing
class MockContainerNode extends ContainerNode {
  readonly type = 'mock-container'

  render(buffer: Buffer, style: CellStyle): void {
    // No-op for testing
  }
}

class MockLeafNode extends LeafNode {
  readonly type = 'mock-leaf'

  render(buffer: Buffer, style: CellStyle): void {
    // No-op for testing
  }
}

describe('Node System', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('generateId()', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      const id3 = generateId()

      expect(id1).toBe('node_1')
      expect(id2).toBe('node_2')
      expect(id3).toBe('node_3')
    })

    it('should increment counter', () => {
      expect(generateId()).toBe('node_1')
      expect(generateId()).toBe('node_2')
    })
  })

  describe('resetIdCounter()', () => {
    it('should reset the ID counter', () => {
      generateId()
      generateId()
      resetIdCounter()
      expect(generateId()).toBe('node_1')
    })
  })

  describe('BaseNode', () => {
    describe('constructor', () => {
      it('should generate unique ID', () => {
        const node1 = new MockContainerNode()
        const node2 = new MockContainerNode()

        expect(node1.id).toBe('node_1')
        expect(node2.id).toBe('node_2')
      })

      it('should initialize with default values', () => {
        const node = new MockContainerNode()

        expect(node.parent).toBeNull()
        expect(node.children).toEqual([])
        expect(node.isVisible).toBe(true)
        expect(node.bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
        expect(node._dirty).toBe(true)
        expect(node._layoutDirty).toBe(true)
      })
    })

    describe('parent getter', () => {
      it('should return null when no parent', () => {
        const node = new MockContainerNode()
        expect(node.parent).toBeNull()
      })

      it('should return parent when added to container', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        expect(child.parent).toBe(parent)
      })
    })

    describe('children getter', () => {
      it('should return children array', () => {
        const parent = new MockContainerNode()
        const child1 = new MockContainerNode()
        const child2 = new MockContainerNode()

        parent.add(child1).add(child2)
        expect(parent.children).toEqual([child1, child2])
      })
    })

    describe('isVisible getter', () => {
      it('should be true by default', () => {
        const node = new MockContainerNode()
        expect(node.isVisible).toBe(true)
      })
    })

    describe('bounds getter', () => {
      it('should return a copy of bounds', () => {
        const node = new MockContainerNode()
        node._bounds = { x: 10, y: 20, width: 100, height: 50 }

        const bounds = node.bounds
        expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 })

        // Modifying returned bounds should not affect internal bounds
        bounds.x = 999
        expect(node.bounds.x).toBe(10)
      })
    })

    describe('visible()', () => {
      it('should set visibility to true', () => {
        const node = new MockContainerNode()
        node._visible = false
        node.visible(true)
        expect(node.isVisible).toBe(true)
      })

      it('should set visibility to false', () => {
        const node = new MockContainerNode()
        node.visible(false)
        expect(node.isVisible).toBe(false)
      })

      it('should mark dirty when visibility changes', () => {
        const node = new MockContainerNode()
        node.clearDirty()
        node.visible(false)
        expect(node._dirty).toBe(true)
      })

      it('should not mark dirty when visibility stays the same', () => {
        const node = new MockContainerNode()
        node.clearDirty()
        node.visible(true) // Already true
        expect(node._dirty).toBe(false)
      })

      it('should return this for chaining', () => {
        const node = new MockContainerNode()
        expect(node.visible(true)).toBe(node)
      })
    })

    describe('markDirty()', () => {
      it('should set dirty flag', () => {
        const node = new MockContainerNode()
        node._dirty = false
        node.markDirty()
        expect(node._dirty).toBe(true)
      })

      it('should set layoutDirty flag', () => {
        const node = new MockContainerNode()
        node._layoutDirty = false
        node.markDirty()
        expect(node._layoutDirty).toBe(true)
      })

      it('should propagate to parent', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        parent._dirty = false
        child.markDirty()
        expect(parent._dirty).toBe(true)
      })
    })

    describe('clearDirty()', () => {
      it('should clear dirty flag', () => {
        const node = new MockContainerNode()
        node.clearDirty()
        expect(node._dirty).toBe(false)
      })
    })

    describe('clearLayoutDirty()', () => {
      it('should clear layoutDirty flag', () => {
        const node = new MockContainerNode()
        node.clearLayoutDirty()
        expect(node._layoutDirty).toBe(false)
      })
    })
  })

  describe('ContainerNode', () => {
    describe('add()', () => {
      it('should add child', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        expect(parent.children).toContain(child)
        expect(child.parent).toBe(parent)
      })

      it('should remove child from previous parent', () => {
        const parent1 = new MockContainerNode()
        const parent2 = new MockContainerNode()
        const child = new MockContainerNode()

        parent1.add(child)
        expect(parent1.children).toContain(child)

        parent2.add(child)
        expect(parent1.children).not.toContain(child)
        expect(parent2.children).toContain(child)
        expect(child.parent).toBe(parent2)
      })

      it('should mark dirty when adding', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.clearDirty()
        parent.add(child)
        expect(parent._dirty).toBe(true)
      })

      it('should return this for chaining', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()
        expect(parent.add(child)).toBe(parent)
      })

      it('should handle non-BaseNode gracefully', () => {
        const parent = new MockContainerNode()
        const fakeNode = { id: 'fake', type: 'fake' } as any

        parent.add(fakeNode)
        expect(parent.children).toEqual([])
      })
    })

    describe('remove()', () => {
      it('should remove child', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        parent.remove(child)
        expect(parent.children).not.toContain(child)
        expect(child.parent).toBeNull()
      })

      it('should mark dirty when removing', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        parent.clearDirty()
        parent.remove(child)
        expect(parent._dirty).toBe(true)
      })

      it('should return this for chaining', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()
        parent.add(child)
        expect(parent.remove(child)).toBe(parent)
      })

      it('should handle non-existing child', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.clearDirty()
        parent.remove(child)
        expect(parent._dirty).toBe(false)
      })

      it('should handle non-BaseNode gracefully', () => {
        const parent = new MockContainerNode()
        const fakeNode = { id: 'fake', type: 'fake' } as any

        parent.remove(fakeNode)
        expect(parent.children).toEqual([])
      })
    })

    describe('clear()', () => {
      it('should remove all children', () => {
        const parent = new MockContainerNode()
        const child1 = new MockContainerNode()
        const child2 = new MockContainerNode()

        parent.add(child1).add(child2)
        parent.clear()
        expect(parent.children).toEqual([])
        expect(child1.parent).toBeNull()
        expect(child2.parent).toBeNull()
      })

      it('should mark dirty when clearing', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.add(child)
        parent.clearDirty()
        parent.clear()
        expect(parent._dirty).toBe(true)
      })

      it('should return this for chaining', () => {
        const parent = new MockContainerNode()
        expect(parent.clear()).toBe(parent)
      })
    })

    describe('insertAt()', () => {
      it('should insert at specific index', () => {
        const parent = new MockContainerNode()
        const child1 = new MockContainerNode()
        const child2 = new MockContainerNode()
        const child3 = new MockContainerNode()

        parent.add(child1).add(child3)
        parent.insertAt(1, child2)
        expect(parent.children).toEqual([child1, child2, child3])
        expect(child2.parent).toBe(parent)
      })

      it('should remove from previous parent', () => {
        const parent1 = new MockContainerNode()
        const parent2 = new MockContainerNode()
        const child = new MockContainerNode()

        parent1.add(child)
        parent2.insertAt(0, child)
        expect(parent1.children).not.toContain(child)
        expect(parent2.children).toContain(child)
      })

      it('should mark dirty when inserting', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()

        parent.clearDirty()
        parent.insertAt(0, child)
        expect(parent._dirty).toBe(true)
      })

      it('should return this for chaining', () => {
        const parent = new MockContainerNode()
        const child = new MockContainerNode()
        expect(parent.insertAt(0, child)).toBe(parent)
      })

      it('should handle non-BaseNode gracefully', () => {
        const parent = new MockContainerNode()
        const fakeNode = { id: 'fake', type: 'fake' } as any

        parent.insertAt(0, fakeNode)
        expect(parent.children).toEqual([])
      })
    })

    describe('getChild()', () => {
      it('should return child at index', () => {
        const parent = new MockContainerNode()
        const child1 = new MockContainerNode()
        const child2 = new MockContainerNode()

        parent.add(child1).add(child2)
        expect(parent.getChild(0)).toBe(child1)
        expect(parent.getChild(1)).toBe(child2)
      })

      it('should return undefined for invalid index', () => {
        const parent = new MockContainerNode()
        expect(parent.getChild(0)).toBeUndefined()
        expect(parent.getChild(-1)).toBeUndefined()
      })
    })

    describe('childCount getter', () => {
      it('should return number of children', () => {
        const parent = new MockContainerNode()
        expect(parent.childCount).toBe(0)

        parent.add(new MockContainerNode())
        expect(parent.childCount).toBe(1)

        parent.add(new MockContainerNode())
        expect(parent.childCount).toBe(2)
      })
    })

    describe('hasChildren getter', () => {
      it('should return false when no children', () => {
        const parent = new MockContainerNode()
        expect(parent.hasChildren).toBe(false)
      })

      it('should return true when has children', () => {
        const parent = new MockContainerNode()
        parent.add(new MockContainerNode())
        expect(parent.hasChildren).toBe(true)
      })
    })
  })

  describe('LeafNode', () => {
    describe('children getter', () => {
      it('should always return empty array', () => {
        const leaf = new MockLeafNode()
        expect(leaf.children).toEqual([])
      })
    })
  })

  describe('findNodeById()', () => {
    it('should find root node', () => {
      const root = new MockContainerNode()
      expect(findNodeById(root, root.id)).toBe(root)
    })

    it('should find child node', () => {
      const root = new MockContainerNode()
      const child = new MockContainerNode()
      root.add(child)

      expect(findNodeById(root, child.id)).toBe(child)
    })

    it('should find deeply nested node', () => {
      const root = new MockContainerNode()
      const child = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child)
      child.add(grandchild)

      expect(findNodeById(root, grandchild.id)).toBe(grandchild)
    })

    it('should return undefined for non-existing ID', () => {
      const root = new MockContainerNode()
      expect(findNodeById(root, 'non_existing')).toBeUndefined()
    })
  })

  describe('findNodesByType()', () => {
    it('should find nodes by type', () => {
      const container = new MockContainerNode()
      const leaf1 = new MockLeafNode()
      const leaf2 = new MockLeafNode()

      container.add(leaf1).add(leaf2)

      const leaves = findNodesByType(container, 'mock-leaf')
      expect(leaves).toEqual([leaf1, leaf2])
    })

    it('should include root if matches', () => {
      const container = new MockContainerNode()
      const found = findNodesByType(container, 'mock-container')
      expect(found).toContain(container)
    })

    it('should return empty array if no matches', () => {
      const container = new MockContainerNode()
      const found = findNodesByType(container, 'non-existing')
      expect(found).toEqual([])
    })
  })

  describe('traverseDepthFirst()', () => {
    it('should visit nodes depth-first', () => {
      const root = new MockContainerNode()
      const child1 = new MockContainerNode()
      const child2 = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child1).add(child2)
      child1.add(grandchild)

      const visited: string[] = []
      traverseDepthFirst(root, node => visited.push(node.id))

      expect(visited).toEqual([root.id, child1.id, grandchild.id, child2.id])
    })
  })

  describe('traverseBreadthFirst()', () => {
    it('should visit nodes breadth-first', () => {
      const root = new MockContainerNode()
      const child1 = new MockContainerNode()
      const child2 = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child1).add(child2)
      child1.add(grandchild)

      const visited: string[] = []
      traverseBreadthFirst(root, node => visited.push(node.id))

      expect(visited).toEqual([root.id, child1.id, child2.id, grandchild.id])
    })
  })

  describe('getAncestors()', () => {
    it('should return empty array for root', () => {
      const root = new MockContainerNode()
      expect(getAncestors(root)).toEqual([])
    })

    it('should return ancestors in order (parent first)', () => {
      const root = new MockContainerNode()
      const child = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child)
      child.add(grandchild)

      const ancestors = getAncestors(grandchild)
      expect(ancestors).toEqual([child, root])
    })
  })

  describe('getDescendants()', () => {
    it('should return empty array for leaf', () => {
      const leaf = new MockLeafNode()
      expect(getDescendants(leaf)).toEqual([])
    })

    it('should return all descendants depth-first', () => {
      const root = new MockContainerNode()
      const child1 = new MockContainerNode()
      const child2 = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child1).add(child2)
      child1.add(grandchild)

      const descendants = getDescendants(root)
      expect(descendants).toEqual([child1, grandchild, child2])
    })
  })

  describe('isAncestorOf()', () => {
    it('should return true for direct parent', () => {
      const parent = new MockContainerNode()
      const child = new MockContainerNode()
      parent.add(child)

      expect(isAncestorOf(parent, child)).toBe(true)
    })

    it('should return true for grandparent', () => {
      const root = new MockContainerNode()
      const child = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child)
      child.add(grandchild)

      expect(isAncestorOf(root, grandchild)).toBe(true)
    })

    it('should return false for non-ancestor', () => {
      const root = new MockContainerNode()
      const sibling = new MockContainerNode()

      expect(isAncestorOf(root, sibling)).toBe(false)
    })

    it('should return false for self', () => {
      const node = new MockContainerNode()
      expect(isAncestorOf(node, node)).toBe(false)
    })
  })

  describe('getCommonAncestor()', () => {
    it('should return common parent', () => {
      const root = new MockContainerNode()
      const child1 = new MockContainerNode()
      const child2 = new MockContainerNode()

      root.add(child1).add(child2)

      expect(getCommonAncestor(child1, child2)).toBe(root)
    })

    it('should return ancestor when one is ancestor of other', () => {
      const root = new MockContainerNode()
      const child = new MockContainerNode()
      const grandchild = new MockContainerNode()

      root.add(child)
      child.add(grandchild)

      expect(getCommonAncestor(child, grandchild)).toBe(child)
    })

    it('should return self when same node', () => {
      const node = new MockContainerNode()
      expect(getCommonAncestor(node, node)).toBe(node)
    })

    it('should return undefined for unrelated nodes', () => {
      const node1 = new MockContainerNode()
      const node2 = new MockContainerNode()

      expect(getCommonAncestor(node1, node2)).toBeUndefined()
    })
  })

  describe('findNodeAtPosition()', () => {
    it('should find node at position', () => {
      const root = new MockContainerNode()
      root._bounds = { x: 0, y: 0, width: 100, height: 100 }

      expect(findNodeAtPosition(root, 50, 50)).toBe(root)
    })

    it('should return undefined when outside bounds', () => {
      const root = new MockContainerNode()
      root._bounds = { x: 10, y: 10, width: 50, height: 50 }

      expect(findNodeAtPosition(root, 0, 0)).toBeUndefined()
      expect(findNodeAtPosition(root, 100, 100)).toBeUndefined()
    })

    it('should find child at position', () => {
      const root = new MockContainerNode()
      root._bounds = { x: 0, y: 0, width: 100, height: 100 }

      const child = new MockContainerNode()
      child._bounds = { x: 20, y: 20, width: 40, height: 40 }

      root.add(child)

      expect(findNodeAtPosition(root, 30, 30)).toBe(child)
    })

    it('should skip hidden children', () => {
      const root = new MockContainerNode()
      root._bounds = { x: 0, y: 0, width: 100, height: 100 }

      const child = new MockContainerNode()
      child._bounds = { x: 20, y: 20, width: 40, height: 40 }
      child.visible(false)

      root.add(child)

      expect(findNodeAtPosition(root, 30, 30)).toBe(root)
    })

    it('should return last child for overlapping (z-order)', () => {
      const root = new MockContainerNode()
      root._bounds = { x: 0, y: 0, width: 100, height: 100 }

      const child1 = new MockContainerNode()
      child1._bounds = { x: 10, y: 10, width: 50, height: 50 }

      const child2 = new MockContainerNode()
      child2._bounds = { x: 10, y: 10, width: 50, height: 50 }

      root.add(child1).add(child2)

      // child2 was added last, should be on top
      expect(findNodeAtPosition(root, 20, 20)).toBe(child2)
    })
  })
})
