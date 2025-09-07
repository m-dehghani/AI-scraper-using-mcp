# End-to-End (E2E) Tests

This directory contains comprehensive end-to-end tests for the AI-powered web scraper application. These tests verify the complete application flow from initialization to user interaction and data processing.

## Test Structure

### Test Files

1. **`application-bootstrap.e2e-spec.ts`**
   - Tests application initialization and service registration
   - Verifies dependency injection and module configuration
   - Ensures proper error handling during startup

2. **`scraper-workflow.e2e-spec.ts`**
   - Tests complete scraping workflows
   - Verifies prompt parsing and data extraction
   - Tests CSV export functionality
   - Includes error handling and recovery scenarios

3. **`main-application.e2e-spec.ts`**
   - Tests main application entry point simulation
   - Verifies user interaction flows
   - Tests concurrent request handling
   - Includes performance and scalability tests

4. **`app.e2e-spec.ts`** (existing)
   - Basic application controller tests
   - Service health checks
   - Module integration tests

5. **`main.e2e-spec.ts`** (existing)
   - Main application service tests
   - Service dependency verification
   - Application lifecycle tests

### Configuration Files

- **`test-setup.e2e.ts`** - Global test setup and configuration
- **`run-e2e-tests.ts`** - Custom test runner with detailed reporting
- **`jest-e2e.json`** - Jest configuration for E2E tests

## Running E2E Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
npm run test:e2e -- --testPathPattern="scraper-workflow.e2e-spec.ts"
```

### Run with Custom Test Runner
```bash
npm run test:e2e:runner
```

### Run Specific Suite with Custom Runner
```bash
npm run test:e2e:runner -- --suite "Scraper Workflow"
```

## Test Categories

### 1. Application Bootstrap Tests
- **Service Registration**: Verifies all services are properly registered
- **Dependency Injection**: Tests that dependencies are correctly injected
- **Module Configuration**: Ensures modules are properly configured
- **Error Handling**: Tests graceful handling of initialization errors

### 2. Scraping Workflow Tests
- **Complete Workflow**: End-to-end scraping from prompt to CSV output
- **Prompt Parsing**: Tests various prompt types and parsing logic
- **Data Extraction**: Verifies data extraction and processing
- **CSV Export**: Tests file generation and data formatting
- **Error Recovery**: Tests handling of various error scenarios

### 3. User Interaction Tests
- **Input Validation**: Tests URL and prompt validation
- **User Experience**: Tests result display and user feedback
- **Session Management**: Tests multiple consecutive requests
- **Error Communication**: Tests error message display

### 4. Performance Tests
- **Response Times**: Ensures operations complete within reasonable time
- **Concurrent Requests**: Tests handling of multiple simultaneous requests
- **Resource Management**: Verifies proper cleanup and memory usage
- **Scalability**: Tests application behavior under load

### 5. Error Handling Tests
- **Network Errors**: Tests handling of network timeouts and failures
- **Service Unavailability**: Tests behavior when external services are down
- **File System Errors**: Tests handling of file system issues
- **Graceful Degradation**: Tests application behavior during partial failures

## Test Data and Mocking

### Mocked Services
- **MCP Client Service**: Mocked to avoid actual web scraping
- **Ollama Service**: Mocked to avoid requiring AI service
- **File System**: Uses temporary directories for testing

### Test Data
- **Sample URLs**: Uses example.com and test URLs
- **Sample Content**: Provides realistic HTML and text content
- **Expected Results**: Defines expected output formats and structures

## Best Practices

### Test Organization
- Each test file focuses on a specific aspect of the application
- Tests are grouped by functionality and user journey
- Clear test descriptions and expectations

### Error Testing
- Tests both success and failure scenarios
- Verifies proper error messages and handling
- Tests recovery from various error conditions

### Performance Considerations
- Tests include timeout configurations
- Long-running tests are properly marked
- Resource cleanup is verified

### Maintainability
- Tests use descriptive names and clear structure
- Mock data is realistic and comprehensive
- Tests are independent and can run in any order

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase timeout in Jest configuration
   - Check for hanging promises or unclosed resources

2. **Mock Failures**
   - Verify mock implementations match service interfaces
   - Check that mocks are properly restored between tests

3. **File System Errors**
   - Ensure test directories are properly cleaned up
   - Check file permissions and path validity

4. **Service Dependencies**
   - Verify all required services are properly mocked
   - Check dependency injection configuration

### Debug Mode
Run tests with verbose output:
```bash
npm run test:e2e -- --verbose
```

### Individual Test Debugging
Run a specific test with detailed output:
```bash
npm run test:e2e -- --testNamePattern="should process a complete scraping request" --verbose
```

## Continuous Integration

These E2E tests are designed to run in CI/CD pipelines:
- Tests are deterministic and don't depend on external services
- All external dependencies are properly mocked
- Tests include proper cleanup and resource management
- Results are formatted for CI reporting

## Contributing

When adding new E2E tests:
1. Follow the existing test structure and naming conventions
2. Include both success and failure scenarios
3. Add proper cleanup for any resources created
4. Update this documentation if adding new test categories
5. Ensure tests are independent and can run in any order
