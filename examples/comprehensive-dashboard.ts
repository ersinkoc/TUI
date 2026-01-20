/**
 * @oxog/tui - Comprehensive Dashboard Example
 *
 * This example demonstrates a real-world dashboard with multiple widgets:
 * - System stats with progress bars
 * - Activity log with text
 * - Menu selection
 * - Real-time updates
 *
 * Run with: npx tsx examples/comprehensive-dashboard.ts
 */

import {
  box,
  text,
  progress,
  spinner,
  select,
  table,
  createBuffer,
  fgRgb,
  bgRgb,
  boldOn,
  allOff,
  DEFAULT_FG,
  DEFAULT_BG
} from '../src'

// ANSI helpers
const ANSI = {
  fgRgb,
  bgRgb,
  bold: boldOn,
  reset: allOff
}

console.log()
console.log(
  ANSI.bold() +
    ANSI.fgRgb(74, 158, 255) +
    '╔══════════════════════════════════════════════════════════════╗' +
    ANSI.reset()
)
console.log(
  ANSI.bold() +
    ANSI.fgRgb(74, 158, 255) +
    '║' +
    ANSI.reset() +
    '  ' +
    ANSI.bold() +
    '@oxog/tui' +
    ANSI.reset() +
    ' - Comprehensive Dashboard Example           ' +
    ANSI.bold() +
    ANSI.fgRgb(74, 158, 255) +
    '║' +
    ANSI.reset()
)
console.log(
  ANSI.bold() +
    ANSI.fgRgb(74, 158, 255) +
    '╚══════════════════════════════════════════════════════════════╝' +
    ANSI.reset()
)
console.log()

// ============================================================
// 1. System Stats Panel
// ============================================================
console.log(ANSI.fgRgb(255, 200, 0) + '▸ System Stats Panel' + ANSI.reset())
console.log()

const buffer1 = createBuffer(60, 8)

// Create progress bars for system stats
const cpuProgress = progress({ value: 67 })
  .showPercent(true)
  .filled('█')
  .empty('░')
  .filledColor('#ff6b6b')
const memProgress = progress({ value: 45 })
  .showPercent(true)
  .filled('█')
  .empty('░')
  .filledColor('#4ecdc4')
const diskProgress = progress({ value: 82 })
  .showPercent(true)
  .filled('█')
  .empty('░')
  .filledColor('#ffe66d')

// Labels
const cpuLabel = text('CPU Usage')
const memLabel = text('Memory')
const diskLabel = text('Disk')

