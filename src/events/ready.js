import { REST, Routes, ActivityType } from 'discord.js';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);

        // Set bot presence
        client.user.setPresence({
            activities: [{ name: 'Oh geez, music!', type: ActivityType.Listening }],
            status: 'online',
        });

        // Register slash commands
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST().setToken(process.env.DISCORD_CLIENT_TOKEN);

        try {
            console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

            // Register commands (guild or global based on environment)
            if (process.env.DISCORD_GUILD_ID) {
                // Guild commands (instant update, good for testing)
                const data = await rest.put(
                    Routes.applicationGuildCommands(
                        process.env.DISCORD_CLIENT_ID,
                        process.env.DISCORD_GUILD_ID
                    ),
                    { body: commands }
                );
                console.log(`✅ Successfully registered ${data.length} guild commands.`);
            } else {
                // Global commands (takes up to 1 hour to propagate)
                const data = await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                    { body: commands }
                );
                console.log(`✅ Successfully registered ${data.length} global commands.`);
            }
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }
    }
};
