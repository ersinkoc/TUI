/**
 * @oxog/tui - Form Widget with Validation
 * @packageDocumentation
 */

import type { Node, Buffer, CellStyle } from '../types'
import { ContainerNode } from './node'
import { DEFAULT_FG, DEFAULT_BG } from '../utils/color'
import { ATTR_DIM, ATTR_BOLD, ATTR_INVERSE } from '../constants'
import { stringWidth, truncateToWidth } from '../utils/unicode'

// ============================================================
// Types
// ============================================================

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean
  message?: string | undefined
}

/**
 * Validator function type.
 */
export type Validator<T = unknown> = (value: T, formData: Record<string, unknown>) => ValidationResult | Promise<ValidationResult>

/**
 * Built-in validator names.
 */
export type BuiltinValidator =
  | 'required'
  | 'email'
  | 'url'
  | 'number'
  | 'integer'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'

/**
 * Validator configuration.
 */
export interface ValidatorConfig {
  type: BuiltinValidator | 'custom'
  value?: unknown
  message?: string
  validator?: Validator
}

/**
 * Form field configuration.
 */
export interface FormField {
  /** Field ID */
  id: string
  /** Field label */
  label: string
  /** Field type */
  type: 'text' | 'password' | 'number' | 'email' | 'select' | 'checkbox' | 'textarea'
  /** Initial value */
  value?: unknown
  /** Placeholder text */
  placeholder?: string
  /** Field is required */
  required?: boolean
  /** Field is disabled */
  disabled?: boolean
  /** Validators */
  validators?: ValidatorConfig[]
  /** Select options (for select type) */
  options?: { label: string; value: unknown }[]
  /** Help text */
  helpText?: string
}

/**
 * Field state.
 */
export interface FieldState {
  value: unknown
  touched: boolean
  dirty: boolean
  valid: boolean
  validating: boolean
  errors: string[]
}

/**
 * Form state.
 */
export interface FormState {
  fields: Record<string, FieldState>
  valid: boolean
  dirty: boolean
  touched: boolean
  submitting: boolean
}

/**
 * Form widget properties.
 */
export interface FormProps {
  /** Form fields */
  fields?: FormField[]
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline'
  /** Label width (for horizontal layout) */
  labelWidth?: number
  /** Show validation errors */
  showErrors?: boolean
  /** Validate on change */
  validateOnChange?: boolean
  /** Validate on blur */
  validateOnBlur?: boolean
  /** Submit button text */
  submitText?: string
  /** Cancel button text */
  cancelText?: string
  /** Show cancel button */
  showCancel?: boolean
}

/**
 * Form node interface.
 */
export interface FormNode extends Node {
  readonly type: 'form'

  // Configuration
  fields(items: FormField[]): this
  addField(field: FormField): this
  removeField(id: string): this
  layout(layout: 'vertical' | 'horizontal' | 'inline'): this
  labelWidth(width: number): this
  showErrors(enabled: boolean): this
  validateOnChange(enabled: boolean): this
  validateOnBlur(enabled: boolean): this
  submitText(text: string): this
  cancelText(text: string): this
  showCancel(enabled: boolean): this

  // Control
  focus(): this
  blur(): this
  focusField(id: string): this
  focusNext(): this
  focusPrevious(): this
  setValue(id: string, value: unknown): this
  setValues(values: Record<string, unknown>): this
  reset(): this
  clear(): this

  // Validation
  validate(): Promise<boolean>
  validateField(id: string): Promise<boolean>
  setFieldError(id: string, error: string): this
  clearFieldError(id: string): this
  clearErrors(): this

  // Submission
  submit(): Promise<void>

  // Events
  onChange(handler: (id: string, value: unknown) => void): this
  onSubmit(handler: (data: Record<string, unknown>) => void | Promise<void>): this
  onCancel(handler: () => void): this
  onValidationError(handler: (errors: Record<string, string[]>) => void): this
  onFocus(handler: () => void): this
  onBlur(handler: () => void): this

