#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

const logger = new Logger('E2E Test Runner');

interface TestSuite {
    name: string;
    file: string;
    description: string;
}

const testSuites: TestSuite[] = [
    {
        name: 'Application Bootstrap',
        file: 'application-bootstrap.e2e-spec.ts',
        description:
            'Tests application initialization, service registration, and dependency injection',
    },
    {
        name: 'Scraper Workflow',
        file: 'scraper-workflow.e2e-spec.ts',
        description:
            'Tests complete scraping workflows, prompt parsing, and CSV export',
    },
    {
        name: 'Main Application Flow',
        file: 'main-application.e2e-spec.ts',
        description:
            'Tests main application entry point, user interactions, and error handling',
    },
    {
        name: 'App Controller',
        file: 'app.e2e-spec.ts',
        description: 'Tests basic application controller functionality',
    },
    {
        name: 'Main Application',
        file: 'main.e2e-spec.ts',
        description: 'Tests main application services and dependencies',
    },
];

function runE2ETests(): void {
    logger.log('🚀 Starting E2E Test Suite');
    logger.log('=====================================');

    const results: {
        suite: string;
        passed: boolean;
        duration: number;
        error?: string;
    }[] = [];

    for (const suite of testSuites) {
        logger.log(`\n📋 Running ${suite.name}...`);
        logger.log(`   Description: ${suite.description}`);
        logger.log(`   File: ${suite.file}`);

        const startTime = Date.now();
        let passed = false;
        let error: string | undefined;

        try {
            execSync(`npm run test:e2e -- --testPathPattern="${suite.file}"`, {
                stdio: 'pipe',
                cwd: process.cwd(),
            });
            passed = true;
        } catch (err) {
            error = err instanceof Error ? err.message : String(err);
            passed = false;
        }

        const duration = Date.now() - startTime;
        results.push({ suite: suite.name, passed, duration, error });

        if (passed) {
            logger.log(`   ✅ ${suite.name} - PASSED (${duration}ms)`);
        } else {
            logger.log(`   ❌ ${suite.name} - FAILED (${duration}ms)`);
            if (error) {
                logger.error(`   Error: ${error}`);
            }
        }
    }

    // Print summary
    logger.log('\n📊 E2E Test Results Summary');
    logger.log('=====================================');

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    logger.log(`Total Tests: ${totalCount}`);
    logger.log(`Passed: ${passedCount}`);
    logger.log(`Failed: ${totalCount - passedCount}`);
    logger.log(`Total Duration: ${totalDuration}ms`);
    logger.log(
        `Success Rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`,
    );

    if (passedCount === totalCount) {
        logger.log('\n🎉 All E2E tests passed!');
        process.exit(0);
    } else {
        logger.log('\n💥 Some E2E tests failed!');

        // Print failed tests
        const failedTests = results.filter((r) => !r.passed);
        if (failedTests.length > 0) {
            logger.log('\nFailed Tests:');
            failedTests.forEach((test) => {
                logger.log(
                    `  - ${test.suite}: ${test.error || 'Unknown error'}`,
                );
            });
        }

        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
E2E Test Runner

Usage:
  npm run test:e2e:runner [options]

Options:
  --help, -h     Show this help message
  --suite <name> Run specific test suite
  --verbose      Show verbose output

Available Test Suites:
${testSuites.map((s) => `  - ${s.name}: ${s.description}`).join('\n')}
`);
    process.exit(0);
}

if (args.includes('--suite')) {
    const suiteIndex = args.indexOf('--suite');
    const suiteName = args[suiteIndex + 1];
    const suite = testSuites.find(
        (s) => s.name.toLowerCase() === suiteName.toLowerCase(),
    );

    if (suite) {
        logger.log(`Running specific test suite: ${suite.name}`);
        // Run specific suite
        try {
            execSync(`npm run test:e2e -- --testPathPattern="${suite.file}"`, {
                stdio: 'inherit',
                cwd: process.cwd(),
            });
            logger.log(`✅ ${suite.name} completed successfully`);
        } catch (err) {
            logger.error(`❌ ${suite.name} failed`);
            process.exit(1);
        }
    } else {
        logger.error(`Test suite "${suiteName}" not found`);
        logger.log(
            'Available suites:',
            testSuites.map((s) => s.name).join(', '),
        );
        process.exit(1);
    }
} else {
    // Run all tests
    try {
        runE2ETests();
    } catch (error) {
        logger.error('E2E test runner failed:', error as Error);
        process.exit(1);
    }
}
