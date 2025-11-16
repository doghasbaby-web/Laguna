let inspectedElements = [];
let actionsData = null;

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

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Inspect page elements
inspectBtn.addEventListener('click', async () => {
  try {
    showStatus('Inspecting page elements...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: inspectPageElements
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
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
});

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

// Upload actions file
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    actionsData = JSON.parse(text);

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
  }
});

// Play actions
playBtn.addEventListener('click', async () => {
  if (!actionsData) {
    showStatus('Please upload an actions file first.', 'error');
    return;
  }

  try {
    const delay = parseInt(delayInput.value) || 1000;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    playBtn.disabled = true;
    stopBtn.disabled = false;
    showStatus('Playing actions...', 'info');

    // Send actions to content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'playActions',
      data: actionsData,
      delay: delay
    });

  } catch (error) {
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
