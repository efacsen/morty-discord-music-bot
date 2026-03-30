import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set playback volume')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Volume level (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100),
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

      const volume = interaction.options.getInteger('amount')

      if (volume === null) {
        await interaction.reply({
          content: '❌ Invalid volume amount!',
          ephemeral: true,
        })
        return
      }

      queue.node.setVolume(volume)
      await interaction.reply(`🔊 Volume set to **${volume}%**!`)
    } catch (error) {
      console.error('Error in volume command:', error)
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
