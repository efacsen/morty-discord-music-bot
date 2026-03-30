import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import type { Track } from 'discord-player'

interface SongSelectionEmbedData {
  embeds: EmbedBuilder[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

export function createSongSelectionEmbed(
  tracks: Track[],
  query: string,
): SongSelectionEmbedData {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🔍 Search Results')
    .setDescription(`Found **${tracks.length}** results for: *${query}*\n\nPlease select a song:`)
    .setTimestamp()

  tracks.forEach((track, index) => {
    const number = index + 1
    embed.addFields({
      name: `${number}. ${track.title}`,
      value: `👤 ${track.author}\n⏱️ ${track.duration}\n👁️ ${track.views.toLocaleString()} views`,
      inline: false,
    })
  })

  const buttons = tracks.map((track, index) => {
    return new ButtonBuilder()
      .setCustomId(`song_select_${index}`)
      .setLabel(`${index + 1}`)
      .setStyle(ButtonStyle.Primary)
  })

  buttons.push(
    new ButtonBuilder()
      .setCustomId('song_select_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  )

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)

  return {
    embeds: [embed],
    components: [row],
  }
}
