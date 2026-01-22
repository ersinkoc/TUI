/**
 * @oxog/tui - Renderer Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createRenderer,
  createBatchedRenderer,
  createStringRenderer,
  createRenderLoop
} from '../../src/core/renderer'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG, ATTR_BOLD } from '../../src/constants'

// Mock stdout
function createMockStdout(): NodeJS.WriteStream & { getOutput(): string; clear(): void } {
  let output = ''
  return {
    write(data: string | Buffer): boolean {
      output += data.toString()
      return true
    },
    getOutput() {
      return output
    },
    clear() {
      output = ''
    }
  } as NodeJS.WriteStream & { getOutput(): string; clear(): void }
}

describe('createRenderer', () => {
  it('creates a renderer', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)

    expect(renderer).toBeDefined()
    expect(renderer.render).toBeInstanceOf(Function)
    expect(renderer.invalidate).toBeInstanceOf(Function)
    expect(renderer.lastBuffer).toBeNull()
  })

  it('renders buffer to stdout', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Hello', {})

    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
    expect(stdout.getOutput()).toContain('Hello')
  })

  it('stores last buffer', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Test', {})
    renderer.render(buffer)

    // lastBuffer returns null after memory optimization (double buffering)
    // Internal snapshot is used instead of full buffer clone
    expect(renderer.lastBuffer).toBeNull()
  })

  it('performs differential rendering', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // First render
    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)
    stdout.clear()

    // Second render with same content
    const cellsUpdated = renderer.render(buffer)

    // Should not render anything since nothing changed
    expect(cellsUpdated).toBe(0)
  })

  it('re-renders changed cells', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // First render
    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)
    stdout.clear()

    // Change content with completely different characters
    buffer.write(0, 0, 'ABCDE', {})
    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
    expect(stdout.getOutput()).toContain('ABCDE')
  })

  it('invalidate forces full redraw', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // First render
    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)
    stdout.clear()

    // Invalidate and re-render same content
    renderer.invalidate()
    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
  })

  it('handles color changes', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Red', { fg: 0xff0000 })
    renderer.render(buffer)

    const output = stdout.getOutput()
    expect(output).toContain('Red')
    // Should contain ANSI color sequences
    expect(output).toMatch(/\x1b\[/)
  })

  it('handles attribute changes', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Bold', { attrs: ATTR_BOLD })
    renderer.render(buffer)

    const output = stdout.getOutput()
    expect(output).toContain('Bold')
    expect(output).toMatch(/\x1b\[/)
  })

  it('handles attribute reset', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(20, 5)

    buffer.write(0, 0, 'Bold', { attrs: ATTR_BOLD })
    buffer.write(5, 0, 'Normal', {})
    renderer.render(buffer)

    const output = stdout.getOutput()
    expect(output).toContain('Bold')
    expect(output).toContain('Normal')
    // Should have reset sequence
    expect(output).toContain('\x1b[0m')
  })

  it('skips empty cells', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'A', {})
    // Wide char continuation creates empty cell
    buffer.write(5, 0, 'B', {})

    const cellsUpdated = renderer.render(buffer)
    expect(cellsUpdated).toBeGreaterThan(0)
  })

  it('optimizes cursor movement', () => {
    const stdout = createMockStdout()
    const renderer = createRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // Write consecutive characters - should not need cursor move
    buffer.write(0, 0, 'ABCD', {})
    renderer.render(buffer)

    // Write at different location - needs cursor move
    stdout.clear()
    buffer.write(5, 2, 'X', {})
    renderer.render(buffer)

    const output = stdout.getOutput()
    // Should contain cursor position sequence
    expect(output).toMatch(/\x1b\[\d+;\d+H/)
  })
})

describe('createBatchedRenderer', () => {
  it('creates a batched renderer', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)

    expect(renderer).toBeDefined()
    expect(renderer.render).toBeInstanceOf(Function)
    expect(renderer.invalidate).toBeInstanceOf(Function)
    expect(renderer.lastBuffer).toBeNull()
  })

  it('renders buffer to stdout', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Hello', {})

    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
    expect(stdout.getOutput()).toContain('Hello')
  })

  it('returns 0 for empty changes', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // First render
    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)

    // Second render with same content
    const cellsUpdated = renderer.render(buffer)
    expect(cellsUpdated).toBe(0)
  })

  it('stores last buffer', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Test', {})
    renderer.render(buffer)

    // lastBuffer returns null after memory optimization (double buffering)
    // Internal snapshot is used instead of full buffer clone
    expect(renderer.lastBuffer).toBeNull()
  })

  it('invalidate forces full redraw', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // First render
    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)
    stdout.clear()

    // Invalidate and re-render
    renderer.invalidate()
    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
  })

  it('sorts changes by position', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // Write in non-sequential order
    buffer.write(5, 2, 'B', {})
    buffer.write(0, 0, 'A', {})
    buffer.write(2, 1, 'C', {})

    renderer.render(buffer)
    const output = stdout.getOutput()

    // Output should contain all characters
    expect(output).toContain('A')
    expect(output).toContain('B')
    expect(output).toContain('C')
  })

  it('handles color changes', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Red', { fg: 0xff0000 })
    buffer.write(4, 0, 'Blue', { fg: 0x0000ff })
    renderer.render(buffer)

    const output = stdout.getOutput()
    expect(output).toContain('Red')
    expect(output).toContain('Blue')
  })

  it('handles attribute reset', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(20, 5)

    buffer.write(0, 0, 'Bold', { attrs: ATTR_BOLD })
    buffer.write(5, 0, 'Normal', {})
    renderer.render(buffer)

    const output = stdout.getOutput()
    expect(output).toContain('\x1b[0m')
  })

  it('skips empty cells', () => {
    const stdout = createMockStdout()
    const renderer = createBatchedRenderer(stdout)
    const buffer = createBuffer(10, 5)

    // Buffer starts with empty cells
    buffer.write(0, 0, 'A', {})
    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBeGreaterThan(0)
  })
})

describe('createStringRenderer', () => {
  it('creates a string renderer', () => {
    const renderer = createStringRenderer(10, 5)

    expect(renderer).toBeDefined()
    expect(renderer.render).toBeInstanceOf(Function)
    expect(renderer.getString).toBeInstanceOf(Function)
    expect(renderer.lastBuffer).toBeNull()
  })

  it('renders buffer to string', () => {
    const renderer = createStringRenderer(10, 5)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Hello', {})
    buffer.write(0, 1, 'World', {})

    renderer.render(buffer)
    const output = renderer.getString()

    expect(output).toContain('Hello')
    expect(output).toContain('World')
  })

  it('trims trailing spaces', () => {
    const renderer = createStringRenderer(20, 5)
    const buffer = createBuffer(20, 5)

    buffer.write(0, 0, 'Test', {})
    renderer.render(buffer)

    const lines = renderer.getString().split('\n')
    expect(lines[0]).toBe('Test')
    // Should not have trailing spaces
    expect(lines[0]).not.toMatch(/\s$/)
  })

  it('returns cell count', () => {
    const renderer = createStringRenderer(10, 5)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Hello', {})
    const cellsUpdated = renderer.render(buffer)

    expect(cellsUpdated).toBe(50) // 10 * 5
  })

  it('stores last buffer', () => {
    const renderer = createStringRenderer(10, 5)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Test', {})
    renderer.render(buffer)

    // lastBuffer returns null after memory optimization (double buffering)
    // Internal snapshot is used instead of full buffer clone
    expect(renderer.lastBuffer).toBeNull()
  })

  it('invalidate clears output', () => {
    const renderer = createStringRenderer(10, 5)
    const buffer = createBuffer(10, 5)

    buffer.write(0, 0, 'Hello', {})
    renderer.render(buffer)
    expect(renderer.getString()).toContain('Hello')

    renderer.invalidate()
    expect(renderer.getString()).toBe('')
  })
})

describe('createRenderLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a render loop', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    expect(loop).toBeDefined()
    expect(loop.start).toBeInstanceOf(Function)
    expect(loop.stop).toBeInstanceOf(Function)
    expect(loop.requestRender).toBeInstanceOf(Function)
    expect(loop.isRunning).toBe(false)
  })

  it('starts and stops', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    expect(loop.isRunning).toBe(false)

    loop.start()
    expect(loop.isRunning).toBe(true)

    loop.stop()
    expect(loop.isRunning).toBe(false)
  })

  it('calls onRender on start', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    loop.start()
    vi.advanceTimersByTime(0)

    expect(onRender).toHaveBeenCalled()
  })

  it('renders at specified FPS', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    loop.start()
    vi.advanceTimersByTime(0) // Initial render

    // Request another render
    loop.requestRender()
    vi.advanceTimersByTime(33) // ~30 FPS

    expect(onRender).toHaveBeenCalledTimes(2)

    loop.stop()
  })

  it('does not render when not requested', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    loop.start()
    vi.advanceTimersByTime(0) // Initial render
    expect(onRender).toHaveBeenCalledTimes(1)

    // Advance time without requesting render
    vi.advanceTimersByTime(100)
    expect(onRender).toHaveBeenCalledTimes(1)

    // Now request render and advance by multiple frame times
    // to ensure the tick executes (drift compensation may adjust timing)
    loop.requestRender()
    vi.advanceTimersByTime(100) // Advance by ~3 frames to ensure render happens
    expect(onRender).toHaveBeenCalledTimes(2)

    loop.stop()
  })

  it('does not double start', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    loop.start()
    loop.start() // Should be no-op
    vi.advanceTimersByTime(0)

    expect(onRender).toHaveBeenCalledTimes(1)
    loop.stop()
  })

  it('stops rendering after stop', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(30, onRender)

    loop.start()
    vi.advanceTimersByTime(0)
    expect(onRender).toHaveBeenCalledTimes(1)

    loop.stop()

    loop.requestRender()
    vi.advanceTimersByTime(100)

    // Should not render after stop
    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('requestRender flags for next frame', () => {
    const onRender = vi.fn()
    const loop = createRenderLoop(60, onRender)

    loop.start()
    vi.advanceTimersByTime(0) // Initial render

    // Request multiple renders - should collapse to one
    loop.requestRender()
    loop.requestRender()
    loop.requestRender()

    vi.advanceTimersByTime(16) // ~60 FPS frame

    expect(onRender).toHaveBeenCalledTimes(2)
    loop.stop()
  })
})
