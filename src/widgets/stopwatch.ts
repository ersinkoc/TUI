/**
 * @oxog/tui - Stopwatch/Timer Widget
 *
 * A stopwatch and countdown timer widget with lap times.
 */

import { LeafNode } from './node'
import type { Node, Buffer, CellStyle } from '../types'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_BOLD, ATTR_DIM, ATTR_INVERSE } from '../constants'
import { truncateToWidth, padToWidth, stringWidth } from '../utils/unicode'

export type StopwatchMode = 'stopwatch' | 'timer'

export interface LapTime {
  number: number
  elapsed: number
  split: number
  timestamp: number
}

export interface StopwatchProps {
  mode?: StopwatchMode
  initialTime?: number
  showMilliseconds?: boolean
  showLaps?: boolean
  format?: 'hms' | 'ms' | 'compact'
  digitStyle?: 'normal' | 'large'
}

export interface StopwatchNode extends LeafNode {
  readonly type: 'stopwatch'
  readonly mode: StopwatchMode
  readonly isRunning: boolean
  readonly elapsed: number
  readonly laps: LapTime[]

  // Control
  start(): this
  stop(): this
  reset(): this
  toggle(): this
  lap(): this
  clearLaps(): this

  // Timer mode
  setTimer(milliseconds: number): this

  // Configuration
  showMilliseconds(show: boolean): this
  showLaps(show: boolean): this
  format(fmt: 'hms' | 'ms' | 'compact'): this
  digitStyle(style: 'normal' | 'large'): this

  // Getters
  getFormattedTime(): string
  getLapTimes(): LapTime[]

  // Focus
  focus(): this
  blur(): this

  // Events
  onStart(handler: () => void): this
  onStop(handler: () => void): this
  onLap(handler: (lap: LapTime) => void): this
  onComplete(handler: () => void): this
  onTick(handler: (elapsed: number) => void): this
}

// Large digit patterns (3x5)
const LARGE_DIGITS: Record<string, string[]> = {
  '0': ['┌─┐', '│ │', '│ │', '│ │', '└─┘'],
  '1': ['  ┐', '  │', '  │', '  │', '  ╵'],
  '2': ['┌─┐', '  │', '┌─┘', '│  ', '└─┘'],
  '3': ['┌─┐', '  │', '├─┤', '  │', '└─┘'],
  '4': ['╷ ╷', '│ │', '└─┤', '  │', '  ╵'],
  '5': ['┌─┐', '│  ', '└─┐', '  │', '└─┘'],
  '6': ['┌─┐', '│  ', '├─┐', '│ │', '└─┘'],
  '7': ['┌─┐', '  │', '  │', '  │', '  ╵'],
  '8': ['┌─┐', '│ │', '├─┤', '│ │', '└─┘'],
  '9': ['┌─┐', '│ │', '└─┤', '  │', '└─┘'],
  ':': [' ', '●', ' ', '●', ' '],
  '.': [' ', ' ', ' ', ' ', '●'],
}

class StopwatchNodeImpl extends LeafNode implements StopwatchNode {
  readonly type = 'stopwatch' as const

  private _mode: StopwatchMode = 'stopwatch'
  private _isRunning = false
  private _elapsed = 0
  private _startTime = 0
  private _timerTarget = 0
  private _laps: LapTime[] = []
  private _lastLapTime = 0
  private _showMilliseconds = true
  private _showLaps = true
  private _format: 'hms' | 'ms' | 'compact' = 'hms'
  private _digitStyle: 'normal' | 'large' = 'normal'
  private _isFocused = false

  private _onStartHandlers: Array<() => void> = []
  private _onStopHandlers: Array<() => void> = []
  private _onLapHandlers: Array<(lap: LapTime) => void> = []
  private _onCompleteHandlers: Array<() => void> = []
  private _onTickHandlers: Array<(elapsed: number) => void> = []

  constructor(props?: StopwatchProps) {
    super()
    if (props) {
      if (props.mode) this._mode = props.mode
      if (props.initialTime !== undefined) {
        if (props.mode === 'timer') {
          this._timerTarget = props.initialTime
        } else {
          this._elapsed = props.initialTime
        }
      }
      if (props.showMilliseconds !== undefined) this._showMilliseconds = props.showMilliseconds
      if (props.showLaps !== undefined) this._showLaps = props.showLaps
      if (props.format) this._format = props.format
      if (props.digitStyle) this._digitStyle = props.digitStyle
    }
  }

