import { spawn } from 'child_process'
import store from '../main/store'
import { STORE_KEYS } from '../constants/store-keys'
import { getNativeBinaryPath } from './native-interface'
import { BrowserWindow, dialog, shell } from 'electron'
import { orbitSessionManager } from '../main/orbitSessionManager'
import { KeyName, keyNameMap, normalizeLegacyKey } from '../types/keyboard'

interface KeyEvent {
  type: 'keydown' | 'keyup'
  key: string
  timestamp: string
  raw_code: number
}

interface HeartbeatEvent {
  type: 'heartbeat_ping'
  id: string
  timestamp: string
}

interface RegisteredHotkeysEvent {
  type: 'registered_hotkeys'
  hotkeys: Array<{ keys: string[] }>
}

type ProcessEvent = KeyEvent | HeartbeatEvent | RegisteredHotkeysEvent

// Global key listener process singleton
export let KeyListenerProcess: ReturnType<typeof spawn> | null = null
let activeShortcutId: string | null = null

// fn key debounce: macOS fires rapid keydown/keyup pairs even when fn is held
const FN_KEYUP_DEBOUNCE_MS = 150
let fnKeyUpTimer: NodeJS.Timeout | null = null

// Heartbeat monitoring state
let lastHeartbeatReceived = Date.now()
let heartbeatCheckTimer: NodeJS.Timeout | null = null
const HEARTBEAT_CHECK_INTERVAL_MS = 5000 // Check every 5 seconds
const HEARTBEAT_TIMEOUT_MS = 15000 // 15 seconds without heartbeat triggers restart

// Test utility function - only available in development
export const resetForTesting = () => {
  if (process.env.NODE_ENV !== 'production') {
    KeyListenerProcess = null
    activeShortcutId = null
    pressedKeys.clear()
    keyPressTimestamps.clear()
    if (fnKeyUpTimer) {
      clearTimeout(fnKeyUpTimer)
      fnKeyUpTimer = null
    }
    stopStuckKeyChecker()
    stopHeartbeatChecker()
    lastHeartbeatReceived = Date.now()
  }
}

const nativeModuleName = 'global-key-listener'

// Normalizes a raw key event into a consistent string
function normalizeKey(rawKey: string): KeyName {
  return keyNameMap[rawKey] || rawKey.toLowerCase()
}

// Export the key name mapping for use in UI components
export { keyNameMap }

// Heartbeat utility functions
function handleHeartbeat(_event: HeartbeatEvent) {
  lastHeartbeatReceived = Date.now()
}

function startHeartbeatChecker() {
  if (!heartbeatCheckTimer) {
    heartbeatCheckTimer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatReceived
      if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        console.error(
          `[Key listener] No heartbeat received for ${timeSinceLastHeartbeat}ms, restarting key listener...`,
        )
        restartKeyListener()
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS)
  }
}

function stopHeartbeatChecker() {
  if (heartbeatCheckTimer) {
    clearInterval(heartbeatCheckTimer)
    heartbeatCheckTimer = null
  }
}

function restartKeyListener() {
  console.warn('🔄 Restarting keyboard listener due to timeout...')
  stopKeyListener()
  // Wait a brief moment before restarting to ensure cleanup is complete
  setTimeout(() => {
    startKeyListener()
  }, 1000)
}

// This set will track the state of all currently pressed keys.
const pressedKeys = new Set<string>()

// Track when each key was first pressed to detect stuck keys
const keyPressTimestamps = new Map<KeyName, number>()

// Timer for checking stuck keys
let stuckKeyCheckTimer: NodeJS.Timeout | null = null

// Configuration for stuck key detection
const STUCK_KEY_TIMEOUT = 5000 // 5 seconds
const STUCK_KEY_CHECK_INTERVAL = 1000 // Check every 1 second

