#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

prompt_required() {
  local label="$1"
  local value=""

  while true; do
    read -r -p "$label: " value
    if [ -n "$value" ]; then
      printf '%s' "$value"
      return 0
    fi
    print_warning "This field is required."
  done
}

prompt_optional() {
  local label="$1"
  local value=""
  read -r -p "$label: " value
  printf '%s' "$value"
}

echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN} Discord Music Bot - Env Onboarding${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
print_info "This will create or replace your .env file."
print_info "You only need a few Discord values to get started."
echo ""

if [ -f ".env" ]; then
  print_warning ".env already exists."
  read -r -p "Replace it? (y/N): " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    print_info "Keeping existing .env. No changes made."
    exit 0
  fi
fi

echo ""
echo "How will you run the bot?"
echo "  1) Docker (recommended)"
echo "  2) Local Node.js"
read -r -p "Choose 1 or 2 [1]: " run_mode

if [ "$run_mode" = "2" ]; then
  RUN_MODE="local"
else
  RUN_MODE="docker"
fi

echo ""
print_info "Get these from https://discord.com/developers/applications"
DISCORD_TOKEN=$(prompt_required "Discord Bot Token")
CLIENT_ID=$(prompt_required "Discord Application ID")
GUILD_ID=$(prompt_optional "Discord Server ID (optional, but recommended)")

IMAGE_NAME=""
if [ "$RUN_MODE" = "docker" ]; then
  echo ""
  print_info "Docker needs the GHCR image name to pull."
  print_info "Example: owner/discord-music-bot"
  IMAGE_NAME=$(prompt_optional "Docker image name")
  if [[ "$IMAGE_NAME" == ghcr.io/* ]]; then
    IMAGE_NAME="${IMAGE_NAME#ghcr.io/}"
    print_info "Removed ghcr.io/ prefix. Stored as: $IMAGE_NAME"
  fi
fi

USE_COOKIES="no"
COOKIE_MODE=""
COOKIE_VALUE=""

echo ""
read -r -p "Do you want to set up YouTube cookies now? (y/N): " cookie_reply
if [[ "$cookie_reply" =~ ^[Yy]$ ]]; then
  USE_COOKIES="yes"

  if [ "$RUN_MODE" = "docker" ]; then
    COOKIE_MODE="file"
    COOKIE_VALUE="/cookies/cookies.txt"
    print_info "Docker will use: YTDLP_COOKIES_FILE=/cookies/cookies.txt"
    print_info "Put your exported cookies.txt file in the repo's cookies/ folder."
  else
    echo ""
    echo "For local setups, how do you want to provide cookies?"
    echo "  1) cookies.txt file"
    echo "  2) Read from browser session"
    read -r -p "Choose 1 or 2 [1]: " local_cookie_mode

    if [ "$local_cookie_mode" = "2" ]; then
      COOKIE_MODE="browser"
      print_info "Supported examples: chrome, firefox, safari, edge"
      COOKIE_VALUE=$(prompt_required "Browser name")
    else
      COOKIE_MODE="file"
      COOKIE_VALUE=$(prompt_optional "Path to cookies.txt [./cookies.txt]")
      if [ -z "$COOKIE_VALUE" ]; then
        COOKIE_VALUE="./cookies.txt"
      fi
    fi
  fi
fi

cat > .env <<EOF
# Discord Bot Configuration
# Required
DISCORD_CLIENT_TOKEN=$DISCORD_TOKEN
DISCORD_CLIENT_ID=$CLIENT_ID
EOF

if [ -n "$GUILD_ID" ]; then
  cat >> .env <<EOF

# Recommended - makes slash commands appear faster while you set things up
DISCORD_GUILD_ID=$GUILD_ID
EOF
else
  cat >> .env <<'EOF'

# Recommended - makes slash commands appear faster while you set things up
# DISCORD_GUILD_ID=your_server_id_here
EOF
fi

if [ "$RUN_MODE" = "docker" ]; then
  if [ -n "$IMAGE_NAME" ]; then
    cat >> .env <<EOF

# Docker image to pull
IMAGE_NAME=$IMAGE_NAME
EOF
  else
    cat >> .env <<'EOF'

# Docker image to pull
# IMAGE_NAME=owner/discord-music-bot
EOF
  fi
fi

if [ "$USE_COOKIES" = "yes" ]; then
  if [ "$COOKIE_MODE" = "browser" ]; then
    cat >> .env <<EOF

# Optional - use browser session cookies for YouTube requests
YTDLP_COOKIES_BROWSER=$COOKIE_VALUE
EOF
  else
    cat >> .env <<EOF

# Optional - use exported cookies.txt for YouTube requests
YTDLP_COOKIES_FILE=$COOKIE_VALUE
EOF
  fi
else
  if [ "$RUN_MODE" = "docker" ]; then
    cat >> .env <<'EOF'

# Optional - only add if some YouTube videos fail or return HTTP 403
# YTDLP_COOKIES_FILE=/cookies/cookies.txt
EOF
  else
    cat >> .env <<'EOF'

# Optional - only add if some YouTube videos fail or return HTTP 403
# YTDLP_COOKIES_FILE=./cookies.txt
# YTDLP_COOKIES_BROWSER=chrome
EOF
  fi
fi

echo ""
print_success ".env created"

if [ "$RUN_MODE" = "docker" ] && [ -z "$IMAGE_NAME" ]; then
  print_warning "Docker image name was left blank."
  print_warning "Set IMAGE_NAME in .env before running docker compose pull."
fi

echo ""
if [ "$RUN_MODE" = "docker" ]; then
  print_info "Next steps:"
  echo "  1. If needed, edit .env"
  echo "  2. Run: docker compose pull"
  echo "  3. Run: docker compose up -d"
else
  print_info "Next steps:"
  echo "  1. Run: npm run build"
  echo "  2. Run: npm start"
fi

echo ""
