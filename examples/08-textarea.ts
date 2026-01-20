/**
 * @oxog/tui - Example 08: Textarea
 *
 * Demonstrates multi-line text input.
 */

import { tui, box, text, textarea } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Textarea Example'
})

// Create textarea
const editor = textarea()
  .placeholder('Start typing your notes here...')
  .height(15)
  .onChange(value => {
    const lines = value.split('\n').length
    const chars = value.length
    lineCount.content(`Lines: ${lines}`)
    charCount.content(`Characters: ${chars}`)
    app.refresh()
  })

// Status indicators
const lineCount = text('Lines: 0').color('#888888')
const charCount = text('Characters: 0').color('#888888')

// Layout
const root = box()
  .flexDirection('column')
  .padding(1)
  .add(text('Text Editor').bold().color('#00ff00'))
  .add(text(''))
  .add(box().border('single').flex(1).add(editor))
  .add(text(''))
  .add(box().flexDirection('row').justifyContent('between').add(lineCount).add(charCount))
  .add(text(''))
  .add(text('Type to edit  Ctrl+S: Save (simulated)  q: Quit').dim())

// Handle keys
app.on('key', event => {
  if (event.name === 'q' && !editor.isFocused) {
    app.quit()
  }
  if (event.ctrl && event.name === 'c') {
    app.quit()
  }
  if (event.ctrl && event.name === 's') {
    console.error('Saved:', editor.currentValue)
  }
})

// Focus the editor on start
editor.focus()

app.mount(root)
app.start()
