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

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> *"Oh geez, y-you want music? I can do that!"*

A free, open-source Discord music bot with YouTube and playlist support. Built with Discord.js v14 and discord-player v7 — with a dash of nervous energy.

**Made by [efacsen](https://github.com/efacsen) with [Claude](https://claude.ai).**

This is a passion project built in spare time. It's completely free — no paywalls, no premium tiers, no catch. Just a bot that plays music. Fork it, modify it, host it yourself, share it with friends. That's the whole point.

---

## Features

- **Play from YouTube** — search by name, video URL, or playlist URL
- **Playlist support** — paste a YouTube playlist URL to load all tracks
- **Song selection** — shows top 3 results with buttons to pick
- **Interactive controls** — Now Playing embed with pause, skip, stop, shuffle, loop, queue buttons
- **Queue management** — paginated view with per-track remove and clear all
- **Full playback** — play, pause, resume, skip, stop, seek, back
- **Audio controls** — volume (0-100%), bass boost filter
- **Loop modes** — off, track, queue
- **Shuffle and jump** — randomize queue or jump to specific tracks
- **Cross-platform** — Windows, macOS, Linux (auto-detects yt-dlp)
- **Portable Windows package** — no admin rights or installs needed

## Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/play` | Play a song or playlist from YouTube | `/play <name, URL, or playlist URL>` |
| `/pause` | Pause the current song | `/pause` |
| `/resume` | Resume playback | `/resume` |
| `/skip` | Skip to the next song | `/skip` |
| `/stop` | Stop playback and clear queue | `/stop` |
| `/queue` | Display the current queue | `/queue` |
| `/nowplaying` | Show currently playing song | `/nowplaying` |
| `/volume` | Set volume (0-100) | `/volume <amount>` |
| `/loop` | Set loop mode | `/loop <off\|track\|queue>` |
| `/shuffle` | Shuffle the queue | `/shuffle` |
| `/seek` | Seek to a timestamp | `/seek <MM:SS>` |
| `/jump` | Jump to a track in queue | `/jump <position>` |
| `/back` | Play previous track | `/back` |
| `/bassboost` | Toggle bassboost filter | `/bassboost` |

## Quick Start

### Windows (Portable)

No admin rights needed. Everything downloads into the project folder.

1. Download the [latest release](https://github.com/efacsen/morty-discord-music-bot/releases) and extract the ZIP
2. Double-click **`setup.bat`** — downloads Node.js, FFmpeg, yt-dlp and asks for your bot token
3. Double-click **`start.bat`** — Morty is online

To stop, close the window or double-click `stop.bat`.

### macOS / Linux

```bash
git clone https://github.com/efacsen/morty-discord-music-bot.git
cd morty-discord-music-bot
chmod +x setup.sh
./setup.sh
./start.sh
```

### Manual Installation

<details>
<summary>Click to expand</summary>

#### Prerequisites

- **Node.js** v18+
- **FFmpeg**
- **yt-dlp**
- **Discord Bot Token**

#### Install system dependencies

- **Windows:** `winget install OpenJS.NodeJS Gyan.FFmpeg yt-dlp`
- **macOS:** `brew install node ffmpeg yt-dlp`
- **Linux:** `sudo apt install nodejs ffmpeg && pip install yt-dlp`

#### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/efacsen/morty-discord-music-bot.git
   cd morty-discord-music-bot
   npm install
   ```

2. Create a Discord bot at the [Developer Portal](https://discord.com/developers/applications):
   - New Application > Bot tab > copy token
   - OAuth2 > URL Generator > select `bot` + `applications.commands`
   - Permissions: Send Messages, Connect, Speak
   - Use generated URL to invite bot to your server

3. Configure:
   ```bash
   cp .env.example .env
   # Edit .env with your token, client ID, and guild ID
   ```

4. Start:
   ```bash
   npm start
   ```

</details>

## Usage

```
/play never gonna give you up
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
/play https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
/volume 75
/loop track
```

### Interactive Controls

The Now Playing embed has buttons for everything:

| Button | Action |
|--------|--------|
| Pause / Resume | Toggle playback |
| Skip | Next track |
| Stop | Stop and clear queue |
| Shuffle | Randomize queue |
| Loop | Cycle: Off > Track > Queue |
| View Queue | Paginated queue with remove buttons |

### Playlists

Paste any YouTube playlist URL and all tracks load at once. The bot shows a rich embed with the playlist name, track count, total duration, and a preview. URLs with `&list=` also load the full playlist.

## Project Structure

```
morty-music-bot/
├── src/
│   ├── index.js                  # Entry point, player events
│   ├── commands/                 # 14 slash commands
│   ├── events/                   # Bot ready + interaction routing
│   ├── handlers/                 # Button interaction handler
│   ├── extractors/               # YouTube extractors (yt-dlp + play-dl)
│   └── utils/                    # Embeds, time formatting, selection UI
├── scripts/
│   └── install.ps1               # Windows portable installer
├── docs/                         # Platform-specific setup guides
├── setup.bat / setup.sh          # One-click setup
├── start.bat / start.sh          # Start bot
├── stop.bat / stop.sh            # Stop bot
├── Dockerfile                    # Docker support
└── docker-compose.yml
```

## Docker

```bash
docker-compose up -d          # Start
docker-compose logs -f bot    # View logs
docker-compose down           # Stop
```

## Development

```bash
npm run dev     # Auto-reload on changes
npm run check   # Verify system requirements
```

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | v18.0.0 | v20.x (LTS) |
| RAM | 512 MB | 1 GB |
| Disk Space | 200 MB | 500 MB |
| Internet | Stable | Broadband |

## Roadmap

- [x] YouTube playlist support
- [x] Interactive queue management
- [x] Song selection UI
- [x] Cross-platform yt-dlp auto-detection
- [x] Portable Windows package
- [ ] Spotify support
- [ ] SoundCloud support
- [ ] User favorites/playlists
- [ ] Web dashboard
- [ ] Lyrics display
- [ ] Permission/DJ role system

## FAQ

**Can I use this for my server?**
Yes! It's free and open-source. Clone it, set up a bot token, and you're good.

**Does the Windows setup need admin rights?**
No. Everything downloads into the project's `runtime/` folder.

**Can multiple people host the same bot?**
Only one instance per bot token at a time. See [docs/HOSTING-GUIDE.md](docs/HOSTING-GUIDE.md).

**YouTube stopped working?**
Update yt-dlp: `pip install -U yt-dlp` or `brew upgrade yt-dlp`. YouTube changes their API frequently.

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

Quick fixes:
- **yt-dlp not found:** The bot auto-detects it. Install via `winget install yt-dlp` / `brew install yt-dlp` / `pip install yt-dlp`, or set `YTDLP_PATH` env var.
- **No slash commands:** Add `DISCORD_GUILD_ID` to `.env` for instant registration, or wait up to 1 hour for global commands.
- **No audio:** Check FFmpeg is installed and bot has Connect + Speak permissions. Make sure yt-dlp is up to date (`brew upgrade yt-dlp` / `pip install -U yt-dlp`) — YouTube frequently changes their API.
- **Voice connection fails:** Discord now requires DAVE (Discord Audio Video Encryption). Make sure `@snazzah/davey` is installed (`npm install`).
- **Module errors:** Delete `node_modules` and run `npm install` again.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project is open-source because good tools should be free. If you find it useful, star the repo or contribute back.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

**Made by [efacsen](https://github.com/efacsen) with [Claude](https://claude.ai)**

Built with:
- [discord.js](https://discord.js.org/) v14 — Discord API library
- [discord-player](https://discord-player.js.org/) v7.2 — Music player framework
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — YouTube extraction
- [@snazzah/davey](https://github.com/snazzah/davey) — Discord DAVE voice encryption
- FFmpeg — Audio processing

---

> *"I-I know it's just a music bot, but... I think it's pretty good, you know?"*

Free and open-source. No paywalls. No premium. Just music.
