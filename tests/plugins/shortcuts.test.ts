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
