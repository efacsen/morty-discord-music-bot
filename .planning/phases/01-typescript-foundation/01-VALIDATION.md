---
phase: 01
slug: typescript-foundation
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
updated: 2026-03-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — this phase is pure configuration; validation is compiler/linter driven |
| **Config file** | `tsconfig.json` (TypeScript), `eslint.config.js` (ESLint) |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build && npm run lint && npx prettier --check "src/**/*.ts"` plus the `npm run dev` watch smoke check from `01-03-PLAN.md` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build && npm run lint`
- **After wave 3 / gap closure:** Run the `npm run dev` smoke check that proves the watch process stays alive until killed
- **Before `/gsd:verify-work`:** Full suite plus the watch-mode smoke check must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TSF-03, TSF-06 | smoke | `node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); const checks=[p.dependencies['discord-player']==='7.2.0', p.dependencies['@discord-player/extractor']==='7.2.0', p.scripts.build==='tsc', p.scripts.typecheck==='tsc --noEmit', p.scripts.dev?.includes('tsx watch'), p.devDependencies?.typescript, p.devDependencies?.eslint]; if(!checks.every(Boolean)) process.exit(1)"` | ✅ | ready |
| 01-01-02 | 01 | 1 | TSF-01, TSF-02 | smoke | `npm run build && npm run typecheck && node -e "const fs=require('fs'); const c=fs.readFileSync('src/types/index.ts','utf8'); const checks=[c.includes('CommandModule'), c.includes('EventModule'), c.includes('QueueMetadata'), c.includes('declare module')]; if(!checks.every(Boolean)) process.exit(1)"` | ✅ | ready |
| 01-02-01 | 02 | 2 | TSF-04, TSF-05 | smoke | `npm run lint && npx prettier --check "src/**/*.ts"` | ✅ | ready |
| 01-02-02 | 02 | 2 | TSF-07 | smoke | `grep -q "checkDavey" src/index.js && grep -q "@snazzah/davey" src/index.js && grep -q "ERR_MODULE_NOT_FOUND" src/index.js` | ✅ | ready |
| 01-03-01 | 03 | 3 | TSF-03 | smoke | `npm ls tsx --depth=0 >/dev/null && node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); if(p.scripts.dev!=='tsx watch src/index.ts') process.exit(1); if(p.scripts.build!=='tsc') process.exit(1); if(p.scripts.start!=='node dist/index.js') process.exit(1); if(!p.devDependencies?.tsx) process.exit(1)"` | ✅ | ready |
| 01-03-02 | 03 | 3 | TSF-03 | smoke | `npm run build >/dev/null && npm run lint >/dev/null && rm -f /tmp/morty-phase01-dev.log && npm run dev >/tmp/morty-phase01-dev.log 2>&1 & PID=$!; sleep 5; kill -0 "$PID"; STATUS=$?; kill "$PID" >/dev/null 2>&1 || true; wait "$PID" >/dev/null 2>&1 || true; node -e "const fs=require('fs'); const shim=fs.readFileSync('src/index.ts','utf8'); const tsconfig=fs.readFileSync('tsconfig.json','utf8'); if(!shim.includes(\"import './index.js'\")) process.exit(1); if(!tsconfig.includes('src/index.ts')) process.exit(1)"; exit $STATUS` | ✅ | ready |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave Layout

- **Wave 1:** `01-01` establishes compiler config, shared types, package scripts, and version pinning.
- **Wave 2:** `01-02` layers lint/format config and the Davey guard on top of the Wave 1 compiler contract.
- **Wave 3:** `01-03` closes the TSF-03 gap by making `npm run dev` verifiably runnable with a live `tsx` watch process.

## Requirement Coverage

| Requirement | Covered By | Validation Contract |
|-------------|------------|---------------------|
| TSF-01 | `01-01-02` | `npm run build && npm run typecheck` |
| TSF-02 | `01-01-02` | `src/types/index.ts` export and module augmentation checks |
| TSF-03 | `01-01-01`, `01-03-01`, `01-03-02` | package script contract, explicit `tsx` install, and live `npm run dev` smoke check |
| TSF-04 | `01-02-01` | `npm run lint` |
| TSF-05 | `01-02-01` | `npx prettier --check "src/**/*.ts"` |
| TSF-06 | `01-01-01` | exact package pin check |
| TSF-07 | `01-02-02` | Davey guard grep + manual destructive check below |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Startup throws if davey missing | TSF-07 | Requires uninstalling a package to test; destructive to node_modules | 1. `mv node_modules/@snazzah/davey node_modules/@snazzah/davey.bak` 2. Run `node src/index.js` 3. Verify exit code 1 + descriptive error message 4. `mv node_modules/@snazzah/davey.bak node_modules/@snazzah/davey` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verification commands
- [x] Sampling continuity maintained across all 3 waves
- [x] TSF-01 through TSF-07 map to the current `01-01` / `01-02` / `01-03` plan set
- [x] Watch-mode validation is automated in `01-03-02`
- [x] Feedback latency stays under ~10 seconds for the full contract
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
