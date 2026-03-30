# VANTAGE Desktop Application
# Electron-based desktop client for Windows, macOS, and Linux

## Features

- 🖥️ **Native Desktop Experience** - Optimized for Windows, macOS, and Linux
- 🚀 **Auto Updates** - Seamless updates with electron-updater
- 💾 **Local Recording Storage** - Save recordings directly to your computer
- 🔔 **System Tray Integration** - Quick access from system tray
- ⌨️ **Global Keyboard Shortcuts** - Quick mute/unmute, start/stop video
- 📹 **Screen Sharing** - Native screen sharing with better performance
- 🎨 **Aurora Crystal Design** - Beautiful executive UI

## Installation

### Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Create distributable packages
npm run dist:win    # Windows installer
npm run dist:mac    # macOS DMG
npm run dist:linux  # Linux AppImage
```

## Distribution

### Windows
- NSIS installer (recommended)
- Portable executable
- Auto-update support

### macOS
- DMG installer
- Notarized for macOS
- Auto-update support

### Linux
- AppImage (universal)
- .deb (Debian/Ubuntu)
- .rpm (Fedora/RHEL)

## Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development

# Production API URL
VANTAGE_API_URL=https://api.vantage.live
VANTAGE_WS_URL=wss://api.vantage.live
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+M` | Toggle mute |
| `Cmd/Ctrl+E` | Toggle video |
| `Cmd/Ctrl+Shift+S` | Start/stop screen share |
| `Cmd/Ctrl+W` | Leave meeting |
| `F11` | Toggle fullscreen |

## System Requirements

### Minimum
- **OS:** Windows 10, macOS 10.13+, Ubuntu 18.04+
- **CPU:** Dual-core 2GHz
- **RAM:** 4GB
- **Network:** Broadband connection

### Recommended
- **OS:** Windows 11, macOS 12+, Ubuntu 22.04+
- **CPU:** Quad-core 3GHz+
- **RAM:** 8GB+
- **Network:** 10+ Mbps

## Troubleshooting

### App won't start
1. Delete app data: `%APPDATA%/vantage-desktop` (Windows) or `~/Library/Application Support/vantage-desktop` (macOS)
2. Reinstall the application

### Screen sharing not working
- **Windows:** Ensure Windows is updated
- **macOS:** Grant screen recording permission in System Preferences
- **Linux:** Ensure PipeWire is installed

### Auto-update failing
- Check firewall settings
- Ensure `api.vantage.live` is accessible
- Try manual download from website

## Building for Production

### Windows
```bash
npm run dist:win
# Output: release/VANTAGE-Setup.exe
```

### macOS
```bash
# Set signing identity
export CSC_NAME="Your Company"
npm run dist:mac
# Output: release/VANTAGE.dmg
```

### Linux
```bash
npm run dist:linux
# Output: release/VANTAGE.AppImage
```

## Publishing

The app auto-publishes to GitHub Releases on CI/CD pipeline.

```yaml
# GitHub Actions will:
# 1. Build for all platforms
# 2. Sign with certificates
# 3. Upload to GitHub Releases
# 4. Notify auto-updater
```

## License

MIT © 2026 VANTAGE
