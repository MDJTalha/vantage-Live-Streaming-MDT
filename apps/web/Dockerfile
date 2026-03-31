# VANTAGE Web Frontend - Multi-stage Build
FROM node:20.12.0-alpine AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package*.json ./
COPY turbo.json ./

# Copy all workspaces
COPY apps/web ./apps/web
COPY packages ./packages

# Install all dependencies (root + workspaces)
RUN npm ci --legacy-peer-deps

# Build the web app (includes building packages first via turbo)
RUN npx turbo run build --filter=web... --no-cache

# Production image
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app/apps/web

# Copy built application from builder
COPY --from=builder --chown=65534:65534 /app/apps/web/.next ./.next
COPY --from=builder --chown=65534:65534 /app/apps/web/public ./public
COPY --from=builder --chown=65534:65534 /app/apps/web/package.json ./package.json
COPY --from=builder --chown=65534:65534 /app/node_modules ./node_modules
COPY --from=builder --chown=65534:65534 /app/packages ./packages

USER nonroot

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
