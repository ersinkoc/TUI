/**
 * @oxog/tui - Ultimate Showcase Application
 *
 * A comprehensive demonstration of ALL framework capabilities:
 * - 40+ widgets showcased
 * - State management with Redux-like store
 * - Keyboard shortcuts (Vim + standard)
 * - Multiple themes with live switching
 * - Animations and transitions
 * - Real-time data updates
 * - Complex layouts (SplitPane, Grid, Flexbox)
 * - Modal dialogs and toast notifications
 * - Charts, tables, and data visualization
 * - Form validation
 * - Code viewer with syntax highlighting
 * - Markdown rendering
 * - JSON viewer
 * - And much more!
 *
 * Run with: npx tsx examples/app-ultimate-showcase.ts
 *
 * Controls:
 * - Tab / Shift+Tab: Navigate between sections
 * - 1-9: Quick switch views
 * - t: Cycle themes
 * - h: Show help
 * - /: Open command palette
 * - Escape: Close modals/menus
 * - q / Ctrl+C: Quit
 */

import {
  tui,
  box,
  text,
  progress,
  spinner,
  tree,
  commandpalette,
  toast,
  button,
  list,
  slider,
  calendar,
  accordion,
  barchart,
  sparkline,
  gauge,
  wizard,
  form,
  menubar,
  statusbar,
  breadcrumb,
  panel,
  badge,
  drawer,
  datagrid,
  timeline,
  codeviewer,
  pagination,
  searchinput,
  logviewer,
  markdownviewer,
  jsonviewer,
  colorpicker,
  heatmap,
  kanban,
  stopwatch,
  help,
  helpSection,
  themes
} from '../src'

import {
  fullPlugins,
  statePlugin,
  shortcutsPlugin,
  responsivePlugin,
  animationPlugin,
  scrollPlugin
} from '../src/plugins'

import type { Action, Store } from '../src/plugins/state'
import type { Node } from '../src/types'

// ============================================================
// Types
// ============================================================

interface MetricsPayload {
  cpu: number
  memory: number
  netIn: number
  netOut: number
}

interface TaskUpdatePayload {
  id: string
  status: string
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: number
}

// ============================================================
// Application State
// ============================================================

interface AppState {
  currentView: string
  theme: string
  sidebarOpen: boolean
  notifications: number
  cpuUsage: number
  memoryUsage: number
  networkIn: number
  networkOut: number
  tasks: { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: 'low' | 'medium' | 'high' }[]
  logs: LogEntry[]
  searchQuery: string
  selectedItem: number
  chartData: number[]
}

const initialState: AppState = {
  currentView: 'dashboard',
  theme: 'default',
  sidebarOpen: true,
  notifications: 5,
  cpuUsage: 45,
  memoryUsage: 62,
  networkIn: 125.5,
  networkOut: 45.2,
  tasks: [
    { id: '1', title: 'Implement user authentication', status: 'done', priority: 'high' },
    { id: '2', title: 'Design database schema', status: 'done', priority: 'high' },
    { id: '3', title: 'Create API endpoints', status: 'doing', priority: 'medium' },
    { id: '4', title: 'Write unit tests', status: 'doing', priority: 'medium' },
    { id: '5', title: 'Setup CI/CD pipeline', status: 'todo', priority: 'low' },
    { id: '6', title: 'Documentation', status: 'todo', priority: 'low' }
  ],
  logs: [],
  searchQuery: '',
  selectedItem: 0,
  chartData: [30, 45, 60, 35, 80, 55, 70, 45, 90, 65]
}

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload as string }
    case 'SET_THEME':
      return { ...state, theme: action.payload as string }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'UPDATE_METRICS': {
      const payload = action.payload as MetricsPayload
      return {
        ...state,
        cpuUsage: payload.cpu,
        memoryUsage: payload.memory,
        networkIn: payload.netIn,
        networkOut: payload.netOut
      }
    }
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs.slice(-99), action.payload as LogEntry]
      }
    case 'UPDATE_CHART':
      return {
        ...state,
        chartData: [...state.chartData.slice(1), action.payload as number]
      }
    case 'UPDATE_TASK': {
      const taskPayload = action.payload as TaskUpdatePayload
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === taskPayload.id
            ? { ...t, status: taskPayload.status as 'todo' | 'doing' | 'done' }
            : t
        )
      }
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload as string }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: 0 }
    default:
      return state
  }
}

// ============================================================
// Application Setup
// ============================================================

