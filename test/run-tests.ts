#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Test runner script for the AI-powered web scraper
 * This script runs different types of tests and provides comprehensive coverage
 */

class TestRunner {
    private projectRoot: string;

    constructor() {
        this.projectRoot = join(__dirname, '..');
    }

    /**
     * Run all tests
     */
    public async runAllTests(): Promise<void> {
        console.log('🚀 Starting comprehensive test suite...\n');

        try {
            await this.runUnitTests();
            await this.runIntegrationTests();
            await this.runE2ETests();
            await this.generateCoverageReport();

            console.log('\n✅ All tests completed successfully!');
        } catch (error) {
            console.error('\n❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Run unit tests
     */
    private runUnitTests(): void {
        console.log('📋 Running unit tests...');

        try {
            execSync('npm run test', {
                cwd: this.projectRoot,
                stdio: 'inherit',
            });
            console.log('✅ Unit tests passed\n');
        } catch (error) {
            console.error('❌ Unit tests failed');
            throw error;
        }
    }

    /**
     * Run integration tests
     */
    private runIntegrationTests() {
        console.log('🔗 Running integration tests...');

        try {
            execSync('npx jest --config test/jest.config.js', {
                cwd: this.projectRoot,
                stdio: 'inherit',
            });
            console.log('✅ Integration tests passed\n');
        } catch (error) {
            console.error('❌ Integration tests failed');
            throw error;
        }
    }

    /**
     * Run end-to-end tests
     */
    private runE2ETests() {
        console.log('🌐 Running end-to-end tests...');

        try {
            execSync('npm run test:e2e', {
                cwd: this.projectRoot,
                stdio: 'inherit',
            });
            console.log('✅ End-to-end tests passed\n');
        } catch (error) {
            console.error('❌ End-to-end tests failed');
            throw error;
        }
    }

    /**
     * Generate coverage report
     */
    private generateCoverageReport() {
        console.log('📊 Generating coverage report...');

        try {
            execSync('npm run test:cov', {
                cwd: this.projectRoot,
                stdio: 'inherit',
            });
            console.log('✅ Coverage report generated\n');
        } catch (error) {
            console.error('❌ Coverage report generation failed');
            throw error;
        }
    }

    /**
     * Run specific test type
     */
    public runTestType(type: 'unit' | 'integration' | 'e2e' | 'coverage') {
        console.log(`🎯 Running ${type} tests...\n`);

        switch (type) {
            case 'unit':
                this.runUnitTests();
                break;
            case 'integration':
                this.runIntegrationTests();
                break;
            case 'e2e':
                this.runE2ETests();
                break;
            case 'coverage':
                this.generateCoverageReport();
                break;
            default:
                throw new Error(`Unknown test type`);
        }
    }

    /**
     * Check if test dependencies are installed
     */
    public checkDependencies(): boolean {
        const packageJsonPath = join(this.projectRoot, 'package.json');
        const nodeModulesPath = join(this.projectRoot, 'node_modules');

        if (!existsSync(packageJsonPath)) {
            console.error('❌ package.json not found');
            return false;
        }

        if (!existsSync(nodeModulesPath)) {
            console.error('❌ node_modules not found. Run npm install first');
            return false;
        }

        return true;
    }

    /**
     * Install test dependencies
     */
    public installDependencies(): void {
        console.log('📦 Installing test dependencies...');

        try {
            execSync('npm install', {
                cwd: this.projectRoot,
                stdio: 'inherit',
            });
            console.log('✅ Dependencies installed successfully\n');
        } catch (error) {
            console.error('❌ Failed to install dependencies');
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const testRunner = new TestRunner();
    const args = process.argv.slice(2);

    if (!testRunner.checkDependencies()) {
        console.log('Installing dependencies...');
        testRunner.installDependencies();
    }

    if (args.length === 0) {
        await testRunner.runAllTests();
    } else {
        const testType = args[0] as 'unit' | 'integration' | 'e2e' | 'coverage';
        await testRunner.runTestType(testType);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

export { TestRunner };
