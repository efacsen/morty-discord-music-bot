import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue'),

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

      if (queue.tracks.size === 0) {
        await interaction.reply({
          content: '❌ There are no tracks in the queue to shuffle!',
          ephemeral: true,
        })
        return
      }

      queue.tracks.shuffle()
      await interaction.reply(`🔀 Shuffled **${queue.tracks.size}** tracks!`)
    } catch (error) {
      console.error('Error in shuffle command:', error)
      await interaction.reply({
        content: '❌ An error occurred while shuffling the queue!',
        ephemeral: true,
      })
    }
  },
}

export default command
