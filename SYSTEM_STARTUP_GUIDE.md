# 🚀 VANTAGE System Startup Guide
**Date:** March 29, 2026  
**Status:** System Starting...

---

## 📊 SYSTEM STATUS

### Services Starting:

| Service | Command | Port | Status |
|---------|---------|------|--------|
| **API Server** | `npm run dev` (apps/api) | 4000 | 🟡 Starting... |
| **Web App** | `npm run dev` (apps/web) | 3000 | 🟡 Starting... |
| **Media Server** | `npm run dev` (apps/media-server) | 4443 | 🟡 Starting... |
| **AI Services** | `npm run dev` (apps/ai-services) | 8000 | 🟡 Starting... |
| **PostgreSQL** | Docker | 5432 | ⚪ Pending |
| **Redis** | Docker | 6379 | ⚪ Pending |
| **Monitoring** | Docker Compose | 9090, 3001 | ⚪ Pending |

---

## 🔧 STARTUP COMMANDS

### 1. Start API Server
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
║   Health:   http://localhost:4000/health                  ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Start Web App
```bash
cd c:\Projects\Live-Streaming-\apps\web
npm run dev
```
**Expected Output:**
```
- ready started on http://localhost:3000
```

### 3. Start Media Server
```bash
cd c:\Projects\Live-Streaming-\apps\media-server
npm run dev
```
**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║   🎬 VANTAGE Media Server (SFU)                           ║
║   Status: Running                                         ║
║   Port: 4443                                              ║
╚═══════════════════════════════════════════════════════════╝
```

### 4. Start AI Services
```bash
cd c:\Projects\Live-Streaming-\apps\ai-services
npm run dev
```
**Expected Output:**
```
✓ AI Services started on port 8000
```

### 5. Start Database & Redis (Docker)
```bash
cd c:\Projects\Live-Streaming-
docker-compose up -d postgres redis
```

### 6. Start Monitoring (Optional)
```bash
cd c:\Projects\Live-Streaming-
docker-compose -f docker-compose.monitoring.yml up -d
```

---

## ✅ VERIFICATION CHECKLIST

### API Server (Port 4000)
- [ ] Health check: http://localhost:4000/health
- [ ] API root: http://localhost:4000/api/v1
- [ ] Auth endpoint: http://localhost:4000/api/v1/auth/login
- [ ] Rooms endpoint: http://localhost:4000/api/v1/rooms

### Web App (Port 3000)
- [ ] Home page: http://localhost:3000
- [ ] Login page: http://localhost:3000/auth/login
- [ ] Dashboard: http://localhost:3000/dashboard

### Media Server (Port 4443)
- [ ] Health check: http://localhost:4443/health
- [ ] Stats endpoint: http://localhost:4443/stats

### AI Services (Port 8000)
- [ ] Health check: http://localhost:8000/health
- [ ] Transcription: http://localhost:8000/transcribe

### Monitoring (Optional)
- [ ] Prometheus: http://localhost:9090
- [ ] Grafana: http://localhost:3001 (admin/admin)

---

## 🔍 TROUBLESHOOTING

### API Server Won't Start

**Error: Database connection failed**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check DATABASE_URL in .env.local
type .env.local | findstr DATABASE_URL
```

