# Running the Discord Music Bot on Windows (Docker Desktop)

Self-contained runbook for **Windows 10 version 21H2 or later / Windows 11** using Docker Desktop with the WSL2 backend.

> **This guide uses Docker Compose only.** For the native Node.js setup see [SETUP-WINDOWS.md](SETUP-WINDOWS.md).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Windows 10 21H2 or later, or Windows 11 | WSL2 requires this version as a minimum |
| WSL2 enabled | See Step 1 — Docker Desktop installs it automatically if missing |
| Docker Desktop ≥ 4.x | Free for personal use — includes the `docker compose` v2 plugin |
| A Discord bot application | Token, Client ID, and (optionally) a Guild ID |

> **All `docker compose` commands must be run in PowerShell or Windows Terminal — NOT inside a WSL2 terminal.** Docker Desktop translates Windows paths to WSL2 paths automatically only when commands are issued from the Windows side.

---

## Step 1 — Enable WSL2 and install Docker Desktop

### 1a — Enable WSL2

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

This installs WSL2 and the default Ubuntu distribution. **Reboot when prompted.**

> If WSL2 is already installed, this command is safe to re-run — it will update WSL instead.

### 1b — Install Docker Desktop

1. Download Docker Desktop for Windows from the official site (choose the **AMD64** installer for most machines).
2. Run the installer. When prompted, ensure **"Use WSL 2 instead of Hyper-V"** is selected.
3. Launch Docker Desktop from the Start menu.
4. Wait for the whale icon in the system tray to stop animating — Docker is ready when it shows **"Docker Desktop is running"**.
5. Verify from **PowerShell** or **Windows Terminal**:

```powershell
docker --version
docker compose version
```

Both commands should return version strings. You are looking for `docker compose` (v2, no hyphen).

> **Windows Defender firewall:** Docker Desktop handles the necessary firewall exceptions automatically. The bot initiates all outbound connections — no inbound port rules are required.

---

## Step 2 — Clone or download the repository

Run this in **PowerShell** or **Windows Terminal**:

```powershell
git clone https://github.com/yourorg/discord-music-bot.git
cd discord-music-bot
```

If you downloaded a ZIP, extract it and `cd` into the folder instead.

> **Important:** Clone into a Windows filesystem path (e.g. `C:\Users\YourName\`) rather than inside the WSL2 filesystem (`\\wsl$\...`). Docker Desktop bind mounts work correctly when the project lives on the Windows filesystem.

---

## Step 3 — Configure your environment

```powershell
copy .env.example .env
notepad .env
```

Minimum required values:

```dotenv
# Required — from https://discord.com/developers/applications
DISCORD_CLIENT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Recommended — makes slash commands appear instantly in your server
# Right-click your server in Discord (Developer Mode on) → Copy Server ID
DISCORD_GUILD_ID=your_guild_id_here
```

> **How to get your bot credentials:**  
> Go to [discord.com/developers/applications](https://discord.com/developers/applications) → select your application → **Bot** page for the token, **General Information** for the Client ID.

---

## Step 4 — Build and start the bot

```powershell
docker compose up --build -d
```

Docker Desktop builds the image locally from the repository source tree.

What happens under the hood:

1. The **`updater`** service starts first and downloads the latest `yt-dlp` binary into a shared volume.
2. Once `updater` passes its health check (`test -f /ytdlp/yt-dlp`), the **`bot`** service starts.
3. The bot connects to Discord and registers slash commands.

**Watch live logs:**

```powershell
docker compose logs -f bot
```

You should see the bot come online in your Discord server within ~30 seconds.

---

## Step 5 — Verify the bot is running

```powershell
docker compose ps
```

Both `discord-music-bot-updater` and `discord-music-bot` should show **`healthy`** or **`running`**.

Go to your Discord server and try a slash command like `/play` to confirm everything works.

---

## Step 6 — Manually update yt-dlp

YouTube changes its API frequently. To pull the latest yt-dlp without restarting the bot:

```powershell
docker compose restart updater
```

The `updater` service re-downloads the latest binary and places it in the shared volume. The `bot` service continues running and picks up the new binary on its next request — no downtime required.

---

## Optional — YouTube cookies (age-restricted / private videos)

The bot works without cookies for most public videos. If you need cookies for age-restricted or private content, see [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for how to export them from your browser, then:

1. Create the `cookies` directory inside the repo if it does not exist:

   ```powershell
   mkdir cookies
   ```

2. Place your exported `cookies.txt` inside it:

   ```powershell
   move %USERPROFILE%\Downloads\cookies.txt cookies\cookies.txt
   ```

3. Add this line to your `.env`:

   ```dotenv
   YTDLP_COOKIES_FILE=/cookies/cookies.txt
   ```

   The `cookies/` directory is bind-mounted into the container at `/cookies`. Docker Desktop translates the Windows path via WSL2 automatically — that path is always correct inside the container regardless of where the repo lives on your system.

4. Restart the bot to apply the change:

   ```powershell
   docker compose restart bot
   ```

> **Warning:** Stale cookies from a logged-in account can trigger stricter YouTube bot-detection and cause HTTP 403 errors. If playback breaks after adding cookies, try removing `YTDLP_COOKIES_FILE` from `.env` and restarting. See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for troubleshooting.

---

## Stopping and restarting

```powershell
# Stop all services (containers removed, volumes preserved)
docker compose down

# Stop and remove volumes (wipes yt-dlp binary and player cache)
docker compose down -v

# Restart only the bot
docker compose restart bot
```

---

## Rebuilding after code changes

```powershell
docker compose up --build -d
```

Compose rebuilds the local image and replaces running containers while preserving volumes.

---

## Troubleshooting

### Bot starts but slash commands don't appear
- If `DISCORD_GUILD_ID` is not set, commands register globally and take up to **1 hour** to appear.
- Add `DISCORD_GUILD_ID` to `.env` and restart: `docker compose restart bot`.

### `docker compose` not found
- Make sure Docker Desktop is running (whale icon in the system tray).
- Confirm you are running commands in **PowerShell** or **Windows Terminal**, not inside a WSL2 terminal.
- Confirm you are using v2 syntax — `docker compose` (space, not hyphen).

### `updater` stays unhealthy
- Check logs: `docker compose logs updater`
- The `updater` has up to 60 s + 30 retries to download yt-dlp. On a slow connection this can take a few minutes.

### WSL2 not found or Docker fails to start
- Re-run `wsl --install` in PowerShell as Administrator, then reboot.
- In Docker Desktop settings → **General**, confirm **"Use the WSL 2 based engine"** is enabled.

### Bind mount errors or permission issues
- Ensure the repo is cloned to a Windows filesystem path (e.g. `C:\Users\...`) and **not** inside the WSL2 filesystem (`\\wsl$\...`). Docker Desktop mounts from the WSL2 filesystem can cause permission errors.

### "HTTP Error 403" when playing YouTube videos
- This almost always means stale cookies. Remove `YTDLP_COOKIES_FILE` from `.env`, restart the bot, and retest without cookies first.
- See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for the full cookie troubleshooting flow.

---

## Quick-reference cheat sheet

| Task | Command |
|---|---|
| Start everything | `docker compose up --build -d` |
| View bot logs | `docker compose logs -f bot` |
| Stop everything | `docker compose down` |
| Rebuild after changes | `docker compose up --build -d` |
| Update yt-dlp | `docker compose restart updater` |
| Restart bot only | `docker compose restart bot` |
| Check service health | `docker compose ps` |
