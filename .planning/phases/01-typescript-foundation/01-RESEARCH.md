# Phase 1: TypeScript Foundation - Research

**Researched:** 2026-03-29
**Domain:** TypeScript compiler setup, ESLint 9 flat config, Prettier, tsx, shared type layer
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `strict: true` only — no additional strict flags (noUncheckedIndexedAccess, etc.)
- `module: "NodeNext"` with `.js` extensions in import paths (correct Node.js ESM pattern)
- `target: "ES2022"` — matches `engines: >=18.0.0` in package.json
- `allowJs: true`, `checkJs: false` — TypeScript compiles .ts files, ignores .js files during Phase 1
- ESLint 9 flat config with `eslint/recommended` + `typescript-eslint/recommended` presets only
- ESLint targets `.ts` files only in Phase 1 — existing `.js` files get linted when converted in Phase 2
- Prettier: single quotes, no semicolons, 100 character print width
- All shared interfaces in single file: `src/types/index.ts`
- `CommandModule`: `data` (SlashCommandBuilder) + `execute` (interaction handler) — no autocomplete hook
- `EventModule`: `name`, optional `once`, `execute` — matches current event export pattern
- `QueueMetadata`: `channel` + `requestedBy` — both are used in the codebase
- Typed `BotClient` or module augmentation for Client with `commands` Collection — created in Phase 1
- `npm run dev`: `tsx watch src/index.ts`
- `npm run build`: `tsc`
- `npm start`: `node dist/index.js`
- `npm run typecheck`: `tsc --noEmit`

### Claude's Discretion
- Source map configuration
- Exact ESLint rule overrides beyond recommended presets
- tsconfig `include`/`exclude` patterns
- Prettier additional options (trailing commas, bracket spacing, etc.)
- davey startup check implementation approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TSF-01 | Project compiles with TypeScript strict mode (`strict: true`) and `module: "NodeNext"` | tsconfig patterns documented; NodeNext requires `.js` extensions in imports |
| TSF-02 | Shared type interfaces defined (`CommandModule`, `EventModule`, `QueueMetadata`) | Exact export shapes confirmed by reading source files; discord.js types verified |
| TSF-03 | Build pipeline configured — `npm run build` (tsc), `npm run dev` (tsx watch), `npm start` (node dist/) | tsx v4.21.0 already installed; exact commands confirmed |
| TSF-04 | ESLint 9 flat config with `typescript-eslint` unified package configured | typescript-eslint v8.x; exact install + config pattern documented |
| TSF-05 | Prettier configured with consistent formatting rules | Prettier 3 .prettierrc options confirmed |
| TSF-06 | `discord-player` pinned exactly at `7.2.0` (no caret) to prevent version drift | discord-player 7.2.0 already installed in node_modules |
| TSF-07 | `@snazzah/davey` startup check — throws descriptive error if package missing | Dynamic import() try/catch pattern confirmed; davey is a native module (NAPI-RS) |
</phase_requirements>

---

## Summary

Phase 1 is pure infrastructure scaffolding: no source files are migrated, only configuration files and a single `src/types/index.ts` are created. The project is already a Node.js ESM codebase (`"type": "module"` in package.json) running JavaScript, so TypeScript must be introduced non-destructively. `allowJs: true` / `checkJs: false` is the correct approach — the TypeScript compiler sees `.js` files but does not type-check them, so existing commands continue to work during Phase 1 unchanged.

All dev tooling needs to be installed fresh: there is no existing `tsconfig.json`, no `eslint.config.*`, no `.prettierrc`, and no `typescript` or `eslint` in `package.json`. The `tsx` binary is already present at v4.21.0 (installed as a transitive dep). TypeScript 5.9.3 is already in `node_modules` (transitive), but must be added to `devDependencies` explicitly. The only script change that could break the running bot is `npm start` — it must switch from `node src/index.js` to `node dist/index.js` only after `npm run build` is verified.

The `@snazzah/davey` startup check is a guard that runs before `client.login()`. Because davey is a native NAPI-RS module, the right detection pattern is a dynamic `import()` wrapped in try/catch — if the import throws `ERR_MODULE_NOT_FOUND`, the process exits with a clear error message before any Discord connection is attempted.

