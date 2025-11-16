/**
 * Integration Tests for Action Recorder & Player
 *
 * Test complete workflows and action types
 * Tests end-to-end functionality across components
 */

// Test Suite: Complete Workflows
describe('Complete Workflows', () => {

  describe('Inspect → Download → Upload → Play', () => {
    test('should complete full workflow successfully', async () => {
      // Step 1: Inspect page
      const inspectedElements = await inspectPageElements();
      expect(inspectedElements).toBeDefined();
      expect(Array.isArray(inspectedElements)).toBe(true);

      // Step 2: Generate actions template
      const actionsTemplate = {
        metadata: {
          createdAt: new Date().toISOString(),
          totalElements: inspectedElements.length
        },
        elements: inspectedElements.map(el => ({
          ...el,
          enabled: false,
          action: {
            type: null,
            value: null,
            waitAfter: 1000
          }
        }))
      };

      // Step 3: Simulate user enabling an action
      if (actionsTemplate.elements.length > 0) {
        actionsTemplate.elements[0].enabled = true;
        actionsTemplate.elements[0].action.type = 'click';
      }

      // Step 4: Validate the actions data
      const validation = validateActionsSchema(actionsTemplate);
      expect(validation.valid).toBe(true);

      // Step 5: Sanitize the data
      const sanitized = sanitizeActionsData(actionsTemplate);
      expect(sanitized).toBeDefined();
      expect(sanitized.elements).toBeDefined();

      // Step 6: Simulate playback
      const enabledActions = sanitized.elements.filter(el => el.enabled);
      expect(enabledActions.length).toBeGreaterThan(0);
    });
  });

  describe('Storage State Workflow', () => {
    test('should save and restore storage state', async () => {
      // Set up test storage
      localStorage.setItem('test-key', 'test-value');
      sessionStorage.setItem('session-key', 'session-value');

      // Get storage state
      const storageState = {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };

      // Sanitize storage
      const sanitized = sanitizeStorage(storageState.localStorage);
      expect(sanitized['test-key']).toBeDefined();

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Restore storage
      for (const [key, value] of Object.entries(storageState.localStorage)) {
        localStorage.setItem(key, value);
      }
      for (const [key, value] of Object.entries(storageState.sessionStorage)) {
        sessionStorage.setItem(key, value);
      }

      expect(localStorage.getItem('test-key')).toBe('test-value');
      expect(sessionStorage.getItem('session-key')).toBe('session-value');

      // Cleanup
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  describe('Trace Export Workflow', () => {
    test('should collect and export trace log', async () => {
      // Clear any existing trace data
      clearTraceData();

      // Simulate some actions
      logTrace('click', '#button1', { clicked: true });
      logTrace('input', '#input1', { value: 'test' });
      logTrace('navigate', '/page2', { url: '/page2' });

      // Export trace
      const exported = exportTraceLog();

      expect(exported.totalActions).toBe(3);
      expect(exported.actions.length).toBe(3);
      expect(exported.startTime).toBeDefined();
      expect(exported.endTime).toBeDefined();

      // Verify trace data was cleared after export
      expect(traceLog.length).toBe(0);
    });
  });
});

// Test Suite: All Action Types
describe('Action Types', () => {

  let testElement;

  beforeEach(() => {
    testElement = document.createElement('button');
    testElement.id = 'test-button';
    testElement.textContent = 'Click Me';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('click action', () => {
    test('should execute click action', async () => {
      let clicked = false;
      testElement.addEventListener('click', () => { clicked = true; });

      const elementAction = {
        id: 'test-button',
        action: { type: 'click' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(clicked).toBe(true);
    });
  });

  describe('input action', () => {
    test('should execute input action on text field', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-input';
      document.body.appendChild(input);

      const elementAction = {
        id: 'test-input',
        tagName: 'input',
        action: { type: 'input', value: 'Hello World' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(input.value).toBe('Hello World');
    });

    test('should execute input action on contenteditable', async () => {
      const editable = document.createElement('div');
      editable.id = 'test-editable';
      editable.setAttribute('contenteditable', 'true');
      document.body.appendChild(editable);

      const elementAction = {
        id: 'test-editable',
        action: { type: 'input', value: 'Editable Content' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(editable.textContent).toBe('Editable Content');
    });
  });

  describe('select action', () => {
    test('should execute select action', async () => {
      const select = document.createElement('select');
      select.id = 'test-select';

      const option1 = document.createElement('option');
      option1.value = 'value1';
      option1.textContent = 'Option 1';
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = 'value2';
      option2.textContent = 'Option 2';
      select.appendChild(option2);

      document.body.appendChild(select);

      const elementAction = {
        id: 'test-select',
        tagName: 'select',
        action: { type: 'select', value: 'value2' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(select.value).toBe('value2');
    });
  });

  describe('hover action', () => {
    test('should execute hover action', async () => {
      let hovered = false;
      testElement.addEventListener('mouseenter', () => { hovered = true; });

      const elementAction = {
        id: 'test-button',
        action: { type: 'hover' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(hovered).toBe(true);
    });
  });

  describe('focus and blur actions', () => {
    test('should execute focus action', async () => {
      const input = document.createElement('input');
      input.id = 'test-focus';
      document.body.appendChild(input);

      const elementAction = {
        id: 'test-focus',
        action: { type: 'focus' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(document.activeElement).toBe(input);
    });

    test('should execute blur action', async () => {
      const input = document.createElement('input');
      input.id = 'test-blur';
      document.body.appendChild(input);
      input.focus();

      const elementAction = {
        id: 'test-blur',
        action: { type: 'blur' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(true);
      expect(document.activeElement).not.toBe(input);
    });
  });
});

// Test Suite: Wait Functions
describe('Wait Functions', () => {

  describe('waitForElement()', () => {
    test('should wait for element to appear', async () => {
      // Add element after 300ms
      setTimeout(() => {
        const delayed = document.createElement('div');
        delayed.id = 'delayed-element';
        document.body.appendChild(delayed);
      }, 300);

      const element = await waitForElement('#delayed-element', 1000);
      expect(element).not.toBeNull();
      expect(element.id).toBe('delayed-element');
    });

    test('should timeout if element does not appear', async () => {
      await expect(waitForElement('#non-existent', 500))
        .rejects
        .toThrow('Element not found within 500ms');
    });
  });

  describe('waitForVisible()', () => {
    test('should wait for element to become visible', async () => {
      const hidden = document.createElement('div');
      hidden.id = 'hidden-element';
      hidden.style.display = 'none';
      document.body.appendChild(hidden);

      // Make visible after 300ms
      setTimeout(() => {
        hidden.style.display = 'block';
        hidden.style.width = '100px';
        hidden.style.height = '100px';
      }, 300);

      const result = await waitForVisible(hidden, 1000);
      expect(result).toBe(true);
    });
  });

  describe('waitForText()', () => {
    test('should wait for text to appear in element', async () => {
      const element = document.createElement('div');
      element.id = 'text-element';
      element.textContent = 'Initial';
      document.body.appendChild(element);

      // Change text after 300ms
      setTimeout(() => {
        element.textContent = 'Expected Text';
      }, 300);

      const result = await waitForText(element, 'Expected Text', 1000);
      expect(result).toBe(true);
    });
  });
});

// Test Suite: Error Scenarios
describe('Error Scenarios', () => {

  describe('Invalid selectors', () => {
    test('should handle invalid CSS selector gracefully', async () => {
      const elementAction = {
        selector: '###invalid:::selector',
        action: { type: 'click' },
        enabled: true
      };

      const element = await findElement(elementAction);
      expect(element).toBeNull();
    });

    test('should handle invalid XPath gracefully', async () => {
      const elementAction = {
        xpath: '//invalid[[[xpath',
        action: { type: 'click' },
        enabled: true
      };

      const element = await findElement(elementAction);
      expect(element).toBeNull();
    });
  });

  describe('Missing elements', () => {
    test('should handle missing element during action execution', async () => {
      const elementAction = {
        id: 'non-existent',
        action: { type: 'click' },
        enabled: true
      };

      const success = await executeAction(elementAction);
      expect(success).toBe(false);
    });
  });

  describe('Cross-origin iframe', () => {
    test('should handle cross-origin iframe access gracefully', () => {
      const iframe = document.createElement('iframe');
      iframe.id = 'test-iframe';
      // Simulate cross-origin by not having contentDocument accessible
      document.body.appendChild(iframe);

      const elementAction = {
        iframe: '#test-iframe',
        id: 'iframe-element',
        action: { type: 'click' }
      };

      const element = findElementInIframe('#test-iframe', elementAction);
      // Should return null for cross-origin iframes
      expect(element).toBeNull();
    });
  });
});

// Test Suite: Performance
describe('Performance', () => {

  describe('Element caching', () => {
    test('should cache found elements for performance', async () => {
      const testDiv = document.createElement('div');
      testDiv.id = 'cached-element';
      document.body.appendChild(testDiv);

      const elementAction = { id: 'cached-element' };

      // First call - should find and cache
      const element1 = await findElement(elementAction);
      expect(element1).not.toBeNull();

      // Second call - should use cache
      const start = Date.now();
      const element2 = await findElement(elementAction);
      const elapsed = Date.now() - start;

      expect(element2).not.toBeNull();
      expect(element2).toBe(element1);
      expect(elapsed).toBeLessThan(10); // Should be very fast from cache
    });
  });

  describe('MutationObserver vs Polling', () => {
    test('MutationObserver should be more responsive than polling', async () => {
      const startTime = Date.now();

      // Add element after 100ms
      setTimeout(() => {
        const element = document.createElement('div');
        element.id = 'mutation-test';
        document.body.appendChild(element);
      }, 100);

      await waitForElement('#mutation-test', 1000);
      const elapsed = Date.now() - startTime;

      // Should detect element shortly after it's added (not waiting for poll interval)
      expect(elapsed).toBeLessThan(200);
    });
  });
});

console.log('Integration tests defined. Run with a test framework like Jest or Mocha.');
