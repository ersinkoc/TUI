/**
 * @oxog/tui - Example 03: Form
 *
 * Demonstrates form inputs including text input,
 * checkboxes, and select lists.
 */

import { tui, box, text, input, checkbox, select } from '../src'
import { standardPlugins } from '../src/plugins'

const app = tui({
  plugins: standardPlugins(),
  title: 'Form Example'
})

// Form fields
const nameInput = input()
  .placeholder('Enter your name')
  .width('100%')
  .onChange(value => console.error('Name:', value))

const emailInput = input()
  .placeholder('Enter your email')
  .width('100%')
  .onChange(value => console.error('Email:', value))

const passwordInput = input().placeholder('Enter password').password(true).width('100%')

const termsCheckbox = checkbox()
  .label('I agree to the terms and conditions')
  .onChange(checked => console.error('Terms:', checked))

const planSelect = select()
  .options([
    { label: 'Free Plan', value: 'free' },
    { label: 'Pro Plan ($10/mo)', value: 'pro' },
    { label: 'Enterprise Plan ($50/mo)', value: 'enterprise' }
  ])
  .height(5)
  .onChange(item => console.error('Plan:', item?.value))

// Form layout
const form = box()
  .flexDirection('column')
  .padding(2)
  .gap(1)
  .border('single')
  .add(text('Registration Form').bold().color('#00ff00'))
  .add(text(''))
  .add(text('Name:').color('#888888'))
  .add(nameInput)
  .add(text('Email:').color('#888888'))
  .add(emailInput)
  .add(text('Password:').color('#888888'))
  .add(passwordInput)
  .add(text(''))
  .add(text('Select Plan:').color('#888888'))
  .add(planSelect)
  .add(text(''))
  .add(termsCheckbox)

// Main layout
const root = box()
  .flexDirection('column')
  .justifyContent('center')
  .alignItems('center')
  .add(box().width(50).add(form))
  .add(text('Tab to navigate, Space to toggle, Enter to submit').dim())
  .add(text('Press q to exit').dim())

// Handle keys
app.on('key', event => {
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    app.quit()
  }
})

app.mount(root)
app.start()
