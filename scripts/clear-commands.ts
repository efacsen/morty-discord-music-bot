import { REST, Routes } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.DISCORD_CLIENT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID

if (!token || !clientId) {
  console.error('❌ DISCORD_CLIENT_TOKEN and DISCORD_CLIENT_ID must be set in .env')
  process.exit(1)
}

const rest = new REST().setToken(token)

console.log('🗑️  Clearing all global commands...')

try {
  await rest.put(Routes.applicationCommands(clientId), { body: [] })
  console.log('✅ Successfully cleared all global commands!')
  console.log('   Commands in your guild will still work.')
} catch (error) {
  console.error('❌ Error clearing commands:', error)
  process.exit(1)
}

process.exit(0)
