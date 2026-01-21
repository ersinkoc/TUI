/**
 * Git Client - Professional TUI Application
 *
 * A lazygit-inspired git client demonstrating:
 * - Real git command execution
 * - Multi-panel interface
 * - State management
 * - Vim keybindings
 * - Diff viewing
 * - Stage/unstage operations
 * - Commit workflow
 *
 * Run with: npx tsx examples/app-git-client.ts [repo-path]
 */

import { execSync, exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import { tui, box, text, list, textarea, modal, statusbar, panel } from '../src'
import type { ListItem } from '../src/widgets/list'
import type { PanelNode } from '../src/widgets/panel'
import {
  standardPlugins,
  statePlugin,
  shortcutsPlugin,
  responsivePlugin
} from '../src/plugins'
import type { Reducer, Store } from '../src/plugins/state'
import type { ShortcutsPluginAPI } from '../src/plugins/shortcuts'

const execAsync = promisify(exec)

// ============================================================
// Types
// ============================================================

interface GitFile {
  path: string
  status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?' | '!'
  staged: boolean
  statusText: string
}

interface GitBranch {
  name: string
  current: boolean
  remote: boolean
  ahead: number
  behind: number
}

interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  relative: string
}

interface GitStash {
  index: number
  message: string
  branch: string
}

type Panel = 'status' | 'branches' | 'commits' | 'stash'

interface AppState {
  repoPath: string
  isGitRepo: boolean
  currentBranch: string
  files: GitFile[]
  stagedFiles: GitFile[]
  unstagedFiles: GitFile[]
  branches: GitBranch[]
  commits: GitCommit[]
  stashes: GitStash[]
  activePanel: Panel
  selectedIndex: Record<Panel, number>
  diff: string
  loading: boolean
  error: string | null
  commitMessage: string
  showCommitModal: boolean
}

// ============================================================
// Actions
// ============================================================

const Actions = {
  SET_REPO: 'SET_REPO',
  SET_IS_GIT_REPO: 'SET_IS_GIT_REPO',
  SET_BRANCH: 'SET_BRANCH',
  SET_FILES: 'SET_FILES',
  SET_BRANCHES: 'SET_BRANCHES',
  SET_COMMITS: 'SET_COMMITS',
  SET_STASHES: 'SET_STASHES',
  SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',
  SET_SELECTED_INDEX: 'SET_SELECTED_INDEX',
  SET_DIFF: 'SET_DIFF',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_COMMIT_MESSAGE: 'SET_COMMIT_MESSAGE',
  SHOW_COMMIT_MODAL: 'SHOW_COMMIT_MODAL',
  HIDE_COMMIT_MODAL: 'HIDE_COMMIT_MODAL'
} as const

// ============================================================
// Reducer
// ============================================================

const initialState: AppState = {
  repoPath: process.argv[2] || process.cwd(),
  isGitRepo: false,
  currentBranch: '',
  files: [],
  stagedFiles: [],
  unstagedFiles: [],
  branches: [],
  commits: [],
  stashes: [],
  activePanel: 'status',
  selectedIndex: { status: 0, branches: 0, commits: 0, stash: 0 },
  diff: '',
  loading: false,
  error: null,
  commitMessage: '',
  showCommitModal: false
}

const reducer: Reducer<AppState> = (state, action): AppState => {
  switch (action.type) {
    case Actions.SET_REPO:
      return { ...state, repoPath: action.payload as string }
    case Actions.SET_IS_GIT_REPO:
      return { ...state, isGitRepo: action.payload as boolean }
    case Actions.SET_BRANCH:
      return { ...state, currentBranch: action.payload as string }
    case Actions.SET_FILES: {
      const files = action.payload as GitFile[]
      return {
        ...state,
        files,
        stagedFiles: files.filter(f => f.staged),
        unstagedFiles: files.filter(f => !f.staged)
      }
    }
    case Actions.SET_BRANCHES:
      return { ...state, branches: action.payload as GitBranch[] }
    case Actions.SET_COMMITS:
      return { ...state, commits: action.payload as GitCommit[] }
    case Actions.SET_STASHES:
      return { ...state, stashes: action.payload as GitStash[] }
    case Actions.SET_ACTIVE_PANEL:
      return { ...state, activePanel: action.payload as Panel }
    case Actions.SET_SELECTED_INDEX: {
      const { panel, index } = action.payload as { panel: Panel; index: number }
      return {
        ...state,
        selectedIndex: { ...state.selectedIndex, [panel]: index }
      }
    }
    case Actions.SET_DIFF:
      return { ...state, diff: action.payload as string }
    case Actions.SET_LOADING:
      return { ...state, loading: action.payload as boolean }
    case Actions.SET_ERROR:
      return { ...state, error: action.payload as string | null }
    case Actions.SET_COMMIT_MESSAGE:
      return { ...state, commitMessage: action.payload as string }
    case Actions.SHOW_COMMIT_MODAL:
      return { ...state, showCommitModal: true }
    case Actions.HIDE_COMMIT_MODAL:
      return { ...state, showCommitModal: false, commitMessage: '' }
    default:
      return state
  }
}

