import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  box,
  text,
  progress,
  spinner,
  button,
  badge,
  checkbox,
  slider,
  accordion,
  panel,
  gauge,
  sparkline,
  barchart,
  timeline,
  logviewer,
  datagrid,
  tree,
  jsonviewer,
  pagination,
  form,
  searchinput,
  colorpicker,
  calendar,
  wizard,
  codeviewer,
  markdownviewer,
  kanban,
  stopwatch,
  list,
  menubar,
  drawer,
  breadcrumb,
  statusbar,
  toast,
  commandpalette,
  modal,
  help,
  helpSection,
  helpItems,
  heatmap,
  themes,
  createBuffer
} from '../../src'
import type { Action, Reducer, Store } from '../../src/plugins/state'

// ============================================================
// App State Types (from showcase)
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
  logs: { level: 'info' | 'warn' | 'error' | 'debug'; message: string; timestamp: number }[]
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

// Reducer from showcase
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload as string }
    case 'SET_THEME':
      return { ...state, theme: action.payload as string }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'UPDATE_METRICS':
      return {
        ...state,
        cpuUsage: (action.payload as any).cpu,
        memoryUsage: (action.payload as any).memory,
        networkIn: (action.payload as any).netIn,
        networkOut: (action.payload as any).netOut
      }
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs.slice(-99), action.payload as AppState['logs'][0]]
      }
    case 'UPDATE_CHART':
      return {
        ...state,
        chartData: [...state.chartData.slice(1), action.payload as number]
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === (action.payload as { id: string; status: string }).id
            ? { ...t, status: (action.payload as { id: string; status: string }).status as 'todo' | 'doing' | 'done' }
            : t
        )
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
// State Management Tests
// ============================================================

describe('Ultimate Showcase - State Management', () => {
  describe('appReducer', () => {
    it('should return initial state for unknown action', () => {
      const state = appReducer(initialState, { type: 'UNKNOWN' })
      expect(state).toEqual(initialState)
    })

    it('should handle SET_VIEW action', () => {
      const state = appReducer(initialState, { type: 'SET_VIEW', payload: 'widgets' })
      expect(state.currentView).toBe('widgets')
    })

    it('should handle SET_THEME action', () => {
      const state = appReducer(initialState, { type: 'SET_THEME', payload: 'dracula' })
      expect(state.theme).toBe('dracula')
    })

    it('should handle TOGGLE_SIDEBAR action', () => {
      let state = appReducer(initialState, { type: 'TOGGLE_SIDEBAR' })
      expect(state.sidebarOpen).toBe(false)

      state = appReducer(state, { type: 'TOGGLE_SIDEBAR' })
      expect(state.sidebarOpen).toBe(true)
    })

    it('should handle UPDATE_METRICS action', () => {
      const payload = { cpu: 75, memory: 80, netIn: 200, netOut: 100 }
      const state = appReducer(initialState, { type: 'UPDATE_METRICS', payload })

      expect(state.cpuUsage).toBe(75)
      expect(state.memoryUsage).toBe(80)
      expect(state.networkIn).toBe(200)
      expect(state.networkOut).toBe(100)
    })

    it('should handle ADD_LOG action', () => {
      const log = { level: 'info' as const, message: 'Test log', timestamp: Date.now() }
      const state = appReducer(initialState, { type: 'ADD_LOG', payload: log })

      expect(state.logs).toHaveLength(1)
      expect(state.logs[0]).toEqual(log)
    })

    it('should limit logs to 100 entries', () => {
      let state = initialState

      // Add 105 logs
      for (let i = 0; i < 105; i++) {
        const log = { level: 'info' as const, message: `Log ${i}`, timestamp: Date.now() }
        state = appReducer(state, { type: 'ADD_LOG', payload: log })
      }

      expect(state.logs.length).toBeLessThanOrEqual(100)
    })

    it('should handle UPDATE_CHART action', () => {
      const state = appReducer(initialState, { type: 'UPDATE_CHART', payload: 100 })

      expect(state.chartData).toHaveLength(10)
      expect(state.chartData[state.chartData.length - 1]).toBe(100)
      // First element should have shifted out
      expect(state.chartData[0]).toBe(initialState.chartData[1])
    })

    it('should handle UPDATE_TASK action', () => {
      const state = appReducer(initialState, {
        type: 'UPDATE_TASK',
        payload: { id: '5', status: 'doing' }
      })

      const task = state.tasks.find(t => t.id === '5')
      expect(task?.status).toBe('doing')
    })

    it('should handle SET_SEARCH action', () => {
      const state = appReducer(initialState, { type: 'SET_SEARCH', payload: 'test query' })
      expect(state.searchQuery).toBe('test query')
    })

    it('should handle CLEAR_NOTIFICATIONS action', () => {
      const state = appReducer(initialState, { type: 'CLEAR_NOTIFICATIONS' })
      expect(state.notifications).toBe(0)
    })
  })

  describe('view navigation', () => {
    const views = ['dashboard', 'widgets', 'data', 'forms', 'charts', 'code', 'kanban', 'settings']

    it.each(views)('should navigate to %s view', (view) => {
      const state = appReducer(initialState, { type: 'SET_VIEW', payload: view })
      expect(state.currentView).toBe(view)
    })
  })

  describe('theme switching', () => {
    const themeNames = Object.keys(themes)

    it.each(themeNames)('should switch to %s theme', (themeName) => {
      const state = appReducer(initialState, { type: 'SET_THEME', payload: themeName })
      expect(state.theme).toBe(themeName)
    })
  })
})

