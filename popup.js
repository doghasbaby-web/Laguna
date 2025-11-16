let inspectedElements = [];
let actionsData = null;

// Whitelist of allowed action types
const ALLOWED_ACTION_TYPES = [
  'click', 'rightClick', 'doubleClick', 'hover', 'input', 'keyPress', 'select',
  'navigate', 'clickAt', 'dragDrop', 'uploadFile', 'scroll', 'screenshot',
  'waitForElement', 'waitForVisible', 'waitForText', 'assert', 'focus', 'blur',
  'openTab', 'closeTab', 'switchTab'
];

// Validate actions JSON schema
function validateActionsSchema(data) {
  try {
    // Check required top-level structure
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid JSON structure' };
    }

    if (!data.elements || !Array.isArray(data.elements)) {
      return { valid: false, error: 'Missing or invalid "elements" array' };
    }

    // Validate each element
    for (let i = 0; i < data.elements.length; i++) {
      const element = data.elements[i];

      if (!element || typeof element !== 'object') {
        return { valid: false, error: `Element ${i} is not an object` };
      }

      if (!element.action || typeof element.action !== 'object') {
        return { valid: false, error: `Element ${i} missing action object` };
      }

      // Validate action type against whitelist
      if (element.enabled && element.action.type) {
        if (!ALLOWED_ACTION_TYPES.includes(element.action.type)) {
          return { valid: false, error: `Element ${i} has invalid action type: ${element.action.type}` };
        }
      }

      // Validate required fields based on action type
      if (element.enabled) {
        const actionType = element.action.type;

        if (!actionType) {
          return { valid: false, error: `Element ${i} missing action type` };
        }

        // Validate action-specific requirements
        if (['input', 'select', 'keyPress'].includes(actionType) && element.action.value === undefined) {
          return { valid: false, error: `Element ${i} with action "${actionType}" requires a value` };
        }

        if (actionType === 'clickAt' && !element.action.coordinates) {
          return { valid: false, error: `Element ${i} with action "clickAt" requires coordinates` };
        }

        if (actionType === 'assert' && (!element.action.assertType || element.action.expectedValue === undefined)) {
          return { valid: false, error: `Element ${i} with action "assert" requires assertType and expectedValue` };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Sanitize actions data to prevent malicious payloads
function sanitizeActionsData(data) {
  const sanitized = {
    metadata: data.metadata ? {
      createdAt: String(data.metadata.createdAt || ''),
      url: data.metadata.url ? String(data.metadata.url).substring(0, 2000) : null,
      totalElements: Number(data.metadata.totalElements) || 0,
      description: data.metadata.description ? String(data.metadata.description).substring(0, 1000) : null
    } : {},
    elements: []
  };

  for (const element of data.elements) {
    const sanitizedElement = {
      index: Number(element.index) || 0,
      tagName: element.tagName ? String(element.tagName).toLowerCase().substring(0, 50) : null,
      type: element.type ? String(element.type).substring(0, 50) : null,
      id: element.id ? String(element.id).substring(0, 200) : null,
      name: element.name ? String(element.name).substring(0, 200) : null,
      className: element.className ? String(element.className).substring(0, 500) : null,
      // Escape HTML in text content to prevent XSS
      text: element.text ? escapeHtml(String(element.text).substring(0, 1000)) : null,
      placeholder: element.placeholder ? escapeHtml(String(element.placeholder).substring(0, 200)) : null,
      href: element.href ? sanitizeUrl(String(element.href)) : null,
      value: element.value ? String(element.value).substring(0, 1000) : null,
      xpath: element.xpath ? String(element.xpath).substring(0, 500) : null,
      selector: element.selector ? String(element.selector).substring(0, 500) : null,
      enabled: Boolean(element.enabled),
      action: {
        type: element.action?.type ? String(element.action.type).substring(0, 50) : null,
        value: element.action?.value !== undefined ? String(element.action.value).substring(0, 10000) : null,
        waitAfter: Number(element.action?.waitAfter) || 1000,
        description: element.action?.description ? escapeHtml(String(element.action.description).substring(0, 500)) : null,
        coordinates: element.action?.coordinates,
        assertType: element.action?.assertType,
        expectedValue: element.action?.expectedValue,
        attributeName: element.action?.attributeName,
        modifiers: element.action?.modifiers,
        active: element.action?.active
      },
      accessibility: element.accessibility ? {
        role: element.accessibility.role ? String(element.accessibility.role).substring(0, 50) : null,
        ariaLabel: element.accessibility.ariaLabel ? escapeHtml(String(element.accessibility.ariaLabel).substring(0, 200)) : null,
        ariaDescribedBy: element.accessibility.ariaDescribedBy ? String(element.accessibility.ariaDescribedBy).substring(0, 200) : null,
        ariaLabelledBy: element.accessibility.ariaLabelledBy ? String(element.accessibility.ariaLabelledBy).substring(0, 200) : null,
        tabIndex: Number(element.accessibility.tabIndex) || 0,
        disabled: Boolean(element.accessibility.disabled),
        required: Boolean(element.accessibility.required)
      } : undefined,
      iframe: element.iframe ? String(element.iframe).substring(0, 500) : null,
      ariaRole: element.ariaRole ? String(element.ariaRole).substring(0, 50) : null,
      ariaLabel: element.ariaLabel ? escapeHtml(String(element.ariaLabel).substring(0, 200)) : null,
      dataAttributes: element.dataAttributes,
      textContent: element.textContent ? escapeHtml(String(element.textContent).substring(0, 1000)) : null
    };

    sanitized.elements.push(sanitizedElement);
  }

  return sanitized;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sanitize URLs to prevent javascript: and data: URIs
function sanitizeUrl(url) {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return 'about:blank';
  }
  return url.substring(0, 2000);
}

// Get DOM elements
const inspectBtn = document.getElementById('inspectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const delayInput = document.getElementById('delayInput');
const statusDiv = document.getElementById('status');
const elementCountDiv = document.getElementById('elementCount');

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility function (prevents rapid successive calls)
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Debounced delay input validation
const validateDelay = debounce((value) => {
  const delay = parseInt(value);
  if (isNaN(delay) || delay < 0 || delay > 60000) {
    showStatus('Delay must be between 0 and 60000 milliseconds', 'error');
    delayInput.value = '1000'; // Reset to default
  }
}, 500);

// Add delay input listener
delayInput.addEventListener('input', (e) => {
  validateDelay(e.target.value);
});

// Throttled inspect function to prevent rapid clicks
const performInspect = throttle(async () => {
  try {
    showStatus('Inspecting page elements...', 'info');

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(err => {
      throw new Error(`Failed to query tabs: ${err.message}`);
    });

    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found. Please make sure you have a tab open.');
    }

    const [tab] = tabs;

    if (!tab.id) {
      throw new Error('Invalid tab ID. Please try again.');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: inspectPageElements
    }).catch(err => {
      if (err.message.includes('Cannot access')) {
        throw new Error('Cannot access this page. Extension may be restricted on chrome:// or extension:// pages.');
      }
      throw new Error(`Failed to inspect page: ${err.message}`);
    });

    if (results && results[0] && results[0].result) {
      inspectedElements = results[0].result;

      if (inspectedElements.length > 0) {
        showStatus(`Found ${inspectedElements.length} interactive elements!`, 'success');
        elementCountDiv.textContent = `Elements found: ${inspectedElements.length}`;
        downloadBtn.disabled = false;
      } else {
        showStatus('No interactive elements found on this page.', 'error');
        downloadBtn.disabled = true;
      }
    } else {
      throw new Error('Failed to get inspection results. Please try again.');
    }
  } catch (error) {
    console.error('Inspection error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    downloadBtn.disabled = true;
  }
}, 1000); // Throttle to max once per second

// Inspect page elements
inspectBtn.addEventListener('click', performInspect);

// Function to inspect page (injected into page)
function inspectPageElements() {
  const elements = [];
  const selectors = [
    'input:not([type="hidden"])',
    'button',
    'a[href]',
    'select',
    'textarea',
    '[onclick]',
    '[role="button"]',
    '[contenteditable="true"]'
  ];

  const allElements = document.querySelectorAll(selectors.join(', '));

  allElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();

    // Skip hidden elements
    if (rect.width === 0 || rect.height === 0 ||
        window.getComputedStyle(el).display === 'none' ||
        window.getComputedStyle(el).visibility === 'hidden') {
      return;
    }

    const element = {
      index: index + 1,
      tagName: el.tagName.toLowerCase(),
      type: el.type || null,
      id: el.id || null,
      name: el.name || null,
      className: el.className || null,
      text: el.textContent?.trim().substring(0, 100) || null,
      placeholder: el.placeholder || null,
      href: el.href || null,
      value: el.value || null,
      xpath: getXPath(el),
      selector: generateSelector(el),
      accessibility: {
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        ariaLabel: el.getAttribute('aria-label') || null,
        ariaDescribedBy: el.getAttribute('aria-describedby') || null,
        ariaLabelledBy: el.getAttribute('aria-labelledby') || null,
        tabIndex: el.tabIndex,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        required: el.required || el.getAttribute('aria-required') === 'true'
      }
    };

    elements.push(element);
  });

  return elements;

  function getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    if (element === document.body) {
      return '/html/body';
    }

    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];

    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        const parentPath = element.parentNode ? getXPath(element.parentNode) : '';
        return `${parentPath}/${element.tagName.toLowerCase()}[${ix + 1}]`;
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  }

  function generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    let path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        const classes = current.className.trim().split(/\s+/).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      if (path.length > 3) break;
    }

    return path.join(' > ');
  }
}

