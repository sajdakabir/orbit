// Define the native binaries that are shared across platforms
const nativeBinaries = [
  'global-key-listener',
  'audio-recorder',
  'text-writer',
  'active-application',
  'selected-text-reader',
]

const getMacResources = () =>
  nativeBinaries.map(binary => ({
    from: `native/target/\${arch}-apple-darwin/release/${binary}`,
    to: `binaries/${binary}`,
  }))

const getWindowsResources = () =>
  nativeBinaries.map(binary => ({
    from: `native/target/x86_64-pc-windows-msvc/release/${binary}.exe`,
    to: `binaries/${binary}.exe`,
  }))

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const stage = process.env.ORBIT_ENV || 'prod'
module.exports = {
  appId:
    stage === 'prod'
      ? 'ai.orbit.orbit'
      : `ai.orbit.orbit-${stage.toLowerCase()}`,
  productName: stage === 'prod' ? 'Orbit' : `Orbit-${stage}`,
  copyright: 'Copyright © 2025 Demox Labs',
  npmRebuild: false,
  buildDependenciesFromSource: false,
  publish: {
    provider: 'github',
    owner: 'sajdakabir',
    repo: 'orbit',
  },
  directories: {
    buildResources: 'resources',
    output: 'dist',
  },
  files: [
    '!**/.vscode/*',
    '!src/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!.eslintignore',
    '!.eslintrc.cjs',
    '!.prettierignore',
    '!.prettierrc.yaml',
    '!README.md',
    '!.env',
    '!.env.*',
    '!.npmrc',
    '!pnpm-lock.yaml',
    '!tsconfig.json',
    '!tsconfig.node.json',
    '!tsconfig.web.json',
    '!native/**',
    '!build-*.sh',
    {
      from: 'out',
      filter: ['**/*'],
    },
  ],
  asar: true,
  asarUnpack: ['resources/**', 'app/assets/**'],
  extraMetadata: {
    version: process.env.VITE_ORBIT_VERSION || '0.0.0-dev',
  },
  protocols: {
    name: 'orbit',
    schemes: stage === 'prod' ? ['orbit'] : [`orbit-dev`],
  },
  afterSign: async function (context) {
    // Re-sign native binaries WITHOUT hardened runtime so CGEventTap
    // can capture all key events (including Fn/Globe via kCGEventFlagsChanged).
    // Hardened runtime + ad-hoc signing can prevent modifier-key capture.
    if (process.platform !== 'darwin') return

    const appName = context.packager.appInfo.productFilename
    const appPath = path.join(context.appOutDir, `${appName}.app`)
    const binariesDir = path.join(
      appPath,
      'Contents/Resources/binaries',
    )

    if (!fs.existsSync(binariesDir)) return

    console.log(
      'Re-signing native binaries without hardened runtime...',
    )
    const binaries = fs.readdirSync(binariesDir)
    for (const binary of binaries) {
      const binaryPath = path.join(binariesDir, binary)
      if (!fs.statSync(binaryPath).isFile()) continue
      execSync(`codesign --force --sign - "${binaryPath}"`)
      console.log(`  Re-signed: ${binary}`)
    }

    // Re-seal the app bundle (main executable keeps hardened runtime)
    const entitlements = path.join(
      context.packager.projectDir,
      'build/entitlements.mac.plist',
    )
    execSync(
      `codesign --force --sign - --options runtime --entitlements "${entitlements}" "${appPath}"`,
    )
    console.log('  App bundle re-sealed')
  },
  mac: {
    target: 'default',
    icon: 'resources/build/icon.icns',
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    identity: '-',
    notarize: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.inherit.plist',
    extendInfo: {
      NSMicrophoneUsageDescription:
        'Orbit requires microphone access to transcribe your speech.',
    },
    extraResources: [
      ...getMacResources(),
      { from: 'resources/build/orbit.png', to: 'build/orbit.png' },
      { from: 'app/assets/orbit.png', to: 'build/trayTemplate.png' },
    ],
    x64ArchFiles:
      'Contents/Resources/app.asar.unpacked/node_modules/sqlite3/**/*',
  },
  dmg: {
    artifactName:
      stage === 'prod'
        ? 'Orbit-Installer.${ext}'
        : `Orbit-${stage}-Installer.\${ext}`,
  },
  win: {
    target: [
      {
        target: 'zip',
        arch: ['x64'],
      },
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    artifactName: '${productName}-${version}.${ext}',
    icon: 'resources/build/icon.ico',
    executableName: 'Orbit',
    requestedExecutionLevel: 'asInvoker',
    extraResources: [
      ...getWindowsResources(),
      { from: 'resources/build/orbit.png', to: 'build/orbit.png' },
    ],
    forceCodeSigning: false,
    asarUnpack: [
      'resources/**',
      '**/node_modules/@sentry/**',
      '**/node_modules/sqlite3/**',
    ],
  },
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,
  nsis: {
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}-uninstaller',
    createDesktopShortcut: false,
    createStartMenuShortcut: true,
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: true,
  },
}
