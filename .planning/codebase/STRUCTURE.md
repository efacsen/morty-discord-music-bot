# Codebase Structure

**Analysis Date:** 2026-03-29

## Directory Layout

```
discord-music-bot/
├── src/                    # All application source code
│   ├── index.js            # Entry point: client + player init, event wiring
│   ├── commands/           # One file per slash command (14 commands)
│   ├── events/             # Discord.js client event handlers
│   ├── handlers/           # Reusable interaction logic (buttons)
│   ├── extractors/         # discord-player extractor plugins (YouTube via yt-dlp)
│   └── utils/              # Pure helper functions (embed builders, time formatting)
├── scripts/                # Setup/maintenance scripts
│   └── install.ps1         # Windows PowerShell installer
├── developers/             # Developer tooling
│   └── scripts/            # Additional developer scripts
├── docs/                   # Documentation files
├── .github/
│   └── workflows/          # CI/CD GitHub Actions workflows
├── .planning/
│   └── codebase/           # GSD codebase analysis documents
├── package.json            # Project manifest (ES modules, Node >= 18)
├── package-lock.json       # Lockfile
├── Dockerfile              # Container build definition
├── docker-compose.yml      # Compose config for containerized deployment
├── setup.sh / setup.bat    # Cross-platform setup scripts
├── start.sh / start.bat    # Cross-platform start scripts
├── stop.sh / stop.bat      # Cross-platform stop scripts
├── check-system.js         # System dependency checker utility
├── clear-commands.js       # Utility to deregister Discord slash commands
├── youtube_cookies.txt     # YouTube auth cookies (not committed to clean installs)
├── yt-dlp                  # Bundled yt-dlp binary (macOS/Linux)
└── .env.example            # Environment variable template
```

## Directory Purposes

**`src/commands/`:**
- Purpose: One slash command per file
- Contains: 14 command files, each exporting `{ data: SlashCommandBuilder, execute }`
- Key files:
  - `src/commands/play.js` — most complex command; handles search, playlist, song selection UI
  - `src/commands/queue.js` — displays current queue
  - `src/commands/skip.js`, `src/commands/back.js` — track navigation
  - `src/commands/volume.js`, `src/commands/seek.js`, `src/commands/bassboost.js` — playback control
  - `src/commands/loop.js`, `src/commands/shuffle.js` — queue modes
  - `src/commands/stop.js`, `src/commands/pause.js`, `src/commands/resume.js` — state control
  - `src/commands/nowplaying.js`, `src/commands/jump.js` — misc utilities

**`src/events/`:**
- Purpose: Handle Discord.js `client` events
- Contains: Two files
  - `src/events/ready.js` — `clientReady` (once); registers slash commands via REST on startup
  - `src/events/interactionCreate.js` — `interactionCreate`; dispatches to commands or `buttonHandler`

**`src/handlers/`:**
- Purpose: Non-trivial interaction logic kept out of event files
- Contains:
  - `src/handlers/buttonHandler.js` — handles all `player_*` (pause/skip/stop/shuffle/loop/queue) and `queue_*` (page/remove/clear) button interactions

**`src/extractors/`:**
- Purpose: Custom discord-player audio source plugins
- Contains:
  - `src/extractors/YtDlpExtractor.js` — active; streams YouTube via yt-dlp binary piped through PassThrough
  - `src/extractors/PlayDLExtractor.js` — legacy/inactive

**`src/utils/`:**
- Purpose: Stateless helper functions returning Discord.js payload objects
- Contains:
  - `src/utils/createPlayerEmbed.js` — exports `createPlayerEmbed()`, `createQueueEmbed()`, `createPlaylistEmbed()`
  - `src/utils/createSongSelectionEmbed.js` — exports `createSongSelectionEmbed()` for search results
  - `src/utils/formatTime.js` — exports `formatDuration()`, `parseTimeString()`, `createProgressBar()`

## Key File Locations

**Entry Points:**
- `src/index.js`: Application bootstrap; the only file `node` runs directly

**Configuration:**
- `package.json`: Scripts, dependencies, engines requirement (Node >= 18)
- `.env.example`: Lists all required environment variables
- `Dockerfile` / `docker-compose.yml`: Container deployment config

**Core Logic:**
- `src/extractors/YtDlpExtractor.js`: YouTube audio pipeline (most complex file)
- `src/commands/play.js`: Primary user-facing command with search/playlist/selection flow
- `src/handlers/buttonHandler.js`: All interactive button logic for the player UI

**Embed Builders:**
- `src/utils/createPlayerEmbed.js`: Now Playing, Queue, and Playlist embeds

## Naming Conventions

**Files:**
- Commands: camelCase verb or noun matching the slash command name (e.g., `play.js`, `nowplaying.js`, `bassboost.js`)
- Events: camelCase matching Discord.js event name (e.g., `interactionCreate.js`, `ready.js`)
- Handlers: camelCase describing the interaction type (e.g., `buttonHandler.js`)
- Extractors: PascalCase class name (e.g., `YtDlpExtractor.js`)
- Utils: camelCase describing what they create/produce (e.g., `createPlayerEmbed.js`, `formatTime.js`)

**Directories:**
- Plural nouns for collections: `commands/`, `events/`, `handlers/`, `extractors/`, `utils/`

**Exports:**
- Commands: `export default { data, execute }` (default export)
- Events: `export default { name, once?, execute }` (default export)
- Handlers: Named exports (`export async function handlePlayerButton`)
- Utils: Named exports (`export function createPlayerEmbed`, etc.)
- Extractors: Named class export (`export class YtDlpExtractor extends BaseExtractor`)

## Where to Add New Code

**New slash command:**
- Create `src/commands/<commandName>.js`
- Export `{ data: new SlashCommandBuilder().setName('<commandName>')..., execute: async (interaction) => {} }`
- No registration needed — `src/index.js` loads all `.js` files in `src/commands/` dynamically
- Slash command is registered to Discord on next bot startup via `src/events/ready.js`

**New button action:**
- Add a new `case` to the `switch` in `src/handlers/buttonHandler.js`
- Use `player_` prefix for playback controls, `queue_` prefix for queue management
- Ensure the button's `customId` matches the prefix check in `src/events/interactionCreate.js`

**New Discord event handler:**
- Create `src/events/<eventName>.js`
- Export `{ name: '<discordEventName>', once: false, execute: async (...args) => {} }`
- Loaded automatically by `src/index.js`

**New utility function:**
- Add to an existing file in `src/utils/` if closely related (e.g., new embed type → `createPlayerEmbed.js`)
- Or create `src/utils/<descriptiveName>.js` with named exports

**New audio extractor:**
- Create `src/extractors/<ExtractorName>.js` extending `BaseExtractor` from `discord-player`
- Register in `src/index.js` with `player.extractors.register(ExtractorName, {})`

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: By `/gsd:map-codebase` command
- Committed: Yes

**`node_modules/`:**
- Generated: Yes
- Committed: No

**`.github/workflows/`:**
- Purpose: CI/CD pipeline definitions
- Committed: Yes

**`developers/`:**
- Purpose: Developer-only scripts not needed for production use
- Committed: Yes

---

*Structure analysis: 2026-03-29*
