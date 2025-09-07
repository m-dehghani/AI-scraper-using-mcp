import 'reflect-metadata';

// Global test setup
beforeAll(async () => {
    // Setup any global test configuration here
});

afterAll(async () => {
    // Cleanup any global test resources here
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
