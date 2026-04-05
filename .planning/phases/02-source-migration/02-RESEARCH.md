# Phase 2: Source Migration - Research

**Researched:** 2026-03-30
**Domain:** TypeScript migration of a discord.js + discord-player v7.2.0 bot codebase
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Type Strictness**
- Annotate function parameters and return types explicitly
- Let TypeScript infer local variable types — no redundant annotations
- Follows community standard: clear contracts at function boundaries, clean internals

**Code Cleanup Scope**
- Pure port only — rename `.js` → `.ts`, add type annotations, preserve all existing logic exactly
- No refactoring of repeated patterns (e.g., duplicated error handling stays as-is)
- No consolidation of shared logic — improvements deferred to Phase 4 (Command Audit)
- Rationale: isolates type issues from logic changes, makes debugging straightforward

**`any` Escape Hatches**
- Pragmatic type assertions (`as SomeType`) allowed at discord-player library boundaries
- No `any` spreading into application code — assertions contained at the border
- Specific known boundaries:
  - `willPlayTrack` event: type the resolver callback explicitly (`() => void`)
  - `YtDlpExtractor` extending `BaseExtractor`: use assertions where base class types are incomplete
- If discord-player types are missing, write inline assertions rather than `.d.ts` declaration files

**Dynamic Loader Strategy**
- Filter for `.ts` files in `readdirSync` calls (`f.endsWith('.ts')`)
- Import using `.js` extensions (NodeNext convention): `import(join(path, file.replace('.ts', '.js')))`
- `tsx` (dev) resolves `.js` → `.ts` automatically; `tsc` (build) compiles `.ts` → `.js` in `dist/`
- One loader implementation works for both dev and production — no runtime environment detection

### Claude's Discretion
- Migration order (which files to convert first — dependency order vs. leaf-first)
- Number and scope of plans (how to batch the 20+ files across plans)
- Specific type choices for discord-player internals where multiple valid types exist
- Whether to flip `allowJs: false` in tsconfig as a final step or leave it for verification

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | All 14 slash commands converted to TypeScript with proper types | CommandModule interface already exists; 14 `.js` files in `src/commands/` identified; typed `execute(interaction: ChatInputCommandInteraction)` pattern documented |
| MIG-02 | `YtDlpExtractor` migrated to TypeScript with typed `BaseExtractor` extension | `BaseExtractor<T>` generic class signature verified from actual `.d.ts`; `ExtractorSearchContext`, `ExtractorInfo`, `ExtractorStreamable` types identified |
| MIG-03 | `willPlayTrack` listener typed with all 4 parameters (queue, track, config, resolver) | `GuildQueueEvents[WillPlayTrack]` signature verified: `(queue: GuildQueue<Meta>, track: Track<unknown>, config: StreamConfig, done: () => void) => unknown` |
| MIG-04 | Event handlers (`ready.js`, `interactionCreate.js`) converted to TypeScript | EventModule interface already exists; `Client` and `ChatInputCommandInteraction` types identified |
| MIG-05 | Button handler converted to TypeScript with typed interaction routing | `ButtonInteraction` from discord.js; `useQueue` from discord-player with `QueueMetadata` generic |
| MIG-06 | Utility functions (`createPlayerEmbed`, `createSongSelectionEmbed`, `formatTime`) converted to TypeScript | `Track`, `GuildQueue<QueueMetadata>`, `EmbedBuilder`, `ActionRowBuilder<ButtonBuilder>` types identified; return type pattern documented |
| MIG-07 | `src/index.ts` bootstrap file migrated with typed Player and Client setup | `QueueMetadata` type already exists; loader pattern documented; `tsconfig.json` exclusion of `src/index.ts` must be removed |
| MIG-08 | All 14 slash commands verified working after migration (no regressions) | Verified by `npm run build` + bot startup check |
| MIG-09 | Legacy `PlayDLExtractor.js` removed (inactive, not registered) | File exists at `src/extractors/PlayDLExtractor.js`; confirmed not imported anywhere in active code |
</phase_requirements>

---

## Summary