**Primary recommendation:** Install devDependencies, write tsconfig/eslint config/prettier config, create `src/types/index.ts` with the three interfaces, update `package.json` scripts, and add the davey guard to `src/index.js` (not yet migrated to .ts in Phase 1).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 5.9.3 (already in node_modules) | TypeScript compiler | Already present as transitive dep; pin to devDependencies |
| tsx | 4.21.0 (already installed) | TypeScript execution + watch mode | Fastest TS runner for Node; uses esbuild; no extra tsconfig needed for dev |
| eslint | 9.x latest | Linting engine | ESLint 9 is current stable; required for flat config |
| @eslint/js | 9.x (matches eslint) | `eslint.configs.recommended` | Peer of eslint 9 flat config |
| typescript-eslint | 8.x latest | TS-aware lint rules + parser | Unified package replaces `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` |
| prettier | 3.x latest | Code formatting | Standard for Node.js projects; works with ESLint 9 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-config-prettier | 9.x | Disable ESLint rules that conflict with Prettier | Always needed when running both ESLint and Prettier |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsx | ts-node | tsx is faster (esbuild) and handles NodeNext ESM without extra config; ts-node requires `esm: true` and separate tsconfig paths |
| typescript-eslint (unified) | @typescript-eslint/parser + @typescript-eslint/eslint-plugin separately | Unified package is the current recommended approach as of v8; fewer packages to manage |

**Installation (new devDependencies only — tsx and typescript are already present):**
```bash
npm install --save-dev typescript eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 only creates marked files)

```
src/
├── types/
│   └── index.ts         # NEW — CommandModule, EventModule, QueueMetadata, BotClient
├── commands/            # unchanged (.js) — Phase 2 migrates
├── events/              # unchanged (.js) — Phase 2 migrates
├── extractors/          # unchanged (.js) — Phase 2 migrates
├── handlers/            # unchanged (.js) — Phase 2 migrates
├── utils/               # unchanged (.js) — Phase 2 migrates
└── index.js             # MODIFIED — add davey guard; NOT yet .ts
tsconfig.json            # NEW
eslint.config.js         # NEW (flat config)
.prettierrc              # NEW
dist/                    # generated by tsc (gitignored)
```

### Pattern 1: tsconfig.json for NodeNext ESM with allowJs

**What:** NodeNext module system requires `.js` extensions in all relative imports in `.ts` files. `allowJs: true` with `checkJs: false` lets the compiler process the mixed codebase without errors on existing `.js` files.

**When to use:** All Node.js TypeScript projects targeting Node 18+ with ESM.

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Note on sourceMap / declaration:** `sourceMap: true` enables stack traces pointing to `.ts` source lines. `declaration: true` + `declarationMap: true` is recommended for future-proofing if other tooling (e.g. the setup wizard in Phase 3) imports from `dist/`. These are discretionary.

### Pattern 2: ESLint 9 Flat Config with typescript-eslint

**What:** Single `eslint.config.js` file (not `.eslintrc`). The `typescript-eslint` unified package provides both parser and rules.

```javascript
// eslint.config.js
// Source: https://typescript-eslint.io/getting-started/
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // Phase 1: lint .ts files only
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Ignore JS files and dist during Phase 1
    ignores: ['src/**/*.js', 'dist/**/*', 'node_modules/**/*'],
  },
)
```

**Note:** `import.meta.dirname` requires Node 20.11+. Node 18 alternative: `import { dirname } from 'path'; import { fileURLToPath } from 'url'; const __dirname = dirname(fileURLToPath(import.meta.url));`. Since `engines: >=18.0.0`, use the Node 18-compatible form.

### Pattern 3: Prettier .prettierrc

```json
{
  "singleQuote": true,
  "semi": false,
  "printWidth": 100,
  "trailingComma": "all",
  "bracketSpacing": true
}
```

`trailingComma: "all"` and `bracketSpacing: true` are discretionary but are current Prettier 3 defaults and match modern TypeScript style.

### Pattern 4: Shared Type Interfaces in src/types/index.ts

**What:** Single file exports all shared contracts. Phase 2 imports from here using `import type { CommandModule } from '../types/index.js'`.

```typescript
// src/types/index.ts
// Source: derived from reading existing command/event export shapes
import type { SlashCommandBuilder, ChatInputCommandInteraction, TextBasedChannel, User, Collection } from 'discord.js'
import type { Client } from 'discord.js'

