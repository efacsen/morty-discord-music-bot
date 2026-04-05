# Coding Conventions

**Analysis Date:** 2026-03-29

## Naming Patterns

**Files:**
- Utility files: camelCase (`createPlayerEmbed.js`, `formatTime.js`, `createSongSelectionEmbed.js`)
- Command files: lowercase single-word matching the command name (`play.js`, `skip.js`, `nowplaying.js`, `bassboost.js`)
- Event files: camelCase matching the event name (`interactionCreate.js`, `ready.js`)
- Extractor files: PascalCase matching the class name (`YtDlpExtractor.js`, `PlayDLExtractor.js`)
- Handler files: camelCase (`buttonHandler.js`)

**Functions:**
- Exported named functions: camelCase (`formatDuration`, `parseTimeString`, `createProgressBar`, `createPlayerEmbed`, `handlePlayerButton`)
- Private/internal functions: camelCase (`getLoopLabel`, `updateNowPlayingMessage`, `findYtDlpPath`)

**Variables:**
- Local variables: camelCase (`searchResult`, `currentTrack`, `playlistTitle`)
- Constants (module-level): camelCase (`nowPlayingMessages`, `commandsPath`)
- Class static properties: camelCase (`identifier` in `YtDlpExtractor`)

**Classes:**
- PascalCase (`YtDlpExtractor`, extending `BaseExtractor`)

**Command/Button IDs:**
- Slash command names: lowercase (`play`, `skip`, `nowplaying`, `bassboost`)
- Button customIds: snake_case with prefix namespace (`player_pause`, `player_skip`, `queue_remove_0`, `song_select_1`)

## Code Style

**Formatting:**
- No automated formatter configured (no `.prettierrc`, no `biome.json`, no ESLint config)
- Indentation: 4 spaces consistently throughout all source files
- Single quotes for string literals in most places; backtick template literals for log messages and interpolated strings
- Trailing commas in multi-line object/array literals

**Linting:**
- No ESLint or other linter configured; code quality enforced by convention only

## Module System

**Type:** ES Modules (`"type": "module"` in `package.json`)

**Imports:** Named imports preferred for multi-export modules; default imports for command/event modules

**Import Order (observed pattern):**
1. External package imports (`discord.js`, `discord-player`)
2. Internal utility/helper imports (relative paths with `.js` extension required for ESM)

**Path Aliases:** None configured; all internal imports use relative paths with explicit `.js` extensions

**ES Module workaround for `__dirname`:**
```js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```
This pattern is used in `src/index.js` for dynamic file loading.

## Command Module Structure

Every command file in `src/commands/` exports a default object with exactly two properties:

```js
export default {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Description here'),

    async execute(interaction) {
        // implementation
    }
};
```

## Event Module Structure

Every event file in `src/events/` exports a default object:

```js
export default {
    name: 'eventName',
    once: false, // or true for one-time events
    async execute(...args) {
        // implementation
    }
};
```

## Error Handling

**Primary pattern — try/catch per command:**
Every `execute` method wraps its entire body in a `try/catch`. The catch block:
1. Logs with `console.error('Error in [command] command:', error)`
2. Checks `interaction.replied || interaction.deferred` to pick the right reply method
3. Sends an ephemeral error reply to the user

```js
async execute(interaction) {
    try {
        // ...
    } catch (error) {
        console.error('Error in skip command:', error);
        const errorMsg = { content: `❌ Error: ${error.message}`, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMsg);
        } else {
            await interaction.reply(errorMsg);
        }
    }
}
```

**Secondary pattern — deferred vs non-deferred branching:**
Commands that call `interaction.deferReply()` use `interaction.editReply()` for subsequent responses; commands that do not defer use `interaction.reply()` directly.

**Defensive null checks before queue operations:**
Every command that needs the queue follows this guard sequence:
1. Check `interaction.member.voice.channel` exists
2. Call `player.queues.get(interaction.guildId)` and guard for null queue
3. Check user is in the same voice channel as the bot (where applicable)

**Top-level process resilience in `src/index.js`:**
```js
process.on('unhandledRejection', (error) => { console.error(...) });
process.on('uncaughtException', (error) => { console.error(...) });
client.on('error', (error) => { console.error(...) });
```

**Extractor error handling:**
Methods in `YtDlpExtractor` return `{ tracks: [] }` on failure instead of throwing, so the player degrades gracefully.

## Logging

**Framework:** `console` only (no structured logging library)

**Patterns:**
- Info: `console.log()`
- Errors: `console.error()`
- Warnings: `console.warn()`
- Bracketed prefix tags on all log messages: `[Player Debug]`, `[Play Command]`, `[YtDlp]`, `[Voice Connection]`
- Emojis used in log messages for visual scanning: `✅`, `▶️`, `➕`, `❌`, `⚠️`

**Log prefix convention:**
```js
console.log(`[ModuleName] Message: ${value}`);
console.error(`[ModuleName] Error description:`, errorObject);
```

## Comments

**JSDoc blocks:** Used on all exported utility functions and public methods in `YtDlpExtractor`

```js
/**
 * Convert milliseconds to HH:MM:SS or MM:SS format
 * @param {number} ms - Milliseconds to format
 * @returns {string} Formatted time string
 */
export function formatDuration(ms) {
```

**Inline comments:** Used liberally to explain non-obvious logic, especially:
- Discord interaction reply state (deferred vs non-deferred)
- `willPlayTrack` resolver callback requirement
- yt-dlp stream buffering rationale
- Voice connection state transitions

**Section comments:** Block comments used in `src/index.js` to separate initialization phases:
```js
// Initialize Discord client
// Initialize discord-player
// Player event handlers
// Load command files dynamically
```

## Function Design

**Size:** Commands are one `execute` function each; complex logic is extracted to utility files or handler files

**Parameters:** Commands take a single `interaction` parameter; utilities take explicit typed parameters with JSDoc

**Return Values:**
- Commands: implicit return (use `return interaction.reply(...)` as early exit)
- Utilities: plain objects matching discord.js message data shape `{ embeds, components }`
- Extractor methods: `{ tracks }` or `{ playlist, tracks }` objects

## Module Design

**Exports:**
- Commands and events: single `export default { ... }` object
- Utilities: multiple named exports (`export function ...`)
- Extractor class: named export (`export class YtDlpExtractor`)

**Barrel Files:** None used; all imports reference specific file paths directly

---

*Convention analysis: 2026-03-29*
