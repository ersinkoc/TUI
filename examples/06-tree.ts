/**
 * @oxog/tui - Example 06: Tree View
 *
 * Demonstrates hierarchical tree view widget.
 */

import { tui, box, text, tree } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Tree View Example'
})

// File system tree data
const fileTree = tree()
  .data([
    {
      label: 'project',
      expanded: true,
      children: [
        {
          label: 'src',
          expanded: true,
          children: [
            {
              label: 'components',
              children: [{ label: 'Button.tsx' }, { label: 'Input.tsx' }, { label: 'Modal.tsx' }]
            },
            {
              label: 'utils',
              children: [{ label: 'helpers.ts' }, { label: 'constants.ts' }]
            },
            { label: 'index.ts' },
            { label: 'App.tsx' }
          ]
        },
        {
          label: 'tests',
          children: [{ label: 'Button.test.ts' }, { label: 'Input.test.ts' }]
        },
        {
          label: 'node_modules',
          children: [{ label: '...' }]
        },
        { label: 'package.json' },
        { label: 'tsconfig.json' },
        { label: 'README.md' }
      ]
    }
  ])
  .guides(true)
  .height(20)

// Layout
const root = box()
  .flexDirection('column')
  .padding(1)
  .add(text('File Explorer').bold().color('#00ff00'))
  .add(text(''))
  .add(
    box()
      .flexDirection('row')
      .gap(2)
      .add(box().width(40).border('single').add(fileTree))
      .add(
        box()
          .flex(1)
          .padding(1)
          .add(text('Preview').bold())
          .add(text(''))
          .add(text('Select a file to preview').dim())
      )
  )
  .add(text(''))
  .add(text('Press q to quit').dim())

// Handle keys
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
})

app.mount(root)
app.start()
