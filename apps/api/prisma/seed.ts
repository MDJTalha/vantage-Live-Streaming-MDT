import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('@admin@123#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vantage.live' },
    update: {},
    create: {
      email: 'admin@vantage.live',
      passwordHash: adminPassword,
      name: 'VANTAGE Admin',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo host user
  const hostPassword = await bcrypt.hash('host123', 10);
  const host = await prisma.user.upsert({
    where: { email: 'host@vantage.live' },
    update: {},
    create: {
      email: 'host@vantage.live',
      passwordHash: hostPassword,
      name: 'Demo Host',
      role: 'HOST',
      emailVerified: true,
    },
  });
  console.log('✅ Created host user:', host.email);

  // Create demo participant user
  const participantPassword = await bcrypt.hash('user123', 10);
  const participant = await prisma.user.upsert({
    where: { email: 'user@vantage.live' },
    update: {},
    create: {
      email: 'user@vantage.live',
      passwordHash: participantPassword,
      name: 'Demo User',
      role: 'PARTICIPANT',
      emailVerified: true,
    },
  });
  console.log('✅ Created participant user:', participant.email);

  // Create demo meeting
  const meeting = await prisma.meeting.create({
    data: {
      code: 'DEMO-001',
      name: 'Demo Meeting',
      description: 'A sample meeting for testing VANTAGE platform',
      hostId: host.id,
      status: 'SCHEDULED',
      allowChat: true,
      allowScreenShare: true,
      allowRecording: true,
      requirePassword: false,
      enableWaitingRoom: false,
      enableBreakoutRooms: false,
      maxParticipants: 100,
    },
  });
  console.log('✅ Created demo meeting:', meeting.code);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:    admin@vantage.live / @admin@123#');
  console.log('   Host:     host@vantage.live / host123');
  console.log('   User:     user@vantage.live / user123');
  console.log('   Meeting:  DEMO-001');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