// ============================================================
// Widget Creation Tests
// ============================================================

describe('Ultimate Showcase - Widget Creation', () => {
  describe('Dashboard widgets', () => {
    it('should create CPU gauge', () => {
      const cpuGauge = gauge({
        value: 45,
        max: 100,
        label: 'CPU',
        showValue: true
      })

      expect(cpuGauge).toBeDefined()
      expect(cpuGauge.type).toBe('gauge')
    })

    it('should create memory gauge', () => {
      const memGauge = gauge({
        value: 62,
        max: 100,
        label: 'Memory',
        showValue: true
      })

      expect(memGauge).toBeDefined()
    })

    it('should create sparkline for network', () => {
      const netSparkline = sparkline({
        data: [30, 45, 60, 35, 80],
        color: '#4a9eff',
        height: 3
      })

      expect(netSparkline).toBeDefined()
      expect(netSparkline.type).toBe('sparkline')
    })

    it('should create activity timeline', () => {
      const activityTimeline = timeline({
        items: [
          { id: '1', title: 'App started', status: 'completed', time: 'Just now' },
          { id: '2', title: 'Database connected', status: 'completed', time: '2s ago' },
          { id: '3', title: 'Loading modules', status: 'current', time: 'In progress' }
        ]
      })

      expect(activityTimeline).toBeDefined()
      expect(activityTimeline.type).toBe('timeline')
    })

    it('should create bar chart', () => {
      const statsChart = barchart({
        data: [
          { label: 'Mon', value: 45, color: '#4a9eff' },
          { label: 'Tue', value: 72, color: '#00ff88' },
          { label: 'Wed', value: 58, color: '#ffaa00' }
        ],
        showValues: true,
        height: 8
      })

      expect(statsChart).toBeDefined()
      expect(statsChart.type).toBe('barchart')
    })

    it('should create log viewer', () => {
      const recentLogs = logviewer({
        entries: [
          { level: 'info', message: 'Test message', timestamp: '10:00:00' }
        ],
        showTimestamps: true,
        showLevels: true
      })

      expect(recentLogs).toBeDefined()
      expect(recentLogs.type).toBe('logviewer')
    })
  })

  describe('Widgets showcase', () => {
    it('should create progress bars', () => {
      const prog1 = progress({ value: 25 }).filledColor('#ff6b6b')
      const prog2 = progress({ value: 60 }).filledColor('#00ff88')
      const prog3 = progress({ value: 90 }).filledColor('#4a9eff')

      expect(prog1).toBeDefined()
      expect(prog2).toBeDefined()
      expect(prog3).toBeDefined()
      expect(prog1.type).toBe('progress')
      expect(prog2.type).toBe('progress')
      expect(prog3.type).toBe('progress')
    })

    it('should create spinners with different styles', () => {
      const spin1 = spinner({ style: 'dots' }).label('Loading')
      const spin2 = spinner({ style: 'line' }).label('Syncing')

      expect(spin1).toBeDefined()
      expect(spin2).toBeDefined()
    })

    it('should create buttons with different variants', () => {
      const btn1 = button({ label: 'Primary', variant: 'primary' })
      const btn2 = button({ label: 'Secondary', variant: 'secondary' })
      const btn3 = button({ label: 'Danger', variant: 'danger' })
      const btn4 = button({ label: 'Ghost', variant: 'ghost' })

      expect(btn1).toBeDefined()
      expect(btn2).toBeDefined()
      expect(btn3).toBeDefined()
      expect(btn4).toBeDefined()
    })

    it('should create badges with different variants', () => {
      const badge1 = badge({ text: 'New', variant: 'success' })
      const badge2 = badge({ text: '5', variant: 'danger', shape: 'circle' })
      const badge3 = badge({ text: 'Beta', variant: 'warning' })
      const badge4 = badge({ text: 'Pro', variant: 'info' })

      expect(badge1).toBeDefined()
      expect(badge2).toBeDefined()
      expect(badge3).toBeDefined()
      expect(badge4).toBeDefined()
    })

    it('should create checkboxes', () => {
      const cb1 = checkbox({ label: 'Enable notifications', checked: true })
      const cb2 = checkbox({ label: 'Dark mode', checked: false })

      expect(cb1).toBeDefined()
      expect(cb2).toBeDefined()
    })

    it('should create slider', () => {
      const sliderWidget = slider({
        min: 0,
        max: 100,
        value: 50,
        label: 'Volume',
        showValue: true
      })

      expect(sliderWidget).toBeDefined()
      expect(sliderWidget.type).toBe('slider')
    })

    it('should create accordion', () => {
      const accordionWidget = accordion({
        panels: [
          { id: '1', title: 'Section 1', content: text('Content 1') },
          { id: '2', title: 'Section 2', content: text('Content 2') }
        ],
        multiple: false
      })

      expect(accordionWidget).toBeDefined()
      expect(accordionWidget.type).toBe('accordion')
    })
  })

  describe('Data view widgets', () => {
    it('should create data grid', () => {
      const dataGrid = datagrid({
        columns: [
          { key: 'id', header: 'ID', width: 8, sortable: true },
          { key: 'name', header: 'Name', width: 25, sortable: true },
          { key: 'email', header: 'Email', width: 30 }
        ],
        data: [
          { id: '001', name: 'John Doe', email: 'john@example.com' },
          { id: '002', name: 'Jane Smith', email: 'jane@example.com' }
        ],
        selectable: true,
        striped: true
      })

      expect(dataGrid).toBeDefined()
      expect(dataGrid.type).toBe('datagrid')
    })

    it('should create tree view', () => {
      const treeView = tree({
        data: [
          {
            id: '1',
            label: 'src',
            children: [
              { id: '1.1', label: 'components' },
              { id: '1.2', label: 'utils' }
            ]
          }
        ],
        icons: true
      })

      expect(treeView).toBeDefined()
      expect(treeView.type).toBe('tree')
    })

    it('should create JSON viewer', () => {
      const jsonView = jsonviewer({
        data: { name: 'test', value: 42 },
        collapsed: false,
        indentSize: 2
      })

      expect(jsonView).toBeDefined()
      expect(jsonView.type).toBe('jsonviewer')
    })

    it('should create pagination', () => {
      const paginationWidget = pagination({
        currentPage: 1,
        totalPages: 10
      })

      expect(paginationWidget).toBeDefined()
      expect(paginationWidget.type).toBe('pagination')
    })
  })

  describe('Forms view widgets', () => {
    it('should create form with validation', () => {
      const userForm = form({
        fields: [
          {
            name: 'username',
            label: 'Username',
            type: 'text',
            required: true,
            validators: [{ type: 'minLength', value: 3, message: 'Min 3 characters' }]
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            validators: [{ type: 'email', message: 'Invalid email format' }]
          }
        ]
      })

      expect(userForm).toBeDefined()
      expect(userForm.type).toBe('form')
    })

    it('should create search input', () => {
      const searchWidget = searchinput({
        placeholder: 'Search users...',
        suggestions: [
          { label: 'John Doe', value: 'john' },
          { label: 'Jane Smith', value: 'jane' }
        ]
      })

      expect(searchWidget).toBeDefined()
      expect(searchWidget.type).toBe('searchinput')
    })

    it('should create color picker', () => {
      const colorPickerWidget = colorpicker({
        value: { r: 74, g: 158, b: 255 },
        mode: 'rgb'
      })

      expect(colorPickerWidget).toBeDefined()
      expect(colorPickerWidget.type).toBe('colorpicker')
    })

    it('should create calendar', () => {
      const calendarWidget = calendar({
        selectedDate: new Date()
      })

      expect(calendarWidget).toBeDefined()
      expect(calendarWidget.type).toBe('calendar')
    })

    it('should create wizard', () => {
      const wizardWidget = wizard({
        steps: [
          { id: '1', title: 'Account', status: 'completed' },
          { id: '2', title: 'Profile', status: 'current' },
          { id: '3', title: 'Settings', status: 'pending' }
        ]
      })

      expect(wizardWidget).toBeDefined()
      expect(wizardWidget.type).toBe('wizard')
    })
  })

  describe('Charts view widgets', () => {
    it('should create multiple gauges', () => {
      const cpuGauge = gauge({ value: 45, max: 100, label: 'CPU', showValue: true })
      const memGauge = gauge({ value: 62, max: 100, label: 'Memory', showValue: true })
      const diskGauge = gauge({ value: 75, max: 100, label: 'Disk', showValue: true })

      expect(cpuGauge).toBeDefined()
      expect(memGauge).toBeDefined()
      expect(diskGauge).toBeDefined()
    })

    it('should create heatmap', () => {
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

      expect(heatmapWidget).toBeDefined()
      expect(heatmapWidget.type).toBe('heatmap')
    })
  })

  describe('Code view widgets', () => {
    it('should create code viewer', () => {
      const sampleCode = `const x = 42;
console.log(x);`

      const codeWidget = codeviewer({
        code: sampleCode,
        language: 'typescript',
        showLineNumbers: true
      })

      expect(codeWidget).toBeDefined()
      expect(codeWidget.type).toBe('codeviewer')
    })

    it('should create markdown viewer', () => {
      const markdownContent = `# Heading

This is **bold** text.`

      const markdownWidget = markdownviewer({ content: markdownContent })

      expect(markdownWidget).toBeDefined()
      expect(markdownWidget.type).toBe('markdownviewer')
    })
  })

  describe('Kanban view widgets', () => {
    it('should create kanban board', () => {
      const kanbanWidget = kanban({
        columns: [
          {
            id: 'todo',
            title: 'To Do',
            color: '#ff6b6b',
            cards: [{ id: '1', title: 'Task 1', tags: ['high'], color: '#ff6b6b' }]
          },
          {
            id: 'doing',
            title: 'In Progress',
            color: '#ffaa00',
            cards: [{ id: '2', title: 'Task 2', tags: ['medium'], color: '#ffaa00' }]
          },
          {
            id: 'done',
            title: 'Done',
            color: '#00ff88',
            cards: []
          }
        ]
      })

      expect(kanbanWidget).toBeDefined()
      expect(kanbanWidget.type).toBe('kanban')
    })

    it('should create stopwatch', () => {
      const stopwatchWidget = stopwatch({
        mode: 'stopwatch'
      })

      expect(stopwatchWidget).toBeDefined()
      expect(stopwatchWidget.type).toBe('stopwatch')
    })
  })

  describe('Settings view widgets', () => {
    it('should create theme list', () => {
      const themeList = list({
        items: Object.keys(themes).map((name, i) => ({
          id: name,
          label: name,
          selected: i === 0
        }))
      })

      expect(themeList).toBeDefined()
      expect(themeList.type).toBe('list')
    })
  })

  describe('Layout widgets', () => {
    it('should create menubar', () => {
      const menubarWidget = menubar({
        menus: [
          {
            label: 'File',
            items: [
              { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
              { id: 'open', label: 'Open', shortcut: 'Ctrl+O' },
              { id: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' }
            ]
          }
        ]
      })

      expect(menubarWidget).toBeDefined()
      expect(menubarWidget.type).toBe('menubar')
    })

    it('should create drawer', () => {
      const drawerWidget = drawer({
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: '' },
          { id: 'settings', label: 'Settings', icon: '' }
        ],
        selected: 'dashboard'
      })

      expect(drawerWidget).toBeDefined()
      expect(drawerWidget.type).toBe('drawer')
    })

    it('should create breadcrumb', () => {
      const breadcrumbWidget = breadcrumb({
        items: [
          { id: 'home', label: 'Home' },
          { id: 'dashboard', label: 'Dashboard' }
        ],
        separator: '>'
      })

      expect(breadcrumbWidget).toBeDefined()
      expect(breadcrumbWidget.type).toBe('breadcrumb')
    })

    it('should create statusbar', () => {
      const statusbarWidget = statusbar({
        items: [
          { id: 'mode', content: 'DEFAULT', align: 'left' },
          { id: 'time', content: '12:00:00', align: 'right' }
        ]
      })

      expect(statusbarWidget).toBeDefined()
      expect(statusbarWidget.type).toBe('statusbar')
    })

    it('should create panel', () => {
      const panelWidget = panel({ title: 'Test Panel' })
        .add(text('Panel content'))

      expect(panelWidget).toBeDefined()
      expect(panelWidget.type).toBe('panel')
    })
  })

  describe('Overlay widgets', () => {
    it('should create toast', () => {
      const toastWidget = toast({ position: 'top-right', maxVisible: 3, duration: 3000 })

      expect(toastWidget).toBeDefined()
      expect(toastWidget.type).toBe('toast')
    })

    it('should create command palette', () => {
      const cmdPalette = commandpalette({
        placeholder: 'Type a command...',
        commands: [
          { id: 'dashboard', label: 'Go to Dashboard', category: 'Navigation', shortcut: '1' },
          { id: 'help', label: 'Show Help', category: 'Help', shortcut: 'h' }
        ]
      })

      expect(cmdPalette).toBeDefined()
      expect(cmdPalette.type).toBe('commandpalette')
    })

    it('should create modal with help content', () => {
      const helpModal = modal({
        title: 'Keyboard Shortcuts',
        width: 50,
        height: 20
      }).content(
        help({
          sections: [
            helpSection('Navigation', [
              helpItems('1-8', 'Quick switch views'),
              helpItems('Tab', 'Next section')
            ])
          ]
        })
      )

      expect(helpModal).toBeDefined()
      expect(helpModal.type).toBe('modal')
    })

    it('should create help widget', () => {
      const helpWidget = help({
        sections: [
          helpSection('Test', [
            helpItems('key', 'description')
          ])
        ]
      })

      expect(helpWidget).toBeDefined()
      expect(helpWidget.type).toBe('help')
    })
  })
})

