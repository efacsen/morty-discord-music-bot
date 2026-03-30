import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('back').setDescription('Play the previous track'),

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

      if (!queue.history.previousTrack) {
        await interaction.reply({
          content: '❌ There is no previous track!',
          ephemeral: true,
        })
        return
      }

      await queue.history.back()
      await interaction.reply('⏮️ Playing previous track!')
    } catch (error) {
      console.error('Error in back command:', error)
      await interaction.reply({
        content: '❌ An error occurred while going back to the previous track!',
        ephemeral: true,
      })
    }
  },
}

export default command
