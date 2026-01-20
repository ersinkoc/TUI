/**
 * @oxog/tui - Music Player Application
 *
 * A mock music player interface with:
 * - Playlist display
 * - Progress bar
 * - Playback controls
 *
 * Run with: npx tsx examples/app-music-player.ts
 *
 * Controls:
 * - Space: Play/Pause
 * - Arrow Up/Down: Navigate playlist
 * - n: Next track
 * - p: Previous track
 * - +/-: Volume control
 * - q / Ctrl+C: Quit
 */

import {
  tui,
  box,
  text,
  list,
  progress,
  type ListItem
} from '../src'
import { fullPlugins } from '../src/plugins'

// ============================================================
// Application Setup
// ============================================================

const app = tui({
  plugins: fullPlugins(),
  title: 'Music Player'
})

// ============================================================
// Music Data
// ============================================================

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number // seconds
}

const playlist: Track[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', album: 'Hurry Up', duration: 243 },
  { id: '2', title: 'Starlight', artist: 'Muse', album: 'Black Holes', duration: 240 },
  { id: '3', title: 'Digital Love', artist: 'Daft Punk', album: 'Discovery', duration: 301 },
  { id: '4', title: 'Intro', artist: 'The xx', album: 'xx', duration: 127 },
  { id: '5', title: 'Around the World', artist: 'Daft Punk', album: 'Homework', duration: 429 },
  { id: '6', title: 'Hysteria', artist: 'Muse', album: 'Absolution', duration: 227 },
  { id: '7', title: 'Time', artist: 'Hans Zimmer', album: 'Inception', duration: 274 },
  { id: '8', title: 'Strobe', artist: 'Deadmau5', album: '4x4=12', duration: 637 }
]

// State
let currentTrackIndex = 0
let isPlaying = false
let currentTime = 0
let volume = 75
let playInterval: ReturnType<typeof setInterval> | null = null

function getCurrentTrack(): Track {
  return playlist[currentTrackIndex]!
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ============================================================
// Widgets
// ============================================================

// Track info
const titleText = text('').bold().color('#ffffff')
const artistText = text('').color('#888888')
const albumText = text('').color('#666666')

// Progress bar
const progressBar = progress({ value: 0 }).filledColor('#4a9eff').showPercent(false)
const timeText = text('')

// Play status
const playStatus = text('⏸ Paused').color('#ffd93d')

// Volume display
const volumeText = text(`Volume: ${volume}%`).color('#888888')

// Playlist
const playlistItems: ListItem[] = playlist.map((track, i) => ({
  id: track.id,
  label: `${i === currentTrackIndex ? '▶' : '  '} ${track.title} - ${track.artist}`
}))

const playlistWidget = list({ items: playlistItems })
  .width('100%')
  .height('100%')
  .onSelect(item => {
    const index = playlist.findIndex(t => t.id === item.id)
    if (index !== -1) {
      currentTrackIndex = index
      currentTime = 0
      updateTrackInfo()
      updatePlaylist()
      app.refresh()
    }
  })

function updatePlaylist() {
  const items: ListItem[] = playlist.map((track, i) => ({
    id: track.id,
    label: `${i === currentTrackIndex ? '▶' : '  '} ${track.title} - ${track.artist}`
  }))
  playlistWidget.items(items)
}

// Status line
const helpText = text('Space: Play/Pause | ↑↓: Select | n/p: Next/Prev | +/-: Volume | q: Quit').color('#666666')

// Update functions
function updateTrackInfo() {
  const track = getCurrentTrack()
  titleText.content(track.title)
  artistText.content(track.artist)
  albumText.content(track.album)
  timeText.content(`${formatTime(currentTime)} / ${formatTime(track.duration)}`)
  progressBar.value(Math.round((currentTime / track.duration) * 100))
}

function updatePlayStatus() {
  if (isPlaying) {
    playStatus.content('▶ Playing').color('#00ff88')
  } else {
    playStatus.content('⏸ Paused').color('#ffd93d')
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length
  currentTime = 0
  updateTrackInfo()
  updatePlaylist()
}

function prevTrack() {
  if (currentTime > 3) {
    currentTime = 0
  } else {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length
    currentTime = 0
  }
  updateTrackInfo()
  updatePlaylist()
}

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
      .height(1)
      .add(text(' Music Player').color('#4a9eff').bold())
  )
  // Main content
  .add(
    box()
      .flex(1)
      .flexDirection('row')
      .gap(2)
      .padding([1, 0])
      // Now Playing section
      .add(
        box()
          .width(40)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' Now Playing').bold())
          .add(text(''))
          .add(titleText)
          .add(artistText)
          .add(albumText)
          .add(text(''))
          .add(progressBar)
          .add(timeText)
          .add(text(''))
          .add(playStatus)
          .add(volumeText)
      )
      // Playlist section
      .add(
        box()
          .flex(1)
          .flexDirection('column')
          .border('single')
          .padding(1)
          .add(text(' Playlist').bold())
          .add(text(''))
          .add(playlistWidget)
      )
  )
  // Footer
  .add(helpText)

// Initialize
updateTrackInfo()
playlistWidget.focus()

// ============================================================
// Playback Loop
// ============================================================

function startPlayback() {
  if (playInterval) return

  isPlaying = true
  updatePlayStatus()

  playInterval = setInterval(() => {
    if (!isPlaying) return

    currentTime += 1
    const track = getCurrentTrack()

    if (currentTime >= track.duration) {
      nextTrack()
    }

    updateTrackInfo()
    app.refresh()
  }, 1000)
}

function stopPlayback() {
  isPlaying = false
  updatePlayStatus()

  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function togglePlayback() {
  if (isPlaying) {
    stopPlayback()
  } else {
    startPlayback()
  }
  app.refresh()
}

// ============================================================
// Event Handlers
// ============================================================

app.on('key', event => {
  // Quit
  if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
    stopPlayback()
    app.quit()
    return
  }

  // Play/Pause
  if (event.name === 'space') {
    togglePlayback()
    return
  }

  // Next track
  if (event.name === 'n') {
    nextTrack()
    app.refresh()
    return
  }

  // Previous track
  if (event.name === 'p' && !event.ctrl) {
    prevTrack()
    app.refresh()
    return
  }

  // Volume up
  if (event.name === '+' || event.name === '=') {
    volume = Math.min(100, volume + 5)
    volumeText.content(`Volume: ${volume}%`)
    app.refresh()
    return
  }

  // Volume down
  if (event.name === '-') {
    volume = Math.max(0, volume - 5)
    volumeText.content(`Volume: ${volume}%`)
    app.refresh()
    return
  }
})

// ============================================================
// Start Application
// ============================================================

app.onQuit(() => {
  stopPlayback()
  console.log('Thanks for using Music Player!')
})

app.mount(root)
app.start()
