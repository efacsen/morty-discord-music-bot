import type { ButtonInteraction } from 'discord.js'
import { QueueRepeatMode, type GuildQueue, useQueue } from 'discord-player'

import { createPlayerEmbed, createQueueEmbed } from '../utils/createPlayerEmbed.js'
import type { QueueMetadata } from '../types/index.js'

/**
 * Handle button interactions for player controls
 * @param {ButtonInteraction} interaction
 */
export async function handlePlayerButton(interaction: ButtonInteraction): Promise<void> {
  const queue = useQueue<QueueMetadata>(interaction.guild!.id)

  if (!queue) {
    await interaction.reply({
      content: '❌ No music is currently playing!',
      ephemeral: true,
    })
    return
  }

  try {
    // Queue management buttons (page/remove/clear) need deferUpdate to edit
    // the existing queue message. Player control buttons need deferReply for
    // a new ephemeral response.
    const isQueueButton =
      interaction.customId.startsWith('queue_page_') ||
      interaction.customId.startsWith('queue_remove_') ||
      interaction.customId === 'queue_clear_all'

    if (isQueueButton) {
      await interaction.deferUpdate()
    } else {
      await interaction.deferReply({ ephemeral: true })
    }

    switch (interaction.customId) {
      case 'player_pause':
        if (queue.node.isPaused()) {
          queue.node.resume()
          await interaction.editReply('▶️ Resumed playback')
        } else {
          queue.node.pause()
          await interaction.editReply('⏸️ Paused playback')
        }
        // Update the now playing message to reflect pause state
        await updateNowPlayingMessage(interaction, queue)
        break

      case 'player_skip':
        if (queue.tracks.data.length === 0) {
          await interaction.editReply('❌ No more songs in queue')
        } else {
          const skipped = queue.currentTrack!.title
          queue.node.skip()
          await interaction.editReply(`⏭️ Skipped: **${skipped}**`)
        }
        break

      case 'player_stop':
        queue.delete()
        await interaction.editReply('⏹️ Stopped playback and cleared queue')
        break

      case 'player_shuffle':
        if (queue.tracks.data.length === 0) {
          await interaction.editReply('❌ Queue is empty')
        } else {
          queue.tracks.shuffle()
          await interaction.editReply(`🔀 Shuffled ${queue.tracks.data.length} songs`)
          // Update now playing message to show new queue count
          await updateNowPlayingMessage(interaction, queue)
        }
        break

      case 'player_loop': {
        // Cycle through loop modes: 0 (off) → 1 (track) → 2 (queue) → 0
        const currentMode = queue.repeatMode
        let newMode: QueueRepeatMode
        let modeText: string

        if (currentMode === 0) {
          newMode = QueueRepeatMode.TRACK // Loop track
          modeText = '🔁 Loop: Track'
        } else if (currentMode === 1) {
          newMode = QueueRepeatMode.QUEUE // Loop queue
          modeText = '🔁 Loop: Queue'
        } else {
          newMode = QueueRepeatMode.OFF // Loop off
          modeText = '🔁 Loop: Off'
        }

        queue.setRepeatMode(newMode)
        await interaction.editReply(modeText)
        // Update now playing message to show new loop mode
        await updateNowPlayingMessage(interaction, queue)
        break
      }

      case 'player_queue': {
        // Show queue in ephemeral message
        const queueEmbed = createQueueEmbed(queue, 0)
        await interaction.editReply(queueEmbed)
        break
      }

      default:
        // Handle queue pagination and removal buttons
        if (interaction.customId.startsWith('queue_page_')) {
          const page = parseInt(interaction.customId.split('_')[2], 10)
          const pageEmbed = createQueueEmbed(queue, page)
          await interaction.editReply(pageEmbed)
        } else if (interaction.customId.startsWith('queue_remove_')) {
          const position = parseInt(interaction.customId.split('_')[2], 10)
          const track = queue.tracks.data[position]

          if (!track) {
            await interaction.editReply({
              content: '❌ Track not found in queue',
              embeds: [],
              components: [],
            })
            return
          }

          queue.node.remove(position)
          // Show updated queue instead of just a confirmation message
          const updatedEmbed = createQueueEmbed(queue, 0)
          await interaction.editReply(updatedEmbed)
        } else if (interaction.customId === 'queue_clear_all') {
          queue.tracks.clear()
          await interaction.editReply({
            content: '🗑️ Queue cleared!',
            embeds: [],
            components: [],
          })
        } else {
          await interaction.editReply('❌ Unknown button action')
        }
    }
  } catch (error) {
    console.error('[ButtonHandler] Error handling button:', error)
    const errorMsg = '❌ An error occurred while processing your request'
    await interaction
      .editReply({ content: errorMsg, embeds: [], components: [] })
      .catch(console.error)
  }
}

/**
 * Update the now playing message with current queue state
 * @param {ButtonInteraction} interaction
 * @param {Queue} queue
 */
async function updateNowPlayingMessage(
  interaction: ButtonInteraction,
  queue: GuildQueue<QueueMetadata>,
): Promise<void> {
  try {
    const messageData = createPlayerEmbed(queue.currentTrack!, queue)
    // Try to update the original message
    if (interaction.message) {
      await interaction.message.edit(messageData)
    }
  } catch (error) {
    console.error('[ButtonHandler] Error updating now playing message:', error)
  }
}
