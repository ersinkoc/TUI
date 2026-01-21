/**
 * @oxog/tui - Differential Renderer
 * @packageDocumentation
 */

import type { Buffer, Cell, Renderer } from '../types'
import { cellsEqual } from './buffer'
import { packedToFgAnsi, packedToBgAnsi, attrsToAnsi, cursorTo, reset } from '../utils/ansi'

// ============================================================
// Synchronized Output (Flicker-free rendering)
// ============================================================

/**
 * Terminal synchronization mode sequences.
 * Uses DEC private mode 2026 for synchronized output.
 * This allows the terminal to buffer all output until we signal completion,
 * eliminating visual flicker during rapid updates.
 *
 * @see https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036
 */
const SYNC_START = '\x1b[?2026h'  // Begin synchronized update
const SYNC_END = '\x1b[?2026l'    // End synchronized update

/**
 * Check if the terminal likely supports synchronized output.
 * Most modern terminals (kitty, iTerm2, WezTerm, Windows Terminal) support this.
 */
export function terminalSupportsSyncOutput(): boolean {
  const term = process.env.TERM || ''
  const termProgram = process.env.TERM_PROGRAM || ''
  const wtSession = process.env.WT_SESSION // Windows Terminal

  // Known supporting terminals
  const supportingTerms = ['xterm-kitty', 'xterm-256color', 'screen-256color']
  const supportingPrograms = ['iTerm.app', 'WezTerm', 'vscode', 'Hyper']

  return (
    supportingTerms.some(t => term.includes(t)) ||
    supportingPrograms.some(p => termProgram.includes(p)) ||
    !!wtSession ||
    term.includes('256color')
  )
}

// ============================================================
// Renderer Implementation
// ============================================================

/**
 * Renderer options.
 */
export interface RendererOptions {
  /** Enable synchronized output for flicker-free rendering */
  syncOutput?: boolean
}

/**
 * Create a differential renderer.
 *
 * @param stdout - Output stream
 * @param options - Renderer options
 * @returns Renderer instance
 *
 * @example
 * ```typescript
 * const renderer = createRenderer(process.stdout, { syncOutput: true })
 * renderer.render(buffer)
 * ```
 */