export interface CommandModule {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface EventModule {
  name: string
  once?: boolean
  execute: (...args: unknown[]) => Promise<void> | void
}

export interface QueueMetadata {
  channel: TextBasedChannel
  requestedBy: User
}

// Module augmentation: adds client.commands to discord.js Client
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>
  }
}
```

**Why module augmentation over subclassing:** The existing codebase uses `interaction.client.commands` in multiple places. Module augmentation means those call sites get the correct type automatically without changing any existing code in Phase 1.

**Why `Omit<SlashCommandBuilder, ...>`:** Several slash command builders use `.setDefaultMemberPermissions()` which returns a type incompatible with raw `SlashCommandBuilder`. The `Omit` union is the discord.js-recommended pattern.

### Pattern 5: @snazzah/davey Startup Guard

**What:** Run before `client.login()`. Detect whether the package is actually installed by attempting a dynamic import. If missing, print a clear error and exit.

```javascript
// Add to src/index.js before client.login(), after dotenv.config()
// Source: Node.js ESM dynamic import pattern
async function checkDavey() {
  try {
    await import('@snazzah/davey')
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.error(
        '[Startup Error] @snazzah/davey is required for Discord voice encryption (DAVE protocol).\n' +
        'Install it with: npm install @snazzah/davey\n' +
        'Without it, voice connections will silently fail at the Identifying state.'
      )
      process.exit(1)
    }
    throw err  // re-throw unexpected errors
  }
}
await checkDavey()
```

**Why dynamic import over createRequire:** davey is a native NAPI-RS module distributed as an ES module. Dynamic `import()` is the correct ESM-native check. `createRequire` works for CJS modules but is a mismatch for native `.node` binaries that use NAPI-RS packaging.

**Why before `client.login()`:** The DAVE protocol requirement manifests silently during voice channel joins, not at startup. The guard surfaces the problem immediately rather than letting the user join a voice channel only to watch it fail.

### Anti-Patterns to Avoid

- **`moduleResolution: "node"` or `"node16"` instead of `"NodeNext"`:** `node16` is a historical alias; `NodeNext` is the forward-looking stable form. The two behave identically today but `NodeNext` will track future changes. User locked `NodeNext`.
- **`.ts` extensions in import paths:** With NodeNext, TypeScript requires `.js` extensions even when importing `.ts` files. The `.js` extension is what Node sees in `dist/`; TypeScript resolves the `.ts` source automatically. Writing `.ts` in imports causes runtime errors.
- **`tsconfig.json` with `"module": "CommonJS"` and `"type": "module"` in package.json:** These contradict each other. The package uses `"type": "module"`, so `module: "NodeNext"` is mandatory.
- **Running ESLint with `parserOptions.project` pointing to a non-existent tsconfig:** ESLint will throw `Parsing error: Could not find tsconfig.json`. Always create tsconfig first, or use `projectService: true` (typescript-eslint v8 feature that auto-discovers tsconfig).
- **`eslint-plugin-prettier` as the integration strategy:** The current recommendation is to run Prettier and ESLint separately (two scripts), not to run Prettier as an ESLint rule. Only `eslint-config-prettier` (which disables conflicting rules) is needed, not `eslint-plugin-prettier`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript watch mode | `nodemon + ts-node` combo | `tsx watch` | tsx handles NodeNext ESM without extra config; already installed |
| Detecting missing native module | String-matching `node_modules/` directory | dynamic `import()` + err.code check | Native NAPI-RS modules may exist as directory but fail to load; import catches load errors |
| ESLint + Prettier integration | Custom ESLint rule to run Prettier | `eslint-config-prettier` (disables conflicts) + separate `prettier` script | Prevents false lint errors on Prettier-formatted code |
| Type-checking in watch mode | Custom tsc wrapper | `tsc --noEmit --watch` or just use tsx (no typecheck at runtime) | TSC watch mode for typechecking is separate from tsx dev server |

---

## Common Pitfalls

### Pitfall 1: `.js` extensions in TypeScript imports are mandatory under NodeNext

**What goes wrong:** Developer writes `import { foo } from './utils/bar'` without extension. TypeScript compiles but `node dist/index.js` throws `ERR_MODULE_NOT_FOUND`.
**Why it happens:** NodeNext resolution requires explicit extensions. TypeScript allows the `.js` extension at author time (resolves to `.ts`), but omitting it entirely fails at runtime.
**How to avoid:** Always write `import { foo } from './utils/bar.js'` in `.ts` files. The ESLint `import/extensions` rule can enforce this, but that requires `eslint-plugin-import` (not in scope for Phase 1). Train by convention.
**Warning signs:** `ERR_MODULE_NOT_FOUND` errors when running `node dist/` even though compilation succeeded.

### Pitfall 2: `discord-player` caret version drift

**What goes wrong:** `npm install` upgrades `discord-player` from 7.2.0 to 7.3.x. The `willPlayTrack` event signature changes; the 4-arg resolver callback is gone or renamed. Playback hangs forever.
**Why it happens:** `^7.1.0` in the original package.json allows any 7.x version. willPlayTrack resolver behavior is version-specific.
**How to avoid:** TSF-06 pins it: change `"discord-player": "^7.1.0"` to `"discord-player": "7.2.0"` (exact, no caret). Also pin `@discord-player/extractor` to `7.2.0` for consistency — it is the same version family.
**Warning signs:** `npm install` output showing `discord-player` being upgraded; playback hanging silently after an `npm install`.

### Pitfall 3: `@snazzah/davey` being pruned by npm

**What goes wrong:** Running `npm ci` or `npm install --omit=optional` removes davey because it is a native optional package.
**Why it happens:** npm may treat NAPI-RS packages as optional if they lack a `os`/`cpu` peer in package.json.
**How to avoid:** The startup guard (TSF-07) catches this immediately at process start. Document in README that davey is required (Phase 6). For now the guard is sufficient.
**Warning signs:** Startup error from the guard we write in TSF-07.

### Pitfall 4: Module augmentation for `Client.commands` not being picked up

**What goes wrong:** The `declare module 'discord.js'` block in `src/types/index.ts` has no effect because the file is never imported.
**Why it happens:** TypeScript only applies module augmentation from files that are included in the compilation and either imported or referenced globally. A file that is in `include` but never imported will be included; however, if the augmentation is in a `.d.ts` file, it must be in `typeRoots` or referenced.
**How to avoid:** Put the augmentation in `src/types/index.ts` (a `.ts` source file, not `.d.ts`). As long as `src/**/*` is in `include`, TypeScript processes it. Phase 2 will import from `src/types/index.js` explicitly, which also ensures the augmentation is loaded at runtime.
**Warning signs:** TypeScript error `Property 'commands' does not exist on type 'Client<boolean>'` even after adding the declaration.

### Pitfall 5: ESLint `projectService` requires a valid tsconfig

**What goes wrong:** `eslint.config.js` uses `projectService: true` but tsconfig.json does not exist yet. ESLint fails with a cryptic parse error.
**Why it happens:** `projectService` mode has typescript-eslint auto-discover tsconfig.json. If it is absent, the plugin throws.
**How to avoid:** Always create `tsconfig.json` before `eslint.config.js`. The Wave order in the plan should be: tsconfig first, then eslint config.

---

## Code Examples

### tsconfig.json (complete, verified pattern)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### eslint.config.js (ESLint 9 flat config)

```javascript
// Source: https://typescript-eslint.io/getting-started/
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['src/**/*.js', 'dist/**/*', 'node_modules/**/*'],
  },
)
```

### .prettierrc

```json
{
  "singleQuote": true,
  "semi": false,
  "printWidth": 100,
  "trailingComma": "all",
  "bracketSpacing": true
}
```

### src/types/index.ts (complete shared type layer)

```typescript
import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextBasedChannel,
  User,
  Collection,
} from 'discord.js'

