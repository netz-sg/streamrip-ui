<p align="center">
  <img src="desktop/frontend/public/logo.png" alt="streamrip-ui" width="128" height="128" />
</p>

<h1 align="center">streamrip-ui</h1>

<p align="center">
  <strong>A modern desktop GUI for <a href="https://github.com/nathom/streamrip">streamrip</a></strong><br />
  Download high-quality music from Qobuz, TIDAL, Deezer &amp; SoundCloud â€” without the terminal.
</p>

<p align="center">
  <a href="https://github.com/netz-sg/streamrip-ui/releases/latest"><img src="https://img.shields.io/github/v/release/netz-sg/streamrip-ui?style=flat-square&color=6366f1" alt="Latest Release" /></a>
  <a href="https://github.com/netz-sg/streamrip-ui/actions"><img src="https://img.shields.io/github/actions/workflow/status/netz-sg/streamrip-ui/release.yml?style=flat-square&label=build" alt="Build Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" /></a>
  <a href="https://github.com/nathom/streamrip"><img src="https://img.shields.io/badge/powered%20by-streamrip%202.2-blueviolet?style=flat-square" alt="Powered by streamrip" /></a>
</p>

---

## What is this?

**streamrip-ui** is an Electron-based desktop application that wraps [nathom's streamrip](https://github.com/nathom/streamrip) library in a polished, dark-themed interface. It provides everything the CLI does â€” album/track/artist/playlist downloads, search, quality selection, metadata tagging â€” but with a visual experience designed for daily use.

> **Note:** This project does not bundle or redistribute streamrip. It depends on a local checkout of the [streamrip](https://github.com/nathom/streamrip) repository as its backend engine.

## Features

- **Paste & Download** â€” Drop a Qobuz, TIDAL, Deezer, or SoundCloud URL and download in one click
- **Real-Time Progress** â€” Per-track progress bars with speed and ETA, powered by a custom progress hook
- **Rich Previews** â€” Album, track, artist, and playlist views with cover art, tracklists, and quality badges
- **Multi-Source Search** â€” Search across all four platforms with instant results
- **Download Queue** â€” Concurrent downloads with queue management, history, and wishlist
- **Full Configuration** â€” Every streamrip setting exposed: quality, filepaths, filters, metadata, conversion, database
- **Keyboard Shortcuts** â€” `Ctrl+1â€“6` navigation, `Ctrl+F` search focus, `Escape` to dismiss
- **Drag & Drop** â€” Drop URLs directly onto the window to start previewing
- **Backend Health Monitoring** â€” Live status indicator with auto-reconnect
- **Toast Notifications** â€” Download started, completed, failed â€” always in the loop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Shell** | Electron (frameless, custom titlebar) |
| **Frontend** | React 19 Â· TypeScript Â· Tailwind CSS v4 Â· Zustand Â· Framer Motion |
| **Backend** | Python Â· FastAPI Â· WebSocket Â· SQLite |
| **Engine** | [streamrip](https://github.com/nathom/streamrip) by [@nathom](https://github.com/nathom) |

## Screenshots

> _Screenshots will be added after the first public release._

<!--
<p align="center">
  <img src="docs/screenshots/home.png" width="800" alt="Home â€” Album Preview" />
  <br /><em>Album preview with tracklist and quality info</em>
</p>
-->

## Installation

### Download Installer

Go to [**Releases**](https://github.com/netz-sg/streamrip-ui/releases/latest) and download:

| Platform | File |
|----------|------|
| Windows | `streamrip-ui-Setup-x.x.x.exe` |
| macOS | `streamrip-ui-x.x.x.dmg` |

### Prerequisites

- **Python 3.10+** installed and on your `PATH`
- **streamrip** dependencies: the app will install them automatically on first launch, or you can install manually:

```bash
cd repo
pip install poetry
poetry install
```

### Build from Source

```bash
# Clone the repo
git clone https://github.com/netz-sg/streamrip-ui.git
cd streamrip-ui

# Install frontend dependencies
cd desktop/frontend
npm install

# Install Electron dependencies
cd ..
npm install

# Run in development mode
npm start

# Build installer
npm run dist          # Current platform
npm run dist:win      # Windows .exe
npm run dist:mac      # macOS .dmg
```

## Usage

1. **Launch** the app â€” the Python backend starts automatically
2. **Paste** a music URL into the input bar on the Home page
3. **Preview** the album, track, artist, or playlist with full metadata
4. **Download** with one click â€” monitor progress in the Downloads tab
5. **Configure** quality, output paths, filters, and more in Settings

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Home |
| `Ctrl+2` | Downloads |
| `Ctrl+3` | Search |
| `Ctrl+4` | History |
| `Ctrl+5` | Wishlist |
| `Ctrl+6` | Settings |
| `Ctrl+F` | Focus search / URL input |
| `Escape` | Dismiss / blur |

## Project Structure

```
streamrip-ui/
â”œâ”€â”€ desktop/
â”‚   â”œâ”€â”€ electron/          # Electron main process (window, IPC)
â”‚   â”œâ”€â”€ frontend/          # React + TypeScript + Tailwind
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/    # Layout & preview components
â”‚   â”‚   â”‚   â”œâ”€â”€ pages/         # Home, Downloads, Search, Settings, History, Wishlist
â”‚   â”‚   â”‚   â”œâ”€â”€ stores/        # Zustand state management
â”‚   â”‚   â”‚   â”œâ”€â”€ api/           # HTTP & WebSocket client
â”‚   â”‚   â”‚   â””â”€â”€ hooks/         # Keyboard shortcuts, etc.
â”‚   â”‚   â””â”€â”€ public/            # Static assets & logo
â”‚   â”œâ”€â”€ backend/           # Python FastAPI server
â”‚   â”‚   â”œâ”€â”€ api/               # REST endpoints & WebSocket
â”‚   â”‚   â””â”€â”€ core/              # streamrip wrapper, download manager, compat checks
â”‚   â””â”€â”€ tests/             # Compatibility tests
â”œâ”€â”€ repo/                  # streamrip library (git submodule or checkout)
â””â”€â”€ .github/workflows/     # CI: compat checks, releases
```

## Releasing

Releases are triggered by pushing a **version tag** (e.g. `v1.0.0`).

### Publish a Release

```bash
# Tag the current commit
git tag v1.0.0

# Push the tag - CI builds installers and creates a GitHub Release
git push origin v1.0.0
```

The CI pipeline will:
1. Build Windows `.exe` installer (NSIS) and macOS `.dmg`
2. Generate a changelog from commits since the last tag
3. Create a GitHub Release with attached installers

### Version Bump Examples

```bash
git tag v1.0.1   # Patch release
git tag v1.1.0   # Minor release
git tag v2.0.0   # Major release
```
## Credits

- **[streamrip](https://github.com/nathom/streamrip)** by [@nathom](https://github.com/nathom) â€” the core music downloading engine that powers this application
- Built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), [FastAPI](https://fastapi.tiangolo.com/), and [Tailwind CSS](https://tailwindcss.com/)

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE) â€” the same license as streamrip.

## Disclaimer

This application is provided for personal use only. Please respect the terms of service of the music platforms you use and support artists by purchasing their music. The developers are not responsible for any misuse of this software.
