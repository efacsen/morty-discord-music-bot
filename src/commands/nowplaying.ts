import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { useQueue } from 'discord-player'

import { createProgressBar, formatDuration } from '../utils/formatTime.js'
import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show currently playing song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      console.log('[NowPlaying] Command started')

      const queue = useQueue<QueueMetadata>(interaction.guildId!)

      if (!queue) {
        console.log('[NowPlaying] No queue found')
        await interaction.reply({
          content: '❌ There is no music playing!',
          ephemeral: true,
        })
        return
      }

      const currentTrack = queue.currentTrack

      if (!currentTrack) {
        console.log('[NowPlaying] No current track')
        await interaction.reply({
          content: '❌ There is no track currently playing!',
          ephemeral: true,
        })
        return
      }

      console.log('[NowPlaying] Track found:', currentTrack.title)

      const currentTime = queue.node.getTimestamp()!
      const progressBar = createProgressBar(
        currentTime.current.value,
        currentTrack.durationMS,
        20,
      )

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎵 Now Playing')
        .setDescription(`**${currentTrack.title}**`)
        .addFields(
          { name: '👤 Artist', value: currentTrack.author, inline: true },
          { name: '⏱️ Duration', value: formatDuration(currentTrack.durationMS), inline: true },
          { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true },
          {
            name: '⏳ Progress',
            value: `${formatDuration(currentTime.current.value)} ${progressBar} ${formatDuration(currentTrack.durationMS)}`,
            inline: false,
          },
        )
        .setThumbnail(currentTrack.thumbnail)
        .setFooter({ text: `Requested by ${currentTrack.requestedBy!.username}` })
        .setTimestamp()

      const loopMode = queue.repeatMode
      let loopStatus = 'Off'
      if (loopMode === 1) loopStatus = '🔂 Track'
      else if (loopMode === 2) loopStatus = '🔁 Queue'

      embed.addFields({ name: '🔁 Loop', value: loopStatus, inline: true })

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error('Error in nowplaying command:', error)

      if (error instanceof Error) {
        console.error('Full error:', error.stack)
      }

      const errorMsg = {
        content: error instanceof Error ? `❌ Error: ${error.message}` : '❌ Error: Unknown error',
        ephemeral: true,
      }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg)
      } else {
        await interaction.reply(errorMsg)
      }
    }
  },
}

export default command
