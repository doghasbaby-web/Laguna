// Content script for action playback
let isPlaying = false;
let currentPlayback = null;
let traceLog = [];
let screenshots = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playActions') {
    playActions(message.data, message.delay);
    sendResponse({ success: true });
  } else if (message.action === 'stopActions') {
    stopActions();
    sendResponse({ success: true });
  }
  return true;
});

// Stop current playback
function stopActions() {
  isPlaying = false;
  if (currentPlayback) {
    clearTimeout(currentPlayback);
    currentPlayback = null;
  }
  removeHighlight();
  sendStatus('Playback stopped by user.', 'info');
}

// Play all enabled actions
async function playActions(actionsData, globalDelay) {
  if (isPlaying) {
    sendStatus('Actions are already playing.', 'error');
    return;
  }

  isPlaying = true;
  const enabledActions = actionsData.elements.filter(el => el.enabled);

  if (enabledActions.length === 0) {
    sendStatus('No enabled actions to play.', 'error');
    isPlaying = false;
    return;
  }

  sendStatus(`Starting playback of ${enabledActions.length} actions...`, 'info');

  try {
    for (let i = 0; i < enabledActions.length; i++) {
      if (!isPlaying) {
        sendStatus('Playback stopped.', 'info');
        return;
      }

      const elementAction = enabledActions[i];
      const stepNum = i + 1;

      sendStatus(`Step ${stepNum}/${enabledActions.length}: ${getActionDescription(elementAction)}`, 'info');

      // Find and execute action on element
      const success = await executeAction(elementAction);

      if (!success) {
        sendStatus(`Step ${stepNum} failed: Could not find or interact with element.`, 'error');
        // Continue with next action even if this one fails
      }

      // Wait after action
      const waitTime = elementAction.action.waitAfter || globalDelay;
      await sleep(waitTime);
    }

    removeHighlight();
    sendStatus('All actions completed successfully!', 'success');
  } catch (error) {
    sendStatus(`Error during playback: ${error.message}`, 'error');
  } finally {
    isPlaying = false;
  }
}