const app = tui({
  plugins: [
    ...fullPlugins(),
    statePlugin({ autoRender: true }),
    shortcutsPlugin(),
    responsivePlugin(),
    animationPlugin(),
    scrollPlugin()
  ],
  title: 'Ultimate TUI Showcase'
})

// Start app first to install plugins
app.start()

// Now create store (after plugins are installed)
const store = (app as any).state.createStore({
  initialState,
  reducer: appReducer,
  enableHistory: true,
  devTools: false
}) as Store<AppState>

// ============================================================
// Theme Management
// ============================================================

const themeNames = Object.keys(themes)
let currentThemeIndex = 0

function cycleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themeNames.length
  store.dispatch({ type: 'SET_THEME', payload: themeNames[currentThemeIndex] })
  toastWidget.show('info', `Switched to ${themeNames[currentThemeIndex]} theme`, 'Theme Changed')
  app.refresh()
}

// ============================================================
// Widget Declarations
// ============================================================

// Toast notification system
const toastWidget = toast({ position: 'top-right', maxVisible: 3, defaultDuration: 3000 })

// Command palette - use method chaining for onSelect
const cmdPalette = commandpalette({
  placeholder: 'Type a command...',
  commands: [
    { value: 'dashboard', label: 'Go to Dashboard', category: 'Navigation', shortcut: '1' },
    { value: 'widgets', label: 'Go to Widgets', category: 'Navigation', shortcut: '2' },
    { value: 'data', label: 'Go to Data', category: 'Navigation', shortcut: '3' },
    { value: 'forms', label: 'Go to Forms', category: 'Navigation', shortcut: '4' },
    { value: 'charts', label: 'Go to Charts', category: 'Navigation', shortcut: '5' },
    { value: 'code', label: 'Go to Code', category: 'Navigation', shortcut: '6' },
    { value: 'kanban', label: 'Go to Kanban', category: 'Navigation', shortcut: '7' },
    { value: 'settings', label: 'Go to Settings', category: 'Navigation', shortcut: '8' },
    { value: 'theme', label: 'Cycle Theme', category: 'Appearance', shortcut: 't' },
    { value: 'sidebar', label: 'Toggle Sidebar', category: 'Layout', shortcut: 'b' },
    { value: 'help', label: 'Show Help', category: 'Help', shortcut: 'h' },
    { value: 'quit', label: 'Quit Application', category: 'System', shortcut: 'q' }
  ]
}).onSelect(cmd => {
  cmdPalette.close()
  switch (cmd.value) {
    case 'dashboard':
    case 'widgets':
    case 'data':
    case 'forms':
    case 'charts':
    case 'code':
    case 'kanban':
    case 'settings':
      store.dispatch({ type: 'SET_VIEW', payload: cmd.value })
      break
    case 'theme':
      cycleTheme()
      break
    case 'sidebar':
      store.dispatch({ type: 'TOGGLE_SIDEBAR' })
      break
    case 'help':
      helpWidget.open()
      break
    case 'quit':
      app.quit()
      break
  }
  app.refresh()
})

// Help widget
const helpWidget = help({ title: 'Keyboard Shortcuts', width: 50, height: 20 })
  .addSection(helpSection('Navigation', {
    '1-8': 'Quick switch views',
    'Tab': 'Next section',
    'Shift+Tab': 'Previous section',
    '/': 'Open command palette'
  }))
  .addSection(helpSection('Actions', {
    't': 'Cycle themes',
    'b': 'Toggle sidebar',
    'h': 'Show this help',
    'Escape': 'Close modal/menu'
  }))
  .addSection(helpSection('Vim Mode', {
    'j/k': 'Move down/up',
    'g/G': 'Go to top/bottom',
    'Enter': 'Select item'
  }))

// ============================================================
// Dashboard View
// ============================================================

