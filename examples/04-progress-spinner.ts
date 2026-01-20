/**
 * @oxog/tui - Example 04: Progress and Spinner
 *
 * Demonstrates progress bars and loading spinners.
 */

import { tui, box, text, progress, spinner } from '../src'
import { standardPlugins, animationPlugin } from '../src/plugins'

const app = tui({
  plugins: [...standardPlugins(), animationPlugin()],
  title: 'Progress Demo'
})

// Progress bars
const downloadProgress = progress()
  .width(40)
  .value(0)
  .showPercent(true)
  .filled('█')
  .empty('░')
  .filledColor('#00ff00')

const uploadProgress = progress()
  .width(40)
  .value(0)
  .showPercent(true)
  .filled('▓')
  .empty('░')
  .filledColor('#00aaff')

const cpuProgress = progress().width(40).value(35).showPercent(true).filledColor('#ffaa00')

// Spinners (using default frames)
const loadingSpinner = spinner().label('Loading...').color('#ff00ff')

const processingSpinner = spinner()
  .frames(['-', '\\', '|', '/'])
  .label('Processing...')
  .color('#00ffff')

// Layout
const root = box()
  .flexDirection('column')
  .padding(2)
  .gap(1)
  .add(text('Progress and Spinner Demo').bold().color('#ffffff'))
  .add(text(''))
  .add(text('Download Progress:').color('#888888'))
  .add(downloadProgress)
  .add(text(''))
  .add(text('Upload Progress:').color('#888888'))
  .add(uploadProgress)
  .add(text(''))
  .add(text('CPU Usage:').color('#888888'))
  .add(cpuProgress)
  .add(text(''))
  .add(box().flexDirection('row').gap(4).add(loadingSpinner).add(processingSpinner))
  .add(text(''))
  .add(text('Press q to exit').dim())

// Animate progress
let downloadValue = 0
let uploadValue = 0

const interval = setInterval(() => {
  downloadValue = Math.min(100, downloadValue + Math.random() * 5)
  uploadValue = Math.min(100, uploadValue + Math.random() * 3)

  downloadProgress.value(downloadValue)
  uploadProgress.value(uploadValue)

  // Simulate CPU fluctuation
  cpuProgress.value(30 + Math.random() * 40)

  app.refresh()

  if (downloadValue >= 100 && uploadValue >= 100) {
    clearInterval(interval)
  }
}, 100)

// Handle keys
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    clearInterval(interval)
    app.quit()
  }
})

app.onQuit(() => {
  clearInterval(interval)
})

app.mount(root)
app.start()
