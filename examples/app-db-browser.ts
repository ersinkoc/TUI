#!/usr/bin/env npx tsx
/**
 * @oxog/tui - Database Browser Example
 *
 * A SQLite database explorer demonstrating:
 * - Database connection and table listing
 * - SQL query execution
 * - Result pagination and display
 * - Query history
 *
 * Note: This example uses better-sqlite3 if available,
 * otherwise falls back to a mock database for demonstration.
 *
 * Run with: npx tsx examples/app-db-browser.ts [database.db]
 */

import { tui, box, text, input, panel, table, textarea, tabs } from '../src'
import type { Node, TableColumn } from '../src/types'

// ============================================================
// Mock Database (for demonstration without better-sqlite3)
// ============================================================

interface MockTable {
  name: string
  columns: string[]
  rows: unknown[][]
}

const MOCK_DATABASE: MockTable[] = [
  {
    name: 'users',
    columns: ['id', 'name', 'email', 'created_at'],
    rows: [
      [1, 'Alice Johnson', 'alice@example.com', '2024-01-15'],
      [2, 'Bob Smith', 'bob@example.com', '2024-01-16'],
      [3, 'Charlie Brown', 'charlie@example.com', '2024-01-17'],
      [4, 'Diana Ross', 'diana@example.com', '2024-01-18'],
      [5, 'Eve Wilson', 'eve@example.com', '2024-01-19'],
      [6, 'Frank Miller', 'frank@example.com', '2024-01-20'],
      [7, 'Grace Lee', 'grace@example.com', '2024-01-21'],
      [8, 'Henry Ford', 'henry@example.com', '2024-01-22'],
      [9, 'Iris Chen', 'iris@example.com', '2024-01-23'],
      [10, 'Jack Black', 'jack@example.com', '2024-01-24']
    ]
  },
  {
    name: 'products',
    columns: ['id', 'name', 'price', 'stock', 'category'],
    rows: [
      [1, 'Laptop', 999.99, 50, 'Electronics'],
      [2, 'Mouse', 29.99, 200, 'Electronics'],
      [3, 'Keyboard', 79.99, 150, 'Electronics'],
      [4, 'Monitor', 299.99, 75, 'Electronics'],
      [5, 'Desk Chair', 199.99, 30, 'Furniture'],
      [6, 'Standing Desk', 449.99, 25, 'Furniture'],
      [7, 'Webcam', 89.99, 100, 'Electronics'],
      [8, 'Headphones', 149.99, 80, 'Electronics']
    ]
  },
  {
    name: 'orders',
    columns: ['id', 'user_id', 'product_id', 'quantity', 'total', 'status'],
    rows: [
      [1, 1, 1, 1, 999.99, 'completed'],
      [2, 1, 2, 2, 59.98, 'completed'],
      [3, 2, 3, 1, 79.99, 'pending'],
      [4, 3, 4, 1, 299.99, 'shipped'],
      [5, 4, 5, 2, 399.98, 'completed'],
      [6, 5, 1, 1, 999.99, 'pending'],
      [7, 6, 6, 1, 449.99, 'shipped'],
      [8, 7, 7, 3, 269.97, 'completed']
    ]
  }
]

// Simple SQL parser for mock database
function executeMockSQL(query: string): { columns: string[]; rows: unknown[][] } {
  const normalizedQuery = query.trim().toLowerCase()

  // Handle SELECT * FROM table
  const selectAllMatch = normalizedQuery.match(/select\s+\*\s+from\s+(\w+)/)
  if (selectAllMatch) {
    const tableName = selectAllMatch[1]
    const mockTable = MOCK_DATABASE.find(t => t.name === tableName)
    if (mockTable) {
      return { columns: mockTable.columns, rows: mockTable.rows }
    }
    throw new Error(`Table '${tableName}' not found`)
  }

  // Handle SELECT columns FROM table
  const selectColsMatch = normalizedQuery.match(/select\s+(.+)\s+from\s+(\w+)/)
  if (selectColsMatch) {
    const colsStr = selectColsMatch[1]!
    const tableName = selectColsMatch[2]!
    const mockTable = MOCK_DATABASE.find(t => t.name === tableName)
    if (!mockTable) {
      throw new Error(`Table '${tableName}' not found`)
    }

    const requestedCols = colsStr.split(',').map(c => c.trim())
    const colIndices = requestedCols.map(col => {
      const idx = mockTable.columns.indexOf(col)
      if (idx === -1) throw new Error(`Column '${col}' not found`)
      return idx
    })

    const rows = mockTable.rows.map(row =>
      colIndices.map(idx => row[idx])
    )

    return { columns: requestedCols, rows }
  }

  // Handle SHOW TABLES
  if (normalizedQuery.includes('show tables') || normalizedQuery === '.tables') {
    return {
      columns: ['table_name'],
      rows: MOCK_DATABASE.map(t => [t.name])
    }
  }

  // Handle DESCRIBE/PRAGMA table
  const descMatch = normalizedQuery.match(/(?:describe|pragma\s+table_info)\s*\(?\s*(\w+)\s*\)?/)
  if (descMatch) {
    const tableName = descMatch[1]
    const mockTable = MOCK_DATABASE.find(t => t.name === tableName)
    if (mockTable) {
      return {
        columns: ['column_name', 'type'],
        rows: mockTable.columns.map(col => [col, 'TEXT'])
      }
    }
    throw new Error(`Table '${tableName}' not found`)
  }

  throw new Error('Unsupported query. Try: SELECT * FROM users')
}

