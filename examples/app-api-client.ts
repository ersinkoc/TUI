#!/usr/bin/env npx tsx
/**
 * @oxog/tui - API Client Example
 *
 * A simple REST API test client demonstrating:
 * - HTTP request building (GET, POST, PUT, DELETE)
 * - Response viewing with JSON syntax highlighting
 * - Request history
 *
 * Run with: npx tsx examples/app-api-client.ts
 */

import { tui, box, text, input, panel, textarea, jsonviewer } from '../src'
import type { Node } from '../src/types'
import * as http from 'http'
import * as https from 'https'
import * as url from 'url'

// ============================================================
// Types
// ============================================================

interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
}

interface AppState {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  body: string
  response: HttpResponse | null
  isLoading: boolean
  error: string | null
  history: Array<{ method: string; url: string; status?: number }>
}

// ============================================================
// HTTP Client
// ============================================================

function performRequest(
  method: string,
  requestUrl: string,
  body?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    try {
      const parsedUrl = new url.URL(requestUrl)
      const isHttps = parsedUrl.protocol === 'https:'
      const lib = isHttps ? https : http

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'User-Agent': '@oxog/tui API Client',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }

      const req = lib.request(options, (res) => {
        let responseBody = ''

        res.on('data', (chunk) => {
          responseBody += chunk.toString()
        })

        res.on('end', () => {
          const time = Date.now() - startTime
          const headers: Record<string, string> = {}

          for (const [key, value] of Object.entries(res.headers)) {
            if (value) {
              headers[key] = Array.isArray(value) ? value.join(', ') : value
            }
          }

          resolve({
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            headers,
            body: responseBody,
            time
          })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (body && ['POST', 'PUT'].includes(method)) {
        req.write(body)
      }

      req.end()
    } catch (error) {
      reject(error)
    }
  })
}

// ============================================================
// Main Application
// ============================================================

async function main() {
  // Application state
  const state: AppState = {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    body: '',
    response: null,
    isLoading: false,
    error: null,
    history: []
  }

  // Create TUI app
  const app = tui({
    title: 'API Client',
    fullscreen: true
  })

  // UI References
  let urlInput: ReturnType<typeof input>
  let bodyInput: ReturnType<typeof textarea>

  // Send request
  async function sendRequest() {
    if (state.isLoading) return

    state.isLoading = true
    state.error = null
    render()

    try {
      state.response = await performRequest(state.method, state.url, state.body)
      state.history.unshift({
        method: state.method,
        url: state.url,
        status: state.response.status
      })
      if (state.history.length > 20) {
        state.history.pop()
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unknown error'
      state.response = null
    }

    state.isLoading = false
    render()
  }

  // Cycle through methods
  function cycleMethod() {
    const methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE'> = ['GET', 'POST', 'PUT', 'DELETE']
    const idx = methods.indexOf(state.method)
    state.method = methods[(idx + 1) % methods.length]!
    render()
  }

  // Create UI
  function createUI(): Node {
    // Method badge
    const methodColors: Record<string, number> = {
      GET: 2,    // Green
      POST: 3,   // Yellow
      PUT: 4,    // Blue
      DELETE: 1  // Red
    }
    const methodBadge = text(` ${state.method.padEnd(6)} `)

    // URL Input
    urlInput = input({
      value: state.url,
      placeholder: 'Enter URL...'
    })
    urlInput.onChange(value => {
      state.url = value
    })

    // Method selector text
    const methodSelector = text(`[${state.method}] Press M to change method`)

    // URL bar
    const urlBar = panel({ title: 'Request', border: 'rounded' })
      .add(methodSelector)
      .add(urlInput)

    // Body input for POST/PUT
    if (state.method === 'POST' || state.method === 'PUT') {
      bodyInput = textarea({
        value: state.body,
        placeholder: 'Request body (JSON)...'
      })
      bodyInput.onChange(value => {
        state.body = value
      })
      urlBar.add(text('\nBody:'))
      urlBar.add(bodyInput)
    }

    // Response panel
    const responsePanel = panel({ title: 'Response', border: 'rounded' })

    if (state.isLoading) {
      responsePanel.add(text('Loading...'))
    } else if (state.error) {
      responsePanel.add(text(`Error: ${state.error}`))
    } else if (state.response) {
      const statusColor = state.response.status < 400 ? 2 : 1
      responsePanel.add(
        text(`Status: ${state.response.status} ${state.response.statusText} (${state.response.time}ms)`)
      )
      responsePanel.add(text(''))

      // Try to parse and display as JSON
      try {
        const jsonData = JSON.parse(state.response.body)
        const viewer = jsonviewer({ data: jsonData })
        responsePanel.add(viewer)
      } catch {
        // Not JSON, show as text
        responsePanel.add(text(state.response.body.slice(0, 1000)))
      }
    } else {
      responsePanel.add(text('Press Enter or S to send request'))
    }

    // History panel
    const historyPanel = panel({ title: 'History', border: 'rounded' })
    if (state.history.length === 0) {
      historyPanel.add(text('No requests yet'))
    } else {
      for (const entry of state.history.slice(0, 10)) {
        const statusText = entry.status ? ` [${entry.status}]` : ''
        historyPanel.add(text(`${entry.method} ${entry.url.slice(0, 40)}...${statusText}`))
      }
    }

    // Help text
    const helpText = text('\n  [Enter/S] Send  [M] Method  [Tab] Focus  [Ctrl+Q] Quit')

    // Main layout
    return box()
      .add(urlBar)
      .add(responsePanel)
      .add(historyPanel)
      .add(helpText)
  }

  // Render function
  function render() {
    app.mount(createUI())
    app.markDirty()
  }

  // Handle key input
  app.on('key', (key: string, ctrl: boolean) => {
    if (ctrl && key === 'q') {
      app.quit()
      return
    }

    if (key === 'enter' || key === 's') {
      sendRequest()
      return
    }

    if (key === 'm') {
      cycleMethod()
      return
    }
  })

  // Initial render
  render()

  // Start
  await app.start()
}

// Run
main().catch(console.error)
