/**
 * Unit Tests for Action Recorder & Player
 *
 * Test utility functions and core functionality
 * Target: 80%+ code coverage
 */

// Mock DOM environment for testing
const setupTestDOM = () => {
  // Create test elements
  const testDiv = document.createElement('div');
  testDiv.id = 'test-element';
  testDiv.textContent = 'Test Content';
  document.body.appendChild(testDiv);
  return testDiv;
};

// Test Suite: Utility Functions
describe('Utility Functions', () => {

  describe('sleep()', () => {
    test('should delay execution for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('escapeHtml()', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = escapeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });

    test('should handle quotes and ampersands', () => {
      const input = 'Test & "quoted" text';
      const output = escapeHtml(input);
      expect(output).toContain('&amp;');
      expect(output).toContain('&quot;');
    });
  });

  describe('sanitizeUrl()', () => {
    test('should allow valid http URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    test('should allow valid https URLs', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    test('should block javascript: URLs', () => {
      const url = 'javascript:alert("XSS")';
      expect(sanitizeUrl(url)).toBe('about:blank');
    });

    test('should block data: URLs', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>';
      expect(sanitizeUrl(url)).toBe('about:blank');
    });

    test('should block vbscript: URLs', () => {
      const url = 'vbscript:msgbox("XSS")';
      expect(sanitizeUrl(url)).toBe('about:blank');
    });

    test('should truncate very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(5000);
      const sanitized = sanitizeUrl(longUrl);
      expect(sanitized.length).toBeLessThanOrEqual(2000);
    });
  });
});