  // Getters
  get mode(): StopwatchMode {
    return this._mode
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get elapsed(): number {
    if (this._isRunning) {
      return this._elapsed + (Date.now() - this._startTime)
    }
    return this._elapsed
  }

  get laps(): LapTime[] {
    return this._laps
  }

  // Control methods
  start(): this {
    if (!this._isRunning) {
      this._isRunning = true
      this._startTime = Date.now()

      for (const handler of this._onStartHandlers) {
        handler()
      }

      this.markDirty()
    }
    return this
  }

  stop(): this {
    if (this._isRunning) {
      this._elapsed += Date.now() - this._startTime
      this._isRunning = false

      for (const handler of this._onStopHandlers) {
        handler()
      }

      this.markDirty()
    }
    return this
  }

  reset(): this {
    this._isRunning = false
    this._elapsed = 0
    this._startTime = 0
    this._lastLapTime = 0
    this._laps = []
    this.markDirty()
    return this
  }

  toggle(): this {
    if (this._isRunning) {
      this.stop()
    } else {
      this.start()
    }
    return this
  }

  lap(): this {
    if (!this._isRunning) return this

    const currentElapsed = this.elapsed
    const split = currentElapsed - this._lastLapTime

    const lapTime: LapTime = {
      number: this._laps.length + 1,
      elapsed: currentElapsed,
      split,
      timestamp: Date.now()
    }

    this._laps.push(lapTime)
    this._lastLapTime = currentElapsed

    for (const handler of this._onLapHandlers) {
      handler(lapTime)
    }

    this.markDirty()
    return this
  }

  clearLaps(): this {
    this._laps = []
    this._lastLapTime = 0
    this.markDirty()
    return this
  }

  // Timer mode
  setTimer(milliseconds: number): this {
    this._mode = 'timer'
    this._timerTarget = milliseconds
    this._elapsed = 0
    this._isRunning = false
    this.markDirty()
    return this
  }

  // Get remaining time for timer mode
  private getRemaining(): number {
    if (this._mode !== 'timer') return 0
    const remaining = this._timerTarget - this.elapsed
    return Math.max(0, remaining)
  }

  // Configuration
  showMilliseconds(show: boolean): this {
    this._showMilliseconds = show
    this.markDirty()
    return this
  }

  showLaps(show: boolean): this {
    this._showLaps = show
    this.markDirty()
    return this
  }

  format(fmt: 'hms' | 'ms' | 'compact'): this {
    this._format = fmt
    this.markDirty()
    return this
  }

  digitStyle(style: 'normal' | 'large'): this {
    this._digitStyle = style
    this.markDirty()
    return this
  }

  // Getters
  getFormattedTime(): string {
    const time = this._mode === 'timer' ? this.getRemaining() : this.elapsed
    return this.formatTime(time)
  }

  getLapTimes(): LapTime[] {
    return [...this._laps]
  }

  private formatTime(ms: number): string {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000

    switch (this._format) {
      case 'compact':
        if (hours > 0) {
          return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`

      case 'ms':
        const totalSecs = Math.floor(ms / 1000)
        if (this._showMilliseconds) {
          return `${totalSecs}.${String(millis).padStart(3, '0')}`
        }
        return String(totalSecs)

      case 'hms':
      default:
        let result = ''
        if (hours > 0) {
          result = `${String(hours).padStart(2, '0')}:`
        }
        result += `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        if (this._showMilliseconds) {
          result += `.${String(millis).padStart(3, '0')}`
        }
        return result
    }
  }

  // Focus
  focus(): this {
    this._isFocused = true
    this.markDirty()
    return this
  }

  blur(): this {
    this._isFocused = false
    this.markDirty()
    return this
  }

  // Events
  onStart(handler: () => void): this {
    this._onStartHandlers.push(handler)
    return this
  }

  onStop(handler: () => void): this {
    this._onStopHandlers.push(handler)
    return this
  }

  onLap(handler: (lap: LapTime) => void): this {
    this._onLapHandlers.push(handler)
    return this
  }

  onComplete(handler: () => void): this {
    this._onCompleteHandlers.push(handler)
    return this
  }

  onTick(handler: (elapsed: number) => void): this {
    this._onTickHandlers.push(handler)
    return this
  }

  // Internal tick - called by animation frame
  tick(): void {
    if (!this._isRunning) return

    const elapsed = this.elapsed

    // Emit tick event
    for (const handler of this._onTickHandlers) {
      handler(elapsed)
    }

    // Check for timer completion
    if (this._mode === 'timer' && elapsed >= this._timerTarget) {
      this.stop()
      for (const handler of this._onCompleteHandlers) {
        handler()
      }
    }

    this.markDirty()
  }

  // Keyboard handling
  /** @internal */
  handleKey(key: string): boolean {
    if (!this._isFocused) return false

    switch (key) {
      case ' ':
      case 'enter':
        this.toggle()
        return true
      case 'r':
        this.reset()
        return true
      case 'l':
        this.lap()
        return true
      case 'c':
        this.clearLaps()
        return true
    }

    return false
  }

  // Mouse handling
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    if (!this._visible) return false

    const bounds = this._bounds
    if (!bounds) return false

    if (action === 'press') {
      this._isFocused = true
      this.toggle()
      this.markDirty()
      return true
    }

    return false
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const bounds = this._bounds
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    // Clear buffer
    for (let y = 0; y < bounds.height; y++) {
      for (let x = 0; x < bounds.width; x++) {
        buffer.set(bounds.x + x, bounds.y + y, { char: ' ', fg, bg, attrs: 0 })
      }
    }

    const timeString = this.getFormattedTime()

    if (this._digitStyle === 'large' && bounds.height >= 5 && bounds.width >= timeString.length * 4) {
      this.renderLargeDigits(buffer, bounds.x, bounds.y, timeString, fg, bg)
    } else {
      this.renderNormalTime(buffer, bounds.x, bounds.y, bounds.width, timeString, fg, bg)
    }

    // Render status indicator
    const statusY = this._digitStyle === 'large' && bounds.height >= 6 ? bounds.y + 5 : bounds.y + 1
    if (statusY < bounds.y + bounds.height) {
      const status = this._isRunning ? '▶ Running' : this._elapsed > 0 ? '⏸ Paused' : '⏹ Stopped'
      const statusColor = this._isRunning ? 46 : this._elapsed > 0 ? 208 : 244
      buffer.write(bounds.x, statusY, status, { fg: statusColor, bg, attrs: 0 })

      // Mode indicator
      if (this._mode === 'timer') {
        const modeText = 'Timer'
        buffer.write(bounds.x + stringWidth(status) + 2, statusY, modeText, { fg: 39, bg, attrs: 0 })
      }
    }

    // Render laps
    if (this._showLaps && this._laps.length > 0) {
      const lapStartY = statusY + 1
      const lapsToShow = Math.min(this._laps.length, bounds.height - (lapStartY - bounds.y))

      // Show most recent laps first
      for (let i = 0; i < lapsToShow; i++) {
        const lapIdx = this._laps.length - 1 - i
        const lap = this._laps[lapIdx]
        const y = lapStartY + i

        if (y >= bounds.y + bounds.height) break

        const lapText = `Lap ${lap.number}: ${this.formatTime(lap.split)} (${this.formatTime(lap.elapsed)})`
        buffer.write(bounds.x, y, truncateToWidth(lapText, bounds.width), { fg: 244, bg, attrs: ATTR_DIM })
      }
    }
  }

  private renderNormalTime(buffer: Buffer, x: number, y: number, width: number, time: string, fg: number, bg: number): void {
    const attrs = this._isFocused ? ATTR_BOLD : 0
    const color = this._isRunning ? 46 : fg
    buffer.write(x, y, time, { fg: color, bg, attrs })
  }

  private renderLargeDigits(buffer: Buffer, x: number, y: number, time: string, fg: number, bg: number): void {
    const color = this._isRunning ? 46 : fg
    let currentX = x

    for (const char of time) {
      const pattern = LARGE_DIGITS[char] || LARGE_DIGITS['0']

      for (let row = 0; row < pattern.length; row++) {
        const line = pattern[row]
        buffer.write(currentX, y + row, line, { fg: color, bg, attrs: this._isFocused ? ATTR_BOLD : 0 })
      }

      currentX += 4 // 3 chars + 1 space
    }
  }
}

export function stopwatch(props?: StopwatchProps): StopwatchNode {
  return new StopwatchNodeImpl(props)
}
