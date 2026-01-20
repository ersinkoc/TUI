/**
 * @oxog/tui - Error Classes Tests
 */

import { describe, it, expect } from 'vitest'
import {
  TUIError,
  PluginError,
  LayoutError,
  RenderError,
  ValidationError,
  StreamError,
  isTUIError,
  isPluginError,
  createError
} from '../src/errors'

describe('TUIError', () => {
  it('creates error with message and code', () => {
    const error = new TUIError('Test error', 'RENDER_ERROR')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('RENDER_ERROR')
    expect(error.name).toBe('TUIError')
  })

  it('is an instance of Error', () => {
    const error = new TUIError('Test', 'PLUGIN_ERROR')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
  })

  it('has stack trace', () => {
    const error = new TUIError('Test', 'LAYOUT_ERROR')
    expect(error.stack).toBeDefined()
  })

  it('works with all error codes', () => {
    const codes = [
      'PLUGIN_ERROR',
      'PLUGIN_NOT_FOUND',
      'PLUGIN_DEPENDENCY',
      'LAYOUT_ERROR',
      'LAYOUT_OVERFLOW',
      'RENDER_ERROR',
      'VALIDATION_ERROR',
      'STREAM_ERROR',
      'INVALID_NODE',
      'INVALID_OPTION',
      'INVALID_COLOR',
      'NOT_RUNNING',
      'ALREADY_RUNNING'
    ] as const

    for (const code of codes) {
      const error = new TUIError('Test', code)
      expect(error.code).toBe(code)
    }
  })
})

describe('PluginError', () => {
  it('creates error with plugin name', () => {
    const error = new PluginError('Init failed', 'my-plugin')
    expect(error.message).toBe('[my-plugin] Init failed')
    expect(error.pluginName).toBe('my-plugin')
    expect(error.code).toBe('PLUGIN_ERROR')
    expect(error.name).toBe('PluginError')
  })

  it('is an instance of TUIError', () => {
    const error = new PluginError('Test', 'plugin')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
    expect(error).toBeInstanceOf(PluginError)
  })

  it('has stack trace', () => {
    const error = new PluginError('Test', 'plugin')
    expect(error.stack).toBeDefined()
  })
})

describe('LayoutError', () => {
  it('creates error with message', () => {
    const error = new LayoutError('Circular dependency')
    expect(error.message).toBe('Circular dependency')
    expect(error.code).toBe('LAYOUT_ERROR')
    expect(error.name).toBe('LayoutError')
  })

  it('is an instance of TUIError', () => {
    const error = new LayoutError('Test')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
    expect(error).toBeInstanceOf(LayoutError)
  })

  it('has stack trace', () => {
    const error = new LayoutError('Test')
    expect(error.stack).toBeDefined()
  })
})

describe('RenderError', () => {
  it('creates error with message', () => {
    const error = new RenderError('Buffer overflow')
    expect(error.message).toBe('Buffer overflow')
    expect(error.code).toBe('RENDER_ERROR')
    expect(error.name).toBe('RenderError')
  })

  it('is an instance of TUIError', () => {
    const error = new RenderError('Test')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
    expect(error).toBeInstanceOf(RenderError)
  })

  it('has stack trace', () => {
    const error = new RenderError('Test')
    expect(error.stack).toBeDefined()
  })
})

describe('ValidationError', () => {
  it('creates error with message', () => {
    const error = new ValidationError('Invalid color')
    expect(error.message).toBe('Invalid color')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.name).toBe('ValidationError')
  })

  it('is an instance of TUIError', () => {
    const error = new ValidationError('Test')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
    expect(error).toBeInstanceOf(ValidationError)
  })

  it('has stack trace', () => {
    const error = new ValidationError('Test')
    expect(error.stack).toBeDefined()
  })
})

describe('StreamError', () => {
  it('creates error with message', () => {
    const error = new StreamError('stdout is not a TTY')
    expect(error.message).toBe('stdout is not a TTY')
    expect(error.code).toBe('STREAM_ERROR')
    expect(error.name).toBe('StreamError')
  })

  it('is an instance of TUIError', () => {
    const error = new StreamError('Test')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TUIError)
    expect(error).toBeInstanceOf(StreamError)
  })

  it('has stack trace', () => {
    const error = new StreamError('Test')
    expect(error.stack).toBeDefined()
  })
})

