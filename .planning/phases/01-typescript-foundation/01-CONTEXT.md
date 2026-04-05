# Phase 1: TypeScript Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure the TypeScript compiler, shared type layer, build pipeline (build/dev/start scripts), ESLint 9, Prettier, pin discord-player, and add @snazzah/davey startup check. This is pure infrastructure — no source files are migrated (that's Phase 2).

</domain>

<decisions>
## Implementation Decisions

### TypeScript Strictness
- `strict: true` only — no additional strict flags (noUncheckedIndexedAccess, etc.)
- `module: "NodeNext"` with `.js` extensions in import paths (correct Node.js ESM pattern)
- `target: "ES2022"` — matches `engines: >=18.0.0` in package.json
- `allowJs: true`, `checkJs: false` — TypeScript compiles .ts files, ignores .js files during Phase 1

### ESLint/Prettier Rules
- ESLint 9 flat config with `eslint/recommended` + `typescript-eslint/recommended` presets only
- ESLint targets `.ts` files only in Phase 1 — existing `.js` files get linted when converted in Phase 2
- Prettier: single quotes, no semicolons, 100 character print width

### Shared Type Design
- All shared interfaces in single file: `src/types/index.ts`
- `CommandModule`: `data` (SlashCommandBuilder) + `execute` (interaction handler) — no autocomplete hook
- `EventModule`: `name`, optional `once`, `execute` — matches current event export pattern
- `QueueMetadata`: `channel` + `requestedBy` — both are used in the codebase
- Typed `BotClient` or module augmentation for Client with `commands` Collection — created in Phase 1 so Phase 2 can use it immediately

### Build/Dev Scripts
- `npm run dev`: `tsx watch src/index.ts` — single command, no compile step during development
- `npm run build`: `tsc` — compiles to `dist/` directory
- `npm start`: `node dist/index.js` — production runs compiled JS, no tsx at runtime
- `npm run typecheck`: `tsc --noEmit` — quick type validation without generating output (referenced in Phase 6 CONTRIBUTING.md)

### Claude's Discretion
- Source map configuration
- Exact ESLint rule overrides beyond recommended presets
- tsconfig `include`/`exclude` patterns
- Prettier additional options (trailing commas, bracket spacing, etc.)
- davey startup check implementation approach

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 14 slash commands in `src/commands/` all follow `{ data, execute }` export pattern — CommandModule interface should match exactly
- 2 events in `src/events/` follow `{ name, once?, execute }` pattern — EventModule interface should match
- `queue.metadata.channel` used throughout for sending messages — QueueMetadata must include `channel`
- `createPlayerEmbed` references `requestedBy` in embeds — QueueMetadata must include `requestedBy`

### Established Patterns
- ESM throughout (`"type": "module"` in package.json, `import/export` syntax)
- Dynamic file loading via `readdirSync` + `import()` for commands and events
- `fileURLToPath`/`dirname` pattern for `__dirname` equivalent in ESM
- `dotenv.config()` at top of entry point

### Integration Points
- `package.json` scripts need updating: `start`, `dev` (currently `node --watch src/index.js`)
- New scripts to add: `build`, `typecheck`, `lint`, `format`
- `discord-player` version needs pinning from `^7.1.0` to exact `7.2.0`
- `@snazzah/davey` startup check needs to run before `client.login()`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-typescript-foundation*
*Context gathered: 2026-03-29*
