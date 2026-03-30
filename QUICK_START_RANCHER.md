# 🚀 VANTAGE - Quick Start with Rancher Desktop
**Immediate Action Guide**

---

## ⚡ 3-MINUTE FIX

### Step 1: Open Rancher Desktop (30 seconds)
1. Launch **Rancher Desktop** from Start Menu
2. Wait for whale icon to turn green (in system tray)
3. Click Settings ⚙️ → Ensure **dockerd (moby)** is selected
4. Click **Apply & Restart**

### Step 2: Start Databases (1 minute)
Open Command Prompt in VANTAGE folder:
```batch
cd c:\Projects\Live-Streaming-
```

Run this command:
```batch
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" up -d postgres redis
```

Wait 10 seconds for databases to start.

### Step 3: Run Migrations (1 minute)
```batch
cd apps\api
npx prisma migrate dev
npx prisma generate
```

### Step 4: Start Servers (30 seconds)
```batch
# Terminal 1: API
npm run dev

# Terminal 2: Web (new terminal)
cd ..\web
npm run dev
```

### Step 5: Test Login (30 seconds)
1. Open browser: http://localhost:3000
2. Click "Sign Up"
3. Create account: `test@test.com` / `Password123!`
4. Login should work now! ✅

---

## 🎯 AUTOMATED START (EASIEST)

Double-click this file:
```
c:\Projects\Live-Streaming-\start-with-rancher.bat
```

This script will:
- ✅ Start Rancher Desktop containers
- ✅ Run database migrations
- ✅ Start API server
- ✅ Start web app
- ✅ Open browser automatically

---

## 🔧 IF LOGIN STILL CRASHES

### Check Database Connection
```batch
# Test PostgreSQL
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" exec vantage-postgres psql -U vantage -c "SELECT 1;"

# Test Redis
"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker.exe" exec vantage-redis redis-cli ping
```

### Check API Logs
Look for errors in API server terminal:
- `Error: connect ECONNREFUSED` → Database not running
- `Error: JWT_SECRET must be 32+ characters` → Update .env.local
- `Error: ENCRYPTION_KEY must be 64 hex chars` → Update .env.local

### Quick Fix .env.local
Edit `apps\api\.env.local`:
```
DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=vantage-super-secure-jwt-key-2026-change-in-production-abc123xyz
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 📋 VERIFICATION CHECKLIST

- [ ] Rancher Desktop running (green whale icon)
- [ ] PostgreSQL container running
- [ ] Redis container running
- [ ] Database migrations completed
- [ ] API server shows "Status: Running"
- [ ] Web app loads at http://localhost:3000
- [ ] Can create account
- [ ] Can login successfully

---

## 🆘 EMERGENCY CONTACT

If still having issues:

1. **Check logs:**
   ```batch
   "C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" logs postgres
   ```

2. **Restart everything:**
   ```batch
   "C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" down
   "C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe" up -d postgres redis
   ```

3. **Check API server logs** for specific error messages

---

## 📞 USEFUL COMMANDS

| Task | Command |
|------|---------|
| **Start databases** | `docker-compose up -d postgres redis` |
| **Stop databases** | `docker-compose down` |
| **View logs** | `docker-compose logs -f` |
| **Check status** | `docker-compose ps` |
| **Restart service** | `docker-compose restart postgres` |
| **Run migrations** | `npx prisma migrate dev` |
| **Generate Prisma** | `npx prisma generate` |

**Full path for all commands:**
`"C:\Program Files\Rancher Desktop\resources\resources\win32\bin\docker-compose.exe"`

---

*Quick Start Guide - March 29, 2026*  
**Expected Result:** Login works without crashing! ✅
