/**
 * @oxog/tui - Wizard/Stepper Widget
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode, BaseNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'
import { stringWidth, truncateToWidth } from '../utils/unicode'

// ============================================================
// Types
// ============================================================

/**
 * Wizard step status.
 */
export type StepStatus = 'pending' | 'current' | 'completed' | 'error' | 'skipped'

/**
 * Wizard step configuration.
 */
export interface WizardStep {
  /** Step ID */
  id: string
  /** Step title */
  title: string
  /** Step description */
  description?: string
  /** Step content */
  content: Node
  /** Step icon */
  icon?: string
  /** Step is optional */
  optional?: boolean
  /** Custom validation function */
  validate?: () => boolean | Promise<boolean>
}

/**
 * Wizard widget properties.
 */
export interface WizardProps {
  /** Wizard steps */
  steps?: WizardStep[]
  /** Current step index */
  currentStep?: number
  /** Show step numbers */
  showNumbers?: boolean
  /** Show step descriptions */
  showDescriptions?: boolean
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Allow going back */
  allowBack?: boolean
  /** Allow skipping optional steps */
  allowSkip?: boolean
}

/**
 * Wizard node interface.
 */
export interface WizardNode extends Node {
  readonly type: 'wizard'

  // Configuration
  steps(items: WizardStep[]): this
  addStep(step: WizardStep): this
  removeStep(id: string): this
  showNumbers(enabled: boolean): this
  showDescriptions(enabled: boolean): this
  orientation(value: 'horizontal' | 'vertical'): this
  allowBack(enabled: boolean): this
  allowSkip(enabled: boolean): this

  // Navigation
  next(): Promise<boolean>
  previous(): this
  goTo(step: number | string): this
  skip(): this
  reset(): this

  // Step status
  setStepStatus(id: string, status: StepStatus): this
  completeStep(id: string): this
  errorStep(id: string): this

  // Events
  onStepChange(handler: (step: number, stepId: string) => void): this
  onComplete(handler: () => void): this
  onValidationError(handler: (stepId: string) => void): this

  // State
  readonly currentStepIndex: number
  readonly currentStepId: string | null
  readonly stepCount: number
  readonly isFirstStep: boolean
  readonly isLastStep: boolean
  readonly stepStatuses: Map<string, StepStatus>
}

// ============================================================
// Implementation
// ============================================================

class WizardNodeImpl extends ContainerNode implements WizardNode {
  readonly type = 'wizard' as const

  private _steps: WizardStep[] = []
  private _currentStep: number = 0
  private _showNumbers: boolean = true
  private _showDescriptions: boolean = true
  private _orientation: 'horizontal' | 'vertical' = 'horizontal'
  private _allowBack: boolean = true
  private _allowSkip: boolean = true
  private _stepStatuses: Map<string, StepStatus> = new Map()

  private _onStepChangeHandlers: ((step: number, stepId: string) => void)[] = []
  private _onCompleteHandlers: (() => void)[] = []
  private _onValidationErrorHandlers: ((stepId: string) => void)[] = []

  constructor(props?: WizardProps) {
    super()
    if (props) {
      if (props.steps) {
        this._steps = props.steps
        for (const step of props.steps) {
          if (step.content instanceof BaseNode) {
            step.content._parent = this
          }
          this._stepStatuses.set(step.id, 'pending')
        }
        if (this._steps.length > 0) {
          this._stepStatuses.set(this._steps[0]!.id, 'current')
        }
      }
      if (props.currentStep !== undefined) this._currentStep = props.currentStep
      if (props.showNumbers !== undefined) this._showNumbers = props.showNumbers
      if (props.showDescriptions !== undefined) this._showDescriptions = props.showDescriptions
      if (props.orientation) this._orientation = props.orientation
      if (props.allowBack !== undefined) this._allowBack = props.allowBack
      if (props.allowSkip !== undefined) this._allowSkip = props.allowSkip
    }
  }

  get currentStepIndex(): number {
    return this._currentStep
  }

  get currentStepId(): string | null {
    return this._steps[this._currentStep]?.id ?? null
  }

  get stepCount(): number {
    return this._steps.length
  }

  get isFirstStep(): boolean {
    return this._currentStep === 0
  }

