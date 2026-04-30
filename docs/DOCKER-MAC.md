# Running the Discord Music Bot on Mac (Docker Desktop)

Self-contained runbook for **macOS 12 Monterey or later** using Docker Desktop.  
Works on both **Apple Silicon (M1/M2/M3)** and **Intel** Macs — Docker pulls the right image automatically.

> **This guide uses Docker Compose only.** For the native Node.js setup see [SETUP-MAC.md](SETUP-MAC.md).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| macOS 12 Monterey or later | Earlier versions are not supported by Docker Desktop |
| Docker Desktop ≥ 4.x | Free for personal use — includes the `docker compose` v2 plugin |
| A Discord bot application | Token, Client ID, and (optionally) a Guild ID |

---

## Step 1 — Install Docker Desktop

1. Download Docker Desktop from the official site:  
   **Apple Silicon:** choose the *Mac with Apple Chip* installer  
   **Intel:** choose the *Mac with Intel Chip* installer
2. Open the `.dmg` and drag Docker to Applications.
3. Launch Docker Desktop from Launchpad or Spotlight.
4. Wait for the whale icon in the menu bar to stop animating — Docker is ready when it shows **"Docker Desktop is running"**.
5. Verify from Terminal:

```bash
docker --version
docker compose version
```

Both commands should return version strings. You are looking for `docker compose` (v2, no hyphen).

---

## Step 2 — Clone or download the repository

```bash
git clone https://github.com/yourorg/discord-music-bot.git
cd discord-music-bot
```

If you downloaded a ZIP, extract it and `cd` into the folder instead.

---

## Step 3 — Configure your environment

**Recommended:** use the interactive terminal onboarding. It creates `.env` for you and asks the questions in plain language.

```bash
./onboard.sh
```

If you prefer to edit the file yourself instead:

```bash
cp .env.example .env
open -e .env        # opens in TextEdit; use any editor you like
```

If you want a simpler walkthrough before editing, read [ENV-ONBOARDING.md](ENV-ONBOARDING.md).

Minimum required values:

```dotenv
# Required — from https://discord.com/developers/applications
DISCORD_CLIENT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Recommended — makes slash commands appear instantly in your server
# Right-click your server in Discord (Developer Mode on) → Copy Server ID
DISCORD_GUILD_ID=your_guild_id_here

# Docker image to pull
# Format: owner/discord-music-bot  (no ghcr.io/ prefix — compose adds it)
IMAGE_NAME=yourorg/discord-music-bot
```

> **How to get your bot credentials:**  
> Go to [discord.com/developers/applications](https://discord.com/developers/applications) → select your application → **Bot** page for the token, **General Information** for the Client ID.

---

## Step 4 — Pull the latest image

```bash
docker compose pull
```

Docker selects the right architecture automatically:  
- Apple Silicon → `linux/arm64`  
- Intel → `linux/amd64`

---

## Step 5 — Start the bot

```bash
docker compose up -d
```

What happens under the hood:

1. The **`updater`** service starts first and downloads the latest `yt-dlp` binary into a shared volume.
2. Once `updater` passes its health check (`test -f /ytdlp/yt-dlp`), the **`bot`** service starts.
3. The bot connects to Discord and registers slash commands.

**Watch live logs:**

```bash
docker compose logs -f bot
```

You should see the bot come online in your Discord server within ~30 seconds.

---

## Step 6 — Verify the bot is running

```bash
docker compose ps
```

Both `discord-music-bot-updater` and `discord-music-bot` should show **`healthy`** or **`running`**.

Go to your Discord server and try a slash command like `/play` to confirm everything works.

---

## Step 7 — Manually update yt-dlp

YouTube changes its API frequently. To pull the latest yt-dlp without restarting the bot:

```bash
docker compose restart updater
```

The `updater` service re-downloads the latest binary and places it in the shared volume. The `bot` service continues running and picks up the new binary on its next request — no downtime required.

---

## Optional — YouTube cookies (age-restricted / private videos)

The bot works without cookies for most public videos. If you need cookies for age-restricted or private content, see [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for how to export them from your browser, then:

1. Create the cookies directory if it does not exist:

   ```bash
   mkdir -p cookies
   ```

2. Place your exported `cookies.txt` inside it:

   ```bash
   mv ~/Downloads/cookies.txt cookies/cookies.txt
   ```

3. Add this line to your `.env`:

   ```dotenv
   YTDLP_COOKIES_FILE=/cookies/cookies.txt
   ```

   The `cookies/` directory is bind-mounted into the container at `/cookies` — that path is always correct inside Docker regardless of where the repo lives on your Mac.

4. Restart the bot to apply the change:

   ```bash
   docker compose restart bot
   ```

> **Warning:** Stale cookies from a logged-in account can trigger stricter YouTube bot-detection and cause HTTP 403 errors. If playback breaks after adding cookies, try removing `YTDLP_COOKIES_FILE` from `.env` and restarting. See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for troubleshooting.

---

## Stopping and restarting

```bash
# Stop all services (containers removed, volumes preserved)
docker compose down

# Stop and remove volumes (wipes yt-dlp binary and player cache)
docker compose down -v

# Restart only the bot
docker compose restart bot
```

---

## Upgrading the image

```bash
docker compose pull
docker compose up -d
```

Compose replaces running containers with the new image while preserving volumes.

---

## Troubleshooting

### Bot starts but slash commands don't appear
- If `DISCORD_GUILD_ID` is not set, commands register globally and take up to **1 hour** to appear.
- Add `DISCORD_GUILD_ID` to `.env` and restart: `docker compose restart bot`.

### `docker compose` not found
- Make sure Docker Desktop is running (whale icon in menu bar).
- Confirm you are using v2 syntax — `docker compose` (space, not hyphen).

### `updater` stays unhealthy
- Check logs: `docker compose logs updater`
- The `updater` has up to 60 s + 30 retries to download yt-dlp. On a slow connection this can take a few minutes.

### Port conflicts
- The bot uses no inbound ports. If Docker reports a port conflict, it is from a different service on your machine unrelated to this bot.

### "HTTP Error 403" when playing YouTube videos
- This almost always means stale cookies. Remove `YTDLP_COOKIES_FILE` from `.env`, restart the bot, and retest without cookies first.
- See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for the full cookie troubleshooting flow.

### Apple Silicon — wrong architecture pulled
- Docker Desktop on Apple Silicon defaults to `linux/arm64`. If you see `exec format error` in logs, verify `DOCKER_DEFAULT_PLATFORM` is not set to `linux/amd64` in your shell environment.

---

## Quick-reference cheat sheet

| Task | Command |
|---|---|
| Start everything | `docker compose up -d` |
| View bot logs | `docker compose logs -f bot` |
| Stop everything | `docker compose down` |
| Pull latest image | `docker compose pull` |
| Update yt-dlp | `docker compose restart updater` |
| Restart bot only | `docker compose restart bot` |
| Check service health | `docker compose ps` |
