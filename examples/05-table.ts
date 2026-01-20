/**
 * @oxog/tui - Example 05: Table
 *
 * Demonstrates table widget with columns and rows.
 */

import { tui, box, text, table } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Table Example'
})

// Sample data
const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Active' },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Editor',
    status: 'Inactive'
  },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Active' },
  { id: 5, name: 'Eve Wilson', email: 'eve@example.com', role: 'User', status: 'Pending' },
  { id: 6, name: 'Frank Castle', email: 'frank@example.com', role: 'User', status: 'Active' },
  { id: 7, name: 'Grace Lee', email: 'grace@example.com', role: 'Editor', status: 'Active' },
  { id: 8, name: 'Henry Ford', email: 'henry@example.com', role: 'User', status: 'Inactive' }
]

// Create table
const userTable = table()
  .columns([
    { key: 'id', header: 'ID', width: 5, align: 'right' },
    { key: 'name', header: 'Name', width: 20 },
    { key: 'email', header: 'Email', width: 25 },
    { key: 'role', header: 'Role', width: 10 },
    { key: 'status', header: 'Status', width: 10 }
  ])
  .data(users)
  .border('single')
  .height(15)
  .onChange((row, index) => {
    console.error(`Selected: ${row.name} (index: ${index})`)
  })

// Layout
const root = box()
  .flexDirection('column')
  .padding(1)
  .add(text('User Management').bold().color('#00ff00'))
  .add(text(''))
  .add(userTable)
  .add(text(''))
  .add(text('↑/↓: Navigate  Enter: Select  q: Quit').dim())

// Handle keys
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
  if (event.name === 'up') {
    const current = userTable.selectedIndex
    if (current > 0) {
      userTable.selectedRow(current - 1)
      app.refresh()
    }
  }
  if (event.name === 'down') {
    const current = userTable.selectedIndex
    if (current < userTable.rowCount - 1) {
      userTable.selectedRow(current + 1)
      app.refresh()
    }
  }
})

app.mount(root)
app.start()
