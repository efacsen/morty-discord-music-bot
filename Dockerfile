# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Native addon compilation tools (mediaplex, @snazzah/davey use N-API)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Strip dev dependencies — production image will copy this pruned node_modules
RUN npm prune --omit=dev

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# ffmpeg: audio processing
# python3 + py3-pip: required to run yt-dlp (pip-installed Python script)
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Copy compiled JS and pruned production node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Cache directory for discord-player
RUN mkdir -p .discord-player

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "dist/index.js"]
