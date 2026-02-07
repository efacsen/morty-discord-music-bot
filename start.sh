#!/bin/bash

# Morty Music Bot - Start Script (macOS/Linux)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
echo -e "  ${CYAN}Discord Music Bot v2.1.0${NC}"
echo -e "  ${YELLOW}\"Oh geez, h-here we go!\"${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗${NC} Error: .env file not found!"
    echo -e "${BLUE}ℹ${NC} Please run './setup.sh' first to configure the bot."
    exit 1
fi

# Check if bot is already running
if pgrep -f "node src/index.js" > /dev/null; then
    echo -e "${RED}✗${NC} Bot is already running!"
    echo -e "${BLUE}ℹ${NC} Use './stop.sh' to stop it first."
    exit 1
fi

# Start the bot
echo -e "${GREEN}✓${NC} Starting Morty Music Bot..."
echo -e "${BLUE}ℹ${NC} Press Ctrl+C to stop the bot"
echo ""

npm start
