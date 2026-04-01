# 🚀 DEPLOYMENT INSTRUCTIONS - Follow These Steps

## ❌ CLI Deployment Issue
The CLI deployment failed because Vercel needs special monorepo configuration.

## ✅ BEST SOLUTION: Deploy via Vercel Dashboard

### **STEP 1: Go to Vercel Dashboard**
Open this link in your browser:
👉 **https://vercel.com/new**

### **STEP 2: Import Your GitHub Repository**
1. Click **"Import Git Repository"**
2. Search for: `MDJTalha/vantage-Live-Streaming-MDT`
3. Click **"Import"**

### **STEP 3: Configure Project Settings** ⚠️ IMPORTANT

On the **"Configure"** screen, click **"Edit"** on each setting:

#### **Framework Preset**
- Select: **Next.js**

#### **Root Directory**
- Click **"Edit"**
- Type: `apps/web`
- Click **"Save"**

#### **Build Command**
- Click **"Edit"**  
- Check **"Override"**
- Type: `cd ../.. && npm ci --legacy-peer-deps && npx turbo run build --filter=web... --no-cache`
- Click **"Save"**

#### **Output Directory**
- Should automatically be: `.next`
- If not, type: `.next`

#### **Install Command**
- Click **"Edit"**
- Check **"Override"**
- Type: `cd ../.. && npm ci --legacy-peer-deps`
- Click **"Save"**

### **STEP 4: Add Environment Variables**

Click **"Environment Variables"** dropdown, then **"Add New"** for each:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_APP_NAME` | `VANTAGE` | ✅ Production ✅ Preview ✅ Development |
| `NEXT_PUBLIC_APP_URL` | `https://vantage.aivon.site` | ✅ All |
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com` | ✅ All |
| `NEXT_PUBLIC_WS_URL` | `wss://your-api-domain.com` | ✅ All |

> Replace `your-api-domain.com` with your actual backend API URL

Click **"Save"**

### **STEP 5: Deploy**
- Click **"Deploy"** button
- Wait 3-5 minutes for build to complete

### **STEP 6: Connect Your Domain**

After deployment succeeds:

1. Go to project **Settings → Domains**
2. Click **"Add Existing Domain"**
3. Type: `vantage.aivon.site`
4. Click **"Next"**
5. Vercel will show DNS configuration
6. Update your DNS at domain provider:

   ```
   Type: CNAME
   Name: vantage
   Value: e7edfc323dce866.vercel-dns-017.com.
   ```

7. Wait 5-30 minutes for DNS propagation
8. Click **"Refresh**" in Vercel until you see green checkmark

---

## 🎯 Direct Links

### Your Vercel Dashboard:
https://vercel.com/muhammad-talhas-projects-381912c6

### Create New Project:
https://vercel.com/new

### GitHub Repository:
https://github.com/MDJTalha/vantage-Live-Streaming-MDT

---

## ✅ Expected Result

After deployment:
- ✅ Site live at: `https://vantage.aivon.site`
- ✅ Temporary URL: `https://vantage-live-streaming-mdt-web.vercel.app`
- ✅ Green checkmark in Vercel dashboard
- ✅ No more 404 error

---

## 🆘 If You Need Help

**Deployment Logs:** https://vercel.com/muhammad-talhas-projects-381912c6/web/deployments

**Support:** Check `DEPLOYMENT_STATUS_CHECK.md` for troubleshooting

---

## 📋 Quick Checklist

- [ ] Go to vercel.com/new
- [ ] Import GitHub repo
- [ ] Set Root Directory to `apps/web`
- [ ] Set Build Command (see above)
- [ ] Set Install Command (see above)
- [ ] Add environment variables
- [ ] Click Deploy
- [ ] Add custom domain
- [ ] Update DNS records

**Total time: 10-15 minutes**
