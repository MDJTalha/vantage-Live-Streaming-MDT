# How to Run VANTAGE on Localhost:3000

**Quick Start Guide**

---

## 🚀 Method 1: Using Start Script (Easiest)

### Step 1: Double-click `start.bat`
- Located in project root: `C:\Projects\Live-Streaming-\start.bat`
- This will automatically start the development server

### Step 2: Wait for "Ready" message
```
✓ Ready in 1569ms
```

### Step 3: Open browser
- Go to: **http://localhost:3000**

---

## 🚀 Method 2: Manual Start (Command Line)

### Step 1: Open Command Prompt or PowerShell

### Step 2: Navigate to project
```bash
cd C:\Projects\Live-Streaming-\apps\web
```

### Step 3: Start development server
```bash
npm run dev
```

### Step 4: Wait for success message
You should see:
```
▲ Next.js 16.2.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://YOUR_IP:3000
✓ Ready in XXXms
```

### Step 5: Open browser
- Go to: **http://localhost:3000**

---

## 🚀 Method 3: From Project Root

### Step 1: Open Command Prompt

### Step 2: Navigate to project root
```bash
cd C:\Projects\Live-Streaming-
```

### Step 3: Start web app
```bash
npm run dev --workspace=web
```

### Step 4: Open browser
- Go to: **http://localhost:3000**

---

## ✅ Verify Server is Running

### Check if port 3000 is listening:
```bash
netstat -ano | findstr :3000
```

**Expected output:**
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
TCP    [::]:3000       [::]:0       LISTENING    12345
```

If you see this, the server is running! ✅

---

## 🌐 Access URLs

Once server is running, access these pages:

| Page | URL |
|------|-----|
| **Home** | http://localhost:3000 |
| **Dashboard** | http://localhost:3000/dashboard |
| **Profile** | http://localhost:3000/account/profile |
| **Login** | http://localhost:3000/login |
| **Signup** | http://localhost:3000/signup |
| **AI Features** | http://localhost:3000/ai-data-correction |
| **Analytics** | http://localhost:3000/analytics |
| **Admin** | http://localhost:3000/admin |

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use

**Error:** `Port 3000 is already in use`

**Solution 1: Kill the process**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill /PID <PID_NUMBER> /F
```

**Solution 2: Use different port**
```bash
# Use port 3001 instead
npm run dev -- -p 3001
```

---

### Issue: npm command not found

**Error:** `'npm' is not recognized`

**Solution:**
1. Install Node.js from https://nodejs.org
2. Restart Command Prompt
3. Try again

---

### Issue: Module not found

**Error:** `Cannot find module`

**Solution:**
```bash
# Install dependencies
cd C:\Projects\Live-Streaming-
npm ci --legacy-peer-deps

# Then start server
npm run dev --workspace=web
```

---

### Issue: Turbopack error

**Error:** `Next.js package not found`

**Solution:**
Already fixed! The `next.config.js` has been updated with Turbopack configuration.

---

## 📋 Quick Command Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run linter |
| `npm run clean` | Clean build artifacts |

---

## 🔍 Check Server Status

### Windows Task Manager
1. Press `Ctrl + Shift + Esc`
2. Go to "Details" tab
3. Look for `node.exe`
4. If present, server is running

### Command Prompt
```bash
# Check if Node.js is running
tasklist | findstr node

# Check if port 3000 is listening
netstat -ano | findstr :3000
```

---

## 🎯 Expected Output

When server starts successfully, you should see:

```
▲ Next.js 16.2.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.x.x:3000
- Environments: .env.local
✓ Ready in 1569ms

○ Compiling / ...
✓ Compiled successfully
```

---

## 📞 Still Having Issues?

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be v20 or higher

2. **Check npm version:**
   ```bash
   npm --version
   ```
   Should be 10.x or higher

3. **Reinstall dependencies:**
   ```bash
   npm ci --legacy-peer-deps
   ```

4. **Clear cache:**
   ```bash
   rm -rf node_modules .next
   npm install
   ```

5. **Check logs:**
   - Look in terminal for error messages
   - Check `apps/web/logs/` directory

---

## ✅ Success Checklist

- [ ] Server started without errors
- [ ] "Ready" message displayed
- [ ] Port 3000 is listening
- [ ] Can access http://localhost:3000 in browser
- [ ] Home page loads
- [ ] No console errors in browser

---

## 🎉 You're Ready!

Once you see the "Ready" message, your VANTAGE application is running on:

**http://localhost:3000**

Enjoy! 🚀

---

**Last Updated:** March 31, 2026  
**Next.js Version:** 16.2.1  
**Status:** ✅ Ready to run
