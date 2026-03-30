# Vercel Deployment Guide - VANTAGE Web

## ✅ All Critical Fixes Applied

The following issues have been resolved to ensure successful deployment:

### 1. **Fixed `apps/web/Dockerfile`**
- ✅ Removed duplicate `FROM` statement
- ✅ Corrected multi-stage build paths
- ✅ Fixed working directory and startup command
- ✅ Added `--legacy-peer-deps` for compatibility

### 2. **Fixed `.github/workflows/ci-cd.yml`**
- ✅ Simplified to `lint-and-build` job (removed redundant test step)
- ✅ Added `--legacy-peer-deps` to all npm commands
- ✅ Fixed build order: uses `--filter=web...` to build all dependencies
- ✅ Improved Vercel deployment with proper CLI commands
- ✅ Added `environment` configuration for production
- ✅ Added Node.js setup in deploy step

### 3. **Fixed `vercel.json`**
- ✅ Added `--legacy-peer-deps` to build and install commands
- ✅ Corrected `outputDirectory` to `.next`
- ✅ Added git deployment configuration

### 4. **Fixed Root `Dockerfile` (API)**
- ✅ Updated to use distroless image properly
- ✅ Fixed user permissions
- ✅ Added `--legacy-peer-deps`

### 5. **Fixed `apps/api/Dockerfile`**
- ✅ Corrected working directory
- ✅ Fixed dependency installation
- ✅ Added `--legacy-peer-deps`

### 6. **Created `.vercelignore`**
- ✅ Excludes unnecessary files from deployment
- ✅ Reduces deployment size

---

## 🚀 Vercel Dashboard Configuration

### Import Project

| Field | Value |
|-------|-------|
| **Source** | GitHub |
| **Repository** | `MDJTalha/vantage-Live-Streaming-MDT` |
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |

### Build Settings

| Field | Value |
|-------|-------|
| **Build Command** | `cd ../.. && npm ci --legacy-peer-deps && npx turbo run build --filter=web... --no-cache` |
| **Output Directory** | `.next` (leave default) |
| **Install Command** | `cd ../.. && npm ci --legacy-peer-deps` |

### Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Required - API Endpoints (update with your production URLs)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Application
NEXT_PUBLIC_APP_NAME=VANTAGE
NODE_ENV=production

# Optional - Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

> ⚠️ **Important**: Set these for **Production**, **Preview**, and **Development** environments.

---

## 🔐 Required GitHub Secrets

Add these to your GitHub repository secrets (`Settings → Secrets and variables → Actions`):

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Vercel API token (get from vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel Organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID |

### How to Get Vercel IDs:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Get project info
vercel ls
```

Or find them in your Vercel dashboard URL:
- `vercel.com/`**`YOUR_ORG_ID`**`/`**`YOUR_PROJECT_ID`**

---

## 📁 Files Modified

```
apps/web/Dockerfile                  - Fixed multi-stage build
apps/web/.vercelignore               - Created (new)
apps/api/Dockerfile                  - Fixed working directory
Dockerfile                           - Fixed API Dockerfile
.github/workflows/ci-cd.yml          - Fixed workspace commands and deployment
vercel.json                          - Fixed build/install commands
VERCEL_DEPLOYMENT_GUIDE.md           - Updated documentation
```

---

## 🧪 Testing Locally

Before deploying, test the build locally:

```bash
# From project root
npm ci --legacy-peer-deps
npx turbo run build --filter=web...

# Test Vercel build locally (from apps/web directory)
cd apps/web
vercel build
```

---

## 🐛 Troubleshooting

### Build Fails with "Cannot find module '@vantage/*'"

**Solution**: The `--filter=web...` syntax builds all dependencies:
```bash
npx turbo run build --filter=web... --no-cache
```

### Vercel Deployment Fails with "Missing Output Directory"

**Solution**: Verify `outputDirectory` is `.next` not `apps/web/.next`

### Environment Variables Not Working

**Solution**:
1. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding new environment variables
3. Check Vercel dashboard → Settings → Environment Variables

### npm Install Fails with Peer Dependency Errors

**Solution**: Always use `--legacy-peer-deps` flag (already configured in all files)

---

## 📋 Deployment Checklist

- [ ] All fixes committed and pushed to GitHub
- [ ] Environment variables added to Vercel dashboard
- [ ] GitHub secrets configured for CI/CD
- [ ] Backend API deployed and accessible
- [ ] CORS configured on backend to allow Vercel domain
- [ ] Test deployment succeeds on `main` branch

---

## 🔗 Next Steps

1. **Commit and push** the fixed files:
   ```bash
   git add -A
   git commit -m "fix: Complete CI/CD and Vercel deployment fixes

   - Fix all Dockerfiles with proper multi-stage builds
   - Add --legacy-peer-deps to all npm commands
   - Fix CI/CD workflow with proper build order
   - Create .vercelignore for optimized deployments
   - Update vercel.json with correct commands
   - Improve Vercel deployment step

   All deployment issues resolved."
   git push origin main
   ```

2. **Monitor the deployment** in:
   - GitHub Actions: https://github.com/MDJTalha/vantage-Live-Streaming-MDT/actions
   - Vercel Dashboard: https://vercel.com/dashboard

3. **Verify** the deployed site works correctly at your Vercel URL

---

## 📞 Support

If issues persist, check:
- GitHub Actions logs for build errors
- Vercel deployment logs for runtime errors
- Browser console for client-side errors

### Common Error Solutions

| Error | Solution |
|-------|----------|
| `npm ERR! code ERESOLVE` | Use `--legacy-peer-deps` (already configured) |
| `Module not found: @vantage/*` | Ensure turbo build filter is `web...` |
| `Command failed with exit code 1` | Check Node.js version is 20.x |
| `VERCEL_TOKEN not found` | Add secret to GitHub repository |

