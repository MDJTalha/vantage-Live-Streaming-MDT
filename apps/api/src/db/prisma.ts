import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the global object in development to prevent
// exhausting database connections during hot reloading

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // Connection pool settings
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