// Execute a single action
async function executeAction(elementAction) {
  try {
    // Try to find element by multiple methods
    const element = findElement(elementAction);

    if (!element) {
      console.error('Element not found:', elementAction);
      return false;
    }

    // Highlight element
    highlightElement(element);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);

    const actionType = elementAction.action.type;
    const actionValue = elementAction.action.value;

    switch (actionType) {
      case 'click':
        element.click();
        logTrace('click', elementAction.selector, { clicked: true });
        console.log('Clicked element:', elementAction.selector);
        break;

      case 'rightClick':
        element.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2
        }));
        logTrace('rightClick', elementAction.selector, { rightClicked: true });
        console.log('Right-clicked element:', elementAction.selector);
        break;

      case 'doubleClick':
        element.dispatchEvent(new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        logTrace('doubleClick', elementAction.selector, { doubleClicked: true });
        console.log('Double-clicked element:', elementAction.selector);
        break;

      case 'hover':
        element.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        element.dispatchEvent(new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        logTrace('hover', elementAction.selector, { hovered: true });
        console.log('Hovered over element:', elementAction.selector);
        break;

      case 'input':
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = '';
          element.focus();

          // Simulate typing
          for (const char of actionValue) {
            if (!isPlaying) break;
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(50); // Typing speed
          }

          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.blur();
          logTrace('input', elementAction.selector, { value: actionValue });
          console.log('Typed into element:', elementAction.selector, actionValue);
        } else if (element.getAttribute('contenteditable') === 'true') {
          element.textContent = actionValue;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          logTrace('input', elementAction.selector, { value: actionValue });
          console.log('Set contenteditable element:', elementAction.selector, actionValue);
        }
        break;

      case 'keyPress':
        const keyOptions = {
          key: actionValue,
          code: actionValue,
          bubbles: true,
          cancelable: true,
          ...elementAction.action.modifiers
        };
        element.dispatchEvent(new KeyboardEvent('keydown', keyOptions));
        element.dispatchEvent(new KeyboardEvent('keypress', keyOptions));
        element.dispatchEvent(new KeyboardEvent('keyup', keyOptions));
        logTrace('keyPress', elementAction.selector, { key: actionValue });
        console.log('Pressed key:', actionValue);
        break;

      case 'select':
        if (element.tagName === 'SELECT') {
          element.value = actionValue;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          logTrace('select', elementAction.selector, { value: actionValue });
          console.log('Selected option:', elementAction.selector, actionValue);
        }
        break;

      case 'navigate':
        if (element.tagName === 'A' && element.href) {
          element.click();
          logTrace('navigate', element.href, { url: element.href });
          console.log('Navigated to:', element.href);
        }
        break;

      case 'clickAt':
        const coords = elementAction.action.coordinates || { x: 0, y: 0 };
        const rect = element.getBoundingClientRect();
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + coords.x,
          clientY: rect.top + coords.y
        }));
        logTrace('clickAt', elementAction.selector, { coordinates: coords });
        console.log('Clicked at coordinates:', coords);
        break;

      case 'dragDrop':
        await performDragDrop(element, actionValue);
        logTrace('dragDrop', elementAction.selector, { target: actionValue });
        console.log('Performed drag and drop');
        break;

      case 'uploadFile':
        if (element.tagName === 'INPUT' && element.type === 'file') {
          // Note: File upload requires user interaction for security
          // We can trigger the file picker
          element.click();
          logTrace('uploadFile', elementAction.selector, { triggered: true });
          console.log('Triggered file upload dialog');
        }
        break;

      case 'scroll':
        const scrollOptions = actionValue || { top: 0, left: 0, behavior: 'smooth' };
        if (typeof scrollOptions === 'string') {
          element.scrollIntoView({ behavior: 'smooth', block: scrollOptions });
        } else {
          element.scrollTo(scrollOptions);
        }
        logTrace('scroll', elementAction.selector, { options: scrollOptions });
        console.log('Scrolled element');
        break;

      case 'screenshot':
        const screenshot = await captureScreenshot();
        screenshots.push({
          timestamp: new Date().toISOString(),
          action: elementAction.selector,
          data: screenshot
        });
        logTrace('screenshot', elementAction.selector, { captured: true });
        console.log('Captured screenshot');
        break;

      case 'waitForElement':
        await waitForElement(actionValue);
        logTrace('waitForElement', actionValue, { found: true });
        console.log('Waited for element:', actionValue);
        break;

      case 'waitForVisible':
        await waitForVisible(element);
        logTrace('waitForVisible', elementAction.selector, { visible: true });
        console.log('Waited for element to be visible');
        break;

      case 'waitForText':
        await waitForText(element, actionValue);
        logTrace('waitForText', elementAction.selector, { text: actionValue });
        console.log('Waited for text:', actionValue);
        break;

      case 'assert':
        const assertResult = performAssertion(element, elementAction.action);
        if (!assertResult.success) {
          throw new Error(`Assertion failed: ${assertResult.message}`);
        }
        logTrace('assert', elementAction.selector, assertResult);
        console.log('Assertion passed:', assertResult.message);
        break;

      case 'focus':
        element.focus();
        logTrace('focus', elementAction.selector, { focused: true });
        console.log('Focused element');
        break;

      case 'blur':
        element.blur();
        logTrace('blur', elementAction.selector, { blurred: true });
        console.log('Blurred element');
        break;

      case 'openTab':
        chrome.runtime.sendMessage({
          type: 'openTab',
          url: actionValue,
          active: elementAction.action.active !== false
        }, (response) => {
          logTrace('openTab', actionValue, { tabId: response.tabId });
          console.log('Opened new tab:', actionValue);
        });
        break;

      case 'closeTab':
        chrome.runtime.sendMessage({
          type: 'closeTab',
          tabId: actionValue
        }, () => {
          logTrace('closeTab', actionValue, { closed: true });
          console.log('Closed tab:', actionValue);
        });
        break;

      case 'switchTab':
        chrome.runtime.sendMessage({
          type: 'switchTab',
          tabId: actionValue
        }, () => {
          logTrace('switchTab', actionValue, { switched: true });
          console.log('Switched to tab:', actionValue);
        });
        break;

      default:
        console.warn('Unknown action type:', actionType);
        return false;
    }

    return true;
  } catch (error) {
    console.error('Error executing action:', error, elementAction);
    return false;
  }
}

