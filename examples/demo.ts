/**
 * @oxog/tui - Interactive Demo
 *
 * This demo showcases all the main widgets and features.
 * Run with: npx tsx examples/demo.ts
 */

import { tui, box, text, input, checkbox, progress, spinner, select } from '../src'
import { standardPlugins } from '../src/plugins'

// ============================================================
// Demo Application
// ============================================================

const app = tui({
  plugins: standardPlugins(),
  title: 'TUI Demo'
})

// Progress value
let progressValue = 0
let progressInterval: ReturnType<typeof setInterval> | null = null

// Create widgets
const titleText = text('[ @oxog/tui Demo ]').width('100%')

const descText = text('A modern terminal UI library for Node.js').width('100%')

const nameInput = input({ placeholder: 'Enter your name...' })
  .width(30)
  .onSubmit(value => {
    greetingText.content(`Hello, ${value || 'World'}!`)
    app.refresh()
  })

const greetingText = text('Hello, World!')

const darkModeCheckbox = checkbox({ label: 'Dark Mode', checked: true }).onChange(checked => {
  statusText.content(`Dark mode: ${checked ? 'ON' : 'OFF'}`)
  app.refresh()
})

const animationsCheckbox = checkbox({ label: 'Animations', checked: true }).onChange(checked => {
  if (checked) {
    loadingSpinner.start()
  } else {
    loadingSpinner.stop()
  }
  app.refresh()
})

const notificationsCheckbox = checkbox({ label: 'Notifications', checked: false })

const progressBar = progress({ value: 0, width: 30 }).showPercent(true)

const loadingSpinner = spinner().label('Loading...').start()

const menuSelect = select()
  .options([
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Settings', value: 'settings' },
    { label: 'Profile', value: 'profile' },
    { label: 'Help', value: 'help', disabled: true },
    { label: 'Exit', value: 'exit' }
  ])
  .maxVisible(5)
  .onSelect(item => {
    if (item.value === 'exit') {
      cleanup()
    } else {
      statusText.content(`Selected: ${item.label}`)
      app.refresh()
    }
  })

const statusText = text('Ready')

const helpText = text('[Tab] Navigate | [Space] Toggle | [Enter] Select | [Q] Quit')

// Build the UI layout
const root = box()
  .width('100%')
  .height('100%')
  .flexDirection('column')
  .padding(1)
  .border('rounded')
  .borderColor('#4a9eff')
  .add(
    // Header
    box().width('100%').flexDirection('column').alignItems('center').add(titleText).add(descText)
  )
  .add(
    // Main content
    box()
      .flex(1)
      .flexDirection('row')
      .gap(2)
      .padding([1, 0, 0, 0])
      .add(
        // Left panel - Form
        box()
          .width(40)
          .flexDirection('column')
          .gap(1)
          .border('single')
          .padding(1)
          .add(text('Input Demo:'))
          .add(nameInput)
          .add(greetingText)
          .add(text(''))
          .add(text('Checkboxes:'))
          .add(darkModeCheckbox)
          .add(animationsCheckbox)
          .add(notificationsCheckbox)
      )
      .add(
        // Right panel - Menu & Progress
        box()
          .flex(1)
          .flexDirection('column')
          .gap(1)
          .border('single')
          .padding(1)
          .add(text('Menu (use arrows):'))
          .add(menuSelect)
          .add(text(''))
          .add(text('Progress:'))
          .add(progressBar)
          .add(text(''))
          .add(loadingSpinner)
      )
  )
  .add(
    // Footer
    box()
      .width('100%')
      .flexDirection('column')
      .border('double')
      .padding([0, 1])
      .add(statusText)
      .add(helpText)
  )

// Cleanup function
function cleanup() {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  loadingSpinner.stop()
  app.quit()
}

// Handle quit
app.onQuit(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  console.log('Thanks for trying @oxog/tui!')
})

// Handle keyboard input
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    cleanup()
  }
})

// Mount and start the app
app.mount(root)
app.start()

// Animate progress bar
progressInterval = setInterval(() => {
  progressValue = (progressValue + 1) % 101
  progressBar.value(progressValue)
  app.refresh()
}, 100)
