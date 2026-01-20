/**
 * @oxog/tui - Modal Widget Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { modal, alertDialog, confirmDialog, inputDialog } from '../../src/widgets/modal'
import { text } from '../../src/widgets/text'
import { createBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Modal Widget', () => {
  describe('factory function', () => {
    it('should create a modal node', () => {
      const m = modal()
      expect(m.type).toBe('modal')
    })

    it('should have a unique id', () => {
      const m1 = modal()
      const m2 = modal()
      expect(m1.id).not.toBe(m2.id)
    })

    it('should accept props', () => {
      const m = modal({
        title: 'Test Modal',
        width: 50,
        height: 20
      })
      expect(m).toBeDefined()
    })

    it('should apply buttons from props', () => {
      const m = modal({
        buttons: [{ label: 'OK', value: 'ok' }]
      })
      expect(m).toBeDefined()
    })

    it('should apply border from props', () => {
      const m = modal({ border: 'double' })
      expect(m).toBeDefined()
    })
  })

  describe('chainable methods', () => {
    it('should set title', () => {
      const m = modal().title('My Modal')
      expect(m).toBeDefined()
    })

    it('should set content', () => {
      const m = modal().content(text('Hello'))
      expect(m).toBeDefined()
    })

    it('should set buttons', () => {
      const m = modal().buttons([
        { label: 'OK', value: 'ok' },
        { label: 'Cancel', value: 'cancel' }
      ])
      expect(m).toBeDefined()
    })

    it('should set width', () => {
      const m = modal().width(60)
      expect(m).toBeDefined()
    })

    it('should set height', () => {
      const m = modal().height(30)
      expect(m).toBeDefined()
    })

    it('should set border', () => {
      const m = modal().border('rounded')
      expect(m).toBeDefined()
    })

    it('should set centered', () => {
      const m = modal().centered(false)
      expect(m).toBeDefined()
    })

    it('should chain multiple methods', () => {
      const m = modal()
        .title('Test')
        .content(text('Content'))
        .buttons([{ label: 'OK', value: 'ok' }])
        .width(50)
        .height(20)

      expect(m).toBeDefined()
    })
  })

  describe('open/close control', () => {
    it('should start closed', () => {
      const m = modal()
      expect(m.isOpen).toBe(false)
    })

    it('should open the modal', () => {
      const m = modal()
      m.open()
      expect(m.isOpen).toBe(true)
    })

    it('should close the modal', () => {
      const m = modal()
      m.open()
      m.close()
      expect(m.isOpen).toBe(false)
    })

    it('should not emit close when already closed', () => {
      const handler = vi.fn()
      const m = modal().onClose(handler)
      m.close()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should emit close event', () => {
      const handler = vi.fn()
      const m = modal().onClose(handler)
      m.open()
      m.close()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('button selection', () => {
    it('should select next button', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      expect(m.selectedButtonIndex).toBe(0)
      m.selectNextButton()
      expect(m.selectedButtonIndex).toBe(1)
    })

    it('should select previous button', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      m.selectNextButton()
      expect(m.selectedButtonIndex).toBe(1)
      m.selectPreviousButton()
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should wrap around when selecting next', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      m.selectNextButton()
      m.selectNextButton()
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should wrap around when selecting previous', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      m.selectPreviousButton()
      expect(m.selectedButtonIndex).toBe(1)
    })

    it('should confirm selected button', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(handler)
        .open()

      m.confirm()
      expect(handler).toHaveBeenCalledWith('ok')
      expect(m.isOpen).toBe(false)
    })

    it('should not confirm when no buttons', () => {
      const handler = vi.fn()
      const m = modal().onButton(handler).open()

      m.confirm()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('keyboard handling', () => {
    it('should close on Escape', () => {
      const m = modal().open()
      const result = (m as any).handleKey('escape', false)
      expect(result).toBe(true)
      expect(m.isOpen).toBe(false)
    })

    it('should confirm on Enter', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(handler)
        .open()

      const result = (m as any).handleKey('enter', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should navigate buttons with Tab', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      ;(m as any).handleKey('tab', false)
      expect(m.selectedButtonIndex).toBe(1)
    })

    it('should navigate buttons with arrows', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      ;(m as any).handleKey('right', false)
      expect(m.selectedButtonIndex).toBe(1)

      ;(m as any).handleKey('left', false)
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should not handle keys when closed', () => {
      const m = modal()
      const result = (m as any).handleKey('escape', false)
      expect(result).toBe(false)
    })

    it('should return false for unknown keys', () => {
      const m = modal().open()
      const result = (m as any).handleKey('a', false)
      expect(result).toBe(false)
    })

    it('should confirm on Space', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(handler)
        .open()

      const result = (m as any).handleKey('space', false)
      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('should navigate buttons with h/l keys', () => {
      const m = modal()
        .buttons([
          { label: 'OK', value: 'ok' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      ;(m as any).handleKey('l', false)
      expect(m.selectedButtonIndex).toBe(1)

      ;(m as any).handleKey('h', false)
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should auto-close on cancel button', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'Cancel', value: 'cancel' }])
        .onButton(handler)
        .open()

      ;(m as any).handleKey('enter', false)
      expect(handler).toHaveBeenCalledWith('cancel')
      expect(m.isOpen).toBe(false)
    })

    it('should auto-close on close button', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'Close', value: 'close' }])
        .onButton(handler)
        .open()

      ;(m as any).handleKey('space', false)
      expect(handler).toHaveBeenCalledWith('close')
      expect(m.isOpen).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('should close on backdrop click', () => {
      const m = modal().open()
      // Bounds represent the modal area - click outside it to trigger backdrop close
      ;(m as any)._bounds = { x: 10, y: 5, width: 60, height: 14 }

      // Click outside modal bounds (0,0 is outside the 10,5 start)
      const result = (m as any).handleMouse(0, 0, 'press')
      expect(result).toBe(true)
      expect(m.isOpen).toBe(false)
    })

    it('should not close on backdrop click when disabled', () => {
      const m = modal().closeOnBackdrop(false).open()
      ;(m as any)._bounds = { x: 10, y: 5, width: 60, height: 14 }

      // Click outside modal bounds
      const result = (m as any).handleMouse(0, 0, 'press')
      expect(result).toBe(false)
      expect(m.isOpen).toBe(true)
    })

    it('should not handle mouse when closed', () => {
      const m = modal()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const result = (m as any).handleMouse(0, 0, 'press')
      expect(result).toBe(false)
    })

    it('should not close on mouse move', () => {
      const m = modal().open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const result = (m as any).handleMouse(0, 0, 'move')
      expect(result).toBe(false)
      expect(m.isOpen).toBe(true)
    })
  })

  describe('render', () => {
    it('should render open modal', () => {
      const m = modal()
        .title('Test')
        .content(text('Hello'))
        .buttons([{ label: 'OK', value: 'ok' }])
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check that something was rendered (modal renders at center, ~40x12)
      // Check center area for non-space content
      let hasContent = false
      for (let y = 8; y < 16; y++) {
        for (let x = 25; x < 55; x++) {
          const cell = buffer.get(x, y)
          if (cell && cell.char !== ' ') {
            hasContent = true
            break
          }
        }
        if (hasContent) break
      }
      expect(hasContent).toBe(true)
    })

    it('should not render closed modal', () => {
      const m = modal().title('Hidden')

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check that buffer is still default (spaces)
      expect(buffer.get(40, 12)?.char).toBe(' ')
    })

    it('should render with different border styles', () => {
      const styles = ['single', 'double', 'rounded', 'bold'] as const

      for (const style of styles) {
        const m = modal().title('Test').border(style).open()

        const buffer = createBuffer(80, 24)
        m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

        // Just verify it doesn't throw
        expect(buffer).toBeDefined()
      }
    })

    it('should render multiple buttons', () => {
      const m = modal()
        .buttons([
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Cancel', value: 'cancel' }
        ])
        .open()

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Just verify it renders without error
      expect(buffer).toBeDefined()
    })
  })

  describe('helper dialogs', () => {
    it('should create alert dialog', () => {
      const handler = vi.fn()
      const m = alertDialog('Alert', 'This is a message', handler)

      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should create alert dialog without handler', () => {
      const m = alertDialog('Alert', 'This is a message')
      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should create confirm dialog', () => {
      const handler = vi.fn()
      const m = confirmDialog('Confirm', 'Are you sure?', handler)

      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should create confirm dialog without handler', () => {
      const m = confirmDialog('Confirm', 'Are you sure?')
      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should handle confirm dialog result', () => {
      const handler = vi.fn()
      const m = confirmDialog('Confirm', 'Are you sure?', handler)

      // The 'Confirm' button is primary, so it's selected by default
      m.confirm()
      expect(handler).toHaveBeenCalledWith(true)
    })

    it('should handle confirm dialog cancel', () => {
      const handler = vi.fn()
      const m = confirmDialog('Confirm', 'Are you sure?', handler)

      // Select Cancel button (Cancel is at index 0, Confirm is at index 1 which is primary/default)
      m.selectPreviousButton()
      m.confirm()
      expect(handler).toHaveBeenCalledWith(false)
    })

    it('should create input dialog', () => {
      const handler = vi.fn()
      const m = inputDialog('Input', 'Enter value:', handler)

      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should create input dialog without handler', () => {
      const m = inputDialog('Input', 'Enter value:')
      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })

    it('should create input dialog with default placeholder', () => {
      const m = inputDialog('Input')
      expect(m.type).toBe('modal')
      expect(m.isOpen).toBe(true)
    })
  })
})
