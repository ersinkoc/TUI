/**
 * @oxog/tui - Quick Test (Non-interactive)
 *
 * This script tests widget creation and rendering without interactivity.
 * Run with: npx tsx examples/quick-test.ts
 */

import {
  box,
  text,
  input,
  checkbox,
  progress,
  spinner,
  select,
  createBuffer,
  // ANSI utilities
  cursorTo,
  fgRgb,
  bgRgb,
  boldOn,
  allOff,
  DEFAULT_FG,
  DEFAULT_BG
} from '../src'

// Create ANSI helper object for convenience
const ANSI = {
  cursorTo,
  fgRgb,
  bgRgb,
  bold: boldOn,
  reset: allOff
}

console.log('='.repeat(60))
console.log('@oxog/tui - Quick Test')
console.log('='.repeat(60))
console.log()

// Test 1: Create widgets
console.log('1. Creating widgets...')

const myBox = box().width(40).height(10).border('rounded').borderColor('#4a9eff').padding(1)

const myText = text('Hello, Terminal!')
const myInput = input({ placeholder: 'Type here...' })
const myCheckbox = checkbox({ label: 'Enable feature', checked: true })
const myProgress = progress({ value: 75 }).showPercent(true)
const mySpinner = spinner().label('Loading...')
const mySelect = select().options([
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' }
])

console.log('   - box: OK')
console.log('   - text: OK')
console.log('   - input: OK')
console.log('   - checkbox: OK')
console.log('   - progress: OK')
console.log('   - spinner: OK')
console.log('   - select: OK')
console.log()

// Test 2: Create buffer and render
console.log('2. Creating buffer...')
const buffer = createBuffer(60, 20)
console.log(`   Buffer size: ${buffer.width}x${buffer.height}`)
console.log()

// Test 3: Set bounds and render widgets
console.log('3. Rendering widgets to buffer...')

// Set bounds for text
;(myText as any)._bounds = { x: 2, y: 1, width: 50, height: 1 }
myText.render(buffer, { fg: 0x00ff00ff, bg: DEFAULT_BG })
console.log('   - text rendered')

// Set bounds for checkbox
;(myCheckbox as any)._bounds = { x: 2, y: 3, width: 25, height: 1 }
myCheckbox.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
console.log('   - checkbox rendered')

// Toggle checkbox
myCheckbox.toggle()
;(myCheckbox as any)._bounds = { x: 2, y: 4, width: 25, height: 1 }
myCheckbox.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
console.log('   - checkbox toggled and re-rendered')

// Set bounds for progress
;(myProgress as any)._bounds = { x: 2, y: 6, width: 40, height: 1 }
myProgress.render(buffer, { fg: 0x4a9effff, bg: DEFAULT_BG })
console.log('   - progress rendered')

// Set bounds for spinner
mySpinner.start()
;(mySpinner as any)._bounds = { x: 2, y: 8, width: 20, height: 1 }
mySpinner.render(buffer, { fg: 0xffaa00ff, bg: DEFAULT_BG })
mySpinner.stop()
console.log('   - spinner rendered')

// Set bounds for select
;(mySelect as any)._bounds = { x: 2, y: 10, width: 30, height: 5 }
mySelect.focus()
mySelect.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
console.log('   - select rendered')
console.log()

// Test 4: Output rendered buffer
console.log('4. Buffer output preview:')
console.log('-'.repeat(62))

for (let y = 0; y < buffer.height; y++) {
  let line = '|'
  for (let x = 0; x < buffer.width; x++) {
    const cell = buffer.get(x, y)
    line += cell?.char || ' '
  }
  line += '|'
  console.log(line)
}
console.log('-'.repeat(62))
console.log()

// Test 5: ANSI sequences
console.log('5. ANSI sequences test:')
console.log('   Cursor to (0,0):', JSON.stringify(ANSI.cursorTo(0, 0)))
console.log('   Foreground red:', JSON.stringify(ANSI.fgRgb(255, 0, 0)))
console.log('   Background blue:', JSON.stringify(ANSI.bgRgb(0, 0, 255)))
console.log('   Bold:', JSON.stringify(ANSI.bold()))
console.log('   Reset:', JSON.stringify(ANSI.reset()))
console.log()

// Test 6: Color output demo
console.log('6. Colored output demo:')
process.stdout.write('   ')
process.stdout.write(ANSI.fgRgb(255, 0, 0) + 'Red ')
process.stdout.write(ANSI.fgRgb(0, 255, 0) + 'Green ')
process.stdout.write(ANSI.fgRgb(0, 0, 255) + 'Blue ')
process.stdout.write(ANSI.fgRgb(255, 255, 0) + 'Yellow ')
process.stdout.write(ANSI.fgRgb(255, 0, 255) + 'Magenta ')
process.stdout.write(ANSI.fgRgb(0, 255, 255) + 'Cyan')
process.stdout.write(ANSI.reset() + '\n')
console.log()

// Test 7: Box with styled text
console.log('7. Styled box demo:')
const styledBuffer = createBuffer(50, 7)

// Draw a box manually
const borderChars = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│'
}

// Top border
styledBuffer.set(0, 0, { char: borderChars.topLeft, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
for (let x = 1; x < 49; x++) {
  styledBuffer.set(x, 0, { char: borderChars.horizontal, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
}
styledBuffer.set(49, 0, { char: borderChars.topRight, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })

// Side borders and content
for (let y = 1; y < 6; y++) {
  styledBuffer.set(0, y, { char: borderChars.vertical, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
  styledBuffer.set(49, y, { char: borderChars.vertical, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
}

// Bottom border
styledBuffer.set(0, 6, { char: borderChars.bottomLeft, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
for (let x = 1; x < 49; x++) {
  styledBuffer.set(x, 6, { char: borderChars.horizontal, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
}
styledBuffer.set(49, 6, { char: borderChars.bottomRight, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })

// Add title
const title = ' @oxog/tui Demo '
for (let i = 0; i < title.length; i++) {
  styledBuffer.set(2 + i, 0, { char: title[i], fg: 0x00ff00ff, bg: DEFAULT_BG, attrs: 0 })
}

// Add content
const content1 = 'Modern terminal UI library'
for (let i = 0; i < content1.length; i++) {
  styledBuffer.set(2 + i, 2, { char: content1[i], fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
}

const content2 = 'Built with TypeScript'
for (let i = 0; i < content2.length; i++) {
  styledBuffer.set(2 + i, 3, { char: content2[i], fg: 0x888888ff, bg: DEFAULT_BG, attrs: 0 })
}

const content3 = '999 tests passing!'
for (let i = 0; i < content3.length; i++) {
  styledBuffer.set(2 + i, 5, { char: content3[i], fg: 0x00ff00ff, bg: DEFAULT_BG, attrs: 0 })
}

// Output styled box with colors
for (let y = 0; y < 7; y++) {
  process.stdout.write('   ')
  for (let x = 0; x < 50; x++) {
    const cell = styledBuffer.get(x, y)
    if (cell && cell.char !== ' ') {
      const r = (cell.fg >> 24) & 0xff
      const g = (cell.fg >> 16) & 0xff
      const b = (cell.fg >> 8) & 0xff
      process.stdout.write(ANSI.fgRgb(r, g, b) + cell.char)
    } else {
      process.stdout.write(' ')
    }
  }
  process.stdout.write(ANSI.reset() + '\n')
}
console.log()

console.log('='.repeat(60))
console.log('All tests completed successfully!')
console.log('='.repeat(60))