// ============================================================
// Types
// ============================================================

interface QueryResult {
  columns: string[]
  rows: unknown[][]
  rowCount: number
  executionTime: number
}

interface AppState {
  // Database
  dbPath: string | null
  tables: string[]

  // Query
  currentQuery: string
  queryHistory: string[]
  historyIndex: number

  // Results
  result: QueryResult | null
  error: string | null
  isExecuting: boolean

  // Pagination
  page: number
  pageSize: number

  // UI
  activePanel: 'tables' | 'query' | 'results'
  selectedTable: number
}

// ============================================================
// Main Application
// ============================================================

async function main() {
  const dbPath = process.argv[2] || null

  // Application state
  const state: AppState = {
    dbPath,
    tables: MOCK_DATABASE.map(t => t.name),
    currentQuery: 'SELECT * FROM users',
    queryHistory: [],
    historyIndex: -1,
    result: null,
    error: null,
    isExecuting: false,
    page: 0,
    pageSize: 10,
    activePanel: 'query',
    selectedTable: 0
  }

  // Create TUI app
  const app = tui({
    title: 'Database Browser',
    fullscreen: true
  })

  // UI References
  let queryInput: ReturnType<typeof textarea>

  // Execute query
  function executeQuery(query: string) {
    if (!query.trim()) return

    state.isExecuting = true
    state.error = null
    render()

    const startTime = Date.now()

    try {
      const result = executeMockSQL(query)
      const executionTime = Date.now() - startTime

      state.result = {
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rows.length,
        executionTime
      }

      // Add to history
      if (!state.queryHistory.includes(query)) {
        state.queryHistory.unshift(query)
        if (state.queryHistory.length > 50) {
          state.queryHistory.pop()
        }
      }
      state.historyIndex = -1
      state.page = 0
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Query execution failed'
      state.result = null
    }

    state.isExecuting = false
    render()
  }

  // Navigate history
  function historyUp() {
    if (state.queryHistory.length === 0) return
    if (state.historyIndex < state.queryHistory.length - 1) {
      state.historyIndex++
      state.currentQuery = state.queryHistory[state.historyIndex]!
      render()
    }
  }

  function historyDown() {
    if (state.historyIndex > 0) {
      state.historyIndex--
      state.currentQuery = state.queryHistory[state.historyIndex]!
      render()
    } else if (state.historyIndex === 0) {
      state.historyIndex = -1
      state.currentQuery = ''
      render()
    }
  }

  // Pagination
  function nextPage() {
    if (!state.result) return
    const maxPage = Math.ceil(state.result.rowCount / state.pageSize) - 1
    if (state.page < maxPage) {
      state.page++
      render()
    }
  }

  function prevPage() {
    if (state.page > 0) {
      state.page--
      render()
    }
  }

  // Select table
  function selectTable(index: number) {
    if (index >= 0 && index < state.tables.length) {
      state.selectedTable = index
      state.currentQuery = `SELECT * FROM ${state.tables[index]}`
      executeQuery(state.currentQuery)
    }
  }

  // Create UI
  function createUI(): Node {
    // Tables panel
    const tablesPanel = panel({ title: 'Tables', border: 'rounded' })

    for (let i = 0; i < state.tables.length; i++) {
      const tableName = state.tables[i]!
      const isSelected = i === state.selectedTable
      const prefix = isSelected ? '► ' : '  '
      tablesPanel.add(text(`${prefix}${tableName}`))
    }

    tablesPanel.add(text('\n[↑/↓] Navigate  [Enter] Select'))

    // Query panel
    queryInput = textarea({
      value: state.currentQuery,
      placeholder: 'Enter SQL query...'
    })
    queryInput.onChange(value => {
      state.currentQuery = value
    })

    const queryPanel = panel({ title: 'Query', border: 'rounded' })
      .add(queryInput)
      .add(text('\n[Ctrl+Enter] Execute  [↑/↓] History'))

    // Results panel
    const resultsPanel = panel({ title: 'Results', border: 'rounded' })

    if (state.isExecuting) {
      resultsPanel.add(text('Executing query...'))
    } else if (state.error) {
      resultsPanel.add(text(`Error: ${state.error}`))
    } else if (state.result) {
      // Status line
      const startRow = state.page * state.pageSize + 1
      const endRow = Math.min((state.page + 1) * state.pageSize, state.result.rowCount)
      const totalPages = Math.ceil(state.result.rowCount / state.pageSize)

      resultsPanel.add(
        text(`${state.result.rowCount} rows (${state.result.executionTime}ms) | Page ${state.page + 1}/${totalPages} | Rows ${startRow}-${endRow}`)
      )
      resultsPanel.add(text(''))

      // Create table columns
      const columns: TableColumn[] = state.result.columns.map(col => ({
        key: col,
        label: col,
        width: Math.max(col.length + 2, 15)
      }))

      // Get current page data
      const pageData = state.result.rows
        .slice(state.page * state.pageSize, (state.page + 1) * state.pageSize)
        .map(row => {
          const obj: Record<string, unknown> = {}
          state.result!.columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj
        })

      const resultTable = table({
        columns,
        data: pageData
      })

      resultsPanel.add(resultTable)
      resultsPanel.add(text('\n[←/→] Page  [E] Export  [C] Copy'))
    } else {
      resultsPanel.add(text('Execute a query to see results'))
    }

    // History panel
    const historyPanel = panel({ title: 'History', border: 'rounded' })
    if (state.queryHistory.length === 0) {
      historyPanel.add(text('No query history'))
    } else {
      for (let i = 0; i < Math.min(5, state.queryHistory.length); i++) {
        const query = state.queryHistory[i]!
        const truncated = query.length > 50 ? query.slice(0, 47) + '...' : query
        const prefix = i === state.historyIndex ? '► ' : '  '
        historyPanel.add(text(`${prefix}${truncated}`))
      }
    }

    // Help text
    const helpText = text('\n  [F5] Execute  [Tab] Switch Panel  [Ctrl+Q] Quit')

    // Main layout
    const leftColumn = box()
      .add(tablesPanel)
      .add(historyPanel)

    const rightColumn = box()
      .add(queryPanel)
      .add(resultsPanel)

    return box()
      .add(
        box()
          .add(leftColumn)
          .add(rightColumn)
      )
      .add(helpText)
  }

  // Render function
  function render() {
    app.mount(createUI())
    app.markDirty()
  }

  // Handle key input
  app.on('key', (key: string, ctrl: boolean) => {
    if (ctrl && key === 'q') {
      app.quit()
      return
    }

    if (ctrl && key === 'enter') {
      executeQuery(state.currentQuery)
      return
    }

    if (key === 'f5') {
      executeQuery(state.currentQuery)
      return
    }

    // Table navigation
    if (key === 'up' && state.activePanel === 'tables') {
      if (state.selectedTable > 0) {
        state.selectedTable--
        render()
      }
      return
    }

    if (key === 'down' && state.activePanel === 'tables') {
      if (state.selectedTable < state.tables.length - 1) {
        state.selectedTable++
        render()
      }
      return
    }

    if (key === 'enter' && state.activePanel === 'tables') {
      selectTable(state.selectedTable)
      return
    }

    // Pagination
    if (key === 'left' || key === 'pageup') {
      prevPage()
      return
    }

    if (key === 'right' || key === 'pagedown') {
      nextPage()
      return
    }

    // History navigation (when in query panel)
    if (ctrl && key === 'up') {
      historyUp()
      return
    }

    if (ctrl && key === 'down') {
      historyDown()
      return
    }

    // Panel switching
    if (key === 'tab') {
      const panels: Array<'tables' | 'query' | 'results'> = ['tables', 'query', 'results']
      const idx = panels.indexOf(state.activePanel)
      state.activePanel = panels[(idx + 1) % panels.length]!
      render()
      return
    }

    // Quick table selection with numbers
    if (key >= '1' && key <= '9') {
      const idx = parseInt(key) - 1
      selectTable(idx)
      return
    }
  })

  // Initial render and execute default query
  render()
  executeQuery(state.currentQuery)

  // Start
  await app.start()
}

// Run
main().catch(console.error)