  get isLastStep(): boolean {
    return this._currentStep === this._steps.length - 1
  }

  get stepStatuses(): Map<string, StepStatus> {
    return new Map(this._stepStatuses)
  }

  // Configuration
  steps(items: WizardStep[]): this {
    for (const step of this._steps) {
      if (step.content instanceof BaseNode) {
        step.content._parent = null
      }
    }

    this._steps = items
    this._stepStatuses.clear()

    for (const step of items) {
      if (step.content instanceof BaseNode) {
        step.content._parent = this
      }
      this._stepStatuses.set(step.id, 'pending')
    }

    this._currentStep = 0
    if (this._steps.length > 0) {
      this._stepStatuses.set(this._steps[0]!.id, 'current')
    }

    this.markDirty()
    return this
  }

  addStep(step: WizardStep): this {
    this._steps.push(step)
    if (step.content instanceof BaseNode) {
      step.content._parent = this
    }
    this._stepStatuses.set(step.id, 'pending')
    this.markDirty()
    return this
  }

  removeStep(id: string): this {
    const index = this._steps.findIndex(s => s.id === id)
    if (index !== -1) {
      const step = this._steps[index]!
      if (step.content instanceof BaseNode) {
        step.content._parent = null
      }
      this._steps.splice(index, 1)
      this._stepStatuses.delete(id)

      if (this._currentStep >= this._steps.length) {
        this._currentStep = Math.max(0, this._steps.length - 1)
      }
      this.markDirty()
    }
    return this
  }

  showNumbers(enabled: boolean): this {
    this._showNumbers = enabled
    this.markDirty()
    return this
  }

  showDescriptions(enabled: boolean): this {
    this._showDescriptions = enabled
    this.markDirty()
    return this
  }

  orientation(value: 'horizontal' | 'vertical'): this {
    this._orientation = value
    this.markDirty()
    return this
  }

  allowBack(enabled: boolean): this {
    this._allowBack = enabled
    return this
  }

  allowSkip(enabled: boolean): this {
    this._allowSkip = enabled
    return this
  }

  // Navigation
  async next(): Promise<boolean> {
    if (this._currentStep >= this._steps.length - 1) {
      // Complete wizard
      const currentStepObj = this._steps[this._currentStep]
      if (currentStepObj) {
        this._stepStatuses.set(currentStepObj.id, 'completed')
      }
      for (const handler of this._onCompleteHandlers) {
        handler()
      }
      this.markDirty()
      return true
    }

    const currentStepObj = this._steps[this._currentStep]
    if (currentStepObj?.validate) {
      const isValid = await currentStepObj.validate()
      if (!isValid) {
        this._stepStatuses.set(currentStepObj.id, 'error')
        for (const handler of this._onValidationErrorHandlers) {
          handler(currentStepObj.id)
        }
        this.markDirty()
        return false
      }
    }

    // Mark current as completed
    if (currentStepObj) {
      this._stepStatuses.set(currentStepObj.id, 'completed')
    }

    // Move to next
    this._currentStep++
    const nextStep = this._steps[this._currentStep]
    if (nextStep) {
      this._stepStatuses.set(nextStep.id, 'current')
    }

    this.emitStepChange()
    this.markDirty()
    return true
  }

  previous(): this {
    if (!this._allowBack || this._currentStep <= 0) {
      return this
    }

    const currentStepObj = this._steps[this._currentStep]
    if (currentStepObj) {
      this._stepStatuses.set(currentStepObj.id, 'pending')
    }

    this._currentStep--
    const prevStep = this._steps[this._currentStep]
    if (prevStep) {
      this._stepStatuses.set(prevStep.id, 'current')
    }

    this.emitStepChange()
    this.markDirty()
    return this
  }

  goTo(step: number | string): this {
    let index: number

    if (typeof step === 'number') {
      index = step
    } else {
      index = this._steps.findIndex(s => s.id === step)
    }

    if (index >= 0 && index < this._steps.length) {
      const currentStepObj = this._steps[this._currentStep]
      if (currentStepObj) {
        const status = this._stepStatuses.get(currentStepObj.id)
        if (status === 'current') {
          this._stepStatuses.set(currentStepObj.id, 'pending')
        }
      }

      this._currentStep = index
      const newStep = this._steps[this._currentStep]
      if (newStep) {
        this._stepStatuses.set(newStep.id, 'current')
      }

      this.emitStepChange()
      this.markDirty()
    }
    return this
  }

