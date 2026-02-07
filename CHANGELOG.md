# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-07

### Added
- **YouTube playlist support** — use `/play` with any YouTube playlist URL to load all tracks
- **Rich playlist embed** — shows playlist title, track count, total duration, and a 5-track preview
- **Portable Windows package** — `setup.bat` downloads Node.js, FFmpeg, and yt-dlp into a local `runtime/` folder (no admin rights or system installs needed)
- **Cross-platform yt-dlp auto-detection** — automatically finds yt-dlp on macOS, Linux, and Windows; supports `YTDLP_PATH` environment variable override
- **`audioTracksAdd` event handler** — proper logging for bulk playlist additions
- **`scripts/install.ps1`** — PowerShell installer for the portable Windows setup
- **GitHub Actions release workflow** — automated releases with downloadable ZIP on tag push

### Fixed
- **Queue button interactions failing** — remove, pagination, and clear buttons now work correctly (was using `deferReply` instead of `deferUpdate` for queue management buttons)
- **Queue buttons not routed to handler** — `interactionCreate.js` now routes both `player_` and `queue_` prefixed buttons
- **Hardcoded yt-dlp path** — removed `/opt/homebrew/bin/yt-dlp` hardcode that broke non-macOS platforms

### Changed
- `start.bat` auto-detects portable `runtime/` or falls back to system-installed tools
- `setup.bat` replaced Chocolatey-based setup with portable self-contained installer
- Queue remove button now refreshes the queue view instead of replacing it with a text confirmation
- Playlist handling moved to dedicated `handlePlaylist()` method in YtDlpExtractor
- Deleted/private videos are filtered out from playlist results
- Updated README with all new features, interactive controls docs, and portable Windows setup

## [2.0.0] - 2025-10-XX

### Added
- Initial public release
- 14 slash commands: play, pause, resume, skip, stop, queue, nowplaying, volume, loop, shuffle, seek, jump, back, bassboost
- Interactive Now Playing embed with button controls
- Song selection UI with top 3 search results
- Queue display with pagination and remove buttons
- Dual YouTube extraction: yt-dlp (primary) + play-dl (fallback)
- Docker support (Alpine-based, non-root user)
- Cross-platform setup scripts (Windows, macOS, Linux)
- Auto-disconnect on empty channel and queue end
