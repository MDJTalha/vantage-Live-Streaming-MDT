import request from 'supertest';
import app from '../apps/api/src/index';
import prisma from '../apps/api/src/db/prisma';
import bcrypt from 'bcrypt';

describe('Meetings API', () => {
  let accessToken: string;
  let userId: string;

  // Create test user and login before each test
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `test${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
      },
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: 'TestPassword123!',
      });

    accessToken = loginResponse.body.accessToken;
  });

  // Cleanup after each test
  afterEach(async () => {
    await prisma.meeting.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/meetings', () => {
    it('should create a new meeting successfully', async () => {
      const meetingData = {
        name: 'Test Meeting',
        allowChat: true,
        allowRecording: true,
        maxParticipants: 50,
      };

      const response = await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(meetingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('code');
      expect(response.body.name).toBe(meetingData.name);
      expect(response.body.code).toHaveLength(6);
      expect(response.body.allowChat).toBe(true);
    });

    it('should create a scheduled meeting', async () => {
      const meetingData = {
        name: 'Scheduled Meeting',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        duration: 60,
      };

      const response = await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(meetingData)
        .expect(201);

      expect(response.body.status).toBe('SCHEDULED');
      expect(response.body.duration).toBe(60);
    });

    it('should reject meeting creation without authentication', async () => {
      const meetingData = {
        name: 'Test Meeting',
      };

      const response = await request(app)
        .post('/api/v1/meetings')
        .send(meetingData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/meetings', () => {
    beforeEach(async () => {
      // Create test meetings
      await prisma.meeting.createMany({
        data: [
          {
            code: 'TEST001',
            name: 'Meeting 1',
            hostId: userId,
            status: 'ACTIVE',
          },
          {
            code: 'TEST002',
            name: 'Meeting 2',
            hostId: userId,
            status: 'SCHEDULED',
          },
        ],
      });
    });

    it('should get all meetings for user', async () => {
      const response = await request(app)
        .get('/api/v1/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('meetings');
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(2);
    });

    it('should get meetings filtered by hostId', async () => {
      const response = await request(app)
        .get(`/api/v1/meetings?hostId=${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('meetings');
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/meetings/:code', () => {
    beforeEach(async () => {
      await prisma.meeting.create({
        data: {
          code: 'TEST123',
          name: 'Test Meeting',
          hostId: userId,
          status: 'ACTIVE',
        },
      });
    });

    it('should get meeting by code', async () => {
      const response = await request(app)
        .get('/api/v1/meetings/TEST123')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe('TEST123');
      expect(response.body.name).toBe('Test Meeting');
    });

    it('should return 404 for non-existent meeting', async () => {
      const response = await request(app)
        .get('/api/v1/meetings/NONEXIST')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/v1/meetings/:code', () => {
    beforeEach(async () => {
      await prisma.meeting.create({
        data: {
          code: 'TEST123',
          name: 'Original Name',
          hostId: userId,
          status: 'ACTIVE',
        },
      });
    });

    it('should update meeting', async () => {
      const updateData = {
        name: 'Updated Name',
        maxParticipants: 100,
      };

      const response = await request(app)
        .patch('/api/v1/meetings/TEST123')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.maxParticipants).toBe(100);
    });

    it('should not allow updating meeting code', async () => {
      const updateData = {
        code: 'NEWCODE',
      };

      const response = await request(app)
        .patch('/api/v1/meetings/TEST123')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Code should remain unchanged
      expect(response.body.code).toBe('TEST123');
    });
  });

  describe('DELETE /api/v1/meetings/:code', () => {
    beforeEach(async () => {
      await prisma.meeting.create({
        data: {
          code: 'TEST123',
          name: 'Meeting to Delete',
          hostId: userId,
          status: 'ACTIVE',
        },
      });
    });

    it('should delete meeting', async () => {
      await request(app)
        .delete('/api/v1/meetings/TEST123')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify deletion
      const meeting = await prisma.meeting.findUnique({
        where: { code: 'TEST123' },
      });

      expect(meeting).toBeNull();
    });

    it('should return 404 for non-existent meeting', async () => {
      const response = await request(app)
        .delete('/api/v1/meetings/NONEXIST')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/meetings/statistics', () => {
    beforeEach(async () => {
      await prisma.meeting.createMany({
        data: [
          { code: 'TEST001', name: 'Active Meeting', hostId: userId, status: 'ACTIVE' },
          { code: 'TEST002', name: 'Scheduled Meeting', hostId: userId, status: 'SCHEDULED' },
          { code: 'TEST003', name: 'Ended Meeting', hostId: userId, status: 'ENDED' },
        ],
      });
    });

    it('should get meeting statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/meetings/statistics?hostId=${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalMeetings');
      expect(response.body).toHaveProperty('activeMeetings');
      expect(response.body).toHaveProperty('scheduledMeetings');
      expect(response.body.totalMeetings).toBe(3);
      expect(response.body.activeMeetings).toBe(1);
      expect(response.body.scheduledMeetings).toBe(1);
    });
  });
});
