/**
 * @oxog/tui - Example 02: Box Layout
 *
 * Demonstrates flexbox-like layout with boxes.
 * Shows direction, alignment, and nesting.
 */

import { tui, box, text } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Box Layout Demo'
})

// Create a header
const header = box()
  .height(3)
  .bg('#2c3e50')
  .justifyContent('center')
  .alignItems('center')
  .add(text('Box Layout Demo').color('#ffffff').bold())

// Create sidebar
const sidebar = box()
  .width(20)
  .bg('#34495e')
  .flexDirection('column')
  .padding(1)
  .add(text('Navigation').color('#ecf0f1').bold())
  .add(text('• Home').color('#bdc3c7'))
  .add(text('• About').color('#bdc3c7'))
  .add(text('• Contact').color('#bdc3c7'))
  .add(text('• Settings').color('#bdc3c7'))

// Create main content
const content = box()
  .flex(1)
  .bg('#1a1a1a')
  .flexDirection('column')
  .padding(2)
  .add(text('Main Content Area').color('#ffffff').bold())
  .add(text(''))
  .add(text('This example demonstrates:').color('#95a5a6'))
  .add(text('• Flexbox-like layout').color('#95a5a6'))
  .add(text('• Nested boxes').color('#95a5a6'))
  .add(text('• Padding and spacing').color('#95a5a6'))
  .add(text('• Background colors').color('#95a5a6'))

// Create footer
const footer = box()
  .height(1)
  .bg('#2c3e50')
  .justifyContent('center')
  .add(text('Press q to exit').color('#7f8c8d'))

// Create main layout
const mainContent = box().flex(1).flexDirection('row').add(sidebar).add(content)

// Root layout
const root = box().flexDirection('column').add(header).add(mainContent).add(footer)

// Handle quit
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
})

app.mount(root)
app.start()
