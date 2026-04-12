/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vantage/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@vantage/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@vantage/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: { ignoreCodes: [151001] },
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(socket.io-client|engine.io-client)/)',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

module.exports = config;
