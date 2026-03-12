import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { YtDlpExtractor } from './extractors/YtDlpExtractor.js';
import { createPlayerEmbed } from './utils/createPlayerEmbed.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

// Initialize command collection
client.commands = new Collection();

// Track "Now Playing" messages per guild
// Structure: Map<guildId, { messageId, channelId }>
const nowPlayingMessages = new Map();

// Initialize discord-player
const player = new Player(client, {
    skipFFmpeg: false,
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

// Register YtDlp extractor for YouTube
await player.extractors.register(YtDlpExtractor, {});

// Register all default extractors (SoundCloud, Spotify, etc.)
await player.extractors.loadMulti(DefaultExtractors);

// Enable debug logging to monitor player activity
player.on('debug', (message) => {
    console.log(`[Player Debug] ${message}`);
});

player.events.on('debug', (queue, message) => {
    console.log(`[Queue Debug] ${message}`);
});

// Error handlers with detailed debugging
player.events.on('playerError', (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    console.error(`[Player Error] Full error:`, error);
    console.error(`[Player Error] Stack trace:`, error.stack);

    // Log player state at time of error
    console.error(`[Player Error] Player state:`, {
        isPlaying: queue.node.isPlaying(),
        isPaused: queue.node.isPaused(),
        currentTrack: queue.currentTrack?.title,
        tracksCount: queue.tracks.size,
        volume: queue.node.volume
    });

    queue.metadata.channel.send(`Aw geez, something broke: ${error.message}`);
});

player.events.on('error', (queue, error) => {
    console.error(`[Queue Error] ${error.message}`);
    console.error(`[Queue Error] Full error:`, error);
    console.error(`[Queue Error] Stack trace:`, error.stack);

    // Log queue state at time of error
    console.error(`[Queue Error] Queue state:`, {
        isPlaying: queue.node.isPlaying(),
        connection: queue.connection ? 'connected' : 'disconnected',
        currentTrack: queue.currentTrack?.title,
        tracksCount: queue.tracks.size
    });

    queue.metadata.channel.send(`Oh no, oh geez! Queue error: ${error.message}`);
});

// Player event handlers
player.events.on('playerStart', async (queue, track) => {
    console.log(`▶️ Now playing: ${track.title}`);

    const guildId = queue.guild.id;
    const channel = queue.metadata.channel;
    const messageData = createPlayerEmbed(track, queue);

    try {
        // Check if we have a persistent message for this guild
        const stored = nowPlayingMessages.get(guildId);

        if (stored && stored.channelId === channel.id) {
            // Try to edit existing message
            try {
                const message = await channel.messages.fetch(stored.messageId);
                await message.edit(messageData);
                console.log(`[Player] Updated persistent "Now Playing" message`);
            } catch (error) {
                // Message was deleted or not found, create new one
                console.log(`[Player] Persistent message not found, creating new one`);
                const newMessage = await channel.send(messageData);
                nowPlayingMessages.set(guildId, {
                    messageId: newMessage.id,
                    channelId: channel.id
                });
            }
        } else {
            // Create new persistent message
            const newMessage = await channel.send(messageData);
            nowPlayingMessages.set(guildId, {
                messageId: newMessage.id,
                channelId: channel.id
            });
            console.log(`[Player] Created new persistent "Now Playing" message`);
        }
    } catch (error) {
        console.error(`[Player] Error handling now playing message:`, error);
        // Fallback to simple message
        await channel.send(`▶️ Now playing: **${track.title}**`).catch(console.error);
    }
});

player.events.on('audioTrackAdd', (queue, track) => {
    console.log(`➕ Added to queue: ${track.title}`);
    // Only send message if queue is not currently playing (first song)
    // Otherwise it's redundant with the "Now Playing" message update
    if (!queue.node.isPlaying()) {
        queue.metadata.channel.send(`➕ Added to queue: **${track.title}**`);
    }
});

player.events.on('audioTracksAdd', (queue, tracks) => {
    console.log(`➕ Added ${tracks.length} tracks to queue (playlist)`);
});

player.events.on('disconnect', (queue) => {
    console.log('👋 Disconnected from voice channel');
    queue.metadata.channel.send('Oh geez, I-I gotta go... Disconnected!');
});

player.events.on('emptyChannel', (queue) => {
    console.log('🚪 Voice channel is empty, leaving...');
    queue.metadata.channel.send('Aw man, everyone left... I-I\'ll just go too.');
});

player.events.on('emptyQueue', (queue) => {
    console.log('✅ Queue finished');
    queue.metadata.channel.send('That\'s all the songs! W-we\'re done, I think.');
});

player.events.on('error', (queue, error) => {
    console.error(`❌ Player error: ${error.message}`);
    console.error(`❌ Full error object:`, error);
    console.error(`❌ Error stack:`, error.stack);
    queue.metadata.channel.send(`❌ An error occurred: ${error.message}`);
});

// Monitor voice connection state changes
player.events.on('connection', (queue) => {
    const connection = queue.connection;
    console.log(`[Voice Connection] State:`, connection?.state?.status || 'unknown');

    if (connection) {
        // Log connection state changes
        connection.on('stateChange', (oldState, newState) => {
            console.log(`[Voice Connection] State changed: ${oldState.status} -> ${newState.status}`);
        });

        // Log connection errors
        connection.on('error', (error) => {
            console.error(`[Voice Connection] Error:`, error);
            console.error(`[Voice Connection] Error stack:`, error.stack);
        });
    }
});

// Monitor audio player lifecycle
// IMPORTANT: willPlayTrack passes a resolver callback as 4th arg that MUST be called
// to unblock the play pipeline. Without calling it, playback hangs forever.
player.events.on('willPlayTrack', (queue, track, config, resolver) => {
    console.log(`[Audio Player] Will play track: ${track.title}`);
    console.log(`[Audio Player] Player state before playing:`, {
        isPlaying: queue.node.isPlaying(),
        isPaused: queue.node.isPaused(),
        volume: queue.node.volume
    });
    resolver();
});

// Load command files dynamically
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);

    if ('data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
        console.log(`✅ Loaded command: ${command.default.data.name}`);
    } else {
        console.warn(`⚠️ Command at ${file} is missing required "data" or "execute" property.`);
    }
}

// Load event files dynamically
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = await import(`file://${filePath}`);

    if (event.default.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args));
    } else {
        client.on(event.default.name, (...args) => event.default.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.default.name}`);
}

// Prevent unhandled rejections and errors from crashing the process
process.on('unhandledRejection', (error) => {
    console.error('[Process] Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught exception:', error);
});

client.on('error', (error) => {
    console.error('[Discord Client] Error:', error);
});

// Login to Discord
client.login(process.env.DISCORD_CLIENT_TOKEN);
