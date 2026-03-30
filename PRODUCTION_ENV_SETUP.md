# 🔐 Production Environment Setup Guide

## ✅ What's Done

- ✅ Created `apps/web/.env.production` template
- ✅ Updated `.gitignore` to protect environment files
- ✅ Environment files are **NOT committed to GitHub** (secure)

---

## 🚀 Setting Up Production Environment for Vercel

### **Method 1: Vercel Dashboard** (RECOMMENDED - Most Secure)

Instead of using a `.env` file, add environment variables directly in Vercel:

#### **STEP 1:** Go to Vercel Dashboard
https://vercel.com/MDJTalha/vantage-live-streaming-mdt-web/settings/environment-variables

#### **STEP 2:** Add Environment Variables

Click **"Add New"** for each variable:

| Name | Value | Production | Preview | Development |
|------|-------|:----------:|:-------:|:-----------:|
| `NEXT_PUBLIC_APP_NAME` | `VANTAGE` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://vantage.aivon.site` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_WS_URL` | `wss://your-api-domain.com` | ✅ | ✅ | ✅ |
| `NODE_ENV` | `production` | ✅ | ❌ | ❌ |

> ⚠️ **Replace `your-api-domain.com` with your actual backend API URL**

#### **STEP 3:** Click **"Save"**

#### **Benefits of This Method:**
- ✅ More secure (credentials not in code)
- ✅ Easy to update without redeploying
- ✅ Different values for Preview/Production
- ✅ Complies with security best practices

---

### **Method 2: Using `.env.production` File** (Local Only)

If you prefer a local file (for testing):

#### **File Location:**
```
apps/web/.env.production
```

#### **Contents:**
```bash
NEXT_PUBLIC_APP_NAME=VANTAGE
NEXT_PUBLIC_APP_URL=https://vantage.aivon.site
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
NODE_ENV=production
```

> ⚠️ **IMPORTANT:** This file is in `.gitignore` and will NOT be committed to GitHub

---

## 📋 Environment Variables Explained

### **Required Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_NAME` | App name shown in UI | `VANTAGE` |
| `NEXT_PUBLIC_APP_URL` | Your site URL | `https://vantage.aivon.site` |
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `https://api.yoursite.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket endpoint | `wss://api.yoursite.com` |

### **Optional Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | `https://...@sentry.io/123` |
| `NEXT_PUBLIC_HOTJAR_ID` | Hotjar analytics | `123456` |

---

## 🔒 Security Best Practices

### ✅ DO:
- Use Vercel Dashboard for production secrets
- Use strong, unique values for each environment
- Rotate secrets regularly
- Use environment-specific API URLs

### ❌ DON'T:
- Commit `.env` files to GitHub
- Share credentials in chat/email
- Use the same secrets in dev and production
- Hardcode credentials in source code

---

## 🧪 Testing Locally

### **Development Mode:**
```bash
cd apps/web
npm run dev
```
Uses: `.env.local` or `.env.example`

### **Production Build Test:**
```bash
cd apps/web
npm run build
npm run start
```
Uses: `.env.production`

---

## 📊 Environment Configuration Summary

| Environment | Where Configured | Purpose |
|-------------|------------------|---------|
| **Development** | `.env.local` | Local development |
| **Preview** | Vercel Dashboard | Pull request previews |
| **Production** | Vercel Dashboard | Live site (vantage.aivon.site) |

---

## 🔄 Updating Environment Variables

### In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Edit the variable
3. Click **"Save"**
4. **Redeploy** for changes to take effect

### Local File:
1. Edit `apps/web/.env.production`
2. Commit and push (file is ignored, so only you have it)
3. Deploy via `vercel --prod`

---

## 🆘 Troubleshooting

### Issue: "Environment variable not found"

**Solution:**
1. Check variable name is spelled correctly
2. Ensure it's set for the correct environment (Production/Preview/Development)
3. Redeploy after adding new variables

### Issue: "NEXT_PUBLIC_* variables not working"

**Solution:**
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Restart dev server after adding new variables
- Rebuild for production: `npm run build`

### Issue: API calls failing

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure CORS is configured on backend
- Check for https:// vs http:// mismatch

---

## 📞 Quick Reference

### Your Vercel Project:
https://vercel.com/MDJTalha/vantage-live-streaming-mdt-web

### Environment Variables Settings:
https://vercel.com/MDJTalha/vantage-live-streaming-mdt-web/settings/environment-variables

### Current Files:
- `apps/web/.env.production` - Production template (local only)
- `apps/web/.env.example` - Development template
- `.gitignore` - Protects all .env files

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All required environment variables added in Vercel
- [ ] API URLs point to production backend
- [ ] No sensitive data in code or GitHub
- [ ] `.env.production` is in `.gitignore`
- [ ] Tested with production build locally

---

## 🎯 Next Steps

1. **Add environment variables in Vercel Dashboard** (5 minutes)
2. **Deploy your site** (see DEPLOY_NOW.md)
3. **Verify site loads** at https://vantage.aivon.site

---

**Remember: Never commit `.env` files to version control!** 🔐
