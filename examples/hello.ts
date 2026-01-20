/**
 * @oxog/tui - Hello World Example
 *
 * A simple example showing basic TUI usage.
 * Run with: npx tsx examples/hello.ts
 */

import {
  box,
  text,
  checkbox,
  progress,
  spinner,
  createBuffer,
  // ANSI utilities
  cursorTo,
  fgRgb,
  bgRgb,
  allOff,
  enterAltScreen,
  exitAltScreen,
  hideCursor,
  showCursor,
  clearScreen,
  DEFAULT_FG,
  DEFAULT_BG
} from '../src'

// Create ANSI helper object for convenience
const ANSI = {
  cursorTo,
  fgRgb,
  bgRgb,
  reset: allOff,
  alternateScreen: enterAltScreen,
  mainScreen: exitAltScreen,
  cursorHide: hideCursor,
  cursorShow: showCursor,
  clearScreen
}

// ============================================================
// Simple buffer-based rendering demo
// ============================================================

function main() {
  // Enter alternate screen
  process.stdout.write(ANSI.alternateScreen())
  process.stdout.write(ANSI.cursorHide())
  process.stdout.write(ANSI.clearScreen())

  // Get terminal size
  const width = process.stdout.columns || 80
  const height = process.stdout.rows || 24

  // Create a buffer
  const buffer = createBuffer(width, height)

  // Create some widgets
  const titleBox = box().border('rounded').borderColor('#00ff00')

  const title = text('Welcome to @oxog/tui!')
  const subtitle = text('A modern terminal UI library')

  const check1 = checkbox({ label: 'Feature 1', checked: true })
  const check2 = checkbox({ label: 'Feature 2', checked: false })
  const check3 = checkbox({ label: 'Feature 3', checked: true })

  const prog = progress({ value: 75 }).showPercent(true)
  const spin = spinner().label('Processing...').start()

  // Set bounds manually for this simple example
  const centerX = Math.floor(width / 2) - 20
  const centerY = Math.floor(height / 2) - 8

  // Render title
  ;(title as any)._bounds = { x: centerX + 2, y: centerY, width: 40, height: 1 }
  title.render(buffer, { fg: 0x00ff00ff, bg: DEFAULT_BG })

  // Render subtitle
  ;(subtitle as any)._bounds = { x: centerX + 2, y: centerY + 1, width: 40, height: 1 }
  subtitle.render(buffer, { fg: 0x888888ff, bg: DEFAULT_BG })

  // Render checkboxes
  ;(check1 as any)._bounds = { x: centerX + 2, y: centerY + 3, width: 20, height: 1 }
  check1.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
  ;(check2 as any)._bounds = { x: centerX + 2, y: centerY + 4, width: 20, height: 1 }
  check2.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })
  ;(check3 as any)._bounds = { x: centerX + 2, y: centerY + 5, width: 20, height: 1 }
  check3.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

  // Render progress
  ;(prog as any)._bounds = { x: centerX + 2, y: centerY + 7, width: 30, height: 1 }
  prog.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG })

  // Render spinner
  ;(spin as any)._bounds = { x: centerX + 2, y: centerY + 9, width: 20, height: 1 }
  spin.render(buffer, { fg: 0x4a9effff, bg: DEFAULT_BG })

  // Footer text
  const footer = text('Press any key to exit...')
  ;(footer as any)._bounds = { x: centerX + 2, y: centerY + 11, width: 40, height: 1 }
  footer.render(buffer, { fg: 0x666666ff, bg: DEFAULT_BG })

  // Output buffer to terminal
  outputBuffer(buffer, width, height)

  // Animate spinner
  let frame = 0
  const spinnerInterval = setInterval(() => {
    frame++
    // Update spinner frame
    ;(spin as any).tick?.()

    // Re-render spinner area
    buffer.fill(centerX + 2, centerY + 9, 20, 1, {
      char: ' ',
      fg: DEFAULT_FG,
      bg: DEFAULT_BG,
      attrs: 0
    })
    spin.render(buffer, { fg: 0x4a9effff, bg: DEFAULT_BG })

    // Output just the spinner line
    process.stdout.write(ANSI.cursorTo(centerX + 2, centerY + 9))
    for (let x = centerX + 2; x < centerX + 22; x++) {
      const cell = buffer.get(x, centerY + 9)
      if (cell) {
        const r = (cell.fg >> 24) & 0xff
        const g = (cell.fg >> 16) & 0xff
        const b = (cell.fg >> 8) & 0xff
        process.stdout.write(ANSI.fgRgb(r, g, b) + cell.char)
      }
    }
    process.stdout.write(ANSI.reset())
  }, 100)

  // Handle exit
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.once('data', () => {
    clearInterval(spinnerInterval)
    spin.stop()
    process.stdout.write(ANSI.cursorShow())
    process.stdout.write(ANSI.mainScreen())
    console.log('Goodbye!')
    process.exit(0)
  })
}

function outputBuffer(buffer: ReturnType<typeof createBuffer>, width: number, height: number) {
  process.stdout.write(ANSI.cursorTo(0, 0))

  for (let y = 0; y < height; y++) {
    let line = ''
    let lastFg = -1
    let lastBg = -1

    for (let x = 0; x < width; x++) {
      const cell = buffer.get(x, y)
      if (!cell) continue

      // Color change?
      if (cell.fg !== lastFg) {
        const r = (cell.fg >> 24) & 0xff
        const g = (cell.fg >> 16) & 0xff
        const b = (cell.fg >> 8) & 0xff
        line += ANSI.fgRgb(r, g, b)
        lastFg = cell.fg
      }

      if (cell.bg !== lastBg && cell.bg !== DEFAULT_BG) {
        const r = (cell.bg >> 24) & 0xff
        const g = (cell.bg >> 16) & 0xff
        const b = (cell.bg >> 8) & 0xff
        line += ANSI.bgRgb(r, g, b)
        lastBg = cell.bg
      }

      line += cell.char || ' '
    }

    process.stdout.write(line + ANSI.reset() + '\n')
  }
}

main()
