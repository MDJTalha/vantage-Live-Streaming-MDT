# VANTAGE Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Install Link |
|------|---------|--------------|
| Node.js | >= 20.0.0 | https://nodejs.org |
| npm | >= 10.0.0 | https://npmjs.com |
| Docker | Latest | https://docker.com |
| Git | Latest | https://git-scm.com |

---

## Quick Start

### 1. Clone Repository

```bash
cd c:\Projects\Live-Streaming-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Copy environment template
copy .env.example .env.local
```

Edit `.env.local` and update values as needed.

### 4. Start Infrastructure (Docker)

```bash
# Start PostgreSQL, Redis, and Coturn (TURN server)
npm run docker:up

# Verify containers are running
docker ps
```

Expected output:
- `vantage-postgres` on port 5432
- `vantage-redis` on port 6379
- `vantage-coturn` on port 3478

### 5. Setup Database

```bash
# Navigate to API directory
cd apps\api

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed
```

### 6. Start Development Servers

```bash
# Go back to root
cd c:\Projects\Live-Streaming-

# Start all applications
npm run dev
```

---

## Access Points

| Service | URL | Port |
|---------|-----|------|
| Web App | http://localhost:3000 | 3000 |
| API Server | http://localhost:4000 | 4000 |
| WebSocket | ws://localhost:4000 | 4000 |
| PostgreSQL | localhost | 5432 |
| Redis | localhost | 6379 |

---

## Demo Credentials

After running the seed script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vantage.live | admin123 |
| Host | host@vantage.live | host123 |
| User | user@vantage.live | user123 |

**Demo Room Code:** `demo-room-001`

---

## Database Commands

```bash
cd apps\api

# Generate Prisma Client
npm run db:generate

# Create new migration
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed database
npm run db:seed

# Reset database (WARNING: deletes all data)
npm run db:reset

# Open Prisma Studio (Database GUI)
npm run db:studio
```

---

## Docker Commands

```bash
# Start all containers
npm run docker:up

# Stop all containers
npm run docker:down

# Rebuild containers
npm run docker:build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs postgres
```

---

## Development Commands

```bash
# Start all services (hot reload)
npm run dev

# Build all packages
npm run build

# Run linters
npm run lint

# Run tests
npm run test

# Format code
npm run format

# Clean build artifacts
npm run clean
```

---

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, 5432, or 6379 are in use:

```bash
# Windows - Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Prisma Client Errors

```bash
# Regenerate Prisma Client
cd apps\api
npm run db:generate
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

---

## Project Structure

```
VANTAGE/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # Express backend + Prisma
│   ├── media-server/     # Mediasoup SFU
│   └── mobile/           # Flutter app
├── packages/
│   ├── ui/               # Shared React components
│   ├── types/            # TypeScript types
│   ├── config/           # Shared configuration
│   └── utils/            # Shared utilities
├── infra/
│   └── docker/           # Docker configs
├── docs/                 # Documentation
└── package.json          # Root package (monorepo)
```

---

## Next Steps

1. ✅ **Setup Complete** - All services running
2. 📖 Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. 🗄️ Read [DATABASE.md](./docs/DATABASE.md)
4. 🚀 Start developing features

---

## Support

For issues or questions:
- Check documentation in `docs/`
- Review `README.md` for overview
- Check Docker logs for infrastructure issues
