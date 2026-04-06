# VANTAGE API Service - Production Dockerfile
FROM node:25.9.0-alpine AS builder

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ ca-certificates libc6-compat

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy all workspaces
COPY apps/api/package*.json ./apps/api/
COPY packages ./packages

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Build TypeScript
WORKDIR /app/apps/api
RUN npx turbo run build --filter=api... --no-cache

# Production image
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app/apps/api

# Copy built application
COPY --from=builder --chown=65534:65534 /app/apps/api/dist ./dist
COPY --from=builder --chown=65534:65534 /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=65534:65534 /app/apps/api/package.json ./
COPY --from=builder --chown=65534:65534 /app/node_modules ./../../node_modules
COPY --from=builder --chown=65534:65534 /app/packages ./../../packages

USER nonroot

EXPOSE 4000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
