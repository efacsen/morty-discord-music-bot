import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type User,
} from 'discord.js'
import type { GuildQueue, Track } from 'discord-player'

import type { QueueMetadata } from '../types/index.js'

interface EmbedMessageData {
  embeds: EmbedBuilder[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

interface PlaylistInfo {
  title: string
  url: string
  thumbnail?: string | null
}

export function createPlayerEmbed(
  track: Track,
  queue: GuildQueue<QueueMetadata>,
): EmbedMessageData {
  const embed = new EmbedBuilder()
    .setColor('#97CE4C')
    .setTitle('Now Playing')
    .setDescription(`**${track.title}**`)
    .addFields(
      { name: 'Artist', value: track.author || 'Unknown', inline: true },
      { name: 'Duration', value: track.duration || 'Unknown', inline: true },
      { name: 'Requested by', value: track.requestedBy?.tag || 'Unknown', inline: true },
    )
    .setThumbnail(track.thumbnail || null)
    .setFooter({
      text: `Morty Bot | ${queue.tracks.data.length} song${queue.tracks.data.length !== 1 ? 's' : ''} remaining`,
    })
    .setTimestamp()

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('player_pause')
      .setLabel(queue.node.isPaused() ? 'Resume' : 'Pause')
      .setEmoji(queue.node.isPaused() ? '▶️' : '⏸️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('player_skip')
      .setLabel('Skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(queue.tracks.data.length === 0),
    new ButtonBuilder()
      .setCustomId('player_stop')
      .setLabel('Stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('player_shuffle')
      .setLabel('Shuffle')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(queue.tracks.data.length === 0),
    new ButtonBuilder()
      .setCustomId('player_loop')
      .setLabel(getLoopLabel(queue.repeatMode))
      .setEmoji('🔁')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('player_queue')
      .setLabel('View Queue')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),
  )

  return {
    embeds: [embed],
    components: [row1, row2],
  }
}

function getLoopLabel(repeatMode: number): string {
  switch (repeatMode) {
    case 1:
      return 'Loop: Track'
    case 2:
      return 'Loop: Queue'
    case 3:
      return 'Loop: Autoplay'
    default:
      return 'Loop: Off'
  }
}

export function createQueueEmbed(
  queue: GuildQueue<QueueMetadata>,
  page: number = 0,
): EmbedMessageData {
  const currentTrack = queue.currentTrack
  const tracks = queue.tracks.data
  const ITEMS_PER_PAGE = 5
  const totalPages = Math.max(1, Math.ceil(tracks.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages - 1)

  const embed = new EmbedBuilder().setColor('#97CE4C').setTitle('Queue').setTimestamp()

  if (currentTrack) {
    embed.addFields({
      name: '🎵 Now Playing',
      value: `**${currentTrack.title}**\n${currentTrack.author} • ${currentTrack.duration}`,
      inline: false,
    })
  }

  if (tracks.length > 0) {
    const startIdx = currentPage * ITEMS_PER_PAGE
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, tracks.length)
    const pageTrack = tracks.slice(startIdx, endIdx)

    const upcoming = pageTrack
      .map((trackItem, index) => {
        const position = startIdx + index + 1
        return `**${position}.** ${trackItem.title}\n${trackItem.author} • ${trackItem.duration}`
      })
      .join('\n\n')

    embed.addFields({
      name: `⏭️ Up Next (${tracks.length} song${tracks.length !== 1 ? 's' : ''})`,
      value: upcoming || 'Queue is empty',
      inline: false,
    })

    if (totalPages > 1) {
      embed.setFooter({ text: `Page ${currentPage + 1}/${totalPages}` })
    }
  } else {
    embed.addFields({
      name: '⏭️ Up Next',
      value: 'Queue is empty',
      inline: false,
    })
  }

  const components: ActionRowBuilder<ButtonBuilder>[] = []

  if (tracks.length > 0) {
    const startIdx = currentPage * ITEMS_PER_PAGE
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, tracks.length)
    const removeButtons: ButtonBuilder[] = []

    for (let i = startIdx; i < endIdx; i++) {
      removeButtons.push(
        new ButtonBuilder()
          .setCustomId(`queue_remove_${i}`)
          .setLabel(`${i + 1}`)
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger),
      )
    }

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(removeButtons.slice(0, 5))
    components.push(row1)
  }

  const navRow = new ActionRowBuilder<ButtonBuilder>()

  if (totalPages > 1) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`queue_page_${currentPage - 1}`)
        .setLabel('Previous')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId(`queue_page_${currentPage + 1}`)
        .setLabel('Next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1),
    )
  }

  if (tracks.length > 0) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId('queue_clear_all')
        .setLabel('Clear Queue')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
    )
  }

  if (navRow.components.length > 0) {
    components.push(navRow)
  }

  return { embeds: [embed], components }
}

export function createPlaylistEmbed(
  playlist: PlaylistInfo,
  tracks: Track[],
  requestedBy: User,
): EmbedMessageData {
  const totalSeconds = tracks.reduce((total, track) => {
    const parts = (track.duration || '0:00').split(':').map(Number)
    if (parts.length === 3) return total + parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return total + parts[0] * 60 + parts[1]
    return total
  }, 0)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const previewCount = Math.min(tracks.length, 5)
  const trackPreview = tracks
    .slice(0, previewCount)
    .map((track, i) => `**${i + 1}.** ${track.title} (${track.duration || 'N/A'})`)
    .join('\n')
  const remaining = tracks.length - previewCount
  const previewText =
    remaining > 0
      ? `${trackPreview}\n*...and ${remaining} more track${remaining !== 1 ? 's' : ''}*`
      : trackPreview

  const embed = new EmbedBuilder()
    .setColor('#97CE4C')
    .setTitle('Playlist Added')
    .setDescription(`**[${playlist.title}](${playlist.url})**`)
    .addFields(
      { name: 'Tracks', value: `${tracks.length}`, inline: true },
      { name: 'Duration', value: totalDuration, inline: true },
      { name: 'Requested by', value: requestedBy?.tag || 'Unknown', inline: true },
      { name: 'Track List', value: previewText, inline: false },
    )
    .setTimestamp()

  if (playlist.thumbnail) {
    embed.setThumbnail(playlist.thumbnail)
  }

  return { embeds: [embed], components: [] }
}