export interface CommandModule {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface EventModule {
  name: string
  once?: boolean
  execute: (...args: unknown[]) => Promise<void> | void
}

export interface QueueMetadata {
  channel: TextBasedChannel
  requestedBy: User
}

// Augment discord.js Client to include our commands Collection
// This affects all uses of Client in the codebase without subclassing
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>
  }
}
```

### package.json scripts update

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write src/**/*.ts",
    "check": "node check-system.js",
    "clear-commands": "node clear-commands.js"
  }
}
```

### package.json version pin (TSF-06)

Change in `dependencies`:
```json
"discord-player": "7.2.0",
"@discord-player/extractor": "7.2.0"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` separately | `typescript-eslint` unified package | v8 (2024) | One install, one import, `tseslint.config()` wrapper function |
| `.eslintrc.json` (legacy config) | `eslint.config.js` (flat config) | ESLint 9 (2024) | No more `extends` array in legacy format; flat config uses spread syntax |
| `ts-node` for TypeScript execution | `tsx` | ~2023 | tsx uses esbuild, handles NodeNext ESM natively, no extra config |
| `nodemon + ts-node` for watch | `tsx watch` | ~2023 | Single dependency, same speed, built-in watch |

**Deprecated/outdated:**
- `.eslintrc.*` files: Legacy format still supported in ESLint 9 but the user locked flat config — do not use.
- `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` as separate packages: Still work but the unified `typescript-eslint` package is the current recommended approach.
- `ts-node`: Works but slower and has complicated ESM setup compared to tsx.

---

## Open Questions