// Function to check for and remove stuck keys
function checkForStuckKeys() {
  const currentTime = Date.now()
  const stuckKeys: KeyName[] = []

  for (const [key, pressTime] of keyPressTimestamps) {
    if (currentTime - pressTime > STUCK_KEY_TIMEOUT) {
      stuckKeys.push(key)
    }
  }

  // Remove stuck keys, but be careful not to interfere with active shortcuts
  for (const stuckKey of stuckKeys) {
    // If there's an active shortcut, check if this stuck key is part of it
    let shouldRemove = true

    if (activeShortcutId !== null) {
      const { keyboardShortcuts } = store.get(STORE_KEYS.SETTINGS)
      const activeShortcut = keyboardShortcuts
        .filter(ks => ks.keys.length > 0)
        .find(shortcut => {
          const normalizedShortcutKeys = shortcut.keys.map(normalizeLegacyKey)
          const hasAllKeys = normalizedShortcutKeys.every(key =>
            pressedKeys.has(key),
          )
          const exactMatch =
            normalizedShortcutKeys.length === pressedKeys.size && hasAllKeys
          return exactMatch
        })

      // Don't remove the stuck key if it's part of the currently active shortcut
      if (
        activeShortcut &&
        activeShortcut.keys.map(normalizeLegacyKey).includes(stuckKey)
      ) {
        shouldRemove = false
      }
    }

    if (shouldRemove) {
      console.warn(
        `Removing stuck key: ${stuckKey} (held for ${(currentTime - keyPressTimestamps.get(stuckKey)!) / 1000}s)`,
      )
      pressedKeys.delete(stuckKey)
      keyPressTimestamps.delete(stuckKey)
    }
  }
}

// Start the stuck key checking timer
function startStuckKeyChecker() {
  if (!stuckKeyCheckTimer) {
    stuckKeyCheckTimer = setInterval(
      checkForStuckKeys,
      STUCK_KEY_CHECK_INTERVAL,
    )
  }
}

// Stop the stuck key checking timer
function stopStuckKeyChecker() {
  if (stuckKeyCheckTimer) {
    clearInterval(stuckKeyCheckTimer)
    stuckKeyCheckTimer = null
  }
}

async function handleKeyEventInMain(event: KeyEvent) {
  const { isShortcutGloballyEnabled, keyboardShortcuts } = store.get(
    STORE_KEYS.SETTINGS,
  )

  if (!isShortcutGloballyEnabled) {
    // check to see if we should stop an in-progress recording
    if (activeShortcutId !== null) {
      // Shortcut released
      activeShortcutId = null
      console.info('Shortcut DEACTIVATED, stopping recording...')
      orbitSessionManager.completeSession()
    }
    return
  }

  const normalizedKey = normalizeKey(event.key)

  if (event.type === 'keydown') {
    // If we have a pending fn keyup debounce, cancel it — the key is still held
    if (normalizedKey === 'fn' && fnKeyUpTimer) {
      clearTimeout(fnKeyUpTimer)
      fnKeyUpTimer = null
    }
    pressedKeys.add(normalizedKey)
    // Track when this key was first pressed (only if not already tracked)
    if (!keyPressTimestamps.has(normalizedKey)) {
      keyPressTimestamps.set(normalizedKey, Date.now())
    }
  } else {
    // macOS fires rapid keydown/keyup pairs for fn even when held.
    // Debounce the keyup to keep pressedKeys populated during a hold.
    if (normalizedKey === 'fn') {
      if (fnKeyUpTimer) clearTimeout(fnKeyUpTimer)
      fnKeyUpTimer = setTimeout(() => {
        fnKeyUpTimer = null
        pressedKeys.delete('fn')
        keyPressTimestamps.delete('fn')
        // Re-run shortcut check after delayed release
        handleKeyRelease()
      }, FN_KEYUP_DEBOUNCE_MS)
      return
    }
    pressedKeys.delete(normalizedKey)
    keyPressTimestamps.delete(normalizedKey)
  }

  // Check if any of the configured shortcuts are currently held
  // Match shortcuts that have exactly the same keys as currently pressed
  const currentlyHeldShortcut = keyboardShortcuts
    .filter(ks => ks.keys.length > 0)
    .find(shortcut => {
      // Normalize legacy keys in stored shortcuts
      const normalizedShortcutKeys = shortcut.keys.map(normalizeLegacyKey)

      // Check if all shortcut keys are pressed (exact match only)
      const hasAllKeys = normalizedShortcutKeys.every(shortcutKey =>
        pressedKeys.has(shortcutKey),
      )

      const exactMatch =
        normalizedShortcutKeys.length === pressedKeys.size && hasAllKeys

      return exactMatch
    })

  // Handle shortcut activation and mode changes
  if (currentlyHeldShortcut) {
    if (activeShortcutId === null) {
      // Starting a new session
      activeShortcutId = currentlyHeldShortcut.id
      console.info('lib Shortcut ACTIVATED, starting recording...')
      await orbitSessionManager.startSession(currentlyHeldShortcut.mode)
    } else if (activeShortcutId !== currentlyHeldShortcut.id) {
      // Different shortcut detected while already recording - change mode
      activeShortcutId = currentlyHeldShortcut.id
      console.info(
        `lib Shortcut mode CHANGED to ${currentlyHeldShortcut.mode}, updating session...`,
      )
      orbitSessionManager.setMode(currentlyHeldShortcut.mode)
    }
  } else if (!currentlyHeldShortcut) {
    // No shortcut detected - cancel pending activation or deactivate active shortcut
    if (activeShortcutId !== null) {
      // Shortcut released - deactivate immediately (no debounce on release)
      activeShortcutId = null
      console.info('lib Shortcut DEACTIVATED, stopping recording...')
      orbitSessionManager.completeSession()
    }
  }
}