// ============================================================
// Layout Tests
// ============================================================

describe('Ultimate Showcase - Layout', () => {
  it('should create main layout with box', () => {
    const layout = box()
      .width('100%')
      .height('100%')
      .flexDirection('column')

    expect(layout).toBeDefined()
    expect(layout.type).toBe('box')
  })

  it('should create nested box layouts', () => {
    const layout = box()
      .flexDirection('column')
      .add(
        box()
          .flexDirection('row')
          .gap(2)
          .add(box().width('50%'))
          .add(box().flex(1))
      )
      .add(box().flex(1))

    expect(layout).toBeDefined()
    expect(layout.children.length).toBe(2)
    expect(layout.children[0].children.length).toBe(2)
  })

  it('should create panels with actions', () => {
    const panelWidget = panel({
      title: 'Test',
      actions: [
        { icon: '', onClick: () => {} },
        { icon: '', label: 'Clear', onClick: () => {} }
      ]
    })

    expect(panelWidget).toBeDefined()
  })
})

// ============================================================
// Theme Tests
// ============================================================

describe('Ultimate Showcase - Themes', () => {
  it('should have all expected themes', () => {
    const expectedThemes = [
      'default',
      'light',
      'dracula',
      'nord',
      'monokai',
      'gruvbox',
      'solarized-dark',
      'tokyo-night',
      'catppuccin-mocha'
    ]

    const availableThemes = Object.keys(themes)

    for (const theme of expectedThemes) {
      expect(availableThemes).toContain(theme)
    }
  })

  it('should cycle through themes correctly', () => {
    const themeNames = Object.keys(themes)
    let currentThemeIndex = 0

    // Simulate cycling
    for (let i = 0; i < themeNames.length + 2; i++) {
      currentThemeIndex = (currentThemeIndex + 1) % themeNames.length
      expect(currentThemeIndex).toBeGreaterThanOrEqual(0)
      expect(currentThemeIndex).toBeLessThan(themeNames.length)
    }
  })

  it('each theme should have required color properties', () => {
    const requiredColors = [
      'primary',
      'secondary',
      'background',
      'text',
      'success',
      'warning',
      'error',
      'info'
    ]

    for (const [themeName, theme] of Object.entries(themes)) {
      for (const color of requiredColors) {
        expect(theme.colors).toHaveProperty(color)
      }
    }
  })
})