  // State
  readonly formState: FormState
  readonly values: Record<string, unknown>
  readonly errors: Record<string, string[]>
  readonly isValid: boolean
  readonly isDirty: boolean
  readonly isSubmitting: boolean
  readonly focusedField: string | null
  readonly isFocused: boolean
}

// ============================================================
// Built-in Validators
// ============================================================

const builtinValidators: Record<BuiltinValidator, (config: ValidatorConfig) => Validator<unknown>> = {
  required: (config) => (value): ValidationResult => {
    const valid = value !== undefined && value !== null && value !== ''
    return { valid, message: valid ? undefined : (config.message ?? 'This field is required') }
  },

  email: (config) => (value): ValidationResult => {
    if (!value) return { valid: true, message: undefined }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
    return { valid, message: valid ? undefined : (config.message ?? 'Invalid email address') }
  },

  url: (config) => (value): ValidationResult => {
    if (!value) return { valid: true, message: undefined }
    try {
      new URL(String(value))
      return { valid: true, message: undefined }
    } catch {
      return { valid: false, message: config.message ?? 'Invalid URL' }
    }
  },

  number: (config) => (value): ValidationResult => {
    if (!value && value !== 0) return { valid: true, message: undefined }
    const valid = !isNaN(Number(value))
    return { valid, message: valid ? undefined : (config.message ?? 'Must be a number') }
  },

  integer: (config) => (value): ValidationResult => {
    if (!value && value !== 0) return { valid: true, message: undefined }
    const valid = Number.isInteger(Number(value))
    return { valid, message: valid ? undefined : (config.message ?? 'Must be an integer') }
  },

  min: (config) => (value): ValidationResult => {
    if (!value && value !== 0) return { valid: true, message: undefined }
    const min = Number(config.value)
    const valid = Number(value) >= min
    return { valid, message: valid ? undefined : (config.message ?? `Must be at least ${min}`) }
  },

  max: (config) => (value): ValidationResult => {
    if (!value && value !== 0) return { valid: true, message: undefined }
    const max = Number(config.value)
    const valid = Number(value) <= max
    return { valid, message: valid ? undefined : (config.message ?? `Must be at most ${max}`) }
  },

  minLength: (config) => (value): ValidationResult => {
    if (!value) return { valid: true, message: undefined }
    const min = Number(config.value)
    const valid = String(value).length >= min
    return { valid, message: valid ? undefined : (config.message ?? `Must be at least ${min} characters`) }
  },

  maxLength: (config) => (value): ValidationResult => {
    if (!value) return { valid: true, message: undefined }
    const max = Number(config.value)
    const valid = String(value).length <= max
    return { valid, message: valid ? undefined : (config.message ?? `Must be at most ${max} characters`) }
  },

  pattern: (config) => (value): ValidationResult => {
    if (!value) return { valid: true, message: undefined }
    const pattern = config.value instanceof RegExp ? config.value : new RegExp(String(config.value))
    const valid = pattern.test(String(value))
    return { valid, message: valid ? undefined : (config.message ?? 'Invalid format') }
  }
}

// ============================================================
// Implementation
// ============================================================

class FormNodeImpl extends ContainerNode implements FormNode {
  readonly type = 'form' as const

  private _fields: FormField[] = []
  private _fieldStates: Map<string, FieldState> = new Map()
  private _formLayout: 'vertical' | 'horizontal' | 'inline' = 'vertical'
  private _labelWidth: number = 15
  private _showErrors: boolean = true
  private _validateOnChange: boolean = true
  private _validateOnBlurMode: boolean = true
  private _submitText: string = 'Submit'
  private _cancelText: string = 'Cancel'
  private _showCancel: boolean = false
  private _focusedIndex: number = 0
  private _focused: boolean = false
  private _submitting: boolean = false

  // Cursor position for text input
  private _cursorPos: number = 0
  private _inputOffset: number = 0

  private _onChangeHandlers: ((id: string, value: unknown) => void)[] = []
  private _onSubmitHandlers: ((data: Record<string, unknown>) => void | Promise<void>)[] = []
  private _onCancelHandlers: (() => void)[] = []
  private _onValidationErrorHandlers: ((errors: Record<string, string[]>) => void)[] = []
  override _onFocusHandlers: (() => void)[] = []
  override _onBlurHandlers: (() => void)[] = []

