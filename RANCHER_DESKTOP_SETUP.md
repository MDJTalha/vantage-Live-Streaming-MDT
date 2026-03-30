# 🐋 Rancher Desktop Setup for VANTAGE
**Date:** March 29, 2026  
**Purpose:** Start PostgreSQL and Redis databases

---

## ⚙️ STEP 1: Configure Rancher Desktop

### Open Rancher Desktop Application

1. **Launch Rancher Desktop** from Start Menu
2. **Go to Settings** (⚙️ icon)
3. **Configure Container Engine:**
   - Select **dockerd (moby)** OR **containerd**
   - If using containerd, we'll use `nerdctl` command
   - If using dockerd, we'll use `docker` command

4. **Enable Kubernetes** (optional, not needed for databases)
   - Can be disabled for now

5. **Click "Apply & Restart"**

---

## ⚙️ STEP 2: Add Docker to PATH

### Option A: Use Full Path (Immediate)

```bash
# Rancher Desktop docker location
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" --version

# Or for containerd mode
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\nerdctl.exe" --version
```

### Option B: Add to PATH (Permanent)

1. Open **System Properties** → **Environment Variables**
2. Under **System variables**, find **Path**
3. Click **Edit** → **New**
4. Add: `C:\Program Files\Rancher Desktop\resources\resources\win32\bin`
5. Click **OK** on all dialogs
6. **Restart Command Prompt**

---

## 🚀 STEP 3: Start Databases

### Using Docker Command (After PATH setup)

```bash
# Navigate to VANTAGE directory
cd c:\Projects\Live-Streaming-

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check status
docker-compose ps
```

### Using Full Path (Without PATH setup)

```batch
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" -f c:\Projects\Live-Streaming-\compose.yaml up -d postgres redis
```

---

## 📝 STEP 4: Verify Databases

### Check PostgreSQL

```bash
# Using docker-compose
docker-compose ps postgres

# Should show: Up (healthy)
```

### Check Redis

```bash
# Using docker-compose
docker-compose ps redis

# Should show: Up (healthy)
```

### Test Connections

```bash
# Test PostgreSQL
docker-compose exec postgres psql -U vantage -c "SELECT 1;"

# Test Redis
docker-compose exec redis redis-cli ping
# Should return: PONG
```

---

## 🔧 ALTERNATIVE: Manual Database Start

### Create docker-compose.override.yml

Create file: `c:\Projects\Live-Streaming-\docker-compose.override.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vantage-postgres
    environment:
      POSTGRES_USER: vantage
      POSTGRES_PASSWORD: vantage_password
      POSTGRES_DB: vantage
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vantage"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: vantage-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Start Services

```batch
# Using full path
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" -f c:\Projects\Live-Streaming-\compose.yaml up -d

# Or after adding to PATH
docker-compose up -d
```

---

## ✅ STEP 5: Run Database Migrations

Once databases are running:

```bash
cd c:\Projects\Live-Streaming-\apps\api

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

---

## 🎯 STEP 6: Start API Server

```bash
cd c:\Projects\Live-Streaming-\apps\api
npm run dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║   🎬 VANTAGE API Server                                   ║
║   Status: Running                                         ║
║   Port: 4000                                              ║
║   Environment: development                                ║
║                                                           ║
║   ✓ Security configuration validated                      ║
║   ✓ JWT Secret: Configured (32+ characters)               ║
║   ✓ Encryption Key: Configured (64 hex characters)        ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🔍 TROUBLESHOOTING

### Rancher Desktop Won't Start

**Solution:**
1. Close Rancher Desktop
2. Open Task Manager
3. End all Rancher Desktop processes
4. Restart Rancher Desktop as Administrator

### Docker Command Not Found

**Solution:**
```batch
# Use full path
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" ps

# Or check if containerd mode is selected in Rancher Desktop settings
```

### Containers Won't Start

**Check Logs:**
```bash
# Using full path
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" logs postgres
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" logs redis
```

### Database Connection Fails

**Verify Connection String in `.env.local`:**
```
DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
REDIS_URL=redis://localhost:6379
```

**Test Connection:**
```bash
# PostgreSQL
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" exec vantage-postgres psql -U vantage -c "SELECT 1;"

# Redis
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" exec vantage-redis redis-cli ping
```

---

## 📋 QUICK REFERENCE

### Rancher Desktop Commands

| Task | Command |
|------|---------|
| **Start all services** | `docker-compose up -d` |
| **Stop all services** | `docker-compose down` |
| **View logs** | `docker-compose logs -f` |
| **Check status** | `docker-compose ps` |
| **Restart service** | `docker-compose restart <service>` |

### Common Paths

| Resource | Path |
|----------|------|
| **Docker executable** | `C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe` |
| **Docker Compose** | `C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe` |
| **nerdctl (containerd)** | `C:\Program Files\Rancher Desktop\resources\resources\win32\bin\nerdctl.exe` |
| **VANTAGE project** | `c:\Projects\Live-Streaming-` |

---

## 🎉 SUCCESS CRITERIA

- [ ] Rancher Desktop running (whale icon in system tray)
- [ ] PostgreSQL container running (`docker-compose ps postgres`)
- [ ] Redis container running (`docker-compose ps redis`)
- [ ] Database migrations completed (`npx prisma migrate dev`)
- [ ] API server starts without errors
- [ ] Can access http://localhost:4000/health
- [ ] Can login at http://localhost:3000

---

## 📞 NEXT STEPS

1. **Configure Rancher Desktop** (5 minutes)
2. **Add Docker to PATH** (2 minutes)
3. **Start databases** (1 minute)
4. **Run migrations** (2 minutes)
5. **Start API server** (1 minute)
6. **Test login** (1 minute)

**Total Time:** ~12 minutes

---

*Rancher Desktop Setup Guide - March 29, 2026*
