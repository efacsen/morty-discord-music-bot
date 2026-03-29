# Technology Stack

**Analysis Date:** 2026-03-29

## Languages

**Primary:**
- JavaScript (ES Modules) - All source code under `src/`, uses `"type": "module"` in `package.json`

**Secondary:**
- None (no TypeScript, no secondary languages)

## Runtime

**Environment:**
- Node.js >= 18.0.0 (required); v22.17.0 confirmed in active environment

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- discord.js 14.22.1 - Discord API client, slash commands, embeds, button interactions
- discord-player 7.2.0 - Audio queue and playback engine (uses `discord-voip` internally, NOT `@discordjs/voice`)

**Extractors/Audio:**
- @discord-player/extractor 7.2.0 - Default extractors (SoundCloud, Spotify, Vimeo, etc.) via `DefaultExtractors`
- discord-player-youtube 0.5.6 - Listed as dependency but primary YouTube playback is handled by custom `YtDlpExtractor`

**Build/Dev:**
- No build step; runs directly as `node src/index.js`
- Dev mode: `node --watch src/index.js` (via npm `dev` script)

## Key Dependencies

**Critical:**
- `@snazzah/davey` 0.1.10 - Discord DAVE (Audio Video Encryption) protocol support; without this, voice connections silently fail at the Identifying state (code:1 -> code:6)
- `mediaplex` 1.0.0 - Opus audio encoding; required by discord-player for audio transcoding
- `yt-dlp-wrap` 2.3.12 - Node.js wrapper around the `yt-dlp` system binary for YouTube stream extraction
- `discord-player` 7.2.0 - Core audio queue; uses `discord-voip` (not `@discordjs/voice`)

**Infrastructure:**
- `dotenv` 16.6.1 - Environment variable loading from `.env` file
- `play-dl` 1.9.7 - Alternative YouTube extractor; `PlayDLExtractor.js` exists but is NOT registered in `src/index.js` (inactive fallback)

**System Binary (external, not npm):**
- `yt-dlp` - Must be installed separately on the host. The bot resolves the binary at runtime from common paths or the `YTDLP_PATH` env var. Path resolution logic is in `src/extractors/YtDlpExtractor.js`.
- `ffmpeg` - Required for audio processing; installed in Docker via `apk add --no-cache ffmpeg`

## Configuration

**Environment:**
- Loaded via `dotenv` at startup (`src/index.js` line 12)
- Template: `.env.example`
- Key variables:
  - `DISCORD_CLIENT_TOKEN` - Bot authentication token (required)
  - `DISCORD_CLIENT_ID` - Application ID for slash command registration (required)
  - `DISCORD_GUILD_ID` - Optional; if set, commands register to one guild instantly instead of globally
  - `YTDLP_PATH` - Optional override for yt-dlp binary path
  - `YTDLP_COOKIES_FILE` - Path to Netscape-format cookies file for YouTube auth
  - `YTDLP_COOKIES_BROWSER` - Browser name (chrome/safari/firefox) to read live session cookies

**Build:**
- No build config files (no webpack, vite, tsc, etc.)
- Dockerfile at project root for containerized deployment
- `docker-compose.yml` for container orchestration

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- `yt-dlp` binary installed and on PATH (or `YTDLP_PATH` set)
- `ffmpeg` installed on system

**Production:**
- Docker (node:20-alpine base image)
- ffmpeg installed in container
- `.env` file mounted or env vars injected at runtime
- Persistent Docker volume `discord-player-cache` mounted at `/app/.discord-player`

---

*Stack analysis: 2026-03-29*
