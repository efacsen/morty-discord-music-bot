import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { createSongSelectionEmbed } from '../utils/createSongSelectionEmbed.js';
import { createPlaylistEmbed } from '../utils/createPlayerEmbed.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist from YouTube')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song name, YouTube URL, or YouTube playlist URL')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            console.log(`[Play Command] User: ${interaction.user.tag}, Query: ${interaction.options.getString('query')}`);

            // Check if user is in a voice channel
            if (!interaction.member.voice.channel) {
                console.log('[Play Command] User not in voice channel');
                return interaction.reply({
                    content: '❌ You need to be in a voice channel to play music!',
                    ephemeral: true
                });
            }

            // Check if bot has permissions to join and speak
            const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                console.log('[Play Command] Bot lacks voice permissions');
                return interaction.reply({
                    content: '❌ I need permission to join and speak in your voice channel!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const player = useMainPlayer();
            const query = interaction.options.getString('query');

            console.log(`[Play Command] Searching for: ${query}`);

            // Search for the track - use 'auto' to let discord-player handle it
            const searchResult = await player.search(query, {
                requestedBy: interaction.user
            });

            console.log(`[Play Command] Search result:`, {
                hasResult: !!searchResult,
                tracksCount: searchResult?.tracks?.length || 0,
                isPlaylist: !!searchResult?.playlist,
                playlistTitle: searchResult?.playlist?.title,
                error: searchResult?.error
            });

            if (!searchResult || !searchResult.tracks.length) {
                console.error('[Play Command] No results found. Full result:', JSON.stringify(searchResult, null, 2));
                return interaction.editReply('❌ No results found! Make sure the URL is valid.');
            }

            // Get or create queue
            let queue = player.queues.get(interaction.guildId);

            if (!queue) {
                queue = player.queues.create(interaction.guildId, {
                    metadata: {
                        channel: interaction.channel,
                        voiceChannel: interaction.member.voice.channel
                    },
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000, // 5 minutes
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000, // 5 minutes
                    volume: 50,
                    bufferingTimeout: 3000
                });
            }

            // Connect to voice channel if not connected
            if (!queue.connection) {
                await queue.connect(interaction.member.voice.channel);
            }

            // Add track(s) to queue
            if (searchResult.playlist) {
                queue.addTrack(searchResult.tracks);

                // Show rich playlist embed
                const playlistMessage = createPlaylistEmbed(
                    searchResult.playlist,
                    searchResult.tracks,
                    interaction.user
                );
                await interaction.editReply(playlistMessage);

                // Start playing if not already playing
                if (!queue.node.isPlaying()) {
                    await queue.node.play();
                }
            } else if (searchResult.tracks.length === 1) {
                // Direct URL or single result - add immediately
                const track = searchResult.tracks[0];
                queue.addTrack(track);

                if (!queue.node.isPlaying()) {
                    await interaction.editReply(`🎶 Now playing: **${track.title}**`);
                } else {
                    await interaction.editReply(`✅ Added to queue: **${track.title}**`);
                }

                // Start playing if not already playing
                if (!queue.node.isPlaying()) {
                    await queue.node.play();
                }
            } else {
                // Multiple results - show selection UI
                const selectionMessage = createSongSelectionEmbed(searchResult.tracks, query);
                await interaction.editReply(selectionMessage);

                // Create interaction collector to wait for button click
                const filter = (i) => {
                    return i.user.id === interaction.user.id && i.customId.startsWith('song_select_');
                };

                const collector = interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 30000, // 30 seconds timeout
                    max: 1
                });

                collector.on('collect', async (i) => {
                    if (i.customId === 'song_select_cancel') {
                        await i.update({ content: '❌ Song selection cancelled.', embeds: [], components: [] });
                        return;
                    }

                    // Extract selected index from customId (e.g., "song_select_0" -> 0)
                    const selectedIndex = parseInt(i.customId.split('_')[2]);
                    const selectedTrack = searchResult.tracks[selectedIndex];

                    if (!selectedTrack) {
                        await i.update({ content: '❌ Invalid selection.', embeds: [], components: [] });
                        return;
                    }

                    // Add selected track to queue
                    queue.addTrack(selectedTrack);

                    if (!queue.node.isPlaying()) {
                        await i.update({
                            content: `🎶 Now playing: **${selectedTrack.title}**`,
                            embeds: [],
                            components: []
                        });
                        await queue.node.play();
                    } else {
                        await i.update({
                            content: `✅ Added to queue: **${selectedTrack.title}**`,
                            embeds: [],
                            components: []
                        });
                    }
                });

                collector.on('end', (_collected, reason) => {
                    if (reason === 'time') {
                        interaction.editReply({
                            content: '⏱️ Song selection timed out.',
                            embeds: [],
                            components: []
                        }).catch(console.error);
                    }
                });
            }
        } catch (error) {
            console.error('Error in play command:', error);
            const errorMessage = '❌ An error occurred while trying to play the song!';

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};
