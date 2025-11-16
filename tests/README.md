# Tests for Action Recorder & Player

This directory contains unit and integration tests for the Action Recorder & Player Chrome extension.

## Test Files

### unit-tests.js
Unit tests for individual functions and utilities:
- Utility functions (sleep, escapeHtml, sanitizeUrl)
- Element finding strategies
- Action validation
- Assertion functions
- Memory management
- Security features

### integration-tests.js
Integration tests for complete workflows:
- Inspect → Download → Upload → Play workflow
- Storage state save/restore
- Trace log export
- All action types (click, input, select, hover, etc.)
- Wait functions (waitForElement, waitForVisible, waitForText)
- Error scenarios
- Performance tests

## Running Tests

### Prerequisites
Install a test framework (Jest recommended):
```bash
npm install --save-dev jest
```

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm test unit-tests.js

# Run integration tests only
npm test integration-tests.js

# Run with coverage
npm test -- --coverage
```

### Using Jest Configuration
Create a `jest.config.js` file in the project root:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Test Structure

Tests follow the AAA pattern:
- **Arrange**: Set up test data and environment
- **Act**: Execute the function/action being tested
- **Assert**: Verify the results

## Coverage Goals

Target: 80%+ code coverage across all modules

Current coverage areas:
- ✅ Utility functions
- ✅ Element selection
- ✅ Action validation
- ✅ Security sanitization
- ✅ Memory management
- ✅ Assertion logic
- ✅ Wait functions
- ✅ Error handling

## Adding New Tests

When adding new functionality:
1. Add unit tests for individual functions
2. Add integration tests for workflows
3. Ensure error scenarios are covered
4. Update this README with new test areas

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:
```yaml
# Example GitHub Actions workflow
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
```

## Notes

- Tests use a mock DOM environment (jsdom)
- Chrome extension APIs are mocked where necessary
- Tests are isolated and can run in any order
- Async/await is used for asynchronous operations
