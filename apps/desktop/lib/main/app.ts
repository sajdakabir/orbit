import { BrowserWindow, shell, screen, app, protocol, net } from 'electron'
import { join } from 'path'
import appIcon from '@/resources/build/orbit.png?asset'
import { pathToFileURL } from 'url'

// Keep a reference to the pill window to prevent it from being garbage collected.
let pillWindow: BrowserWindow | null = null
// Keep a reference to the main window
export let mainWindow: BrowserWindow | null = null
// Keep a reference to the action panel window
let actionPanelWindow: BrowserWindow | null = null
// Track whether the app is quitting so windows can allow close
let isAppQuitting = false
// Track whether the action panel's renderer has signalled it's ready to receive IPC
let actionPanelRendererReady = false
// Queue of ActionState objects to flush once the renderer is ready
let pendingActionStates: any[] = []
// Resolve function for the ready promise (set during createActionPanelWindow)
let resolveRendererReady: (() => void) | null = null
let rendererReadyPromise: Promise<void> | null = null

export function setAppQuitting(): void {
  isAppQuitting = true
}

export function getPillWindow(): BrowserWindow | null {
  return pillWindow
}

export function getActionPanelWindow(): BrowserWindow | null {
  return actionPanelWindow
}

// --- No changes to createAppWindow ---
export function createAppWindow(): BrowserWindow {
  // Create the main window.
  mainWindow = new BrowserWindow({
    width: 1270,
    height: 800,
    show: false,
    backgroundColor: '#ffffff',
    icon: appIcon,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 18 },
    title: 'Orbit',
    maximizable: true,
    resizable: true,
    minWidth: 1270,
    maxWidth: 1270,
    minHeight: 800,
    maxHeight: 800,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      webSecurity: true,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Handle green button click on macOS to toggle fullscreen
  if (process.platform === 'darwin') {
    mainWindow.on('maximize', () => {
      mainWindow?.setFullScreen(!mainWindow.isFullScreen())
    })
  }

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "connect-src 'self' http://localhost:* https://sage.sajdakabir.com https://backend.composio.dev https://*.posthog.com https://app.posthog.com https://eu.posthog.com https://us.i.posthog.com; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: res: https:; " +
              "media-src 'self' blob:;",
          ],
        },
      })
    },
  )

  // Clean up the reference when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null
    // On Windows, closing the main window should quit the entire app
    if (process.platform === 'win32') {
      app.quit()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // Disable DevTools in production builds
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools()
    })
  }

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

const PILL_MAX_WIDTH = 172
const PILL_MAX_HEIGHT = 84
export function createPillWindow(): void {
  pillWindow = new BrowserWindow({
    width: PILL_MAX_WIDTH,
    height: PILL_MAX_HEIGHT,
    show: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true, // Keep on top
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    focusable: false, // Prevents window from stealing focus
    hasShadow: false,
    type: 'panel',
    acceptFirstMouse: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
    hiddenInMissionControl: true,
  })

  pillWindow.setIgnoreMouseEvents(true, { forward: true })

  // Set properties for macOS to ensure it stays on top of full-screen apps
  if (process.platform === 'darwin') {
    pillWindow.setAlwaysOnTop(true, 'screen-saver', 1)
    pillWindow.setFullScreenable(false)

    pillWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    })
  }

  // Use a URL hash to tell our React app to load the pill component.
  const pillUrl =
    !app.isPackaged && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/pill`
      : `${pathToFileURL(join(__dirname, '../renderer/index.html'))}#/pill`

  pillWindow.loadURL(pillUrl)

  // Uncomment the next line to open the DevTools for debugging the pill window.
  // This is useful during development to inspect the pill's UI and behavior.
  // pillWindow.webContents.openDevTools({ mode: 'detach' })

  // Clean up the reference when the window is closed.
  pillWindow.on('closed', () => {
    pillWindow = null
  })
}

const ACTION_PANEL_WIDTH = 320
const ACTION_PANEL_HEIGHT = 420

export function createActionPanelWindow(): void {
  actionPanelRendererReady = false
  pendingActionStates = []

  // Create a fresh ready promise
  rendererReadyPromise = new Promise<void>((resolve) => {
    resolveRendererReady = resolve
  })

  actionPanelWindow = new BrowserWindow({
    width: ACTION_PANEL_WIDTH,
    height: ACTION_PANEL_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    focusable: true,
    hasShadow: true,
    type: 'panel',
    acceptFirstMouse: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
    hiddenInMissionControl: true,
  })

  if (process.platform === 'darwin') {
    actionPanelWindow.setAlwaysOnTop(true, 'screen-saver', 1)
    actionPanelWindow.setFullScreenable(false)
    actionPanelWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    })
  }

  // Position on the right side of the screen
  positionActionPanel()

  const actionPanelUrl =
    !app.isPackaged && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/action-panel`
      : `${pathToFileURL(join(__dirname, '../renderer/index.html'))}#/action-panel`

  console.log('[ActionPanel] Loading URL:', actionPanelUrl)
  actionPanelWindow.loadURL(actionPanelUrl)

  // Uncomment to debug the action panel renderer:
  // actionPanelWindow.webContents.openDevTools({ mode: 'detach' })

  // Intercept close — just hide instead of destroying so it can reappear
  // But allow close when the app is quitting, otherwise quit gets blocked
  actionPanelWindow.on('close', (e) => {
    if (!isAppQuitting && actionPanelWindow && !actionPanelWindow.isDestroyed()) {
      e.preventDefault()
      actionPanelWindow.hide()
    }
  })
}

/**
 * Called by the renderer via IPC when the ActionPanelWindow React component has mounted
 * and attached its event listeners. This ensures we never send state before the
 * renderer can receive it.
 */
