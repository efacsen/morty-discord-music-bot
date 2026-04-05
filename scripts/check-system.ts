import { exec } from 'child_process'
import { existsSync } from 'fs'
import { platform } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)

console.log('🔍 Checking system requirements...\n')
console.log(`Platform: ${platform()}\n`)

let allChecksPassed = true

// Check Node.js
try {
  const { stdout } = await execAsync('node --version')
  const version = stdout.trim()
  const majorVersion = parseInt(version.split('.')[0].replace('v', ''))

  if (majorVersion >= 18) {
    console.log(`✅ Node.js: ${version}`)
  } else {
    console.log(`⚠️  Node.js: ${version} (Need v18 or higher)`)
    console.log('   Update Node.js: https://nodejs.org/\n')
    allChecksPassed = false
  }
} catch {
  console.log('❌ Node.js: Not found!')
  console.log('   Install from: https://nodejs.org/\n')
  allChecksPassed = false
}

// Check npm
try {
  const { stdout } = await execAsync('npm --version')
  console.log(`✅ npm: ${stdout.trim()}`)
} catch {
  console.log('❌ npm: Not found!')
  console.log('   npm should come with Node.js\n')
  allChecksPassed = false
}

// Check FFmpeg
try {
  await execAsync('ffmpeg -version')
  console.log('✅ FFmpeg: Installed')
} catch {
  console.log('❌ FFmpeg: Not found!\n')
  console.log('⚠️  FFmpeg is REQUIRED for audio playback!')
  console.log('   Installation instructions:\n')

  if (platform() === 'win32') {
    console.log('   Windows:')
    console.log('   - Using Chocolatey: choco install ffmpeg')
    console.log('   - Or download from: https://ffmpeg.org/download.html\n')
  } else if (platform() === 'darwin') {
    console.log('   macOS:')
    console.log('   - Using Homebrew: brew install ffmpeg\n')
  } else {
    console.log('   Linux:')
    console.log('   - Ubuntu/Debian: sudo apt install ffmpeg')
    console.log('   - Fedora: sudo dnf install ffmpeg')
    console.log('   - Arch: sudo pacman -S ffmpeg\n')
  }

  allChecksPassed = false
}

// Check yt-dlp
try {
  const { stdout } = await execAsync('yt-dlp --version')
  console.log(`✅ yt-dlp: ${stdout.trim()}`)
} catch {
  console.log('❌ yt-dlp: Not found!')
  console.log('   Install from: https://github.com/yt-dlp/yt-dlp#installation\n')
  allChecksPassed = false
}

// Check .env file
if (existsSync('.env')) {
  console.log('✅ .env file: Exists')

  try {
    const { default: dotenv } = await import('dotenv')
    dotenv.config()

    if (process.env.DISCORD_CLIENT_TOKEN) {
      console.log('   ✅ DISCORD_CLIENT_TOKEN is set')
    } else {
      console.log('   ⚠️  DISCORD_CLIENT_TOKEN is not set in .env')
      allChecksPassed = false
    }

    if (process.env.DISCORD_CLIENT_ID) {
      console.log('   ✅ DISCORD_CLIENT_ID is set')
    } else {
      console.log('   ⚠️  DISCORD_CLIENT_ID is not set in .env')
      allChecksPassed = false
    }
  } catch {
    console.log('   ⚠️  Error reading .env file')
  }
} else {
  console.log('⚠️  .env file: Not found')
  console.log('   Create .env file from .env.example:')

  if (platform() === 'win32') {
    console.log('   - Windows: Copy-Item .env.example .env')
  } else {
    console.log('   - macOS/Linux: cp .env.example .env')
  }

  console.log('   Then fill in your Discord bot credentials\n')
  allChecksPassed = false
}

// Check node_modules
if (existsSync('node_modules')) {
  console.log('✅ Dependencies: Installed')
} else {
  console.log('⚠️  Dependencies: Not installed')
  console.log('   Run: npm install\n')
  allChecksPassed = false
}

// Check source files
console.log('\n📁 Checking project structure...')

const requiredFiles = [
  'src/index.ts',
  'src/commands/play.ts',
  'src/events/ready.ts',
  'src/events/interactionCreate.ts',
  'package.json',
]

for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} (missing)`)
    allChecksPassed = false
  }
}

// Final summary
console.log('\n' + '='.repeat(50))
if (allChecksPassed) {
  console.log("✅ All checks passed! You're ready to run the bot.")
  console.log('\nNext steps:')
  console.log('1. Make sure .env has your Discord bot token')
  console.log('2. Run: npm run build && npm start')
  console.log('3. Invite bot to your server')
  console.log('4. Use /play in a voice channel!')
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.')
  console.log('\nFor detailed setup instructions, see README.md')
}
console.log('='.repeat(50))

process.exit(allChecksPassed ? 0 : 1)