1. **`execute` signature for EventModule**
   - What we know: Events like `clientReady` receive `(client)`, `interactionCreate` receives `(interaction)`. These are different shapes.
   - What's unclear: Can a single `execute: (...args: unknown[]) => void` satisfy both while still being useful to Phase 2 migration?
   - Recommendation: Use `(...args: unknown[])` in Phase 1. Phase 2 will tighten each event file's local signature with the correct discord.js event map type. The loose typing is intentional for Phase 1 scope.

2. **`eslint-config-prettier` necessity**
   - What we know: `eslint-config-prettier` disables ESLint rules that conflict with Prettier output (e.g. `quotes`, `semi`). Without it, ESLint and Prettier will fight over formatting.
   - What's unclear: Whether `typescript-eslint/recommended` enables any formatting rules.
   - Recommendation: Include `eslint-config-prettier` — it is lightweight and prevents future surprises when more rules are added.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — this phase is pure configuration |
| Config file | N/A |
| Quick run command | `npm run typecheck` (tsc --noEmit) |
| Full suite command | `npm run build && npm run lint` |

**Note:** Phase 1 has no unit-testable logic. Validation is compiler + linter driven. The "test" for each requirement is a deterministic CLI command.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TSF-01 | `tsc` exits 0 with zero errors | smoke | `npm run build` | ❌ Wave 0 (tsconfig.json) |
| TSF-02 | Types importable; no TS errors in index.ts | smoke | `npm run typecheck` | ❌ Wave 0 (src/types/index.ts) |
| TSF-03 | `tsx watch` starts bot; `node dist/index.js` starts bot | smoke | `npm run build && echo OK` | ❌ Wave 0 (package.json scripts) |
| TSF-04 | ESLint exits 0 on `.ts` files | smoke | `npm run lint` | ❌ Wave 0 (eslint.config.js) |
| TSF-05 | Prettier check exits 0 | smoke | `npx prettier --check src/**/*.ts` | ❌ Wave 0 (.prettierrc) |
| TSF-06 | package.json exact version for discord-player | smoke | `node -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); if(p.dependencies['discord-player'] !== '7.2.0') process.exit(1)"` | ❌ Wave 0 |
| TSF-07 | Startup throws if davey missing | smoke | manual: remove davey, run `node src/index.js`, check exit code + message | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build && npm run lint && npx prettier --check "src/**/*.ts"` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tsconfig.json` — required before any TypeScript compilation (TSF-01)
- [ ] `src/types/index.ts` — shared type layer (TSF-02)
- [ ] `eslint.config.js` — lint configuration (TSF-04)
- [ ] `.prettierrc` — formatting rules (TSF-05)
- [ ] `package.json` script updates — dev/build/typecheck/lint/format (TSF-03)
- [ ] `package.json` version pin — discord-player exact version (TSF-06)
- [ ] Davey guard in `src/index.js` — startup check (TSF-07)

Framework install: `npm install --save-dev typescript eslint @eslint/js typescript-eslint prettier eslint-config-prettier`

---

## Sources

### Primary (HIGH confidence)
- typescript-eslint.io/getting-started — exact install command, eslint.config.mjs pattern, v8.x current version
- tsx.is/watch-mode — exact `tsx watch ./file.ts` syntax and flags
- Direct inspection: `node_modules/discord.js/typings/index.d.ts` — Client class shape, Collection import
- Direct inspection: `node_modules/discord-player/dist/index.d.ts` — GuildQueue<Meta> generic, BaseExtractor
- Direct inspection: `node_modules/@snazzah/davey/index.d.ts` — NAPI-RS module structure
- Direct inspection: `src/commands/play.js`, `src/events/ready.js`, `src/events/interactionCreate.js` — actual export shapes CommandModule/EventModule must match
- Direct inspection: `package.json` — current scripts, dependency versions
- Direct inspection: `node_modules/tsx/` version — 4.21.0 already installed
- TypeScript compiler version: 5.9.3 (from `tsc --version`)

### Secondary (MEDIUM confidence)
- typescriptlang.org/tsconfig/moduleResolution — NodeNext requires `.js` extensions in relative imports
- prettier.io/docs/options — `singleQuote`, `semi`, `printWidth` option names confirmed

### Tertiary (LOW confidence)
- None — all critical claims verified against installed packages or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages present in node_modules or verified via official docs
- Architecture: HIGH — tsconfig/eslint patterns verified against typescript-eslint.io and direct source inspection
- Pitfalls: HIGH — NodeNext extension requirement and discord-player version pinning verified; davey NAPI-RS structure verified from node_modules
- Type interfaces: HIGH — derived directly from reading source files, not from assumptions

**Research date:** 2026-03-29
**Valid until:** 2026-06-29 (TypeScript config patterns are stable; ESLint flat config stabilized in ESLint 9)
