FROM node:20-alpine AS base

# Install build dependencies for mediasoup
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    openssl-dev \
    libnice \
    libnice-dev \
    usrsctp-dev \
    libsrtp-dev \
    openssl \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    openssl \
    ca-certificates \
    libnice \
    usrsctp \
    libsrtp

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from base stage
COPY --from=base --chown=nodejs:nodejs /app/dist ./dist
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nodejs:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose ports
EXPOSE 443
EXPOSE 10000-60000/udp

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:443/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