// Download inspected elements as JSON
downloadBtn.addEventListener('click', () => {
  const actionsTemplate = {
    metadata: {
      createdAt: new Date().toISOString(),
      url: null,
      totalElements: inspectedElements.length,
      description: "Edit this file to add actions. Set 'enabled: true' and fill in action details for elements you want to interact with."
    },
    elements: inspectedElements.map(el => ({
      ...el,
      enabled: false,
      action: {
        type: null, // "click", "input", "select", or "navigate"
        value: null, // For input/select actions
        waitAfter: 1000, // Milliseconds to wait after this action
        description: null // Optional description of what this action does
      }
    }))
  };

  const blob = new Blob([JSON.stringify(actionsTemplate, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'actions.json';
  a.click();
  URL.revokeObjectURL(url);

  showStatus('Actions file downloaded! Edit it and upload to play.', 'success');
});

// Upload actions file with debounce protection
let isUploading = false;

uploadBtn.addEventListener('click', () => {
  if (isUploading) {
    showStatus('Please wait for current upload to complete', 'error');
    return;
  }
  fileInput.click();
});

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) {
    isUploading = false;
    return;
  }

  if (isUploading) {
    showStatus('Upload already in progress', 'error');
    return;
  }

  isUploading = true;

  try {
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    showStatus('Processing file...', 'info');

    const text = await file.text();
    const parsedData = JSON.parse(text);

    // Validate JSON schema
    const validation = validateActionsSchema(parsedData);
    if (!validation.valid) {
      throw new Error(`Invalid actions file: ${validation.error}`);
    }

    // Sanitize all user-provided values
    actionsData = sanitizeActionsData(parsedData);

    const enabledActions = actionsData.elements.filter(el => el.enabled);

    if (enabledActions.length > 0) {
      showStatus(`Loaded ${enabledActions.length} actions ready to play!`, 'success');
      playBtn.disabled = false;
    } else {
      showStatus('No enabled actions found in file.', 'error');
      playBtn.disabled = true;
    }
  } catch (error) {
    showStatus(`Error reading file: ${error.message}`, 'error');
    playBtn.disabled = true;
    actionsData = null;
  } finally {
    // Clear file input to allow re-uploading the same file
    fileInput.value = '';
    isUploading = false;
  }
};

fileInput.addEventListener('change', handleFileUpload);

// Play actions
playBtn.addEventListener('click', async () => {
  if (!actionsData) {
    showStatus('Please upload an actions file first.', 'error');
    return;
  }

  try {
    const delay = parseInt(delayInput.value) || 1000;

    if (delay < 0 || delay > 60000) {
      throw new Error('Delay must be between 0 and 60000 milliseconds.');
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(err => {
      throw new Error(`Failed to query tabs: ${err.message}`);
    });

    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found. Please make sure you have a tab open.');
    }

    const [tab] = tabs;

    if (!tab.id) {
      throw new Error('Invalid tab ID. Please try again.');
    }

    playBtn.disabled = true;
    stopBtn.disabled = false;
    showStatus('Playing actions...', 'info');

    // Send actions to content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'playActions',
      data: actionsData,
      delay: delay
    }).catch(err => {
      if (err.message.includes('Receiving end does not exist')) {
        throw new Error('Content script not loaded. Please refresh the page and try again.');
      }
      throw new Error(`Failed to send actions: ${err.message}`);
    });

  } catch (error) {
    console.error('Playback error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    playBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

// Stop playback
stopBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'stopActions' });

    showStatus('Playback stopped.', 'info');
    playBtn.disabled = false;
    stopBtn.disabled = true;
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'playbackStatus') {
    showStatus(message.message, message.status);

    if (message.status === 'success' || message.status === 'error') {
      playBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }
});

