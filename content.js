// Content script for action playback
let isPlaying = false;
let currentPlayback = null;

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
        console.log('Clicked element:', elementAction.selector);
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
          console.log('Typed into element:', elementAction.selector, actionValue);
        } else if (element.getAttribute('contenteditable') === 'true') {
          element.textContent = actionValue;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('Set contenteditable element:', elementAction.selector, actionValue);
        }
        break;

      case 'select':
        if (element.tagName === 'SELECT') {
          element.value = actionValue;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Selected option:', elementAction.selector, actionValue);
        }
        break;

      case 'navigate':
        if (element.tagName === 'A' && element.href) {
          element.click();
          console.log('Navigated to:', element.href);
        }
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

// Find element using multiple strategies
function findElement(elementAction) {
  let element = null;

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
    case 'input':
      return `Type "${action.value}" into ${elementAction.tagName}`;
    case 'select':
      return `Select "${action.value}" in dropdown`;
    case 'navigate':
      return `Navigate to ${elementAction.href}`;
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

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  removeHighlight();
  isPlaying = false;
});
