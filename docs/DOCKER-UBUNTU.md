# Running the Discord Music Bot on Ubuntu (Docker Engine)

Self-contained runbook for **Ubuntu 22.04 LTS or 24.04 LTS** using Docker Engine on a VPS or bare-metal server.

> **This guide uses Docker Compose only.** For the native Node.js setup see [SETUP.md](SETUP.md).  
> If you are on a desktop Mac, see [DOCKER-MAC.md](DOCKER-MAC.md). For Windows, see [DOCKER-WINDOWS.md](DOCKER-WINDOWS.md).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Ubuntu 22.04 LTS or 24.04 LTS | Other Debian-based distros may work but are not tested |
| A non-root user with `sudo` access | Commands below assume a regular user — do **not** run as root |
| A Discord bot application | Token, Client ID, and (optionally) a Guild ID |
| `git` and `curl` installed | `sudo apt install -y git curl` if missing |

---

## Step 1 — Install Docker Engine

Ubuntu ships with an outdated `docker.io` package. Install the official Docker Engine from Docker's apt repository instead.

```bash
# Remove any conflicting packages
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install dependencies
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the Docker apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify the installation:

```bash
docker --version
docker compose version
```

Both should return version strings. You are looking for `docker compose` (v2, no hyphen) — **not** the legacy `docker-compose` v1 binary.

---

## Step 2 — Add your user to the docker group

Running `docker` without `sudo` requires membership in the `docker` group:

```bash
sudo usermod -aG docker $USER
```

**You must log out and log back in** (or start a new SSH session) for this to take effect. Verify it worked:

```bash
docker run --rm hello-world
```

If you see "Hello from Docker!", group membership is active and `sudo` is no longer needed.

---

## Step 3 — Enable Docker to start on boot

```bash
sudo systemctl enable docker
sudo systemctl enable containerd
```

With `restart: unless-stopped` in the compose file, the bot will come back automatically after a VPS reboot without any additional cron job or init script.

---

## Step 4 — Clone or download the repository

```bash
git clone https://github.com/yourorg/discord-music-bot.git
cd discord-music-bot
```

If you downloaded a tarball, extract it and `cd` into the folder instead.

---

## Step 5 — Configure your environment

**Recommended:** use the interactive terminal onboarding. It creates `.env` for you and asks the questions in plain language.

```bash
./onboard.sh
```

If you prefer to edit the file yourself instead:

```bash
cp .env.example .env
nano .env        # or: vim .env, or any editor you prefer
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

## Step 6 — Pull the latest image

```bash
docker compose pull
```

Docker automatically selects the right architecture for your VPS (`linux/amd64` on most cloud providers, `linux/arm64` on Ampere/Graviton instances).

---

## Step 7 — Start the bot

It is recommended to run the following from inside a `tmux` or `screen` session so you can detach safely. However, the `-d` flag makes the process fully daemonised, so a session manager is optional.

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

## Step 8 — Verify the bot is running

```bash
docker compose ps
```

Both `discord-music-bot-updater` and `discord-music-bot` should show **`healthy`** or **`running`**.

Go to your Discord server and try a slash command like `/play` to confirm everything works.

---

## Step 9 — Manually update yt-dlp

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

2. Transfer your exported `cookies.txt` to the server and place it inside the directory:

   ```bash
   # Example: copy from your local machine via scp
   scp ~/Downloads/cookies.txt user@your-vps-ip:~/discord-music-bot/cookies/cookies.txt
   ```

3. Add this line to your `.env`:

   ```dotenv
   YTDLP_COOKIES_FILE=/cookies/cookies.txt
   ```

   The `cookies/` directory is bind-mounted into the container at `/cookies` — that path is always correct inside Docker regardless of where the repo lives on your server.

4. Restart the bot to apply the change:

   ```bash
   docker compose restart bot
   ```

> **Warning:** Stale cookies from a logged-in account can trigger stricter YouTube bot-detection and cause HTTP 403 errors. If playback breaks after adding cookies, try removing `YTDLP_COOKIES_FILE` from `.env` and restarting. See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for the full cookie troubleshooting flow.

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

### `docker compose` not found (legacy `docker-compose` v1 found instead)
- Do **not** use the `docker-compose` v1 binary (note the hyphen). It is not compatible.
- Install the v2 plugin: `sudo apt install docker-compose-plugin`.
- Confirm: `docker compose version` (space, not hyphen) should print a v2 version string.

### Permission denied running `docker` without `sudo`
- You have not logged out since adding yourself to the `docker` group.
- Start a new SSH session and try again. Running `newgrp docker` in the current shell also works as a temporary fix.

### `updater` stays unhealthy
- Check logs: `docker compose logs updater`
- The `updater` has up to 60 s + 30 retries to download yt-dlp. On a slow or rate-limited connection this can take a few minutes.
- If yt-dlp download fails, confirm the VPS has outbound internet access.

### UFW / firewall concerns
- The bot initiates all connections outbound — it does **not** listen on any inbound ports.
- No UFW rules need to be opened for the bot to function. Docker manages its own iptables rules.

### "HTTP Error 403" when playing YouTube videos
- This almost always means stale cookies. Remove `YTDLP_COOKIES_FILE` from `.env`, restart the bot, and retest without cookies first.
- See [YOUTUBE-AUTH.md](YOUTUBE-AUTH.md) for the full cookie troubleshooting flow.

### Bot does not restart after VPS reboot
- Confirm Docker is enabled: `sudo systemctl is-enabled docker` should print `enabled`.
- If not, run `sudo systemctl enable docker` and reboot to test.
- `restart: unless-stopped` in the compose file ensures containers restart automatically with the daemon.

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
| Enable auto-start on boot | `sudo systemctl enable docker` |
