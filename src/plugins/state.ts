/**
 * @oxog/tui - State Management Plugin
 * @packageDocumentation
 *
 * Elm/Redux-inspired state management for TUI applications.
 * Provides predictable state updates, action history, and time-travel debugging.
 */

import type { Plugin, TUIApp } from '../types'

// ============================================================
// Types
// ============================================================

/**
 * Action interface for state updates.
 */
export interface Action<T = unknown> {
  /** Action type identifier */
  type: string
  /** Action payload */
  payload?: T
  /** Timestamp when action was dispatched */
  timestamp?: number
}

/**
 * Reducer function that produces new state from action.
 */
export type Reducer<S> = (state: S, action: Action) => S

/**
 * Selector function to derive data from state.
 */
export type Selector<S, R> = (state: S) => R

/**
 * Middleware function for intercepting actions.
 */
export type Middleware<S> = (
  store: Store<S>,
  action: Action,
  next: (action: Action) => void
) => void

/**
 * Subscription listener function.
 */
export type Listener<S> = (state: S, prevState: S) => void

/**
 * Store interface for state management.
 */
export interface Store<S> {
  /** Get current state */
  getState(): S
  /** Dispatch an action */
  dispatch(action: Action): void
  /** Subscribe to state changes */
  subscribe(listener: Listener<S>): () => void
  /** Subscribe to specific slice of state */
  select<R>(selector: Selector<S, R>, listener: (value: R, prevValue: R) => void): () => void
  /** Get action history */
  getHistory(): Action[]
  /** Time travel to a specific action index */
  timeTravel(index: number): void
  /** Reset state to initial */
  reset(): void
  /** Replace reducer (for hot reloading) */
  replaceReducer(reducer: Reducer<S>): void
}

/**
 * Store options.
 */
export interface StoreOptions<S> {
  /** Initial state */
  initialState: S
  /** Root reducer */
  reducer: Reducer<S>
  /** Middleware chain */
  middleware?: Middleware<S>[]
  /** Enable history tracking */
  enableHistory?: boolean
  /** Maximum history size */
  maxHistorySize?: number
  /** Enable dev tools */
  devTools?: boolean
}

/**
 * State plugin options.
 */
export interface StatePluginOptions {
  /** Enable debug logging */
  debug?: boolean
  /** Auto-trigger re-render on state change */
  autoRender?: boolean
}

/**
 * State plugin API exposed to the app.
 */
export interface StatePluginAPI {
  /** Create a new store */
  createStore<S>(options: StoreOptions<S>): Store<S>
  /** Get a store by name */
  getStore<S>(name: string): Store<S> | undefined
  /** Register a named store */
  registerStore<S>(name: string, store: Store<S>): void
  /** Unregister a store */
  unregisterStore(name: string): void
  /** Get all store names */
  getStoreNames(): string[]
}

// ============================================================
// Built-in Action Types
// ============================================================

/**
 * Built-in action types.
 */
export const ActionTypes = {
  /** Initialize state */
  INIT: '@@state/INIT',
  /** Reset state */
  RESET: '@@state/RESET',
  /** Time travel */
  TIME_TRAVEL: '@@state/TIME_TRAVEL'
} as const

// ============================================================
// Store Implementation
// ============================================================

/**
 * Create a store with the given options.
 */
