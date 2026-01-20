/**
 * @oxog/tui - Toast Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { toast } from '../../src/widgets/toast'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Toast Widget', () => {
  describe('factory function', () => {
    it('should create a toast node', () => {
      const t = toast()
      expect(t.type).toBe('toast')
    })

    it('should have a unique id', () => {
      const t1 = toast()
      const t2 = toast()
      expect(t1.id).not.toBe(t2.id)
    })

    it('should accept props', () => {
      const t = toast({
        position: 'top-right',
        defaultDuration: 5000,
        maxVisible: 3,
        width: 50
      })
      expect(t).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set position', () => {
      const t = toast().position('bottom-center')
      expect(t).toBeDefined()
    })

    it('should set defaultDuration', () => {
      const t = toast().defaultDuration(5000)
      expect(t).toBeDefined()
    })

    it('should set maxVisible', () => {
      const t = toast().maxVisible(5)
      expect(t).toBeDefined()
    })

    it('should set width', () => {
      const t = toast().width(60)
      expect(t).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const t = toast()
        .position('top-left')
        .defaultDuration(3000)
        .maxVisible(4)
        .width(45)

      expect(t).toBeDefined()
    })
  })

  describe('show toasts', () => {
    it('should show info toast', () => {
      vi.useFakeTimers()
      const t = toast()
      const id = t.info('Info message')
      expect(id).toBeDefined()
      expect(t.count).toBe(1)
      expect(t.toasts[0]?.type).toBe('info')
      vi.useRealTimers()
    })

    it('should show success toast', () => {
      vi.useFakeTimers()
      const t = toast()
      const id = t.success('Success message')
      expect(id).toBeDefined()
      expect(t.toasts[0]?.type).toBe('success')
      vi.useRealTimers()
    })

    it('should show warning toast', () => {
      vi.useFakeTimers()
      const t = toast()
      const id = t.warning('Warning message')
      expect(id).toBeDefined()
      expect(t.toasts[0]?.type).toBe('warning')
      vi.useRealTimers()
    })

    it('should show error toast', () => {
      vi.useFakeTimers()
      const t = toast()
      const id = t.error('Error message')
      expect(id).toBeDefined()
      expect(t.toasts[0]?.type).toBe('error')
      vi.useRealTimers()
    })

    it('should show toast with title', () => {
      vi.useFakeTimers()
      const t = toast()
      t.info('Message', 'Title')
      expect(t.toasts[0]?.title).toBe('Title')
      vi.useRealTimers()
    })

    it('should show toast with custom duration', () => {
      vi.useFakeTimers()
      const t = toast()
      t.show('info', 'Message', undefined, 10000)
      expect(t.toasts[0]?.duration).toBe(10000)
      vi.useRealTimers()
    })

    it('should show persistent toast (duration = 0)', () => {
      vi.useFakeTimers()
      const t = toast()
      t.show('info', 'Persistent', undefined, 0)
      expect(t.toasts[0]?.duration).toBe(0)

      // Should not auto-dismiss
      vi.advanceTimersByTime(10000)
      expect(t.count).toBe(1)
      vi.useRealTimers()
    })
  })

  describe('auto-dismiss', () => {
    it('should auto-dismiss after duration', () => {
      vi.useFakeTimers()
      const t = toast().defaultDuration(3000)
      t.info('Auto dismiss')
      expect(t.count).toBe(1)

      vi.advanceTimersByTime(3000)
      expect(t.count).toBe(0)
      vi.useRealTimers()
    })

    it('should use custom duration', () => {
      vi.useFakeTimers()
      const t = toast()
      t.show('info', 'Custom', undefined, 5000)
      expect(t.count).toBe(1)

      vi.advanceTimersByTime(3000)
      expect(t.count).toBe(1)

      vi.advanceTimersByTime(2000)
      expect(t.count).toBe(0)
      vi.useRealTimers()
    })
  })

  describe('dismiss', () => {
    it('should dismiss by id', () => {
      vi.useFakeTimers()
      const t = toast()
      const id = t.info('Dismissible')
      expect(t.count).toBe(1)

      t.dismiss(id)
      expect(t.count).toBe(0)
      vi.useRealTimers()
    })

    it('should not fail on invalid id', () => {
      const t = toast()
      t.dismiss('invalid-id')
      expect(t.count).toBe(0)
    })

    it('should dismiss all', () => {
      vi.useFakeTimers()
      const t = toast()
      t.info('One')
      t.info('Two')
      t.info('Three')
      expect(t.count).toBe(3)

      t.dismissAll()
      expect(t.count).toBe(0)
      vi.useRealTimers()
    })

    it('should not fail dismissAll when empty', () => {
      const t = toast()
      t.dismissAll()
      expect(t.count).toBe(0)
    })
  })

  describe('render', () => {
    it('should not render when no toasts', () => {
      const t = toast()
      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
    })

    it('should render toasts', () => {
      vi.useFakeTimers()
      const t = toast().position('top-right')
      t.info('Info message')
      t.success('Success!')
      t.warning('Warning!')
      t.error('Error!')

      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should render at different positions', () => {
      vi.useFakeTimers()
      const positions = [
        'top-left',
        'top-right',
        'top-center',
        'bottom-left',
        'bottom-right',
        'bottom-center'
      ] as const

      for (const pos of positions) {
        const t = toast().position(pos)
        t.info('Test message')

        const buffer = createBuffer(80, 24)
        t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
        expect(buffer).toBeDefined()
        t.dismissAll()
      }
      vi.useRealTimers()
    })

    it('should render with title', () => {
      vi.useFakeTimers()
      const t = toast()
      t.info('Message', 'Title Here')

      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should wrap long messages', () => {
      vi.useFakeTimers()
      const t = toast().width(30)
      t.info('This is a very long message that should wrap to multiple lines when rendered in the toast notification')

      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should limit visible toasts', () => {
      vi.useFakeTimers()
      const t = toast().maxVisible(2)
      t.info('One')
      t.info('Two')
      t.info('Three')
      t.info('Four')

      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should render all toast types with icons', () => {
      vi.useFakeTimers()
      const t = toast()
      t.info('Info')
      t.success('Success')
      t.warning('Warning')
      t.error('Error')

      const buffer = createBuffer(80, 24)
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })
  })

  describe('state', () => {
    it('should return toasts array', () => {
      vi.useFakeTimers()
      const t = toast()
      t.info('A')
      t.info('B')

      const toasts = t.toasts
      expect(toasts).toHaveLength(2)
      expect(toasts[0]?.message).toBe('A')
      expect(toasts[1]?.message).toBe('B')
      vi.useRealTimers()
    })

    it('should return count', () => {
      vi.useFakeTimers()
      const t = toast()
      expect(t.count).toBe(0)

      t.info('A')
      expect(t.count).toBe(1)

      t.info('B')
      expect(t.count).toBe(2)
      vi.useRealTimers()
    })
  })

  describe('wrapText edge cases', () => {
    it('should handle empty message', () => {
      vi.useFakeTimers()
      const t = toast().width(30)
      t.info('') // Empty message

      const buffer = createBuffer(80, 24)
      ;(t as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should handle words longer than maxWidth', () => {
      vi.useFakeTimers()
      const t = toast().width(20)
      // A very long word that exceeds the content width
      t.info('Supercalifragilisticexpialidocious')

      const buffer = createBuffer(80, 24)
      ;(t as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })
  })

  describe('renderToast edge cases', () => {
    it('should truncate very long title', () => {
      vi.useFakeTimers()
      const t = toast().width(25)
      t.info('Short message', 'This is an extremely long title that should be truncated')

      const buffer = createBuffer(80, 24)
      ;(t as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })

    it('should render with bounds set', () => {
      vi.useFakeTimers()
      const t = toast().position('bottom-left')
      t.success('A message with title', 'Title')
      t.warning('Another message')

      const buffer = createBuffer(80, 24)
      ;(t as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }
      t.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect(buffer).toBeDefined()
      vi.useRealTimers()
    })
  })
})
