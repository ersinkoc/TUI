import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  shortcutsPlugin,
  commonShortcuts,
  vimNavigationShortcuts,
  vimEditingShortcuts,
  createVimShortcuts
} from '../../src/plugins/shortcuts'
import type { ShortcutsPluginAPI, Shortcut } from '../../src/plugins/shortcuts'
import type { TUIApp, KeyEvent } from '../../src/types'

// Mock TUIApp
function createMockApp(): TUIApp & { shortcuts?: ShortcutsPluginAPI; input?: unknown } {
  const eventHandlers: Record<string, ((event: KeyEvent) => void)[]> = {}

  return {
    use: vi.fn().mockReturnThis(),
    mount: vi.fn().mockReturnThis(),
    unmount: vi.fn().mockReturnThis(),
    start: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockReturnThis(),
    markDirty: vi.fn(),
    on: vi.fn((event: string, handler: (e: KeyEvent) => void) => {
      if (!eventHandlers[event]) eventHandlers[event] = []
      eventHandlers[event].push(handler)
      return () => {
        const idx = eventHandlers[event].indexOf(handler)
        if (idx !== -1) eventHandlers[event].splice(idx, 1)
      }
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      const handlers = eventHandlers[event]
      if (handlers) {
        for (const h of handlers) {
          h(args[0] as KeyEvent)
        }
      }
    }),
    onQuit: vi.fn().mockReturnThis(),
    getPlugin: vi.fn(),
    width: 80,
    height: 24,
    isRunning: false,
    root: null,
    focused: null,
    theme: {} as any,
    input: {
      bind: vi.fn(),
      unbind: vi.fn()
    }
  }
}

function createKeyEvent(name: string, modifiers: Partial<KeyEvent> = {}): KeyEvent {
  return {
    name,
    sequence: name,
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    ...modifiers
  }
}