function createDashboardView(): Node {
  const state = store.getState()

  // CPU Gauge - no label prop, gauge shows value
  const cpuGauge = gauge({
    value: state.cpuUsage,
    max: 100,
    showValue: true
  })

  // Memory Gauge
  const memGauge = gauge({
    value: state.memoryUsage,
    max: 100,
    showValue: true
  })

  // Sparkline for network - no color/height props
  const netSparkline = sparkline({
    data: state.chartData
  })

  // Activity timeline - use 'date' not 'time'
  const activityTimeline = timeline({
    items: [
      { id: '1', title: 'App started', status: 'completed', date: 'Just now' },
      { id: '2', title: 'Database connected', status: 'completed', date: '2s ago' },
      { id: '3', title: 'Loading modules', status: 'current', date: 'In progress' },
      { id: '4', title: 'Ready', status: 'pending', date: 'Pending' }
    ]
  })

  // Quick stats bar chart - no color in data (uses theme)
  const statsChart = barchart({
    data: [
      { label: 'Mon', value: 45 },
      { label: 'Tue', value: 72 },
      { label: 'Wed', value: 58 },
      { label: 'Thu', value: 90 },
      { label: 'Fri', value: 65 }
    ],
    showValues: true
  })

  // Recent logs
  const recentLogs = logviewer({
    entries: state.logs.slice(-5).map(log => ({
      level: log.level,
      message: log.message,
      timestamp: new Date(log.timestamp).toLocaleTimeString()
    })),
    showTimestamps: true,
    showLevels: true
  })

  // Use box layouts instead of panel.width/height/flex/add
  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    // Row 1: Gauges and Network
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .height(8)
        .add(
          box().width(20).add(
            panel({ title: ' CPU Usage' }).content(
              box().flexDirection('column')
                .add(cpuGauge)
                .add(text('CPU').color('#ff6b6b'))
            )
          )
        )
        .add(
          box().width(20).add(
            panel({ title: ' Memory' }).content(
              box().flexDirection('column')
                .add(memGauge)
                .add(text('Memory').color('#00ff88'))
            )
          )
        )
        .add(
          box().flex(1).add(
            panel({ title: ' Network I/O' }).content(
              box()
                .flexDirection('column')
                .add(netSparkline)
                .add(
                  box()
                    .flexDirection('row')
                    .gap(2)
                    .add(text(` ${state.networkIn.toFixed(1)} KB/s`).color('#00ff88'))
                    .add(text(` ${state.networkOut.toFixed(1)} KB/s`).color('#ff6b6b'))
                )
            )
          )
        )
    )
    // Row 2: Activity and Chart
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .flex(1)
        .add(
          box().width(30).add(
            panel({ title: ' Activity' }).content(activityTimeline)
          )
        )
        .add(
          box().flex(1).add(
            panel({ title: ' Weekly Stats' }).content(statsChart)
          )
        )
    )
    // Row 3: Recent Logs
    .add(
      box().height(10).add(
        panel({ title: ' Recent Logs' }).content(recentLogs)
      )
    )
}

// ============================================================
// Widgets Showcase View
// ============================================================

function createWidgetsView(): Node {
  // Progress bars
  const progressBars = box()
    .flexDirection('column')
    .gap(1)
    .add(text('Progress Bars:').bold())
    .add(progress({ value: 25 }).filledColor('#ff6b6b'))
    .add(progress({ value: 60 }).filledColor('#00ff88'))
    .add(progress({ value: 90 }).filledColor('#4a9eff'))

  // Spinners - no style prop, uses frames
  const spinnerDemo = box()
    .flexDirection('row')
    .gap(3)
    .add(spinner({ label: 'Loading' }))
    .add(spinner({ label: 'Syncing' }))

  // Buttons
  const buttonDemo = box()
    .flexDirection('row')
    .gap(2)
    .add(button({ label: 'Primary', variant: 'primary' }))
    .add(button({ label: 'Secondary', variant: 'secondary' }))
    .add(button({ label: 'Danger', variant: 'danger' }))

  // Badges - 'error' not 'danger', 'pill' not 'circle'
  const badgeDemo = box()
    .flexDirection('row')
    .gap(2)
    .add(badge({ text: 'New', variant: 'success' }))
    .add(badge({ text: '5', variant: 'error', shape: 'pill' }))
    .add(badge({ text: 'Beta', variant: 'warning' }))
    .add(badge({ text: 'Pro', variant: 'info' }))

  // Slider - no label prop
  const sliderDemo = slider({
    min: 0,
    max: 100,
    value: 50,
    showValue: true
  })

  // Accordion
  const accordionDemo = accordion({
    panels: [
      { id: '1', title: 'Section 1', content: text('Content for section 1') },
      { id: '2', title: 'Section 2', content: text('Content for section 2') },
      { id: '3', title: 'Section 3', content: text('Content for section 3') }
    ],
    multiple: false
  })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .flex(1)
        // Left column
        .add(
          box()
            .flexDirection('column')
            .gap(2)
            .width('50%')
            .add(box().add(panel({ title: ' Progress' }).content(progressBars)))
            .add(box().add(panel({ title: ' Spinners' }).content(spinnerDemo)))
            .add(box().add(panel({ title: ' Buttons' }).content(buttonDemo)))
        )
        // Right column
        .add(
          box()
            .flexDirection('column')
            .gap(2)
            .flex(1)
            .add(box().add(panel({ title: ' Badges' }).content(badgeDemo)))
            .add(box().add(panel({ title: ' Slider' }).content(sliderDemo)))
            .add(box().add(panel({ title: ' Accordion' }).content(accordionDemo)))
        )
    )
}