// Handle deactivation after a debounced fn keyup
function handleKeyRelease() {
  if (activeShortcutId !== null) {
    activeShortcutId = null
    console.info('lib Shortcut DEACTIVATED (fn debounce), stopping recording...')
    orbitSessionManager.completeSession()
  }
}

// Show a dialog when the key listener fails due to stale accessibility permissions
function showPermissionFixDialog() {
  if (process.platform !== 'darwin') return

  dialog
    .showMessageBox({
      type: 'warning',
      title: 'Accessibility Permission Required',
      message:
        'Orbit needs you to re-grant accessibility permission.',
      detail:
        'Since this is a new build, macOS requires you to refresh the permission:\n\n' +
        '1. Click "Open Settings" below\n' +
        '2. Find "Orbit" in the list and toggle it OFF\n' +
        '3. Remove it with the − button\n' +
        '4. Click + and add Orbit from your Applications folder\n' +
        '5. Restart Orbit',
      buttons: ['Open Settings', 'Later'],
      defaultId: 0,
    })
    .then(result => {
      if (result.response === 0) {
        shell.openExternal(
          'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
        )
      }
    })
}

// Starts the key listener process
export const startKeyListener = () => {
  if (KeyListenerProcess) {
    console.warn('Key listener already running.')
    return
  }

  const binaryPath = getNativeBinaryPath(nativeModuleName)
  if (!binaryPath) {
    console.error('Could not determine key listener binary path.')
    return
  }

  console.log('--- Key Listener Initialization ---')
  console.log(`Attempting to spawn key listener at: ${binaryPath}`)

  try {
    const env = {
      ...process.env,
      RUST_BACKTRACE: '1',
      OBJC_DISABLE_INITIALIZE_FORK_SAFETY: 'YES',
    }

    const spawnTime = Date.now()

    KeyListenerProcess = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      detached: true,
    })

    if (!KeyListenerProcess) {
      throw new Error('Failed to spawn process')
    }

    KeyListenerProcess.unref()

    let buffer = ''
    KeyListenerProcess.stdout?.on('data', data => {
      const chunk = data.toString()
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          try {
            const event: ProcessEvent = JSON.parse(line)

            // Handle heartbeat and other system events
            if (event.type === 'heartbeat_ping') {
              handleHeartbeat(event)
              continue
            } else if (event.type === 'registered_hotkeys') {
              // Log registered hotkeys for debugging
              console.info('🔒 Registered hotkeys received:', event.hotkeys)
              continue
            }

            // Handle regular key events
            if (event.type === 'keydown' || event.type === 'keyup') {
              // Process the event here in the main process for hotkey detection.
              handleKeyEventInMain(event)

              // Broadcast the raw event to all renderer windows for UI updates.
              BrowserWindow.getAllWindows().forEach(window => {
                if (!window.webContents.isDestroyed()) {
                  window.webContents.send('key-event', event)
                }
              })
            }
          } catch (e) {
            console.error('Failed to parse key process event:', line, e)
          }
        }
      }
    })

    KeyListenerProcess.stderr?.on('data', data => {
      console.error('[Key listener] stderr:', data.toString())
    })

    KeyListenerProcess.on('error', error => {
      console.error('[Key listener] process spawn error:', error)
      KeyListenerProcess = null
      showPermissionFixDialog()
    })

    KeyListenerProcess.on('close', (code, signal) => {
      const elapsed = Date.now() - spawnTime
      console.warn(
        `[Key listener] process closed with code: ${code}, signal: ${signal} (after ${elapsed}ms)`,
      )
      KeyListenerProcess = null

      // If the process dies within 5 seconds and wasn't killed by us,
      // it likely failed because CGEventTap couldn't be created
      // (stale accessibility permissions after a new build)
      if (elapsed < 5000 && signal !== 'SIGTERM') {
        showPermissionFixDialog()
      }
    })

    KeyListenerProcess.on('exit', (code, signal) => {
      console.warn(
        `[Key listener] process exited with code: ${code}, signal: ${signal}`,
      )
      KeyListenerProcess = null
    })

    console.log('[Key listener] started successfully.')

    // Register all configured hotkeys with the listener
    registerAllHotkeys()

    // Start the stuck key checker
    startStuckKeyChecker()

    // Start heartbeat monitoring
    lastHeartbeatReceived = Date.now()
    startHeartbeatChecker()
  } catch (error) {
    console.error('Failed to start key listener:', error)
    KeyListenerProcess = null
  }
}

