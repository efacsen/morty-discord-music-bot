# Architecture

**Analysis Date:** 2026-03-29

## Pattern Overview

**Overall:** Event-driven Discord bot with a plugin-based audio extraction layer

**Key Characteristics:**
- Single process Node.js application using ES modules (`"type": "module"`)
- `discord-player` orchestrates all audio queue and playback state; commands are thin controllers
- Custom `YtDlpExtractor` extends `BaseExtractor` from discord-player to plug in yt-dlp for YouTube
- Per-guild queue model — one `GuildQueue` per Discord server, keyed by `guildId`
- All player state mutations happen through `queue.node.*` and `queue.*` APIs from discord-player

## Layers

**Entry Point / Bootstrap (`src/index.js`):**
- Purpose: Wire everything together at startup
- Location: `src/index.js`
- Contains: Discord client init, discord-player init, extractor registration, dynamic command/event loader, player event listeners, global error guards
- Depends on: All commands, events, extractors, utils
- Used by: Node.js runtime directly (`node src/index.js`)

**Commands (`src/commands/`):**
- Purpose: Handle incoming slash command interactions
- Location: `src/commands/`
- Contains: One file per command, each exports `{ data, execute }`
- Depends on: `discord-player` (`useMainPlayer`, `useQueue`), utils for embeds
- Used by: `interactionCreate` event via `client.commands` collection

**Events (`src/events/`):**
- Purpose: Handle Discord.js client lifecycle events
- Location: `src/events/`
- Contains: `ready.js` (registers slash commands on startup), `interactionCreate.js` (dispatches commands and button clicks)
- Depends on: `src/handlers/buttonHandler.js`, `client.commands` collection
- Used by: `src/index.js` dynamic loader

**Handlers (`src/handlers/`):**
- Purpose: Reusable interaction logic extracted from event files
- Location: `src/handlers/`
- Contains: `buttonHandler.js` — handles all `player_*` and `queue_*` button interactions from the Now Playing embed
- Depends on: `discord-player` (`useQueue`), `src/utils/createPlayerEmbed.js`
- Used by: `src/events/interactionCreate.js`

**Extractors (`src/extractors/`):**
- Purpose: Plug custom audio sources into discord-player
- Location: `src/extractors/`
- Contains: `YtDlpExtractor.js` (active, YouTube via system yt-dlp binary), `PlayDLExtractor.js` (inactive/legacy)
- Depends on: `discord-player` (`BaseExtractor`, `QueryType`, `Track`), `yt-dlp-wrap`, Node.js `child_process`, `stream`
- Used by: `src/index.js` via `player.extractors.register(YtDlpExtractor, {})`

**Utils (`src/utils/`):**
- Purpose: Pure helpers for building Discord message payloads
- Location: `src/utils/`
- Contains: `createPlayerEmbed.js` (Now Playing embed + queue embed + playlist embed), `createSongSelectionEmbed.js` (search results UI), `formatTime.js` (duration formatting/parsing, progress bar)
- Depends on: `discord.js` embed/button builders only
- Used by: commands, handlers

## Data Flow

**Play Command (search → stream):**

1. User invokes `/play <query>` in Discord
2. `interactionCreate` event fires → looks up command in `client.commands` → calls `play.execute(interaction)`
3. `play.js` calls `player.search(query)` → discord-player routes to `YtDlpExtractor.validate()` then `YtDlpExtractor.handle()`
4. `YtDlpExtractor.handle()` calls yt-dlp with `--dump-json` to get track metadata; returns `Track[]`
5. If multiple results, song selection embed is shown; user clicks button → `interactionCreate` routes to `buttonHandler.js`
6. Selected track is added to `GuildQueue` via `queue.addTrack(track)` then `queue.node.play()`
7. discord-player fires `willPlayTrack` → `src/index.js` listener calls `resolver()` to unblock pipeline
8. discord-player calls `YtDlpExtractor.stream(track)` → yt-dlp pipes audio bytes through a 32MB `PassThrough` buffer
9. discord-player + mediaplex encode to Opus and send over DAVE-encrypted voice connection
10. `playerStart` event fires → Now Playing embed is sent/edited in the text channel

