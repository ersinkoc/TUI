/**
 * @oxog/tui - Example 09: Theming
 *
 * Demonstrates theme switching and custom themes.
 */

import { tui, box, text, select } from '../src'
import {
  standardPlugins,
  stylePlugin,
  darkTheme,
  lightTheme,
  draculaTheme,
  nordTheme
} from '../src/plugins'
import type { TUIApp } from '../src'

// Available themes
const themes = {
  dark: darkTheme,
  light: lightTheme,
  dracula: draculaTheme,
  nord: nordTheme
}

let app: TUIApp

// Create theme selector
const themeSelector = select()
  .options([
    { label: 'Dark Theme', value: 'dark' },
    { label: 'Light Theme', value: 'light' },
    { label: 'Dracula Theme', value: 'dracula' },
    { label: 'Nord Theme', value: 'nord' }
  ])
  .height(6)
  .onChange(item => {
    if (item && themes[item.value as keyof typeof themes]) {
      const styleAPI = (app as unknown as { style: { setTheme: (theme: unknown) => void } }).style
      if (styleAPI) {
        styleAPI.setTheme(themes[item.value as keyof typeof themes])
        app.refresh()
      }
    }
  })

// Sample UI to show theming
const sampleUI = box()
  .flexDirection('column')
  .padding(1)
  .border('single')
  .add(text('Sample UI Preview').bold())
  .add(text(''))
  .add(text('Primary text color').color('primary'))
  .add(text('Secondary text color').color('secondary'))
  .add(text('Accent text color').color('accent'))
  .add(text('Muted text color').color('muted'))
  .add(text('Error text color').color('error'))
  .add(text('Warning text color').color('warning'))
  .add(text('Success text color').color('success'))
  .add(text('Info text color').color('info'))

// Layout
const root = box()
  .flexDirection('column')
  .padding(1)
  .add(text('Theme Switcher').bold().color('#00ff00'))
  .add(text(''))
  .add(
    box()
      .flexDirection('row')
      .gap(2)
      .add(box().width(25).flexDirection('column').add(text('Select Theme:')).add(themeSelector))
      .add(box().flex(1).add(sampleUI))
  )
  .add(text(''))
  .add(text('↑/↓: Navigate themes  Enter: Apply  q: Quit').dim())

// Track selected theme index
let themeIndex = 0
const themeCount = 4

// Handle keys
function handleKey(event: { name: string; ctrl: boolean }) {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
  if (event.name === 'up') {
    if (themeIndex > 0) {
      themeIndex--
      themeSelector.selected(themeIndex)
      app.refresh()
    }
  }
  if (event.name === 'down') {
    if (themeIndex < themeCount - 1) {
      themeIndex++
      themeSelector.selected(themeIndex)
      app.refresh()
    }
  }
}

// Create app with default dark theme
app = tui({
  plugins: [
    ...standardPlugins().filter(p => p.name !== 'style'),
    stylePlugin({ theme: darkTheme })
  ],
  title: 'Theming Demo'
})

app.on('key', handleKey)
app.mount(root)
app.start()
