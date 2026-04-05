import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js'
import { useQueue } from 'discord-player'

import type { CommandModule, QueueMetadata } from '../types/index.js'

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('Jump to a specific track in the queue')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Track position in queue (1 = next track)')
        .setRequired(true)
        .setMinValue(1),
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

      const position = interaction.options.getInteger('position')

      if (position === null) {
        await interaction.reply({
          content: '❌ Invalid position!',
          ephemeral: true,
        })
        return
      }

      if (position > queue.tracks.size) {
        await interaction.reply({
          content: `❌ Invalid position! Queue has only ${queue.tracks.size} tracks.`,
          ephemeral: true,
        })
        return
      }

      const track = queue.tracks.data[position - 1]!
      queue.node.skipTo(position - 1)

      await interaction.reply(`⏭️ Jumped to **${track.title}**!`)
    } catch (error) {
      console.error('Error in jump command:', error)
      await interaction.reply({
        content: '❌ An error occurred while jumping to the track!',
        ephemeral: true,
      })
    }
  },
}

export default command