// ============================================================
// Data View
// ============================================================

function createDataView(): Node {
  // Data grid
  const dataGrid = datagrid({
    columns: [
      { key: 'id', header: 'ID', width: 8, sortable: true },
      { key: 'name', header: 'Name', width: 25, sortable: true },
      { key: 'email', header: 'Email', width: 30 },
      { key: 'role', header: 'Role', width: 15 },
      { key: 'status', header: 'Status', width: 12 }
    ],
    data: [
      { id: '001', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { id: '002', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
      { id: '003', name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer', status: 'Inactive' },
      { id: '004', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active' },
      { id: '005', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Admin', status: 'Active' }
    ],
    selectable: true,
    striped: true
  })

  // Tree view - TreeNodeData uses label, not id
  const treeView = tree({
    data: [
      {
        label: ' src',
        expanded: true,
        children: [
          {
            label: ' components',
            expanded: true,
            children: [
              { label: ' Button.tsx' },
              { label: ' Input.tsx' },
              { label: ' Modal.tsx' }
            ]
          },
          {
            label: ' utils',
            children: [
              { label: ' helpers.ts' },
              { label: ' constants.ts' }
            ]
          },
          { label: ' index.ts' }
        ]
      },
      {
        label: ' tests',
        children: [
          { label: ' unit' },
          { label: ' integration' }
        ]
      }
    ]
  })

  // JSON viewer
  const jsonData = {
    name: '@oxog/tui',
    version: '1.0.0',
    description: 'Terminal UI Framework',
    features: ['widgets', 'themes', 'plugins'],
    stats: { widgets: 40, themes: 9, plugins: 12 }
  }

  const jsonView = jsonviewer({
    data: jsonData,
    expandDepth: -1,
    indentSize: 2
  })

  // Pagination
  const paginationWidget = pagination({
    currentPage: 1,
    totalItems: 100,
    itemsPerPage: 10
  }).onPageChange(page => {
    toastWidget.show('info', `Page ${page}`, 'Page Change')
  })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    // Data Grid
    .add(
      box().flex(1).add(
        panel({ title: ' Data Grid' }).content(
          box().flexDirection('column').add(dataGrid).add(paginationWidget)
        )
      )
    )
    // Tree and JSON
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .height(15)
        .add(box().width(35).add(panel({ title: ' File Tree' }).content(treeView)))
        .add(box().flex(1).add(panel({ title: ' JSON Viewer' }).content(jsonView)))
    )
}

// ============================================================
// Forms View
// ============================================================

function createFormsView(): Node {
  // Form with validation
  const userForm = form({
    fields: [
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        validators: [{ type: 'minLength', value: 3, message: 'Min 3 characters' }]
      },
      {
        id: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        validators: [{ type: 'email', message: 'Invalid email format' }]
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        validators: [{ type: 'minLength', value: 8, message: 'Min 8 characters' }]
      },
      {
        id: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Editor', value: 'editor' },
          { label: 'Viewer', value: 'viewer' }
        ]
      },
      {
        id: 'bio',
        label: 'Bio',
        type: 'textarea',
        placeholder: 'Tell us about yourself...'
      }
    ]
  }).onSubmit(_values => {
    toastWidget.show('success', 'User created successfully!', 'Form Submitted')
  })

  // Search input
  const searchWidget = searchinput({
    placeholder: 'Search users...',
    showSuggestions: true,
    maxSuggestions: 5
  }).onSearch(query => {
    store.dispatch({ type: 'SET_SEARCH', payload: query })
  })

  // Color picker
  const colorPickerWidget = colorpicker({
    color: 39,  // ANSI color code for bright blue
    mode: 'palette256',
    showPreview: true,
    showValue: true
  }).onChange(color => {
    toastWidget.show('info', `Selected color: ${color}`, 'Color')
  })

  // Calendar
  const calendarWidget = calendar({
    selected: new Date(),
    highlightToday: true
  }).onSelect(date => {
    toastWidget.show('info', `Selected: ${date.toLocaleDateString()}`, 'Date')
  })

  // Wizard - steps require content: Node
  const wizardWidget = wizard({
    steps: [
      { id: '1', title: 'Account', content: text('Account setup') },
      { id: '2', title: 'Profile', content: text('Profile info') },
      { id: '3', title: 'Settings', content: text('App settings') },
      { id: '4', title: 'Review', content: text('Review & confirm') }
    ],
    currentStep: 1
  })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    // Wizard at top
    .add(box().height(5).add(panel({ title: ' Setup Wizard' }).content(wizardWidget)))
    // Main content
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .flex(1)
        // Left: Form
        .add(
          box().width('50%').add(
            panel({ title: ' User Registration' }).content(userForm)
          )
        )
        // Right: Other inputs
        .add(
          box()
            .flexDirection('column')
            .gap(2)
            .flex(1)
            .add(box().add(panel({ title: ' Search' }).content(searchWidget)))
            .add(box().add(panel({ title: ' Color Picker' }).content(colorPickerWidget)))
            .add(box().height(12).add(panel({ title: ' Calendar' }).content(calendarWidget)))
        )
    )
}

// ============================================================
// Charts View
// ============================================================

function createChartsView(): Node {
  const state = store.getState()

  // Bar chart
  const barChartWidget = barchart({
    data: [
      { label: 'Jan', value: 45 },
      { label: 'Feb', value: 72 },
      { label: 'Mar', value: 58 },
      { label: 'Apr', value: 90 },
      { label: 'May', value: 65 },
      { label: 'Jun', value: 82 }
    ],
    showValues: true
  })

  // Multiple sparklines
  const cpuSparkline = sparkline({ data: state.chartData })
  const memSparkline = sparkline({ data: state.chartData.map(v => v * 0.8) })
  const netSparkline = sparkline({ data: state.chartData.map(v => v * 1.2) })

  // Gauge widgets
  const gauges = box()
    .flexDirection('row')
    .gap(4)
    .add(gauge({ value: state.cpuUsage, max: 100, showValue: true }))
    .add(gauge({ value: state.memoryUsage, max: 100, showValue: true }))
    .add(gauge({ value: 75, max: 100, showValue: true }))
    .add(gauge({ value: 92, max: 100, showValue: true }))

  // Heatmap
  const heatmapData: number[][] = []
  for (let i = 0; i < 7; i++) {
    const row: number[] = []
    for (let j = 0; j < 24; j++) {
      row.push(Math.floor(Math.random() * 100))
    }
    heatmapData.push(row)
  }

  const heatmapWidget = heatmap({
    data: heatmapData,
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    colorScale: 'viridis'
  })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    // Gauges row
    .add(
      box().height(8).add(
        panel({ title: ' System Gauges' }).content(
          box().flexDirection('column')
            .add(gauges)
            .add(
              box().flexDirection('row').gap(4)
                .add(text('CPU').color('#ff6b6b'))
                .add(text('Memory').color('#00ff88'))
                .add(text('Disk').color('#ffaa00'))
                .add(text('Network').color('#4a9eff'))
            )
        )
      )
    )
    // Charts row
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .flex(1)
        .add(
          box().width('50%').add(
            panel({ title: ' Monthly Stats' }).content(barChartWidget)
          )
        )
        .add(
          box().flex(1).add(
            panel({ title: ' Live Metrics' }).content(
              box()
                .flexDirection('column')
                .gap(1)
                .add(text(' CPU').color('#ff6b6b'))
                .add(cpuSparkline)
                .add(text(' Memory').color('#00ff88'))
                .add(memSparkline)
                .add(text(' Network').color('#4a9eff'))
                .add(netSparkline)
            )
          )
        )
    )
    // Heatmap
    .add(box().height(12).add(panel({ title: ' Activity Heatmap' }).content(heatmapWidget)))
}

