# Windows Local Docker Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repository build and run on a Windows machine with `docker compose up --build -d` while keeping `.env` external.

**Architecture:** Convert the shared Compose setup from pull-first to local-build-first, track the shell helpers already referenced by Docker, and update Docker-facing docs to match the new workflow. This task is mostly Docker/config/docs work, so verification uses fresh `docker` and `docker compose` commands rather than unit-test-first application tests.

**Tech Stack:** Docker Compose v2, Dockerfile multi-stage Node 20 Alpine build, POSIX shell scripts, Markdown docs

---

## File Map

- `docker-compose.yml`
  Purpose: Build the bot image locally, keep runtime env external, preserve named volumes and the `yt-dlp` updater sidecar.
- `entrypoint.sh`
  Purpose: Minimal container entrypoint that starts `node dist/index.js`.
- `updater/update-ytdlp.sh`
  Purpose: Sidecar script that seeds and refreshes the Linux `yt-dlp` binary in the shared volume.
- `.env.example`
  Purpose: External runtime env template; must stop telling Docker users to configure a pull-only image variable.
- `docs/DOCKER-WINDOWS.md`
  Purpose: Windows runbook for Docker Desktop using the local-build flow.
- `README.md`
  Purpose: Top-level Docker quick-start command should match the local-build workflow.

### Task 1: Track Docker Helper Scripts

**Files:**
- Create: `entrypoint.sh`
- Create: `updater/update-ytdlp.sh`
- Verify: `.gitattributes`

- [ ] **Step 1: Add `entrypoint.sh` with the existing minimal startup logic**

```sh
#!/bin/sh
set -e
exec node dist/index.js
```

- [ ] **Step 2: Add `updater/update-ytdlp.sh` with the current architecture-aware updater logic**

```sh
#!/bin/sh
set -e

INSTALL_DIR="/ytdlp"
BINARY="${INSTALL_DIR}/yt-dlp"
BASE_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download"

ARCH="$(uname -m)"
if [ "${ARCH}" = "aarch64" ]; then
  RELEASE_FILE="yt-dlp_linux_aarch64"
else
  RELEASE_FILE="yt-dlp"
fi

mkdir -p "${INSTALL_DIR}"

if [ ! -f "${BINARY}" ]; then
  echo "[updater] Seeding yt-dlp (${RELEASE_FILE}) to ${BINARY}..."
  wget -q -O "${BINARY}.new" "${BASE_URL}/${RELEASE_FILE}"
  chmod +x "${BINARY}.new"
  mv "${BINARY}.new" "${BINARY}"
  echo "[updater] Seed complete: $(${BINARY} --version)"
else
  echo "[updater] Binary already present at ${BINARY}, skipping initial seed."
fi

while true; do
  sleep 86400
  echo "[updater] Updating yt-dlp (${RELEASE_FILE})..."
  if wget -q -O "${BINARY}.new" "${BASE_URL}/${RELEASE_FILE}"; then
    chmod +x "${BINARY}.new"
    mv "${BINARY}.new" "${BINARY}"
    echo "[updater] Update complete: $(${BINARY} --version)"
  else
    echo "[updater] WARNING: Download failed, keeping existing binary."
    rm -f "${BINARY}.new"
  fi
done
```

- [ ] **Step 3: Verify line-ending protection still covers the tracked shell files**

Run: `git check-attr eol -- entrypoint.sh updater/update-ytdlp.sh`
Expected: output shows `eol: lf` (directly or via the matching `*.sh text eol=lf` rule)

- [ ] **Step 4: Commit the tracked helper scripts**

```bash
git add entrypoint.sh updater/update-ytdlp.sh
git commit -m "chore: track Docker helper scripts"
```

### Task 2: Switch Compose to Local Build and Keep Env External

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Replace the bot service image-only setup with a local build plus a local tag**

Use this `bot` service shape in `docker-compose.yml`:

