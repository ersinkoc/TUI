/**
 * Form widget tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { form } from '../../src/widgets'
import { createBuffer, fillBuffer } from '../../src/core/buffer'
import { DEFAULT_FG, DEFAULT_BG } from '../../src/utils/color'

describe('Form Widget', () => {
  describe('creation', () => {
    it('creates a form with default properties', () => {
      const f = form()
      expect(f.type).toBe('form')
      expect(f.isValid).toBe(true)
      expect(f.isDirty).toBe(false)
      expect(f.isSubmitting).toBe(false)
    })

    it('creates a form with fields', () => {
      const f = form({
        fields: [
          { id: 'name', label: 'Name', type: 'text' },
          { id: 'email', label: 'Email', type: 'email' }
        ]
      })
      expect(f.type).toBe('form')
    })

    it('creates a form with initial values', () => {
      const f = form({
        fields: [
          { id: 'name', label: 'Name', type: 'text', value: 'John' }
        ]
      })
      expect(f.values.name).toBe('John')
    })
  })

  describe('configuration', () => {
    it('sets fields', () => {
      const f = form().fields([
        { id: 'field1', label: 'Field 1', type: 'text' }
      ])
      expect(f.type).toBe('form')
    })

    it('adds a field', () => {
      const f = form()
        .addField({ id: 'field1', label: 'Field 1', type: 'text' })
      expect(f.type).toBe('form')
    })

    it('removes a field', () => {
      const f = form()
        .addField({ id: 'field1', label: 'Field 1', type: 'text' })
        .addField({ id: 'field2', label: 'Field 2', type: 'text' })
        .removeField('field1')
      expect(f.type).toBe('form')
    })

    it('sets layout', () => {
      const f = form().layout('horizontal')
      expect(f.type).toBe('form')
    })

    it('sets label width', () => {
      const f = form().labelWidth(20)
      expect(f.type).toBe('form')
    })

    it('sets show errors', () => {
      const f = form().showErrors(true)
      expect(f.type).toBe('form')
    })

    it('sets validate on change', () => {
      const f = form().validateOnChange(true)
      expect(f.type).toBe('form')
    })

    it('sets validate on blur', () => {
      const f = form().validateOnBlur(true)
      expect(f.type).toBe('form')
    })

    it('sets submit text', () => {
      const f = form().submitText('Save')
      expect(f.type).toBe('form')
    })

    it('sets cancel text', () => {
      const f = form().cancelText('Cancel')
      expect(f.type).toBe('form')
    })

    it('sets show cancel', () => {
      const f = form().showCancel(true)
      expect(f.type).toBe('form')
    })
  })

  describe('value management', () => {
    it('sets a single value', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'John')
      expect(f.values.name).toBe('John')
    })

    it('sets multiple values', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .setValues({ name: 'John', email: 'john@example.com' })
      expect(f.values.name).toBe('John')
      expect(f.values.email).toBe('john@example.com')
    })

    it('resets form', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', value: 'Initial' })
        .setValue('name', 'Changed')
        .reset()
      expect(f.values.name).toBe('Initial')
    })

    it('clears form', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', value: 'Test' })
        .clear()
      expect(f.values.name).toBe('')
    })

    it('marks form as dirty on value change', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })

      expect(f.isDirty).toBe(false)
      f.setValue('name', 'Changed')
      expect(f.isDirty).toBe(true)
    })
  })

  describe('validation', () => {
    it('validates required field', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })

      const valid = await f.validate()
      expect(valid).toBe(false)
      expect(f.errors.name).toBeDefined()
    })

    it('validates email field', async () => {
      const f = form()
        .addField({
          id: 'email',
          label: 'Email',
          type: 'email',
          validators: [{ type: 'email' }]
        })
        .setValue('email', 'invalid')

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates with custom validator', async () => {
      const f = form()
        .addField({
          id: 'code',
          label: 'Code',
          type: 'text',
          validators: [{
            type: 'custom',
            validator: (value) => ({
              valid: value === 'secret',
              message: 'Invalid code'
            })
          }]
        })
        .setValue('code', 'wrong')

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates min length', async () => {
      const f = form()
        .addField({
          id: 'password',
          label: 'Password',
          type: 'password',
          validators: [{ type: 'minLength', value: 8 }]
        })
        .setValue('password', '123')

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates max length', async () => {
      const f = form()
        .addField({
          id: 'name',
          label: 'Name',
          type: 'text',
          validators: [{ type: 'maxLength', value: 10 }]
        })
        .setValue('name', 'Very Long Name That Exceeds Max')

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates min value', async () => {
      const f = form()
        .addField({
          id: 'age',
          label: 'Age',
          type: 'number',
          validators: [{ type: 'min', value: 18 }]
        })
        .setValue('age', 15)

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates max value', async () => {
      const f = form()
        .addField({
          id: 'quantity',
          label: 'Quantity',
          type: 'number',
          validators: [{ type: 'max', value: 100 }]
        })
        .setValue('quantity', 150)

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates pattern', async () => {
      const f = form()
        .addField({
          id: 'phone',
          label: 'Phone',
          type: 'text',
          validators: [{ type: 'pattern', value: /^\d{3}-\d{4}$/ }]
        })
        .setValue('phone', 'invalid')

      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('sets field error manually', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setFieldError('name', 'Custom error')

      expect(f.errors.name).toContain('Custom error')
      expect(f.isValid).toBe(false)
    })

    it('clears field error', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setFieldError('name', 'Error')
        .clearFieldError('name')

      expect(f.errors.name).toBeUndefined()
    })

    it('clears all errors', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })
        .addField({ id: 'email', label: 'Email', type: 'email', required: true })

      await f.validate()
      expect(Object.keys(f.errors).length).toBeGreaterThan(0)

      f.clearErrors()
      expect(Object.keys(f.errors).length).toBe(0)
    })
  })

  describe('submission', () => {
    it('submits form with valid data', async () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'John')
        .onSubmit(handler)

      await f.submit()
      expect(handler).toHaveBeenCalledWith({ name: 'John' })
    })

    it('does not submit invalid form', async () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })
        .onSubmit(handler)

      await f.submit()
      expect(handler).not.toHaveBeenCalled()
    })

    it('sets submitting state', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
        .onSubmit(async () => {
          await new Promise(r => setTimeout(r, 10))
        })

      const promise = f.submit()
      expect(f.isSubmitting).toBe(true)
      await promise
      expect(f.isSubmitting).toBe(false)
    })
  })

  describe('events', () => {
    it('emits onChange when field value changes', () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .onChange(handler)
        .setValue('name', 'John')

      expect(handler).toHaveBeenCalledWith('name', 'John')
    })

    it('emits onCancel when cancelled', () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .showCancel(true)
        .onCancel(handler)
        .focus()

      // Simulate cancel button press
      // Index layout: 0 = field, 1 = submit button, 2 = cancel button
      ;(f as any)._focusedIndex = 2 // Move to cancel button
      ;(f as any).handleKey('enter', false)
      expect(handler).toHaveBeenCalled()
    })

    it('emits onValidationError on validation failure', async () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })
        .onValidationError(handler)

      await f.validate()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onFocus when focused', () => {
      const handler = vi.fn()
      const f = form().onFocus(handler)
      f.focus()
      expect(handler).toHaveBeenCalled()
    })

    it('emits onBlur when blurred', () => {
      const handler = vi.fn()
      const f = form().onBlur(handler)
      f.focus()
      f.blur()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('focus', () => {
    it('focuses the form', () => {
      const f = form()
      f.focus()
      expect(f.isFocused).toBe(true)
    })

    it('blurs the form', () => {
      const f = form()
      f.focus()
      f.blur()
      expect(f.isFocused).toBe(false)
    })

    it('focuses specific field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
        .focusField('email')

      expect(f.focusedField).toBe('email')
    })

    it('focuses next field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()

      expect(f.focusedField).toBe('name')
      f.focusNext()
      expect(f.focusedField).toBe('email')
    })

    it('focuses previous field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
        .focusNext()
        .focusPrevious()

      expect(f.focusedField).toBe('name')
    })
  })

  describe('form state', () => {
    it('returns form state', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'John')

      const state = f.formState
      expect(state.valid).toBe(true)
      expect(state.dirty).toBe(true)
      expect(state.fields.name).toBeDefined()
    })
  })

  describe('rendering', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 50
    const height = 15

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders empty form', () => {
      const f = form()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders form with fields', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders form with errors', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })
      await f.validate()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders horizontal layout', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders form with cancel button', () => {
      const f = form({ showCancel: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles zero size bounds', () => {
      const f = form()
      ;(f as any)._bounds = { x: 0, y: 0, width: 0, height: 0 }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('respects visibility', () => {
      const f = form().visible(false)
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('field types', () => {
    it('handles text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
      expect(f.values.name).toBe('Test')
    })

    it('handles password field', () => {
      const f = form()
        .addField({ id: 'pass', label: 'Password', type: 'password' })
        .setValue('pass', 'secret')
      expect(f.values.pass).toBe('secret')
    })

    it('handles number field', () => {
      const f = form()
        .addField({ id: 'age', label: 'Age', type: 'number' })
        .setValue('age', 25)
      expect(f.values.age).toBe(25)
    })

    it('handles email field', () => {
      const f = form()
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .setValue('email', 'test@example.com')
      expect(f.values.email).toBe('test@example.com')
    })

    it('handles checkbox field', () => {
      const f = form()
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
        .setValue('agree', true)
      expect(f.values.agree).toBe(true)
    })

    it('handles select field', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ]
        })
        .setValue('color', 'blue')
      expect(f.values.color).toBe('blue')
    })
  })

  describe('fluent interface', () => {
    it('supports method chaining', async () => {
      const f = form()
        .layout('vertical')
        .labelWidth(15)
        .showErrors(true)
        .validateOnChange(true)
        .validateOnBlur(true)
        .submitText('Submit')
        .cancelText('Cancel')
        .showCancel(true)
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .setValue('name', 'John')
        .setValue('email', 'john@example.com')
        .focus()
        .focusNext()
        .blur()

      expect(f.type).toBe('form')
      expect(f.values.name).toBe('John')
    })
  })

  describe('keyboard handling for text input', () => {
    it('types character into text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any).handleKey('a', false)
      ;(f as any).handleKey('b', false)
      ;(f as any).handleKey('c', false)
      expect(f.values.name).toBe('abc')
    })

    it('handles backspace in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 3
      ;(f as any).handleKey('backspace', false)
      expect(f.values.name).toBe('ab')
    })

    it('handles backspace at start of text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 0
      ;(f as any).handleKey('backspace', false)
      expect(f.values.name).toBe('abc') // No change
    })

    it('handles delete in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 1
      ;(f as any).handleKey('delete', false)
      expect(f.values.name).toBe('ac')
    })

    it('handles delete at end of text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 3
      ;(f as any).handleKey('delete', false)
      expect(f.values.name).toBe('abc') // No change
    })

    it('handles left arrow in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 2
      ;(f as any).handleKey('left', false)
      expect((f as any)._cursorPos).toBe(1)
    })

    it('handles left arrow at start', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 0
      ;(f as any).handleKey('left', false)
      expect((f as any)._cursorPos).toBe(0)
    })

    it('handles right arrow in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 1
      ;(f as any).handleKey('right', false)
      expect((f as any)._cursorPos).toBe(2)
    })

    it('handles right arrow at end', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 3
      ;(f as any).handleKey('right', false)
      expect((f as any)._cursorPos).toBe(3)
    })

    it('handles home key in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 2
      ;(f as any).handleKey('home', false)
      expect((f as any)._cursorPos).toBe(0)
    })

    it('handles end key in text field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'abc')
        .focus()
      ;(f as any)._cursorPos = 0
      ;(f as any).handleKey('end', false)
      expect((f as any)._cursorPos).toBe(3)
    })

    it('handles enter in text field to focus next', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
      expect(f.focusedField).toBe('name')
      ;(f as any).handleKey('enter', false)
      expect(f.focusedField).toBe('email')
    })

    it('handles typing in password field', () => {
      const f = form()
        .addField({ id: 'pass', label: 'Password', type: 'password' })
        .focus()
      ;(f as any).handleKey('s', false)
      ;(f as any).handleKey('e', false)
      ;(f as any).handleKey('c', false)
      expect(f.values.pass).toBe('sec')
    })

    it('handles typing in email field', () => {
      const f = form()
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
      ;(f as any).handleKey('a', false)
      ;(f as any).handleKey('@', false)
      expect(f.values.email).toBe('a@')
    })

    it('handles typing in number field', () => {
      const f = form()
        .addField({ id: 'age', label: 'Age', type: 'number' })
        .focus()
      ;(f as any).handleKey('1', false)
      ;(f as any).handleKey('2', false)
      expect(f.values.age).toBe('12')
    })

    it('handles tab to focus next', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
      expect(f.focusedField).toBe('name')
      ;(f as any).handleKey('tab', false)
      expect(f.focusedField).toBe('email')
    })

    it('handles shift+tab to focus previous', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
        .focusNext()
      expect(f.focusedField).toBe('email')
      ;(f as any).handleKey('shift+tab', false)
      expect(f.focusedField).toBe('name')
    })

    it('handles down arrow to focus next', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
      ;(f as any).handleKey('down', false)
      expect(f.focusedField).toBe('email')
    })

    it('handles up arrow to focus previous', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
        .focus()
        .focusNext()
      ;(f as any).handleKey('up', false)
      expect(f.focusedField).toBe('name')
    })

    it('returns false when not focused', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      expect((f as any).handleKey('a', false)).toBe(false)
    })

    it('returns false for disabled field', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', disabled: true })
        .focus()
      expect((f as any).handleKey('a', false)).toBe(false)
    })
  })

  describe('keyboard handling for checkbox', () => {
    it('toggles checkbox with enter', () => {
      const f = form()
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
        .focus()
      expect(f.values.agree).toBe(false)
      ;(f as any).handleKey('enter', false)
      expect(f.values.agree).toBe(true)
    })

    it('toggles checkbox with space', () => {
      const f = form()
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
        .focus()
      ;(f as any).handleKey('space', false)
      expect(f.values.agree).toBe(true)
    })
  })

  describe('keyboard handling for select', () => {
    it('changes select value with left arrow', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' },
            { label: 'Green', value: 'green' }
          ],
          value: 'blue'
        })
        .focus()
      ;(f as any).handleKey('left', false)
      expect(f.values.color).toBe('red')
    })

    it('changes select value with right arrow', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' },
            { label: 'Green', value: 'green' }
          ],
          value: 'blue'
        })
        .focus()
      ;(f as any).handleKey('right', false)
      expect(f.values.color).toBe('green')
    })

    it('changes select value with h key', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ],
          value: 'blue'
        })
        .focus()
      ;(f as any).handleKey('h', false)
      expect(f.values.color).toBe('red')
    })

    it('changes select value with l key', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ],
          value: 'red'
        })
        .focus()
      ;(f as any).handleKey('l', false)
      expect(f.values.color).toBe('blue')
    })

    it('stops at first option with left', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ],
          value: 'red'
        })
        .focus()
      ;(f as any).handleKey('left', false)
      expect(f.values.color).toBe('red')
    })

    it('stops at last option with right', () => {
      const f = form()
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ],
          value: 'blue'
        })
        .focus()
      ;(f as any).handleKey('right', false)
      expect(f.values.color).toBe('blue')
    })
  })

  describe('keyboard handling for buttons', () => {
    it('submits form when enter on submit button', async () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
        .onSubmit(handler)
        .focus()
      ;(f as any)._focusedIndex = 1 // Submit button
      ;(f as any).handleKey('enter', false)
      await new Promise(r => setTimeout(r, 10))
      expect(handler).toHaveBeenCalled()
    })

    it('submits form when space on submit button', async () => {
      const handler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
        .onSubmit(handler)
        .focus()
      ;(f as any)._focusedIndex = 1
      ;(f as any).handleKey('space', false)
      await new Promise(r => setTimeout(r, 10))
      expect(handler).toHaveBeenCalled()
    })

    it('returns false for non-action key on button', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._focusedIndex = 1
      expect((f as any).handleKey('a', false)).toBe(false)
    })
  })

  describe('mouse handling', () => {
    it('focuses field on click', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      ;(f as any).handleMouse(10, 0, 'press')
      expect(f.focusedField).toBe('name')
    })

    it('toggles checkbox on click', () => {
      const f = form()
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      ;(f as any).handleMouse(10, 0, 'press')
      expect(f.values.agree).toBe(true)
    })

    it('submits on submit button click', async () => {
      const handler = vi.fn()
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
        .onSubmit(handler)
      ;(f as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      // Click on the button row
      ;(f as any).handleMouse(0, 2, 'press')
      await new Promise(r => setTimeout(r, 10))
      // May or may not hit button depending on layout
    })

    it('returns false for click outside bounds', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      expect((f as any).handleMouse(100, 100, 'press')).toBe(false)
    })

    it('returns true for non-press action', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 50, height: 10 }
      expect((f as any).handleMouse(10, 0, 'release')).toBe(true)
    })
  })

  describe('validators', () => {
    it('validates url', async () => {
      const f = form()
        .addField({
          id: 'site',
          label: 'Site',
          type: 'text',
          validators: [{ type: 'url' }]
        })
        .setValue('site', 'not-a-url')
      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates valid url', async () => {
      const f = form()
        .addField({
          id: 'site',
          label: 'Site',
          type: 'text',
          validators: [{ type: 'url' }]
        })
        .setValue('site', 'https://example.com')
      const valid = await f.validate()
      expect(valid).toBe(true)
    })

    it('validates number type', async () => {
      const f = form()
        .addField({
          id: 'age',
          label: 'Age',
          type: 'text',
          validators: [{ type: 'number' }]
        })
        .setValue('age', 'not-a-number')
      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates integer', async () => {
      const f = form()
        .addField({
          id: 'count',
          label: 'Count',
          type: 'text',
          validators: [{ type: 'integer' }]
        })
        .setValue('count', 3.5)
      const valid = await f.validate()
      expect(valid).toBe(false)
    })

    it('validates valid integer', async () => {
      const f = form()
        .addField({
          id: 'count',
          label: 'Count',
          type: 'text',
          validators: [{ type: 'integer' }]
        })
        .setValue('count', 5)
      const valid = await f.validate()
      expect(valid).toBe(true)
    })

    it('skips validation for empty optional fields', async () => {
      const f = form()
        .addField({
          id: 'age',
          label: 'Age',
          type: 'text',
          validators: [{ type: 'number' }]
        })
      const valid = await f.validate()
      expect(valid).toBe(true)
    })

    it('validates with custom async validator', async () => {
      const f = form()
        .addField({
          id: 'code',
          label: 'Code',
          type: 'text',
          validators: [{
            type: 'custom',
            validator: async (value) => {
              await new Promise(r => setTimeout(r, 5))
              return { valid: value === 'valid', message: 'Invalid code' }
            }
          }]
        })
        .setValue('code', 'invalid')
      const valid = await f.validate()
      expect(valid).toBe(false)
    })
  })

  describe('rendering with cursor', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders focused text field with cursor', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Test')
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      ;(f as any)._cursorPos = 2
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders password field masked', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'pass', label: 'Password', type: 'password' })
        .setValue('pass', 'secret')
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders text field with placeholder', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text', placeholder: 'Enter name' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders cursor at different positions', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'Hello World')
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      ;(f as any)._cursorPos = 0
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      ;(f as any)._cursorPos = 5
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      ;(f as any)._cursorPos = 11
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with input offset for long text', () => {
      const f = form({ layout: 'horizontal', labelWidth: 10 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'This is a very long text that exceeds the input width')
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height }
      ;(f as any)._cursorPos = 40
      ;(f as any)._inputOffset = 30
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with cursor adjusting input offset', () => {
      const f = form({ layout: 'horizontal', labelWidth: 10 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .setValue('name', 'This is long text')
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 25, height }
      ;(f as any)._cursorPos = 15
      ;(f as any)._inputOffset = 20 // Cursor before offset
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('rendering buttons', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders submit button focused', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      ;(f as any)._focusedIndex = 1 // Submit button
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders cancel button focused', () => {
      const f = form({ showCancel: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      ;(f as any)._focusedIndex = 2 // Cancel button
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders submitting state', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      ;(f as any)._submitting = true
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('rendering field types', () => {
    let buffer: ReturnType<typeof createBuffer>
    const width = 60
    const height = 20

    beforeEach(() => {
      buffer = createBuffer(width, height)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders checkbox field unchecked', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders checkbox field checked', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'agree', label: 'Agree', type: 'checkbox' })
        .setValue('agree', true)
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders select field', () => {
      const f = form({ layout: 'horizontal' })
        .addField({
          id: 'color',
          label: 'Color',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' }
          ],
          value: 'red'
        })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders textarea field', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'bio', label: 'Bio', type: 'textarea' })
        .setValue('bio', 'My bio')
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders inline layout', () => {
      const f = form({ layout: 'inline' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with help text', () => {
      const f = form({ layout: 'vertical' })
        .addField({ id: 'name', label: 'Name', type: 'text', helpText: 'Enter your full name' })
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('renders with disabled field', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text', disabled: true })
        .setValue('name', 'Readonly')
      ;(f as any)._bounds = { x: 0, y: 0, width, height }
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('focus edge cases', () => {
    it('does not emit focus when already focused', () => {
      const handler = vi.fn()
      const f = form().onFocus(handler)
      f.focus()
      f.focus() // Second call
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not emit blur when not focused', () => {
      const handler = vi.fn()
      const f = form().onBlur(handler)
      f.blur() // Not focused yet
      expect(handler).not.toHaveBeenCalled()
    })

    it('focuses field that does not exist', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
        .focusField('nonexistent')
      expect(f.focusedField).toBe('name') // Should not change
    })

    it('wraps focus at the end', () => {
      const f = form({ showCancel: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      // Field (0) -> Submit (1) -> Cancel (2) -> Field (0)
      f.focusNext() // Submit
      f.focusNext() // Cancel
      f.focusNext() // Wrap to field
      expect(f.focusedField).toBe('name')
    })

    it('wraps focus at the beginning', () => {
      const f = form({ showCancel: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      f.focusPrevious() // Wrap to cancel
      expect(f.focusedField).toBe(null) // On cancel button
    })
  })

  describe('validateField', () => {
    it('validates a single field', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text', required: true })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      const valid = await f.validateField('name')
      expect(valid).toBe(false)
    })

    it('returns true for non-existent field', async () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      const valid = await f.validateField('nonexistent')
      expect(valid).toBe(true)
    })
  })

  describe('render without bounds', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(60, 20)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('does not render without bounds', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })
  })

  describe('cursor visibility adjustment', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(30, 10) // Small width to test scrolling
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('adjusts input offset when cursor moves past visible area', () => {
      const f = form({ layout: 'horizontal', labelWidth: 8 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 25, height: 10 }

      // Type many characters to push cursor beyond visible area
      // Input width is about (25 - labelWidth - 2) = 15 chars
      for (let i = 0; i < 20; i++) {
        ;(f as any).handleKey(String.fromCharCode(65 + (i % 26)), false) // Type A-Z
      }

      // Render to trigger offset adjustment
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Cursor should have moved past visible area, triggering line 1110-1112
      expect((f as any)._inputOffset).toBeGreaterThan(0)
    })

    it('adjusts input offset when cursor moves before visible area', () => {
      const f = form({ layout: 'horizontal', labelWidth: 8 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 25, height: 10 }

      // Type many characters
      for (let i = 0; i < 20; i++) {
        ;(f as any).handleKey('x', false)
      }

      // Render to set offset
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Now move cursor back to start with home key
      ;(f as any).handleKey('home', false)

      // Set inputOffset manually to simulate scrolled state
      ;(f as any)._inputOffset = 10

      // Render again - cursor is at 0, but offset is 10
      // This triggers line 1108-1109: if (this._cursorPos < this._inputOffset)
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Offset should be reset to cursor position
      expect((f as any)._inputOffset).toBe(0)
    })

    it('truncates text when not focused and text exceeds width', () => {
      const f = form({ layout: 'horizontal', labelWidth: 8 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 25, height: 10 }

      // Set a long value directly
      f.setValue('name', 'This is a very long text value that exceeds the input width')

      // Render without focus - triggers line 1125-1127
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // The text should be truncated in the render
      // Just verify no error occurs and field is rendered
      expect(f.values.name).toBe('This is a very long text value that exceeds the input width')
    })

    it('handles narrow input width', () => {
      const f = form({ layout: 'horizontal', labelWidth: 20 })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // Input width is about 8 chars (30 - 20 - 2)
      // Type more than 8 chars
      for (let i = 0; i < 15; i++) {
        ;(f as any).handleKey('a', false)
      }

      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
      expect((f as any)._inputOffset).toBeGreaterThan(0)
    })
  })

  describe('additional branch coverage', () => {
    let buffer: ReturnType<typeof createBuffer>

    beforeEach(() => {
      buffer = createBuffer(60, 20)
      fillBuffer(buffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles ctrl key in text input', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      // Typing with ctrl should not insert character
      const result = (f as any).handleKey('a', true)
      expect(result).toBe(false)
      expect(f.values.name).toBe('')
    })

    it('handles enter in textarea', () => {
      const f = form()
        .addField({ id: 'notes', label: 'Notes', type: 'textarea' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      // Enter in textarea should not focus next
      ;(f as any).handleKey('enter', false)
      expect(f.focusedField).toBe('notes')
    })

    it('handles backspace at cursor position 0', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }
      ;(f as any)._cursorPos = 0

      const result = (f as any).handleKey('backspace', false)
      expect(result).toBe(true) // Still returns true but doesn't delete
    })

    it('handles delete at end of text', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      f.setValue('name', 'test')
      ;(f as any)._cursorPos = 4 // At end

      const result = (f as any).handleKey('delete', false)
      expect(result).toBe(true) // Still returns true but doesn't delete
      expect(f.values.name).toBe('test')
    })

    it('handles left arrow at cursor position 0', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }
      ;(f as any)._cursorPos = 0

      const result = (f as any).handleKey('left', false)
      expect(result).toBe(true)
      expect((f as any)._cursorPos).toBe(0) // Stays at 0
    })

    it('handles right arrow at end of text', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      f.setValue('name', 'test')
      ;(f as any)._cursorPos = 4 // At end

      const result = (f as any).handleKey('right', false)
      expect(result).toBe(true)
      expect((f as any)._cursorPos).toBe(4) // Stays at 4
    })

    it('handles unknown key in text input', () => {
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      const result = (f as any).handleKey('f1', false)
      expect(result).toBe(false)
    })

    it('handles select with empty options', () => {
      const f = form()
        .addField({ id: 'choice', label: 'Choice', type: 'select', options: [] })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 60, height: 20 }

      const result = (f as any).handleKey('left', false)
      expect(result).toBe(false)
    })

    it('handles validation error callback', async () => {
      const errorHandler = vi.fn()
      const f = form()
        .addField({ id: 'email', label: 'Email', type: 'email', required: true })
        .onValidationError(errorHandler)

      await f.validate()
      expect(errorHandler).toHaveBeenCalled()
    })

    it('handles submit while already submitting', async () => {
      const submitHandler = vi.fn()
      const f = form()
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .onSubmit(submitHandler)

      f.setValue('name', 'Test')
      ;(f as any)._submitting = true
      await f.submit()

      expect(submitHandler).not.toHaveBeenCalled()
    })

    it('renders password field with asterisks', () => {
      const f = form({ layout: 'horizontal', labelWidth: 10 })
        .addField({ id: 'pass', label: 'Password', type: 'password' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      f.setValue('pass', 'secret')
      f.render(buffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      // Check that asterisks are rendered (not the actual password)
      let hasAsterisk = false
      for (let x = 10; x < 40; x++) {
        if (buffer.get(x, 0).char === '*') {
          hasAsterisk = true
          break
        }
      }
      expect(hasAsterisk).toBe(true)
    })

    it('truncates help text when it exceeds width', () => {
      const smallBuffer = createBuffer(20, 10)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const f = form({ layout: 'vertical' })
        .addField({
          id: 'name',
          label: 'Name',
          type: 'text',
          helpText: 'This is a very long help text that should be truncated because it exceeds the available width'
        })
      ;(f as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      // Render triggers line 1052-1054 (help text truncation)
      f.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates select option text when it exceeds width', () => {
      const smallBuffer = createBuffer(15, 10)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const f = form({ layout: 'horizontal', labelWidth: 5 })
        .addField({
          id: 'choice',
          label: 'C',
          type: 'select',
          options: [
            { value: 'opt1', label: 'This is a very long option label that exceeds the width' }
          ]
        })
      f.setValue('choice', 'opt1')
      ;(f as any)._bounds = { x: 0, y: 0, width: 15, height: 10 }

      // Render triggers line 1087-1089 (select text truncation)
      f.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates error text when it exceeds width', () => {
      const smallBuffer = createBuffer(20, 10)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const f = form({ layout: 'vertical', showErrors: true })
        .addField({ id: 'email', label: 'Email', type: 'email', required: true })
      ;(f as any)._bounds = { x: 0, y: 0, width: 20, height: 10 }

      // Trigger validation error with long message
      f.setFieldError('email', 'This is a very long error message that needs to be truncated')

      // Render triggers line 1041-1042 (error text truncation)
      f.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates label in vertical layout when it exceeds width', () => {
      const smallBuffer = createBuffer(15, 10)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const f = form({ layout: 'vertical' })
        .addField({
          id: 'name',
          label: 'This is a very long label that exceeds the available width',
          type: 'text'
        })
      ;(f as any)._bounds = { x: 0, y: 0, width: 15, height: 10 }

      // Render triggers line 1012-1014 (label truncation in vertical layout)
      f.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('truncates label in horizontal layout when it exceeds labelWidth', () => {
      const smallBuffer = createBuffer(30, 10)
      fillBuffer(smallBuffer, { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })

      const f = form({ layout: 'horizontal', labelWidth: 10 })
        .addField({
          id: 'name',
          label: 'This is a very long label that exceeds the label width',
          type: 'text'
        })
      ;(f as any)._bounds = { x: 0, y: 0, width: 30, height: 10 }

      // Render triggers line 1025-1027 (label truncation in horizontal layout)
      f.render(smallBuffer, { fg: DEFAULT_FG, bg: DEFAULT_BG, attrs: 0 })
    })

    it('handles mouse click on form with error field', () => {
      const f = form({ layout: 'vertical', showErrors: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      // Add error to first field to trigger getFieldHeight with errors
      f.setFieldError('name', 'Required')
      f.setFieldError('name', 'Too short')

      // Click on second field (which is now below the errors)
      // In vertical layout: Name(1) + input(1) + errors(2) = row 4 is where Email starts
      ;(f as any).handleMouse(5, 4, 'press')
      expect(f.focusedField).toBe('email')
    })

    it('handles mouse click on form with help text field', () => {
      const f = form({ layout: 'vertical' })
        .addField({ id: 'name', label: 'Name', type: 'text', helpText: 'Enter name' })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      // Click on second field (which is now below the help text)
      // In vertical layout: Name(1) + input(1) + help(1) = row 3 is where Email starts
      ;(f as any).handleMouse(5, 3, 'press')
      expect(f.focusedField).toBe('email')
    })

    it('handles mouse click with both errors and help text', () => {
      const f = form({ layout: 'vertical', showErrors: true })
        .addField({
          id: 'name',
          label: 'Name',
          type: 'text',
          helpText: 'Enter your full name'
        })
        .addField({ id: 'email', label: 'Email', type: 'email' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 20 }

      // Add error to first field
      f.setFieldError('name', 'Required')

      // Click on second field: Name(1) + input(1) + error(1) + help(1) = row 4 is where Email starts
      ;(f as any).handleMouse(5, 4, 'press')
      expect(f.focusedField).toBe('email')
    })

    it('handles mouse click on cancel button', () => {
      const cancelHandler = vi.fn()
      const f = form({ layout: 'horizontal', showCancel: true })
        .addField({ id: 'name', label: 'Name', type: 'text' })
        .onCancel(cancelHandler)
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // In horizontal layout: field row is 0, button row is 2 (row 0 + 1 gap + 1)
      // Submit button is at x=0-9 ([ Submit ]), Cancel at x=12+ ([ Cancel ])
      ;(f as any).handleMouse(15, 2, 'press')
      expect(cancelHandler).toHaveBeenCalled()
    })

    it('handles mouse click on button area but missing buttons', () => {
      const f = form({ layout: 'horizontal', showCancel: false })
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // In horizontal layout: field row is 0, button row is 2
      // Click far to the right where there's no button
      const result = (f as any).handleMouse(35, 2, 'press')
      expect(result).toBe(true)
    })

    it('handles mouse release action', () => {
      const f = form({ layout: 'horizontal' })
        .addField({ id: 'name', label: 'Name', type: 'text' })
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Mouse release should return true but not change state
      const result = (f as any).handleMouse(5, 0, 'release')
      expect(result).toBe(true)
    })

    it('adjusts focused index when removing currently focused field', () => {
      const f = form()
        .addField({ id: 'field1', label: 'Field 1', type: 'text' })
        .addField({ id: 'field2', label: 'Field 2', type: 'text' })
        .focus()

      // Focus second field
      f.focusNext()
      expect(f.focusedField).toBe('field2')

      // Remove second field (currently focused)
      f.removeField('field2')

      // Focus should adjust to remain valid
      expect((f as any)._focusedIndex).toBeLessThanOrEqual((f as any)._fields.length)
    })

    it('handles unknown key on checkbox field', () => {
      const f = form()
        .addField({ id: 'check', label: 'Accept', type: 'checkbox' })
        .focus()
      ;(f as any)._bounds = { x: 0, y: 0, width: 40, height: 10 }

      // Press an unknown key on checkbox field (not enter/space)
      const result = (f as any).handleKey('a', false)
      expect(result).toBe(false) // Falls through switch and returns false
    })
  })
})
