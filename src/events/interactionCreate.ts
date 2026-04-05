import type { Interaction } from 'discord.js'

import { handlePlayerButton } from '../handlers/buttonHandler.js'
import type { EventModule } from '../types/index.js'

const event: EventModule = {
  name: 'interactionCreate',
  async execute(...args: unknown[]): Promise<void> {
    const interaction = args[0] as Interaction

    // Handle button interactions
    if (interaction.isButton()) {
      if (
        interaction.customId.startsWith('player_') ||
        interaction.customId.startsWith('queue_')
      ) {
        await handlePlayerButton(interaction)
        return
      }
    }

    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return

    console.log(
      `[Command] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name}`,
    )

    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`)
      return
    }

    try {
      await command.execute(interaction)
      console.log(`[Command] /${interaction.commandName} executed successfully`)
    } catch (error) {
      console.error(`❌ Error executing ${interaction.commandName}:`, error)

      try {
        const errorMessage = {
          content: '❌ There was an error executing this command!',
          flags: 64 as const,
        }

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage)
        } else {
          await interaction.reply(errorMessage)
        }
      } catch (replyError) {
        // Interaction expired or already acknowledged — just log it
        console.error(
          '[Command] Could not send error reply:',
          replyError instanceof Error ? replyError.message : String(replyError),
        )
      }
    }
  },
}

export default event
