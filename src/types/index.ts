import type {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
  TextBasedChannel,
  User,
} from 'discord.js'

export interface CommandModule {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface EventModule {
  name: string
  once?: boolean
  execute: (...args: unknown[]) => Promise<void> | void
}

export interface QueueMetadata {
  channel: TextBasedChannel
  requestedBy: User
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>
  }
}
