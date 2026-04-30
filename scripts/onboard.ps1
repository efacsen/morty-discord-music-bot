# ================================================
# Discord Music Bot - Env Onboarding
# Creates or replaces .env with plain-language prompts
# ================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $ProjectRoot ".env"

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Ok($message) {
    Write-Host "[OK]   $message" -ForegroundColor Green
}

function Write-Warn($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Prompt-Required($label) {
    while ($true) {
        $value = Read-Host $label
        if (![string]::IsNullOrWhiteSpace($value)) {
            return $value.Trim()
        }
        Write-Warn "This field is required."
    }
}

function Prompt-Optional($label) {
    $value = Read-Host $label
    return $value.Trim()
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Discord Music Bot - Env Onboarding" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "This will create or replace your .env file."
Write-Info "You only need a few Discord values to get started."
Write-Host ""

if (Test-Path $envFile) {
    Write-Warn ".env already exists."
    $overwrite = Read-Host "Replace it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Info "Keeping existing .env. No changes made."
        exit 0
    }
}

Write-Host ""
Write-Host "How will you run the bot?"
Write-Host "  1) Docker (recommended)"
Write-Host "  2) Local Node.js"
$runModeChoice = Read-Host "Choose 1 or 2 [1]"
if ($runModeChoice -eq "2") {
    $runMode = "local"
}
else {
    $runMode = "docker"
}

Write-Host ""
Write-Info "Get these from https://discord.com/developers/applications"
$token = Prompt-Required "Discord Bot Token"
$clientId = Prompt-Required "Discord Application ID"
$guildId = Prompt-Optional "Discord Server ID (optional, but recommended)"

$imageName = ""
if ($runMode -eq "docker") {
    Write-Host ""
    Write-Info "Docker needs the GHCR image name to pull."
    Write-Info "Example: owner/discord-music-bot"
    $imageName = Prompt-Optional "Docker image name"
    if ($imageName.StartsWith("ghcr.io/")) {
        $imageName = $imageName.Substring(8)
        Write-Info "Removed ghcr.io/ prefix. Stored as: $imageName"
    }
}

$useCookies = $false
$cookieMode = ""
$cookieValue = ""

Write-Host ""
$cookieReply = Read-Host "Do you want to set up YouTube cookies now? (y/N)"
if ($cookieReply -eq "y" -or $cookieReply -eq "Y") {
    $useCookies = $true

    if ($runMode -eq "docker") {
        $cookieMode = "file"
        $cookieValue = "/cookies/cookies.txt"
        Write-Info "Docker will use: YTDLP_COOKIES_FILE=/cookies/cookies.txt"
        Write-Info "Put your exported cookies.txt file in the repo's cookies folder."
    }
    else {
        Write-Host ""
        Write-Host "For local setups, how do you want to provide cookies?"
        Write-Host "  1) cookies.txt file"
        Write-Host "  2) Read from browser session"
        $localCookieMode = Read-Host "Choose 1 or 2 [1]"

        if ($localCookieMode -eq "2") {
            $cookieMode = "browser"
            Write-Info "Supported examples: chrome, firefox, safari, edge"
            $cookieValue = Prompt-Required "Browser name"
        }
        else {
            $cookieMode = "file"
            $cookieValue = Prompt-Optional "Path to cookies.txt [./cookies.txt]"
            if ([string]::IsNullOrWhiteSpace($cookieValue)) {
                $cookieValue = "./cookies.txt"
            }
        }
    }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Discord Bot Configuration")
$lines.Add("# Required")
$lines.Add("DISCORD_CLIENT_TOKEN=$token")
$lines.Add("DISCORD_CLIENT_ID=$clientId")

if (![string]::IsNullOrWhiteSpace($guildId)) {
    $lines.Add("")
    $lines.Add("# Recommended - makes slash commands appear faster while you set things up")
    $lines.Add("DISCORD_GUILD_ID=$guildId")
}
else {
    $lines.Add("")
    $lines.Add("# Recommended - makes slash commands appear faster while you set things up")
    $lines.Add("# DISCORD_GUILD_ID=your_server_id_here")
}

if ($runMode -eq "docker") {
    $lines.Add("")
    $lines.Add("# Docker image to pull")
    if (![string]::IsNullOrWhiteSpace($imageName)) {
        $lines.Add("IMAGE_NAME=$imageName")
    }
    else {
        $lines.Add("# IMAGE_NAME=owner/discord-music-bot")
    }
}

$lines.Add("")
if ($useCookies) {
    if ($cookieMode -eq "browser") {
        $lines.Add("# Optional - use browser session cookies for YouTube requests")
        $lines.Add("YTDLP_COOKIES_BROWSER=$cookieValue")
    }
    else {
        $lines.Add("# Optional - use exported cookies.txt for YouTube requests")
        $lines.Add("YTDLP_COOKIES_FILE=$cookieValue")
    }
}
elseif ($runMode -eq "docker") {
    $lines.Add("# Optional - only add if some YouTube videos fail or return HTTP 403")
    $lines.Add("# YTDLP_COOKIES_FILE=/cookies/cookies.txt")
}
else {
    $lines.Add("# Optional - only add if some YouTube videos fail or return HTTP 403")
    $lines.Add("# YTDLP_COOKIES_FILE=./cookies.txt")
    $lines.Add("# YTDLP_COOKIES_BROWSER=chrome")
}

Set-Content -Path $envFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Ok ".env created"

if ($runMode -eq "docker" -and [string]::IsNullOrWhiteSpace($imageName)) {
    Write-Warn "Docker image name was left blank."
    Write-Warn "Set IMAGE_NAME in .env before running docker compose pull."
}

Write-Host ""
Write-Info "Next steps:"
if ($runMode -eq "docker") {
    Write-Host "  1. If needed, edit .env"
    Write-Host "  2. Run: docker compose pull"
    Write-Host "  3. Run: docker compose up -d"
}
else {
    Write-Host "  1. Run: npm run build"
    Write-Host "  2. Run: npm start"
}
Write-Host ""
