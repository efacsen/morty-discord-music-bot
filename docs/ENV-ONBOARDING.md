# Env Setup Without the Jargon

This guide helps you fill in the `.env` file without needing to know how the bot works internally.

If you are running the bot with Docker, this is the only part you really need to personalize before starting.

---

## Fastest option

If you want the terminal to guide you, use the interactive onboarding instead of editing `.env` by hand:

**macOS / Linux**
```bash
./onboard.sh
```

**Windows**
```powershell
.\onboard.bat
```

That will ask you plain-language questions and write `.env` for you.

---

## What you actually need

Most people only need to fill in **2 lines**:

- `DISCORD_CLIENT_TOKEN`
- `DISCORD_CLIENT_ID`

A third line is **recommended**:

- `DISCORD_GUILD_ID`

Everything else is optional unless your hosting guide explicitly told you to add it.

---

## The easiest way to think about each field

### `DISCORD_CLIENT_TOKEN`
**What it is:** the bot's password.

**Where to get it:**
1. Go to <https://discord.com/developers/applications>
2. Open your bot application
3. Click **Bot** in the left sidebar
4. Find **Token**
5. Copy it

**Paste it like this:**

```dotenv
DISCORD_CLIENT_TOKEN=paste_the_token_here
```

---

### `DISCORD_CLIENT_ID`
**What it is:** the bot application's ID number.

**Where to get it:**
1. In the same Discord developer page
2. Click **General Information**
3. Copy **Application ID**

**Paste it like this:**

```dotenv
DISCORD_CLIENT_ID=paste_the_application_id_here
```

---

### `DISCORD_GUILD_ID` *(recommended)*
**What it is:** your Discord server's ID.

**Why it helps:** slash commands show up much faster while you're setting things up.

**Where to get it:**
1. In Discord, open **User Settings** → **Advanced**
2. Turn on **Developer Mode**
3. Right-click your server
4. Click **Copy Server ID**

**Paste it like this:**

```dotenv
DISCORD_GUILD_ID=paste_your_server_id_here
```

If you skip this, the bot can still work, but commands may take up to **1 hour** to appear.

---

## Docker-only settings

### `IMAGE_NAME`
If you are using Docker Compose, you will usually need this.
It tells Docker which bot image to pull.

**What it looks like:**

```dotenv
IMAGE_NAME=owner/discord-music-bot
```

Important:
- Do **not** add `ghcr.io/`
- Use the exact value from your setup guide or whoever gave you the image

If you're not sure what to put here, check the Docker guide you are following first.

---

## Optional YouTube access settings

You do **not** need these to get started.
Add them only if normal playback works badly for some videos.

### Option A — Cookie file (recommended for Docker)
If you exported a `cookies.txt` file, use:

```dotenv
YTDLP_COOKIES_FILE=/cookies/cookies.txt
```

Use this only when:
- some videos are age-restricted
- some videos give 403 errors
- your setup guide told you to place `cookies.txt` in the `cookies/` folder

### Option B — Read cookies from your browser session
This is supported by the code, but is mainly useful for **non-Docker / local** setups:

```dotenv
YTDLP_COOKIES_BROWSER=chrome
```

You can also use:
- `firefox`
- `safari`
- `edge`
- another browser supported by `yt-dlp`

For Docker users, `YTDLP_COOKIES_FILE` is the simpler option.

---

## A good starter `.env`

For most users, this is enough:

```dotenv
DISCORD_CLIENT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_server_id_here
IMAGE_NAME=owner/discord-music-bot
```

If you are not using Docker, you can ignore `IMAGE_NAME`.

If you are using Docker and do not need YouTube cookies yet, stop here.

---

## What you should leave alone

You might see other env names mentioned in code or logs. Most users should **not** set these manually:

- `YTDLP_PATH` — Docker sets this automatically

If the bot is started with `docker compose`, that part is already handled for you.

---

## Quick self-check before starting

Before you run the bot, make sure:

- `DISCORD_CLIENT_TOKEN` is filled in
- `DISCORD_CLIENT_ID` is filled in
- `DISCORD_GUILD_ID` is filled in if you want commands to appear quickly
- `IMAGE_NAME` is filled in if your Docker guide told you to use one
- `YTDLP_COOKIES_FILE` is only added if you really need cookies

---

## Common mistakes

### 1. Putting quotes around values
Use:

```dotenv
DISCORD_CLIENT_ID=123456789012345678
```

Not:

```dotenv
DISCORD_CLIENT_ID="123456789012345678"
```

### 2. Using the wrong Discord value
- `DISCORD_CLIENT_TOKEN` = from the **Bot** page
- `DISCORD_CLIENT_ID` = **Application ID** from **General Information**

They are not interchangeable.

### 3. Adding cookies before testing without them
Start without cookies first. Add them only if you actually need them.

### 4. Using `ghcr.io/owner/discord-music-bot` in `IMAGE_NAME`
Do not include the `ghcr.io/` prefix.

---

## If you want the shortest possible version

Fill these in first:

```dotenv
DISCORD_CLIENT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
```

Then start the bot.

Only add cookie settings later if playback needs them.