export function createRenderer(stdout: NodeJS.WriteStream, options: RendererOptions = {}): Renderer {
  // Double buffering: pre-allocated snapshot to avoid GC pressure
  // Instead of cloning the entire buffer every frame, we maintain a flat array
  // and only copy cell values, reusing existing objects when possible
  let snapshotCells: Cell[] | null = null
  let snapshotWidth = 0
  let snapshotHeight = 0
  let forceRedraw = true
  const useSyncOutput = options.syncOutput ?? terminalSupportsSyncOutput()

  /**
   * Take a snapshot of the current buffer for next-frame diffing.
   * Reuses existing cell objects to minimize allocations.
   */
  function snapshotBuffer(buffer: Buffer): void {
    const w = buffer.width
    const h = buffer.height

    // Validate dimensions to prevent memory issues
    if (w <= 0 || h <= 0 || w > 10000 || h > 10000) {
      return
    }

    const size = w * h

    // Reallocate only if dimensions changed
    if (snapshotWidth !== w || snapshotHeight !== h || snapshotCells === null) {
      snapshotCells = new Array(size)
      for (let i = 0; i < size; i++) {
        snapshotCells[i] = { char: ' ', fg: 0, bg: 0, attrs: 0 }
      }
      snapshotWidth = w
      snapshotHeight = h
    }

    // Copy cell data in-place (reuse existing objects)
    const cells = buffer.cells
    for (let i = 0; i < size; i++) {
      const src = cells[i]
      const dst = snapshotCells[i]!
      if (src) {
        dst.char = src.char
        dst.fg = src.fg
        dst.bg = src.bg
        dst.attrs = src.attrs
      } else {
        // Reset to empty if source is null/undefined
        dst.char = ' '
        dst.fg = 0
        dst.bg = 0
        dst.attrs = 0
      }
    }
  }

  /**
   * Get cell from snapshot at position.
   */
  function getSnapshotCell(x: number, y: number): Cell | null {
    if (!snapshotCells || x < 0 || x >= snapshotWidth || y < 0 || y >= snapshotHeight) {
      return null
    }
    return snapshotCells[y * snapshotWidth + x] ?? null
  }

  return {
    render(buffer: Buffer): number {
      let cellsUpdated = 0
      const output: string[] = []

      // Start synchronized output
      if (useSyncOutput) {
        output.push(SYNC_START)
      }

      let lastX = -1
      let lastY = -1
      let lastFg = -1
      let lastBg = -1
      let lastAttrs = -1

      for (let y = 0; y < buffer.height; y++) {
        for (let x = 0; x < buffer.width; x++) {
          const cell = buffer.get(x, y)
          /* c8 ignore next */
          if (!cell) continue

          // Skip empty cells (wide char continuation)
          /* c8 ignore next */
          if (cell.char === '') continue

          const prevCell = forceRedraw ? null : getSnapshotCell(x, y)

          // Skip if unchanged
          if (prevCell && cellsEqual(cell, prevCell)) {
            continue
          }

          cellsUpdated++

          // Move cursor if not sequential
          if (x !== lastX + 1 || y !== lastY) {
            output.push(cursorTo(x, y))
          }

          // Update colors if changed
          if (cell.fg !== lastFg) {
            output.push(packedToFgAnsi(cell.fg))
            lastFg = cell.fg
          }

          if (cell.bg !== lastBg) {
            output.push(packedToBgAnsi(cell.bg))
            lastBg = cell.bg
          }

          // Update attributes if changed
          if (cell.attrs !== lastAttrs) {
            // Reset first if going from styled to unstyled
            if (lastAttrs !== 0 && cell.attrs === 0) {
              output.push(reset())
              // Need to re-apply colors after reset
              output.push(packedToFgAnsi(cell.fg))
              output.push(packedToBgAnsi(cell.bg))
            } else {
              const attrSeq = attrsToAnsi(cell.attrs)
              if (attrSeq) {
                output.push(attrSeq)
              }
            }
            lastAttrs = cell.attrs
          }

          output.push(cell.char)
          lastX = x
          lastY = y
        }
      }

      // Reset attributes at end
      if (output.length > 0 || useSyncOutput) {
        output.push(reset())
      }

      // End synchronized output
      if (useSyncOutput) {
        output.push(SYNC_END)
      }

      // Write to stdout
      if (output.length > 0) {
        stdout.write(output.join(''))
      }

      // Snapshot buffer for next frame comparison (in-place, no allocation)
      snapshotBuffer(buffer)
      forceRedraw = false

      return cellsUpdated
    },

    invalidate(): void {
      forceRedraw = true
    },

    get lastBuffer(): Buffer | null {
      // For API compatibility, return null - snapshot is internal
      // External code should not rely on lastBuffer for anything other than testing
      return null
    }
  }
}

/**
 * Create a batched renderer for improved performance.
 * Groups consecutive changes to minimize cursor movements.
 *
 * @param stdout - Output stream
 * @param options - Renderer options
 * @returns Renderer instance
 */