// ============================================================
// Code View
// ============================================================

function createCodeView(): Node {
  const sampleCode = `/**
 * @oxog/tui - Terminal UI Framework
 * A zero-dependency TUI framework for Node.js
 */

import { tui, box, text, button } from '@oxog/tui'
import { fullPlugins } from '@oxog/tui/plugins'

// Create application
const app = tui({
  plugins: fullPlugins(),
  title: 'My TUI App'
})

// Create UI
const root = box()
  .width('100%')
  .height('100%')
  .flexDirection('column')
  .border('rounded')
  .add(text('Hello, TUI!').bold())
  .add(button({ label: 'Click Me' }))

// Start application
app.mount(root)
app.start()`

  const codeWidget = codeviewer({
    code: sampleCode,
    language: 'typescript',
    showLineNumbers: true,
    highlightLines: [
      { line: 1, style: 'info' },
      { line: 2, style: 'info' },
      { line: 3, style: 'info' },
      { line: 14, style: 'highlight' },
      { line: 15, style: 'highlight' },
      { line: 16, style: 'highlight' }
    ]
  })

  const markdownContent = `# @oxog/tui Framework

## Features
- **40+ Widgets** - Comprehensive widget library
- **Themes** - 9 built-in themes with custom theme support
- **Plugins** - Modular plugin architecture
- **State Management** - Redux-like store

## Quick Start
\`\`\`bash
npm install @oxog/tui
\`\`\`

## Example
\`\`\`typescript
import { tui, box, text } from '@oxog/tui'

const app = tui()
app.mount(box().add(text('Hello!')))
app.start()
\`\`\`

> **Note:** This framework is designed for terminal applications.

---
*Built with love by the TUI team*`

  const markdownWidget = markdownviewer({ content: markdownContent })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('row')
    .gap(2)
    // Code viewer
    .add(box().width('50%').add(panel({ title: ' Code Viewer' }).content(codeWidget)))
    // Markdown viewer
    .add(box().flex(1).add(panel({ title: ' Documentation' }).content(markdownWidget)))
}

