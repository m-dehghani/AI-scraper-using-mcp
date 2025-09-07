module.exports = {
    displayName: 'Integration Tests',
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '../',
    testMatch: ['<rootDir>/test/**/*.spec.ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.interface.ts',
        '!src/**/*.module.ts',
        '!src/main.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: 'coverage',
    moduleNameMapping: {
        '^@app/(.*)$': '<rootDir>/src/$1',
        '^@features/(.*)$': '<rootDir>/src/features/$1',
        '^@common/(.*)$': '<rootDir>/src/common/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@test/(.*)$': '<rootDir>/test/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testTimeout: 30000,
    verbose: true,
};