// Export trace log
const exportTraceBtn = document.getElementById('exportTraceBtn');
exportTraceBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'exportTrace' });

    if (response && response.totalActions > 0) {
      // Save trace log using background script
      chrome.runtime.sendMessage({
        type: 'saveTraceLog',
        data: response
      }, (result) => {
        if (result.success) {
          showStatus(`Exported trace with ${response.totalActions} actions!`, 'success');
        }
      });
    } else {
      showStatus('No trace log available. Run actions first.', 'error');
    }
  } catch (error) {
    showStatus(`Error exporting trace: ${error.message}`, 'error');
  }
});

// Save storage state
const saveStorageBtn = document.getElementById('saveStorageBtn');
saveStorageBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const storageState = await chrome.tabs.sendMessage(tab.id, { action: 'getStorageState' });

    chrome.runtime.sendMessage({
      type: 'saveStorageState',
      data: storageState
    }, (result) => {
      if (result.success) {
        showStatus('Storage state saved successfully!', 'success');
      }
    });
  } catch (error) {
    showStatus(`Error saving storage: ${error.message}`, 'error');
  }
});

// Load storage state
const loadStorageBtn = document.getElementById('loadStorageBtn');
loadStorageBtn.addEventListener('click', async () => {
  try {
    chrome.runtime.sendMessage({ type: 'loadStorageState' }, async (result) => {
      if (result.data) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        await chrome.tabs.sendMessage(tab.id, {
          action: 'setStorageState',
          data: result.data
        });

        showStatus('Storage state loaded successfully!', 'success');
      } else {
        showStatus('No saved storage state found.', 'error');
      }
    });
  } catch (error) {
    showStatus(`Error loading storage: ${error.message}`, 'error');
  }
});

// Enable trace export button after playback
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'playbackStatus') {
    if (message.status === 'success') {
      exportTraceBtn.disabled = false;
    }
  }
});

// Initialize
showStatus('Ready to inspect page elements.', 'info');
