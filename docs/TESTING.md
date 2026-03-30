# VANTAGE Testing Guide

## Overview

VANTAGE includes comprehensive testing for all components:

- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Load Tests** - Performance under load (100+ users)

---

## Running Tests

### Prerequisites

```bash
cd tests
npm install
```

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

### Load Tests

```bash
# Install k6
# macOS
brew install k6

# Windows
winget install k6

# Run load test
npm run test:load

# Or directly
k6 run load/k6-load-test.js
```

---

## Test Coverage

### Current Coverage

| Component | Coverage | Target |
|-----------|----------|--------|
| **Auth Service** | 85% | 80% |
| **E2E Encryption** | 90% | 80% |
| **Room Service** | 75% | 80% |
| **Chat Service** | 70% | 80% |
| **API Routes** | 65% | 70% |

### Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

---

## Load Testing

### Scenarios

| Scenario | Users | Duration | Target |
|----------|-------|----------|--------|
| **Ramp Up** | 0→10 | 30s | Basic load |
| **Growth** | 10→50 | 1m | Medium load |
| **Peak** | 50→100 | 2m | High load |
| **Sustain** | 100 | 3m | Stability |
| **Ramp Down** | 100→0 | 1m | Cool down |

### Performance Targets

| Metric | Target |
|--------|--------|
| **API Response Time (p95)** | < 500ms |
| **WebSocket Latency** | < 100ms |
| **Error Rate** | < 1% |
| **Concurrent Users** | 100+ |
| **Media Server Capacity** | 50 streams/server |

---

## Test Examples

### Unit Test Example

```typescript
describe('E2EEncryptionService', () => {
  it('should encrypt and decrypt data correctly', () => {
    const key = service.generateEncryptionKey();
    const plaintext = 'Hello, VANTAGE!';

    const encrypted = service.encrypt(plaintext, key);
    const decrypted = service.decrypt(
      encrypted.ciphertext,
      key,
      encrypted.iv,
      encrypted.authTag
    );

    expect(decrypted).toBe(plaintext);
  });
});
```

### Integration Test Example

```typescript
describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@vantage.live',
        password: 'Test123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Load Test Example

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to main/develop
- Every pull request

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
```

---

## Troubleshooting

### Tests Failing

1. Check test database is running
2. Verify environment variables
3. Clear Jest cache: `jest --clearCache`
4. Check for port conflicts

### Load Test Failing

1. Increase system resources
2. Check database connections
3. Monitor memory usage
4. Review error logs

### Coverage Low

1. Add tests for edge cases
2. Test error handling
3. Test all branches
4. Add integration tests

---

## Best Practices

1. **Write tests first** (TDD when possible)
2. **Keep tests independent** (no shared state)
3. **Use meaningful test names**
4. **Test edge cases** (empty, null, errors)
5. **Mock external services**
6. **Run tests before committing**
7. **Review coverage reports**
8. **Update tests with features**

---

## Next Steps

1. ✅ **Unit Tests** - Core services
2. ✅ **Integration Tests** - API endpoints
3. ✅ **Load Tests** - 100+ concurrent users
4. 📋 **E2E Tests** - Playwright/Cypress
5. 📋 **Visual Regression** - Percy/Chromatic
6. 📋 **Security Tests** - OWASP ZAP