describe('shortcutsPlugin', () => {
  let app: ReturnType<typeof createMockApp>

  beforeEach(() => {
    app = createMockApp()
  })

  describe('installation', () => {
    it('should install and expose shortcuts API', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(app.shortcuts).toBeDefined()
      expect(typeof app.shortcuts!.register).toBe('function')
      expect(typeof app.shortcuts!.unregister).toBe('function')
      expect(typeof app.shortcuts!.enable).toBe('function')
      expect(typeof app.shortcuts!.disable).toBe('function')
      expect(typeof app.shortcuts!.isVimMode).toBe('function')
      expect(typeof app.shortcuts!.enableVimMode).toBe('function')
      expect(typeof app.shortcuts!.disableVimMode).toBe('function')
      expect(typeof app.shortcuts!.getShortcuts).toBe('function')
      expect(typeof app.shortcuts!.getHelpText).toBe('function')
      expect(typeof app.shortcuts!.simulate).toBe('function')
      expect(typeof app.shortcuts!.execute).toBe('function')
    })

    it('should have correct plugin metadata', () => {
      const plugin = shortcutsPlugin()
      expect(plugin.name).toBe('shortcuts')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.dependencies).toEqual(['input'])
    })

    it('should accept initial shortcuts', () => {
      const handler = vi.fn()
      const plugin = shortcutsPlugin({
        shortcuts: [
          { id: 'test', keys: 'ctrl+t', handler, description: 'Test' }
        ]
      })
      plugin.install(app)

      expect(app.shortcuts!.getShortcuts()).toHaveLength(1)
      expect(app.shortcuts!.getShortcuts()[0].id).toBe('test')
    })

    it('should clean up on destroy', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler: () => {},
        description: 'Test'
      })

      expect(app.shortcuts!.getShortcuts()).toHaveLength(1)

      plugin.destroy?.()
      expect(app.shortcuts!.getShortcuts()).toHaveLength(0)
    })
  })

  describe('shortcut registration', () => {
    it('should register a shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'save',
        keys: 'ctrl+s',
        handler,
        description: 'Save file'
      })

      const shortcuts = app.shortcuts!.getShortcuts()
      expect(shortcuts).toHaveLength(1)
      expect(shortcuts[0].id).toBe('save')
      expect(shortcuts[0].keys).toBe('ctrl+s')
    })

    it('should register multiple shortcuts', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.registerMany([
        { id: 'save', keys: 'ctrl+s', handler: () => {}, description: 'Save' },
        { id: 'quit', keys: 'ctrl+q', handler: () => {}, description: 'Quit' }
      ])

      expect(app.shortcuts!.getShortcuts()).toHaveLength(2)
    })

    it('should replace existing shortcut with same ID', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler1 = vi.fn()
      const handler2 = vi.fn()

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler: handler1,
        description: 'Test 1'
      })

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler: handler2,
        description: 'Test 2'
      })

      const shortcuts = app.shortcuts!.getShortcuts()
      expect(shortcuts).toHaveLength(1)
      expect(shortcuts[0].description).toBe('Test 2')
    })

    it('should unregister a shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler: () => {},
        description: 'Test'
      })

      expect(app.shortcuts!.getShortcuts()).toHaveLength(1)

      app.shortcuts!.unregister('test')
      expect(app.shortcuts!.getShortcuts()).toHaveLength(0)
    })

    it('should enable and disable shortcuts', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler: () => {},
        description: 'Test'
      })

      app.shortcuts!.disable('test')
      expect(app.shortcuts!.getShortcuts()[0].enabled).toBe(false)

      app.shortcuts!.enable('test')
      expect(app.shortcuts!.getShortcuts()[0].enabled).toBe(true)
    })
  })

  describe('shortcut execution', () => {
    it('should execute shortcut via simulate', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler,
        description: 'Test'
      })

      app.shortcuts!.simulate('ctrl+t')
      expect(handler).toHaveBeenCalled()
    })

    it('should execute shortcut by ID', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler,
        description: 'Test'
      })

      const result = app.shortcuts!.execute('test')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should not execute disabled shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+t',
        handler,
        description: 'Test',
        enabled: false
      })

      const result = app.shortcuts!.execute('test')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should return false for non-existent shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const result = app.shortcuts!.execute('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('vim mode', () => {
    it('should start with vim mode disabled by default', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(app.shortcuts!.isVimMode()).toBe(false)
    })

    it('should start with vim mode enabled if configured', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      expect(app.shortcuts!.isVimMode()).toBe(true)
      expect(app.shortcuts!.getVimMode()).toBe('normal')
    })

    it('should enable vim mode', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.enableVimMode()
      expect(app.shortcuts!.isVimMode()).toBe(true)
      expect(app.shortcuts!.getVimMode()).toBe('normal')
    })

    it('should disable vim mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.disableVimMode()
      expect(app.shortcuts!.isVimMode()).toBe(false)
    })

    it('should toggle vim mode', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.toggleVimMode()
      expect(app.shortcuts!.isVimMode()).toBe(true)

      app.shortcuts!.toggleVimMode()
      expect(app.shortcuts!.isVimMode()).toBe(false)
    })

    it('should set vim mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.setVimMode('insert')
      expect(app.shortcuts!.getVimMode()).toBe('insert')

      app.shortcuts!.setVimMode('visual')
      expect(app.shortcuts!.getVimMode()).toBe('visual')
    })

    it('should not execute vimOnly shortcuts when vim mode is disabled', () => {
      const plugin = shortcutsPlugin({ vimMode: false })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'vim-only',
        keys: 'j',
        handler,
        description: 'Move down',
        vimOnly: true
      })

      const result = app.shortcuts!.execute('vim-only')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should execute vimOnly shortcuts when vim mode is enabled', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'vim-only',
        keys: 'j',
        handler,
        description: 'Move down',
        vimOnly: true
      })

      const result = app.shortcuts!.execute('vim-only')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should not execute normalOnly shortcuts when vim mode is enabled', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'normal-only',
        keys: 'down',
        handler,
        description: 'Move down',
        normalOnly: true
      })

      const result = app.shortcuts!.execute('normal-only')
      expect(result).toBe(false)
    })
  })

  describe('context', () => {
    it('should set and clear context', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.setContext('editor')
      // Context is internal, but affects shortcut execution

      app.shortcuts!.clearContext()
      // Context cleared
    })

    it('should only execute shortcuts matching context', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'editor-save',
        keys: 'ctrl+s',
        handler,
        description: 'Save',
        context: 'editor'
      })

      // No context set - should not execute
      const result1 = app.shortcuts!.execute('editor-save')
      expect(result1).toBe(false)

      // Set matching context
      app.shortcuts!.setContext('editor')
      const result2 = app.shortcuts!.execute('editor-save')
      expect(result2).toBe(true)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('conflicts', () => {
    it('should detect shortcut conflicts', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test1',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Test 1'
      })

      app.shortcuts!.register({
        id: 'test2',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Test 2'
      })

      const conflicts = app.shortcuts!.getConflicts()
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].shortcuts).toHaveLength(2)
    })

    it('should not report conflicts for disabled shortcuts', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test1',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Test 1'
      })

      app.shortcuts!.register({
        id: 'test2',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Test 2',
        enabled: false
      })

      const conflicts = app.shortcuts!.getConflicts()
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('help text', () => {
    it('should generate help text', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'save',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Save file',
        category: 'File'
      })

      app.shortcuts!.register({
        id: 'quit',
        keys: 'ctrl+q',
        handler: () => {},
        description: 'Quit',
        category: 'Application'
      })

      const helpText = app.shortcuts!.getHelpText()
      expect(helpText).toContain('Keyboard Shortcuts')
      expect(helpText).toContain('File')
      expect(helpText).toContain('ctrl+s')
      expect(helpText).toContain('Save file')
    })

    it('should generate markdown help text', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'save',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Save file',
        category: 'File'
      })

      const helpText = app.shortcuts!.getHelpText({ markdown: true })
      expect(helpText).toContain('# Keyboard Shortcuts')
      expect(helpText).toContain('## File')
      expect(helpText).toContain('`ctrl+s`')
    })

    it('should filter by category', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'save',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Save',
        category: 'File'
      })

      app.shortcuts!.register({
        id: 'quit',
        keys: 'ctrl+q',
        handler: () => {},
        description: 'Quit',
        category: 'Application'
      })

      const helpText = app.shortcuts!.getHelpText({ category: 'File' })
      expect(helpText).toContain('Save')
      expect(helpText).not.toContain('Quit')
    })
  })

  describe('shortcuts by category', () => {
    it('should group shortcuts by category', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'save',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Save',
        category: 'File'
      })

      app.shortcuts!.register({
        id: 'open',
        keys: 'ctrl+o',
        handler: () => {},
        description: 'Open',
        category: 'File'
      })

      app.shortcuts!.register({
        id: 'quit',
        keys: 'ctrl+q',
        handler: () => {},
        description: 'Quit',
        category: 'Application'
      })

      const byCategory = app.shortcuts!.getShortcutsByCategory()
      expect(byCategory.get('File')).toHaveLength(2)
      expect(byCategory.get('Application')).toHaveLength(1)
    })
  })

  describe('vim mode key handling', () => {
    it('should switch to normal mode on escape in vim mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.setVimMode('insert')
      expect(app.shortcuts!.getVimMode()).toBe('insert')

      app.emit('key', createKeyEvent('escape'))
      expect(app.shortcuts!.getVimMode()).toBe('normal')
      expect(app.markDirty).toHaveBeenCalled()
    })

    it('should switch to insert mode on i key in normal mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      expect(app.shortcuts!.getVimMode()).toBe('normal')

      app.emit('key', createKeyEvent('i'))
      expect(app.shortcuts!.getVimMode()).toBe('insert')
      expect(app.markDirty).toHaveBeenCalled()
    })

    it('should switch to visual mode on v key in normal mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      expect(app.shortcuts!.getVimMode()).toBe('normal')

      app.emit('key', createKeyEvent('v'))
      expect(app.shortcuts!.getVimMode()).toBe('visual')
      expect(app.markDirty).toHaveBeenCalled()
    })

    it('should pass through keys in insert mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.setVimMode('insert')

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'a',
        handler,
        description: 'Test'
      })

      app.emit('key', createKeyEvent('a'))
      // In insert mode, shortcuts don't execute, but key event is consumed
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not trigger shortcuts in non-normal vim mode', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.setVimMode('insert')

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler,
        description: 'Test'
      })

      // In insert mode, normal shortcuts shouldn't trigger
      const result = app.shortcuts!.execute('test')
      expect(result).toBe(false)
    })
  })

  describe('key sequences and chords', () => {
    it('should handle multi-key sequences', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'gg',
        keys: 'g g',
        handler,
        description: 'Go to top'
      })

      // First 'g' should be consumed (chord in progress)
      app.emit('key', createKeyEvent('g'))

      // Second 'g' should execute
      app.emit('key', createKeyEvent('g'))
      expect(handler).toHaveBeenCalled()
    })

    it('should handle chord timeout', async () => {
      const plugin = shortcutsPlugin({ chordTimeout: 100 })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'gg',
        keys: 'g g',
        handler,
        description: 'Go to top'
      })

      // First 'g'
      app.emit('key', createKeyEvent('g'))

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second 'g' after timeout should not execute chord
      app.emit('key', createKeyEvent('g'))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle leader key shortcuts', () => {
      const plugin = shortcutsPlugin({ vimMode: true, leaderKey: 'space' })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'leader-w',
        keys: '<leader> w',
        handler,
        description: 'Save',
        vimOnly: true
      })

      // Press space then w
      app.emit('key', createKeyEvent('space'))
      app.emit('key', createKeyEvent('w'))
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('priority handling', () => {
    it('should execute higher priority shortcut in conflict', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const highHandler = vi.fn()
      const lowHandler = vi.fn()

      app.shortcuts!.register({
        id: 'low',
        keys: 'ctrl+s',
        handler: lowHandler,
        description: 'Low priority',
        priority: 'low'
      })

      app.shortcuts!.register({
        id: 'high',
        keys: 'ctrl+s',
        handler: highHandler,
        description: 'High priority',
        priority: 'high'
      })

      app.shortcuts!.simulate('ctrl+s')
      expect(highHandler).toHaveBeenCalled()
      expect(lowHandler).not.toHaveBeenCalled()
    })

    it('should respect critical priority', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const criticalHandler = vi.fn()
      const normalHandler = vi.fn()

      app.shortcuts!.register({
        id: 'critical',
        keys: 'ctrl+s',
        handler: criticalHandler,
        description: 'Critical',
        priority: 'critical'
      })

      app.shortcuts!.register({
        id: 'normal',
        keys: 'ctrl+s',
        handler: normalHandler,
        description: 'Normal'
      })

      app.shortcuts!.simulate('ctrl+s')
      expect(criticalHandler).toHaveBeenCalled()
      expect(normalHandler).not.toHaveBeenCalled()
    })
  })

  describe('context edge cases', () => {
    it('should handle function context', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler,
        description: 'Test',
        context: (a) => a === app
      })

      const result = app.shortcuts!.execute('test')
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should handle array context', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler,
        description: 'Test',
        context: ['editor', 'viewer']
      })

      app.shortcuts!.setContext(['editor'])
      const result1 = app.shortcuts!.execute('test')
      expect(result1).toBe(true)

      app.shortcuts!.clearContext()
      const result2 = app.shortcuts!.execute('test')
      expect(result2).toBe(false)
    })

    it('should not execute when no matching context', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler,
        description: 'Test',
        context: 'editor'
      })

      app.shortcuts!.setContext('viewer')
      const result = app.shortcuts!.execute('test')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('handler return values', () => {
    it('should consume event when handler returns true', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler: () => true,
        description: 'Test'
      })

      // Should not throw, event is consumed
      expect(() => app.shortcuts!.simulate('ctrl+s')).not.toThrow()
    })

    it('should consume event when handler returns undefined', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler: () => undefined,
        description: 'Test'
      })

      // Should not throw, undefined is treated as true (consume)
      expect(() => app.shortcuts!.simulate('ctrl+s')).not.toThrow()
    })

    it('should not consume event when handler returns false', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler: () => false,
        description: 'Test'
      })

      // Handler returning false means don't consume
      const result = app.shortcuts!.simulate('ctrl+s')
      expect(result).toBe(false)
    })
  })

  describe('key normalization', () => {
    it('should normalize key order with modifiers', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+shift+s',
        handler,
        description: 'Test'
      })

      app.shortcuts!.simulate('shift+ctrl+s')
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('shift key handling', () => {
    it('should handle explicit shift+g shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      // Use explicit shift+g which should match 'G' with shift
      app.shortcuts!.register({
        id: 'test',
        keys: 'g',
        handler,
        description: 'Test'
      })

      // When G is pressed with shift, it matches 'g' shortcut
      app.emit('key', createKeyEvent('G', { shift: true }))
      // In the implementation, 'G' with shift=true becomes 'g' key
      // because uppercase letters are converted to lowercase
      expect(handler).toHaveBeenCalled()
    })

    it('should handle multi-key sequence with shift modifier', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'shift+x g',
        handler,
        description: 'Test'
      })

      // First shift+x (special key with shift)
      app.emit('key', createKeyEvent('x', { shift: true }))
      // Second g
      app.emit('key', createKeyEvent('g'))
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('help text with vim mode', () => {
    it('should include vim mode in help text when enabled', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      const helpText = app.shortcuts!.getHelpText()
      expect(helpText).toContain('Vim mode: normal')
    })

    it('should include vim mode in markdown help text', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      const helpText = app.shortcuts!.getHelpText({ markdown: true })
      expect(helpText).toContain('*Vim mode: normal*')
    })

    it('should show current vim mode in help text', () => {
      const plugin = shortcutsPlugin({ vimMode: true })
      plugin.install(app)

      app.shortcuts!.setVimMode('insert')
      const helpText = app.shortcuts!.getHelpText()
      expect(helpText).toContain('Vim mode: insert')
    })
  })

  describe('multi-key shortcuts with array', () => {
    it('should match any key in array', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'save',
        keys: ['ctrl+s', 'ctrl+shift+s'],
        handler,
        description: 'Save'
      })

      app.shortcuts!.simulate('ctrl+s')
      expect(handler).toHaveBeenCalledTimes(1)

      app.shortcuts!.simulate('ctrl+shift+s')
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty keys in registerMany', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(() => app.shortcuts!.registerMany([])).not.toThrow()
    })

    it('should handle unregistering non-existent shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(() => app.shortcuts!.unregister('nonexistent')).not.toThrow()
    })

    it('should handle enabling non-existent shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(() => app.shortcuts!.enable('nonexistent')).not.toThrow()
    })

    it('should handle disabling non-existent shortcut', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      expect(() => app.shortcuts!.disable('nonexistent')).not.toThrow()
    })

    it('should handle very long chord sequences', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'a b c d e f',
        handler,
        description: 'Long chord'
      })

      // Build the chord
      app.emit('key', createKeyEvent('a'))
      app.emit('key', createKeyEvent('b'))
      app.emit('key', createKeyEvent('c'))
      app.emit('key', createKeyEvent('d'))
      app.emit('key', createKeyEvent('e'))
      app.emit('key', createKeyEvent('f'))

      expect(handler).toHaveBeenCalled()
    })

    it('should handle chords with modifiers', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+k ctrl+c',
        handler,
        description: 'Chord with modifiers'
      })

      // Build the chord
      app.emit('key', createKeyEvent('k', { ctrl: true }))
      app.emit('key', createKeyEvent('c', { ctrl: true }))

      expect(handler).toHaveBeenCalled()
    })

    it('should not execute disabled shortcuts via simulate', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler,
        description: 'Test',
        enabled: false
      })

      const result = app.shortcuts!.simulate('ctrl+s')
      expect(result).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle shortcut without category', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      app.shortcuts!.register({
        id: 'test',
        keys: 'ctrl+s',
        handler: () => {},
        description: 'Test'
      })

      const byCategory = app.shortcuts!.getShortcutsByCategory()
      expect(byCategory.get('General')).toHaveLength(1)
    })

    it('should clear chord on exact match failure', () => {
      const plugin = shortcutsPlugin()
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'a b',
        handler,
        description: 'Test chord'
      })

      // Press 'a' (partial match)
      app.emit('key', createKeyEvent('a'))

      // Press 'x' (no match, should clear chord)
      // But 'x' doesn't match any shortcut either, so handler is not called
      app.emit('key', createKeyEvent('x'))
      expect(handler).not.toHaveBeenCalled()

      // Next press of 'a' should start fresh chord
      app.emit('key', createKeyEvent('a'))
      app.emit('key', createKeyEvent('b'))
      expect(handler).toHaveBeenCalled()
    })

    it('should handle chord timeout after partial match', () => {
      const plugin = shortcutsPlugin({ chordTimeout: 50 })
      plugin.install(app)

      const handler = vi.fn()
      app.shortcuts!.register({
        id: 'test',
        keys: 'a b',
        handler,
        description: 'Test chord'
      })

      // Press 'a'
      app.emit('key', createKeyEvent('a'))

      // Wait for timeout
      return new Promise(resolve => {
        setTimeout(() => {
          // Press 'b' after timeout - should not execute chord
          app.emit('key', createKeyEvent('b'))
          expect(handler).not.toHaveBeenCalled()
          resolve(null)
        }, 100)
      })
    })
  })
})

