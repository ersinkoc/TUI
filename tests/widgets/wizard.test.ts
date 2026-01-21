/**
 * Wizard widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { wizard, text } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Wizard Widget', () => {
  describe('creation', () => {
    it('creates a wizard with default properties', () => {
      const w = wizard()
      expect(w.type).toBe('wizard')
      expect(w.stepCount).toBe(0)
      expect(w.currentStepId).toBeNull()
    })

    it('creates a wizard with steps', () => {
      const w = wizard({
        steps: [
          { id: 's1', title: 'Step 1', content: text('Content 1') },
          { id: 's2', title: 'Step 2', content: text('Content 2') }
        ]
      })
      expect(w.stepCount).toBe(2)
    })
  })

  describe('configuration', () => {
    it('sets steps', () => {
      const w = wizard().steps([
        { id: 's1', title: 'Step 1', content: text('Content 1') },
        { id: 's2', title: 'Step 2', content: text('Content 2') }
      ])
      expect(w.stepCount).toBe(2)
    })

    it('adds a step', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
      expect(w.stepCount).toBe(1)
    })

    it('removes a step', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .removeStep('s1')
      expect(w.stepCount).toBe(1)
    })

    it('sets orientation', () => {
      const w = wizard().orientation('vertical')
      expect(w.type).toBe('wizard')
    })

    it('sets show numbers', () => {
      const w = wizard().showNumbers(true)
      expect(w.type).toBe('wizard')
    })

    it('sets allow skip', () => {
      const w = wizard().allowSkip(true)
      expect(w.type).toBe('wizard')
    })

    it('sets show descriptions', () => {
      const w = wizard().showDescriptions(true)
      expect(w.type).toBe('wizard')
    })
  })

  describe('navigation', () => {
    it('goes to next step', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      expect(w.currentStepId).toBe('s1')
      await w.next()
      expect(w.currentStepId).toBe('s2')
    })

    it('goes to previous step', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.next()
      expect(w.currentStepId).toBe('s2')
      w.previous()
      expect(w.currentStepId).toBe('s1')
    })

    it('goes to specific step', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .addStep({ id: 's3', title: 'Step 3', content: text('Content 3') })

      await w.goTo('s3')
      expect(w.currentStepId).toBe('s3')
    })

    it('skips current step', async () => {
      const w = wizard({ allowSkip: true })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1'), optional: true })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.skip()
      expect(w.currentStepId).toBe('s2')
    })

    it('resets wizard', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.next()
      expect(w.currentStepId).toBe('s2')
      w.reset()
      expect(w.currentStepId).toBe('s1')
    })

    it('cannot go past last step without completing', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      await w.next()
      expect(w.currentStepId).toBe('s1') // Still on last step
    })

    it('cannot go before first step', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.previous()
      expect(w.currentStepId).toBe('s1')
    })
  })

  describe('validation', () => {
    it('validates step before next', async () => {
      const validator = vi.fn().mockResolvedValue(true)
      const w = wizard()
        .addStep({
          id: 's1',
          title: 'Step 1',
          content: text('Content 1'),
          validate: validator
        })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.next()
      expect(validator).toHaveBeenCalled()
      expect(w.currentStepId).toBe('s2')
    })

    it('blocks next on validation failure', async () => {
      const validator = vi.fn().mockResolvedValue(false)
      const w = wizard()
        .addStep({
          id: 's1',
          title: 'Step 1',
          content: text('Content 1'),
          validate: validator
        })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.next()
      expect(w.currentStepId).toBe('s1') // Should stay on step 1
    })
  })

  describe('step status', () => {
    it('marks step as completed', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      await w.next()
      const status = w.stepStatuses.get('s1')
      expect(status).toBe('completed')
    })

    it('marks current step as current', () => {
      // Using steps() method initializes statuses correctly
      const w = wizard().steps([
        { id: 's1', title: 'Step 1', content: text('Content 1') }
      ])

      const status = w.stepStatuses.get('s1')
      expect(status).toBe('current')
    })

    it('marks unvisited steps as pending', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      const status = w.stepStatuses.get('s2')
      expect(status).toBe('pending')
    })
  })

  describe('events', () => {
    it('emits onStepChange when step changes', async () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onStepChange(handler)

      await w.next()
      expect(handler).toHaveBeenCalledWith(1, 's2')
    })

    it('emits onComplete when wizard completes', async () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .onComplete(handler)

      await w.next() // Complete single-step wizard
      expect(handler).toHaveBeenCalled()
    })

    it('emits onValidationError on validation failure', async () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({
          id: 's1',
          title: 'Step 1',
          content: text('Content 1'),
          validate: async () => false
        })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onValidationError(handler)

      await w.next()
      expect(handler).toHaveBeenCalledWith('s1')
    })

  })

  describe('state properties', () => {
    it('returns current step index', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      expect(w.currentStepIndex).toBe(0)
    })

    it('returns isFirstStep correctly', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      expect(w.isFirstStep).toBe(true)
      await w.next()
      expect(w.isFirstStep).toBe(false)
    })

    it('returns isLastStep correctly', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      expect(w.isLastStep).toBe(false)
      await w.next()
      expect(w.isLastStep).toBe(true)
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty wizard', () => {
      const w = wizard()
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders wizard with steps', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal wizard', () => {
      const w = wizard({ orientation: 'horizontal' })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical wizard', () => {
      const w = wizard({ orientation: 'vertical' })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const w = wizard()
      ;(w as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const w = wizard().visible(false)
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', async () => {
      const w = wizard()
        .orientation('horizontal')
        .showNumbers(true)
        .allowSkip(false)
        .showDescriptions(true)
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      expect(w.type).toBe('wizard')
      expect(w.stepCount).toBe(2)

      await w.next()
      expect(w.currentStepId).toBe('s2')

      w.previous()
      expect(w.currentStepId).toBe('s1')
    })
  })

  describe('goTo with string id', () => {
    it('navigates to step by string id', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .addStep({ id: 's3', title: 'Step 3', content: text('Content 3') })

      w.goTo('s2')
      expect(w.currentStepId).toBe('s2')
    })

    it('does nothing for invalid step id', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.goTo('nonexistent')
      expect(w.currentStepId).toBe('s1') // Stays on current
    })

    it('navigates to step by number index', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.goTo(1)
      expect(w.currentStepId).toBe('s2')
    })

    it('handles out of bounds index', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.goTo(10)
      expect(w.currentStepId).toBe('s1')

      w.goTo(-1)
      expect(w.currentStepId).toBe('s1')
    })
  })

  describe('skip edge cases', () => {
    it('does not skip when allowSkip is false', () => {
      const w = wizard({ allowSkip: false })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1'), optional: true })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.skip()
      expect(w.currentStepId).toBe('s1') // Still on first step
    })

    it('does not skip non-optional step', () => {
      const w = wizard({ allowSkip: true })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') }) // Not optional
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.skip()
      expect(w.currentStepId).toBe('s1')
    })

    it('skips on last step marks as skipped but stays', () => {
      const w = wizard({ allowSkip: true })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1'), optional: true })

      w.skip()
      // On last step, skip marks as skipped but doesn't advance
      expect(w.stepStatuses.get('s1')).toBe('skipped')
    })
  })

  describe('step status methods', () => {
    it('setStepStatus sets status correctly', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.setStepStatus('s1', 'error')
      expect(w.stepStatuses.get('s1')).toBe('error')
    })

    it('setStepStatus does nothing for non-existent step', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.setStepStatus('nonexistent', 'error')
      // Should not crash
      expect(w.type).toBe('wizard')
    })

    it('completeStep marks step as completed', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.completeStep('s1')
      expect(w.stepStatuses.get('s1')).toBe('completed')
    })

    it('errorStep marks step as error', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.errorStep('s1')
      expect(w.stepStatuses.get('s1')).toBe('error')
    })
  })

  describe('removeStep edge cases', () => {
    it('adjusts currentStep when removing current step', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .goTo(1)

      expect(w.currentStepId).toBe('s2')
      w.removeStep('s2')
      expect(w.currentStepIndex).toBe(0)
    })

    it('handles removeStep when only one step remains', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .removeStep('s1')

      expect(w.stepCount).toBe(0)
      expect(w.currentStepId).toBeNull()
    })

    it('handles removeStep that does not exist', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .removeStep('nonexistent')

      expect(w.stepCount).toBe(1)
    })
  })

  describe('previous with allowBack false', () => {
    it('does not go previous when allowBack is false', () => {
      const w = wizard({ allowBack: false })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .goTo(1)

      w.previous()
      expect(w.currentStepId).toBe('s2') // Stays on step 2
    })
  })

  describe('rendering all statuses', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders steps with all status types', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .addStep({ id: 's3', title: 'Step 3', content: text('Content 3'), optional: true })
        .addStep({ id: 's4', title: 'Step 4', content: text('Content 4') })

      // Mark steps with various statuses
      await w.next() // s1 -> completed, s2 -> current
      w.setStepStatus('s3', 'skipped')
      w.setStepStatus('s4', 'error')

      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with custom icons', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1'), icon: '📝' })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2'), icon: '✅' })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with showNumbers false', () => {
      const w = wizard({ showNumbers: false })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical with descriptions', () => {
      const w = wizard({ orientation: 'vertical', showDescriptions: true })
        .addStep({
          id: 's1',
          title: 'Step 1',
          description: 'This is the first step description',
          content: text('Content 1')
        })
        .addStep({
          id: 's2',
          title: 'Step 2',
          description: 'Second step description',
          content: text('Content 2')
        })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal with showDescriptions', () => {
      const w = wizard({ orientation: 'horizontal', showDescriptions: true })
        .addStep({ id: 's1', title: 'Step 1', description: 'Desc 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', description: 'Desc 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal without showDescriptions', () => {
      const w = wizard({ orientation: 'horizontal', showDescriptions: false })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with long title truncation', () => {
      const w = wizard()
        .addStep({
          id: 's1',
          title: 'This is a very very very long step title that needs to be truncated',
          content: text('Content 1')
        })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
      ;(w as any)._bounds = { x: 0, y: 0, width: 30, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical with long description truncation', () => {
      const w = wizard({ orientation: 'vertical', showDescriptions: true })
        .addStep({
          id: 's1',
          title: 'Step 1',
          description: 'This is a very long description that needs truncation',
          content: text('Content 1')
        })
      ;(w as any)._bounds = { x: 0, y: 0, width: 30, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders vertical with many steps limited by height', () => {
      const w = wizard({ orientation: 'vertical', showDescriptions: false })
      for (let i = 0; i < 20; i++) {
        w.addStep({ id: `s${i}`, title: `Step ${i}`, content: text(`Content ${i}`) })
      }
      ;(w as any)._bounds = { x: 0, y: 0, width, height: 10 }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('navigation with step change event', () => {
    it('goTo emits step change', () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onStepChange(handler)

      w.goTo(1)
      expect(handler).toHaveBeenCalledWith(1, 's2')
    })

    it('skip emits step change when moving', () => {
      const handler = vi.fn()
      const w = wizard({ allowSkip: true })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1'), optional: true })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onStepChange(handler)

      w.skip()
      expect(handler).toHaveBeenCalledWith(1, 's2')
    })

    it('previous emits step change', async () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onStepChange(handler)

      await w.next()
      handler.mockClear()

      w.previous()
      expect(handler).toHaveBeenCalledWith(0, 's1')
    })

    it('reset emits step change', async () => {
      const handler = vi.fn()
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .onStepChange(handler)

      await w.next()
      handler.mockClear()

      w.reset()
      expect(handler).toHaveBeenCalledWith(0, 's1')
    })
  })

  describe('initial props', () => {
    it('creates wizard with all props', () => {
      const w = wizard({
        steps: [
          { id: 's1', title: 'Step 1', content: text('Content 1') },
          { id: 's2', title: 'Step 2', content: text('Content 2') }
        ],
        currentStep: 1,
        showNumbers: false,
        showDescriptions: false,
        orientation: 'vertical',
        allowBack: false,
        allowSkip: false
      })

      expect(w.currentStepIndex).toBe(1)
      expect(w.stepCount).toBe(2)
    })

    it('sets first step to current when steps provided', () => {
      const w = wizard({
        steps: [
          { id: 's1', title: 'Step 1', content: text('Content 1') }
        ]
      })
      expect(w.stepStatuses.get('s1')).toBe('current')
    })
  })

  describe('steps method clears old steps', () => {
    it('clears previous steps when setting new ones', () => {
      const oldContent = text('Old')
      const w = wizard()
        .addStep({ id: 'old', title: 'Old', content: oldContent })
        .steps([
          { id: 's1', title: 'New 1', content: text('New 1') },
          { id: 's2', title: 'New 2', content: text('New 2') }
        ])

      expect(w.stepCount).toBe(2)
      expect(w.currentStepId).toBe('s1')
    })
  })

  describe('goTo from completed step', () => {
    it('marks current as pending when going to another step', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .addStep({ id: 's3', title: 'Step 3', content: text('Content 3') })

      await w.next() // s1 completed, s2 current
      w.goTo(0) // Go back to s1

      // s2 should become pending since it was current and we left
      expect(w.stepStatuses.get('s2')).toBe('pending')
    })
  })

  describe('dispose', () => {
    it('clears handlers on dispose', () => {
      const stepHandler = vi.fn()
      const completeHandler = vi.fn()
      const validationHandler = vi.fn()

      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .onStepChange(stepHandler)
        .onComplete(completeHandler)
        .onValidationError(validationHandler)

      w.dispose()

      // Should be safe to call after dispose
      w.setStepStatus('s1', 'completed')
      // After dispose, the step is removed so get returns undefined
      expect(w.stepStatuses.get('s1')).toBeUndefined()
    })

    it('is idempotent', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.dispose()
      w.dispose() // Should not error

      expect(w.isDisposed).toBe(true)
    })

    it('removes parent reference from step content', () => {
      const content = text('Content')
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: content })

      expect((content as any)._parent).toBe(w)

      w.dispose()

      expect((content as any)._parent).toBeNull()
    })
  })

  describe('concurrent navigation', () => {
    it('prevents concurrent navigation to next', async () => {
      const w = wizard()
        .addStep({
          id: 's1',
          title: 'Step 1',
          content: text('Content 1'),
          validate: async () => {
            // Simulate long-running validation
            await new Promise(resolve => setTimeout(resolve, 100))
            return true
          }
        })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      // Start first navigation
      const promise1 = w.next()

      // Try to navigate again while first is in progress
      const result2 = await w.next()

      // Second navigation should return false due to guard
      expect(result2).toBe(false)

      // First navigation should complete
      await promise1
      expect(w.currentStepId).toBe('s2')
    })

    it('handles finally block on completion', async () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      // Complete the wizard (last step)
      const result = await w.next()

      expect(result).toBe(true)
      // Navigation flag should be cleared
      // This allows the test to complete without issues
    })
  })

  describe('goTo edge cases', () => {
    it('handles NaN in goTo', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.goTo(NaN)
      expect(w.currentStepId).toBe('s1') // Should stay on current
    })

    it('handles Infinity in goTo', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.goTo(Infinity)
      expect(w.currentStepId).toBe('s1') // Should stay on current
    })

    it('handles -Infinity in goTo', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.goTo(-Infinity)
      expect(w.currentStepId).toBe('s1') // Should stay on current
    })

    it('handles empty string in goTo', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })

      w.goTo('')
      expect(w.currentStepId).toBe('s1') // Should stay on current
    })

    it('handles decimal numbers in goTo', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.goTo(1.7) // Should floor to 1
      expect(w.currentStepId).toBe('s2')
    })
  })

  describe('render edge cases', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles empty wizard with no steps', () => {
      const w = wizard()
      ;(w as any)._bounds = { x: 0, y: 0, width, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not crash
    })

    it('handles horizontal render with zero step width', () => {
      const w = wizard({ orientation: 'horizontal' })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
      ;(w as any)._bounds = { x: 0, y: 0, width: 1, height } // Too narrow
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not crash
    })

    it('handles vertical render with negative content width', () => {
      const w = wizard({ orientation: 'vertical' })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
      ;(w as any)._bounds = { x: 0, y: 0, width: 10, height } // Too narrow for vertical layout
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not crash
    })

    it('handles vertical render with exactly indicator width', () => {
      const w = wizard({ orientation: 'vertical' })
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
      ;(w as any)._bounds = { x: 0, y: 0, width: 21, height } // indicatorWidth(20) + 1 = 21, contentWidth = 0
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not crash (contentWidth <= 0 check)
    })

    it('handles many steps in horizontal with very small width', () => {
      const w = wizard({ orientation: 'horizontal' })
      for (let i = 0; i < 10; i++) {
        w.addStep({ id: `s${i}`, title: `Step ${i}`, content: text(`Content ${i}`) })
      }
      ;(w as any)._bounds = { x: 0, y: 0, width: 5, height }
      w.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      // Should not crash (stepWidth would be 0)
    })
  })

  describe('allowBack method', () => {
    it('sets allowBack property', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .goTo(1)

      w.allowBack(false)
      w.previous()

      expect(w.currentStepId).toBe('s2') // Should not go back
    })

    it('allows navigation back when enabled', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })
        .goTo(1)

      w.allowBack(true)
      w.previous()

      expect(w.currentStepId).toBe('s1') // Should go back
    })
  })

  describe('steps method clears step statuses', () => {
    it('clears old step statuses when setting new steps', () => {
      const w = wizard()
        .addStep({ id: 's1', title: 'Step 1', content: text('Content 1') })
        .addStep({ id: 's2', title: 'Step 2', content: text('Content 2') })

      w.setStepStatus('s1', 'error')
      w.setStepStatus('s2', 'skipped')

      w.steps([{ id: 's3', title: 'Step 3', content: text('Content 3') }])

      expect(w.stepStatuses.has('s1')).toBe(false)
      expect(w.stepStatuses.has('s2')).toBe(false)
      expect(w.stepStatuses.get('s3')).toBe('current')
    })
  })
})
