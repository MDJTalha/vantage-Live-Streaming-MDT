# PostgreSQL Setup for VANTAGE Platform
**Date:** April 1, 2026

## 🚀 Quick Setup Guide

### Option 1: Install PostgreSQL (Recommended)

**Step 1: Download PostgreSQL**
1. Go to: https://www.postgresql.org/download/windows/
2. Download "PostgreSQL 15" installer
3. Run installer as Administrator

**Step 2: Installation Settings**
- **Port:** 5432
- **Password:** `vantage_dev_password_2026` (or choose your own)
- **Locale:** Default (English, United States)

**Step 3: Create Database**
Open pgAdmin or Command Prompt:

```bash
# Using Command Prompt
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres

# Then in PostgreSQL shell:
CREATE DATABASE vantage;
CREATE USER vantage WITH PASSWORD 'vantage_dev_password_2026';
GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;
\q
```

---

### Option 2: Use Docker (If Docker Desktop is Running)

**Step 1: Start Docker Desktop**
- Open Docker Desktop from Start Menu
- Wait for it to show "Docker Desktop is running"

**Step 2: Run PostgreSQL Container**
```bash
docker run -d --name vantage-postgres ^
  -e POSTGRES_USER=vantage ^
  -e POSTGRES_PASSWORD=vantage_dev_password_2026 ^
  -e POSTGRES_DB=vantage ^
  -p 5432:5432 ^
  -v vantage_data:/var/lib/postgresql/data ^
  postgres:15-alpine
```

---

### Step 4: Update .env.local

After PostgreSQL is installed, update this file:
`c:\Projects\Live-Streaming-\.env.local`

**Find this line:**
```env
DATABASE_URL=postgresql://vantage:dev_password_change_me@localhost:5432/vantage?schema=public
```

**Replace with:**
```env
DATABASE_URL=postgresql://vantage:vantage_dev_password_2026@localhost:5432/vantage?schema=public
```

**If you used different password during installation:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage?schema=public
```

---

### Step 5: Run Migrations

Open Command Prompt in project directory:

```bash
cd c:\Projects\Live-Streaming-\apps\api

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed database with test data
npm run db:seed
```

---

### Step 6: Test Connection

```bash
cd c:\Projects\Live-Streaming-\apps\api
npm run build
```

If build succeeds with fewer errors, database is connected!

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
**Solution:** Check if PostgreSQL service is running:
```bash
# Windows Services
services.msc
# Find "postgresql-x64-15" and make sure it's "Running"
```

### Error: "Authentication failed"
**Solution:** Update password in `.env.local` to match your PostgreSQL password

### Error: "Database does not exist"
**Solution:** Create database manually:
```bash
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres
CREATE DATABASE vantage;
\q
```

### Error: "Prisma migrate failed"
**Solution:** Reset database and try again:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] PostgreSQL service is running
- [ ] Database `vantage` exists
- [ ] `.env.local` has correct DATABASE_URL
- [ ] Prisma migrations ran successfully
- [ ] Prisma client generated
- [ ] API builds with reduced errors

---

## 📞 Need Help?

1. Check PostgreSQL is running: `services.msc` → Find postgresql service
2. Test connection: `psql -U vantage -d vantage`
3. Check logs: `c:\Projects\Live-Streaming-\apps\api\logs\`

---

**Next Steps After Database Setup:**
1. Restart API server: `npm run dev` in `apps\api`
2. Test user registration at http://localhost:3000/signup
3. Create your first room!