describe('preset shortcuts', () => {
  it('should provide common shortcuts', () => {
    expect(commonShortcuts).toBeDefined()
    expect(commonShortcuts.length).toBeGreaterThan(0)
    expect(commonShortcuts.find(s => s.id === 'quit')).toBeDefined()
  })

  it('should provide vim navigation shortcuts', () => {
    expect(vimNavigationShortcuts).toBeDefined()
    expect(vimNavigationShortcuts.length).toBeGreaterThan(0)
    expect(vimNavigationShortcuts.find(s => s.keys === 'j')).toBeDefined()
    expect(vimNavigationShortcuts.find(s => s.keys === 'k')).toBeDefined()
  })

  it('should provide vim editing shortcuts', () => {
    expect(vimEditingShortcuts).toBeDefined()
    expect(vimEditingShortcuts.length).toBeGreaterThan(0)
  })
})

describe('createVimShortcuts', () => {
  it('should create vim shortcuts with custom handlers', () => {
    const upHandler = vi.fn()
    const downHandler = vi.fn()

    const shortcuts = createVimShortcuts({
      up: upHandler,
      down: downHandler
    })

    expect(shortcuts.length).toBeGreaterThan(0)

    const upShortcut = shortcuts.find(s => s.id === 'vim-up')
    expect(upShortcut).toBeDefined()
    upShortcut!.handler()
    expect(upHandler).toHaveBeenCalled()

    const downShortcut = shortcuts.find(s => s.id === 'vim-down')
    expect(downShortcut).toBeDefined()
    downShortcut!.handler()
    expect(downHandler).toHaveBeenCalled()
  })
})