  constructor(props?: FormProps) {
    super()
    if (props) {
      if (props.fields) this.fields(props.fields)
      if (props.layout) this._formLayout = props.layout
      if (props.labelWidth !== undefined) this._labelWidth = props.labelWidth
      if (props.showErrors !== undefined) this._showErrors = props.showErrors
      if (props.validateOnChange !== undefined) this._validateOnChange = props.validateOnChange
      if (props.validateOnBlur !== undefined) this._validateOnBlurMode = props.validateOnBlur
      if (props.submitText) this._submitText = props.submitText
      if (props.cancelText) this._cancelText = props.cancelText
      if (props.showCancel !== undefined) this._showCancel = props.showCancel
    }
  }

  // Getters
  get formState(): FormState {
    const fields: Record<string, FieldState> = {}
    let valid = true
    let dirty = false
    let touched = false

    for (const [id, state] of this._fieldStates) {
      fields[id] = { ...state }
      if (!state.valid) valid = false
      if (state.dirty) dirty = true
      if (state.touched) touched = true
    }

    return {
      fields,
      valid,
      dirty,
      touched,
      submitting: this._submitting
    }
  }

  get values(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [id, state] of this._fieldStates) {
      result[id] = state.value
    }
    return result
  }

  get errors(): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    for (const [id, state] of this._fieldStates) {
      if (state.errors.length > 0) {
        result[id] = [...state.errors]
      }
    }
    return result
  }

  get isValid(): boolean {
    for (const state of this._fieldStates.values()) {
      if (!state.valid) return false
    }
    return true
  }

  get isDirty(): boolean {
    for (const state of this._fieldStates.values()) {
      if (state.dirty) return true
    }
    return false
  }

  get isSubmitting(): boolean {
    return this._submitting
  }

  get focusedField(): string | null {
    const field = this._fields[this._focusedIndex]
    return field?.id ?? null
  }

  get isFocused(): boolean {
    return this._focused
  }

  get validateOnBlurEnabled(): boolean {
    return this._validateOnBlurMode
  }

  // Configuration
  fields(items: FormField[]): this {
    this._fields = items
    this._fieldStates.clear()

    for (const field of items) {
      this._fieldStates.set(field.id, {
        value: field.value ?? (field.type === 'checkbox' ? false : ''),
        touched: false,
        dirty: false,
        valid: !field.required,
        validating: false,
        errors: []
      })
    }

    this._focusedIndex = 0
    this.markDirty()
    return this
  }

  addField(field: FormField): this {
    this._fields.push(field)
    this._fieldStates.set(field.id, {
      value: field.value ?? (field.type === 'checkbox' ? false : ''),
      touched: false,
      dirty: false,
      valid: !field.required,
      validating: false,
      errors: []
    })
    this.markDirty()
    return this
  }

  removeField(id: string): this {
    const index = this._fields.findIndex(f => f.id === id)
    if (index !== -1) {
      this._fields.splice(index, 1)
      this._fieldStates.delete(id)
      if (this._focusedIndex >= this._fields.length) {
        this._focusedIndex = Math.max(0, this._fields.length - 1)
      }
      this.markDirty()
    }
    return this
  }

  layout(layout: 'vertical' | 'horizontal' | 'inline'): this {
    this._formLayout = layout
    this.markDirty()
    return this
  }

  labelWidth(width: number): this {
    this._labelWidth = width
    this.markDirty()
    return this
  }

  showErrors(enabled: boolean): this {
    this._showErrors = enabled
    this.markDirty()
    return this
  }

  validateOnChange(enabled: boolean): this {
    this._validateOnChange = enabled
    return this
  }

  validateOnBlur(enabled: boolean): this {
    this._validateOnBlurMode = enabled
    return this
  }

  submitText(text: string): this {
    this._submitText = text
    this.markDirty()
    return this
  }

  cancelText(text: string): this {
    this._cancelText = text
    this.markDirty()
    return this
  }

  showCancel(enabled: boolean): this {
    this._showCancel = enabled
    this.markDirty()
    return this
  }

  // Control
  override focus(): this {
    if (!this._focused) {
      this._focused = true
      this.markDirty()
      for (const handler of this._onFocusHandlers) {
        handler()
      }
    }
    return this
  }

  override blur(): this {
    if (this._focused) {
      this._focused = false
      this.markDirty()
      for (const handler of this._onBlurHandlers) {
        handler()
      }
    }
    return this
  }

  focusField(id: string): this {
    const index = this._fields.findIndex(f => f.id === id)
    if (index !== -1) {
      this._focusedIndex = index
      this.updateCursorForField()
      this.markDirty()
    }
    return this
  }

  focusNext(): this {
    if (this._fields.length === 0) return this

    // +2 for submit/cancel buttons
    const totalItems = this._fields.length + (this._showCancel ? 2 : 1)
    this._focusedIndex = (this._focusedIndex + 1) % totalItems
    this.updateCursorForField()
    this.markDirty()
    return this
  }

  focusPrevious(): this {
    if (this._fields.length === 0) return this

    const totalItems = this._fields.length + (this._showCancel ? 2 : 1)
    this._focusedIndex = (this._focusedIndex - 1 + totalItems) % totalItems
    this.updateCursorForField()
    this.markDirty()
    return this
  }

  private updateCursorForField(): void {
    const field = this._fields[this._focusedIndex]
    if (field) {
      const state = this._fieldStates.get(field.id)
      if (state && (field.type === 'text' || field.type === 'password' || field.type === 'email' || field.type === 'number')) {
        this._cursorPos = String(state.value ?? '').length
        this._inputOffset = 0
      }
    }
  }

  setValue(id: string, value: unknown): this {
    const state = this._fieldStates.get(id)
    if (state) {
      state.value = value
      state.dirty = true

      this.markDirty()

      for (const handler of this._onChangeHandlers) {
        handler(id, value)
      }

      if (this._validateOnChange) {
        this.validateField(id)
      }
    }
    return this
  }

  setValues(values: Record<string, unknown>): this {
    for (const [id, value] of Object.entries(values)) {
      this.setValue(id, value)
    }
    return this
  }

  reset(): this {
    for (const field of this._fields) {
      const state = this._fieldStates.get(field.id)
      if (state) {
        state.value = field.value ?? (field.type === 'checkbox' ? false : '')
        state.touched = false
        state.dirty = false
        state.valid = !field.required
        state.errors = []
      }
    }
    this._focusedIndex = 0
    this.markDirty()
    return this
  }

  override clear(): this {
    for (const field of this._fields) {
      const state = this._fieldStates.get(field.id)
      if (state) {
        state.value = field.type === 'checkbox' ? false : ''
        state.touched = true
        state.dirty = true
      }
    }
    this.markDirty()
    return this
  }

  // Validation
  async validate(): Promise<boolean> {
    const promises: Promise<boolean>[] = []
    for (const field of this._fields) {
      promises.push(this.validateField(field.id))
    }

    const results = await Promise.all(promises)
    const allValid = results.every(r => r)

    if (!allValid) {
      for (const handler of this._onValidationErrorHandlers) {
        handler(this.errors)
      }
    }

    return allValid
  }

  async validateField(id: string): Promise<boolean> {
    const field = this._fields.find(f => f.id === id)
    const state = this._fieldStates.get(id)

    if (!field || !state) return true

    state.validating = true
    state.errors = []
    this.markDirty()

    const validators: Validator[] = []

    // Add required validator if specified
    if (field.required) {
      validators.push(builtinValidators.required({ type: 'required' }))
    }

    // Add configured validators
    if (field.validators) {
      for (const config of field.validators) {
        if (config.type === 'custom' && config.validator) {
          validators.push(config.validator)
        } else if (config.type !== 'custom' && config.type in builtinValidators) {
          const validatorFactory = builtinValidators[config.type as BuiltinValidator]
          if (validatorFactory) {
            validators.push(validatorFactory(config))
          }
        }
      }
    }

    // Run validators
    for (const validator of validators) {
      const result = await validator(state.value, this.values)
      if (!result.valid) {
        state.errors.push(result.message ?? 'Validation failed')
      }
    }

    state.valid = state.errors.length === 0
    state.validating = false
    this.markDirty()

    return state.valid
  }

  setFieldError(id: string, error: string): this {
    const state = this._fieldStates.get(id)
    if (state) {
      state.errors.push(error)
      state.valid = false
      this.markDirty()
    }
    return this
  }

  clearFieldError(id: string): this {
    const state = this._fieldStates.get(id)
    if (state) {
      state.errors = []
      state.valid = true
      this.markDirty()
    }
    return this
  }

  clearErrors(): this {
    for (const state of this._fieldStates.values()) {
      state.errors = []
      state.valid = true
    }
    this.markDirty()
    return this
  }

  // Submission
  async submit(): Promise<void> {
    if (this._submitting) return

    this._submitting = true
    this.markDirty()

    const valid = await this.validate()

    if (valid) {
      for (const handler of this._onSubmitHandlers) {
        await handler(this.values)
      }
    }

    this._submitting = false
    this.markDirty()
  }

  // Events
  onChange(handler: (id: string, value: unknown) => void): this {
    this._onChangeHandlers.push(handler)
    return this
  }

  onSubmit(handler: (data: Record<string, unknown>) => void | Promise<void>): this {
    this._onSubmitHandlers.push(handler)
    return this
  }

  onCancel(handler: () => void): this {
    this._onCancelHandlers.push(handler)
    return this
  }

  onValidationError(handler: (errors: Record<string, string[]>) => void): this {
    this._onValidationErrorHandlers.push(handler)
    return this
  }

  override onFocus(handler: () => void): this {
    this._onFocusHandlers.push(handler)
    return this
  }

  override onBlur(handler: () => void): this {
    this._onBlurHandlers.push(handler)
    return this
  }

  /**
   * Dispose of form and clear all handlers.
   */
  override dispose(): void {
    if (this._disposed) return
    this._fields = []
    this._fieldStates.clear()
    this._onChangeHandlers = []
    this._onSubmitHandlers = []
    this._onCancelHandlers = []
    this._onValidationErrorHandlers = []
    this._onFocusHandlers = []
    this._onBlurHandlers = []
    super.dispose()
  }

  // Internal: Handle key input
  /** @internal */
  handleKey(key: string, ctrl: boolean): boolean {
    if (!this._focused) return false

    const field = this._fields[this._focusedIndex]
    const isOnButton = this._focusedIndex >= this._fields.length

    // Global navigation
    if (key === 'tab' || key === 'down') {
      this.focusNext()
      return true
    }
    if (key === 'shift+tab' || key === 'up') {
      this.focusPrevious()
      return true
    }

    // Button handling
    if (isOnButton) {
      if (key === 'enter' || key === 'space') {
        const buttonIndex = this._focusedIndex - this._fields.length
        if (buttonIndex === 0) {
          // Submit button
          this.submit()
        } else if (buttonIndex === 1 && this._showCancel) {
          // Cancel button
          for (const handler of this._onCancelHandlers) {
            handler()
          }
        }
        return true
      }
      return false
    }

    if (!field || field.disabled) return false

    const state = this._fieldStates.get(field.id)
    if (!state) return false

    // Field-specific handling
    switch (field.type) {
      case 'checkbox':
        if (key === 'enter' || key === 'space') {
          this.setValue(field.id, !state.value)
          return true
        }
        break

      case 'select':
        if (field.options && field.options.length > 0) {
          const currentIndex = field.options.findIndex(o => o.value === state.value)
          if (key === 'left' || key === 'h') {
            const newIndex = Math.max(0, currentIndex - 1)
            this.setValue(field.id, field.options[newIndex]!.value)
            return true
          }
          if (key === 'right' || key === 'l') {
            const newIndex = Math.min(field.options.length - 1, currentIndex + 1)
            this.setValue(field.id, field.options[newIndex]!.value)
            return true
          }
        }
        break

      case 'text':
      case 'password':
      case 'email':
      case 'number':
        return this.handleTextInput(field, state, key, ctrl)

      case 'textarea':
        return this.handleTextInput(field, state, key, ctrl)
    }

    return false
  }

  private handleTextInput(field: FormField, state: FieldState, key: string, ctrl: boolean): boolean {
    const text = String(state.value ?? '')

    if (key.length === 1 && !ctrl) {
      // Type character
      const newText = text.slice(0, this._cursorPos) + key + text.slice(this._cursorPos)
      this._cursorPos++
      this.setValue(field.id, newText)
      return true
    }

    switch (key) {
      case 'backspace':
        if (this._cursorPos > 0) {
          const newText = text.slice(0, this._cursorPos - 1) + text.slice(this._cursorPos)
          this._cursorPos--
          this.setValue(field.id, newText)
        }
        return true

      case 'delete':
        if (this._cursorPos < text.length) {
          const newText = text.slice(0, this._cursorPos) + text.slice(this._cursorPos + 1)
          this.setValue(field.id, newText)
        }
        return true

      case 'left':
        if (this._cursorPos > 0) {
          this._cursorPos--
          this.markDirty()
        }
        return true

      case 'right':
        if (this._cursorPos < text.length) {
          this._cursorPos++
          this.markDirty()
        }
        return true

      case 'home':
        this._cursorPos = 0
        this.markDirty()
        return true

      case 'end':
        this._cursorPos = text.length
        this.markDirty()
        return true

      case 'enter':
        if (field.type !== 'textarea') {
          this.focusNext()
        }
        return true
    }

    return false
  }

  // Internal: Handle mouse
  /** @internal */
  handleMouse(x: number, y: number, action: string): boolean {
    const { x: bx, y: by, width, height } = this._bounds

    if (x < bx || x >= bx + width || y < by || y >= by + height) {
      return false
    }

    if (action !== 'press') return true

    // Find which field/button was clicked
    let currentY = by

    for (let i = 0; i < this._fields.length; i++) {
      const field = this._fields[i]!
      const fieldHeight = this.getFieldHeight(field)

      if (y >= currentY && y < currentY + fieldHeight) {
        this._focusedIndex = i
        this.updateCursorForField()

        // Handle checkbox click
        const state = this._fieldStates.get(field.id)
        if (field.type === 'checkbox' && state) {
          this.setValue(field.id, !state.value)
        }

        this.markDirty()
        return true
      }

      currentY += fieldHeight
    }

    // Check buttons
    const buttonY = currentY + 1
    if (y === buttonY) {
      // Calculate button positions
      const submitWidth = stringWidth(this._submitText) + 4
      const cancelWidth = this._showCancel ? stringWidth(this._cancelText) + 4 : 0

      if (x >= bx && x < bx + submitWidth) {
        this._focusedIndex = this._fields.length
        this.submit()
        return true
      }

      if (this._showCancel && x >= bx + submitWidth + 2 && x < bx + submitWidth + 2 + cancelWidth) {
        this._focusedIndex = this._fields.length + 1
        for (const handler of this._onCancelHandlers) {
          handler()
        }
        return true
      }
    }

    return true
  }

  private getFieldHeight(field: FormField): number {
    let height = 1 // Label + input

    if (this._formLayout === 'vertical') {
      height = 2 // Label on one line, input on next
    }

    const state = this._fieldStates.get(field.id)
    if (this._showErrors && state && state.errors.length > 0) {
      height += state.errors.length
    }

    if (field.helpText) {
      height += 1
    }

    return height
  }

  // Render
  render(buffer: Buffer, parentStyle: CellStyle): void {
    if (!this._visible) return

    const { x, y, width, height } = this._bounds
    if (width <= 0 || height <= 0) return

    /* c8 ignore next 2 */
    const fg = parentStyle.fg ?? DEFAULT_FG
    const bg = parentStyle.bg ?? DEFAULT_BG

    let currentY = y

    // Render fields
    for (let i = 0; i < this._fields.length && currentY < y + height; i++) {
      const field = this._fields[i]!
      const state = this._fieldStates.get(field.id)!
      const isFocused = this._focused && i === this._focusedIndex
      const isDisabled = field.disabled ?? false

      currentY = this.renderField(
        buffer,
        field,
        state,
        x,
        currentY,
        width,
        fg,
        bg,
        isFocused,
        isDisabled
      )
    }

    // Render buttons
    if (currentY < y + height - 1) {
      currentY += 1 // Gap before buttons
      this.renderButtons(buffer, x, currentY, width, fg, bg)
    }
  }

  private renderField(
    buffer: Buffer,
    field: FormField,
    state: FieldState,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    isFocused: boolean,
    isDisabled: boolean
  ): number {
    const labelAttrs = isDisabled ? ATTR_DIM : (field.required ? ATTR_BOLD : 0)
    const inputAttrs = isDisabled ? ATTR_DIM : (isFocused ? ATTR_INVERSE : 0)

    let currentY = y

    if (this._formLayout === 'vertical') {
      // Render label
      let label = field.label
      if (field.required) label += ' *'
      if (stringWidth(label) > width) {
        label = truncateToWidth(label, width)
      }
      buffer.write(x, currentY, label, { fg, bg, attrs: labelAttrs })
      currentY++

      // Render input
      this.renderInput(buffer, field, state, x, currentY, width, fg, bg, inputAttrs, isFocused)
      currentY++
    } else {
      // Horizontal layout
      let label = field.label
      if (field.required) label += ' *'
      if (stringWidth(label) > this._labelWidth - 1) {
        label = truncateToWidth(label, this._labelWidth - 1)
      }
      buffer.write(x, currentY, label.padEnd(this._labelWidth), { fg, bg, attrs: labelAttrs })

      // Render input
      const inputX = x + this._labelWidth
      const inputWidth = width - this._labelWidth
      this.renderInput(buffer, field, state, inputX, currentY, inputWidth, fg, bg, inputAttrs, isFocused)
      currentY++
    }

    // Render errors
    if (this._showErrors && state.errors.length > 0) {
      for (const error of state.errors) {
        let errorText = '⚠ ' + error
        if (stringWidth(errorText) > width) {
          errorText = truncateToWidth(errorText, width)
        }
        buffer.write(x, currentY, errorText, { fg: 0xFF0000, bg, attrs: 0 })
        currentY++
      }
    }

    // Render help text
    if (field.helpText) {
      let helpText = field.helpText
      if (stringWidth(helpText) > width) {
        helpText = truncateToWidth(helpText, width)
      }
      buffer.write(x, currentY, helpText, { fg, bg, attrs: ATTR_DIM })
      currentY++
    }

    return currentY
  }

  private renderInput(
    buffer: Buffer,
    field: FormField,
    state: FieldState,
    x: number,
    y: number,
    width: number,
    fg: number,
    bg: number,
    attrs: number,
    isFocused: boolean
  ): void {
    switch (field.type) {
      case 'checkbox': {
        const checked = state.value === true
        const checkbox = checked ? '[✓]' : '[ ]'
        buffer.write(x, y, checkbox, { fg, bg, attrs })
        break
      }

      case 'select': {
        const options = field.options ?? []
        const selected = options.find(o => o.value === state.value)
        let text = selected?.label ?? (field.placeholder ?? 'Select...')
        text = `◀ ${text} ▶`
        if (stringWidth(text) > width) {
          text = truncateToWidth(text, width)
        }
        buffer.write(x, y, text, { fg, bg, attrs })
        break
      }

      case 'text':
      case 'email':
      case 'number':
      case 'password':
      case 'textarea': {
        const text = String(state.value ?? '')
        const displayText = field.type === 'password' ? '*'.repeat(text.length) : text

        // Handle cursor visibility
        const inputWidth = width - 2
        let visibleText = displayText

        if (isFocused) {
          // Adjust offset to keep cursor visible
          if (this._cursorPos < this._inputOffset) {
            this._inputOffset = this._cursorPos
          } else if (this._cursorPos >= this._inputOffset + inputWidth) {
            this._inputOffset = this._cursorPos - inputWidth + 1
          }

          visibleText = displayText.slice(this._inputOffset, this._inputOffset + inputWidth)

          // Show cursor
          const cursorX = this._cursorPos - this._inputOffset
          if (cursorX >= 0 && cursorX < inputWidth) {
            // Insert cursor character
            const before = visibleText.slice(0, cursorX)
            const after = visibleText.slice(cursorX)
            visibleText = before + after
          }
        } else {
          if (stringWidth(visibleText) > inputWidth) {
            visibleText = truncateToWidth(visibleText, inputWidth)
          }
        }

        // Draw input box
        buffer.write(x, y, '[', { fg, bg, attrs: ATTR_DIM })

        // Fill background
        for (let i = 0; i < inputWidth; i++) {
          buffer.set(x + 1 + i, y, { char: ' ', fg, bg, attrs })
        }

        // Show placeholder or value
        if (!visibleText && field.placeholder && !isFocused) {
          buffer.write(x + 1, y, truncateToWidth(field.placeholder, inputWidth), { fg, bg, attrs: ATTR_DIM })
        } else {
          buffer.write(x + 1, y, visibleText, { fg, bg, attrs })

          // Draw cursor if focused
          if (isFocused) {
            const cursorX = this._cursorPos - this._inputOffset
            if (cursorX >= 0 && cursorX < inputWidth) {
              buffer.set(x + 1 + cursorX, y, {
                char: visibleText[cursorX] ?? ' ',
                fg: bg,
                bg: fg,
                attrs: 0
              })
            }
          }
        }

        buffer.write(x + inputWidth + 1, y, ']', { fg, bg, attrs: ATTR_DIM })
        break
      }
    }
  }

  private renderButtons(
    buffer: Buffer,
    x: number,
    y: number,
    _width: number,
    fg: number,
    bg: number
  ): void {
    const submitFocused = this._focused && this._focusedIndex === this._fields.length
    const cancelFocused = this._focused && this._focusedIndex === this._fields.length + 1

    // Submit button
    const submitText = this._submitting ? '...' : this._submitText
    const submitAttrs = submitFocused ? ATTR_INVERSE : ATTR_BOLD
    buffer.write(x, y, `[ ${submitText} ]`, { fg, bg, attrs: submitAttrs })

    // Cancel button
    if (this._showCancel) {
      const cancelX = x + stringWidth(submitText) + 6
      const cancelAttrs = cancelFocused ? ATTR_INVERSE : 0
      buffer.write(cancelX, y, `[ ${this._cancelText} ]`, { fg, bg, attrs: cancelAttrs })
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a form widget.
 *
 * @param props - Form properties
 * @returns Form node
 *
 * @example
 * ```typescript
 * // Basic login form
 * const loginForm = form()
 *   .fields([
 *     { id: 'email', label: 'Email', type: 'email', required: true },
 *     { id: 'password', label: 'Password', type: 'password', required: true }
 *   ])
 *   .onSubmit(data => {
 *     console.log('Login:', data.email, data.password)
 *   })
 *
 * // Form with validation
 * const registrationForm = form()
 *   .fields([
 *     {
 *       id: 'username',
 *       label: 'Username',
 *       type: 'text',
 *       required: true,
 *       validators: [
 *         { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' }
 *       ]
 *     },
 *     {
 *       id: 'email',
 *       label: 'Email',
 *       type: 'email',
 *       required: true,
 *       validators: [{ type: 'email' }]
 *     },
 *     {
 *       id: 'age',
 *       label: 'Age',
 *       type: 'number',
 *       validators: [
 *         { type: 'min', value: 18, message: 'Must be 18 or older' },
 *         { type: 'max', value: 120 }
 *       ]
 *     }
 *   ])
 *   .showCancel(true)
 *   .onSubmit(data => console.log('Registered:', data))
 *   .onCancel(() => console.log('Cancelled'))
 *
 * // Custom validator
 * const customForm = form()
 *   .addField({
 *     id: 'code',
 *     label: 'Invitation Code',
 *     type: 'text',
 *     validators: [{
 *       type: 'custom',
 *       validator: async (value) => {
 *         const valid = await checkInviteCode(value)
 *         return { valid, message: valid ? undefined : 'Invalid invitation code' }
 *       }
 *     }]
 *   })
 * ```
 */
export function form(props?: FormProps): FormNode {
  return new FormNodeImpl(props)
}
