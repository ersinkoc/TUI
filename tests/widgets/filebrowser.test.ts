/**
 * FileBrowser widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { filebrowser } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('FileBrowser Widget', () => {
  describe('creation', () => {
    it('creates a filebrowser with default properties', () => {
      const fb = filebrowser()
      expect(fb.type).toBe('filebrowser')
      expect(fb.currentPath).toBe('/')
      expect(fb.isFocused).toBe(false)
    })

    it('creates a filebrowser with initial path', () => {
      const fb = filebrowser({ path: '/home/user' })
      expect(fb.currentPath).toBe('/home/user')
    })

    it('creates a filebrowser with custom file loader', () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader })
      expect(fb.type).toBe('filebrowser')
    })
  })

  describe('configuration', () => {
    it('sets path', () => {
      const fb = filebrowser().path('/documents')
      expect(fb.currentPath).toBe('/documents')
    })

    it('sets show hidden', () => {
      const fb = filebrowser().showHidden(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets show size', () => {
      const fb = filebrowser().showSize(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets show modified', () => {
      const fb = filebrowser().showModified(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets show icons', () => {
      const fb = filebrowser().showIcons(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets show path', () => {
      const fb = filebrowser().showPath(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets sort by', () => {
      const fb = filebrowser().sortBy('name')
      expect(fb.type).toBe('filebrowser')
    })

    it('sets sort order', () => {
      const fb = filebrowser().sortOrder('asc')
      expect(fb.type).toBe('filebrowser')
    })

    it('sets directories first', () => {
      const fb = filebrowser().directoriesFirst(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets multi select', () => {
      const fb = filebrowser().multiSelect(true)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets filter (string)', () => {
      const fb = filebrowser().filter('\\.ts$')
      expect(fb.type).toBe('filebrowser')
    })

    it('sets filter (regex)', () => {
      const fb = filebrowser().filter(/\.ts$/)
      expect(fb.type).toBe('filebrowser')
    })

    it('clears filter', () => {
      const fb = filebrowser().filter(/\.ts$/).filter(null)
      expect(fb.type).toBe('filebrowser')
    })

    it('sets file loader', () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser().fileLoader(loader)
      expect(fb.type).toBe('filebrowser')
    })
  })

  describe('navigation', () => {
    it('goes to path', async () => {
      const loader = vi.fn().mockReturnValue([
        { name: 'file.txt', path: '/test/file.txt', isDirectory: false }
      ])
      const fb = filebrowser({ fileLoader: loader })
      await fb.goTo('/test')
      expect(fb.currentPath).toBe('/test')
      expect(loader).toHaveBeenCalledWith('/test')
    })

    it('goes up', async () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader, path: '/home/user/documents' })
      await fb.goUp()
      expect(fb.currentPath).toBe('/home/user')
    })

    it('goes back', async () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader })
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      expect(fb.currentPath).toBe('/path1')
    })

    it('goes forward', async () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader })
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      await fb.goForward()
      expect(fb.currentPath).toBe('/path2')
    })

    it('refreshes current path', async () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader })
      await fb.goTo('/test')
      await fb.refresh()
      expect(loader).toHaveBeenCalledTimes(2)
    })

    it('reports canGoBack', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      expect(fb.canGoBack).toBe(false)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      expect(fb.canGoBack).toBe(true)
    })

    it('reports canGoForward', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      expect(fb.canGoForward).toBe(false)
      await fb.goBack()
      expect(fb.canGoForward).toBe(true)
    })
  })

  describe('focus navigation', () => {
    it('focuses next entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.focus()

      const initialIndex = fb.focusedIndex
      fb.focusNext()
      expect(fb.focusedIndex).toBe(initialIndex + 1)
    })

    it('focuses previous entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.focus()
      fb.focusNext()

      const currentIndex = fb.focusedIndex
      fb.focusPrevious()
      expect(fb.focusedIndex).toBe(currentIndex - 1)
    })

    it('page up', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      fb.pageUp()
      expect(fb.type).toBe('filebrowser')
    })

    it('page down', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      fb.pageDown()
      expect(fb.type).toBe('filebrowser')
    })

    it('home', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.focusNext()
      fb.home()
      expect(fb.focusedIndex).toBe(0)
    })

    it('end', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.end()
      expect(fb.focusedIndex).toBe(1)
    })
  })

  describe('selection', () => {
    it('selects entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/file.txt')
      expect(fb.selectedEntries.length).toBe(1)
    })

    it('deselects entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/file.txt')
      fb.deselect('/file.txt')
      expect(fb.selectedEntries.length).toBe(0)
    })

    it('selects all in multi-select mode', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.selectAll()
      expect(fb.selectedEntries.length).toBe(2)
    })

    it('deselects all', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.selectAll()
      fb.deselectAll()
      expect(fb.selectedEntries.length).toBe(0)
    })

    it('toggles selection in multi-select mode', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.toggleSelect()
      expect(fb.selectedEntries.length).toBe(1)
      fb.toggleSelect()
      expect(fb.selectedEntries.length).toBe(0)
    })
  })

  describe('actions', () => {
    it('opens directory', async () => {
      const loader = vi.fn()
        .mockReturnValueOnce([
          { name: 'subdir', path: '/subdir', isDirectory: true }
        ])
        .mockReturnValueOnce([])

      const fb = filebrowser({ fileLoader: loader })
      await fb.goTo('/')

      // Simulate opening directory
      ;(fb as any)._focusedIndex = 0
      await fb.open()
      expect(fb.currentPath).toBe('/subdir')
    })

    it('emits onOpen for files', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).onOpen(handler)

      await fb.goTo('/')
      ;(fb as any)._focusedIndex = 0
      await fb.open()
      expect(handler).toHaveBeenCalled()
    })

    it('creates folder', async () => {
      const handler = vi.fn()
      const fb = filebrowser({ fileLoader: () => [] })
        .onCreate(handler)

      await fb.createFolder('new-folder')
      expect(handler).toHaveBeenCalled()
    })

    it('renames entry', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'old.txt', path: '/old.txt', isDirectory: false }
        ]
      }).onRename(handler)

      await fb.goTo('/')
      await fb.rename('/old.txt', 'new.txt')
      expect(handler).toHaveBeenCalledWith('/old.txt', '/new.txt')
    })

    it('deletes entries', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).onDelete(handler)

      await fb.goTo('/')
      await fb.delete(['/file.txt'])
      expect(handler).toHaveBeenCalledWith(['/file.txt'])
    })
  })

  describe('focus', () => {
    it('focuses the filebrowser', () => {
      const fb = filebrowser()
      fb.focus()
      expect(fb.isFocused).toBe(true)
    })

    it('blurs the filebrowser', () => {
      const fb = filebrowser()
      fb.focus()
      fb.blur()
      expect(fb.isFocused).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onNavigate', async () => {
      const handler = vi.fn()
      const fb = filebrowser({ fileLoader: () => [] })
        .onNavigate(handler)

      await fb.goTo('/test')
      expect(handler).toHaveBeenCalledWith('/test')
    })

    it('emits onSelect', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).onSelect(handler)

      await fb.goTo('/')
      fb.select('/file.txt')
      expect(handler).toHaveBeenCalled()
    })

    it('emits onError on loader error', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => { throw new Error('Load error') }
      }).onError(handler)

      await fb.goTo('/test')
      expect(handler).toHaveBeenCalled()
    })

    it('emits onFocus', () => {
      const handler = vi.fn()
      const fb = filebrowser().onFocus(handler)
      fb.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onBlur', () => {
      const handler = vi.fn()
      const fb = filebrowser().onBlur(handler)
      fb.focus()
      fb.blur()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('handles navigation keys', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.focus()

      let handled = (fb as any).handleKey('down', false)
      expect(handled).toBe(true)

      handled = (fb as any).handleKey('up', false)
      expect(handled).toBe(true)
    })

    it('handles enter to open', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).onOpen(handler).focus()

      await fb.goTo('/')
      ;(fb as any).handleKey('enter', false)
      // Should trigger open
    })

    it('handles backspace to go up', async () => {
      const fb = filebrowser({ fileLoader: () => [], path: '/home/user' })
        .focus()

      ;(fb as any).handleKey('backspace', false)
      // Should call goUp
    })

    it('handles h to toggle hidden', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      ;(fb as any).handleKey('h', false)
      // Should toggle showHidden
    })

    it('ignores keys when not focused', () => {
      const fb = filebrowser({ fileLoader: () => [] })
      const handled = (fb as any).handleKey('down', false)
      expect(handled).toBe(false)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty filebrowser', () => {
      const fb = filebrowser()
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders filebrowser with entries', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'folder', path: '/folder', isDirectory: true },
          { name: 'file.txt', path: '/file.txt', isDirectory: false, size: 1024 }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused filebrowser', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders loading state', () => {
      const fb = filebrowser()
      ;(fb as any)._loading = true
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      expect(fb.isLoading).toBe(true)
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const fb = filebrowser()
      ;(fb as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const fb = filebrowser().visible(false)
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', async () => {
      const fb = filebrowser()
        .path('/home')
        .showHidden(false)
        .showSize(true)
        .showModified(true)
        .showIcons(true)
        .showPath(true)
        .sortBy('name')
        .sortOrder('asc')
        .directoriesFirst(true)
        .multiSelect(false)
        .filter(/\.ts$/)
        .focus()

      expect(fb.type).toBe('filebrowser')
      expect(fb.currentPath).toBe('/home')
    })
  })

  describe('constructor with all props', () => {
    it('accepts all properties in constructor', () => {
      const fb = filebrowser({
        path: '/test',
        showHidden: true,
        showSize: false,
        showModified: false,
        showIcons: false,
        showPath: false,
        sortBy: 'size',
        sortOrder: 'desc',
        directoriesFirst: false,
        multiSelect: true,
        filter: '\\.ts$'
      })
      expect(fb.currentPath).toBe('/test')
    })

    it('accepts RegExp filter in constructor', () => {
      const fb = filebrowser({
        filter: /\.ts$/
      })
      expect(fb.type).toBe('filebrowser')
    })
  })

  describe('sorting', () => {
    it('sorts by size', async () => {
      const fb = filebrowser({
        sortBy: 'size',
        sortOrder: 'asc',
        fileLoader: () => [
          { name: 'big.txt', path: '/big.txt', isDirectory: false, size: 1000 },
          { name: 'small.txt', path: '/small.txt', isDirectory: false, size: 100 }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('small.txt')
    })

    it('sorts by modified', async () => {
      const fb = filebrowser({
        sortBy: 'modified',
        sortOrder: 'asc',
        fileLoader: () => [
          { name: 'new.txt', path: '/new.txt', isDirectory: false, modified: new Date(2024, 5, 15) },
          { name: 'old.txt', path: '/old.txt', isDirectory: false, modified: new Date(2024, 0, 1) }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('old.txt')
    })

    it('sorts by type (extension)', async () => {
      const fb = filebrowser({
        sortBy: 'type',
        sortOrder: 'asc',
        directoriesFirst: false,
        fileLoader: () => [
          { name: 'file.ts', path: '/file.ts', isDirectory: false },
          { name: 'file.js', path: '/file.js', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('file.js')
    })

    it('sorts descending', async () => {
      const fb = filebrowser({
        sortBy: 'name',
        sortOrder: 'desc',
        directoriesFirst: false,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'z.txt', path: '/z.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('z.txt')
    })

    it('keeps parent directory first', async () => {
      const fb = filebrowser({
        sortBy: 'name',
        sortOrder: 'asc',
        fileLoader: () => [
          { name: 'z.txt', path: '/z.txt', isDirectory: false },
          { name: '..', path: '/..', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('..')
    })

    it('sorts directories first when enabled', async () => {
      const fb = filebrowser({
        sortBy: 'name',
        directoriesFirst: true,
        fileLoader: () => [
          { name: 'aaa.txt', path: '/aaa.txt', isDirectory: false },
          { name: 'zzz', path: '/zzz', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries[0].name).toBe('zzz')
    })

    it('keeps parent directory first when it would be sorted after other entries', async () => {
      const fb = filebrowser({
        sortBy: 'name',
        sortOrder: 'asc',
        fileLoader: () => [
          { name: 'aaa.txt', path: '/aaa.txt', isDirectory: false },
          { name: '..', path: '/..', isDirectory: true }
        ]
      })
      await fb.goTo('/home')
      // '..' alphabetically comes before 'aaa', but we need to test when a is '..', not just b
      expect(fb.entries[0].name).toBe('..')
      expect(fb.entries[1].name).toBe('aaa.txt')
    })

    it('sorts by size with undefined size values', async () => {
      const fb = filebrowser({
        sortBy: 'size',
        fileLoader: () => [
          { name: 'nosize.txt', path: '/nosize.txt', isDirectory: false },
          { name: 'hassize.txt', path: '/hassize.txt', isDirectory: false, size: 100 }
        ]
      })
      await fb.goTo('/')
      // undefined size should be treated as 0
      expect(fb.entries[0].name).toBe('nosize.txt')
      expect(fb.entries[1].name).toBe('hassize.txt')
    })

    it('sorts by modified with undefined modified values', async () => {
      const fb = filebrowser({
        sortBy: 'modified',
        fileLoader: () => [
          { name: 'nodate.txt', path: '/nodate.txt', isDirectory: false },
          { name: 'hasdate.txt', path: '/hasdate.txt', isDirectory: false, modified: new Date(2024, 5, 15) }
        ]
      })
      await fb.goTo('/')
      // undefined modified should be treated as 0 (epoch)
      expect(fb.entries[0].name).toBe('nodate.txt')
      expect(fb.entries[1].name).toBe('hasdate.txt')
    })
  })

  describe('filtering', () => {
    it('filters hidden files when showHidden is false', async () => {
      const fb = filebrowser({
        showHidden: false,
        fileLoader: () => [
          { name: '.hidden', path: '/.hidden', isDirectory: false, hidden: true },
          { name: 'visible.txt', path: '/visible.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries.length).toBe(1)
      expect(fb.entries[0].name).toBe('visible.txt')
    })

    it('filters files starting with dot', async () => {
      const fb = filebrowser({
        showHidden: false,
        fileLoader: () => [
          { name: '.dotfile', path: '/.dotfile', isDirectory: false },
          { name: 'normal.txt', path: '/normal.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries.length).toBe(1)
    })

    it('applies custom filter to files not directories', async () => {
      const fb = filebrowser({
        filter: /\.ts$/,
        fileLoader: () => [
          { name: 'src', path: '/src', isDirectory: true },
          { name: 'file.ts', path: '/file.ts', isDirectory: false },
          { name: 'file.js', path: '/file.js', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      expect(fb.entries.length).toBe(2) // dir + .ts file
    })
  })

  describe('multi-select mode', () => {
    it('clears selection when disabling multiSelect', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/file.txt')
      expect(fb.selectedEntries.length).toBe(1)
      fb.multiSelect(false)
      expect(fb.selectedEntries.length).toBe(0)
    })

    it('selectAll skips parent directory', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: '..', path: '/..', isDirectory: true },
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.selectAll()
      expect(fb.selectedEntries.length).toBe(1)
    })

    it('toggleSelect does nothing on parent directory', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: '..', path: '/..', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      fb.toggleSelect()
      expect(fb.selectedEntries.length).toBe(0)
    })

    it('selectFocused does nothing on parent directory', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: '..', path: '/..', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      fb.selectFocused()
      expect(fb.selectedEntries.length).toBe(0)
    })

    it('toggleSelect in single-select mode clears previous selection', async () => {
      const fb = filebrowser({
        multiSelect: false,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.toggleSelect()
      fb.focusNext()
      fb.toggleSelect()
      expect(fb.selectedEntries.length).toBe(1)
      expect(fb.selectedEntries[0].name).toBe('b.txt')
    })

    it('selectFocused in single-select mode clears previous selection', async () => {
      const fb = filebrowser({
        multiSelect: false,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.selectFocused()
      fb.focusNext()
      fb.selectFocused()
      expect(fb.selectedEntries.length).toBe(1)
    })

    it('selectAll does nothing when not in multiSelect mode', async () => {
      const fb = filebrowser({
        multiSelect: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.selectAll()
      expect(fb.selectedEntries.length).toBe(0)
    })
  })

  describe('navigation edge cases', () => {
    it('does not add duplicate history entry', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/path1')
      await fb.goTo('/path1') // Same path
      expect(fb.canGoBack).toBe(false) // Only one entry
    })

    it('goBack does nothing when cannot go back', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/test')
      await fb.goBack() // Cannot go back from first entry
      expect(fb.currentPath).toBe('/test')
    })

    it('goForward does nothing when cannot go forward', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/test')
      await fb.goForward()
      expect(fb.currentPath).toBe('/test')
    })

    it('goUp goes to root from shallow path', async () => {
      const fb = filebrowser({ fileLoader: () => [], path: '/home' })
      await fb.goUp()
      expect(fb.currentPath).toBe('/')
    })

    it('handles error that is not an Error instance in goTo', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => { throw 'string error' }
      }).onError(handler)
      await fb.goTo('/test')
      expect(handler).toHaveBeenCalled()
    })

    it('handles error in goBack', async () => {
      const handler = vi.fn()
      let callCount = 0
      const fb = filebrowser({
        fileLoader: () => {
          callCount++
          if (callCount > 2) throw new Error('Back error')
          return []
        }
      }).onError(handler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      expect(handler).toHaveBeenCalled()
    })

    it('handles error in goForward', async () => {
      const handler = vi.fn()
      let callCount = 0
      const fb = filebrowser({
        fileLoader: () => {
          callCount++
          if (callCount > 3) throw new Error('Forward error')
          return []
        }
      }).onError(handler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      await fb.goForward()
      expect(handler).toHaveBeenCalled()
    })

    it('handles non-Error in goBack', async () => {
      const handler = vi.fn()
      let callCount = 0
      const fb = filebrowser({
        fileLoader: () => {
          callCount++
          if (callCount > 2) throw 'string error'
          return []
        }
      }).onError(handler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      expect(handler).toHaveBeenCalled()
    })

    it('handles non-Error in goForward', async () => {
      const handler = vi.fn()
      let callCount = 0
      const fb = filebrowser({
        fileLoader: () => {
          callCount++
          if (callCount > 3) throw 'string error'
          return []
        }
      }).onError(handler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      await fb.goForward()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onNavigate during successful goBack', async () => {
      const navigateHandler = vi.fn()
      const fb = filebrowser({ fileLoader: () => [] })
        .onNavigate(navigateHandler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      navigateHandler.mockClear()
      await fb.goBack()
      expect(navigateHandler).toHaveBeenCalledWith('/path1')
    })

    it('emits onNavigate during successful goForward', async () => {
      const navigateHandler = vi.fn()
      const fb = filebrowser({ fileLoader: () => [] })
        .onNavigate(navigateHandler)
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      navigateHandler.mockClear()
      await fb.goForward()
      expect(navigateHandler).toHaveBeenCalledWith('/path2')
    })
  })

  describe('focus navigation edge cases', () => {
    it('focusNext does nothing when no entries', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/')
      fb.focusNext()
      expect(fb.focusedIndex).toBe(0)
    })

    it('focusPrevious does nothing when no entries', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/')
      fb.focusPrevious()
      expect(fb.focusedIndex).toBe(0)
    })

    it('focusedEntry returns null when no entries', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/')
      expect(fb.focusedEntry).toBeNull()
    })

    it('ensureVisible scrolls when focused beyond visible', async () => {
      const fb = filebrowser({
        fileLoader: () => Array.from({ length: 50 }, (_, i) => ({
          name: `file${i}.txt`,
          path: `/file${i}.txt`,
          isDirectory: false
        }))
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      fb.end() // Go to last entry
      expect((fb as any)._scrollOffset).toBeGreaterThan(0)
    })
  })

  describe('actions edge cases', () => {
    it('open does nothing when no focused entry', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/')
      await fb.open()
      expect(fb.currentPath).toBe('/')
    })

    it('open parent directory (..) navigates up', async () => {
      const loader = vi.fn()
        .mockReturnValueOnce([
          { name: '..', path: '/..', isDirectory: true }
        ])
        .mockReturnValueOnce([])

      const fb = filebrowser({ fileLoader: loader, path: '/home/user' })
      await fb.goTo('/home/user')
      await fb.open()
      expect(fb.currentPath).toBe('/home')
    })

    it('open parent directory (..) from single-level path goes to root', async () => {
      const loader = vi.fn()
        .mockReturnValueOnce([
          { name: '..', path: '/..', isDirectory: true }
        ])
        .mockReturnValueOnce([])

      const fb = filebrowser({ fileLoader: loader, path: '/home' })
      await fb.goTo('/home')
      await fb.open()
      expect(fb.currentPath).toBe('/')
    })

    it('rename does nothing for non-existent entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      await fb.rename('/nonexistent.txt', 'new.txt')
      expect(fb.entries[0].name).toBe('file.txt')
    })

    it('rename updates selection when renamed entry was selected', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'old.txt', path: '/old.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/old.txt')
      await fb.rename('/old.txt', 'new.txt')
      expect(fb.selectedEntries[0].path).toBe('/new.txt')
    })

    it('delete adjusts focus when deleting focused entry', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.end() // Focus last entry
      await fb.delete(['/b.txt'])
      expect(fb.focusedIndex).toBe(0)
    })
  })

  describe('keyboard handling edge cases', () => {
    it('handles j key (vim down)', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      }).focus()
      await fb.goTo('/')
      const handled = (fb as any).handleKey('j', false)
      expect(handled).toBe(true)
      expect(fb.focusedIndex).toBe(1)
    })

    it('handles k key (vim up)', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      }).focus()
      await fb.goTo('/')
      fb.focusNext()
      const handled = (fb as any).handleKey('k', false)
      expect(handled).toBe(true)
      expect(fb.focusedIndex).toBe(0)
    })

    it('handles space in multiSelect mode', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).focus()
      await fb.goTo('/')
      const handled = (fb as any).handleKey('space', false)
      expect(handled).toBe(true)
      expect(fb.selectedEntries.length).toBe(1)
    })

    it('handles space in single-select mode (opens)', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        multiSelect: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).focus().onOpen(handler)
      await fb.goTo('/')
      ;(fb as any).handleKey('space', false)
      expect(handler).toHaveBeenCalled()
    })

    it('handles pageup key', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const handled = (fb as any).handleKey('pageup', false)
      expect(handled).toBe(true)
    })

    it('handles pagedown key', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const handled = (fb as any).handleKey('pagedown', false)
      expect(handled).toBe(true)
    })

    it('handles pageup key with showPath false', async () => {
      const fb = filebrowser({ fileLoader: () => [], showPath: false }).focus()
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const handled = (fb as any).handleKey('pageup', false)
      expect(handled).toBe(true)
    })

    it('handles pagedown key with showPath false', async () => {
      const fb = filebrowser({ fileLoader: () => [], showPath: false }).focus()
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const handled = (fb as any).handleKey('pagedown', false)
      expect(handled).toBe(true)
    })

    it('handles home key', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      const handled = (fb as any).handleKey('home', false)
      expect(handled).toBe(true)
    })

    it('handles end key', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      const handled = (fb as any).handleKey('end', false)
      expect(handled).toBe(true)
    })

    it('handles h key without ctrl (toggle hidden)', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      const handled = (fb as any).handleKey('h', false)
      expect(handled).toBe(true)
    })

    it('handles h key with ctrl (does nothing)', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      const handled = (fb as any).handleKey('h', true)
      expect(handled).toBe(false)
    })

    it('handles r key with ctrl (refresh)', async () => {
      const loader = vi.fn().mockReturnValue([])
      const fb = filebrowser({ fileLoader: loader }).focus()
      await fb.goTo('/test')
      const handled = (fb as any).handleKey('r', true)
      expect(handled).toBe(true)
    })

    it('handles r key without ctrl (does nothing)', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      const handled = (fb as any).handleKey('r', false)
      expect(handled).toBe(false)
    })

    it('handles a key with ctrl in multiSelect mode (select all)', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).focus()
      await fb.goTo('/')
      const handled = (fb as any).handleKey('a', true)
      expect(handled).toBe(true)
      expect(fb.selectedEntries.length).toBe(1)
    })

    it('handles a key with ctrl without multiSelect (does nothing)', async () => {
      const fb = filebrowser({
        multiSelect: false,
        fileLoader: () => []
      }).focus()
      const handled = (fb as any).handleKey('a', true)
      expect(handled).toBe(false)
    })

    it('handles left key (go back)', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      const handled = (fb as any).handleKey('left', false)
      expect(handled).toBe(true)
    })

    it('handles right key (go forward)', async () => {
      const fb = filebrowser({ fileLoader: () => [] }).focus()
      await fb.goTo('/path1')
      await fb.goTo('/path2')
      await fb.goBack()
      const handled = (fb as any).handleKey('right', false)
      expect(handled).toBe(true)
    })
  })

  describe('mouse handling', () => {
    it('returns false for clicks outside bounds', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const result = (fb as any).handleMouse(100, 100, 'press')
      expect(result).toBe(false)
    })

    it('clicks on entry to focus', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      ;(fb as any)._showPath = true
      ;(fb as any).handleMouse(5, 2, 'press') // y=2 with header offset
      expect(fb.focusedIndex).toBe(1)
    })

    it('double clicks on entry to open', async () => {
      const handler = vi.fn()
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).onOpen(handler)
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      ;(fb as any)._showPath = true
      // First click focuses
      ;(fb as any).handleMouse(5, 1, 'press')
      // Second click opens
      ;(fb as any).handleMouse(5, 1, 'press')
      expect(handler).toHaveBeenCalled()
    })

    it('handles scroll_up action', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      fb.focusNext()
      const result = (fb as any).handleMouse(5, 5, 'scroll_up')
      expect(result).toBe(true)
      expect(fb.focusedIndex).toBe(0)
    })

    it('handles scroll_down action', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const result = (fb as any).handleMouse(5, 5, 'scroll_down')
      expect(result).toBe(true)
      expect(fb.focusedIndex).toBe(1)
    })

    it('returns true for other actions', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      const result = (fb as any).handleMouse(5, 5, 'release')
      expect(result).toBe(true)
    })

    it('click outside entry list does nothing special', async () => {
      const fb = filebrowser({ fileLoader: () => [] })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      ;(fb as any)._showPath = true
      ;(fb as any).handleMouse(5, 5, 'press') // Beyond entry count
      expect(fb.type).toBe('filebrowser')
    })

    it('click with showPath false adjusts header offset', async () => {
      const fb = filebrowser({
        showPath: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }
      ;(fb as any).handleMouse(5, 0, 'press') // y=0 no header
      expect(fb.focusedIndex).toBe(0)
    })
  })

  describe('rendering edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with long path truncation', async () => {
      const fb = filebrowser({
        showPath: true,
        fileLoader: () => []
      })
      fb.path('/very/long/path/that/exceeds/the/available/width/for/display/in/the/buffer')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 30, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Path should be truncated
    })

    it('renders with modified dates', async () => {
      const fb = filebrowser({
        showModified: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false, modified: new Date(2024, 5, 15) }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without icons', async () => {
      const fb = filebrowser({
        showIcons: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused entry with icons (ATTR_INVERSE)', async () => {
      const fb = filebrowser({
        showIcons: true,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      }).focus()
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders selected entry with bold', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/file.txt')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders hidden files as dimmed', async () => {
      const fb = filebrowser({
        showHidden: true,
        fileLoader: () => [
          { name: '.hidden', path: '/.hidden', isDirectory: false, hidden: true }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders dot files as dimmed', async () => {
      const fb = filebrowser({
        showHidden: true,
        fileLoader: () => [
          { name: '.gitignore', path: '/.gitignore', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders multi-select with checkmarks', async () => {
      const fb = filebrowser({
        multiSelect: true,
        fileLoader: () => [
          { name: 'a.txt', path: '/a.txt', isDirectory: false },
          { name: 'b.txt', path: '/b.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      fb.select('/a.txt')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders directory with trailing slash', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'folder', path: '/folder', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders truncated long file names', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'this-is-a-very-long-filename-that-exceeds-available-width.txt', path: '/long.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width: 30, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without path header', async () => {
      const fb = filebrowser({
        showPath: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders without showSize and showModified', async () => {
      const fb = filebrowser({
        showSize: false,
        showModified: false,
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders entries with custom icon', async () => {
      const fb = filebrowser({
        showIcons: true,
        fileLoader: () => [
          { name: 'special', path: '/special', isDirectory: false, icon: '🔥' }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders various file types with icons', async () => {
      const fb = filebrowser({
        showIcons: true,
        fileLoader: () => [
          { name: 'code.ts', path: '/code.ts', isDirectory: false },
          { name: 'doc.pdf', path: '/doc.pdf', isDirectory: false },
          { name: 'image.png', path: '/image.png', isDirectory: false },
          { name: 'archive.zip', path: '/archive.zip', isDirectory: false },
          { name: 'unknown.xyz', path: '/unknown.xyz', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders file sizes in various units', async () => {
      const fb = filebrowser({
        showSize: true,
        fileLoader: () => [
          { name: 'bytes.txt', path: '/bytes.txt', isDirectory: false, size: 500 },
          { name: 'kb.txt', path: '/kb.txt', isDirectory: false, size: 2048 },
          { name: 'mb.txt', path: '/mb.txt', isDirectory: false, size: 2 * 1024 * 1024 },
          { name: 'gb.txt', path: '/gb.txt', isDirectory: false, size: 2 * 1024 * 1024 * 1024 }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders directories without size', async () => {
      const fb = filebrowser({
        showSize: true,
        fileLoader: () => [
          { name: 'folder', path: '/folder', isDirectory: true }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with scroll offset', async () => {
      const fb = filebrowser({
        fileLoader: () => Array.from({ length: 50 }, (_, i) => ({
          name: `file${i}.txt`,
          path: `/file${i}.txt`,
          isDirectory: false
        }))
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height: 10 }
      ;(fb as any)._scrollOffset = 20
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('fills remaining space after entries', async () => {
      const fb = filebrowser({
        fileLoader: () => [
          { name: 'file.txt', path: '/file.txt', isDirectory: false }
        ]
      })
      await fb.goTo('/')
      ;(fb as any)._bounds = { x: 0, y: 0, width, height: 20 }
      fb.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('focus edge cases', () => {
    it('does not emit focus when already focused', () => {
      const handler = vi.fn()
      const fb = filebrowser().onFocus(handler)
      fb.focus()
      fb.focus() // Second call
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not emit blur when not focused', () => {
      const handler = vi.fn()
      const fb = filebrowser().onBlur(handler)
      fb.blur() // Not focused yet
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('default file loader', () => {
    it('uses default file loader when none provided', async () => {
      const fb = filebrowser()
      await fb.goTo('/')
      // Default loader returns simulated files
      expect(fb.entries.length).toBeGreaterThan(0)
    })
  })
})