Phase 2 is a pure `.js` → `.ts` rename-and-annotate operation across 20 source files: 14 commands, 2 events, 1 extractor, 1 handler, 2 utils, and the bootstrap `src/index.js`. No logic changes are permitted. The shared type layer from Phase 1 (`CommandModule`, `EventModule`, `QueueMetadata`) covers the bulk of the annotation surface. The single most important preparation step is updating `QueueMetadata` to add `voiceChannel: VoiceBasedChannel` — 11 of 14 commands read `queue.metadata.voiceChannel.id` and the current interface is missing this property, which will be a hard TypeScript error at strict mode.

The discord-player v7.2.0 type declarations ship with the package and are complete enough for all methods used in this codebase. `BaseExtractor` is a concrete class (not abstract), all method signatures are typed, and the `willPlayTrack` event type is exactly `(queue: GuildQueue<Meta>, track: Track<unknown>, config: StreamConfig, done: () => void) => unknown`. No custom `.d.ts` files are needed.

**Primary recommendation:** Convert in dependency order — utilities first, then extractor, then events/handler, then commands, then bootstrap. Update `QueueMetadata` before touching any command file. Each file compiles independently once its imports are resolved.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | ^5.8.3 (installed) | Compiler | Already installed Phase 1 |
| discord.js | ^14.16.3 | Bot framework types | Source of `ChatInputCommandInteraction`, `ButtonInteraction`, `VoiceBasedChannel`, `EmbedBuilder`, etc. |
| discord-player | 7.2.0 (pinned) | Player framework types | Ships `GuildQueue`, `Track`, `BaseExtractor`, `GuildQueueEvents`, `StreamConfig` in `dist/index.d.ts` |
| yt-dlp-wrap | ^2.3.12 | YouTube downloader wrapper | Ships `YTDlpWrap` class with typed `execPromise`, `execStream`, `getVersion` in `dist/index.d.ts` |

### No Additional Packages Required
All type information is available from already-installed packages. No `@types/*` packages need to be installed — discord.js bundles its own types, discord-player bundles its own types, and yt-dlp-wrap bundles its own types.

**Installation:** No new packages needed for Phase 2.

---

## Architecture Patterns

### Recommended Migration Order

Convert files in leaf-first (dependency order) to ensure each file's imports resolve before its consumers:

```
Wave 1 — Pure utilities (no discord-player imports, only discord.js)
  src/utils/formatTime.js        → formatTime.ts
  src/utils/createSongSelectionEmbed.js → createSongSelectionEmbed.ts
  src/utils/createPlayerEmbed.js → createPlayerEmbed.ts

Wave 2 — Extractor (depends on discord-player, no other local files)
  src/extractors/YtDlpExtractor.js → YtDlpExtractor.ts
  src/extractors/PlayDLExtractor.js → DELETE (MIG-09)

Wave 3 — Events and handler (depends on utils)
  src/handlers/buttonHandler.js  → buttonHandler.ts
  src/events/ready.js            → ready.ts
  src/events/interactionCreate.js → interactionCreate.ts

Wave 4 — Commands (depend only on utils, all uniform shape)
  src/commands/*.js              → src/commands/*.ts (all 14 files)

Wave 5 — Bootstrap and tsconfig finalization
  src/index.js                   → index.js content moves into src/index.ts
  tsconfig.json: remove src/index.ts from "exclude"
  tsconfig.json: flip allowJs to false
```

### Pattern 1: Command File TypeScript Shape

Every command uses the existing `CommandModule` interface from `src/types/index.ts`:

```typescript
// Source: src/types/index.ts (Phase 1 output)
import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { type CommandModule } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // ... existing logic unchanged
  }
}

export default command
```

Note: `data` type in `CommandModule` is `SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>` which matches all 14 current usages.

### Pattern 2: Event File TypeScript Shape

Every event uses the existing `EventModule` interface:

```typescript
// Source: src/types/index.ts (Phase 1 output)
import type { Client } from 'discord.js'
import { type EventModule } from '../types/index.js'

const event: EventModule = {
  name: 'clientReady',
  once: true,
  async execute(client: Client): Promise<void> {
    // ... existing logic unchanged
  }
}

export default event
```

`EventModule.execute` is typed as `(...args: unknown[]) => Promise<void> | void`. For the `ready` event, the execute parameter is `Client` but the type is `unknown[]` — cast inside the function body: `const c = client as unknown as Client`.

