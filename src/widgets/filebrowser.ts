/**
 * @oxog/tui - File Browser Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { LeafNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'
import { stringWidth, truncateToWidth } from '../utils/unicode'

// ============================================================
// Types
// ============================================================

/**
 * File entry in the browser.
 */
export interface FileEntry {
  /** File or folder name */
  name: string
  /** Full path */
  path: string
  /** Is directory */
  isDirectory: boolean
  /** File size in bytes (for files only) */
  size?: number
  /** Modified date */
  modified?: Date
  /** Is hidden file */
  hidden?: boolean
  /** Is symlink */
  symlink?: boolean
  /** Custom icon override */
  icon?: string
}

/**
 * Sort options for file browser.
 */
export type FileSortBy = 'name' | 'size' | 'modified' | 'type'
export type FileSortOrder = 'asc' | 'desc'

/**
 * File browser widget properties.
 */
export interface FileBrowserProps {
  /** Initial path */
  path?: string
  /** Show hidden files */
  showHidden?: boolean
  /** Show file sizes */
  showSize?: boolean
  /** Show modified dates */
  showModified?: boolean
  /** Show file icons */
  showIcons?: boolean
  /** Show path breadcrumb */
  showPath?: boolean
  /** Sort by */
  sortBy?: FileSortBy
  /** Sort order */
  sortOrder?: FileSortOrder
  /** Directories first */
  directoriesFirst?: boolean
  /** Multi-select mode */
  multiSelect?: boolean
  /** File filter pattern */
  filter?: string | RegExp
  /** Custom file loader */
  fileLoader?: (path: string) => Promise<FileEntry[]> | FileEntry[]
}

/**
 * File browser node interface.
 */
export interface FileBrowserNode extends Node {
  readonly type: 'filebrowser'

  // Configuration
  path(path: string): this
  showHidden(enabled: boolean): this
  showSize(enabled: boolean): this
  showModified(enabled: boolean): this
  showIcons(enabled: boolean): this
  showPath(enabled: boolean): this
  sortBy(sort: FileSortBy): this
  sortOrder(order: FileSortOrder): this
  directoriesFirst(enabled: boolean): this
  multiSelect(enabled: boolean): this
  filter(pattern: string | RegExp | null): this
  fileLoader(loader: (path: string) => Promise<FileEntry[]> | FileEntry[]): this

  // Navigation
  goTo(path: string): Promise<this>
  goUp(): Promise<this>
  goBack(): Promise<this>
  goForward(): Promise<this>
  refresh(): Promise<this>

  // Control
  focus(): this
  blur(): this
  focusNext(): this
  focusPrevious(): this
  pageUp(): this
  pageDown(): this
  home(): this
  end(): this

  // Selection
  select(path: string): this
  deselect(path: string): this
  selectAll(): this
  deselectAll(): this
  toggleSelect(): this
  selectFocused(): this

  // Actions
  open(): Promise<this>
  createFolder(name: string): Promise<this>
  rename(oldPath: string, newName: string): Promise<this>
  delete(paths: string[]): Promise<this>

