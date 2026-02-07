# Pak Lurah Discord Music Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A modern, feature-rich Discord music bot with YouTube support built on Discord.js v14 and discord-player v7.

> **DISCLAIMER:** This bot is built in my free time as a hobby project. Support is provided on a best-effort basis. While I'll do my best to fix issues and improve the bot, response times may vary. Contributions from the community are always welcome!

## Features

- **Play music from YouTube** — search by name, video URL, or playlist URL
- **YouTube playlist support** — paste a playlist URL to load all tracks at once
- **Song selection** — top 3 search results with button-based selection
- **Interactive Now Playing** — rich embed with pause, skip, stop, shuffle, loop, and queue buttons
- **Queue management** — paginated queue view with per-track remove buttons and clear all
- **Full playback controls** — play, pause, resume, skip, stop, seek, back
- **Audio controls** — volume (0-100%), bass boost filter
- **Loop modes** — off, track, queue
- **Queue shuffling** and **jump to track**
- **Cross-platform** — Windows, macOS, Linux (auto-detects yt-dlp on any OS)
- **Portable Windows package** — no admin rights or system installs needed

## Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/play` | Play a song or playlist from YouTube | `/play <name, video URL, or playlist URL>` |
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

### Windows (Portable — Recommended)

No admin rights needed. Everything downloads into the project folder.

