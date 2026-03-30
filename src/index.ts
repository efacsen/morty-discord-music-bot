import { DefaultExtractors } from '@discord-player/extractor'
import {
  Client,
  Collection,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from 'discord.js'
import {
  Player,
  type GuildQueue,
  type StreamConfig,
  type Track,
} from 'discord-player'
import dotenv from 'dotenv'
import { readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { YtDlpExtractor } from './extractors/YtDlpExtractor.js'
import type { CommandModule, EventModule, QueueMetadata } from './types/index.js'
import { createPlayerEmbed } from './utils/createPlayerEmbed.js'

// Load environment variables
dotenv.config()

// Check for @snazzah/davey (required for Discord DAVE voice encryption)
async function checkDavey(): Promise<void> {
  try {
    await import('@snazzah/davey')
  } catch (err) {
    const error = err as { code?: string }

    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.error(
        '[Startup Error] @snazzah/davey is required for Discord voice encryption (DAVE protocol).\n' +
          'Install it with: npm install @snazzah/davey\n' +
          'Without it, voice connections will silently fail at the Identifying state.',
      )
      process.exit(1)
    }

    throw err
  }
}

await checkDavey()

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface NowPlayingMessage {
  messageId: string
  channelId: string
}

function getGuildTextChannel(metadata: QueueMetadata): GuildTextBasedChannel {
  return metadata.channel as GuildTextBasedChannel
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
})

// Initialize command collection
client.commands = new Collection<string, CommandModule>()

// Track "Now Playing" messages per guild
// Structure: Map<guildId, { messageId, channelId }>
const nowPlayingMessages = new Map<string, NowPlayingMessage>()

// Initialize discord-player
const player = new Player(
  client as unknown as ConstructorParameters<typeof Player>[0],
  {
    skipFFmpeg: false,
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    },
  } as unknown as ConstructorParameters<typeof Player>[1],
)

// Register YtDlp extractor for YouTube
await player.extractors.register(YtDlpExtractor, {})

// Register all default extractors (SoundCloud, Spotify, etc.)
await player.extractors.loadMulti(DefaultExtractors)

// Enable debug logging to monitor player activity
player.on('debug', (message) => {
  console.log(`[Player Debug] ${message}`)
})

player.events.on('debug', (_queue, message) => {
  console.log(`[Queue Debug] ${message}`)
})

// Error handlers with detailed debugging
player.events.on('playerError', (queue, error) => {
  console.error(`[Player Error] ${error.message}`)
  console.error(`[Player Error] Full error:`, error)
  console.error(`[Player Error] Stack trace:`, error.stack)

  // Log player state at time of error
  console.error(`[Player Error] Player state:`, {
    isPlaying: queue.node.isPlaying(),
    isPaused: queue.node.isPaused(),
    currentTrack: queue.currentTrack?.title,
    tracksCount: queue.tracks.size,
    volume: queue.node.volume,
  })

  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send(`Aw geez, something broke: ${error.message}`)
})

player.events.on('error', (queue, error) => {
  console.error(`[Queue Error] ${error.message}`)
  console.error(`[Queue Error] Full error:`, error)
  console.error(`[Queue Error] Stack trace:`, error.stack)

  // Log queue state at time of error
  console.error(`[Queue Error] Queue state:`, {
    isPlaying: queue.node.isPlaying(),
    connection: queue.connection ? 'connected' : 'disconnected',
    currentTrack: queue.currentTrack?.title,
    tracksCount: queue.tracks.size,
  })

  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send(`Oh no, oh geez! Queue error: ${error.message}`)
})

// Player event handlers
player.events.on('playerStart', async (queue, track) => {
  console.log(`▶️ Now playing: ${track.title}`)

  const guildId = queue.guild.id
  const meta = queue.metadata as QueueMetadata
  const channel = getGuildTextChannel(meta)
  const messageData = createPlayerEmbed(track, queue as GuildQueue<QueueMetadata>)

  try {
    // Check if we have a persistent message for this guild
    const stored = nowPlayingMessages.get(guildId)

    if (stored && stored.channelId === channel.id) {
      // Try to edit existing message
      try {
        const message = await channel.messages.fetch(stored.messageId)
        await message.edit(messageData)
        console.log(`[Player] Updated persistent "Now Playing" message`)
      } catch (_error) {
        // Message was deleted or not found, create new one
        console.log(`[Player] Persistent message not found, creating new one`)
        const newMessage = await channel.send(messageData)
        nowPlayingMessages.set(guildId, {
          messageId: newMessage.id,
          channelId: channel.id,
        })
      }
    } else {
      // Create new persistent message
      const newMessage = await channel.send(messageData)
      nowPlayingMessages.set(guildId, {
        messageId: newMessage.id,
        channelId: channel.id,
      })
      console.log(`[Player] Created new persistent "Now Playing" message`)
    }
  } catch (error) {
    console.error(`[Player] Error handling now playing message:`, error)
    // Fallback to simple message
    await channel.send(`▶️ Now playing: **${track.title}**`).catch(console.error)
  }
})