**Error: Port 4000 already in use**
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process
taskkill /F /PID <PID>
```

### Web App Won't Start

**Error: Module not found**
```bash
cd apps\web
npm install
npm run dev
```

### Media Server Won't Start

**Error: Mediasoup not installed**
```bash
cd apps\media-server
npm install
npm rebuild
```

**Error: Port 4443 already in use**
```bash
netstat -ano | findstr :4443
taskkill /F /PID <PID>
```

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    VANTAGE Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Web App    │    │  Mobile App  │                  │
│  │  (Next.js)   │    │   (Flutter)  │                  │
│  │  Port: 3000  │    │              │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                           │
│         └─────────┬─────────┘                           │
│                   │                                     │
│          ┌────────▼────────┐                           │
│          │  Load Balancer  │                           │
│          │   (Nginx)       │                           │
│          └────────┬────────┘                           │
│                   │                                     │
│    ┌──────────────┼──────────────┐                    │
│    │              │              │                    │
│ ┌──▼────┐   ┌─────▼─────┐  ┌────▼────┐               │
│ │  API  │   │   Media   │  │   AI    │               │
│ │Server │   │  Server   │  │ Services│               │
│ │:4000  │   │  :4443    │  │  :8000  │               │
│ └──┬────┘   └─────┬─────┘  └────┬────┘               │
│    │              │              │                    │
│    └──────────────┼──────────────┘                    │
│                   │                                     │
│          ┌────────▼────────┐                           │
│          │     Redis       │                           │
│          │   (Cache)       │                           │
│          │   Port: 6379    │                           │
│          └────────┬────────┘                           │
│                   │                                     │
│          ┌────────▼────────┐                           │
│          │  PostgreSQL     │                           │
│          │  (Database)     │                           │
│          │  Port: 5432     │                           │
│          └─────────────────┘                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK START (All-in-One)

### Create a startup script: `start-all.bat`

```batch
@echo off
echo ========================================
echo   Starting VANTAGE Platform
echo ========================================
echo.

REM Start API Server
echo [1/4] Starting API Server...
start "VANTAGE API" cmd /k "cd apps\api && npm run dev"

REM Wait for API to initialize
timeout /t 5 /nobreak >nul

REM Start Web App
echo [2/4] Starting Web App...
start "VANTAGE Web" cmd /k "cd apps\web && npm run dev"

REM Wait for web to initialize
timeout /t 5 /nobreak >nul

REM Start Media Server
echo [3/4] Starting Media Server...
start "VANTAGE Media" cmd /k "cd apps\media-server && npm run dev"

REM Wait for media to initialize
timeout /t 5 /nobreak >nul

REM Start AI Services
echo [4/4] Starting AI Services...
start "VANTAGE AI" cmd /k "cd apps\ai-services && npm run dev"

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Services:
echo   - API Server:      http://localhost:4000
echo   - Web App:         http://localhost:3000
echo   - Media Server:    http://localhost:4443
echo   - AI Services:     http://localhost:8000
echo   - Grafana:         http://localhost:3001
echo.
echo Press any key to exit...
pause >nul
```

---

## 📈 MONITORING DASHBOARD

### Access Grafana Dashboards

1. **Open Grafana:** http://localhost:3001
2. **Login:** admin / admin
3. **Import Dashboard:** `monitoring/grafana/dashboards/vantage-platform.json`

**Metrics Tracked:**
- API request rate
- API latency (P95, P99)
- WebSocket connections
- Database connections
- Redis memory usage
- Media server load
- AI service queue

---

## 🎉 SUCCESS CRITERIA

### All Services Running:
- [ ] API responds at http://localhost:4000/health
- [ ] Web app loads at http://localhost:3000
- [ ] Media server responds at http://localhost:4443/health
- [ ] AI services respond at http://localhost:8000/health
- [ ] PostgreSQL accessible on port 5432
- [ ] Redis accessible on port 6379

### Test User Flow:
1. [ ] Open http://localhost:3000
2. [ ] Register new account
3. [ ] Login successfully
4. [ ] Create a room
5. [ ] Join room with video/audio
6. [ ] Send chat message
7. [ ] Share screen

---

## 📞 SUPPORT

**Documentation:**
- `DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- `NEXT_STEPS_ACTION_PLAN.md` - Action items
- `SYSTEM_READY_STATE.md` - System status

**Logs:**
- API: `apps/api/logs/`
- Media: `apps/media-server/logs/`
- AI: `apps/ai-services/logs/`

---

*System Startup Guide - March 29, 2026*  
*Status: **STARTING SERVICES** 🟡*