### Pattern 3: BaseExtractor Extension

`BaseExtractor<T>` is a generic concrete class. The extractor options object type is the generic parameter:

```typescript
// Source: node_modules/discord-player/dist/index.d.ts line 3253
import {
  BaseExtractor,
  ExtractorExecutionContext,
  ExtractorInfo,
  ExtractorSearchContext,
  ExtractorStreamable,
  QueryType,
  SearchQueryType,
  Track,
  type GuildQueueHistory,
} from 'discord-player'
import YTDlpWrap from 'yt-dlp-wrap'

export class YtDlpExtractor extends BaseExtractor<object> {
  static identifier = 'com.discord-player.ytdlpextractor'
  private ytDlp: YTDlpWrap

  constructor(context: ExtractorExecutionContext, options?: object) {
    super(context, options)
    // ...
  }

  async validate(query: string, type?: SearchQueryType | null): Promise<boolean> { ... }
  async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> { ... }
  async stream(info: Track): Promise<ExtractorStreamable> { ... }
  async activate(): Promise<void> { ... }
}
```

`YTDlpWrap` has a default export — the existing `import pkg from 'yt-dlp-wrap'` CJS interop pattern works but with `esModuleInterop: true` in tsconfig, `import YTDlpWrap from 'yt-dlp-wrap'` is the cleaner TypeScript form.

### Pattern 4: willPlayTrack Event Typing

Exact signature from `GuildQueueEvents` in `discord-player/dist/index.d.ts` line 1908:

```typescript
// Source: node_modules/discord-player/dist/index.d.ts line 1908
import type { GuildQueue, Track, StreamConfig } from 'discord-player'

player.events.on(
  'willPlayTrack',
  (queue: GuildQueue<QueueMetadata>, track: Track<unknown>, config: StreamConfig, done: () => void): void => {
    console.log(`[Audio Player] Will play track: ${track.title}`)
    done()
  }
)
```

This satisfies MIG-03 directly with zero type assertions needed.

### Pattern 5: QueueMetadata Must Add voiceChannel

**Critical:** The current `QueueMetadata` interface in `src/types/index.ts` is missing `voiceChannel`. 11 of 14 commands access `queue.metadata.voiceChannel.id`. This will fail strict TypeScript compilation.

```typescript
// Update src/types/index.ts — add voiceChannel BEFORE migrating any command
import type { VoiceBasedChannel } from 'discord.js'

export interface QueueMetadata {
  channel: TextBasedChannel
  requestedBy: User
  voiceChannel: VoiceBasedChannel   // ADD THIS
}
```

`VoiceBasedChannel` is the correct type: it is the union of `VoiceChannel | StageChannel` that `interaction.member.voice.channel` returns (after a non-null assertion, since `GuildMemberVoiceState.channel` is `VoiceBasedChannel | null`).

### Pattern 6: Dynamic Loader in index.ts

The locked convention from CONTEXT.md — filter for `.ts`, import with `.js` extension:

```typescript
// Source: CONTEXT.md locked decision
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.ts'))

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const mod = await import(filePath.replace('.ts', '.js'))
  // ...
}
```

`tsx` watch mode resolves `.js` → `.ts` at runtime. `tsc` compiles `.ts` → `.js` in `dist/`, so the same import path resolves against compiled output in production.

### Pattern 7: Button Handler Typing

`useQueue` is generic — pass `QueueMetadata` to get typed `.metadata`:

```typescript
// Source: node_modules/discord-player/dist/index.d.ts
import type { ButtonInteraction } from 'discord.js'
import { useQueue } from 'discord-player'
import type { QueueMetadata } from '../types/index.js'

export async function handlePlayerButton(interaction: ButtonInteraction): Promise<void> {
  const queue = useQueue<QueueMetadata>(interaction.guild!.id)
  // queue.metadata.channel is now TextBasedChannel (typed)
  // ...
}
```

### Pattern 8: Utility Function Return Types

```typescript
// createPlayerEmbed.ts return type
import type { GuildQueue, Track } from 'discord-player'
import type { APIActionRowComponent, APIMessageActionRowComponent } from 'discord.js'
import type { QueueMetadata } from '../types/index.js'

interface PlayerEmbedResult {
  embeds: EmbedBuilder[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

export function createPlayerEmbed(
  track: Track,
  queue: GuildQueue<QueueMetadata>
): PlayerEmbedResult { ... }
```

