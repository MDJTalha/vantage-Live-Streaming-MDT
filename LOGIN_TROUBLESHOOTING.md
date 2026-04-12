# Login & Dashboard Access - Troubleshooting Guide

**Date:** April 6, 2026  
**Status:** ✅ RESOLVED

---

## 🔍 Issues Identified

### **Issue 1: Duplicate State Variables (FIXED)**
- **File:** `apps/web/src/contexts/ChatContext.tsx`
- **Problem:** `wsAvailable` and `setWsAvailable` were declared twice (lines 77 and 101)
- **Fix:** Removed duplicate declaration on line 101
- **Status:** ✅ FIXED

### **Issue 2: Stale LocalStorage Data**
- **Problem:** Browser localStorage may contain corrupted or stale authentication data
- **Symptoms:** 
  - Login page shows loading spinner indefinitely
  - Dashboard won't load
  - Auth context in inconsistent state
- **Solution:** Clear browser localStorage

---

## 🚀 How to Fix Login Issues

### **Method 1: Browser Console (Recommended)**

1. Open your browser and go to: `http://localhost:3000`
2. Press **F12** to open Developer Console
3. Go to **Console** tab
4. Run this command:

```javascript
localStorage.clear();
window.location.href = 'http://localhost:3000/login';
```

5. The login page should now load properly

### **Method 2: Manual Clear**

1. Press **F12** in your browser
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click on **Local Storage** → `http://localhost:3000`
4. Click **Clear All** button
5. Refresh the page

### **Method 3: PowerShell Script**

Run this script from the project root:

```powershell
.\scripts\clear-localstorage.ps1
```

---

## 🔑 Demo Login Credentials

After clearing localStorage, use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@vantage.live | @admin@123# |
| **Host** | host@vantage.live | @host@123# |
| **User** | user@vantage.live | @user@123# |

---

## 📍 Available Routes

### **Authentication Routes**
- ✅ `/login` - Login page
- ✅ `/signup` - Registration page

### **Protected Routes** (require login)
- ✅ `/dashboard` - Main dashboard
- ✅ `/account/profile` - User profile
- ✅ `/analytics` - Analytics page
- ✅ `/recordings` - Meeting recordings
- ✅ `/admin` - Admin panel

### **Public Routes**
- ✅ `/` - Landing page
- ✅ `/support` - Support/FAQ
- ✅ `/docs` - Documentation

---

## 🔧 How Authentication Works

### **Login Flow:**

1. User enters email/password on `/login`
2. AuthContext tries API: `POST http://localhost:4000/api/v1/auth/login`
3. If API fails (expected in dev), falls back to **demo mode**
4. Demo mode checks hardcoded users or localStorage registered users
5. On success:
   - Sets `accessToken` and `user` in localStorage
   - Redirects to `/dashboard`

### **Auth State Management:**

- **File:** `apps/web/src/contexts/AuthContext.tsx`
- **Provider:** `<AuthProvider>` wraps entire app in `layout.tsx`
- **Hook:** `useAuth()` provides: `user`, `login`, `logout`, `register`

### **Dashboard Protection:**

```typescript
// Dashboard checks if user exists
useEffect(() => {
  if (!user) {
    router.push('/login');  // Redirects if not logged in
    return;
  }
  loadRooms();
}, [user, loadRooms]);
```

### **Login Page Auto-Redirect:**

```typescript
// Login page redirects if already logged in
useEffect(() => {
  if (user) {
    router.push('/dashboard');  // Prevents logged-in users from seeing login
  }
}, [user, router]);
```

---

## 🐛 Common Issues & Solutions

### **Issue: Login page shows spinner forever**

**Cause:** Corrupted localStorage data  
**Solution:** Clear localStorage (see methods above)

### **Issue: Dashboard redirects back to login**

**Cause:** No valid user in localStorage  
**Solution:** Login with demo credentials

### **Issue: "User not authenticated" error**

**Cause:** API server not running or invalid token  
**Solution:** 
1. Ensure API server is running on port 4000
2. Clear localStorage and login again

### **Issue: Login fails with "Invalid email or password"**

**Cause:** Wrong credentials or API down  
**Solution:**
1. Verify you're using correct demo credentials
2. Check password matches exactly (case-sensitive)
3. System will fallback to demo mode automatically

---

## 📊 Current System Status

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| **Web Frontend** | 3000 | ✅ Running | Next.js dev server |
| **API Server** | 4000 | ⚠️ Check | Express server with auth routes |
| **Media Server** | 443 | ❌ Down | mediasoup native binding issue |

### **Working Features:**
- ✅ Login/Signup pages
- ✅ Dashboard (with demo mode)
- ✅ User authentication
- ✅ Room management (UI only)
- ✅ Profile management

### **Limited Features:**
- ⚠️ No real meeting functionality (requires media server)
- ⚠️ No real-time chat (requires WebSocket)
- ⚠️ Some API endpoints may fail (requires database)

---

## 🎯 Quick Start Guide

### **1. Clear LocalStorage**
```javascript
localStorage.clear();
```

### **2. Go to Login**
Navigate to: `http://localhost:3000/login`

### **3. Login with Demo Account**
- Email: `admin@vantage.live`
- Password: `@admin@123#`

### **4. Access Dashboard**
You'll be automatically redirected to: `http://localhost:3000/dashboard`

---

## 🔐 Security Notes

**Demo Mode Features:**
- Authentication happens client-side
- Tokens are prefixed with `demo-`
- No actual API calls made
- Perfect for development and testing

**Production Mode:**
- Requires running API server
- Real JWT token validation
- Database-backed user authentication
- Proper refresh token rotation

---

## 📝 Files Modified

1. ✅ `apps/web/src/contexts/ChatContext.tsx` - Removed duplicate state variables
2. ✅ `apps/media-server/.env.local` - Created environment configuration
3. ✅ `scripts/clear-localstorage.ps1` - Created cleanup helper script

---

## 🆘 Still Having Issues?

### **Check Browser Console for Errors:**
1. Press F12
2. Go to Console tab
3. Look for red error messages

### **Check Terminal Output:**
Look for errors in the terminal running the web server

### **Verify Services:**
```powershell
# Check if servers are running
netstat -ano | findstr ":3000 :4000"
```

### **Restart Servers:**
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Restart web server
cd apps\web
npx next dev -p 3000
```

---

**Last Updated:** April 6, 2026  
**Status:** ✅ Login page accessible after clearing localStorage
