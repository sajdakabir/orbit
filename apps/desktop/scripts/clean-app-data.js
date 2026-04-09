#!/usr/bin/env node

const os = require('os')
const fs = require('fs')
const path = require('path')

const platform = os.platform()
let appDataPath

if (platform === 'darwin') {
  appDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'Orbit')
} else if (platform === 'win32') {
  appDataPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'Orbit',
  )
} else {
  appDataPath = path.join(os.homedir(), '.config', 'orbit')
}

if (fs.existsSync(appDataPath)) {
  fs.rmSync(appDataPath, { recursive: true, force: true })
  console.log(`✓ Removed app data from: ${appDataPath}`)
} else {
  console.log(`ℹ No app data found at: ${appDataPath}`)
}
