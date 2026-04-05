# External Integrations

**Analysis Date:** 2026-03-29

## APIs & External Services

**Discord:**
- Discord Gateway API - Real-time bot events (guilds, voice states, messages, interactions)
  - SDK/Client: `discord.js` 14.22.1 (`discord.js` package)
  - Auth: `DISCORD_CLIENT_TOKEN` env var (passed to `client.login()` in `src/index.js`)
- Discord REST API - Slash command registration on startup
  - SDK/Client: `REST` class from `discord.js`
  - Auth: same `DISCORD_CLIENT_TOKEN`
  - Endpoint: `Routes.applicationGuildCommands` or `Routes.applicationCommands` (see `src/events/ready.js`)

**YouTube:**
- YouTube Data (via yt-dlp) - Search, metadata, and audio stream extraction
  - SDK/Client: `yt-dlp-wrap` 2.3.12 wrapping the `yt-dlp` system binary
  - Auth: Optional cookie-based authentication via `YTDLP_COOKIES_FILE` or `YTDLP_COOKIES_BROWSER`
  - Implementation: `src/extractors/YtDlpExtractor.js`
  - Audio format: `bestaudio*[ext=webm]/bestaudio*/best` piped through a 32MB `PassThrough` buffer
  - Player clients used: `android_music,ios,mweb,web` (passed as `--extractor-args`)
  - Playlist support: handled via `--flat-playlist --yes-playlist` for fast metadata extraction

## Data Storage

**Databases:**
- None - no database is used

**File Storage:**
- Local filesystem only
  - Discord-player cache: `/app/.discord-player` (Docker volume `discord-player-cache`)
  - YouTube cookies file: configurable via `YTDLP_COOKIES_FILE` env var (e.g., `./youtube_cookies.txt` present in project root)

**Caching:**
- In-memory only
  - `nowPlayingMessages` Map in `src/index.js` tracks persistent "Now Playing" message IDs per guild (keyed by `guildId`)
  - discord-player maintains its own internal queue state per guild

## Authentication & Identity

**Auth Provider:**
- Discord Bot Token authentication only
  - Implementation: `client.login(process.env.DISCORD_CLIENT_TOKEN)` in `src/index.js`
  - No OAuth, no user sessions, no JWT

## Monitoring & Observability

**Error Tracking:**
- None - no third-party error tracking (no Sentry, Datadog, etc.)

**Logs:**
- `console.log` / `console.error` / `console.warn` throughout; no structured logging library
- Player debug events enabled: `player.on('debug')` and `player.events.on('debug')` in `src/index.js`
- Voice connection state changes logged via `connection.on('stateChange')` in `src/index.js`

## CI/CD & Deployment

**Hosting:**
- Docker container (node:20-alpine base image defined in `Dockerfile`)
- `docker-compose.yml` for local/self-hosted deployment with restart policy `unless-stopped`

**CI Pipeline:**
- None detected (no GitHub Actions workflows, no CI config files)

## Webhooks & Callbacks

**Incoming:**
- Discord Gateway WebSocket - handled by `discord.js` client automatically
- No HTTP server; no incoming webhooks or REST endpoints

**Outgoing:**
- Discord REST API calls for slash command registration (on bot startup in `src/events/ready.js`)
- Discord channel messages sent reactively (player events, command responses)

## Default Extractors (via @discord-player/extractor)

The `DefaultExtractors` bundle loaded in `src/index.js` provides support for these platforms out of the box (no additional API keys required unless platform-specific auth is needed):
- SoundCloud
- Spotify (metadata only; streams sourced via YouTube)
- Vimeo
- Reverbnation
- Various direct URL types

Custom extractors registered before DefaultExtractors (higher priority):
- `YtDlpExtractor` (`src/extractors/YtDlpExtractor.js`) - active, handles YouTube
- `PlayDLExtractor` (`src/extractors/PlayDLExtractor.js`) - present but NOT registered; inactive

---

*Integration audit: 2026-03-29*
