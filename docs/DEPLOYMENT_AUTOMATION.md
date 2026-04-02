# 🚀 VANTAGE Automated Deployment Guide

Complete guide for automating deployments from local repository to GitHub and Vercel.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Actions Setup](#github-actions-setup)
4. [Vercel Setup](#vercel-setup)
5. [Automated Deployment](#automated-deployment)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The VANTAGE platform now features **fully automated CI/CD** with:

- ✅ **Automatic builds** on every push
- ✅ **TypeScript validation** before deployment
- ✅ **Preview deployments** for pull requests
- ✅ **Production deployments** on main branch
- ✅ **Database migrations** automation
- ✅ **Deployment notifications**

---

## 🛠️ Prerequisites

### **Required Accounts**
- [ ] GitHub account
- [ ] Vercel account
- [ ] Node.js 20+ installed locally

### **Required Tools**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

---

## 🔧 GitHub Actions Setup

### **Step 1: Enable GitHub Actions**

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **"I understand my workflows, go ahead and enable them"**

### **Step 2: Add GitHub Secrets**

Navigate to: **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization ID | Vercel Dashboard → Settings |
| `VERCEL_PROJECT_ID` | Project ID | Vercel Project → Settings |
| `DATABASE_URL` | PostgreSQL URL | Your database provider |
| `NEXT_PUBLIC_API_URL` | API URL | Your API endpoint |
| `NEXT_PUBLIC_SITE_URL` | Site URL | Your Vercel URL |

### **Step 3: Verify Workflow**

The workflow file is located at: `.github/workflows/ci-cd.yml`

It includes:
- ✅ Lint job
- ✅ Build job
- ✅ Production deployment
- ✅ Preview deployment
- ✅ Database migration
- ✅ Status notification

---

## ⚡ Vercel Setup

### **Step 1: Connect GitHub to Vercel**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your repository: `MDJTalha/vantage-Live-Streaming-MDT`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **Step 2: Configure Environment Variables**

In Vercel Dashboard → Project Settings → Environment Variables:

Add these variables:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
NEXT_PUBLIC_SITE_URL=https://your-site-url.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### **Step 3: Deploy**

Click **Deploy** to trigger first deployment.

---

## 🤖 Automated Deployment

### **Option 1: Push to GitHub (Recommended)**

```bash
# Make your changes
git add .
git commit -m "feat: your changes"

# Push to main branch (triggers production deployment)
git push origin main

# Or create a pull request (triggers preview deployment)
git checkout -b feature/your-feature
git push origin feature/your-feature
```

**What happens:**
1. ✅ GitHub Actions workflow triggers
2. ✅ Code is linted and built
3. ✅ TypeScript is validated
4. ✅ Deployment to Vercel
5. ✅ Comments added to PR (if applicable)

### **Option 2: Use Deployment Script**

#### **Windows:**
```bash
cd c:\Projects\Live-Streaming-
.\scripts\deploy-automated.bat
```

#### **Mac/Linux:**
```bash
cd /path/to/Live-Streaming-
chmod +x scripts/deploy-automated.sh
./scripts/deploy-automated.sh
```

**What the script does:**
1. ✅ Pre-deployment checks (Node, npm, Git, Vercel)
2. ✅ Install dependencies
3. ✅ Build application
4. ✅ Commit changes
5. ✅ Push to GitHub
6. ✅ Deploy to Vercel
7. ✅ Show deployment summary

---

## 📝 Manual Deployment

### **Deploy to Vercel Manually**

```bash
# Navigate to web app
cd apps/web

# Login to Vercel (first time only)
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### **Build Locally**

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Build web app
cd apps/web
npm run build -- --no-lint

# Test production build
npm start
```

---

## 📊 Deployment Workflow

```
┌─────────────────┐
│  Git Push       │
│  (main branch)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  Workflow       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lint & Build   │
│  (CI/CD)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Deploy  │
│  (Production)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Live Site      │
│  ✅ Ready       │
└─────────────────┘
```

---

## 🔍 Troubleshooting

### **Issue: GitHub Actions not triggering**

**Solution:**
1. Check if Actions are enabled
2. Verify workflow file syntax
3. Check branch name (must be `main`)

### **Issue: Vercel deployment fails**

**Solution:**
1. Check Vercel build logs
2. Verify environment variables
3. Ensure `vercel.json` is correct
4. Check Node.js version compatibility

### **Issue: Build fails locally**

**Solution:**
```bash
# Clear cache
npm run clean

# Reinstall dependencies
npm ci --legacy-peer-deps

# Regenerate Prisma
npx prisma generate

# Rebuild
npm run build
```

### **Issue: Database migration fails**

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database connectivity
3. Run migrations manually:
   ```bash
   npx prisma migrate deploy
   ```

---

## 📈 Monitoring Deployments

### **GitHub Actions**
- URL: `https://github.com/MDJTalha/vantage-Live-Streaming-MDT/actions`
- View: Build logs, test results, deployment status

### **Vercel Dashboard**
- URL: `https://vercel.com/dashboard`
- View: Deployment history, preview URLs, analytics

### **Application Logs**
- Vercel: Deployments → Select deployment → Logs
- GitHub: Actions → Select workflow → View logs

---

## 🎯 Best Practices

### **Before Deploying**
- ✅ Test locally first
- ✅ Run `npm run build` successfully
- ✅ Check TypeScript errors
- ✅ Update version numbers

### **During Deployment**
- ✅ Monitor GitHub Actions
- ✅ Watch Vercel build logs
- ✅ Check for errors

### **After Deployment**
- ✅ Test production site
- ✅ Verify all features work
- ✅ Check analytics
- ✅ Monitor error logs

---

## 🔗 Quick Links

- **GitHub Repository**: https://github.com/MDJTalha/vantage-Live-Streaming-MDT
- **GitHub Actions**: https://github.com/MDJTalha/vantage-Live-Streaming-MDT/actions
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify environment variables
4. Test build locally

---

**Last Updated:** April 2, 2026  
**Version:** 1.0.0
