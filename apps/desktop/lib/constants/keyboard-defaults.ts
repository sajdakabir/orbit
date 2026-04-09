import { OrbitMode } from '@/app/generated/orbit_pb'

// Platform-specific keyboard shortcut defaults
export const ORBIT_MODE_SHORTCUT_DEFAULTS_MAC = {
  [OrbitMode.TRANSCRIBE]: ['fn'],
  [OrbitMode.EDIT]: ['control-left', 'fn'],
}

export const ORBIT_MODE_SHORTCUT_DEFAULTS_WIN = {
  [OrbitMode.TRANSCRIBE]: ['control-left', 'command-left'],
  [OrbitMode.EDIT]: ['option-left', 'control-left'],
}

// Helper to detect platform - works in both main and renderer process
export function getPlatform(): 'darwin' | 'win32' {
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform as 'darwin' | 'win32'
  }
  // Fallback if process is not available
  return 'darwin'
}

// Get platform-specific defaults
export function getOrbitModeShortcutDefaults(
  platform?: 'darwin' | 'win32',
): Record<OrbitMode, string[]> {
  const currentPlatform = platform || getPlatform()

  if (currentPlatform === 'darwin') {
    return ORBIT_MODE_SHORTCUT_DEFAULTS_MAC
  } else {
    return ORBIT_MODE_SHORTCUT_DEFAULTS_WIN
  }
}

// For backward compatibility, export the defaults for the current platform
export const ORBIT_MODE_SHORTCUT_DEFAULTS = getOrbitModeShortcutDefaults()
