/**
 * @oxog/tui - Notes Application
 *
 * A simple notes/todo application with:
 * - Todo list with checkboxes
 * - Note viewing
 *
 * Run with: npx tsx examples/app-notes.ts
 *
 * Controls:
 * - Arrow keys: Navigate
 * - Space: Toggle todo
 * - n: New todo
 * - d: Delete
 * - q / Ctrl+C: Quit
 */

import {
  tui,
  box,
  text,
  list,
  type ListItem
} from '../src'
import { fullPlugins } from '../src/plugins'

// ============================================================
// Application Setup
// ============================================================

const app = tui({
  plugins: fullPlugins(),
  title: 'Notes & Todos'
})

// ============================================================
// Data
// ============================================================

interface Todo {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

const todos: Todo[] = [
  { id: '1', title: 'Review pull requests', completed: false, priority: 'high' },
  { id: '2', title: 'Update documentation', completed: false, priority: 'medium' },
  { id: '3', title: 'Fix login bug', completed: true, priority: 'high' },
  { id: '4', title: 'Buy groceries', completed: false, priority: 'low' },
  { id: '5', title: 'Call dentist', completed: false, priority: 'medium' },
  { id: '6', title: 'Refactor auth module', completed: false, priority: 'medium' },
  { id: '7', title: 'Write unit tests', completed: false, priority: 'high' },
  { id: '8', title: 'Plan weekend trip', completed: true, priority: 'low' }
]

let idCounter = 10
let selectedIndex = 0

// ============================================================
// Widgets
// ============================================================

function getTodoListItems(): ListItem[] {
  const priorityIcon: Record<string, string> = {
    high: '!',
    medium: '·',
    low: ' '
  }
  return todos.map(todo => ({
    id: todo.id,
    label: `${todo.completed ? '☑' : '☐'} ${priorityIcon[todo.priority]} ${todo.title}`
  }))
}

const todoList = list({ items: getTodoListItems() })
  .width('100%')
  .height('100%')
  .onSelect(item => {
    const index = todos.findIndex(t => t.id === item.id)
    if (index !== -1) {
      selectedIndex = index
      updateDetails()
      app.refresh()
    }
  })

// Details panel
const detailTitle = text('').bold()
const detailPriority = text('')
const detailStatus = text('')

function updateDetails() {
  const todo = todos[selectedIndex]
  if (!todo) return

  detailTitle.content(todo.title)

  const priorityColors: Record<string, string> = {
    high: '#ff6b6b',
    medium: '#ffd93d',
    low: '#4ecdc4'
  }
  detailPriority.content(`Priority: ${todo.priority.toUpperCase()}`).color(priorityColors[todo.priority] || '#888888')

  detailStatus.content(todo.completed ? '✓ Completed' : '○ Pending').color(todo.completed ? '#00ff88' : '#ffd93d')
}

// Stats
const statsText = text('')

function updateStats() {
  const total = todos.length
  const completed = todos.filter(t => t.completed).length
  const high = todos.filter(t => t.priority === 'high' && !t.completed).length
  statsText.content(`${completed}/${total} done | ${high} high priority`)
}

// Help text
const helpText = text('Space: Toggle | n: New | d: Delete | q: Quit').color('#666666')

// ============================================================
// Layout
// ============================================================

const root = box()
  .width('100%')
  .height('100%')
  .flexDirection('column')
  .border('rounded')
  .borderColor('#4a9eff')
  .padding(1)
  // Header
  .add(
    box()
      .height(1)
      .flexDirection('row')
      .add(text(' Notes & Todos').color('#4a9eff').bold())
      .add(box().flex(1))
      .add(statsText.color('#888888'))
  )
  // Main content
  .add(
    box()
      .flex(1)
      .flexDirection('row')
      .gap(2)
      .padding([1, 0])
      // Todos list
      .add(
        box()
          .flex(1)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' Todos').bold())
          .add(text(''))
          .add(todoList)
      )
      // Details panel
      .add(
        box()
          .width(30)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' Details').bold())
          .add(text(''))
          .add(detailTitle)
          .add(text(''))
          .add(detailPriority)
          .add(detailStatus)
      )
  )
  // Footer
  .add(helpText)

// Initialize
updateDetails()
updateStats()
todoList.focus()

// ============================================================
// Event Handlers
// ============================================================

app.on('key', event => {
  // Quit
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
    return
  }

  // Toggle todo (Space)
  if (event.name === 'space') {
    const todo = todos[selectedIndex]
    if (todo) {
      todo.completed = !todo.completed
      todoList.items(getTodoListItems())
      updateDetails()
      updateStats()
    }
    app.refresh()
    return
  }

  // New todo
  if (event.name === 'n') {
    todos.push({
      id: String(idCounter++),
      title: `New Todo ${idCounter}`,
      completed: false,
      priority: 'medium'
    })
    todoList.items(getTodoListItems())
    updateStats()
    app.refresh()
    return
  }

  // Delete todo
  if (event.name === 'd' && !event.ctrl && todos.length > 0) {
    todos.splice(selectedIndex, 1)
    selectedIndex = Math.max(0, selectedIndex - 1)
    todoList.items(getTodoListItems())
    updateDetails()
    updateStats()
    app.refresh()
    return
  }
})

// ============================================================
// Start Application
// ============================================================

app.onQuit(() => {
  console.log('Thanks for using Notes & Todos!')
})

app.mount(root)
app.start()
