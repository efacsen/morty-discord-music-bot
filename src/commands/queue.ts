import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import { createQueueEmbed } from '../utils/createPlayerEmbed.js'
import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Display the current queue'),

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

      const queueEmbed = createQueueEmbed(queue, 0)
      await interaction.reply(queueEmbed)
    } catch (error) {
      console.error('Error in queue command:', error)
      await interaction.reply({
        content: '❌ An error occurred while fetching the queue!',
        ephemeral: true,
      })
    }
  },
}

export default command