```yaml
  bot:
    build:
      context: .
      dockerfile: Dockerfile
    image: discord-music-bot:local
    container_name: discord-music-bot
    restart: unless-stopped
    depends_on:
      updater:
        condition: service_healthy
    env_file:
      - .env
    environment:
      - YTDLP_PATH=/ytdlp/yt-dlp
    healthcheck:
      test: ["CMD-SHELL", "kill -0 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    volumes:
      - discord-player-cache:/app/.discord-player
      - ytdlp-bin:/ytdlp:ro
      - ./cookies:/cookies:ro
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

- [ ] **Step 2: Remove the pull-only image variable guidance from `.env.example`**

Replace the current Docker image block with a simpler note that Compose builds locally and no image env variable is required:

```dotenv
# Docker Compose loads this file at runtime.
# No Docker image variable is required for the local-build workflow.
```

Leave the existing Discord and optional cookie settings intact.

- [ ] **Step 3: Render the Compose config to verify the new shape**

Run: `docker compose config`
Expected: exit code `0`, `bot` includes a `build` section, `env_file` still points to `.env`, and there are no schema errors

- [ ] **Step 4: Commit the local-build Compose change**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: build Docker image locally by default"
```

### Task 3: Update Docker-Facing Docs to Match the New Workflow

**Files:**
- Modify: `docs/DOCKER-WINDOWS.md`
- Modify: `README.md`

- [ ] **Step 1: Rewrite the Windows Docker guide around the local-build path**

Apply these content changes in `docs/DOCKER-WINDOWS.md`:

```md
- Remove the `IMAGE_NAME` example from the `.env` section.
- Remove the `docker compose pull` step entirely.
- Change the start command to `docker compose up --build -d`.
- Keep `docker compose logs -f bot` and `docker compose ps` as the verification commands.
- If onboarding scripts are not being committed in this task, use manual `.env` creation (`copy .env.example .env`) instead of recommending `.\onboard.bat`.
```

- [ ] **Step 2: Fix the README Docker quick-start command**

Update the Docker section in `README.md` to:

````md
## Docker

```bash
docker compose up --build -d   # Start
docker compose logs -f bot     # Logs
docker compose down            # Stop
```
````

- [ ] **Step 3: Search targeted docs for pull-only leftovers**

Run: `rg -n "IMAGE_NAME|docker compose pull|docker-compose" README.md .env.example docs/DOCKER-WINDOWS.md`
Expected: no `IMAGE_NAME` references remain in those files, no `docker compose pull` instructions remain, and no legacy `docker-compose` binary is advertised

- [ ] **Step 4: Commit the doc alignment**

```bash
git add docs/DOCKER-WINDOWS.md README.md
git commit -m "docs: update local Docker build workflow"
```

### Task 4: Verify the Repository Builds and the Compose Stack Resolves

**Files:**
- Verify only: `docker-compose.yml`, `Dockerfile`, tracked helper scripts

- [ ] **Step 1: Verify the TypeScript build still works**

Run: `npm run build`
Expected: exit code `0` and `tsc` completes without errors

- [ ] **Step 2: Verify the Docker image builds from the repository root**

Run: `docker build -t morty-discord-music-bot:test .`
Expected: exit code `0`, image export completes, and `entrypoint.sh` is copied successfully during the build

- [ ] **Step 3: Verify Compose configuration remains valid**

Run: `docker compose config`
Expected: exit code `0` and the rendered config includes both `updater` and locally-built `bot` services

- [ ] **Step 4: If a valid local `.env` is available, verify the stack starts**

Run: `docker compose up --build -d`
Expected: exit code `0`, `discord-music-bot-updater` and `discord-music-bot` containers are created, and there are no missing-file or shell startup errors

- [ ] **Step 5: Confirm service state and recent bot logs**

Run: `docker compose ps`
Expected: `discord-music-bot-updater` is `running` or `healthy`; `discord-music-bot` is `running`

Run: `docker compose logs --no-color --tail=100 bot`
Expected: log output reaches normal startup behavior; if Discord auth fails, the failure should be due to runtime credentials rather than missing Docker files or invalid Compose wiring

## Self-Review Checklist

- Spec coverage: Task 1 covers tracked helper scripts, Task 2 covers local-build Compose plus external `.env`, Task 3 covers the Windows runbook and Docker command docs, Task 4 covers verification.
- Placeholder scan: No `TODO`, `TBD`, or vague "handle appropriately" instructions remain.
- Type/config consistency: The plan uses the same local image tag (`discord-music-bot:local`), the same external env source (`.env`), and the same `YTDLP_PATH=/ytdlp/yt-dlp` wiring throughout.
