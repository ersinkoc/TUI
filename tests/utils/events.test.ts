/**
 * @oxog/tui - Event Emitter Tests
 * Comprehensive tests for event emitter utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  EventEmitter,
  createEventEmitter,
  type IEventEmitter,
  type EventMap,
  type EventHandler
} from '../../src/utils/events'

// Test event map
interface TestEvents {
  click: { x: number; y: number }
  change: string
  close: void
  error: Error
  data: number[]
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>()
  })

  describe('on', () => {
    it('should register event handlers', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      expect(emitter.listenerCount('click')).toBe(1)
    })

    it('should register multiple handlers for same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      emitter.on('click', handler1)
      emitter.on('click', handler2)
      expect(emitter.listenerCount('click')).toBe(2)
    })

    it('should call handlers when event is emitted', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.emit('click', { x: 10, y: 20 })
      expect(handler).toHaveBeenCalledWith({ x: 10, y: 20 })
    })

    it('should call all registered handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      emitter.on('click', handler1)
      emitter.on('click', handler2)
      emitter.emit('click', { x: 10, y: 20 })
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should support void events', () => {
      const handler = vi.fn()
      emitter.on('close', handler)
      emitter.emit('close')
      expect(handler).toHaveBeenCalled()
    })

    it('should return this for chaining', () => {
      const handler = vi.fn()
      const result = emitter.on('click', handler)
      expect(result).toBe(emitter)
    })

    it('should warn about potential memory leaks', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      emitter.setMaxListeners(5)
      const handlers: Array<EventHandler<{ x: number; y: number }>> = []

      // Add 6 handlers (exceeds max of 5)
      for (let i = 0; i < 6; i++) {
        const handler = vi.fn()
        handlers.push(handler)
        emitter.on('click', handler)
      }

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should only warn once per event', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      emitter.setMaxListeners(2)
      const handlers: Array<EventHandler<{ x: number; y: number }>> = []

      // Add 4 handlers (exceeds max of 2)
      for (let i = 0; i < 4; i++) {
        const handler = vi.fn()
        handlers.push(handler)
        emitter.on('click', handler)
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

      consoleWarnSpy.mockRestore()
    })

    it('should not warn when maxListeners is 0 (unlimited)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      emitter.setMaxListeners(0)
      for (let i = 0; i < 20; i++) {
        emitter.on('click', vi.fn())
      }

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('once', () => {
    it('should register one-time handler', () => {
      const handler = vi.fn()
      emitter.once('click', handler)
      expect(emitter.listenerCount('click')).toBe(1)
    })

    it('should call handler only once', () => {
      const handler = vi.fn()
      emitter.once('click', handler)

      emitter.emit('click', { x: 10, y: 20 })
      emitter.emit('click', { x: 30, y: 40 })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ x: 10, y: 20 })
    })

    it('should remove handler after first call', () => {
      const handler = vi.fn()
      emitter.once('click', handler)

      emitter.emit('click', { x: 10, y: 20 })
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('should support multiple once handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      emitter.once('click', handler1)
      emitter.once('click', handler2)

      emitter.emit('click', { x: 10, y: 20 })
      emitter.emit('click', { x: 30, y: 40 })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should work with void events', () => {
      const handler = vi.fn()
      emitter.once('close', handler)
      emitter.emit('close')
      emitter.emit('close')
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should return this for chaining', () => {
      const handler = vi.fn()
      const result = emitter.once('click', handler)
      expect(result).toBe(emitter)
    })
  })

  describe('off', () => {
    it('should remove registered handler', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.off('click', handler)
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('should not affect other handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      emitter.on('click', handler1)
      emitter.on('click', handler2)

      emitter.off('click', handler1)

      emitter.emit('click', { x: 10, y: 20 })
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should do nothing if handler not found', () => {
      const handler = vi.fn()
      emitter.off('click', handler)
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('should remove once handler', () => {
      const handler = vi.fn()
      emitter.once('click', handler)
      emitter.off('click', handler)
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('should return this for chaining', () => {
      const handler = vi.fn()
      const result = emitter.off('click', handler)
      expect(result).toBe(emitter)
    })

    it('should clean up empty handler sets', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.off('click', handler)
      expect(emitter.eventNames()).not.toContain('click')
    })
  })

  describe('removeAllListeners', () => {
    it('should remove all listeners for an event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      emitter.on('click', handler1)
      emitter.on('click', handler2)

      emitter.removeAllListeners('click')

      expect(emitter.listenerCount('click')).toBe(0)
      expect(emitter.eventNames()).not.toContain('click')
    })

    it('should remove all listeners for all events when no event specified', () => {
      const clickHandler = vi.fn()
      const changeHandler = vi.fn()

      emitter.on('click', clickHandler)
      emitter.on('change', changeHandler)

      emitter.removeAllListeners()

      expect(emitter.listenerCount('click')).toBe(0)
      expect(emitter.listenerCount('change')).toBe(0)
      expect(emitter.eventNames()).toHaveLength(0)
    })

    it('should return this for chaining', () => {
      const result = emitter.removeAllListeners()
      expect(result).toBe(emitter)
    })

    it('should clear once wrappers when removing all', () => {
      const handler = vi.fn()
      emitter.once('click', handler)
      emitter.removeAllListeners()

      // Should not call handler on subsequent emits
      emitter.emit('click', { x: 10, y: 20 })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should clear warned events when removing all', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      emitter.setMaxListeners(1)
      emitter.on('click', vi.fn())
      emitter.on('click', vi.fn()) // Triggers warning

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

      emitter.removeAllListeners()

      // Add handlers again - should warn again
      emitter.on('click', vi.fn())
      emitter.on('click', vi.fn())

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)

      consoleWarnSpy.mockRestore()
    })
  })

  describe('emit', () => {
    it('should call handlers with event data', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.emit('click', { x: 10, y: 20 })
      expect(handler).toHaveBeenCalledWith({ x: 10, y: 20 })
    })

    it('should return true if event had listeners', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      expect(emitter.emit('click', { x: 10, y: 20 })).toBe(true)
    })

    it('should return false if event had no listeners', () => {
      expect(emitter.emit('click', { x: 10, y: 20 })).toBe(false)
    })

    it('should catch and log handler errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const goodHandler = vi.fn()
      const badHandler = vi.fn(() => {
        throw new Error('Handler error')
      })

      emitter.on('click', goodHandler)
      emitter.on('click', badHandler)

      emitter.emit('click', { x: 10, y: 20 })

      expect(goodHandler).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should continue calling handlers after error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const handler1 = vi.fn(() => {
        throw new Error('Error 1')
      })
      const handler2 = vi.fn()
      const handler3 = vi.fn(() => {
        throw new Error('Error 2')
      })

      emitter.on('click', handler1)
      emitter.on('click', handler2)
      emitter.on('click', handler3)

      emitter.emit('click', { x: 10, y: 20 })

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle handlers that modify the listener set', () => {
      const handler1 = vi.fn(() => {
        emitter.off('click', handler2)
      })
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      emitter.on('click', handler1)
      emitter.on('click', handler2)
      emitter.on('click', handler3)

      emitter.emit('click', { x: 10, y: 20 })

      expect(handler1).toHaveBeenCalled()
      // handler2 might still be called since we iterate over a copy
      expect(handler3).toHaveBeenCalled()
    })

    it('should support void events', () => {
      const handler = vi.fn()
      emitter.on('close', handler)
      emitter.emit('close')
      expect(handler).toHaveBeenCalled()
    })

    it('should support complex data types', () => {
      const handler = vi.fn()
      emitter.on('data', handler)
      const dataArray = [1, 2, 3, 4, 5]
      emitter.emit('data', dataArray)
      expect(handler).toHaveBeenCalledWith(dataArray)
    })

    it('should support error events', () => {
      const handler = vi.fn()
      emitter.on('error', handler)
      const error = new Error('Test error')
      emitter.emit('error', error)
      expect(handler).toHaveBeenCalledWith(error)
    })
  })

  describe('listenerCount', () => {
    it('should return 0 for event with no listeners', () => {
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('should return correct count', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      emitter.on('click', handler1)
      expect(emitter.listenerCount('click')).toBe(1)

      emitter.on('click', handler2)
      expect(emitter.listenerCount('click')).toBe(2)

      emitter.once('click', handler3)
      expect(emitter.listenerCount('click')).toBe(3)
    })

    it('should update when handlers are removed', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      expect(emitter.listenerCount('click')).toBe(1)

      emitter.off('click', handler)
      expect(emitter.listenerCount('click')).toBe(0)
    })
  })

  describe('eventNames', () => {
    it('should return empty array when no events registered', () => {
      expect(emitter.eventNames()).toEqual([])
    })

    it('should return all event names with listeners', () => {
      const clickHandler = vi.fn()
      const changeHandler = vi.fn()
      const closeHandler = vi.fn()

      emitter.on('click', clickHandler)
      emitter.on('change', changeHandler)
      emitter.on('close', closeHandler)

      const names = emitter.eventNames()
      expect(names).toContain('click')
      expect(names).toContain('change')
      expect(names).toContain('close')
      expect(names).toHaveLength(3)
    })

    it('should not include events with no listeners', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.off('click', handler)

      expect(emitter.eventNames()).not.toContain('click')
    })
  })

  describe('listeners', () => {
    it('should return empty array for event with no listeners', () => {
      expect(emitter.listeners('click')).toEqual([])
    })

    it('should return all listeners for an event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      emitter.on('click', handler1)
      emitter.on('click', handler2)

      const listeners = emitter.listeners('click')
      expect(listeners).toHaveLength(2)
      expect(listeners).toContain(handler1)
      expect(listeners).toContain(handler2)
    })

    it('should return copy of listeners (not reference)', () => {
      const handler = vi.fn()
      emitter.on('click', handler)

      const listeners = emitter.listeners('click')
      listeners.push(vi.fn())

      expect(emitter.listenerCount('click')).toBe(1)
    })
  })

  describe('setMaxListeners / getMaxListeners', () => {
    it('should set max listeners', () => {
      emitter.setMaxListeners(5)
      expect(emitter.getMaxListeners()).toBe(5)
    })

    it('should allow setting to 0 (unlimited)', () => {
      emitter.setMaxListeners(0)
      expect(emitter.getMaxListeners()).toBe(0)
    })

    it('should have default max listeners', () => {
      expect(emitter.getMaxListeners()).toBe(10)
    })

    it('should return this for chaining', () => {
      const result = emitter.setMaxListeners(5)
      expect(result).toBe(emitter)
    })
  })

  describe('addListener / removeListener (aliases)', () => {
    it('addListener should be alias for on', () => {
      const handler = vi.fn()
      emitter.addListener('click', handler)
      expect(emitter.listenerCount('click')).toBe(1)
    })

    it('removeListener should be alias for off', () => {
      const handler = vi.fn()
      emitter.on('click', handler)
      emitter.removeListener('click', handler)
      expect(emitter.listenerCount('click')).toBe(0)
    })

    it('aliases should return this for chaining', () => {
      const handler = vi.fn()
      expect(emitter.addListener('click', handler)).toBe(emitter)
      expect(emitter.removeListener('click', handler)).toBe(emitter)
    })
  })

  describe('dispose', () => {
    it('should clear all event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      emitter.on('click', handler1)
      emitter.on('change', handler2)
      emitter.once('close', handler1)

      emitter.dispose()

      expect(emitter.eventNames()).toHaveLength(0)
      expect(emitter.listenerCount('click')).toBe(0)
      expect(emitter.listenerCount('change')).toBe(0)
    })

    it('should clear once wrappers', () => {
      const handler = vi.fn()
      emitter.once('click', handler)
      emitter.dispose()

      // After dispose, once handler shouldn't work
      emitter.emit('click', { x: 10, y: 20 })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should clear warned events set', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      emitter.setMaxListeners(1)
      emitter.on('click', vi.fn())
      emitter.on('click', vi.fn()) // Triggers warning

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

      emitter.dispose()

      // After dispose, should be able to add listeners without warning
      // (since warned set was cleared)
      emitter.setMaxListeners(1)
      emitter.on('click', vi.fn())
      emitter.on('click', vi.fn())

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)

      consoleWarnSpy.mockRestore()
    })

    it('should return void', () => {
      expect(emitter.dispose()).toBeUndefined()
    })
  })

  describe('integration tests', () => {
    it('should handle complex emit scenarios', () => {
      const results: string[] = []

      emitter.on('click', () => {
        results.push('handler1')
      })

      emitter.once('click', () => {
        results.push('handler2')
      })

      emitter.on('click', () => {
        results.push('handler3')
      })

      emitter.emit('click', { x: 10, y: 20 })
      expect(results).toEqual(['handler1', 'handler2', 'handler3'])

      emitter.emit('click', { x: 30, y: 40 })
      expect(results).toEqual(['handler1', 'handler2', 'handler3', 'handler1', 'handler3'])
    })

    it('should support removing handlers during emit', () => {
      const handler1 = vi.fn(() => {
        emitter.off('click', handler1)
      })
      const handler2 = vi.fn()

      emitter.on('click', handler1)
      emitter.on('click', handler2)

      emitter.emit('click', { x: 10, y: 20 })
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      emitter.emit('click', { x: 30, y: 40 })
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2)
    })
  })
})

describe('createEventEmitter', () => {
  it('should create new EventEmitter instance', () => {
    const emitter = createEventEmitter<TestEvents>()
    expect(emitter).toBeInstanceOf(EventEmitter)
  })

  it('should create independent instances', () => {
    const emitter1 = createEventEmitter<TestEvents>()
    const emitter2 = createEventEmitter<TestEvents>()

    const handler = vi.fn()
    emitter1.on('click', handler)

    emitter1.emit('click', { x: 10, y: 20 })
    emitter2.emit('click', { x: 10, y: 20 })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should work without generic type', () => {
    const emitter = createEventEmitter()
    // Should compile and work
    expect(emitter).toBeInstanceOf(EventEmitter)
  })
})

describe('IEventEmitter interface', () => {
  it('EventEmitter should implement IEventEmitter', () => {
    const emitter: IEventEmitter<TestEvents> = new EventEmitter<TestEvents>()

    const handler = vi.fn()
    emitter.on('click', handler)
    emitter.emit('click', { x: 10, y: 20 })

    expect(handler).toHaveBeenCalled()
  })
})

describe('type safety', () => {
  it('should enforce correct event data types', () => {
    const emitter = new EventEmitter<TestEvents>()

    const clickHandler = vi.fn()
    const changeHandler = vi.fn()
    const closeHandler = vi.fn()

    emitter.on('click', clickHandler)
    emitter.on('change', changeHandler)
    emitter.on('close', closeHandler)

    emitter.emit('click', { x: 10, y: 20 })
    emitter.emit('change', 'test')
    emitter.emit('close')

    expect(clickHandler).toHaveBeenCalledWith({ x: 10, y: 20 })
    expect(changeHandler).toHaveBeenCalledWith('test')
    expect(closeHandler).toHaveBeenCalled()
  })
})
