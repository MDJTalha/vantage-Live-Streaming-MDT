# VANTAGE API Service - Production Dockerfile
FROM node:20.12.0-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ ca-certificates libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci --legacy-peer-deps --only=production

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Build TypeScript
WORKDIR /app/apps/api
RUN npm run build

# Production image
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app/apps/api

# Copy built application
COPY --from=base --chown=65534:65534 /app/apps/api/dist ./dist
COPY --from=base --chown=65534:65534 /app/apps/api/node_modules ./node_modules
COPY --from=base --chown=65534:65534 /app/apps/api/package.json ./

USER nonroot

EXPOSE 4000

CMD ["node", "dist/index.js"]
