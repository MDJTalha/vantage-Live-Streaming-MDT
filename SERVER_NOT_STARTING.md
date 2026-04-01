# 🚨 SERVER NOT STARTING - Troubleshooting Guide

**Issue:** Server won't start on localhost:3000

---

## ⚡ IMMEDIATE FIX - Do This Now!

### Step 1: Open NEW Command Prompt
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press `Enter`

### Step 2: Navigate to project
```bash
cd C:\Projects\Live-Streaming-\apps\web
```

### Step 3: Install dependencies (if needed)
```bash
npm install
```

### Step 4: Start server
```bash
npm run dev
```

### Step 5: Watch for output
You should see:
```
▲ Next.js 16.2.1 (Turbopack)
- Local: http://localhost:3000
✓ Ready in XXXms
```

### Step 6: Keep window OPEN
- **DO NOT CLOSE** the Command Prompt
- Server only runs while window is open
- Minimize it if needed

---

## 🔍 Why Server Might Not Start

### Reason 1: Dependencies Missing
**Fix:**
```bash
cd C:\Projects\Live-Streaming-
npm ci --legacy-peer-deps
```

### Reason 2: Port 3000 Already in Use
**Check:**
```bash
netstat -ano | findstr :3000
```

**Fix if in use:**
```bash
# Find PID from netstat output
# Kill it:
taskkill /PID <NUMBER> /F

# Or use different port:
npm run dev -- -p 3001
```

### Reason 3: Node.js Version Issue
**Check version:**
```bash
node --version
```

**Should be:** v20.0.0 or higher

**If wrong:** Download from https://nodejs.org

### Reason 4: Corrupted node_modules
**Fix:**
```bash
cd C:\Projects\Live-Streaming-
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci --legacy-peer-deps
```

---

## 📝 Manual Start Methods

### Method 1: Direct npm command
```bash
cd C:\Projects\Live-Streaming-\apps\web
npm run dev
```

### Method 2: Using npx
```bash
cd C:\Projects\Live-Streaming-\apps\web
npx next dev -p 3000
```

### Method 3: From root
```bash
cd C:\Projects\Live-Streaming-
npm run dev --workspace=web
```

---

## ✅ Verify Server is Running

### Check 1: Command Prompt Output
Should show:
```
✓ Ready in XXXms
```

### Check 2: Port Listening
```bash
netstat -ano | findstr :3000
```

Expected:
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    PID
```

### Check 3: Browser Test
Open: http://localhost:3000

Should load VANTAGE homepage

### Check 4: Task Manager
1. Press `Ctrl + Shift + Esc`
2. Look for `node.exe`
3. Should be running

---

## 🐛 Common Errors & Fixes

### Error: "Cannot find module"
**Fix:**
```bash
npm install
npm run dev
```

### Error: "Port 3000 already in use"
**Fix:**
```bash
# Kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart
npm run dev
```

### Error: "Permission denied"
**Fix:**
- Run Command Prompt as Administrator
- Right-click CMD → Run as Administrator

### Error: "Next.js package not found"
**Already Fixed!** next.config.js updated

---

## 🎯 Quick Test

After starting server, test these URLs:

1. **Home:** http://localhost:3000
2. **Dashboard:** http://localhost:3000/dashboard
3. **Profile:** http://localhost:3000/account/profile

If they load → ✅ Server is working!

---

## 📞 Still Not Working?

### Try These:

1. **Restart Computer**
   - Sometimes fixes stuck processes

2. **Check Firewall**
   - Windows Defender may block port 3000
   - Allow Node.js through firewall

3. **Check Antivirus**
   - Temporarily disable antivirus
   - Add exception for project folder

4. **Use Different Port**
   ```bash
   npm run dev -- -p 3001
   ```
   Then use: http://localhost:3001

5. **Reinstall Node.js**
   - Uninstall current version
   - Download latest from nodejs.org
   - Install and restart terminal

---

## 🔧 Reset Everything (Last Resort)

```bash
# Navigate to project
cd C:\Projects\Live-Streaming-

# Delete everything
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf .next apps/web/.next
rm -rf dist apps/api/dist
rm package-lock.json

# Reinstall
npm cache clean --force
npm ci --legacy-peer-deps

# Start
npm run dev --workspace=web
```

---

## ✅ Success Indicators

You'll know it's working when:

- [ ] Terminal shows "✓ Ready in XXXms"
- [ ] Port 3000 shows as LISTENING
- [ ] Browser loads http://localhost:3000
- [ ] No errors in terminal
- [ ] node.exe in Task Manager

---

## 📊 Current Status

**Server Status:** ❌ Not Running  
**Issue:** Connection Refused  
**Solution:** Follow steps above  

---

**Next Action:** Open Command Prompt and run the commands in "IMMEDIATE FIX" section!
