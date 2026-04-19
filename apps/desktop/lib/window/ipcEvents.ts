import { BrowserWindow, ipcMain, shell, app, dialog } from 'electron'
import { ORBIT_ENV } from '../main/env'
import log from 'electron-log'
import os from 'os'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import store, { getCurrentUserId } from '../main/store'
import { STORE_KEYS } from '../constants/store-keys'
import {
  checkAccessibilityPermission,
  checkMicrophonePermission,
} from '../utils/crossPlatform'
import { getUpdateStatus, installUpdateNow } from '../main/autoUpdaterWrapper'

import {
  startKeyListener,
  KeyListenerProcess,
  stopKeyListener,
  registerAllHotkeys,
} from '../media/keyboard'
import { getPillWindow, mainWindow, onActionPanelRendererReady } from '../main/app'
import {
  generateNewAuthState,
  handleLogin,
  handleLogout,
  ensureValidTokens,
} from '../auth/events'
import { KeyValueStore } from '../main/sqlite/repo'
import { machineId } from 'node-machine-id'
import {
  NotesTable,
  DictionaryTable,
  InteractionsTable,
  UserMetadataTable,
  TodayTable,
} from '../main/sqlite/repo'
import { audioRecorderService } from '../media/audio'
import { voiceInputService } from '../main/voiceInputService'
import { orbitSessionManager } from '../main/orbitSessionManager'
import { OrbitMode } from '@/app/generated/orbit_pb'
import {
  getSelectedText,
  getSelectedTextString,
  hasSelectedText,
} from '../media/selected-text-reader'
import { IPC_EVENTS } from '../types/ipc'
import { orbitHttpClient } from '../clients/orbitHttpClient'

const handleIPC = (channel: string, handler: (...args: any[]) => any) => {
  ipcMain.handle(channel, handler)
}

// Helper function to get the correct API base URL in the main process
const getApiBaseUrl = (): string => {
  if (ORBIT_ENV === 'prod') {
    return 'https://sage.sajdakabir.com'
  }
  return 'http://localhost:3000'
}