// ============================================================
// Git Commands
// ============================================================

function gitExec(repoPath: string, cmd: string): string {
  try {
    return execSync(`git -C "${repoPath}" ${cmd}`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }).trim()
  } catch {
    return ''
  }
}

async function gitExecAsync(repoPath: string, cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git -C "${repoPath}" ${cmd}`, {
      maxBuffer: 10 * 1024 * 1024
    })
    return stdout.trim()
  } catch {
    return ''
  }
}

function isGitRepository(repoPath: string): boolean {
  return gitExec(repoPath, 'rev-parse --is-inside-work-tree') === 'true'
}

function getCurrentBranch(repoPath: string): string {
  return gitExec(repoPath, 'branch --show-current') || gitExec(repoPath, 'rev-parse --short HEAD')
}

function parseGitStatus(repoPath: string): GitFile[] {
  const output = gitExec(repoPath, 'status --porcelain=v1')
  if (!output) return []

  const files: GitFile[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    if (line.length < 3) continue

    const indexStatus = line[0]
    const workStatus = line[1]
    const filePath = line.slice(3)

    const statusMap: Record<string, string> = {
      'M': 'Modified',
      'A': 'Added',
      'D': 'Deleted',
      'R': 'Renamed',
      'C': 'Copied',
      'U': 'Unmerged',
      '?': 'Untracked',
      '!': 'Ignored'
    }

    // Staged changes
    if (indexStatus !== ' ' && indexStatus !== '?') {
      files.push({
        path: filePath,
        status: indexStatus as GitFile['status'],
        staged: true,
        statusText: statusMap[indexStatus] || 'Unknown'
      })
    }

    // Unstaged changes
    if (workStatus !== ' ') {
      files.push({
        path: filePath,
        status: workStatus as GitFile['status'],
        staged: false,
        statusText: statusMap[workStatus] || 'Unknown'
      })
    }
  }

  return files
}

function getBranches(repoPath: string): GitBranch[] {
  const output = gitExec(repoPath, 'branch -a --format="%(HEAD)|%(refname:short)|%(upstream:track)"')
  if (!output) return []

  const branches: GitBranch[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    const [head, name, track] = line.split('|')
    if (!name) continue

    const isRemote = name.startsWith('remotes/')
    const cleanName = isRemote ? name.replace('remotes/', '') : name

    // Parse ahead/behind
    let ahead = 0
    let behind = 0
    if (track) {
      const aheadMatch = track.match(/ahead (\d+)/)
      const behindMatch = track.match(/behind (\d+)/)
      if (aheadMatch) ahead = parseInt(aheadMatch[1], 10)
      if (behindMatch) behind = parseInt(behindMatch[1], 10)
    }

    branches.push({
      name: cleanName,
      current: head === '*',
      remote: isRemote,
      ahead,
      behind
    })
  }

  return branches
}

function getCommits(repoPath: string, count = 50): GitCommit[] {
  const output = gitExec(repoPath, `log --oneline -n ${count} --format="%H|%h|%s|%an|%ai|%ar"`)
  if (!output) return []

  const commits: GitCommit[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    const [hash, shortHash, message, author, date, relative] = line.split('|')
    if (!hash) continue

    commits.push({ hash, shortHash, message, author, date, relative })
  }

  return commits
}

function getStashes(repoPath: string): GitStash[] {
  const output = gitExec(repoPath, 'stash list --format="%gd|%gs"')
  if (!output) return []

  const stashes: GitStash[] = []
  const lines = output.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const [, message] = lines[i].split('|')
    if (!message) continue

    const branchMatch = message.match(/on ([^:]+):/)
    stashes.push({
      index: i,
      message: message.replace(/^[^:]+: /, ''),
      branch: branchMatch?.[1] || 'unknown'
    })
  }

  return stashes
}

function getDiff(repoPath: string, file: GitFile): string {
  if (file.staged) {
    return gitExec(repoPath, `diff --cached -- "${file.path}"`)
  } else if (file.status === '?') {
    // Untracked file - show content
    try {
      const fullPath = path.join(repoPath, file.path)
      const { readFileSync } = require('fs')
      return readFileSync(fullPath, 'utf8')
    } catch {
      return 'Unable to read file'
    }
  } else {
    return gitExec(repoPath, `diff -- "${file.path}"`)
  }
}

async function stageFile(repoPath: string, file: GitFile): Promise<boolean> {
  try {
    if (file.status === '?') {
      await gitExecAsync(repoPath, `add "${file.path}"`)
    } else if (file.status === 'D') {
      await gitExecAsync(repoPath, `rm "${file.path}"`)
    } else {
      await gitExecAsync(repoPath, `add "${file.path}"`)
    }
    return true
  } catch {
    return false
  }
}

async function unstageFile(repoPath: string, file: GitFile): Promise<boolean> {
  try {
    await gitExecAsync(repoPath, `reset HEAD -- "${file.path}"`)
    return true
  } catch {
    return false
  }
}

async function commit(repoPath: string, message: string): Promise<boolean> {
  try {
    await gitExecAsync(repoPath, `commit -m "${message.replace(/"/g, '\\"')}"`)
    return true
  } catch {
    return false
  }
}

