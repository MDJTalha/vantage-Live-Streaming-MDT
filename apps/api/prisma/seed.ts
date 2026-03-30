import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
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

  // Create demo room
  const room = await prisma.room.create({
    data: {
      roomCode: 'demo-room-001',
      name: 'Demo Meeting Room',
      description: 'A sample room for testing VANTAGE platform',
      hostId: host.id,
      status: 'SCHEDULED',
      settings: {
        maxParticipants: 100,
        allowChat: true,
        allowScreenShare: true,
        allowRecording: true,
        requirePassword: false,
        requireApproval: false,
        enableBreakoutRooms: true,
        enableWaitingRoom: false,
      },
    },
  });
  console.log('✅ Created demo room:', room.roomCode);

  // Create demo poll
  const poll = await prisma.poll.create({
    data: {
      roomId: room.id,
      question: 'What feature are you most excited about?',
      options: JSON.stringify([
        { id: '1', text: 'HD Video Streaming', votes: 0 },
        { id: '2', text: 'AI Transcription', votes: 0 },
        { id: '3', text: 'Breakout Rooms', votes: 0 },
        { id: '4', text: 'Screen Sharing', votes: 0 },
      ]),
      multipleChoice: false,
      createdBy: host.id,
      status: 'DRAFT',
    },
  });
  console.log('✅ Created demo poll:', poll.id);

  // Create room analytics
  const analytics = await prisma.roomAnalytics.create({
    data: {
      roomId: room.id,
      totalParticipants: 0,
      peakConcurrent: 0,
      totalDuration: 0,
      chatMessages: 0,
      engagementMetrics: {
        averageWatchTime: 0,
        pollParticipation: 0,
        questionCount: 0,
        reactionCount: 0,
      },
    },
  });
  console.log('✅ Created room analytics:', analytics.id);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:    admin@vantage.live / admin123');
  console.log('   Host:     host@vantage.live / host123');
  console.log('   User:     user@vantage.live / user123');
  console.log('   Room:     demo-room-001');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
