/**
 * @oxog/tui - Event Emitter Utility
 * @packageDocumentation
 *
 * Type-safe event emitter for widget event handling.
 */

// ============================================================
// Types
// ============================================================

/**
 * Event handler function type.
 */
export type EventHandler<T = void> = T extends void ? () => void : (data: T) => void

/**
 * Event map type for type-safe event definitions.
 */
export type EventMap = Record<string, unknown>

/**
 * Event emitter interface.
 */
export interface IEventEmitter<E extends EventMap> {
  /**
   * Register an event handler.
   */
  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this

  /**
   * Register a one-time event handler.
   */
  once<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this

  /**
   * Remove an event handler.
   */
  off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this

  /**
   * Remove all handlers for an event, or all handlers if no event specified.
   */
  removeAllListeners<K extends keyof E>(event?: K): this

  /**
   * Emit an event to all handlers.
   */
  emit<K extends keyof E>(event: K, ...args: E[K] extends void ? [] : [E[K]]): boolean

  /**
   * Get the number of listeners for an event.
   */
  listenerCount<K extends keyof E>(event: K): number

  /**
   * Get all event names that have listeners.
   */
  eventNames(): (keyof E)[]
}

// ============================================================
// Implementation
// ============================================================

/**
 * Maximum number of listeners per event (to detect memory leaks).
 */
const DEFAULT_MAX_LISTENERS = 10

/**
 * Type-safe event emitter implementation.
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   click: { x: number; y: number }
 *   change: string
 *   close: void
 * }
 *
 * class MyWidget extends EventEmitter<MyEvents> {
 *   doSomething() {
 *     this.emit('click', { x: 10, y: 20 })
 *     this.emit('change', 'new value')
 *     this.emit('close')
 *   }
 * }
 *
 * const widget = new MyWidget()
 * widget.on('click', ({ x, y }) => console.log(x, y))
 * widget.on('change', value => console.log(value))
 * widget.on('close', () => console.log('closed'))
 * ```
 */
export class EventEmitter<E extends EventMap = EventMap> implements IEventEmitter<E> {
  private _events: Map<keyof E, Set<EventHandler<unknown>>> = new Map()
  private _onceWrappers: Map<EventHandler<unknown>, EventHandler<unknown>> = new Map()
  private _maxListeners: number = DEFAULT_MAX_LISTENERS
  private _warnedEvents: Set<keyof E> = new Set()

  /**
   * Set the maximum number of listeners per event.
   * Setting to 0 means unlimited.
   */
  setMaxListeners(n: number): this {
    this._maxListeners = n
    return this
  }

  /**
   * Get the maximum number of listeners per event.
   */
  getMaxListeners(): number {
    return this._maxListeners
  }

  /**
   * Register an event handler.
   */
  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this {
    let handlers = this._events.get(event)
    if (!handlers) {
      handlers = new Set()
      this._events.set(event, handlers)
    }

    handlers.add(handler as EventHandler<unknown>)

    // Warn about potential memory leaks
    if (
      this._maxListeners > 0 &&
      handlers.size > this._maxListeners &&
      !this._warnedEvents.has(event)
    ) {
      this._warnedEvents.add(event)
      console.warn(
        `EventEmitter: Possible memory leak detected. ` +
          `${handlers.size} listeners added for event "${String(event)}". ` +
          `Use setMaxListeners() to increase the limit.`
      )
    }

    return this
  }

  /**
   * Register a one-time event handler.
   * The handler will be automatically removed after it fires once.
   */
  once<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this {
    const wrapper = ((...args: unknown[]) => {
      this.off(event, wrapper as EventHandler<E[K]>)
      ;(handler as Function).apply(this, args)
    }) as EventHandler<E[K]>

    this._onceWrappers.set(handler as EventHandler<unknown>, wrapper as EventHandler<unknown>)
    return this.on(event, wrapper)
  }

  /**
   * Remove an event handler.
   */
  off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this {
    const handlers = this._events.get(event)
    if (!handlers) return this

    // Check if this was registered with once()
    const wrapper = this._onceWrappers.get(handler as EventHandler<unknown>)
    if (wrapper) {
      handlers.delete(wrapper)
      this._onceWrappers.delete(handler as EventHandler<unknown>)
    } else {
      handlers.delete(handler as EventHandler<unknown>)
    }

    // Clean up empty sets
    if (handlers.size === 0) {
      this._events.delete(event)
      this._warnedEvents.delete(event)
    }

    return this
  }

  /**
   * Remove all handlers for an event, or all handlers if no event specified.
   */
  removeAllListeners<K extends keyof E>(event?: K): this {
    if (event !== undefined) {
      this._events.delete(event)
      this._warnedEvents.delete(event)
    } else {
      this._events.clear()
      this._onceWrappers.clear()
      this._warnedEvents.clear()
    }
    return this
  }

  /**
   * Emit an event to all handlers.
   * Returns true if the event had listeners, false otherwise.
   */
  emit<K extends keyof E>(event: K, ...args: E[K] extends void ? [] : [E[K]]): boolean {
    const handlers = this._events.get(event)
    if (!handlers || handlers.size === 0) return false

    // Copy handlers to array to avoid issues if handlers modify the set
    const handlersCopy = Array.from(handlers)

    for (const handler of handlersCopy) {
      try {
        ;(handler as Function).apply(this, args)
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`Error in event handler for "${String(event)}":`, error)
      }
    }

    return true
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount<K extends keyof E>(event: K): number {
    return this._events.get(event)?.size ?? 0
  }

  /**
   * Get all event names that have listeners.
   */
  eventNames(): (keyof E)[] {
    return Array.from(this._events.keys())
  }

  /**
   * Get all listeners for an event.
   */
  listeners<K extends keyof E>(event: K): EventHandler<E[K]>[] {
    const handlers = this._events.get(event)
    return handlers ? (Array.from(handlers) as EventHandler<E[K]>[]) : []
  }

  /**
   * Add an alias for `on` method (Node.js compatibility).
   */
  addListener<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this {
    return this.on(event, handler)
  }

  /**
   * Add an alias for `off` method (Node.js compatibility).
   */
  removeListener<K extends keyof E>(event: K, handler: EventHandler<E[K]>): this {
    return this.off(event, handler)
  }

  /**
   * Dispose of all event listeners.
   * Should be called when the emitter is no longer needed.
   */
  dispose(): void {
    this._events.clear()
    this._onceWrappers.clear()
    this._warnedEvents.clear()
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a new event emitter.
 *
 * @example
 * ```typescript
 * interface Events {
 *   data: string
 *   error: Error
 *   end: void
 * }
 *
 * const emitter = createEventEmitter<Events>()
 * emitter.on('data', data => console.log(data))
 * emitter.emit('data', 'hello')
 * ```
 */
export function createEventEmitter<E extends EventMap = EventMap>(): EventEmitter<E> {
  return new EventEmitter<E>()
}
