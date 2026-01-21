import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  statePlugin,
  combineReducers,
  createAction,
  loggerMiddleware,
  createSelector,
  ActionTypes
} from '../../src/plugins/state'
import type { Action, Reducer, Store } from '../../src/plugins/state'
import type { TUIApp } from '../../src/types'

// Mock TUIApp
function createMockApp(): TUIApp & { state?: unknown } {
  return {
    use: vi.fn().mockReturnThis(),
    mount: vi.fn().mockReturnThis(),
    unmount: vi.fn().mockReturnThis(),
    start: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockReturnThis(),
    markDirty: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    emit: vi.fn(),
    onQuit: vi.fn().mockReturnThis(),
    getPlugin: vi.fn(),
    width: 80,
    height: 24,
    isRunning: false,
    root: null,
    focused: null,
    theme: {} as any
  }
}

describe('statePlugin', () => {
  let app: TUIApp & { state?: unknown }

  beforeEach(() => {
    app = createMockApp()
  })

  describe('installation', () => {
    it('should install and expose state API', () => {
      const plugin = statePlugin()
      plugin.install(app)

      expect(app.state).toBeDefined()
      expect(typeof (app.state as any).createStore).toBe('function')
      expect(typeof (app.state as any).getStore).toBe('function')
      expect(typeof (app.state as any).registerStore).toBe('function')
      expect(typeof (app.state as any).unregisterStore).toBe('function')
      expect(typeof (app.state as any).getStoreNames).toBe('function')
    })

    it('should have correct plugin metadata', () => {
      const plugin = statePlugin()
      expect(plugin.name).toBe('state')
      expect(plugin.version).toBe('1.0.0')
    })

    it('should clean up on destroy', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const stateApi = (app as any).state
      stateApi.createStore({
        initialState: { count: 0 },
        reducer: (s: any) => s
      })

      expect(stateApi.getStoreNames().length).toBe(1)

      plugin.destroy?.()
      expect(stateApi.getStoreNames().length).toBe(0)
    })
  })

  describe('store creation', () => {
    it('should create a store with initial state', () => {
      const plugin = statePlugin()
      plugin.install(app)

      interface TestState {
        count: number
      }

      const reducer: Reducer<TestState> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer
      }) as Store<TestState>

      expect(store.getState()).toEqual({ count: 0 })
    })

    it('should dispatch actions and update state', () => {
      const plugin = statePlugin()
      plugin.install(app)

      interface TestState {
        count: number
      }

      const reducer: Reducer<TestState> = (state, action) => {
        switch (action.type) {
          case 'INCREMENT':
            return { ...state, count: state.count + 1 }
          case 'DECREMENT':
            return { ...state, count: state.count - 1 }
          case 'ADD':
            return { ...state, count: state.count + (action.payload as number) }
          default:
            return state
        }
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer
      }) as Store<TestState>

      store.dispatch({ type: 'INCREMENT' })
      expect(store.getState().count).toBe(1)

      store.dispatch({ type: 'INCREMENT' })
      expect(store.getState().count).toBe(2)

      store.dispatch({ type: 'DECREMENT' })
      expect(store.getState().count).toBe(1)

      store.dispatch({ type: 'ADD', payload: 10 })
      expect(store.getState().count).toBe(11)
    })

    it('should notify subscribers on state change', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const reducer: Reducer<{ count: number }> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer
      }) as Store<{ count: number }>

      const listener = vi.fn()
      store.subscribe(listener)

      store.dispatch({ type: 'INCREMENT' })

      expect(listener).toHaveBeenCalledWith(
        { count: 1 },
        { count: 0 }
      )
    })

    it('should allow unsubscribing', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const reducer: Reducer<{ count: number }> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer
      }) as Store<{ count: number }>

      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      store.dispatch({ type: 'INCREMENT' })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      store.dispatch({ type: 'INCREMENT' })
      expect(listener).toHaveBeenCalledTimes(1) // Not called again
    })
  })

  describe('selectors', () => {
    it('should notify selector listeners only when selected value changes', () => {
      const plugin = statePlugin()
      plugin.install(app)

      interface TestState {
        count: number
        name: string
      }

      const reducer: Reducer<TestState> = (state, action) => {
        switch (action.type) {
          case 'INCREMENT':
            return { ...state, count: state.count + 1 }
          case 'SET_NAME':
            return { ...state, name: action.payload as string }
          default:
            return state
        }
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0, name: 'test' },
        reducer
      }) as Store<TestState>

      const countListener = vi.fn()
      const nameListener = vi.fn()

      store.select((state) => state.count, countListener)
      store.select((state) => state.name, nameListener)

      // Increment - only count listener should be called
      store.dispatch({ type: 'INCREMENT' })
      expect(countListener).toHaveBeenCalledTimes(1)
      expect(nameListener).toHaveBeenCalledTimes(0)

      // Set name - only name listener should be called
      store.dispatch({ type: 'SET_NAME', payload: 'new name' })
      expect(countListener).toHaveBeenCalledTimes(1)
      expect(nameListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('history and time travel', () => {
    it('should track action history', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const reducer: Reducer<{ count: number }> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer,
        enableHistory: true
      }) as Store<{ count: number }>

      store.dispatch({ type: 'INCREMENT' })
      store.dispatch({ type: 'INCREMENT' })
      store.dispatch({ type: 'INCREMENT' })

      const history = store.getHistory()
      expect(history.length).toBe(4) // INIT + 3 INCREMENTs
      expect(history[0].type).toBe(ActionTypes.INIT)
      expect(history[1].type).toBe('INCREMENT')
    })

    it('should support time travel', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const reducer: Reducer<{ count: number }> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer,
        enableHistory: true
      }) as Store<{ count: number }>

      store.dispatch({ type: 'INCREMENT' }) // count = 1
      store.dispatch({ type: 'INCREMENT' }) // count = 2
      store.dispatch({ type: 'INCREMENT' }) // count = 3

      expect(store.getState().count).toBe(3)

      // Time travel to first INCREMENT
      store.timeTravel(1)
      expect(store.getState().count).toBe(1)

      // Time travel to second INCREMENT
      store.timeTravel(2)
      expect(store.getState().count).toBe(2)
    })

    it('should reset state', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const reducer: Reducer<{ count: number }> = (state, action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      }

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer
      }) as Store<{ count: number }>

      store.dispatch({ type: 'INCREMENT' })
      store.dispatch({ type: 'INCREMENT' })
      expect(store.getState().count).toBe(2)

      store.reset()
      expect(store.getState().count).toBe(0)
    })
  })

  describe('store management', () => {
    it('should register and retrieve named stores', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const stateApi = (app as any).state

      const store = stateApi.createStore({
        initialState: { value: 42 },
        reducer: (s: any) => s
      })

      stateApi.registerStore('myStore', store)

      const retrieved = stateApi.getStore('myStore')
      expect(retrieved).toBe(store)
    })

    it('should unregister stores', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const stateApi = (app as any).state

      const store = stateApi.createStore({
        initialState: { value: 42 },
        reducer: (s: any) => s
      })

      stateApi.registerStore('myStore', store)
      expect(stateApi.getStore('myStore')).toBeDefined()

      stateApi.unregisterStore('myStore')
      expect(stateApi.getStore('myStore')).toBeUndefined()
    })

    it('should list store names', () => {
      const plugin = statePlugin()
      plugin.install(app)

      const stateApi = (app as any).state

      stateApi.createStore({ initialState: {}, reducer: (s: any) => s })
      stateApi.createStore({ initialState: {}, reducer: (s: any) => s })

      const names = stateApi.getStoreNames()
      expect(names.length).toBe(2)
    })
  })

  describe('autoRender option', () => {
    it('should call markDirty on state change when autoRender is true', () => {
      const plugin = statePlugin({ autoRender: true })
      plugin.install(app)

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer: (state: any, action: Action) => {
          if (action.type === 'INCREMENT') {
            return { ...state, count: state.count + 1 }
          }
          return state
        }
      })

      // Clear any initial markDirty calls
      ;(app.markDirty as any).mockClear()

      store.dispatch({ type: 'INCREMENT' })

      expect(app.markDirty).toHaveBeenCalled()
    })

    it('should not call markDirty when autoRender is false', () => {
      const plugin = statePlugin({ autoRender: false })
      plugin.install(app)

      const store = (app.state as any).createStore({
        initialState: { count: 0 },
        reducer: (state: any, action: Action) => {
          if (action.type === 'INCREMENT') {
            return { ...state, count: state.count + 1 }
          }
          return state
        }
      })

      ;(app.markDirty as any).mockClear()

      store.dispatch({ type: 'INCREMENT' })

      expect(app.markDirty).not.toHaveBeenCalled()
    })
  })
})

