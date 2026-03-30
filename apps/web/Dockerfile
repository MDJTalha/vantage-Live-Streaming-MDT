# VANTAGE Web Frontend
FROM node:20.12.0-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY packages ./packages

# Build Next.js
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM gcr.io/distroless/nodejs20-debian12

# Production image
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy built application
COPY --from=base --chown=65534:65534 /app/apps/web/.next ./.next
COPY --from=base --chown=65534:65534 /app/apps/web/public ./public
COPY --from=base --chown=65534:65534 /app/apps/web/package.json ./

USER nonroot

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