// Set bounds and render
;(cpuLabel as any)._bounds = { x: 2, y: 1, width: 15, height: 1 }
cpuLabel.render(buffer1, { fg: 0xaaaaaaff, bg: DEFAULT_BG, attrs: 0 })
;(cpuProgress as any)._bounds = { x: 15, y: 1, width: 40, height: 1 }
cpuProgress.render(buffer1, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
;(memLabel as any)._bounds = { x: 2, y: 3, width: 15, height: 1 }
memLabel.render(buffer1, { fg: 0xaaaaaaff, bg: DEFAULT_BG, attrs: 0 })
;(memProgress as any)._bounds = { x: 15, y: 3, width: 40, height: 1 }
memProgress.render(buffer1, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
;(diskLabel as any)._bounds = { x: 2, y: 5, width: 15, height: 1 }
diskLabel.render(buffer1, { fg: 0xaaaaaaff, bg: DEFAULT_BG, attrs: 0 })
;(diskProgress as any)._bounds = { x: 15, y: 5, width: 40, height: 1 }
diskProgress.render(buffer1, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

// Draw border
const borderH = '─'
const borderV = '│'
const corners = { tl: '┌', tr: '┐', bl: '└', br: '┘' }

buffer1.set(0, 0, { char: corners.tl, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
buffer1.set(59, 0, { char: corners.tr, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
buffer1.set(0, 7, { char: corners.bl, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
buffer1.set(59, 7, { char: corners.br, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })

for (let x = 1; x < 59; x++) {
  buffer1.set(x, 0, { char: borderH, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
  buffer1.set(x, 7, { char: borderH, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
}

for (let y = 1; y < 7; y++) {
  buffer1.set(0, y, { char: borderV, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
  buffer1.set(59, y, { char: borderV, fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })
}

// Output buffer
for (let y = 0; y < buffer1.height; y++) {
  process.stdout.write('  ')
  for (let x = 0; x < buffer1.width; x++) {
    const cell = buffer1.get(x, y)
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

// ============================================================
// 2. Activity Monitor with Spinner
// ============================================================
console.log(ANSI.fgRgb(255, 200, 0) + '▸ Activity Monitor' + ANSI.reset())
console.log()

const buffer2 = createBuffer(60, 6)

// Spinner frame styles
const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  arc: ['◜', '◠', '◝', '◞']
}

const activitySpinner = spinner().label('Processing requests...').frames(SPINNER_FRAMES.dots)
const taskSpinner = spinner().label('Syncing data...').frames(SPINNER_FRAMES.line)
const uploadSpinner = spinner().label('Uploading files...').frames(SPINNER_FRAMES.arc)

activitySpinner.start()
taskSpinner.start()
uploadSpinner.start()
;(activitySpinner as any)._bounds = { x: 2, y: 1, width: 55, height: 1 }
activitySpinner.render(buffer2, { fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
;(taskSpinner as any)._bounds = { x: 2, y: 2, width: 55, height: 1 }
taskSpinner.render(buffer2, { fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
;(uploadSpinner as any)._bounds = { x: 2, y: 3, width: 55, height: 1 }
uploadSpinner.render(buffer2, { fg: 0x4a9effff, bg: DEFAULT_BG, attrs: 0 })

activitySpinner.stop()
taskSpinner.stop()
uploadSpinner.stop()

// Status text
const statusText = text('Status: All systems operational')
;(statusText as any)._bounds = { x: 2, y: 4, width: 55, height: 1 }
statusText.render(buffer2, { fg: 0x00ff00ff, bg: DEFAULT_BG, attrs: 0 })

// Draw border
buffer2.set(0, 0, { char: corners.tl, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
buffer2.set(59, 0, { char: corners.tr, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
buffer2.set(0, 5, { char: corners.bl, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
buffer2.set(59, 5, { char: corners.br, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })

for (let x = 1; x < 59; x++) {
  buffer2.set(x, 0, { char: borderH, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
  buffer2.set(x, 5, { char: borderH, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
}

for (let y = 1; y < 5; y++) {
  buffer2.set(0, y, { char: borderV, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
  buffer2.set(59, y, { char: borderV, fg: 0x00ff88ff, bg: DEFAULT_BG, attrs: 0 })
}

// Output buffer
for (let y = 0; y < buffer2.height; y++) {
  process.stdout.write('  ')
  for (let x = 0; x < buffer2.width; x++) {
    const cell = buffer2.get(x, y)
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

// ============================================================
// 3. Navigation Menu
// ============================================================
console.log(ANSI.fgRgb(255, 200, 0) + '▸ Navigation Menu' + ANSI.reset())
console.log()

const buffer3 = createBuffer(40, 9)

const navSelect = select()
  .options([
    { label: '📊 Dashboard', value: 'dashboard' },
    { label: '📈 Analytics', value: 'analytics' },
    { label: '👥 Users', value: 'users' },
    { label: '⚙️ Settings', value: 'settings' },
    { label: '📝 Logs', value: 'logs' },
    { label: '🚪 Logout', value: 'logout' }
  ])
  .maxVisible(6)

navSelect.focus()
;(navSelect as any)._bounds = { x: 2, y: 1, width: 35, height: 7 }
navSelect.render(buffer3, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

// Draw border
buffer3.set(0, 0, { char: corners.tl, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
buffer3.set(39, 0, { char: corners.tr, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
buffer3.set(0, 8, { char: corners.bl, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
buffer3.set(39, 8, { char: corners.br, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })

for (let x = 1; x < 39; x++) {
  buffer3.set(x, 0, { char: borderH, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
  buffer3.set(x, 8, { char: borderH, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
}

for (let y = 1; y < 8; y++) {
  buffer3.set(0, y, { char: borderV, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
  buffer3.set(39, y, { char: borderV, fg: 0xffaa00ff, bg: DEFAULT_BG, attrs: 0 })
}

// Output buffer
for (let y = 0; y < buffer3.height; y++) {
  process.stdout.write('  ')
  for (let x = 0; x < buffer3.width; x++) {
    const cell = buffer3.get(x, y)
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

// ============================================================
// 4. Data Table
// ============================================================
console.log(ANSI.fgRgb(255, 200, 0) + '▸ Data Table' + ANSI.reset())
console.log()

const buffer4 = createBuffer(70, 10)

const dataTable = table()
  .columns([
    { key: 'id', header: 'ID', width: 6 },
    { key: 'name', header: 'Name', width: 20 },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'progress', header: 'Progress', width: 12 }
  ])
  .data([
    { id: '001', name: 'Build Pipeline', status: 'Running', progress: '78%' },
    { id: '002', name: 'Test Suite', status: 'Passed', progress: '100%' },
    { id: '003', name: 'Deployment', status: 'Pending', progress: '0%' },
    { id: '004', name: 'Monitoring', status: 'Active', progress: '95%' },
    { id: '005', name: 'Backup', status: 'Completed', progress: '100%' }
  ])

;(dataTable as any)._bounds = { x: 1, y: 1, width: 68, height: 8 }
dataTable.render(buffer4, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

// Draw border
buffer4.set(0, 0, { char: corners.tl, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
buffer4.set(69, 0, { char: corners.tr, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
buffer4.set(0, 9, { char: corners.bl, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
buffer4.set(69, 9, { char: corners.br, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })

for (let x = 1; x < 69; x++) {
  buffer4.set(x, 0, { char: borderH, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
  buffer4.set(x, 9, { char: borderH, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
}

for (let y = 1; y < 9; y++) {
  buffer4.set(0, y, { char: borderV, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
  buffer4.set(69, y, { char: borderV, fg: 0xff6b6bff, bg: DEFAULT_BG, attrs: 0 })
}

// Output buffer
for (let y = 0; y < buffer4.height; y++) {
  process.stdout.write('  ')
  for (let x = 0; x < buffer4.width; x++) {
    const cell = buffer4.get(x, y)
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

// ============================================================
// Summary
// ============================================================
console.log(ANSI.bold() + ANSI.fgRgb(74, 158, 255) + '═'.repeat(64) + ANSI.reset())
console.log()
console.log(
  '  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' All widgets rendered successfully!'
)
console.log(
  '  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' Progress bars with custom colors'
)
console.log('  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' Multiple spinner styles')
console.log('  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' Select menu with emoji support')
console.log('  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' Data table with columns')
console.log('  ' + ANSI.fgRgb(0, 255, 136) + '✓' + ANSI.reset() + ' Unicode box drawing characters')
console.log()
console.log(ANSI.bold() + ANSI.fgRgb(74, 158, 255) + '═'.repeat(64) + ANSI.reset())
console.log()
