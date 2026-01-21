/**
 * File Explorer - Professional TUI Application
 *
 * A full-featured file manager demonstrating:
 * - Real filesystem operations (fs module)
 * - State management with actions
 * - Vim keybindings
 * - Multi-select and batch operations
 * - Error handling
 * - Responsive layout
 * - Breadcrumb navigation
 * - File operations (delete, rename, copy)
 *
 * Run with: npx tsx examples/app-file-explorer.ts [path]
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { tui, box, text, list, input, modal, breadcrumb, statusbar, toast } from '../src'
import {
  standardPlugins,
  statePlugin,
  shortcutsPlugin,
  responsivePlugin
} from '../src/plugins'
import type { Action, Store, Reducer } from '../src/plugins/state'
import type { ShortcutsPluginAPI } from '../src/plugins/shortcuts'
import type { ResponsivePluginAPI } from '../src/plugins/responsive'

// ============================================================
// Types
// ============================================================

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
  permissions: string
  selected: boolean
}

interface AppState {
  currentPath: string
  files: FileEntry[]
  selectedIndex: number
  selectedFiles: Set<string>
  showHidden: boolean
  sortBy: 'name' | 'size' | 'modified'
  sortAsc: boolean
  error: string | null
  loading: boolean
  clipboard: { files: string[]; operation: 'copy' | 'cut' } | null
  searchQuery: string
  isSearching: boolean
}

// ============================================================
// Actions
// ============================================================

const Actions = {
  SET_PATH: 'SET_PATH',
  SET_FILES: 'SET_FILES',
  SET_SELECTED_INDEX: 'SET_SELECTED_INDEX',
  TOGGLE_FILE_SELECTION: 'TOGGLE_FILE_SELECTION',
  SELECT_ALL: 'SELECT_ALL',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  TOGGLE_HIDDEN: 'TOGGLE_HIDDEN',
  SET_SORT: 'SET_SORT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_CLIPBOARD: 'SET_CLIPBOARD',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCHING: 'SET_SEARCHING'
} as const

// ============================================================
// Reducer
// ============================================================

const initialState: AppState = {
  currentPath: process.argv[2] || process.cwd(),
  files: [],
  selectedIndex: 0,
  selectedFiles: new Set(),
  showHidden: false,
  sortBy: 'name',
  sortAsc: true,
  error: null,
  loading: false,
  clipboard: null,
  searchQuery: '',
  isSearching: false
}

const reducer: Reducer<AppState> = (state, action: Action): AppState => {
  switch (action.type) {
    case Actions.SET_PATH:
      return { ...state, currentPath: action.payload as string, selectedIndex: 0, selectedFiles: new Set() }
    case Actions.SET_FILES:
      return { ...state, files: action.payload as FileEntry[], loading: false }
    case Actions.SET_SELECTED_INDEX:
      return { ...state, selectedIndex: Math.max(0, Math.min(action.payload as number, state.files.length - 1)) }
    case Actions.TOGGLE_FILE_SELECTION: {
      const filePath = action.payload as string
      const newSet = new Set(state.selectedFiles)
      if (newSet.has(filePath)) {
        newSet.delete(filePath)
      } else {
        newSet.add(filePath)
      }
      return { ...state, selectedFiles: newSet }
    }
    case Actions.SELECT_ALL: {
      const newSet = new Set(state.files.map(f => f.path))
      return { ...state, selectedFiles: newSet }
    }
    case Actions.CLEAR_SELECTION:
      return { ...state, selectedFiles: new Set() }
    case Actions.TOGGLE_HIDDEN:
      return { ...state, showHidden: !state.showHidden }
    case Actions.SET_SORT:
      return { ...state, sortBy: action.payload as 'name' | 'size' | 'modified', sortAsc: state.sortBy === action.payload ? !state.sortAsc : true }
    case Actions.SET_ERROR:
      return { ...state, error: action.payload as string, loading: false }
    case Actions.CLEAR_ERROR:
      return { ...state, error: null }
    case Actions.SET_LOADING:
      return { ...state, loading: action.payload as boolean }
    case Actions.SET_CLIPBOARD:
      return { ...state, clipboard: action.payload as { files: string[]; operation: 'copy' | 'cut' } | null }
    case Actions.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload as string }
    case Actions.SET_SEARCHING:
      return { ...state, isSearching: action.payload as boolean }
    default:
      return state
  }
}

// ============================================================
// Helpers
// ============================================================

function formatSize(bytes: number): string {
  if (bytes === 0) return '     -'
  const units = ['B', 'K', 'M', 'G', 'T']
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, exp)
  return `${size.toFixed(exp > 0 ? 1 : 0).padStart(5)}${units[exp]}`
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}d ago`
  } else if (days < 365) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }
}

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '\uD83D\uDCC1' // Folder icon
  const ext = path.extname(entry.name).toLowerCase()
  const icons: Record<string, string> = {
    '.ts': '\uD83D\uDCDD',
    '.js': '\uD83D\uDCDD',
    '.json': '{}',
    '.md': '\uD83D\uDCC4',
    '.txt': '\uD83D\uDCC4',
    '.png': '\uD83D\uDDBC\uFE0F',
    '.jpg': '\uD83D\uDDBC\uFE0F',
    '.gif': '\uD83D\uDDBC\uFE0F',
    '.mp3': '\uD83C\uDFB5',
    '.mp4': '\uD83C\uDFAC',
    '.zip': '\uD83D\uDCE6',
    '.tar': '\uD83D\uDCE6',
    '.gz': '\uD83D\uDCE6'
  }
  return icons[ext] || '\uD83D\uDCC4'
}

function getPermissionsString(mode: number): string {
  const flags = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
  const owner = flags[(mode >> 6) & 7]
  const group = flags[(mode >> 3) & 7]
  const other = flags[mode & 7]
  return `${owner}${group}${other}`
}

// ============================================================
// File Operations
// ============================================================

async function readDirectory(dirPath: string, showHidden: boolean, sortBy: string, sortAsc: boolean): Promise<FileEntry[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  const files: FileEntry[] = []

  // Add parent directory entry
  if (dirPath !== '/') {
    files.push({
      name: '..',
      path: path.dirname(dirPath),
      isDirectory: true,
      size: 0,
      modified: new Date(),
      permissions: 'rwxr-xr-x',
      selected: false
    })
  }

  for (const entry of entries) {
    // Skip hidden files unless showHidden
    if (!showHidden && entry.name.startsWith('.')) continue

    try {
      const fullPath = path.join(dirPath, entry.name)
      const stats = await fs.promises.stat(fullPath)

      files.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        permissions: getPermissionsString(stats.mode),
        selected: false
      })
    } catch {
      // Skip files we can't stat
    }
  }

  // Sort files
  files.sort((a, b) => {
    // Parent dir always first
    if (a.name === '..') return -1
    if (b.name === '..') return 1

    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    let cmp = 0
    switch (sortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'size':
        cmp = a.size - b.size
        break
      case 'modified':
        cmp = a.modified.getTime() - b.modified.getTime()
        break
    }

    return sortAsc ? cmp : -cmp
  })

  return files
}

async function deleteFiles(filePaths: string[]): Promise<{ success: string[]; failed: { path: string; error: string }[] }> {
  const success: string[] = []
  const failed: { path: string; error: string }[] = []

  for (const filePath of filePaths) {
    try {
      const stats = await fs.promises.stat(filePath)
      if (stats.isDirectory()) {
        await fs.promises.rm(filePath, { recursive: true })
      } else {
        await fs.promises.unlink(filePath)
      }
      success.push(filePath)
    } catch (err) {
      failed.push({ path: filePath, error: (err as Error).message })
    }
  }

  return { success, failed }
}

async function copyFiles(sources: string[], destDir: string): Promise<{ success: string[]; failed: { path: string; error: string }[] }> {
  const success: string[] = []
  const failed: { path: string; error: string }[] = []

  for (const src of sources) {
    try {
      const name = path.basename(src)
      const dest = path.join(destDir, name)
      await fs.promises.cp(src, dest, { recursive: true })
      success.push(src)
    } catch (err) {
      failed.push({ path: src, error: (err as Error).message })
    }
  }

  return { success, failed }
}

async function moveFiles(sources: string[], destDir: string): Promise<{ success: string[]; failed: { path: string; error: string }[] }> {
  const success: string[] = []
  const failed: { path: string; error: string }[] = []

  for (const src of sources) {
    try {
      const name = path.basename(src)
      const dest = path.join(destDir, name)
      await fs.promises.rename(src, dest)
      success.push(src)
    } catch (err) {
      failed.push({ path: src, error: (err as Error).message })
    }
  }

  return { success, failed }
}

// ============================================================
// Main Application
// ============================================================

async function main() {
  // Create app with plugins
  const app = tui({
    fps: 30,
    plugins: [
      ...standardPlugins(),
      statePlugin({ autoRender: true }),
      shortcutsPlugin({ vimMode: true }),
      responsivePlugin()
    ]
  })

  // Get plugin APIs
  const shortcuts = (app as unknown as { shortcuts: ShortcutsPluginAPI }).shortcuts
  const responsive = (app as unknown as { responsive: ResponsivePluginAPI }).responsive
  const stateAPI = (app as unknown as { state: { createStore: <T>(opts: { initialState: T; reducer: Reducer<T> }) => Store<T> } }).state

  // Create store
  const store = stateAPI.createStore({
    initialState,
    reducer
  })

  // UI Components
  let fileList: ReturnType<typeof list>
  let breadcrumbNav: ReturnType<typeof breadcrumb>
  let statusBar: ReturnType<typeof statusbar>
  let confirmModal: ReturnType<typeof modal> | null = null
  let searchInput: ReturnType<typeof input> | null = null
  let toastWidget: ReturnType<typeof toast>

  // Load directory
  async function loadDirectory(dirPath: string) {
    store.dispatch({ type: Actions.SET_LOADING, payload: true })
    store.dispatch({ type: Actions.CLEAR_ERROR })

    try {
      const state = store.getState()
      const files = await readDirectory(dirPath, state.showHidden, state.sortBy, state.sortAsc)
      store.dispatch({ type: Actions.SET_PATH, payload: dirPath })
      store.dispatch({ type: Actions.SET_FILES, payload: files })
      updateUI()
    } catch (err) {
      store.dispatch({ type: Actions.SET_ERROR, payload: (err as Error).message })
      showToast(`Error: ${(err as Error).message}`, 'error')
    }
  }

  // Show toast notification
  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const colors: Record<string, string> = {
      info: '#3498db',
      success: '#2ecc71',
      error: '#e74c3c'
    }
    toastWidget
      .message(message)
      .bg(colors[type])
      .show(3000)
  }

  // Update UI from state
  function updateUI() {
    const state = store.getState()

    // Update file list
    const items = state.files.map(f => {
      const icon = getFileIcon(f)
      const selected = state.selectedFiles.has(f.path) ? '*' : ' '
      const size = f.isDirectory ? '   DIR' : formatSize(f.size)
      const date = formatDate(f.modified)
      return `${selected} ${icon} ${f.name.padEnd(30).slice(0, 30)} ${size} ${date}`
    })

    fileList.items(items)
    fileList.selectedIndex(state.selectedIndex)

    // Update breadcrumb
    const pathParts = state.currentPath.split(path.sep).filter(Boolean)
    const crumbs = [{ label: os.platform() === 'win32' ? 'C:' : '/', value: path.sep }]
    let cumPath = ''
    for (const part of pathParts) {
      cumPath = path.join(cumPath, path.sep, part)
      crumbs.push({ label: part, value: cumPath })
    }
    breadcrumbNav.items(crumbs)

    // Update status bar
    const selectedCount = state.selectedFiles.size
    const fileCount = state.files.filter(f => f.name !== '..').length
    const dirCount = state.files.filter(f => f.isDirectory && f.name !== '..').length

    let statusText = `${fileCount} items (${dirCount} dirs)`
    if (selectedCount > 0) {
      statusText = `${selectedCount} selected | ${statusText}`
    }
    if (state.clipboard) {
      statusText = `[${state.clipboard.operation.toUpperCase()}] ${state.clipboard.files.length} files | ${statusText}`
    }

    statusBar.items([
      { label: statusText },
      { label: state.showHidden ? 'Hidden: ON' : 'Hidden: OFF' },
      { label: `Sort: ${state.sortBy}` },
      { label: shortcuts.isVimMode() ? `VIM: ${shortcuts.getVimMode()}` : 'NORMAL' }
    ])
  }

  // Navigate to entry
  function navigate(entry: FileEntry) {
    if (entry.isDirectory) {
      loadDirectory(entry.path)
    } else {
      showToast(`File: ${entry.name}`, 'info')
    }
  }

  // Handle delete
  async function handleDelete() {
    const state = store.getState()
    const toDelete = state.selectedFiles.size > 0
      ? Array.from(state.selectedFiles)
      : [state.files[state.selectedIndex]?.path].filter(Boolean)

    if (toDelete.length === 0) return

    // Create confirm modal
    confirmModal = modal({
      title: 'Confirm Delete',
      width: 50,
      height: 10
    })
      .add(text(`Delete ${toDelete.length} item(s)?`).color('#e74c3c'))
      .add(text('\nPress Y to confirm, N to cancel'))

    confirmModal.show()
    app.markDirty()

    // Wait for confirmation via key handler
  }

  // Execute delete
  async function executeDelete() {
    const state = store.getState()
    const toDelete = state.selectedFiles.size > 0
      ? Array.from(state.selectedFiles)
      : [state.files[state.selectedIndex]?.path].filter(Boolean)

    confirmModal?.hide()
    confirmModal = null

    if (toDelete.length === 0) return

    const result = await deleteFiles(toDelete)
    if (result.success.length > 0) {
      showToast(`Deleted ${result.success.length} item(s)`, 'success')
      store.dispatch({ type: Actions.CLEAR_SELECTION })
      loadDirectory(state.currentPath)
    }
    if (result.failed.length > 0) {
      showToast(`Failed to delete ${result.failed.length} item(s)`, 'error')
    }
  }

  // Handle copy/cut
  function handleCopy(operation: 'copy' | 'cut') {
    const state = store.getState()
    const files = state.selectedFiles.size > 0
      ? Array.from(state.selectedFiles)
      : [state.files[state.selectedIndex]?.path].filter(Boolean)

    if (files.length === 0) return

    store.dispatch({ type: Actions.SET_CLIPBOARD, payload: { files, operation } })
    showToast(`${operation === 'copy' ? 'Copied' : 'Cut'} ${files.length} item(s)`, 'info')
    updateUI()
  }

  // Handle paste
  async function handlePaste() {
    const state = store.getState()
    if (!state.clipboard) {
      showToast('Clipboard is empty', 'error')
      return
    }

    const { files, operation } = state.clipboard
    const result = operation === 'copy'
      ? await copyFiles(files, state.currentPath)
      : await moveFiles(files, state.currentPath)

    if (result.success.length > 0) {
      showToast(`${operation === 'copy' ? 'Copied' : 'Moved'} ${result.success.length} item(s)`, 'success')
      if (operation === 'cut') {
        store.dispatch({ type: Actions.SET_CLIPBOARD, payload: null })
      }
      loadDirectory(state.currentPath)
    }
    if (result.failed.length > 0) {
      showToast(`Failed: ${result.failed.length} item(s)`, 'error')
    }
  }

  // Register shortcuts
  shortcuts.registerMany([
    {
      id: 'quit',
      keys: ['q', 'ctrl+c'],
      handler: () => { app.quit() },
      description: 'Quit',
      category: 'Application'
    },
    {
      id: 'refresh',
      keys: ['r', 'ctrl+r'],
      handler: () => {
        const state = store.getState()
        loadDirectory(state.currentPath)
      },
      description: 'Refresh',
      category: 'Application'
    },
    {
      id: 'toggle-hidden',
      keys: ['h', 'ctrl+h'],
      handler: () => {
        store.dispatch({ type: Actions.TOGGLE_HIDDEN })
        const state = store.getState()
        loadDirectory(state.currentPath)
      },
      description: 'Toggle hidden files',
      category: 'View'
    },
    {
      id: 'up',
      keys: ['up', 'k'],
      handler: () => {
        const state = store.getState()
        store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: state.selectedIndex - 1 })
        updateUI()
      },
      description: 'Move up',
      category: 'Navigation'
    },
    {
      id: 'down',
      keys: ['down', 'j'],
      handler: () => {
        const state = store.getState()
        store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: state.selectedIndex + 1 })
        updateUI()
      },
      description: 'Move down',
      category: 'Navigation'
    },
    {
      id: 'enter',
      keys: ['enter', 'l'],
      handler: () => {
        const state = store.getState()
        const entry = state.files[state.selectedIndex]
        if (entry) navigate(entry)
      },
      description: 'Open/Enter',
      category: 'Navigation'
    },
    {
      id: 'parent',
      keys: ['backspace', '-'],
      handler: () => {
        const state = store.getState()
        const parent = path.dirname(state.currentPath)
        if (parent !== state.currentPath) {
          loadDirectory(parent)
        }
      },
      description: 'Go to parent',
      category: 'Navigation'
    },
    {
      id: 'home',
      keys: ['~'],
      handler: () => {
        loadDirectory(os.homedir())
      },
      description: 'Go to home',
      category: 'Navigation'
    },
    {
      id: 'select',
      keys: ['space'],
      handler: () => {
        const state = store.getState()
        const entry = state.files[state.selectedIndex]
        if (entry && entry.name !== '..') {
          store.dispatch({ type: Actions.TOGGLE_FILE_SELECTION, payload: entry.path })
          store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: state.selectedIndex + 1 })
          updateUI()
        }
      },
      description: 'Toggle selection',
      category: 'Selection'
    },
    {
      id: 'select-all',
      keys: ['ctrl+a'],
      handler: () => {
        store.dispatch({ type: Actions.SELECT_ALL })
        updateUI()
      },
      description: 'Select all',
      category: 'Selection'
    },
    {
      id: 'clear-selection',
      keys: ['escape'],
      handler: () => {
        if (confirmModal) {
          confirmModal.hide()
          confirmModal = null
        }
        store.dispatch({ type: Actions.CLEAR_SELECTION })
        updateUI()
      },
      description: 'Clear selection',
      category: 'Selection'
    },
    {
      id: 'delete',
      keys: ['d', 'delete'],
      handler: () => { handleDelete() },
      description: 'Delete',
      category: 'Operations'
    },
    {
      id: 'confirm-delete',
      keys: ['y'],
      handler: () => {
        if (confirmModal) {
          executeDelete()
        }
      },
      description: 'Confirm delete',
      category: 'Operations'
    },
    {
      id: 'cancel-delete',
      keys: ['n'],
      handler: () => {
        if (confirmModal) {
          confirmModal.hide()
          confirmModal = null
          app.markDirty()
        }
      },
      description: 'Cancel delete',
      category: 'Operations'
    },
    {
      id: 'copy',
      keys: ['c', 'ctrl+c'],
      handler: () => { handleCopy('copy') },
      description: 'Copy',
      category: 'Operations',
      priority: 'normal'
    },
    {
      id: 'cut',
      keys: ['x', 'ctrl+x'],
      handler: () => { handleCopy('cut') },
      description: 'Cut',
      category: 'Operations'
    },
    {
      id: 'paste',
      keys: ['p', 'ctrl+v'],
      handler: () => { handlePaste() },
      description: 'Paste',
      category: 'Operations'
    },
    {
      id: 'sort-name',
      keys: ['s n'],
      handler: () => {
        store.dispatch({ type: Actions.SET_SORT, payload: 'name' })
        const state = store.getState()
        loadDirectory(state.currentPath)
      },
      description: 'Sort by name',
      category: 'Sort'
    },
    {
      id: 'sort-size',
      keys: ['s s'],
      handler: () => {
        store.dispatch({ type: Actions.SET_SORT, payload: 'size' })
        const state = store.getState()
        loadDirectory(state.currentPath)
      },
      description: 'Sort by size',
      category: 'Sort'
    },
    {
      id: 'sort-date',
      keys: ['s d'],
      handler: () => {
        store.dispatch({ type: Actions.SET_SORT, payload: 'modified' })
        const state = store.getState()
        loadDirectory(state.currentPath)
      },
      description: 'Sort by date',
      category: 'Sort'
    },
    {
      id: 'help',
      keys: ['?', 'f1'],
      handler: () => {
        const helpText = shortcuts.getHelpText()
        showToast('Press ? for help', 'info')
        console.error('\n' + helpText)
      },
      description: 'Show help',
      category: 'Application'
    },
    {
      id: 'go-top',
      keys: ['g g'],
      handler: () => {
        store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: 0 })
        updateUI()
      },
      description: 'Go to top',
      category: 'Navigation',
      vimOnly: true
    },
    {
      id: 'go-bottom',
      keys: ['G'],
      handler: () => {
        const state = store.getState()
        store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: state.files.length - 1 })
        updateUI()
      },
      description: 'Go to bottom',
      category: 'Navigation',
      vimOnly: true
    }
  ])

  // Build UI
  const isWide = responsive.isAtLeast('lg')

  // Header with breadcrumb
  breadcrumbNav = breadcrumb({
    separator: ' > '
  })
    .width('100%')
    .height(1)
    .onSelect((item) => {
      loadDirectory(item.value as string)
    })

  // File list
  fileList = list({
    width: '100%',
    height: 'auto'
  })
    .flex(1)
    .border('single')
    .onSelect((_, index) => {
      store.dispatch({ type: Actions.SET_SELECTED_INDEX, payload: index })
      updateUI()
    })

  // Status bar
  statusBar = statusbar({
    position: 'bottom'
  })
    .width('100%')
    .height(1)

  // Toast
  toastWidget = toast({
    position: 'top-right',
    duration: 3000
  })

  // Main layout
  const mainLayout = box({
    width: '100%',
    height: '100%',
    flexDirection: 'column'
  })
    .add(
      box({ width: '100%', height: 1, padding: [0, 1] })
        .add(text(' File Explorer ').bold().color('#00ff88'))
        .add(text(' - Press ? for help').color('#888'))
    )
    .add(breadcrumbNav)
    .add(fileList)
    .add(statusBar)
    .add(toastWidget)

  // Mount and start
  app.mount(mainLayout)
  app.start()

  // Initial load
  await loadDirectory(store.getState().currentPath)

  console.error('\nFile Explorer started. Press ? for help, q to quit.')
}

// Run
main().catch(console.error)
