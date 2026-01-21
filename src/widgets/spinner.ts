/**
 * @oxog/tui - Spinner Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle, Color } from '../types'
import { LeafNode } from './node'
import { parseColorWithDefault, DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { DEFAULT_SPINNER_FRAMES, DEFAULT_SPINNER_INTERVAL } from '../constants'

// ============================================================
// Types
// ============================================================

/**
 * Spinner widget properties.
 */
export interface SpinnerProps {
  /** Animation frames */
  frames?: string[]
  /** Frame interval in ms */
  interval?: number
  /** Label text */
  label?: string
  /** Spinner color */
  color?: Color
}

/**
 * Spinner node interface.
 */
export interface SpinnerNode extends Node {
  readonly type: 'spinner'

  // Configuration
  frames(frames: string[]): this
  interval(ms: number): this
  label(text: string): this
  color(color: Color): this

  // Control
  start(): this
  stop(): this

  // State
  readonly isSpinning: boolean
}

// ============================================================
// Implementation
// ============================================================

class SpinnerNodeImpl extends LeafNode implements SpinnerNode {
  readonly type = 'spinner' as const

  private _frames: string[] = DEFAULT_SPINNER_FRAMES
  private _interval: number = DEFAULT_SPINNER_INTERVAL
  private _label: string = ''
  private _color: Color | undefined
  private _spinning: boolean = false
  private _frameIndex: number = 0
  private _timer: ReturnType<typeof setInterval> | null = null

  constructor(props?: SpinnerProps) {
    super()
    /* c8 ignore start */
    if (props) {
      if (props.frames) this._frames = props.frames
      if (props.interval) this._interval = props.interval
      if (props.label) this._label = props.label
      if (props.color) this._color = props.color
    }
    /* c8 ignore stop */
  }

  get isSpinning(): boolean {
    return this._spinning
  }

  // Configuration
  frames(frames: string[]): this {
    this._frames = frames
    this._frameIndex = 0
    this.markDirty()
    return this
  }

  interval(ms: number): this {
    this._interval = ms
    // Restart timer if spinning
    if (this._spinning) {
      this.stop()
      this.start()
    }
    return this
  }

  label(text: string): this {
    this._label = text
    this.markDirty()
    return this
  }

  color(color: Color): this {
    this._color = color
    this.markDirty()
    return this
  }

  // Control
  start(): this {
    if (this._spinning) return this

    this._spinning = true
    this._frameIndex = 0

    this._timer = setInterval(() => {
      this._frameIndex = (this._frameIndex + 1) % this._frames.length
      this.markDirty()
    }, this._interval)

    this.markDirty()
    return this
  }

  stop(): this {
    if (!this._spinning) return this

    this._spinning = false

    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }

    this.markDirty()
    return this
  }

  /**
   * Dispose of spinner and clean up timer.
   */
  override dispose(): void {
    if (this._disposed) return
    // Stop timer before disposing
    this.stop()
    super.dispose()
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this.isVisible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 4 */
    const bg = parentStyle.bg ?? DEFAULT_BG
    const fg = this._color
      ? parseColorWithDefault(this._color, parentStyle.fg ?? DEFAULT_FG)
      : (parentStyle.fg ?? DEFAULT_FG)

    if (this._spinning && this._frames.length > 0) {
      /* c8 ignore next */
      const frame = this._frames[this._frameIndex] || this._frames[0] || ''
      const display = this._label ? `${frame} ${this._label}` : frame

      buffer.write(x, y, display, { fg, bg, attrs: 0 })
    } else if (this._label) {
      buffer.write(x, y, this._label, { fg, bg, attrs: 0 })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a spinner widget.
 *
 * @param props - Spinner properties
 * @returns Spinner node
 *
 * @example
 * ```typescript
 * // Basic spinner
 * const loading = spinner()
 *   .label('Loading...')
 *   .start()
 *
 * // Custom frames
 * const custom = spinner()
 *   .frames(['-', '\\', '|', '/'])
 *   .interval(100)
 *   .start()
 *
 * // Stop when done
 * setTimeout(() => loading.stop(), 5000)
 * ```
 */
export function spinner(props?: SpinnerProps): SpinnerNode {
  return new SpinnerNodeImpl(props)
}

// ============================================================
// Preset Spinners
// ============================================================

/**
 * Preset spinner configurations.
 */
export const spinners = {
  dots: {
    frames: [
      '\u280b',
      '\u2819',
      '\u2839',
      '\u2838',
      '\u283c',
      '\u2834',
      '\u2826',
      '\u2827',
      '\u2807',
      '\u280f'
    ],
    interval: 80
  },
  line: {
    frames: ['-', '\\', '|', '/'],
    interval: 100
  },
  arc: {
    frames: ['\u25dc', '\u25e0', '\u25dd', '\u25de'],
    interval: 100
  },
  circle: {
    frames: ['\u25cb', '\u25d4', '\u25d1', '\u25d5', '\u25cf', '\u25d5', '\u25d1', '\u25d4'],
    interval: 80
  },
  bounce: {
    frames: ['\u2801', '\u2802', '\u2804', '\u2840', '\u2880', '\u2820', '\u2810', '\u2808'],
    interval: 80
  },
  arrows: {
    frames: ['\u2190', '\u2196', '\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199'],
    interval: 100
  }
} as const
