# 🔧 FIX: Login/Signup "Failed to Fetch" Error

**Problem:** Cannot login or signup - "Failed to fetch" error  
**Root Cause:** API server is not running or not accessible  
**Date:** March 20, 2026

---

## ✅ **SOLUTION - Step by Step**

### **Step 1: Stop All Running Servers**

```batch
:: Close all VANTAGE windows
:: Or run this to force kill:
taskkill /F /FI "WINDOWTITLE eq VANTAGE*" /T
```

---

### **Step 2: Fix API Dependencies**

```batch
cd c:\Projects\Live-Streaming-\apps\api

:: Reinstall dependencies
npm install

:: Generate Prisma Client
npm run db:generate
```

**Expected Output:**
```
✔ Generated Prisma Client to .\..\..\node_modules\@prisma\client
```

---

### **Step 3: Check Database**

```batch
:: Start Docker for database
docker-compose up -d postgres redis

:: Wait 15 seconds
timeout /t 15

:: Check if database is ready
docker ps
```

**Expected:** PostgreSQL and Redis containers should be running

---

### **Step 4: Update Environment Files**

**Check `apps\api\.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vantage?schema=public
API_PORT=4000
WS_PORT=4000
```

**Check `apps\web\.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

**Check root `.env.local`:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/vantage?schema=public
```

⚠️ **IMPORTANT:** Update the password to match your PostgreSQL installation!

---

### **Step 5: Start API Server FIRST**

```batch
cd c:\Projects\Live-Streaming-\apps\api
npm run dev
```

**Wait for this message:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 VANTAGE API Server                                   ║
║                                                           ║
║   Status: Running                                         ║
║   Port: 4000                                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Keep this window OPEN!**

---

### **Step 6: Test API is Running**

Open a NEW terminal and run:

```batch
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-20T...",
  "version": "0.0.1",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

If you get this ✅, the API is working!

If you get `Failed to connect` ❌, see troubleshooting below.

---

### **Step 7: Start Web Server**

Open another terminal:

```batch
cd c:\Projects\Live-Streaming-\apps\web
npm run dev
```

**Wait for:**
```
▲ Next.js 14.2.35
- Local: http://localhost:3000

✓ Ready in 2s
```

---

### **Step 8: Test Login/Signup**

1. Open browser: http://localhost:3000
2. Click "Sign In"
3. Try login with: `admin@vantage.live / admin123`
4. Should work now! ✅

---

## 🔍 **Troubleshooting**

### **API Won't Start - "Cannot find module"**

**Error:**
```
Error: Cannot find module './AuthService'
```

**Fix:**
```batch
cd c:\Projects\Live-Streaming-\apps\api

:: Clear cache
npm cache clean --force

:: Delete node_modules
rmdir /s /q node_modules

:: Reinstall
npm install

:: Regenerate Prisma
npm run db:generate
```

---

### **API Starts Then Crashes**

**Check for these errors:**

1. **Database Connection Error:**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   **Fix:** Start Docker/PostgreSQL
   ```batch
   docker-compose up -d postgres redis
   ```

2. **Port Already in Use:**
   ```
   Error: listen EADDRINUSE: address already in use :::4000
   ```
   **Fix:** Kill process on port 4000
   ```batch
   for /f "tokens=5" %a in ('netstat -ano ^| findstr ":4000"') do taskkill /PID %a /F
   ```

3. **Prisma Not Generated:**
   ```
   @prisma/client does not exist
   ```
   **Fix:**
   ```batch
   npm run db:generate
   ```

---

### **CORS Error in Browser Console**

**Error:**
```
Access to fetch at 'http://localhost:4000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:** Check API CORS configuration in `apps\api\src\index.ts`:

```typescript
app.use(cors({
  origin: 'http://localhost:3000',  // Make sure this matches
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
```

---

### **Database Not Ready**

**Error:**
```
Can't reach database server at `localhost:5432`
```

**Fix:**
```batch
:: Check Docker is running
docker ps

:: Start database
docker-compose up -d postgres redis

:: Wait longer (PostgreSQL needs 15-30 seconds)
timeout /t 30

:: Check database is ready
docker logs vantage-postgres | findstr "ready"
```

---

### **Environment Variables Not Loading**

**Check files exist:**
```batch
:: Root .env.local
type .env.local

:: API .env
type apps\api\.env

:: Web .env.local
type apps\web\.env.local
```

**Restart servers after any changes:**
```batch
:: Stop all
taskkill /F /FI "WINDOWTITLE eq VANTAGE*" /T

:: Start API
cd apps\api
npm run dev

:: Start Web (in new window)
cd apps\web
npm run dev
```

---

## 🎯 **Quick Test Script**

Create a file `test-api.bat`:

```batch
@echo off
echo Testing API...
curl http://localhost:4000/health
echo.
echo Testing Auth endpoint...
curl -X POST http://localhost:4000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@vantage.live\",\"password\":\"admin123\"}"
echo.
pause
```

Run it to test if API is working.

---

## ✅ **Working Configuration Example**

### **apps\api\.env**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage?schema=public
API_PORT=4000
WS_PORT=4000
NODE_ENV=development
```

### **apps\web\.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=VANTAGE
```

### **Root .env.local**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

---

## 🚀 **Recommended Startup Order**

1. **Start Docker** (PostgreSQL + Redis)
   ```batch
   docker-compose up -d
   ```

2. **Wait 15 seconds** for database to be ready

3. **Start API Server**
   ```batch
   cd apps\api
   npm run dev
   ```

4. **Wait for "VANTAGE API Server Running" message**

5. **Test API health**
   ```batch
   curl http://localhost:4000/health
   ```

6. **Start Web Server**
   ```batch
   cd apps\web
   npm run dev
   ```

7. **Open browser** to http://localhost:3000

---

## 📞 **Still Not Working?**

### **Collect Debug Information:**

```batch
:: 1. Check Node version
node --version

:: 2. Check npm version
npm --version

:: 3. Check Docker
docker ps

:: 4. Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :4000

:: 5. Check environment
type apps\api\.env
type apps\web\.env.local
```

### **Share This Information:**

When asking for help, provide:
1. Error messages from API window
2. Error messages from Web window
3. Browser console errors (F12)
4. Output of debug commands above

---

## 🎯 **Success Indicators**

✅ API window shows:
```
🎬 VANTAGE API Server
Status: Running
Port: 4000
```

✅ Web window shows:
```
▲ Next.js 14.2.35
- Local: http://localhost:3000
✓ Ready
```

✅ Browser can access:
- http://localhost:3000 (Landing page loads)
- http://localhost:4000/health (Returns JSON)

✅ Login works with:
- Email: admin@vantage.live
- Password: admin123

---

**Last Updated:** March 20, 2026  
**Version:** 2.0.0

---

*© 2024 VANTAGE. All Rights Reserved.*