// This single function registers all IPC handlers for the application.
// It should only be called once.
export function registerIPC() {
  // Store
  ipcMain.on('electron-store-get', (event, val) => {
    event.returnValue = store.get(val)
  })
  ipcMain.on('electron-store-set', (_event, key, val) => {
    store.set(key, val)
  })

  ipcMain.on('audio-devices-changed', () => {
    console.log('[IPC] Audio devices changed, notifying windows.')
    // Notify all windows to refresh their device lists in the UI.
    if (
      mainWindow &&
      !mainWindow.isDestroyed() &&
      !mainWindow.webContents.isDestroyed()
    ) {
      mainWindow.webContents.send(IPC_EVENTS.FORCE_DEVICE_LIST_RELOAD)
    }
    getPillWindow()?.webContents.send(IPC_EVENTS.FORCE_DEVICE_LIST_RELOAD)
  })

  ipcMain.on('install-update', async () => {
    await installUpdateNow()
  })

  ipcMain.handle('get-update-status', () => {
    return getUpdateStatus()
  })

  // Login Item Settings
  handleIPC('set-login-item-settings', (_e, enabled: boolean) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
      })
      console.log(`Successfully set login item to: ${enabled}`)
    } catch (error: any) {
      log.error('Failed to set login item settings:', error)
    }
  })
  handleIPC('get-login-item-settings', () => {
    try {
      return app.getLoginItemSettings()
    } catch (error: any) {
      log.error('Failed to get login item settings:', error)
      return { openAtLogin: false, openAsHidden: false }
    }
  })

  // Dock Settings (macOS only)
  handleIPC('set-dock-visibility', (_e, visible: boolean) => {
    try {
      if (process.platform === 'darwin') {
        if (visible) {
          app.dock?.show()
        } else {
          app.dock?.hide()
        }
        console.log(`Successfully set dock visibility to: ${visible}`)
      } else {
        log.warn('Dock visibility setting is only available on macOS')
      }
    } catch (error: any) {
      log.error('Failed to set dock visibility:', error)
    }
  })
  handleIPC('get-dock-visibility', () => {
    try {
      if (process.platform === 'darwin' && app.dock) {
        const isVisible = app.dock.isVisible()
        return { isVisible }
      } else {
        log.warn('Dock visibility check is only available on macOS')
        return { isVisible: true } // Default to visible on non-macOS platforms
      }
    } catch (error: any) {
      log.error('Failed to get dock visibility:', error)
      return { isVisible: true }
    }
  })

  // Key Listener
  handleIPC('start-key-listener-service', () => {
    startKeyListener()
  })
  handleIPC('stop-key-listener', () => stopKeyListener())
  handleIPC('register-hotkeys', () => registerAllHotkeys())
  handleIPC('start-native-recording-service', () =>
    orbitSessionManager.startSession(OrbitMode.TRANSCRIBE),
  )
  handleIPC('stop-native-recording-service', () =>
    orbitSessionManager.completeSession(),
  )
  handleIPC('block-keys', (_e, keys: string[]) => {
    if (KeyListenerProcess)
      KeyListenerProcess.stdin?.write(
        JSON.stringify({ command: 'block', keys }) + '\n',
      )
  })
  handleIPC('unblock-key', (_e, key: string) => {
    if (KeyListenerProcess)
      KeyListenerProcess.stdin?.write(
        JSON.stringify({ command: 'unblock', key }) + '\n',
      )
  })
  handleIPC('get-blocked-keys', () => {
    if (KeyListenerProcess)
      KeyListenerProcess.stdin?.write(
        JSON.stringify({ command: 'get_blocked' }) + '\n',
      )
  })

  // Permissions
  handleIPC('check-accessibility-permission', (_e, prompt: boolean = false) =>
    checkAccessibilityPermission(prompt),
  )
  handleIPC(
    'check-microphone-permission',
    async (_e, prompt: boolean = false) => {
      return checkMicrophonePermission(prompt)
    },
  )

  // Auth
  handleIPC('generate-new-auth-state', () => generateNewAuthState())
  handleIPC('logout', async () => await handleLogout())
  handleIPC(
    'notify-login-success',
    async (_e, { profile, idToken, accessToken }) => {
      await handleLogin(profile, idToken, accessToken)
    },
  )

  // Start trial when onboarding completes
  handleIPC('start-trial-after-onboarding', async () => {
    const result = await orbitHttpClient.post('/trial/start', undefined, {
      requireAuth: true,
    })

    if (result.success) {
      console.log('[IPC] trial start succeeded')
      // Notify renderer that trial started so it can refresh billing state
      if (
        mainWindow &&
        !mainWindow.isDestroyed() &&
        !mainWindow.webContents.isDestroyed()
      ) {
        mainWindow.webContents.send('trial-started')
      }
    } else {
      console.error('[IPC] trial start failed:', result.error)
    }

    return result
  })

  // Token refresh handler
  handleIPC('refresh-tokens', async () => {
    try {
      const result = await ensureValidTokens()
      return result
    } catch (error) {
      console.error('Manual token refresh failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Onboarding state (per user)
  handleIPC('get-onboarding-state', async () => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        log.warn('[IPC] Cannot get onboarding state: no user ID')
        return null
      }

      const userMetadata = await UserMetadataTable.findByUserId(userId)
      if (!userMetadata) {
        log.info('[IPC] No user metadata found for user', userId)
        return null
      }

      return {
        onboardingCompleted: userMetadata.onboarding_completed,
        onboardingStep: userMetadata.onboarding_step,
      }
    } catch (error) {
      log.error('[IPC] Failed to get onboarding state:', error)
      return null
    }
  })

  // Update onboarding state (per user)
  ipcMain.on('onboarding-update', async (_event, onboarding) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        log.warn('[IPC] Cannot update onboarding: no user ID')
        return
      }

      log.info('[IPC] Updating onboarding state for user', userId, onboarding)

      // Update local SQLite database
      await UserMetadataTable.update(userId, {
        onboarding_completed: onboarding.onboardingCompleted,
        onboarding_step: onboarding.onboardingStep,
      })

      // Sync to server (Postgres) if we have an access token
      try {
        const accessToken = store.get(STORE_KEYS.ACCESS_TOKEN) as string | undefined
        if (accessToken) {
          const apiBaseUrl = getApiBaseUrl()
          const response = await fetch(`${apiBaseUrl}/user/onboarding`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              onboarding_completed: onboarding.onboardingCompleted,
              onboarding_step: onboarding.onboardingStep,
            }),
          })

          if (!response.ok) {
            log.warn('[IPC] Failed to sync onboarding to server:', response.status)
          } else {
            log.info('[IPC] Onboarding synced to server successfully')
          }
        }
      } catch (syncError) {
        log.warn('[IPC] Failed to sync onboarding to server:', syncError)
        // Don't fail the local update if server sync fails
      }

      // Notify pill window of the update
      const pillWindow = getPillWindow()
      if (pillWindow && !pillWindow.isDestroyed()) {
        pillWindow.webContents.send('onboarding-update', onboarding)
      }
    } catch (error) {
      log.error('[IPC] Failed to update onboarding state:', error)
    }
  })

  // Window Init & Controls
  const getWindowFromEvent = (event: Electron.IpcMainInvokeEvent) =>
    BrowserWindow.fromWebContents(event.sender)
  handleIPC('init-window', e => {
    const window = getWindowFromEvent(e)
    if (!window) return {}
    const { width, height } = window.getBounds()
    return {
      width,
      height,
      minimizable: window.isMinimizable(),
      maximizable: window.isMaximizable(),
      platform: os.platform(),
    }
  })
  handleIPC('is-window-minimizable', e =>
    getWindowFromEvent(e)?.isMinimizable(),
  )
  handleIPC('is-window-maximizable', e =>
    getWindowFromEvent(e)?.isMaximizable(),
  )
  handleIPC('window-minimize', e => getWindowFromEvent(e)?.minimize())
  handleIPC('window-maximize', e => getWindowFromEvent(e)?.maximize())
  handleIPC('window-close', e => getWindowFromEvent(e)?.close())
  handleIPC('window-maximize-toggle', e => {
    const window = getWindowFromEvent(e)
    if (window?.isMaximized()) window.unmaximize()
    else window?.maximize()
  })

  // Web Contents & Other
  const getWebContentsFromEvent = (
    event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent,
  ) => event.sender
  handleIPC('web-undo', e => getWebContentsFromEvent(e).undo())
  handleIPC('web-redo', e => getWebContentsFromEvent(e).redo())
  handleIPC('web-cut', e => getWebContentsFromEvent(e).cut())
  handleIPC('web-copy', e => getWebContentsFromEvent(e).copy())
  handleIPC('web-paste', e => getWebContentsFromEvent(e).paste())
  handleIPC('web-delete', e => getWebContentsFromEvent(e).delete())
  handleIPC('web-select-all', e => getWebContentsFromEvent(e).selectAll())
  handleIPC('web-reload', e => getWebContentsFromEvent(e).reload())
  handleIPC('web-force-reload', e =>
    getWebContentsFromEvent(e).reloadIgnoringCache(),
  )
  handleIPC('web-toggle-devtools', e => {
    if (!app.isPackaged) getWebContentsFromEvent(e).toggleDevTools()
  })
  handleIPC('web-actual-size', e => getWebContentsFromEvent(e).setZoomLevel(0))
  handleIPC('web-zoom-in', e =>
    getWebContentsFromEvent(e).setZoomLevel(
      getWebContentsFromEvent(e).getZoomLevel() + 0.5,
    ),
  )
  handleIPC('web-zoom-out', e =>
    getWebContentsFromEvent(e).setZoomLevel(
      getWebContentsFromEvent(e).getZoomLevel() - 0.5,
    ),
  )
  handleIPC('web-toggle-fullscreen', e => {
    const window = getWindowFromEvent(e)
    window?.setFullScreen(!window.isFullScreen())
  })
  handleIPC('web-open-url', (_e, url) => shell.openExternal(url))

  handleIPC('open-mailto', (_e, email: string) => {
    const mailtoUrl = `mailto:${email}`
    // On macOS, use the 'open' command which is more reliable for mailto links
    if (process.platform === 'darwin') {
      exec(`open "${mailtoUrl}"`, error => {
        if (error) {
          console.error('Failed to open mailto link:', error)
          // Fallback to shell.openExternal
          shell.openExternal(mailtoUrl)
        }
      })
    } else {
      // On other platforms, use shell.openExternal
      shell.openExternal(mailtoUrl)
    }
  })
  // Auth0 DB signup proxy (avoids CORS issues from custom schemes)
  handleIPC(
    'auth0-db-signup',
    async (_e, { email, password, name, baseURL }) => {
      try {
        // Use Better Auth instead of Auth0
        const url = `${baseURL || 'http://localhost:3000'}/api/auth/sign-up/email`
        const payload = {
          email,
          password,
          name,
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })

        let data: any
        try {
          data = await res.json()
        } catch {
          data = undefined
        }

        if (!res.ok) {
          const message =
            data?.message || data?.error || `Signup failed (${res.status})`
          return { success: false, error: message, status: res.status }
        }

        console.log('[IPC] better-auth signup response', res.status, data)
        return { success: true, data: { _id: data.user?.id } }
      } catch (error: any) {
        return { success: false, error: error?.message || 'Network error' }
      }
    },
  )

  // Auth0 DB login via Password Realm (Resource Owner Password) grant
  handleIPC('auth0-db-login', async (_e, { email, password, baseURL }) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Missing email or password' }
      }

      // Use Better Auth instead of Auth0
      const url = `${baseURL || getApiBaseUrl()}/api/auth/sign-in/email`
      const payload = {
        email,
        password,
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let data: any
      try {
        data = await res.json()
      } catch {
        data = undefined
      }

      if (!res.ok) {
        const message =
          data?.message || data?.error || `Login failed (${res.status})`
        return { success: false, error: message, status: res.status }
      }

      // Better Auth returns session data - convert to token format for compatibility
      const expiresIn = data.expiresIn || 2592000 // 30 days default (increased from 7 days)
      const expiresAt = Date.now() + expiresIn * 1000

      return {
        success: true,
        tokens: {
          id_token: data.token || null,
          access_token: data.token || null,
          refresh_token: null, // Better Auth doesn't use refresh tokens
          scope: null,
          expires_in: expiresIn,
          expires_at: expiresAt,
          token_type: 'Bearer',
        },
      }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' }
    }
  })

  // Send verification email via server proxy
  handleIPC('auth0-send-verification', async (_e, { dbUserId }) => {
    if (!dbUserId) return { success: false, error: 'Missing user identifier' }
    return orbitHttpClient.post('/auth0/send-verification', {
      dbUserId,
      clientId: '',
    })
  })

  // Check if email exists for db signup and whether it's verified (via server proxy)
  handleIPC('auth0-check-email', async (_e, { email }) => {
    if (!email) return { success: false, error: 'Missing email' }
    return orbitHttpClient.get(
      `/auth0/users-by-email?email=${encodeURIComponent(email)}`,
    )
  })

  // Trial routes proxy
  handleIPC('trial:complete', async () => {
    return orbitHttpClient.post('/trial/complete')
  })

  // Billing routes proxy
  handleIPC('billing:create-checkout-session', async () => {
    return orbitHttpClient.post('/billing/checkout')
  })

  handleIPC(
    'billing:confirm-session',
    async (_e, { sessionId }: { sessionId: string }) => {
      return orbitHttpClient.post('/billing/confirm', { session_id: sessionId })
    },
  )

  handleIPC('billing:status', async () => {
    return orbitHttpClient.get('/billing/status')
  })

  handleIPC('billing:cancel-subscription', async () => {
    return orbitHttpClient.post('/billing/cancel')
  })

  handleIPC('billing:reactivate-subscription', async () => {
    return orbitHttpClient.post('/billing/reactivate')
  })
  handleIPC('open-auth-window', async (_e, { url, redirectUri }) => {
    try {
      if (!url || !redirectUri)
        return { success: false, error: 'Missing url or redirectUri' }

      const win = new BrowserWindow({
        parent: mainWindow ?? undefined,
        modal: true,
        width: 480,
        height: 720,
        show: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      })

      const maybeHandleRedirect = (event: Electron.Event, navUrl: string) => {
        try {
          if (!navUrl || !navUrl.startsWith(redirectUri)) return
          event.preventDefault()
          const u = new URL(navUrl)
          const code = u.searchParams.get('code') || ''
          const state = u.searchParams.get('state') || ''
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('auth-code-received', code, state)
          }
          if (!win.isDestroyed()) win.close()
        } catch (err) {
          console.error('[IPC] open-auth-window redirect parse error:', err)
        }
      }

      win.webContents.on('will-redirect', maybeHandleRedirect)
      win.webContents.on('will-navigate', maybeHandleRedirect)

      await win.loadURL(url)
      return { success: true }
    } catch (error: any) {
      console.error('[IPC] open-auth-window error:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  })
  handleIPC('get-native-audio-devices', async () => {
    console.log(
      '[IPC] Received get-native-audio-devices, calling requestDeviceListPromise...',
    )
    return audioRecorderService.getDeviceList()
  })

  // Platform info
  handleIPC('get-platform', () => {
    // Allow overriding platform for testing cross-platform UI behavior
    const overridePlatform = import.meta.env.VITE_OVERRIDE_PLATFORM
    if (overridePlatform) {
      log.info(
        `[Platform] Using override: ${overridePlatform} (actual: ${process.platform})`,
      )
      return overridePlatform as NodeJS.Platform
    }
    return process.platform
  })

  // Selected Text Reader
  handleIPC('get-selected-text', async (_e, options) => {
    console.log('[IPC] Received get-selected-text with options:', options)
    return getSelectedText(options)
  })
  handleIPC('get-selected-text-string', async (_e, maxLength) => {
    console.log('[IPC] Received get-selected-text-string')
    return getSelectedTextString(maxLength)
  })
  handleIPC('has-selected-text', async () => {
    console.log('[IPC] Received has-selected-text')
    return hasSelectedText()
  })

  // Notes
  handleIPC('notes:get-all', () => {
    const user_id = getCurrentUserId()
    return NotesTable.findAll(user_id)
  })
  handleIPC('notes:add', async (_e, note) => NotesTable.insert(note))
  handleIPC('notes:update-content', async (_e, { id, content }) =>
    NotesTable.updateContent(id, content),
  )
  handleIPC('notes:delete', async (_e, id) => NotesTable.softDelete(id))

  // Today
  handleIPC('today:get-all', () => {
    const user_id = getCurrentUserId()
    return TodayTable.findAll(user_id)
  })
  handleIPC('today:get-by-date', async (_e, { date, userId }) => {
    return TodayTable.findByDate(date, userId)
  })
  handleIPC('today:create-or-update', async (_e, entry) => {
    return TodayTable.createOrUpdate(entry)
  })
  handleIPC('today:delete', async (_e, id) => TodayTable.softDelete(id))

  // Dictionary
  handleIPC('dictionary:get-all', () => {
    const user_id = getCurrentUserId()
    return DictionaryTable.findAll(user_id)
  })
  handleIPC('dictionary:add', async (_e, item) => {
    return await DictionaryTable.insert(item)
  })
  handleIPC('dictionary:update', async (_e, { id, word, pronunciation }) => {
    return await DictionaryTable.update(id, word, pronunciation)
  })
  handleIPC('dictionary:delete', async (_e, id) =>
    DictionaryTable.softDelete(id),
  )

  // User Metadata
  handleIPC('user-metadata:get', async () => {
    const user_id = getCurrentUserId()
    if (!user_id) return null
    return UserMetadataTable.findByUserId(user_id)
  })
  handleIPC('user-metadata:upsert', async (_e, metadata) => {
    return await UserMetadataTable.upsert(metadata)
  })
  handleIPC('user-metadata:update', async (_e, updates) => {
    const user_id = getCurrentUserId()
    if (!user_id) throw new Error('No user ID found')
    return await UserMetadataTable.update(user_id, updates)
  })

  // Interactions
  handleIPC('interactions:get-all', () => {
    const user_id = getCurrentUserId()
    return InteractionsTable.findAll(user_id)
  })
  handleIPC('interactions:get-by-id', async (_e, id) =>
    InteractionsTable.findById(id),
  )

  handleIPC('interactions:delete', async (_e, id) =>
    InteractionsTable.softDelete(id),
  )

  // User Data Deletion
  handleIPC('delete-user-data', async _e => {
    const userId = getCurrentUserId()
    if (!userId) {
      log.error('No user ID found to delete data.')
      return false
    }
    const { deleteCompleteUserData } = await import('../main/sqlite/db')
    return deleteCompleteUserData(userId)
  })

  handleIPC('update-advanced-settings', async (_e, advancedSettings) => {
    console.log('Updating advanced settings:', advancedSettings)
    const { grpcClient } = await import('../clients/grpcClient')
    const result = await grpcClient.updateAdvancedSettings(advancedSettings)
    return result
  })

  // Server health check
  handleIPC('check-server-health', async () => {
    try {
      const response = await fetch(
        `http://localhost:${import.meta.env.VITE_LOCAL_SERVER_PORT}`,
        {
          method: 'GET',
        },
      )

      if (response.ok) {
        const text = await response.text()
        const isValidResponse = text.includes(
          'Welcome to the Orbit Connect RPC server!',
        )

        return {
          isHealthy: isValidResponse,
          error: isValidResponse ? undefined : 'Invalid server response',
        }
      } else {
        return {
          isHealthy: false,
          error: `Server responded with status: ${response.status}`,
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.name === 'TimeoutError' || error.name === 'AbortError'
          ? 'Connection timed out'
          : error.message?.includes('ECONNREFUSED') ||
              error.message?.includes('fetch')
            ? 'Local server not running'
            : error.message || 'Unknown error occurred'

      return {
        isHealthy: false,
        error: errorMessage,
      }
    }
  })

  // Debug methods
  handleIPC('debug:check-schema', async () => {
    const { getDb } = await import('../main/sqlite/db.js')
    const db = getDb()
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(interactions)', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  })

  // Pill window mouse event control
  handleIPC(
    'pill-set-mouse-events',
    (_e, ignore: boolean, options?: { forward?: boolean }) => {
      const pillWindow = getPillWindow()
      if (pillWindow) {
        pillWindow.setIgnoreMouseEvents(ignore, options)
      }
    },
  )

  // When the hotkey is pressed, start recording and notify the pill window.
  ipcMain.on('start-native-recording', _event => {
    console.log(`IPC: Received 'start-native-recording'`)
    orbitSessionManager.startSession(OrbitMode.TRANSCRIBE)
  })

  ipcMain.on('start-native-recording-test', _event => {
    console.log(`IPC: Received 'start-native-recording-test'`)
    const deviceId = store.get(STORE_KEYS.SETTINGS).microphoneDeviceId
    audioRecorderService.startRecording(deviceId)
  })

  // When the hotkey is released, stop recording and notify the pill window.
  ipcMain.on('stop-native-recording', () => {
    console.log('IPC: Received stop-native-recording.')
    orbitSessionManager.completeSession()
  })

  // Stop recording for microphone test (doesn't stop transcription since it wasn't started)
  ipcMain.on('stop-native-recording-test', () => {
    console.log('IPC: Received stop-native-recording-test.')
    audioRecorderService.stopRecording()
  })

  // Analytics Device ID storage - using machine ID
  handleIPC('analytics:get-device-id', async () => {
    try {
      // First try to get cached device ID from SQLite
      let deviceId = await KeyValueStore.get('analytics_device_id')

      if (!deviceId) {
        // Generate machine-specific ID if none exists
        deviceId = await machineId()
        await KeyValueStore.set('analytics_device_id', deviceId)
        console.log(
          '[Analytics] Generated new machine-based device ID:',
          deviceId,
        )
      }

      return deviceId
    } catch (error) {
      log.error('[Analytics] Failed to get/generate device ID:', error)
      // Fallback to basic machine id without caching
      try {
        return await machineId()
      } catch (fallbackError) {
        log.error('[Analytics] Machine ID fallback failed:', fallbackError)
        return undefined
      }
    }
  })

  // Resolve and clear install link token
  handleIPC('analytics:resolve-install-token', async () => {
    return orbitHttpClient.get('/link/resolve')
  })

  // Logs management
  handleIPC('logs:download', async () => {
    try {
      if (!app.isPackaged) {
        return {
          success: false,
          error: 'Logs are only saved in packaged builds',
        }
      }

      const logFilePath = log.transports.file.getFile().path
      const logFileName = path.basename(logFilePath)

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save Logs',
        defaultPath: logFileName,
        filters: [{ name: 'Log Files', extensions: ['log'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Download cancelled' }
      }

      // Copy log file to chosen location
      await fs.copyFile(logFilePath, result.filePath)

      console.log(`[IPC] Logs downloaded to: ${result.filePath}`)
      return { success: true, path: result.filePath }
    } catch (error: any) {
      console.error('[IPC] Failed to download logs:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  })

  handleIPC('logs:clear', async () => {
    try {
      // Clear the log queue from electron-store
      const LOG_QUEUE_KEY = 'log_queue:events'
      store.set(LOG_QUEUE_KEY, [])

      // Clear the log file if packaged
      if (app.isPackaged) {
        const logFilePath = log.transports.file.getFile().path
        // Write empty string to clear the file
        await fs.writeFile(logFilePath, '')
        console.log(`[IPC] Log file cleared: ${logFilePath}`)
      }

      console.log('[IPC] Logs cleared successfully')
      return { success: true }
    } catch (error: any) {
      console.error('[IPC] Failed to clear logs:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  })
}

// Handlers that are specific to a given window instance
export const registerWindowIPC = (mainWindow: BrowserWindow) => {
  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false)

  handleIPC(`init-window-${mainWindow.id}`, () => {
    const { width, height } = mainWindow.getBounds()
    const minimizable = mainWindow.isMinimizable()
    const maximizable = mainWindow.isMaximizable()
    const platform = os.platform()
    return { width, height, minimizable, maximizable, platform }
  })

  handleIPC(`is-window-minimizable-${mainWindow.id}`, () =>
    mainWindow.isMinimizable(),
  )
  handleIPC(`is-window-maximizable-${mainWindow.id}`, () =>
    mainWindow.isMaximizable(),
  )
  handleIPC(`window-minimize-${mainWindow.id}`, () => mainWindow.minimize())
  handleIPC(`window-maximize-${mainWindow.id}`, () => mainWindow.maximize())
  handleIPC(`window-close-${mainWindow.id}`, () => {
    mainWindow.close()
  })
  handleIPC(`window-maximize-toggle-${mainWindow.id}`, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  const webContents = mainWindow.webContents
  handleIPC(`web-undo-${mainWindow.id}`, () => webContents.undo())
  handleIPC(`web-redo-${mainWindow.id}`, () => webContents.redo())
  handleIPC(`web-cut-${mainWindow.id}`, () => webContents.cut())
  handleIPC(`web-copy-${mainWindow.id}`, () => webContents.copy())
  handleIPC(`web-paste-${mainWindow.id}`, () => webContents.paste())
  handleIPC(`web-delete-${mainWindow.id}`, () => webContents.delete())
  handleIPC(`web-select-all-${mainWindow.id}`, () => webContents.selectAll())
  handleIPC(`web-reload-${mainWindow.id}`, () => webContents.reload())
  handleIPC(`web-force-reload-${mainWindow.id}`, () =>
    webContents.reloadIgnoringCache(),
  )
  handleIPC(`web-toggle-devtools-${mainWindow.id}`, () => {
    if (!app.isPackaged) webContents.toggleDevTools()
  })
  handleIPC(`web-actual-size-${mainWindow.id}`, () =>
    webContents.setZoomLevel(0),
  )
  handleIPC(`web-zoom-in-${mainWindow.id}`, () =>
    webContents.setZoomLevel(webContents.zoomLevel + 0.5),
  )
  handleIPC(`web-zoom-out-${mainWindow.id}`, () =>
    webContents.setZoomLevel(webContents.zoomLevel - 0.5),
  )
  handleIPC(`web-toggle-fullscreen-${mainWindow.id}`, () =>
    mainWindow.setFullScreen(!mainWindow.fullScreen),
  )
  handleIPC(`web-open-url-${mainWindow.id}`, (_e, url) =>
    shell.openExternal(url),
  )
  // Accessibility permission check
  handleIPC(
    `check-accessibility-permission-${mainWindow.id}`,
    (_event, prompt: boolean = false) => {
      return checkAccessibilityPermission(prompt)
    },
  )

  // Microphone permission check
  handleIPC(
    `check-microphone-permission-${mainWindow.id}`,
    async (_event, prompt: boolean = false) => {
      console.log('check-microphone-permission prompt', prompt)
      const res = await checkMicrophonePermission(prompt)
      console.log('check-microphone-permission result', res)
      return res
    },
  )

  // We must remove handlers when the window is closed to prevent memory leaks
  mainWindow.on('closed', () => {
    ipcMain.removeHandler(`window-minimize-${mainWindow.id}`)
    ipcMain.removeHandler(`window-maximize-${mainWindow.id}`)
    ipcMain.removeHandler(`window-close-${mainWindow.id}`)
    ipcMain.removeHandler(`window-maximize-toggle-${mainWindow.id}`)
    ipcMain.removeHandler(`web-undo-${mainWindow.id}`)
    ipcMain.removeHandler(`web-redo-${mainWindow.id}`)
    ipcMain.removeHandler(`web-cut-${mainWindow.id}`)
    ipcMain.removeHandler(`web-copy-${mainWindow.id}`)
    ipcMain.removeHandler(`web-paste-${mainWindow.id}`)
    ipcMain.removeHandler(`web-delete-${mainWindow.id}`)
    ipcMain.removeHandler(`web-select-all-${mainWindow.id}`)
    ipcMain.removeHandler(`web-reload-${mainWindow.id}`)
    ipcMain.removeHandler(`web-force-reload-${mainWindow.id}`)
    ipcMain.removeHandler(`web-toggle-devtools-${mainWindow.id}`)
    ipcMain.removeHandler(`web-actual-size-${mainWindow.id}`)
    ipcMain.removeHandler(`web-zoom-in-${mainWindow.id}`)
    ipcMain.removeHandler(`web-zoom-out-${mainWindow.id}`)
    ipcMain.removeHandler(`web-toggle-fullscreen-${mainWindow.id}`)
    ipcMain.removeHandler(`web-open-url-${mainWindow.id}`)
    ipcMain.removeHandler(`check-accessibility-permission-${mainWindow.id}`)
    ipcMain.removeHandler(`check-microphone-permission-${mainWindow.id}`)
  })
}

// Forwards volume data from the main window to the pill window
ipcMain.on(IPC_EVENTS.VOLUME_UPDATE, (_event, volume: number) => {
  getPillWindow()?.webContents.send(IPC_EVENTS.VOLUME_UPDATE, volume)
})

// Forwards settings updates from the main window to the pill window
ipcMain.on(IPC_EVENTS.SETTINGS_UPDATE, (_event, settings: any) => {
  getPillWindow()?.webContents.send(IPC_EVENTS.SETTINGS_UPDATE, settings)

  // If microphone selection changed, ensure audio config is set
  if (settings && typeof settings.microphoneDeviceId === 'string') {
    // Ask the recorder for the effective output config for the selected mic
    voiceInputService.handleMicrophoneChanged(settings.microphoneDeviceId)
  }
})

// Persist onboarding updates per-user and forward to the pill window
ipcMain.on(IPC_EVENTS.ONBOARDING_UPDATE, async (_event, onboarding: any) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      log.warn('[IPC] Cannot persist onboarding update: no user ID')
      return
    }

    if (onboarding) {
      // Update user metadata with onboarding state
      const updates: any = {}
      if (onboarding.onboardingStep !== undefined) {
        updates.onboarding_step = onboarding.onboardingStep
      }
      if (onboarding.onboardingCompleted !== undefined) {
        updates.onboarding_completed = onboarding.onboardingCompleted
      }

      if (Object.keys(updates).length > 0) {
        // Save to local SQLite
        await UserMetadataTable.update(userId, updates)
        log.info('[IPC] Onboarding state updated for user', userId, updates)

        // Also sync to server (Postgres) so it persists across devices
        const accessToken = store.get(STORE_KEYS.ACCESS_TOKEN) as
          | string
          | undefined
        if (accessToken) {
          try {
            const baseUrl = getApiBaseUrl()

            const response = await fetch(`${baseUrl}/user/onboarding`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(updates),
            })

            if (response.ok) {
              log.info(
                '[IPC] Onboarding state synced to server for user',
                userId,
              )
            } else {
              log.warn(
                '[IPC] Failed to sync onboarding to server:',
                response.status,
              )
            }
          } catch (syncError) {
            log.warn('[IPC] Failed to sync onboarding to server:', syncError)
          }
        }
      }
    }
  } catch (error) {
    log.error('[IPC] Failed to persist onboarding update:', error)
  }

  getPillWindow()?.webContents.send(IPC_EVENTS.ONBOARDING_UPDATE, onboarding)
})

// Forwards user authentication updates from the main window to the pill window
ipcMain.on(IPC_EVENTS.USER_AUTH_UPDATE, (_event, authUser: any) => {
  getPillWindow()?.webContents.send(IPC_EVENTS.USER_AUTH_UPDATE, authUser)
})

// Environment variable access (secure - only expose specific keys)
handleIPC('get-env', (_e, key: string) => {
  // Whitelist of allowed environment variables
  const allowedKeys = ['COMPOSIO_API_KEY', 'COMPOSIO_CALLBACK_URL']

  if (!allowedKeys.includes(key)) {
    log.warn(`[IPC] Attempted to access unauthorized env key: ${key}`)
    return null
  }

  return process.env[key] || null
})
// Composio API v3 handlers (bypass CORS by calling from main process)
const COMPOSIO_API_V3 = 'https://backend.composio.dev/api/v3'

function composioHeaders(apiKey: string) {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

handleIPC('composio:get-apps', async () => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      console.error('[Composio] API key not configured')
      return { success: false, error: 'COMPOSIO_API_KEY not configured' }
    }

    console.log('[Composio] Fetching toolkits via v3 API...')
    const response = await fetch(`${COMPOSIO_API_V3}/toolkits?limit=100`, {
      headers: composioHeaders(apiKey),
    })

    if (!response.ok) {
      console.error(
        `[Composio] Failed to fetch toolkits: ${response.status} ${response.statusText}`,
      )
      return {
        success: false,
        error: `Failed to fetch apps: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const items = (data.items || []).map((tk: any) => ({
      name: tk.name || tk.slug,
      key: tk.slug,
      description: tk.meta?.description || `Connect with ${tk.name || tk.slug}`,
      logo: tk.meta?.logo || '',
      enabled: !tk.no_auth || tk.composio_managed_auth_schemes?.length > 0,
      appId: tk.slug,
      categories: (tk.meta?.categories || []).map((c: any) => c.name || c.id),
    }))

    console.log(`[Composio] Fetched ${items.length} toolkits`)
    return { success: true, data: items }
  } catch (error) {
    console.error('[Composio] Get apps failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

handleIPC('composio:get-connections', async () => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      return { success: false, error: 'COMPOSIO_API_KEY not configured' }
    }

    const response = await fetch(
      `${COMPOSIO_API_V3}/connected_accounts?limit=100`,
      { headers: composioHeaders(apiKey) },
    )

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch connections: ${response.statusText}`,
      }
    }

    const data = await response.json()
    // Normalize v3 shape → flat objects the renderer expects
    const items = (data.items || []).map((conn: any) => ({
      id: conn.id,
      toolkitSlug: conn.toolkit?.slug || '',
      status: conn.status,
      userId: conn.user_id || '',
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
    }))

    // Filter connections to only show current user's
    const currentUserId = getCurrentUserId()
    const filtered = currentUserId
      ? items.filter((c: any) => c.userId === currentUserId)
      : items

    return { success: true, data: filtered }
  } catch (error) {
    console.error('[Composio] Get connections failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

handleIPC('composio:initiate-connection', async (_e, toolkitSlug: string) => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      return { success: false, error: 'COMPOSIO_API_KEY not configured' }
    }

    console.log(`[Composio] Initiating connection for toolkit: ${toolkitSlug}`)

    // Step 1: Find or create an auth config for this toolkit
    const authConfigsRes = await fetch(
      `${COMPOSIO_API_V3}/auth_configs?toolkit_slug=${encodeURIComponent(toolkitSlug)}`,
      { headers: composioHeaders(apiKey) },
    )

    let authConfigId: string | null = null

    if (authConfigsRes.ok) {
      const authConfigsData = await authConfigsRes.json()
      const existing = (authConfigsData.items || []).find(
        (ac: any) => ac.status === 'ENABLED',
      )
      if (existing) {
        authConfigId = existing.id
        console.log(`[Composio] Found existing auth config: ${authConfigId}`)
      }
    }

    // If no auth config exists, create one using Composio managed auth
    if (!authConfigId) {
      console.log(`[Composio] Creating auth config for ${toolkitSlug}...`)
      const createRes = await fetch(`${COMPOSIO_API_V3}/auth_configs`, {
        method: 'POST',
        headers: composioHeaders(apiKey),
        body: JSON.stringify({
          toolkit: { slug: toolkitSlug },
        }),
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error(
          `[Composio] Failed to create auth config: ${createRes.status} ${errText}`,
        )
        return {
          success: false,
          error: `Failed to create auth config: ${createRes.statusText}`,
        }
      }

      const createData = await createRes.json()
      authConfigId = createData.auth_config?.id
      console.log(`[Composio] Created auth config: ${authConfigId}`)
    }

    if (!authConfigId) {
      return {
        success: false,
        error: 'Could not resolve auth config for this app',
      }
    }

    // Step 2: Create an auth link session
    // Callback goes to our hosted page which shows success + "Open App" button
    const callbackUrl =
      process.env.COMPOSIO_CALLBACK_URL ||
      'https://sage.sajdakabir.com/composio/callback'
    const linkRes = await fetch(`${COMPOSIO_API_V3}/connected_accounts/link`, {
      method: 'POST',
      headers: composioHeaders(apiKey),
      body: JSON.stringify({
        auth_config_id: authConfigId,
        user_id: getCurrentUserId() || 'default',
        callback_url: callbackUrl,
      }),
    })

    if (!linkRes.ok) {
      const errText = await linkRes.text()
      console.error(
        `[Composio] Failed to create link: ${linkRes.status} ${errText}`,
      )
      return {
        success: false,
        error: `Failed to initiate connection: ${linkRes.statusText}`,
      }
    }

    const linkData = await linkRes.json()
    console.log(`[Composio] Auth link created, redirect URL available`)
    return {
      success: true,
      redirectUrl: linkData.redirect_url || '',
    }
  } catch (error) {
    console.error('[Composio] Initiate connection failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

handleIPC('composio:disconnect', async (_e, connectionId: string) => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      return { success: false, error: 'COMPOSIO_API_KEY not configured' }
    }

    const response = await fetch(
      `${COMPOSIO_API_V3}/connected_accounts/${connectionId}`,
      {
        method: 'DELETE',
        headers: composioHeaders(apiKey),
      },
    )

    // Invalidate context cache since a connection was removed
    if (response.ok) {
      actionContextProvider.invalidateCache()
    }

    return { success: response.ok }
  } catch (error) {
    console.error('[Composio] Disconnect failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// Execute a Composio tool action (read data from connected apps)
handleIPC(
  'composio:execute-tool',
  async (_e, toolSlug: string, userId: string, args: Record<string, any>) => {
    try {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (!apiKey) {
        return { success: false, error: 'COMPOSIO_API_KEY not configured' }
      }

      console.log(`[Composio] Executing tool: ${toolSlug}`)
      const response = await fetch(`${COMPOSIO_API_V3}/tools/execute`, {
        method: 'POST',
        headers: composioHeaders(apiKey),
        body: JSON.stringify({
          tool: toolSlug,
          user_id: userId || 'default',
          arguments: args || {},
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(
          `[Composio] Tool execution failed: ${response.status} ${errText}`,
        )
        return {
          success: false,
          error: `Tool execution failed: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('[Composio] Execute tool failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
)

// List available tools for a toolkit
handleIPC('composio:get-tools', async (_e, toolkitSlug: string) => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      return { success: false, error: 'COMPOSIO_API_KEY not configured' }
    }

    const response = await fetch(
      `${COMPOSIO_API_V3}/toolkits/${encodeURIComponent(toolkitSlug)}`,
      { headers: composioHeaders(apiKey) },
    )

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch tools: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Composio] Get tools failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// ── Inbox: fetch data from connected tools ──────────────────────────

interface InboxItem {
  id: string
  title: string
  description: string
  source: string
  sourceId: string
  timestamp: string
  url?: string
  sourceLogo?: string
  metadata?: Record<string, any>
}

interface InboxToolConfig {
  source: string
  actionSlug: string
  defaultArgs: Record<string, any>
  normalize: (raw: any) => InboxItem[]
}

function normalizeLinearItems(raw: any): InboxItem[] {
  // Composio may wrap response in response_data.data or just data
  const responseData = raw?.response_data || raw?.data || raw
  const data = responseData?.data || responseData
  const issues = data?.issues || data?.nodes || (Array.isArray(data) ? data : [])
  return issues.map((issue: any) => ({
    id: `linear:${issue.id || ''}`,
    title: `${issue.identifier ? issue.identifier + ' ' : ''}${issue.title || 'Untitled'}`,
    description: (issue.description || '').slice(0, 200),
    source: 'linear',
    sourceId: issue.id || '',
    timestamp:
      issue.updatedAt || issue.updated_at ||
      issue.createdAt || issue.created_at ||
      issue.completedAt || issue.startedAt ||
      new Date().toISOString(),
    url: issue.url || '',
    metadata: {
      state: issue.state?.name || issue.state,
      priority: issue.priority,
      assignee: issue.assignee?.name || issue.assignee?.displayName,
    },
  }))
}

function normalizeGmailItems(raw: any): InboxItem[] {
  const data = raw?.data || raw?.response_data || raw
  const messages = data?.messages || (Array.isArray(data) ? data : [])
  return messages.map((msg: any) => ({
    id: `gmail:${msg.id || msg.messageId || ''}`,
    title: msg.subject || '(No Subject)',
    description: msg.snippet || msg.body_preview || '',
    source: 'gmail',
    sourceId: msg.id || msg.messageId || '',
    timestamp: msg.date || msg.internalDate || new Date().toISOString(),
    url: msg.threadId
      ? `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`
      : undefined,
    metadata: { from: msg.from, labels: msg.labelIds },
  }))
}

function normalizeGithubItems(raw: any): InboxItem[] {
  const data = raw?.data || raw?.response_data || raw
  const notifications = Array.isArray(data) ? data : data?.notifications || []
  return notifications.map((n: any) => ({
    id: `github:${n.id}`,
    title: n.subject?.title || n.reason || 'GitHub Notification',
    description: `${n.repository?.full_name || ''} · ${n.reason || ''}`.trim(),
    source: 'github',
    sourceId: n.id || '',
    timestamp: n.updated_at || n.last_read_at || new Date().toISOString(),
    url: n.subject?.url
      ? n.subject.url
          .replace('api.github.com/repos', 'github.com')
          .replace('/pulls/', '/pull/')
      : undefined,
    metadata: {
      reason: n.reason,
      type: n.subject?.type,
      repo: n.repository?.full_name,
    },
  }))
}

function normalizeSlackItems(raw: any): InboxItem[] {
  const data = raw?.data || raw?.response_data || raw
  const messages = data?.messages || (Array.isArray(data) ? data : [])
  return messages.map((msg: any) => ({
    id: `slack:${msg.ts || msg.client_msg_id || ''}`,
    title: msg.user ? `Message from ${msg.user}` : 'Slack Message',
    description: (msg.text || '').slice(0, 200),
    source: 'slack',
    sourceId: msg.ts || '',
    timestamp: msg.ts
      ? new Date(parseFloat(msg.ts) * 1000).toISOString()
      : new Date().toISOString(),
    metadata: { channel: msg.channel, user: msg.user },
  }))
}

const INBOX_TOOL_MAP: Record<string, InboxToolConfig> = {
  linear: {
    source: 'linear',
    actionSlug: 'LINEAR_LIST_LINEAR_ISSUES',
    defaultArgs: {},
    normalize: normalizeLinearItems,
  },
  gmail: {
    source: 'gmail',
    actionSlug: 'GMAIL_FETCH_EMAILS',
    defaultArgs: {},
    normalize: normalizeGmailItems,
  },
  github: {
    source: 'github',
    actionSlug:
      'GITHUB_LIST_REPOSITORY_NOTIFICATIONS_FOR_THE_AUTHENTICATED_USER',
    defaultArgs: {},
    normalize: normalizeGithubItems,
  },
  slack: {
    source: 'slack',
    actionSlug: 'SLACK_FETCH_CONVERSATION_HISTORY',
    defaultArgs: {},
    normalize: normalizeSlackItems,
  },
}

handleIPC('composio:fetch-inbox', async () => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      return {
        success: false,
        items: [],
        sources: [],
        error: 'COMPOSIO_API_KEY not configured',
      }
    }

    const userId = getCurrentUserId() || 'default'

    // 1. Fetch active connections for this user
    const connectionsRes = await fetch(
      `${COMPOSIO_API_V3}/connected_accounts?limit=100`,
      { headers: composioHeaders(apiKey) },
    )
    if (!connectionsRes.ok) {
      return {
        success: false,
        items: [],
        sources: [],
        error: 'Failed to fetch connections',
      }
    }
    const connectionsData = await connectionsRes.json()
    const activeConnections = (connectionsData.items || []).filter(
      (conn: any) =>
        conn.status === 'ACTIVE' &&
        (userId === 'default' || conn.user_id === userId),
    )

    // 2. Build fetch tasks for connections that have inbox mappings
    const tasks = activeConnections
      .map((conn: any) => {
        const slug = conn.toolkit?.slug
        const config = INBOX_TOOL_MAP[slug]
        if (!config) return null
        return { conn, config }
      })
      .filter(Boolean) as { conn: any; config: InboxToolConfig }[]

    if (tasks.length === 0) {
      return { success: true, items: [], sources: [] }
    }

    // 3. Execute all tool actions in parallel
    const results = await Promise.allSettled(
      tasks.map(async ({ conn, config }) => {
        const res = await fetch(
          `${COMPOSIO_API_V3}/tools/execute/${encodeURIComponent(config.actionSlug)}`,
          {
            method: 'POST',
            headers: composioHeaders(apiKey),
            body: JSON.stringify({
              connected_account_id: conn.id,
              user_id: userId,
              arguments: config.defaultArgs,
            }),
          },
        )
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(
            `${config.source}: ${res.status} ${errText.slice(0, 200)}`,
          )
        }
        const data = await res.json()
        const logo = conn.toolkit?.meta?.logo || ''
        const items = config.normalize(data).map((item: InboxItem) => ({
          ...item,
          sourceLogo: logo,
        }))
        return {
          source: config.source,
          toolkitSlug: conn.toolkit?.slug || '',
          logo,
          items,
        }
      }),
    )

    // 4. Aggregate
    let allItems: InboxItem[] = []
    const sources: {
      source: string
      toolkitSlug: string
      logo: string
      itemCount: number
      error?: string
    }[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems = allItems.concat(result.value.items)
        sources.push({
          source: result.value.source,
          toolkitSlug: result.value.toolkitSlug,
          logo: result.value.logo || '',
          itemCount: result.value.items.length,
        })
      } else {
        console.error('[Composio Inbox] Source failed:', result.reason)
        sources.push({
          source: 'unknown',
          toolkitSlug: '',
          logo: '',
          itemCount: 0,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown error',
        })
      }
    }

    // 5. Sort newest first
    allItems.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    return { success: true, items: allItems, sources }
  } catch (error) {
    console.error('[Composio Inbox] Fetch failed:', error)
    return {
      success: false,
      items: [],
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// ── Action Execution: voice command → Composio tool execution ──────────

import { actionExecutionService } from '../main/action/ActionExecutionService'
import { actionContextProvider } from '../main/action/ActionContextProvider'

// Renderer handshake: the ActionPanelWindow component fires this once mounted
ipcMain.on('action-panel-ready', () => {
  log.info('[IPC] action-panel-ready received from renderer')
  onActionPanelRendererReady()
})

ipcMain.on(IPC_EVENTS.ACTION_CONFIRM, (_event, payload: { actionId: string; editedParameters?: Record<string, any> }) => {
  actionExecutionService.confirmAction(payload.actionId, payload.editedParameters)
})

ipcMain.on(IPC_EVENTS.ACTION_CANCEL, (_event, payload: { actionId: string }) => {
  actionExecutionService.cancelAction(payload.actionId)
})

ipcMain.on(
  IPC_EVENTS.ACTION_DISAMBIGUATE,
  (_event, payload: { actionId: string; field: string; selectedValue: string }) => {
    actionExecutionService.handleDisambiguation(
      payload.actionId,
      payload.field,
      payload.selectedValue,
    )
  },
)

ipcMain.on(IPC_EVENTS.ACTION_CONNECT_TOOL, async (_event, toolkitSlug: string) => {
  log.info('[Action] ── CONNECT TOOL ──', toolkitSlug)
  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      log.error('[Action] COMPOSIO_API_KEY not configured, cannot connect tool')
      actionExecutionService.cancelAction('')
      return
    }

    const userId = getCurrentUserId() || 'default'
    const callbackUrl = process.env.COMPOSIO_CALLBACK_URL || 'https://sage.sajdakabir.com/composio/callback'

    log.info('[Action] Connecting tool:', toolkitSlug, '| userId:', userId, '| callback:', callbackUrl)

    // Step 1: Find or create an auth config for this toolkit
    const authConfigsRes = await fetch(
      `${COMPOSIO_API_V3}/auth_configs?toolkit_slug=${encodeURIComponent(toolkitSlug)}`,
      { headers: composioHeaders(apiKey) },
    )

    let authConfigId: string | null = null

    if (authConfigsRes.ok) {
      const authConfigsData = await authConfigsRes.json()
      const existing = (authConfigsData.items || []).find(
        (ac: any) => ac.status === 'ENABLED',
      )
      if (existing) {
        authConfigId = existing.id
        log.info('[Action] Found existing auth config:', authConfigId)
      }
    }

    if (!authConfigId) {
      log.info('[Action] Creating auth config for', toolkitSlug)
      const createRes = await fetch(`${COMPOSIO_API_V3}/auth_configs`, {
        method: 'POST',
        headers: composioHeaders(apiKey),
        body: JSON.stringify({
          toolkit: { slug: toolkitSlug },
        }),
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        log.error('[Action] Failed to create auth config:', createRes.status, errText.slice(0, 300))
        return
      }

      const createData = await createRes.json()
      authConfigId = createData.auth_config?.id
      log.info('[Action] Created auth config:', authConfigId)
    }

    if (!authConfigId) {
      log.error('[Action] Could not resolve auth config for', toolkitSlug)
      return
    }

    // Step 2: Create connection link with auth_config_id
    const linkRes = await fetch(`${COMPOSIO_API_V3}/connected_accounts/link`, {
      method: 'POST',
      headers: composioHeaders(apiKey),
      body: JSON.stringify({
        auth_config_id: authConfigId,
        user_id: userId,
        callback_url: callbackUrl,
      }),
    })

    if (linkRes.ok) {
      const linkData = await linkRes.json()
      const redirectUrl = linkData.redirect_url || ''
      if (redirectUrl) {
        log.info('[Action] Opening OAuth URL in browser:', redirectUrl.slice(0, 100))
        shell.openExternal(redirectUrl)
      } else {
        log.error('[Action] No redirect URL in link response:', JSON.stringify(linkData).slice(0, 500))
      }
    } else {
      const errBody = await linkRes.text().catch(() => '')
      log.error('[Action] Composio link API failed:', linkRes.status, errBody.slice(0, 500))
    }
  } catch (error) {
    log.error('[Action] Failed to initiate connection:', error)
  }
})