export function onActionPanelRendererReady(): void {
  console.log('[ActionPanel] Renderer signalled READY')
  actionPanelRendererReady = true
  if (resolveRendererReady) {
    resolveRendererReady()
    resolveRendererReady = null
  }
  // Flush any queued state updates
  flushPendingStates()
}

/**
 * Send a state update to the action panel. If the renderer isn't ready yet,
 * queue the update and it will be flushed when the renderer signals ready.
 */
export function sendActionStateToPanel(state: any): void {
  if (!actionPanelWindow || actionPanelWindow.isDestroyed()) {
    console.warn('[ActionPanel] sendActionStateToPanel: no window')
    return
  }

  if (!actionPanelRendererReady) {
    console.log('[ActionPanel] Renderer not ready, queuing state:', state.phase)
    // Only keep the latest state — old ones are stale
    pendingActionStates = [state]
    return
  }

  if (!actionPanelWindow.webContents.isDestroyed()) {
    console.log('[ActionPanel] Sending state to renderer:', state.phase)
    actionPanelWindow.webContents.send('action-state-update', state)
  }
}

function flushPendingStates(): void {
  if (!actionPanelWindow || actionPanelWindow.isDestroyed()) return
  if (actionPanelWindow.webContents.isDestroyed()) return

  for (const state of pendingActionStates) {
    console.log('[ActionPanel] Flushing queued state:', state.phase)
    actionPanelWindow.webContents.send('action-state-update', state)
  }
  pendingActionStates = []
}

export async function showActionPanel(): Promise<void> {
  if (!actionPanelWindow || actionPanelWindow.isDestroyed()) {
    console.log('[ActionPanel] Window missing or destroyed, re-creating...')
    createActionPanelWindow()
  }

  positionActionPanel()

  // Re-apply alwaysOnTop before showing — macOS can lose this after hide/show cycles
  if (process.platform === 'darwin') {
    actionPanelWindow!.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  actionPanelWindow!.showInactive()
  actionPanelWindow!.moveTop()
  actionPanelWindow!.focus()

  console.log('[ActionPanel] showActionPanel: window shown, rendererReady:', actionPanelRendererReady)

  // Wait for the renderer to be ready (should be near-instant if window was pre-created)
  if (!actionPanelRendererReady && rendererReadyPromise) {
    console.log('[ActionPanel] Waiting for renderer ready signal...')
    // Timeout after 3s to avoid hanging forever
    await Promise.race([
      rendererReadyPromise,
      new Promise<void>(resolve => setTimeout(resolve, 3000)),
    ])
    console.log('[ActionPanel] Renderer ready (or timed out), rendererReady:', actionPanelRendererReady)
  }
}

export function hideActionPanel(): void {
  if (!actionPanelWindow || actionPanelWindow.isDestroyed()) return
  console.log('[ActionPanel] hideActionPanel called')
  actionPanelWindow.hide()
}

function positionActionPanel(): void {
  if (!actionPanelWindow || actionPanelWindow.isDestroyed()) return

  try {
    const point = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(point)
    const { x, y, width } = display.workArea

    // Position at top-right of the work area with some padding
    const newX = x + width - ACTION_PANEL_WIDTH - 16
    const newY = y + 16

    actionPanelWindow.setPosition(Math.round(newX), Math.round(newY), false)
  } catch (error) {
    console.warn('[ActionPanel] Could not position:', error)
  }
}

export function startPillPositioner() {
  // Listen for display changes to handle dock visibility changes
  screen.on('display-metrics-changed', () => {
    updatePillPosition()
  })

  // Initial position on start
  updatePillPosition()

  // Throttle updates (Windows needs less frequent updates to avoid jitter)
  const intervalMs = process.platform === 'win32' ? 750 : 250
  setInterval(updatePillPosition, intervalMs)
}

function updatePillPosition() {
  if (!pillWindow) return

  try {
    // Get the display that the mouse cursor is currently on.
    const point = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(point)
    const { width: pillWidth, height: pillHeight } = pillWindow.getBounds()

    // Use workArea instead of bounds to account for dock/menu bar
    const { x, y, width, height } = display.workArea
    const screenBounds = display.bounds

    const scale = display.scaleFactor || 1
    const roundToDeviceDip = (v: number) =>
      Math.round(Math.round(v * scale) / scale)

    // Calculate position: Horizontally centered, positioned above taskbar
    const newX = roundToDeviceDip(x + width / 2 - pillWidth / 2)

    // Position just above the work area bottom
    const newY = roundToDeviceDip(y + height - pillHeight - 10)

    // Ensure we don't go below the screen bounds
    const maxY = screenBounds.y + screenBounds.height - pillHeight - 10
    const finalY = Math.min(newY, maxY)

    // Only move if position actually changed (>= 1 DIP)
    const [currX, currY] = pillWindow.getPosition()
    if (Math.abs(currX - newX) < 1 && Math.abs(currY - finalY) < 1) {
      return
    }

    // Set the position of the pill window.
    pillWindow.setPosition(newX, finalY, false) // `false` = not animated
  } catch (error) {
    // This can fail if the app is starting up or shutting down.
    console.warn('Could not update pill position:', error)
  }
}

// --- No changes to other functions ---
export function registerResourcesProtocol() {
  protocol.handle('res', async request => {
    try {
      const url = new URL(request.url)
      // Combine hostname and pathname to get the full path
      const fullPath = join(url.hostname, url.pathname.slice(1))
      const filePath = join(__dirname, '../../resources', fullPath)
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('Protocol error:', error)
      return new Response('Resource not found', { status: 404 })
    }
  })
}