// Find element in iframe if specified
function findElementInIframe(iframeSelector, elementAction) {
  try {
    const iframe = document.querySelector(iframeSelector);
    if (!iframe || !iframe.contentDocument) {
      return null;
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Try by ID first
    if (elementAction.id) {
      const element = iframeDoc.getElementById(elementAction.id);
      if (element) return element;
    }

    // Try by selector
    if (elementAction.selector) {
      const element = iframeDoc.querySelector(elementAction.selector);
      if (element) return element;
    }

    return null;
  } catch (e) {
    console.warn('Cannot access iframe:', e.message);
    return null;
  }
}

// Find element using multiple strategies
function findElement(elementAction) {
  let element = null;

  // Check if element is in an iframe
  if (elementAction.iframe) {
    element = findElementInIframe(elementAction.iframe, elementAction);
    if (element) return element;
  }

  // Try by ID first
  if (elementAction.id) {
    element = document.getElementById(elementAction.id);
    if (element) return element;
  }

  // Try by CSS selector
  if (elementAction.selector) {
    try {
      element = document.querySelector(elementAction.selector);
      if (element) return element;
    } catch (e) {
      console.warn('Invalid selector:', elementAction.selector);
    }
  }

  // Try by XPath
  if (elementAction.xpath) {
    try {
      const result = document.evaluate(
        elementAction.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      element = result.singleNodeValue;
      if (element) return element;
    } catch (e) {
      console.warn('Invalid XPath:', elementAction.xpath);
    }
  }

  // Try by name attribute
  if (elementAction.name) {
    element = document.querySelector(`[name="${elementAction.name}"]`);
    if (element) return element;
  }

  // Try advanced selectors
  element = findElementAdvanced(elementAction);
  if (element) return element;

  // Last resort: try by text content for buttons/links
  if (elementAction.text && (elementAction.tagName === 'button' || elementAction.tagName === 'a')) {
    const candidates = document.querySelectorAll(elementAction.tagName);
    for (const candidate of candidates) {
      if (candidate.textContent.trim().includes(elementAction.text.trim())) {
        return candidate;
      }
    }
  }

  return null;
}

// Highlight element during action
function highlightElement(element) {
  removeHighlight();

  const overlay = document.createElement('div');
  overlay.id = 'action-recorder-highlight';
  overlay.style.cssText = `
    position: absolute;
    border: 3px solid #ff6b6b;
    background: rgba(255, 107, 107, 0.2);
    pointer-events: none;
    z-index: 999999;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.6);
  `;

  const rect = element.getBoundingClientRect();
  overlay.style.left = (rect.left + window.scrollX) + 'px';
  overlay.style.top = (rect.top + window.scrollY) + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';

  document.body.appendChild(overlay);
}

// Remove highlight
function removeHighlight() {
  const existing = document.getElementById('action-recorder-highlight');
  if (existing) {
    existing.remove();
  }
}

// Send status to popup
function sendStatus(message, status) {
  chrome.runtime.sendMessage({
    type: 'playbackStatus',
    message: message,
    status: status
  }).catch(err => {
    console.log('Could not send message to popup:', err);
  });
}

// Get action description
function getActionDescription(elementAction) {
  const action = elementAction.action;
  const desc = action.description || '';

  if (desc) return desc;

  switch (action.type) {
    case 'click':
      return `Click ${elementAction.tagName}${elementAction.text ? ': ' + elementAction.text.substring(0, 30) : ''}`;
    case 'rightClick':
      return `Right-click ${elementAction.tagName}`;
    case 'doubleClick':
      return `Double-click ${elementAction.tagName}`;
    case 'hover':
      return `Hover over ${elementAction.tagName}`;
    case 'input':
      return `Type "${action.value}" into ${elementAction.tagName}`;
    case 'keyPress':
      return `Press key "${action.value}"`;
    case 'select':
      return `Select "${action.value}" in dropdown`;
    case 'navigate':
      return `Navigate to ${elementAction.href}`;
    case 'clickAt':
      return `Click at coordinates (${action.coordinates?.x}, ${action.coordinates?.y})`;
    case 'dragDrop':
      return `Drag to ${action.value}`;
    case 'uploadFile':
      return `Trigger file upload`;
    case 'scroll':
      return `Scroll element`;
    case 'screenshot':
      return `Capture screenshot`;
    case 'waitForElement':
      return `Wait for element: ${action.value}`;
    case 'waitForVisible':
      return `Wait for visibility`;
    case 'waitForText':
      return `Wait for text: "${action.value}"`;
    case 'assert':
      return `Assert ${action.assertType}: ${action.expectedValue || ''}`;
    case 'focus':
      return `Focus ${elementAction.tagName}`;
    case 'blur':
      return `Blur ${elementAction.tagName}`;
    case 'openTab':
      return `Open tab: ${action.value}`;
    case 'closeTab':
      return `Close tab ${action.value}`;
    case 'switchTab':
      return `Switch to tab ${action.value}`;
    default:
      return `Action on ${elementAction.tagName}`;
  }
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => {
    currentPlayback = setTimeout(resolve, ms);
  });
}

// Trace logging function
function logTrace(action, target, details) {
  const traceEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    target: target,
    details: details,
    url: window.location.href
  };
  traceLog.push(traceEntry);
}

// Drag and drop simulation
async function performDragDrop(sourceElement, targetSelector) {
  const targetElement = document.querySelector(targetSelector);
  if (!targetElement) {
    throw new Error(`Drag target not found: ${targetSelector}`);
  }

  // Create drag events
  const dataTransfer = new DataTransfer();

  // Drag start
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  sourceElement.dispatchEvent(dragStartEvent);
  await sleep(100);

  // Drag over
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  targetElement.dispatchEvent(dragOverEvent);
  await sleep(100);

  // Drop
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  targetElement.dispatchEvent(dropEvent);
  await sleep(100);

  // Drag end
  const dragEndEvent = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  sourceElement.dispatchEvent(dragEndEvent);
}