  skip(): this {
    const currentStepObj = this._steps[this._currentStep]
    if (!this._allowSkip || !currentStepObj?.optional) {
      return this
    }

    this._stepStatuses.set(currentStepObj.id, 'skipped')

    if (this._currentStep < this._steps.length - 1) {
      this._currentStep++
      const nextStep = this._steps[this._currentStep]
      if (nextStep) {
        this._stepStatuses.set(nextStep.id, 'current')
      }
      this.emitStepChange()
    }

    this.markDirty()
    return this
  }

  reset(): this {
    this._currentStep = 0
    this._stepStatuses.clear()

    for (const step of this._steps) {
      this._stepStatuses.set(step.id, 'pending')
    }

    if (this._steps.length > 0) {
      this._stepStatuses.set(this._steps[0]!.id, 'current')
    }

    this.emitStepChange()
    this.markDirty()
    return this
  }

  // Step status
  setStepStatus(id: string, status: StepStatus): this {
    if (this._steps.some(s => s.id === id)) {
      this._stepStatuses.set(id, status)
      this.markDirty()
    }
    return this
  }

  completeStep(id: string): this {
    return this.setStepStatus(id, 'completed')
  }

  errorStep(id: string): this {
    return this.setStepStatus(id, 'error')
  }

  // Events
  onStepChange(handler: (step: number, stepId: string) => void): this {
    this._onStepChangeHandlers.push(handler)
    return this
  }

  onComplete(handler: () => void): this {
    this._onCompleteHandlers.push(handler)
    return this
  }

  onValidationError(handler: (stepId: string) => void): this {
    this._onValidationErrorHandlers.push(handler)
    return this
  }

  private emitStepChange(): void {
    const stepId = this._steps[this._currentStep]?.id ?? ''
    for (const handler of this._onStepChangeHandlers) {
      handler(this._currentStep, stepId)
    }
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    if (this._orientation === 'horizontal') {
      this.renderHorizontal(buffer, x, y, width, height, fg, bg)
    } else {
      this.renderVertical(buffer, x, y, width, height, fg, bg)
    }
  }

  private renderHorizontal(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number
  ): void {
    const headerHeight = this._showDescriptions ? 3 : 2
    const contentY = y + headerHeight
    const contentHeight = height - headerHeight

    // Render step indicators
    const stepWidth = Math.floor(width / this._steps.length)

    for (let i = 0; i < this._steps.length; i++) {
      const step = this._steps[i]!
      const status = this._stepStatuses.get(step.id) ?? 'pending'
      const stepX = x + i * stepWidth

      // Step number/icon
      const indicator = this.getStepIndicator(i, status, step)
      const indicatorAttrs = this.getStatusAttrs(status)
      buffer.write(stepX + Math.floor(stepWidth / 2) - 1, y, indicator, {
        fg, bg, attrs: indicatorAttrs
      })

      // Step title
      let title = step.title
      if (stringWidth(title) > stepWidth - 2) {
        title = truncateToWidth(title, stepWidth - 2)
      }
      const titleX = stepX + Math.floor((stepWidth - stringWidth(title)) / 2)
      buffer.write(titleX, y + 1, title, {
        fg, bg,
        attrs: status === 'current' ? ATTR_BOLD : (status === 'pending' ? ATTR_DIM : 0)
      })

      // Connector line (except for last)
      if (i < this._steps.length - 1) {
        const lineStart = stepX + Math.floor(stepWidth / 2) + 2
        const lineEnd = stepX + stepWidth - 1
        for (let col = lineStart; col < lineEnd; col++) {
          buffer.set(col, y, {
            char: '─',
            fg, bg,
            attrs: status === 'completed' ? 0 : ATTR_DIM
          })
        }
      }
    }

    // Render current step content
    const currentStepObj = this._steps[this._currentStep]
    if (currentStepObj?.content instanceof BaseNode) {
      currentStepObj.content._bounds = {
        x,
        y: contentY,
        width,
        height: contentHeight
      }
      currentStepObj.content.render(buffer, { fg, bg, attrs: 0 })
    }
  }

