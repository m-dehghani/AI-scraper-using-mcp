import { Logger } from '@nestjs/common';

// Global test setup for E2E tests
beforeAll(() => {
    const logger = new Logger('E2E Test Setup');
    logger.log('Setting up E2E test environment...');

    // Set up any global test configuration
    process.env.NODE_ENV = 'test';

    // Increase timeout for E2E tests
    jest.setTimeout(60000);

    logger.log('E2E test environment setup complete');
});

afterAll(() => {
    const logger = new Logger('E2E Test Cleanup');
    logger.log('Cleaning up E2E test environment...');

    // Clean up any global resources
    // This is where you would clean up any global state

    logger.log('E2E test environment cleanup complete');
});

// Global error handler for E2E tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