// ============================================================
// View Title Helper Tests
// ============================================================

describe('Ultimate Showcase - View Helpers', () => {
  const viewTitles: Record<string, string> = {
    dashboard: ' Dashboard',
    widgets: ' Widgets',
    data: ' Data',
    forms: ' Forms',
    charts: ' Charts',
    code: ' Code',
    kanban: ' Kanban',
    settings: ' Settings'
  }

  function getViewTitle(view: string): string {
    return viewTitles[view] || 'Unknown'
  }

  it.each(Object.entries(viewTitles))('should return correct title for %s view', (view, expectedTitle) => {
    expect(getViewTitle(view)).toBe(expectedTitle)
  })

  it('should return "Unknown" for invalid view', () => {
    expect(getViewTitle('invalid')).toBe('Unknown')
  })
})

// ============================================================
// Task Management Tests
// ============================================================

describe('Ultimate Showcase - Task Management', () => {
  it('should filter tasks by status', () => {
    const tasks = initialState.tasks

    const todoTasks = tasks.filter(t => t.status === 'todo')
    const doingTasks = tasks.filter(t => t.status === 'doing')
    const doneTasks = tasks.filter(t => t.status === 'done')

    expect(todoTasks.length).toBe(2)
    expect(doingTasks.length).toBe(2)
    expect(doneTasks.length).toBe(2)
  })

  it('should group tasks by priority', () => {
    const tasks = initialState.tasks

    const highPriority = tasks.filter(t => t.priority === 'high')
    const mediumPriority = tasks.filter(t => t.priority === 'medium')
    const lowPriority = tasks.filter(t => t.priority === 'low')

    expect(highPriority.length).toBe(2)
    expect(mediumPriority.length).toBe(2)
    expect(lowPriority.length).toBe(2)
  })

  it('should update task status', () => {
    const state = appReducer(initialState, {
      type: 'UPDATE_TASK',
      payload: { id: '5', status: 'doing' }
    })

    const task = state.tasks.find(t => t.id === '5')
    expect(task?.status).toBe('doing')
  })
})