### Anti-Patterns to Avoid

- **Importing with `.ts` extension:** NodeNext requires `.js` extensions in import statements even for TypeScript source files. Never `import './foo.ts'` — always `import './foo.js'`.
- **Using `any` for `queue.metadata`:** Pass `QueueMetadata` as the generic to `GuildQueue<QueueMetadata>` and `useQueue<QueueMetadata>()` instead.
- **Adding `libsodium-wrappers` types:** `@types/libsodium-wrappers` is not needed — the package is only used internally by discord-player, not imported in this codebase.
- **Widening `EventModule.execute` args:** The `...args: unknown[]` parameter is intentional — it keeps event handlers loose. Cast inside the body where needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| willPlayTrack parameter types | Custom interface | `GuildQueueEvents[GuildQueueEvent.WillPlayTrack]` parameters directly | Exact types ship with discord-player |
| BaseExtractor method signatures | Custom abstract class | `extends BaseExtractor<object>` | Full class with correct signatures ships with package |
| Discord.js message component types | Custom interfaces | `ActionRowBuilder<ButtonBuilder>`, `EmbedBuilder` from discord.js | All types ship with discord.js |
| QueueRepeatMode constants | Custom enum | `QueueRepeatMode` from discord-player | Ships as `{ OFF: 0, TRACK: 1, QUEUE: 2, AUTOPLAY: 3 }` — use directly |

**Key insight:** Every library used in this bot ships TypeScript declarations. Zero custom `.d.ts` files are needed.

---

## Common Pitfalls

### Pitfall 1: Missing voiceChannel in QueueMetadata
**What goes wrong:** `Property 'voiceChannel' does not exist on type 'QueueMetadata'` errors in 11 command files during `npm run build`.
**Why it happens:** The Phase 1 `QueueMetadata` interface was created without looking at what properties the code stores at queue creation time. `play.js` stores `{ channel, voiceChannel }` in metadata but the type only declared `channel` and `requestedBy`.
**How to avoid:** Update `QueueMetadata` in `src/types/index.ts` to add `voiceChannel: VoiceBasedChannel` as the very first step, before converting any command.
**Warning signs:** Any command file that checks `queue.metadata.voiceChannel.id` will fail immediately at typecheck.

### Pitfall 2: tsconfig.json Excludes src/index.ts
**What goes wrong:** `src/index.ts` bootstrap is excluded from compilation (`"exclude": ["src/index.ts"]`). If you write code there without removing the exclusion, `npm run build` silently omits the file.
**Why it happens:** The Phase 1 shim (`src/index.ts` containing only `import './index.js'`) needed to be excluded because `src/index.js` was the real entry point. Now `src/index.ts` becomes the real entry point.
**How to avoid:** Remove `src/index.ts` from the `exclude` array in `tsconfig.json` as part of the bootstrap migration step.
**Warning signs:** `dist/index.js` is missing after `npm run build`.

### Pitfall 3: import() in Dynamic Loader Returns { default: CommandModule }
**What goes wrong:** `command.default.data.name` is untyped or TypeScript complains about unknown import shape.
**Why it happens:** Dynamic `import()` returns `Promise<any>` when the path is a computed string. TypeScript can't infer the module shape.
**How to avoid:** Explicitly cast: `const mod = await import(...) as { default: CommandModule }`. One-line assertion, contained at the loader boundary.
**Warning signs:** `command.default` typed as `any` propagating through the loader — eslint will catch this if `no-unsafe-member-access` is enabled.

### Pitfall 4: YtDlpWrap Default Export Interop
**What goes wrong:** `import pkg from 'yt-dlp-wrap'` works in JS but TypeScript with `skipLibCheck: false` would complain about the default import pattern. The current JS file uses `const { default: YTDlpWrap } = pkg`.
**Why it happens:** `yt-dlp-wrap` ships as a CommonJS module with a default export. The destructuring pattern is a CJS interop workaround.
**How to avoid:** With `esModuleInterop: true` already in tsconfig, use `import YTDlpWrap from 'yt-dlp-wrap'` directly. TypeScript + esModuleInterop handles the CJS default import correctly.
**Warning signs:** Type error `Module ... has no exported member 'default'` if esModuleInterop is missing or the import style is wrong.