function createStoreImpl<S>(options: StoreOptions<S>, onStateChange?: () => void): Store<S> {
  const {
    initialState,
    reducer,
    middleware = [],
    enableHistory = true,
    maxHistorySize = 100,
    devTools = false
  } = options

  let currentState = initialState
  let currentReducer = reducer
  const listeners = new Set<Listener<S>>()
  const selectorListeners = new Map<Selector<S, unknown>, Set<(value: unknown, prev: unknown) => void>>()
  const history: Action[] = []
  let historyIndex = -1

  /**
   * Get current state.
   */
  function getState(): S {
    return currentState
  }

  /**
   * Dispatch an action through middleware chain.
   * Fixed: Each middleware call gets its own index to prevent race conditions
   * Fixed: Prevents double-dispatch by tracking if next() was already called
   */
  function dispatch(action: Action): void {
    // Add timestamp
    const timedAction: Action = {
      ...action,
      timestamp: Date.now()
    }

    // Track which middleware indices have called next() for this dispatch
    // This prevents a middleware from calling next() multiple times
    const nextCalledSet = new Set<number>()

    // Build middleware chain with proper index isolation
    // Each call to buildChain creates a new function with its own captured index
    const buildChain = (currentIndex: number): ((a: Action) => void) => {
      return (a: Action): void => {
        // Prevent double-dispatch: if next() already called for this index, ignore
        if (nextCalledSet.has(currentIndex)) {
          if (devTools) {
            console.warn(
              `[state] Middleware at index ${currentIndex} called next() multiple times. ` +
              `Ignoring duplicate call to prevent double-dispatch.`
            )
          }
          return
        }
        nextCalledSet.add(currentIndex)

        if (currentIndex < middleware.length) {
          const mw = middleware[currentIndex]
          if (mw) {
            // Pass the next handler in the chain (with incremented index)
            mw(store, a, buildChain(currentIndex + 1))
          } else {
            applyAction(a)
          }
        } else {
          // End of chain - apply reducer
          applyAction(a)
        }
      }
    }

    if (middleware.length > 0) {
      buildChain(0)(timedAction)
    } else {
      applyAction(timedAction)
    }
  }

  /**
   * Apply action to state via reducer.
   */
  function applyAction(action: Action): void {
    const prevState = currentState
    currentState = currentReducer(currentState, action)

    // Track history
    if (enableHistory && action.type !== ActionTypes.TIME_TRAVEL) {
      // If we're not at the end of history, truncate forward history
      if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1)
      }
      history.push(action)
      historyIndex = history.length - 1

      // Trim history if needed
      if (history.length > maxHistorySize) {
        history.shift()
        // Keep historyIndex pointing to the last item
        historyIndex = history.length - 1
      }
    }

    // Notify listeners
    notifyListeners(prevState)

    // Dev tools logging
    if (devTools) {
      console.log('[state]', action.type, action.payload, '->', currentState)
    }

    // Trigger re-render
    if (onStateChange) {
      onStateChange()
    }
  }

  /**
   * Notify all listeners of state change.
   * Fixed: Uses snapshots to prevent modification during iteration
   * Fixed: Adds error handling so one failing listener doesn't crash others
   */
  function notifyListeners(prevState: S): void {
    // Snapshot global listeners to prevent modification during iteration
    const listenersSnapshot = Array.from(listeners)
    for (const listener of listenersSnapshot) {
      // Check if listener is still subscribed (could be removed by another listener)
      if (listeners.has(listener)) {
        try {
          listener(currentState, prevState)
        } catch (err) {
          if (devTools) {
            console.error('[state] Listener error:', err)
          }
        }
      }
    }

    // Snapshot selector listeners to prevent modification during iteration
    const selectorListenersSnapshot = Array.from(selectorListeners.entries())
    for (const [selector, selectorSet] of selectorListenersSnapshot) {
      // Check if selector is still registered
      if (!selectorListeners.has(selector)) continue

      try {
        const prevValue = selector(prevState)
        const newValue = selector(currentState)

        // Only notify if selected value changed
        if (!Object.is(prevValue, newValue)) {
          // Snapshot the listener set
          const setSnapshot = Array.from(selectorSet)
          for (const listener of setSnapshot) {
            // Check if listener is still subscribed
            if (selectorSet.has(listener)) {
              try {
                listener(newValue, prevValue)
              } catch (err) {
                if (devTools) {
                  console.error('[state] Selector listener error:', err)
                }
              }
            }
          }
        }
      } catch (err) {
        if (devTools) {
          console.error('[state] Selector error:', err)
        }
      }
    }
  }

  /**
   * Subscribe to all state changes.
   */
  function subscribe(listener: Listener<S>): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Subscribe to specific slice of state.
   */
  function select<R>(
    selector: Selector<S, R>,
    listener: (value: R, prevValue: R) => void
  ): () => void {
    if (!selectorListeners.has(selector)) {
      selectorListeners.set(selector, new Set())
    }
    const set = selectorListeners.get(selector)!
    set.add(listener as (value: unknown, prev: unknown) => void)

    return () => {
      set.delete(listener as (value: unknown, prev: unknown) => void)
      if (set.size === 0) {
        selectorListeners.delete(selector)
      }
    }
  }

  /**
   * Get action history.
   */
  function getHistory(): Action[] {
    return [...history]
  }

  /**
   * Time travel to a specific action index.
   */
  function timeTravel(index: number): void {
    if (index < 0 || index >= history.length) {
      return
    }

    // Replay actions from beginning
    const prevState = currentState
    currentState = initialState

    for (let i = 0; i <= index; i++) {
      const action = history[i]
      if (action) {
        currentState = currentReducer(currentState, action)
      }
    }

    historyIndex = index
    notifyListeners(prevState)

    if (onStateChange) {
      onStateChange()
    }
  }

  /**
   * Reset state to initial.
   */
  function reset(): void {
    const prevState = currentState
    currentState = initialState
    history.length = 0
    historyIndex = -1

    notifyListeners(prevState)

    if (onStateChange) {
      onStateChange()
    }
  }

  /**
   * Replace reducer (for hot reloading).
   */
  function replaceReducer(newReducer: Reducer<S>): void {
    currentReducer = newReducer
  }

  const store: Store<S> = {
    getState,
    dispatch,
    subscribe,
    select,
    getHistory,
    timeTravel,
    reset,
    replaceReducer
  }

  // Initialize
  dispatch({ type: ActionTypes.INIT })

  return store
}

