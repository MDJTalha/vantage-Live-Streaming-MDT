# 🔐 VANTAGE Environment Variables Setup

This guide helps you configure all required environment variables for GitHub Actions and Vercel deployment.

---

## 📋 Required Environment Variables

### **GitHub Secrets** (Repository Settings → Secrets → Actions)

| Variable | Description | Example |
|----------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | `...` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_...` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `NEXT_PUBLIC_API_URL` | API endpoint URL | `https://api.vantage.app` |
| `NEXT_PUBLIC_SITE_URL` | Site URL | `https://vantage.app` |
| `TURBO_TOKEN` | Turborepo remote cache token | `...` |
| `TURBO_TEAM` | Turborepo team ID | `...` |

---

## 🔑 How to Get Vercel Credentials

### **Step 1: Get Vercel Token**

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it: `vantage-github-actions`
4. Copy the token
5. Add to GitHub Secrets as `VERCEL_TOKEN`

### **Step 2: Get Organization ID**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your organization
3. Go to **Settings** → **General**
4. Copy **Organization ID**
5. Add to GitHub Secrets as `VERCEL_ORG_ID`

### **Step 3: Get Project ID**

1. Go to your project in Vercel
2. Go to **Settings** → **General**
3. Copy **Project ID**
4. Add to GitHub Secrets as `VERCEL_PROJECT_ID`

---

## 🗄️ Database Configuration

### **PostgreSQL Connection String**

Format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Example:
```
postgresql://vantage:postgres@localhost:5432/vantage?schema=public
```

For production (e.g., Supabase, Neon, Railway):
```
postgresql://user:password@host.region.provider.com:5432/vantage?schema=public
```

---

## 🚀 Vercel Environment Variables

Add these in **Vercel Project Settings** → **Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Your API URL | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | Production, Preview, Development |
| `DATABASE_URL` | PostgreSQL connection | Production, Preview |
| `JWT_SECRET` | Your JWT secret | Production, Preview |
| `ENCRYPTION_KEY` | Your encryption key | Production, Preview |

---

## 📝 Quick Setup Script

Run this script to set up environment variables:

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values
nano .env.local

# For Vercel CLI
vercel env pull
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to Git
2. **Use GitHub Secrets** for sensitive data
3. **Rotate tokens** regularly
4. **Use different credentials** for dev/staging/production
5. **Enable Vercel's Environment Variables encryption**

---

## ✅ Verification Checklist

- [ ] All GitHub Secrets added
- [ ] Vercel environment variables configured
- [ ] Database connection tested
- [ ] Build succeeds locally
- [ ] Deployment succeeds on push

---

## 🆘 Troubleshooting

### **Error: Missing VERCEL_TOKEN**
```
Solution: Add VERCEL_TOKEN to GitHub Secrets
```

### **Error: DATABASE_URL not found**
```
Solution: Add DATABASE_URL to both GitHub Secrets and Vercel Environment Variables
```

### **Error: Build fails on Vercel**
```
Solution: Check build logs in Vercel dashboard. Ensure all dependencies are installed.
```

---

## 📞 Support

For issues:
- GitHub Actions: Check **Actions** tab in repository
- Vercel: Check **Deployments** in Vercel dashboard
- Logs: View detailed logs in respective platforms