describe('isTUIError', () => {
  it('returns true for TUIError', () => {
    expect(isTUIError(new TUIError('Test', 'RENDER_ERROR'))).toBe(true)
  })

  it('returns true for subclasses', () => {
    expect(isTUIError(new PluginError('Test', 'plugin'))).toBe(true)
    expect(isTUIError(new LayoutError('Test'))).toBe(true)
    expect(isTUIError(new RenderError('Test'))).toBe(true)
    expect(isTUIError(new ValidationError('Test'))).toBe(true)
    expect(isTUIError(new StreamError('Test'))).toBe(true)
  })

  it('returns false for regular Error', () => {
    expect(isTUIError(new Error('Test'))).toBe(false)
  })

  it('returns false for non-errors', () => {
    expect(isTUIError(null)).toBe(false)
    expect(isTUIError(undefined)).toBe(false)
    expect(isTUIError('string')).toBe(false)
    expect(isTUIError(123)).toBe(false)
    expect(isTUIError({})).toBe(false)
  })
})

describe('isPluginError', () => {
  it('returns true for PluginError', () => {
    expect(isPluginError(new PluginError('Test', 'plugin'))).toBe(true)
  })

  it('returns false for other TUIErrors', () => {
    expect(isPluginError(new TUIError('Test', 'RENDER_ERROR'))).toBe(false)
    expect(isPluginError(new LayoutError('Test'))).toBe(false)
    expect(isPluginError(new RenderError('Test'))).toBe(false)
  })

  it('returns false for non-errors', () => {
    expect(isPluginError(null)).toBe(false)
    expect(isPluginError(undefined)).toBe(false)
    expect(isPluginError('string')).toBe(false)
  })
})

describe('createError', () => {
  it('creates TUIError for PLUGIN_ERROR', () => {
    const error = createError('PLUGIN_ERROR', 'Test')
    expect(error).toBeInstanceOf(TUIError)
    expect(error.code).toBe('PLUGIN_ERROR')
  })

  it('creates TUIError for PLUGIN_NOT_FOUND', () => {
    const error = createError('PLUGIN_NOT_FOUND', 'Test')
    expect(error).toBeInstanceOf(TUIError)
    expect(error.code).toBe('PLUGIN_NOT_FOUND')
  })

  it('creates TUIError for PLUGIN_DEPENDENCY', () => {
    const error = createError('PLUGIN_DEPENDENCY', 'Test')
    expect(error).toBeInstanceOf(TUIError)
    expect(error.code).toBe('PLUGIN_DEPENDENCY')
  })

  it('creates LayoutError for LAYOUT_ERROR', () => {
    const error = createError('LAYOUT_ERROR', 'Test')
    expect(error).toBeInstanceOf(LayoutError)
    expect(error.code).toBe('LAYOUT_ERROR')
  })

  it('creates LayoutError for LAYOUT_OVERFLOW', () => {
    const error = createError('LAYOUT_OVERFLOW', 'Test')
    expect(error).toBeInstanceOf(LayoutError)
    // LayoutError always sets LAYOUT_ERROR
    expect(error.code).toBe('LAYOUT_ERROR')
  })

  it('creates RenderError for RENDER_ERROR', () => {
    const error = createError('RENDER_ERROR', 'Test')
    expect(error).toBeInstanceOf(RenderError)
    expect(error.code).toBe('RENDER_ERROR')
  })

  it('creates ValidationError for VALIDATION_ERROR', () => {
    const error = createError('VALIDATION_ERROR', 'Test')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('creates ValidationError for INVALID_COLOR', () => {
    const error = createError('INVALID_COLOR', 'Test')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('creates ValidationError for INVALID_OPTION', () => {
    const error = createError('INVALID_OPTION', 'Test')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('creates ValidationError for INVALID_NODE', () => {
    const error = createError('INVALID_NODE', 'Test')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('creates StreamError for STREAM_ERROR', () => {
    const error = createError('STREAM_ERROR', 'Test')
    expect(error).toBeInstanceOf(StreamError)
    expect(error.code).toBe('STREAM_ERROR')
  })

  it('creates TUIError for NOT_RUNNING', () => {
    const error = createError('NOT_RUNNING', 'Test')
    expect(error).toBeInstanceOf(TUIError)
    expect(error.code).toBe('NOT_RUNNING')
  })

  it('creates TUIError for ALREADY_RUNNING', () => {
    const error = createError('ALREADY_RUNNING', 'Test')
    expect(error).toBeInstanceOf(TUIError)
    expect(error.code).toBe('ALREADY_RUNNING')
  })
})
