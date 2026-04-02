# 🚀 VANTAGE - Quick Deployment Guide

## ⚡ One-Click Deployment

### **Option 1: Deploy to Vercel (Recommended)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MDJTalha/vantage-Live-Streaming-MDT&project-name=vantage-live-streaming&repository-name=vantage-live-streaming&root-directory=apps/web)

Click the button above for instant deployment!

---

## 📋 Manual Setup (5 Minutes)

### **Step 1: Fork Repository**

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vantage-Live-Streaming-MDT.git
cd vantage-Live-Streaming-MDT
```

### **Step 2: Install Dependencies**

```bash
npm ci --legacy-peer-deps
npx prisma generate
```

### **Step 3: Configure Environment**

Create `.env.local` in root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vantage
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Step 4: Build & Deploy**

```bash
# Build locally
cd apps/web
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🤖 Automated Deployment

### **GitHub Actions (Automatic)**

Every push to `main` branch automatically deploys to production!

```bash
# Make changes
git add .
git commit -m "feat: your changes"

# Push triggers automatic deployment
git push origin main
```

### **Deployment Script**

#### **Windows:**
```bash
.\scripts\deploy-automated.bat
```

#### **Mac/Linux:**
```bash
chmod +x scripts/deploy-automated.sh
./scripts/deploy-automated.sh
```

---

## 🔧 Configuration

### **Vercel Settings**

- **Framework**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### **Environment Variables**

Add these in Vercel Dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your API URL |
| `NEXT_PUBLIC_SITE_URL` | Your site URL |
| `DATABASE_URL` | PostgreSQL connection |

---

## ✅ Verification

After deployment:

1. ✅ Check deployment status: [Vercel Dashboard](https://vercel.com/dashboard)
2. ✅ View build logs: Project → Deployments → Logs
3. ✅ Test site: https://your-project.vercel.app
4. ✅ Check GitHub Actions: [Actions Tab](https://github.com/MDJTalha/vantage-Live-Streaming-MDT/actions)

---

## 📊 Deployment Status

| Environment | Branch | Status | URL |
|-------------|--------|--------|-----|
| **Production** | `main` | ✅ Auto | https://vantage-live-streaming.vercel.app |
| **Preview** | Pull Requests | ✅ Auto | Auto-generated |
| **Development** | Any | 🖐️ Manual | localhost:3000 |

---

## 🆘 Troubleshooting

### **Build Fails**
```bash
# Clear cache and rebuild
npm run clean
npm ci --legacy-peer-deps
npm run build
```

### **Deployment Fails**
1. Check GitHub Actions logs
2. Verify environment variables
3. Test build locally first

### **Database Errors**
```bash
# Run migrations
npx prisma migrate deploy
npx prisma generate
```

---

## 📞 Support

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues tab
- **Discussions**: GitHub Discussions tab

---

**Ready to deploy! 🚀**
