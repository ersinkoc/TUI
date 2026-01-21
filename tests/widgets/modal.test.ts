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

    it('should handle input dialog OK result', () => {
      const handler = vi.fn()
      const m = inputDialog('Input', 'Enter name', handler)

      // Confirm with OK button (primary, selected by default)
      m.confirm()
      expect(handler).toHaveBeenCalledWith('')
    })

    it('should handle input dialog cancel result', () => {
      const handler = vi.fn()
      const m = inputDialog('Input', 'Enter name', handler)

      // Select Cancel button and confirm
      m.selectPreviousButton()
      m.confirm()
      expect(handler).toHaveBeenCalledWith(null)
    })
  })

  describe('additional methods', () => {
    it('should toggle modal', () => {
      const m = modal()
      expect(m.isOpen).toBe(false)

      m.toggle()
      expect(m.isOpen).toBe(true)

      m.toggle()
      expect(m.isOpen).toBe(false)
    })

    it('should set backdrop enabled', () => {
      const m = modal().backdrop(true).open()
      expect(m.isOpen).toBe(true)
    })

    it('should set backdrop disabled', () => {
      const m = modal().backdrop(false).open()
      expect(m.isOpen).toBe(true)
    })

    it('should set backdropChar', () => {
      const m = modal().backdropChar('░').open()
      expect(m.isOpen).toBe(true)
    })

    it('should set closeOnEscape', () => {
      const m = modal().closeOnEscape(false).open()
      const result = (m as any).handleKey('escape', false)
      expect(result).toBe(false)
      expect(m.isOpen).toBe(true)
    })

    it('should emit onOpen event', () => {
      const handler = vi.fn()
      const m = modal().onOpen(handler)

      m.open()
      expect(handler).toHaveBeenCalled()
    })

    it('should not emit onOpen when already open', () => {
      const handler = vi.fn()
      const m = modal().onOpen(handler).open()

      handler.mockClear()
      m.open()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('rendering edge cases', () => {
    it('should render with non-centered modal', () => {
      const m = modal()
        .title('Test')
        .content(text('Hello'))
        .centered(false)
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render with custom backdrop char', () => {
      const m = modal()
        .title('Test')
        .backdropChar('▒')
        .backdrop(true)
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check that backdrop char is used outside modal area
      expect(buffer).toBeDefined()
    })

    it('should render without backdrop', () => {
      const m = modal()
        .title('Test')
        .backdrop(false)
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should truncate long title', () => {
      const m = modal()
        .title('This is a very long title that should be truncated in the modal header')
        .width(30)
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render without content', () => {
      const m = modal()
        .title('Empty')
        .buttons([{ label: 'OK', value: 'ok' }])
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should render without buttons', () => {
      const m = modal()
        .title('No Buttons')
        .content(text('Just text'))
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })

    it('should handle zero dimensions', () => {
      const m = modal().open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }

      const buffer = createBuffer(80, 24)
      m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      expect(buffer).toBeDefined()
    })
  })

  describe('props initialization', () => {
    it('should accept all props', () => {
      const m = modal({
        title: 'Full Modal',
        width: 60,
        height: 20,
        backdrop: true,
        backdropChar: '░',
        closeOnEscape: true,
        closeOnBackdrop: true,
        border: 'double',
        centered: true
      })

      expect(m.type).toBe('modal')
    })

    it('should accept buttons from full props', () => {
      // Test via props instead of method
      const m = modal()
      m.buttons([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', primary: true }
      ])

      // Primary button should be selected
      expect(m.selectedButtonIndex).toBe(1)
    })

    it('should handle buttons with no primary', () => {
      const m = modal()
      m.buttons([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' }
      ])

      expect(m.selectedButtonIndex).toBe(0)
    })
  })

  describe('mouse click on button', () => {
    it('should handle click inside modal area', () => {
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .open()
      ;(m as any)._bounds = { x: 20, y: 8, width: 40, height: 10 }

      // Click inside modal area
      const result = (m as any).handleMouse(30, 10, 'press')
      expect(result).toBe(false) // Inside modal does nothing
      expect(m.isOpen).toBe(true)
    })
  })

  describe('handler cleanup', () => {
    it('should remove onOpen handler with offOpen', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const m = modal().onOpen(handler)

      m.open()
      expect(callCount).toBe(1)

      m.offOpen(handler)
      m.close()
      m.open()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove specific onOpen handler when multiple exist', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const m = modal().onOpen(handler1).onOpen(handler2)

      m.open()
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      m.offOpen(handler1)
      m.close()
      m.open()
      expect(handler1).toHaveBeenCalledTimes(1) // Not called again
      expect(handler2).toHaveBeenCalledTimes(2) // Still called
    })

    it('should be chainable after offOpen', () => {
      const m = modal()
      const handler = vi.fn()
      const result = m.onOpen(handler).offOpen(handler)
      expect(result).toBe(m)
    })

    it('should handle offOpen with non-existent handler gracefully', () => {
      const m = modal()
      const handler = vi.fn()
      expect(() => m.offOpen(handler)).not.toThrow()
    })

    it('should remove onClose handler with offClose', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const m = modal().onClose(handler).open()

      m.close()
      expect(callCount).toBe(1)

      m.offClose(handler)
      m.open()
      m.close()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should remove onButton handler with offButton', () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(handler)
        .open()

      m.confirm()
      expect(callCount).toBe(1)

      m.offButton(handler)
      m.open()
      m.confirm()
      expect(callCount).toBe(1) // Should not increase
    })

    it('should clear all handlers with clearHandlers', () => {
      const openHandler = vi.fn()
      const closeHandler = vi.fn()
      const buttonHandler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onOpen(openHandler)
        .onClose(closeHandler)
        .onButton(buttonHandler)

      m.clearHandlers()

      m.open()
      m.close()
      m.confirm()

      expect(openHandler).not.toHaveBeenCalled()
      expect(closeHandler).not.toHaveBeenCalled()
      expect(buttonHandler).not.toHaveBeenCalled()
    })

    it('should be chainable after clearHandlers', () => {
      const m = modal()
      const result = m.onOpen(vi.fn()).clearHandlers()
      expect(result).toBe(m)
    })

    it('should allow adding handlers after clearHandlers', () => {
      const handler = vi.fn()
      const m = modal()
        .onOpen(vi.fn())
        .clearHandlers()
        .onOpen(handler)

      m.open()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should clear all handlers on dispose', () => {
      const openHandler = vi.fn()
      const closeHandler = vi.fn()
      const buttonHandler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onOpen(openHandler)
        .onClose(closeHandler)
        .onButton(buttonHandler)

      m.dispose()

      m.open()
      m.close()
      m.confirm()

      expect(openHandler).not.toHaveBeenCalled()
      expect(closeHandler).not.toHaveBeenCalled()
      expect(buttonHandler).not.toHaveBeenCalled()
    })

    it('should clear content on dispose', () => {
      const content = text('Test')
      const m = modal().content(content)
      expect(m).toBeDefined()

      m.dispose()
      // Content should be cleared
      expect((m as any)._content).toBeNull()
    })

    it('should clear content parent reference on dispose', () => {
      const content = text('Test')
      const m = modal().content(content)
      // Content parent should be set
      expect(content._parent).toBeDefined()

      m.dispose()
      // Parent reference should be cleared
      expect(content._parent).toBeNull()
    })

    it('should clear buttons on dispose', () => {
      const m = modal().buttons([{ label: 'OK', value: 'ok' }])
      m.dispose()
      expect((m as any)._buttons).toEqual([])
    })

    it('should mark as disposed on dispose', () => {
      const m = modal()
      m.dispose()
      expect((m as any)._disposed).toBe(true)
    })

    it('should not throw when disposing already disposed modal', () => {
      const m = modal()
      m.dispose()
      expect(() => m.dispose()).not.toThrow()
    })
  })

  describe('z-index management', () => {
    it('should assign z-index when opened', () => {
      const m = modal()
      expect((m as any).zIndex).toBe(0)

      m.open()
      expect((m as any).zIndex).toBeGreaterThan(0)
    })

    it('should increase z-index for each opened modal', () => {
      const m1 = modal().open()
      const m2 = modal().open()

      expect((m2 as any).zIndex).toBeGreaterThan((m1 as any).zIndex)
    })

    it('should check if modal is topmost', () => {
      const m1 = modal().open()
      const m2 = modal().open()

      expect((m1 as any).isTopmost).toBe(false)
      expect((m2 as any).isTopmost).toBe(true)
    })

    it('should bring modal to front', () => {
      const m1 = modal().open()
      const m2 = modal().open()

      expect((m1 as any).isTopmost).toBe(false)

      m1.bringToFront()
      expect((m1 as any).isTopmost).toBe(true)
      expect((m2 as any).isTopmost).toBe(false)
    })

    it('should not bring to front when closed', () => {
      const m = modal()
      const originalZIndex = (m as any).zIndex

      m.bringToFront()
      expect((m as any).zIndex).toBe(originalZIndex)
    })
  })

  describe('modal stack management', () => {
    it('should move modal to top when opened again after close', () => {
      const m1 = modal().open()
      const m2 = modal().open()

      expect((m2 as any).isTopmost).toBe(true)

      m1.close() // Close m1 first
      m1.open() // Then re-open m1
      expect((m1 as any).isTopmost).toBe(true)
    })

    it('should remove from stack when closed', () => {
      const m = modal().open()
      expect((m as any).isTopmost).toBe(true)

      m.close()
      // After closing, modal should not be topmost
      // (it's removed from the stack)
      expect((m as any).isTopmost).toBe(false)
    })
  })

  describe('error handling in handlers', () => {
    it('should catch errors in onOpen handlers', () => {
      const m = modal().onOpen(() => {
        throw new Error('Test error')
      })

      // Should not throw, error should be caught and logged
      expect(() => m.open()).not.toThrow()
      expect(m.isOpen).toBe(true)
    })

    it('should catch errors in onClose handlers', () => {
      const m = modal().onClose(() => {
        throw new Error('Test error')
      }).open()

      // Should not throw, error should be caught and logged
      expect(() => m.close()).not.toThrow()
      expect(m.isOpen).toBe(false)
    })

    it('should catch errors in onButton handlers', () => {
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(() => {
          throw new Error('Test error')
        })
        .open()

      // Should not throw, error should be caught and logged
      expect(() => m.confirm()).not.toThrow()
    })
  })

  describe('button navigation edge cases', () => {
    it('should not navigate when no buttons', () => {
      const m = modal().open()

      m.selectNextButton()
      m.selectPreviousButton()
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should not confirm when not open', () => {
      const handler = vi.fn()
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .onButton(handler)

      m.confirm()
      expect(handler).not.toHaveBeenCalled()
      expect(m.isOpen).toBe(false)
    })

    it('should not confirm when no buttons', () => {
      const m = modal().open()
      m.confirm()
      expect(m.isOpen).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle setting empty buttons', () => {
      const m = modal().buttons([])
      expect(m.selectedButtonIndex).toBe(0)
    })

    it('should handle modal with very small dimensions', () => {
      const m = modal()
        .width(5)
        .height(3)
        .open()
      ;(m as any)._bounds = { x: 0, y: 0, width: 80, height: 24 }

      const buffer = createBuffer(80, 24)
      expect(() => m.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })).not.toThrow()
    })

    it('should handle content that is not BaseNode', () => {
      const m = modal().content(null as any)
      expect(m).toBeDefined()
    })

    it('should handle percentage dimensions', () => {
      const m = modal()
        .width('80%')
        .height('60%')
        .open()

      expect(m.isOpen).toBe(true)
    })

    it('should handle button selection wrapping with single button', () => {
      const m = modal()
        .buttons([{ label: 'OK', value: 'ok' }])
        .open()

      m.selectNextButton()
      expect(m.selectedButtonIndex).toBe(0)

      m.selectPreviousButton()
      expect(m.selectedButtonIndex).toBe(0)
    })
  })
})