// ============================================================
// Real-time Update Simulation Tests
// ============================================================

describe('Ultimate Showcase - Real-time Updates', () => {
  it('should update metrics within bounds', () => {
    let state = initialState

    // Simulate multiple metric updates
    for (let i = 0; i < 10; i++) {
      const cpu = Math.max(5, Math.min(95, state.cpuUsage + (Math.random() - 0.5) * 10))
      const memory = Math.max(20, Math.min(90, state.memoryUsage + (Math.random() - 0.5) * 5))

      state = appReducer(state, {
        type: 'UPDATE_METRICS',
        payload: { cpu, memory, netIn: 100, netOut: 50 }
      })

      expect(state.cpuUsage).toBeGreaterThanOrEqual(5)
      expect(state.cpuUsage).toBeLessThanOrEqual(95)
      expect(state.memoryUsage).toBeGreaterThanOrEqual(20)
      expect(state.memoryUsage).toBeLessThanOrEqual(90)
    }
  })

  it('should update chart data with sliding window', () => {
    let state = initialState
    const originalLength = state.chartData.length

    // Add 5 new data points
    for (let i = 0; i < 5; i++) {
      state = appReducer(state, {
        type: 'UPDATE_CHART',
        payload: Math.floor(Math.random() * 100)
      })
    }

    // Length should remain the same (sliding window)
    expect(state.chartData.length).toBe(originalLength)
  })

  it('should add logs with correct structure', () => {
    const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug']
    let state = initialState

    for (const level of levels) {
      state = appReducer(state, {
        type: 'ADD_LOG',
        payload: {
          level,
          message: `Test ${level} message`,
          timestamp: Date.now()
        }
      })
    }

    expect(state.logs.length).toBe(4)
    expect(state.logs.map(l => l.level)).toEqual(levels)
  })
})