// ============================================================
// Kanban View
// ============================================================

function createKanbanView(): Node {
  const state = store.getState()

  const kanbanWidget = kanban({
    columns: [
      {
        id: 'todo',
        title: ' To Do',
        color: 196,  // Red ANSI color
        cards: state.tasks
          .filter(t => t.status === 'todo')
          .map(t => ({
            id: t.id,
            title: t.title,
            labels: [t.priority],
            priority: t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'normal' : 'low'
          }))
      },
      {
        id: 'doing',
        title: ' In Progress',
        color: 208,  // Orange ANSI color
        cards: state.tasks
          .filter(t => t.status === 'doing')
          .map(t => ({
            id: t.id,
            title: t.title,
            labels: [t.priority],
            priority: t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'normal' : 'low'
          }))
      },
      {
        id: 'done',
        title: ' Done',
        color: 46,  // Green ANSI color
        cards: state.tasks
          .filter(t => t.status === 'done')
          .map(t => ({
            id: t.id,
            title: t.title,
            labels: [t.priority],
            priority: t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'normal' : 'low'
          }))
      }
    ],
    showLabels: true,
    showPriority: true
  })

  // Stopwatch for time tracking
  const stopwatchWidget = stopwatch({
    mode: 'stopwatch',
    showMilliseconds: true,
    showLaps: true
  })

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    .gap(1)
    // Timer
    .add(
      box()
        .flexDirection('row')
        .gap(2)
        .height(5)
        .add(box().flex(1).add(panel({ title: ' Time Tracker' }).content(stopwatchWidget)))
        .add(
          box().width(30).add(
            panel({ title: ' Task Stats' }).content(
              box()
                .flexDirection('row')
                .gap(3)
                .add(
                  box()
                    .flexDirection('column')
                    .add(text(`${state.tasks.filter(t => t.status === 'todo').length}`).bold().color('#ff6b6b'))
                    .add(text('To Do').color('#888888'))
                )
                .add(
                  box()
                    .flexDirection('column')
                    .add(text(`${state.tasks.filter(t => t.status === 'doing').length}`).bold().color('#ffaa00'))
                    .add(text('In Progress').color('#888888'))
                )
                .add(
                  box()
                    .flexDirection('column')
                    .add(text(`${state.tasks.filter(t => t.status === 'done').length}`).bold().color('#00ff88'))
                    .add(text('Done').color('#888888'))
                )
            )
          )
        )
    )
    // Kanban board
    .add(box().flex(1).add(panel({ title: ' Kanban Board' }).content(kanbanWidget)))
}

// ============================================================
// Settings View
// ============================================================