// Screenshot capture (sends message to background)
async function captureScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'captureScreenshot' }, (response) => {
      resolve(response?.dataUrl || null);
    });
  });
}

// Wait for element to appear
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await sleep(100);
  }
  throw new Error(`Element not found within ${timeout}ms: ${selector}`);
}

// Wait for element to be visible
async function waitForVisible(element, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    if (rect.width > 0 && rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0') {
      return true;
    }
    await sleep(100);
  }
  throw new Error(`Element not visible within ${timeout}ms`);
}

// Wait for element to contain specific text
async function waitForText(element, text, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (element.textContent.includes(text)) {
      return true;
    }
    await sleep(100);
  }
  throw new Error(`Text "${text}" not found within ${timeout}ms`);
}

// Perform assertion
function performAssertion(element, action) {
  const assertType = action.assertType;
  const expectedValue = action.expectedValue;

  switch (assertType) {
    case 'exists':
      return { success: !!element, message: 'Element exists' };

    case 'visible':
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      return { success: isVisible, message: `Element is ${isVisible ? 'visible' : 'not visible'}` };

    case 'text':
      const hasText = element.textContent.includes(expectedValue);
      return {
        success: hasText,
        message: `Element text ${hasText ? 'contains' : 'does not contain'} "${expectedValue}"`
      };

    case 'value':
      const hasValue = element.value === expectedValue;
      return {
        success: hasValue,
        message: `Element value is ${hasValue ? 'equal to' : 'not equal to'} "${expectedValue}"`
      };

    case 'attribute':
      const attrValue = element.getAttribute(action.attributeName);
      const hasAttr = attrValue === expectedValue;
      return {
        success: hasAttr,
        message: `Attribute "${action.attributeName}" is ${hasAttr ? 'equal to' : 'not equal to'} "${expectedValue}"`
      };

    case 'class':
      const hasClass = element.classList.contains(expectedValue);
      return {
        success: hasClass,
        message: `Element ${hasClass ? 'has' : 'does not have'} class "${expectedValue}"`
      };

    default:
      return { success: false, message: `Unknown assertion type: ${assertType}` };
  }
}

// Enhanced element finding with advanced selectors
function findElementAdvanced(elementAction) {
  let element = null;

  // Try by ARIA role
  if (elementAction.ariaRole) {
    element = document.querySelector(`[role="${elementAction.ariaRole}"]`);
    if (element) return element;
  }

  // Try by data attributes
  if (elementAction.dataAttributes) {
    for (const [key, value] of Object.entries(elementAction.dataAttributes)) {
      element = document.querySelector(`[data-${key}="${value}"]`);
      if (element) return element;
    }
  }

  // Try by text content (enhanced)
  if (elementAction.textContent) {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent.trim() === elementAction.textContent.trim()) {
        return el;
      }
    }
  }

  // Try by aria-label
  if (elementAction.ariaLabel) {
    element = document.querySelector(`[aria-label="${elementAction.ariaLabel}"]`);
    if (element) return element;
  }

  // Fallback to standard finding
  return null;
}

// Get accessibility information for element
function getAccessibilityInfo(element) {
  return {
    role: element.getAttribute('role') || element.tagName.toLowerCase(),
    ariaLabel: element.getAttribute('aria-label'),
    ariaDescribedBy: element.getAttribute('aria-describedby'),
    ariaLabelledBy: element.getAttribute('aria-labelledby'),
    tabIndex: element.tabIndex,
    disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
    required: element.required || element.getAttribute('aria-required') === 'true',
    checked: element.checked || element.getAttribute('aria-checked') === 'true',
    expanded: element.getAttribute('aria-expanded'),
    selected: element.getAttribute('aria-selected')
  };
}

// Export trace log
function exportTraceLog() {
  return {
    startTime: traceLog[0]?.timestamp,
    endTime: traceLog[traceLog.length - 1]?.timestamp,
    totalActions: traceLog.length,
    actions: traceLog,
    screenshots: screenshots
  };
}

// Listen for trace export request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportTrace') {
    sendResponse(exportTraceLog());
  } else if (message.action === 'getStorageState') {
    const storageState = {
      cookies: document.cookie,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
    sendResponse(storageState);
  } else if (message.action === 'setStorageState') {
    // Restore localStorage
    if (message.data.localStorage) {
      for (const [key, value] of Object.entries(message.data.localStorage)) {
        localStorage.setItem(key, value);
      }
    }
    // Restore sessionStorage
    if (message.data.sessionStorage) {
      for (const [key, value] of Object.entries(message.data.sessionStorage)) {
        sessionStorage.setItem(key, value);
      }
    }
    sendResponse({ success: true });
  }
  return true;
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  removeHighlight();
  isPlaying = false;
});
