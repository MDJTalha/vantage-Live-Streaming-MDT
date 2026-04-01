# VANTAGE Media Server - Production Dockerfile
FROM node:25.8.2-alpine AS builder

# Install build dependencies for mediasoup
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    openssl-dev \
    libc6-compat \
    ca-certificates

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy media-server package
COPY apps/media-server/package*.json ./apps/media-server/
COPY packages ./packages

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/media-server ./apps/media-server
COPY packages ./packages

# Build TypeScript
WORKDIR /app/apps/media-server
RUN npx turbo run build --filter=media-server... --no-cache

# Production image
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app/apps/media-server

# Copy built application
COPY --from=builder --chown=65534:65534 /app/apps/media-server/dist ./dist
COPY --from=builder --chown=65534:65534 /app/apps/media-server/node_modules ./node_modules
COPY --from=builder --chown=65534:65534 /app/apps/media-server/package.json ./
COPY --from=builder --chown=65534:65534 /app/node_modules ./../../node_modules
COPY --from=builder --chown=65534:65534 /app/packages ./../../packages

USER nonroot

EXPOSE 443
EXPOSE 10000-60000/udp

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:443/health || exit 1

CMD ["node", "dist/index.js"]
