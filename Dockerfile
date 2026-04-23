# ── Build-time platform args (populated by Docker buildx) ─────────────────────
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM --platform=$TARGETPLATFORM node:20-alpine AS production

# python3/make/g++ are fallback build tools if NAPI-RS prebuilts don't exist for musl ARM64
# ffmpeg: audio processing
RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app

# Install correct-arch prebuilts for TARGETPLATFORM (independent of builder node_modules)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS only — do NOT copy node_modules from builder
COPY --from=builder /app/dist ./dist

COPY entrypoint.sh ./

# Cache directory for discord-player
RUN mkdir -p .discord-player && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