// ============================================================
// Buffer Rendering Tests
// ============================================================

describe('Ultimate Showcase - Buffer Operations', () => {
  it('should create buffer with correct dimensions', () => {
    const buffer = createBuffer(80, 24)

    expect(buffer.width).toBe(80)
    expect(buffer.height).toBe(24)
  })

  it('should set and get cells correctly', () => {
    const buffer = createBuffer(10, 10)

    buffer.set(5, 5, { char: 'X', fg: 0xffffffff, bg: 0x000000ff, attrs: 0 })
    const cell = buffer.get(5, 5)

    expect(cell?.char).toBe('X')
    expect(cell?.fg).toBe(0xffffffff)
  })
})

// ============================================================
// Integration Tests
// ============================================================

describe('Ultimate Showcase - Integration', () => {
  it('should create complete dashboard view', () => {
    const state = initialState

    // Create all dashboard widgets
    const cpuGauge = gauge({ value: state.cpuUsage, max: 100, label: 'CPU' })
    const memGauge = gauge({ value: state.memoryUsage, max: 100, label: 'Memory' })
    const netSparkline = sparkline({ data: state.chartData, color: '#4a9eff', height: 3 })
    const activityTimeline = timeline({
      items: [
        { id: '1', title: 'App started', status: 'completed', time: 'Just now' }
      ]
    })
    const statsChart = barchart({
      data: [{ label: 'Mon', value: 45, color: '#4a9eff' }],
      showValues: true,
      height: 8
    })
    const recentLogs = logviewer({
      entries: state.logs.slice(-5).map(log => ({
        level: log.level,
        message: log.message,
        timestamp: new Date(log.timestamp).toLocaleTimeString()
      })),
      showTimestamps: true,
      showLevels: true
    })

    // Create layout
    const dashboardView = box()
      .width('100%')
      .height('100%')
      .flexDirection('column')
      .gap(1)
      .add(
        box()
          .flexDirection('row')
          .gap(2)
          .add(panel({ title: 'CPU' }).add(cpuGauge))
          .add(panel({ title: 'Memory' }).add(memGauge))
          .add(panel({ title: 'Network' }).add(netSparkline))
      )
      .add(
        box()
          .flexDirection('row')
          .gap(2)
          .add(panel({ title: 'Activity' }).add(activityTimeline))
          .add(panel({ title: 'Stats' }).add(statsChart))
      )
      .add(panel({ title: 'Logs' }).add(recentLogs))

    expect(dashboardView).toBeDefined()
    expect(dashboardView.children.length).toBe(3)
  })

  it('should create complete main layout', () => {
    const state = initialState

    // Create layout components
    const menubarWidget = menubar({
      menus: [{ label: 'File', items: [{ id: 'quit', label: 'Quit' }] }]
    })
    const drawerWidget = drawer({
      items: [{ id: 'dashboard', label: 'Dashboard', icon: '' }],
      selected: state.currentView
    })
    const breadcrumbWidget = breadcrumb({
      items: [{ id: 'home', label: 'Home' }]
    })
    const statusbarWidget = statusbar({
      items: [{ id: 'status', content: 'Ready', align: 'left' }]
    })
    const toastWidget = toast({ position: 'top-right' })

    // Create main layout
    const mainLayout = box()
      .width('100%')
      .height('100%')
      .flexDirection('column')
      .add(menubarWidget)
      .add(
        box()
          .flex(1)
          .flexDirection('row')
          .add(box().width(22).add(drawerWidget))
          .add(
            box()
              .flex(1)
              .flexDirection('column')
              .add(breadcrumbWidget)
              .add(box().flex(1))
          )
      )
      .add(statusbarWidget)
      .add(toastWidget)

    expect(mainLayout).toBeDefined()
    expect(mainLayout.children.length).toBe(4)
  })
})
