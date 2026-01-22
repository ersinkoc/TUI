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
 * Terminal capability detection result.
 */
interface TerminalCapabilities {
  /** Supports synchronized output (DECSET 2026) */
  syncOutput: boolean
  /** Supports sixel graphics */
  sixel: boolean
  /** Supports kitty graphics protocol */
  kittyGraphics: boolean
}

/**
 * Check if the terminal likely supports synchronized output.
 *
 * Uses a more precise detection approach based on known terminal
 * capabilities rather than broad pattern matching.
 *
 * @returns True if terminal likely supports synchronized output
 */
export function terminalSupportsSyncOutput(): boolean {
  const term = process.env.TERM || ''
  const termProgram = process.env.TERM_PROGRAM || ''
  const termProgramVersion = process.env.TERM_PROGRAM_VERSION || ''
  const wtSession = process.env.WT_SESSION // Windows Terminal

  // Explicit terminal capability mapping based on known support
  const terminalCapabilities: Record<string, TerminalCapabilities> = {
    // Kitty terminals (explicit check, not substring)
    'xterm-kitty': { syncOutput: true, sixel: false, kittyGraphics: true },
    'kitty': { syncOutput: true, sixel: false, kittyGraphics: true },

    // WezTerm (needs exact match or version check)
    'wezterm': { syncOutput: true, sixel: true, kittyGraphics: false },

    // iTerm2
    'iTerm.app': { syncOutput: true, sixel: false, kittyGraphics: false },

    // VS Code integrated terminal
    'vscode': { syncOutput: true, sixel: false, kittyGraphics: false },

    // Windows Terminal
    'windows-terminal': { syncOutput: true, sixel: false, kittyGraphics: false },

    // Modern xterm variants (explicit versions, not generic 256color)
    'xterm-256color': { syncOutput: false, sixel: false, kittyGraphics: false },
    'screen-256color': { syncOutput: false, sixel: false, kittyGraphics: false },

    // tmux (usually doesn't support DECSET 2026 correctly)
    'tmux': { syncOutput: false, sixel: false, kittyGraphics: false },
  }

  // Check for exact TERM match first
  if (terminalCapabilities[term]) {
    return terminalCapabilities[term].syncOutput
  }

  // Check for TERM_PROGRAM match (more reliable for some terminals)
  if (termProgram === 'WezTerm') {
    // WezTerm supports sync output in recent versions
    const versionMatch = termProgramVersion.match(/^(\d+)\.(\d+)/)
    if (versionMatch) {
      const major = parseInt(versionMatch[1]!, 10)
      // WezTerm 3.0+ supports sync output
      return major >= 3
    }
    return true // Assume support for recent versions
  }

  // Windows Terminal detection via WT_SESSION
  if (wtSession) {
    return true
  }

  // Generic fallback - be conservative
  // Only enable if we have strong evidence of support
  return false
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
      // Invalidate snapshot to prevent using stale data
      snapshotCells = null
      snapshotWidth = 0
      snapshotHeight = 0
      return
    }

    const size = w * h

    // Get cells reference immediately after validating dimensions
    // This minimizes the race condition window
    const cells = buffer.cells

    // Triple-check: dimensions, cells length, and snapshot consistency
    // Only invalidate if we had a previous snapshot (snapshotCells !== null) with different dimensions
    // First render (snapshotCells === null) should always proceed to create the snapshot
    if (
      cells.length !== size ||
      (snapshotCells !== null && (w !== snapshotWidth || h !== snapshotHeight))
    ) {
      // Buffer was resized or dimensions changed - invalidate snapshot
      // This prevents using inconsistent state
      snapshotCells = null
      snapshotWidth = 0
      snapshotHeight = 0
      return
    }

    // Reallocate only if dimensions changed or snapshot is null
    if (snapshotCells === null || snapshotCells.length !== size) {
      snapshotCells = new Array(size)
      for (let i = 0; i < size; i++) {
        snapshotCells[i] = { char: ' ', fg: 0, bg: 0, attrs: 0 }
      }
      snapshotWidth = w
      snapshotHeight = h
    }

    // Copy cell data in-place (reuse existing objects)
    // Bounds checking already done above
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

      // Batching configuration - write in chunks to avoid huge allocations
      const WRITE_BATCH_SIZE = 8192  // Write every ~8KB of output
      let currentBatchSize = 0

      // Helper to flush output if batch size exceeded
      const flushIfNeeded = () => {
        if (currentBatchSize >= WRITE_BATCH_SIZE) {
          stdout.write(output.join(''))
          output.length = 0
          currentBatchSize = 0
        }
      }

      // Start synchronized output
      if (useSyncOutput) {
        output.push(SYNC_START)
        currentBatchSize += SYNC_START.length
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
            const cursorSeq = cursorTo(x, y)
            output.push(cursorSeq)
            currentBatchSize += cursorSeq.length
          }

          // Update colors if changed
          if (cell.fg !== lastFg) {
            const fgSeq = packedToFgAnsi(cell.fg)
            output.push(fgSeq)
            currentBatchSize += fgSeq.length
            lastFg = cell.fg
          }

          if (cell.bg !== lastBg) {
            const bgSeq = packedToBgAnsi(cell.bg)
            output.push(bgSeq)
            currentBatchSize += bgSeq.length
            lastBg = cell.bg
          }

          // Update attributes if changed
          if (cell.attrs !== lastAttrs) {
            // Reset first if going from styled to unstyled
            if (lastAttrs !== 0 && cell.attrs === 0) {
              const resetSeq = reset()
              output.push(resetSeq)
              currentBatchSize += resetSeq.length
              // Need to re-apply colors after reset
              const fgSeq = packedToFgAnsi(cell.fg)
              const bgSeq = packedToBgAnsi(cell.bg)
              output.push(fgSeq, bgSeq)
              currentBatchSize += fgSeq.length + bgSeq.length
            } else {
              const attrSeq = attrsToAnsi(cell.attrs)
              if (attrSeq) {
                output.push(attrSeq)
                currentBatchSize += attrSeq.length
              }
            }
            lastAttrs = cell.attrs
          }

          output.push(cell.char)
          currentBatchSize += cell.char.length
          lastX = x
          lastY = y

          // Flush if batch size reached
          flushIfNeeded()
        }
      }

      // Reset attributes at end
      if (output.length > 0 || useSyncOutput) {
        const resetSeq = reset()
        output.push(resetSeq)
        currentBatchSize += resetSeq.length
      }

      // End synchronized output
      if (useSyncOutput) {
        output.push(SYNC_END)
        currentBatchSize += SYNC_END.length
      }

      // Write remaining output
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
      // Invalidate snapshot to prevent using stale data
      snapshotCells = null
      snapshotWidth = 0
      snapshotHeight = 0
      return
    }

    const size = w * h

    // Get cells reference immediately after validating dimensions
    const cells = buffer.cells

    // Triple-check: dimensions, cells length, and snapshot consistency
    // Only invalidate if we had a previous snapshot (snapshotCells !== null) with different dimensions
    // First render (snapshotCells === null) should always proceed to create the snapshot
    if (
      cells.length !== size ||
      (snapshotCells !== null && (w !== snapshotWidth || h !== snapshotHeight))
    ) {
      // Buffer was resized or dimensions changed - invalidate snapshot
      snapshotCells = null
      snapshotWidth = 0
      snapshotHeight = 0
      return
    }

    if (snapshotCells === null || snapshotCells.length !== size) {
      snapshotCells = new Array(size)
      for (let i = 0; i < size; i++) {
        snapshotCells[i] = { char: ' ', fg: 0, bg: 0, attrs: 0 }
      }
      snapshotWidth = w
      snapshotHeight = h
    }

    // Copy cell data in-place with bounds checking
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

      // No need to sort - changes are already collected in row-major order
      // (iterating y then x produces sorted output by position)

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