  private renderVertical(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    fg: number,
    bg: number
  ): void {
    const indicatorWidth = 20
    const contentX = x + indicatorWidth + 1
    const contentWidth = width - indicatorWidth - 1

    // Render step indicators
    let currentY = y
    for (let i = 0; i < this._steps.length && currentY < y + height; i++) {
      const step = this._steps[i]!
      const status = this._stepStatuses.get(step.id) ?? 'pending'

      // Step indicator
      const indicator = this.getStepIndicator(i, status, step)
      const indicatorAttrs = this.getStatusAttrs(status)
      buffer.write(x, currentY, indicator, { fg, bg, attrs: indicatorAttrs })

      // Step title
      let title = step.title
      if (stringWidth(title) > indicatorWidth - 4) {
        title = truncateToWidth(title, indicatorWidth - 4)
      }
      buffer.write(x + 4, currentY, title, {
        fg, bg,
        attrs: status === 'current' ? ATTR_BOLD : (status === 'pending' ? ATTR_DIM : 0)
      })

      // Description
      if (this._showDescriptions && step.description) {
        currentY++
        let desc = step.description
        if (stringWidth(desc) > indicatorWidth - 4) {
          desc = truncateToWidth(desc, indicatorWidth - 4)
        }
        buffer.write(x + 4, currentY, desc, { fg, bg, attrs: ATTR_DIM })
      }

      // Connector (except for last)
      if (i < this._steps.length - 1) {
        currentY++
        buffer.set(x + 1, currentY, {
          char: '│',
          fg, bg,
          attrs: status === 'completed' ? 0 : ATTR_DIM
        })
      }

      currentY++
    }

    // Render current step content
    const currentStepObj = this._steps[this._currentStep]
    if (currentStepObj?.content instanceof BaseNode) {
      currentStepObj.content._bounds = {
        x: contentX,
        y,
        width: contentWidth,
        height
      }
      currentStepObj.content.render(buffer, { fg, bg, attrs: 0 })
    }
  }

  private getStepIndicator(index: number, status: StepStatus, step: WizardStep): string {
    if (step.icon) return step.icon

    switch (status) {
      case 'completed': return '✓'
      case 'error': return '✗'
      case 'skipped': return '○'
      case 'current': return this._showNumbers ? `${index + 1}` : '●'
      default: return this._showNumbers ? `${index + 1}` : '○'
    }
  }

  private getStatusAttrs(status: StepStatus): number {
    switch (status) {
      case 'completed': return ATTR_BOLD
      case 'error': return ATTR_BOLD
      case 'current': return ATTR_INVERSE
      case 'skipped': return ATTR_DIM
      default: return ATTR_DIM
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a wizard/stepper widget.
 *
 * @param props - Wizard properties
 * @returns Wizard node
 *
 * @example
 * ```typescript
 * // Basic wizard
 * const wiz = wizard()
 *   .steps([
 *     { id: 'info', title: 'Personal Info', content: infoForm },
 *     { id: 'address', title: 'Address', content: addressForm },
 *     { id: 'payment', title: 'Payment', content: paymentForm, optional: true },
 *     { id: 'confirm', title: 'Confirm', content: confirmView }
 *   ])
 *   .onStepChange((step, id) => console.log('Step:', id))
 *   .onComplete(() => console.log('Wizard complete!'))
 *
 * // With validation
 * const signup = wizard()
 *   .steps([
 *     {
 *       id: 'account',
 *       title: 'Account',
 *       content: accountForm,
 *       validate: () => emailInput.isValid && passwordInput.isValid
 *     },
 *     { id: 'profile', title: 'Profile', content: profileForm },
 *     { id: 'done', title: 'Complete', content: doneView }
 *   ])
 *
 * // Navigation
 * await wiz.next()  // Validate and go to next step
 * wiz.previous()    // Go back
 * wiz.skip()        // Skip optional step
 * wiz.reset()       // Start over
 * ```
 */
export function wizard(props?: WizardProps): WizardNode {
  return new WizardNodeImpl(props)
}