function createSettingsView(): Node {
  const state = store.getState()

  // Theme selector
  const themeList = list({
    items: themeNames.map((name) => ({
      id: name,
      label: `${name === state.theme ? '' : ''} ${name}`,
      selected: name === state.theme
    }))
  }).onSelect(item => {
    store.dispatch({ type: 'SET_THEME', payload: item.id })
    toastWidget.show('success', `Changed to: ${item.id}`, 'Theme')
  })

  // About section
  const aboutSection = box()
    .flexDirection('column')
    .gap(1)
    .add(text('@oxog/tui').bold().color('#4a9eff'))
    .add(text('Version: 1.0.0'))
    .add(text(''))
    .add(text('A comprehensive Terminal UI Framework'))
    .add(text('with 40+ widgets and 9 themes.'))
    .add(text(''))
    .add(text(' github.com/oxog/tui').color('#888888'))

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('row')
    .gap(2)
    // Theme selector
    .add(box().width(25).add(panel({ title: ' Themes' }).content(themeList)))
    // Settings
    .add(
      box()
        .flexDirection('column')
        .gap(2)
        .flex(1)
        .add(box().add(panel({ title: ' About' }).content(aboutSection)))
    )
}

// ============================================================
// Main Layout
// ============================================================

function getViewTitle(view: string): string {
  const titles: Record<string, string> = {
    dashboard: ' Dashboard',
    widgets: ' Widgets',
    data: ' Data',
    forms: ' Forms',
    charts: ' Charts',
    code: ' Code',
    kanban: ' Kanban',
    settings: ' Settings'
  }
  return titles[view] || 'Unknown'
}

function createMainLayout(): Node {
  const state = store.getState()

  // Menubar
  const menubarWidget = menubar({
    menus: [
      {
        id: 'file',
        label: 'File',
        items: [
          { value: 'new', label: 'New', shortcut: 'Ctrl+N' },
          { value: 'open', label: 'Open', shortcut: 'Ctrl+O' },
          { value: 'save', label: 'Save', shortcut: 'Ctrl+S' },
          { value: 'sep1', label: '-', separator: true },
          { value: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' }
        ]
      },
      {
        id: 'view',
        label: 'View',
        items: themeNames.slice(0, 5).map(name => ({
          value: `theme-${name}`,
          label: `Theme: ${name}`
        }))
      },
      {
        id: 'help',
        label: 'Help',
        items: [
          { value: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: 'h' },
          { value: 'about', label: 'About' }
        ]
      }
    ]
  }).onSelect(item => {
    if (item.value === 'quit') app.quit()
    else if (item.value === 'shortcuts') helpWidget.open()
    else if (item.value?.startsWith('theme-')) {
      const themeName = item.value.replace('theme-', '')
      store.dispatch({ type: 'SET_THEME', payload: themeName })
    }
  })

  // Sidebar/Drawer - use .onSelect() method
  const drawerWidget = drawer({
    items: [
      { id: 'dashboard', label: ' Dashboard', icon: '' },
      { id: 'widgets', label: ' Widgets', icon: '' },
      { id: 'data', label: ' Data', icon: '' },
      { id: 'forms', label: ' Forms', icon: '' },
      { id: 'charts', label: ' Charts', icon: '' },
      { id: 'code', label: ' Code', icon: '' },
      { id: 'kanban', label: ' Kanban', icon: '' },
      { id: 'settings', label: ' Settings', icon: '' }
    ]
  }).onSelect(item => {
    store.dispatch({ type: 'SET_VIEW', payload: item.id })
  })

  // Select the current item
  drawerWidget.selectItem(state.currentView)

  // Breadcrumb
  const breadcrumbWidget = breadcrumb({
    items: [
      { value: 'home', label: 'Home' },
      { value: state.currentView, label: getViewTitle(state.currentView).replace(/[^ ]+ /, '') }
    ],
    separator: '>'
  })

  // Statusbar
  const statusbarWidget = statusbar({
    items: [
      { id: 'mode', text: ` ${state.theme.toUpperCase()}`, align: 'left' },
      { id: 'view', text: getViewTitle(state.currentView), align: 'left' },
      { id: 'cpu', text: ` CPU: ${state.cpuUsage}%`, align: 'right' },
      { id: 'mem', text: ` MEM: ${state.memoryUsage}%`, align: 'right' },
      {
        id: 'notifications',
        text: state.notifications > 0 ? ` ${state.notifications}` : ' 0',
        align: 'right'
      },
      { id: 'time', text: new Date().toLocaleTimeString(), align: 'right' }
    ]
  })

  // Get current view
  let currentViewContent: Node
  switch (state.currentView) {
    case 'dashboard':
      currentViewContent = createDashboardView()
      break
    case 'widgets':
      currentViewContent = createWidgetsView()
      break
    case 'data':
      currentViewContent = createDataView()
      break
    case 'forms':
      currentViewContent = createFormsView()
      break
    case 'charts':
      currentViewContent = createChartsView()
      break
    case 'code':
      currentViewContent = createCodeView()
      break
    case 'kanban':
      currentViewContent = createKanbanView()
      break
    case 'settings':
      currentViewContent = createSettingsView()
      break
    default:
      currentViewContent = createDashboardView()
  }

  return box()
    .width('100%')
    .height('100%')
    .flexDirection('column')
    // Menubar
    .add(menubarWidget)
    // Main content area
    .add(
      box()
        .flex(1)
        .flexDirection('row')
        // Sidebar
        .add(state.sidebarOpen ? box().width(22).add(drawerWidget) : box().width(0))
        // Content
        .add(
          box()
            .flex(1)
            .flexDirection('column')
            .padding(1)
            // Breadcrumb
            .add(breadcrumbWidget)
            // View content
            .add(box().flex(1).add(currentViewContent))
        )
    )
    // Statusbar
    .add(statusbarWidget)
    // Overlays
    .add(toastWidget)
    .add(cmdPalette)
    .add(helpWidget)
}

// ============================================================
// Event Handlers
// ============================================================

app.on('key', event => {
  // Quit
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
    return
  }

  // Command palette
  if (event.name === '/') {
    cmdPalette.open()
    app.refresh()
    return
  }

  // Help
  if (event.name === 'h') {
    helpWidget.open()
    app.refresh()
    return
  }

  // Theme cycling
  if (event.name === 't') {
    cycleTheme()
    return
  }

  // Toggle sidebar
  if (event.name === 'b') {
    store.dispatch({ type: 'TOGGLE_SIDEBAR' })
    app.refresh()
    return
  }

  // Escape to close modals
  if (event.name === 'escape') {
    cmdPalette.close()
    helpWidget.close()
    app.refresh()
    return
  }

  // Quick view switching (1-8)
  const viewKeys: Record<string, string> = {
    '1': 'dashboard',
    '2': 'widgets',
    '3': 'data',
    '4': 'forms',
    '5': 'charts',
    '6': 'code',
    '7': 'kanban',
    '8': 'settings'
  }

  if (viewKeys[event.name]) {
    store.dispatch({ type: 'SET_VIEW', payload: viewKeys[event.name] })
    app.refresh()
    return
  }
})

