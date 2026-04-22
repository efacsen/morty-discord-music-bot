# Windows Local Docker Build Design

## Context

The repository already contains a multi-stage `Dockerfile` and a `docker-compose.yml`, but the current Docker flow is not complete for a clean Windows checkout:

- The bot service is configured to pull an image instead of building locally.
- The Docker setup depends on helper scripts that exist only as local untracked files.
- The desired deployment model is to keep `.env` external rather than baking secrets into the image.

The target workflow is a Windows machine running Docker Desktop in Linux container mode, with the repository checked out locally and started with Docker Compose.

## Goal

Make the repository runnable on Windows with:

```sh
docker compose up --build -d
```

while keeping `.env` external and preserving the existing `yt-dlp` sidecar pattern.

## Non-Goals

- Bundling `.env` into the image
- Publishing to GHCR or any other registry
- Changing the application's Discord or playback logic
- Reworking the updater sidecar into a different architecture

## Chosen Approach

Use local Docker builds from the checked-out source tree.

### Why this approach

- It removes registry dependency for the Windows runtime host.
- It keeps secrets outside the image by continuing to use `env_file: .env`.
- It makes rebuilding after source changes straightforward.

## Required Repository Changes

### 1. Compose should build the bot locally

Update `docker-compose.yml` so the `bot` service uses `build:` with the repository root and the existing `Dockerfile`.

The service will keep an `image:` name, but it will be a local-friendly tag rather than a GHCR-only default so Compose does not attempt to pull from a remote registry when no image is present.

### 2. Commit the helper scripts the Docker flow already depends on

Add these files to version control:

- `entrypoint.sh`
- `updater/update-ytdlp.sh`

Without them, the repository cannot reliably build or run from a clean clone even though the Docker files reference them.

### 3. Keep `.env` external

Do not copy `.env` into the image and do not remove it from `.dockerignore`.

The container should continue receiving runtime configuration from:

```yaml
env_file:
  - .env
```

This preserves the current security boundary: whoever has the image does not automatically receive the secrets.

### 4. Preserve Windows-safe shell script behavior

The repository already includes LF line-ending rules for shell scripts in `.gitattributes`.

These rules will remain in place so a Windows checkout does not introduce CRLF into container shell scripts and trigger `/bin/sh^M` startup failures.

### 5. Document the Windows run path

The Windows Docker doc will describe one exact workflow:

1. Clone the repository
2. Create `.env`
3. Optionally place cookies at `cookies/cookies.txt`
4. Run `docker compose up --build -d`
5. Inspect logs with `docker compose logs -f bot`

## Expected Runtime Model

### Bot service

- Built locally from the repository `Dockerfile`
- Reads environment variables from external `.env`
- Uses the shared `discord-player` cache volume
- Reads `yt-dlp` from the shared updater volume through `YTDLP_PATH=/ytdlp/yt-dlp`

### Updater service

- Runs a lightweight Alpine container
- Downloads the correct Linux `yt-dlp` binary for the container architecture
- Stores the binary in a named volume mounted read-only into the bot service

## Verification Plan

The implementation must be verified with fresh commands after the changes are made:

1. `npm run build`
2. `docker build -t morty-discord-music-bot:test .`
3. `docker compose config`

Optional runtime verification, if a valid `.env` is available for testing:

4. `docker compose up --build -d`
5. `docker compose ps`
6. `docker compose logs --no-color --tail=100 bot`

## Risks and Mitigations

### Missing tracked helper files

Risk:
Clean clones fail because referenced scripts are absent.

Mitigation:
Commit the helper scripts referenced by the Docker configuration.

### Windows line endings

Risk:
Shell scripts checked out with CRLF fail inside Linux containers.

Mitigation:
Retain LF enforcement in `.gitattributes` for shell scripts.

### Secret handling

Risk:
Accidentally baking `.env` into the image would weaken secret isolation.

Mitigation:
Leave `.env` excluded from the Docker build context and continue using `env_file`.

## Implementation Scope

The implementation is limited to Docker/runtime scaffolding and docs:

- `docker-compose.yml`
- `entrypoint.sh`
- `updater/update-ytdlp.sh`
- Windows Docker documentation

No application source changes are required unless verification reveals a container-specific startup issue.