// ============================================================
// Plugin Implementation
// ============================================================

/**
 * Create the state management plugin.
 *
 * @param options - Plugin options
 * @returns State management plugin
 *
 * @example
 * ```typescript
 * import { tui } from '@oxog/tui'
 * import { statePlugin } from '@oxog/tui/plugins'
 *
 * // Define state type
 * interface AppState {
 *   count: number
 *   todos: { id: string; text: string; done: boolean }[]
 * }
 *
 * // Define reducer
 * const reducer = (state: AppState, action: Action): AppState => {
 *   switch (action.type) {
 *     case 'INCREMENT':
 *       return { ...state, count: state.count + 1 }
 *     case 'ADD_TODO':
 *       return { ...state, todos: [...state.todos, action.payload] }
 *     default:
 *       return state
 *   }
 * }
 *
 * const app = tui({
 *   plugins: [statePlugin({ autoRender: true })]
 * })
 *
 * // Create store
 * const store = app.state.createStore({
 *   initialState: { count: 0, todos: [] },
 *   reducer
 * })
 *
 * // Dispatch actions
 * store.dispatch({ type: 'INCREMENT' })
 *
 * // Subscribe to changes
 * store.select(
 *   state => state.count,
 *   count => console.log('Count:', count)
 * )
 * ```
 */
