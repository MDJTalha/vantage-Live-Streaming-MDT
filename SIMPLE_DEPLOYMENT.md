# 🚀 ONE-CLICK DEPLOYMENT - Follow These EXACT Steps

## ⚡ I've Prepared Everything - You Just Click 5 Times!

---

## **STEP 1: Delete Old Projects** (2 clicks)

### Click this link:
👉 **https://vercel.com/muhammad-talhas-projects-381912c6/web/settings**

### Then:
1. Scroll to bottom of page
2. Click **"Delete Project"** button
3. Type **"web"** to confirm
4. Click **"Delete"**

---

## **STEP 2: Create New Project** (3 clicks)

### Click this link:
👉 **https://vercel.com/new/git/github?repository=MDJTalha%2Fvantage-Live-Streaming-MDT&root-directory=apps%2Fweb**

### Then:
1. Click **"Import"** button
2. Wait for it to load...

---

## **STEP 3: Configure Settings** (COPY these exactly)

When you see the **"Configure Project"** screen:

### Click **"Edit"** next to each field and paste these:

**Root Directory:**
```
apps/web
```

**Build Command:** (Check "Override" first)
```
cd ../.. && npm ci --legacy-peer-deps && npx turbo run build --filter=web... --no-cache
```

**Install Command:** (Check "Override" first)
```
cd ../.. && npm ci --legacy-peer-deps
```

**Output Directory:** (should already be correct)
```
.next
```

---

## **STEP 4: Add Environment Variables**

Click **"Environment Variables"** dropdown, then click **"Add New"** 4 times:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_NAME` | `VANTAGE` |
| `NEXT_PUBLIC_APP_URL` | `https://vantage.aivon.site` |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.yourdomain.com` |

> ⚠️ Replace `api.yourdomain.com` with your actual backend API URL

---

## **STEP 5: Deploy!** (1 click)

Click the big **"Deploy"** button

Wait 3-5 minutes...

---

## ✅ DONE!

Your site will be live at:
- **https://vantage.aivon.site** (your domain)
- **https://vantage-live-streaming-mdt-web.vercel.app** (temporary URL)

---

## 🎯 Quick Links Summary

| Step | Action | Link |
|------|--------|------|
| 1 | Delete old project | https://vercel.com/muhammad-talhas-projects-381912c6/web/settings |
| 2 | Create new project | https://vercel.com/new/git/github?repository=MDJTalha%2Fvantage-Live-Streaming-MDT&root-directory=apps%2Fweb |
| 3 | Configure settings | Copy from above |
| 4 | Add environment variables | Add 4 variables |
| 5 | Deploy | Click "Deploy" button |

---

## 📞 If You Get Stuck

**Total Time:** 5-10 minutes  
**Difficulty:** Easy (just copying and clicking)

**I've done all the hard work - you just need to follow these steps!**

---

## ✅ What I've Done For You:

- ✅ Fixed all code issues
- ✅ Fixed all Dockerfiles
- ✅ Fixed CI/CD workflow
- ✅ Created correct build commands
- ✅ Prepared environment variables
- ✅ Created this simple guide

**Now you just need to click the links above!** 🚀
