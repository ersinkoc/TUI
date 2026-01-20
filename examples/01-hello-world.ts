/**
 * @oxog/tui - Example 01: Hello World
 *
 * The simplest possible TUI application.
 * Demonstrates basic setup and text rendering.
 */

import { tui, box, text } from '../src'
import { standardPlugins } from '../src/plugins'

// Create the application with standard plugins
const app = tui({
  plugins: standardPlugins(),
  title: 'Hello World'
})

// Build the UI
const root = box({ flexDirection: 'column' })
  .justifyContent('center')
  .alignItems('center')
  .add(text('Hello, World!').color('#00ff00').bold())
  .add(text('Press q or Ctrl+C to exit').dim())

// Set up key bindings
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
})

// Mount and start
app.mount(root)
app.start()

console.log('Hello World example started. Press q to exit.')