### Pitfall 5: GuildQueue metadata Generic Not Propagated
**What goes wrong:** `queue.metadata.channel` is typed as `any` throughout event handlers in `src/index.ts`, because `player.events.on('playerStart', (queue, track) => ...)` uses the generic `GuildQueueEvents<any>` default.
**Why it happens:** `player.events` is typed as `PlayerEventsEmitter<GuildQueueEvents<any>>`. The `Meta` generic flows from queue creation, not the event emitter.
**How to avoid:** For the event handlers in `index.ts` that access `queue.metadata`, assert once: `const meta = queue.metadata as QueueMetadata`. This is the library boundary assertion the CONTEXT.md explicitly approves.
**Warning signs:** `queue.metadata.channel` typed as `any` instead of `TextBasedChannel`.

### Pitfall 6: interaction.member Nullable in Strict Mode
**What goes wrong:** `interaction.member` is typed as `GuildMember | APIInteractionGuildMember | null` in discord.js. All commands access `interaction.member.voice.channel` without null checking.
**Why it happens:** Slash commands in guild channels always have a member, but TypeScript doesn't know the command was invoked in a guild at the time of type checking.
**How to avoid:** The safest pattern is `interaction.member as GuildMember` once at the top of `execute`, since all 14 commands are guild-only commands. This is an acceptable assertion at the library boundary. Alternatively use `!` non-null assertions inline.
**Warning signs:** `Object is possibly 'null'` or `Property 'voice' does not exist on type 'APIInteractionGuildMember'`.

---

## Code Examples

Verified patterns from the actual installed package type declarations:

### willPlayTrack — Verified Signature
```typescript
// Source: node_modules/discord-player/dist/index.d.ts line 1908
// GuildQueueEvents[GuildQueueEvent.WillPlayTrack]:
//   (queue: GuildQueue<Meta>, track: Track<unknown>, config: StreamConfig, done: () => void) => unknown

import type { GuildQueue, Track, StreamConfig } from 'discord-player'
import type { QueueMetadata } from './types/index.js'

player.events.on(
  'willPlayTrack',
  (queue: GuildQueue<QueueMetadata>, track: Track<unknown>, config: StreamConfig, done: () => void): void => {
    done()
  }
)
```

### BaseExtractor — Verified Class Signature
```typescript
// Source: node_modules/discord-player/dist/index.d.ts line 3253
import {
  BaseExtractor,
  type ExtractorExecutionContext,
  type ExtractorInfo,
  type ExtractorSearchContext,
  type ExtractorStreamable,
  type SearchQueryType,
  type Track,
} from 'discord-player'

export class YtDlpExtractor extends BaseExtractor<object> {
  static identifier = 'com.discord-player.ytdlpextractor'
  private ytDlp: YTDlpWrap

  constructor(context: ExtractorExecutionContext, options?: object) {
    super(context, options)
  }

  async validate(query: string, type?: SearchQueryType | null): Promise<boolean> { ... }
  async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> { ... }
  async stream(info: Track): Promise<ExtractorStreamable> { ... }
  async activate(): Promise<void> { ... }
}
```

### QueueMetadata Update — First Step
```typescript
// Source: src/types/index.ts — update before migrating any command
import type {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
  TextBasedChannel,
  User,
  VoiceBasedChannel,     // ADD
} from 'discord.js'

export interface QueueMetadata {
  channel: TextBasedChannel
  requestedBy: User
  voiceChannel: VoiceBasedChannel  // ADD — used by 11 of 14 commands
}
```

### Dynamic Loader — Locked Pattern
```typescript
// Source: CONTEXT.md locked decision
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { CommandModule } from './types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.ts'))

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const mod = await import(filePath.replace('.ts', '.js')) as { default: CommandModule }
  // ...
}
```

Wait: in production (`node dist/`), `__dirname` resolves inside `dist/`, and the compiled command files end in `.js`. The `readdirSync` reads actual files on disk. In production, `dist/commands/` contains `.js` files, so the filter `.endsWith('.ts')` would return zero results.