player.events.on('audioTrackAdd', (queue, track) => {
  console.log(`➕ Added to queue: ${track.title}`)
  // Only send message if queue is not currently playing (first song)
  // Otherwise it's redundant with the "Now Playing" message update
  if (!queue.node.isPlaying()) {
    const meta = queue.metadata as QueueMetadata
    getGuildTextChannel(meta).send(`➕ Added to queue: **${track.title}**`)
  }
})

player.events.on('audioTracksAdd', (_queue, tracks) => {
  console.log(`➕ Added ${tracks.length} tracks to queue (playlist)`)
})

player.events.on('disconnect', (queue) => {
  console.log('👋 Disconnected from voice channel')
  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send('Oh geez, I-I gotta go... Disconnected!')
})

player.events.on('emptyChannel', (queue) => {
  console.log('🚪 Voice channel is empty, leaving...')
  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send("Aw man, everyone left... I-I'll just go too.")
})

player.events.on('emptyQueue', (queue) => {
  console.log('✅ Queue finished')
  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send("That's all the songs! W-we're done, I think.")
})

player.events.on('error', (queue, error) => {
  console.error(`❌ Player error: ${error.message}`)
  console.error(`❌ Full error object:`, error)
  console.error(`❌ Error stack:`, error.stack)
  const meta = queue.metadata as QueueMetadata
  getGuildTextChannel(meta).send(`❌ An error occurred: ${error.message}`)
})

// Monitor voice connection state changes
player.events.on('connection', (queue) => {
  const connection = queue.connection
  console.log(`[Voice Connection] State:`, connection?.state?.status || 'unknown')

  if (connection) {
    // Log connection state changes
    connection.on('stateChange', (oldState, newState) => {
      console.log(`[Voice Connection] State changed: ${oldState.status} -> ${newState.status}`)
    })

    // Log connection errors
    connection.on('error', (error) => {
      console.error(`[Voice Connection] Error:`, error)
      console.error(`[Voice Connection] Error stack:`, error.stack)
    })
  }
})

// Monitor audio player lifecycle
// IMPORTANT: willPlayTrack passes a resolver callback as 4th arg that MUST be called
// to unblock the play pipeline. Without calling it, playback hangs forever.
player.events.on(
  'willPlayTrack',
  (
    queue: GuildQueue<QueueMetadata>,
    track: Track<unknown>,
    _config: StreamConfig,
    done: () => void,
  ): void => {
    console.log(`[Audio Player] Will play track: ${track.title}`)
    console.log(`[Audio Player] Player state before playing:`, {
      isPlaying: queue.node.isPlaying(),
      isPaused: queue.node.isPaused(),
      volume: queue.node.volume,
    })
    done()
  },
)

// Load command files dynamically
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(
  (file) => file.endsWith('.ts') || file.endsWith('.js'),
)

for (const file of commandFiles) {
  const mod = (await import(join(commandsPath, file.replace(/\.ts$/, '.js')))) as {
    default: CommandModule
  }

  if ('data' in mod.default && 'execute' in mod.default) {
    client.commands.set(mod.default.data.name, mod.default)
    console.log(`✅ Loaded command: ${mod.default.data.name}`)
  } else {
    console.warn(`⚠️ Command at ${file} is missing required "data" or "execute" property.`)
  }
}

// Load event files dynamically
const eventsPath = join(__dirname, 'events')
const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'))

for (const file of eventFiles) {
  const mod = (await import(join(eventsPath, file.replace(/\.ts$/, '.js')))) as {
    default: EventModule
  }

  if (mod.default.once) {
    client.once(mod.default.name, (...args: unknown[]) => mod.default.execute(...args))
  } else {
    client.on(mod.default.name, (...args: unknown[]) => mod.default.execute(...args))
  }
  console.log(`✅ Loaded event: ${mod.default.name}`)
}

// Prevent unhandled rejections and errors from crashing the process
process.on('unhandledRejection', (error) => {
  console.error('[Process] Unhandled rejection:', error)
})

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught exception:', error)
})

client.on('error', (error) => {
  console.error('[Discord Client] Error:', error)
})

// Login to Discord
client.login(process.env.DISCORD_CLIENT_TOKEN)