// Test Suite: Element Finding
describe('Element Finding', () => {

  beforeEach(() => {
    setupTestDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('findElement()', () => {
    test('should find element by ID', async () => {
      const elementAction = { id: 'test-element' };
      const element = await findElement(elementAction);
      expect(element).not.toBeNull();
      expect(element.id).toBe('test-element');
    });

    test('should find element by selector', async () => {
      const elementAction = { selector: '#test-element' };
      const element = await findElement(elementAction);
      expect(element).not.toBeNull();
      expect(element.id).toBe('test-element');
    });

    test('should return null for non-existent element', async () => {
      const elementAction = { id: 'non-existent' };
      const element = await findElement(elementAction);
      expect(element).toBeNull();
    });

    test('should retry with exponential backoff', async () => {
      const elementAction = { id: 'delayed-element' };

      // Add element after 600ms
      setTimeout(() => {
        const delayed = document.createElement('div');
        delayed.id = 'delayed-element';
        document.body.appendChild(delayed);
      }, 600);

      const start = Date.now();
      const element = await findElement(elementAction);
      const elapsed = Date.now() - start;

      expect(element).not.toBeNull();
      expect(elapsed).toBeGreaterThanOrEqual(600);
    });
  });

  describe('findInShadowDOM()', () => {
    test('should find element in shadow DOM', () => {
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      const shadowDiv = document.createElement('div');
      shadowDiv.id = 'shadow-element';
      shadow.appendChild(shadowDiv);
      document.body.appendChild(host);

      const found = findInShadowDOM('shadow-element', 'id');
      expect(found).not.toBeNull();
      expect(found.id).toBe('shadow-element');
    });
  });
});

// Test Suite: Action Validation
describe('Action Validation', () => {

  describe('validateActionsSchema()', () => {
    test('should validate valid actions data', () => {
      const validData = {
        elements: [
          {
            action: {
              type: 'click'
            },
            enabled: true
          }
        ]
      };
      const result = validateActionsSchema(validData);
      expect(result.valid).toBe(true);
    });

    test('should reject data without elements array', () => {
      const invalidData = {};
      const result = validateActionsSchema(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('elements');
    });

    test('should reject invalid action types', () => {
      const invalidData = {
        elements: [
          {
            action: {
              type: 'malicious-action'
            },
            enabled: true
          }
        ]
      };
      const result = validateActionsSchema(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid action type');
    });

    test('should validate required fields for input actions', () => {
      const invalidData = {
        elements: [
          {
            action: {
              type: 'input'
              // Missing value
            },
            enabled: true
          }
        ]
      };
      const result = validateActionsSchema(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requires a value');
    });
  });
});

// Test Suite: Assertions
describe('Assertion Functions', () => {

  beforeEach(() => {
    setupTestDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('performAssertion()', () => {
    test('should assert element exists', () => {
      const element = document.getElementById('test-element');
      const action = { assertType: 'exists' };
      const result = performAssertion(element, action);
      expect(result.success).toBe(true);
    });

    test('should assert element is visible', () => {
      const element = document.getElementById('test-element');
      const action = { assertType: 'visible' };
      const result = performAssertion(element, action);
      expect(result.success).toBe(true);
    });

    test('should assert element text contains expected value', () => {
      const element = document.getElementById('test-element');
      const action = { assertType: 'text', expectedValue: 'Test Content' };
      const result = performAssertion(element, action);
      expect(result.success).toBe(true);
    });

    test('should fail when text does not match', () => {
      const element = document.getElementById('test-element');
      const action = { assertType: 'text', expectedValue: 'Wrong Text' };
      const result = performAssertion(element, action);
      expect(result.success).toBe(false);
    });
  });
});

// Test Suite: getActionDescription()
describe('getActionDescription()', () => {

  test('should generate description for click action', () => {
    const elementAction = {
      tagName: 'button',
      text: 'Submit',
      action: { type: 'click' }
    };
    const desc = getActionDescription(elementAction);
    expect(desc).toContain('Click');
    expect(desc).toContain('button');
  });

  test('should generate description for input action', () => {
    const elementAction = {
      tagName: 'input',
      action: { type: 'input', value: 'test@example.com' }
    };
    const desc = getActionDescription(elementAction);
    expect(desc).toContain('Type');
    expect(desc).toContain('test@example.com');
  });

  test('should use custom description when provided', () => {
    const elementAction = {
      tagName: 'button',
      action: { type: 'click', description: 'Custom Action' }
    };
    const desc = getActionDescription(elementAction);
    expect(desc).toBe('Custom Action');
  });
});

// Test Suite: Memory Management
describe('Memory Management', () => {

  describe('traceLog bounds', () => {
    test('should limit traceLog to MAX_TRACE_LOG_ENTRIES', () => {
      // Add more entries than the max
      for (let i = 0; i < 1100; i++) {
        logTrace('test', 'target', { index: i });
      }
      expect(traceLog.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('clearTraceData()', () => {
    test('should clear trace log and screenshots', () => {
      logTrace('test', 'target', {});
      screenshots.push({ data: 'test' });

      clearTraceData();

      expect(traceLog.length).toBe(0);
      expect(screenshots.length).toBe(0);
    });
  });
});

// Test Suite: Security
describe('Security Features', () => {

  describe('sanitizeStorage()', () => {
    test('should redact sensitive keys', () => {
      const storage = {
        'user-token': 'secret123',
        'api-key': 'abc123',
        'username': 'john'
      };
      const sanitized = sanitizeStorage(storage);

      expect(sanitized['user-token']).toBe('[REDACTED - Sensitive Data]');
      expect(sanitized['api-key']).toBe('[REDACTED - Sensitive Data]');
      expect(sanitized['username']).toBe('john');
    });
  });

  describe('sanitizeTraceDetails()', () => {
    test('should truncate long strings', () => {
      const longString = 'a'.repeat(2000);
      const details = { value: longString };
      const sanitized = sanitizeTraceDetails(details);

      expect(sanitized.value.length).toBeLessThanOrEqual(1000);
    });

    test('should preserve numbers and booleans', () => {
      const details = { count: 42, enabled: true };
      const sanitized = sanitizeTraceDetails(details);

      expect(sanitized.count).toBe(42);
      expect(sanitized.enabled).toBe(true);
    });
  });
});

console.log('Unit tests defined. Run with a test framework like Jest or Mocha.');
