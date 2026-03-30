import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import { formatDuration, parseTimeString } from '../utils/formatTime.js'
import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific time in the current track')
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('Time to seek to (format: MM:SS or HH:MM:SS)')
        .setRequired(true),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const member = interaction.member as GuildMember

      if (!member.voice.channel) {
        await interaction.reply({
          content: '❌ You need to be in a voice channel!',
          ephemeral: true,
        })
        return
      }

      const queue = useQueue<QueueMetadata>(interaction.guildId!)

      if (!queue) {
        await interaction.reply({
          content: '❌ There is no music playing!',
          ephemeral: true,
        })
        return
      }

      if (member.voice.channelId !== queue.metadata.voiceChannel.id) {
        await interaction.reply({
          content: '❌ You need to be in the same voice channel as the bot!',
          ephemeral: true,
        })
        return
      }

      const timeString = interaction.options.getString('time')

      if (timeString === null) {
        await interaction.reply({
          content: '❌ Invalid time format! Use MM:SS or HH:MM:SS',
          ephemeral: true,
        })
        return
      }

      const seekTime = parseTimeString(timeString)

      if (seekTime === null) {
        await interaction.reply({
          content: '❌ Invalid time format! Use MM:SS or HH:MM:SS',
          ephemeral: true,
        })
        return
      }

      const currentTrack = queue.currentTrack!

      if (seekTime > currentTrack.durationMS) {
        await interaction.reply({
          content: `❌ Seek time exceeds track duration! Track length: ${formatDuration(currentTrack.durationMS)}`,
          ephemeral: true,
        })
        return
      }

      await queue.node.seek(seekTime)
      await interaction.reply(`⏩ Seeked to **${formatDuration(seekTime)}**!`)
    } catch (error) {
      console.error('Error in seek command:', error)
      await interaction.reply({
        content: '❌ An error occurred while seeking!',
        ephemeral: true,
      })
    }
  },
}

export default command