**Correction:** The filter must work for both environments:
```typescript
// Works in both tsx (src/ has .ts) and node dist/ (dist/ has .js)
const commandFiles = readdirSync(commandsPath).filter(
  (f) => f.endsWith('.ts') || f.endsWith('.js')
)
// Import always uses .js extension (tsx auto-resolves, tsc output is .js)
const mod = await import(join(commandsPath, file.replace(/\.ts$/, '.js'))) as { default: CommandModule }
```

This is a refinement over the CONTEXT.md description — the decision was "filter for `.ts` files", which is correct for `tsx` dev mode, but production `node dist/` reads `.js` files from `dist/commands/`. The implementation must handle both.

### useQueue with Generic — Button Handler
```typescript
// Source: node_modules/discord-player/dist/index.d.ts — useQueue signature
import type { ButtonInteraction } from 'discord.js'
import { useQueue } from 'discord-player'
import type { QueueMetadata } from '../types/index.js'

export async function handlePlayerButton(interaction: ButtonInteraction): Promise<void> {
  const queue = useQueue<QueueMetadata>(interaction.guild!.id)
  if (!queue) {
    await interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true })
    return
  }
  // queue.metadata.channel is TextBasedChannel (typed)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `allowJs: true` (Phase 1) | `allowJs: false` (end of Phase 2) | After all `.js` removed from `src/` | Removes JS compilation entirely; hard error if any `.js` slips in |
| `"exclude": ["src/index.ts"]` (Phase 1 shim) | Remove exclusion (Phase 2 bootstrap migration) | When `src/index.ts` becomes the real entry | tsc now compiles the bootstrap file |
| `import './index.js'` shim in src/index.ts | Full bootstrap code in src/index.ts | Phase 2 Wave 5 | Eliminates the two-file indirection |

**File inventory (20 files to convert, 1 to delete):**

| File | Action | Requirement |
|------|--------|-------------|
| `src/utils/formatTime.js` | → `formatTime.ts` | MIG-06 |
| `src/utils/createSongSelectionEmbed.js` | → `createSongSelectionEmbed.ts` | MIG-06 |
| `src/utils/createPlayerEmbed.js` | → `createPlayerEmbed.ts` | MIG-06 |
| `src/extractors/YtDlpExtractor.js` | → `YtDlpExtractor.ts` | MIG-02, MIG-03 |
| `src/extractors/PlayDLExtractor.js` | DELETE | MIG-09 |
| `src/handlers/buttonHandler.js` | → `buttonHandler.ts` | MIG-05 |
| `src/events/ready.js` | → `ready.ts` | MIG-04 |
| `src/events/interactionCreate.js` | → `interactionCreate.ts` | MIG-04 |
| `src/commands/back.js` | → `back.ts` | MIG-01 |
| `src/commands/bassboost.js` | → `bassboost.ts` | MIG-01 |
| `src/commands/jump.js` | → `jump.ts` | MIG-01 |
| `src/commands/loop.js` | → `loop.ts` | MIG-01 |
| `src/commands/nowplaying.js` | → `nowplaying.ts` | MIG-01 |
| `src/commands/pause.js` | → `pause.ts` | MIG-01 |
| `src/commands/play.js` | → `play.ts` | MIG-01 |
| `src/commands/queue.js` | → `queue.ts` | MIG-01 |
| `src/commands/resume.js` | → `resume.ts` | MIG-01 |
| `src/commands/seek.js` | → `seek.ts` | MIG-01 |
| `src/commands/shuffle.js` | → `shuffle.ts` | MIG-01 |
| `src/commands/skip.js` | → `skip.ts` | MIG-01 |
| `src/commands/stop.js` | → `stop.ts` | MIG-01 |
| `src/commands/volume.js` | → `volume.ts` | MIG-01 |
| `src/index.js` | → content absorbed into `src/index.ts` | MIG-07 |

---

## Open Questions

1. **Dynamic loader in production: `.ts` vs `.js` filter**
   - What we know: `tsx` watch mode serves from `src/`, where files are `.ts`. `node dist/` serves from `dist/`, where files are `.js`.
   - What's unclear: CONTEXT.md locked `f.endsWith('.ts')` but this would silently load zero commands in production.
   - Recommendation: Use `f.endsWith('.ts') || f.endsWith('.js')` to be safe for both environments. This is strictly additive to the locked decision and handles the production case correctly.

2. **`src/index.ts` becomes the bootstrap — what happens to `src/index.js`?**
   - What we know: Currently `src/index.ts` is a one-line shim (`import './index.js'`). The real code is in `src/index.js`. The plan replaces `src/index.ts` with the full bootstrap and deletes `src/index.js`.
   - What's unclear: Should the shim line be preserved briefly, or is the migration atomic?
   - Recommendation: Atomic — write the full bootstrap directly into `src/index.ts` and delete `src/index.js` in the same commit. This avoids a broken intermediate state.

---

## Validation Architecture

### Test Framework

No automated test framework is installed or configured. The `package.json` has no `"test"` script and no test directories exist.

| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | None |
| Quick run command | `npm run typecheck` (tsc --noEmit) |
| Full suite command | `npm run build && node dist/index.js` (manual smoke test) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | 14 commands compile without errors | typecheck | `npm run typecheck` | ✅ (tsconfig) |
| MIG-02 | YtDlpExtractor extends BaseExtractor cleanly | typecheck | `npm run typecheck` | ✅ |
| MIG-03 | willPlayTrack 4-param signature accepted | typecheck | `npm run typecheck` | ✅ |
| MIG-04 | Event handlers compile without errors | typecheck | `npm run typecheck` | ✅ |
| MIG-05 | ButtonInteraction typing accepted | typecheck | `npm run typecheck` | ✅ |
| MIG-06 | Util functions compile with explicit types | typecheck | `npm run typecheck` | ✅ |
| MIG-07 | Bootstrap compiles; `dist/index.js` is emitted | build | `npm run build` | ✅ |
| MIG-08 | Bot starts, connects to voice channel | smoke/manual | `npm start` (observe startup log) | manual-only |
| MIG-09 | No PlayDLExtractor.js in repo | file check | `test ! -f src/extractors/PlayDLExtractor.js` | ❌ (to be deleted) |

**MIG-08 justification for manual-only:** Voice connection requires a running Discord bot token, live guild, and voice channel — cannot be automated in a non-interactive environment.

### Sampling Rate
- **Per wave commit:** `npm run typecheck`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` green with zero errors, then manual smoke test confirming voice channel join before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test files to create — `npm run typecheck` is the automated validation gate
- [ ] `npm run build` already configured — zero setup required
- [ ] Phase gate test: `test ! -f src/extractors/PlayDLExtractor.js` — shell one-liner, no file needed