1. Download and extract the [latest release](https://github.com/efacsen/pak-lurah-discord-music-bot/releases) (or clone the repo)
2. Double-click **`setup.bat`** — downloads Node.js, FFmpeg, yt-dlp automatically and asks for your bot token
3. Double-click **`start.bat`** — bot runs

That's it. To stop, close the window or double-click `stop.bat`.

### macOS / Linux

```bash
git clone https://github.com/efacsen/pak-lurah-discord-music-bot.git
cd pak-lurah-discord-music-bot
chmod +x setup.sh
./setup.sh
```

Then start with:
```bash
./start.sh
```

The setup script will:
- Install all required dependencies (Node.js, FFmpeg, yt-dlp)
- Configure your Discord bot credentials
- Set up the bot for first run

---

### Manual Installation

<details>
<summary>Click to expand manual setup instructions</summary>

#### Prerequisites

- **Node.js** v18 or higher
- **FFmpeg** (required for audio processing)
- **yt-dlp** (required for YouTube playback)
- **Discord Bot Token**

#### Install system dependencies

- **Windows:** `winget install OpenJS.NodeJS Gyan.FFmpeg yt-dlp`
- **macOS:** `brew install node ffmpeg yt-dlp`
- **Linux:** `sudo apt install nodejs ffmpeg && pip install yt-dlp`

#### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/efacsen/pak-lurah-discord-music-bot.git
   cd pak-lurah-discord-music-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a Discord bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" tab and create a bot
   - Enable **Server Members Intent** and **Message Content Intent**
   - Copy the bot token

4. **Configure the bot:**
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials
   ```

   Required in `.env`:
   ```env
   DISCORD_CLIENT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_GUILD_ID=optional_for_testing
   ```

5. **Invite the bot to your server:**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36700160&scope=bot%20applications.commands
   ```
   Replace `YOUR_CLIENT_ID` with your actual Client ID.

6. **Start the bot:**
   ```bash
   npm start
   ```

</details>

## Detailed Setup Guides

- **Windows Users:** See [docs/SETUP-WINDOWS.md](docs/SETUP-WINDOWS.md)
- **macOS Users:** See [docs/SETUP-MAC.md](docs/SETUP-MAC.md)
- **Multi-Host Setup:** See [docs/HOSTING-GUIDE.md](docs/HOSTING-GUIDE.md)

## Usage

1. **Start the bot** with `npm start` (or double-click `start.bat` on Windows)
2. **Join a voice channel** in your Discord server
3. **Use slash commands**:
   ```
   /play never gonna give you up
   /play https://www.youtube.com/watch?v=dQw4w9WgXcQ
   /play https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
   /volume 75
   /loop track
   ```

### Interactive Controls

The **Now Playing** embed includes buttons for quick control without typing commands:

| Button | Action |
|--------|--------|
| Pause / Resume | Toggle playback |
| Skip | Skip to next track |
| Stop | Stop and clear queue |
| Shuffle | Shuffle upcoming tracks |
| Loop | Cycle: Off → Track → Queue |
| View Queue | Show queue with pagination and remove buttons |

### Playlists

Paste any YouTube playlist URL and all tracks are loaded:
```
/play https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```
The bot shows a rich embed with playlist name, track count, total duration, and a preview of the first 5 tracks.

URLs with both a video and playlist (e.g. `watch?v=xxx&list=PLxxx`) load the full playlist.

## Development

**Run in development mode** (auto-reload on changes):
```bash
npm run dev
```

**Check system requirements:**
```bash
npm run check
```

## Project Structure

```
pak-lurah-discord-music-bot/
├── src/
│   ├── index.js                  # Main entry point, player events
│   ├── commands/                 # 14 slash commands
│   │   ├── play.js              # Play music (search, URL, playlist)
│   │   ├── pause.js             # Pause playback
│   │   ├── resume.js            # Resume playback
│   │   ├── skip.js              # Skip track
│   │   ├── stop.js              # Stop and clear queue
│   │   ├── queue.js             # Display queue
│   │   ├── nowplaying.js        # Current track info
│   │   ├── volume.js            # Volume control
│   │   ├── loop.js              # Loop modes
│   │   ├── shuffle.js           # Shuffle queue
│   │   ├── seek.js              # Seek to timestamp
│   │   ├── jump.js              # Jump to track
│   │   ├── back.js              # Previous track
│   │   └── bassboost.js         # Audio filter
│   ├── events/
│   │   ├── ready.js             # Bot ready + command registration
│   │   └── interactionCreate.js # Routes commands and button clicks
│   ├── handlers/
│   │   └── buttonHandler.js     # Interactive button controls
│   ├── extractors/
│   │   ├── YtDlpExtractor.js   # Primary YouTube extractor (yt-dlp)
│   │   └── PlayDLExtractor.js  # Fallback extractor (play-dl)
│   └── utils/
│       ├── formatTime.js        # Time formatting and progress bar
│       ├── createPlayerEmbed.js # Now Playing, Queue, and Playlist embeds
│       └── createSongSelectionEmbed.js # Search result selection UI
├── scripts/
│   └── install.ps1              # Windows portable installer
├── docs/
│   ├── SETUP-WINDOWS.md
│   ├── SETUP-MAC.md
│   └── HOSTING-GUIDE.md
├── setup.bat / setup.sh         # One-click setup
├── start.bat / start.sh         # Start bot
├── stop.bat / stop.sh           # Stop bot
├── .env.example                 # Environment template
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Docker compose
└── package.json
```

## Docker Support

**Build and run with Docker:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f bot
```

**Stop:**
```bash
docker-compose down
```

## Security & Best Practices

### DO:
- Keep `.env` file private and secure
- Use environment variables for tokens
- Regularly update dependencies
- Use specific bot permissions (not Administrator)
- Keep FFmpeg and Node.js updated

### DON'T:
- Commit `.env` to Git (it's in `.gitignore`)
- Share your bot token publicly
- Give bot admin permissions
- Run multiple instances with same token simultaneously

## Multi-Host Shared Hosting

This bot supports shared hosting where multiple people can take turns running it!

**Key points:**
- Multiple people can have the code
- Share the bot token securely
- Only ONE person can run it at a time

See [docs/HOSTING-GUIDE.md](docs/HOSTING-GUIDE.md) for detailed instructions.

## Troubleshooting

**Having issues?** Check the comprehensive [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide for detailed solutions.

### yt-dlp not found

The bot auto-detects yt-dlp across all platforms. If it's not found, install it:
- **Windows:** `winget install yt-dlp`
- **macOS:** `brew install yt-dlp`
- **Linux:** `sudo apt install yt-dlp` or `pip install yt-dlp`

You can also set the `YTDLP_PATH` environment variable to point to the binary.

### Bot doesn't start

1. **Check Node.js version:** `node --version` (must be v18+)
2. **Check .env file:** Ensure token and client ID are correct
3. **Run system check:** `npm run check`
4. **Check console logs:** Look for error messages

### No slash commands appearing

**Option 1:** Wait up to 1 hour for global commands to register

**Option 2:** Use guild commands for instant updates:
1. Add your test server ID to `.env`:
   ```env
   DISCORD_GUILD_ID=your_server_id_here
   ```
2. Restart the bot
3. Commands appear instantly in that server

### "FFmpeg not found" error

- **Windows (portable):** Run `setup.bat` — it downloads FFmpeg automatically
- **Windows (manual):** `winget install Gyan.FFmpeg`
- **macOS:** `brew install ffmpeg`
- **Linux:** `sudo apt install ffmpeg`

### No audio playing

1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check bot has "Connect" and "Speak" permissions
3. Ensure you're in a voice channel
4. Check bot can see/access the voice channel
5. Check console for error messages

### "Cannot find module" errors

```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | v18.0.0 | v20.x (LTS) |
| RAM | 512 MB | 1 GB |
| Disk Space | 200 MB | 500 MB |
| Internet | Stable connection | Broadband |
| FFmpeg | Any version | Latest |

## Roadmap

Potential future features:
- [x] YouTube playlist support
- [x] Interactive queue management (remove tracks, pagination)
- [x] Song selection UI (top 3 results)
- [x] Cross-platform yt-dlp auto-detection
- [x] Portable Windows package
- [ ] Spotify support
- [ ] SoundCloud support
- [ ] User favorites/playlists
- [ ] Web dashboard
- [ ] Queue history
- [ ] Lyrics display
- [ ] More audio filters
- [ ] Permission/DJ role system

## FAQ

**Q: Why Node.js v18+?**
A: Required for ES modules and modern discord.js features.

**Q: Why is FFmpeg required?**
A: FFmpeg handles audio processing and encoding for voice playback.

**Q: Can I run multiple bots?**
A: Yes, create separate applications in Discord Developer Portal with different tokens.

**Q: Can multiple people run the same bot?**
A: Only one at a time with the same token. See [HOSTING-GUIDE.md](docs/HOSTING-GUIDE.md).

**Q: Does this work on Raspberry Pi?**
A: Yes, but performance may vary. Use Raspberry Pi 4 with 2GB+ RAM.

**Q: Does the Windows portable setup need admin rights?**
A: No. Everything is downloaded into the project's `runtime/` folder. No system-wide installs.

**Q: Is this bot free?**
A: Yes, 100% free and open-source.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**efacsen**

## Important Disclaimers

### Free-Time Hobby Project
This Discord music bot is developed and maintained in my free time as a hobby project. Please understand:

- **Best-Effort Support**: I provide support when I have time available. Response times to issues and questions may vary.
- **No Warranty**: This software is provided "as is" without warranty of any kind (see [MIT License](LICENSE) for full details).
- **No SLA**: There are no service level agreements or guaranteed uptime/availability.
- **Breaking Changes**: Updates may introduce breaking changes as the project evolves.

### YouTube API Changes
YouTube frequently updates their API to prevent bots. While this bot uses yt-dlp (the most robust solution), playback may occasionally break. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if issues occur.

### Community Contributions Welcome
I appreciate and welcome contributions from the community! If you find bugs or have feature ideas:
- Open an issue to report problems
- Submit pull requests for improvements
- Help other users in discussions
- Share your experiences and tips

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## Acknowledgments

- [discord.js](https://discord.js.org/) - Discord API library
- [discord-player](https://discord-player.js.org/) - Music player library
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader (industry standard)
- [yt-dlp-wrap](https://github.com/foxesdocode/yt-dlp-wrap) - Node.js wrapper for yt-dlp
- [play-dl](https://github.com/play-dl/play-dl) - Fallback YouTube extractor
- FFmpeg - Audio processing

---

**Made with love for the Discord community**