  // Events
  onNavigate(handler: (path: string) => void): this
  onSelect(handler: (entries: FileEntry[]) => void): this
  onOpen(handler: (entry: FileEntry) => void): this
  onCreate(handler: (entry: FileEntry) => void): this
  onDelete(handler: (paths: string[]) => void): this
  onRename(handler: (oldPath: string, newPath: string) => void): this
  onError(handler: (error: Error) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // State
  readonly currentPath: string
  readonly entries: FileEntry[]
  readonly selectedEntries: FileEntry[]
  readonly focusedEntry: FileEntry | null
  readonly focusedIndex: number
  readonly isLoading: boolean
  readonly isFocused: boolean
  readonly canGoBack: boolean
  readonly canGoForward: boolean
}

// ============================================================
// File Icons
// ============================================================

const FILE_ICONS: Record<string, string> = {
  // Folders
  'folder': '📁',
  'folder-open': '📂',

  // Common files
  '.txt': '📄',
  '.md': '📝',
  '.json': '📋',
  '.xml': '📋',
  '.yaml': '📋',
  '.yml': '📋',
  '.toml': '📋',

  // Code
  '.js': '🟨',
  '.ts': '🟦',
  '.jsx': '⚛️',
  '.tsx': '⚛️',
  '.py': '🐍',
  '.rb': '💎',
  '.go': '🔵',
  '.rs': '🦀',
  '.java': '☕',
  '.c': '🔷',
  '.cpp': '🔷',
  '.h': '🔷',
  '.cs': '🟣',
  '.php': '🐘',
  '.swift': '🍊',
  '.kt': '🟠',

  // Web
  '.html': '🌐',
  '.css': '🎨',
  '.scss': '🎨',
  '.less': '🎨',
  '.svg': '🖼️',

  // Data
  '.csv': '📊',
  '.sql': '🗃️',
  '.db': '🗃️',

  // Media
  '.png': '🖼️',
  '.jpg': '🖼️',
  '.jpeg': '🖼️',
  '.gif': '🖼️',
  '.ico': '🖼️',
  '.mp3': '🎵',
  '.wav': '🎵',
  '.mp4': '🎬',
  '.avi': '🎬',
  '.mkv': '🎬',

  // Archives
  '.zip': '📦',
  '.tar': '📦',
  '.gz': '📦',
  '.rar': '📦',
  '.7z': '📦',

  // Documents
  '.pdf': '📕',
  '.doc': '📘',
  '.docx': '📘',
  '.xls': '📗',
  '.xlsx': '📗',
  '.ppt': '📙',
  '.pptx': '📙',

  // Config
  '.env': '⚙️',
  '.gitignore': '🔒',
  '.npmrc': '⚙️',

  // Default
  'default': '📄'
}

function getFileIcon(entry: FileEntry): string {
  if (entry.icon) return entry.icon

  if (entry.isDirectory) {
    return FILE_ICONS['folder']!
  }

  const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
  return FILE_ICONS[ext] ?? FILE_ICONS['default']!
}

// ============================================================
// Default File Loader (simulated)
// ============================================================

function defaultFileLoader(_path: string): FileEntry[] {
  // This is a placeholder - in a real implementation,
  // this would use fs/promises or a similar API
  return [
    { name: '..', path: '..', isDirectory: true },
    { name: 'documents', path: '/documents', isDirectory: true },
    { name: 'downloads', path: '/downloads', isDirectory: true },
    { name: 'pictures', path: '/pictures', isDirectory: true },
    { name: 'readme.md', path: '/readme.md', isDirectory: false, size: 1024 },
    { name: 'config.json', path: '/config.json', isDirectory: false, size: 256 },
  ]
}

// ============================================================
// Implementation
// ============================================================

class FileBrowserNodeImpl extends LeafNode implements FileBrowserNode {
  readonly type = 'filebrowser' as const

  private _path: string = '/'
  private _entries: FileEntry[] = []
  private _showHidden: boolean = false
  private _showSize: boolean = true
  private _showModified: boolean = true
  private _showIcons: boolean = true
  private _showPath: boolean = true
  private _sortBy: FileSortBy = 'name'
  private _sortOrder: FileSortOrder = 'asc'
  private _directoriesFirst: boolean = true
  private _multiSelect: boolean = false
  private _filter: RegExp | null = null
  private _fileLoader: (path: string) => Promise<FileEntry[]> | FileEntry[] = defaultFileLoader

  private _focusedIndex: number = 0
  private _scrollOffset: number = 0
  private _selectedPaths: Set<string> = new Set()
  private _focused: boolean = false
  private _loading: boolean = false

  private _history: string[] = []
  private _historyIndex: number = -1

  private _onNavigateHandlers: ((path: string) => void)[] = []
  private _onSelectHandlers: ((entries: FileEntry[]) => void)[] = []
  private _onOpenHandlers: ((entry: FileEntry) => void)[] = []
  private _onCreateHandlers: ((entry: FileEntry) => void)[] = []
  private _onDeleteHandlers: ((paths: string[]) => void)[] = []
  private _onRenameHandlers: ((oldPath: string, newPath: string) => void)[] = []
  private _onErrorHandlers: ((error: Error) => void)[] = []
  private _onFocusHandlers: (() => void)[] = []
  private _onBlurHandlers: (() => void)[] = []

