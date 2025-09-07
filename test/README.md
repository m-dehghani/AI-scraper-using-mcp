# Test Suite Documentation

This directory contains a comprehensive test suite for the AI-powered web scraper application.

## Test Structure

```
test/
├── README.md                    # This file
├── setup.ts                     # Global test setup
├── run-tests.ts                 # Test runner script
├── jest.config.js               # Jest configuration for integration tests
├── utils/
│   └── test-helpers.ts          # Test utilities and helpers
├── integration/
│   └── scraper.integration.spec.ts  # Integration tests
└── e2e/
    ├── app.e2e-spec.ts          # End-to-end application tests
    └── main.e2e-spec.ts         # Main application lifecycle tests
```

## Test Types

### 1. Unit Tests
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test individual services and components in isolation
- **Coverage**: All services, utilities, and business logic
- **Run with**: `npm run test`

### 2. Integration Tests
- **Location**: `test/integration/`
- **Purpose**: Test service interactions and data flow
- **Coverage**: Service integration, error handling, performance
- **Run with**: `npx jest --config test/jest.config.js`

### 3. End-to-End Tests
- **Location**: `test/e2e/`
- **Purpose**: Test complete application workflows
- **Coverage**: Application bootstrap, service health, module integration
- **Run with**: `npm run test:e2e`

## Test Coverage

### Services Tested

#### AI Services
- **OllamaService**: AI model interactions, prompt processing, health checks
- **Prompt Processing**: Content analysis, structured data extraction

#### Scraping Services
- **McpClientService**: Puppeteer browser automation, anti-bot handling
- **ScraperService**: Web scraping orchestration, content parsing
- **InteractiveScraperService**: User prompt processing, AI integration
- **PromptParserService**: Natural language prompt parsing

#### Export Services
- **CsvExportService**: CSV generation, data formatting, file operations

#### Utility Services
- **HtmlParserService**: HTML content parsing and extraction
- **XrayParserService**: Schema-based data extraction

### Test Scenarios

#### Happy Path Tests
- ✅ Successful web scraping with real data extraction
- ✅ AI-powered content analysis and structured data generation
- ✅ CSV export with proper formatting
- ✅ Natural language prompt parsing

#### Error Handling Tests
- ✅ Network timeouts and connection failures
- ✅ Anti-bot protection detection and handling
- ✅ AI service unavailability
- ✅ Malformed JSON responses from AI
- ✅ File system errors during CSV export
- ✅ Insufficient content scenarios

#### Edge Cases
- ✅ Empty or invalid prompts
- ✅ Large datasets (1000+ items)
- ✅ Concurrent requests
- ✅ Special characters in data
- ✅ Various website structures

#### Performance Tests
- ✅ Large dataset processing
- ✅ Concurrent request handling
- ✅ Memory usage optimization
- ✅ Response time validation

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure Ollama is running (for integration tests)
ollama serve
```

### Run All Tests
```bash
# Run complete test suite
npm run test:all

# Or use the test runner
npx ts-node test/run-tests.ts
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test

# Integration tests only
npx jest --config test/jest.config.js

# End-to-end tests only
npm run test:e2e

# Coverage report
npm run test:cov
```

### Run Tests in Watch Mode
```bash
# Watch mode for unit tests
npm run test:watch

# Debug mode
npm run test:debug
```

## Test Configuration

### Jest Configuration
- **Unit Tests**: `jest.config.js` (root level)
- **Integration Tests**: `test/jest.config.js`
- **E2E Tests**: `test/jest-e2e.json`

### Test Setup
- **Global Setup**: `test/setup.ts`
- **Test Helpers**: `test/utils/test-helpers.ts`
- **Mocking**: Comprehensive mocks for external dependencies

## Mocking Strategy

### External Dependencies
- **Puppeteer**: Mocked browser automation
- **Ollama**: Mocked AI service responses
- **File System**: Mocked file operations
- **Network**: Mocked HTTP requests

### Service Mocks
- **Logger**: Mocked logging for clean test output
- **Dependencies**: Isolated service testing
- **Error Scenarios**: Controlled error injection

## Test Data

### Sample Data
- **Scraped Content**: Realistic HTML content samples
- **AI Responses**: Valid and invalid JSON responses
- **Product Data**: Sample e-commerce data
- **Error Scenarios**: Various failure conditions

### Test Fixtures
- **Websites**: Mock website responses
- **User Prompts**: Various natural language inputs
- **Expected Outputs**: Validated result structures

## Coverage Goals

### Target Coverage
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Critical Paths
- ✅ All service methods
- ✅ Error handling branches
- ✅ Data transformation logic
- ✅ Integration points

## Continuous Integration

### GitHub Actions
```yaml
# Example CI configuration
- name: Run Tests
  run: |
    npm install
    npm run test:all
    npm run test:cov
```

### Pre-commit Hooks
```bash
# Run tests before commit
npm run test
npm run lint
```

## Debugging Tests

### Debug Mode
```bash
# Run tests with debugging
npm run test:debug
```

### Verbose Output
```bash
# Verbose test output
npm run test -- --verbose
```

### Coverage Analysis
```bash
# Generate detailed coverage report
npm run test:cov
open coverage/lcov-report/index.html
```

## Best Practices

### Test Writing
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Test both happy path and error scenarios
- ✅ Mock external dependencies
- ✅ Keep tests isolated and independent

### Test Organization
- ✅ Group related tests in describe blocks
- ✅ Use beforeEach/afterEach for setup/cleanup
- ✅ Share common test utilities
- ✅ Maintain consistent naming conventions

### Performance
- ✅ Use appropriate timeouts
- ✅ Clean up resources after tests
- ✅ Avoid unnecessary async operations
- ✅ Mock expensive operations

## Troubleshooting

### Common Issues

#### Tests Failing
1. Check if all dependencies are installed
2. Verify Ollama service is running (for integration tests)
3. Check test environment configuration
4. Review mock configurations

#### Coverage Issues
1. Ensure all source files are included
2. Check coverage thresholds
3. Verify test file patterns
4. Review ignored files configuration

#### Performance Issues
1. Check test timeouts
2. Review mock implementations
3. Optimize test data size
4. Use appropriate test types

### Getting Help
- Check test logs for detailed error messages
- Review Jest documentation
- Examine mock configurations
- Verify service dependencies

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Add appropriate mocks
3. Update test documentation
4. Ensure coverage goals are met

### Test Maintenance
1. Keep tests up to date with code changes
2. Refactor tests when needed
3. Remove obsolete tests
4. Update test data regularly
