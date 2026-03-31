# 🚀 VANTAGE Platform - Setup & Installation Guide

## ✅ What's Been Implemented (Phase 1 Complete)

### **Database & Prisma Setup** ✅
- ✅ Complete Prisma schema with all models
- ✅ User, Meeting, Participant, Message, Recording, Podcast models
- ✅ Proper relations and indexes
- ✅ Production-ready meeting service
- ✅ Backend API routes for meetings

---

## 📋 **Setup Instructions**

### **Step 1: Install Prisma**

```bash
cd c:\Projects\Live-Streaming-
npm install prisma @prisma/client --save-dev
npm install @prisma/client
```

### **Step 2: Setup Database**

#### **Option A: Using Docker (Recommended)**

```bash
# Create docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vantage-postgres
    environment:
      POSTGRES_USER: vantage
      POSTGRES_PASSWORD: your_secure_password_here
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

#### **Option B: Local PostgreSQL**

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create database:
```sql
CREATE DATABASE vantage;
CREATE USER vantage WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;
```

### **Step 3: Configure Environment**

Create `.env` file in `apps/api/`:

```bash
cd apps/api
copy .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://vantage:your_secure_password_here@localhost:5432/vantage?schema=public
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
ENCRYPTION_KEY=your_64_character_hex_encryption_key_here
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### **Step 4: Initialize Prisma**

```bash
cd c:\Projects\Live-Streaming-
npx prisma init --schema-dir=prisma
```

### **Step 5: Generate Prisma Client**

```bash
npx prisma generate
```

### **Step 6: Run Database Migrations**

```bash
npx prisma migrate dev --name init
```

This will:
- Create the `prisma/migrations` folder
- Generate SQL migration files
- Apply migrations to your database
- Create all tables

### **Step 7: Seed Database (Optional)**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('@admin@123#', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vantage.live' },
    update: {},
    create: {
      email: 'admin@vantage.live',
      password: hashedPassword,
      name: 'VANTAGE Admin',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Then run:
```bash
npx prisma db seed
```

### **Step 8: Start Backend API**

```bash
cd apps/api
npm run dev
```

You should see:
```
✓ Security configuration validated
✓ Monitoring metrics initialized
✓ Database connected
API listening on port 4000
```

### **Step 9: Start Frontend**

In another terminal:
```bash
cd apps/web
npm run dev
```

### **Step 10: Test the API**

Test creating a meeting:

```bash
curl -X POST http://localhost:4000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Meeting",
    "allowChat": true,
    "allowRecording": true
  }'
```

---

## 🎯 **What Works Now**

### **Backend API Endpoints:**

```
GET    /api/v1/meetings          - Get all meetings
GET    /api/v1/meetings/:code    - Get meeting by code
POST   /api/v1/meetings          - Create meeting
PATCH  /api/v1/meetings/:code    - Update meeting
DELETE /api/v1/meetings/:code    - Delete meeting
GET    /api/v1/meetings/statistics - Get statistics
```

### **Frontend Integration:**

- ✅ MeetingService updated to use API
- ✅ Prisma client configured
- ✅ Database schema ready
- ✅ Authentication middleware ready

---

## 📊 **Database Schema**

### **Models Created:**

1. **User** - User accounts with roles
2. **Meeting** - Meeting rooms and sessions
3. **Participant** - Meeting participants
4. **Message** - Chat messages
5. **Reaction** - Emoji reactions
6. **Recording** - Meeting recordings
7. **Podcast** - Podcast channels
8. **Episode** - Podcast episodes
9. **AnalyticsEvent** - Analytics tracking
10. **Notification** - User notifications

---

## 🔧 **Development Commands**

```bash
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name <migration_name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Check database status
npx prisma db check

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

---

##  **Troubleshooting**

### **Error: Cannot connect to database**

1. Check if PostgreSQL is running:
```bash
docker ps | grep postgres
# or
pg_isready -h localhost -p 5432
```

2. Verify DATABASE_URL in `.env`
3. Check database credentials

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

## ✅ **Next Steps (Phase 2)**

After database is set up, we'll implement:

1. ✅ **Real Authentication** - JWT with database
2. ⏳ **WebSocket/Socket.IO** - Real-time chat
3. ⏳ **Recording System** - Media server integration
4. ⏳ **Analytics** - Real metrics
5. ⏳ **Testing** - Unit & integration tests

---

## 📞 **Quick Reference**

### **Database Connection String Examples:**

```
# Local PostgreSQL
postgresql://vantage:password@localhost:5432/vantage

# Docker PostgreSQL
postgresql://vantage:password@localhost:5432/vantage

# Production (example)
postgresql://user:password@host:5432/vantage
```

### **Generate Secure Secrets:**

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Password Hash (for testing)
node -e "console.log(require('bcrypt').hashSync('password', 10))"
```

---

## 🎉 **You're Ready!**

Follow the setup steps above and your database will be ready for production!

**Estimated Setup Time:** 15-30 minutes

**Need Help?** Check the troubleshooting section or the Prisma documentation at https://pris.ly