export function createBatchedRenderer(stdout: NodeJS.WriteStream, options: RendererOptions = {}): Renderer {
  // Double buffering with pre-allocated snapshot
  let snapshotCells: Cell[] | null = null
  let snapshotWidth = 0
  let snapshotHeight = 0
  let forceRedraw = true
  const useSyncOutput = options.syncOutput ?? terminalSupportsSyncOutput()

  function snapshotBuffer(buffer: Buffer): void {
    const w = buffer.width
    const h = buffer.height

    // Validate dimensions to prevent memory issues
    if (w <= 0 || h <= 0 || w > 10000 || h > 10000) {
      return
    }

    const size = w * h

    if (snapshotWidth !== w || snapshotHeight !== h || snapshotCells === null) {
      snapshotCells = new Array(size)
      for (let i = 0; i < size; i++) {
        snapshotCells[i] = { char: ' ', fg: 0, bg: 0, attrs: 0 }
      }
      snapshotWidth = w
      snapshotHeight = h
    }

    const cells = buffer.cells
    for (let i = 0; i < size; i++) {
      const src = cells[i]
      const dst = snapshotCells[i]!
      if (src) {
        dst.char = src.char
        dst.fg = src.fg
        dst.bg = src.bg
        dst.attrs = src.attrs
      } else {
        // Reset to empty if source is null/undefined
        dst.char = ' '
        dst.fg = 0
        dst.bg = 0
        dst.attrs = 0
      }
    }
  }

  function getSnapshotCell(x: number, y: number): Cell | null {
    if (!snapshotCells || x < 0 || x >= snapshotWidth || y < 0 || y >= snapshotHeight) {
      return null
    }
    return snapshotCells[y * snapshotWidth + x] ?? null
  }

  return {
    render(buffer: Buffer): number {
      // Collect all changes
      const changes: CellChange[] = []

      for (let y = 0; y < buffer.height; y++) {
        for (let x = 0; x < buffer.width; x++) {
          const cell = buffer.get(x, y)
          /* c8 ignore next */
          if (!cell || cell.char === '') continue

          const prevCell = forceRedraw ? null : getSnapshotCell(x, y)

          if (!prevCell || !cellsEqual(cell, prevCell)) {
            changes.push({ x, y, cell })
          }
        }
      }

      if (changes.length === 0) {
        return 0
      }

      // Sort by position for optimal cursor movement
      changes.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })

      // Render changes
      const output: string[] = []

      // Start synchronized output
      if (useSyncOutput) {
        output.push(SYNC_START)
      }

      let currentFg = -1
      let currentBg = -1
      let currentAttrs = -1
      let cursorX = -1
      let cursorY = -1

      for (const change of changes) {
        const { x, y, cell } = change

        // Move cursor if needed
        if (x !== cursorX + 1 || y !== cursorY) {
          output.push(cursorTo(x, y))
        }

        // Update style if changed
        if (cell.fg !== currentFg) {
          output.push(packedToFgAnsi(cell.fg))
          currentFg = cell.fg
        }

        if (cell.bg !== currentBg) {
          output.push(packedToBgAnsi(cell.bg))
          currentBg = cell.bg
        }

        if (cell.attrs !== currentAttrs) {
          if (currentAttrs !== 0 && cell.attrs === 0) {
            output.push(reset())
            output.push(packedToFgAnsi(cell.fg))
            output.push(packedToBgAnsi(cell.bg))
          } else {
            const attrSeq = attrsToAnsi(cell.attrs)
            if (attrSeq) output.push(attrSeq)
          }
          currentAttrs = cell.attrs
        }

        output.push(cell.char)
        cursorX = x
        cursorY = y
      }

      // Reset attributes
      output.push(reset())

      // End synchronized output
      if (useSyncOutput) {
        output.push(SYNC_END)
      }

      // Flush to stdout
      stdout.write(output.join(''))

      // Snapshot buffer for next frame (in-place, no allocation)
      snapshotBuffer(buffer)
      forceRedraw = false

      return changes.length
    },

    invalidate(): void {
      forceRedraw = true
    },

    get lastBuffer(): Buffer | null {
      return null
    }
  }
}

interface CellChange {
  x: number
  y: number
  cell: Cell
}

/**
 * Create a string renderer (for testing).
 * Returns rendered output as string instead of writing to stream.
 *
 * @param width - Buffer width
 * @param height - Buffer height
 * @returns Renderer instance with getString method
 */
export function createStringRenderer(
  _width: number,
  _height: number
): Renderer & { getString(): string } {
  let output = ''

  return {
    render(buffer: Buffer): number {
      const lines: string[] = []

      for (let y = 0; y < buffer.height; y++) {
        let line = ''
        for (let x = 0; x < buffer.width; x++) {
          const cell = buffer.get(x, y)
          if (cell && cell.char !== '') {
            line += cell.char
          }
        }
        lines.push(line.trimEnd())
      }

      output = lines.join('\n')
      return buffer.width * buffer.height
    },

    invalidate(): void {
      output = ''
    },

    get lastBuffer(): Buffer | null {
      // String renderer doesn't track previous buffer
      return null
    },

    getString(): string {
      return output
    }
  }
}

// ============================================================
// Render Loop
// ============================================================

/**
 * Render loop interface.
 */
export interface RenderLoop {
  start(): void
  stop(): void
  requestRender(): void
  readonly isRunning: boolean
}

/**
 * Create a render loop.
 *
 * @param fps - Target frames per second
 * @param onRender - Render callback
 * @returns Render loop instance
 *
 * @example
 * ```typescript
 * const loop = createRenderLoop(30, () => {
 *   // Render frame
 * })
 * loop.start()
 * ```
 */
export function createRenderLoop(fps: number, onRender: () => void): RenderLoop {
  const frameTime = Math.floor(1000 / fps)
  let timer: ReturnType<typeof setTimeout> | null = null
  let renderRequested = true
  let running = false

  const tick = () => {
    /* c8 ignore next */
    if (!running) return

    if (renderRequested) {
      renderRequested = false
      onRender()
    }

    timer = setTimeout(tick, frameTime)
  }

  return {
    start(): void {
      if (running) return
      running = true
      renderRequested = true
      tick()
    },

    stop(): void {
      running = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },

    requestRender(): void {
      renderRequested = true
    },

    get isRunning(): boolean {
      return running
    }
  }
}
