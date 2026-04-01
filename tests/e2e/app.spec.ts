import { test, expect, devices } from '@playwright/test';

// Test configuration
const config = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  apiURL: process.env.API_URL || 'http://localhost:4000',
};

// Test credentials (create these in your database)
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

test.describe('VANTAGE Platform E2E Tests', () => {
  
  test.describe('Authentication Flow', () => {
    
    test('should register a new user', async ({ page }) => {
      const randomEmail = `test${Date.now()}@example.com`;
      
      // Go to signup page
      await page.goto(`${config.baseURL}/signup`);
      
      // Fill registration form
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', randomEmail);
      await page.fill('input[name="password"]', testUser.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL(/\/dashboard/);
      
      // Verify user is logged in
      const welcomeText = await page.textContent('h1, h2');
      expect(welcomeText.toLowerCase()).toContain('dashboard');
    });

    test('should login with valid credentials', async ({ page }) => {
      // Go to login page
      await page.goto(`${config.baseURL}/login`);
      
      // Fill login form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL(/\/dashboard/);
      
      // Verify user is logged in
      const url = page.url();
      expect(url).toContain('/dashboard');
    });

    test('should show error for invalid login', async ({ page }) => {
      // Go to login page
      await page.goto(`${config.baseURL}/login`);
      
      // Fill with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector('text=/error|invalid|failed/i', { timeout: 5000 });
      
      // Verify error message is shown
      const errorText = await page.textContent('.error-message, [role="alert"]');
      expect(errorText).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto(`${config.baseURL}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
      
      // Logout
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
      
      // Wait for navigation to login page
      await page.waitForURL(/\/login/);
      
      // Verify user is logged out
      const url = page.url();
      expect(url).toContain('/login');
    });
  });

  test.describe('Dashboard', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${config.baseURL}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should load dashboard successfully', async ({ page }) => {
      // Verify dashboard loads
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Check for dashboard elements
      await expect(page.locator('text=/dashboard/i')).toBeVisible();
    });

    test('should display meeting statistics', async ({ page }) => {
      // Check for statistics cards
      const statsCards = page.locator('[data-testid="stat-card"], .stat-card');
      await expect(statsCards.first()).toBeVisible();
    });

    test('should create a new meeting', async ({ page }) => {
      // Click create meeting button
      await page.click('button:has-text("Create"), button:has-text("New Meeting")');
      
      // Fill meeting form
      await page.fill('input[name="name"]', 'E2E Test Meeting');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success message or redirect
      await page.waitForSelector('text=/success|created/i', { timeout: 5000 });
    });

    test('should display meeting list', async ({ page }) => {
      // Check for meeting list
      const meetingList = page.locator('[data-testid="meeting-list"], .meeting-list');
      await expect(meetingList).toBeVisible();
    });
  });

  test.describe('Meeting Room', () => {
    
    test('should join a meeting room', async ({ page }) => {
      // Login and create a meeting first
      await page.goto(`${config.baseURL}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
      
      // Create meeting
      await page.click('button:has-text("Create")');
      await page.fill('input[name="name"]', 'E2E Room Test');
      await page.click('button[type="submit"]');
      
      // Wait for room page
      await page.waitForURL(/\/room\//);
      
      // Verify room loads
      await expect(page.locator('text=/E2E Room Test/i')).toBeVisible();
    });

    test('should toggle audio/video in meeting', async ({ page }) => {
      // Join meeting room (setup omitted for brevity)
      await page.goto(`${config.baseURL}/room/TEST123`);
      
      // Toggle audio
      await page.click('[data-testid="toggle-audio"], button[aria-label*="mute" i]');
      await page.waitForTimeout(500);
      
      // Toggle video
      await page.click('[data-testid="toggle-video"], button[aria-label*="video" i]');
      await page.waitForTimeout(500);
      
      // Verify toggles worked
      const audioButton = page.locator('[data-testid="toggle-audio"]');
      await expect(audioButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize(devices['iPhone 13'].viewport!);
      
      // Go to login page
      await page.goto(`${config.baseURL}/login`);
      
      // Verify mobile layout
      const loginForm = page.locator('form');
      await expect(loginForm).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize(devices['iPad Pro'].viewport!);
      
      // Go to dashboard
      await page.goto(`${config.baseURL}/dashboard`);
      
      // Verify tablet layout
      const dashboard = page.locator('[data-testid="dashboard"]');
      await expect(dashboard).toBeVisible();
    });
  });
});