None — existing build infrastructure covers all automated phase requirements.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/discord-player/dist/index.d.ts` — Verified `BaseExtractor`, `GuildQueueEvents`, `willPlayTrack` signature, `GuildQueue<Meta>`, `QueueRepeatMode`, `ExtractorInfo`, `ExtractorSearchContext`, `ExtractorStreamable`, `StreamConfig`
- `node_modules/yt-dlp-wrap/dist/index.d.ts` — Verified `YTDlpWrap` class, `execPromise`, `execStream`, `getVersion` method signatures
- `node_modules/discord.js/typings/index.d.ts` — Verified `VoiceBasedChannel`, `ButtonInteraction`, `ChatInputCommandInteraction`, `GuildMember`
- `src/types/index.ts` (Phase 1 output) — Verified `CommandModule`, `EventModule`, `QueueMetadata` existing definitions
- `tsconfig.json` — Verified `allowJs: true`, `module: NodeNext`, `exclude: ["src/index.ts"]`, `strict: true`

### Secondary (MEDIUM confidence)
- `src/index.js`, `src/commands/*.js`, `src/events/*.js`, `src/handlers/*.js`, `src/utils/*.js`, `src/extractors/YtDlpExtractor.js` — Direct code inspection of all 20 source files to be migrated

### Tertiary (LOW confidence)
- None — all findings verified from installed package declarations and source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all types verified from installed `.d.ts` files
- Architecture: HIGH — all patterns derived from existing source code + verified type signatures
- Pitfalls: HIGH — `voiceChannel` gap confirmed by direct code inspection (11 command files, missing from type); `tsconfig.json` exclusion confirmed by reading the file; other pitfalls confirmed from type declarations

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable — discord-player is pinned at 7.2.0 exactly)
