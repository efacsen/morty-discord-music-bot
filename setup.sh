#!/bin/bash

# Morty Music Bot - Automated Setup Script (macOS/Linux)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

echo ""
echo -e "${CYAN}"
cat << 'EOF'
  __  __            _
 |  \/  | ___  _ __| |_ _   _
 | |\/| |/ _ \| '__| __| | | |
 | |  | | (_) | |  | |_| |_| |
 |_|  |_|\___/|_|   \__|\__, |
                         |___/
EOF
echo -e "${NC}"
echo -e "  ${CYAN}Discord Music Bot v3.0.0${NC}"
echo -e "  ${YELLOW}\"Oh geez, l-let me set this up for you!\"${NC}"
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    print_info "Detected: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    print_info "Detected: Linux"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Step 1: Check/Install Homebrew (macOS only)
if [ "$OS" == "macos" ]; then
    echo ""
    print_info "Step 1/6: Checking Homebrew..."
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Apple Silicon
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi

        print_success "Homebrew installed"
    else
        print_success "Homebrew is already installed"
    fi
fi

# Step 2: Check/Install Node.js
echo ""
print_info "Step 2/6: Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing..."
    if [ "$OS" == "macos" ]; then
        brew install node
    else
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    print_success "Node.js installed"
else
    NODE_VERSION=$(node -v)
    print_success "Node.js is already installed ($NODE_VERSION)"
fi

# Step 3: Check/Install FFmpeg
echo ""
print_info "Step 3/6: Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    print_warning "FFmpeg not found. Installing..."
    if [ "$OS" == "macos" ]; then
        brew install ffmpeg
    else
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    fi
    print_success "FFmpeg installed"
else
    FFMPEG_VERSION=$(ffmpeg -version | head -n1 | cut -d' ' -f3)
    print_success "FFmpeg is already installed ($FFMPEG_VERSION)"
fi

# Step 4: Check/Install yt-dlp
echo ""
print_info "Step 4/6: Checking yt-dlp..."
if ! command -v yt-dlp &> /dev/null; then
    print_warning "yt-dlp not found. Installing..."
    if [ "$OS" == "macos" ]; then
        brew install yt-dlp
    else
        sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
        sudo chmod a+rx /usr/local/bin/yt-dlp
    fi
    print_success "yt-dlp installed"
else
    YTDLP_VERSION=$(yt-dlp --version)
    print_success "yt-dlp is already installed ($YTDLP_VERSION)"
fi

# Step 5: Install Node.js dependencies
echo ""
print_info "Step 5/6: Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Step 6: Configure bot
echo ""
print_info "Step 6/6: Bot configuration..."

if [ -f ".env" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to reconfigure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping configuration"
    else
        rm .env
    fi
fi

if [ ! -f ".env" ]; then
    echo ""
    print_info "Let's configure your Discord bot!"
    echo ""
    print_info "You'll need to create a Discord bot if you haven't already:"
    print_info "1. Go to https://discord.com/developers/applications"
    print_info "2. Click 'New Application' and give it a name"
    print_info "3. Go to 'Bot' section and click 'Add Bot'"
    print_info "4. Copy the bot token"
    print_info "5. Go to OAuth2 > URL Generator"
    print_info "   - Select 'bot' and 'applications.commands'"
    print_info "   - Select permissions: Send Messages, Connect, Speak"
    print_info "   - Copy the generated URL and invite bot to your server"
    echo ""

    read -p "Enter your Discord Bot Token: " DISCORD_TOKEN
    read -p "Enter your Discord Client ID (Application ID): " CLIENT_ID
    read -p "Enter your Discord Guild ID (Server ID): " GUILD_ID

    cat > .env << EOF
# Discord Bot Configuration
DISCORD_CLIENT_TOKEN=$DISCORD_TOKEN
DISCORD_CLIENT_ID=$CLIENT_ID
DISCORD_GUILD_ID=$GUILD_ID

# YouTube Configuration (Optional)
# YOUTUBE_COOKIE_PATH=./youtube_cookies.txt
EOF

    print_success ".env file created"
fi

# Final success message
echo ""
echo -e "${GREEN}"
cat << 'EOF'
  ================================================
           Setup Complete!
  ================================================
EOF
echo -e "${NC}"
print_success "All dependencies installed and configured!"
echo ""
print_info "To start the bot, run:"
echo -e "  ${GREEN}./start.sh${NC}"
echo ""
print_info "To stop the bot:"
echo -e "  ${GREEN}./stop.sh${NC}"
echo ""
echo -e "  ${YELLOW}\"Alright, w-we're good to go!\"${NC}"
echo ""
