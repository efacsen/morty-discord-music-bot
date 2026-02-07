#!/bin/bash

# Morty Music Bot - Stop Script (macOS/Linux)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} Morty Music Bot - Stopping...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if bot is running
if ! pgrep -f "node src/index.js" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Bot is not currently running."
    exit 0
fi

# Stop the bot
echo -e "${BLUE}ℹ${NC} Stopping all bot instances..."
pkill -f "node src/index.js"

# Wait a moment and verify
sleep 2

if pgrep -f "node src/index.js" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Some instances may still be running. Forcing shutdown..."
    pkill -9 -f "node src/index.js"
    sleep 1
fi

echo -e "${GREEN}✓${NC} Morty has left the building. Bye!"
echo ""
