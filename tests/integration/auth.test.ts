import request from 'supertest';
import express from 'express';
import authRoutes from '../../apps/api/src/routes/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Auth API Integration', () => {
  const app = express();
  
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);

  const testUser = {
    email: `test-${Date.now()}@vantage.live`,
    password: 'Test123!',
    name: 'Test User',
  };

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `duplicate-${Date.now()}@vantage.live`,
          password: 'Test123!',
          name: 'Test',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `duplicate-${Date.now()}@vantage.live`,
          password: 'Test123!',
          name: 'Test 2',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `weak-${Date.now()}@vantage.live`,
          password: '123',
          name: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Create test user
      const passwordHash = await bcrypt.hash('Test123!', 10);
      await prisma.user.create({
        data: {
          email: `login-test-${Date.now()}@vantage.live`,
          passwordHash,
          name: 'Login Test',
        },
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `login-test-${Date.now()}@vantage.live`,
          password: 'Test123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `login-test-${Date.now()}@vantage.live`,
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