  constructor(props?: FileBrowserProps) {
    super()
    if (props) {
      if (props.path) this._path = props.path
      if (props.showHidden !== undefined) this._showHidden = props.showHidden
      if (props.showSize !== undefined) this._showSize = props.showSize
      if (props.showModified !== undefined) this._showModified = props.showModified
      if (props.showIcons !== undefined) this._showIcons = props.showIcons
      if (props.showPath !== undefined) this._showPath = props.showPath
      if (props.sortBy) this._sortBy = props.sortBy
      if (props.sortOrder) this._sortOrder = props.sortOrder
      if (props.directoriesFirst !== undefined) this._directoriesFirst = props.directoriesFirst
      if (props.multiSelect !== undefined) this._multiSelect = props.multiSelect
      if (props.filter) {
        this._filter = typeof props.filter === 'string'
          ? new RegExp(props.filter)
          : props.filter
      }
      if (props.fileLoader) this._fileLoader = props.fileLoader
    }
  }

  // Getters
  get currentPath(): string {
    return this._path
  }

  get entries(): FileEntry[] {
    return this.getFilteredAndSortedEntries()
  }

  get selectedEntries(): FileEntry[] {
    return this._entries.filter(e => this._selectedPaths.has(e.path))
  }

  get focusedEntry(): FileEntry | null {
    const entries = this.entries
    return entries[this._focusedIndex] ?? null
  }

  get focusedIndex(): number {
    return this._focusedIndex
  }

  get isLoading(): boolean {
    return this._loading
  }

  get isFocused(): boolean {
    return this._focused
  }

  get canGoBack(): boolean {
    return this._historyIndex > 0
  }

  get canGoForward(): boolean {
    return this._historyIndex < this._history.length - 1
  }

  private getFilteredAndSortedEntries(): FileEntry[] {
    let entries = [...this._entries]

    // Filter hidden files (but never filter parent directory '..')
    if (!this._showHidden) {
      entries = entries.filter(e => e.name === '..' || (!e.hidden && !e.name.startsWith('.')))
    }

    // Apply custom filter
    if (this._filter) {
      entries = entries.filter(e => e.isDirectory || this._filter!.test(e.name))
    }

    // Sort
    entries.sort((a, b) => {
      // Directories first
      if (this._directoriesFirst) {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
      }

      // Parent directory always first
      if (a.name === '..') return -1
      if (b.name === '..') return 1

      let comparison = 0

      switch (this._sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = (a.size ?? 0) - (b.size ?? 0)
          break
        case 'modified':
          comparison = (a.modified?.getTime() ?? 0) - (b.modified?.getTime() ?? 0)
          break
        case 'type':
          const extA = a.name.slice(a.name.lastIndexOf('.'))
          const extB = b.name.slice(b.name.lastIndexOf('.'))
          comparison = extA.localeCompare(extB)
          break
      }

      return this._sortOrder === 'asc' ? comparison : -comparison
    })

    return entries
  }

  // Configuration
  path(path: string): this {
    this._path = path
    this.markDirty()
    return this
  }

