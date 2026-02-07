import { handlePlayerButton } from '../handlers/buttonHandler.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('player_') || interaction.customId.startsWith('queue_')) {
                await handlePlayerButton(interaction);
                return;
            }
        }

        // Only handle slash commands
        if (!interaction.isChatInputCommand()) return;

        console.log(`[Command] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name}`);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`❌ No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
            console.log(`[Command] /${interaction.commandName} executed successfully`);
        } catch (error) {
            console.error(`❌ Error executing ${interaction.commandName}:`, error);

            const errorMessage = {
                content: '❌ There was an error executing this command!',
                ephemeral: true
            };

            // Handle different interaction states
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