// Register all hotkeys from settings with the key listener
export const registerAllHotkeys = () => {
  if (!KeyListenerProcess) {
    console.warn('Key listener not running, cannot register hotkeys.')
    return
  }

  const { keyboardShortcuts } = store.get(STORE_KEYS.SETTINGS)

  // Convert shortcuts to hotkey format for the listener.
  // For each shortcut, expand modifier keys that have left/right variants into
  // separate hotkeys (e.g. command+z → MetaLeft+KeyZ and MetaRight+KeyZ).
  // Keys that have multiple raw variants (like fn → Function, Unknown(179)) are
  // each registered as separate hotkeys so Rust's exact-match check can fire.
  const hotkeys: Array<{ keys: string[] }> = []

  for (const shortcut of keyboardShortcuts.filter(ks => ks.keys.length > 0)) {
    const perKeyVariants: string[][] = shortcut.keys.map(key => {
      const normalizedKey = normalizeLegacyKey(key)
      const reverseMapped = reverseKeyNameMap[normalizedKey]
      return reverseMapped && reverseMapped.length > 0 ? reverseMapped : [key]
    })

    // Compute the cartesian product of all per-key variants to get every
    // possible combination (e.g. [MetaLeft, MetaRight] × [KeyZ] → two hotkeys)
    const combos = perKeyVariants.reduce<string[][]>(
      (acc, variants) =>
        acc.flatMap(combo => variants.map(v => [...combo, v])),
      [[]],
    )

    for (const combo of combos) {
      hotkeys.push({ keys: combo })
    }
  }

  console.info('Registering hotkeys with listener:', hotkeys)

  KeyListenerProcess.stdin?.write(
    JSON.stringify({ command: 'register_hotkeys', hotkeys }) + '\n',
  )
}

/**
 * A reverse mapping of normalized key names to their raw `rdev` counterparts.
 * This is a one-to-many relationship (e.g., 'command' maps to ['MetaLeft', 'MetaRight']).
 */
const reverseKeyNameMap: Record<string, string[]> = Object.entries(
  keyNameMap,
).reduce(
  (acc, [rawKey, normalizedKey]) => {
    if (!acc[normalizedKey]) {
      acc[normalizedKey] = []
    }
    acc[normalizedKey].push(rawKey)
    return acc
  },
  {} as Record<string, string[]>,
)


export const stopKeyListener = () => {
  if (KeyListenerProcess) {
    // Clear the set on stop to prevent stuck keys if the app restarts.
    pressedKeys.clear()
    keyPressTimestamps.clear()
    stopStuckKeyChecker()

    // Clean up heartbeat state
    stopHeartbeatChecker()

    KeyListenerProcess.kill('SIGTERM')
    KeyListenerProcess = null
  }
}