describe('combineReducers', () => {
  it('should combine multiple reducers', () => {
    interface CounterState {
      count: number
    }

    interface NameState {
      name: string
    }

    interface RootState {
      counter: CounterState
      name: NameState
    }

    const counterReducer: Reducer<CounterState> = (state, action) => {
      if (action.type === 'INCREMENT') {
        return { ...state, count: state.count + 1 }
      }
      return state
    }

    const nameReducer: Reducer<NameState> = (state, action) => {
      if (action.type === 'SET_NAME') {
        return { ...state, name: action.payload as string }
      }
      return state
    }

    const rootReducer = combineReducers<RootState>({
      counter: counterReducer,
      name: nameReducer
    })

    let state: RootState = {
      counter: { count: 0 },
      name: { name: 'test' }
    }

    state = rootReducer(state, { type: 'INCREMENT' })
    expect(state.counter.count).toBe(1)
    expect(state.name.name).toBe('test')

    state = rootReducer(state, { type: 'SET_NAME', payload: 'new name' })
    expect(state.counter.count).toBe(1)
    expect(state.name.name).toBe('new name')
  })

  it('should return same state reference if nothing changed', () => {
    const reducer = combineReducers({
      count: (state: number = 0) => state
    })

    const state = { count: 5 }
    const newState = reducer(state, { type: 'UNKNOWN' })

    expect(newState).toBe(state)
  })
})

