import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { QueueRepeatMode, useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
        ),
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

      const mode = interaction.options.getString('mode')

      switch (mode) {
        case 'off':
          queue.setRepeatMode(QueueRepeatMode.OFF)
          await interaction.reply('🔁 Loop mode: **Off**')
          break
        case 'track':
          queue.setRepeatMode(QueueRepeatMode.TRACK)
          await interaction.reply('🔂 Loop mode: **Track**')
          break
        case 'queue':
          queue.setRepeatMode(QueueRepeatMode.QUEUE)
          await interaction.reply('🔁 Loop mode: **Queue**')
          break
      }
    } catch (error) {
      console.error('Error in loop command:', error)
      await interaction.reply({
        content: '❌ An error occurred while setting loop mode!',
        ephemeral: true,
      })
    }
  },
}

export default command
