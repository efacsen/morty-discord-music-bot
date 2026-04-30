# ================================================
# Morty Music Bot - Windows Installer
# Downloads portable Node.js, FFmpeg, and yt-dlp
# No admin rights or system installs needed!
# ================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue" # Speeds up Invoke-WebRequest

# --- Configuration ---
$NodeVersion = "20.18.0"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$TempDir = Join-Path $RuntimeDir "temp"

$NodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
$FFmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$YtDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"

# --- Helper Functions ---
function Write-Step($step, $total, $message) {
    Write-Host ""
    Write-Host "  [$step/$total] $message" -ForegroundColor Cyan
}

function Write-Ok($message) {
    Write-Host "        $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "        $message" -ForegroundColor Gray
}

function Write-Err($message) {
    Write-Host "        $message" -ForegroundColor Red
}

function Download-File($url, $output, $description) {
    Write-Info "Downloading $description..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Ok "Downloaded $description"
    }
    catch {
        Write-Err "Failed to download $description"
        Write-Err "URL: $url"
        Write-Err "Error: $_"
        Write-Err ""
        Write-Err "If the download keeps failing, manually download from the URL above"
        Write-Err "and place it in: $output"
        throw
    }
}

# --- Banner ---
Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   M   M  OOO  RRRR  TTTTT Y   Y" -ForegroundColor Cyan
Write-Host "   MM MM O   O R   R   T    Y Y" -ForegroundColor Cyan
Write-Host "   M M M O   O RRRR    T     Y" -ForegroundColor Cyan
Write-Host "   M   M O   O R  R    T     Y" -ForegroundColor Cyan
Write-Host "   M   M  OOO  R   R   T     Y" -ForegroundColor Cyan
Write-Host ""
Write-Host "     Discord Music Bot v3.0.0" -ForegroundColor Cyan
Write-Host '     "Oh geez, l-let me set this up for you!"' -ForegroundColor Yellow
Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This will download everything needed to run the" -ForegroundColor White
Write-Host "  bot. No admin rights required!" -ForegroundColor White
Write-Host ""
Write-Host "  Files will be saved to: runtime\" -ForegroundColor Gray
Write-Host ""

# Create directories
if (!(Test-Path $RuntimeDir)) { New-Item -ItemType Directory -Path $RuntimeDir | Out-Null }
if (!(Test-Path $TempDir)) { New-Item -ItemType Directory -Path $TempDir | Out-Null }

# --- Step 1: Node.js ---
Write-Step 1 5 "Installing Node.js v$NodeVersion (portable)..."

$NodeDir = Join-Path $RuntimeDir "node"

if (Test-Path (Join-Path $NodeDir "node.exe")) {
    Write-Ok "Already installed, skipping."
}
else {
    $nodeZip = Join-Path $TempDir "node.zip"
    Download-File $NodeUrl $nodeZip "Node.js v$NodeVersion"

    Write-Info "Extracting..."
    Expand-Archive -Path $nodeZip -DestinationPath $TempDir -Force
    $extractedDir = Get-ChildItem -Path $TempDir -Directory | Where-Object { $_.Name -match "^node-v" } | Select-Object -First 1
    if ($extractedDir) {
        if (Test-Path $NodeDir) { Remove-Item $NodeDir -Recurse -Force }
        Move-Item -Path $extractedDir.FullName -Destination $NodeDir
    }
    Remove-Item $nodeZip -Force -ErrorAction SilentlyContinue
    Write-Ok "Node.js installed to runtime\node\"
}

# --- Step 2: FFmpeg ---
Write-Step 2 5 "Installing FFmpeg..."

$ffmpegExe = Join-Path $RuntimeDir "ffmpeg.exe"

if (Test-Path $ffmpegExe) {
    Write-Ok "Already installed, skipping."
}
else {
    $ffmpegZip = Join-Path $TempDir "ffmpeg.zip"
    Download-File $FFmpegUrl $ffmpegZip "FFmpeg"

    Write-Info "Extracting (this may take a moment)..."
    Expand-Archive -Path $ffmpegZip -DestinationPath $TempDir -Force
    $ffmpegDir = Get-ChildItem -Path $TempDir -Directory | Where-Object { $_.Name -match "ffmpeg" } | Select-Object -First 1
    if ($ffmpegDir) {
        $binDir = Join-Path $ffmpegDir.FullName "bin"
        Copy-Item (Join-Path $binDir "ffmpeg.exe") -Destination $RuntimeDir
        Copy-Item (Join-Path $binDir "ffprobe.exe") -Destination $RuntimeDir -ErrorAction SilentlyContinue
        Remove-Item $ffmpegDir.FullName -Recurse -Force
    }
    Remove-Item $ffmpegZip -Force -ErrorAction SilentlyContinue
    Write-Ok "FFmpeg installed to runtime\"
}

# --- Step 3: yt-dlp ---
Write-Step 3 5 "Installing yt-dlp..."

$ytdlpExe = Join-Path $RuntimeDir "yt-dlp.exe"

if (Test-Path $ytdlpExe) {
    Write-Ok "Already installed, skipping."
}
else {
    Download-File $YtDlpUrl $ytdlpExe "yt-dlp"
    Write-Ok "yt-dlp installed to runtime\"
}

# --- Step 4: npm install ---
Write-Step 4 5 "Installing bot dependencies (npm install)..."

$npmCmd = Join-Path $NodeDir "npm.cmd"
$nodeExe = Join-Path $NodeDir "node.exe"

# Set PATH so npm can find node
$env:PATH = "$NodeDir;$RuntimeDir;$env:PATH"

Push-Location $ProjectRoot
try {
    & $npmCmd install --no-fund --no-audit 2>&1 | ForEach-Object { Write-Info $_ }
    Write-Ok "Dependencies installed"
}
catch {
    Write-Err "npm install failed: $_"
    Write-Err "Try running 'npm install' manually after setup."
}
finally {
    Pop-Location
}

# --- Step 5: Bot Configuration ---
Write-Step 5 5 "Bot configuration..."

$envFile = Join-Path $ProjectRoot ".env"

if (Test-Path $envFile) {
    Write-Ok ".env file already exists"
    $reconfig = Read-Host "        Do you want to reconfigure? (y/N)"
    if ($reconfig -ne "y" -and $reconfig -ne "Y") {
        Write-Info "Keeping existing configuration."
    }
    else {
        Remove-Item $envFile
        # Fall through to config
        $needConfig = $true
    }
}
else {
    $needConfig = $true
}

if ($needConfig) {
    Write-Host ""
    Write-Info "Launching interactive env onboarding..."
    & (Join-Path $PSScriptRoot "onboard.ps1")
}

# --- Cleanup temp ---
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue }

# --- Done ---
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "           Setup Complete!" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start the bot, double-click:" -ForegroundColor White
Write-Host "    start.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To stop the bot:" -ForegroundColor White
Write-Host "    Close the window, or double-click stop.bat" -ForegroundColor Yellow
Write-Host ""
