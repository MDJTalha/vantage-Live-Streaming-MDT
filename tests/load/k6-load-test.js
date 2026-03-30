import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Test credentials (use demo accounts)
const credentials = {
  email: 'host@vantage.live',
  password: 'host123',
};

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    authToken = body.data.tokens.accessToken;
  }

  return { authToken };
}

export default function (data) {
  const token = data.authToken;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test health endpoint
  testHealth();
  sleep(1);

  // Test authenticated endpoints
  if (token) {
    testUserProfile(headers);
    sleep(1);

    testRooms(headers);
    sleep(1);
  }

  errorRate.add(0);
}

function testHealth() {
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!success);
}

function testUserProfile(headers) {
  const response = http.get(`${BASE_URL}/api/v1/auth/me`, { headers });
  
  const success = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.email;
    },
  });

  errorRate.add(!success);
}

function testRooms(headers) {
  // Get user's rooms
  const response = http.get(`${BASE_URL}/api/v1/rooms`, { headers });
  
  const success = check(response, {
    'rooms status is 200': (r) => r.status === 200,
    'rooms response is valid': (r) => {
      const body = JSON.parse(r.body);
      return body.success && Array.isArray(body.data);
    },
  });

  errorRate.add(!success);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  
  return `
${indent}Execution Summary:
${indent}  Scenarios:  ${data.metrics.iterations.values.count} iterations
${indent}  Duration:   ${data.state.testRunDurationMs / 1000}s
${indent}  VUs Max:    ${data.metrics.vus_max.values.value}
${indent}  Requests:   ${data.metrics.http_reqs.values.count}
${indent}  Req Rate:   ${data.metrics.http_reqs.values.rate}/s
${indent}  Errors:     ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
  `;
}
