/**
 * @oxog/tui - Example 07: Tabs
 *
 * Demonstrates tabbed interface.
 */

import { tui, box, text, tabs } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Tabs Example'
})

// Tab content
const homeContent = box()
  .padding(1)
  .add(text('Welcome Home!').bold().color('#00ff00'))
  .add(text(''))
  .add(text('This is the home tab content.'))
  .add(text('Navigate between tabs using ←/→ arrow keys.'))

const profileContent = box()
  .padding(1)
  .add(text('User Profile').bold().color('#00aaff'))
  .add(text(''))
  .add(text('Name: John Doe'))
  .add(text('Email: john@example.com'))
  .add(text('Role: Administrator'))

const settingsContent = box()
  .padding(1)
  .add(text('Settings').bold().color('#ffaa00'))
  .add(text(''))
  .add(text('Theme: Dark'))
  .add(text('Notifications: On'))
  .add(text('Language: English'))

const aboutContent = box()
  .padding(1)
  .add(text('About').bold().color('#ff00ff'))
  .add(text(''))
  .add(text('@oxog/tui v1.0.0'))
  .add(text('Terminal User Interface Framework'))
  .add(text('MIT License'))

// Create tabs
const mainTabs = tabs()
  .tabs([
    { label: 'Home', content: homeContent },
    { label: 'Profile', content: profileContent },
    { label: 'Settings', content: settingsContent },
    { label: 'About', content: aboutContent }
  ])
  .position('top')
  .onChange((tab, index) => {
    console.error(`Tab changed: ${tab.label} (index: ${index})`)
  })

// Track selected tab index
let tabIndex = 0
const tabCount = 4

// Layout
const root = box()
  .flexDirection('column')
  .padding(1)
  .add(text('Tabbed Interface Demo').bold())
  .add(text(''))
  .add(box().border('single').flex(1).add(mainTabs))
  .add(text(''))
  .add(text('←/→: Switch tabs  q: Quit').dim())

// Handle keys
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
  if (event.name === 'left') {
    if (tabIndex > 0) {
      tabIndex--
      mainTabs.selected(tabIndex)
      app.refresh()
    }
  }
  if (event.name === 'right') {
    if (tabIndex < tabCount - 1) {
      tabIndex++
      mainTabs.selected(tabIndex)
      app.refresh()
    }
  }
})

app.mount(root)
app.start()