export function statePlugin(options: StatePluginOptions = {}): Plugin {
  const { debug = false, autoRender = true } = options

  let app: TUIApp | null = null
  const stores = new Map<string, Store<unknown>>()
  let defaultStoreCounter = 0

  return {
    name: 'state',
    version: '1.0.0',

    install(tuiApp: TUIApp): void {
      app = tuiApp

      const onStateChange = autoRender
        ? () => {
            app?.markDirty()
          }
        : undefined

      // Expose API on app
      ;(tuiApp as TUIApp & { state: StatePluginAPI }).state = {
        createStore: <S>(storeOptions: StoreOptions<S>): Store<S> => {
          const store = createStoreImpl(storeOptions, onStateChange)

          // Auto-register with generated name
          const name = `store_${defaultStoreCounter++}`
          stores.set(name, store as Store<unknown>)

          if (debug) {
            console.error(`[state] Created store: ${name}`)
          }

          return store
        },

        getStore: <S>(name: string): Store<S> | undefined => {
          return stores.get(name) as Store<S> | undefined
        },

        registerStore: <S>(name: string, store: Store<S>): void => {
          stores.set(name, store as Store<unknown>)
          if (debug) {
            console.error(`[state] Registered store: ${name}`)
          }
        },

        unregisterStore: (name: string): void => {
          stores.delete(name)
          if (debug) {
            console.error(`[state] Unregistered store: ${name}`)
          }
        },

        getStoreNames: (): string[] => {
          return Array.from(stores.keys())
        }
      }
    },

    destroy(): void {
      stores.clear()
      app = null
    }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Combine multiple reducers into a single reducer.
 *
 * @example
 * ```typescript
 * const rootReducer = combineReducers({
 *   todos: todosReducer,
 *   filter: filterReducer
 * })
 * ```
 */
export function combineReducers<S extends Record<string, unknown>>(
  reducers: { [K in keyof S]: Reducer<S[K]> }
): Reducer<S> {
  return (state: S, action: Action): S => {
    let hasChanged = false
    const nextState = {} as S

    for (const key of Object.keys(reducers) as (keyof S)[]) {
      const reducer = reducers[key]
      const prevStateForKey = state[key]
      const nextStateForKey = reducer(prevStateForKey, action)

      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey
    }

    return hasChanged ? nextState : state
  }
}

/**
 * Create an action creator function.
 *
 * @example
 * ```typescript
 * const increment = createAction<number>('INCREMENT')
 * store.dispatch(increment(5))
 * ```
 */
export function createAction<P = void>(type: string): (payload: P) => Action<P>
export function createAction<P = void>(type: string): (payload?: P) => Action<P | undefined>
export function createAction<P = void>(type: string): (payload?: P) => Action<P | undefined> {
  return (payload?: P): Action<P | undefined> => {
    const action: Action<P | undefined> = { type }
    if (payload !== undefined) {
      action.payload = payload
    }
    return action
  }
}

/**
 * Logger middleware for debugging.
 */
export function loggerMiddleware<S>(): Middleware<S> {
  return (store, action, next) => {
    console.log('[state] Action:', action.type, action.payload)
    console.log('[state] Prev state:', store.getState())
    next(action)
    console.log('[state] Next state:', store.getState())
  }
}

/**
 * Thunk middleware for async actions.
 *
 * @example
 * ```typescript
 * // Async action creator
 * const fetchTodos = () => async (dispatch, getState) => {
 *   dispatch({ type: 'FETCH_START' })
 *   try {
 *     const todos = await api.getTodos()
 *     dispatch({ type: 'FETCH_SUCCESS', payload: todos })
 *   } catch (error) {
 *     dispatch({ type: 'FETCH_ERROR', payload: error })
 *   }
 * }
 *
 * // With thunk middleware
 * store.dispatch(fetchTodos() as any)
 * ```
 */
export function thunkMiddleware<S>(): Middleware<S> {
  return (store, action, next) => {
    if (typeof action === 'function') {
      ;(action as (dispatch: (a: Action) => void, getState: () => S) => void)(
        store.dispatch,
        store.getState
      )
    } else {
      next(action)
    }
  }
}

/**
 * Create a selector with memoization.
 *
 * @example
 * ```typescript
 * const selectCompletedTodos = createSelector(
 *   (state: AppState) => state.todos,
 *   todos => todos.filter(t => t.done)
 * )
 * ```
 */
export function createSelector<S, R1, Result>(
  selector1: Selector<S, R1>,
  combiner: (r1: R1) => Result
): Selector<S, Result>
export function createSelector<S, R1, R2, Result>(
  selector1: Selector<S, R1>,
  selector2: Selector<S, R2>,
  combiner: (r1: R1, r2: R2) => Result
): Selector<S, Result>
export function createSelector<S, R1, R2, R3, Result>(
  selector1: Selector<S, R1>,
  selector2: Selector<S, R2>,
  selector3: Selector<S, R3>,
  combiner: (r1: R1, r2: R2, r3: R3) => Result
): Selector<S, Result>
export function createSelector<S>(
  ...args: (Selector<S, unknown> | ((...args: unknown[]) => unknown))[]
): Selector<S, unknown> {
  const selectors = args.slice(0, -1) as Selector<S, unknown>[]
  const combiner = args[args.length - 1] as (...args: unknown[]) => unknown

  let lastInputs: unknown[] | null = null
  let lastResult: unknown = null

  return (state: S): unknown => {
    const inputs = selectors.map(s => s(state))

    // Check if inputs changed
    if (
      lastInputs !== null &&
      inputs.length === lastInputs.length &&
      inputs.every((input, i) => Object.is(input, lastInputs![i]))
    ) {
      return lastResult
    }

    lastInputs = inputs
    lastResult = combiner(...inputs)
    return lastResult
  }
}
