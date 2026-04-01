#  VANTAGE Platform - Quick Start Guide

## ✅ Phase 1 Status: COMPLETE

**What's Working:**
- ✅ Prisma schema with 10 models
- ✅ Database migrations ready
- ✅ Backend API routes for meetings
- ✅ Frontend service integrated
- ✅ Prisma Client generated (v5.22.0)

---

## 🚀 Quick Setup (5 Minutes)

### **Step 1: Start PostgreSQL Database**

**Option A: Using Docker (Easiest)**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vantage-postgres
    environment:
      POSTGRES_USER: vantage
      POSTGRES_PASSWORD: vantage_password
      POSTGRES_DB: vantage
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Then run:
```bash
docker-compose up -d postgres
```

**Option B: Using Local PostgreSQL**

If you already have PostgreSQL installed, skip to Step 2.

---

### **Step 2: Configure Database**

Create `apps/api/.env` file:

```bash
cd apps/api
copy .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
JWT_SECRET=super_secret_jwt_key_min_32_characters_long_random
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
PORT=4000
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Important:** Change the password and generate secure secrets!

---

### **Step 3: Run Database Migrations**

```bash
cd c:\Projects\Live-Streaming-
npx prisma migrate dev --name init
```

This will:
- Create migration files
- Apply to database
- Create all tables

You should see:
```
Environment variables loaded and validated:
✓ Database connection successful

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260331000000_init/
    └─ migration.sql

Your database is now in sync with your schema.
```

---

### **Step 4: (Optional) Seed Database**

Create admin user:

```bash
npx prisma db seed
```

Or manually create in Prisma Studio:

```bash
npx prisma studio
```

Then add user:
- Email: `admin@vantage.live`
- Password: `@admin@123#` (hash it first!)
- Name: `VANTAGE Admin`
- Role: `ADMIN`

---

### **Step 5: Start Backend API**

```bash
cd apps/api
npm run dev
```

You should see:
```
✓ Database connected
✓ Security configuration validated
API listening on port 4000
```

---

### **Step 6: Test API**

**Create a Meeting:**

```bash
curl -X POST http://localhost:4000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"name\": \"Test Meeting\",
    \"allowChat\": true,
    \"allowRecording\": true
  }"
```

**Get All Meetings:**

```bash
curl http://localhost:4000/api/v1/meetings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Step 7: Start Frontend**

In another terminal:

```bash
cd apps/web
npm run dev
```

Visit: http://localhost:3000

---

## 📊 **What You Have Now**

### **Database Tables:**
- ✅ User
- ✅ Meeting
- ✅ Participant
- ✅ Message
- ✅ Reaction
- ✅ Recording
- ✅ Podcast
- ✅ Episode
- ✅ AnalyticsEvent
- ✅ Notification

### **API Endpoints:**
```
GET    /api/v1/meetings          - List meetings
GET    /api/v1/meetings/:code    - Get meeting
POST   /api/v1/meetings          - Create meeting
PATCH  /api/v1/meetings/:code    - Update meeting
DELETE /api/v1/meetings/:code    - Delete meeting
GET    /api/v1/meetings/statistics - Statistics
```

---

## 🔧 **Useful Commands**

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (Database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name <name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check database status
npx prisma db check

# View logs
npx prisma debug
```

---

## 🎯 **Next Steps (Phase 2)**

Now that database is working, we'll implement:

1. ⏳ **Real Authentication** - JWT login/register
2. ⏳ **WebSocket/Socket.IO** - Real-time chat
3. ⏳ **Recording System** - Media server
4. ⏳ **Analytics** - Real metrics
5. ⏳ **Testing** - Unit & integration tests

---

## 🆘 **Troubleshooting**

### **Error: Cannot connect to database**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Or check local PostgreSQL
pg_isready -h localhost -p 5432
```

### **Error: Prisma Client not found**

```bash
npx prisma generate
```

### **Error: Migration failed**

```bash
npx prisma migrate reset
npx prisma migrate dev
```

---

## ✅ **Success Checklist**

- [ ] PostgreSQL running
- [ ] `.env` file configured
- [ ] Migrations applied
- [ ] API starts without errors
- [ ] Can create meeting via API
- [ ] Frontend can fetch meetings

---

## 📞 **Need Help?**

- **Prisma Docs:** https://pris.ly
- **PostgreSQL Docs:** https://postgresql.org/docs
- **Your Schema:** `prisma/schema.prisma`
- **Setup Guide:** `DATABASE_SETUP_GUIDE.md`

---

**You're all set! 🎉**

The database foundation is ready. Proceed with Phase 2 implementation!