**Button Interaction:**

1. User clicks a button on the Now Playing embed (customId `player_*` or `queue_*`)
2. `interactionCreate` event routes to `handlePlayerButton(interaction)` in `src/handlers/buttonHandler.js`
3. Handler calls `useQueue(guildId)` to get current queue, applies mutation, optionally calls `updateNowPlayingMessage` to re-render embed

**State Management:**
- Audio queue state lives entirely in discord-player's `GuildQueue` objects (in-memory, per-guild)
- "Now Playing" message tracking is a `Map<guildId, { messageId, channelId }>` held in `src/index.js` module scope
- No database or persistent storage

## Key Abstractions

**YtDlpExtractor:**
- Purpose: Bridge between discord-player's extractor API and the yt-dlp system binary
- File: `src/extractors/YtDlpExtractor.js`
- Pattern: Extends `BaseExtractor`; implements `validate()`, `handle()`, `stream()`, `activate()`; `stream()` pipes yt-dlp output through a `PassThrough` buffer instead of returning a URL

**GuildQueue (discord-player built-in):**
- Purpose: Per-guild audio queue with connection management
- Access: `player.queues.get(guildId)` or `useQueue(guildId)`
- Metadata: `queue.metadata.channel` and `queue.metadata.voiceChannel` are set at queue creation time in `play.js`

**Command Module:**
- Purpose: Self-contained slash command
- Pattern: Each file in `src/commands/` exports `{ data: SlashCommandBuilder, execute: async (interaction) => void }`
- Loaded dynamically by `src/index.js` into `client.commands` Collection

**Player Embed:**
- Purpose: Stateful Now Playing UI with interactive buttons
- File: `src/utils/createPlayerEmbed.js`
- Pattern: Functions return `{ embeds: [EmbedBuilder], components: [ActionRowBuilder] }` objects, suitable to pass directly into `channel.send()` or `message.edit()`

## Entry Points

**Bot Start:**
- Location: `src/index.js`
- Triggers: `node src/index.js` (or `npm start`)
- Responsibilities: Instantiate Discord client and Player, register extractors, dynamically load all commands and events, attach player event listeners, call `client.login()`

**Slash Command Dispatch:**
- Location: `src/events/interactionCreate.js`
- Triggers: Any Discord interaction
- Responsibilities: Route slash commands to `client.commands`, route button interactions to `buttonHandler`

**Bot Ready:**
- Location: `src/events/ready.js`
- Triggers: `clientReady` event (fires once after login)
- Responsibilities: Register all slash commands via Discord REST API (guild-scoped if `DISCORD_GUILD_ID` is set, otherwise global)

## Error Handling

**Strategy:** Catch-and-reply — errors are caught at the command/handler level and reported back to the user via ephemeral Discord messages; the process is kept alive by `unhandledRejection` and `uncaughtException` guards.

**Patterns:**
- Every `execute()` function wraps its body in `try/catch`; on error it calls `interaction.reply` or `interaction.editReply` with an ephemeral error message
- `interactionCreate.js` wraps `command.execute()` with a secondary try/catch that uses `followUp` if the interaction was already deferred
- `src/index.js` registers `process.on('unhandledRejection')` and `process.on('uncaughtException')` to log without crashing
- `playerError` and `error` player events send error messages to `queue.metadata.channel`

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` throughout, prefixed with `[Component Name]` tags (e.g., `[YtDlp]`, `[Play Command]`, `[ButtonHandler]`). No structured logging library.

**Validation:** Voice channel presence and bot permissions are checked at the top of each command's `execute()` before any async work.

**Authentication:** Discord token via `process.env.DISCORD_CLIENT_TOKEN`. yt-dlp cookie auth via `YTDLP_COOKIES_FILE` or `YTDLP_COOKIES_BROWSER` env vars, handled in `YtDlpExtractor.getCookieArgs()`.

---

*Architecture analysis: 2026-03-29*