describe('createAction', () => {
  it('should create action creator', () => {
    const increment = createAction<number>('INCREMENT')

    expect(increment(5)).toEqual({
      type: 'INCREMENT',
      payload: 5
    })
  })

  it('should work without payload', () => {
    const reset = createAction('RESET')

    expect(reset()).toEqual({
      type: 'RESET',
      payload: undefined
    })
  })
})

describe('createSelector', () => {
  it('should memoize results', () => {
    interface State {
      items: number[]
    }

    const selectItems = (state: State) => state.items
    const selectSum = createSelector(selectItems, (items) => {
      return items.reduce((a, b) => a + b, 0)
    })

    const state1: State = { items: [1, 2, 3] }
    const result1 = selectSum(state1)
    expect(result1).toBe(6)

    // Same input reference - should return cached result
    const result2 = selectSum(state1)
    expect(result2).toBe(6)
    expect(result1).toBe(result2)

    // Different input - should recalculate
    const state2: State = { items: [1, 2, 3, 4] }
    const result3 = selectSum(state2)
    expect(result3).toBe(10)
  })

  it('should work with multiple selectors', () => {
    interface State {
      a: number
      b: number
    }

    const selectA = (state: State) => state.a
    const selectB = (state: State) => state.b
    const selectSum = createSelector(selectA, selectB, (a, b) => a + b)

    expect(selectSum({ a: 5, b: 3 })).toBe(8)
    expect(selectSum({ a: 10, b: 20 })).toBe(30)
  })
})

describe('loggerMiddleware', () => {
  it('should log actions to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const app = createMockApp()
    const plugin = statePlugin()
    plugin.install(app)

    const middleware = loggerMiddleware()

    const store = (app.state as any).createStore({
      initialState: { count: 0 },
      reducer: (state: any, action: Action) => {
        if (action.type === 'INCREMENT') {
          return { ...state, count: state.count + 1 }
        }
        return state
      },
      middleware: [middleware]
    })

    store.dispatch({ type: 'INCREMENT' })

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