async function checkoutBranch(repoPath: string, branch: string): Promise<boolean> {
  try {
    await gitExecAsync(repoPath, `checkout "${branch}"`)
    return true
  } catch {
    return false
  }
}

async function stashChanges(repoPath: string, message?: string): Promise<boolean> {
  try {
    const cmd = message ? `stash push -m "${message}"` : 'stash push'
    await gitExecAsync(repoPath, cmd)
    return true
  } catch {
    return false
  }
}

async function popStash(repoPath: string, index: number): Promise<boolean> {
  try {
    await gitExecAsync(repoPath, `stash pop stash@{${index}}`)
    return true
  } catch {
    return false
  }
}

// ============================================================
// Main Application
// ============================================================

async function main() {
  const app = tui({
    fps: 30,
    plugins: [
      ...standardPlugins(),
      statePlugin({ autoRender: true }),
      shortcutsPlugin({ vimMode: true }),
      responsivePlugin()
    ]
  })

  // Start app first to install plugins
  app.start()

  const shortcuts = (app as unknown as { shortcuts: ShortcutsPluginAPI }).shortcuts
  const stateAPI = (app as unknown as { state: { createStore: <T>(opts: { initialState: T; reducer: Reducer<T> }) => Store<T> } }).state

  const store = stateAPI.createStore({ initialState, reducer })

  // UI Components - panels wrap lists for border/title support
  let statusListWidget: ReturnType<typeof list>
  let branchListWidget: ReturnType<typeof list>
  let commitListWidget: ReturnType<typeof list>
  let stashListWidget: ReturnType<typeof list>
  let statusPanel: PanelNode
  let branchPanel: PanelNode
  let commitPanel: PanelNode
  let stashPanel: PanelNode
  let diffPanel: PanelNode
  let diffView: ReturnType<typeof textarea>
  let statusBar: ReturnType<typeof statusbar>
  let commitModal: ReturnType<typeof modal> | null = null
  let commitInput: ReturnType<typeof textarea> | null = null

  // Refresh all data
  async function refresh() {
    const state = store.getState()
    store.dispatch({ type: Actions.SET_LOADING, payload: true })

    const isRepo = isGitRepository(state.repoPath)
    store.dispatch({ type: Actions.SET_IS_GIT_REPO, payload: isRepo })

    if (!isRepo) {
      store.dispatch({ type: Actions.SET_ERROR, payload: 'Not a git repository' })
      store.dispatch({ type: Actions.SET_LOADING, payload: false })
      return
    }

    store.dispatch({ type: Actions.SET_BRANCH, payload: getCurrentBranch(state.repoPath) })
    store.dispatch({ type: Actions.SET_FILES, payload: parseGitStatus(state.repoPath) })
    store.dispatch({ type: Actions.SET_BRANCHES, payload: getBranches(state.repoPath) })
    store.dispatch({ type: Actions.SET_COMMITS, payload: getCommits(state.repoPath) })
    store.dispatch({ type: Actions.SET_STASHES, payload: getStashes(state.repoPath) })
    store.dispatch({ type: Actions.SET_LOADING, payload: false })

    updateUI()
    updateDiff()
  }

  // Update diff view
  function updateDiff() {
    const state = store.getState()
    let diff = ''

    if (state.activePanel === 'status') {
      const allFiles = [...state.stagedFiles, ...state.unstagedFiles]
      const file = allFiles[state.selectedIndex.status]
      if (file) {
        diff = getDiff(state.repoPath, file)
      }
    } else if (state.activePanel === 'commits') {
      const commit = state.commits[state.selectedIndex.commits]
      if (commit) {
        diff = gitExec(state.repoPath, `show ${commit.hash} --stat`)
      }
    }

    store.dispatch({ type: Actions.SET_DIFF, payload: diff || 'No diff available' })
    diffView.value(store.getState().diff)
  }

  // Update UI from state
  function updateUI() {
    const state = store.getState()

    // Status list - convert to ListItem objects
    const statusItems: ListItem[] = []
    if (state.stagedFiles.length > 0) {
      statusItems.push({ id: 'staged-header', label: '─── Staged ───', selectable: false })
      for (const f of state.stagedFiles) {
        statusItems.push({ id: `staged-${f.path}`, label: `  ${f.status} ${f.path}`, icon: '✓' })
      }
    }
    if (state.unstagedFiles.length > 0) {
      statusItems.push({ id: 'unstaged-header', label: '─── Unstaged ───', selectable: false })
      for (const f of state.unstagedFiles) {
        statusItems.push({ id: `unstaged-${f.path}`, label: `  ${f.status} ${f.path}`, icon: '●' })
      }
    }
    if (statusItems.length === 0) {
      statusItems.push({ id: 'no-changes', label: '  No changes', selectable: false })
    }
    statusListWidget.items(statusItems)

    // Branch list - convert to ListItem objects
    const branchItems: ListItem[] = state.branches
      .filter(b => !b.remote)
      .map(b => {
        let info = b.current ? '* ' : '  '
        info += b.name
        if (b.ahead > 0) info += ` +${b.ahead}`
        if (b.behind > 0) info += ` -${b.behind}`
        return { id: b.name, label: info }
      })
    branchListWidget.items(branchItems.length > 0 ? branchItems : [{ id: 'no-branches', label: '  No branches', selectable: false }])

    // Commit list - convert to ListItem objects
    const commitItems: ListItem[] = state.commits.map(c => ({
      id: c.hash,
      label: `${c.shortHash} ${c.message.slice(0, 50)} (${c.relative})`
    }))
    commitListWidget.items(commitItems.length > 0 ? commitItems : [{ id: 'no-commits', label: '  No commits', selectable: false }])

    // Stash list - convert to ListItem objects
    const stashItems: ListItem[] = state.stashes.map(s => ({
      id: `stash-${s.index}`,
      label: `stash@{${s.index}}: ${s.message} (${s.branch})`
    }))
    stashListWidget.items(stashItems.length > 0 ? stashItems : [{ id: 'no-stashes', label: '  No stashes', selectable: false }])

    // Status bar - use text instead of label
    const branchInfo = state.currentBranch || 'No branch'
    const changesInfo = `${state.stagedFiles.length} staged, ${state.unstagedFiles.length} unstaged`
    const vimInfo = shortcuts.isVimMode() ? `VIM: ${shortcuts.getVimMode()}` : 'NORMAL'

    statusBar.items([
      { id: 'branch', text: `Branch: ${branchInfo}`, align: 'left' as const },
      { id: 'changes', text: changesInfo, align: 'left' as const },
      { id: 'vim', text: vimInfo, align: 'right' as const },
      { id: 'status', text: state.loading ? 'Loading...' : 'Ready', align: 'right' as const }
    ])

    // Highlight active panel - use panel border methods
    const panels = [statusPanel, branchPanel, commitPanel, stashPanel]
    const panelNames: Panel[] = ['status', 'branches', 'commits', 'stash']
    for (let i = 0; i < panels.length; i++) {
      if (panelNames[i] === state.activePanel) {
        panels[i].border('double')
      } else {
        panels[i].border('single')
      }
    }

    app.markDirty()
  }

  // Handle stage/unstage
  async function toggleStage() {
    const state = store.getState()
    const allFiles = [...state.stagedFiles, ...state.unstagedFiles]
    const file = allFiles[state.selectedIndex.status]

    if (!file) return

    if (file.staged) {
      await unstageFile(state.repoPath, file)
    } else {
      await stageFile(state.repoPath, file)
    }

    await refresh()
  }

  // Handle commit
  function showCommitDialog() {
    const state = store.getState()
    if (state.stagedFiles.length === 0) {
      store.dispatch({ type: Actions.SET_ERROR, payload: 'No staged files' })
      return
    }

    store.dispatch({ type: Actions.SHOW_COMMIT_MODAL })

    commitInput = textarea({ width: '100%', height: 5 })
      .placeholder('Enter commit message...')

    // Create modal content - use box to group elements
    const modalContent = box({ flexDirection: 'column', gap: 1 })
      .add(text('Enter commit message:'))
      .add(commitInput)
      .add(text('Press Escape to cancel').color('#888'))

    commitModal = modal({ title: 'Commit', width: 60, height: 12 })
      .content(modalContent)
      .onButton(async (value) => {
        if (value === 'confirm') {
          const msg = commitInput?.currentValue || ''
          if (msg.trim()) {
            await commit(state.repoPath, msg.trim())
            store.dispatch({ type: Actions.HIDE_COMMIT_MODAL })
            await refresh()
          }
        }
      })
      .buttons([
        { label: 'Cancel', value: 'cancel' },
        { label: 'Commit', value: 'confirm', primary: true }
      ])

    commitModal.open()
    if (commitInput) commitInput.focus()
    app.markDirty()
  }

  function hideCommitDialog() {
    store.dispatch({ type: Actions.HIDE_COMMIT_MODAL })
    if (commitModal) {
      commitModal.close()
      commitModal = null
      commitInput = null
    }
    app.markDirty()
  }

  // Handle branch checkout
  async function handleCheckout() {
    const state = store.getState()
    const localBranches = state.branches.filter(b => !b.remote)
    const branch = localBranches[state.selectedIndex.branches]

    if (branch && !branch.current) {
      await checkoutBranch(state.repoPath, branch.name)
      await refresh()
    }
  }

  // Handle stash
  async function handleStash() {
    const state = store.getState()
    if (state.unstagedFiles.length > 0 || state.stagedFiles.length > 0) {
      await stashChanges(state.repoPath)
      await refresh()
    }
  }

  async function handleStashPop() {
    const state = store.getState()
    const stash = state.stashes[state.selectedIndex.stash]

    if (stash) {
      await popStash(state.repoPath, stash.index)
      await refresh()
    }
  }

  // Navigation helpers
  function moveSelection(delta: number) {
    const state = store.getState()
    const panel = state.activePanel
    let maxIndex = 0

    switch (panel) {
      case 'status':
        maxIndex = state.stagedFiles.length + state.unstagedFiles.length - 1
        break
      case 'branches':
        maxIndex = state.branches.filter(b => !b.remote).length - 1
        break
      case 'commits':
        maxIndex = state.commits.length - 1
        break
      case 'stash':
        maxIndex = state.stashes.length - 1
        break
    }

    const currentIndex = state.selectedIndex[panel]
    const newIndex = Math.max(0, Math.min(currentIndex + delta, maxIndex))

    store.dispatch({
      type: Actions.SET_SELECTED_INDEX,
      payload: { panel, index: newIndex }
    })

    updateUI()
    updateDiff()
  }

  function switchPanel(panel: Panel) {
    store.dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: panel })
    updateUI()
    updateDiff()
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
      handler: () => { refresh() },
      description: 'Refresh',
      category: 'Application'
    },
    {
      id: 'up',
      keys: ['up', 'k'],
      handler: () => { moveSelection(-1) },
      description: 'Move up',
      category: 'Navigation'
    },
    {
      id: 'down',
      keys: ['down', 'j'],
      handler: () => { moveSelection(1) },
      description: 'Move down',
      category: 'Navigation'
    },
    {
      id: 'panel-status',
      keys: ['1'],
      handler: () => { switchPanel('status') },
      description: 'Status panel',
      category: 'Panels'
    },
    {
      id: 'panel-branches',
      keys: ['2'],
      handler: () => { switchPanel('branches') },
      description: 'Branches panel',
      category: 'Panels'
    },
    {
      id: 'panel-commits',
      keys: ['3'],
      handler: () => { switchPanel('commits') },
      description: 'Commits panel',
      category: 'Panels'
    },
    {
      id: 'panel-stash',
      keys: ['4'],
      handler: () => { switchPanel('stash') },
      description: 'Stash panel',
      category: 'Panels'
    },
    {
      id: 'next-panel',
      keys: ['tab', 'l'],
      handler: () => {
        const panels: Panel[] = ['status', 'branches', 'commits', 'stash']
        const state = store.getState()
        const idx = panels.indexOf(state.activePanel)
        switchPanel(panels[(idx + 1) % panels.length])
      },
      description: 'Next panel',
      category: 'Navigation'
    },
    {
      id: 'prev-panel',
      keys: ['shift+tab', 'h'],
      handler: () => {
        const panels: Panel[] = ['status', 'branches', 'commits', 'stash']
        const state = store.getState()
        const idx = panels.indexOf(state.activePanel)
        switchPanel(panels[(idx - 1 + panels.length) % panels.length])
      },
      description: 'Previous panel',
      category: 'Navigation'
    },
    {
      id: 'stage-toggle',
      keys: ['space', 'enter'],
      handler: () => {
        const state = store.getState()
        if (state.activePanel === 'status') {
          toggleStage()
        } else if (state.activePanel === 'branches') {
          handleCheckout()
        } else if (state.activePanel === 'stash') {
          handleStashPop()
        }
      },
      description: 'Stage/Unstage or Checkout',
      category: 'Actions'
    },
    {
      id: 'commit',
      keys: ['c'],
      handler: () => { showCommitDialog() },
      description: 'Commit',
      category: 'Actions'
    },
    {
      id: 'stash',
      keys: ['s'],
      handler: () => { handleStash() },
      description: 'Stash changes',
      category: 'Actions'
    },
    {
      id: 'escape',
      keys: ['escape'],
      handler: () => {
        const state = store.getState()
        if (state.showCommitModal) {
          hideCommitDialog()
        }
      },
      description: 'Cancel',
      category: 'Application'
    },
    {
      id: 'help',
      keys: ['?', 'f1'],
      handler: () => {
        console.error('\n' + shortcuts.getHelpText())
      },
      description: 'Show help',
      category: 'Application'
    }
  ])

  // Build UI - create lists first, then wrap in panels for borders/titles
  statusListWidget = list({ height: '100%' })
  branchListWidget = list({ height: '100%' })
  commitListWidget = list({ height: '100%' })
  stashListWidget = list({ height: '100%' })

  // Create panels that wrap the lists (panels have border/title)
  statusPanel = panel({ title: ' Status ', border: 'single' })
    .content(statusListWidget)
  branchPanel = panel({ title: ' Branches ', border: 'single' })
    .content(branchListWidget)
  commitPanel = panel({ title: ' Commits ', border: 'single' })
    .content(commitListWidget)
  stashPanel = panel({ title: ' Stash ', border: 'single' })
    .content(stashListWidget)

  // Diff view wrapped in panel
  diffView = textarea({ width: '100%', height: '100%' })
  diffPanel = panel({ title: ' Diff ', border: 'single' })
    .content(diffView)

  // Statusbar (no position/width props - those are handled by layout)
  statusBar = statusbar()

  // Left panels
  const leftPanelBox = box({
    width: '30%',
    height: '100%',
    flexDirection: 'column'
  })
    .add(statusPanel)
    .add(branchPanel)

  // Right panels
  const rightPanelTop = box({
    width: '100%',
    height: '50%',
    flexDirection: 'row'
  })
    .add(commitPanel)
    .add(stashPanel)

  const rightPanelBox = box({
    width: '70%',
    height: '100%',
    flexDirection: 'column'
  })
    .add(rightPanelTop)
    .add(diffPanel)

  // Main layout
  const mainLayout = box({
    width: '100%',
    height: '100%',
    flexDirection: 'column'
  })
    .add(
      box({ width: '100%', height: 1, padding: [0, 1] })
        .add(text(' Git Client ').bold().color('#f39c12'))
        .add(text(' - Press ? for help, q to quit').color('#888'))
    )
    .add(
      box({
        width: '100%',
        height: 'auto',
        flexDirection: 'row',
        flex: 1
      })
        .add(leftPanelBox)
        .add(rightPanelBox)
    )
    .add(statusBar)

  // Mount (app.start() was already called earlier to install plugins)
  app.mount(mainLayout)

  // Initial load
  await refresh()

  console.error('\nGit Client started. Press ? for help, q to quit.')
}

// Run
main().catch(console.error)
