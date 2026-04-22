```
  __  __            _
 |  \/  | ___  _ __| |_ _   _
 | |\/| |/ _ \| '__| __| | | |
 | |  | | (_) | |  | |_| |_| |
 |_|  |_|\___/|_|   \__|\__, |
                          |___/
       Discord Music Bot
```

# Morty Music Bot

> *"Oh geez, y-you want music? I can do that!"*

A free, open-source Discord music bot with YouTube support. Built with Discord.js v14 and discord-player v7.

**Made by [efacsen](https://github.com/efacsen). No paywalls. No premium. Just music.**

---

## Prerequisites

Before you start, make sure these are installed:

- [Node.js](https://nodejs.org/) v18+
- [FFmpeg](https://ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- A Discord bot token ([how to get one](#discord-bot-setup))

**macOS (Homebrew)**
```bash
brew install node ffmpeg yt-dlp
```

**Linux**
```bash
sudo apt install nodejs ffmpeg
pip install yt-dlp
```

**Windows**
```bash
winget install OpenJS.NodeJS Gyan.FFmpeg yt-dlp
```

---

## Setup

```bash
git clone https://github.com/efacsen/morty-discord-music-bot.git
cd morty-discord-music-bot
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_CLIENT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here   # optional but recommended for dev
```

Then build and run:

```bash
npm run build
npm start
```

---

## Discord Bot Setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → give it a name
3. Go to **Bot** tab → click **Reset Token** → copy the token → paste into `.env`
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot` + `applications.commands`
   - Bot Permissions: `Send Messages`, `Connect`, `Speak`
5. Open the generated URL to invite the bot to your server
6. Copy your **Application ID** from the General Information tab → paste as `DISCORD_CLIENT_ID` in `.env`

> **Guild ID** (optional): Right-click your server in Discord → Copy Server ID. Adding this makes slash commands appear instantly instead of waiting up to 1 hour.

---

## Commands

| Command | Description |
|---------|-------------|
| `/play <query or URL>` | Play a song or YouTube playlist |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip to next track |
| `/back` | Play previous track |
| `/stop` | Stop and clear queue |
| `/queue` | Show current queue |
| `/nowplaying` | Show currently playing track |
| `/seek <MM:SS>` | Seek to a timestamp |
| `/jump <position>` | Jump to a track in the queue |
| `/volume <0-100>` | Set volume |
| `/loop <off\|track\|queue>` | Set loop mode |
| `/shuffle` | Shuffle the queue |
| `/bassboost` | Toggle bass boost |

---

## Development

```bash
npm run dev          # Run with hot reload (no build needed)
npm run build        # Compile TypeScript
npm run check        # Check system requirements
npm run lint         # Lint source files
npm run clear-commands  # Wipe registered slash commands
```

---

## Troubleshooting

**No audio / 403 errors from YouTube**
Update yt-dlp — YouTube changes their API frequently:
```bash
brew upgrade yt-dlp        # macOS
pip install -U yt-dlp      # Linux / Windows
```

**Slash commands not showing**
Add `DISCORD_GUILD_ID` to `.env` for instant registration. Without it, global commands take up to 1 hour.

**Voice connection fails silently**
Discord requires DAVE (Audio Video Encryption). Make sure `@snazzah/davey` is installed by running `npm install`.

**Module not found errors**
Delete `node_modules` and reinstall:
```bash
rm -rf node_modules && npm install
```

---

## Docker

```bash
docker compose up --build -d   # Start
docker compose logs -f bot     # Logs
docker compose down            # Stop
```

---

## License

MIT — see [LICENSE](LICENSE).

---

> *"I-I know it's just a music bot, but... I think it's pretty good, you know?"*
