import {
  ComponentType,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useMainPlayer, type SearchResult } from 'discord-player'

import { createPlaylistEmbed } from '../utils/createPlayerEmbed.js'
import { createSongSelectionEmbed } from '../utils/createSongSelectionEmbed.js'
import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist from YouTube')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name, YouTube URL, or YouTube playlist URL')
        .setRequired(true),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const member = interaction.member as GuildMember
      const query = interaction.options.getString('query', true)

      console.log(`[Play Command] User: ${interaction.user.tag}, Query: ${query}`)

      if (!member.voice.channel) {
        console.log('[Play Command] User not in voice channel')
        await interaction.reply({
          content: '❌ You need to be in a voice channel to play music!',
          ephemeral: true,
        })
        return
      }

      const permissions = member.voice.channel.permissionsFor(interaction.client.user!)
      if (!permissions?.has('Connect') || !permissions.has('Speak')) {
        console.log('[Play Command] Bot lacks voice permissions')
        await interaction.reply({
          content: '❌ I need permission to join and speak in your voice channel!',
          ephemeral: true,
        })
        return
      }

      await interaction.deferReply()

      const player = useMainPlayer()

      console.log(`[Play Command] Searching for: ${query}`)

      const searchResult: SearchResult = await player.search(query, {
        requestedBy: interaction.user.id,
      })

      console.log(`[Play Command] Search result:`, {
        hasResult: !!searchResult,
        tracksCount: searchResult?.tracks?.length || 0,
        isPlaylist: !!searchResult?.playlist,
        playlistTitle: searchResult?.playlist?.title,
        error: (searchResult as SearchResult & { error?: unknown }).error,
      })

      if (!searchResult || !searchResult.tracks.length) {
        console.error('[Play Command] No results found. Full result:', JSON.stringify(searchResult, null, 2))
        await interaction.editReply('❌ No results found! Make sure the URL is valid.')
        return
      }

      let queue = player.queues.get<QueueMetadata>(interaction.guildId!)

      if (!queue) {
        const metadata: QueueMetadata = {
          channel: interaction.channel as QueueMetadata['channel'],
          voiceChannel: member.voice.channel,
          requestedBy: interaction.user,
        }

        queue = player.queues.create<QueueMetadata>(interaction.guildId!, {
          metadata,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000,
          volume: 50,
          bufferingTimeout: 3000,
        })
      }

      if (!queue.connection) {
        await queue.connect(member.voice.channel.id)
        console.log('[Play Command] Connected to voice channel')
      }

      if (searchResult.playlist) {
        queue.addTrack(searchResult.tracks)

        const playlistMessage = createPlaylistEmbed(
          searchResult.playlist,
          searchResult.tracks,
          interaction.user,
        )
        await interaction.editReply(playlistMessage)

        if (!queue.node.isPlaying()) {
          await queue.node.play()
        }
      } else if (searchResult.tracks.length === 1) {
        const track = searchResult.tracks[0]!
        queue.addTrack(track)

        if (!queue.node.isPlaying()) {
          await interaction.editReply(`🎶 Now playing: **${track.title}**`)
        } else {
          await interaction.editReply(`✅ Added to queue: **${track.title}**`)
        }

        if (!queue.node.isPlaying()) {
          await queue.node.play()
        }
      } else {
        const selectionMessage = createSongSelectionEmbed(searchResult.tracks, query)
        await interaction.editReply(selectionMessage)

        const filter = (componentInteraction: ButtonInteraction): boolean => {
          return (
            componentInteraction.user.id === interaction.user.id &&
            componentInteraction.customId.startsWith('song_select_')
          )
        }

        const collector = interaction.channel!.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter,
          time: 30000,
          max: 1,
        })

        collector.on('collect', async (componentInteraction) => {
          if (componentInteraction.customId === 'song_select_cancel') {
            await componentInteraction.update({
              content: '❌ Song selection cancelled.',
              embeds: [],
              components: [],
            })
            return
          }

          const selectedIndex = parseInt(componentInteraction.customId.split('_')[2]!, 10)
          const selectedTrack = searchResult.tracks[selectedIndex]

          if (!selectedTrack) {
            await componentInteraction.update({
              content: '❌ Invalid selection.',
              embeds: [],
              components: [],
            })
            return
          }

          queue.addTrack(selectedTrack)

          if (!queue.node.isPlaying()) {
            await componentInteraction.update({
              content: `🎶 Now playing: **${selectedTrack.title}**`,
              embeds: [],
              components: [],
            })
            await queue.node.play()
          } else {
            await componentInteraction.update({
              content: `✅ Added to queue: **${selectedTrack.title}**`,
              embeds: [],
              components: [],
            })
          }
        })

        collector.on('end', (_collected, reason) => {
          if (reason === 'time') {
            interaction
              .editReply({
                content: '⏱️ Song selection timed out.',
                embeds: [],
                components: [],
              })
              .catch(console.error)
          }
        })
      }
    } catch (error) {
      console.error('Error in play command:', error)
      const errorMessage = '❌ An error occurred while trying to play the song!'

      if (interaction.deferred) {
        await interaction.editReply(errorMessage)
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true })
      }
    }
  },
}

export default command
