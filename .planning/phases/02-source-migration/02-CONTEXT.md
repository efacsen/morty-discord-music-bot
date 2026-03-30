# Phase 2: Source Migration - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all JavaScript source files in `src/` to TypeScript with explicit type boundaries. No `.js` files remain in `src/` after this phase. This is a pure conversion — no logic changes, no refactoring, no new features. The legacy `PlayDLExtractor.js` is removed (inactive, not registered).

</domain>

<decisions>
## Implementation Decisions

### Type Strictness
- Annotate function parameters and return types explicitly
- Let TypeScript infer local variable types — no redundant annotations
- Follows community standard: clear contracts at function boundaries, clean internals

### Code Cleanup Scope
- Pure port only — rename `.js` → `.ts`, add type annotations, preserve all existing logic exactly
- No refactoring of repeated patterns (e.g., duplicated error handling stays as-is)
- No consolidation of shared logic — improvements deferred to Phase 4 (Command Audit)
- Rationale: isolates type issues from logic changes, makes debugging straightforward

### `any` Escape Hatches
- Pragmatic type assertions (`as SomeType`) allowed at discord-player library boundaries
- No `any` spreading into application code — assertions contained at the border
- Specific known boundaries:
  - `willPlayTrack` event: type the resolver callback explicitly (`() => void`)
  - `YtDlpExtractor` extending `BaseExtractor`: use assertions where base class types are incomplete
- If discord-player types are missing, write inline assertions rather than `.d.ts` declaration files

### Dynamic Loader Strategy
- Filter for `.ts` files in `readdirSync` calls (`f.endsWith('.ts')`)
- Import using `.js` extensions (NodeNext convention): `import(join(path, file.replace('.ts', '.js')))`
- `tsx` (dev) resolves `.js` → `.ts` automatically; `tsc` (build) compiles `.ts` → `.js` in `dist/`
- One loader implementation works for both dev and production — no runtime environment detection

### Claude's Discretion
- Migration order (which files to convert first — dependency order vs. leaf-first)
- Number and scope of plans (how to batch the 20+ files across plans)
- Specific type choices for discord-player internals where multiple valid types exist
- Whether to flip `allowJs: false` in tsconfig as a final step or leave it for verification

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/index.ts`: Shared interfaces already defined — `CommandModule`, `EventModule`, `QueueMetadata`, `Client` augmentation with `commands` Collection
- Phase 1 tsconfig: `strict: true`, `module: "NodeNext"`, `allowJs: true` (to flip off post-migration)
- ESLint 9 + Prettier configured for `.ts` files — will lint converted files automatically

### Established Patterns
- All 14 commands export `{ data: SlashCommandBuilder, execute(interaction) }` — maps directly to `CommandModule`
- Both events export `{ name, once?, execute }` — maps directly to `EventModule`
- `queue.metadata.channel` and `queue.metadata.requestedBy` used throughout — maps to `QueueMetadata`
- ESM throughout with `.js` extensions in imports (NodeNext-compatible already)
- Dynamic loading via `readdirSync` + `import()` in `src/index.js` for commands and events

### Integration Points
- `src/index.ts` shim (currently `import './index.js'`) — replaced with actual migrated bootstrap
- `tsconfig.json` excludes `src/index.ts` — exclusion removed when shim is replaced
- `tsconfig.json` has `allowJs: true` — flipped to `false` when all JS files are converted
- ESLint scope: currently `.ts` only from Phase 1 — naturally covers newly converted files

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

*Phase: 02-source-migration*
*Context gathered: 2026-03-30*
