/**
 * @oxog/tui - System Monitor Application
 *
 * A real-time system monitoring dashboard with:
 * - CPU usage
 * - Memory usage
 * - System info
 * - Process list
 *
 * Run with: npx tsx examples/app-system-monitor.ts
 *
 * Controls:
 * - p: Pause/Resume updates
 * - r: Refresh now
 * - q / Ctrl+C: Quit
 */

import {
  tui,
  box,
  text,
  progress,
  table
} from '../src'
import { fullPlugins } from '../src/plugins'
import * as os from 'os'

// ============================================================
// Application Setup
// ============================================================

const app = tui({
  plugins: fullPlugins(),
  title: 'System Monitor'
})

// State
let isPaused = false
let updateInterval: ReturnType<typeof setInterval> | null = null

// ============================================================
// System Data Collection
// ============================================================

function getCpuUsage(): number {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times]
    }
    totalIdle += cpu.times.idle
  }

  return Math.round(100 - (totalIdle / totalTick) * 100)
}

function getMemoryUsage(): { used: number; total: number; percent: number } {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return {
    used,
    total,
    percent: Math.round((used / total) * 100)
  }
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function getUptime(): string {
  const uptime = os.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getLoadAvg(): string {
  return os.loadavg().map(l => l.toFixed(2)).join(', ')
}

// Mock process data
function getProcessData() {
  const mem = getMemoryUsage()
  return [
    { name: 'node (this)', cpu: (getCpuUsage() + Math.random() * 5).toFixed(1) + '%', memory: formatBytes(process.memoryUsage().heapUsed) },
    { name: 'chrome', cpu: (5 + Math.random() * 15).toFixed(1) + '%', memory: formatBytes(mem.total * 0.15) },
    { name: 'vscode', cpu: (2 + Math.random() * 8).toFixed(1) + '%', memory: formatBytes(mem.total * 0.08) },
    { name: 'docker', cpu: (1 + Math.random() * 5).toFixed(1) + '%', memory: formatBytes(mem.total * 0.05) },
    { name: 'postgres', cpu: (1 + Math.random() * 4).toFixed(1) + '%', memory: formatBytes(mem.total * 0.03) }
  ]
}

// ============================================================
// Widgets
// ============================================================

// Header
const titleText = text(' System Monitor').color('#4a9eff').bold()
const statusText = text(' Running').color('#00ff88')

// CPU Progress
const cpuLabel = text('CPU: 0%')
const cpuProgress = progress({ value: 0 }).showPercent(true).filledColor('#ff6b6b')

// Memory Progress
const memLabel = text('Memory: 0 / 0 GB')
const memProgress = progress({ value: 0 }).showPercent(true).filledColor('#4ecdc4')

// System Info
const hostnameText = text(`Hostname: ${os.hostname()}`)
const platformText = text(`Platform: ${os.platform()} ${os.arch()}`)
const cpuModelText = text(`CPU: ${os.cpus()[0]?.model.substring(0, 35) || 'Unknown'}`)
const coresText = text(`Cores: ${os.cpus().length}`)
const uptimeText = text(`Uptime: ${getUptime()}`)
const loadText = text(`Load: ${getLoadAvg()}`)

// Process Table
const processTable = table()
  .columns([
    { key: 'name', header: 'Process', width: 20 },
    { key: 'cpu', header: 'CPU', width: 10 },
    { key: 'memory', header: 'Memory', width: 12 }
  ])
  .data(getProcessData())

// Footer
const helpText = text(' p: Pause | r: Refresh | q: Quit').color('#888888')

// ============================================================
// Layout
// ============================================================

const root = box()
  .width('100%')
  .height('100%')
  .flexDirection('column')
  .border('rounded')
  .borderColor('#4a9eff')
  .padding(1)
  // Header
  .add(
    box()
      .flexDirection('row')
      .add(titleText)
      .add(statusText)
  )
  // Main content
  .add(
    box()
      .flex(1)
      .flexDirection('row')
      .gap(2)
      .padding([1, 0])
      // Left column - Stats
      .add(
        box()
          .width(45)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' System Stats').bold())
          .add(text(''))
          .add(cpuLabel)
          .add(cpuProgress)
          .add(text(''))
          .add(memLabel)
          .add(memProgress)
          .add(text(''))
          .add(text(' System Info').bold().color('#ffd93d'))
          .add(hostnameText)
          .add(platformText)
          .add(cpuModelText)
          .add(coresText)
          .add(uptimeText)
          .add(loadText)
      )
      // Right column - Processes
      .add(
        box()
          .flex(1)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' Processes').bold())
          .add(text(''))
          .add(processTable)
      )
  )
  // Footer
  .add(helpText)

// ============================================================
// Update Function
// ============================================================

function updateStats() {
  if (isPaused) return

  // CPU
  const cpu = getCpuUsage()
  cpuLabel.content(`CPU: ${cpu}%`)
  cpuProgress.value(cpu)

  // Memory
  const mem = getMemoryUsage()
  memLabel.content(`Memory: ${formatBytes(mem.used)} / ${formatBytes(mem.total)}`)
  memProgress.value(mem.percent)

  // System info
  uptimeText.content(`Uptime: ${getUptime()}`)
  loadText.content(`Load: ${getLoadAvg()}`)

  // Processes
  processTable.data(getProcessData())

  app.refresh()
}

// ============================================================
// Event Handlers
// ============================================================

app.on('key', event => {
  // Quit
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    if (updateInterval) clearInterval(updateInterval)
    app.quit()
    return
  }

  // Pause/Resume
  if (event.name === 'p') {
    isPaused = !isPaused
    statusText.content(isPaused ? ' Paused' : ' Running')
    statusText.color(isPaused ? '#ffd93d' : '#00ff88')
    app.refresh()
    return
  }

  // Force refresh
  if (event.name === 'r') {
    updateStats()
    return
  }
})

// ============================================================
// Start Application
// ============================================================

app.onQuit(() => {
  if (updateInterval) clearInterval(updateInterval)
  console.log('Thanks for using System Monitor!')
})

app.mount(root)
app.start()

// Start update loop
updateStats()
updateInterval = setInterval(updateStats, 1000)
