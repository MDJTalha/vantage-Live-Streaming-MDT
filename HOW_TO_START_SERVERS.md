# VANTAGE - How to Start the System

**Quick Reference Guide**

---

## 🚀 Quick Start (Development)

### Option 1: Start All Services (Recommended)

```bash
# From project root
npm run dev
```

This starts:
- ✅ Web Frontend (port 3000)
- ✅ API Server (port 4000)
- ✅ Media Server (port 443)

**Wait for:** `Ready in 5s` message

**Access:** http://localhost:3000

---

### Option 2: Start Individual Services

#### Start Web Frontend Only
```bash
cd apps/web
npm run dev
```
**Access:** http://localhost:3000

#### Start API Server Only
```bash
cd apps/api
npm run dev
```
**Access:** http://localhost:4000

#### Start Media Server Only
```bash
cd apps/media-server
npm run dev
```
**Access:** https://localhost:443

---

## 📋 Prerequisites

### Required Software
- ✅ Node.js 20.0.0 or higher
- ✅ npm 10.0.0 or higher
- ✅ Git

### Check Versions
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Install Dependencies (First Time Only)
```bash
# From project root
npm ci --legacy-peer-deps
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Port 3000 Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use a different port
npm run dev -- -p 3001
```

### Issue 2: Module Not Found

**Error:** `Cannot find module '@vantage/ui'`

**Solution:**
```bash
# Reinstall dependencies
npm ci --legacy-peer-deps

# Or clean and reinstall
npm run clean
npm ci --legacy-peer-deps
```

### Issue 3: Build Errors

**Error:** TypeScript or build errors

**Solution:**
```bash
# Clear build cache
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf apps/media-server/dist

# Rebuild
npm run build
```

### Issue 4: Database Connection Error

**Error:** `Cannot connect to database`

**Solution:**
```bash
# Make sure PostgreSQL is running
# Check .env.local has correct DATABASE_URL
# Run migrations
cd apps/api
npx prisma migrate dev
```

---

## 🌐 Access URLs

| Service | URL | Port |
|---------|-----|------|
| Web Frontend | http://localhost:3000 | 3000 |
| API Server | http://localhost:4000 | 4000 |
| Media Server | https://localhost:443 | 443 |
| Admin Panel | http://localhost:3000/admin | 3000 |
| Dashboard | http://localhost:3000/dashboard | 3000 |

---

## 📝 Environment Setup

### 1. Create .env.local File

```bash
# Copy from example
cp .env.example .env.local
```

### 2. Fill in Required Variables

**Minimum Required:**
```env
# Database
DATABASE_URL=postgresql://vantage:password@localhost:5432/vantage

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# Frontend
FRONTEND_URL=http://localhost:3000

# API
API_PORT=4000

# Media Server
MEDIA_SERVER_PORT=443
```

---

## 🐛 Troubleshooting

### Server Won't Start

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Must be v20 or higher

2. **Check if port is available:**
   ```bash
   netstat -ano | findstr :3000
   ```

3. **Clear cache and reinstall:**
   ```bash
   npm run clean
   npm ci --legacy-peer-deps
   ```

4. **Check for errors in logs:**
   - Look for error messages in terminal
   - Check `apps/web/logs/` directory

### Pages Not Loading

1. **Check if server is running:**
   - Look for "Ready" message in terminal
   - Check terminal for errors

2. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images

3. **Try incognito mode:**
   - `Ctrl + Shift + N` (Chrome)
   - `Ctrl + Shift + P` (Firefox)

### API Not Responding

1. **Check API server is running:**
   ```bash
   curl http://localhost:4000/api/v1/health
   ```

2. **Check .env.local configuration:**
   - Verify DATABASE_URL
   - Verify REDIS_URL

3. **Restart API server:**
   ```bash
   cd apps/api
   npm run dev
   ```

---

## 📦 Build for Production

### Build All Services
```bash
npm run build
```

### Start Production Server
```bash
# Web
cd apps/web
npm run start

# API
cd apps/api
npm run start

# Media Server
cd apps/media-server
npm run start
```

---

## 🐳 Docker (Alternative)

### Build Docker Images
```bash
npm run docker:build
```

### Start with Docker
```bash
npm run docker:up
```

### Stop Docker
```bash
npm run docker:down
```

---

## 📞 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all development servers |
| `npm run build` | Build all services |
| `npm run clean` | Clean build artifacts |
| `npm run lint` | Run linter on all services |
| `npm run test` | Run tests on all services |
| `npm run docker:build` | Build Docker images |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |

---

## 🎯 Development Workflow

### 1. First Time Setup
```bash
# Clone repository
git clone <repository-url>
cd Live-Streaming-

# Install dependencies
npm ci --legacy-peer-deps

# Create environment file
cp .env.example .env.local

# Edit .env.local with your settings

# Start development
npm run dev
```

### 2. Daily Development
```bash
# Start development
npm run dev

# Make changes to code
# Changes auto-reload

# Test in browser at http://localhost:3000
```

### 3. Before Committing
```bash
# Run linter
npm run lint

# Run tests
npm run test

# Build to check for errors
npm run build
```

---

## 📊 System Requirements

### Minimum
- RAM: 8GB
- CPU: 4 cores
- Disk: 10GB free space

### Recommended
- RAM: 16GB
- CPU: 8 cores
- Disk: 20GB free space (SSD)

---

## 🔗 Useful Links

- **Dashboard:** http://localhost:3000/dashboard
- **Profile:** http://localhost:3000/account/profile
- **Analytics:** http://localhost:3000/analytics
- **Admin:** http://localhost:3000/admin
- **API Health:** http://localhost:4000/api/v1/health

---

## 🆘 Still Having Issues?

1. **Check the logs** in terminal
2. **Review error messages** carefully
3. **Search for error** in documentation
4. **Create an issue** on GitHub
5. **Check existing issues** for solutions

---

**Last Updated:** March 31, 2026  
**Version:** 0.0.1
