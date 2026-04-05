import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('bassboost')
    .setDescription('Toggle bassboost filter'),

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

      await interaction.deferReply()

      const filters = queue.filters.ffmpeg as typeof queue.filters.ffmpeg & {
        filters: string[]
      }
      const bassboostEnabled = filters.filters.includes('bassboost')

      if (bassboostEnabled) {
        await filters.toggle('bassboost')
        await interaction.editReply('🎚️ Bassboost **disabled**!')
      } else {
        await filters.toggle('bassboost')
        await interaction.editReply('🎚️ Bassboost **enabled**!')
      }
    } catch (error) {
      console.error('Error in bassboost command:', error)

      if (error instanceof Error) {
        console.error('Full error:', error.stack)
      }

      const errorMessage = error instanceof Error ? `❌ Error: ${error.message}` : '❌ Error: Unknown error'
      if (interaction.deferred) {
        await interaction.editReply(errorMessage)
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true })
      }
    }
  },
}

export default command