// ============================================================
// Real-time Updates
// ============================================================

let updateInterval: ReturnType<typeof setInterval> | null = null

function startUpdates() {
  updateInterval = setInterval(() => {
    const state = store.getState()

    // Update metrics with slight variations
    store.dispatch({
      type: 'UPDATE_METRICS',
      payload: {
        cpu: Math.max(5, Math.min(95, state.cpuUsage + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, state.memoryUsage + (Math.random() - 0.5) * 5)),
        netIn: Math.max(10, state.networkIn + (Math.random() - 0.5) * 20),
        netOut: Math.max(5, state.networkOut + (Math.random() - 0.5) * 10)
      }
    })

    // Update chart data
    store.dispatch({
      type: 'UPDATE_CHART',
      payload: Math.floor(Math.random() * 100)
    })

    // Add random log
    if (Math.random() > 0.7) {
      const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug']
      const messages = [
        'Request processed successfully',
        'Cache miss, fetching from database',
        'Connection timeout, retrying...',
        'User session expired',
        'Background task completed',
        'Memory usage optimized'
      ]
      store.dispatch({
        type: 'ADD_LOG',
        payload: {
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: Date.now()
        }
      })
    }

    app.refresh()
  }, 1000)
}

// ============================================================
// Application Start
// ============================================================

app.onQuit(() => {
  if (updateInterval) clearInterval(updateInterval)
  console.log('\n Thanks for using @oxog/tui Ultimate Showcase!')
  console.log(' github.com/oxog/tui\n')
})

// Subscribe to state changes to re-render
store.subscribe(() => {
  app.mount(createMainLayout())
})

// Initial mount
app.mount(createMainLayout())

// Start real-time updates
startUpdates()

// Show welcome toast
setTimeout(() => {
  toastWidget.show('info', 'Press h for help, / for commands', 'Welcome!')
}, 500)
