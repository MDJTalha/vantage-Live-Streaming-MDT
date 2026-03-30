# VANTAGE - Quick Start Guide

## Prerequisites

- Node.js >= 20.0.0 ✓ (Installed: v24.8.0)
- npm >= 10.0.0 ✓ (Installed: v11.8.0)
- PostgreSQL 15 ✓ (Installed: 15.17)

---

## Step 1: Setup Database

Open **pgAdmin** or **psql** and run:

```sql
-- Create database
CREATE DATABASE vantage;

-- Update .env.local with your PostgreSQL password
-- Edit: c:\Projects\Live-Streaming-\.env.local
-- Change: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage
```

**Or use psql command line:**

```bash
# Open Command Prompt
cd C:\Projects\Live-Streaming-

# Connect to PostgreSQL (enter your password when prompted)
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost

# In psql prompt:
CREATE DATABASE vantage;
\q
```

---

## Step 2: Update Environment File

Edit `c:\Projects\Live-Streaming-\.env.local`:

```env
# Replace YOUR_PASSWORD with your actual PostgreSQL password
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage?schema=public
```

---

## Step 3: Generate Prisma Client

```bash
cd c:\Projects\Live-Streaming-\apps\api
npm run db:generate
```

---

## Step 4: Run Database Migrations

```bash
cd c:\Projects\Live-Streaming-\apps\api
npm run db:migrate
```

---

## Step 5: Seed Database (Optional)

```bash
cd c:\Projects\Live-Streaming-\apps\api
npm run db:seed
```

This creates demo users:
- **Admin**: admin@vantage.live / admin123
- **Host**: host@vantage.live / host123
- **User**: user@vantage.live / user123

---

## Step 6: Start Development Servers

```bash
# From root directory
cd c:\Projects\Live-Streaming-
npm run dev
```

This starts:
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:4000
- **WebSocket**: ws://localhost:4000

---

## Troubleshooting

### PostgreSQL Connection Error

1. Check PostgreSQL is running:
   ```bash
   "C:\Program Files\PostgreSQL\15\bin\pg_ctl" status
   ```

2. Verify connection:
   ```bash
   "C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost -c "SELECT version();"
   ```

3. Check pg_hba.conf allows password auth:
   ```
   # File: C:\Program Files\PostgreSQL\15\data\pg_hba.conf
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

### Prisma Errors

```bash
# Reset and regenerate
cd apps\api
npm run db:generate
```

### Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## Demo Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vantage.live | admin123 |
| Host | host@vantage.live | host123 |
| User | user@vantage.live | user123 |

---

## Next Steps

1. ✅ Setup Database
2. ✅ Update .env.local
3. ✅ Generate Prisma Client
4. ✅ Run Migrations
5. ✅ Seed Database
6. ✅ Start Dev Servers
7. 🚀 Open http://localhost:3000

---

**Need help?** Check `docs/` folder for detailed documentation.
