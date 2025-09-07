module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        '**/*.(t|j)s',
        '!**/*.interface.ts',
        '!**/*.module.ts',
        '!**/main.ts',
        '!**/index.ts',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapping: {
        '^@app/(.*)$': '<rootDir>/$1',
        '^@features/(.*)$': '<rootDir>/features/$1',
        '^@common/(.*)$': '<rootDir>/common/$1',
        '^@config/(.*)$': '<rootDir>/config/$1',
        '^@test/(.*)$': '<rootDir>/../test/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
    testTimeout: 30000,
};
