import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Running database migrations...');

  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate dev --name init', {
      stdio: 'inherit',
      cwd: __dirname,
    });

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