  showHidden(enabled: boolean): this {
    this._showHidden = enabled
    this._focusedIndex = 0
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  showSize(enabled: boolean): this {
    this._showSize = enabled
    this.markDirty()
    return this
  }

  showModified(enabled: boolean): this {
    this._showModified = enabled
    this.markDirty()
    return this
  }

  showIcons(enabled: boolean): this {
    this._showIcons = enabled
    this.markDirty()
    return this
  }

  showPath(enabled: boolean): this {
    this._showPath = enabled
    this.markDirty()
    return this
  }

  sortBy(sort: FileSortBy): this {
    this._sortBy = sort
    this.markDirty()
    return this
  }

  sortOrder(order: FileSortOrder): this {
    this._sortOrder = order
    this.markDirty()
    return this
  }

  directoriesFirst(enabled: boolean): this {
    this._directoriesFirst = enabled
    this.markDirty()
    return this
  }

  multiSelect(enabled: boolean): this {
    this._multiSelect = enabled
    if (!enabled) {
      this._selectedPaths.clear()
    }
    this.markDirty()
    return this
  }

  filter(pattern: string | RegExp | null): this {
    if (pattern === null) {
      this._filter = null
    } else if (typeof pattern === 'string') {
      this._filter = new RegExp(pattern)
    } else {
      this._filter = pattern
    }
    this._focusedIndex = 0
    this._scrollOffset = 0
    this.markDirty()
    return this
  }

  fileLoader(loader: (path: string) => Promise<FileEntry[]> | FileEntry[]): this {
    this._fileLoader = loader
    return this
  }

  // Navigation
  async goTo(path: string): Promise<this> {
    try {
      this._loading = true
      this.markDirty()

      const entries = await this._fileLoader(path)
      this._entries = entries
      this._path = path
      this._focusedIndex = 0
      this._scrollOffset = 0
      this._selectedPaths.clear()

      // Update history
      if (this._historyIndex === -1 || this._history[this._historyIndex] !== path) {
        // Remove forward history
        this._history = this._history.slice(0, this._historyIndex + 1)
        this._history.push(path)
        this._historyIndex = this._history.length - 1
      }

      for (const handler of this._onNavigateHandlers) {
        handler(path)
      }
    } catch (error) {
      for (const handler of this._onErrorHandlers) {
        handler(error instanceof Error ? error : new Error(String(error)))
      }
    } finally {
      this._loading = false
      this.markDirty()
    }

    return this
  }

  async goUp(): Promise<this> {
    const parentPath = this._path.replace(/\/[^/]+\/?$/, '') || '/'
    return this.goTo(parentPath)
  }

  async goBack(): Promise<this> {
    if (this.canGoBack) {
      this._historyIndex--
      const path = this._history[this._historyIndex]!
      try {
        this._loading = true
        this.markDirty()

        const entries = await this._fileLoader(path)
        this._entries = entries
        this._path = path
        this._focusedIndex = 0
        this._scrollOffset = 0

        for (const handler of this._onNavigateHandlers) {
          handler(path)
        }
      } catch (error) {
        for (const handler of this._onErrorHandlers) {
          handler(error instanceof Error ? error : new Error(String(error)))
        }
      } finally {
        this._loading = false
        this.markDirty()
      }
    }
    return this
  }

  async goForward(): Promise<this> {
    if (this.canGoForward) {
      this._historyIndex++
      const path = this._history[this._historyIndex]!
      try {
        this._loading = true
        this.markDirty()

        const entries = await this._fileLoader(path)
        this._entries = entries
        this._path = path
        this._focusedIndex = 0
        this._scrollOffset = 0

        for (const handler of this._onNavigateHandlers) {
          handler(path)
        }
      } catch (error) {
        for (const handler of this._onErrorHandlers) {
          handler(error instanceof Error ? error : new Error(String(error)))
        }
      } finally {
        this._loading = false
        this.markDirty()
      }
    }
    return this
  }

  async refresh(): Promise<this> {
    return this.goTo(this._path)
  }

  // Control
  focus(): this {
    if (!this._focused) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  focusNext(): this {
    const entries = this.entries
    if (entries.length === 0) return this

    this._focusedIndex = Math.min(this._focusedIndex + 1, entries.length - 1)
    this.ensureVisible()
    this.markDirty()
    return this
  }

  focusPrevious(): this {
    const entries = this.entries
    if (entries.length === 0) return this

    this._focusedIndex = Math.max(this._focusedIndex - 1, 0)
    this.ensureVisible()
    this.markDirty()
    return this
  }

  pageUp(): this {
    const { height } = this._bounds
    const visibleHeight = height - (this._showPath ? 2 : 1)

    this._focusedIndex = Math.max(this._focusedIndex - visibleHeight, 0)
    this.ensureVisible()
    this.markDirty()
    return this
  }

  pageDown(): this {
    const entries = this.entries
    const { height } = this._bounds
    const visibleHeight = height - (this._showPath ? 2 : 1)

    this._focusedIndex = Math.min(this._focusedIndex + visibleHeight, entries.length - 1)
    this.ensureVisible()
    this.markDirty()
    return this
  }

  home(): this {
    this._focusedIndex = 0
    this.ensureVisible()
    this.markDirty()
    return this
  }

  end(): this {
    const entries = this.entries
    this._focusedIndex = entries.length - 1
    this.ensureVisible()
    this.markDirty()
    return this
  }

  private ensureVisible(): void {
    const { height } = this._bounds
    const visibleHeight = height - (this._showPath ? 2 : 1) // Header takes space

    if (this._focusedIndex < this._scrollOffset) {
      this._scrollOffset = this._focusedIndex
    } else if (this._focusedIndex >= this._scrollOffset + visibleHeight) {
      this._scrollOffset = this._focusedIndex - visibleHeight + 1
    }
  }

  // Selection
  select(path: string): this {
    this._selectedPaths.add(path)
    this.emitSelect()
    this.markDirty()
    return this
  }

  deselect(path: string): this {
    this._selectedPaths.delete(path)
    this.emitSelect()
    this.markDirty()
    return this
  }

  selectAll(): this {
    if (this._multiSelect) {
      for (const entry of this.entries) {
        if (entry.name !== '..') {
          this._selectedPaths.add(entry.path)
        }
      }
      this.emitSelect()
      this.markDirty()
    }
    return this
  }

  deselectAll(): this {
    this._selectedPaths.clear()
    this.emitSelect()
    this.markDirty()
    return this
  }

  toggleSelect(): this {
    const entry = this.focusedEntry
    if (!entry || entry.name === '..') return this

    if (this._multiSelect) {
      if (this._selectedPaths.has(entry.path)) {
        this._selectedPaths.delete(entry.path)
      } else {
        this._selectedPaths.add(entry.path)
      }
    } else {
      this._selectedPaths.clear()
      this._selectedPaths.add(entry.path)
    }

    this.emitSelect()
    this.markDirty()
    return this
  }

  selectFocused(): this {
    const entry = this.focusedEntry
    if (!entry || entry.name === '..') return this

    if (!this._multiSelect) {
      this._selectedPaths.clear()
    }
    this._selectedPaths.add(entry.path)
    this.emitSelect()
    this.markDirty()
    return this
  }

  private emitSelect(): void {
    for (const handler of this._onSelectHandlers) {
      handler(this.selectedEntries)
    }
  }

  // Actions
  async open(): Promise<this> {
    const entry = this.focusedEntry
    if (!entry) return this

    if (entry.isDirectory) {
      const newPath = entry.name === '..'
        ? this._path.replace(/\/[^/]+\/?$/, '') || '/'
        : entry.path
      await this.goTo(newPath)
    } else {
      for (const handler of this._onOpenHandlers) {
        handler(entry)
      }
    }

    return this
  }

  async createFolder(name: string): Promise<this> {
    const newPath = `${this._path}/${name}`.replace(/\/+/g, '/')
    const newEntry: FileEntry = {
      name,
      path: newPath,
      isDirectory: true
    }

    // Add to entries (in real implementation, this would create the folder on disk)
    this._entries.push(newEntry)

    for (const handler of this._onCreateHandlers) {
      handler(newEntry)
    }

    this.markDirty()
    return this
  }

  async rename(oldPath: string, newName: string): Promise<this> {
    const entry = this._entries.find(e => e.path === oldPath)
    if (!entry) return this

    const newPath = oldPath.replace(/[^/]+$/, newName)

    // Update entry (in real implementation, this would rename on disk)
    entry.name = newName
    entry.path = newPath

    // Update selection if needed
    if (this._selectedPaths.has(oldPath)) {
      this._selectedPaths.delete(oldPath)
      this._selectedPaths.add(newPath)
    }

    for (const handler of this._onRenameHandlers) {
      handler(oldPath, newPath)
    }

    this.markDirty()
    return this
  }

  async delete(paths: string[]): Promise<this> {
    // Remove from entries (in real implementation, this would delete from disk)
    this._entries = this._entries.filter(e => !paths.includes(e.path))

    // Remove from selection
    for (const path of paths) {
      this._selectedPaths.delete(path)
    }

    // Adjust focus
    const entries = this.entries
    if (this._focusedIndex >= entries.length) {
      this._focusedIndex = Math.max(0, entries.length - 1)
    }

    for (const handler of this._onDeleteHandlers) {
      handler(paths)
    }

    this.markDirty()
    return this
  }

  // Events
  onNavigate(handler: (path: string) => void): this {
    this._onNavigateHandlers.push(handler)
    return this
  }

  onSelect(handler: (entries: FileEntry[]) => void): this {
    this._onSelectHandlers.push(handler)
    return this
  }

  onOpen(handler: (entry: FileEntry) => void): this {
    this._onOpenHandlers.push(handler)
    return this
  }

  onCreate(handler: (entry: FileEntry) => void): this {
    this._onCreateHandlers.push(handler)
    return this
  }

  onDelete(handler: (paths: string[]) => void): this {
    this._onDeleteHandlers.push(handler)
    return this
  }

  onRename(handler: (oldPath: string, newPath: string) => void): this {
    this._onRenameHandlers.push(handler)
    return this
  }

  onError(handler: (error: Error) => void): this {
    this._onErrorHandlers.push(handler)
    return this
  }

  onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  /**
   * Dispose of file browser and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._entries = []
    this._selectedPaths.clear()
    this._history = []
    this._onNavigateHandlers = []
    this._onSelectHandlers = []
    this._onOpenHandlers = []
    this._onCreateHandlers = []
    this._onDeleteHandlers = []
    this._onRenameHandlers = []
    this._onErrorHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._focused) return false

    switch (key) {
      case 'down':
      case 'j':
        this.focusNext()
        return true

      case 'up':
      case 'k':
        this.focusPrevious()
        return true

      case 'enter':
        this.open()
        return true

      case 'space':
        if (this._multiSelect) {
          this.toggleSelect()
          this.focusNext()
        } else {
          this.open()
        }
        return true

      case 'backspace':
        this.goUp()
        return true

      case 'pageup':
        this.pageUp()
        return true

      case 'pagedown':
        this.pageDown()
        return true

      case 'home':
        this.home()
        return true

      case 'end':
        this.end()
        return true

      case 'h':
        if (!ctrl) {
          this._showHidden = !this._showHidden
          this.markDirty()
          return true
        }
        break

      case 'r':
        if (ctrl) {
          this.refresh()
          return true
        }
        break

      case 'a':
        if (ctrl && this._multiSelect) {
          this.selectAll()
          return true
        }
        break

      case 'left':
        this.goBack()
        return true

      case 'right':
        this.goForward()
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    if (x < bx || x >= bx + width || y < by || y >= by + height) {
      return false
    }

    if (action === 'press') {
      const headerOffset = this._showPath ? 1 : 0
      const itemY = y - by - headerOffset

      if (itemY >= 0) {
        const entries = this.entries
        const index = this._scrollOffset + itemY

        if (index < entries.length) {
          if (this._focusedIndex === index) {
            // Double click simulation - open on same item click
            this.open()
          } else {
            this._focusedIndex = index
            this.markDirty()
          }
        }
      }
      return true
    }

    if (action === 'scroll_up') {
      this.focusPrevious()
      return true
    }

    if (action === 'scroll_down') {
      this.focusNext()
      return true
    }

    return true
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    let currentY = y

    // Render path/breadcrumb
    if (this._showPath) {
      let pathText = this._path
      if (stringWidth(pathText) > width - 4) {
        pathText = '...' + pathText.slice(-(width - 7))
      }
      pathText = '📂 ' + pathText

      buffer.write(x, currentY, pathText, { fg, bg, attrs: ATTR_BOLD })

      // Fill rest of line
      for (let col = x + stringWidth(pathText); col < x + width; col++) {
        buffer.set(col, currentY, { char: ' ', fg, bg, attrs: 0 })
      }

      currentY++
    }

    // Render loading indicator
    if (this._loading) {
      buffer.write(x, currentY, '⏳ Loading...', { fg, bg, attrs: ATTR_DIM })
      return
    }

    // Render entries
    const entries = this.entries
    const visibleHeight = y + height - currentY

    for (let i = 0; i < visibleHeight && this._scrollOffset + i < entries.length; i++) {
      const entry = entries[this._scrollOffset + i]!
      const isFocused = this._focused && this._scrollOffset + i === this._focusedIndex
      const isSelected = this._selectedPaths.has(entry.path)

      this.renderEntry(
        buffer,
        entry,
        x,
        currentY + i,
        width,
        fg,
        bg,
        isFocused,
        isSelected
      )
    }

    // Fill remaining space
    for (let row = currentY + Math.min(visibleHeight, entries.length - this._scrollOffset); row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        buffer.set(col, row, { char: ' ', fg, bg, attrs: 0 })
      }
    }
  }

  private renderEntry(
    buffer: Buffer,
    entry: FileEntry,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    isFocused: boolean,
    isSelected: boolean
  ): void {
    let attrs = entry.hidden || entry.name.startsWith('.') ? ATTR_DIM : 0
    if (isFocused) attrs |= ATTR_INVERSE
    if (isSelected) attrs |= ATTR_BOLD

    let col = x

    // Selection indicator
    if (this._multiSelect) {
      const marker = isSelected ? '✓ ' : '  '
      buffer.write(col, y, marker, { fg, bg, attrs })
      col += 2
    }

    // Icon
    if (this._showIcons) {
      const icon = getFileIcon(entry) + ' '
      buffer.write(col, y, icon, { fg, bg, attrs: isFocused ? ATTR_INVERSE : 0 })
      col += 2
    }

    // Name
    const nameWidth = width - (col - x) - (this._showSize ? 10 : 0) - (this._showModified ? 12 : 0)
    let name = entry.name
    if (entry.isDirectory && name !== '..') {
      name += '/'
    }
    if (stringWidth(name) > nameWidth) {
      name = truncateToWidth(name, nameWidth - 1) + '…'
    }
    buffer.write(col, y, name.padEnd(nameWidth), { fg, bg, attrs })
    col += nameWidth

    // Size
    if (this._showSize) {
      let sizeText = ''
      if (!entry.isDirectory && entry.size !== undefined) {
        sizeText = this.formatSize(entry.size)
      }
      buffer.write(col, y, sizeText.padStart(9) + ' ', { fg, bg, attrs: ATTR_DIM })
      col += 10
    }

    // Modified date
    if (this._showModified) {
      let dateText = ''
      if (entry.modified) {
        dateText = this.formatDate(entry.modified)
      }
      buffer.write(col, y, dateText.padStart(11) + ' ', { fg, bg, attrs: ATTR_DIM })
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a file browser widget.
 *
 * @param props - File browser properties
 * @returns File browser node
 *
 * @example
 * ```typescript
 * // Basic file browser
 * const browser = filebrowser()
 *   .path('/home/user')
 *   .onOpen(entry => {
 *     console.log('Opened:', entry.path)
 *   })
 *   .onNavigate(path => {
 *     console.log('Navigated to:', path)
 *   })
 *
 * // With custom file loader (for actual file system access)
 * const browser = filebrowser({
 *   fileLoader: async (path) => {
 *     const fs = await import('fs/promises')
 *     const entries = await fs.readdir(path, { withFileTypes: true })
 *     return entries.map(entry => ({
 *       name: entry.name,
 *       path: `${path}/${entry.name}`,
 *       isDirectory: entry.isDirectory()
 *     }))
 *   }
 * })
 *
 * // Multi-select mode
 * const picker = filebrowser({ multiSelect: true })
 *   .filter(/\.(ts|js)$/)
 *   .onSelect(entries => {
 *     console.log('Selected:', entries.map(e => e.name))
 *   })
 *
 * // Customized display
 * const minimal = filebrowser()
 *   .showIcons(false)
 *   .showSize(false)
 *   .showModified(false)
 *   .sortBy('name')
 *   .directoriesFirst(true)
 *
 * // Navigation
 * await browser.goTo('/documents')
 * await browser.goUp()
 * await browser.refresh()
 * browser.focusNext()
 * browser.open() // Open focused entry
 * ```
 */
export function filebrowser(props?: FileBrowserProps): FileBrowserNode {
  return new FileBrowserNodeImpl(props)
}
