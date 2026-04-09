# Orbit

AI-powered voice companion for macOS and Windows. Hold a key, speak, and Orbit transcribes, writes, and takes action — right where your cursor is.

## Features

- **Voice-to-text anywhere** — Hold your shortcut key, speak, release. Text appears at your cursor.
- **Multiple modes** — Transcribe, translate, summarize, or use custom AI prompts
- **Works everywhere** — System-wide keyboard shortcuts, works in any app
- **Fn/Globe key support** — Use the Fn key as your trigger on Mac
- **Privacy-first** — Audio is processed and never stored. Fully open source.

## Project Structure

```
orbit/
├── apps/
│   ├── desktop/     # Electron + React desktop app
│   │   ├── app/     # React frontend (renderer)
│   │   ├── lib/     # Main process, IPC, services
│   │   ├── native/  # Rust native binaries (key listener, audio, text writer)
│   │   ├── server/  # Backend API server (Better Auth, gRPC)
│   │   └── build/   # macOS entitlements, build configs
│   └── web/         # Marketing website (Next.js)
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (for native modules)
- macOS or Windows

### Desktop App

```bash
cd apps/desktop

# Install dependencies
bun install

# Copy env file and fill in your values
cp .env.example .env

# Build native Rust binaries (first time only)
./build-binaries.sh --mac        # macOS ARM
./build-binaries.sh --mac --x64  # macOS Intel

# Start development
bun run dev
```

### Build DMG (macOS)

```bash
cd apps/desktop
ORBIT_ENV=prod ./build-app.sh mac
```

### Website

```bash
cd apps/web
bun install
bun run dev
```

## Tech Stack

**Desktop App:**
- Electron + React + TypeScript
- Rust native binaries (keyboard capture, audio recording, text injection)
- SQLite (local data)
- gRPC + Protobuf (server communication)
- Better Auth (authentication)

**Website:**
- Next.js + React + TypeScript
- Tailwind CSS + Framer Motion

## macOS Permissions

Orbit requires these macOS permissions to function:

| Permission | Why |
|---|---|
| **Accessibility** | Capture keyboard shortcuts and inject text |
| **Input Monitoring** | Detect key presses system-wide |
| **Microphone** | Record audio for transcription |

After installing a new build, you may need to re-grant Accessibility permissions (the app will guide you through this).

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[MIT](LICENSE)
