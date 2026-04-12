import '@testing-library/jest-dom';

// Set API_URL for tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: jest.fn(() => {
      for (const key in mockLocalStorage) {
        delete mockLocalStorage[key];
      }
    }),
    key: jest.fn((index: number) => Object.keys(mockLocalStorage)[index] || null),
    length: Object.keys(mockLocalStorage).length,
  },
  writable: true,
});

// Suppress console errors during tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  (global.fetch as jest.Mock).mockClear();
});
