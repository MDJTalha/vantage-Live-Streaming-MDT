# 🚀 VANTAGE - How to Start Servers

**Last Updated:** March 20, 2026  
**Version:** 2.2.0

---

## ⚡ Quick Start (Choose One)

### **Option 1: Recommended (start-dev.bat)**

```batch
:: Double-click this file:
start-dev.bat
```

**What it does:**
- ✅ Checks all prerequisites
- ✅ Starts Docker (PostgreSQL, Redis)
- ✅ Builds UI package
- ✅ Starts API + Web in background
- ✅ Shows status and logs

**Access:** http://localhost:3000

---

### **Option 2: Simple Start (start-simple.bat)**

```batch
:: Double-click this file:
start-simple.bat
```

**What it does:**
- ✅ Opens 2 separate windows
- ✅ API Server in one window
- ✅ Web Frontend in another
- ✅ Easy to see errors

**Best for:** Debugging, seeing live logs

---

### **Option 3: Manual Start**

```batch
:: Open 2 terminals

:: Terminal 1 - API
cd c:\Projects\Live-Streaming-\apps\api
npm run dev

:: Terminal 2 - Web
cd c:\Projects\Live-Streaming-\apps\web
npm run dev
```

**Best for:** Development, debugging

---

## 📋 All Batch Files Explained

| File | Purpose | When to Use |
|------|---------|-------------|
| **start-dev.bat** | Full startup with checks | Daily development ✅ |
| **start-simple.bat** | Direct start, 2 windows | Debugging ✅ |
| **start.bat** | Background start | Quick testing |
| **setup.bat** | First-time setup | Initial install |
| **start-pm2.bat** | Production mode | Production deploy |

---

## 🔧 Troubleshooting

### **Problem: Window closes immediately**

**Solution:**
```batch
:: Use start-simple.bat instead
start-simple.bat
```

---

### **Problem: Port 3000 or 4000 already in use**

**Solution 1 - Find and kill process:**
```batch
:: Find process on port 3000
netstat -ano | findstr :3000

:: Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Solution 2 - Use different port:**
```batch
:: In apps\web\package.json, change:
"dev": "next dev -p 3001"
```

---

### **Problem: Docker not starting**

**Solution:**
```batch
:: Start Docker Desktop manually
:: Then run:
docker-compose up -d postgres redis

:: Wait 15 seconds, then:
start-dev.bat
```

---

### **Problem: npm install fails**

**Solution:**
```batch
:: Clear cache
npm cache clean --force

:: Delete node_modules
rmdir /s /q node_modules

:: Reinstall
npm install
```

---

### **Problem: Turbo errors**

**Solution - Start without Turbo:**
```batch
:: Use start-simple.bat (starts each app directly)
start-simple.bat
```

---

## ✅ Success Checklist

After starting, verify:

- [ ] Two processes running (API + Web)
- [ ] Port 3000 listening (Web)
- [ ] Port 4000 listening (API)
- [ ] No errors in logs
- [ ] Can access http://localhost:3000

**Check ports:**
```batch
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

**View logs:**
```batch
:: API logs
type logs\api.log

:: Web logs
type logs\web.log
```

---

## 🎯 Expected Output

### **start-dev.bat Output:**

```
============================================
  VANTAGE Platform - Development Mode
============================================

[1/6] Checking Node.js...
OK: v24.8.0

[2/6] Checking dependencies...
OK: Dependencies installed

[3/6] Setting up environment...
OK: .env.local exists

[4/6] Starting infrastructure...
OK: Database running

[5/6] Building UI package...
OK: UI built

[6/6] Starting servers...

Starting API Server (Port 4000)...
OK: API starting...

Starting Web Frontend (Port 3000)...
OK: Web starting...

============================================
  VANTAGE Servers Running!
============================================

  Web App:  http://localhost:3000
  API:      http://localhost:4000
  WebSocket: ws://localhost:4000

  Demo Credentials:
  - admin@vantage.live / admin123
  - host@vantage.live / host123
  - user@vantage.live / user123

============================================
```

---

### **start-simple.bat Output:**

Opens two windows:

**Window 1 - API:**
```
> api@0.0.1 dev
> tsx watch src/index.ts

VANTAGE API Server
Port: 4000
Environment: development
```

**Window 2 - Web:**
```
> web@0.0.1 dev
> next dev

  ▲ Next.js 14.2.35
  - Local: http://localhost:3000

  ✓ Ready in 2s
```

---

## 🛑 How to Stop Servers

### **If using start-dev.bat:**
```batch
:: Press Ctrl+C in the batch window
:: Type 'Y' to confirm
```

### **If using start-simple.bat:**
```batch
:: Close the two server windows
:: Or press Ctrl+C in each window
```

### **Force stop all:**
```batch
:: Kill all Node processes for VANTAGE
taskkill /FI "WINDOWTITLE eq VANTAGE*" /T /F

:: Or kill by port
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":3000 :4000"') do taskkill /PID %a /F
```

---

## 📊 Server Status

### **Check if running:**

```batch
:: Check Web (Port 3000)
netstat -ano | findstr :3000

:: Check API (Port 4000)
netstat -ano | findstr :4000

:: Check Docker
docker ps
```

### **Test endpoints:**

```batch
:: Test API health
curl http://localhost:4000/health

:: Test Web
curl http://localhost:3000
```

---

## 🎨 For UI/UX Testing

Once servers are running:

1. **Open:** http://localhost:3000
2. **See:** Premium landing page
3. **Click:** "Sign In"
4. **Login:** admin@vantage.live / admin123
5. **Explore:** Dashboard with premium UI

---

## 📞 Still Having Issues?

1. **Check Node.js version:**
   ```batch
   node --version
   :: Should be v20.0.0 or higher
   ```

2. **Check npm:**
   ```batch
   npm --version
   :: Should be 10.0.0 or higher
   ```

3. **Reinstall dependencies:**
   ```batch
   npm install
   cd apps\api && npm install
   cd apps\web && npm install
   ```

4. **Check logs:**
   ```batch
   logs\api.log
   logs\web.log
   ```

---

## 🎯 Recommended Workflow

**Daily Development:**
```batch
:: Morning - Start
start-dev.bat

:: Work on code...
:: Test in browser at http://localhost:3000

:: Evening - Stop
:: Close window or Ctrl+C
```

**First Time Setup:**
```batch
:: Run setup first
setup.bat

:: Then start
start-dev.bat
```

**Debugging:**
```batch
:: Use simple start for visible logs
start-simple.bat

:: Watch both windows for errors
```

---

**© 2024 VANTAGE. All Rights Reserved.**
