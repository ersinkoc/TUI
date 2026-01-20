/**
 * @oxog/tui - Differential Renderer
 * @packageDocumentation
 */

import type { Buffer, Cell, Renderer } from '../types'
import { cloneBuffer, cellsEqual } from './buffer'
import { packedToFgAnsi, packedToBgAnsi, attrsToAnsi, cursorTo, reset } from '../utils/ansi'

// ============================================================
// Renderer Implementation
// ============================================================

/**
 * Create a differential renderer.
 *
 * @param stdout - Output stream
 * @returns Renderer instance
 *
 * @example
 * ```typescript
 * const renderer = createRenderer(process.stdout)
 * renderer.render(buffer)
 * ```
 */
export function createRenderer(stdout: NodeJS.WriteStream): Renderer {
  let lastBuffer: Buffer | null = null
  let forceRedraw = true

  return {
    render(buffer: Buffer): number {
      let cellsUpdated = 0
      const output: string[] = []

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

          const prevCell = forceRedraw ? null : lastBuffer?.get(x, y)

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
      if (output.length > 0) {
        output.push(reset())
      }

      // Write to stdout
      if (output.length > 0) {
        stdout.write(output.join(''))
      }

      // Clone buffer for next frame comparison
      lastBuffer = cloneBuffer(buffer)
      forceRedraw = false

      return cellsUpdated
    },

    invalidate(): void {
      forceRedraw = true
    },

    get lastBuffer(): Buffer | null {
      return lastBuffer
    }
  }
}

/**
 * Create a batched renderer for improved performance.
 * Groups consecutive changes to minimize cursor movements.
 *
 * @param stdout - Output stream
 * @returns Renderer instance
 */
export function createBatchedRenderer(stdout: NodeJS.WriteStream): Renderer {
  let lastBuffer: Buffer | null = null
  let forceRedraw = true

  return {
    render(buffer: Buffer): number {
      // Collect all changes
      const changes: CellChange[] = []

      for (let y = 0; y < buffer.height; y++) {
        for (let x = 0; x < buffer.width; x++) {
          const cell = buffer.get(x, y)
          /* c8 ignore next */
          if (!cell || cell.char === '') continue

          const prevCell = forceRedraw ? null : lastBuffer?.get(x, y)

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

      // Reset and flush
      output.push(reset())
      stdout.write(output.join(''))

      // Save buffer for next frame
      lastBuffer = cloneBuffer(buffer)
      forceRedraw = false

      return changes.length
    },

    invalidate(): void {
      forceRedraw = true
    },

    get lastBuffer(): Buffer | null {
      return lastBuffer
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
  let lastBuffer: Buffer | null = null

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
      lastBuffer = cloneBuffer(buffer)
      return buffer.width * buffer.height
    },

    invalidate(): void {
      output = ''
    },

    get lastBuffer(): Buffer | null {
      return lastBuffer
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
